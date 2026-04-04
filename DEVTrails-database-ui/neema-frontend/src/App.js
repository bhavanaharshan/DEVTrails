import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Home, CreditCard, Truck, User, 
  LogOut, ChevronRight, CheckCircle, Zap, Clock, 
  Camera, Edit2, MapPin, Phone, Save, QrCode
} from 'lucide-react';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  
  // Shared Profile State
  const [profile, setProfile] = useState({
    id: "", // Added to track DB user ID
    name: "Neema",
    mobile: "+91 90000 00000",
    zone: "Bangalore South",
    address: "123, Koramangala 5th Block, Bangalore - 560095",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neema"
  });

  // --- NEW: FETCH DATA ON LOAD ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Replace with your actual user ID logic (e.g., from Priya's Auth)
        const response = await fetch('/api/policy/your-user-uuid-here'); 
        const data = await response.json();
        if (data.policy) {
           // Merging policy/user data into profile state
           setProfile(prev => ({ ...prev, ...data.policy }));
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F4F9] flex justify-center overflow-x-hidden font-sans">
      <div className="w-full max-w-md bg-[#6366F1] min-h-screen shadow-2xl relative flex flex-col">
        
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

  // --- UPDATED: SAVE TO BACKEND ---
  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          name: profile.name,
          mobile: profile.mobile,
          address: profile.address,
          avatar_url: profile.avatar
        })
      });
    } catch (err) {
      console.error("Save failed", err);
    }
    setIsSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-white rounded-t-[3rem] p-8 shadow-inner overflow-y-auto pb-24">
      {/* Avatar Section */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="w-full h-full rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-xl overflow-hidden">
          <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <button 
          onClick={() => fileInputRef.current.click()}
          className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 rounded-2xl shadow-lg border-4 border-white hover:bg-indigo-700 transition-transform active:scale-90"
        >
          <Camera size={20} />
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      </div>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 group">
          <input 
            value={profile.name} 
            onChange={(e) => setProfile({...profile, name: e.target.value})}
            className="text-2xl font-black text-gray-800 text-center bg-transparent border-b border-transparent focus:border-indigo-200 outline-none w-1/2"
          />
          <Edit2 size={14} className="text-gray-300" />
        </div>
        <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest italic">Delivery Partner • Pro Tier</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 mb-8">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Account Details</h4>
        
        <div className="bg-gray-50 rounded-[2rem] p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Phone size={18} className="text-indigo-400" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase">Mobile Number</p>
              <input 
                value={profile.mobile} 
                onChange={(e) => setProfile({...profile, mobile: e.target.value})}
                className="font-bold text-sm bg-transparent outline-none text-gray-800 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <MapPin size={18} className="text-indigo-400" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase">Current Address</p>
              <textarea 
                rows="2"
                value={profile.address} 
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                className="font-bold text-sm bg-transparent outline-none text-gray-800 w-full resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment QR Section */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-6 text-white mb-8 shadow-lg shadow-indigo-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-sm uppercase tracking-tighter">Payment QR Code</h3>
          <QrCode size={20} className="opacity-60" />
        </div>
        <div className="bg-white p-4 rounded-3xl flex flex-col items-center gap-3">
          <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
            {/* Mock QR using Lucide */}
            <QrCode size={80} className="text-gray-800" />
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase">Scan to pay {profile.name}</p>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={saveProfile}
        className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
          isSaving ? 'bg-green-500 text-white' : 'bg-gray-800 text-white active:scale-95'
        }`}
      >
        {isSaving ? <><CheckCircle size={20}/> Changes Saved</> : <><Save size={20}/> Save Profile</>}
      </button>
    </motion.div>
  );
};

// --- VIEW: EARNINGS DASHBOARD ---
const DashboardView = ({ profile }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
    <div className="px-6 grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-white shadow-lg">
        <p className="text-3xl font-black mb-1">₹3500</p>
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Today's Earnings</p>
      </div>
      <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 text-white shadow-lg">
        <p className="text-3xl font-black mb-1">5:40 <span className="text-sm">hrs</span></p>
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Login Duration</p>
      </div>
    </div>

    <div className="mx-6 bg-white rounded-[2rem] p-6 shadow-xl mb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-black text-gray-800">Today's Bonus Pay</h3>
          <p className="text-[10px] text-gray-400 font-bold">12am - 11:59pm</p>
        </div>
        <p className="text-xl font-black text-indigo-600">₹60</p>
      </div>
      <div className="relative flex justify-between items-center mb-2 px-2">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />
        <div className="absolute top-1/2 left-0 w-3/4 h-1 bg-green-500 -translate-y-1/2 rounded-full" />
        {[10, 30, 60, 100].map((step, idx) => (
          <div key={idx} className={`relative z-10 w-4 h-4 rounded-full border-2 border-white shadow-sm ${idx < 3 ? 'bg-green-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex justify-between px-1 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
        <span>₹100</span><span>₹140</span><span>₹230</span><span>₹340+</span>
      </div>
    </div>

    <div className="flex-1 bg-white rounded-t-[3rem] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-xl font-black text-gray-800">Recent Activity</h3>
      </div>
      <div className="space-y-6">
        {[
          { name: 'Koramangala Kitchen', time: '11:20 PM', price: '₹120' },
          { name: 'Indiranagar Hub', time: '10:30 PM', price: '₹95' },
        ].map((trip, i) => (
          <div key={i} className="flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-500">
                <Truck size={18} />
              </div>
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

// --- VIEW: PAYOUTS (UPDATED FOR DYNAMIC DATA) ---
const PayoutHistoryView = ({ userId }) => {
  const [payouts, setPayouts] = useState([]);

  useEffect(() => {
    if (userId) {
      fetch(`/api/payouts/${userId}`)
        .then(res => res.json())
        .then(data => setPayouts(data))
        .catch(err => console.error("Payout fetch failed", err));
    }
  }, [userId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-white rounded-t-[3rem] p-8 shadow-inner overflow-y-auto">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-lg mb-8">
        <p className="text-[10px] font-black uppercase opacity-70 mb-1">Total Payouts</p>
        <h2 className="text-4xl font-black italic">₹{payouts.reduce((sum, p) => sum + Number(p.payout_amount), 0)}</h2>
      </div>
      
      <div className="space-y-4">
        {payouts.length > 0 ? payouts.map((p, idx) => (
          <div key={idx} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-black text-gray-800">{p.trigger_type}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(p.triggered_at).toLocaleDateString()} • {new Date(p.triggered_at).toLocaleTimeString()}</p>
              </div>
              <p className="font-black text-green-500">+₹{p.payout_amount}</p>
          </div>
        )) : (
          <p className="text-center text-gray-400 text-sm italic py-10">No payouts found.</p>
        )}
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