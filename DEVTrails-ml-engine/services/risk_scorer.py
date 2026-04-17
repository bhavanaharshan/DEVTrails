from services.weather_service import get_weather_risk
from services.aqi_service import get_aqi_risk
from services.bandh_service import get_bandh_risk
from services.congestion_service import get_congestion_risk
from models.disruption_forecast import get_forecast_scores

async def get_full_risk_scores(city: str) -> dict:

    # Start with seasonal baseline for all 7 scenarios
    baseline = get_forecast_scores(city)

    # Override with live data — all called simultaneously
    weather    = await get_weather_risk(city)
    aqi        = await get_aqi_risk(city)
    bandh      = await get_bandh_risk(city)
    congestion = await get_congestion_risk(city)

    # Merge live data over baseline
    # Weather scenarios
    baseline["rain"]       = weather.get("rain", baseline["rain"])
    baseline["heat"]       = weather.get("heat", baseline["heat"])
    baseline["fog"]        = weather.get("fog",  baseline["fog"])

    # AQI scenario
    baseline["aqi"]        = aqi.get("aqi", baseline["aqi"])

    # Bandh scenario — real news scan
    baseline["bandh"]      = bandh.get("bandh", baseline["bandh"])

    # Congestion scenario — real OSRM routing
    baseline["congestion"] = congestion.get("congestion", baseline["congestion"])

    # Platform outage stays as seasonal baseline
    # (Downdetector has no free API — mock is fine for demo)

    return baseline