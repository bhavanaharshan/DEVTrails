// fetchers.js
import axios from "axios";
import { THRESHOLDS } from "./config.js";

export async function fetchWeather(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,visibility,weathercode`;
        const { data } = await axios.get(url);
        return data.current;
    } catch (error) {
        console.error("⚠️ Weather API Error:", error.message);
        return null;
    }
}

export async function fetchAQI(lat, lon) {
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
        const { data } = await axios.get(url);
        return data.current.us_aqi;
    } catch (error) {
        console.error("⚠️ AQI API Error:", error.message);
        return null;
    }
}

export function checkPlatformOutage() {
    return Math.random() < THRESHOLDS.OUTAGE_PROBABILITY;
}