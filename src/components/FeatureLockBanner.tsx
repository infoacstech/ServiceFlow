import React from 'react';
import { Lock, Sparkles, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { FeatureKey, getFeatureRequirement } from '../utils/planUtils';

interface FeatureLockBannerProps {
  feature: FeatureKey;
  onUpgradeClick: () => void;
  inline?: boolean;
}

export const FeatureLockBanner: React.FC<FeatureLockBannerProps> = ({
  feature,
  onUpgradeClick,
  inline = false,
}) => {
  const req = getFeatureRequirement(feature);

  if (inline) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-xs text-amber-950 dark:text-amber-100">
              {req.title}
            </h5>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Requires {req.requiredPlan} plan.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onUpgradeClick}
          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Unlock Feature</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/40 shadow-xl text-center space-y-6 max-w-2xl mx-auto my-8 animate-in fade-in">
      <div className="w-16 h-16 rounded-3xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
        <Lock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-xs uppercase tracking-wider border border-indigo-400/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{req.requiredPlan} Tier Feature</span>
        </div>
        <h3 className="text-2xl font-black tracking-tight">{req.title}</h3>
        <p className="text-xs sm:text-sm text-indigo-200/80 max-w-lg mx-auto leading-relaxed">
          {req.description}
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onUpgradeClick}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 mx-auto shadow-lg shadow-indigo-600/40 transition-all cursor-pointer"
        >
          <span>Upgrade to {req.requiredPlan} Plan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
