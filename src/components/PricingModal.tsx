import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  X,
  CreditCard,
  Headphones,
  CheckCircle2,
  Flame,
  Users,
  Briefcase,
} from 'lucide-react';
import { Plan } from '../types';
import { calculateAnnualPricing, PLANS } from '../utils/planUtils';
import { playCustomVoiceNotification, playNotificationChime } from '../utils/audioNotification';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSelected?: (planId: string) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onPlanSelected,
}) => {
  const { currentBusiness, updateBusinessProfile, showToast } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen) return null;

  const currentPlanId = currentBusiness?.planId || 'plan-starter';

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === currentPlanId) return;

    setIsUpgrading(true);
    setTimeout(() => {
      updateBusinessProfile({
        planId: plan.id,
        plan: plan.name,
      });
      setIsUpgrading(false);
      playNotificationChime();
      playCustomVoiceNotification(`Plan updated to ${plan.name} successfully.`);
      showToast(
        `Subscription upgraded to ${plan.name} Plan (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})!`,
        'success'
      );
      if (onPlanSelected) onPlanSelected(plan.id);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative flex-shrink-0 border-b border-indigo-900/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ServiFlow Subscription Plans</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Simple, Transparent Plans for Service Teams
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1">
              From enquiry capture to field job dispatch, tracking, and completion.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="mt-5 flex items-center justify-center sm:justify-start">
            <div className="inline-flex p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white text-emerald-950 font-black tracking-wide">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Cards Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {PLANS.map((plan) => {
              const isCurrent =
                currentPlanId === plan.id ||
                currentBusiness?.plan?.toLowerCase() === plan.name.toLowerCase();
              const isPro = plan.id === 'plan-pro';
              const annualInfo = calculateAnnualPricing(plan.price);

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl border-2 transition-all relative flex flex-col p-5 sm:p-6 ${
                    isPro
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xl shadow-indigo-600/10'
                      : isCurrent
                      ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                  }`}
                >
                  {/* Badge */}
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 bg-indigo-600 text-white shadow-indigo-600/40">
                      <Flame className="w-3 h-3 text-amber-300" />
                      <span>MOST POPULAR</span>
                    </div>
                  )}

                  {/* Plan Name & Target Audience */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                          CURRENT PLAN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {plan.targetAudience}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    {billingCycle === 'monthly' ? (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {plan.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            / month
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Billed monthly, cancel anytime
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {annualInfo.discountedAnnual.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            / year
                          </span>
                          <span className="text-xs line-through text-slate-400 font-medium ml-1">
                            ₹{annualInfo.originalAnnual.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <span>Billed annually (Save 20% • ₹{annualInfo.savings.toLocaleString('en-IN')})</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommended Operational Limits */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-center flex flex-col justify-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-1 mb-0.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>Staff Limit</span>
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        Up to {plan.maxStaff} {plan.maxStaff === 1 ? 'tech' : 'techs'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-center flex flex-col justify-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-center gap-1 mb-0.5">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        <span>Job Limit</span>
                      </div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        Up to {plan.maxJobs.toLocaleString('en-IN')} jobs/mo
                      </div>
                    </div>
                  </div>

                  {/* Core Features List */}
                  <div className="space-y-2 flex-1 mb-6 text-xs text-slate-700 dark:text-slate-300">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Core Features:
                    </div>
                    {plan.features.map((feat, idx) => {
                      const isHeader = feat.startsWith('Everything in');
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 ${
                            isHeader
                              ? 'font-bold text-indigo-700 dark:text-indigo-300 pb-0.5'
                              : ''
                          }`}
                        >
                          {!isHeader && (
                            <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <span className="leading-snug">{feat}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA Action Button */}
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-4 rounded-2xl font-extrabold text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2 cursor-default"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Current Plan</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isUpgrading}
                      className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        isPro
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900'
                      }`}
                    >
                      <span>Choose {plan.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Guarantee & Trust Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-semibold">14-Day Money Back Guarantee</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 justify-center">
              <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-semibold">GST Invoice & Tax Input Included</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 justify-center">
              <Headphones className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="font-semibold">Free Hindi & English Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
