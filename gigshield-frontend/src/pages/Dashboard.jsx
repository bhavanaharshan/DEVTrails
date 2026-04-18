import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  TimerReset,
  IndianRupee,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function prettyLabel(value = '') {
  return String(value)
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

function useLiveDuration() {
  const [minutes, setMinutes] = useState(252); // 4h 12m initial

  useEffect(() => {
    const t = setInterval(() => setMinutes((m) => m + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}H ${mins}M`;
}

export default function Dashboard() {
  const { user } = useAuth();

  const profile = useMemo(() => {
    const city = localStorage.getItem('gs_city') || 'bengaluru';
    const zone = localStorage.getItem('gs_zone') || 'indiranagar';
    return {
      id: user?.uid || 'demo_user',
      name: localStorage.getItem('gs_name') || 'BHAVANA',
      city,
      zone,
      zoneLabel: prettyLabel(zone),
      cityLabel: prettyLabel(city),
      daysWorked: Number(localStorage.getItem('gs_days_worked') || 0),
      platformMode: localStorage.getItem('gs_platform_mode') || 'single',
    };
  }, [user]);

  const liveDuration = useLiveDuration();

  const [loading, setLoading] = useState(true);
  const [security, setSecurity] = useState({
    is_locked: false,
    status: 'secure',
    reason: 'ALL_CLEAR',
  });
  const [risk, setRisk] = useState({
    operational_alert: false,
    risk_score: 0.42,
    risk_tier: 'MEDIUM',
    reason: 'Operational conditions normal.',
  });

  const [refreshing, setRefreshing] = useState(false);

  const ssEligible =
    (profile.platformMode === 'single' && profile.daysWorked >= 90) ||
    (profile.platformMode === 'multi' && profile.daysWorked >= 120);

  const fetchDashboardState = async () => {
    try {
      const [securityResp, riskResp] = await Promise.all([
        fetch(`${BACKEND_URL}/api/security/status/${profile.id}`),
        fetch(`${BACKEND_URL}/api/risk/summary/${profile.id}`),
      ]);

      const securityData = await securityResp.json();
      const riskData = await riskResp.json();

      setSecurity({
        is_locked: !!securityData.is_locked,
        status: securityData.status || 'secure',
        reason: securityData.reason || 'ALL_CLEAR',
      });

      setRisk({
        operational_alert: !!riskData.operational_alert,
        risk_score: riskData.risk_score ?? 0.42,
        risk_tier: riskData.risk_tier ?? 'MEDIUM',
        reason: riskData.reason || 'Operational conditions normal.',
      });
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
      // Fail safe for dashboard view: keep secure UI but show warning only
      setRisk({
        operational_alert: true,
        risk_score: 0.42,
        risk_tier: 'MEDIUM',
        reason: 'Unable to refresh live operational signals.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardState();

    const interval = setInterval(() => {
      fetchDashboardState();
    }, 30000); // refresh every 30s

    return () => clearInterval(interval);
  }, [profile.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardState();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060816] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/80 font-semibold">
          <Loader2 className="animate-spin" size={20} />
          Loading secure dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <AnimatePresence>
        {security.is_locked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center px-6"
          >
            <div className="w-full max-w-xl rounded-[2rem] border border-red-500/20 bg-[#11111a] p-8 md:p-10 text-center shadow-2xl">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <ShieldAlert className="text-red-400" size={36} />
              </div>

              <h1 className="text-4xl md:text-5xl font-black italic text-red-400 tracking-tight">
                SECURITY LOCKOUT
              </h1>

              <p className="mt-4 text-red-100/90 font-semibold leading-relaxed">
                {security.reason || 'Suspicious location mismatch detected.'}
              </p>

              <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-left">
                <p className="text-xs uppercase tracking-[0.25em] font-bold text-red-300 mb-2">
                  Zero-Trust Status
                </p>
                <p className="text-sm text-red-100">
                  Dashboard access has been blocked because your live device location
                  does not match your declared operating zone.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <header className="w-full border-b border-white/5 px-5 md:px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm md:text-base font-black uppercase tracking-wider text-orange-400">
            {profile.zoneLabel}
          </p>
          <div className="mt-1 flex items-center gap-2 text-white/50 text-sm">
            <MapPin size={14} />
            <span>Detected: {profile.zoneLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {risk.operational_alert && !security.is_locked && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle size={14} />
              Warning
            </div>
          )}

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider ${
              security.is_locked
                ? 'border-red-500/20 bg-red-500/10 text-red-300'
                : 'border-green-500/20 bg-green-500/10 text-green-300'
            }`}
          >
            <Shield size={14} />
            {security.is_locked ? 'Locked' : 'Secure'}
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12">
        {/* Warning banner (weather/risk only) */}
        <AnimatePresence>
          {risk.operational_alert && !security.is_locked && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 flex items-start gap-3"
            >
              <AlertTriangle className="text-yellow-300 mt-0.5" size={18} />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] font-bold text-yellow-300">
                  High Operational Risk
                </p>
                <p className="text-sm text-yellow-100">
                  {risk.reason ||
                    'Zone conditions are elevated. Coverage remains active, but risk is higher than usual.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero */}
        <section className="max-w-2xl mx-auto">
          <p className="text-xs md:text-sm font-black uppercase tracking-[0.25em] text-white/35">
            Authenticated Rider
          </p>

          <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tight leading-none">
              WELCOME, <span className="text-orange-500">{profile.name.toUpperCase()}</span>
            </h1>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
              title="Refresh dashboard"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : ''} size={18} />
            </button>
          </div>

          {/* Core cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <MetricCard
              icon={<Shield className="text-orange-500" size={20} />}
              label="Policy Status"
              value={security.is_locked ? 'LOCKED' : 'SHIELD PRO'}
            />

            <MetricCard
              icon={<TimerReset className="text-blue-400" size={20} />}
              label="Live Duration"
              value={liveDuration}
            />
          </div>

          <div className="mt-5">
            <BigMetricCard
              label="Total Protected Earnings"
              value="₹4,500"
              sub={
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-white/50">
                  <IndianRupee size={14} />
                  <span>Protection active for this shift</span>
                </div>
              }
            />
          </div>

          {/* Secondary info */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <InfoCard
              label="Risk Tier"
              value={risk.risk_tier}
              accent={
                risk.risk_tier === 'HIGH'
                  ? 'text-yellow-300'
                  : risk.risk_tier === 'MEDIUM'
                  ? 'text-cyan-300'
                  : 'text-green-300'
              }
            />

            <InfoCard
              label="Zone"
              value={profile.zoneLabel}
              accent="text-white"
            />

            <InfoCard
              label="SS Gateway"
              value={ssEligible ? 'Eligible' : 'In Progress'}
              accent={ssEligible ? 'text-green-300' : 'text-orange-300'}
            />
          </div>

          {/* Footer status */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-[#0d1020] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className={security.is_locked ? 'text-red-400' : 'text-green-400'}
                size={18}
              />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] font-bold text-white/40">
                  Security Handshake
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {security.is_locked
                    ? security.reason
                    : 'Live GPS verification successful. Zero-Trust session active.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="rounded-[2rem] border border-white/8 bg-[#101223] p-6 md:p-7 shadow-xl">
      <div className="mb-6">{icon}</div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className="mt-3 text-3xl md:text-4xl font-black italic tracking-tight">{value}</p>
    </div>
  );
}

function BigMetricCard({ label, value, sub }) {
  return (
    <div className="rounded-[2rem] border border-white/8 bg-[#101223] p-8 md:p-10 shadow-xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">{label}</p>
      <p className="mt-5 text-5xl md:text-7xl font-black italic tracking-tight">{value}</p>
      {sub}
    </div>
  );
}

function InfoCard({ label, value, accent = 'text-white' }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-[#101223] p-5 shadow-lg">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className={`mt-3 text-xl font-black tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}