import math

# ─────────────────────────────────────────────
# Canonical city/zone map
# Must stay in sync with:
#   - gigshield-frontend/src/pages/Onboarding.jsx  (CITY_ZONE_MAP)
#   - services/geo_security_service.py             (CITY_ZONES)
# ─────────────────────────────────────────────
CITY_ZONES = {
    "mumbai": {
        "lat": 19.0760, "lon": 72.8777,
        "zones": {
            "andheri":  {"lat": 19.1136, "lon": 72.8697},
            "kurla":    {"lat": 19.0596, "lon": 72.8295},
            "powai":    {"lat": 19.1197, "lon": 72.9051},
        },
    },
    "delhi": {
        "lat": 28.6139, "lon": 77.2090,
        "zones": {
            "central_delhi": {"lat": 28.6271, "lon": 77.2217},
            "south_delhi":   {"lat": 28.5355, "lon": 77.2100},
        },
    },
    "lucknow": {
        "lat": 26.8467, "lon": 80.9462,
        "zones": {
            "central_lucknow": {"lat": 26.8467, "lon": 80.9462},
        },
    },
    "chennai": {
        "lat": 13.0827, "lon": 80.2707,
        "zones": {
            "central_chennai": {"lat": 13.0827, "lon": 80.2707},
        },
    },
    "bengaluru": {
        "lat": 12.9716, "lon": 77.5946,
        "zones": {
            "koramangala": {"lat": 12.9352, "lon": 77.6245},
            "whitefield":  {"lat": 12.9698, "lon": 77.7500},
            "indiranagar": {"lat": 12.9784, "lon": 77.6408},
            "hsr_layout":  {"lat": 12.9116, "lon": 77.6474},
        },
    },
    "thiruvananthapuram": {
        "lat": 8.5241, "lon": 76.9366,
        "zones": {
            "kazhakkoottam": {"lat": 8.5510, "lon": 76.8740},
            "palayam":       {"lat": 8.5039, "lon": 76.9470},
            "kowdiar":       {"lat": 8.5228, "lon": 76.9602},
            "sreekariyam":   {"lat": 8.5485, "lon": 76.9120},
        },
    },
}

TRIGGER_TYPE_MAP = {
    "weather": ["rain", "heat", "fog"],
    "aqi":     ["aqi"],
    "outage":  ["outage"],
}


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def resolve_location(lat: float, lon: float) -> dict:
    """Given lat/lon, returns the nearest city and zone."""
    best_city = None
    best_zone = None
    best_distance = float("inf")

    for city, city_data in CITY_ZONES.items():
        for zone, zone_coords in city_data["zones"].items():
            dist = _haversine(lat, lon, zone_coords["lat"], zone_coords["lon"])
            if dist < best_distance:
                best_distance = dist
                best_city = city
                best_zone = zone

    city_data = CITY_ZONES[best_city]
    return {
        "city":        best_city,
        "zone":        best_zone,
        "city_lat":    city_data["lat"],
        "city_lon":    city_data["lon"],
        "distance_km": round(best_distance, 2),
    }


def get_scenarios_for_trigger(trigger_type: str) -> list:
    """Maps trigger_type to relevant scenario keys. None = all 7."""
    if trigger_type and trigger_type in TRIGGER_TYPE_MAP:
        return TRIGGER_TYPE_MAP[trigger_type]
    return ["rain", "heat", "fog", "aqi", "outage", "bandh", "congestion"]
