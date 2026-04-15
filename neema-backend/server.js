// server.js - Neema's Backend (Judge-Ready Integration Version)
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

// --- 1. ADMIN HUB: Metrics API (The Insurer View) ---
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

        const eligibility = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE (platform_mode = 'single' AND days_worked_count >= 90) 
                                 OR (platform_mode = 'multi' AND days_worked_count >= 120)) as eligible_count,
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

// --- NEW: ADMIN STRESS TEST (Simulation Mode) ---
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
            scenario: "14-Day Monsoon Peak",
            metrics: {
                totalPremiums: pool_total,
                simulatedPayouts: simulatedPayouts.toFixed(2),
                liquidityReserve: reserve.toFixed(2),
                status: reserve > 0 ? "SOLVENT" : "CRITICAL"
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Stress test simulation failed" });
    }
});

// --- 2. POLICY: Create with Adverse Selection Lockout ---
app.post('/api/policy/create', async (req, res) => {
    const { userId, premiumId, amount, zone } = req.body;
    try {
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

        const result = await pool.query(
            `INSERT INTO policies (user_id, premium_id, premium_paid_amount, status) 
             VALUES ($1, $2, $3, 'active') RETURNING *`,
            [userId, premiumId, amount]
        );
        res.json({ success: true, policy: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. PROFILE: Update with DPDP Consent & PostGIS Coordinates ---
app.post('/api/user/update', async (req, res) => {
  const { id, name, mobile, gps_consent, upi_consent, address, lat, lng } = req.body;
  try {
    // ST_SetSRID converts lat/lng into a PostGIS point for spatial queries
    const result = await pool.query(
      `UPDATE users SET 
        name=$1, mobile=$2, address=$3,
        gps_consent=$4, upi_consent=$5,
        coords=ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
        consent_timestamp=NOW() 
       WHERE id=$8 RETURNING *`,
      [name, mobile, address, gps_consent, upi_consent, lng, lat, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. TRIGGER: PostGIS Spatial Rules Engine (Hyper-Local) ---
app.post('/api/claims/trigger', async (req, res) => {
  const { sensorLat, sensorLng, triggerType, payoutAmount, zone } = req.body;
  try {
    // 🛡️ POSTGIS SPATIAL CHECK: 
    // Find workers with GPS consent who are within 500m of the rain sensor
    const activePolicies = await pool.query(
      `SELECT p.id, p.user_id, u.upi_id FROM policies p 
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

    // Notify workers in that specific zone via Socket.io
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
    `SELECT * FROM claims WHERE user_id = $1 ORDER BY triggered_at DESC`, [req.params.userId]
  );
  res.json(result.rows);
});

app.get('/api/dashboard/:userId', async (req, res) => {
  const policy = await pool.query(
    `SELECT p.*, pr.final_amount FROM policies p 
     JOIN premiums pr ON p.premium_id = pr.id 
     WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT 1`, [req.params.userId]
  );
  res.json(policy.rows[0] || { message: "No active policy" });
});

server.listen(3001, () => console.log("🚀 GigShield Backend Live on Port 3001"));