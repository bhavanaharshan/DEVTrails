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
def verify_location(lat1, lon1, lat2, lon2):
    distance = haversine_km(lat1, lon1, lat2, lon2)

    MAX_RADIUS_KM = 15

    if distance <= MAX_RADIUS_KM:
        return {
            "secure": True
        }

    return {
        "secure": False,
        "reason": f"Kinematic Violation: {distance:.1f}km spoofing detected."
    }