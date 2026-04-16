import axios from "axios";
import { fetchWeather, fetchAQI, checkPlatformOutage } from "./fetchers.js";
import { THRESHOLDS, TIER_MULTIPLIERS, WEBHOOK_URL, FLAGGED_URL, PRIYA_ML_URL } from "./config.js";

export async function evaluateUser(user) {
    console.log(`\n🔍 Checking user: ${user.user_id}`);

    // 1. SS Code Math
    if (user.days_active_last_120 < 90) {
        console.log(`   ❌ Rejected: Fails Social Security 90/120 day threshold.`);
        return; 
    }

    try {
        // 2. Fetch all real-world data
        const weather = await fetchWeather(user.lat, user.lon);
        const aqi = await fetchAQI(user.lat, user.lon);
        const isOutage = checkPlatformOutage();
        
        let triggerType = null;

        // 3. The Decision Tree (Checks Outage -> AQI -> Weather -> Fog)
        if (isOutage) triggerType = "outage";
        else if (aqi > THRESHOLDS.AQI_US) triggerType = "aqi";
        else if (weather.precipitation > THRESHOLDS.PRECIPITATION_MM) triggerType = "rain";
        else if (weather.temperature_2m > THRESHOLDS.TEMPERATURE_CELSIUS) triggerType = "heat";
        else if (weather.visibility < THRESHOLDS.VISIBILITY_METRES) triggerType = "fog";

        if (triggerType) {
            console.log(`   ⚠️ Disruption Detected: ${triggerType.toUpperCase()}`);
            
            // Calculate Payout
            const daily = user.weekly_income / 7;
            const multiplier = TIER_MULTIPLIERS[user.tier] || 0.60;
            const payoutAmount = Math.round(daily * multiplier);
            
            // 4. The Orchestrator - Ping Priya's ML Fraud API
            console.log(`   🕵️ Pinging ML Fraud API...`);
            const fraudResponse = await axios.post(PRIYA_ML_URL, {
                user_id: user.user_id,
                claim_lat: user.lat, claim_lon: user.lon,
                last_known_lat: user.last_known_lat, last_known_lon: user.last_known_lon,
                time_diff_minutes: 5,
                hour_of_day: new Date().getHours()
            });
            
            const isFraud = fraudResponse.data.is_fraud; 

            // 5. Integration Routing
            if (isFraud) {
                console.log(`   🛑 FRAUD FLAGGED! Routing to Neema's Admin Dashboard.`);
                await axios.post(FLAGGED_URL, {
                    user_id: user.user_id, reason: "Kinematic Violation", status: "pending_review", payout_amount: payoutAmount
                });
            } else {
                console.log(`   ✅ Clear! Firing instant UPI payout of ₹${payoutAmount}.`);
                await axios.post(WEBHOOK_URL, {
                    user_id: user.user_id, trigger_type: triggerType, payout_amount: payoutAmount
                });
            }
        } else {
             console.log(`   ✔ All conditions safe. No claims triggered.`);
        }
    } catch (error) {
        console.error(`   ❌ System Error evaluating ${user.user_id}:`, error.message);
    }
}