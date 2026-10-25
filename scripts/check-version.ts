import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  version?: string;
  packageManager?: string;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
};
const packageVersion = packageJson.version;
if (!packageVersion) throw new Error("package.json has no version");
const packageManagerMatch = /^bun@(\d+\.\d+\.\d+)$/.exec(packageJson.packageManager ?? "");
if (!packageManagerMatch) throw new Error("package.json must pin an exact Bun packageManager version");
const bunVersion = packageManagerMatch[1];
if (Bun.version !== bunVersion) throw new Error(`Expected Bun ${bunVersion}, received ${Bun.version}`);
if (packageJson.devDependencies?.["@types/bun"] !== bunVersion) {
  throw new Error(`@types/bun is not synchronized to ${bunVersion}`);
}
if (packageJson.engines?.bun !== bunVersion) throw new Error(`engines.bun is not synchronized to ${bunVersion}`);
const expected = [
  ["src/version.ts", `export const VERSION = ${JSON.stringify(packageVersion)};`],
  ["src/adapters/chatgpt-web/mcp-server.ts", "version: VERSION"],
  ["scripts/install.sh", `VERSION=\"\${CODEX_CHATGPT_WEB_VERSION:-${packageVersion}}\"`],
  ["scripts/install.sh", `Bun-${bunVersion}.md`],
  ["scripts/generate-third-party-notices.ts", `Bun ${bunVersion}`],
  ["scripts/prepare-windows-baseline-bun.ps1", `bun-v$Version`],
  [".github/workflows/ci.yml", `bun-version: ${bunVersion}`],
  [".github/workflows/ci.yml", `-Version ${bunVersion}`],
] as const;
for (const [path, needle] of expected) {
  if (!readFileSync(resolve(root, path), "utf8").includes(needle)) throw new Error(`${path} is not synchronized to ${packageVersion}`);
}
for (const path of ["README.md", "README.zh-CN.md", "README.ja.md", "README.ko.md"]) {
  const readme = readFileSync(resolve(root, path), "utf8");
  if (!readme.includes("Privacy Fork") || readme.includes("github.com/miuuyy/codex-chatgpt-web/releases/download")) {
    throw new Error(`${path} must be a privacy-source README without upstream binary download links`);
  }
}
// This fork must not distribute unreviewed binaries through GitHub release automation.
const releaseWorkflow = readFileSync(resolve(root, ".github/workflows/release.yml"), "utf8");
if (!releaseWorkflow.includes("Privacy fork - release disabled")
  || /(?:github\.com\/.*releases|upload-release-asset|softprops\/action-gh-release)/.test(releaseWorkflow)) {
  throw new Error("Privacy fork release workflow must remain disabled");
}
for (const script of ["scripts/install.sh", "scripts/install-launcher.sh", "scripts/install-launcher.ps1"]) {
  const installer = readFileSync(resolve(root, script), "utf8");
  if (!installer.includes("Disabled:") || /(?:Invoke-WebRequest|\bcurl\b|\bStart-Process\b)/.test(installer)) {
    throw new Error(`Upstream download installer is not disabled: ${script}`);
  }
}
const launcherVersion = (JSON.parse(readFileSync(resolve(root, "launcher/package.json"), "utf8")) as { version?: string }).version;
if (launcherVersion !== packageVersion) throw new Error(`launcher/package.json is not synchronized to ${packageVersion}`);
process.stdout.write(`VERSION_SYNC_OK ${packageVersion} bun@${bunVersion}\n`);
