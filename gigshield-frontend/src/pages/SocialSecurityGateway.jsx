import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Zap, CheckCircle2 } from 'lucide-react';

export default function SocialSecurityGateway({ userData }) {
  const { name, days_worked_count, platformMode, ss_eligible } = userData;
  const targetDays = platformMode === 'single' ? 90 : 120;
  const progressPercent = Math.min((days_worked_count / targetDays) * 100, 100);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-[#161622] rounded-3xl p-6 border border-white/5">
        <h3 className="text-gray-400 text-[10px] font-black uppercase">Work Engagement Ledger</h3>
        <p className="text-white text-xl font-black italic">{name}'s Gateway</p>
        <div className="h-4 w-full bg-gray-800 rounded-full mt-4 p-1">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-orange-500 rounded-full" />
        </div>
      </div>

      <motion.div animate={{ backgroundColor: ss_eligible ? "rgba(79, 70, 229, 0.1)" : "#1f1f2e" }} className="rounded-3xl p-8 border-2">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-500 flex items-center justify-center rounded-xl">
            {ss_eligible ? <Unlock /> : <Lock />}
          </div>
          <p className="text-white font-black text-lg">Social Security {ss_eligible ? 'Active' : 'Locked'}</p>
        </div>
        <button disabled={!ss_eligible} className={`w-full py-4 rounded-xl font-bold uppercase ${ss_eligible ? 'bg-indigo-600' : 'bg-gray-800'}`}>
          {ss_eligible ? "Claim Payout" : `${targetDays - days_worked_count} Days Remaining`}
        </button>
      </motion.div>
    </div>
  );
}