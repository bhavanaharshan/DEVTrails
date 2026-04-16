import math
import httpx
from datetime import datetime

def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

async def _get_osrm_travel_time(
    lat1: float, lon1: float,
    lat2: float, lon2: float
) -> dict:
    """
    Calls OSRM public routing API for real current road travel time.
    Returns duration in minutes and distance in km.
    Free — no API key required.
    """
    url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{lon1},{lat1};{lon2},{lat2}"
        f"?overview=false&annotations=false"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp  = await client.get(url)
            data  = resp.json()
        routes = data.get("routes", [])
        if not routes:
            return {"duration_minutes": None, "distance_km": None, "source": "osrm_failed"}
        duration_sec  = routes[0].get("duration", 0)
        distance_m    = routes[0].get("distance", 0)
        return {
            "duration_minutes": round(duration_sec / 60, 1),
            "distance_km":      round(distance_m / 1000, 2),
            "source":           "osrm_live",
        }
    except Exception as e:
        return {"duration_minutes": None, "distance_km": None, "source": f"osrm_error: {e}"}

async def check_kinematic_fraud(
    user_id:           str,
    claim_lat:         float,
    claim_lon:         float,
    last_known_lat:    float,
    last_known_lon:    float,
    time_diff_minutes: float,
    hour_of_day:       int = None,
) -> dict:
    """
    Real-time kinematic fraud detection using OSRM live routing.

    Step 1 — Get actual road distance via Haversine (instant)
    Step 2 — Get actual minimum travel time via OSRM live API
    Step 3 — Compare claimed travel time against OSRM minimum
    Step 4 — Add traffic buffer based on time of day
    Step 5 — Return fraud verdict with full evidence chain
    """
    if hour_of_day is None:
        hour_of_day = datetime.now().hour

    # Straight-line distance
    straight_km = _haversine_km(
        last_known_lat, last_known_lon,
        claim_lat, claim_lon
    )

    # If worker hasn't moved — no fraud possible
    if straight_km < 0.3:
        return {
            "user_id":              user_id,
            "is_fraud":             False,
            "confidence":           0.01,
            "flag_reason":          "Worker location unchanged. No kinematic violation.",
            "distance_km":          round(straight_km, 2),
            "osrm_min_minutes":     0.0,
            "time_diff_minutes":    time_diff_minutes,
            "speed_actual_kmhr":    0.0,
            "hour_of_day":          hour_of_day,
            "data_source":          "haversine_only",
        }

    # Get real OSRM routing time
    osrm = await _get_osrm_travel_time(
        last_known_lat, last_known_lon,
        claim_lat, claim_lon
    )

    osrm_minutes = osrm["duration_minutes"]
    osrm_km      = osrm["distance_km"] or straight_km
    data_source  = osrm["source"]

    # If OSRM failed, fall back to physics-based estimate
    if osrm_minutes is None:
        if 18 <= hour_of_day <= 21:
            speed_kmpm = 0.35      # peak: 21 km/hr
        elif 23 <= hour_of_day or hour_of_day <= 5:
            speed_kmpm = 1.00      # night: 60 km/hr
        else:
            speed_kmpm = 0.70      # offpeak: 42 km/hr
        osrm_minutes = straight_km / speed_kmpm
        data_source  = "physics_fallback"

    # Traffic buffer — OSRM gives free-flow time, real traffic is slower
    if 18 <= hour_of_day <= 21:
        traffic_multiplier = 1.60   # peak hour: 60% slower
    elif 8 <= hour_of_day <= 10:
        traffic_multiplier = 1.40   # morning rush
    elif 23 <= hour_of_day or hour_of_day <= 5:
        traffic_multiplier = 1.05   # night: near free-flow
    else:
        traffic_multiplier = 1.25   # standard buffer

    min_time_required = osrm_minutes * traffic_multiplier

    # Fraud verdict
    is_fraud     = time_diff_minutes < min_time_required and straight_km > 0.3
    speed_actual = (osrm_km / time_diff_minutes * 60) if time_diff_minutes > 0 else float("inf")

    if is_fraud:
        shortfall  = min_time_required - time_diff_minutes
        confidence = min(0.70 + (shortfall / min_time_required) * 0.29, 0.99)
        flag_reason = (
            f"Kinematic violation: OSRM says {osrm_minutes:.0f} min road time "
            f"+ {(traffic_multiplier-1)*100:.0f}% traffic buffer = "
            f"{min_time_required:.0f} min minimum. "
            f"Claimed: {time_diff_minutes:.0f} min. "
            f"Implied speed: {speed_actual:.0f} km/hr — physically impossible."
        )
    else:
        confidence  = round(max(0.02, (time_diff_minutes - min_time_required) / min_time_required * 0.1), 3)
        flag_reason = (
            f"Travel plausible: OSRM minimum {min_time_required:.0f} min "
            f"(incl. traffic buffer). Actual: {time_diff_minutes:.0f} min. No violation."
        )

    return {
        "user_id":              user_id,
        "is_fraud":             is_fraud,
        "confidence":           round(confidence, 3),
        "flag_reason":          flag_reason,
        "distance_straight_km": round(straight_km, 2),
        "distance_road_km":     round(osrm_km, 2),
        "osrm_min_minutes":     round(osrm_minutes, 1),
        "traffic_multiplier":   traffic_multiplier,
        "min_time_required":    round(min_time_required, 1),
        "time_diff_minutes":    time_diff_minutes,
        "speed_actual_kmhr":    round(speed_actual, 1),
        "hour_of_day":          hour_of_day,
        "data_source":          data_source,
    }