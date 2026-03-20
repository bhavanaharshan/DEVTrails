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

## 5. 🧠 AI & Machine Learning Architecture
Our system leverages advanced machine learning to ensure sustainability and security:

* **Dynamic Premium Calculation (Risk Modeling):** Utilizing localized historical weather data and delivery density, our ML models predict the probability of disruption for specific geo-hashes. The weekly premium is adjusted dynamically—e.g., offering lower weekly premiums in historically safer zones.
* **Intelligent Fraud Detection:** * **Anomaly Detection:** Cross-referencing claimed disruption locations with verified external APIs to catch fake weather claims.
    * **Spatial Analysis:** Implementing Graph Neural Networks (GNNs) to map normal delivery routes and identify anomalies like GPS spoofing or coordinated localized fraud rings.

## 6. 📱 Platform Strategy: Web vs. Mobile
**Decision:** [Insert Choice, e.g., Mobile-First Progressive Web App (PWA) or Native Mobile App]
**Justification:** Delivery partners operate exclusively on their smartphones while on the move. A mobile-optimized interface ensures rapid onboarding, real-time push notifications for weather warnings, and immediate visibility into coverage status and payouts.

## 7. 🛠️ Technical Stack
* **Frontend User Interface:** React.js (for a highly responsive, component-driven web/mobile dashboard).
* **Backend & API Orchestration:** Python (FastAPI/Flask) for robust, high-performance data handling.
* **AI/ML Engine:** PyTorch / Scikit-learn for risk modeling and Graph Neural Networks for anomaly detection. Large Language Models (LLMs) to assist with unstructured data parsing and automated user support.
* **External Integrations:** OpenWeatherMap API (Mocks for environmental data), Simulated Payment Gateways (Razorpay/Stripe sandbox).

## 8. 🗺️ 6-Week Development Plan
* **Weeks 1-2 (Phase 1):** Ideation, persona definition, workflow architecture, and initial repository setup. *(Current)*
* **Weeks 3-4 (Phase 2):** Development of the registration portal, dynamic premium calculation logic, and building 3-5 automated trigger connections via mock APIs.
* **Weeks 5-6 (Phase 3):** Implementation of advanced ML fraud detection, integration of instant payout simulators, and finalization of the analytics dashboard.

## 9. 🎥 Phase 1 Video Pitch
[Insert link to the 2-minute publicly accessible video outlining the strategy, execution plan, and minimal scope prototype.]
