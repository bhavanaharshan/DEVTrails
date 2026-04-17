// server.js - GigShield Final Phase 3.4 (Zero-Trust & Admin Integrated)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const axios = require('axios');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);

// --- 1. ENHANCED SOCKET & CORS CONFIGURATION ---
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true // Fixes Socket.io handshake 400 errors
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- 2. DYNAMIC ADMIN DASHBOARD ROUTE (Bhavana's Fix) ---
app.get('/api/admin/metrics', async (req, res) => {
    try {
        // A. Eligibility Stats (Social Security Card)
        const eligibilityQuery = await pool.query(`
            SELECT 
                COUNT(*) as total_count, 
                COUNT(*) FILTER (WHERE ss_eligible = true) as eligible_count 
            FROM users
        `);

        // B. Review Queue (Sybil/Fraud detection from Priya's Engine flags)
        const reviewQueueQuery = await pool.query(`
            SELECT id, name, suspicion_reason, mobile 
            FROM users 
            WHERE is_flagged = true 
            ORDER BY updated_at DESC LIMIT 5
        `);

        res.json({
            metrics: { lossRatio: 0.42 }, // Dynamic logic can be added here
            eligibility: eligibilityQuery.rows[0],
            reviewQueue: reviewQueueQuery.rows
        });
    } catch (err) {
        console.error("Admin Metric Error:", err.message);
        res.status(500).json({ error: "Failed to fetch admin data" });
    }
});

// --- 3. ZERO-TRUST: Dynamic Location Verification (Priya's Engine) ---
app.post('/api/security/verify-location', async (req, res) => {
    const { user_id, declared_location_text, device_lat, device_lon } = req.body;
    
    try {
        // Step A: Geocoding via Nominatim
        const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: declared_location_text, format: 'json', limit: 1 },
            headers: { 'User-Agent': 'GigShield-S6-Project' }
        });

        if (!geoRes.data || geoRes.data.length === 0) {
            return res.json({ secure: false, reason: "Location text not recognized." });
        }

        const officialLat = parseFloat(geoRes.data[0].lat);
        const officialLon = parseFloat(geoRes.data[0].lon);

        // Step B: Connect to Priya's Engine
        const verifyRes = await axios.post('https://supraorbital-hyperrhythmical-naoma.ngrok-free.dev/api/v1/premium/verify', {
            lat1: device_lat, 
            lon1: device_lon,
            lat2: officialLat, 
            lon2: officialLon
        }, { 
            headers: { 'ngrok-skip-browser-warning': 'true' },
            timeout: 5000 
        });

        // Step C: Update DB status if flagged
        if (!verifyRes.data.secure) {
            await pool.query('UPDATE users SET is_flagged = true, suspicion_reason = $1 WHERE id = $2', 
            [verifyRes.data.reason || "Location Anomaly", user_id]);
        }

        res.json({
            secure: verifyRes.data.secure,
            reason: verifyRes.data.secure ? "Verified" : (verifyRes.data.reason || "Verification Failed")
        });

    } catch (err) {
        res.status(500).json({ secure: false, reason: "Security Engine Offline." });
    }
});

// --- 4. SYBIL DETECTION: Graph Export ---
app.get('/api/admin/graph-data', async (req, res) => {
    try {
        const edges = await pool.query(`
            SELECT u1.id AS source, u2.id AS target, 'shared_upi' AS type FROM users u1
            JOIN users u2 ON u1.upi_id = u2.upi_id AND u1.id < u2.id
            UNION
            SELECT u1.id AS source, u2.id AS target, 'shared_device' AS type FROM users u1
            JOIN users u2 ON u1.device_fingerprint = u2.device_fingerprint AND u1.id < u2.id
        `);
        const nodes = await pool.query(`SELECT id, name, is_flagged FROM users`);
        res.json({ nodes: nodes.rows, edges: edges.rows });
    } catch (err) { res.status(500).json({ error: "Graph fail" }); }
});

// --- 5. OFFLINE SOS: Twilio Webhook ---
app.post('/api/webhook/sms-sos', async (req, res) => {
    const { Body } = req.body; 
    try {
        const parts = Body.split('-'); 
        const userId = parts[2];
        await pool.query(`INSERT INTO claims (user_id, trigger_type, payout_amount) VALUES ($1, 'SMS_SOS', 500)`, [userId]);
        res.type('text/xml').send('<Response><Message>GigShield: SOS Verified. Payout Sent.</Message></Response>');
    } catch (err) { res.status(500).send('SMS Error'); }
});

// --- 6. USER/LOCATION UPDATES ---
app.post('/api/user/update', async (req, res) => {
    const { id, upi_id, device_fingerprint, lat, lng, daysWorked, platformMode } = req.body;
    try {
        const eligible = (platformMode === 'single' && daysWorked >= 90) || (platformMode === 'multi' && daysWorked >= 120);
        await pool.query(`
            UPDATE users SET upi_id=$1, device_fingerprint=$2, days_worked_count=$3, ss_eligible=$4,
            coords=ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, updated_at = NOW()
            WHERE id::text=$7 OR firebase_uid=$7`,
            [upi_id, device_fingerprint, daysWorked, eligible, lng, lat, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SERVER START ---
server.listen(3001, () => {
    console.log("🚀 GigShield 3.4 FULLY INTEGRATED");
    console.log("📍 Admin Route: http://localhost:3001/api/admin/metrics");
    console.log("📍 ngrok Tunnel: https://rebound-estimate-glue.ngrok-free.dev");
});