"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { LimitsController } = require("../electron/limits-controller.cjs");

test("Limits tracking is opt-in and writes nothing before setup", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "private-limits-"));
  const storePath = path.join(root, "limits.json");
  try {
    const controller = new LimitsController(storePath, { getInteractionMode: () => "automatic", now: () => Date.UTC(2026, 9, 25) });
    assert.equal(controller.snapshot().enabled, false);
    assert.equal(controller.record({ trackingError: "account-unavailable" }), false);
    assert.equal(fs.existsSync(storePath), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Limits cannot check a plan or record usage in Zero Risk mode", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "private-limits-manual-"));
  const storePath = path.join(root, "limits.json");
  try {
    const controller = new LimitsController(storePath, { getInteractionMode: () => "manual", now: () => Date.UTC(2026, 9, 25) });
    let detectionCalled = false;
    await assert.rejects(controller.setup(async () => { detectionCalled = true; return {}; }), /Zero Risk/);
    assert.equal(detectionCalled, false);
    assert.equal(controller.snapshot().enabled, false);
    assert.equal(controller.record({ trackingError: "account-unavailable" }), false);
    assert.equal(fs.existsSync(storePath), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
