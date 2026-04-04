from fastapi import APIRouter
from schemas.premium_schema import (
    PremiumRequest, PremiumResponse, RiskBreakdown,
    PayoutRequest, PayoutResponse,
    TriggerCheckRequest, TriggerCheckResponse, ScenarioResult
)
from models.earnings_dna import earnings_profiler
from models.premium_engine import premium_engine
from models.disruption_forecast import generate_alert_text
from services.risk_scorer import get_full_risk_scores
from services.trigger_engine import evaluate_triggers
from services.payout_service import simulate_upi_payout
from services.location_service import resolve_location, get_scenarios_for_trigger
router = APIRouter(prefix="/api/v1/premium", tags=["Premium"])


# ✅ FIXED: made async (important)
@router.post("/calculate", response_model=PremiumResponse)
async def calculate_premium(req: PremiumRequest):

    # Step 1 — Earnings DNA
    dna = earnings_profiler.estimate_daily_income(
        req.weekly_income, req.city, req.platform, req.shift_window
    )

    # Step 2 — Disruption forecast scores (async)
    risk_scores = await get_full_risk_scores(req.city)

    # Step 3 — Premium calculation
    result = premium_engine.calculate(
        req.weekly_income, req.city, req.zone, req.platform,
        req.shift_window, req.tier_preference, risk_scores
    )

    # Step 4 — Max payout
    daily_payout = dna["daily_income_estimate"] * (result["coverage_percentage"] / 100)
    max_weekly_payout = round(daily_payout * 3, 2)

    # Step 5 — Alert text
    alert = generate_alert_text(req.city, risk_scores, result["premium_amount"])

    return PremiumResponse(
        user_id=req.user_id,
        premium_amount=result["premium_amount"],
        tier=result["tier"],
        coverage_percentage=result["coverage_percentage"],
        max_weekly_payout=max_weekly_payout,
        daily_income_estimate=dna["daily_income_estimate"],
        slab_shield_eligible=dna["slab_shield_eligible"],
        risk_breakdown=RiskBreakdown(**risk_scores),
        forecast_alert=alert,
    )


# ✅ payout endpoint (no changes needed)
@router.post("/payout", response_model=PayoutResponse)
def trigger_payout(req: PayoutRequest):
    result = simulate_upi_payout(
        user_id=req.user_id,
        amount=req.amount,
        reason=req.reason,
        upi_id=req.upi_id,
    )
    return PayoutResponse(**result)


# ✅ already correct (async)
from services.location_service import resolve_location, get_scenarios_for_trigger

@router.post("/trigger-check", response_model=TriggerCheckResponse)
async def check_triggers(req: TriggerCheckRequest):

    # Resolve location — accept either lat/lon OR city/zone
    if req.lat is not None and req.lon is not None:
        location = resolve_location(req.lat, req.lon)
        city     = location["city"]
        zone     = location["zone"]
    else:
        city = req.city or "mumbai"
        zone = req.zone or "kurla_mumbai"

    # Get scenarios relevant to Sam's trigger_type
    scenarios = get_scenarios_for_trigger(req.trigger_type)

    # Get live risk scores
    risk_scores = await get_full_risk_scores(city)

    # Evaluate only the relevant scenarios
    result = evaluate_triggers(
        risk_scores, req.weekly_income, req.tier,
        scenarios_to_check=scenarios
    )

    if not result["any_triggered"]:
        message = "No disruptions detected in your zone. Stay safe."
    elif result["auto_approve"]:
        message = f"₹{result['total_payout']:.0f} credited to your UPI. Stay safe."
    else:
        message = "Your payout is under quick review. We'll update you shortly."

    scenario_results = [ScenarioResult(**s) for s in result["triggered_scenarios"]]

    return TriggerCheckResponse(
        user_id             = req.user_id,
        city                = city,
        any_triggered       = result["any_triggered"],
        triggered_scenarios = scenario_results,
        total_payout        = result["total_payout"],
        confidence_score    = result["confidence_score"],
        auto_approve        = result["auto_approve"],
        message             = message,
    )