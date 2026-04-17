import axios from 'axios';
import { fetchWeather, fetchAQI, checkPlatformOutage } from './fetchers.js';
import { THRESHOLDS, PRIYA_ML_URL, WEBHOOK_URL, FLAGGED_URL } from './config.js';

export async function evaluateUser(user) {
    console.log(`\n======================================================`);
    console.log(`🔍 EVALUATING RIDER: ${user.user_id}`);
    console.log(`======================================================`);

    // The Global Safety Net: Prevents the Cron Job from crashing if one user fails
    try {
        // ── 1. The Social Security Gate (90/120 Day Rule) ────────────────────────
        if (user.days_active_last_120 < 90) {
            console.log(`   ❌ BLOCKED: Fails Social Security threshold (${user.days_active_last_120}/90 days).`);
            console.log(`   ⛔ Ending evaluation for ${user.user_id}.`);
            return; 
        }
        console.log(`   ✅ SS Code Passed (${user.days_active_last_120} days active).`);

        // ── 2. Fetch Environmental Data ──────────────────────────────────────────
        console.log(`   📡 Pinging Open-Meteo & Sensors for Lat: ${user.lat}, Lon: ${user.lon}...`);
        
        const isOutage = checkPlatformOutage();
        const currentWeather = await fetchWeather(user.lat, user.lon);
        const currentAQI = await fetchAQI(user.lat, user.lon);

        // ── 3. Determine Trigger Type ────────────────────────────────────────────
        let triggerType = null;

        if (isOutage) {
            triggerType = "outage";
        } else if (currentAQI > THRESHOLDS.AQI_US) {
            triggerType = "aqi";
        } else if (currentWeather.precipitation > THRESHOLDS.PRECIPITATION_MM) {
            triggerType = "rain";
        } else if (currentWeather.temperature_2m > THRESHOLDS.TEMPERATURE_CELSIUS) {
            triggerType = "heat";
        } else if (currentWeather.visibility < THRESHOLDS.VISIBILITY_METRES) {
            triggerType = "fog";
        }

        triggerType = "outage";
        if (!triggerType) {
            console.log(`   🌤️ No extreme conditions detected. Safe to work.`);
            return; 
        }

        // ── 4. Behavioral Fraud Check (Priya's ML Engine) ────────────────────────
        console.log(`   ⚠️ EVENT DETECTED: [${triggerType.toUpperCase()}]. Initiating Fraud Check...`);
        
       try {
            console.log("   🔄 1. Waking up Render (Pre-ping)...");
            // Hits the base URL to start the boot process
            await axios.get("https://devtrails-yodq.onrender.com", { timeout: 30000 }).catch(() => {});
            
            console.log("   ⏳ 2. Stabilizing (Waiting 10s for ML model to load)...");
            await new Promise(r => setTimeout(r, 10000)); 
        } catch (e) {
            console.log("   ⚠️ Pre-ping ignored, proceeding to main call...");
        }

        // --- B. PREPARE DATA ---
        const mlPayload = {
            user_id: user.user_id,
            start_location: [user.lat, user.lon],
            end_location: [user.lat, user.lon],
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString()
        };

        let mlResult;
        let retries = 4; // 5 total attempts
        let delayMs = 8000;

        // --- C. THE REPLACEMENT RETRY LOOP (The Fix) ---
        for (let i = 0; i <= retries; i++) {
            try {
                console.log(`   🚀 Attempt ${i + 1}: Calling /predict...`);
                // Ensure PRIYA_ML_URL in config.js is "https://devtrails-yodq.onrender.com/predict"
                const mlResponse = await axios.post(PRIYA_ML_URL, mlPayload, { timeout: 45000 });
                mlResult = mlResponse.data;
                console.log(`   🧠 ML Response: Fraud=${mlResult.is_fraud}`);
                break; 
            } catch (error) {
                if (i === retries) {
                    console.error(`   🛑 SAFETY LOCK: ML Engine unreachable. ABORTING PAYOUT.`);
                    return; // ⛔ THIS STOP THE PAYOUT if AI fails
                }
                console.log(`   ⏳ Render still booting... Waiting 8s. (${i + 1}/${retries + 1})`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        // ── 5. Dynamic Pricing Algorithm ─────────────────────────────────────────
        console.log(`   💸 Calculating Dynamic Payout...`);
        let basePayout = user.weekly_income * 0.10; // Base: 10% of weekly income
        let riskMultiplier = 1.0; 

        switch (triggerType) {
            case "outage":
                riskMultiplier = 1.0; 
                console.log(`   🔌 App Outage. Standard 1.0x compensation.`);
                break;
            case "rain":
                riskMultiplier = currentWeather.precipitation > 50 ? 1.5 : 1.2;
                console.log(`   🌊 Rain (${currentWeather.precipitation}mm). Applying ${riskMultiplier}x multiplier.`);
                break;
            case "heat":
                riskMultiplier = currentWeather.temperature_2m > 45 ? 1.5 : 1.2;
                console.log(`   🔥 Heatwave (${currentWeather.temperature_2m}°C). Applying ${riskMultiplier}x multiplier.`);
                break;
            case "fog":
                riskMultiplier = currentWeather.visibility < 50 ? 2.0 : 1.5;
                console.log(`   🌫️ Fog (${currentWeather.visibility}m). Applying ${riskMultiplier}x multiplier.`);
                break;
            case "aqi":
                riskMultiplier = currentAQI > 400 ? 2.0 : 1.5;
                console.log(`   😷 Toxic AQI (${currentAQI}). Applying ${riskMultiplier}x multiplier.`);
                break;
        }

        const finalPayoutAmount = Math.round(basePayout * riskMultiplier);

        // ── 6. Payout Routing (Neema's Backend) ──────────────────────────────────
        if (mlResult.is_fraud === false) {
            console.log(`   🟢 STATUS: APPROVED. Triggering UPI Payout of ₹${finalPayoutAmount}...`);
            try {
                await axios.post(WEBHOOK_URL, {
                    user_id: user.user_id,
                    trigger_type: triggerType,
                    payout_amount: finalPayoutAmount
                });
                console.log(`   🚀 Payout successfully dispatched to Bank.`);
            } catch (e) {
                console.error(`   ❌ Failed to reach Neema's Auto-Pay webhook.`);
            }
        } else {
            console.log(`   🔴 STATUS: FRAUD FLAGGED (${mlResult.flag_reason})`);
            console.log(`   🛑 Halting Payout. Routing to Admin Dashboard for Review...`);
            try {
                await axios.post(FLAGGED_URL, {
                    user_id: user.user_id,
                    trigger_type: triggerType,
                    payout_amount: finalPayoutAmount,
                    status: "pending_review",
                    reason: mlResult.flag_reason
                });
                console.log(`   📁 Claim securely locked in Admin Queue.`);
            } catch (e) {
                console.error(`   ❌ Failed to reach Neema's Flagged webhook.`);
            }
        }

    } catch (error) {
        // ── 7. Global Error Handler ──────────────────────────────────────────────
        console.error(`   ❌ CRITICAL ERROR evaluating ${user.user_id}: ${error.message}`);
        console.error(`   ⏭️ Skipping to the next user to prevent server crash...`);
    }
}