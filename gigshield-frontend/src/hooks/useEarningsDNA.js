// src/hooks/useEarningsDNA.js
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useEarningsDNA() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Grab the real Firebase user

  const compute = useCallback(async (dna) => {
    setLoading(true);
    
    try {
      // ⚠️ UPDATED: Now pointing to Bhavana's live Ngrok tunnel!
      const ML_API_URL = 'https://supraorbital-hyperrhythmical-naoma.ngrok-free.dev/api/v1/premium/calculate'; 
      
      // 1. Translate our frontend state into Bhavana's exact required JSON
      const payload = {
        user_id: user?.uid || "rider_001", // Use actual Firebase UID
        zone: dna.zone.toLowerCase().replace(/\s+/g, '_'), // e.g. "Connaught Place" -> "connaught_place"
        city: dna.city.toLowerCase(),
        platform: dna.platform.toLowerCase(),
        weekly_income: dna.weeklyIncome,
        shift_window: dna.shift,
        tier_preference: "standard" // Default baseline calculation
      };

      const response = await fetch(ML_API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // ⚠️ CRITICAL: Bypasses the Ngrok free-tier warning screen
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`ML API Failed with status: ${response.status}`);
      }
      
      const data = await response.json();

      // 2. Translate Bhavana's response back into our UI variables
      setResult({ 
        premium: data.premium_amount, 
        tier: data.tier, 
        coverage: data.coverage_percentage, 
        maxPayout: data.max_weekly_payout 
      });

    } catch (error) {
      console.warn("⚠️ ML API not reachable. Falling back to local calculation.", error);
      
      // --- LOCAL FALLBACK (So the demo never breaks) ---
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      const base = dna.weeklyIncome * 0.0175;
      const shiftFactor = { morning: 0.9, afternoon: 1.0, evening: 1.2 };
      const platformFactor = { Zomato: 1.05, Swiggy: 1.0, Both: 1.1 };
      
      const adjusted = base * (shiftFactor[dna.shift] || 1.0) * (platformFactor[dna.platform] || 1.0);
      const premium = Math.min(Math.max(Math.round(adjusted), 29), 99);

      let tier, coverage, maxPayout;
      if (premium <= 49) { tier = 'Basic'; coverage = 60; maxPayout = 720; }
      else if (premium <= 79) { tier = 'Standard'; coverage = 70; maxPayout = 1400; }
      else { tier = 'Full Shield'; coverage = 80; maxPayout = 2400; }

      setResult({ premium, tier, coverage, maxPayout });
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { result, loading, compute };
}