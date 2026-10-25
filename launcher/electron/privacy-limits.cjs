"use strict";
// This variant deliberately does not store account hashes, models or submission timestamps.
const DISABLED = "Local usage tracking is disabled by the privacy build.";
class LimitsController {
  snapshot() {
    return {
      enabled: false, plan: null, trackingSince: null, checkedAt: null,
      totalMessages: 0, unknownProMessages: 0, incomplete: false,
      windows: [], disabledReason: "privacy", error: DISABLED,
    };
  }
  enabled() { return false; }
  async setup(_detectPlan) { throw new Error(DISABLED); }
  record(_receipt) { return false; }
}
module.exports = { LimitsController };
