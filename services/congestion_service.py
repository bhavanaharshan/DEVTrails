import httpx

# Representative route coordinates per city
# Format: (start_lat, start_lon, end_lat, end_lon)
# These are real delivery-heavy corridors in each city
CITY_ROUTES = {
    "mumbai": {
        "start": (19.0596, 72.8295),   # Kurla
        "end":   (19.0176, 72.8562),   # Bandra
        "baseline_seconds": 1200,       # 20 min expected
    },
    "delhi": {
        "start": (28.6271, 77.2217),   # Connaught Place
        "end":   (28.5355, 77.2100),   # Saket
        "baseline_seconds": 1800,       # 30 min expected
    },
    "lucknow": {
        "start": (26.8467, 80.9462),   # Hazratganj
        "end":   (26.8200, 80.9400),   # Aminabad
        "baseline_seconds": 900,        # 15 min expected
    },
    "chennai": {
        "start": (13.0827, 80.2707),   # Central
        "end":   (13.0569, 80.2425),   # T Nagar
        "baseline_seconds": 1200,       # 20 min expected
    },
}

async def get_congestion_risk(city: str) -> dict:
    route = CITY_ROUTES.get(city, CITY_ROUTES["mumbai"])

    start = route["start"]
    end   = route["end"]
    baseline = route["baseline_seconds"]

    # OSRM public API — completely free, no key needed
    url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{start[1]},{start[0]};{end[1]},{end[0]}"
        f"?overview=false"
    )

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            data = resp.json()

        routes = data.get("routes", [])
        if not routes:
            return {"congestion": 0.25}

        current_seconds = routes[0].get("duration", baseline)

        # How much longer than baseline?
        ratio = current_seconds / baseline

        # ratio > 2.0 means travel time doubled = high congestion
        if ratio >= 2.0:
            congestion_risk = 1.0
        elif ratio >= 1.5:
            congestion_risk = 0.65
        elif ratio >= 1.2:
            congestion_risk = 0.35
        else:
            congestion_risk = 0.15

        return {"congestion": round(congestion_risk, 2)}

    except Exception:
        return {"congestion": 0.25}