import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Briefcase,
  Wallet,
  Loader2,
  Check,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  User,
  Info,
  Navigation,
  ShieldAlert,
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Canonical keys must match backend + ML
const CITY_ZONE_MAP = {
  thiruvananthapuram: {
    label: 'Thiruvananthapuram',
    zones: [
      { value: 'kazhakkoottam', label: 'Kazhakkoottam' },
      { value: 'palayam', label: 'Palayam' },
      { value: 'kowdiar', label: 'Kowdiar' },
      { value: 'sreekariyam', label: 'Sreekariyam' },
    ],
  },
  mumbai: {
    label: 'Mumbai',
    zones: [
      { value: 'andheri', label: 'Andheri' },
      { value: 'kurla', label: 'Kurla' },
      { value: 'powai', label: 'Powai' },
    ],
  },
  bengaluru: {
    label: 'Bengaluru',
    zones: [
      { value: 'koramangala', label: 'Koramangala' },
      { value: 'whitefield', label: 'Whitefield' },
      { value: 'indiranagar', label: 'Indiranagar' },
      { value: 'hsr_layout', label: 'HSR Layout' },
    ],
  },
  delhi: {
    label: 'Delhi',
    zones: [
      { value: 'central_delhi', label: 'Central Delhi' },
      { value: 'south_delhi', label: 'South Delhi' },
    ],
  },
  lucknow: {
    label: 'Lucknow',
    zones: [{ value: 'central_lucknow', label: 'Central Lucknow' }],
  },
  chennai: {
    label: 'Chennai',
    zones: [{ value: 'central_chennai', label: 'Central Chennai' }],
  },
};

const AVAILABLE_PLATFORMS = ['Zomato', 'Swiggy', 'Blinkit', 'Zepto'];

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });
}

function getPremiumEstimate(weeklyIncome, city, platformsCount) {
  const cityBase = {
    mumbai: 0.6,
    delhi: 0.55,
    chennai: 0.5,
    lucknow: 0.45,
    bengaluru: 0.5,
    thiruvananthapuram: 0.4,
  };

  const incomeFactor = Math.min(Math.max(weeklyIncome / 6000, 0.5), 1.8);
  const multiFactor = platformsCount >= 2 ? 1.08 : 1.0;
  const baseRisk = cityBase[city] || 0.5;

  const premium = Math.max(
    39,
    Math.round(((weeklyIncome * 0.0095) * (0.8 + baseRisk * 0.4) * incomeFactor * multiFactor) / 1)
  );

  let tier = 'STANDARD';
  if (premium >= 80) tier = 'HIGH';
  else if (premium <= 50) tier = 'BASIC';

  return { premium, tier };
}

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: localStorage.getItem('gs_name') || '',
    city: localStorage.getItem('gs_city') || '',
    zone: localStorage.getItem('gs_zone') || '',
    platforms: JSON.parse(localStorage.getItem('gs_platforms') || '[]'),
    weeklyIncome: Number(localStorage.getItem('gs_weekly_income') || 4500),
    shift: localStorage.getItem('gs_shift') || '',
  });

  const [consents, setConsents] = useState({
    gpsTracking: false,
    upiStorage: false,
    platformData: false,
  });

  const [activeInfo, setActiveInfo] = useState(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [premiumResult, setPremiumResult] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);
  const [operationalAlert, setOperationalAlert] = useState(null);
  const [locationText, setLocationText] = useState('');

  const cityOptions = useMemo(() => Object.entries(CITY_ZONE_MAP), []);
  const currentZones = useMemo(() => {
    return formData.city ? CITY_ZONE_MAP[formData.city]?.zones || [] : [];
  }, [formData.city]);

  const updateForm = (key, value) =>
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));

  const nextStep = () => {
    setErrorAlert(null);
    setStep((s) => Math.min(s + 1, 5));
  };

  const prevStep = () => {
    setErrorAlert(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const togglePlatform = (platform) => {
    setFormData((prev) => {
      const selected = prev.platforms.includes(platform);
      return {
        ...prev,
        platforms: selected
          ? prev.platforms.filter((p) => p !== platform)
          : [...prev.platforms, platform],
      };
    });
  };

  const toggleInfo = (type) => {
    setActiveInfo((prev) => (prev === type ? null : type));
  };

  const handleCalculateDNA = async () => {
    if (!formData.shift) return;

    setPremiumLoading(true);
    setErrorAlert(null);

    try {
      // Simulated clean premium calculation for UI continuity
      const result = getPremiumEstimate(
        Number(formData.weeklyIncome),
        formData.city,
        formData.platforms.length
      );

      setPremiumResult(result);
      nextStep();
    } catch (err) {
      setErrorAlert('Unable to calculate premium right now.');
    } finally {
      setPremiumLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setErrorAlert(null);
    setOperationalAlert(null);

    if (!consents.gpsTracking || !consents.upiStorage || !consents.platformData) {
      setErrorAlert(
        'DPDP compliance: you must accept all 3 consents to activate your policy.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 1) LIVE DEVICE GPS (important: real location, not zone coordinates)
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLocationText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);

      // 2) FRAUD-ONLY ZERO TRUST CHECK
      const verifyResp = await fetch(`${BACKEND_URL}/api/security/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid || 'demo_user',
          name: formData.name,
          mobile: user?.phoneNumber || null,
          city: formData.city,
          zone: formData.zone,
          lat,
          lng,
          daysWorked: formData.platforms.length >= 2 ? 120 : 90,
          platformMode: formData.platforms.length >= 2 ? 'multi' : 'single',
        }),
      });

      const verifyData = await verifyResp.json();

      // If fraud / spoofing => RED LOCKOUT path
      if (!verifyResp.ok || verifyData.is_locked) {
        setErrorAlert(
          verifyData.reason ||
            'Security Lockout: suspicious location mismatch detected.'
        );
        setIsSubmitting(false);
        return;
      }

      // 3) Save/update user profile in backend
      await fetch(`${BACKEND_URL}/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.uid || 'demo_user',
          name: formData.name,
          mobile: user?.phoneNumber || null,
          city: formData.city,
          zone: formData.zone,
          lat,
          lng,
          daysWorked: formData.platforms.length >= 2 ? 120 : 90,
          platformMode: formData.platforms.length >= 2 ? 'multi' : 'single',
        }),
      });

      // 4) WEATHER / OPS RISK (warning only, never lockout)
      try {
        const riskResp = await fetch(`${BACKEND_URL}/api/risk/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: formData.city }),
        });

        const riskData = await riskResp.json();

        if (riskData?.operational_alert) {
          setOperationalAlert(riskData);
          localStorage.setItem('gs_operational_alert', JSON.stringify(riskData));
        } else {
          localStorage.removeItem('gs_operational_alert');
        }
      } catch {
        // silent fallback
      }

      // 5) Save local cache (including lat/lng for dashboard security checks)
      localStorage.setItem('gs_name', formData.name);
      localStorage.setItem('gs_city', formData.city);
      localStorage.setItem('gs_zone', formData.zone);
      localStorage.setItem('gs_platforms', JSON.stringify(formData.platforms));
      localStorage.setItem('gs_weekly_income', String(formData.weeklyIncome));
      localStorage.setItem('gs_shift', formData.shift);
      localStorage.setItem('gs_lat', String(lat));
      localStorage.setItem('gs_lng', String(lng));
      localStorage.setItem('gs_days_worked', String(formData.platforms.length >= 2 ? 120 : 90));
      localStorage.setItem('gs_platform_mode', formData.platforms.length >= 2 ? 'multi' : 'single');

      // 6) Go to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Submission error:', error);
      setErrorAlert(
        error?.message || 'Unable to complete secure activation. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white p-4 flex flex-col items-center justify-center">
      {/* Progress Bar */}
      <div className="w-full max-w-md pb-6">
        <div className="flex justify-between items-center mb-2">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div />
          )}

          <span className="text-orange-500 font-mono text-sm tracking-widest uppercase ml-auto">
            Step {step} of 5
          </span>
        </div>

        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-md bg-[#161622] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col min-h-[560px]">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-center relative shrink-0">
          <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4">
            <ShieldCheck size={150} />
          </div>

          <h1 className="text-2xl font-black italic tracking-tighter relative z-10">
            ACTIVATE SHIELD
          </h1>
          <p className="text-xs font-bold text-white/80 uppercase tracking-widest mt-1 relative z-10">
            Pro-Tier Income Protection
          </p>
        </div>

        {/* ERROR ALERTS */}
        <AnimatePresence>
          {errorAlert && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border-b border-red-500/50 p-4 flex items-start gap-3 shrink-0"
            >
              <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
              <div>
                <h3 className="font-black text-red-500 uppercase tracking-widest text-xs">
                  Security Lockout
                </h3>
                <p className="text-xs font-bold text-red-200 mt-1">{errorAlert}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Operational warning (not lockout) */}
        <AnimatePresence>
          {operationalAlert?.operational_alert && !errorAlert && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-yellow-500/10 border-b border-yellow-500/30 p-4 flex items-start gap-3 shrink-0"
            >
              <AlertTriangle
                className="text-yellow-400 mt-0.5 shrink-0"
                size={20}
              />
              <div>
                <h3 className="font-black text-yellow-300 uppercase tracking-widest text-xs">
                  High Operational Risk
                </h3>
                <p className="text-xs font-bold text-yellow-100 mt-1">
                  {operationalAlert.reason ||
                    'Zone conditions are elevated, but activation remains allowed.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/30">
                  <User className="w-6 h-6 text-orange-500" />
                </div>

                <h2 className="text-xl font-bold mb-2">Who are you?</h2>
                <p className="text-gray-400 text-xs mb-6">
                  Enter your details for secure activation.
                </p>

                <input
                  type="text"
                  placeholder="Full Name (e.g. Ravi Kumar)"
                  className="w-full bg-[#0F0F1A] border border-gray-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none mb-auto"
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                />

                <button
                  onClick={nextStep}
                  disabled={formData.name.trim().length < 3}
                  className="w-full mt-6 bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-orange-600"
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: LOCATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/30">
                  <MapPin className="w-6 h-6 text-orange-500" />
                </div>

                <h2 className="text-xl font-bold mb-2">Operating Zone</h2>
                <p className="text-gray-400 text-xs mb-6">
                  This selected zone must match your live device location.
                </p>

                <select
                  className="w-full bg-[#0F0F1A] border border-gray-800 rounded-xl p-4 text-white mb-4 outline-none"
                  value={formData.city}
                  onChange={(e) => {
                    updateForm('city', e.target.value);
                    updateForm('zone', '');
                  }}
                >
                  <option value="">Select City...</option>
                  {cityOptions.map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>

                {formData.city && (
                  <div className="grid grid-cols-2 gap-3 mb-auto">
                    {currentZones.map((z) => (
                      <button
                        key={z.value}
                        onClick={() => updateForm('zone', z.value)}
                        className={`p-3 rounded-xl border text-sm transition-all ${
                          formData.zone === z.value
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                            : 'bg-[#0F0F1A] border-gray-800 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        {z.label}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={nextStep}
                  disabled={!formData.zone}
                  className="w-full mt-6 bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-orange-600"
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* STEP 3: PLATFORMS */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/30">
                  <Briefcase className="w-6 h-6 text-orange-500" />
                </div>

                <h2 className="text-xl font-bold mb-2">Active Platforms</h2>
                <p className="text-gray-400 text-xs mb-4">
                  Select all platforms you deliver for.
                </p>

                <div className="space-y-3 mb-auto mt-2">
                  {AVAILABLE_PLATFORMS.map((p) => {
                    const isSelected = formData.platforms.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                            : 'bg-[#0F0F1A] border-gray-800 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <span className="font-medium">{p}</span>
                        {isSelected && <ShieldCheck className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={nextStep}
                  disabled={formData.platforms.length === 0}
                  className="w-full mt-6 bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-orange-600"
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* STEP 4: EARNINGS DNA */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/30">
                  <Wallet className="w-6 h-6 text-orange-500" />
                </div>

                <h2 className="text-xl font-bold mb-2">Earnings DNA</h2>

                <div className="text-center mb-6 mt-4">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Declared Weekly Income
                  </div>
                  <div className="text-4xl font-mono font-bold text-orange-500 mb-6">
                    ₹{formData.weeklyIncome}
                  </div>

                  <input
                    type="range"
                    min="1500"
                    max="10000"
                    step="100"
                    value={formData.weeklyIncome}
                    onChange={(e) =>
                      updateForm('weeklyIncome', parseInt(e.target.value, 10))
                    }
                    className="w-full accent-orange-500 mb-2 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-gray-500 font-bold px-1">
                    <span>₹1.5k</span>
                    <span>₹10k</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-auto">
                  {[
                    { id: 'morning', label: 'Morning' },
                    { id: 'afternoon', label: 'Afternoon' },
                    { id: 'evening', label: 'Evening' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => updateForm('shift', s.id)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.shift === s.id
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-[#0F0F1A] border-gray-800 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCalculateDNA}
                  disabled={!formData.shift || premiumLoading}
                  className="w-full mt-6 bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-orange-600"
                >
                  {premiumLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Calculate Premium →'
                  )}
                </button>
              </motion.div>
            )}

            {/* STEP 5: CONSENTS + ACTIVATE */}
            {step === 5 && premiumResult && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-bold mb-0.5">Your Coverage</h2>
                    <p className="text-gray-400 text-xs">
                      {CITY_ZONE_MAP[formData.city]?.zones.find(
                        (z) => z.value === formData.zone
                      )?.label || formData.zone}
                    </p>
                  </div>

                  <span className="bg-orange-500/10 text-orange-500 border border-orange-500/30 px-2 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase">
                    {premiumResult.tier}
                  </span>
                </div>

                <div className="bg-[#0F0F1A] border border-gray-800 rounded-2xl p-4 mb-4 text-center">
                  <div className="text-gray-500 text-[10px] mb-1 font-black uppercase tracking-widest">
                    Calculated Weekly Premium
                  </div>
                  <div className="text-3xl font-mono font-black text-white">
                    ₹{premiumResult.premium}
                  </div>
                </div>

                {locationText && (
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 mb-4 flex gap-2 items-start">
                    <Navigation size={14} className="text-cyan-300 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-cyan-300">
                        Live GPS
                      </p>
                      <p className="text-[10px] text-cyan-100">{locationText}</p>
                    </div>
                  </div>
                )}

                {/* DPDP Consents */}
                <div className="space-y-3 mb-auto">
                  {/* GPS */}
                  <ConsentCard
                    checked={consents.gpsTracking}
                    onChange={() =>
                      setConsents((prev) => ({
                        ...prev,
                        gpsTracking: !prev.gpsTracking,
                      }))
                    }
                    onInfo={() => toggleInfo('gps')}
                    label={
                      <>
                        Continuous <span className="text-white font-bold">GPS tracking</span>
                      </>
                    }
                    open={activeInfo === 'gps'}
                    infoText={`We use live GPS only to verify you are actually inside your declared operating zone when protection is active. This controls fraud detection, not weather lockout.`}
                  />

                  {/* UPI */}
                  <ConsentCard
                    checked={consents.upiStorage}
                    onChange={() =>
                      setConsents((prev) => ({
                        ...prev,
                        upiStorage: !prev.upiStorage,
                      }))
                    }
                    onInfo={() => toggleInfo('upi')}
                    label={
                      <>
                        <span className="text-white font-bold">KYC & UPI</span> storage
                      </>
                    }
                    open={activeInfo === 'upi'}
                    infoText="Your payout details are securely stored so claims can be processed automatically when eligible."
                  />

                  {/* Platform */}
                  <ConsentCard
                    checked={consents.platformData}
                    onChange={() =>
                      setConsents((prev) => ({
                        ...prev,
                        platformData: !prev.platformData,
                      }))
                    }
                    onInfo={() => toggleInfo('platform')}
                    label={
                      <>
                        Share <span className="text-white font-bold">Platform Activity data</span>
                      </>
                    }
                    open={activeInfo === 'platform'}
                    infoText={`We use activity signals from ${
                      formData.platforms.join(', ') || 'your selected platforms'
                    } to reduce fraudulent claim abuse.`}
                  />
                </div>

                <div className="bg-gray-900/50 p-3 rounded-xl flex gap-2 items-start mb-4 mt-2 border border-gray-800">
                  <AlertTriangle
                    size={14}
                    className="text-gray-500 shrink-0 mt-0.5"
                  />
                  <p className="text-[10px] text-gray-400 leading-snug">
                    Weather / AQI / congestion may increase operational risk and claims,
                    but they do <span className="font-bold text-white">not</span> trigger
                    a red lockout. Red lockout happens only for suspicious location fraud.
                  </p>
                </div>

                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    !consents.gpsTracking || !consents.upiStorage || !consents.platformData
                      ? 'bg-[#0F0F1A] text-gray-600 border border-gray-800 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Securing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Activate Policy & Pay
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ConsentCard({ checked, onChange, onInfo, label, open, infoText }) {
  return (
    <div className="bg-[#0F0F1A] border border-gray-800 rounded-xl overflow-hidden transition-all">
      <div className="flex items-center justify-between p-3">
        <label className="flex items-start gap-3 cursor-pointer flex-1">
          <div
            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
              checked ? 'bg-orange-500 border-orange-500' : 'border-gray-600'
            }`}
          >
            {checked && <Check size={12} className="text-white font-bold" />}
          </div>

          <input
            type="checkbox"
            className="hidden"
            checked={checked}
            onChange={onChange}
          />

          <p className="text-xs text-gray-300 leading-tight">{label}</p>
        </label>

        <button onClick={onInfo} className="p-1 text-gray-400 hover:text-white">
          <Info size={16} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3"
          >
            <p className="text-[10px] text-gray-400 bg-gray-900 p-2 rounded-lg border border-gray-800">
              {infoText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}