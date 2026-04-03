// evaluator.js
// Evaluates all three trigger conditions for a single zone.
// Fires the webhook to Neema's API for every breached threshold.

import axios from "axios";
import { THRESHOLDS, WEBHOOK_URL } from "./config.js";
import { fetchWeather, fetchAQI, checkPlatformOutage } from "./fetchers.js";

/**
 * Posts a claim trigger to the main backend webhook.
 * @param {string} zone - Zone name (e.g. "bangalore_south")
 * @param {string} trigger_type - "weather" | "aqi" | "outage"
 */
async function fireClaim(zone, trigger_type) {
  const payload = { zone, trigger_type };

  try {
    await axios.post(WEBHOOK_URL, payload);
    console.log(
      `  ✅ CLAIM FIRED  | zone=${zone} | trigger=${trigger_type}`
    );
  } catch (err) {
    console.error(
      `  ❌ WEBHOOK FAIL | zone=${zone} | trigger=${trigger_type} | ${err.message}`
    );
  }
}

/**
 * Runs all checks for a single zone object and fires claims as needed.
 * @param {{ name: string, lat: number, lon: number }} zone
 */
export async function evaluateZone(zone) {
  const { name, lat, lon } = zone;
  console.log(`  🔍 Checking zone: ${name} (${lat}, ${lon})`);

  // ── 1. Weather ────────────────────────────────────────────────────────────
  try {
    const { precipitation, temperature } = await fetchWeather(lat, lon);
    console.log(
      `     Weather → precipitation=${precipitation}mm, temperature=${temperature}°C`
    );

    if (precipitation > THRESHOLDS.PRECIPITATION_MM) {
      console.log(
        `     ⚠️  Precipitation breach: ${precipitation}mm > ${THRESHOLDS.PRECIPITATION_MM}mm`
      );
      await fireClaim(name, "weather");
    } else if (temperature > THRESHOLDS.TEMPERATURE_CELSIUS) {
      console.log(
        `     ⚠️  Temperature breach: ${temperature}°C > ${THRESHOLDS.TEMPERATURE_CELSIUS}°C`
      );
      await fireClaim(name, "weather");
    } else {
      console.log(`     ✔  Weather within safe limits.`);
    }
  } catch (err) {
    console.error(`     ❌ Weather fetch failed for ${name}: ${err.message}`);
  }

  // ── 2. Air Quality ────────────────────────────────────────────────────────
  try {
    const aqi = await fetchAQI(lat, lon);
    console.log(`     AQI    → us_aqi=${aqi}`);

    if (aqi > THRESHOLDS.AQI_US) {
      console.log(
        `     ⚠️  AQI breach: ${aqi} > ${THRESHOLDS.AQI_US} (Hazardous)`
      );
      await fireClaim(name, "aqi");
    } else {
      console.log(`     ✔  Air quality within safe limits.`);
    }
  } catch (err) {
    console.error(`     ❌ AQI fetch failed for ${name}: ${err.message}`);
  }

  // ── 3. Platform Outage ────────────────────────────────────────────────────
  const isOutage = checkPlatformOutage();
  console.log(`     Outage → detected=${isOutage}`);

  if (isOutage) {
    console.log(`     ⚠️  Platform outage simulated!`);
    await fireClaim(name, "outage");
  } else {
    console.log(`     ✔  No platform outage.`);
  }
}
