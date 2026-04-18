CITY_BASELINE = {
    "mumbai": 0.6,
    "delhi": 0.55,
    "chennai": 0.5,
    "lucknow": 0.45
}

CITY_BASELINE = {
    "mumbai": 0.6,
    "delhi": 0.55,
    "chennai": 0.5,
    "lucknow": 0.45,
    "bengaluru": 0.5,
    "thiruvananthapuram": 0.4,
}

def compute_final_risk(risk_scores: dict, city: str = "mumbai") -> dict:
    weights = {
        "rain": 0.30,
        "heat": 0.10,
        "aqi": 0.10,
        "fog": 0.05,
        "bandh": 0.15,
        "congestion": 0.20,
        "outage": 0.10,
    }

    score = 0
    for k, w in weights.items():
        score += max(risk_scores.get(k, 0.2), 0.2) * w

    baseline = CITY_BASELINE.get(city, 0.5)
    score = (0.5 * score) + (0.5 * baseline)

    score = round(min(score, 1.0), 3)

    if score >= 0.7:
        tier = "HIGH"
    elif score >= 0.4:
        tier = "MEDIUM"
    else:
        tier = "LOW"

    return {
        "risk_score": score,
        "claim_probability": score,
        "risk_tier": tier,

        # IMPORTANT: NOT a security lockout
        "operational_alert": score >= 0.8
    }

    weights = {
        "rain": 0.30,
        "heat": 0.10,
        "aqi": 0.10,
        "fog": 0.05,
        "bandh": 0.15,
        "congestion": 0.20,
        "outage": 0.10,
    }

    score = 0
    for k, w in weights.items():
        score += max(risk_scores.get(k, 0.2), 0.2) * w

    # 🔥 Blend with city baseline (IMPORTANT FIX)
    baseline = CITY_BASELINE.get(city, 0.5)
    score = (0.5 * score) + (0.5 * baseline)

    score = round(min(score, 1.0), 3)

    if score >= 0.7:
        tier = "HIGH"
    elif score >= 0.4:
        tier = "MEDIUM"
    else:
        tier = "LOW"

    return {
        "risk_score": score,
        "claim_probability": score,
        "risk_tier": tier,
        "lockout_recommended": score >= 0.8
    }