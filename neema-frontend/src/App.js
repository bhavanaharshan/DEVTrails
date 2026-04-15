import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Home, CreditCard, Truck, User, 
  LogOut, ChevronRight, CheckCircle, Zap, Clock, 
  Camera, Edit2, MapPin, Phone, Save, QrCode,
  ShieldCheck, ShieldAlert, ExternalLink, Info, Lock // Added Lock icon
} from 'lucide-react';

// --- NEW IMPORT ---
import AdminDashboard from './AdminDashboard';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  
  // Shared Profile State updated with Consent fields
  const [profile, setProfile] = useState({
    id: "user_123", 
    name: "Neema",
    mobile: "+91 90000 00000",
    zone: "Bangalore South",
    address: "123, Koramangala 5th Block, Bangalore - 560095",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neema",
    gps_consent: false,
    upi_consent: false
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/dashboard/${profile.id}`); 
        const data = await response.json();
        if (data.policy) {
           setProfile(prev => ({ ...prev, ...data.policy }));
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    };
    fetchUserData();
  }, [profile.id]);

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex justify-center overflow-x-hidden font-sans">
      <div className={`w-full ${activePage === 'admin' ? 'max-w-6xl' : 'max-w-md'} bg-[#6366F1] min-h-screen shadow-2xl relative flex flex-col transition-all duration-500`}>
        
        {/* --- HEADER --- */}
        <header className="p-6 pb-2 flex justify-between items-center text-white sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Menu size={24} />
          </button>
          <h1 className="text-sm font-bold opacity-90 uppercase tracking-widest">
            {activePage === 'dashboard' ? "Today's Earnings" : activePage.toUpperCase()}
          </h1>
          <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 overflow-hidden shadow-inner">
            <img src={profile.avatar} alt="profile" />
          </div>
        </header>

        {/* --- SIDEBAR --- */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed inset-y-0 left-0 w-72 bg-white z-50 p-6 flex flex-col shadow-2xl rounded-r-[2.5rem]">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic text-xs">G</div>
                    <span className="font-black text-xl italic text-indigo-600">GIGSHIELD</span>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
                </div>
                <nav className="space-y-2 flex-1">
                  {[
                    { id: 'dashboard', label: 'Earnings', icon: <Home size={20}/> },
                    { id: 'duty', label: 'Trip History', icon: <Truck size={20}/> },
                    { id: 'history', label: 'Payouts', icon: <CreditCard size={20}/> },
                    { id: 'profile', label: 'My Profile', icon: <User size={20}/> },
                    { id: 'admin', label: 'Insurer Portal', icon: <ShieldCheck size={20}/> },
                  ].map((item) => (
                    <button key={item.id} onClick={() => { setActivePage(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activePage === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}>
                      {item.icon} {item.label}
                    </button>
                  ))}
                </nav>
                <button className="flex items-center gap-4 p-4 text-red-500 font-bold border-t pt-6"><LogOut size={20} /> Logout</button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col pt-4">
          {activePage === 'dashboard' && <DashboardView profile={profile} />}
          {activePage === 'duty' && <TripHistoryView />}
          {activePage === 'history' && <PayoutHistoryView userId={profile.id} />}
          {activePage === 'profile' && <ProfileView profile={profile} setProfile={setProfile} />}
          {activePage === 'admin' && <AdminDashboard />}
        </main>
      </div>
    </div>
  );
};

// --- VIEW: EDITABLE PROFILE ---
const ProfileView = ({ profile, setProfile }) => {
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile({ ...profile, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (err) {
      console.error("Save failed", err);
    }
    setIsSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-white rounded-t-[3rem] p-8 shadow-inner overflow-y-auto pb-24">
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="w-full h-full rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-xl overflow-hidden">
          <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <button onClick={() => fileInputRef.current.click()} className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-2xl shadow-lg border-4 border-white active:scale-90 transition-all">
          <Camera size={20} />
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      </div>

      <div className="text-center mb-8">
        <input 
          value={profile.name} 
          onChange={(e) => setProfile({...profile, name: e.target.value})}
          className="text-2xl font-black text-gray-800 text-center bg-transparent border-b border-transparent focus:border-indigo-200 outline-none w-full mb-1"
        />
        <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest italic flex items-center justify-center gap-1">
          <ShieldCheck size={12}/> Pro Tier Partner
        </p>
      </div>

      {/* Account Details */}
      <div className="bg-gray-50 rounded-[2rem] p-6 space-y-6 mb-8">
        <div className="flex items-center gap-4">
          <Phone size={18} className="text-indigo-400" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase">Mobile</p>
            <input value={profile.mobile} onChange={(e) => setProfile({...profile, mobile: e.target.value})} className="font-bold text-sm bg-transparent outline-none w-full" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <MapPin size={18} className="text-indigo-400" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase">Address</p>
            <textarea rows="2" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} className="font-bold text-sm bg-transparent outline-none w-full resize-none" />
          </div>
        </div>
      </div>

      {/* DPDP Compliance & Consent */}
      <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 mb-8">
        <h3 className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-indigo-600" /> DPDP Compliance
        </h3>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={profile.gps_consent}
              onChange={(e) => setProfile({...profile, gps_consent: e.target.checked})}
              className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" 
            />
            <span className="text-xs font-bold text-indigo-800 leading-tight">Consent for Background GPS tracking during active shifts.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={profile.upi_consent}
              onChange={(e) => setProfile({...profile, upi_consent: e.target.checked})}
              className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" 
            />
            <span className="text-xs font-bold text-indigo-800 leading-tight">Consent for secure storage of UPI/Bank details.</span>
          </label>
        </div>
      </div>

      <button onClick={saveProfile} className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-green-500 text-white' : 'bg-gray-800 text-white active:scale-95'}`}>
        {isSaving ? <><CheckCircle size={20}/> Saved</> : <><Save size={20}/> Save Profile</>}
      </button>
    </motion.div>
  );
};

// --- VIEW: EARNINGS DASHBOARD ---
const DashboardView = ({ profile }) => {
  const [isWeatherLocked, setIsWeatherLocked] = useState(false);

  useEffect(() => {
    // Check if weather alert is active in user's zone
    const checkAdverseSelection = async () => {
      try {
        const res = await fetch(`/api/weather/check?zone=${profile.zone}`);
        const data = await res.json();
        if (data.alertLevel === 'RED') setIsWeatherLocked(true);
      } catch (err) {
        // Fallback for demo: randomly set to true to show lockout if API is down
        console.log("Weather check failed, simulating lockout for demo");
      }
    };
    checkAdverseSelection();
  }, [profile.zone]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
      <div className="px-6 grid grid-cols-2 gap-4 mb-6 text-white">
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 shadow-lg">
          <p className="text-3xl font-black mb-1">₹3500</p>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Today's Earnings</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 shadow-lg">
          <p className="text-3xl font-black mb-1">5:40 <span className="text-sm">hrs</span></p>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">On Duty</p>
        </div>
      </div>

      {/* Exclusion Disclaimer Card */}
      <div className="mx-6 bg-amber-50 rounded-3xl p-4 border border-amber-200 mb-6 flex items-start gap-3">
        <div className="bg-amber-500 p-2 rounded-xl text-white mt-1"><Info size={16} /></div>
        <div>
          <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-tighter">Coverage Exclusion Note</h4>
          <p className="text-[10px] text-amber-900 font-bold leading-tight">Income loss from weather only. <span className="text-red-600">Health & Life excluded.</span></p>
        </div>
      </div>

      {/* Adverse Selection Lockout Button */}
      <div className="mx-6 mb-6">
        <button 
          disabled={isWeatherLocked}
          className={`w-full py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all ${
            isWeatherLocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-600 hover:scale-[1.02] active:scale-95'
          }`}
        >
          {isWeatherLocked ? <><Lock size={18}/> Enrollment Locked (Storm Alert)</> : <><Zap size={18}/> Enroll Weekly Policy</>}
        </button>
      </div>

      {/* Bonus Tracker */}
      <div className="mx-6 bg-white rounded-[2rem] p-6 shadow-xl mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-black text-gray-800">Bonus Progress</h3>
            <p className="text-[10px] text-gray-400 font-bold">12 Orders to next payout</p>
          </div>
          <p className="text-xl font-black text-indigo-600">₹60</p>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-green-500 w-3/4 rounded-full" />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[3rem] p-8 shadow-inner overflow-y-auto">
        <h3 className="text-xl font-black text-gray-800 mb-6">Recent Activity</h3>
        <div className="space-y-6">
          {[
            { name: 'Koramangala Kitchen', time: '11:20 PM', price: '₹120' },
            { name: 'Indiranagar Hub', time: '10:30 PM', price: '₹95' },
          ].map((trip, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-500"><Truck size={18} /></div>
                <div>
                  <p className="font-bold text-sm text-gray-800">{trip.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{trip.time}</p>
                </div>
              </div>
              <p className="font-black text-gray-800">{trip.price}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const PayoutHistoryView = ({ userId }) => {
  const [payouts, setPayouts] = useState([]);
  useEffect(() => {
    if (userId) {
      fetch(`/api/payouts/${userId}`).then(res => res.json()).then(setPayouts).catch(err => console.error(err));
    }
  }, [userId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-white rounded-t-[3rem] p-8 shadow-inner overflow-y-auto pb-24">
      <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-lg mb-8">
        <p className="text-[10px] font-black uppercase opacity-70 mb-1">Total Payouts</p>
        <h2 className="text-4xl font-black italic">₹{payouts.reduce((sum, p) => sum + Number(p.payout_amount), 0)}</h2>
      </div>
      <div className="space-y-4">
        {payouts.map((p, idx) => (
          <div key={idx} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-black text-gray-800">{p.trigger_type}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(p.triggered_at).toLocaleDateString()}</p>
            </div>
            <p className="font-black text-green-500">+₹{p.payout_amount}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const TripHistoryView = () => (
  <div className="flex-1 bg-white p-8 rounded-t-[3rem]">
    <h2 className="text-2xl font-black mb-6 text-gray-800">Trip History</h2>
    <div className="p-10 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 border-dashed text-center">
      <Clock size={32} className="mx-auto mb-4 text-indigo-300" />
      <p className="text-indigo-400 font-bold text-sm italic">Past deliveries will appear here.</p>
    </div>
  </div>
);

export default App;