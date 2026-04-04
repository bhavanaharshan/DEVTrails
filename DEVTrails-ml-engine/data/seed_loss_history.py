"""
One-time script to seed zone_loss_history.json with REAL historical data.
Pulls 12 weeks of actual weather + AQI from Open-Meteo and OpenAQ.
Run once: python data/seed_loss_history.py
"""

import httpx
import json
import os
from datetime import datetime, timedelta

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "zone_loss_history.json")

# ✅ Updated ZONES (added Kerala, Bangalore, Hyderabad)
ZONES = [
    # Mumbai
    {"city": "mumbai",  "zone": "kurla_mumbai",    "lat": 19.0596, "lon": 72.8295, "weekly_income": 4500},
    {"city": "mumbai",  "zone": "andheri_mumbai",  "lat": 19.1136, "lon": 72.8697, "weekly_income": 4200},
    {"city": "mumbai",  "zone": "powai_mumbai",    "lat": 19.1197, "lon": 72.9051, "weekly_income": 4000},

    # Delhi
    {"city": "delhi",   "zone": "central_delhi",   "lat": 28.6271, "lon": 77.2217, "weekly_income": 4800},
    {"city": "delhi",   "zone": "south_delhi",     "lat": 28.5355, "lon": 77.2100, "weekly_income": 4600},

    # Lucknow
    {"city": "lucknow", "zone": "central_lucknow", "lat": 26.8467, "lon": 80.9462, "weekly_income": 3800},

    # Chennai
    {"city": "chennai", "zone": "central_chennai", "lat": 13.0827, "lon": 80.2707, "weekly_income": 4100},

    # ✅ Kerala (Kochi)
    {"city": "kerala",  "zone": "kochi_kerala",     "lat": 9.9312,  "lon": 76.2673, "weekly_income": 3500},

    # ✅ Kerala (Ottappalam - optional, closer to you)
    {"city": "kerala",  "zone": "ottappalam_kerala","lat": 10.7730, "lon": 76.3776, "weekly_income": 3000},

    # ✅ Bangalore
    {"city": "bangalore", "zone": "central_bangalore", "lat": 12.9716, "lon": 77.5946, "weekly_income": 4200},

    # ✅ Hyderabad
    {"city": "hyderabad", "zone": "central_hyderabad", "lat": 17.3850, "lon": 78.4867, "weekly_income": 4000},
]

# Trigger thresholds
RAIN_THRESHOLD_MM  = 25.0
HEAT_THRESHOLD_C   = 44.0
FOG_THRESHOLD_M    = 100.0
AQI_THRESHOLD      = 250.0

COVERAGE_RATE      = 0.70
MAX_TRIGGER_DAYS   = 3

def get_date_range_12_weeks():
    end   = datetime.now() - timedelta(days=1)
    start = end - timedelta(weeks=12)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")

def fetch_weather_history(lat: float, lon: float, start: str, end: str) -> dict:
    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}"
        f"&start_date={start}&end_date={end}"
        f"&daily=precipitation_sum,temperature_2m_max,visibility_mean"
        f"&timezone=Asia/Kolkata"
    )
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url)
            return resp.json().get("daily", {})
    except Exception as e:
        print(f"  Weather fetch failed: {e}")
        return {}

def fetch_aqi_history(lat: float, lon: float, start: str, end: str) -> list:
    url = (
        f"https://api.openaq.org/v2/measurements"
        f"?coordinates={lat},{lon}&radius=25000"
        f"&parameter=pm25"
        f"&date_from={start}T00:00:00Z"
        f"&date_to={end}T23:59:59Z"
        f"&limit=500"
    )
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url, headers={"accept": "application/json"})
            return resp.json().get("results", [])
    except Exception as e:
        print(f"  AQI fetch failed: {e}")
        return []

def calculate_weekly_losses(weather: dict, aqi_results: list, weekly_income: float) -> list:
    dates     = weather.get("time", [])
    rain_days = weather.get("precipitation_sum", [])
    temp_days = weather.get("temperature_2m_max", [])
    vis_days  = weather.get("visibility_mean", [])

    if not dates:
        return []

    aqi_by_date = {}
    for r in aqi_results:
        try:
            date_str = r["date"]["utc"][:10]
            val      = r.get("value", 0)
            aqi_by_date.setdefault(date_str, []).append(val)
        except Exception:
            continue

    daily_income = weekly_income / 7
    daily_payout = daily_income * COVERAGE_RATE
    weekly_data  = []

    for week_start in range(0, len(dates) - 6, 7):
        week_dates = dates[week_start: week_start + 7]
        if len(week_dates) < 7:
            break

        trigger_days  = 0
        expected_days = 0

        for i, date in enumerate(week_dates):
            idx = week_start + i

            rain  = rain_days[idx]  if idx < len(rain_days)  else 0
            temp  = temp_days[idx]  if idx < len(temp_days)  else 30
            vis   = vis_days[idx]   if idx < len(vis_days)   else 10000
            aqi   = sum(aqi_by_date.get(date, [0])) / max(len(aqi_by_date.get(date, [1])), 1)

            # Sanitize None values from API
            rain  = rain  if rain  is not None else 0
            temp  = temp  if temp  is not None else 30
            vis   = vis   if vis   is not None else 10000
            aqi   = aqi   if aqi   is not None else 0
            triggered = (
                rain >= RAIN_THRESHOLD_MM or
                temp >= HEAT_THRESHOLD_C  or
                vis  <= FOG_THRESHOLD_M   or
                aqi  >= AQI_THRESHOLD
            )

            if triggered:
                trigger_days += 1

            rain_prob = min(rain / 50.0, 1.0)
            heat_prob = min(max((temp - 35) / 15, 0), 1.0)
            fog_prob  = min(max((FOG_THRESHOLD_M - vis) / FOG_THRESHOLD_M, 0), 1.0)
            aqi_prob  = min(aqi / AQI_THRESHOLD, 1.0)

            day_prob = max(rain_prob, heat_prob, fog_prob, aqi_prob, 0.10)
            expected_days += day_prob

        actual_trigger_days   = min(trigger_days, MAX_TRIGGER_DAYS)
        expected_trigger_days = min(expected_days, MAX_TRIGGER_DAYS)

        actual_loss   = round(actual_trigger_days  * daily_payout, 2)
        expected_loss = round(expected_trigger_days * daily_payout, 2)

        week_label = datetime.strptime(week_dates[0], "%Y-%m-%d").strftime("%Y-%W")

        weekly_data.append({
            "week":          week_label,
            "week_start":    week_dates[0],
            "trigger_days":  actual_trigger_days,
            "expected_loss": expected_loss,
            "actual_loss":   actual_loss,
            "ratio":         round(actual_loss / expected_loss, 4) if expected_loss > 0 else 1.0
        })

    return weekly_data

def compute_multiplier(history: list) -> float:
    """
    Computes starting multiplier from full 12-week history.
    If very few trigger days (dry season), use a modest base multiplier
    so premiums don't collapse to the floor.
    """
    if not history:
        return 1.0

    total_trigger_days = sum(w["trigger_days"] for w in history)

    # Dry season — very few triggers, use modest base
    if total_trigger_days == 0:
        return 0.90   # 10% discount — genuinely safe period

    ratios = [w["ratio"] for w in history if w["expected_loss"] > 0]
    if not ratios:
        return 0.90

    avg = sum(ratios) / len(ratios)

    # Weight towards 1.0 — don't let one bad week spike premiums
    weighted = (avg * 0.7) + (1.0 * 0.3)
    return round(max(0.85, min(1.40, weighted)), 4)

def main():
    start_date, end_date = get_date_range_12_weeks()
    print(f"Fetching real data from {start_date} to {end_date}")
    print(f"Seeding {len(ZONES)} zones...\n")

    output = {}

    for zone_info in ZONES:
        city          = zone_info["city"]
        zone          = zone_info["zone"]
        lat           = zone_info["lat"]
        lon           = zone_info["lon"]
        weekly_income = zone_info["weekly_income"]
        key           = f"{city}_{zone}"

        print(f"Processing {zone} ({city})...")

        print("  Fetching weather history...")
        weather = fetch_weather_history(lat, lon, start_date, end_date)

        print("  Fetching AQI history...")
        aqi = fetch_aqi_history(lat, lon, start_date, end_date)

        history    = calculate_weekly_losses(weather, aqi, weekly_income)
        multiplier = compute_multiplier(history)

        output[key] = {
            "zone":               zone,
            "city":               city,
            "weekly_income":      weekly_income,
            "current_multiplier": multiplier,
            "last_recalibrated":  datetime.now().isoformat(),
            "data_source":        "Open-Meteo historical + OpenAQ",
            "date_range":         f"{start_date} to {end_date}",
            "history":            history
        }

        weeks    = len(history)
        triggers = sum(w["trigger_days"] for w in history)
        print(f"  Done — {weeks} weeks, {triggers} trigger days, multiplier: {multiplier}\n")

    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Saved to {OUTPUT_PATH}")
    print(f"Total zones seeded: {len(output)}")

if __name__ == "__main__":
    main()