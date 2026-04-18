const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:neema@db:5432/postgres';

// ML Engine handles all risk + lockout logic
const ML_ENGINE_URL =
  process.env.ML_ENGINE_URL || 'http://ml-engine:8000';

const pool = new Pool({ connectionString: DATABASE_URL });

// Admin API key — set ADMIN_API_KEY in backend .env for production
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'gs-admin-dev-key-2024';

// ─────────────────────────────────────────────
// ADMIN AUTH MIDDLEWARE
// Protects all /api/admin/* routes.
// Admin dashboard must send: x-admin-key: <ADMIN_API_KEY>
// ─────────────────────────────────────────────
function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.admin_key;
  if (!key || key !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized — invalid or missing admin key' });
  }
  next();
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function normalizeCity(city) { return String(city || '').trim().toLowerCase(); }
function normalizeZone(zone) { return String(zone || '').trim().toLowerCase(); }

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ZONE_COORDS = {
  kazhakkoottam:  { lat: 8.5510,  lon: 76.8740, city: 'thiruvananthapuram' },
  palayam:        { lat: 8.5039,  lon: 76.9470, city: 'thiruvananthapuram' },
  kowdiar:        { lat: 8.5228,  lon: 76.9602, city: 'thiruvananthapuram' },
  sreekariyam:    { lat: 8.5485,  lon: 76.9120, city: 'thiruvananthapuram' },
  andheri:        { lat: 19.1136, lon: 72.8697, city: 'mumbai' },
  kurla:          { lat: 19.0596, lon: 72.8295, city: 'mumbai' },
  powai:          { lat: 19.1197, lon: 72.9051, city: 'mumbai' },
  koramangala:    { lat: 12.9352, lon: 77.6245, city: 'bengaluru' },
  whitefield:     { lat: 12.9698, lon: 77.7500, city: 'bengaluru' },
  indiranagar:    { lat: 12.9784, lon: 77.6408, city: 'bengaluru' },
  hsr_layout:     { lat: 12.9116, lon: 77.6474, city: 'bengaluru' },
  central_delhi:  { lat: 28.6271, lon: 77.2217, city: 'delhi' },
  south_delhi:    { lat: 28.5355, lon: 77.2100, city: 'delhi' },
  central_lucknow:{ lat: 26.8467, lon: 80.9462, city: 'lucknow' },
  central_chennai:{ lat: 13.0827, lon: 80.2707, city: 'chennai' },
};

function localFraudCheck({ city, zone, lat, lng }) {
  const zoneRef = ZONE_COORDS[normalizeZone(zone)];
  if (!zoneRef) return { is_locked: false, secure: true, source: 'local_fallback', reason: 'Unknown zone; fallback allowed.' };
  const normalCity = normalizeCity(city);
  if (normalCity && zoneRef.city !== normalCity) {
    return { is_locked: true, secure: false, source: 'local_fallback', reason: 'City and zone mismatch detected.' };
  }
  const distance = haversineKm(Number(lat), Number(lng), zoneRef.lat, zoneRef.lon);
  if (distance > 15) {
    return { is_locked: true, secure: false, source: 'local_fallback', reason: `Kinematic Violation: ${distance.toFixed(1)}km spoofing detected.`, distance_km: +distance.toFixed(2) };
  }
  return { is_locked: false, secure: true, source: 'local_fallback', reason: 'Secure location verified.', distance_km: +distance.toFixed(2) };
}

// ─────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'neema-backend', port: PORT });
});

// ─────────────────────────────────────────────
// SECURITY VERIFY  — called by Onboarding
// Forwards to ML engine lockout-check; falls back to local haversine
// ─────────────────────────────────────────────
app.post('/api/security/verify', async (req, res) => {
  try {
    const { userId, name, mobile, city, zone, lat, lng, daysWorked, platformMode } = req.body || {};

    if (!city || !zone || lat === undefined || lng === undefined ||
        Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      return res.status(400).json({
        is_locked: true, secure: false,
        reason: 'Missing or invalid city/zone/lat/lng for security verification.',
      });
    }

    // Try ML engine first
    try {
      const mlResp = await fetch(`${ML_ENGINE_URL}/api/v1/premium/lockout-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: normalizeCity(city),
          zone: normalizeZone(zone),
          lat: Number(lat),
          lon: Number(lng),
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (mlResp.ok) {
        const mlData = await mlResp.json();
        const locked = mlData.lockout_active === true || mlData.is_locked === true;
        return res.json({
          is_locked: Boolean(locked),
          secure: !Boolean(locked),
          reason: mlData.reason || (locked ? 'Suspicious location detected.' : 'Secure location verified.'),
          source: 'ml_engine',
        });
      }
    } catch (mlErr) {
      console.warn('ML engine unreachable for security/verify, using local fallback:', mlErr.message);
    }

    return res.json(localFraudCheck({ city, zone, lat, lng }));
  } catch (err) {
    console.error('/api/security/verify crashed:', err);
    return res.json(localFraudCheck(req.body || {}));
  }
});

// ─────────────────────────────────────────────
// SECURITY STATUS  — polled by Dashboard every 30s
// ─────────────────────────────────────────────
app.get('/api/security/status/:userId', async (req, res) => {
  const { userId } = req.params;
  const { city = 'mumbai', zone = 'kurla', lat, lon } = req.query;

  try {
    const mlResp = await fetch(`${ML_ENGINE_URL}/api/v1/premium/lockout-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: normalizeCity(city),
        zone: normalizeZone(zone),
        lat: lat ? Number(lat) : null,
        lon: lon ? Number(lon) : null,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (mlResp.ok) {
      const mlData = await mlResp.json();
      const locked = mlData.lockout_active === true || mlData.is_locked === true;
      return res.json({
        is_locked: Boolean(locked),
        status: locked ? 'locked' : 'secure',
        reason: mlData.reason || 'ALL_CLEAR',
      });
    }
  } catch (err) {
    console.warn('ML engine unreachable for security/status:', err.message);
  }

  // Fallback: secure unless lat/lon show spoofing
  if (lat && lon) {
    const fallback = localFraudCheck({ city, zone, lat: Number(lat), lng: Number(lon) });
    return res.json({ is_locked: fallback.is_locked, status: fallback.is_locked ? 'locked' : 'secure', reason: fallback.reason });
  }

  return res.json({ is_locked: false, status: 'secure', reason: 'ALL_CLEAR' });
});

// ─────────────────────────────────────────────
// USER UPDATE  — called by Onboarding after security passes
// ─────────────────────────────────────────────
app.post('/api/user/update', async (req, res) => {
  const { id, name, mobile, city, zone, lat, lng, daysWorked, platformMode } = req.body || {};

  if (!id) return res.status(400).json({ error: 'Missing user id' });

  try {
    const hasCoords = lat !== undefined && lng !== undefined &&
                      !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

    await pool.query(`
      INSERT INTO users (id, name, mobile, city, zone, lat, lng, coords, days_worked_count, platform_mode, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::double precision, $7::double precision,
        CASE WHEN $6::double precision IS NOT NULL AND $7::double precision IS NOT NULL
          THEN ST_SetSRID(ST_MakePoint($7::double precision, $6::double precision), 4326)::geography ELSE NULL END,
        $8, $9, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, mobile = EXCLUDED.mobile,
        city = EXCLUDED.city, zone = EXCLUDED.zone,
        lat = EXCLUDED.lat, lng = EXCLUDED.lng,
        coords = EXCLUDED.coords,
        days_worked_count = EXCLUDED.days_worked_count,
        platform_mode = EXCLUDED.platform_mode,
        updated_at = NOW()
    `, [
      id, name || null, mobile || null,
      normalizeCity(city), normalizeZone(zone),
      hasCoords ? Number(lat) : null,
      hasCoords ? Number(lng) : null,
      Number(daysWorked || 0), platformMode || 'single',
    ]);

    return res.json({ ok: true, user_id: id });
  } catch (err) {
    console.error('/api/user/update DB error:', err.message);
    // Graceful degradation — don't break the onboarding flow
    return res.json({ ok: true, degraded: true, message: 'Profile cached locally; DB write skipped.' });
  }
});

// ─────────────────────────────────────────────
// RISK SUMMARY (POST)  — called by Onboarding step 4
// RISK SUMMARY (GET)   — polled by Dashboard every 30s
// Routes to ML Engine for live risk scoring
// ─────────────────────────────────────────────
async function getRiskSummary(city) {
  const normalCity = normalizeCity(city || 'mumbai');

  try {
    const mlResp = await fetch(`${ML_ENGINE_URL}/api/v1/premium/risk/summary/${encodeURIComponent(normalCity)}?city=${normalCity}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (mlResp.ok) {
      const data = await mlResp.json();
      return { ...data, source: 'ml_engine' };
    }
  } catch (err) {
    console.warn('ML engine unreachable for risk/summary:', err.message);
  }

  // Static fallback
  const fallbackScores = { mumbai: 0.62, delhi: 0.58, chennai: 0.52, lucknow: 0.48, bengaluru: 0.5, thiruvananthapuram: 0.42 };
  const score = fallbackScores[normalCity] ?? 0.5;
  return {
    city: normalCity,
    risk_score: score,
    risk_tier: score >= 0.7 ? 'HIGH' : score >= 0.4 ? 'MEDIUM' : 'LOW',
    operational_alert: score >= 0.7,
    reason: score >= 0.7 ? 'Elevated operational risk in your zone. Coverage remains active.' : 'Operational conditions normal.',
    source: 'fallback',
  };
}

app.post('/api/risk/summary', async (req, res) => {
  res.json(await getRiskSummary(req.body?.city));
});

app.get('/api/risk/summary/:userId', async (req, res) => {
  res.json(await getRiskSummary(req.query?.city));
});

// ─────────────────────────────────────────────
// ACTIVE USERS  — polled by trigger engine cron
// ─────────────────────────────────────────────
app.get('/api/users/active', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id as user_id, name, city, zone, lat, lng as lon,
             lat as last_known_lat, lng as last_known_lon,
             days_worked_count as days_active_last_120,
             platform_mode, 'standard' as tier, 4500 as weekly_income
      FROM users
      WHERE is_active = TRUE
      ORDER BY updated_at DESC
      LIMIT 100
    `);
    return res.json(result.rows);
  } catch (err) {
    console.error('/api/users/active error:', err.message);
    return res.json([]);  // Empty array so trigger engine skips gracefully
  }
});

// ─────────────────────────────────────────────
// CLAIMS: TRIGGER  — called by trigger engine on approved payout
// ─────────────────────────────────────────────
app.post('/api/claims/trigger', async (req, res) => {
  const { user_id, trigger_type, payout_amount } = req.body || {};
  console.log(`💰 PAYOUT TRIGGERED: user=${user_id} type=${trigger_type} amount=₹${payout_amount}`);

  try {
    await pool.query(`
      INSERT INTO claims (user_id, claim_type, payout_amount, status, created_at)
      VALUES ($1, $2, $3, 'approved', NOW())
    `, [user_id, trigger_type || 'parametric', payout_amount || 0]);

    return res.json({ ok: true, message: `Payout of ₹${payout_amount} logged for ${user_id}` });
  } catch (err) {
    console.error('/api/claims/trigger DB error:', err.message);
    return res.json({ ok: true, degraded: true, message: 'Payout acknowledged; DB write skipped.' });
  }
});

// ─────────────────────────────────────────────
// CLAIMS: FLAGGED  — called by trigger engine on fraud detection
// ─────────────────────────────────────────────
app.post('/api/claims/flagged', async (req, res) => {
  const { user_id, reason, payout_amount } = req.body || {};
  console.log(`🚩 CLAIM FLAGGED: user=${user_id} reason=${reason}`);

  try {
    await pool.query(`
      INSERT INTO claims (user_id, claim_type, payout_amount, status, created_at)
      VALUES ($1, 'flagged', $2, 'under_review', NOW())
    `, [user_id, payout_amount || 0]);

    await pool.query(`
      UPDATE users SET is_flagged = TRUE, suspicion_reason = $2 WHERE id = $1
    `, [user_id, reason]);

    return res.json({ ok: true, message: `Claim flagged for review: ${user_id}` });
  } catch (err) {
    console.error('/api/claims/flagged DB error:', err.message);
    return res.json({ ok: true, degraded: true, message: 'Flag acknowledged; DB write skipped.' });
  }
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Neema Backend running on port ${PORT}`);
  console.log(`🤖 ML Engine URL: ${ML_ENGINE_URL}`);
});

// ─────────────────────────────────────────────
// ADMIN: METRICS — for admin dashboard
// ─────────────────────────────────────────────
app.get('/api/admin/metrics', requireAdminKey, async (_req, res) => {
  try {
    const [total, eligible, flagged, claims] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE is_active = TRUE'),
      pool.query(`SELECT COUNT(*) FROM users WHERE is_active = TRUE AND
        ((platform_mode = 'single' AND days_worked_count >= 90) OR
         (platform_mode = 'multi'  AND days_worked_count >= 120))`),
      pool.query('SELECT COUNT(*) FROM users WHERE is_flagged = TRUE'),
      pool.query('SELECT COUNT(*), COALESCE(SUM(payout_amount),0) as total_payout FROM claims WHERE status = \'approved\''),
    ]);
    return res.json({
      total_workers:    Number(total.rows[0].count),
      eligible_workers: Number(eligible.rows[0].count),
      flagged_workers:  Number(flagged.rows[0].count),
      total_claims:     Number(claims.rows[0].count),
      total_payout:     Number(claims.rows[0].total_payout),
    });
  } catch (err) {
    console.error('/api/admin/metrics error:', err.message);
    return res.json({ total_workers: 0, eligible_workers: 0, flagged_workers: 0, total_claims: 0, total_payout: 0 });
  }
});

// ─────────────────────────────────────────────
// ADMIN: FLAGGED USERS
// ─────────────────────────────────────────────
app.get('/api/admin/flagged', requireAdminKey, async (_req, res) => {
  try {
    const r = await pool.query(`SELECT id, name, city, zone, suspicion_reason, updated_at FROM users WHERE is_flagged = TRUE ORDER BY updated_at DESC LIMIT 50`);
    return res.json(r.rows);
  } catch (err) {
    return res.json([]);
  }
});

// ─────────────────────────────────────────────
// ADMIN: RECENT CLAIMS
// ─────────────────────────────────────────────
app.get('/api/admin/claims', requireAdminKey, async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.id, c.user_id, u.name, c.claim_type, c.payout_amount, c.status, c.created_at
      FROM claims c LEFT JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC LIMIT 50
    `);
    return res.json(r.rows);
  } catch (err) {
    return res.json([]);
  }
});

// ─────────────────────────────────────────────
// PAYOUT HISTORY — for worker dashboard
// ─────────────────────────────────────────────
app.get('/api/claims/history/:userId', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT id, claim_type, payout_amount, status, created_at
      FROM claims WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20
    `, [req.params.userId]);
    return res.json(r.rows);
  } catch (err) {
    return res.json([]);
  }
});

// ─────────────────────────────────────────────
// OFFLINE SOS WEBHOOK (Twilio-compatible)
// ─────────────────────────────────────────────
app.post('/api/webhook/sms-sos', async (req, res) => {
  const body = req.body || {};
  const from = body.From || body.from || 'unknown';
  const msgBody = body.Body || body.body || '';
  console.log(`📲 SOS SMS from ${from}: ${msgBody}`);

  try {
    // Find user by mobile, insert emergency claim
    const user = await pool.query(`SELECT id FROM users WHERE mobile = $1 LIMIT 1`, [from]);
    const userId = user.rows[0]?.id || 'unknown_sos';

    await pool.query(`
      INSERT INTO claims (user_id, claim_type, payout_amount, status, created_at)
      VALUES ($1, 'sos_offline', 500, 'approved', NOW())
    `, [userId]);

    return res.set('Content-Type', 'text/xml').send(
      `<?xml version="1.0"?><Response><Message>GigShield SOS received. Emergency ₹500 payout initiated. Stay safe.</Message></Response>`
    );
  } catch (err) {
    console.error('/api/webhook/sms-sos error:', err.message);
    return res.set('Content-Type', 'text/xml').send(
      `<?xml version="1.0"?><Response><Message>GigShield SOS received. Emergency response queued.</Message></Response>`
    );
  }
});

// ─────────────────────────────────────────────
// SOCIAL SECURITY STATUS — for worker dashboard
// ─────────────────────────────────────────────
app.get('/api/user/ss-status/:userId', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT days_worked_count, platform_mode, ss_eligible FROM users WHERE id = $1
    `, [req.params.userId]);
    if (!r.rows.length) return res.json({ days: 0, mode: 'single', eligible: false, target: 90 });
    const { days_worked_count: days, platform_mode: mode, ss_eligible } = r.rows[0];
    const target = mode === 'multi' ? 120 : 90;
    const eligible = days >= target;
    // Update ss_eligible flag if needed
    if (eligible && !ss_eligible) {
      await pool.query('UPDATE users SET ss_eligible = TRUE WHERE id = $1', [req.params.userId]);
    }
    return res.json({ days, mode, eligible, target });
  } catch (err) {
    return res.json({ days: 0, mode: 'single', eligible: false, target: 90 });
  }
});
