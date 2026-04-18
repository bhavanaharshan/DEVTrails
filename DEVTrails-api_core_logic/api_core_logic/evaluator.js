import axios from 'axios';
import { PRIYA_ML_URL, WEBHOOK_URL, FLAGGED_URL, THRESHOLDS } from './config.js';
import { fetchWeather, fetchAQI, checkPlatformOutage } from './fetchers.js';

export async function evaluateUser(user) {
  console.log(`\n======================================================`);
  console.log(`🔍 EVALUATING RIDER: ${user.user_id}`);
  console.log(`======================================================`);

  try {
    // 1. Social Security Gate
    if ((user.days_active_last_120 || 0) < 90) {
      console.log(`   ❌ BLOCKED: Fails SS threshold (${user.days_active_last_120}/90).`);
      return;
    }

    // 2. Environmental Check
    const weather = await fetchWeather(user.lat, user.lon);
    const aqi = await fetchAQI(user.lat, user.lon);
    const isPlatformDown = checkPlatformOutage();

    let triggerType = null;

    if (isPlatformDown) triggerType = 'outage';
    else if (weather && weather.precipitation > THRESHOLDS.PRECIPITATION_MM) triggerType = 'flood';
    else if (aqi && aqi > THRESHOLDS.AQI_US) triggerType = 'pollution_lockdown';

    if (!triggerType) {
      console.log('   ✅ STATUS: Clear. No environmental triggers active.');
      return;
    }

    console.log(`   ⚠️ EVENT DETECTED: [${triggerType.toUpperCase()}]. Initiating Fraud Check...`);

    // 3. ML Fraud Check
    const mlPayload = {
      user_id: String(user.user_id),
      claim_lat: user.lat,
      claim_lon: user.lon,
      last_known_lat: user.last_known_lat || user.lat,
      last_known_lon: user.last_known_lon || user.lon,
      time_diff_minutes: 10,
      hour_of_day: new Date().getHours()
    };

    let mlResult = null;

    try {
      console.log(`   🚀 Calling Local ML Engine: ${PRIYA_ML_URL}...`);
      const mlResponse = await axios.post(PRIYA_ML_URL, mlPayload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });

      mlResult = mlResponse.data;
      console.log(`   🧠 ML Response: Fraud=${mlResult.is_fraud}`);
    } catch (error) {
      console.error(`   🛑 Local ML Engine unreachable at ${PRIYA_ML_URL}`);
      mlResult = { is_fraud: true, flag_reason: 'ML_ENGINE_OFFLINE' };
    }

    // 4. Payout Routing
    const basePayout = (user.weekly_income || 0) * 0.10;
    const finalAmount = Math.round(basePayout);

    if (mlResult.is_fraud === false) {
      console.log(`   🟢 STATUS: APPROVED. Triggering UPI Payout of ₹${finalAmount}...`);

      await axios.post(WEBHOOK_URL, {
        user_id: user.user_id,
        trigger_type: triggerType,
        payout_amount: finalAmount
      }).catch((e) => {
        console.log('   ❌ Webhook failed: Backend container unreachable.');
        if (e.response) {
          console.log(`   ↳ Status: ${e.response.status}`);
          console.log(`   ↳ Data: ${JSON.stringify(e.response.data)}`);
        } else {
          console.log(`   ↳ Error: ${e.message}`);
        }
      });

    } else {
      const reason = mlResult.flag_reason || 'Behavioral Anomaly';

      console.log(`   🔴 STATUS: FLAGGED [${reason}]`);
      console.log(`   📁 Claim routed to Admin Queue for Review.`);

      await axios.post(FLAGGED_URL, {
        user_id: user.user_id,
        reason: reason,
        payout_amount: finalAmount
      }).catch((e) => {
        console.log('   ❌ Flagged Webhook failed.');
        if (e.response) {
          console.log(`   ↳ Status: ${e.response.status}`);
          console.log(`   ↳ Data: ${JSON.stringify(e.response.data)}`);
        } else {
          console.log(`   ↳ Error: ${e.message}`);
        }
      });

      // IMPORTANT: DO NOT call WEBHOOK_URL here
    }

  } catch (error) {
    console.error(`   ❌ CRITICAL SYSTEM ERROR: ${error.message}`);
  }
}