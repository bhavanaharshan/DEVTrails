// src/pages/Onboarding.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useEarningsDNA } from '../hooks/useEarningsDNA';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, MapPin, Briefcase, Wallet, Loader2,
  Check, AlertTriangle, AlertCircle, ArrowLeft, ArrowRight, User, Info
} from 'lucide-react';

const ZONES = {
  'Mumbai': ['Andheri', 'Bandra', 'Kurla', 'Powai'],
  'Bengaluru': ['Koramangala', 'Whitefield', 'Indiranagar', 'HSR Layout'],
  'Delhi-NCR': ['Connaught Place', 'Dwarka', 'Noida', 'Gurugram']
};

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { result: premiumResult, loading: premiumLoading, compute } = useEarningsDNA();
  
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    name: '', city: '', zone: '', platforms: [], weeklyIncome: 4500, shift: ''
  });
  
  // DPDP Consent State
  const [consents, setConsents] = useState({ gpsTracking: false, upiStorage: false, platformData: false });
  const [activeInfo, setActiveInfo] = useState(null); // Tracks which "Info" tab is open

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);

  const availablePlatforms = ['Zomato', 'Swiggy', 'Blinkit', 'Zepto'];

  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const nextStep = () => { setErrorAlert(null); setStep(s => s + 1); };
  const prevStep = () => { setErrorAlert(null); setStep(s => s - 1); };

  const togglePlatform = (plat) => {
    setFormData(prev => {
      const isSelected = prev.platforms.includes(plat);
      const updated = isSelected ? prev.platforms.filter(p => p !== plat) : [...prev.platforms, plat];
      return { ...prev, platforms: updated };
    });
  };

  const toggleInfo = (type) => {
    setActiveInfo(activeInfo === type ? null : type);
  };

  const handleCalculateDNA = async () => {
    if (!formData.shift) return;
    await compute(formData);
    nextStep();
  };

  // MOCK API: Adverse Selection Check (Hidden Trigger: Name = "Demo Error")
  const checkAdverseSelection = async (name) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (name === "Demo Error") {
      return { lockout_active: true, reason: "IMD Red Alert forecasted within 48h. Policy purchasing is disabled to protect the pool." };
    }
    return { lockout_active: false };
  };

  const handleFinalSubmit = async () => {
    setErrorAlert(null);

    if (!consents.gpsTracking || !consents.upiStorage || !consents.platformData) {
      setErrorAlert("DPDP Act Compliance: You must accept all three legal consents to activate your policy.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const lockoutStatus = await checkAdverseSelection(formData.name);
      
      if (lockoutStatus.lockout_active) {
        setErrorAlert(lockoutStatus.reason);
        setIsSubmitting(false);
        return;
      }

      const payload = {
        userId: user?.uid || "demo_user",
        name: formData.name,
        mobile: user?.phoneNumber || "+91 00000 00000",
        zone: formData.zone,
        platforms: formData.platforms,
        weeklyIncome: Number(formData.weeklyIncome),
        premiumAmount: premiumResult.premium,
        consents: consents
      };

      localStorage.setItem('gs_name', formData.name);
      localStorage.setItem('gs_zone', formData.zone);
      localStorage.setItem('gs_platforms', JSON.stringify(formData.platforms));

      const token = localStorage.getItem('gs_token');
      try {
        const response = await fetch('http://localhost:5000/api/policy/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Backend connection failed");
      } catch (backendError) {
        console.warn("Backend not ready, proceeding with local cache.");
      }

      navigate('/dashboard');

    } catch (error) {
      console.error("Submission error:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white p-4 flex flex-col items-center justify-center">
      
      {/* Progress Bar */}
      <div className="w-full max-w-md pb-6">
        <div className="flex justify-between items-center mb-2">
          {step > 1 && (
            <button onClick={prevStep} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <span className="text-orange-500 font-mono text-sm tracking-widest uppercase ml-auto">Step {step} of 5</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 transition-all duration-500 ease-out" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </div>

      <div className="w-full max-w-md bg-[#161622] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-center relative shrink-0">
          <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4"><ShieldCheck size={150} /></div>
          <h1 className="text-2xl font-black italic tracking-tighter relative z-10">ACTIVATE SHIELD</h1>
          <p className="text-xs font-bold text-white/80 uppercase tracking-widest mt-1 relative z-10">Pro-Tier Income Protection</p>
        </div>

        {/* ERROR ALERTS */}
        <AnimatePresence>
          {errorAlert && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-500/10 border-b border-red-500/50 p-4 flex items-start gap-3 shrink-0">
              <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
              <div>
                <h3 className="font-black text-red-500 uppercase tracking-widest text-xs">Action Required</h3>
                <p className="text-xs font-bold text-red-200 mt-1">{errorAlert}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/30"><User className="w-6 h-6 text-orange-500" /></div>
                <h2 className="text-xl font-bold mb-2">Who are you?</h2>
                <p className="text-gray-400 text-xs mb-6">Enter your details for verification.</p>
                <input type="text" placeholder="Full Name (e.g. Ravi Kumar)" className="w-full bg-[#0F0F1A] border border-gray-800 rounded-xl p-4 text-white focus:border-orange-500 outline-none mb-auto" value={formData.name} onChange={(e) => updateForm('name', e.target.value)} />
                <button onClick={nextStep} disabled={formData.name.length < 3} className="w-full mt-6 bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-orange-600">Continue <ArrowRight className="ml-2 w-5 h-5" /></button>
              </motion.div>
            )}

            {/* STEP 2: LOCATION */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/30"><MapPin className="w-6 h-6 text-orange-500" /></div>
                <h2 className="text-xl font-bold mb-2">Operating Zone</h2>
                <p className="text-gray-400 text-xs mb-6">Used for hyper-local weather risk scoring.</p>
                <select className="w-full bg-[#0F0F1A] border border-gray-800 rounded-xl p-4 text-white mb-4 outline-none" value={formData.city} onChange={(e) => { updateForm('city', e.target.value); updateForm('zone', ''); }}>
                  <option value="">Select City...</option>
                  {Object.keys(ZONES).map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                {formData.city && (
                  <div className="grid grid-cols-2 gap-3 mb-auto">
                    {ZONES[formData.city].map(z => (
                      <button key={z} onClick={() => updateForm('zone', z)} className={`p-3 rounded-xl border text-sm transition-all ${formData.zone === z ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#0F0F1A] border-gray-800 text-gray-300 hover:border-gray-600'}`}>{z}</button>
                    ))}
                  </div>
                )}
                <button onClick={nextStep} disabled={!formData.zone} className="w-full mt-6 bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-orange-600">Continue <ArrowRight className="ml-2 w-5 h-5" /></button>
              </motion.div>
            )}

            {/* STEP 3: PLATFORMS */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/30"><Briefcase className="w-6 h-6 text-orange-500" /></div>
                <h2 className="text-xl font-bold mb-2">Active Platforms</h2>
                <p className="text-gray-400 text-xs mb-4">Select all platforms you deliver for.</p>
                <div className="space-y-3 mb-auto mt-2">
                  {availablePlatforms.map(p => {
                    const isSelected = formData.platforms.includes(p);
                    return (
                      <button key={p} onClick={() => togglePlatform(p)} className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${isSelected ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#0F0F1A] border-gray-800 text-gray-300 hover:border-gray-600'}`}>
                        <span className="font-medium">{p}</span>
                        {isSelected && <ShieldCheck className="w-5 h-5" />}
                      </button>
                    );
                  })}
                </div>
                <button onClick={nextStep} disabled={formData.platforms.length === 0} className="w-full mt-6 bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-orange-600">Continue <ArrowRight className="ml-2 w-5 h-5" /></button>
              </motion.div>
            )}

            {/* STEP 4: EARNINGS DNA (Slider Restored) */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 border border-orange-500/30"><Wallet className="w-6 h-6 text-orange-500" /></div>
                <h2 className="text-xl font-bold mb-2">Earnings DNA</h2>
                
                <div className="text-center mb-6 mt-4">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Declared Weekly Income</div>
                  <div className="text-4xl font-mono font-bold text-orange-500 mb-6">₹{formData.weeklyIncome}</div>
                  
                  {/* Slider replaces the manual input */}
                  <input type="range" min="1500" max="10000" step="100" value={formData.weeklyIncome} onChange={(e) => updateForm('weeklyIncome', parseInt(e.target.value))} className="w-full accent-orange-500 mb-2 cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold px-1">
                    <span>₹1.5k</span><span>₹10k</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-auto">
                  {[{id: 'morning', label: 'Morning'}, {id: 'afternoon', label: 'Afternoon'}, {id: 'evening', label: 'Evening'}].map(s => (
                    <button key={s.id} onClick={() => updateForm('shift', s.id)} className={`p-3 rounded-xl border text-xs font-bold transition-all ${formData.shift === s.id ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#0F0F1A] border-gray-800 text-gray-300 hover:border-gray-600'}`}>{s.label}</button>
                  ))}
                </div>
                <button onClick={handleCalculateDNA} disabled={!formData.shift || premiumLoading} className="w-full mt-6 bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-orange-600">
                  {premiumLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Calculate Premium →'}
                </button>
              </motion.div>
            )}

            {/* STEP 5: DPDP CONSENTS & ACTIVATION (With Tooltips) */}
            {step === 5 && premiumResult && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-bold mb-0.5">Your Coverage</h2>
                    <p className="text-gray-400 text-xs">{formData.zone}</p>
                  </div>
                  <span className="bg-orange-500/10 text-orange-500 border border-orange-500/30 px-2 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase">{premiumResult.tier}</span>
                </div>

                <div className="bg-[#0F0F1A] border border-gray-800 rounded-2xl p-4 mb-6 text-center">
                  <div className="text-gray-500 text-[10px] mb-1 font-black uppercase tracking-widest">Calculated Weekly Premium</div>
                  <div className="text-3xl font-mono font-black text-white">₹{premiumResult.premium}</div>
                </div>

                {/* DPDP Consents with Info Drops */}
                <div className="space-y-3 mb-auto">
                  
                  {/* GPS Consent */}
                  <div className="bg-[#0F0F1A] border border-gray-800 rounded-xl overflow-hidden transition-all">
                    <div className="flex items-center justify-between p-3">
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${consents.gpsTracking ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`}>
                          {consents.gpsTracking && <Check size={12} className="text-white font-bold" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={consents.gpsTracking} onChange={() => setConsents({...consents, gpsTracking: !consents.gpsTracking})} />
                        <p className="text-xs text-gray-300 leading-tight">Continuous <span className="text-white font-bold">GPS tracking</span></p>
                      </label>
                      <button onClick={() => toggleInfo('gps')} className="p-1 text-gray-400 hover:text-white"><Info size={16} /></button>
                    </div>
                    <AnimatePresence>
                      {activeInfo === 'gps' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-3">
                          <p className="text-[10px] text-gray-400 bg-gray-900 p-2 rounded-lg border border-gray-800">
                            <strong>Why we need this:</strong> Under the DPDP Act, we must verify you are physically inside the disaster zone (e.g. {formData.zone}) when the weather hits to trigger your automated payout fairly.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* UPI Consent */}
                  <div className="bg-[#0F0F1A] border border-gray-800 rounded-xl overflow-hidden transition-all">
                    <div className="flex items-center justify-between p-3">
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${consents.upiStorage ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`}>
                          {consents.upiStorage && <Check size={12} className="text-white font-bold" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={consents.upiStorage} onChange={() => setConsents({...consents, upiStorage: !consents.upiStorage})} />
                        <p className="text-xs text-gray-300 leading-tight"><span className="text-white font-bold">KYC & UPI</span> storage</p>
                      </label>
                      <button onClick={() => toggleInfo('upi')} className="p-1 text-gray-400 hover:text-white"><Info size={16} /></button>
                    </div>
                    <AnimatePresence>
                      {activeInfo === 'upi' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-3">
                          <p className="text-[10px] text-gray-400 bg-gray-900 p-2 rounded-lg border border-gray-800">
                            <strong>Why we need this:</strong> To ensure zero-touch claims. We securely encrypt and store your UPI ID so we can automatically deposit your money via Razorpay the second a claim triggers.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Platform Data Consent */}
                  <div className="bg-[#0F0F1A] border border-gray-800 rounded-xl overflow-hidden transition-all">
                    <div className="flex items-center justify-between p-3">
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${consents.platformData ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`}>
                          {consents.platformData && <Check size={12} className="text-white font-bold" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={consents.platformData} onChange={() => setConsents({...consents, platformData: !consents.platformData})} />
                        <p className="text-xs text-gray-300 leading-tight">Share <span className="text-white font-bold">Platform Activity data</span></p>
                      </label>
                      <button onClick={() => toggleInfo('platform')} className="p-1 text-gray-400 hover:text-white"><Info size={16} /></button>
                    </div>
                    <AnimatePresence>
                      {activeInfo === 'platform' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-3 pb-3">
                          <p className="text-[10px] text-gray-400 bg-gray-900 p-2 rounded-lg border border-gray-800">
                            <strong>Why we need this:</strong> We sync with {formData.platforms.join(' and ')} to confirm you were actively delivering. This protects the insurance pool from fraudulent claims.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                <div className="bg-gray-900/50 p-3 rounded-xl flex gap-2 items-start mb-4 mt-2 border border-gray-800">
                  <AlertTriangle size={14} className="text-gray-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-snug">Covers income loss from weather only. Health, life, and vehicle damages are excluded.</p>
                </div>
                
                <button onClick={handleFinalSubmit} disabled={isSubmitting} className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${(!consents.gpsTracking || !consents.upiStorage || !consents.platformData) ? 'bg-[#0F0F1A] text-gray-600 border border-gray-800 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}>
                  {isSubmitting ? 'Securing...' : 'Activate Policy & Pay'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}