// config.js
// Central configuration for the Automated Trigger Engine.
// Zones are fetched dynamically from the backend at runtime (see index.js).
// This file holds: thresholds, URLs, and test-mode settings.

// ── Thresholds ────────────────────────────────────────────────────────────────
export const THRESHOLDS = {
  // Trigger if precipitation exceeds 25mm OR temperature exceeds 42°C
  PRECIPITATION_MM: 25,
  TEMPERATURE_CELSIUS: 42,

  // Trigger if AQI exceeds 300 (Hazardous — uses US EPA scale, applied globally)
  AQI_US: 300,

  // Probability (0–1) that a platform outage is simulated on any given check
  OUTAGE_PROBABILITY: 0.1,
};

// ── URLs ──────────────────────────────────────────────────────────────────────
// To use env variables instead of hardcoded strings:
//   1. Run: npm install dotenv
//   2. Add `import 'dotenv/config';` as the FIRST line of this file
//   3. Replace each string below with: process.env.VARIABLE_NAME

// Neema's claim trigger endpoint
export const WEBHOOK_URL = "http://localhost:5000/api/claims/trigger";

// Backend endpoint that returns the list of active zones for this cron tick
// Expected response: [{ name: "bangalore_south", lat: 12.9259, lon: 77.583 }, ...]
export const ZONES_API_URL = "http://localhost:5000/api/zones/active";

// ── Fallback Zones ────────────────────────────────────────────────────────────
// Used ONLY if the backend is unreachable when fetching zones.
// Keeps the engine running during a backend outage instead of silently stopping.
export const FALLBACK_ZONES = [
  { name: "bangalore_south", lat: 12.9259, lon: 77.5830 },
  { name: "bangalore_north", lat: 13.0358, lon: 77.5970 },
];

// ── Test Mode ─────────────────────────────────────────────────────────────────
// Set TEST_MODE = true  → skips real APIs, uses TEST_OVERRIDES values below.
// Set TEST_MODE = false → live mode, hits real APIs. (default)
// Nothing else needs to change when you flip this flag.
export const TEST_MODE = false;

export const TEST_OVERRIDES = {
  //
  // WEATHER
  // Threshold: precipitation > 25mm  OR  temperature > 42°C
  //
  precipitation: 50,    // ⚠️  SEVERE  — 50mm  >> 25mm threshold  → WILL trigger claim
  temperature:   30,    // ✅  SAFE    — 30°C  <  42°C threshold  → no claim
  //
  // To test temperature trigger instead, swap the values:
  //   precipitation: 5,   // safe
  //   temperature:   45,  // severe
  //
  // ─────────────────────────────────────────────────────────────────────────
  //
  // AQI
  // Threshold: us_aqi > 300
  //
  aqi: 350,             // ⚠️  SEVERE  — 350   >> 300 threshold   → WILL trigger claim
  //
  // To test safe AQI, change to:
  //   aqi: 120,         // safe
  //
  // ─────────────────────────────────────────────────────────────────────────
  //
  // OUTAGE
  // true  = always simulate a crash   → WILL trigger claim
  // false = never simulate a crash    → no claim
  //
  outage: true,         // ⚠️  SEVERE  — forced crash             → WILL trigger claim
};
