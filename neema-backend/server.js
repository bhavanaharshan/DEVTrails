// server.js - Neema's Backend (Enhanced with Geo-Precision)
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

// --- HELPER: Geo-Safety Net (Prevents empty data) ---
const zoneDefaults = {
  "Hyderabad, India": { lat: 17.3850, lng: 78.4867 },
  "Hyderabad, Pakistan": { lat: 25.3960, lng: 68.3578 },
  "Bangalore South": { lat: 12.9141, lng: 77.5946 }
};

// --- REAL-TIME: Join Zone for Zero-Touch Updates ---
io.on('connection', (socket) => {
  socket.on('join-zone', (zone) => {
    socket.join(`zone:${zone}`);
    console.log(`Worker joined zone monitoring: ${zone}`);
  });
});

// --- API: Create Policy (NEW: Now accepts Geo-Data) ---
app.post('/api/policy/create', async (req, res) => {
  const { userId, zone, weeklyIncome } = req.body;
  
  // Logic: Use lat/lng from request, or fallback to zone defaults to prevent "EMPTY" data
  const lat = req.body.lat || zoneDefaults[zone]?.lat || 0;
  const lng = req.body.lng || zoneDefaults[zone]?.lng || 0;

  try {
    // 1. Get calculation from Bhavana (passing coordinates now)
    const mockMultiplier = 1.2; 
    const base = 40;
    const final = Math.min(Math.max(Math.round(base * mockMultiplier), 29), 99);

    // 2. Insert Premium with Lat/Lng snapshots
    const premiumResult = await pool.query(
      `INSERT INTO premiums (user_id, base_amount, risk_multiplier, final_amount, zone_snapshot, lat_at_calc, lng_at_calc)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [userId, base, mockMultiplier, final, zone, lat, lng]
    );
    const premiumId = premiumResult.rows[0].id;

    // 3. Create Policy
    const policyResult = await pool.query(
      `INSERT INTO policies (user_id, premium_id, week_start, status)
       VALUES ($1, $2, CURRENT_DATE, 'active') RETURNING *`,
      [userId, premiumId]
    );

    res.json({ success: true, policy: policyResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- API: Update Profile (Neema's Profile Screen) ---
app.post('/api/user/update', async (req, res) => {
  const { id, name, mobile, address, avatar_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1, mobile=$2, address=$3, avatar_url=$4 WHERE id=$5 RETURNING *`,
      [name, mobile, address, avatar_url, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Get Payout History ---
app.get('/api/payouts/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.* FROM claims c 
       JOIN policies p ON c.policy_id = p.id 
       WHERE p.user_id = $1 ORDER BY c.triggered_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Policy Dashboard Data ---
app.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const policy = await pool.query(
      `SELECT p.*, pr.final_amount, pr.lat_at_calc, pr.lng_at_calc FROM policies p 
       JOIN premiums pr ON p.premium_id = pr.id 
       WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT 1`,
      [req.params.userId]
    );
    res.json(policy.rows[0] || { message: "No active policy" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TRIGGER: Sam's Rules Engine Endpoint ---
// Sam can now trigger by coordinates OR zone name
app.post('/api/claims/trigger', async (req, res) => {
  const { zone, lat, lng, triggerType, payoutAmount } = req.body;
  try {
    // Find policies matching the exact geo-location
    const activePolicies = await pool.query(
      `SELECT p.id, p.user_id FROM policies p 
       JOIN premiums pr ON p.premium_id = pr.id
       WHERE (pr.zone_snapshot = $1 OR (pr.lat_at_calc = $2 AND pr.lng_at_calc = $3)) 
       AND p.status = 'active'`, 
      [zone, lat, lng]
    );

    for (let policy of activePolicies.rows) {
      await pool.query(
        `INSERT INTO claims (policy_id, trigger_type, payout_amount) VALUES ($1, $2, $3)`,
        [policy.id, triggerType, payoutAmount]
      );
      await pool.query(`UPDATE policies SET status = 'pending_claim' WHERE id = $1`, [policy.id]);
    }

    io.to(`zone:${zone}`).emit('claim-notification', {
      title: "Automatic Payout!",
      body: `${triggerType} detected. ₹${payoutAmount} is being credited.`
    });

    res.json({ success: true, count: activePolicies.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(3001, () => console.log("GigShield Backend Live on Port 3001"));
