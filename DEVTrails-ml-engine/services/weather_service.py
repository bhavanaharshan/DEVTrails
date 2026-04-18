import httpx

CITY_COORDINATES = {
    "mumbai":  {"lat": 19.0760, "lon": 72.8777},
    "delhi":   {"lat": 28.6139, "lon": 77.2090},
    "lucknow": {"lat": 26.8467, "lon": 80.9462},
    "chennai": {"lat": 13.0827, "lon": 80.2707},
}

async def get_weather_risk(city: str) -> dict:
    coords = CITY_COORDINATES.get(city, CITY_COORDINATES["mumbai"])

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={coords['lat']}&longitude={coords['lon']}"
        f"&daily=precipitation_sum,temperature_2m_max,visibility_mean"
        f"&forecast_days=7&timezone=Asia/Kolkata"
    )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            data = resp.json().get("daily", {})

        avg_rain = sum(data.get("precipitation_sum", [0])) / 7
        max_temp = max(data.get("temperature_2m_max", [30]))
        avg_vis  = sum(data.get("visibility_mean", [10000])) / 7

        rain_risk = min(avg_rain / 50.0, 1.0)
        heat_risk = min(max((max_temp - 35) / 15, 0), 1.0)
        fog_risk  = min(max((200 - avg_vis) / 200, 0), 1.0)

        return {
            "rain": round(rain_risk, 2),
            "heat": round(heat_risk, 2),
            "fog":  round(fog_risk, 2),
        }

    except Exception:
        return {"rain": 0.25, "heat": 0.25, "fog": 0.15}