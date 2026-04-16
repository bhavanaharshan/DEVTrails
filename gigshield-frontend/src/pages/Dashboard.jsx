// src/pages/Dashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; 
import { io } from 'socket.io-client'; 
import { 
  Menu, X, Home, CreditCard, Truck, User, 
  LogOut, CheckCircle, Zap, Clock, Camera, Edit2, 
  MapPin, Phone, Save, QrCode, ShieldCheck, WifiOff, AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  
  // Offline SOS State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [profile, setProfile] = useState({
    id: user?.uid || "demo_user", 
    name: "Delivery Partner",
    mobile: user?.phoneNumber || "+91 00000 00000",
    zone: "Pending Zone",
    address: "Update your address in profile",
    platforms: [], // Now an array
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || "demo"}`
  });

  // Hydrate Data & Offline Listeners
  useEffect(() => {
    // 1. Offline SOS Listeners
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // 2. Fetch User Data
    const fetchUserData = async () => {
      // Pull instant local data first
      const savedZone = localStorage.getItem('gs_zone');
      const savedName = localStorage.getItem('gs_name');
      const savedPlatforms = localStorage.getItem('gs_platforms');
      
      if (savedZone) {
        setProfile(prev => ({ 
          ...prev, 
          zone: savedZone, 
          name: savedName || prev.name,
          platforms: savedPlatforms ? JSON.parse(savedPlatforms) : ["Platform"]
        }));
      }

      // Sync with backend
      if (!user?.uid) return;
      try {
        const response = await fetch(`http://localhost:5000/api/dashboard/${user.uid}`); 
        if(response.ok) {
          const data = await response.json();
          setProfile(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.log("Using cached local data.");
      }
    };
    
    fetchUserData();

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  const Navigation = () => (
    <>
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black italic text-lg">G</div>
          <span className="font-black text-2xl italic text-white tracking-tight">GIG<span className="text-orange-500">SHIELD</span></span>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 lg:hidden"><X size={24} /></button>
      </div>
      <nav className="space-y-2 flex-1">
        {[{ id: 'dashboard', label: 'Earnings', icon: <Home size={20}/> },
          { id: 'duty', label: 'Trip History', icon: <Truck size={20}/> },
          { id: 'history', label: 'Payouts', icon: <CreditCard size={20}/> },
          { id: 'profile', label: 'My Profile', icon: <User size={20}/> }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => { setActivePage(item.id); setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activePage === item.id ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen bg-[#0F0F1A] text-white font-sans overflow-hidden">
      
      {/* Offline SOS Banner (VC X-Factor) */}
      <AnimatePresence>
        {isOffline && (
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} className="fixed top-0 left-0 w-full bg-red-600 text-white p-3 z-[100] flex justify-center items-center gap-4 shadow-2xl">
            <WifiOff size={20} />
            <span className="font-bold text-sm tracking-wide">Network Offline. SOS Fallback System Active.</span>
            <a href={`sms:+1234567890?body=SOS-CLAIM-${profile.id}-ZONE-${profile.zone}`} className="bg-white text-red-600 px-4 py-1 rounded-full font-black text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors">
              Send SMS Claim
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`fixed inset-0 bg-black/80 z-40 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#161622] border-r border-white/5 p-6 flex flex-col transform transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Navigation />
      </aside>

      <div className={`flex-1 flex flex-col h-screen overflow-y-auto w-full relative ${isOffline ? 'mt-12' : ''}`}>
        <header className="p-4 md:p-6 lg:px-10 flex justify-between items-center sticky top-0 z-30 bg-[#0F0F1A]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-full lg:hidden"><Menu size={24} /></button>
            <h1 className="text-sm md:text-lg font-black uppercase tracking-widest text-orange-500">
              {activePage === 'dashboard' ? "Today's Earnings" : activePage}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-white">{profile.name}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{profile.zone}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1A1A24] border-2 border-white/10 overflow-hidden"><img src={profile.avatar} alt="profile" className="w-full h-full object-cover" /></div>
          </div>
        </header>

        <main className="flex-1 w-full flex flex-col">
          {activePage === 'dashboard' && <DashboardView profile={profile} />}
          {activePage === 'duty' && <TripHistoryView />}
          {activePage === 'history' && <PayoutHistoryView userId={profile.id} />}
          {activePage === 'profile' && <ProfileView profile={profile} setProfile={setProfile} />}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// DASHBOARD VIEW 
// ---------------------------------------------------------
const DashboardView = ({ profile }) => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    if (profile?.zone && profile.zone !== "Pending Zone") {
      socket.emit('join-zone', profile.zone);
    } else {
      socket.emit('join-zone', "Kurla"); 
    }

    socket.on('claim-notification', (data) => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 6000);
    });

    return () => socket.disconnect();
  }, [profile?.zone]);

  const fireWeatherTrigger = async () => {
    setIsTriggering(true);
    try {
      const payload = { 
        user_id: profile.id, 
        trigger_type: "severe_weather", 
        payoutAmount: 350,
        zone: profile.zone !== "Pending Zone" ? profile.zone : "Kurla" 
      };
      
      const response = await fetch('http://localhost:5000/api/claims/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Trigger failed");
    } catch (error) {
      console.error(error);
      alert("Database trigger failed! Ensure backend is running.");
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-10 flex flex-col gap-6">
      
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-green-500 text-white p-6 md:p-8 rounded-3xl shadow-2xl z-50 border-4 border-green-400">
            <div className="flex items-center gap-4 mb-2">
              <Zap size={32} className="text-yellow-300" />
              <h2 className="text-2xl md:text-3xl font-black italic tracking-wider">SEVERE WEATHER!</h2>
            </div>
            <p className="font-bold md:text-lg mb-4">Rain threshold exceeded. Do not take orders. Stay safe.</p>
            <div className="bg-black/20 p-4 rounded-2xl flex justify-between items-center mb-2">
              <span className="font-black uppercase tracking-widest text-sm">Instant Payout</span>
              <span className="text-3xl md:text-5xl font-black">₹350</span>
            </div>
            <p className="text-xs font-bold text-green-200 text-center uppercase tracking-widest">Credited to UPI instantly</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Risk Mitigation Nudge */}
      <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex items-start gap-4">
        <ShieldCheck className="text-orange-500 shrink-0" size={24} />
        <div>
          <h3 className="font-black text-orange-500 uppercase tracking-widest text-sm">Slab Shield Active</h3>
          <p className="text-xs font-bold text-orange-200 mt-1">Your {profile.platforms?.join(' & ') || 'Platform'} weekend incentive target is protected against severe weather disruptions today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#161622] p-6 rounded-3xl border border-white/5 shadow-lg">
              <p className="text-4xl font-black mb-2">₹3500</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Earnings</p>
            </div>
            <div className="bg-[#161622] p-6 rounded-3xl border border-white/5 shadow-lg">
              <p className="text-4xl font-black mb-2">5:40 <span className="text-lg text-gray-500">hrs</span></p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Login Duration</p>
            </div>
          </div>

          <button onClick={fireWeatherTrigger} disabled={isTriggering} className="w-full bg-orange-500/10 border border-orange-500/50 text-orange-500 p-4 rounded-3xl font-black uppercase tracking-widest text-sm flex justify-center items-center gap-3 hover:bg-orange-500 hover:text-white transition-all shadow-lg">
            {isTriggering ? 'Sending Webhook...' : <><Zap size={20} /> Demo: Force Rain Event</>}
          </button>

          <div className="bg-[#161622] border border-white/5 rounded-3xl p-6 shadow-xl flex-1">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="font-black text-white text-xl">Today's Bonus Pay</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">12am - 11:59pm</p>
              </div>
              <p className="text-2xl font-black text-orange-500 bg-orange-500/10 px-4 py-2 rounded-xl">₹60</p>
            </div>
            
            <div className="relative flex justify-between items-center mb-4 px-2 md:mt-12">
              <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-800 -translate-y-1/2 rounded-full" />
              <div className="absolute top-1/2 left-0 w-3/4 h-2 bg-orange-500 -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              {[10, 30, 60, 100].map((step, idx) => (
                <div key={idx} className={`relative z-10 w-6 h-6 rounded-full border-4 border-[#161622] ${idx < 3 ? 'bg-orange-500' : 'bg-gray-700'}`} />
              ))}
            </div>
            <div className="flex justify-between px-1 text-xs font-black text-gray-500 uppercase">
              <span>₹100</span><span>₹140</span><span>₹230</span><span>₹340+</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#161622] rounded-3xl border border-white/5 p-6 shadow-xl flex flex-col min-h-[400px]">
          <h3 className="text-xl font-black text-white mb-6">Recent Activity</h3>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {[{ name: 'Koramangala Kitchen', time: '11:20 PM', price: '₹120' },
              { name: 'Indiranagar Hub', time: '10:30 PM', price: '₹95' },
              { name: 'HSR Layout Delivery', time: '09:15 PM', price: '₹140' }
            ].map((trip, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-[#0F0F1A] rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500"><Truck size={16} /></div>
                  <div>
                    <p className="font-bold text-sm text-white">{trip.name}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">{trip.time}</p>
                  </div>
                </div>
                <p className="font-black text-white">{trip.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------
// PROFILE VIEW
// ---------------------------------------------------------
const ProfileView = ({ profile, setProfile }) => {
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-[#161622] rounded-3xl border border-white/5 p-6 md:p-10 shadow-xl">
        <div className="text-center mb-10">
          <input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="text-3xl font-black text-white text-center bg-transparent outline-none w-1/2" />
          <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mt-2 italic">Pro Tier • {profile.platforms?.join(' & ') || 'Delivery Partner'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Account Details</h4>
            <div className="bg-[#0F0F1A] border border-white/5 rounded-3xl p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center"><Phone size={18} className="text-orange-500" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Mobile</p>
                  <input value={profile.mobile} onChange={(e) => setProfile({...profile, mobile: e.target.value})} className="font-bold text-sm bg-transparent text-white w-full outline-none" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Payment Setup</h4>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white h-[calc(100%-2rem)] flex flex-col items-center justify-center">
              <QrCode size={60} className="mb-2" />
              <p className="text-xs font-bold uppercase">UPI Active</p>
            </div>
          </div>
        </div>

        <button onClick={saveProfile} className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${isSaving ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}>
          {isSaving ? <><CheckCircle size={20}/> Saved</> : <><Save size={20}/> Save Profile</>}
        </button>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------
// PAYOUT HISTORY VIEW
// ---------------------------------------------------------
const PayoutHistoryView = ({ userId }) => {
  return (
    <div className="p-8 text-center"><h2 className="text-2xl font-bold">Payouts will appear here.</h2></div>
  );
};

// ---------------------------------------------------------
// TRIP HISTORY VIEW
// ---------------------------------------------------------
const TripHistoryView = () => (
  <div className="p-8 text-center"><h2 className="text-2xl font-bold">Trip History</h2></div>
);