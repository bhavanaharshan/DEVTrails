import math

# City centers with lat/lon + all known zones
CITY_ZONES = {
    "mumbai": {
        "lat": 19.0760, "lon": 72.8777,
        "zones": {
            "kurla_mumbai":   {"lat": 19.0596, "lon": 72.8295},
            "andheri_mumbai": {"lat": 19.1136, "lon": 72.8697},
            "powai_mumbai":   {"lat": 19.1197, "lon": 72.9051},
        }
    },
    "delhi": {
        "lat": 28.6139, "lon": 77.2090,
        "zones": {
            "central_delhi": {"lat": 28.6271, "lon": 77.2217},
            "south_delhi":   {"lat": 28.5355, "lon": 77.2100},
        }
    },
    "lucknow": {
        "lat": 26.8467, "lon": 80.9462,
        "zones": {
            "central_lucknow": {"lat": 26.8467, "lon": 80.9462},
        }
    },
    "chennai": {
        "lat": 13.0827, "lon": 80.2707,
        "zones": {
            "central_chennai": {"lat": 13.0827, "lon": 80.2707},
        }
    },
}

# Sam's trigger_type → our scenario keys
TRIGGER_TYPE_MAP = {
    "weather": ["rain", "heat", "fog"],
    "aqi":     ["aqi"],
    "outage":  ["outage"],
}

def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Returns distance in km between two lat/lon points"""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat/2)**2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(d_lon/2)**2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def resolve_location(lat: float, lon: float) -> dict:
    """
    Given lat/lon, returns the nearest city and zone.
    Also returns the city's canonical lat/lon for API calls.
    """
    best_city     = None
    best_zone     = None
    best_distance = float("inf")

    for city, city_data in CITY_ZONES.items():
        for zone, zone_coords in city_data["zones"].items():
            dist = _haversine(lat, lon, zone_coords["lat"], zone_coords["lon"])
            if dist < best_distance:
                best_distance = dist
                best_city     = city
                best_zone     = zone

    city_data = CITY_ZONES[best_city]
    return {
        "city":        best_city,
        "zone":        best_zone,
        "city_lat":    city_data["lat"],
        "city_lon":    city_data["lon"],
        "distance_km": round(best_distance, 2),
    }

def get_scenarios_for_trigger(trigger_type: str) -> list:
    """
    Maps Sam's trigger_type to the relevant scenario keys.
    weather → [rain, heat, fog]
    aqi     → [aqi]
    outage  → [outage]
    None    → all 7 scenarios
    """
    if trigger_type and trigger_type in TRIGGER_TYPE_MAP:
        return TRIGGER_TYPE_MAP[trigger_type]
    return list(TRIGGER_TYPE_MAP["weather"] +
                TRIGGER_TYPE_MAP["aqi"] +
                TRIGGER_TYPE_MAP["outage"] +
                ["bandh", "congestion"])