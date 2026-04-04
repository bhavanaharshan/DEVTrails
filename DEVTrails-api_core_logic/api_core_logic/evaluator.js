// evaluator.js
// Evaluates all three trigger conditions for a single USER object.
// Calculates the estimated daily payout for debug logging.
// Fires the full user-context webhook payload to the backend on any breach.

import axios from "axios";
import { THRESHOLDS, TIER_MULTIPLIERS, WEBHOOK_URL } from "./config.js";
import { fetchWeather, fetchAQI, checkPlatformOutage } from "./fetchers.js";

// ── Payout Calculator ─────────────────────────────────────────────────────────
/**
 * Calculates the estimated daily payout for a user if a claim is triggered.
 * Used for terminal debug logging only — the backend also runs its own calculation.
 *
 * Step 1: daily_income      = weekly_income / 7
 * Step 2: coverage_multiplier from tier (basic=0.60, standard=0.70, full_shield=0.80)
 * Step 3: payout_per_day    = daily_income * coverage_multiplier
 *
 * @param {number} weekly_income
 * @param {string} tier - "basic" | "standard" | "full_shield"
 * @returns {{ daily_income: number, multiplier: number, payout_per_day: number }}
 */
function calculatePayout(weekly_income, tier) {
  const daily_income  = weekly_income / 7;
  const multiplier    = TIER_MULTIPLIERS[tier] ?? TIER_MULTIPLIERS.basic; // safe fallback
  const payout_per_day = daily_income * multiplier;

  return {
    daily_income:  parseFloat(daily_income.toFixed(2)),
    multiplier,
    payout_per_day: parseFloat(payout_per_day.toFixed(2)),
  };
}

// ── Webhook Dispatcher ────────────────────────────────────────────────────────
/**
 * Posts a claim trigger to the backend with the full user context payload.
 * @param {Object} user        - Full user object from MOCK_USERS / live API
 * @param {string} trigger_type - "weather" | "aqi" | "outage"
 */
async function fireClaim(user, trigger_type) {
  // ── Debug: log the estimated payout before firing ──────────────────────────
  const { daily_income, multiplier, payout_per_day } = calculatePayout(
    user.weekly_income,
    user.tier
  );
  console.log(
    `     💰 Payout estimate → ` +
    `daily_income=₹${daily_income} × ${multiplier} (${user.tier}) = ₹${payout_per_day}/day`
  );

  // ── Build the exact payload the backend expects ────────────────────────────
  const payload = {
    user_id:       user.user_id,
    lat:           user.lat,
    lon:           user.lon,
    platform:      user.platform,
    weekly_income: user.weekly_income,
    shift_window:  user.shift_window,
    tier:          user.tier,
    trigger_type, // "weather" | "aqi" | "outage"
    payout_per_day,                      
  };

  try {
    await axios.post(WEBHOOK_URL, payload);
    console.log(
      `  ✅ CLAIM FIRED  | user=${user.user_id} | platform=${user.platform} | trigger=${trigger_type} | payout=₹${payout_per_day}`
    );
  } catch (err) {
    console.error(
      `  ❌ WEBHOOK FAIL | user=${user.user_id} | trigger=${trigger_type} | ${err.message}`
    );
  }
}

// ── Main Evaluator ────────────────────────────────────────────────────────────
/**
 * Runs all three checks for a single user and fires claims on any breach.
 * Each check is isolated in its own try/catch — one failure won't block the others.
 *
 * @param {Object} user - Full user object
 * @param {string} user.user_id
 * @param {number} user.lat
 * @param {number} user.lon
 * @param {string} user.platform
 * @param {number} user.weekly_income
 * @param {string} user.shift_window
 * @param {string} user.tier
 */
export async function evaluateUser(user) {
  const { user_id, lat, lon, platform, tier } = user;
  console.log(
    `  🔍 Checking user: ${user_id} | platform=${platform} | tier=${tier} | (${lat}, ${lon})`
  );

  // ── 1. Weather ────────────────────────────────────────────────────────────
try {
  const { precipitation, temperature, visibility, weathercode } = await fetchWeather(lat, lon);
  console.log(
    `     Weather → precipitation=${precipitation}mm, temperature=${temperature}°C, visibility=${visibility}m, weathercode=${weathercode}`
  );

  if (precipitation > THRESHOLDS.PRECIPITATION_MM) {
    console.log(`     ⚠️  Precipitation breach: ${precipitation}mm > ${THRESHOLDS.PRECIPITATION_MM}mm`);
    await fireClaim(user, "rain");                          // ← was "weather"

  } else if (temperature > THRESHOLDS.TEMPERATURE_CELSIUS) {
    console.log(`     ⚠️  Temperature breach: ${temperature}°C > ${THRESHOLDS.TEMPERATURE_CELSIUS}°C`);
    await fireClaim(user, "heat");                          // ← was "weather"

  } else if (visibility < THRESHOLDS.VISIBILITY_METRES || [45, 48].includes(weathercode)) {
    console.log(`     ⚠️  Fog breach: visibility=${visibility}m, weathercode=${weathercode}`);
    await fireClaim(user, "fog");                           // ← new check

  } else {
    console.log(`     ✔  Weather within safe limits.`);
  }
} catch (err) {
  console.error(`     ❌ Weather fetch failed for ${user_id}: ${err.message}`);
}

  // ── 2. Air Quality ────────────────────────────────────────────────────────
  try {
    const aqi = await fetchAQI(lat, lon);
    console.log(`     AQI    → us_aqi=${aqi}`);

    if (aqi > THRESHOLDS.AQI_US) {
      console.log(
        `     ⚠️  AQI breach: ${aqi} > ${THRESHOLDS.AQI_US} (Hazardous)`
      );
      await fireClaim(user, "aqi");
    } else {
      console.log(`     ✔  Air quality within safe limits.`);
    }
  } catch (err) {
    console.error(`     ❌ AQI fetch failed for ${user_id}: ${err.message}`);
  }

  // ── 3. Platform Outage ────────────────────────────────────────────────────
  const isOutage = checkPlatformOutage();
  console.log(`     Outage → detected=${isOutage}`);

  if (isOutage) {
    console.log(`     ⚠️  Platform outage detected for ${platform}!`);
    await fireClaim(user, "outage");
  } else {
    console.log(`     ✔  No platform outage.`);
  }
}
