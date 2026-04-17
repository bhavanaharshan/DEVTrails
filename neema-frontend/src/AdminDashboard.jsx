import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, ShieldAlert, Users, AlertTriangle, 
  Search, ExternalLink, Filter, CheckCircle2 
} from 'lucide-react';

const AdminDashboard = () => {
  // 1. CHANGE: Initialized state with default structure instead of null
  // This prevents "Cannot read properties of null" if the API is slow or fails.
  const [data, setData] = useState({
    metrics: { lossRatio: 0 },
    eligibility: { eligible_count: 0, total_count: 0 },
    reviewQueue: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('https://rebound-estimate-glue.ngrok-free.dev/api/admin/metrics');
        const json = await res.json();
        if (json) setData(json); // 2. CHANGE: Added check to ensure json exists
      } catch (err) {
        console.error("Admin fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F3F4F9] flex items-center justify-center font-sans">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-indigo-600">
        <ShieldAlert size={40} />
      </motion.div>
    </div>
  );

  // 3. CHANGE: Added Optional Chaining (?.) and Fallbacks (||)
  // This is the "Safety Net". If the API returns something unexpected, the UI won't crash.
  const metrics = data?.metrics || { lossRatio: 0 };
  const eligibility = data?.eligibility || { eligible_count: 0, total_count: 0 };
  const reviewQueue = data?.reviewQueue || [];
  const isHealthy = metrics.lossRatio <= 0.65;

  return (
    <div className="min-h-screen bg-[#F3F4F9] p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic text-xs">G</div>
              <span className="font-black text-xl italic text-indigo-600 tracking-tighter">GIGSHIELD <span className="text-gray-400 not-italic font-medium text-sm ml-2">| INSURER PORTAL</span></span>
            </div>
            <h1 className="text-4xl font-black text-gray-800">Risk Analytics</h1>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-black text-gray-500 uppercase">Live Engine Active</span>
            </div>
          </div>
        </header>

        {/* --- KPI GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Loss Ratio Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] shadow-xl border-b-8 border-indigo-600">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><TrendingUp size={24}/></div>
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isHealthy ? 'Profitable' : 'High Risk'}
              </span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Loss Ratio</p>
            <h2 className={`text-5xl font-black italic ${isHealthy ? 'text-gray-800' : 'text-red-600'}`}>
              {metrics.lossRatio}
            </h2>
            <p className="text-xs text-gray-400 mt-2 font-bold italic">Target Ratio: 0.65</p>
          </motion.div>

          {/* Social Security Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2.5rem] shadow-xl border-b-8 border-violet-600">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-violet-50 rounded-2xl text-violet-600"><Users size={24}/></div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Social Security Eligible</p>
            <h2 className="text-5xl font-black italic text-gray-800">{eligibility.eligible_count}</h2>
            <p className="text-xs text-gray-400 mt-2 font-bold italic">From {eligibility.total_count} Registered Workers</p>
          </motion.div>

          {/* Fraud/Claims Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-800 p-8 rounded-[2.5rem] shadow-xl border-b-8 border-orange-500 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 rounded-2xl text-orange-400"><ShieldAlert size={24}/></div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Human Review Queue</p>
            <h2 className="text-5xl font-black italic text-orange-400">{reviewQueue.length}</h2>
            <p className="text-xs text-gray-400 mt-2 font-bold italic">ML Suspicion Flagging</p>
          </motion.div>
        </div>

        {/* --- REVIEW QUEUE TABLE --- */}
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-500" />
              <h2 className="text-xl font-black text-gray-800">Pending Fraud Verification</h2>
            </div>
          </div>
          
          <div className="p-4">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-2">Worker ID</th>
                  <th className="px-6 py-2">Full Name</th>
                  <th className="px-6 py-2">ML Suspicion Reason</th>
                  <th className="px-6 py-2">Contact</th>
                  <th className="px-6 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviewQueue.map((user) => (
                  <tr key={user.id} className="group bg-gray-50/50 hover:bg-indigo-50/50 transition-colors">
                    <td className="px-6 py-5 rounded-l-3xl font-mono text-xs text-gray-400">#{user.id?.slice(0,8) || 'N/A'}</td>
                    <td className="px-6 py-5 font-black text-gray-800">{user.name}</td>
                    <td className="px-6 py-5">
                      <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase italic">
                        {user.suspicion_reason || "Kinematic Anomaly"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-gray-500">{user.mobile}</td>
                    <td className="px-6 py-5 rounded-r-3xl text-right">
                      <button className="p-2 bg-white shadow-sm rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reviewQueue.length === 0 && (
              <div className="py-20 text-center">
                <CheckCircle2 size={48} className="mx-auto text-green-200 mb-4" />
                <p className="text-gray-400 font-bold italic">All claims verified. No flags in queue.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;