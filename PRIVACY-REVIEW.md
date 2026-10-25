# Codex ChatGPT Web — Privacy Review (6.1.13-privacy.1)

**Scope:** User-provided `codex-chatgpt-web-main.zip`; static inspection of files and network, browser, authentication, update, telemetry, MCP, and packaging flows. The resulting copy was modified in a separate directory; the original was kept intact. **This is NOT a complete security assessment, penetration test, or certification that spyware is absent.**

**Conclusion:** No implemented routine for transferring conversations, credentials, or cookies to the maintainer's infrastructure was identified in the inspected flows. Communication paths to `chatgpt.com`/OpenAI and loopback are expected by the product. However, absence of exfiltration was not demonstrated at runtime; the code contains external dependencies that were not individually audited and remains subject to the session, OS, Codex, and MCP tunnel. **It is not prudent to authenticate a confidential Business account before validating the build and network in an isolated environment.**

## Findings and evidence (original repository)

| Area | Static evidence | Correct interpretation |
| --- | --- | --- |
| Executable updates | `launcher/electron/main.cjs` imports and initializes `createUpdateController`, with `checkOnce()` at startup. `launcher/electron/update.cjs` accesses `https://api.github.com/repos/miuuyy/codex-chatgpt-web/releases/latest`, downloads artifacts, and uses `update-worker.cjs` to replace the application | **Supply-chain risk:** a future update could introduce code with access to the profile. This does not prove exfiltration in the version reviewed |
| Unnecessary maintainer contact | `launcher/electron/main.cjs` required `githubOpened` and `xOpened` before completing onboarding; `launcher/src/App.tsx` presented the actions | Exposure of a site/social-media visit; no chat transmission was demonstrated |
| Local logs | `launcher/electron/logging.cjs` records event and error details. Original sanitization protects several tokens but does not guarantee anonymization of every free-form string | **Possible local exposure** through logs or sharing diagnostics; no automatic export to the maintainer was demonstrated |
| Browser diagnostics | `src/adapters/chatgpt-web/browser-worker.ts` (`ChatGptBrowserDiagnostics`) persists checkpoints and optional screenshots/structure captures | Local metadata/snapshots may reveal sensitive information, especially if exported or accessed by malware |
| Usage metrics | `launcher/electron/limits-controller.cjs` and `limits-store.cjs` persist hashes of account identifiers, models, and timestamps if the user enables Limits | **Optional local storage**, not evidence of collection by the maintainer |
| Authenticated session | Persistent Electron profile in `launcher/electron/profile.cjs` and `browser-host.cjs` | Anyone controlling the operating-system user can access the application profile; local storage does not make a secret invulnerable |
| Local HTTP and tools | `src/server.ts` exposes Responses over loopback; `docs/security-model.md` states that the local endpoint has no independent bearer authentication. Full mode uses MCP with Codex tools | **Residual risk from local process access** and tool execution, even after hardening; no exploit was demonstrated |
| Tunnel and keys | `src/tunnel.ts`, `launcher/electron/tunnel-proxy.cjs`: outbound OpenAI tunnel for Full mode | A legitimate external service remains necessary; the key and MCP permissions must still be protected |
| Network traffic to maintainer | In the static review of launcher/bridge network calls, the maintainer release check is concentrated in the updater subsystem; static documentation links also exist | There is no proof that all future traffic, third-party binaries, or actual behavior will remain limited to these destinations |

**Evidence status:** The paths above are statically inspected facts; exploitation, conversation transmission to the maintainer, runtime robustness of all controls, and definitive absence of backdoors **were neither demonstrated nor disproved**. No malicious intent was attributed to the author.

## Changes in the private copy

1. **Updater:** Removed the startup controller and disabled installation IPC; excluded `update.cjs` and `update-worker.cjs` from the package; extracted `compareVersions` to the network-free `version-compare.cjs` module.
2. **Installation:** `scripts/install.sh`, `scripts/install-launcher.sh`, and `scripts/install-launcher.ps1` fail explicitly; publishing original releases is disabled. README points only to local review and build. No upstream binary is implicitly included.
3. **Identity and cookies:** Separated `appId`, product, local profile, and Electron partitions (`.codex-chatgpt-web-private`, `Codex Web GPT Private`). Explicit overrides that attempt to reuse upstream default paths are rejected; DEV profiles are also separate. `CODEX_HOME` remains shareable for intentional Codex and PandaCode integration.
4. **Coexistence:** The private copy refuses to migrate, interrupt, or uninstall a runtime marked as externally managed; its owner must shut down and remove that runtime before connecting the new one.
5. **Logging:** Persisted records contain only date, level, static event name, and `detail: {}`; export/re-read does not include details. Raw process stack traces are not written by the diagnostic guard. **Other components or the OS may still emit their own logs.**
6. **Browser diagnostics:** `ChatGptBrowserDiagnostics` was converted to a no-op; this class does not write checkpoints or screenshots. This reduces debugging capability.
7. **Usage tracking:** Replaced the controller with a disabled implementation. `trackUsage:false` is sent by the launcher controller; the session identity collection function should not be called by this flow.
8. **External destinations:** Removed the maintainer's GitHub/X links from onboarding and sidebar, disabled social handlers; the launcher opens only exact pre-approved ChatGPT/platform/Help Center URLs. Arbitrary page popups cannot open links in the system browser; SSO providers still need validation.
9. **Approvals:** The one-time `--auto-approve-tool-calls` mode is available only by explicit opt-in in Automatic mode (GUI or CLI) and remains disabled by default. The launcher refuses it in Zero Risk; setup clears it in Zero Risk; the model configuration and browser worker independently keep it disabled there. Browser automation accepts only the selected connector's one-time **Allow** / **Allow once** action, never **Always allow**. **Opt-in reduces manual oversight and can authorize unintended tool requests, including those influenced by untrusted conversation content. Codex permissions and ChatGPT workspace policy still apply; neither eliminates that risk.**
10. **Automatic startup:** `autoStart` is disabled by default, without preventing an explicit user choice.

**Intentionally retained:** Use of the authenticated ChatGPT UI, `(Web)` model catalog, streaming, Effort selection, Codex CLI/app-server, source builds, opt-in MCP integrations, and other upstream capabilities not explicitly removed.

## Residual risks and nonconformities

- **No operating-system guarantee:** Another process running as the same user may still read profile/cookie files and connect to local Responses, depending on the environment and permissions. Defending against this requires OS isolation, separate accounts, access controls, a firewall, and/or effective authentication in the bridge contract.
- **No complete dependency/build audit:** Packages in `bun.lock` and `launcher/bun.lock`, Bun/Electron runtimes, and tunnel binaries need review and hash verification on a controlled machine. Do not run upstream `curl | sh` or `irm | iex` commands.
- **ChatGPT Business account:** According to the upstream architecture, messages are sent to ChatGPT, not to a paid inference API through this browser path; this does not guarantee absence of limits, auxiliary service costs, or contractual authorization requirements. Developer Mode and organizational policies may prohibit MCP or automation.
- **Full harness:** Requires an OpenAI tunnel, a tunnel-client key, and a connector that may allow broad actions. MCP adoption and file access require permission review. Disabling automatic clicks does not mean every call is manually approved by the user.
- **UI and SSO changes:** Unofficial DOM automation may break. The stricter `window.open` policy may prevent some enterprise login flows.
- **Solution not built or live-tested:** We did not run login, model, real message sending, file sandbox, network, PandaCode integration, smoke/E2E, fuzzing, Rust/Node build, or dependency tests. The ZIP contains only **candidate source code**.
- **No intent attributed:** The presence of an updater, logs, and counters is not by itself evidence of spying, but expands surfaces the user explicitly wants to reduce.

## Checks performed for this delivery

- Manual static inspection of input/output paths, profiles, updater, browser, logging, MCP, and persistence; comparison of original code with the private copy.
- Static scan for external endpoints/telemetry and relative `require()` calls in Electron modules; this does not cover all dependency behavior.
- `node --check launcher/electron/*.cjs`: **valid parse**; does not run the application.
- TypeScript compiler API (`createSourceFile`) for edited `.ts/.tsx` files: **valid parse**; does not type-check.
- `python security/verify_privacy.py`: static contract for disabling/isolation; does not prove absence of a backdoor or executable implementation.
- **Not run:** `bun install`, `bun run verify`, `bun run app:package`, tests with a server or account, multi-system CI. Required Bun 1.4.0 was not installed in the audit environment. Project code was not run because no approved isolated sandbox was available.

## Responsible validation procedure before use

1. Audit the diff and ZIP checksums against the original source and `bun.lock` / `launcher/bun.lock`.
2. Set up a temporary, unprivileged user environment with no real secrets and control over outbound traffic; validate dependencies and scripts before installation.
3. Build only the private copy with Bun 1.4.0; run all possible offline tests, check for failures caused by intentionally changed contracts, and ensure the packaged binary excludes `update.cjs` and `update-worker.cjs`.
4. Test login with an **authorized test account**, observe all DNS/HTTP/TLS traffic without attempting to break encryption or capture credentials, and confirm there is no communication with maintainer/telemetry domains.
5. Confirm that Codex and PandaCode usage lists `(Web)` models and Effort, and that tools, cancellation, SSO, and rollback work with restricted permissions.
6. Before using a Business account, request workspace administrator authorization, document limits/terms, and establish recovery steps: sign out, revoke access/tunnel, and remove the bridge from Codex configuration.

**Assessment:** `INCONCLUSIVE` for the requirement “safe for my account”; `STATIC_GATES_PASSED` for the privacy controls implemented after running the verifier. This document is not a production release approval.
