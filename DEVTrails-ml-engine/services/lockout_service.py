import httpx
from datetime import datetime

from services.risk_scorer import get_full_risk_scores
from services.risk_aggregator import compute_final_risk

# ── City coordinates ─────────────────────────────────────────
CITY_COORDINATES = {
    "mumbai":  {"lat": 19.0760, "lon": 72.8777},
    "delhi":   {"lat": 28.6139, "lon": 77.2090},
    "lucknow": {"lat": 26.8467, "lon": 80.9462},
    "chennai": {"lat": 13.0827, "lon": 80.2707},
}

# ── Weather thresholds (red alerts) ─────────────────────────
RAIN_RED_ALERT_MM = 20.0
HEAT_RED_ALERT_C  = 42.0


# ── MAIN LOCKOUT FUNCTION ───────────────────────────────────
async def check_lockout(city: str, zone: str, lat: float = None, lon: float = None) -> dict:
    """
    Hybrid Lockout Engine:
    1. Weather-based red alert detection (48h forecast)
    2. ML-based risk scoring fallback

    Returns:
    - lockout_active (bool)
    - manual_review (optional)
    - reason (str)
    - risk_score (optional)
    """

    coords = CITY_COORDINATES.get(city, CITY_COORDINATES["mumbai"])

    # Override with user GPS if available
    if lat and lon:
        coords = {"lat": lat, "lon": lon}

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={coords['lat']}&longitude={coords['lon']}"
        f"&daily=precipitation_sum,temperature_2m_max"
        f"&forecast_days=3&timezone=Asia/Kolkata"
    )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            data = resp.json().get("daily", {})

        dates     = data.get("time", [])
        rain_days = data.get("precipitation_sum", [])
        temp_days = data.get("temperature_2m_max", [])

        today = datetime.now().strftime("%Y-%m-%d")

        # ── STEP 1: Weather-based lockout ───────────────────
        for i, date in enumerate(dates[:2]):  # next 48 hours
            if date <= today:
                continue

            rain = rain_days[i] if i < len(rain_days) and rain_days[i] else 0
            temp = temp_days[i] if i < len(temp_days) and temp_days[i] else 30

            hours_until = (i + 1) * 24

            if rain >= RAIN_RED_ALERT_MM:
                return {
                    "lockout_active": True,
                    "zone": zone,
                    "city": city,
                    "reason": f"Heavy rain forecast ({rain:.1f}mm) within {hours_until}h.",
                    "forecast_rain_mm": round(rain, 1),
                    "forecast_temp_c": round(temp, 1),
                    "hours_until_alert": hours_until,
                    "source": "weather"
                }

            if temp >= HEAT_RED_ALERT_C:
                return {
                    "lockout_active": True,
                    "zone": zone,
                    "city": city,
                    "reason": f"Extreme heat forecast ({temp:.1f}°C) within {hours_until}h.",
                    "forecast_rain_mm": round(rain, 1),
                    "forecast_temp_c": round(temp, 1),
                    "hours_until_alert": hours_until,
                    "source": "weather"
                }

        # ── STEP 2: ML Risk-based decision ───────────────────
        risk_scores = await get_full_risk_scores(city)
        final_risk  = compute_final_risk(risk_scores, city)

        risk_score = final_risk["risk_score"]

        if risk_score >= 0.80:
            return {
                "lockout_active": True,
                "zone": zone,
                "city": city,
                "reason": f"Extreme ML risk ({risk_score}). Lockout enforced.",
                "risk_score": risk_score,
                "source": "ml_engine"
            }

        elif risk_score >= 0.60:
            return {
                "lockout_active": False,
                "zone": zone,
                "city": city,
                "reason": f"Elevated ML risk ({risk_score}). Flagged for review.",
                "risk_score": risk_score,
                "manual_review": True,
                "source": "ml_engine"
            }

        # ── STEP 3: Safe fallback ───────────────────────────
        return {
            "lockout_active": False,
            "zone": zone,
            "city": city,
            "reason": "No red alert and ML risk is safe.",
            "forecast_rain_mm": round(rain_days[1] if len(rain_days) > 1 and rain_days[1] else 0, 1),
            "forecast_temp_c": round(temp_days[1] if len(temp_days) > 1 and temp_days[1] else 30, 1),
            "risk_score": risk_score,
            "hours_until_alert": None,
            "source": "hybrid"
        }

    except Exception:
        # ── FAIL-SAFE: Always allow if APIs fail ───────────
        return {
            "lockout_active": False,
            "zone": zone,
            "city": city,
            "reason": "Forecast unavailable. Allowing policy activation.",
            "source": "fail_safe"
        }