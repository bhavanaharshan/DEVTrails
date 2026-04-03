// index.js
// Entry point for the Automated Trigger Engine.
// Now user-based: evaluates each active gig worker individually on every cron tick.
// In TEST_MODE: iterates over MOCK_USERS from config.js.
// In LIVE mode: fetches active users from the backend API, falls back to MOCK_USERS.

import axios from "axios";
import cron  from "node-cron";
import { TEST_MODE, MOCK_USERS, USERS_API_URL } from "./config.js";
import { evaluateUser } from "./evaluator.js";

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  🚀 Parametric Insurance — Automated Trigger Engine");
console.log(`  Mode    : ${TEST_MODE ? "🧪 TEST (mock users + mock data)" : "🌐 LIVE (real users + real APIs)"}`);
console.log(`  Checking: ${TEST_MODE ? `${MOCK_USERS.length} mock user(s)` : "users fetched from backend"}`);
console.log("  Schedule: every 2 minutes");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// ── User Source ───────────────────────────────────────────────────────────────
/**
 * Returns the list of users to evaluate for this cron tick.
 * - TEST_MODE: returns MOCK_USERS directly from config (no network call).
 * - LIVE mode: fetches from USERS_API_URL, falls back to MOCK_USERS on failure.
 *
 * @returns {Array<Object>} array of user objects
 */
async function getActiveUsers() {
  if (TEST_MODE) {
    console.log(`  👥 Using ${MOCK_USERS.length} mock user(s): ${MOCK_USERS.map(u => u.user_id).join(", ")}`);
    return MOCK_USERS;
  }

  // ── LIVE: fetch from backend ───────────────────────────────────────────────
  try {
    const { data } = await axios.get(USERS_API_URL);
    console.log(`  👥 Fetched ${data.length} active user(s) from backend: ${data.map(u => u.user_id).join(", ")}`);
    return data;
  } catch (err) {
    console.error(`  ❌ Could not reach users API (${USERS_API_URL}): ${err.message}`);
    console.warn(`  ⚠️  Falling back to ${MOCK_USERS.length} mock user(s).`);
    return MOCK_USERS;
  }
}

// ── Core Evaluation Loop ──────────────────────────────────────────────────────
/**
 * Fetches/reads active users then runs the evaluator on each one.
 * Called immediately on startup and then by cron every 2 minutes.
 */
async function runEvaluationCycle() {
  const now   = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const users = await getActiveUsers();

  console.log("┌─────────────────────────────────────────────────");
  console.log(`│ ⏰ ENGINE WAKE-UP  [${now}]`);
  console.log(`│ Evaluating ${users.length} user(s)...`);
  console.log("└─────────────────────────────────────────────────");

  // Evaluate sequentially — keeps logs readable, avoids hammering the APIs
  for (const user of users) {
    await evaluateUser(user);
    console.log(); // blank line between users
  }

  console.log("┌─────────────────────────────────────────────────");
  console.log("│ 😴 ENGINE SLEEPING — next check in 2 minutes.");
  console.log("└─────────────────────────────────────────────────\n");
}

// ── Cron Schedule ─────────────────────────────────────────────────────────────
// Runs every 2 minutes. To adjust frequency:
//   "*/1 * * * *"  → every 1 minute
//   "*/5 * * * *"  → every 5 minutes
//   "0 * * * *"    → every hour
cron.schedule("*/2 * * * *", runEvaluationCycle);

// Run once immediately on startup — no waiting for the first cron tick
runEvaluationCycle();
