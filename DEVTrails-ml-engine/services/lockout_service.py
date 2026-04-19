from services.geo_security_service import CITY_ZONES, resolve_location, verify_location


async def check_lockout(
    city: str = None,
    zone: str = None,
    lat: float = None,
    lon: float = None,
) -> dict:
    """
    Security Lockout Engine — fraud / GPS-spoof detection ONLY.
    Controls the red lockout screen on the Dashboard.

    Returns keys that match LockoutResponse schema:
        lockout_active, zone, city, reason,
        forecast_rain_mm (None), forecast_temp_c (None), hours_until_alert (None)

    NEVER triggers on weather / AQI / congestion — those are operational alerts only.
    """

    # Missing GPS → deny under Zero-Trust policy
    if lat is None or lon is None:
        return {
            "lockout_active": True,
            "status": "locked",
            "reason": "Missing live device location. Access denied by Zero-Trust policy.",
            "city": city or "unknown",
            "zone": zone or "unknown",
            "source": "geo_missing",
            "forecast_rain_mm": None,
            "forecast_temp_c": None,
            "hours_until_alert": None,
        }

    # Resolve nearest city/zone from real device GPS
    resolved = resolve_location(lat, lon)
    resolved_city = resolved["city"]
    resolved_zone = resolved["zone"]

    # Normalise requested city
    city_key = (city or resolved_city or "mumbai").strip().lower()
    if city_key not in CITY_ZONES:
        city_key = resolved_city

    city_data = CITY_ZONES.get(city_key, CITY_ZONES["mumbai"])

    # Normalise requested zone
    zone_key = (zone or "").strip().lower()
    if zone_key not in city_data["zones"]:
        zone_key = next(iter(city_data["zones"].keys()))

    expected = city_data["zones"][zone_key]

    # Hard geo security check
    geo_verdict = verify_location(lat, lon, expected["lat"], expected["lon"], max_radius_km=15)

    if not geo_verdict["secure"]:
        return {
            "lockout_active": True,
            "status": "locked",
            "reason": geo_verdict["reason"],
            "city": city_key,
            "zone": zone_key,
            "distance_km": geo_verdict["distance_km"],
            "resolved_city": resolved_city,
            "resolved_zone": resolved_zone,
            "source": "geo_anti_spoof",
            "forecast_rain_mm": None,
            "forecast_temp_c": None,
            "hours_until_alert": None,
        }

    return {
        "lockout_active": False,
        "status": "secure",
        "reason": "ALL_CLEAR",
        "city": city_key,
        "zone": zone_key,
        "distance_km": geo_verdict["distance_km"],
        "resolved_city": resolved_city,
        "resolved_zone": resolved_zone,
        "source": "geo_anti_spoof",
        "forecast_rain_mm": None,
        "forecast_temp_c": None,
        "hours_until_alert": None,
    }
