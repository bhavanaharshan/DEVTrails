import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; 
import { io } from 'socket.io-client'; 
import { 
  Menu, X, Home, Truck, User, Zap, ShieldCheck, WifiOff, AlertTriangle, 
  Phone, MapPin, RefreshCw, Lock, Unlock, CheckCircle2, Timer 
} from 'lucide-react';

const BACKEND_URL = 'https://rebound-estimate-glue.ngrok-free.dev';

export default function Dashboard() {
  const { user } = useAuth(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [sosPayload, setSosPayload] = useState('');
  
  const [profile, setProfile] = useState({
    id: user?.uid || "demo_user", 
    name: localStorage.getItem('gs_name') || "Delivery Partner",
    zone: localStorage.getItem('gs_zone') || "Pending Zone",
    mobile: user?.phoneNumber || "+91 00000 00000",
    platforms: JSON.parse(localStorage.getItem('gs_platforms') || '[]'),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || "demo"}`,
    days_worked_count: 0, 
    ss_eligible: false
  });

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    const prepareSOS = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setSosPayload(`SOS-CLAIM-${profile.id}-LAT${pos.coords.latitude.toFixed(2)}-LON${pos.coords.longitude.toFixed(2)}`);
        });
      }
    };
    if (isOffline) prepareSOS();

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [isOffline, profile.id]);

  const Navigation = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black italic text-lg shadow-lg">G</div>
        <span className="font-black text-2xl italic tracking-tight text-white">GIG<span className="text-orange-500">SHIELD</span></span>
      </div>
      <nav className="space-y-2 flex-1">
        {[{ id: 'dashboard', label: 'Earnings', icon: <Home size={20}/> },
          { id: 'duty', label: 'Trip History', icon: <Truck size={20}/> },
          { id: 'profile', label: 'My Profile', icon: <User size={20}/> }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => { setActivePage(item.id); setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activePage === item.id ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0F0F1A] text-white font-sans overflow-hidden">
      <AnimatePresence>
        {isOffline && (
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} className="fixed top-0 left-0 w-full bg-red-600 text-white p-3 z-[100] flex justify-center items-center gap-4 shadow-2xl">
            <WifiOff size={20} />
            <span className="font-bold text-sm tracking-wide">Network Offline. SOS Fallback Active.</span>
            <a href={`sms:+919876543210?body=${sosPayload}`} className="bg-white text-red-600 px-4 py-1 rounded-full font-black text-xs uppercase tracking-wider shadow-lg">Send SMS Claim</a>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#161622] border-r border-white/5 p-6 flex flex-col transform transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Navigation />
      </aside>

      <div className={`flex-1 flex flex-col h-screen overflow-y-auto relative ${isOffline ? 'mt-12' : ''}`}>
        <header className="p-6 flex justify-between items-center sticky top-0 z-30 bg-[#0F0F1A]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-full"><Menu size={24} /></button>
            <h1 className="text-lg font-black uppercase tracking-widest text-orange-500">{activePage.toUpperCase()}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{profile.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{profile.zone}</p>
          </div>
        </header>

        <main className="flex-1 w-full flex flex-col">
          {activePage === 'dashboard' && <DashboardView profile={profile} setProfile={setProfile} />}
          {activePage === 'profile' && <ProfileView profile={profile} setProfile={setProfile} />}
        </main>
      </div>
    </div>
  );
}

const DashboardView = ({ profile, setProfile }) => {
  const [securityStatus, setSecurityStatus] = useState('scanning'); 
  const [fraudReason, setFraudReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Engagement thresholds for Social Security Gateway
  const platformMode = profile.platforms.length > 1 ? 'multi' : 'single';
  const targetDays = platformMode === 'single' ? 90 : 120;
  const daysRemaining = Math.max(targetDays - profile.days_worked_count, 0);
  const progressPercent = Math.min((profile.days_worked_count / targetDays) * 100, 100);

  // 2. Initial Sync Simulation (The 50-Day Scenario)
  const handleInitialSync = async () => {
    setIsSyncing(true);
    setTimeout(async () => {
      const historicalDays = 95; 
      try {
        await fetch(`${BACKEND_URL}/api/user/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: profile.id,
            daysWorked: historicalDays,
            platformMode: platformMode,
            upi_id: "verified_user@upi"
          })
        });
        setProfile(prev => ({ 
          ...prev, 
          days_worked_count: historicalDays,
          ss_eligible: (platformMode === 'single' && historicalDays >= 90) || (platformMode === 'multi' && historicalDays >= 120)
        }));
      } catch (err) { console.error("Sync failed"); }
      setIsSyncing(false);
    }, 2000);
  };

  // 3. Socket Connection (Listen for Real-time stat updates)
  useEffect(() => {
    const socket = io(BACKEND_URL, { extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    socket.emit('join-zone', profile.zone);
    
    // Real-time update for Engagement Rules
    socket.on('update-stats', (data) => {
      setProfile(prev => ({ 
        ...prev, 
        days_worked_count: data.days_worked_count,
        ss_eligible: data.ss_eligible
      }));
    });

    socket.on('claim-notification', () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 8000);
    });

    return () => socket.disconnect();
  }, [profile.zone]);

  // Zero-Trust Security Handshake
  useEffect(() => {
    const runSecurityScan = async () => {
      setSecurityStatus('scanning');
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/security/verify-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({
              user_id: profile.id, 
              declared_location_text: profile.zone, 
              device_lat: pos.coords.latitude,
              device_lon: pos.coords.longitude
            })
          });
          const data = await response.json();
          setSecurityStatus(data.secure ? 'secure' : 'compromised');
          if (!data.secure) setFraudReason(data.reason);
        } catch (err) {
          setSecurityStatus('compromised');
          setFraudReason('Zero-Trust Violation: Security Handshake Failed.');
        }
      });
    };
    if (profile.zone !== "Pending Zone") runSecurityScan();
  }, [profile.zone, profile.id]);

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 relative min-h-full">
      <AnimatePresence>
        {securityStatus === 'compromised' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl">
            <AlertTriangle size={64} className="text-red-500 mb-4" />
            <h2 className="text-3xl font-black text-red-500 mb-2 uppercase italic">Security Lockout</h2>
            <p className="text-gray-300 font-bold mb-8 text-center max-w-md">{fraudReason}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SOCIAL SECURITY GATEWAY (Progress & Locked/Unlocked UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Card */}
        <div className="bg-[#161622] p-8 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Work Engagement Ledger</h3>
            <button onClick={handleInitialSync} disabled={isSyncing} className="bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all">
              <RefreshCw className={isSyncing ? "animate-spin" : ""} size={16} />
            </button>
          </div>
          <div className="flex justify-between items-end mb-4">
            <p className="text-4xl font-black italic">{profile.days_worked_count}<span className="text-gray-600 text-lg ml-2">Days</span></p>
            <p className="text-[10px] font-black uppercase text-orange-500">{daysRemaining} To Eligibility</p>
          </div>
          <div className="h-4 w-full bg-gray-800 rounded-full border border-white/5 p-1 mb-4">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${progressPercent}%` }} 
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
            />
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            Mode: {platformMode === 'multi' ? 'Multi-Apping (120D)' : 'Single Platform (90D)'}
          </p>
        </div>

        {/* Locked/Unlocked Benefits Card */}
        <motion.div 
          animate={{ backgroundColor: profile.ss_eligible ? "rgba(79, 70, 229, 0.1)" : "rgba(31, 31, 46, 1)" }}
          className={`p-8 rounded-3xl border-2 transition-all duration-700 relative overflow-hidden ${profile.ss_eligible ? 'border-indigo-500/40' : 'border-white/5'}`}
        >
          <div className="flex justify-between items-start mb-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${profile.ss_eligible ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-600'}`}>
              {profile.ss_eligible ? <Unlock size={24} /> : <Lock size={24} />}
            </div>
            {profile.ss_eligible && <span className="bg-green-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full animate-bounce">Verified Badge</span>}
          </div>
          <h3 className="text-xl font-black mb-1">State Social Security</h3>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Payout Eligibility Status</p>
          
          <button disabled={!profile.ss_eligible} className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
            profile.ss_eligible ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg' : 'bg-gray-800 text-gray-600 opacity-50 cursor-not-allowed'
          }`}>
            {profile.ss_eligible ? "Claim Social Payout" : "Threshold Not Met"}
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161622] p-8 rounded-3xl border border-white/5 shadow-xl group">
          <p className="text-5xl font-black mb-2 tracking-tighter transition-colors group-hover:text-orange-500">₹3,500</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Earnings</p>
        </div>
        <div className="bg-[#161622] p-8 rounded-3xl border border-white/5 shadow-xl group">
          <p className="text-5xl font-black mb-2 tracking-tighter transition-colors group-hover:text-orange-500">5.4 <span className="text-2xl text-gray-600 font-normal">hrs</span></p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Shift</p>
        </div>
      </div>
    </div>
  );
};

const ProfileView = ({ profile }) => (
  <div className="p-6 md:p-10 max-w-2xl mx-auto w-full">
    <div className="bg-[#161622] rounded-3xl border border-white/5 p-8 flex flex-col items-center shadow-2xl">
      <div className="w-32 h-32 rounded-full border-4 border-orange-500/30 overflow-hidden mb-6 shadow-xl">
        <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
      </div>
      <h2 className="text-3xl font-black italic mb-2 tracking-tighter text-white">{profile.name}</h2>
      <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-8">Verified Partner • {profile.zone}</p>
      
      <div className="w-full space-y-3">
        <div className="flex items-center gap-4 bg-[#0F0F1A] p-4 rounded-2xl border border-white/5">
          <Phone className="text-orange-500/50" size={18} />
          <div><p className="text-[8px] uppercase text-gray-500 font-bold">Mobile</p><p className="font-bold text-sm text-white">{profile.mobile}</p></div>
        </div>
        <div className="flex items-center gap-4 bg-[#0F0F1A] p-4 rounded-2xl border border-white/5">
          <MapPin className="text-orange-500/50" size={18} />
          <div><p className="text-[8px] uppercase text-gray-500 font-bold">Zone</p><p className="font-bold text-sm text-white">{profile.zone}</p></div>
        </div>
        <div className="flex items-center gap-4 bg-[#0F0F1A] p-4 rounded-2xl border border-white/5">
          <ShieldCheck className={profile.ss_eligible ? "text-green-500" : "text-gray-500"} size={18} />
          <div><p className="text-[8px] uppercase text-gray-500 font-bold">Social Security Status</p><p className="font-bold text-sm text-white uppercase">{profile.ss_eligible ? 'Eligible' : 'Ineligible'}</p></div>
        </div>
      </div>
    </div>
  </div>
);