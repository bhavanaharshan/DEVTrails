from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.premium import router as premium_router
from apscheduler.schedulers.background import BackgroundScheduler
from services.recalibration_service import recalibrate_all_zones
import os

app = FastAPI(
    title="GigShield ML Engine",
    description="AI-powered dynamic premium calculation for gig worker insurance",
    version="1.0.0"
)

# CORS (frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ FIXED: removed extra prefix
app.include_router(premium_router)

# Scheduler (disable for Render to avoid crashes)
scheduler = BackgroundScheduler()
scheduler.add_job(
    recalibrate_all_zones,
    trigger="cron",
    day_of_week="sun",
    hour=6,
    minute=0,
    id="weekly_recalibration"
)

# ❗ Comment this for Render deployment
# scheduler.start()

@app.get("/")
def root():
    return {"status": "alive"}

@app.on_event("startup")
def load_model():
    global model
    model = load_your_model()
    print("Model loaded")

@app.get("/health")
def health():
    return {"status": "ok", "service": "gigshield-ml-engine"}

@app.get("/recalibrate/run-now")
def run_recalibration_now():
    results = recalibrate_all_zones()
    return {
        "status": "recalibration complete",
        "zones_updated": len(results),
        "results": results
    }

@app.on_event("shutdown")
def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()