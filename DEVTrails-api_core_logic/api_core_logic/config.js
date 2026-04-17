// config.js
export const THRESHOLDS = {
  PRECIPITATION_MM: 25,
  TEMPERATURE_CELSIUS: 42,
  AQI_US: 300,
  OUTAGE_PROBABILITY: 0.1,
  VISIBILITY_METRES: 1000, // <-- Kept your new Fog threshold!
};

export const TIER_MULTIPLIERS = { basic: 0.60, standard: 0.70, full_shield: 0.80 };

// The 3 microservices we talk to
export const WEBHOOK_URL = "http://neema-backend:3001/api/claims/trigger";
export const FLAGGED_URL = "http://neema-backend:3001/api/claims/flagged";
export const PRIYA_ML_URL = "http://localhost:8000/api/api/v1/premium/fraud-check";

export const TEST_MODE = false;

export const MOCK_USERS = [
  {
    user_id: "rider_001",
    lat: 19.0760, lon: 72.8777,
    last_known_lat: 19.1136, last_known_lon: 72.8697, // CRITICAL for Priya's ML
    platform: "zomato",
    weekly_income: 4500,
    shift_window: "evening",
    tier: "standard",
    days_active_last_120: 95 // CRITICAL for SS Code Math
  }
];