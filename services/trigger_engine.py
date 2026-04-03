# Threshold definitions from README
# These are the exact trigger criteria for each scenario

THRESHOLDS = {
    "rain":       0.50,   # rainfall >= 25mm/hr for 90+ min
    "heat":       0.45,   # IMD Red Alert + heat index >= 44°C
    "aqi":        0.55,   # CPCB AQI >= 400 for 3+ hrs
    "fog":        0.50,   # visibility < 100m for 3+ hrs
    "bandh":      0.45,   # 3+ news sources confirm bandh
    "congestion": 0.60,   # travel time > 200% of baseline
    "outage":     0.50,   # 500+ Downdetector reports
}

COVERAGE_MAP = {
    "basic":    0.60,
    "standard": 0.70,
    "full":     0.80,
}

def evaluate_triggers(
    risk_scores: dict,
    weekly_income: float,
    tier: str
) -> dict:
    """
    Evaluates which scenarios have breached their trigger threshold.
    Returns triggered scenarios, payout amounts, and confidence score.
    """

    daily_income     = weekly_income / 7
    coverage         = COVERAGE_MAP.get(tier, 0.70)
    daily_payout     = daily_income * coverage

    triggered        = []
    total_payout     = 0.0
    confidence_sum   = 0.0

    for scenario, threshold in THRESHOLDS.items():
        score = risk_scores.get(scenario, 0.0)

        if score >= threshold:
            # How far above threshold — drives confidence
            margin     = (score - threshold) / (1.0 - threshold)
            confidence = round(min(0.70 + (margin * 0.30), 1.0), 2)

            # Slab shield bonus for standard and full tier
            payout = daily_payout
            if tier in ["standard", "full"] and scenario in ["rain", "bandh"]:
                payout = payout * 1.15   # 15% slab shield bonus

            payout = round(payout, 2)
            total_payout  += payout
            confidence_sum += confidence

            triggered.append({
                "scenario":     scenario,
                "triggered":    True,
                "risk_score":   round(score, 2),
                "threshold":    threshold,
                "payout_amount": payout,
                "confidence":   confidence,
            })

    # Cap at 3 triggered scenarios per week (README guardrail)
    triggered = sorted(triggered, key=lambda x: x["risk_score"], reverse=True)[:3]
    total_payout = round(sum(t["payout_amount"] for t in triggered), 2)

    # Overall confidence = average of triggered scenario confidences
    avg_confidence = round(
        confidence_sum / len(triggered) if triggered else 0.0, 2
    )

    # Auto approve if confidence >= 0.85 (README threshold)
    auto_approve = avg_confidence >= 0.85

    return {
        "triggered_scenarios": triggered,
        "total_payout":        total_payout,
        "confidence_score":    avg_confidence,
        "auto_approve":        auto_approve,
        "any_triggered":       len(triggered) > 0,
    }