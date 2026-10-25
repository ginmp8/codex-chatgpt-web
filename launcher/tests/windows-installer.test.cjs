const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Windows installer remains disabled for the privacy fork", () => {
  const installer = fs.readFileSync(path.resolve(__dirname, "../../scripts/install-launcher.ps1"), "utf8");
  assert.match(installer, /Deprecated upstream installer intentionally deactivated for this privacy fork/);
  assert.match(installer, /throw "Disabled: upstream GitHub releases are not trusted by the privacy build/);
});
