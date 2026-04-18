import math

def haversine_km(lat1, lon1, lat2, lon2):
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

def verify_location(lat1, lon1, lat2, lon2, max_radius_km=15):
    distance = haversine_km(lat1, lon1, lat2, lon2)

    if distance <= max_radius_km:
        return {
            "secure": True,
            "distance_km": round(distance, 2),
            "reason": "ALL_CLEAR"
        }

    return {
        "secure": False,
        "distance_km": round(distance, 2),
        "reason": f"Kinematic Violation: {distance:.1f}km spoofing detected."
    }