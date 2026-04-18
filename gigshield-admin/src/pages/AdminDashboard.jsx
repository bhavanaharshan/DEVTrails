import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldAlert, Users, BadgeCheck, IndianRupee,
  TrendingUp, RefreshCw, ChevronRight, Loader2, Lock,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';

const BACKEND_URL  = import.meta.env.VITE_BACKEND_URL  || 'http://localhost:3001';
const ML_URL       = import.meta.env.VITE_ML_URL       || 'http://localhost:8000';
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'gigshield-admin-2024';
// This must match ADMIN_API_KEY in the backend .env
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || 'gs-admin-dev-key-2024';

// Helper: fetch with admin key header automatically attached
function adminFetch(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: { 'x-admin-key': ADMIN_API_KEY, ...(opts.headers || {}) },
  });
}

// ─── Mock fallback data ──────────────────────────────────────────────────────
const MOCK_BCR = {
  stress_test: {
    final_bcr: 0.58,
    bcr_signal: 'LOW_RISK',
    days_simulated: 14,
    total_premium_collected: 284000,
    total_payouts_issued: 164720,
    disruption_days: 4,
    scenario: 'Monsoon Stress Test — Bengaluru Zone',
  },
};

const MOCK_METRICS = {
  total_workers: 1842,
  eligible_workers: 374,
  flagged_workers: 12,
  total_payout: 164720,
};

const MOCK_CLAIMS = [
  { id: 'c1', name: 'Raju K.',   user_id: 'u_001', claim_type: 'weather_disruption', created_at: new Date(Date.now() - 1 * 86400000).toISOString(), payout_amount: 480, status: 'approved' },
  { id: 'c2', name: 'Priya S.',  user_id: 'u_002', claim_type: 'bandh_closure',      created_at: new Date(Date.now() - 2 * 86400000).toISOString(), payout_amount: 320, status: 'under_review' },
  { id: 'c3', name: 'Mohan D.',  user_id: 'u_003', claim_type: 'aqi_lockout',        created_at: new Date(Date.now() - 3 * 86400000).toISOString(), payout_amount: 260, status: 'approved' },
  { id: 'c4', name: 'Anita R.',  user_id: 'u_004', claim_type: 'parametric_rain',    created_at: new Date(Date.now() - 4 * 86400000).toISOString(), payout_amount: 540, status: 'approved' },
  { id: 'c5', name: 'Suresh M.', user_id: 'u_005', claim_type: 'weather_disruption', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), payout_amount: 390, status: 'under_review' },
  { id: 'c6', name: 'Kavya L.',  user_id: 'u_006', claim_type: 'bandh_closure',      created_at: new Date(Date.now() - 6 * 86400000).toISOString(), payout_amount: 310, status: 'approved' },
];

const MOCK_FLAGGED = [
  { id: 'f1', name: 'Unknown Device #1', zone: 'koramangala', suspicion_reason: 'GPS spoofing — location jumped 40 km in 2 min' },
  { id: 'f2', name: 'Unknown Device #2', zone: 'whitefield',  suspicion_reason: 'Multiple simultaneous sessions from different IPs' },
];

// ─── Login screen ─────────────────────────────────────────────────────────────
function AdminLogin({ onAuth }) {
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!pin.trim()) { setError('Please enter the admin password'); return; }
    setLoading(true);
    // Small artificial delay so it feels like a real auth check
    await new Promise(r => setTimeout(r, 600));
    if (pin === ADMIN_SECRET || pin === 'admin123') {
      sessionStorage.setItem('gs_admin_auth', 'true');
      onAuth();
    } else {
      setError('Invalid admin credentials. Try again.');
      setPin('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#060816] text-white flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mb-4">
            <Lock className="text-orange-400" size={28} />
          </div>
          <h1 className="text-2xl font-black italic">GigShield <span className="text-orange-500">Admin</span></h1>
          <p className="text-sm text-white/40 mt-1">Restricted access — internal use only</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#0d1020] p-6 space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">Admin Password</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter admin password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition"
              autoFocus
            />
          </div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={12} /> {error}
              </motion.p>
            )}
          </AnimatePresence>
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-black py-3 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
          <p className="text-center text-xs text-white/20 pt-1">Demo password: <span className="text-white/40 font-mono">admin123</span></p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main admin dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed]             = useState(() => sessionStorage.getItem('gs_admin_auth') === 'true');
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [adminClaims, setAdminClaims]   = useState([]);
  const [flagged, setFlagged]           = useState([]);
  const [bcr, setBcr]                   = useState(null);
  const [bcrSource, setBcrSource]       = useState('');
  const [lastUpdated, setLastUpdated]   = useState(null);

  const fetchAdmin = useCallback(async () => {
    try {
      const [m, c, f] = await Promise.all([
        adminFetch(`${BACKEND_URL}/api/admin/metrics`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null).catch(() => null),
        adminFetch(`${BACKEND_URL}/api/admin/claims`,  { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null).catch(() => null),
        adminFetch(`${BACKEND_URL}/api/admin/flagged`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      // BCR — try multiple ML endpoints
      let bcrData = null;
      for (const url of [
        `${ML_URL}/api/v1/premium/risk-signal`,
        `${ML_URL}/api/v1/bcr`,
        `${ML_URL}/bcr`,
      ]) {
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (r.ok) { bcrData = await r.json(); setBcrSource('live'); break; }
        } catch (_) {}
      }
      if (!bcrData) { bcrData = MOCK_BCR; setBcrSource('mock'); }

      setAdminMetrics(m || MOCK_METRICS);
      setAdminClaims(Array.isArray(c) && c.length > 0 ? c : MOCK_CLAIMS);
      setFlagged(Array.isArray(f) && f.length > 0 ? f : MOCK_FLAGGED);
      setBcr(bcrData);
      setLastUpdated(new Date());
    } catch (_) {
      setAdminMetrics(MOCK_METRICS);
      setAdminClaims(MOCK_CLAIMS);
      setFlagged(MOCK_FLAGGED);
      setBcr(MOCK_BCR);
      setBcrSource('mock');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchAdmin();
      const t = setInterval(fetchAdmin, 60000); // auto-refresh every 60s
      return () => clearInterval(t);
    }
  }, [authed, fetchAdmin]);

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;

  if (loading) return (
    <div className="min-h-screen bg-[#060816] flex items-center justify-center text-white">
      <Loader2 className="animate-spin mr-3" size={20} /> Loading admin panel...
    </div>
  );

  const bcrValue    = bcr?.stress_test?.final_bcr    ?? bcr?.bcr         ?? 0.65;
  const bcrSignal   = bcr?.stress_test?.bcr_signal   ?? bcr?.risk_signal ?? 'LOW_RISK';
  const bcrDays     = bcr?.stress_test?.days_simulated ?? 14;
  const bcrScenario = bcr?.stress_test?.scenario     ?? 'Monsoon Stress Test';
  const bcrOk       = Number(bcrValue) <= 0.65;

  return (
    <div className="min-h-screen bg-[#060816] text-white">

      {/* Header */}
      <header className="border-b border-white/5 px-5 md:px-8 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Shield size={14} className="text-orange-400" />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">GigShield · Internal Only</p>
          </div>
          <h1 className="text-lg font-black italic">ADMIN <span className="text-orange-500">DASHBOARD</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="hidden md:block text-xs text-white/25 font-bold">
              Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-300 text-xs font-bold uppercase">
            <ShieldAlert size={12} /> Admin Only
          </div>
          <button onClick={() => { setRefreshing(true); fetchAdmin(); }} disabled={refreshing}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
            title="Refresh data">
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
          </button>
          <button
            onClick={() => { sessionStorage.removeItem('gs_admin_auth'); setAuthed(false); }}
            className="px-3 py-2 rounded-xl border border-white/10 text-white/40 text-xs hover:text-white/60 hover:border-white/20 transition">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 py-8 space-y-6">

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Workers"  value={Number(adminMetrics?.total_workers || 0).toLocaleString('en-IN')}  icon={<Users size={16} className="text-blue-400" />} />
          <StatCard label="SS Eligible"    value={Number(adminMetrics?.eligible_workers || 0).toLocaleString('en-IN')} icon={<BadgeCheck size={16} className="text-green-400" />} accent="text-green-400" />
          <StatCard label="Flagged"        value={adminMetrics?.flagged_workers || 0}                                   icon={<ShieldAlert size={16} className="text-red-400" />} accent="text-red-400" />
          <StatCard label="Total Payouts"  value={`₹${Number(adminMetrics?.total_payout || 0).toLocaleString('en-IN')}`} icon={<IndianRupee size={16} className="text-orange-400" />} accent="text-orange-400" />
        </div>

        {/* BCR Panel */}
        <div className="rounded-3xl border border-white/10 bg-[#0d1020] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Benefit-Cost Ratio (BCR)</p>
              <p className="text-sm text-white/50 mt-1">{bcrScenario} · Target BCR ≤ 0.65</p>
            </div>
            <div className="flex items-center gap-2">
              {bcrSource === 'mock' && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-bold uppercase border border-yellow-500/20">
                  Demo Data
                </span>
              )}
              {bcrSource === 'live' && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-bold uppercase border border-green-500/20">
                  Live
                </span>
              )}
              <TrendingUp size={20} className="text-orange-400" />
            </div>
          </div>

          {/* BCR KPI row */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="rounded-xl border border-white/5 bg-white/3 p-4 text-center">
              <p className={`text-3xl font-black ${bcrOk ? 'text-green-400' : 'text-red-400'}`}>
                {Number(bcrValue).toFixed(2)}
              </p>
              <p className="text-xs text-white/40 font-bold mt-1 uppercase">Final BCR</p>
              <p className={`text-[10px] mt-1 font-bold ${bcrOk ? 'text-green-400' : 'text-red-400'}`}>
                {bcrOk ? '✓ Within Target' : '⚠ Above Target'}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/3 p-4 text-center">
              <p className={`text-xl font-black ${bcrSignal === 'LOW_RISK' ? 'text-green-400' : 'text-yellow-400'}`}>
                {bcrSignal.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-white/40 font-bold mt-1 uppercase">Risk Signal</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/3 p-4 text-center">
              <p className="text-2xl font-black text-blue-400">{bcrDays}</p>
              <p className="text-xs text-white/40 font-bold mt-1 uppercase">Days Simulated</p>
            </div>
          </div>

          {/* Financial breakdown */}
          {bcr?.stress_test && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Premium Collected', value: `₹${Number(bcr.stress_test.total_premium_collected || 0).toLocaleString('en-IN')}`, color: 'text-white' },
                { label: 'Payouts Issued',    value: `₹${Number(bcr.stress_test.total_payouts_issued || 0).toLocaleString('en-IN')}`,    color: 'text-orange-400' },
                { label: 'Disruption Days',   value: bcr.stress_test.disruption_days ?? '—',  color: 'text-yellow-400' },
                { label: 'Surplus',           value: `₹${Number((bcr.stress_test.total_premium_collected || 0) - (bcr.stress_test.total_payouts_issued || 0)).toLocaleString('en-IN')}`, color: 'text-green-400' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-white/5 bg-white/3 p-3">
                  <p className="text-xs text-white/30 font-bold uppercase mb-1">{item.label}</p>
                  <p className={`text-base font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* BCR gauge */}
          <div>
            <div className="flex justify-between text-xs text-white/40 font-bold mb-2">
              <span>BCR Gauge</span>
              <span className={bcrOk ? 'text-green-400' : 'text-red-400'}>
                Threshold: 0.65 — {bcrOk ? 'Healthy' : 'Needs Attention'}
              </span>
            </div>
            <div className="relative w-full bg-white/5 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-700 ${bcrOk ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}
                style={{ width: `${Math.min(100, Number(bcrValue) * 100)}%` }}
              />
              {/* Target marker */}
              <div className="absolute top-0 h-4 w-0.5 bg-white/60" style={{ left: '65%' }} />
            </div>
            <div className="flex justify-between text-xs text-white/20 mt-1">
              <span>0.0</span><span className="text-white/40">↑ 0.65</span><span>1.0</span>
            </div>
          </div>
        </div>

        {/* Recent Claims & Payouts */}
        <div className="rounded-3xl border border-white/10 bg-[#0d1020] p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Recent Claims &amp; Payouts</p>
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/30 font-bold uppercase border border-white/10">
              {adminClaims.length} Records
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {adminClaims.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{c.name || c.user_id}</p>
                  <p className="text-xs text-white/30 capitalize">
                    {(c.claim_type || '').replace(/_/g, ' ')} · {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-black text-green-400">₹{Number(c.payout_amount || 0).toLocaleString('en-IN')}</p>
                  <p className={`text-xs font-bold uppercase ${c.status === 'approved' ? 'text-green-400' : c.status === 'under_review' ? 'text-yellow-400' : 'text-white/30'}`}>
                    {c.status === 'under_review' ? '⏳ Under Review' : c.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flagged / Fraud Queue */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400/70 mb-4 flex items-center gap-2">
            <ShieldAlert size={14} /> Fraud Review Queue ({flagged.length})
          </p>
          {flagged.length === 0 ? (
            <div className="flex items-center gap-3 text-sm text-white/30 py-3">
              <CheckCircle2 size={16} className="text-green-400" /> No flagged users — all clear.
            </div>
          ) : (
            <div className="space-y-2">
              {flagged.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold">{u.name || u.id}</p>
                    <p className="text-xs text-red-300/60">{u.suspicion_reason}</p>
                  </div>
                  <p className="text-xs text-white/30 shrink-0 ml-4">{String(u.zone || '').replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/15 font-bold pb-4">
          GigShield Admin · Internal use only · Do not share this URL
        </p>

      </main>
    </div>
  );
}

function StatCard({ label, value, icon, accent = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#101223] p-5">
      <div className="flex items-center justify-between mb-3">
        {icon}
        <ChevronRight size={14} className="text-white/10" />
      </div>
      <p className={`text-2xl font-black ${accent}`}>{value}</p>
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/30 mt-1">{label}</p>
    </div>
  );
}
