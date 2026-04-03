// fetchers.js
// Three isolated, async data-fetching functions.
// Each function has two paths:
//   - TEST_MODE = true  → returns hardcoded override values from config.js
//   - TEST_MODE = false → hits the real external API (live mode)
// To switch between modes, only change TEST_MODE in config.js.

import axios from "axios";
import { THRESHOLDS, TEST_MODE, TEST_OVERRIDES } from "./config.js";

// ── 1. Weather ────────────────────────────────────────────────────────────────
/**
 * Returns current precipitation (mm) and temperature (°C) for a lat/lon.
 * @returns {{ precipitation: number, temperature: number }}
 */
export async function fetchWeather(lat, lon) {

  // ── TEST PATH ──────────────────────────────────────────────────────────────
  if (TEST_MODE) {
    console.log(`     [TEST MODE] Weather override → precipitation=${TEST_OVERRIDES.precipitation}mm, temperature=${TEST_OVERRIDES.temperature}°C`);
    return {
      precipitation: TEST_OVERRIDES.precipitation,
      temperature:   TEST_OVERRIDES.temperature,
    };
  }

  // ── LIVE PATH ──────────────────────────────────────────────────────────────
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,precipitation`;

  const { data } = await axios.get(url);
  const current  = data.current;

  return {
    precipitation: current.precipitation,  // mm
    temperature:   current.temperature_2m, // °C
  };
}

// ── 2. Air Quality ────────────────────────────────────────────────────────────
/**
 * Returns the current US AQI value for a lat/lon.
 * Note: "us_aqi" is the EPA measurement scale — it uses the coordinates you
 * pass in, so it correctly reflects local air quality for any location globally.
 * Open-Meteo also supports `european_aqi` if you prefer the EU scale — just
 * swap the query param and the return field name.
 * @returns {number} AQI value (0–500+)
 */
export async function fetchAQI(lat, lon) {

  // ── TEST PATH ──────────────────────────────────────────────────────────────
  if (TEST_MODE) {
    console.log(`     [TEST MODE] AQI override → us_aqi=${TEST_OVERRIDES.aqi}`);
    return TEST_OVERRIDES.aqi;
  }

  // ── LIVE PATH ──────────────────────────────────────────────────────────────
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=us_aqi`;

  // To switch to European AQI scale, replace the two lines above with:
  // const url =
  //   `https://air-quality-api.open-meteo.com/v1/air-quality` +
  //   `?latitude=${lat}&longitude=${lon}` +
  //   `&current=european_aqi`;
  // And update the return line below to: return data.current.european_aqi;
  // Also update THRESHOLDS.AQI_US in config.js to match the EU scale range.

  const { data } = await axios.get(url);
  return data.current.us_aqi;
}

// ── 3. Platform Outage ────────────────────────────────────────────────────────
/**
 * Mock platform-outage detector.
 * Simulates a Zomato/Swiggy server crash.
 * @returns {boolean} true if an outage is detected
 */
export function checkPlatformOutage() {

  // ── TEST PATH ──────────────────────────────────────────────────────────────
  if (TEST_MODE) {
    console.log(`     [TEST MODE] Outage override → detected=${TEST_OVERRIDES.outage}`);
    return TEST_OVERRIDES.outage;
  }

  // ── LIVE PATH ──────────────────────────────────────────────────────────────
  // ~10% probability of simulating a crash on any given check
  return Math.random() < THRESHOLDS.OUTAGE_PROBABILITY;
}
