// src/pages/Onboarding.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEarningsDNA } from '../hooks/useEarningsDNA';
import { useAuth } from '../context/AuthContext'; // 🐛 ADDED: To get Firebase UID
import { User, MapPin, Bike, Wallet, ShieldCheck, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ZONES = {
  'Mumbai': ['Andheri', 'Bandra', 'Kurla', 'Powai'],
  'Bengaluru': ['Koramangala', 'Whitefield', 'Indiranagar', 'HSR Layout'],
  'Delhi-NCR': ['Connaught Place', 'Dwarka', 'Noida', 'Gurugram']
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth(); // 🐛 ADDED: Pulling the logged-in user
  const { result: premiumResult, loading: premiumLoading, compute } = useEarningsDNA();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', city: '', zone: '', platform: '', weeklyIncome: 4000, shift: ''
  });

  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  // Step 4: Call the ML Hook
  const handleCalculateDNA = async () => {
    if (!formData.shift) return;
    await compute(formData);
    nextStep();
  };

  // Step 5: Finalize & Transport
  const handleActivate = async () => {
    try {
      const token = localStorage.getItem('gs_token');
      
      // 🐛 FIX: Exact payload Neema's database needs
      const payload = {
        userId: user?.uid,          
        name: formData.name,        
        mobile: user?.phoneNumber,  
        zone: formData.zone,        
        platform: formData.platform,
        weeklyIncome: formData.weeklyIncome, // 🐛 ADD THIS EXACT LINE!
        premiumAmount: premiumResult.premium 
      };

      console.log("Sending to Neema's Database:", payload);

      // 🐛 FIX: Save to local storage so Dashboard renders instantly
      localStorage.setItem('gs_name', formData.name);
      localStorage.setItem('gs_zone', formData.zone);

      const BACKEND_URL = 'http://localhost:5000/api/policies'; 

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Backend failed to save user!");

      // Route the user to Neema's Dashboard!
      navigate('/dashboard'); 

    } catch (error) {
      console.error("Error activating policy:", error);
      // ⚠️ FALLBACK: Transports you to Dashboard even if API is offline
      navigate('/dashboard'); 
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
          <span className="text-orange-500 font-mono text-sm tracking-widest uppercase ml-auto">
            Step {step} of 5
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 transition-all duration-500 ease-out" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden min-h-[450px]">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: IDENTITY */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 border border-orange-500/50">
                <User className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Who are you?</h2>
              <p className="text-gray-400 text-sm mb-6">Enter your details for verification.</p>
              
              <input type="text" placeholder="Full Name (e.g. Ravi Kumar)" className="w-full bg-[#1A1A24] border border-gray-700 rounded-xl p-4 text-white focus:border-orange-500 outline-none mb-6" value={formData.name} onChange={(e) => updateForm('name', e.target.value)} />
              
              <button onClick={nextStep} disabled={formData.name.length < 3} className="w-full bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all hover:bg-orange-600">
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: LOCATION */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 border border-orange-500/50">
                <MapPin className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Operating Zone</h2>
              <p className="text-gray-400 text-sm mb-6">Used for hyper-local weather risk scoring.</p>
              
              <select className="w-full bg-[#1A1A24] border border-gray-700 rounded-xl p-4 text-white mb-4 outline-none" value={formData.city} onChange={(e) => { updateForm('city', e.target.value); updateForm('zone', ''); }}>
                <option value="">Select City...</option>
                {Object.keys(ZONES).map(city => <option key={city} value={city}>{city}</option>)}
              </select>

              {formData.city && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {ZONES[formData.city].map(z => (
                    <button key={z} onClick={() => updateForm('zone', z)} className={`p-3 rounded-xl border text-sm transition-all ${formData.zone === z ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#1A1A24] border-gray-700 text-gray-300'}`}>{z}</button>
                  ))}
                </div>
              )}
              
              <button onClick={nextStep} disabled={!formData.zone} className="w-full bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all hover:bg-orange-600">
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 3: PLATFORM */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 border border-orange-500/50">
                <Bike className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Which platform?</h2>
              
              <div className="space-y-3 mb-6 mt-4">
                {['Zomato', 'Swiggy', 'Zepto'].map(p => (
                  <button key={p} onClick={() => updateForm('platform', p)} className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all ${formData.platform === p ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#1A1A24] border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                    <span className="font-medium">{p}</span>
                    {formData.platform === p && <ShieldCheck className="w-5 h-5" />}
                  </button>
                ))}
              </div>
              
              <button onClick={nextStep} disabled={!formData.platform} className="w-full bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all hover:bg-orange-600">
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 4: EARNINGS DNA */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 border border-orange-500/50">
                <Wallet className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Earnings DNA</h2>
              
              <div className="text-center mb-6 mt-4">
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Weekly Income</div>
                <div className="text-4xl font-mono font-bold text-orange-500">₹{formData.weeklyIncome}</div>
              </div>

              <input type="range" min="1500" max="10000" step="100" value={formData.weeklyIncome} onChange={(e) => updateForm('weeklyIncome', parseInt(e.target.value))} className="w-full accent-orange-500 mb-8" />

              <div className="grid grid-cols-3 gap-2 mb-8">
                {[{id: 'morning', label: 'Morning'}, {id: 'afternoon', label: 'Afternoon'}, {id: 'evening', label: 'Evening'}].map(s => (
                  <button key={s.id} onClick={() => updateForm('shift', s.id)} className={`p-3 rounded-xl border text-sm transition-all ${formData.shift === s.id ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-[#1A1A24] border-gray-700 text-gray-300 hover:border-gray-500'}`}>{s.label}</button>
                ))}
              </div>
              
              <button onClick={handleCalculateDNA} disabled={!formData.shift || premiumLoading} className="w-full bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex justify-center items-center transition-all hover:bg-orange-600">
                {premiumLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Calculate Premium →'}
              </button>
            </motion.div>
          )}

          {/* STEP 5: COVERAGE SUMMARY */}
          {step === 5 && premiumResult && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Your Coverage</h2>
                  <p className="text-gray-400 text-sm">{formData.zone}, {formData.city}</p>
                </div>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/50 px-3 py-1 rounded-lg text-sm font-bold tracking-wider uppercase">
                  {premiumResult.tier}
                </span>
              </div>

              <div className="bg-[#1A1A24] border border-gray-700 rounded-2xl p-5 mb-6 text-center">
                <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Weekly Premium</div>
                <div className="text-5xl font-mono font-bold text-white mb-2">₹{premiumResult.premium}</div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Income Protected</span>
                  <span className="font-mono font-bold">{premiumResult.coverage}% / day</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Max Payout</span>
                  <span className="font-mono font-bold text-green-400">₹{premiumResult.maxPayout} / week</span>
                </div>
              </div>
              
              <button onClick={handleActivate} className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-orange-600 transition-colors">
                <ShieldCheck className="mr-2 w-5 h-5" /> Activate Policy
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}