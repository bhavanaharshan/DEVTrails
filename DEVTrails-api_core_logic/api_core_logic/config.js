export const THRESHOLDS = {
    PRECIPITATION_MM: 25,
    TEMPERATURE_CELSIUS: 42,
    AQI_US: 300,
    OUTAGE_PROBABILITY: 0.1,
    VISIBILITY_METRES: 1000,
};

export const TIER_MULTIPLIERS = {
    basic:        0.60,
    standard:     0.70,
    full_shield:  0.80,
};

// ─────────────────────────────────────────────
// Service URLs
// In Docker: containers talk by service name (see docker-compose.yml)
// In local dev: use localhost with the correct port
// ─────────────────────────────────────────────

// Neema backend (Node.js, port 3001)
export const USERS_API_URL = process.env.USERS_API_URL   || "http://backend:3001/api/users/active";
export const WEBHOOK_URL   = process.env.WEBHOOK_URL     || "http://backend:3001/api/claims/trigger";
export const FLAGGED_URL   = process.env.FLAGGED_URL     || "http://backend:3001/api/claims/flagged";

// ML Engine (FastAPI, port 8000)
// /fraud-check expects: { user_id, claim_lat, claim_lon, last_known_lat, last_known_lon, time_diff_minutes }
export const PRIYA_ML_URL  = process.env.ML_ENGINE_URL   || "http://ml-engine:8000/api/v1/premium/fraud-check";

export const TEST_MODE = process.env.TEST_MODE === 'true' || false;

export const MOCK_USERS = [
    {
        user_id:              "rider_001",
        lat:                  19.0760,
        lon:                  72.8777,
        last_known_lat:       19.1136,
        last_known_lon:       72.8697,
        platform:             "zomato",
        weekly_income:        4500,
        shift_window:         "evening",
        tier:                 "standard",
        days_active_last_120: 95,
    },
];
