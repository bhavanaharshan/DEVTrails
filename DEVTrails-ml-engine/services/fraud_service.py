import math

# ─────────────────────────────────────────────
# Haversine distance helper
# ─────────────────────────────────────────────
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


# ─────────────────────────────────────────────
# Location / GPS spoof check
# ─────────────────────────────────────────────
def verify_location(lat1: float, lon1: float, lat2: float, lon2: float, max_radius_km: float = 15) -> dict:
    """
    Returns whether the two coords are within max_radius_km of each other.
    Used by lockout_service to validate claim location vs zone center.
    """
    distance = haversine_km(lat1, lon1, lat2, lon2)

    if distance <= max_radius_km:
        return {
            "secure": True,
            "distance_km": round(distance, 2),
            "reason": "ALL_CLEAR",
        }

    return {
        "secure": False,
        "distance_km": round(distance, 2),
        "reason": f"Kinematic Violation: {distance:.1f}km spoofing detected.",
    }


# ─────────────────────────────────────────────
# Kinematic fraud check (for the trigger engine evaluator)
# Returns is_fraud: bool
# ─────────────────────────────────────────────
def check_kinematic_fraud(
    claim_lat: float,
    claim_lon: float,
    last_known_lat: float,
    last_known_lon: float,
    time_diff_minutes: float,
    max_speed_kmh: float = 60.0,
) -> dict:
    """
    Physics-based impossibility check.
    If the rider would need to travel faster than max_speed_kmh to reach
    the claim location from their last known location, the claim is flagged.
    """
    distance_km = haversine_km(claim_lat, claim_lon, last_known_lat, last_known_lon)
    time_hours = max(time_diff_minutes / 60.0, 1e-9)
    required_speed = distance_km / time_hours

    is_fraud = required_speed > max_speed_kmh

    return {
        "is_fraud": is_fraud,
        "distance_km": round(distance_km, 2),
        "required_speed_kmh": round(required_speed, 1),
        "flag_reason": "KINEMATIC_VIOLATION" if is_fraud else None,
    }


# ─────────────────────────────────────────────
# Lightweight face / identity stub
# (no face model in this stack — returns pass for MVP)
# ─────────────────────────────────────────────
def verify_user(user_id: str, frame_b64: str, relationships: list) -> dict:
    """
    Stub for face/identity verification.
    In production this would call a face-match service.
    For MVP: always returns verified so it doesn't block the flow.
    """
    return {
        "user_id": user_id,
        "identity_verified": True,
        "method": "stub_mvp",
        "reason": "Identity check bypassed for MVP deployment.",
    }


# ─────────────────────────────────────────────
# Combined final fraud verdict (used by /fraud-check endpoint)
# ─────────────────────────────────────────────
async def verify_final(
    user_id: str,
    frame_b64: str,
    relationships: list,
    claim_lat: float,
    claim_lon: float,
    last_lat: float,
    last_lon: float,
    time_diff_minutes: float,
) -> dict:
    """
    Full fraud pipeline:
      1. Kinematic / GPS check
      2. Identity stub
    Returns is_fraud: bool for the trigger engine evaluator.
    """
    kinematic = check_kinematic_fraud(
        claim_lat, claim_lon, last_lat, last_lon, time_diff_minutes
    )
    identity = verify_user(user_id, frame_b64, relationships)

    is_fraud = kinematic["is_fraud"]
    flag_reason = kinematic["flag_reason"] if is_fraud else None

    return {
        "user_id": user_id,
        "is_fraud": is_fraud,
        "flag_reason": flag_reason,
        "kinematic": kinematic,
        "identity": identity,
    }
