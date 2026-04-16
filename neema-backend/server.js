// server.js - GigShield Backend (Phase 3.2 Final Integration)
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

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
// Required for Twilio/SMS Webhooks to parse the body correctly
app.use(express.urlencoded({ extended: true }));

io.on('connection', (socket) => {
    socket.on('join-zone', (zone) => {
        socket.join(`zone:${zone}`);
        console.log(`Worker joined zone monitoring: ${zone}`);
    });
});

// --- 1. ADMIN & GRAPH EXPORT (Priya's GNN Pipeline) ---
app.get('/api/admin/graph-data', async (req, res) => {
    try {
        const graphQuery = await pool.query(`
            SELECT u1.id AS source, u2.id AS target, 'shared_upi' AS type
            FROM users u1
            JOIN users u2 ON u1.upi_id = u2.upi_id AND u1.id < u2.id
            UNION
            SELECT u1.id AS source, u2.id AS target, 'shared_device' AS type
            FROM users u1
            JOIN users u2 ON u1.device_fingerprint = u2.device_fingerprint AND u1.id < u2.id
        `);
        const nodes = await pool.query(`SELECT id, name, is_flagged FROM users`);
        res.json({ nodes: nodes.rows, edges: graphQuery.rows });
    } catch (err) { res.status(500).json({ error: "Graph export failed" }); }
});

// --- 2. RISK CORRIDOR: Routing Analysis (Samridhi & Bhavana Bridge) ---
app.post('/api/route/check-risk', async (req, res) => {
    const { routeGeometry } = req.body;
    try {
        const riskIntersect = await pool.query(`
            SELECT zone_name, risk_type, risk_score 
            FROM danger_zones 
            WHERE ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
            ORDER BY risk_score DESC LIMIT 1`, 
            [JSON.stringify(routeGeometry)]
        );
        res.json({ isRiskCorridor: riskIntersect.rows.length > 0, riskDetail: riskIntersect.rows[0] || null });
    } catch (err) { res.status(500).json({ error: "Routing risk check failed" }); }
});

// --- 3. OFFLINE SOS: SMS Webhook (Twilio Implementation) ---
app.post('/api/webhook/sms-sos', async (req, res) => {
    const { Body, From } = req.body; // Example Body: "SOS-CLAIM-USER123-LAT19.07-LON72.87"
    try {
        const parts = Body.split('-');
        if (parts[0] !== 'SOS') return res.status(400).send('Invalid Format');

        const userId = parts[2];
        const lat = parseFloat(parts[3].replace('LAT', ''));
        const lon = parseFloat(parts[4].replace('LON', ''));

        // Instant Verification: Is there a recent alert near these coordinates?
        const weatherCheck = await pool.query(`
            SELECT alert_level FROM zone_weather 
            WHERE zone = (SELECT zone FROM users WHERE id::text = $1 OR firebase_uid = $1)
            AND alert_time > NOW() - INTERVAL '2 hours' LIMIT 1`, [userId]);

        if (weatherCheck.rows.length > 0) {
            await pool.query(`
                INSERT INTO claims (user_id, trigger_type, payout_amount, status) 
                VALUES ((SELECT id FROM users WHERE id::text=$1 OR firebase_uid=$1), 'OFFLINE_SOS', 500.0, 'priority')`, [userId]);
            
            res.type('text/xml').send('<Response><Message>SOS Verified. Emergency payout ₹500 processed.</Message></Response>');
        } else {
            res.type('text/xml').send('<Response><Message>SOS Received. Our team is monitoring your safety.</Message></Response>');
        }
    } catch (err) { res.status(500).send('Webhook Error'); }
});

// --- 4. PROFILE & FINGERPRINTING ---
app.post('/api/user/update', async (req, res) => {
    const { id, name, upi_id, device_fingerprint, lat, lng, daysWorked, platformMode } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    try {
        const isEligible = (platformMode === 'single' && daysWorked >= 90) || 
                           (platformMode === 'multi' && daysWorked >= 120);
        const result = await pool.query(`
            UPDATE users SET 
                name=$1, upi_id=$2, device_fingerprint=$3, ip_address=$4,
                days_worked_count=$5, platform_mode=$6, ss_eligible=$7,
                coords=ST_SetSRID(ST_MakePoint($8, $9), 4326)::geography,
                consent_timestamp=NOW() 
            WHERE firebase_uid=$10 OR id::text=$10 RETURNING *`,
            [name, upi_id, device_fingerprint, ip, daysWorked, platformMode, isEligible, lng, lat, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 5. TRIGGER & CLAIMS (Spatial Engine) ---
app.post('/api/claims/trigger', async (req, res) => {
    const { sensorLat, sensorLng, triggerType, payoutAmount, zone } = req.body;
    try {
        const activePolicies = await pool.query(`
            SELECT p.id, p.user_id FROM policies p JOIN users u ON p.user_id = u.id 
            WHERE p.status = 'active' AND u.gps_consent = true
            AND ST_DWithin(u.coords, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 500)`, 
            [sensorLng, sensorLat]
        );
        for (let policy of activePolicies.rows) {
            await pool.query(`INSERT INTO claims (policy_id, user_id, trigger_type, payout_amount) VALUES ($1, $2, $3, $4)`,
                [policy.id, policy.user_id, triggerType, payoutAmount]);
            await pool.query(`UPDATE policies SET status = 'claimed' WHERE id = $1`, [policy.id]);
        }
        io.to(`zone:${zone}`).emit('claim-notification', { title: "Payout!", body: `₹${payoutAmount} triggered.` });
        res.json({ success: true, count: activePolicies.rows.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

server.listen(3001, () => console.log("🚀 GigShield Backend Final 3.2 Live"));