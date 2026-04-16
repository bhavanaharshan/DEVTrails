import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; 
import { io } from 'socket.io-client'; 
import { 
  Menu, X, Home, Truck, User, Zap, ShieldCheck, WifiOff, AlertTriangle, Phone, MapPin
} from 'lucide-react';

// The centralized tunnel address provided by Neema
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
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || "demo"}`
  });

  // 1. Network & Offline SOS Logic
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
      
      {/* Offline SOS SMS Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} className="fixed top-0 left-0 w-full bg-red-600 text-white p-3 z-[100] flex justify-center items-center gap-4 shadow-2xl">
            <WifiOff size={20} />
            <span className="font-bold text-sm">Network Offline. SOS Fallback Active.</span>
            <a href={`sms:+919876543210?body=${sosPayload}`} className="bg-white text-red-600 px-4 py-1 rounded-full font-black text-xs uppercase tracking-wider shadow-lg">
              Send SMS Claim
            </a>
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
          {activePage === 'dashboard' && <DashboardView profile={profile} />}
          {activePage === 'profile' && <ProfileView profile={profile} />}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// DASHBOARD VIEW (Zero-Trust Logic)
// ---------------------------------------------------------
const DashboardView = ({ profile }) => {
  const [securityStatus, setSecurityStatus] = useState('scanning'); 
  const [fraudReason, setFraudReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // 1. Zero-Trust Security Handshake
  useEffect(() => {
    const runSecurityScan = async () => {
      setSecurityStatus('scanning');
      
      if (!("geolocation" in navigator)) {
        setSecurityStatus('compromised');
        setFraudReason('Hardware Violation: Geolocation API missing.');
        return;
      }

      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/security/verify-location`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true' // Bypasses ngrok splash screen
            },
            body: JSON.stringify({
              user_id: profile.id, // Payload aligned with Neema's server.js
              declared_location_text: profile.zone, // Updated key for backend geocoding
              device_lat: pos.coords.latitude,
              device_lon: pos.coords.longitude
            })
          });

          if (!response.ok) throw new Error("Security handshake failed");

          const data = await response.json();
          if (data.secure === true) {
            setSecurityStatus('secure');
          } else {
            setSecurityStatus('compromised');
            setFraudReason(data.reason || "Kinematic Violation: Physical location mismatch detected.");
          }
        } catch (err) {
          setSecurityStatus('compromised');
          setFraudReason('Zero-Trust Violation: Security Handshake Failed or Server Offline.');
        }
      }, (err) => {
        // If offline, do not lock based on hardware failure to allow SOS protocol
        if (!navigator.onLine) {
           setSecurityStatus('secure');
        } else {
           setSecurityStatus('compromised');
           setFraudReason('Hardware Violation: Location access blocked or timed out.');
        }
      });
    };

    if (profile.zone !== "Pending Zone") runSecurityScan();
  }, [profile.zone, profile.id]);

  // 2. Socket Connection for Real-time Weather Triggers
  useEffect(() => {
    const socket = io(BACKEND_URL, {
        extraHeaders: {
            "ngrok-skip-browser-warning": "true"
        }
    });

    socket.emit('join-zone', profile.zone);
    
    socket.on('claim-notification', () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 8000);
    });

    return () => socket.disconnect();
  }, [profile.zone]);

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 relative min-h-full">
      
      {/* Security Lockout UI */}
      <AnimatePresence>
        {securityStatus === 'compromised' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl border border-red-500/30">
            <AlertTriangle size={64} className="text-red-500 mb-4" />
            <h2 className="text-3xl font-black text-red-500 mb-2 uppercase italic tracking-tighter text-center">Security Lockout</h2>
            <p className="text-gray-300 font-bold mb-8 text-center max-w-md">{fraudReason}</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">Protocol: Zero-Trust Hardware Verification</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instant Payout Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-green-600 text-white p-8 rounded-3xl shadow-2xl border-4 border-green-400 mb-4">
            <div className="flex items-center gap-4 mb-2"><Zap size={32} className="text-yellow-300" /><h2 className="text-3xl font-black italic uppercase">Severe Weather Detected</h2></div>
            <p className="font-bold text-lg">Parametric payout of <span className="text-2xl font-black underline italic">₹350</span> credited instantly.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center bg-[#161622] border border-white/5 p-4 px-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <ShieldCheck className={securityStatus === 'secure' ? "text-green-500" : "text-orange-500 animate-pulse"} size={22} />
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">
            Hardware Health: <span className={securityStatus === 'secure' ? "text-green-500" : "text-orange-500"}>{securityStatus.toUpperCase()}</span>
          </span>
        </div>
        {securityStatus === 'secure' && <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-ping" /><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Monitoring</span></div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161622] p-8 rounded-3xl border border-white/5 shadow-xl group">
          <p className="text-5xl font-black mb-2 tracking-tighter transition-colors group-hover:text-orange-500">₹3,500</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Earnings</p>
        </div>
        <div className="bg-[#161622] p-8 rounded-3xl border border-white/5 shadow-xl group">
          <p className="text-5xl font-black mb-2 tracking-tighter transition-colors group-hover:text-orange-500">5.4 <span className="text-2xl text-gray-600 font-normal">hrs</span></p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Duty Time</p>
        </div>
      </div>

      <div className="bg-[#161622] border border-white/5 rounded-3xl p-8 flex-1 shadow-xl">
        <h3 className="font-black text-white text-xl mb-6 uppercase tracking-tight">Active Protection Log</h3>
        <div className="space-y-4">
          {['Hardware Geo-Sync', 'Encrypted Payout Channel', 'Weather API Stream'].map((log, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-[#0F0F1A] rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500 font-bold text-xs">OK</div>
                <p className="font-bold text-sm text-gray-400">{log}</p>
              </div>
              <p className="font-black text-gray-600 text-[10px] uppercase">Verified</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileView = ({ profile }) => (
  <div className="p-6 md:p-10 max-w-2xl mx-auto w-full">
    <div className="bg-[#161622] rounded-3xl border border-white/5 p-8 flex flex-col items-center shadow-2xl">
      <div className="w-32 h-32 rounded-full border-4 border-orange-500/30 overflow-hidden mb-6 shadow-xl shadow-orange-500/10">
        <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
      </div>
      <h2 className="text-3xl font-black italic mb-2 tracking-tighter text-white">{profile.name}</h2>
      <p className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-8">Verified Partner • {profile.zone}</p>
      
      <div className="w-full space-y-3 text-left">
        <div className="flex items-center gap-4 bg-[#0F0F1A] p-4 rounded-2xl border border-white/5">
          <Phone className="text-orange-500/50" size={18} />
          <div><p className="text-[8px] uppercase text-gray-500 font-bold">Mobile</p><p className="font-bold text-sm text-white">{profile.mobile}</p></div>
        </div>
        <div className="flex items-center gap-4 bg-[#0F0F1A] p-4 rounded-2xl border border-white/5">
          <MapPin className="text-orange-500/50" size={18} />
          <div><p className="text-[8px] uppercase text-gray-500 font-bold">Zone</p><p className="font-bold text-sm text-white">{profile.zone}</p></div>
        </div>
      </div>
    </div>
  </div>
);