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

## 3. 🔄 Persona-Based Scenarios & Workflow
**Scenario: The "Monsoon Washout"**
1.  **Onboarding:** A delivery partner signs up and opts into the weekly coverage plan based on their primary operating zone.
2.  **The Event:** A sudden, severe thunderstorm hits the partner's operating zone at 6 PM (peak earning hours).
3.  **The Trigger:** Our system pings local Weather APIs and Traffic data. It detects rainfall exceeding the safe threshold and widespread zone closures.
4.  **The Action:** The policy is parametrically triggered. An automated claim is initiated without the user needing to file a manual report.
5.  **The Payout:** The system calculates the estimated lost income for those specific hours and processes an instant payout to the partner's linked wallet.

## 4. Insurance Premium & Payout Model

A risk-adjusted, income-based micro-insurance framework for gig economy workers, designed to be affordable, dynamic, and ML-powered.

---

## 💸 Premium Calculation

Premiums are calculated in three steps:

### **Step 1 — Base Premium**

The base premium is a percentage of the worker's weekly income:
<br>
```Base Premium = Weekly Income × Base Rate```

- Base Rate ≈ **1.5% – 2%**

---

### **Step 2 — Adjusted Premium**

The base premium is multiplied by a set of risk factors:

```Adjusted Premium = Base Premium × City Risk × Shift Factor × Platform Factor × Zone Factor```

- **City Risk** → location-based disruption history  
- **Shift Factor** → risk based on working hours  
- **Platform Factor** → platform-specific variability  
- **Zone Factor** → hyperlocal area risk  

---

### **Step 3 — Final Premium (Affordability Cap)**

The adjusted premium is capped to ensure affordability:

```Final Premium = min(max(Adjusted Premium, 29), 99)```

- Premium range: **₹29 – ₹99 per week**

---

## 💰 Payout Calculation

When a trigger event occurs, payout is based on the worker's daily income:

```Daily Income = Weekly Income / 7```

```Daily Payout = Daily Income × Coverage Percentage```

```Max Weekly Payout = Daily Payout × Max Trigger Days```

### **Key Parameters**

- Coverage = **60% – 80% of daily income**  
- Max Trigger Days = **3 days per week**

---

## 🔁 Dynamic Premium Adjustment

Premiums are recalibrated weekly based on actual vs expected loss:

```New Premium = Old Premium × (Actual Loss / Expected Loss)```


- If actual loss > expected → premium increases  
- If actual loss < expected → premium decreases  

👉 Ensures fairness and long-term sustainability  

---

## 🤖 ML-Based Expected Loss

Expected loss is estimated using machine learning models (e.g., XGBoost):


```Expected Loss = f(Rain, Zone Risk, Shift Pattern, Historical Claims, Seasonality)```


- Trained on **historical claims + environmental data**  
- Predicts **future payout risk before each week**

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
