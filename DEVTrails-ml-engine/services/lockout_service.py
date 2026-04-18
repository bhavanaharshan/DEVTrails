from services.geo_security_service import CITY_ZONES, resolve_location
from services.fraud_service import verify_location

async def check_lockout(city: str = None, zone: str = None, lat: float = None, lon: float = None) -> dict:
    """
    Security Lockout Engine (Fraud Only)
    This controls the red lockout screen.
    ONLY triggers on:
    - GPS spoofing
    - Kinematic violation
    - Impossible travel / wrong zone
    """

    if lat is None or lon is None:
        return {
            "is_locked": True,
            "status": "locked",
            "reason": "Missing live device location. Access denied by Zero-Trust policy.",
            "source": "geo_missing"
        }

    # Resolve nearest city/zone from actual device GPS
    resolved = resolve_location(lat, lon)
    resolved_city = resolved["city"]
    resolved_zone = resolved["zone"]

    # Normalize requested city
    city_key = (city or resolved_city or "mumbai").strip().lower()
    if city_key not in CITY_ZONES:
        city_key = resolved_city

    city_data = CITY_ZONES.get(city_key, CITY_ZONES["mumbai"])

    # Normalize requested zone
    zone_key = (zone or "").strip().lower()
    if zone_key not in city_data["zones"]:
        zone_key = next(iter(city_data["zones"].keys()))

    expected = city_data["zones"][zone_key]

    # Hard security check
    geo_verdict = verify_location(lat, lon, expected["lat"], expected["lon"], max_radius_km=15)

    if not geo_verdict["secure"]:
        return {
            "is_locked": True,
            "status": "locked",
            "reason": geo_verdict["reason"],
            "city": city_key,
            "zone": zone_key,
            "distance_km": geo_verdict["distance_km"],
            "resolved_city": resolved_city,
            "resolved_zone": resolved_zone,
            "source": "geo_anti_spoof"
        }

    return {
        "is_locked": False,
        "status": "secure",
        "reason": "ALL_CLEAR",
        "city": city_key,
        "zone": zone_key,
        "distance_km": geo_verdict["distance_km"],
        "resolved_city": resolved_city,
        "resolved_zone": resolved_zone,
        "source": "geo_anti_spoof"
    }