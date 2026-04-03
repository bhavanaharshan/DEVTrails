// test-trigger.js
// Manual one-shot test runner — bypasses cron completely.
// Run with: node test-trigger.js
//
// HOW TO USE:
//   1. Open config.js and set TEST_MODE = true
//   2. Set your desired TEST_OVERRIDES values (precipitation, aqi, outage, etc.)
//   3. Run this file: node test-trigger.js
//   4. Watch the terminal — you'll see exactly which thresholds fire and whether
//      the webhook POST to Neema's API succeeds or fails.
//   5. When done testing, set TEST_MODE = false in config.js to go back to live.
//
// You can also run this in live mode (TEST_MODE = false) to do a real one-off
// check without waiting for the cron schedule.

import { evaluateZone } from "./evaluator.js";
import { TEST_MODE }     from "./config.js";

// ── Test Zone ─────────────────────────────────────────────────────────────────
// Change this to any zone you want to test against.
// In live mode this hits real APIs for these coordinates.
// In test mode the coordinates are ignored — overrides are used instead.
const TEST_ZONE = {
  name: "bangalore_south",
  lat:  12.9259,
  lon:  77.5830,
};

// ── Additional zones to test (uncomment to add more) ──────────────────────────
// const TEST_ZONE = { name: "bangalore_north", lat: 13.0358, lon: 77.5970 };
// const TEST_ZONE = { name: "mumbai_central",  lat: 18.9696, lon: 72.8196 };

// ── Run ───────────────────────────────────────────────────────────────────────
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  🧪 Manual Trigger Test");
console.log(`  Mode : ${TEST_MODE ? "TEST (mock overrides)" : "LIVE (real APIs)"}`);
console.log(`  Zone : ${TEST_ZONE.name} (${TEST_ZONE.lat}, ${TEST_ZONE.lon})`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

await evaluateZone(TEST_ZONE);

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  ✅ Test run complete.");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
