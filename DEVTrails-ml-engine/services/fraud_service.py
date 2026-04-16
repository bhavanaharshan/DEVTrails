import math
import httpx
from datetime import datetime
import base64
import cv2
import numpy as np

# ================= EXISTING CODE (UNCHANGED) =================

def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def _get_osrm_travel_time(lat1, lon1, lat2, lon2) -> dict:
    url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{lon1},{lat1};{lon2},{lat2}"
        f"?overview=false&annotations=false"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            data = resp.json()

        routes = data.get("routes", [])
        if not routes:
            return {"duration_minutes": None, "distance_km": None, "source": "osrm_failed"}

        return {
            "duration_minutes": round(routes[0]["duration"] / 60, 1),
            "distance_km": round(routes[0]["distance"] / 1000, 2),
            "source": "osrm_live",
        }

    except Exception as e:
        return {"duration_minutes": None, "distance_km": None, "source": f"osrm_error: {e}"}


async def check_kinematic_fraud(
    user_id,
    claim_lat,
    claim_lon,
    last_known_lat,
    last_known_lon,
    time_diff_minutes,
    hour_of_day=None,
) -> dict:

    if hour_of_day is None:
        hour_of_day = datetime.now().hour

    straight_km = _haversine_km(
        last_known_lat, last_known_lon,
        claim_lat, claim_lon
    )

    if straight_km < 0.3:
        return {"user_id": user_id, "is_fraud": False, "confidence": 0.01}

    osrm = await _get_osrm_travel_time(
        last_known_lat, last_known_lon,
        claim_lat, claim_lon
    )

    osrm_minutes = osrm["duration_minutes"]
    osrm_km = osrm["distance_km"] or straight_km

    if osrm_minutes is None:
        osrm_minutes = straight_km / 0.7

    min_time_required = osrm_minutes * 1.25

    is_fraud = time_diff_minutes < min_time_required

    return {
        "user_id": user_id,
        "is_fraud": is_fraud,
        "confidence": 0.8 if is_fraud else 0.1,
    }

# ================= NEW CODE (PRIYA ML ENGINE) =================

# -------- LIVENESS --------
def decode_frame(frame_b64: str):
    try:
        img_bytes = base64.b64decode(frame_b64)
        arr = np.frombuffer(img_bytes, np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except:
        return None


def liveness_check(frame_b64: str):
    if frame_b64 == "dummy_for_now":
        return 0.7   # allow testing

    frame = decode_frame(frame_b64)
    if frame is None:
        return 0.0

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    texture = cv2.Laplacian(gray, cv2.CV_64F).var()

    return round(min(texture / 300.0, 1.0), 4)


# -------- TEMP IDENTITY --------
def identity_check(user_id: str):
    return 0.7  # placeholder (upgrade later)


# -------- SYBIL DETECTION --------
def compute_sybil_risk(user_id, relationships):
    upi_map = {}
    device_map = {}

    for r in relationships:
        upi_map.setdefault(r.get("upi_id"), []).append(r["user_id"])
        device_map.setdefault(r.get("device_fp"), []).append(r["user_id"])

    risk = 0.0

    for users in upi_map.values():
        if user_id in users and len(users) > 5:
            risk += 0.5

    for users in device_map.values():
        if user_id in users and len(users) > 3:
            risk += 0.3

    return min(risk, 1.0)


# -------- TRUST SCORE --------
def compute_trust(liveness, identity, sybil):
    score = 0.4*liveness + 0.4*identity - 0.2*sybil
    return max(0.0, min(score, 1.0))


# -------- MAIN VERIFY --------
def verify_user(user_id, frame_b64, relationships):

    # 1. Liveness
    liveness = liveness_check(frame_b64)

    if liveness < 0.3:
        return {
            "secure": False,
            "reason": "LIVENESS_FAIL",
            "liveness_score": liveness
        }

    # 2. Identity (placeholder)
    identity = identity_check(user_id)

    # 3. Sybil
    sybil = compute_sybil_risk(user_id, relationships)

    # 4. Trust
    trust = compute_trust(liveness, identity, sybil)

    return {
        "secure": trust > 0.65,
        "trust_score": round(trust, 4),
        "liveness_score": liveness,
        "identity_match": identity,
        "sybil_risk": sybil,
        "flags": [],
        "reason": "ok" if trust > 0.65 else "low_trust"
    }
async def verify_final(
    user_id,
    frame_b64,
    relationships,
    claim_lat,
    claim_lon,
    last_lat,
    last_lon,
    time_diff_minutes
):
    # ---------------- LIVENESS ----------------
    liveness = liveness_check(frame_b64)

    if liveness < 0.3:
        return {
            "secure": False,
            "reason": "LIVENESS_FAIL",
            "liveness_score": liveness
        }

    # ---------------- IDENTITY ----------------
    identity = identity_check(user_id)

    # ---------------- SYBIL ----------------
    sybil = compute_sybil_risk(user_id, relationships)

    # ---------------- KINEMATIC ----------------
    kinematic = await check_kinematic_fraud(
        user_id=user_id,
        claim_lat=claim_lat,
        claim_lon=claim_lon,
        last_known_lat=last_lat,
        last_known_lon=last_lon,
        time_diff_minutes=time_diff_minutes
    )

    kinematic_flag = kinematic["is_fraud"]
    kinematic_conf = kinematic["confidence"]

    # ---------------- FINAL SCORE ----------------
    # combine everything
    final_score = (
        0.3 * liveness +
        0.2 * identity -
        0.3 * sybil -
        0.2 * (1 if kinematic_flag else 0)
    )

    final_score = max(0.0, min(final_score, 1.0))

    # ---------------- DECISION ----------------
    secure = final_score > 0.6

    reason = []

    if sybil > 0.5:
        reason.append("SYBIL_RING")

    if kinematic_flag:
        reason.append("IMPOSSIBLE_TRAVEL")

    if liveness < 0.5:
        reason.append("LOW_LIVENESS")

    if not reason:
        reason.append("ALL_CLEAR")

    return {
    # 🔥 REQUIRED FOR SAMRIDHI
    "is_fraud": not secure,
    "confidence": round(1 - final_score, 4),

    # 🔍 YOUR EXISTING OUTPUT (KEEP THIS)
    "secure": secure,
    "final_score": round(final_score, 4),
    "liveness_score": liveness,
    "identity_match": identity,
    "sybil_risk": sybil,
    "kinematic_fraud": kinematic_flag,
    "kinematic_confidence": kinematic_conf,
    "reasons": reason
}