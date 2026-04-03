import numpy as np
import xgboost as xgb
import json, os
from services.recalibration_service import get_zone_multiplier
ZONE_DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/mock_zone_history.json")

with open(ZONE_DATA_PATH) as f:
    ZONE_DATA = json.load(f)

TIER_CONFIG = {
    "basic":    {"min": 29, "max": 49, "coverage": 60, "payout_days": 3},
    "standard": {"min": 49, "max": 79, "coverage": 70, "payout_days": 3},
    "full":     {"min": 79, "max": 99, "coverage": 80, "payout_days": 3},
}

def _get_zone_factors(city: str, zone: str):
    city_data  = ZONE_DATA.get(city, ZONE_DATA["lucknow"])
    city_risk  = city_data["city_risk"]
    zone_info  = city_data["zones"].get(zone, {"zone_factor": 1.0})
    return city_risk, zone_info["zone_factor"]

def _generate_training_data():
    np.random.seed(0)
    rows = []
    for _ in range(1000):
        city_risk    = np.random.uniform(0.85, 1.40)
        shift_factor = np.random.uniform(0.85, 1.20)
        plat_factor  = np.random.uniform(1.00, 1.10)
        zone_factor  = np.random.uniform(0.80, 1.30)
        rain_risk    = np.random.uniform(0, 1)
        heat_risk    = np.random.uniform(0, 1)
        aqi_risk     = np.random.uniform(0, 1)
        fog_risk     = np.random.uniform(0, 1)
        bandh_risk   = np.random.uniform(0, 1)
        cong_risk    = np.random.uniform(0, 1)
        outage_risk  = np.random.uniform(0, 1)

        multiplier = (
            city_risk * 0.25 + shift_factor * 0.15 + plat_factor * 0.10 +
            zone_factor * 0.20 + rain_risk * 0.10 + heat_risk * 0.05 +
            aqi_risk * 0.05 + fog_risk * 0.03 + bandh_risk * 0.03 +
            cong_risk * 0.02 + outage_risk * 0.02
        )
        rows.append([city_risk, shift_factor, plat_factor, zone_factor,
                     rain_risk, heat_risk, aqi_risk, fog_risk,
                     bandh_risk, cong_risk, outage_risk, multiplier])

    data = np.array(rows)
    return data[:, :-1], data[:, -1]

class PremiumEngine:
    SHIFT_MAP    = {"morning": 0.85, "evening": 1.20, "night": 1.00}
    PLATFORM_MAP = {"zomato": 1.05, "swiggy": 1.00}

    def __init__(self):
        self.model = xgb.XGBRegressor(n_estimators=100, max_depth=4, random_state=42)
        self._train()

    def _train(self):
        X, y = _generate_training_data()
        self.model.fit(X, y)

    def calculate(self, weekly_income: float, city: str, zone: str,
                  platform: str, shift_window: str, tier_preference: str,
                  risk_scores: dict) -> dict:

        city_risk, zone_factor = _get_zone_factors(city, zone)
        shift_factor    = self.SHIFT_MAP.get(shift_window, 1.00)
        platform_factor = self.PLATFORM_MAP.get(platform, 1.00)

        features = np.array([[
            city_risk, shift_factor, platform_factor, zone_factor,
            risk_scores.get("rain", 0.3),
            risk_scores.get("heat", 0.3),
            risk_scores.get("aqi",  0.3),
            risk_scores.get("fog",  0.2),
            risk_scores.get("bandh", 0.2),
            risk_scores.get("congestion", 0.3),
            risk_scores.get("outage", 0.2),
        ]])

        ml_multiplier   = float(self.model.predict(features)[0])
        zone_adjustment = get_zone_multiplier(city, zone)
        multiplier      = ml_multiplier * zone_adjustment
        base_premium  = weekly_income * 0.018
        adjusted      = base_premium * multiplier

        # Affordability cap ₹29–₹99
        final_premium = round(max(29, min(99, adjusted)), 2)

        # Clamp to tier range
        tier = tier_preference if tier_preference in TIER_CONFIG else "standard"
        cfg  = TIER_CONFIG[tier]
        final_premium = round(max(cfg["min"], min(cfg["max"], final_premium)), 2)

        return {
            "premium_amount":      final_premium,
            "tier":                tier,
            "coverage_percentage": cfg["coverage"],
        }

# Singleton — loaded once when FastAPI starts
premium_engine = PremiumEngine()