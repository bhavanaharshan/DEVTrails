# 🛡️ [Project Name]: AI-Powered Parametric Insurance for Gig Economy Delivery Partners

[![Guidewire DEVTrails](https://img.shields.io/badge/Guidewire-DEVTrails_2026-blue)](#) [![Phase 1](https://img.shields.io/badge/Phase-1_Ideation-green)](#) 

> **Brief Pitch:** [Project Name] is a parametric insurance platform designed exclusively to protect the livelihoods of [Insert Specific Persona, e.g., Q-Commerce Delivery Partners like Zepto/Blinkit] from uncontrollable external disruptions. We ensure that when the weather stops, their income doesn't.

---

## 📑 Table of Contents
1. [The Persona & The Problem](#1-the-persona--the-problem)
2. [Coverage Scope & The Golden Rules](#2-coverage-scope--the-golden-rules)
3. [Persona-Based Scenarios & Workflow](#3-persona-based-scenarios--workflow)
4. [Parametric Triggers & The Financial Model](#4-parametric-triggers--the-financial-model)
5. [AI & Machine Learning Architecture](#5-ai--machine-learning-architecture)
6. [Platform Strategy: Web vs. Mobile](#6-platform-strategy-web-vs-mobile)
7. [Technical Stack](#7-technical-stack)
8. [6-Week Development Plan](#8-6-week-development-plan)
9. [Phase 1 Video Pitch](#9-phase-1-video-pitch)

---
# 👥 Persona & Scenario Analysis

## Why Food Delivery Workers?

India's **5–8 million food delivery workers** (Zomato, Swiggy) are the backbone of the urban digital economy — yet they are completely unprotected when external disruptions wipe out their income.

We chose this persona because no existing insurance product in India covers **income loss from weather, platform failures, or social disruptions.**
> When it rains → ₹0. App crashes → ₹0. Bandh called → ₹0. **We fix that.**

| Pain Point | The Reality |
|---|---|
| 💸 Fixed costs never pause | Bike EMI ₹2,800–3,200/month + fuel ₹180–220/day — due whether they work or not |
| 🎯 The incentive trap | One 2-hr rain event → miss weekly slab → lose ₹800 bonus on top of lost orders |
| ⚠️ No safety net | [90% have zero savings buffer](https://www.niti.gov.in/sites/default/files/2022-06/India_Gig_Economy_Report_27062022.pdf) ; [68% spend more than they earn](https://www.financialexpress.com/business/industry/) |
| 🌧️ Platforms profit, riders don't | Zomato charges 40% surge pricing in rain — [riders receive ₹0 extra](https://restofworld.org/2024/india-heat-wave-delivery-workers/) |

---

## 🗂️ 7 Scenarios — 3 Domains

> Every trigger uses **objective, third-party, government-verified data.** No forms. No calls. UPI payout in 60 seconds.

---

### 🌡️ Domain 1 — Extreme Weather

---

#### 🔴 Scenario 1 — Extreme Heat
> *"The sun is my boss, and it doesn't pay me."*

**Persona:** Devender Kumar, 31 · Swiggy · Delhi · Sole earner, family of 4

Temperatures crossed **50°C in Delhi in summer 2024** — the highest in 50 years. Devender cannot log off without losing his ₹180 daily incentive, so he rides for 7 hours in 48°C heat and nets ₹310 after fuel. No heat protection exists anywhere in India for gig workers.

📎 [Rest of World — India's heat wave and gig workers (2024)](https://restofworld.org/2024/india-heat-wave-delivery-workers/) · [IMD Heatwave Data](https://mausam.imd.gov.in/)

| Trigger | Payout | Source |
|---|---|---|
| IMD Red Alert + heat index ≥44°C for 2+ hrs in active shift | 70% of avg daily earnings, auto UPI | IMD + [Open-Meteo](https://open-meteo.com/) |

- Worker can log off safely -> Zero fraud risk — no one controls the sun -> 20+ yrs of IMD data for precise pricing

---

#### 🌧️ Scenario 2 — Heavy Rain & Flooding
> *"Platforms profit from the rain. We drown in it."*

**Persona:** Ravi Kumar, 28 · Zomato · Mumbai (Kurla) · Bike EMI ₹3,200/month

During Mumbai's monsoon, zone orders collapse 70% in 20 minutes while Zomato charges customers a 40% surge fee. Ravi earns ₹90 in his peak 3-hour window and misses his ₹800 weekly slab bonus — losing both base income and his incentive.

📎 [IMD Mumbai Rainfall Bulletins](https://mausam.imd.gov.in/) · [Gig Workers & Monsoon Income Loss — The Hindu](https://www.thehindu.com/news/cities/mumbai/mumbai-rains-affect-delivery-workers/)

| Trigger | Payout | Source |
|---|---|---|
| Rainfall ≥25mm/hr for 90+ min in rider's zone | 70% shift earnings + **Slab Shield** (missed bonus paid too) | IMD + [Open-Meteo](https://open-meteo.com/) |

* Slab Shield is unique — covers the bonus cascade loss no other product addresses · * Minute-level IMD data, fully tamper-proof

---

#### 🌫️ Scenario 3 — Dense Winter Fog
> *"The app timer counts down. The road disappears."*

**Persona:** Arjun Mishra, 24 · Zomato · Lucknow · Remits ₹5,000/month to family

Visibility: 30 metres. Delivery timer: 18 minutes. Slow down → rating drops. Speed up → accident risk. Arjun has no financial reason to choose safety. The All India Gig Workers Union demanded *"withdrawal of fast delivery mandates in fog"* in their December 2025 strike charter — platforms did not respond.

📎 [AIGWU Strike Charter, Dec 2025](https://thelogicalindian.com/swiggy-zomato-blinkit-delivery-workers-on-nationwide-strike-key-demands-new-years-eve-disruptions/) · [IMD Fog Bulletins](https://mausam.imd.gov.in/imd_latest/contents/fog-bulletins.php)

| Trigger | Payout | Source |
|---|---|---|
| IMD Dense Fog advisory + visibility <100m for 3+ hrs during shift | Half-shift income (7–11 PM window) | [IMD Fog Bulletins](https://mausam.imd.gov.in/imd_latest/contents/fog-bulletins.php) |

* First product in India that pays a rider to make the safe choice ->  40–60 fog days/winter in North India = predictable risk pool

---

#### 😷 Scenario 4 — Severe Air Pollution (AQI)
> *"I breathe in what others drive away from."*

**Persona:** Delivery workers across Delhi-NCR — 10–12 hrs/day in hazardous air

Delhi's AQI breaches 400 (Severe) for weeks every winter. Workers keep riding to avoid losing daily incentives, accumulating respiratory damage with no compensation. CPCB data is real-time, city-specific, and freely accessible — a perfect parametric trigger.

📎 [CPCB AQI Data Portal](https://cpcb.nic.in/) · [WHO Report on Air Pollution & Outdoor Workers](https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health)

| Trigger | Payout | Source |
|---|---|---|
| CPCB AQI ≥400 for 3+ consecutive hours | Health Safety Supplement — partial shift income | [CPCB API](https://cpcb.nic.in/) (free, hourly) |

* Government-published, updated hourly, city-specific ->  Worker can reduce hours without a financial penalty

---

### 🏙️ Domain 2 — Social & Infrastructure Disruptions

---

#### 🚫 Scenario 5 — Unplanned Bandh / Curfew
> *"A bandh can be declared at any time. There is no protection."*

**Persona:** Priya Devi, 34 · Swiggy · Chennai · Part-time (4–9 PM) · Child's school fees due

A flash bandh at 4:45 PM — no warning. Restaurants close. Orders vanish. Priya earns ₹150 instead of ₹600 and misses her child's ₹1,200 school fee. In December 2025, ~1 lakh workers lost full-day income on Christmas and New Year's Eve due to strikes and platform disruptions. Compensation paid: ₹0.

📎 [Nationwide Strike — Dec 31, 2025](https://thelogicalindian.com/swiggy-zomato-blinkit-delivery-workers-on-nationwide-strike-key-demands-new-years-eve-disruptions/) · [Bandh Impact on Gig Workers — Economic Times](https://economictimes.indiatimes.com/tech/technology/gig-workers-loss/)

| Trigger | Payout | Source |
|---|---|---|
| NewsAPI: 'bandh'/'curfew' confirmed in 3+ sources **AND** zone orders drop ≥65% | Full declared shift income | [NewsAPI](https://newsapi.org/) + platform mock |

* **Dual-source = zero fraud** — you can't fake a national news event AND a platform-wide order collapse ·  Fully automated

---

#### 🚧 Scenario 6 — Metro / Construction Congestion
> *"I'm stuck in traffic. The timer is running. I'm earning nothing."*

**Persona:** Delivery workers near Metro corridors — Mumbai, Delhi, Bengaluru, Chennai

Active Metro construction has added 25–40 minutes to last-mile delivery routes across major corridors. Riders spend 40–60% more time per delivery but earn the same flat rate. Income per hour drops silently — with no disruption event they can report.

📎 [Mumbai Metro Route Impact on Traffic — Times of India](https://timesofindia.indiatimes.com/city/mumbai/metro-construction-traffic/) · [Delhi Metro Phase 4 Delays](https://www.hindustantimes.com/cities/delhi-news/)

| Trigger | Payout | Source |
|---|---|---|
| Traffic API: avg travel time >200% of historical mean for rider's hub | Per-hour Congestion Supplement | Google Maps / HERE Maps (mock API) |

* Route-level travel history is objectively verifiable -> First product to treat chronic congestion as an insurable income event

---

### 📱 Domain 3 — Platform Reliability

---

#### 💀 Scenario 7 — Platform App Outage
> *"The app was down for 4 hours. Zomato made a tweet. I made ₹0."*

**Persona:** Mohammed Rizwan, 29 · Zomato · Mumbai (Andheri) · Peak target ₹800–950/evening

Zomato's server went down on a Friday evening in October 2021 — peak dinner rush. 3.5 lakh riders were online. Collective income loss: estimated ₹70–140 crore. Platform response: one social media post. Rider compensation: ₹0. Multiple outages have occurred since with no structural fix.

📎 [Zomato Outage — India.com, Oct 2021](https://www.india.com/news/india/breaking-zomato-server-down-due-to-outage-customers-face-issue-while-ordering-food-5075873/) · [Downdetector India](https://downdetector.in/)

| Trigger | Payout | Source |
|---|---|---|
| [Downdetector](https://downdetector.in/): 500+ reports in 15 min + outage >45 min during peak hours | Hourly rate × confirmed outage duration | Downdetector API (independent) |

* Fully independent of Zomato/Swiggy — cannot be manipulated ·  No claim form, no chatbot — money lands automatically

---



<div align="center">

> **The GigShield Principle:** Every payout is triggered by objective, third-party, government-verified or publicly monitored data. The worker never has to prove anything. The insurer never has to investigate anything. The algorithm pays — instantly, fairly, automatically.
</div>




## 2. ⚖️ Coverage Scope & The Golden Rules
* ✅ **Income Loss Protection Only:** This platform is strictly designed as a safety net for lost hours and unearned wages due to external events.
* 🚫 **Exclusions:** We strictly exclude any coverage for health issues, life insurance, accidents, or vehicle repairs.




---
# 💰 Weekly Premium & Payout Model

> A **risk-adjusted, income-based** micro-insurance framework — affordable, dynamic, and ML-powered.
> Premiums are computed **every Sunday** and debited **every Monday at 9 AM** via UPI auto-mandate.

---

## Why Weekly?

Gig workers earn and spend weekly — not monthly or annually. A ₹500/month product feels like a debt. A ₹69/week product feels like a choice.

| Traditional Insurance | GigShield |
|---|---|
| Annual or monthly premium | **Weekly** — aligned with earnings cycle |
| Fixed price, always | **Dynamic** — cheaper in safe weeks |
| Claim form + wait | **Auto-payout** — 60 seconds, no form |
| One-size payout | **Income-anchored** — based on your actual earnings |


---

## 🧮 How Premium Is Calculated — 3 Steps

### Step 1 — Base Premium
```
Base Premium = Weekly Income × Base Rate (1.5% – 2%)
```
Anchored to the worker's **declared weekly earnings** at onboarding.
ML cross-checks against zone average to prevent inflation.

> 📊 Real earnings baseline (Zomato/Swiggy 2025): ₹102/hr average · ₹2,800–6,500/week depending on hours

---

### Step 2 — Risk Multipliers
```
Adjusted Premium = Base Premium × City Risk × Shift Factor × Platform Factor × Zone Factor
```

| Multiplier | Range | Driven By | Updates |
|---|---|---|---|
| 🏙️ City Risk | 0.85× – 1.40× | IMD zone history + CPCB AQI records | Monthly |
| 🌙 Shift Factor | 0.85× – 1.20× | Peak-hour vs morning shift exposure | At onboarding |
| 📱 Platform Factor | 1.00× – 1.10× | Outage frequency per platform | Weekly |
| 📍 Zone Factor | 0.80× – 1.30× | Hyperlocal flood / congestion history | Weekly |

---

### Step 3 — Affordability Cap
```
Final Premium = min(max(Adjusted Premium, ₹29), ₹99)
```

**Hard floor ₹29** — always affordable, even for part-time workers.
**Hard ceiling ₹99** — never more than ~2.5% of a full-time weekly income.

---

## 💸 Payout Calculation

```
Daily Income    = Weekly Income ÷ 7
Daily Payout    = Daily Income × Coverage % (60% – 80%)
Max Weekly Payout = Daily Payout × Max Trigger Days (3)
```

### Coverage Tiers

| Tier | Weekly Premium | Coverage | Triggers Covered | Max Weekly Payout |
|---|---|---|---|---|
| 🟡 Basic | ₹29 – ₹49 | 60% daily income | Any 3 of 7 | ~₹720 |
| 🔵 Standard ✦ | ₹49 – ₹79 | 70% daily income | All 7 + Slab Shield | ~₹1,400 |
| 🔴 Full Shield | ₹79 – ₹99 | 80% daily income | All 7 + Platform Bridge | ~₹2,400 |

> **Slab Shield** — unique to GigShield. If a disruption knocks the rider below their weekly incentive threshold, the missed platform bonus is added to the payout. No other product in India covers this.

---

## 🔁 Dynamic Premium Adjustment (Weekly Recalibration)

```
New Premium = Old Premium × (Actual Loss / Expected Loss)
```

- Actual loss > expected → premium nudges up next week
- Actual loss < expected → premium nudges down next week
- Change is capped at ±15% per week to avoid premium shock

This means a dry, uneventful week in November **costs less**. A monsoon week in July **costs more**. Workers see exactly why on Sunday morning.

---

## 🤖 ML-Powered Expected Loss Engine

```
Expected Loss = f(Rain, AQI, Zone Risk, Shift Pattern, Historical Claims, Seasonality)
```

| Model | Role | Data Source |
|---|---|---|
| **XGBoost** | Weekly risk score per zone | 10+ yrs IMD + CPCB + claims history |
| **Prophet** | Disruption probability forecast | IMD 7-day forecast + seasonal index |
| **Isolation Forest** | Fraud / anomaly detection | GPS + claim pattern analysis |

**Every Sunday, the pipeline runs:**

```
1. Pull forecasts  →  IMD, CPCB, IOC fuel prices, Downdetector history
2. Score zones     →  XGBoost outputs risk score 0.0 – 1.0 per scenario
3. Forecast week   →  Prophet: if P(trigger) > 0.4, seasonal multiplier rises
4. Compute premium →  Apply all factors, clamp ₹29–99, write to DB by 6 AM
5. Notify worker   →  "Rain likely Wed–Thu. Your cover this week: ₹74. You're protected."
6. Auto-debit      →  UPI mandate fires Monday 9 AM. Policy live instantly.
```

---

## ⚡ Trigger → Payout in 60 Seconds

```
API Data (every 15 min)
        ↓
Threshold Check  →  Does event meet trigger criteria?
        ↓
Fraud Engine     →  GPS active in zone? No anomaly? No duplicate?
        ↓
Confidence Score →  ≥ 0.85  →  Auto-approve & pay via UPI
                 →  < 0.85  →  Human review queue (2-hr SLA)
        ↓
Worker notified: "₹680 credited to your UPI. Stay safe."
```

No form. No call. No waiting.
## 🛡️ Insurer Guardrails — Staying Sustainable

| Guardrail | How It Works |
|---|---|
| **3-day payout cap** | Max 3 trigger events paid per rider per week |
| **Zone pool model** | Riders in same zone share a weekly pool; reinsurance backstop covers overflow |
| **Adverse selection lock** | Tier upgrades blocked 24 hrs before a forecast trigger fires |
| **3-day waiting period** | Weather claims: 3-day wait for new policyholders. Outage claims: none. |
| **Income anchor** | Payout based on onboarding-declared income, not same-day self-report |
| **Target loss ratio** | 55–65% — standard for parametric micro-products globally |

---

<div align="center">

**The GigShield Premium Promise**

*Pay ₹29–₹99 this week.*
*If disruption hits — ₹280 to ₹2,400 lands in your wallet.*
*Automatically. Instantly. No paperwork.*

</div>


---
# 🚨 Adversarial Defense & Anti-Spoofing Strategy
### GigShield's Response to the Market Crash Crisis

---

> **The Attack:** 500 delivery workers. GPS-spoofing apps. Fake locations inside a 
> weather red-zone. Mass false payouts. Liquidity pool drained in minutes.
>
> **The Problem:** Simple GPS verification is dead.
>
> **Our Answer:** GPS is one weak signal. We require five.

---

## Why GPS Alone Fails

A spoofing app can fake coordinates. It cannot simultaneously fake:
- A clean, untampered device environment
- A believable delivery route *into* the zone
- Recent active delivery work
- Plausible travel time from the last real platform event
- Normal behavior across 500 workers at once

Our system requires **signal consistency across all layers** before any payout fires.

---

## The Four Defense Layers

### Layer 1 — Device Trust
*Before trusting location, trust the device.*

- Detects mock-location flags, rooted/tampered devices, emulators
- Uses Android Play Integrity / app attestation
- Flags abnormal location provider switches

A spoofing app almost always leaves traces here. If the device environment is 
compromised, GPS output is rejected outright.

---

### Layer 2 — Mobility Authenticity  
*Did this worker actually travel into the zone?*

- Analyzes last 15–30 min of GPS telemetry, not just current location
- Detects teleport jumps (impossible speed between pings)
- Matches route against real road network
- Uses accelerometer/gyroscope as soft motion corroboration

**A spoofer can fake a point. Faking a full believable delivery trajectory is hard.**

---

### Layer 3 — Operational Eligibility
*Was this worker actually working when disruption hit?*

- Checks active delivery session, recent order acceptance, last pickup/drop-off state
- Verifies last trusted platform event timestamp and location
- Checks travel-time plausibility from last confirmed point to claimed zone

A worker sitting at home with no active trip and no recent delivery activity 
**does not qualify**, regardless of what GPS says.

---

### Layer 4 — Ring Detection
*Individual spoofing is hard to catch with certainty. Mass coordinated fraud is obvious.*

Detects coordinated syndicates by looking for:
- 500 workers becoming eligible within the same short window
- Shared device fingerprints or payout account linkages
- Synchronized "teleport-into-zone" patterns with no platform-side disruption evidence
- Suspicious geohash concentration at zone edges

> If there's a real flood, there's also a real cancellation spike, real merchant 
> impact, real trip stalls. A syndicate has none of these. That absence is the signal.

---

## Data Points Used (Beyond GPS)

| Category | What We Collect | Why It Matters |
|---|---|---|
| Device integrity | Mock-location flag, attestation score, root detection | Catches tampered environments |
| Trajectory | 15–30 min telemetry, speed, heading, road-match confidence | Catches location jumps |
| Motion | Accelerometer + gyroscope summaries | Corroborates physical movement |
| Network | Network type, signal strength, cell info | Cross-checks physical location |
| Platform activity | Active trip status, last delivery event, timestamp | Confirms actual work exposure |
| Travel plausibility | Distance + time from last trusted point | Flags physically impossible movement |
| Weather context | Red-alert polygon, rainfall intensity, road closures | Verifies a real event is occurring |
| Worker baseline | 4-week behavioral history, usual zones and hours | Detects deviation from personal norm |
| Ring linkage | Shared devices, UPI accounts, IPs, synchronized timing | Detects coordinated syndicates |

---

## The Fraud Scoring Pipeline
```
Device Trust Score
      +
Mobility Authenticity Score        →   Payout Risk Score   →   Decision
      +
Operational Eligibility Score
      +
Ring / Cluster Risk Score
```

**Stack used:** Rule engine (fast deterministic checks) + LightGBM fraud model 
(tabular features, handles missing data well) + graph-based cluster detection 
(community detection for ring identification).

No single model. No single signal. Consistent multi-layer evidence required.

---

## Three-Tier Payout Response

### ✅ Tier 1 — Auto Approve *(majority of legitimate cases)*
All signals consistent. Device clean. Route plausible. Active trip confirmed. 
Weather verified. Payout fires in under 2 minutes.

*Worker notification: "Severe weather confirmed in your zone. ₹290 credited."*

---

### ⏳ Tier 2 — Soft Hold *(honest workers with bad weather signal issues)*
Temporary uncertainty — weak GPS accuracy, brief network drop, delayed telemetry 
sync. **No action required from the worker.** System waits 10–15 minutes for 
signals to stabilize or cached data to sync.

*Worker notification: "Your payout is being verified. Usually resolves within 15 minutes."*

> This tier exists specifically because honest workers in heavy rain will have 
> degraded signals. Missing data ≠ fraud. Only contradictory evidence escalates.

---

### 🔴 Tier 3 — Quarantine *(strong contradictory evidence)*
Low device trust + impossible route jump + no active trip + high ring-risk cluster 
association. Payout is **held, not denied**. Routed to secondary review.

*Worker notification: "Your payout is under quick review. We'll update you shortly."*

No worker is permanently rejected by algorithm alone. Every Tier 3 flag gets 
human review.

---

## Liquidity Pool Circuit Breaker

If the engine detects an abnormal eligibility spike with strong ring-risk signals 
concentrated in a micro-zone, suspicious clusters are shifted from instant payout 
to staggered/held payout **at the cluster level only**.

Honest workers outside the suspicious cluster are never blocked.
The pool is protected before it drains, not after.

---

## What This Stops

| Attack vector | How GigShield blocks it |
|---|---|
| GPS spoofing app | Device trust layer rejects tampered environments |
| Plausible fake coordinates | No delivery activity or route history to match |
| Single sophisticated spoofer | Multi-signal scoring requires consistent evidence |
| 500-person coordinated ring | Ring detection isolates cluster before payout fires |
| Honest worker flagged by mistake | Soft hold + human review prevents false denial |

---

## Implementation Scope

**Hackathon MVP (what we build):**
- Rule-based spoof checks + device trust flags
- Route continuity and teleport detection
- LightGBM fraud scoring on tabular features
- Basic graph clustering for ring detection
- Three-tier payout workflow with soft hold
- Liquidity circuit breaker

**Production additions (post-hackathon):**
- LSTM trajectory scoring for deeper path realism
- Advanced graph feature engineering
- Stronger network-layer enrichment

---

*GPS spoofing beats a GPS-only system. It does not beat five independent signal 
layers that all have to agree before a rupee leaves the pool.*
## 5. 🧠 AI & Machine Learning Architecture

Our system leverages machine learning to enable **risk-aware pricing, accurate disruption detection, and fraud prevention**, ensuring both sustainability and trust.

---

### 🔹 Dynamic Premium Engine (Risk Modeling)

We use a supervised learning model (e.g., XGBoost) to estimate **expected loss per rider per week**.

```
Expected Loss = f(Weather Patterns, Zone Risk, Shift Timing, Historical Claims, Seasonality)
```

- Trained on historical weather, disruption, and payout data
- Outputs a **risk score** that drives the weekly premium
- Enables **personalized, location-aware pricing**
- Lower premiums for historically safer zones

---

### 🔹 Risk Zone Classifier

A classification model (e.g., Random Forest) assigns **risk levels to delivery zones**, updated weekly to reflect changing environmental conditions.

| Input Feature         | Output          |
|-----------------------|-----------------|
| Rainfall history      | 🟢 Low Risk     |
| Flood / AQI data      | 🟡 Medium Risk  |
| Past disruption freq. | 🔴 High Risk    |

---

### 🔹 Disruption Prediction Model

A time-series forecasting model (e.g., Prophet / LSTM) predicts **future disruption likelihood** using:

- Weather forecasts
- Seasonal trends
- Historical event patterns

This enables:
- Proactive rider alerts (e.g., *"Heavy rain expected Wednesday"*)
- Better risk planning and forward-looking pricing

---

### 🔹 Fraud Detection Engine

We use an unsupervised model (e.g., Isolation Forest) to detect **suspicious claims**. The engine flags:

- Claims without matching weather or API signals
- Duplicate claims across multiple accounts
- Sudden claim spikes within a small GPS cluster

This ensures system integrity and prevents misuse.

---

### 🔹 Claim Trigger Validator

A hybrid **rule-based + ML confidence system** validates every event before payout is released.

- Requires confirmation from **≥ 2 independent data sources**
- Uses a confidence scoring threshold:

```
If Confidence Score ≥ 0.85 → Auto Approve
Else                        → Manual Review Queue
```

This balances automation with reliability.

---

### 🔁 Continuous Learning Loop

The system improves over time through a feedback loop, incorporating:

- Actual payouts vs. predicted risk
- New disruption events
- Updated rider behavior patterns

```
New Premium ∝ Actual Loss / Expected Loss
```

Models are **retrained weekly** to ensure fair pricing, improved prediction accuracy, and long-term sustainability.

---

### 🎯 Summary

| Component                  | Model Type              | Purpose                          |
|----------------------------|-------------------------|----------------------------------|
| Dynamic Premium Engine     | XGBoost (Supervised)    | Risk-based weekly pricing        |
| Risk Zone Classifier       | Random Forest           | Zone-level risk categorization   |
| Disruption Prediction      | Prophet / LSTM          | Forecast future disruptions      |
| Fraud Detection Engine     | Isolation Forest        | Anomaly & duplicate detection    |
| Claim Trigger Validator    | Rule-based + ML Hybrid  | Auto-approve or flag for review  |

> A fully intelligent backbone powering real-time parametric insurance — self-improving, fraud-resistant, and rider-aware.

## 6. Platform Strategy: Web vs Mobile

**Decision:** Mobile-First Progressive Web App (PWA)

---

### Justification

Delivery partners operate entirely on smartphones in real-time, on the move. Requiring a native app download introduces friction, storage constraints, and onboarding delays.

A mobile-first PWA provides the best balance between accessibility and functionality:

- No installation required — instant onboarding via link
- Works on low-end Android devices with slow networks
- Can be added to the home screen for an app-like experience
- Supports push notifications for disruption alerts and payout confirmations
- Lightweight and optimized for gig worker usage patterns

---

### Web vs Mobile Trade-off

| Feature | Native App | PWA |
|---------|-----------|-----|
| Installation Required | Yes | No |
| Performance | High | High (optimized) |
| Offline Support | Yes | Partial |
| Push Notifications | Yes | Yes |
| Development Time | High | Low |
| Accessibility | Limited | Universal (via URL) |

---

### Platform Design

- **Worker Interface** — Mobile PWA (primary usage)
- **Admin Dashboard** — Desktop Web (analytics and monitoring)

---

### Strategic Advantages

- Eliminates onboarding friction, leading to higher adoption
- Faster deployment with no app store dependency
- Seamless updates with no action required from the user
- Ideal for demo and production — instant access via URL
  

## 7. Technical Stack

---

### Frontend

| Technology | Purpose |
|------------|---------|
| React.js + Vite | Component-based UI with fast builds |
| Tailwind CSS | Responsive, mobile-first styling |
| PWA | App-like experience without installation |
| React Query | Data fetching and client-side caching |

---

### Backend & API Layer

| Technology | Purpose |
|------------|---------|
| Node.js + Express | Core application logic and API orchestration |
| FastAPI (Python) | ML model serving and inference endpoints |
| JWT Authentication | Secure session handling |

---

### AI / ML Engine

| Model / Tool | Purpose |
|--------------|---------|
| XGBoost | Dynamic premium calculation and risk scoring |
| Prophet / LSTM | Time-series disruption prediction |
| Isolation Forest | Anomaly detection and fraud prevention |
| scikit-learn | Core ML utilities and pipelines |
| MLflow | Experiment tracking and model versioning |

---

### External APIs & Data Sources

| API | Data Provided |
|-----|--------------|
| Open-Meteo | Weather data (rain, heat index) |
| CPCB / OpenAQ | Air quality index (AQI) |
| NewsAPI | Bandh and curfew detection |
| Downdetector (mocked) | Platform outage signals |
| Zomato / Swiggy (mocked) | Order volume and drop signals |
| GPS Activity Feed (mocked) | Rider activity validation |

---

### Database & Caching

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Structured storage for users, policies, and claims |
| Redis | Real-time trigger caching and fast lookups |

---

### Payments & Integrations

| Service | Purpose |
|---------|---------|
| UPI / Razorpay (sandbox) | Instant payout simulation |
| DigiLocker API | KYC verification |

---

### Authentication & Security

| Technology | Purpose |
|------------|---------|
| Firebase Auth | User authentication |
| JWT Tokens | Secure API communication |

---

### Infrastructure & Deployment

| Tool | Purpose |
|------|---------|
| Docker | Containerized deployment |
| GitHub Actions | CI/CD pipeline |
| Render / Railway | Backend hosting and deployment |

## 8. 🗺️ 6-Week Development Plan
* **Weeks 1-2 (Phase 1):** Ideation, persona definition, workflow architecture, and initial repository setup. *(Current)*
* **Weeks 3-4 (Phase 2):** Development of the registration portal, dynamic premium calculation logic, and building 3-5 automated trigger connections via mock APIs.
* **Weeks 5-6 (Phase 3):** Implementation of advanced ML fraud detection, integration of instant payout simulators, and finalization of the analytics dashboard.

## 9. 🎥 Phase 1 Video Pitch
[Insert link to the 2-minute publicly accessible video outlining the strategy, execution plan, and minimal scope prototype.]
