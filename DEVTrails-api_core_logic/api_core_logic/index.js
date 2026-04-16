// index.js
import express from 'express';
import cron from 'node-cron';
import { MOCK_USERS } from './config.js';
import { evaluateUser } from './evaluator.js';

const app = express();
app.use(express.urlencoded({ extended: false })); 

console.log("🚀 Orchestrator Starting...");

// ── 1. The Cron Loop ─────────────────────────────────────────────────────────
cron.schedule('*/2 * * * *', async () => {
    console.log(`\n⏰ CRON TICK: ${new Date().toLocaleTimeString()}`);
    for (const user of MOCK_USERS) {
        await evaluateUser(user);
    }
});

// ── 2. The Twilio SOS Webhook (Emergency Bypass) ─────────────────────────────
app.post('/api/webhook/sms-sos', async (req, res) => {
    const smsBody = req.body.Body; // Format expected: SOS-CLAIM-user123-LAT19.07-LON72.87
    console.log(`🚨 SOS RECEIVED via SMS: ${smsBody}`);

    try {
        const parts = smsBody.split('-');
        // Generate an instant mock user based on the SMS coordinates to bypass cron
        const emergencyUser = {
            user_id: parts[2],
            lat: parseFloat(parts[3].replace('LAT', '')),
            lon: parseFloat(parts[4].replace('LON', '')),
            last_known_lat: parseFloat(parts[3].replace('LAT', '')), // bypass fraud for SOS
            last_known_lon: parseFloat(parts[4].replace('LON', '')),
            tier: 'standard', weekly_income: 4500, days_active_last_120: 100
        };

        await evaluateUser(emergencyUser);
        res.send("<Response><Sms>GigShield SOS Received. Weather and payout check initiated.</Sms></Response>");
    } catch (e) {
        res.send("<Response><Sms>GigShield Error: Invalid SOS format.</Sms></Response>");
    }
});

app.listen(3002, () => console.log("🎧 Trigger Engine Listening for Twilio on Port 3002"));

// Run first check immediately
MOCK_USERS.forEach(user => evaluateUser(user));