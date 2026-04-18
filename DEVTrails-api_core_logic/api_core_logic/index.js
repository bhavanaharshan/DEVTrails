import express from 'express';
import cron from 'node-cron';
import axios from 'axios';
import { MOCK_USERS, TEST_MODE, USERS_API_URL } from './config.js';
import { evaluateUser } from './evaluator.js';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

console.log("🚀 Orchestrator Starting...");

// Helper: get users depending on mode
async function getUsersToEvaluate() {
    if (TEST_MODE) {
        console.log("🧪 TEST_MODE enabled: using MOCK_USERS");
        return MOCK_USERS;
    }

    try {
        console.log(`📡 Fetching active users from backend: ${USERS_API_URL}`);
        const response = await axios.get(USERS_API_URL, { timeout: 5000 });
        const users = response.data;

        if (!Array.isArray(users)) {
            console.error("❌ USERS_API did not return an array.");
            return [];
        }

        console.log(`✅ Retrieved ${users.length} active user(s) from backend`);
        return users;
    } catch (error) {
        console.error(`❌ Failed to fetch users from backend: ${error.message}`);
        return [];
    }
}

// Shared evaluation runner
async function runEvaluationCycle() {
    console.log(`\n⏰ CRON TICK: ${new Date().toLocaleTimeString()}`);

    const users = await getUsersToEvaluate();

    if (!users.length) {
        console.log("⚠️ No users available for evaluation.");
        return;
    }

    for (const user of users) {
        await evaluateUser(user);
    }
}

// Cron loop (every 2 minutes)
cron.schedule('*/2 * * * *', async () => {
    await runEvaluationCycle();
});

// Twilio SOS webhook
app.post('/api/webhook/sms-sos', async (req, res) => {
    const smsBody = req.body.Body ? req.body.Body.toUpperCase().trim() : "";
    console.log(`🚨 SOS RECEIVED via SMS: ${smsBody}`);

    try {
        const parts = smsBody.split('-');
        // Format: SOS-CLAIM-USER123-LAT19.07-LON72.87
        if (parts.length < 5) throw new Error("Incomplete SOS Format");

        const emergencyUser = {
            user_id: parts[2].toLowerCase(),
            lat: parseFloat(parts[3].replace('LAT', '')),
            lon: parseFloat(parts[4].replace('LON', '')),
            last_known_lat: parseFloat(parts[3].replace('LAT', '')),
            last_known_lon: parseFloat(parts[4].replace('LON', '')),
            tier: 'standard',
            weekly_income: 4500,
            days_active_last_120: 100
        };

        await evaluateUser(emergencyUser);
        res.send("<Response><Sms>GigShield SOS Received. Emergency payout check initiated.</Sms></Response>");
    } catch (e) {
        console.error("❌ SMS Parse Error:", e.message);
        res.send("<Response><Sms>GigShield Error: Invalid SOS format. Use: SOS-CLAIM-ID-LAT-LON</Sms></Response>");
    }
});

// Health route
app.get('/health', (req, res) => {
    res.json({ service: 'trigger-engine', status: 'ok', test_mode: TEST_MODE });
});

app.listen(3002, () => console.log("🎧 Trigger Engine Listening on Port 3002"));

setTimeout(() => {
    runEvaluationCycle();
}, 8000);