// test-trigger.js
// Manual one-shot test runner — bypasses cron completely.
// Run with: node test-trigger.js
//
// HOW TO USE:
//   1. Set TEST_MODE = true in config.js  (to use mock data + overrides)
//   2. Adjust TEST_OVERRIDES in config.js to the scenario you want to test
//   3. Run: node test-trigger.js
//   4. Watch terminal — see which thresholds fire and whether the webhook succeeds
//   5. When done: set TEST_MODE = false in config.js for live mode
//
// You can also run this in LIVE mode (TEST_MODE = false) to do a real one-off
// check for a specific user without waiting for the cron schedule.

import { evaluateUser } from "./evaluator.js";
import { TEST_MODE, MOCK_USERS } from "./config.js";

// ── Pick which users to test ───────────────────────────────────────────────────
// Option A: test ALL mock users (default)
const usersToTest = MOCK_USERS;

// Option B: test a single specific user (uncomment and comment out Option A)
// const usersToTest = [MOCK_USERS.find(u => u.user_id === "rider_001")];

// Option C: test a completely custom one-off user (uncomment to use)
// const usersToTest = [{
//   user_id:       "test_rider",
//   lat:            19.0760,
//   lon:            72.8777,
//   platform:      "zomato",
//   weekly_income:  5000,
//   shift_window:  "evening",
//   tier:          "full_shield",
// }];

// ── Run ───────────────────────────────────────────────────────────────────────
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  🧪 Manual Trigger Test");
console.log(`  Mode  : ${TEST_MODE ? "TEST (mock overrides)" : "LIVE (real APIs)"}`);
console.log(`  Users : ${usersToTest.map(u => u.user_id).join(", ")}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

for (const user of usersToTest) {
  await evaluateUser(user);
  console.log();
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  ✅ Test run complete.");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
