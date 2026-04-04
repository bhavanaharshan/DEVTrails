// src/pages/Dashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; 
import { io } from 'socket.io-client'; 
import { 
  Menu, X, Home, CreditCard, Truck, User, 
  LogOut, ChevronRight, CheckCircle, Zap, Clock, 
  Camera, Edit2, MapPin, Phone, Save, QrCode, ShieldCheck
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  
  const [profile, setProfile] = useState({
    id: user?.uid || "demo_user", 
    name: "Delivery Partner",
    mobile: user?.phoneNumber || "+91 00000 00000",
    zone: "Pending Zone",
    address: "Update your address in profile",
    platform: "Zomato",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || "demo"}`
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      try {
        const response = await fetch(`http://localhost:5000/api/dashboard/${user.uid}`); 
        if(response.ok) {
          const data = await response.json();
          setProfile(prev => ({ ...prev, ...data }));
          
          const savedZone = localStorage.getItem('gs_zone');
          const savedName = localStorage.getItem('gs_name');
          if (savedZone) setProfile(prev => ({ ...prev, zone: savedZone, name: savedName || prev.name }));
        }
      } catch (err) {
        console.log("Waiting for backend to load real user data...");
      }
    };
    fetchUserData();
  }, [user]);

  // Sidebar Component
  const Navigation = () => (
    <>
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black italic text-lg shadow-lg shadow-orange-500/20">G</div>
          <span className="font-black text-2xl italic text-white tracking-tight">GIG<span className="text-orange-500">SHIELD</span></span>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white lg:hidden"><X size={24} /></button>
      </div>
      <nav className="space-y-2 flex-1">
        {[
          { id: 'dashboard', label: 'Earnings', icon: <Home size={20}/> },
          { id: 'duty', label: 'Trip History', icon: <Truck size={20}/> },
          { id: 'history', label: 'Payouts', icon: <CreditCard size={20}/> },
          { id: 'profile', label: 'My Profile', icon: <User size={20}/> },
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => { setActivePage(item.id); setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all duration-200 ${activePage === item.id ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
      <button onClick={() => window.location.href='/'} className="flex items-center gap-4 p-4 text-red-500 font-bold border-t border-white/10 pt-6 hover:bg-red-500/10 rounded-2xl transition-all">
        <LogOut size={20} /> Logout
      </button>
    </>
  );

  return (
    <div className="flex h-screen bg-[#0F0F1A] text-white font-sans overflow-hidden">
      
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#161622] border-r border-white/5 p-6 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Navigation />
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full relative">
        <header className="p-4 md:p-6 lg:px-10 flex justify-between items-center sticky top-0 z-30 bg-[#0F0F1A]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-sm md:text-base lg:text-lg font-black opacity-90 uppercase tracking-widest text-orange-500">
              {activePage === 'dashboard' ? "Today's Earnings" : activePage.toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-white">{profile.name}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{profile.zone}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1A1A24] border-2 border-white/10 overflow-hidden shadow-inner">
              <img src={profile.avatar} alt="profile" className="w-full h-full object-cover" />
            </div>
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

  // SOCKET CONNECTION
  useEffect(() => {
    const socket = io('http://localhost:5000');

    if (profile?.zone && profile.zone !== "Pending Zone") {
      socket.emit('join-zone', profile.zone);
    } else {
      socket.emit('join-zone', "Kurla"); // fallback for demo
    }

    socket.on('claim-notification', (data) => {
      console.log("🔥 Real-time Webhook received via Socket.io!", data);
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
      
      if (!response.ok) throw new Error("Trigger failed to hit Database");
      
    } catch (error) {
      console.error("Failed to reach database:", error);
      alert("Database trigger failed! Make sure Neema's backend is running on port 5000.");
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-10 flex flex-col relative gap-6">
      
      {/* SUCCESS POPUP OVERLAY */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-green-500 text-white p-6 md:p-8 rounded-3xl shadow-2xl z-50 border-4 border-green-400"
          >
            <div className="flex items-center gap-4 mb-2">
              <Zap size={32} className="text-yellow-300 fill-yellow-300 md:w-10 md:h-10" />
              <h2 className="text-2xl md:text-3xl font-black italic tracking-wider">SEVERE WEATHER!</h2>
            </div>
            <p className="font-bold md:text-lg mb-4 md:mb-6">Rain threshold exceeded in {profile.zone !== "Pending Zone" ? profile.zone : "your zone"}. Do not take orders. Stay safe.</p>
            <div className="bg-black/20 p-4 md:p-6 rounded-2xl flex justify-between items-center mb-2">
              <span className="font-black uppercase tracking-widest text-sm md:text-base">Instant Payout</span>
              <span className="text-3xl md:text-5xl font-black">₹350</span>
            </div>
            <p className="text-xs md:text-sm font-bold text-green-200 text-center uppercase tracking-widest">Credited to UPI instantly via GigShield</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 h-full">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="bg-[#161622] p-6 md:p-8 rounded-3xl border border-white/5 text-white shadow-lg hover:border-orange-500/30 transition-colors">
              <p className="text-4xl md:text-5xl font-black mb-2">₹3500</p>
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Earnings</p>
            </div>
            <div className="bg-[#161622] p-6 md:p-8 rounded-3xl border border-white/5 text-white shadow-lg hover:border-orange-500/30 transition-colors">
              <p className="text-4xl md:text-5xl font-black mb-2">5:40 <span className="text-lg md:text-2xl text-gray-500">hrs</span></p>
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Login Duration</p>
            </div>
          </div>

          <button 
            onClick={fireWeatherTrigger}
            disabled={isTriggering}
            className="w-full bg-orange-500/10 border border-orange-500/50 text-orange-500 md:py-6 p-4 rounded-3xl font-black uppercase tracking-widest text-xs md:text-sm flex justify-center items-center gap-3 hover:bg-orange-500 hover:text-white transition-all shadow-lg shadow-orange-500/10"
          >
            {isTriggering ? 'Sending Webhook...' : <><Zap size={20} /> Demo: Force Rain Event</>}
          </button>

          <div className="bg-[#161622] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl flex-1">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="font-black text-white text-lg md:text-xl">Today's Bonus Pay</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">12am - 11:59pm</p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-orange-500 bg-orange-500/10 px-4 py-2 rounded-xl">₹60</p>
            </div>
            
            <div className="relative flex justify-between items-center mb-4 px-2 md:mt-12">
              <div className="absolute top-1/2 left-0 w-full h-1.5 md:h-2 bg-gray-800 -translate-y-1/2 rounded-full" />
              <div className="absolute top-1/2 left-0 w-3/4 h-1.5 md:h-2 bg-orange-500 -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              {[10, 30, 60, 100].map((step, idx) => (
                <div key={idx} className={`relative z-10 w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-[#161622] shadow-sm transition-colors ${idx < 3 ? 'bg-orange-500' : 'bg-gray-700'}`} />
              ))}
            </div>
            <div className="flex justify-between px-1 text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-tighter">
              <span>₹100</span><span>₹140</span><span>₹230</span><span>₹340+</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#161622] rounded-t-[3rem] lg:rounded-3xl border-t lg:border border-white/5 p-6 md:p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] lg:shadow-xl flex flex-col h-full min-h-[400px]">
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-xl md:text-2xl font-black text-white">Recent Activity</h3>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            {[
              { name: 'Koramangala Kitchen', time: '11:20 PM', price: '₹120' },
              { name: 'Indiranagar Hub', time: '10:30 PM', price: '₹95' },
              { name: 'HSR Layout Delivery', time: '09:15 PM', price: '₹140' },
              { name: 'BTM Layout Cloud Kitchen', time: '08:45 PM', price: '₹85' },
            ].map((trip, i) => (
              <div key={i} className="flex justify-between items-center group p-4 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm md:text-base text-white">{trip.name}</p>
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mt-1">{trip.time}</p>
                  </div>
                </div>
                <p className="font-black text-white text-lg">{trip.price}</p>
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
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-[#161622] rounded-3xl border border-white/5 p-6 md:p-10 shadow-xl">
        <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-8">
          <div className="w-full h-full rounded-full bg-[#0F0F1A] border-4 border-white/10 shadow-xl overflow-hidden">
            <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover opacity-90" />
          </div>
          <button onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-orange-500 text-white p-3 md:p-4 rounded-full shadow-lg border-4 border-[#161622] hover:bg-orange-600 transition-transform active:scale-90">
            <Camera size={20} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 group">
            <input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="text-3xl md:text-4xl font-black text-white text-center bg-transparent border-b-2 border-transparent focus:border-orange-500/50 outline-none w-2/3 md:w-1/2 transition-colors" />
            <Edit2 size={16} className="text-gray-500" />
          </div>
          <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mt-2 italic">Delivery Partner • Pro Tier</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Account Details</h4>
            <div className="bg-[#0F0F1A] border border-white/5 rounded-3xl p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center"><Phone size={18} className="text-orange-500" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Mobile Number</p>
                  <input value={profile.mobile} onChange={(e) => setProfile({...profile, mobile: e.target.value})} className="font-bold text-sm bg-transparent outline-none text-white w-full" />
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mt-1"><MapPin size={18} className="text-orange-500" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Current Address</p>
                  <textarea rows="2" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} className="font-bold text-sm bg-transparent outline-none text-white w-full resize-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Payment Setup</h4>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg flex flex-col items-center justify-center h-[calc(100%-2rem)]">
              <h3 className="font-black text-sm uppercase tracking-widest mb-4 w-full text-center">Receive Payouts</h3>
              <div className="bg-[#0F0F1A] p-4 rounded-3xl shadow-inner mb-4">
                <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center p-2">
                  <QrCode size={80} className="text-black" />
                </div>
              </div>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">Scan to pay {profile.name}</p>
            </div>
          </div>
        </div>

        <button onClick={saveProfile} className={`w-full md:w-1/2 md:mx-auto py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${isSaving ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200 active:scale-95'}`}>
          {isSaving ? <><CheckCircle size={20}/> Changes Saved</> : <><Save size={20}/> Save Profile</>}
        </button>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------
// PAYOUT HISTORY VIEW
// ---------------------------------------------------------
const PayoutHistoryView = ({ userId }) => {
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    if (userId) {
      fetch(`http://localhost:5000/api/payouts/${userId}`)
        .then(res => { if(res.ok) return res.json(); throw new Error(); })
        .then(data => setPayouts(data))
        .catch(err => console.log("Waiting for backend for payout history..."));
    }
  }, [userId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 md:p-10 rounded-3xl text-white shadow-xl shadow-orange-500/20 mb-8 flex justify-between items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Total Protected Payouts</p>
          <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter">₹{payouts.reduce((sum, p) => sum + Number(p.payout_amount), 0)}</h2>
        </div>
        <div className="hidden md:block w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <ShieldCheck className="w-12 h-12 text-white" />
        </div>
      </div>
      
      <div className="space-y-4">
        {payouts.length > 0 ? payouts.map((p, idx) => (
          <div key={idx} className="bg-[#161622] p-6 md:p-8 rounded-3xl border border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl hidden md:flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="font-black text-white text-lg capitalize">{p.trigger_type} Event Payout</p>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{new Date(p.triggered_at).toLocaleDateString()} • {new Date(p.triggered_at).toLocaleTimeString()}</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-black text-green-400">+₹{p.payout_amount}</p>
          </div>
        )) : (
          <div className="bg-[#161622] border border-white/5 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={32} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Payouts Yet</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">Your income is fully protected. Automatic payouts will appear here if a severe weather event disrupts your earning zone.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------
// TRIP HISTORY VIEW
// ---------------------------------------------------------
const TripHistoryView = () => (
  <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
    <div className="bg-[#161622] rounded-3xl border border-white/5 p-6 md:p-10 min-h-[500px]">
      <h2 className="text-2xl font-black mb-8 text-white">Trip History</h2>
      <div className="p-12 bg-[#0F0F1A] rounded-3xl border-2 border-white/5 border-dashed text-center flex flex-col items-center justify-center h-64">
        <Clock size={48} className="mx-auto mb-6 text-gray-700" />
        <p className="text-gray-500 font-bold text-sm tracking-wide">Past deliveries will be synced here soon.</p>
      </div>
    </div>
  </div>
);