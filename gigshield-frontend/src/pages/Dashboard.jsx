import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldAlert, AlertTriangle, MapPin, TimerReset,
  IndianRupee, Loader2, RefreshCw, CheckCircle2, WifiOff,
  BadgeCheck, MessageSquare, Navigation, ArrowRight, Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const ML_URL      = import.meta.env.VITE_ML_URL      || 'http://localhost:8000';

function prettyLabel(value = '') {
  return String(value).split('_').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : '')).join(' ');
}

function useLiveDuration() {
  const [minutes, setMinutes] = useState(252);
  useEffect(() => {
    const t = setInterval(() => setMinutes((m) => m + 1), 60000);
    return () => clearInterval(t);
  }, []);
  return `${Math.floor(minutes / 60)}H ${minutes % 60}M`;
}

const DEMO_CLAIMS = [
  { id: 'demo_1', claim_type: 'weather_disruption', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), payout_amount: 480, status: 'approved' },
  { id: 'demo_2', claim_type: 'bandh_closure',      created_at: new Date(Date.now() - 5 * 86400000).toISOString(), payout_amount: 320, status: 'approved' },
  { id: 'demo_3', claim_type: 'aqi_lockout',        created_at: new Date(Date.now() - 9 * 86400000).toISOString(), payout_amount: 260, status: 'under_review' },
  { id: 'demo_4', claim_type: 'parametric_rain',    created_at: new Date(Date.now() - 14 * 86400000).toISOString(), payout_amount: 540, status: 'approved' },
];

const ROUTE_SCENARIO = {
  reason: 'Heavy waterlogging on NH-44 near Silk Board. Avg delay: 47 min.',
  suggestedRoute: 'Via Hosur Rd → Bommasandra → Electronic City Phase 2',
  estimatedSaving: '₹120 extra earnings in low-congestion zone',
};

export default function Dashboard() {
  const { user } = useAuth();

  const profile = useMemo(() => {
    const city = localStorage.getItem('gs_city') || 'bengaluru';
    const zone = localStorage.getItem('gs_zone') || 'indiranagar';
    return {
      id:           user?.uid || 'demo_user',
      name:         localStorage.getItem('gs_name') || 'RIDER',
      city, zone,
      zoneLabel:    prettyLabel(zone),
      cityLabel:    prettyLabel(city),
      weeklyIncome: Number(localStorage.getItem('gs_weekly_income') || 4500),
      daysWorked:   Number(localStorage.getItem('gs_days_worked')   || 0),
      platformMode: localStorage.getItem('gs_platform_mode')        || 'single',
      lat:          parseFloat(localStorage.getItem('gs_lat'))      || null,
      lng:          parseFloat(localStorage.getItem('gs_lng'))      || null,
    };
  }, [user]);

  const liveDuration = useLiveDuration();
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [security, setSecurity]           = useState({ is_locked: false, status: 'secure', reason: 'ALL_CLEAR' });
  const [risk, setRisk]                   = useState({ operational_alert: false, risk_score: 0.42, risk_tier: 'MEDIUM', reason: 'Operational conditions normal.' });
  const [claims, setClaims]               = useState(DEMO_CLAIMS);
  const [ssStatus, setSsStatus]           = useState({ days: profile.daysWorked, mode: profile.platformMode, eligible: false });
  const [offlineMode, setOfflineMode]     = useState(false);
  const [sosTriggered, setSosTriggered]   = useState(false);
  const [sosError, setSosError]           = useState('');
  const [routeDismissed, setRouteDismissed] = useState(false);
  const [showRouteBanner, setShowRouteBanner] = useState(false);

  const ssTarget   = ssStatus.mode === 'multi' ? 120 : 90;
  const ssProgress = Math.min(100, Math.round((ssStatus.days / ssTarget) * 100));
  const ssEligible = ssStatus.eligible || ssStatus.days >= ssTarget;

  useEffect(() => {
    const up = () => setOfflineMode(false);
    const dn = () => setOfflineMode(true);
    window.addEventListener('online', up);
    window.addEventListener('offline', dn);
    setOfflineMode(!navigator.onLine);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', dn); };
  }, []);

  // Show route banner after 8 seconds (demo)
  useEffect(() => {
    if (routeDismissed) return;
    const t = setTimeout(() => setShowRouteBanner(true), 8000);
    return () => clearTimeout(t);
  }, [routeDismissed]);

  const triggerOfflineSOS = useCallback(() => {
    const lat = profile.lat || 12.9716;
    const lng = profile.lng || 77.5946;
    const msg = `SOS GigShield: ${profile.name} at ${lat.toFixed(5)},${lng.toFixed(5)} needs emergency payout`;
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const sep = /iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?';
      window.location.href = `sms:+911234567890${sep}body=${encodeURIComponent(msg)}`;
      setSosTriggered(true);
      setSosError('');
    } catch {
      setSosError('Could not open SMS app — please manually SMS +91 1234567890');
    }
    if (navigator.share) navigator.share({ title: 'GigShield SOS', text: msg }).catch(() => {});
    setSosTriggered(true);
  }, [profile]);

  const triggerDemoSOS = useCallback(() => {
    setSosTriggered(true);
    setSosError('');
    alert(`SOS Demo Triggered!\n\nIn production this SMS would be sent:\n"SOS GigShield: ${profile.name} at 12.97165,77.59460 needs emergency payout"\nTo: +91 1234567890`);
  }, [profile]);

  const fetchSecurityStatus = useCallback(async () => {
    let lat = profile.lat, lng = profile.lng;
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch (_) {}
    const params = new URLSearchParams({ city: profile.city, zone: profile.zone });
    if (lat) params.set('lat', String(lat));
    if (lng) params.set('lon', String(lng));
    try { const r = await fetch(`${BACKEND_URL}/api/security/status/${profile.id}?${params}`, { signal: AbortSignal.timeout(4000) }); if (r.ok) return r.json(); } catch (_) {}
    try { const r = await fetch(`${ML_URL}/api/v1/premium/security/status/${profile.id}?${params}`, { signal: AbortSignal.timeout(5000) }); if (r.ok) return r.json(); } catch (_) {}
    return { is_locked: false, status: 'secure', reason: 'ALL_CLEAR' };
  }, [profile]);

  const fetchRisk = useCallback(async () => {
    try { const r = await fetch(`${BACKEND_URL}/api/risk/summary/${profile.id}?city=${profile.city}`, { signal: AbortSignal.timeout(4000) }); if (r.ok) return r.json(); } catch (_) {}
    try { const r = await fetch(`${ML_URL}/api/v1/premium/risk/summary/${profile.id}?city=${profile.city}`, { signal: AbortSignal.timeout(5000) }); if (r.ok) return r.json(); } catch (_) {}
    return { operational_alert: false, risk_score: 0.42, risk_tier: 'MEDIUM', reason: 'Operational conditions normal.' };
  }, [profile]);

  const fetchDashboard = useCallback(async () => {
    try {
      const [sec, rsk, cls, ss] = await Promise.all([
        fetchSecurityStatus(),
        fetchRisk(),
        fetch(`${BACKEND_URL}/api/claims/history/${profile.id}`, { signal: AbortSignal.timeout(4000) }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${BACKEND_URL}/api/user/ss-status/${profile.id}`, { signal: AbortSignal.timeout(4000) }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setSecurity({ is_locked: !!sec.is_locked, status: sec.status || 'secure', reason: sec.reason || 'ALL_CLEAR' });
      setRisk({ operational_alert: !!rsk.operational_alert, risk_score: rsk.risk_score ?? 0.42, risk_tier: rsk.risk_tier ?? 'MEDIUM', reason: rsk.reason || 'Operational conditions normal.' });
      const liveClaims = Array.isArray(cls) ? cls : null;
      if (liveClaims && liveClaims.length > 0) setClaims(liveClaims);
      else setClaims(DEMO_CLAIMS);
      if (ss) setSsStatus(ss);
    } catch (e) {
      console.error('Dashboard fetch:', e);
      setClaims(DEMO_CLAIMS);
    } finally { setLoading(false); setRefreshing(false); }
  }, [fetchSecurityStatus, fetchRisk, profile.id]);

  useEffect(() => { fetchDashboard(); const t = setInterval(fetchDashboard, 30000); return () => clearInterval(t); }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#060816] flex items-center justify-center text-white">
      <Loader2 className="animate-spin mr-3" size={20} /> Loading secure dashboard...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060816] text-white">

      {/* Offline SOS Banner */}
      <AnimatePresence>
        {offlineMode && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 inset-x-0 z-[200] bg-red-600 px-5 py-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-bold"><WifiOff size={16} /> OFFLINE — Network lost</span>
            <button onClick={triggerOfflineSOS} className="bg-white text-red-600 text-xs font-black px-3 py-1.5 rounded-full uppercase">
              {sosTriggered ? '✓ SOS Sent' : 'SOS SMS →'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Route Change Toast */}
      <AnimatePresence>
        {showRouteBanner && !routeDismissed && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 inset-x-4 z-[150] max-w-lg mx-auto">
            <div className="rounded-2xl border border-yellow-500/30 bg-[#1a1500] shadow-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <Navigation size={16} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">Route Change Suggested</p>
                  <p className="text-sm text-yellow-100 mt-1">{ROUTE_SCENARIO.reason}</p>
                </div>
              </div>
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 mb-3">
                <p className="text-xs font-bold text-yellow-300 mb-1">Recommended Alternate</p>
                <p className="text-sm text-white font-semibold flex items-center gap-2">
                  <ArrowRight size={14} className="text-yellow-400 shrink-0" />
                  {ROUTE_SCENARIO.suggestedRoute}
                </p>
                <p className="text-xs text-green-400 mt-2 font-bold">{ROUTE_SCENARIO.estimatedSaving}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setRouteDismissed(true); setShowRouteBanner(false); }}
                  className="flex-1 bg-yellow-500 text-black text-xs font-black py-2.5 rounded-xl uppercase">
                  Got It — Changing Route
                </button>
                <button onClick={() => { setRouteDismissed(true); setShowRouteBanner(false); }}
                  className="px-4 text-xs text-white/40 hover:text-white/70 transition">Dismiss</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Lockout */}
      <AnimatePresence>
        {security.is_locked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center px-6">
            <div className="w-full max-w-xl rounded-[2rem] border border-red-500/20 bg-[#11111a] p-10 text-center shadow-2xl">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <ShieldAlert className="text-red-400" size={36} />
              </div>
              <h1 className="text-5xl font-black italic text-red-400">SECURITY LOCKOUT</h1>
              <p className="mt-4 text-red-100/90 font-semibold">{security.reason}</p>
              <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-left text-sm text-red-100">
                Your live GPS does not match your declared zone. Re-onboard from your actual area to restore access.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-white/5 px-5 md:px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-orange-400">{profile.zoneLabel}</p>
          <p className="mt-1 flex items-center gap-2 text-white/50 text-sm"><MapPin size={14} />{profile.cityLabel} · {profile.zoneLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase ${security.is_locked ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-green-500/20 bg-green-500/10 text-green-300'}`}>
            <Shield size={14} />{security.is_locked ? 'Locked' : 'Secure'}
          </div>
          <button onClick={() => { setRefreshing(true); fetchDashboard(); }} disabled={refreshing}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 py-8">
        <WorkerView
          profile={profile} risk={risk} security={security} liveDuration={liveDuration}
          ssStatus={ssStatus} ssEligible={ssEligible} ssProgress={ssProgress} ssTarget={ssTarget}
          claims={claims} offlineMode={offlineMode} triggerOfflineSOS={triggerOfflineSOS}
          triggerDemoSOS={triggerDemoSOS} sosTriggered={sosTriggered} sosError={sosError}
          routeDismissed={routeDismissed} setRouteDismissed={setRouteDismissed}
          setShowRouteBanner={setShowRouteBanner}
        />
      </main>
    </div>
  );
}

function WorkerView({ profile, risk, security, liveDuration, ssStatus, ssEligible, ssProgress, ssTarget, claims, offlineMode, triggerOfflineSOS, triggerDemoSOS, sosTriggered, sosError, routeDismissed, setRouteDismissed, setShowRouteBanner }) {
  return (
    <section className="max-w-2xl mx-auto space-y-5">
      <AnimatePresence>
        {risk.operational_alert && !security.is_locked && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 flex gap-3">
            <AlertTriangle className="text-yellow-300 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] font-bold text-yellow-300">High Operational Risk</p>
              <p className="text-sm text-yellow-100 mt-1">{risk.reason}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">Authenticated Rider</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-black italic tracking-tight">
          WELCOME, <span className="text-orange-500">{profile.name.toUpperCase()}</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card label="Policy Status" value={security.is_locked ? 'LOCKED' : 'SHIELD PRO'} icon={<Shield className="text-orange-500" size={18} />} />
        <Card label="Live Duration" value={liveDuration} icon={<TimerReset className="text-blue-400" size={18} />} />
      </div>

      <div className="rounded-[2rem] border border-white/8 bg-[#101223] p-8 text-center shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">Total Protected Earnings</p>
        <p className="mt-4 text-5xl md:text-6xl font-black italic">₹{profile.weeklyIncome.toLocaleString('en-IN')}</p>
        <p className="mt-3 text-sm text-white/40 flex items-center justify-center gap-1"><IndianRupee size={13} />Protection active for this shift</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card label="Risk Tier" value={risk.risk_tier} small accent={risk.risk_tier === 'HIGH' ? 'text-yellow-300' : risk.risk_tier === 'MEDIUM' ? 'text-cyan-300' : 'text-green-300'} />
        <Card label="Zone" value={prettyLabel(profile.zone)} small />
        <Card label="Risk Score" value={`${(risk.risk_score * 100).toFixed(0)}%`} small accent="text-orange-300" />
      </div>

      {/* Smart Route Advisor */}
      <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1020] p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-yellow-400" size={18} />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Smart Route Advisor</p>
          </div>
          {!routeDismissed && <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 font-bold uppercase border border-yellow-500/20">Live Alert</span>}
        </div>
        {routeDismissed ? (
          <div className="flex items-center gap-3 text-sm text-white/40">
            <CheckCircle2 size={16} className="text-green-400" />
            Route acknowledged. Monitoring for new disruptions.
          </div>
        ) : (
          <>
            <p className="text-sm text-white/70 mb-3">{ROUTE_SCENARIO.reason}</p>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 mb-3">
              <p className="text-xs font-bold text-yellow-300 mb-1">Suggested Alternate</p>
              <p className="text-sm text-white font-semibold flex items-center gap-2">
                <ArrowRight size={14} className="text-yellow-400 shrink-0" />{ROUTE_SCENARIO.suggestedRoute}
              </p>
              <p className="text-xs text-green-400 mt-1 font-bold">{ROUTE_SCENARIO.estimatedSaving}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setRouteDismissed(true); setShowRouteBanner(false); }}
                className="flex-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-black py-2.5 rounded-xl uppercase tracking-wider hover:bg-yellow-500/30 transition">
                Acknowledge &amp; Change Route
              </button>
              <button onClick={() => setShowRouteBanner(true)}
                className="px-3 border border-white/10 text-white/30 text-xs rounded-xl hover:text-white/60 transition" title="Show popup banner">
                ↗
              </button>
            </div>
          </>
        )}
      </div>

      {/* Social Security Progress */}
      <div className="rounded-3xl border border-white/10 bg-[#0d1020] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BadgeCheck className={ssEligible ? 'text-green-400' : 'text-white/20'} size={20} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Social Security Gateway</p>
              <p className="text-sm font-bold mt-0.5">{ssEligible ? '✓ VERIFIED — Benefits Unlocked' : `${ssStatus.days} / ${ssTarget} days worked`}</p>
            </div>
          </div>
          <span className={`text-[11px] font-black px-3 py-1.5 rounded-full uppercase border ${ssEligible ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-white/5 text-white/30 border-white/10'}`}>
            {ssStatus.mode === 'multi' ? '120-Day' : '90-Day'}
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3 mb-2">
          <div className={`h-3 rounded-full transition-all duration-700 ${ssEligible ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${ssProgress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-white/25 font-bold mt-1">
          <span>Day 0</span>
          <span className={ssEligible ? 'text-green-400' : 'text-orange-400'}>{ssProgress}% Complete</span>
          <span>Day {ssTarget}</span>
        </div>
        {ssEligible && (
          <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-200">
            🎉 Eligible for government social security. Your GigShield profile is verification-ready.
          </div>
        )}
      </div>

      {/* Claims & Payout History */}
      <div className="rounded-3xl border border-white/10 bg-[#0d1020] p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Claims &amp; Payout History</p>
          <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold uppercase border border-orange-500/20">
            {claims.length} Records
          </span>
        </div>
        <div className="space-y-2">
          {claims.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/3 px-4 py-3">
              <div>
                <p className="text-sm font-bold capitalize">{(c.claim_type || 'parametric').replace(/_/g, ' ')}</p>
                <p className="text-xs text-white/30">{new Date(c.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-green-400">₹{Number(c.payout_amount || 0).toLocaleString('en-IN')}</p>
                <p className={`text-xs font-bold uppercase ${c.status === 'approved' ? 'text-green-400' : c.status === 'under_review' ? 'text-yellow-400' : 'text-white/30'}`}>
                  {c.status === 'under_review' ? '⏳ Under Review' : c.status}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-white/20 font-bold">
          Demo data shown — live claims load from backend automatically
        </p>
      </div>

      {/* Offline SOS */}
      <div className={`rounded-3xl border p-6 ${offlineMode ? 'border-red-500/30 bg-red-500/10' : 'border-white/10 bg-[#0d1020]'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${offlineMode ? 'bg-red-500/20' : 'bg-white/5'}`}>
              <MessageSquare className={offlineMode ? 'text-red-400' : 'text-white/30'} size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Offline SOS Protocol</p>
              <p className="text-sm font-bold mt-0.5">
                {offlineMode ? 'NETWORK LOST — Send emergency SOS' : 'Auto-activates on network loss'}
              </p>
            </div>
          </div>
          {offlineMode && (
            <button onClick={triggerOfflineSOS} className="bg-red-500 text-white text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider shrink-0">
              {sosTriggered ? '✓ Sent' : 'Send SOS'}
            </button>
          )}
        </div>
        {sosError && <p className="text-xs text-red-300 mb-2 font-bold">{sosError}</p>}
        <button onClick={triggerDemoSOS}
          className="w-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 text-xs font-bold py-2.5 rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-2">
          <Bell size={12} /> Test SOS Protocol (Demo Simulation)
        </button>
        {sosTriggered && !offlineMode && (
          <p className="text-center text-xs text-green-400 font-bold mt-2">✓ Demo SOS triggered — in production this would SMS your emergency contact</p>
        )}
      </div>

      {/* Zero-Trust Handshake */}
      <div className="rounded-3xl border border-white/10 bg-[#0d1020] p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className={security.is_locked ? 'text-red-400' : 'text-green-400'} size={18} />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-bold text-white/40">Zero-Trust Handshake</p>
            <p className="mt-1 text-sm text-white/70">{security.is_locked ? security.reason : 'Live GPS verified. Zero-Trust session active.'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ label, value, icon, small = false, accent = 'text-white' }) {
  return (
    <div className="rounded-[1.8rem] border border-white/8 bg-[#101223] p-5 shadow-xl">
      {icon && <div className="mb-4">{icon}</div>}
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className={`mt-2 font-black italic tracking-tight ${small ? 'text-xl' : 'text-2xl md:text-3xl'} ${accent}`}>{value}</p>
    </div>
  );
}
