// server.js - Neema's Backend (Phase 3 Judge-Ready Integration)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

// --- REAL-TIME: Join Zone for Zero-Touch Updates ---
io.on('connection', (socket) => {
  socket.on('join-zone', (zone) => {
    socket.join(`zone:${zone}`);
    console.log(`Worker joined zone monitoring: ${zone}`);
  });
});

// --- 1. ADMIN HUB: Metrics API ---
app.get('/api/admin/metrics', async (req, res) => {
    try {
        const moneyFlow = await pool.query(`
            SELECT 
                COALESCE(SUM(payout_amount), 0) as total_payouts,
                (SELECT COALESCE(SUM(premium_paid_amount), 0) FROM policies) as total_premiums
            FROM claims
        `);
        
        const payouts = parseFloat(moneyFlow.rows[0].total_payouts);
        const premiums = parseFloat(moneyFlow.rows[0].total_premiums);
        const lossRatio = premiums > 0 ? (payouts / premiums).toFixed(2) : 0;

        // Uses the new ss_eligible column for faster counts
        const eligibility = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE ss_eligible = true) as eligible_count,
                COUNT(*) as total_count
            FROM users
        `);

        const fraudQueue = await pool.query(`
            SELECT id, name, suspicion_reason, mobile, is_flagged 
            FROM users WHERE is_flagged = true
        `);

        res.json({
            metrics: { lossRatio, targetRatio: 0.65, totalPayouts: payouts, totalPremiums: premiums },
            eligibility: eligibility.rows[0],
            reviewQueue: fraudQueue.rows
        });
    } catch (err) {
        res.status(500).json({ error: "Admin metrics failed" });
    }
});

// --- 2. POLICY: Create with Adverse Selection Lockout & Consent Logging ---
app.post('/api/policy/create', async (req, res) => {
    const { userId, premiumId, amount, zone, consents } = req.body;
    try {
        // 1. Adverse Selection Check
        const weatherAlert = await pool.query(
            `SELECT alert_level FROM zone_weather WHERE zone = $1 AND alert_time > NOW()`, 
            [zone]
        );
        const isRedAlertActive = weatherAlert.rows.some(r => r.alert_level === 'RED');

        if (isRedAlertActive) {
            return res.status(403).json({
                success: false,
                message: "Adverse Selection Lockout: You cannot buy insurance 48h before a Red Alert."
            });
        }

        // 2. Log DPDP Consents during policy purchase
        const now = new Date().toISOString();
        await pool.query(
            `UPDATE users SET 
                gps_consent = $1, upi_consent = $2, platform_data_consent = $3,
                gps_consent_at = CASE WHEN $1 THEN $4 ELSE gps_consent_at END,
                upi_consent_at = CASE WHEN $2 THEN $4 ELSE upi_consent_at END,
                activity_consent_at = CASE WHEN $3 THEN $4 ELSE activity_consent_at END
             WHERE firebase_uid = $5 OR id::text = $5`,
            [consents.gps_tracking, consents.upi_storage, consents.platform_data, now, userId]
        );

        // 3. Create Policy
        const result = await pool.query(
            `INSERT INTO policies (user_id, premium_id, premium_paid_amount, status) 
             VALUES ((SELECT id FROM users WHERE firebase_uid=$1 OR id::text=$1), $2, $3, 'active') RETURNING *`,
            [userId, premiumId, amount]
        );
        res.json({ success: true, policy: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. PROFILE: Update with SS Eligibility & PostGIS ---
app.post('/api/user/update', async (req, res) => {
  const { id, name, mobile, gps_consent, upi_consent, lat, lng, daysWorked, platformMode } = req.body;
  try {
    // Logic: Single platform (90 days) or Multi platform (120 days)
    const isEligible = (platformMode === 'single' && daysWorked >= 90) || 
                       (platformMode === 'multi' && daysWorked >= 120);

    const result = await pool.query(
      `UPDATE users SET 
        name=$1, mobile=$2, 
        gps_consent=$3, upi_consent=$4,
        days_worked_count=$5, platform_mode=$6, ss_eligible=$7,
        coords=ST_SetSRID(ST_MakePoint($8, $9), 4326)::geography,
        consent_timestamp=NOW() 
       WHERE id=$10 RETURNING *`,
      [name, mobile, gps_consent, upi_consent, daysWorked, platformMode, isEligible, lng, lat, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. TRIGGER: PostGIS Spatial Rules Engine ---
app.post('/api/claims/trigger', async (req, res) => {
  const { sensorLat, sensorLng, triggerType, payoutAmount, zone } = req.body;
  try {
    const activePolicies = await pool.query(
      `SELECT p.id, p.user_id FROM policies p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.status = 'active' 
       AND u.gps_consent = true
       AND ST_DWithin(u.coords, ST_MakePoint($1, $2)::geography, 500)`, 
      [sensorLng, sensorLat]
    );

    const processedClaims = [];
    for (let policy of activePolicies.rows) {
      const claim = await pool.query(
        `INSERT INTO claims (policy_id, user_id, trigger_type, payout_amount) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [policy.id, policy.user_id, triggerType, payoutAmount]
      );
      await pool.query(`UPDATE policies SET status = 'claimed' WHERE id = $1`, [policy.id]);
      processedClaims.push(claim.rows[0]);
    }

    io.to(`zone:${zone}`).emit('claim-notification', {
      title: "Hyper-Local Payout Success!",
      body: `${triggerType} detected within 500m. ₹${payoutAmount} sent to your UPI.`,
      icon: "success"
    });

    res.json({ success: true, count: activePolicies.rows.length, claims: processedClaims });
  } catch (err) {
    res.status(500).json({ error: "Spatial trigger failed: " + err.message });
  }
});

// --- 5. DATA FETCHING ---
app.get('/api/payouts/:userId', async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM claims WHERE user_id = (SELECT id FROM users WHERE firebase_uid=$1 OR id::text=$1) ORDER BY triggered_at DESC`, 
    [req.params.userId]
  );
  res.json(result.rows);
});

app.get('/api/dashboard/:userId', async (req, res) => {
  const policy = await pool.query(
    `SELECT p.*, pr.final_amount FROM policies p 
     JOIN premiums pr ON p.premium_id = pr.id 
     WHERE p.user_id = (SELECT id FROM users WHERE firebase_uid=$1 OR id::text=$1) 
     ORDER BY p.created_at DESC LIMIT 1`, 
    [req.params.userId]
  );
  res.json(policy.rows[0] || { message: "No active policy" });
});

// Simulation Mode Metrics
app.get('/api/admin/stress-test', async (req, res) => {
    try {
        const stressData = await pool.query(`
            SELECT 
                (SELECT COALESCE(SUM(premium_paid_amount), 0) FROM policies) as pool_total,
                (SELECT COALESCE(SUM(payout_amount), 0) FROM claims) as current_payouts
        `);
        const { pool_total, current_payouts } = stressData.rows[0];
        const simulatedPayouts = parseFloat(current_payouts) * 3;
        const reserve = parseFloat(pool_total) - simulatedPayouts;
        res.json({
            isSimulating: true,
            metrics: {
                totalPremiums: pool_total,
                simulatedPayouts: simulatedPayouts.toFixed(2),
                liquidityReserve: reserve.toFixed(2),
                status: reserve > 0 ? "SOLVENT" : "CRITICAL"
            }
        });
    } catch (err) { res.status(500).json({ error: "Simulation failed" }); }
});

server.listen(3001, () => console.log("🚀 GigShield Backend Live on Port 3001"));