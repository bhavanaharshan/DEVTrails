<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:001219,30:005F73,60:0A9396,85:94D2BD,100:E9D8A6&height=220&section=header&text=Jugaad&fontSize=72&fontColor=FFFFFF&fontAlignY=38&desc=Parametric%20Income%20Insurance%20for%20India's%20Gig%20Workers&descAlignY=58&descSize=18" width="100%"/>

<img src="https://img.shields.io/badge/DEVTrails_2026-Guidewire_Software-FFD700?style=for-the-badge&logoColor=black"/>
<img src="https://img.shields.io/badge/Parametric_Insurance-Income_Protection-2ECC71?style=for-the-badge"/>

<br/>
<br/>

[![BCR](https://img.shields.io/badge/BCR-0.67%20Stress%20Tested-2ECC71?style=for-the-badge&logo=chartdotjs&logoColor=white)](/)
[![IRDAI](https://img.shields.io/badge/IRDAI-Compliant%20Architecture-1A5276?style=for-the-badge&logo=shield&logoColor=white)](/)
<img src="https://img.shields.io/badge/SS_Code_2020-90%2F120_Day_Rule-16A085?style=for-the-badge"/>
[![DPDP Act](https://img.shields.io/badge/DPDP%20Act%202023-Consent%20Flow%20Built-8E44AD?style=for-the-badge)](/)
[![Zero Trust](https://img.shields.io/badge/Zero--Trust-Hardware%20Handshake-E74C3C?style=for-the-badge&logo=datadog&logoColor=white)](/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Container-2496ED?style=for-the-badge&logo=docker&logoColor=white)](/)
[![UPI](https://img.shields.io/badge/UPI%20AutoPay-Micro%20Deductions-F39C12?style=for-the-badge)](/)

<br/>
<br/>

<img src="https://img.shields.io/badge/React-PWA-61DAFB?style=flat-square&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi&logoColor=white"/>
<img src="https://img.shields.io/badge/PostgreSQL-PostGIS-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white"/>
<img src="https://img.shields.io/badge/XGBoost-ML_Engine-FF6600?style=flat-square"/>

<br/>
<br/>

<p align="center">
  <a href="https://youtu.be/ArMU9lqm6jU">
    <img src="https://img.shields.io/badge/Watch-Demo%20Video-FF003C?style=for-the-badge&logo=youtube&logoColor=white"/>
  </a>
  <a href="https://drive.google.com/drive/folders/1-4tH2nAV8p89iXrHkJ2WtXvpOVPL0Sbv?usp=sharing">
    <img src="https://img.shields.io/badge/Pitch%20Deck-%20Presentation-06B6D4?style=for-the-badge&logo=googledrive&logoColor=white"/>
  </a>
</p>

</div>

### Why Jugaad?

> **Bharat Harshan - a 28 year old Zomato rider from Kurla, Mumbai.**  
> It's Tuesday, 6 PM. Peak delivery hour. Then the monsoon hits. In 20 minutes, orders in his zone crash by **70%**. Customers pay surge pricing. The platform keeps earning. Ravi ends the night with barely **₹90**.
>
> **He didn’t fail to work. The weather failed him.** That’s why **Jugaad** exists.
>
> Rainfall crosses **25 mm/hr**. The trigger fires. GPS verifies his zone. **₹680 lands in his UPI.** No forms. No claims. No waiting.
>
> *Because insurance shouldn’t begin after the crisis. It should respond the moment the crisis starts.*

---
</div>
<br/>

## Table of Contents

- [What is Jugaad?](#-what-is-jugaad?)
- [The 7 Scenarios We Cover](#️-the-7-scenarios-we-cover)
- [System Architecture](#️-system-architecture)
- [ML & AI Engine](#-ml--ai-engine)
- [Zero-Trust Security](#-zero-trust-security--anti-spoofing)
- [Premium & Payout Model](#-premium--payout-model)
- [IRDAI Compliance Checklist](#-irdai-compliance-checklist)
- [Legal & Regulatory](#-legal--regulatory-compliance)
- [Tech Stack](#-tech-stack)
- [Running Locally](#-running-locally)
- [Deployed App](#-deployed-app)
- [Meet the team](#-team)

## 🌧️ What is Jugaad?

**Jugaad** is a fully automated **parametric income insurance platform** for India's 5–8 million food delivery workers.

When weather stops deliveries, their income shouldn't stop too.

Traditional insurance requires filing claims, waiting weeks, proving loss. **GigShield doesn't.** An objective weather threshold is crossed → GPS verifies the rider is in the affected zone → ₹ lands in their UPI wallet. Under 2 hours. Zero paperwork. Zero human intervention.

```
External disruption fires  →  GPS verified in real-time  →  ₹ transferred via UPI in < 2 hrs
         (objective API)          (zero-trust engine)           (Razorpay sandbox)
```

> **Parametric insurance** pays on a *measurable event* — not on proving loss.
> No forms. No agents. No waiting. The algorithm pays — instantly, fairly, automatically.

### Why food delivery workers?

| Pain Point | The Reality |
|---|---|
| 💸 Fixed costs never pause | Bike EMI ₹2,800–3,200/month + fuel ₹180–220/day — due whether they work or not |
| 🎯 The incentive trap | One 2-hr rain event → miss weekly slab → lose ₹800 bonus *on top of* lost orders |
| ⚠️ No safety net | 90% have zero savings buffer; 68% spend more than they earn |
| 🌧️ Platforms profit, riders don't | Zomato charges 40% surge in rain — riders receive ₹0 extra |

---

## ⛈️ The 7 Scenarios We Cover

Every trigger uses **objective, third-party, government-verified data.** No forms. No calls.

| # | Scenario | Trigger | Payout | Data Source |
|---|---|---|---|---|
| 🌡️ 1 | Extreme Heat | IMD Red Alert + heat index ≥44°C for 2+ hrs | 70% avg daily earnings | IMD + Open-Meteo |
| 🌧️ 2 | Heavy Rain & Flooding | Rainfall ≥25mm/hr for 90+ min in rider's zone | 70% shift earnings + **Slab Shield** | IMD + Open-Meteo |
| 🌫️ 3 | Dense Winter Fog | IMD Dense Fog advisory + visibility <100m for 3+ hrs | Half-shift income (7–11 PM) | IMD Fog Bulletins |
| 😷 4 | Severe AQI Pollution | CPCB AQI ≥400 for 3+ consecutive hours | Health Safety Supplement | CPCB API (free, hourly) |
| 🚫 5 | Bandh / Curfew | NewsAPI 3+ sources confirmed + zone orders drop ≥65% | Full declared shift income | GNews API + platform mock |
| 🚧 6 | Metro / Congestion | Avg travel time >200% of historical mean | Per-hour Congestion Supplement | OSRM (open-source) |
| 💀 7 | Platform App Outage | Downdetector 500+ reports + outage >45 min peak hours | Hourly rate × outage duration | Downdetector (independent) |

> **The Jugaad Principle:** Every payout is triggered by objective, third-party, government-verified or publicly monitored data. The worker never has to prove anything. The insurer never has to investigate anything. The algorithm pays — instantly, fairly, automatically.

---

⚖️ Coverage Scope & The Golden Rules
* ✅ **Income Loss Protection Only:** This platform is strictly designed as a safety net for lost hours and unearned wages due to external events.
* 🚫 **Exclusions:** We strictly exclude any coverage for health issues, life insurance, accidents, or vehicle repairs.



## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           GIGSHIELD PLATFORM                                 │
│                                                                              │
│  ┌─────────────────┐   ┌──────────────────┐   ┌───────────────────────────┐ │
│  │   React PWA     │   │  Node.js/Express │   │   Python FastAPI          │ │
│  │   Frontend      │◄──┤  Backend API     │◄──┤   ML Engine               │ │
│  │                 │   │  + Socket.io     │   │                           │ │
│  │  Worker View    │   │  + node-cron     │   │  · XGBoost (pricing)      │ │
│  │  Admin Hub      │   │  (2-min trigger) │   │  · Prophet (forecasting)  │ │
│  │  Offline SOS    │   │                  │   │  · Isolation Forest (fraud)│ │
│  │  Security Lock  │   │                  │   │  · Kinematic ML           │ │
│  └────────┬────────┘   └────────┬─────────┘   └───────────────────────────┘ │
│           │                     │                                            │
│  ┌────────▼─────────────────────▼──────────────────────────────────────┐    │
│  │                  PostGIS PostgreSQL Database                         │    │
│  │       Workers · Policies · Claims · GPS Points · Fraud Flags        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  External Oracles (all free / govt-published):                              │
│  Open-Meteo · CPCB · IMD · GNews API · OSRM · Downdetector · Nominatim     │
│  Razorpay Sandbox (payouts) · Twilio (SMS SOS) · DigiLocker (KYC)          │
└──────────────────────────────────────────────────────────────────────────────┘
                    All services networked via Docker Compose
```

---

**[ PUT THIS HERE — System Architecture Diagram (visual flowchart of the above) ]**

---

### Trigger → Payout flow (60 seconds to 2 hours)

```
External API polled every 2 min (Open-Meteo / CPCB / IMD / GNews / Downdetector)
                            │
                    Threshold breached?
                            │
              ┌─────────────▼─────────────┐
              │  Claim Trigger Validator  │  ← dual-source confirmation required
              │  (Rule engine + ML hybrid)│
              └─────────────┬─────────────┘
                            │
                 Confidence score computed
                            │
              ┌─────────────▼─────────────┐
              │    Fraud Engine           │  ← kinematic check + device trust
              │    (Zero-Trust Layer)     │    + ring detection
              └─────────────┬─────────────┘
                            │
               Score ≥ 0.85?──────YES──────► Auto-approve → UPI payout fires
                            │
                           NO
                            │
                    Human review queue (2-hr SLA)
                            │
                Worker notified: "₹680 credited. Stay safe."
```

---

**[ PUT THIS HERE — Trigger-to-Payout flow diagram screenshot ]**

---

## 🤖 ML & AI Engine

GigShield's intelligence layer does three things: **price risk fairly each week**, **predict disruptions before they hit**, and **validate every trigger before a payout fires.**

Every data source used is free, open, or government-published — zero paid API dependency.

### The six models

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ML PIPELINE (runs every Sunday)                      │
│                                                                             │
│  1. Earnings DNA Profiler   →  Gradient Boosted Regressor                  │
│     Personalised income fingerprint per rider at onboarding                │
│     Powers Slab Shield: predicts if disruption kills weekly bonus          │
│                                                                             │
│  2. Dynamic Premium Engine  →  XGBoost                                     │
│     11 risk factors → weekly risk score (0–1) → premium ₹29–₹99           │
│     Runs Sunday midnight · Premium confirmed in DB by 6 AM                 │
│                                                                             │
│  3. Risk Zone Classifier    →  Random Forest                               │
│     Labels every delivery zone: LOW / MEDIUM / HIGH per scenario           │
│     Kurla ≠ Powai — same city, different zone, different premium           │
│                                                                             │
│  4. Disruption Predictor    →  Prophet                                     │
│     Forecasts P(trigger) per scenario per zone for next 7 days             │
│     P > 0.40 → seasonal multiplier rises + Sunday rider alert fires        │
│                                                                             │
│  5. Claim Trigger Validator →  Rule engine + ML hybrid                     │
│     Hard threshold check → dual-source confirm → confidence score          │
│     ≥ 0.85 → auto-pay · < 0.85 → human review queue                       │
│                                                                             │
│  6. Continuous Learning     →  Weekly retraining loop                      │
│     Actual loss / Expected loss → nudges all models ±15% per week          │
│     Basis risk shrinks every monsoon, every fog winter, every heatwave     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### BCR simulation — financial proof

```
14-day monsoon stress test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Premium inflow     →  tracked daily across simulated user pool
Payout outflow     →  weather-driven triggers, zone-by-zone
Fraud losses       →  ML-flagged + blocked by kinematic engine

Calibrated BCR  =  0.67
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Sustainable band: 0.6 – 0.7
✓ Pool remains solvent under 14-day continuous extreme stress
✓ Not exploitative (< 0.8), not loss-making (> 0.5)
✓ PDF + graph artifact generated → /ml/reports/bcr_simulation.pdf
```

<img width="563" height="296" alt="image" src="https://github.com/user-attachments/assets/824be6c5-dde6-424b-93a8-d67865cefcc2" />
</br>

<img width="563" height="296" alt="image" src="https://github.com/user-attachments/assets/87910e82-1c23-4405-a5b6-7b57e30f1750" />


---

## 🛡️ Zero-Trust Security & Anti-Spoofing

> *"GPS alone is dead. We require five independent signal layers — all of which must agree before a rupee leaves the pool."*

### The hardware handshake

Every session: live HTML5 device coordinates are sent — not stored, not cached, not user-typed. Declared city is geocoded via Nominatim. Distance delta triggers lockout if violated.

```
User types "Bangalore" at onboarding
              ↓
Nominatim geocodes → 12.97°N, 77.59°E
              ↓
Device GPS reads → 8.52°N, 76.93°E   ← actual location: Trivandrum
              ↓
Distance delta: 743 km
              ↓
🔴 KINEMATIC VIOLATION — Security Lockout fires on dashboard entry
```

**This is live and demoed.** Type Bangalore. Be in Trivandrum. Watch the red screen fire.

### Four defense layers

```
Layer 1 — Device Trust
  Mock-location flags · rooted/tampered device detection · Android Play Integrity
  If the device environment is compromised → GPS output rejected outright

Layer 2 — Mobility Authenticity
  Last 15–30 min GPS telemetry analyzed · teleport jumps flagged
  Route matched against real road network via OSRM
  Accelerometer/gyroscope used as soft motion corroboration

Layer 3 — Operational Eligibility
  Active delivery session required · recent order acceptance checked
  Last trusted platform event timestamp + location verified
  Worker at home with no active trip → does not qualify, regardless of GPS

Layer 4 — Ring Detection (Sybil Defense)
  500 workers becoming eligible in same short window → automatic flag
  Shared device fingerprints + shared UPI accounts → graph detection
  Synchronized teleport-into-zone patterns → cluster quarantine
  If real flood: real cancellation spike, real merchant impact exist.
  A syndicate has none of these. That absence is the signal.
```

### Three-tier payout response

| Tier | Condition | Action | Worker sees |
|---|---|---|---|
| ✅ Auto Approve | All signals consistent. Device clean. Route plausible. Active trip confirmed. | Payout fires < 2 min | "₹680 credited. Stay safe." |
| ⏳ Soft Hold | Weak GPS in heavy rain, brief network drop, delayed sync | Wait 10–15 min for signals to stabilize | "Payout being verified. Usually resolves in 15 min." |
| 🔴 Quarantine | Low device trust + impossible route + no active trip + ring-risk | Held → human review | "Under quick review. We'll update you shortly." |

> The Soft Hold tier exists because **honest workers in heavy rain will have degraded signals.** Missing data ≠ fraud. Only contradictory evidence escalates.

---

**[ PUT THIS HERE — Screenshot of the red Security Lockout screen UI ]**

---

## 💰 Premium & Payout Model

> A risk-adjusted, income-based micro-insurance framework. Premiums computed every Sunday, debited every Monday at 9 AM via UPI auto-mandate.

### How premium is calculated

```
Step 1 — Base Premium
  Base = Weekly Income × Base Rate (1.5% – 2%)
  ML cross-checks declared income against zone average to prevent fraud at source

Step 2 — Risk Multipliers
  Adjusted = Base × City Risk (0.85–1.40×)
                  × Shift Factor (0.85–1.20×)
                  × Platform Factor (1.00–1.10×)
                  × Zone Factor (0.80–1.30×)

Step 3 — Affordability Cap
  Final = min(max(Adjusted, ₹29), ₹99)
  Hard floor ₹29 — always affordable even for part-time workers
  Hard ceiling ₹99 — never more than ~2.5% of full-time weekly income
```

### Coverage tiers

| Tier | Weekly Premium | Coverage | Triggers | Max Weekly Payout |
|---|---|---|---|---|
| 🟡 Basic | ₹29 – ₹49 | 60% daily income | Any 3 of 7 | ~₹720 |
| 🔵 Standard ✦ | ₹49 – ₹79 | 70% daily income | All 7 + **Slab Shield** | ~₹1,400 |
| 🔴 Full Shield | ₹79 – ₹99 | 80% daily income | All 7 + Platform Bridge | ~₹2,400 |

### Dynamic weekly recalibration

```
New Premium = Old Premium × (Actual Loss / Expected Loss)
Change capped at ±15% per week — no premium shock

A dry November week costs less.
A monsoon July week costs more.
Workers see exactly why, every Sunday morning.
```

---

## ✅ IRDAI Compliance Checklist

| # | Requirement | Status | Implementation |
|---|---|---|---|
| 1 | Trigger objective & verifiable | ✅ | AQI >300 / rain ≥25mm/hr from CPCB + IMD — quantifiable, public, tamper-proof |
| 2 | Health, life & vehicle excluded | ✅ | Legal disclaimer hardcoded in UI: *"Covers income loss from weather only"* |
| 3 | Payout automatic | ✅ | Trigger → GPS verify → UPI transfer within 2 hours via cron |
| 4 | Pool financially sustainable | ✅ | **BCR 0.67** — 14-day monsoon stress-tested, PDF artifact in `/ml/reports/` |
| 5 | Fraud detection on data, not behaviour | ✅ | GPS × login cross-check, kinematic ML, Sybil ring detection |
| 6 | Premium collection frictionless | ✅ | ₹29–₹99/week via UPI auto-mandate — zero manual steps |
| 7 | Dynamic pricing, not flat | ✅ | XGBoost: HIGH risk → +10% premium, LOW risk → discount, seasonal + zone adjustments |
| 8 | Adverse selection blocked | ✅ | 48-hour enrollment lockout before weather red alerts (FastAPI hard block) |
| 9 | Operational cost near zero | ✅ | Fully containerised straight-through processing, zero human in claims loop |
| 10 | Basis risk minimized | ✅ | Ward-level GPS mapping via Nominatim — not broad 15km city radius |

---

## 🏛️ Legal & Regulatory Compliance

### Social Security Code, 2020

The SS Code formally recognises gig workers as eligible for welfare benefits for the first time in India.

GigShield implements the **90/120-day engagement rule** in backend math, not just UI:

```
Single platform worker  →  90 active days in FY  →  state-backed social security unlocked
Multi-apping worker     →  120 active days in FY →  state-backed social security unlocked

Progress bar in-app switches targets automatically based on platform sync data.
```

### DPDP Act, 2023 — consent flow

Three data types collected. Each with an explicit, **un-pre-checked** consent box:

| Data | Purpose | Consent Requirement | Built? |
|---|---|---|---|
| 📍 Continuous GPS | Verify worker is in trigger zone | Separate consent screen | ✅ |
| 🏦 Bank / UPI account | Payout disbursement | Explicit consent + KYC mention | ✅ |
| 📱 Platform activity | Confirm active delivery days | Data sharing agreement | ✅ |

---

<img width="1662" height="909" alt="image" src="https://github.com/user-attachments/assets/5a317190-b999-44b4-bfb3-d181a95b1b74" />


---

## 📱 Offline Resilience — The SOS Protocol

Storms kill internet. Workers can't lose coverage when the network drops.

```
Worker loses internet during storm
              ↓
App detects network loss instantly
              ↓
Red fallback banner appears on screen
              ↓
SMS auto-populated with exact GPS coordinates
              ↓
POST /api/webhook/sms-sos (Twilio-compatible endpoint)
              ↓
Emergency ₹500 claim processed
Bypasses 2-minute cron timer entirely
```

No internet. Still covered. No action needed from the worker.

---

## 🖥️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js + Vite | Component-based PWA with fast builds |
| Tailwind CSS | Responsive, mobile-first styling |
| Framer Motion | Smooth UI transitions and animations |
| Firebase Auth (Phone OTP) | Secure, frictionless onboarding |
| Socket.io client | Real-time payout notifications |

### Backend & API Layer

| Technology | Purpose |
|---|---|
| Node.js + Express | Core API orchestration + policy CRUD |
| Socket.io | Real-time frontend push (payout alerts) |
| node-cron | Automated trigger engine (every 2 min) |
| FastAPI (Python) | ML model serving + inference endpoints |
| JWT | Secure session handling |

### ML / AI Engine

| Model | Purpose |
|---|---|
| XGBoost | Dynamic premium calculation (11 risk factors) |
| Prophet | Disruption probability forecasting (7-day) |
| Isolation Forest | Anomaly + fraud detection |
| LightGBM | Fraud scoring (tabular, handles missing data) |
| scikit-learn | Pipelines + feature engineering |
| MLflow | Experiment tracking + model versioning |

### Data Sources (all free / open / government-published)

| Source | Data |
|---|---|
| Open-Meteo | Rain, heat index, fog, wind |
| CPCB / OpenAQ | AQI (hourly, city-specific) |
| IMD | Red alerts, fog bulletins, rainfall bulletins |
| GNews API | Bandh / curfew keyword detection |
| OSRM | Open-source travel time routing |
| Downdetector | Platform outage signals (independent) |
| Nominatim | Geocoding for ward-level location mapping |

### Infrastructure

| Tool | Purpose |
|---|---|
| PostgreSQL + PostGIS | Structured storage with geographic coordinate support |
| Redis | Real-time trigger caching + fast lookups |
| Docker + Docker Compose | Full multi-container orchestration |
| GitHub Actions | CI/CD pipeline |
| Razorpay Sandbox | Instant payout simulation |
| Twilio | SMS SOS webhook |
| DigiLocker API | KYC verification |

---

## 🚀 Running Locally

### Prerequisites

- Docker + Docker Compose installed
- Node.js 18+
- Python 3.10+
- Git

### One-command setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/gigshield.git
cd gigshield

# 2. Copy environment config
cp .env.example .env
# Fill in your API keys (see Environment Variables below)

# 3. Boot the entire stack
docker-compose up --build
```

All four services will spin up automatically:

| Service | URL | Description |
|---|---|---|
| Frontend (React PWA) | http://localhost:3000 | Worker dashboard + admin hub |
| Backend (Express) | http://localhost:5000 | Core API + WebSocket server |
| ML Engine (FastAPI) | http://localhost:8000 | Risk scoring + fraud detection |
| Trigger Engine (Cron) | Internal | Polls weather APIs every 2 min |
| PostgreSQL + PostGIS | localhost:5432 | Auto-initialised from schema.sql |

### Environment variables

```env
# ── Backend ─────────────────────────────────
DATABASE_URL=postgresql://gigshield:pass@postgres:5432/gigshield
JWT_SECRET=your_jwt_secret_here
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

# ── ML Engine ────────────────────────────────
CPCB_API_KEY=your_cpcb_key
OPEN_METEO_BASE=https://api.open-meteo.com/v1
GNEWS_API_KEY=your_gnews_key
NOMINATIM_URL=https://nominatim.openstreetmap.org
TEST_MODE=true               # true = mock data, false = live worker DB
BCR_OUTPUT_PATH=./reports

# ── Frontend ─────────────────────────────────
VITE_BACKEND_URL=http://localhost:5000
VITE_ML_URL=http://localhost:8000
FIREBASE_API_KEY=your_firebase_key
```

### Simulate a trigger event (for testing)

```bash
# Force a "Heavy Rain" event in zone Kurla-Mumbai for testing
curl -X POST http://localhost:5000/api/debug/simulate-trigger \
  -H "Content-Type: application/json" \
  -d '{"scenario": "heavy_rain", "zone": "kurla_mumbai", "intensity": "severe"}'

# Expected: WebSocket push fires → dashboard shows green payout screen
# Expected: Worker gets "₹680 credited. Stay safe." notification
```

### Run the BCR simulation

```bash
cd ml
python bcr_simulation.py --days 14 --scenario monsoon --output ./reports
# Generates: reports/bcr_simulation.pdf + reports/bcr_graph.png
```

---

## 🌐 Deployed App

> ⚠️ **Integration in progress** — deployment links will be added here once final Docker-Compose integration is complete.

**[ PUT THIS HERE — Add deployed URLs once integration is done ]**

```
Frontend  →  https://gigshield.vercel.app          (coming soon)
Backend   →  https://gigshield-api.render.com      (coming soon)
ML Engine →  https://gigshield-ml.render.com       (coming soon)
```

---

## 📁 Project Structure

```
gigshield/
│
├── frontend/                        # React PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── OnboardingConsent.jsx     # DPDP 3-consent flow
│   │   │   ├── SecurityLockout.jsx       # Kinematic violation overlay (red screen)
│   │   │   ├── ProgressBar.jsx           # 90/120-day SS Code tracker
│   │   │   ├── OfflineSOS.jsx            # SMS fallback banner
│   │   │   ├── PayoutNotification.jsx    # Green payout screen via WebSocket
│   │   │   └── AdminDashboard.jsx        # Loss ratio + fraud queue view
│   │   └── ...
│   └── Dockerfile
│
├── backend/                         # Node.js / Express
│   ├── routes/
│   │   ├── admin.js                      # Metrics, fraud queue, graph data
│   │   ├── claims.js                     # Claim processing + UPI triggers
│   │   ├── users.js                      # Registration + DPDP consent logging
│   │   └── webhook.js                    # Twilio SOS endpoint
│   ├── engine/
│   │   └── triggerEngine.js              # Cron + WebSocket orchestrator
│   └── Dockerfile
│
├── ml/                              # Python FastAPI ML Engine
│   ├── risk_scoring.py                   # Multi-signal risk pipeline (XGBoost)
│   ├── bcr_simulation.py                 # 14-day monsoon stress test → PDF
│   ├── fraud_detection.py                # Kinematic + Sybil checks (LightGBM)
│   ├── lockout_predictor.py              # 48hr forecast + ML hybrid
│   ├── premium_engine.py                 # Dynamic pricing (11 risk factors)
│   ├── disruption_forecast.py            # Prophet 7-day scenario forecasting
│   ├── reports/                          # Generated BCR graphs + PDFs
│   └── Dockerfile
│
├── db/
│   └── schema.sql                        # PostGIS auto-init schema
│
├── docker-compose.yml               # Full stack orchestration
├── .env.example                     # Environment variable template
└── README.md
```

---

## 👥 Team

| Member | Domain | Key Contributions |
|---|---|---|
| **Priya** | ML / Data Science | BCR simulation, XGBoost pricing engine, kinematic fraud model, monsoon stress test, adverse selection lockout API |
| **Samridhi** | Geo / Backend Orchestration | Ward-level GPS mapping, Nominatim integration, trigger cron orchestrator, fraud routing pipeline |
| **Neema** | Backend / Infrastructure | Express API, PostGIS migrations, Docker Compose, UPI auto-deduction architecture, admin hub |
| **Bhavana** | Frontend / Compliance | DPDP consent flow, kinematic lockout UI, real-time dashboard, offline SOS, WebSocket notifications |

---

## 📦 Phase 3 Submission Checklist

| Deliverable | Status |
|---|---|
| ✅ 5-minute demo video | **[ PUT THIS HERE — Add video link ]** |
| ✅ Pitch deck (PDF) | **[[ Click here]](https://drive.google.com/drive/folders/1-4tH2nAV8p89iXrHkJ2WtXvpOVPL0Sbv?usp=sharing)** |
| ✅ Source code (default branch) | This repository |
| 🔄 Deployed app (preferred) | In progress — see [Deployed App](#-deployed-app) |
| ✅ BCR simulation artifact | `/ml/reports/bcr_simulation.pdf` |
| ✅ Docker Compose (local setup) | `docker-compose up --build` |

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:001219,30:005F73,60:0A9396,85:94D2BD,100:E9D8A6&height=120&section=footer" width="100%"/>

**Built with ❤️ for India's 8 crore invisible workers**

*"He kept riding next week. His family is okay. That's what insurance is really for."*

[![DEVTrails 2026](https://img.shields.io/badge/DEVTrails_2026-Guidewire_Software-FFD700?style=for-the-badge)](/)

</div>
