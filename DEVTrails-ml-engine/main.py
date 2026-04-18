from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers.premium import router as premium_router
from apscheduler.schedulers.background import BackgroundScheduler
from services.recalibration_service import recalibrate_all_zones
from services.lockout_service import check_lockout
from services.risk_scorer import get_full_risk_scores
from services.risk_aggregator import compute_final_risk
import os

app = FastAPI(
    title="GigShield ML Engine",
    description="AI-powered dynamic premium calculation for gig worker insurance",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(premium_router)

# ─────────────────────────────────────────────
# Proxy routes — the frontend and backend container
# call /api/security/* and /api/risk/* on port 3001 (backend).
# When the backend is unavailable (local dev / standalone ML run)
# these routes on the ML engine (port 8000) serve as a direct fallback.
# The frontend .env sets VITE_BACKEND_URL; if it points here these work too.
# ─────────────────────────────────────────────

@app.post("/api/security/verify")
async def proxy_security_verify(request: Request):
    body = await request.json()
    from routers.premium import security_verify, SecurityVerifyRequest
    req = SecurityVerifyRequest(**body)
    return await security_verify(req)


@app.get("/api/security/status/{user_id}")
async def proxy_security_status(user_id: str, request: Request):
    params = dict(request.query_params)
    city = params.get("city", "mumbai")
    zone = params.get("zone", "kurla")
    lat  = float(params["lat"]) if "lat" in params else None
    lon  = float(params["lon"]) if "lon" in params else None

    result = await check_lockout(city=city, zone=zone, lat=lat, lon=lon)
    is_locked = result.get("lockout_active", False)
    return {
        "is_locked": is_locked,
        "status":    "locked" if is_locked else "secure",
        "reason":    result.get("reason", "ALL_CLEAR"),
    }


@app.post("/api/risk/summary")
async def proxy_risk_summary_post(request: Request):
    body = await request.json()
    city = body.get("city", "mumbai")
    risk_scores = await get_full_risk_scores(city)
    return compute_final_risk(risk_scores, city)


@app.get("/api/risk/summary/{user_id}")
async def proxy_risk_summary_get(user_id: str, request: Request):
    params = dict(request.query_params)
    city = params.get("city", "mumbai")
    risk_scores = await get_full_risk_scores(city)
    return compute_final_risk(risk_scores, city)


@app.post("/api/user/update")
async def proxy_user_update(request: Request):
    """
    Accepts the user profile save from Onboarding.
    In production this is handled by the Neema backend (Node.js + Postgres).
    Here we acknowledge so the frontend flow doesn't break.
    """
    body = await request.json()
    return {"status": "ok", "user_id": body.get("id", "unknown")}


# ─────────────────────────────────────────────
# Weekly recalibration scheduler
# ─────────────────────────────────────────────
scheduler = BackgroundScheduler()
scheduler.add_job(
    recalibrate_all_zones,
    trigger="cron",
    day_of_week="sun",
    hour=6,
    minute=0,
    id="weekly_recalibration",
)
# Uncomment to enable on a persistent server; leave commented for Render/serverless
# scheduler.start()


@app.get("/")
def root():
    return {"status": "alive", "service": "gigshield-ml-engine"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "gigshield-ml-engine"}


@app.get("/recalibrate/run-now")
def run_recalibration_now():
    results = recalibrate_all_zones()
    return {
        "status": "recalibration complete",
        "zones_updated": len(results),
        "results": results,
    }


@app.on_event("startup")
def startup_event():
    print("🚀 GigShield ML Engine started successfully")


@app.on_event("shutdown")
def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
