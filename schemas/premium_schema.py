from pydantic import BaseModel
from typing import Optional

class PremiumRequest(BaseModel):
    user_id: str
    zone: str                        
    city: str                        
    platform: str                    
    weekly_income: float             
    shift_window: str                
    tier_preference: Optional[str] = "standard"

class RiskBreakdown(BaseModel):
    rain: float
    heat: float
    aqi: float
    fog: float
    bandh: float
    congestion: float
    outage: float

class PremiumResponse(BaseModel):
    user_id: str
    premium_amount: float            
    tier: str
    coverage_percentage: int         
    max_weekly_payout: float
    daily_income_estimate: float
    slab_shield_eligible: bool
    risk_breakdown: RiskBreakdown
    forecast_alert: str

class PayoutRequest(BaseModel):
    user_id: str
    amount: float
    reason: str
    upi_id: Optional[str] = "rider@upi"

class PayoutResponse(BaseModel):
    status: str
    payout_id: str
    amount: float
    upi_id: str
    message: str
    razorpay_status: str
class TriggerCheckRequest(BaseModel):
    user_id: str
    zone: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    platform: str
    weekly_income: float
    shift_window: str
    tier: str = "standard"
    trigger_type: Optional[str] = None  # "weather" | "aqi" | "outage"

class ScenarioResult(BaseModel):
    scenario: str
    triggered: bool
    risk_score: float
    threshold: float
    payout_amount: float
    confidence: float

class TriggerCheckResponse(BaseModel):
    user_id: str
    city: str
    any_triggered: bool
    triggered_scenarios: list[ScenarioResult]
    total_payout: float
    confidence_score: float
    auto_approve: bool
    message: str