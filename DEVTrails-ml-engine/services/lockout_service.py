import httpx
from datetime import datetime

CITY_COORDINATES = {
    "mumbai":  {"lat": 19.0760, "lon": 72.8777},
    "delhi":   {"lat": 28.6139, "lon": 77.2090},
    "lucknow": {"lat": 26.8467, "lon": 80.9462},
    "chennai": {"lat": 13.0827, "lon": 80.2707},
}

# Thresholds that constitute a red alert
RAIN_RED_ALERT_MM    = 20.0   # mm/day forecast
HEAT_RED_ALERT_C     = 42.0   # degrees celsius
AQI_RED_ALERT        = 200.0  # PM2.5

async def check_lockout(city: str, zone: str, lat: float = None, lon: float = None) -> dict:
    """
    Checks Open-Meteo 48-hour forecast.
    If a red alert condition is predicted, locks out new policy creation.
    """
    coords = CITY_COORDINATES.get(city, CITY_COORDINATES["mumbai"])
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

        dates      = data.get("time", [])
        rain_days  = data.get("precipitation_sum", [])
        temp_days  = data.get("temperature_2m_max", [])

        today = datetime.now().strftime("%Y-%m-%d")

        # Check next 2 days (48 hours) only
        for i, date in enumerate(dates[:2]):
            if date <= today:
                continue

            rain = rain_days[i] if i < len(rain_days) else 0
            temp = temp_days[i] if i < len(temp_days) else 30
            rain = rain if rain is not None else 0
            temp = temp if temp is not None else 30

            hours_until = (i + 1) * 24

            if rain >= RAIN_RED_ALERT_MM:
                return {
                    "lockout_active":    True,
                    "zone":              zone,
                    "city":              city,
                    "reason":            f"Heavy rain forecasted ({rain:.1f}mm) within {hours_until} hours. New policies blocked for this zone.",
                    "forecast_rain_mm":  round(rain, 1),
                    "forecast_temp_c":   round(temp, 1),
                    "hours_until_alert": hours_until,
                }

            if temp >= HEAT_RED_ALERT_C:
                return {
                    "lockout_active":    True,
                    "zone":              zone,
                    "city":              city,
                    "reason":            f"Extreme heat forecasted ({temp:.1f}°C) within {hours_until} hours. New policies blocked for this zone.",
                    "forecast_rain_mm":  round(rain, 1),
                    "forecast_temp_c":   round(temp, 1),
                    "hours_until_alert": hours_until,
                }

        return {
            "lockout_active":    False,
            "zone":              zone,
            "city":              city,
            "reason":            "No red alert forecasted in next 48 hours. Policy activation allowed.",
            "forecast_rain_mm":  round(rain_days[1] if len(rain_days) > 1 and rain_days[1] else 0, 1),
            "forecast_temp_c":   round(temp_days[1] if len(temp_days) > 1 and temp_days[1] else 30, 1),
            "hours_until_alert": None,
        }

    except Exception as e:
        # Fail open — if API is unreachable, don't block workers
        return {
            "lockout_active":    False,
            "zone":              zone,
            "city":              city,
            "reason":            "Forecast unavailable. Policy activation allowed.",
            "forecast_rain_mm":  None,
            "forecast_temp_c":   None,
            "hours_until_alert": None,
        }