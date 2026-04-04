import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
import json, os

PLATFORM_FACTOR = {"zomato": 1.05, "swiggy": 1.00}
SHIFT_FACTOR    = {"morning": 0.85, "evening": 1.20, "night": 1.00}

def _generate_training_data():
    np.random.seed(42)
    X, y = [], []
    cities    = ["mumbai", "delhi", "lucknow", "chennai"]
    platforms = ["zomato", "swiggy"]
    shifts    = ["morning", "evening", "night"]

    for _ in range(500):
        city_idx     = np.random.randint(0, len(cities))
        platform_idx = np.random.randint(0, len(platforms))
        shift_idx    = np.random.randint(0, len(shifts))
        base_income  = np.random.uniform(2800, 6500)

        city_mult     = [1.35, 1.40, 1.10, 1.20][city_idx]
        platform_mult = [1.05, 1.00][platform_idx]
        shift_mult    = [0.85, 1.20, 1.00][shift_idx]

        true_daily = (base_income / 7) * shift_mult * (0.9 + np.random.uniform(0, 0.2))
        X.append([city_idx, platform_idx, shift_idx, base_income,
                  city_mult, platform_mult, shift_mult])
        y.append(true_daily)

    return np.array(X), np.array(y)

class EarningsDNAProfiler:
    def __init__(self):
        self.model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self._train()

    def _train(self):
        X, y = _generate_training_data()
        self.model.fit(X, y)

    def estimate_daily_income(self, weekly_income: float, city: str,
                               platform: str, shift_window: str) -> dict:
        city_map     = {"mumbai": 0, "delhi": 1, "lucknow": 2, "chennai": 3}
        platform_map = {"zomato": 0, "swiggy": 1}
        shift_map    = {"morning": 0, "evening": 1, "night": 2}

        city_idx     = city_map.get(city, 2)
        platform_idx = platform_map.get(platform, 1)
        shift_idx    = shift_map.get(shift_window, 2)

        city_mult     = [1.35, 1.40, 1.10, 1.20][city_idx]
        platform_mult = [1.05, 1.00][platform_idx]
        shift_mult    = [0.85, 1.20, 1.00][shift_idx]

        features = [[city_idx, platform_idx, shift_idx, weekly_income,
                     city_mult, platform_mult, shift_mult]]
        estimated_daily = float(self.model.predict(features)[0])

        slab_threshold = weekly_income * 0.85
        slab_eligible  = estimated_daily * 5 < slab_threshold

        return {
            "daily_income_estimate": round(estimated_daily, 2),
            "slab_shield_eligible": slab_eligible
        }

# Singleton — loaded once when FastAPI starts
earnings_profiler = EarningsDNAProfiler()