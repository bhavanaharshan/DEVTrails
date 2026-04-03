from datetime import datetime

# Seasonal risk windows based on README scenario data
SEASONAL_RULES = {
    "rain":       {"months": [6, 7, 8, 9],       "cities": ["mumbai", "chennai"]},
    "heat":       {"months": [4, 5, 6],           "cities": ["delhi", "lucknow"]},
    "aqi":        {"months": [10, 11, 12, 1],     "cities": ["delhi"]},
    "fog":        {"months": [11, 12, 1, 2],      "cities": ["delhi", "lucknow"]},
    "bandh":      {"months": list(range(1, 13)),  "cities": []},
    "congestion": {"months": list(range(1, 13)),  "cities": []},
    "outage":     {"months": list(range(1, 13)),  "cities": []},
}

def get_forecast_scores(city: str) -> dict:
    """Returns P(trigger fires this week) per scenario — 0.0 to 1.0"""
    month  = datetime.now().month
    scores = {}

    for scenario, rules in SEASONAL_RULES.items():
        in_season  = month in rules["months"]
        city_match = (city in rules["cities"]) or (not rules["cities"])
        base_prob  = 0.55 if (in_season and city_match) else 0.20
        scores[scenario] = round(base_prob, 2)

    return scores

def generate_alert_text(city: str, scores: dict, premium: float) -> str:
    """Generates the Sunday morning notification text shown on dashboard"""
    high_risk = [s for s, v in scores.items() if v >= 0.4]

    if not high_risk:
        return f"Low disruption risk this week. Your cover: ₹{premium:.0f}. You're protected."

    scenario_labels = {
        "rain":        "Heavy rain",
        "heat":        "Extreme heat",
        "aqi":         "Severe air pollution",
        "fog":         "Dense fog",
        "bandh":       "Bandh/curfew risk",
        "congestion":  "Traffic congestion",
        "outage":      "Platform outage risk"
    }

    top   = scenario_labels.get(high_risk[0], high_risk[0])
    return f"{top} likely this week. Your cover: ₹{premium:.0f}. You're protected."