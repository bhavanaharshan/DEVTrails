
from services.risk_aggregator import compute_final_risk
from fastapi import APIRouter
from pydantic import BaseModel
from schemas.premium_schema import LockoutRequest, LockoutResponse
from services.lockout_service import check_lockout

from schemas.premium_schema import (
    PremiumRequest, PremiumResponse, RiskBreakdown,
    PayoutRequest, PayoutResponse,
    TriggerCheckRequest, TriggerCheckResponse, ScenarioResult,
    LockoutRequest, LockoutResponse   # ✅ ADD THIS LINE
)
from models.earnings_dna import earnings_profiler
from models.premium_engine import premium_engine
from models.disruption_forecast import generate_alert_text

from services.risk_scorer import get_full_risk_scores
from services.trigger_engine import evaluate_triggers
from services.payout_service import simulate_upi_payout
from services.location_service import resolve_location, get_scenarios_for_trigger
from data.financial_stress_test import run_14day_monsoon_stress, get_risk_signal
# ✅ NEW: fraud service import
from services.fraud_service import check_kinematic_fraud
from data.financial_stress_test import run as run_bcr_test
from data.generate_bcr_report import main as generate_bcr_pdf

from services.geo_security_service import verify_location
from pydantic import BaseModel
router = APIRouter(prefix="/api/v1/premium", tags=["Premium"])


# =========================
# ✅ FRAUD REQUEST MODEL
# =========================
class FraudRequest(BaseModel):
    user_id: str
    claim_lat: float
    claim_lon: float
    last_known_lat: float
    last_known_lon: float
    time_diff_minutes: float
    hour_of_day: int | None = None

class VerifyRequest(BaseModel):
    lat1: float
    lon1: float
    lat2: float
    lon2: float


# =========================
# ✅ PREMIUM CALCULATION
# =========================
@router.post("/calculate", response_model=PremiumResponse)
async def calculate_premium(req: PremiumRequest):

    # Step 1 — Earnings DNA
    dna = earnings_profiler.estimate_daily_income(
        req.weekly_income, req.city, req.platform, req.shift_window
    )

    # Step 2 — Disruption forecast scores (async)
    risk_scores = await get_full_risk_scores(req.city)
    final_risk = compute_final_risk(risk_scores, req.city)
    risk_score = final_risk["risk_score"]

    # Step 3 — Premium calculation
    result = premium_engine.calculate(
        req.weekly_income, req.city, req.zone, req.platform,
        req.shift_window, req.tier_preference, risk_scores
    )
    premium = result["premium_amount"]

    if risk_score > 0.7:
        premium *= 1.1
    elif risk_score < 0.4:
        premium *= 0.9

    premium = round(premium, 2)
    result["premium_amount"] = premium

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


# =========================
# ✅ PAYOUT
# =========================
@router.post("/payout", response_model=PayoutResponse)
def trigger_payout(req: PayoutRequest):
    result = simulate_upi_payout(
        user_id=req.user_id,
        amount=req.amount,
        reason=req.reason,
        upi_id=req.upi_id,
    )
    return PayoutResponse(**result)


# =========================
# ✅ TRIGGER CHECK
# =========================
@router.post("/trigger-check", response_model=TriggerCheckResponse)
async def check_triggers(req: TriggerCheckRequest):

    if req.lat is not None and req.lon is not None:
        location = resolve_location(req.lat, req.lon)
        city     = location["city"]
        zone     = location["zone"]
    else:
        city = req.city or "mumbai"
        zone = req.zone or "kurla_mumbai"

    scenarios = get_scenarios_for_trigger(req.trigger_type)

    risk_scores = await get_full_risk_scores(city)
    final_risk = compute_final_risk(risk_scores, city)
    risk_score = final_risk["risk_score"]

    result = evaluate_triggers(
        risk_scores, req.weekly_income, req.tier,
        scenarios_to_check=scenarios
    )
    if risk_score > 0.7:
        result["auto_approve"] = True
        result["confidence_score"] = max(result["confidence_score"], 0.9)

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


# =========================
# 🚨 FRAUD CHECK (NEW)
# =========================
@router.post("/fraud-check")
async def fraud_check(req: FraudRequest):

    result = await verify_final_api({
    "user_id": req.user_id,
    "frame_b64": "dummy_for_now",
    "relationships": [],
    "claim_lat": req.claim_lat,
    "claim_lon": req.claim_lon,
    "last_lat": req.last_known_lat,
    "last_lon": req.last_known_lon,
    "time_diff_minutes": req.time_diff_minutes
})

    return result

# =========================
# 🚫 LOCKOUT CHECK
# =========================
@router.post("/lockout-check", response_model=LockoutResponse)
async def lockout_check(req: LockoutRequest):
    result = await check_lockout(
        city=req.city,
        zone=req.zone,
        lat=req.lat,
        lon=req.lon
    )
    return LockoutResponse(**result)


# =========================
# 📊 RISK SIGNAL (NEW)
# =========================
@router.get("/risk-signal")
def risk_signal():
    from data.financial_stress_test import run

    result = run()  # make sure run() RETURNS data
    return result
@router.get("/run-bcr")
async def run_bcr():
    result = run_bcr_test()

    # generate chart + PDF
    generate_bcr_pdf()

    return {
        "message": "BCR test completed and report generated",
        "data": result
    }
@router.post("/verify")
async def verify(req: VerifyRequest):
    result = verify_location(
        req.lat1,
        req.lon1,
        req.lat2,
        req.lon2
    )
    return result
@router.post("/verify-user")
def verify_user_api(data: dict):
    from services.fraud_service import verify_user

    return verify_user(
        data["user_id"],
        data["frame_b64"],
        data.get("relationships", [])
    )
@router.post("/verify-final")
async def verify_final_api(data: dict):
    from services.fraud_service import verify_final

    return await verify_final(
        user_id=data["user_id"],
        frame_b64=data["frame_b64"],
        relationships=data.get("relationships", []),
        claim_lat=data["claim_lat"],
        claim_lon=data["claim_lon"],
        last_lat=data["last_lat"],
        last_lon=data["last_lon"],
        time_diff_minutes=data["time_diff_minutes"]
    )
# =========================
# 🤖 ML RISK PREDICTION (NEW)
# =========================
@router.get("/predict-risk")
async def predict_risk(city: str = "mumbai"):
    """
    Live ML-style risk scoring endpoint
    """

    # Step 1 — get scenario risks (you already built this)
    risk_scores = await get_full_risk_scores(city)

    # Step 2 — aggregate into final ML score
    final = compute_final_risk(risk_scores, city)

    return {
        "city": city,
        "risk_score": final["risk_score"],
        "claim_probability": final["claim_probability"],
        "risk_tier": final["risk_tier"],
        "lockout_recommended": final["lockout_recommended"],
        "risk_breakdown": risk_scores
    }