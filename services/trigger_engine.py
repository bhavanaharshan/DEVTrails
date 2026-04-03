THRESHOLDS = {
    "rain":       0.50,
    "heat":       0.45,
    "aqi":        0.55,
    "fog":        0.50,
    "bandh":      0.45,
    "congestion": 0.60,
    "outage":     0.50,
}

COVERAGE_MAP = {
    "basic":    0.60,
    "standard": 0.70,
    "full":     0.80,
}

def evaluate_triggers(
    risk_scores: dict,
    weekly_income: float,
    tier: str,
    scenarios_to_check: list = None   # None = check all 7
) -> dict:

    daily_income  = weekly_income / 7
    coverage      = COVERAGE_MAP.get(tier, 0.70)
    daily_payout  = daily_income * coverage

    # Filter to only relevant scenarios for this trigger type
    if scenarios_to_check is None:
        scenarios_to_check = list(THRESHOLDS.keys())

    triggered      = []
    total_payout   = 0.0
    confidence_sum = 0.0

    for scenario in scenarios_to_check:
        threshold = THRESHOLDS.get(scenario)
        if threshold is None:
            continue

        score = risk_scores.get(scenario, 0.0)

        if score >= threshold:
            margin     = (score - threshold) / (1.0 - threshold)
            confidence = round(min(0.70 + (margin * 0.30), 1.0), 2)

            payout = daily_payout
            if tier in ["standard", "full"] and scenario in ["rain", "bandh"]:
                payout = payout * 1.15

            payout         = round(payout, 2)
            total_payout  += payout
            confidence_sum += confidence

            triggered.append({
                "scenario":      scenario,
                "triggered":     True,
                "risk_score":    round(score, 2),
                "threshold":     threshold,
                "payout_amount": payout,
                "confidence":    confidence,
            })

    # Cap at 3 per week
    triggered     = sorted(triggered, key=lambda x: x["risk_score"], reverse=True)[:3]
    total_payout  = round(sum(t["payout_amount"] for t in triggered), 2)
    avg_confidence = round(
        confidence_sum / len(triggered) if triggered else 0.0, 2
    )
    auto_approve  = avg_confidence >= 0.85

    return {
        "triggered_scenarios": triggered,
        "total_payout":        total_payout,
        "confidence_score":    avg_confidence,
        "auto_approve":        auto_approve,
        "any_triggered":       len(triggered) > 0,
    }