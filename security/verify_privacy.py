#!/usr/bin/env python3
"""Offline static privacy guard for the 6.1.13 privacy fork. Does NOT prove runtime security."""
import argparse
import json
import re
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    root = args.root.resolve()
    failures = []
    checks = []

    def contents(path):
        try:
            return (root / path).read_text('utf-8')
        except Exception as exc:
            failures.append(f'cannot read {path}: {exc}')
            return ''

    def check(name, condition):
        checks.append((name, bool(condition)))
        if not condition:
            failures.append(name)

    main_src = contents('launcher/electron/main.cjs')
    browser = contents('launcher/electron/browser-host.cjs')
    profile = contents('launcher/electron/profile.cjs')
    runtime = contents('launcher/electron/runtime.cjs')
    logs = contents('launcher/electron/logging.cjs')
    worker = contents('src/adapters/chatgpt-web/browser-worker.ts')
    cli = contents('src/cli.ts')
    setup = contents('src/setup.ts')
    pkg = json.loads(contents('launcher/package.json') or '{}')
    release = contents('.github/workflows/release.yml')
    installed_files = pkg.get('build', {}).get('files', [])
    check('source package identity preserved', pkg.get('version') == '6.1.13')
    check('private packaged application ID', pkg.get('build', {}).get('appId') == 'dev.codexwebgpt.privacy')
    check('no update controller in launcher entrypoint', 'createUpdateController' not in main_src and 'updateController.' not in main_src and 'checkOnce()' not in main_src)
    check('upstream updater and usage modules excluded from package', all('!electron/'+fn in installed_files for fn in ('update.cjs','update-worker.cjs','limits-store.cjs','limits-controller.cjs')))
    check('pure version comparator replaces updater dependency', 'require("./version-compare.cjs")' in runtime and 'require("./update.cjs")' not in runtime)
    check('private browser partitions across launcher and BrowserHost', all(v in profile and v in browser for v in ('persist:codex-web-gpt-private-chatgpt','persist:codex-web-gpt-private-dev-chatgpt')))
    check('refuses upstream profile or cookies', 'cannot reuse upstream profile' in profile and 'cannot reuse upstream DEV profile' in profile)
    check('refuses migrating or uninstalling external runtime', 'refuses to migrate or stop a runtime' in runtime and 'refuses to uninstall an externally managed' in runtime)
    check('private core home', '.codex-chatgpt-web-private' in profile and '.codex-chatgpt-web-private' in contents('src/config.ts'))
    check('local usage and account tracking disabled', 'require("./privacy-limits.cjs")' in main_src and 'enabled() { return false; }' in contents('launcher/electron/privacy-limits.cjs'))
    check('logs persist no dynamic details', logs.count('detail: {},') >= 3 and 'event.redacted' in logs)
    diag = worker.split('class ChatGptBrowserDiagnostics {', 1)
    diag = diag[1].split('\nexport function resolveBrowserConfig', 1)[0] if len(diag) == 2 else ''
    check('browser diagnostics no-op', 'async capture(' in diag and 'finish(' in diag and not any(term in diag for term in ('writeFile', 'screenshot', '.evaluate(', 'atomicWriteFile')))
    check('no forced maintainer social visits', 'Open the GitHub and X pages before continuing' not in main_src and 'github.com/miuuyy' not in main_src and 'x.com/miu' not in main_src and 'WelcomeAction' not in contents('launcher/src/App.tsx'))
    check('only official external URLs from launcher', 'ALLOWED_EXTERNAL_URLS.has(parsed.toString())' in main_src)
    check('unknown web popups blocked', 'shell.openExternal' not in browser)
    check('explicit approval required in runtime and CLI', 'Privacy build requires manual tool approval' in runtime and 'Privacy build prohibits automatic approval' in cli and 'config.autoApproveToolCalls = false;' in setup and 'autoApproveToolCalls: false,' in worker)
    check('release pipeline disabled', 'Privacy fork - release disabled' in release and 'workflow_dispatch:' in release and 'action-gh-release' not in release)
    scripts = [contents(x) for x in ('scripts/install.sh','scripts/install-launcher.sh','scripts/install-launcher.ps1')]
    check('three remote installers fail closed', all('Disabled:' in x and ('exit 1' in x or 'throw ' in x) for x in scripts))
    check('original release links absent from READMEs', all('github.com/miuuyy/codex-chatgpt-web/releases/download' not in contents(x) for x in ('README.md','README.zh-CN.md','README.ja.md','README.ko.md')))
    check('audit report present', bool(contents('PRIVACY-REVIEW.md')))

    # Verify that every relative require from bundled launcher modules resolves to
    # a nonexcluded file. Does not run JavaScript or load any dependency.
    excluded = {name[1:] for name in installed_files if name.startswith('!')}
    missing = []
    for f in sorted((root/'launcher/electron').glob('*.cjs')):
        if f'electron/{f.name}' in excluded:
            continue
        for mod in re.findall(r'require\(["\'](\./[^"\']+)["\']\)', f.read_text('utf-8')):
            dest = (f.parent / mod).resolve()
            if not dest.is_file() or dest.name in excluded or f'electron/{dest.name}' in excluded:
                missing.append(f'{f.relative_to(root)} -> {mod}')
    check('bundled launcher relative require graph intact', not missing)

    for name, ok in checks:
        print(('PASS' if ok else 'FAIL') + ': ' + name)
    if missing:
        print('Missing or excluded imports:', *missing, sep='\n - ')
    print(f'RESULT: {sum(ok for _,ok in checks)}/{len(checks)} static checks passed. Runtime not tested.')
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
