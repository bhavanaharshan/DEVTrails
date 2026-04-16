"""
GigShield Financial Stress Test — FINAL VERSION
"""

import httpx
import json
import os
from datetime import datetime, timedelta

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "stress_test_report.json")

# ── Zone definitions ──────────────────────────────────────────
CITY_POOL = [
    {"zone": "kurla_mumbai", "city": "mumbai", "lat": 19.0596, "lon": 72.8295, "count": 120, "avg_weekly_income": 4500, "tier": "standard"},
    {"zone": "andheri_mumbai", "city": "mumbai", "lat": 19.1136, "lon": 72.8697, "count": 80, "avg_weekly_income": 4200, "tier": "standard"},
    {"zone": "powai_mumbai", "city": "mumbai", "lat": 19.1197, "lon": 72.9051, "count": 60, "avg_weekly_income": 4000, "tier": "basic"},
    {"zone": "central_delhi", "city": "delhi", "lat": 28.6271, "lon": 77.2217, "count": 100, "avg_weekly_income": 4800, "tier": "full"},
    {"zone": "south_delhi", "city": "delhi", "lat": 28.5355, "lon": 77.2100, "count": 70, "avg_weekly_income": 4600, "tier": "standard"},
    {"zone": "central_lucknow", "city": "lucknow", "lat": 26.8467, "lon": 80.9462, "count": 40, "avg_weekly_income": 3800, "tier": "basic"},
    {"zone": "central_chennai", "city": "chennai", "lat": 13.0827, "lon": 80.2707, "count": 30, "avg_weekly_income": 4100, "tier": "standard"},
]

# ── UPDATED Tier config ─────────────────────────────────────
TIER_CONFIG = {
    "basic":    {"premium_rate": 0.018, "coverage": 0.65, "floor": 49, "cap": 79},
    "standard": {"premium_rate": 0.028, "coverage": 0.75, "floor": 79, "cap": 109},
    "full":     {"premium_rate": 0.032, "coverage": 0.80, "floor": 99, "cap": 149},
}

# ── Claim realism ─────────────────────────────────────────────
CLAIM_SUCCESS_RATE = 0.85

# ── Weather thresholds ────────────────────────────────────────
RAIN_THRESHOLD_MM = 25.0
HEAT_THRESHOLD_C = 44.0
FOG_THRESHOLD_M = 100.0

# ── Financial params ──────────────────────────────────────────
RESERVE_WEEKS = 8
TARGET_BCR = 0.65
REINSURANCE_COVER = 0.50
STRESS_DAYS = 14


# ── Risk Signal Logic ─────────────────────────────────────────
def get_risk_signal(bcr: float):
    if bcr > 0.75:
        return "HIGH_RISK"
    elif bcr > 0.65:
        return "MEDIUM_RISK"
    else:
        return "LOW_RISK"


# ── Fetch weather ─────────────────────────────────────────────
def fetch_3yr_weather(lat, lon, zone):
    end_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=365 * 3)).strftime("%Y-%m-%d")

    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&daily=precipitation_sum,temperature_2m_max,visibility_mean"
        f"&timezone=Asia/Kolkata"
    )

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url)
            return resp.json().get("daily", {})
    except:
        return {}


# ── Trigger analysis ──────────────────────────────────────────
def count_real_trigger_days(weather):
    dates = weather.get("time", [])
    rain_days = weather.get("precipitation_sum", [])
    temp_days = weather.get("temperature_2m_max", [])
    vis_days = weather.get("visibility_mean", [])

    triggered_flags = []

    for i in range(len(dates)):
        rain = rain_days[i] if i < len(rain_days) and rain_days[i] else 0
        temp = temp_days[i] if i < len(temp_days) and temp_days[i] else 30
        vis = vis_days[i] if i < len(vis_days) and vis_days[i] else 10000

        triggered_flags.append(
            rain >= RAIN_THRESHOLD_MM
            or temp >= HEAT_THRESHOLD_C
            or vis <= FOG_THRESHOLD_M
        )

    weekly_triggers = []
    for i in range(0, len(triggered_flags), 7):
        weekly_triggers.append(min(sum(triggered_flags[i:i+7]), 2))

    return {
        "avg_trigger_days_week": sum(weekly_triggers) / max(len(weekly_triggers), 1),
        "worst_week_triggers": max(weekly_triggers) if weekly_triggers else 0
    }


# ── Financials ────────────────────────────────────────────────
def compute_zone_financials(zone, triggers):
    tier = TIER_CONFIG[zone["tier"]]
    count = zone["count"]
    income = zone["avg_weekly_income"]

    weekly_premium = min(max(income * tier["premium_rate"], tier["floor"]), tier["cap"])
    total_weekly_premium = weekly_premium * count

    daily_income = income / 7
    daily_payout = daily_income * tier["coverage"]

    avg_triggers = triggers["avg_trigger_days_week"]

    expected_claims = count * daily_payout * avg_triggers

    bcr = expected_claims / total_weekly_premium if total_weekly_premium > 0 else 0

    return {
        "total_weekly_premium": total_weekly_premium,
        "zone_bcr": round(bcr, 3)
    }


# ── Stress test ───────────────────────────────────────────────
def run_14day_monsoon_stress(all_data):
    total_daily_premium = sum(z["financials"]["total_weekly_premium"] / 7 for z in all_data)

    pool = total_daily_premium * 7 * RESERVE_WEEKS

    cumulative_claims = 0

    # ✅ NEW: store daily data
    daily_log = []

    def storm_multiplier(day):
        if day <= 3: return 0.9
        elif day <= 7: return 1.2
        elif day <= 10: return 1.4
        else: return 1.2

    for day in range(1, STRESS_DAYS + 1):
        day_claims = 0

        for z in all_data:
            zone = z["zone"]
            tier = TIER_CONFIG[zone["tier"]]
            triggers = z["triggers"]

            base_prob = (
                triggers["avg_trigger_days_week"] * 2.5 +
                triggers["worst_week_triggers"] / 7
            ) / 2

            day_prob = min(base_prob * storm_multiplier(day), 0.60)

            daily_income = zone["avg_weekly_income"] / 7
            payout = daily_income * tier["coverage"]

            workers = zone["count"] * day_prob * CLAIM_SUCCESS_RATE
            day_claims += workers * payout

        pool += total_daily_premium - day_claims
        cumulative_claims += day_claims

        # ✅ NEW: store for graph
        daily_log.append({
            "day": day,
            "claims": day_claims,
            "pool_remaining": pool
        })

    annual_premium_base = sum(
        z["financials"]["total_weekly_premium"] * 52 for z in all_data
    )

    bcr = cumulative_claims / annual_premium_base
    risk_level = get_risk_signal(bcr)

    print("\nFINAL RESULTS")
    print(f"14-day claims: ₹{cumulative_claims:,.0f}")
    print(f"Annual premium base: ₹{annual_premium_base:,.0f}")
    print(f"BCR: {bcr:.3f}")
    print(f"Risk Level: {risk_level}")

    return {
        "bcr": round(bcr, 3),
        "risk_level": risk_level,
        "claims": cumulative_claims,
        "premium_base": annual_premium_base,

        # ✅ NEW
        "stress_test": {
            "daily_log": daily_log
        }
    }


# ── Main ─────────────────────────────────────────────────────
# ── Main ─────────────────────────────────────────────────────
def run():
    all_data = []

    # ✅ NEW: zone analysis storage
    zone_analysis = []

    for zone in CITY_POOL:
        weather = fetch_3yr_weather(zone["lat"], zone["lon"], zone["zone"])
        triggers = count_real_trigger_days(weather)
        financials = compute_zone_financials(zone, triggers)

        all_data.append({
            "zone": zone,
            "triggers": triggers,
            "financials": financials
        })

        # ✅ NEW: store zone BCR
        zone_analysis.append({
            "zone": zone["zone"],
            "city": zone["city"],
            "workers": zone["count"],

    # ✅ ADD THESE
            "trigger_days_3yr": int(triggers["avg_trigger_days_week"] * 156),  # approx 3 years
            "total_days": 1095,
            "trigger_rate_pct": round(
                (triggers["avg_trigger_days_week"] / 7) * 100, 2
            ),
            "avg_trigger_wk": round(triggers["avg_trigger_days_week"], 2),

            "zone_bcr": financials["zone_bcr"]
        })

    result = run_14day_monsoon_stress(all_data)

    # ✅ NEW: attach zone analysis
    result["zone_analysis"] = zone_analysis

    with open(OUTPUT_PATH, "w") as f:
        json.dump(result, f, indent=2)

    return result


if __name__ == "__main__":
    run()