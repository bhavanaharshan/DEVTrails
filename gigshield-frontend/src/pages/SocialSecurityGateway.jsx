import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Unlock, Zap, Timer, CheckCircle2 } from 'lucide-react';

export default function SocialSecurityGateway({ userData }) {
  // Destructure incoming data from Neema's API/Socket
  const { name, days_worked_count, platformMode, ss_eligible } = userData;

  // Calculate thresholds based on the Business Rules Engine
  const targetDays = platformMode === 'single' ? 90 : 120;
  const daysRemaining = Math.max(targetDays - days_worked_count, 0);
  const progressPercent = Math.min((days_worked_count / targetDays) * 100, 100);

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* 1. PROGRESS TRACKER CARD */}
      <div className="bg-[#161622] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Work Engagement Ledger</h3>
              <p className="text-white text-2xl font-black italic tracking-tighter">
                {name}'s <span className="text-orange-500">Gateway</span>
              </p>
            </div>
            <div className="bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest">
                {platformMode === 'multi' ? 'Multi-Apping' : 'Single Platform'}
              </span>
            </div>
          </div>

          {/* Progress Bar with Framer Motion */}
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-gray-500">{days_worked_count} Days Logged</span>
              <span className="text-orange-500">{daysRemaining} Days to go</span>
            </div>
            <div className="h-4 w-full bg-gray-800/50 rounded-full border border-white/5 p-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)]"
              />
            </div>
          </div>
          
          <p className="mt-4 text-[10px] text-gray-500 font-medium leading-relaxed">
            Verified via Zero-Trust Hardware Handshake. Status updates daily at 11:59 PM.
          </p>
        </div>
      </div>

      {/* 2. STATE-BACKED SOCIAL SECURITY CARD (Locked/Unlocked) */}
      <motion.div
        animate={{
          backgroundColor: ss_eligible ? "rgba(79, 70, 229, 0.1)" : "rgba(31, 31, 46, 1)",
          borderColor: ss_eligible ? "rgba(99, 102, 241, 0.4)" : "rgba(255, 255, 255, 0.05)"
        }}
        className={`rounded-3xl p-8 border-2 shadow-2xl transition-all duration-700 relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${
              ss_eligible ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-gray-800 text-gray-600'
            }`}>
              {ss_eligible ? <Unlock size={28} /> : <Lock size={28} />}
            </div>
            <div>
              <h4 className="text-white font-black text-xl tracking-tight">Social Security</h4>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                State Payout Eligibility
              </p>
            </div>
          </div>
          {ss_eligible && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="flex items-center gap-2 bg-green-500/20 text-green-500 px-4 py-2 rounded-xl border border-green-500/30"
            >
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
            <div className="flex justify-between items-center opacity-60">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Available Benefits</span>
              <span className="text-white text-sm font-bold tracking-widest">₹2,50,000</span>
            </div>
          </div>

          <button
            disabled={!ss_eligible}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${
              ss_eligible 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl hover:shadow-indigo-500/20 active:scale-95' 
                : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            {ss_eligible ? <Zap size={18} fill="currentColor" /> : null}
            {ss_eligible ? "Claim Social Payout" : "Threshold Not Met"}
          </button>
        </div>

        {/* Subtle background glow when eligible */}
        {ss_eligible && (
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full" />
        )}
      </motion.div>
    </div>
  );
}