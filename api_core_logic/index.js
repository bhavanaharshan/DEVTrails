// index.js
// Entry point for the Automated Trigger Engine.
// Zones are fetched dynamically from the backend on every cron tick.
// Falls back to FALLBACK_ZONES in config.js if the backend is unreachable.

import axios from "axios";
import cron  from "node-cron";
import { ZONES_API_URL, FALLBACK_ZONES, TEST_MODE } from "./config.js";
import { evaluateZone } from "./evaluator.js";

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  🚀 Parametric Insurance — Automated Trigger Engine");
console.log(`  Mode: ${TEST_MODE ? "🧪 TEST (mock data)" : "🌐 LIVE (real APIs)"}`);
console.log("  Zone source: backend API (dynamic)");
console.log("  Schedule: every 2 minutes");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// ── Zone Fetcher ──────────────────────────────────────────────────────────────
/**
 * Fetches the list of active zones from the main backend.
 * If the request fails (backend down, network error), falls back to the
 * hardcoded FALLBACK_ZONES in config.js so the engine never goes silent.
 * @returns {Array<{ name: string, lat: number, lon: number }>}
 */
async function fetchActiveZones() {
  try {
    const { data } = await axios.get(ZONES_API_URL);
    console.log(`  📍 Fetched ${data.length} active zone(s) from backend: ${data.map(z => z.name).join(", ")}`);
    return data;
  } catch (err) {
    console.error(`  ❌ Could not reach zones API (${ZONES_API_URL}): ${err.message}`);
    console.warn(`  ⚠️  Falling back to ${FALLBACK_ZONES.length} hardcoded zone(s): ${FALLBACK_ZONES.map(z => z.name).join(", ")}`);
    return FALLBACK_ZONES;
  }
}

// ── Core Evaluation Loop ──────────────────────────────────────────────────────
/**
 * Fetches fresh zones, then runs the evaluator on each one.
 * Called by cron every 2 minutes (and once immediately on startup).
 */
async function runEvaluationCycle() {
  const now   = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const zones = await fetchActiveZones();

  console.log("┌─────────────────────────────────────────────────");
  console.log(`│ ⏰ ENGINE WAKE-UP  [${now}]`);
  console.log(`│ Evaluating ${zones.length} zone(s)...`);
  console.log("└─────────────────────────────────────────────────");

  // Evaluate zones sequentially — keeps logs readable, avoids API hammering
  for (const zone of zones) {
    await evaluateZone(zone);
    console.log(); // blank line between zones
  }

  console.log("┌─────────────────────────────────────────────────");
  console.log("│ 😴 ENGINE SLEEPING — next check in 2 minutes.");
  console.log("└─────────────────────────────────────────────────\n");
}

// ── Cron Schedule ─────────────────────────────────────────────────────────────
// Runs every 2 minutes. To change frequency, edit the cron expression:
//   "*/1 * * * *"  → every 1 minute
//   "*/5 * * * *"  → every 5 minutes
//   "0 * * * *"    → every hour
cron.schedule("*/2 * * * *", runEvaluationCycle);

// Run once immediately on startup — no waiting for the first cron tick
runEvaluationCycle();
