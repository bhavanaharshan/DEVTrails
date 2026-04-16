// server.js - GigShield Final Phase 3.3 (Zero-Trust Integrated)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const axios = require('axios');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. ZERO-TRUST: Dynamic Location Verification ---
app.post('/api/security/verify-location', async (req, res) => {
    const { user_id, declared_location_text, device_lat, device_lon } = req.body;
    try {
        // Step A: Ask OpenStreetMap for the "Official" coordinates of what the user typed
        const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: declared_location_text, format: 'json', limit: 1 },
            headers: { 'User-Agent': 'GigShield-S6-Project' }
        });

        if (geoRes.data.length === 0) return res.status(404).json({ secure: false, reason: "Location not found." });

        const officialLat = parseFloat(geoRes.data[0].lat);
        const officialLon = parseFloat(geoRes.data[0].lon);

        // Step B: Ping Priya's Python Engine for Haversine distance math
        const verifyRes = await axios.post('http://localhost:8000/api/v1/premium/verify', {
            lat1: device_lat, lon1: device_lon,
            lat2: officialLat, lon2: officialLon
        });

        res.json(verifyRes.data);
    } catch (err) { res.status(500).json({ secure: false, error: "Security Engine Offline" }); }
});

// --- 2. SYBIL DETECTION: Graph Export for Priya ---
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

// --- 3. RISK CORRIDOR: PostGIS Analysis ---
app.post('/api/route/check-risk', async (req, res) => {
    const { routeGeometry } = req.body;
    try {
        const result = await pool.query(`
            SELECT zone_name, risk_type FROM danger_zones 
            WHERE ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)) LIMIT 1`, 
            [JSON.stringify(routeGeometry)]
        );
        res.json({ isRiskCorridor: result.rows.length > 0, detail: result.rows[0] });
    } catch (err) { res.status(500).json({ error: "Spatial check failed" }); }
});

// --- 4. OFFLINE SOS: Twilio Webhook ---
app.post('/api/webhook/sms-sos', async (req, res) => {
    const { Body } = req.body; 
    try {
        const parts = Body.split('-'); // SOS-CLAIM-USERID-LAT-LON
        const userId = parts[2];
        await pool.query(`INSERT INTO claims (user_id, trigger_type, payout_amount) VALUES ($1, 'SMS_SOS', 500)`, [userId]);
        res.type('text/xml').send('<Response><Message>GigShield: SOS Verified. Payout Sent.</Message></Response>');
    } catch (err) { res.status(500).send('SMS Error'); }
});

// --- 5. USER UPDATE: Fingerprinting & Eligibility ---
app.post('/api/user/update', async (req, res) => {
    const { id, upi_id, device_fingerprint, lat, lng, daysWorked, platformMode } = req.body;
    try {
        const eligible = (platformMode === 'single' && daysWorked >= 90) || (platformMode === 'multi' && daysWorked >= 120);
        await pool.query(`
            UPDATE users SET upi_id=$1, device_fingerprint=$2, days_worked_count=$3, ss_eligible=$4,
            coords=ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography WHERE id::text=$7 OR firebase_uid=$7`,
            [upi_id, device_fingerprint, daysWorked, eligible, lng, lat, id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

server.listen(3001, () => console.log("🚀 GigShield 3.3 FINAL Live"));