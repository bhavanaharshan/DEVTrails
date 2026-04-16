// fetchers.js
import axios from "axios";
import { THRESHOLDS } from "./config.js";

export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,visibility,weathercode`;
  const { data } = await axios.get(url);
  return data.current;
}

export async function fetchAQI(lat, lon) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
  const { data } = await axios.get(url);
  return data.current.us_aqi;
}

export function checkPlatformOutage() {
  return Math.random() < THRESHOLDS.OUTAGE_PROBABILITY;
}