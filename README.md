# Codex ChatGPT Web — Privacy Fork (6.1.13-privacy.1)

**Isolated source-code fork. Not a ready-to-run executable or a security guarantee.**

This copy is derived from `miuuyy/codex-chatgpt-web`, based on version 6.1.13.
Its goal is to reduce third-party exposure of the account and conversations through
updates and local records. Changes and limitations are documented in
[PRIVACY-REVIEW.md](PRIVACY-REVIEW.md).

## Protections in this variant

- Does not fetch or install updates published by the original maintainer.
- Remote installation scripts are disabled; review and build locally.
- Profile, cookies, and private directories are separate from the original program.
- Codex model updates are still mediated by the local bridge, without modifying Codex.
- Does not store local per-account usage metrics; logs retain event names,
  but remove text values, and browser diagnostics do not save captures.
- Removes the requirement to visit the maintainer's GitHub/X during onboarding.
- Disables automatic approval clicks for MCP tools.

## Build — only after independent validation

Use a trusted, isolated environment; review `bun.lock`, dependencies, and build scripts.
The project requires **Bun 1.4.0** and the Electron toolchain. Do not run installers
or binaries from the original repository when installing this variant.

```sh
bun install --frozen-lockfile
bun run verify
bun run app:package
```

The steps above are **instructions**, not tests that were run for this delivery.
Packaging uses external dependencies; this variant does not include a prebuilt binary.

### Using with Codex and PandaCode

The launcher uses the `CODEX_HOME` selected by Codex. After building,
open the program, authenticate only through the ChatGPT UI, and install the models;
then fully restart Codex processes. PandaCode queries Codex's `model/list` and
may display `(Web)` models, but this has not been tested with a real account.
Full harness requires an MCP connector/tunnel in ChatGPT and appropriate permissions;
**do not enable broad file or tool access without assessing the consequences**.

### Known limitations

- The ChatGPT session is still persisted locally in Electron; another program
  running as the same operating-system user may compromise the session.
- The local HTTP bridge is not a boundary against other local processes running as the same user.
- ChatGPT, SSO providers, and the MCP tunnel (if enabled) are legitimate external services.
- ChatGPT may change the browser UI; the project uses unofficial selectors.
- This fork does not remove the exposure inherent in MCP actions authorized by ChatGPT.
- Later versions of this fork require a new review. There are no automatic updates.
- Web UI automation may violate OpenAI or workspace rules.

**Before authenticating a Business account, submit the implementation and environment
for your organization's security validation.**
