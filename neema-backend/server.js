const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ------------------------------
// ENV / CONFIG
// ------------------------------
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@db:5432/guideware';

const TRIGGER_ENGINE_URL =
  process.env.TRIGGER_ENGINE_URL || 'http://trigger-engine:3002';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// ------------------------------
// HEALTH
// ------------------------------
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'backend',
    port: PORT,
  });
});

// ------------------------------
// HELPERS
// ------------------------------
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ZONE_COORDS = {
  // Thiruvananthapuram
  kazhakkoottam: { lat: 8.5686, lon: 76.8682, city: 'thiruvananthapuram' },
  palayam: { lat: 8.5036, lon: 76.9535, city: 'thiruvananthapuram' },
  kowdiar: { lat: 8.5255, lon: 76.9602, city: 'thiruvananthapuram' },
  sreekariyam: { lat: 8.5489, lon: 76.9172, city: 'thiruvananthapuram' },

  // Mumbai
  andheri: { lat: 19.1136, lon: 72.8697, city: 'mumbai' },
  kurla: { lat: 19.0596, lon: 72.8295, city: 'mumbai' },
  powai: { lat: 19.1197, lon: 72.9051, city: 'mumbai' },

  // Bengaluru
  koramangala: { lat: 12.9279, lon: 77.6271, city: 'bengaluru' },
  whitefield: { lat: 12.9698, lon: 77.7499, city: 'bengaluru' },
  indiranagar: { lat: 12.9716, lon: 77.6411, city: 'bengaluru' },
  hsr_layout: { lat: 12.9121, lon: 77.6446, city: 'bengaluru' },

  // Delhi
  central_delhi: { lat: 28.6271, lon: 77.2217, city: 'delhi' },
  south_delhi: { lat: 28.5355, lon: 77.21, city: 'delhi' },

  // Lucknow
  central_lucknow: { lat: 26.8467, lon: 80.9462, city: 'lucknow' },

  // Chennai
  central_chennai: { lat: 13.0827, lon: 80.2707, city: 'chennai' },
};

function normalizeCity(city) {
  return String(city || '').trim().toLowerCase();
}

function normalizeZone(zone) {
  return String(zone || '').trim().toLowerCase();
}

function localFraudCheck(payload) {
  const city = normalizeCity(payload.city);
  const zone = normalizeZone(payload.zone);
  const lat = Number(payload.lat);
  const lng = Number(payload.lng);

  const zoneRef = ZONE_COORDS[zone];

  if (!zoneRef) {
    return {
      is_locked: false,
      secure: true,
      source: 'local_fallback',
      reason: 'Unknown zone; fallback allowed.',
    };
  }

  if (city && zoneRef.city !== city) {
    return {
      is_locked: true,
      secure: false,
      source: 'local_fallback',
      reason: 'City and zone mismatch detected.',
    };
  }

  const distance = haversineKm(lat, lng, zoneRef.lat, zoneRef.lon);
  const MAX_RADIUS_KM = 15;

  if (distance > MAX_RADIUS_KM) {
    return {
      is_locked: true,
      secure: false,
      source: 'local_fallback',
      reason: `Kinematic Violation: ${distance.toFixed(1)}km spoofing detected.`,
      distance_km: Number(distance.toFixed(2)),
    };
  }

  return {
    is_locked: false,
    secure: true,
    source: 'local_fallback',
    reason: 'Secure location verified.',
    distance_km: Number(distance.toFixed(2)),
  };
}

// ------------------------------
// API: SECURITY VERIFY (FRAUD ONLY)
// ------------------------------
app.post('/api/security/verify', async (req, res) => {
  try {
    const {
      userId,
      name,
      mobile,
      city,
      zone,
      lat,
      lng,
      daysWorked,
      platformMode,
    } = req.body || {};

    if (
      !city ||
      !zone ||
      lat === undefined ||
      lng === undefined ||
      Number.isNaN(Number(lat)) ||
      Number.isNaN(Number(lng))
    ) {
      return res.status(400).json({
        is_locked: true,
        secure: false,
        reason: 'Missing or invalid city/zone/lat/lng for security verification.',
      });
    }

    // 1) Try ML engine first
    try {
      const mlResp = await fetch(`${TRIGGER_ENGINE_URL}/api/v1/premium/lockout-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || 'demo_user',
          name: name || null,
          mobile: mobile || null,
          city: normalizeCity(city),
          zone: normalizeZone(zone),
          lat: Number(lat),
          lon: Number(lng), // ML expects lon, not lng
          days_worked_count: Number(daysWorked || 90),
          platform_mode: platformMode || 'single',
        }),
      });

      if (mlResp.ok) {
        const mlData = await mlResp.json();

        const locked =
          mlData.lockout_active === true ||
          mlData.is_locked === true ||
          mlData.secure === false;

        return res.json({
          is_locked: Boolean(locked),
          secure: !Boolean(locked),
          reason:
            mlData.reason ||
            (locked
              ? 'Suspicious location detected.'
              : 'Secure location verified.'),
          source: 'ml_engine',
          raw: mlData,
        });
      }

      console.warn('ML engine returned non-200, using local fallback:', mlResp.status);
    } catch (mlErr) {
      console.warn('ML engine unreachable, using local fallback:', mlErr.message);
    }

    // 2) Fallback local fraud check
    const fallback = localFraudCheck({ city, zone, lat, lng });
    return res.json(fallback);
  } catch (err) {
    console.error('/api/security/verify crashed:', err);

    try {
      const fallback = localFraudCheck(req.body || {});
      return res.json(fallback);
    } catch (innerErr) {
      console.error('Fallback security check failed:', innerErr);
      return res.status(200).json({
        is_locked: false,
        secure: true,
        reason: 'Security verification degraded mode: activation allowed.',
        source: 'safe_fail_open',
      });
    }
  }
});

// ------------------------------
// API: USER UPDATE
// ------------------------------
app.post('/api/user/update', async (req, res) => {
  try {
    const {
      id,
      name,
      mobile,
      city,
      zone,
      lat,
      lng,
      daysWorked,
      platformMode,
    } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: 'Missing user id' });
    }

    const hasCoords =
      lat !== undefined &&
      lng !== undefined &&
      !Number.isNaN(Number(lat)) &&
      !Number.isNaN(Number(lng));

    const query = `
      INSERT INTO users (
        id, name, mobile, city, zone, lat, lng, coords,
        days_worked_count, platform_mode, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        CASE
          WHEN $6 IS NOT NULL AND $7 IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint($7, $6), 4326)::geography
          ELSE NULL
        END,
        $8, $9, NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        mobile = EXCLUDED.mobile,
        city = EXCLUDED.city,
        zone = EXCLUDED.zone,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        coords = EXCLUDED.coords,
        days_worked_count = EXCLUDED.days_worked_count,
        platform_mode = EXCLUDED.platform_mode,
        updated_at = NOW()
      RETURNING id, name, city, zone, lat, lng, days_worked_count, platform_mode;
    `;

    const values = [
      id,
      name || null,
      mobile || null,
      normalizeCity(city),
      normalizeZone(zone),
      hasCoords ? Number(lat) : null,
      hasCoords ? Number(lng) : null,
      Number(daysWorked || 0),
      platformMode || 'single',
    ];

    const result = await pool.query(query, values);

    return res.json({
      ok: true,
      user: result.rows[0],
    });
  } catch (err) {
    console.error('/api/user/update error:', err);

    return res.status(200).json({
      ok: true,
      degraded: true,
      message: 'User cache skipped because DB is unavailable.',
    });
  }
});

// ------------------------------
// API: RISK SUMMARY (WEATHER WARNING ONLY)
// ------------------------------
app.post('/api/risk/summary', async (req, res) => {
  try {
    const city = normalizeCity(req.body && req.body.city);

    try {
      const riskResp = await fetch(`${TRIGGER_ENGINE_URL}/api/v1/risk-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      });

      if (riskResp.ok) {
        const riskData = await riskResp.json();
        const score = Number(riskData.risk_score ?? riskData.claim_probability ?? 0.35);

        return res.json({
          city,
          risk_score: score,
          risk_tier:
            riskData.risk_tier ||
            (score >= 0.7 ? 'HIGH' : score >= 0.4 ? 'MEDIUM' : 'LOW'),
          operational_alert: score >= 0.7,
          reason:
            score >= 0.7
              ? 'High weather/operational risk in your zone. Activation allowed, but disruption probability is elevated.'
              : 'Operational conditions are normal.',
          source: 'ml_engine',
          raw: riskData,
        });
      }
    } catch (err) {
      console.warn('Risk summary ML unavailable, using fallback:', err.message);
    }

    const fallbackScores = {
      mumbai: 0.62,
      delhi: 0.58,
      chennai: 0.52,
      lucknow: 0.48,
      bengaluru: 0.5,
      thiruvananthapuram: 0.42,
    };

    const score = fallbackScores[city] ?? 0.5;

    return res.json({
      city,
      risk_score: score,
      risk_tier: score >= 0.7 ? 'HIGH' : score >= 0.4 ? 'MEDIUM' : 'LOW',
      operational_alert: score >= 0.7,
      reason:
        score >= 0.7
          ? 'High weather/operational risk in your zone. Activation allowed, but disruption probability is elevated.'
          : 'Operational conditions are normal.',
      source: 'fallback',
    });
  } catch (err) {
    console.error('/api/risk/summary error:', err);
    return res.status(200).json({
      city: 'unknown',
      risk_score: 0.5,
      risk_tier: 'MEDIUM',
      operational_alert: false,
      reason: 'Risk service degraded. Activation allowed.',
      source: 'safe_fail_open',
    });
  }
});

// ------------------------------
// API: ACTIVE USERS
// ------------------------------
app.get('/api/users/active', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, mobile, city, zone, lat, lng, days_worked_count, platform_mode
      FROM users
      WHERE is_active = TRUE
      ORDER BY updated_at DESC
      LIMIT 100;
    `);

    res.json({
      ok: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (err) {
    console.error('/api/users/active error:', err);
    res.status(200).json({
      ok: true,
      count: 0,
      users: [],
      degraded: true,
    });
  }
});

// ------------------------------
// START
// ------------------------------
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`📡 Trigger engine URL: ${TRIGGER_ENGINE_URL}`);
});