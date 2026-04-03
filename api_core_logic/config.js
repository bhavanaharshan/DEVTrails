// config.js
// Central configuration for the Automated Trigger Engine.
// Now user-based: each entry represents an active gig worker, not a zone.

// ── Thresholds ────────────────────────────────────────────────────────────────
export const THRESHOLDS = {
  // Trigger if precipitation exceeds 25mm OR temperature exceeds 42°C
  PRECIPITATION_MM:   25,
  TEMPERATURE_CELSIUS: 42,

  // Trigger if AQI exceeds 300 (Hazardous — US EPA scale, applied globally)
  AQI_US: 300,

  // Probability (0–1) that a platform outage is simulated on any given check
  OUTAGE_PROBABILITY: 0.1,
  VISIBILITY_METRES: 1000,
};

// ── Coverage Multipliers by Tier ──────────────────────────────────────────────
// Used by the payout calculator in evaluator.js
export const TIER_MULTIPLIERS = {
  basic:       0.60,
  standard:    0.70,
  full_shield: 0.80,
};

// ── URLs ──────────────────────────────────────────────────────────────────────
// To use env variables:
//   1. npm install dotenv
//   2. Add `import 'dotenv/config';` as the FIRST line of this file
//   3. Replace each string with: process.env.VARIABLE_NAME

// Neema's claim trigger endpoint (updated to v1)
export const WEBHOOK_URL = "http://localhost:3001/api/v1/premium/trigger-check";

// Backend endpoint that returns the live list of active users
// Expected response shape: array of user objects (same shape as MOCK_USERS below)
export const USERS_API_URL = "http://localhost:3001/api/v1/users/active";

// ── Test Mode ─────────────────────────────────────────────────────────────────
// TEST_MODE = true  → skips real APIs, uses MOCK_USERS + TEST_OVERRIDES
// TEST_MODE = false → fetches real users from USERS_API_URL, hits real APIs
export const TEST_MODE = true;

// ── Mock Users (used when TEST_MODE = true) ───────────────────────────────────
// Represents active gig delivery workers across different cities and tiers.
// Each object contains exactly what the webhook payload requires.
export const MOCK_USERS = [
  {
    user_id:       "rider_001",
    lat:            19.0760,
    lon:            72.8777,
    platform:      "zomato",
    weekly_income:  4500,
    shift_window:  "evening",
    tier:          "standard",
  },
  {
    user_id:       "rider_002",
    lat:            12.9259,    // Bangalore South
    lon:            77.5830,
    platform:      "swiggy",
    weekly_income:  3800,
    shift_window:  "morning",
    tier:          "basic",
  },
  {
    user_id:       "rider_003",
    lat:            28.6139,    // Delhi
    lon:            77.2090,
    platform:      "zomato",
    weekly_income:  5200,
    shift_window:  "night",
    tier:          "full_shield",
  },
  {
    user_id:       "rider_004",
    lat:            13.0358,    // Bangalore North
    lon:            77.5970,
    platform:      "blinkit",
    weekly_income:  4100,
    shift_window:  "evening",
    tier:          "standard",
  },
];

// ── Test Overrides (used when TEST_MODE = true) ───────────────────────────────
// Controls which conditions are simulated as severe.
// Change values here to test different breach scenarios — nothing else needs to change.
export const TEST_OVERRIDES = {
  //
  // WEATHER  (threshold: precipitation > 25mm  OR  temperature > 42°C)
  //
  precipitation: 50,    // ⚠️  SEVERE  — 50mm  >> 25mm  → fires weather claim
  temperature:   30,    // ✅  SAFE    — 30°C  <  42°C  → no claim
  //
  // To test heat trigger instead:
  //   precipitation: 5,    // safe
  //   temperature:   45,   // severe
  //
  // ─────────────────────────────────────────────────────────────────────────
  //
  // AQI  (threshold: us_aqi > 300)
  //
  aqi: 350,             // ⚠️  SEVERE  — 350   >> 300   → fires AQI claim
  //
  // Safe AQI: aqi: 120
  //
  // ─────────────────────────────────────────────────────────────────────────
  //
  // OUTAGE
  //
  outage: true,         // ⚠️  SEVERE  — forced crash   → fires outage claim
  // Safe outage: outage: false
};
