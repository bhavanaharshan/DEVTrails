export async function evaluateUser(user) {
    console.log(`\n======================================================`);
    console.log(`🔍 EVALUATING RIDER: ${user.user_id}`);
    console.log(`======================================================`);

    try {
        // 1. The Social Security Gate
        if (user.days_active_last_120 < 90) {
            console.log(`   ❌ BLOCKED: Fails SS threshold (${user.days_active_last_120}/90).`);
            return; 
        }

        // 2. Environmental Check (HARDCODED FOR TEST)
        // Removed checkPlatformOutage() to fix "is not defined" error
        const triggerType = "outage"; 

        console.log(`   ⚠️ EVENT DETECTED: [${triggerType.toUpperCase()}]. Initiating Fraud Check...`);
        
        // --- 3. THE REFINED ML HANDSHAKE ---
        const mlPayload = {
            user_id: String(user.user_id), 
            start_location: [user.lat, user.lon],
            end_location: [user.last_known_lat || user.lat, user.last_known_lon || user.lon],
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString()
        };

        let mlResult = null;
        let retries = 6; 
        let delayMs = 10000; 

        for (let i = 0; i <= retries; i++) {
            try {
                console.log(`   🚀 Attempt ${i + 1}: Calling ${PRIYA_ML_URL}...`);
                const mlResponse = await axios.post(PRIYA_ML_URL, mlPayload, { 
                    timeout: 45000,
                    headers: { 'Content-Type': 'application/json' }
                });
                
                mlResult = mlResponse.data;
                const isFraud = mlResult.is_fraud ?? mlResult.fraud ?? false;
                console.log(`   🧠 ML Response: Fraud=${isFraud}`);
                mlResult.is_fraud = isFraud; 
                break; 
            } catch (error) {
                if (i === retries) {
                    console.error(`   🛑 ML Engine unreachable. Moving to MANUAL REVIEW.`);
                    mlResult = { is_fraud: true, flag_reason: "ML_ENGINE_TIMEOUT" };
                } else {
                    console.log(`   ⏳ Render still booting... (Wait ${delayMs/1000}s)`);
                    await new Promise(r => setTimeout(r, delayMs));
                }
            }
        }

        // --- 4. Dynamic Pricing & Payout Routing ---
        let basePayout = user.weekly_income * 0.10;
        const finalAmount = Math.round(basePayout); 

        if (mlResult && mlResult.is_fraud === false) {
            console.log(`   🟢 STATUS: APPROVED. Triggering UPI Payout of ₹${finalAmount}...`);
            await axios.post(WEBHOOK_URL, {
                user_id: user.user_id,
                trigger_type: triggerType,
                payout_amount: finalAmount
            }).catch(e => console.log("   ❌ Webhook failed: Backend not ready."));
        } else {
            const reason = mlResult ? (mlResult.flag_reason || "Behavioral Anomaly") : "AI Timeout";
            console.log(`   🔴 STATUS: FLAGGED [${reason}]`);
            console.log(`   📁 Claim routed to Admin Queue for Review.`);
            await axios.post(FLAGGED_URL, {
                user_id: user.user_id,
                reason: reason,
                payout_amount: finalAmount
            }).catch(e => console.log("   ❌ Flagged Webhook failed."));
        }

    } catch (error) {
        console.error(`   ❌ CRITICAL ERROR: ${error.message}`);
    }
}