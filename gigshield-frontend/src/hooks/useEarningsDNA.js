// src/hooks/useEarningsDNA.js
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useEarningsDNA() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const compute = useCallback(async (dna) => {
    setLoading(true);
    
    try {
      // ✅ FIX: Pointing to your local ML Engine port
      const ML_API_URL = 'http://localhost:8000/api/v1/premium/calculate'; 
      
      const payload = {
        user_id: user?.uid || "rider_001",
        zone: dna.zone || "Sreekariyam",
        city: dna.city?.toLowerCase() || "thiruvananthapuram",
        // Platform is an array in Onboarding, Priya's API expects a single string
        platform: Array.isArray(dna.platforms) ? dna.platforms[0].toLowerCase() : "zomato",
        weekly_income: Number(dna.weeklyIncome),
        shift_window: dna.shift || "evening",
        tier_preference: "standard"
      };

      console.log("🚀 Calculating DNA with Payload:", payload);

      const response = await fetch(ML_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`ML API Failed: ${response.status}`);
      
      const data = await response.json();

      setResult({ 
        premium: data.premium_amount, 
        tier: data.tier, 
        coverage: data.coverage_percentage, 
        maxPayout: data.max_weekly_payout 
      });

    } catch (error) {
      console.error("❌ ML Connection failed. Ensure Uvicorn is running on Port 8000.", error);
      // Removed local fallback as requested
      setResult(null);
      throw error; 
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { result, loading, compute };
}