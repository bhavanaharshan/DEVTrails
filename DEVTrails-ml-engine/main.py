from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.premium import router as premium_router
from apscheduler.schedulers.background import BackgroundScheduler
from services.recalibration_service import recalibrate_all_zones

app = FastAPI(
    title="GigShield ML Engine",
    description="AI-powered dynamic premium calculation for gig worker insurance",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow all origins (hackathon)
    allow_credentials=True,     # 🔥 IMPORTANT (missing in yours)
    allow_methods=["*"],        # allow all HTTP methods
    allow_headers=["*"],        # allow all headers
)

app.include_router(premium_router)

# Weekly recalibration — runs every Sunday at 6 AM
scheduler = BackgroundScheduler()
scheduler.add_job(
    recalibrate_all_zones,
    trigger="cron",
    day_of_week="sun",
    hour=6,
    minute=0,
    id="weekly_recalibration"
)
scheduler.start()

@app.get("/health")
def health():
    return {"status": "ok", "service": "gigshield-ml-engine"}

@app.get("/recalibrate/run-now")
def run_recalibration_now():
    """
    Manual trigger for demo purposes.
    In production this only runs via the Sunday cron.
    """
    results = recalibrate_all_zones()
    return {
        "status":       "recalibration complete",
        "zones_updated": len(results),
        "results":      results
    }

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()