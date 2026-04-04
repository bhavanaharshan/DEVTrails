# ⚡ Automated Trigger Engine
### Parametric Insurance PWA — Background Monitoring Service

A standalone Node.js background service that continuously monitors real-world conditions (weather, air quality, platform outages) across active delivery zones. When a safety threshold is breached, it automatically fires a webhook to the main backend to initiate a zero-touch insurance claim payout for gig delivery workers in that zone.

---

## How It Works

The engine runs on a **2-minute cron cycle**. Every tick it:
1. Fetches the current list of active zones from the backend (`/api/zones/active`)
2. Loops through each zone and runs three independent checks
3. Fires the claim webhook for every breached threshold

```
CRON TICK (every 2 min)
        │
        ▼
 ┌─────────────────────────┐
 │  GET /api/zones/active  │  ← dynamic zone list from Neema's backend
 └──────────┬──────────────┘
            │  (falls back to FALLBACK_ZONES in config.js if backend is down)
            ▼
 ┌─────────────────┐
 │  For each Zone  │
 └────────┬────────┘
          │
    ┌─────▼──────┐    ┌─────▼──────┐    ┌──────▼──────┐
    │   Weather  │    │    AQI     │    │   Outage    │
    │   Check    │    │   Check    │    │    Check    │
    └─────┬──────┘    └─────┬──────┘    └──────┬──────┘
          │                 │                  │
    Threshold          Threshold          Mock / forced
    breached?          breached?          returns true?
          │                 │                  │
          └────────┬─────────────────────────  ┘
                   ▼
          POST /api/claims/trigger
          { zone, trigger_type }
```

Each check is wrapped in its own `try/catch` — a weather API failure will never block the AQI or outage check for that zone.

---

## Project Structure

```
trigger-engine/
├── index.js          # Entry point. Cron scheduler + dynamic zone fetching.
├── config.js         # Thresholds, URLs, fallback zones, and test-mode settings.
├── fetchers.js       # Three isolated async functions that return raw data values.
├── evaluator.js      # Compares values to thresholds; fires webhook on breach.
├── test-trigger.js   # Manual one-shot test runner (no cron, instant results).
└── package.json
```

---

## Data Sources & Thresholds

| Trigger | API | Condition |
|---|---|---|
| **Extreme Weather** | `api.open-meteo.com` — free, no key | `precipitation > 25mm` OR `temperature > 42°C` |
| **Hazardous AQI** | `air-quality-api.open-meteo.com` — free, no key | `us_aqi > 300` |
| **Platform Outage** | None — local mock | `Math.random() < 0.10` (~10% per check) |

> **On `us_aqi`:** The field name refers to the US EPA measurement *scale*, not US-only data. The coordinates you pass in are used to fetch local air quality for any location globally — Bangalore, Mumbai, anywhere. Open-Meteo also exposes `european_aqi` if you prefer the EU scale; swap the query param in `fetchers.js`.

Both external APIs are **completely free and require no API key.**

---

## Dynamic Zone Loading

Zones are **not hardcoded** in this service. On every cron tick, the engine calls:

```
GET http://localhost:5000/api/zones/active
```

Expected response from the backend:
```json
[
  { "name": "bangalore_south", "lat": 12.9259, "lon": 77.5830 },
  { "name": "bangalore_north", "lat": 13.0358, "lon": 77.5970 }
]
```

This means any zone added to the main database is automatically picked up on the next tick — no restart needed.

### Fallback Zones

If the backend is unreachable (e.g. during a cold start or outage), the engine falls back to a hardcoded list in `config.js` so it never silently stops monitoring:

```js
// config.js
export const FALLBACK_ZONES = [
  { name: "bangalore_south", lat: 12.9259, lon: 77.5830 },
  { name: "bangalore_north", lat: 13.0358, lon: 77.5970 },
];
```

Add or update these as your coverage expands.

---

## Outbound Webhook (the only "endpoint" this service touches)

This service exposes **no inbound HTTP endpoints**. It is a fire-and-forget background worker. The only network call it makes outward is:

### `POST http://localhost:5000/api/claims/trigger`

Fired whenever any threshold is breached for a zone.

**Request Body:**
```json
{
  "zone": "bangalore_south",
  "trigger_type": "weather"
}
```

| Field | Type | Possible Values |
|---|---|---|
| `zone` | `string` | Zone name as returned by `/api/zones/active` |
| `trigger_type` | `string` | `"weather"` · `"aqi"` · `"outage"` |

> Owned by **Neema's backend**. URL is set via `WEBHOOK_URL` in `config.js`.

---

## Testing Severe / Edge Cases

### Option A — `test-trigger.js` (recommended)

Bypasses the cron entirely and runs a single evaluation immediately:

```bash
node test-trigger.js
```

Use this alongside **Test Mode** (below) for instant feedback without waiting 2 minutes.

### Option B — Test Mode (`TEST_MODE` flag)

In `config.js`, flip the flag to skip real API calls and force threshold breaches:

```js
// config.js
export const TEST_MODE = true;   // ← change this

export const TEST_OVERRIDES = {
  precipitation: 50,   // SEVERE  — 50mm  >> 25mm threshold  → fires weather claim
  temperature:   30,   // SAFE    — 30°C  <  42°C threshold
  aqi:          350,   // SEVERE  — 350   >> 300 threshold   → fires AQI claim
  outage:       true,  // SEVERE  — forced crash             → fires outage claim
};
```

**Test scenarios — just change the override values:**

| Scenario | precipitation | temperature | aqi | outage |
|---|---|---|---|---|
| All clear (no claims) | `5` | `30` | `120` | `false` |
| Weather only (rain) | `50` | `30` | `120` | `false` |
| Weather only (heat) | `5` | `45` | `120` | `false` |
| AQI only | `5` | `30` | `350` | `false` |
| Outage only | `5` | `30` | `120` | `true` |
| All triggers fire | `50` | `45` | `350` | `true` |

**To return to live mode:** set `TEST_MODE = false`. Nothing else changes.

---

## Environment Variables

The service works out of the box with hardcoded URLs. When moving to staging/production, add `.env` support in three steps:

```bash
npm install dotenv
```

Add `import 'dotenv/config';` as the **first line** of `config.js`, then update the URLs:

```js
export const WEBHOOK_URL  = process.env.WEBHOOK_URL;
export const ZONES_API_URL = process.env.ZONES_API_URL;
```

Create `.env` in the project root:

```env
WEBHOOK_URL=http://localhost:5000/api/claims/trigger
ZONES_API_URL=http://localhost:5000/api/zones/active
```

> The two external APIs (Open-Meteo weather + air quality) are free and keyless — no env variables needed for them.

---

## Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Start the engine (live mode)
npm start

# 3. Run a one-shot manual test (no cron)
node test-trigger.js
```

The engine runs the first evaluation **immediately on startup**, then every 2 minutes. Terminal output looks like:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Parametric Insurance — Automated Trigger Engine
  Mode: 🌐 LIVE (real APIs)
  Zone source: backend API (dynamic)
  Schedule: every 2 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📍 Fetched 2 active zone(s) from backend: bangalore_south, bangalore_north

┌─────────────────────────────────────────────────
│ ⏰ ENGINE WAKE-UP  [3/4/2026, 11:30:00 am]
│ Evaluating 2 zone(s)...
└─────────────────────────────────────────────────
  🔍 Checking zone: bangalore_south (12.9259, 77.583)
     Weather → precipitation=2.1mm, temperature=38°C
     ✔  Weather within safe limits.
     AQI    → us_aqi=142
     ✔  Air quality within safe limits.
     Outage → detected=false
     ✔  No platform outage.

  🔍 Checking zone: bangalore_north (13.0358, 77.597)
     Weather → precipitation=31mm, temperature=36°C
     ⚠️  Precipitation breach: 31mm > 25mm
  ✅ CLAIM FIRED  | zone=bangalore_north | trigger=weather

┌─────────────────────────────────────────────────
│ 😴 ENGINE SLEEPING — next check in 2 minutes.
└─────────────────────────────────────────────────
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `axios` | HTTP requests to external APIs and the outbound webhook |
| `node-cron` | Scheduling the 2-minute evaluation loop |
