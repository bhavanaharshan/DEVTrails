import httpx

CITY_OPENAQ = {
    "mumbai": "Mumbai",
    "delhi": "Delhi",
    "lucknow": "Lucknow",
    "chennai": "Chennai",
    "bengaluru": "Bengaluru",
    "thiruvananthapuram": "Thiruvananthapuram",
}

async def get_aqi_risk(city: str) -> dict:
    city_name = CITY_OPENAQ.get(city, "Mumbai")

    url = (
        f"https://api.openaq.org/v2/latest"
        f"?city={city_name}&parameter=pm25&limit=5"
    )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers={"accept": "application/json"})
            results = resp.json().get("results", [])

        if not results:
            return {"aqi": 0.25}

        values = []
        for r in results:
            for m in r.get("measurements", []):
                if m.get("parameter") == "pm25":
                    values.append(m.get("value", 0))

        if not values:
            return {"aqi": 0.25}

        avg_pm25 = sum(values) / len(values)
        aqi_risk = min(avg_pm25 / 250.0, 1.0)

        return {"aqi": round(aqi_risk, 2)}

    except Exception:
        return {"aqi": 0.25}