from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from schemas.premium_schema import (
    PremiumRequest, PremiumResponse, RiskBreakdown,
    PayoutRequest, PayoutResponse,
    TriggerCheckRequest, TriggerCheckResponse, ScenarioResult,
    LockoutRequest, LockoutResponse,
)
from models.earnings_dna import earnings_profiler
from models.premium_engine import premium_engine
from models.disruption_forecast import generate_alert_text

from services.risk_scorer import get_full_risk_scores
from services.risk_aggregator import compute_final_risk
from services.trigger_engine import evaluate_triggers
from services.payout_service import simulate_upi_payout
from services.location_service import resolve_location, get_scenarios_for_trigger
from services.fraud_service import verify_final, check_kinematic_fraud
from services.lockout_service import check_lockout
from services.geo_security_service import verify_location

router = APIRouter(prefix="/api/v1/premium", tags=["Premium"])


# ─────────────────────────────────────────────
# Request models defined locally in this router
# ─────────────────────────────────────────────
class FraudRequest(BaseModel):
    user_id: str
    claim_lat: float
    claim_lon: float
    last_known_lat: float
    last_known_lon: float
    time_diff_minutes: float
    hour_of_day: Optional[int] = None


class VerifyRequest(BaseModel):
    lat1: float
    lon1: float
    lat2: float
    lon2: float


class SecurityVerifyRequest(BaseModel):
    """Used by Onboarding handleFinalSubmit → POST /api/security/verify"""
    userId: str
    name: Optional[str] = None
    mobile: Optional[str] = None
    city: str
    zone: str
    lat: float
    lng: float
    daysWorked: Optional[int] = 90
    platformMode: Optional[str] = "single"


class RiskSummaryRequest(BaseModel):
    """Used by Onboarding step 4 → POST /api/risk/summary"""
    city: str


# ─────────────────────────────────────────────
# PREMIUM CALCULATION
# ─────────────────────────────────────────────
@router.post("/calculate", response_model=PremiumResponse)
async def calculate_premium(req: PremiumRequest):
    # Step 1 — Earnings DNA
    dna = earnings_profiler.estimate_daily_income(
        req.weekly_income, req.city, req.platform, req.shift_window
    )

    # Step 2 — Live risk scores
    risk_scores = await get_full_risk_scores(req.city)
    final_risk  = compute_final_risk(risk_scores, req.city)
    risk_score  = final_risk["risk_score"]

    # Step 3 — ML premium
    result  = premium_engine.calculate(
        req.weekly_income, req.city, req.zone, req.platform,
        req.shift_window, req.tier_preference, risk_scores,
    )
    premium = result["premium_amount"]

    if risk_score > 0.7:
        premium *= 1.1
    elif risk_score < 0.4:
        premium *= 0.9
    premium = round(premium, 2)
    result["premium_amount"] = premium

    # Step 4 — Max payout
    daily_payout     = dna["daily_income_estimate"] * (result["coverage_percentage"] / 100)
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


# ─────────────────────────────────────────────
# PAYOUT
# ─────────────────────────────────────────────
@router.post("/payout", response_model=PayoutResponse)
def trigger_payout(req: PayoutRequest):
    result = simulate_upi_payout(
        user_id=req.user_id,
        amount=req.amount,
        reason=req.reason,
        upi_id=req.upi_id,
    )
    return PayoutResponse(**result)


# ─────────────────────────────────────────────
# TRIGGER CHECK
# ─────────────────────────────────────────────
@router.post("/trigger-check", response_model=TriggerCheckResponse)
async def check_triggers(req: TriggerCheckRequest):
    if req.lat is not None and req.lon is not None:
        location = resolve_location(req.lat, req.lon)
        city = location["city"]
        zone = location["zone"]
    else:
        city = req.city or "mumbai"
        zone = req.zone or "kurla"

    scenarios   = get_scenarios_for_trigger(req.trigger_type)
    risk_scores = await get_full_risk_scores(city)
    final_risk  = compute_final_risk(risk_scores, city)
    risk_score  = final_risk["risk_score"]

    result = evaluate_triggers(risk_scores, req.weekly_income, req.tier,
                               scenarios_to_check=scenarios)

    if risk_score > 0.7:
        result["auto_approve"]      = True
        result["confidence_score"]  = max(result["confidence_score"], 0.9)

    if not result["any_triggered"]:
        message = "No disruptions detected in your zone. Stay safe."
    elif result["auto_approve"]:
        message = f"₹{result['total_payout']:.0f} credited to your UPI. Stay safe."
    else:
        message = "Your payout is under quick review. We'll update you shortly."

    scenario_results = [ScenarioResult(**s) for s in result["triggered_scenarios"]]

    return TriggerCheckResponse(
        user_id=req.user_id,
        city=city,
        any_triggered=result["any_triggered"],
        triggered_scenarios=scenario_results,
        total_payout=result["total_payout"],
        confidence_score=result["confidence_score"],
        auto_approve=result["auto_approve"],
        message=message,
    )


# ─────────────────────────────────────────────
# FRAUD CHECK
# Called by the trigger engine evaluator (Node.js) with:
#   { user_id, claim_lat, claim_lon, last_known_lat, last_known_lon,
#     time_diff_minutes, hour_of_day }
# Returns: { is_fraud: bool, flag_reason: str|None }
# ─────────────────────────────────────────────
@router.post("/fraud-check")
async def fraud_check(req: FraudRequest):
    result = await verify_final(
        user_id=req.user_id,
        frame_b64="stub",
        relationships=[],
        claim_lat=req.claim_lat,
        claim_lon=req.claim_lon,
        last_lat=req.last_known_lat,
        last_lon=req.last_known_lon,
        time_diff_minutes=req.time_diff_minutes,
    )
    return result


# ─────────────────────────────────────────────
# LOCKOUT CHECK
# ─────────────────────────────────────────────
@router.post("/lockout-check", response_model=LockoutResponse)
async def lockout_check(req: LockoutRequest):
    result = await check_lockout(
        city=req.city,
        zone=req.zone,
        lat=req.lat,
        lon=req.lon,
    )
    return LockoutResponse(**result)


# ─────────────────────────────────────────────
# SECURITY VERIFY  ← called by Onboarding handleFinalSubmit
# POST /api/v1/premium/security/verify
# Proxied from backend /api/security/verify by main.py
# ─────────────────────────────────────────────
@router.post("/security/verify")
async def security_verify(req: SecurityVerifyRequest):
    lockout_result = await check_lockout(
        city=req.city,
        zone=req.zone,
        lat=req.lat,
        lon=req.lng,
    )
    is_locked = lockout_result.get("lockout_active", False)
    return {
        "is_locked": is_locked,
        "status":    "locked" if is_locked else "secure",
        "reason":    lockout_result.get("reason", "ALL_CLEAR"),
        "city":      lockout_result.get("city", req.city),
        "zone":      lockout_result.get("zone", req.zone),
    }


# ─────────────────────────────────────────────
# RISK SUMMARY  ← called by Onboarding step 4 + Dashboard polling
# POST /api/v1/premium/risk/summary
# GET  /api/v1/premium/risk/summary/{user_id}
# ─────────────────────────────────────────────
@router.post("/risk/summary")
async def risk_summary_post(req: RiskSummaryRequest):
    risk_scores = await get_full_risk_scores(req.city)
    return compute_final_risk(risk_scores, req.city)


@router.get("/risk/summary/{user_id}")
async def risk_summary_get(user_id: str, city: str = "mumbai"):
    risk_scores = await get_full_risk_scores(city)
    return compute_final_risk(risk_scores, city)


# ─────────────────────────────────────────────
# SECURITY STATUS  ← called by Dashboard polling
# GET /api/v1/premium/security/status/{user_id}
# Requires lat/lon query params for live check; defaults to secure if missing
# ─────────────────────────────────────────────
@router.get("/security/status/{user_id}")
async def security_status(
    user_id: str,
    city: str = "mumbai",
    zone: str = "kurla",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
):
    lockout_result = await check_lockout(city=city, zone=zone, lat=lat, lon=lon)
    is_locked = lockout_result.get("lockout_active", False)
    return {
        "is_locked": is_locked,
        "status":    "locked" if is_locked else "secure",
        "reason":    lockout_result.get("reason", "ALL_CLEAR"),
    }


# ─────────────────────────────────────────────
# VERIFY (distance check only)
# ─────────────────────────────────────────────
@router.post("/verify")
async def verify(req: VerifyRequest):
    return verify_location(req.lat1, req.lon1, req.lat2, req.lon2)


# ─────────────────────────────────────────────
# RISK SIGNAL
# ─────────────────────────────────────────────
@router.get("/risk-signal")
def risk_signal():
    from data.financial_stress_test import run
    return run()


# ─────────────────────────────────────────────
# PREDICT RISK  ← ML live scoring
# ─────────────────────────────────────────────
@router.get("/predict-risk")
async def predict_risk(city: str = "mumbai"):
    risk_scores = await get_full_risk_scores(city)
    final       = compute_final_risk(risk_scores, city)
    return {
        "city":               city,
        "risk_score":         final["risk_score"],
        "claim_probability":  final["claim_probability"],
        "risk_tier":          final["risk_tier"],
        "lockout_recommended": final["lockout_recommended"],
        "risk_breakdown":     risk_scores,
    }
