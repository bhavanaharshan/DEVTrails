// src/hooks/useEarningsDNA.js
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const ML_BASE_URL = import.meta.env.VITE_ML_URL || 'http://localhost:8000';

export function useEarningsDNA() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const { user }              = useAuth();

  const compute = useCallback(async (dna) => {
    setLoading(true);

    try {
      const payload = {
        user_id:          user?.uid || 'rider_001',
        zone:             dna.zone  || 'sreekariyam',
        city:             (dna.city || 'thiruvananthapuram').toLowerCase(),
        // Frontend passes an array; ML engine expects a single string
        platform:         Array.isArray(dna.platforms)
                            ? dna.platforms[0].toLowerCase()
                            : (dna.platforms || 'zomato').toLowerCase(),
        weekly_income:    Number(dna.weeklyIncome),
        shift_window:     dna.shift || 'evening',
        tier_preference:  'standard',
      };

      console.log('🚀 useEarningsDNA payload:', payload);

      const response = await fetch(`${ML_BASE_URL}/api/v1/premium/calculate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ML API ${response.status}: ${errText}`);
      }

      const data = await response.json();

      setResult({
        premium:    data.premium_amount,
        tier:       data.tier,
        coverage:   data.coverage_percentage,
        maxPayout:  data.max_weekly_payout,
      });

    } catch (error) {
      console.error('❌ useEarningsDNA failed:', error.message);
      setResult(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { result, loading, compute };
}
