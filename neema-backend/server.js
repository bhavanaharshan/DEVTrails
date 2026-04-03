// server.js - Neema's Backend
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

// --- API: Get Payout History (Neema's Payout Screen) ---
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
      `SELECT p.*, pr.final_amount FROM policies p 
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
app.post('/api/claims/trigger', async (req, res) => {
  const { zone, triggerType, payoutAmount } = req.body;
  try {
    const activePolicies = await pool.query(
      `SELECT p.id, p.user_id FROM policies p 
       JOIN users u ON p.user_id = u.id 
       WHERE u.zone = $1 AND p.status = 'active'`, [zone]
    );

    for (let policy of activePolicies.rows) {
      await pool.query(
        `INSERT INTO claims (policy_id, trigger_type, payout_amount) VALUES ($1, $2, $3)`,
        [policy.id, triggerType, payoutAmount]
      );
      await pool.query(`UPDATE policies SET status = 'pending_claim' WHERE id = $1`, [policy.id]);
    }

    // Zero-Touch UX: Signal the Frontend
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