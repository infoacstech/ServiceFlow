import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Check,
  Zap,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowRight,
  X,
  CreditCard,
  Building2,
  Users,
  Wrench,
  Headphones,
  CheckCircle2,
  HelpCircle,
  Clock,
  Smartphone,
  Flame,
  Gift,
  Tag,
  Copy,
} from 'lucide-react';
import { Plan } from '../types';
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
  const { currentBusiness, updateBusinessProfile, plans, currentUser, showToast, validateReferralCode } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Referral Discount State
  const initialReferralCode = currentBusiness?.referredBy || '';
  const [promoCodeInput, setPromoCodeInput] = useState(initialReferralCode);
  const [isReferralDiscountActive, setIsReferralDiscountActive] = useState(
    Boolean(currentBusiness?.referredBy || currentBusiness?.referralDiscountApplied)
  );
  const [referralFeedback, setReferralFeedback] = useState<{
    isValid: boolean;
    message: string;
  } | null>(
    currentBusiness?.referredBy
      ? { isValid: true, message: `10% Referral Discount Active (Referred by: ${currentBusiness.referredBy})` }
      : null
  );

  if (!isOpen) return null;

  const currentPlanId = currentBusiness?.planId || 'plan-starter';

  const handleApplyPromoCode = () => {
    if (!promoCodeInput.trim()) {
      setIsReferralDiscountActive(false);
      setReferralFeedback(null);
      return;
    }
    const val = validateReferralCode(promoCodeInput.trim().toUpperCase());
    if (val.isValid) {
      setIsReferralDiscountActive(true);
      setReferralFeedback({ isValid: true, message: '🎉 10% Referral Discount Applied!' });
      showToast('10% Referral Discount applied to subscription plans!', 'success');
      if (currentBusiness) {
        updateBusinessProfile({
          referredBy: promoCodeInput.trim().toUpperCase(),
          referralDiscountApplied: true,
        });
      }
    } else {
      setIsReferralDiscountActive(false);
      setReferralFeedback({ isValid: false, message: val.message });
      showToast(val.message, 'error');
    }
  };

  const myReferralCode = currentBusiness?.referralCode || currentUser?.referralCode || 'SF-REF10';
  const myReferralLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${myReferralCode}` : `https://serviflow.app?ref=${myReferralCode}`;

  const handleCopyMyReferral = () => {
    navigator.clipboard.writeText(myReferralLink);
    showToast(`Referral Link Copied! (${myReferralCode})`, 'success');
  };

  const ADDONS = [
    {
      id: 'addon-extra-tech',
      name: 'Extra Technician Seat',
      price: billingCycle === 'yearly' ? 1490 : 149,
      unit: billingCycle === 'yearly' ? '/tech/year' : '/tech/month',
      desc: 'Add 1 additional field technician beyond plan limit',
    },
    {
      id: 'addon-whatsapp-pack',
      name: '1,000 WhatsApp / SMS Pack',
      price: 499,
      unit: 'one-time',
      desc: 'Automated invoice & job updates delivered directly to customer WhatsApp',
    },
    {
      id: 'addon-white-label',
      name: 'Custom White-Label App Setup',
      price: 9999,
      unit: 'one-time',
      desc: 'Custom business branding, dedicated domain & branded installer packages',
    },
  ];

  const handleSelectPlan = (plan: Plan) => {
    setIsUpgrading(true);
    setTimeout(() => {
      updateBusinessProfile({
        planId: plan.id,
        referralDiscountApplied: isReferralDiscountActive,
      });
      setIsUpgrading(false);
      playNotificationChime();
      playCustomVoiceNotification(`Plan updated to ${plan.name} successfully.`);
      showToast(`Subscription upgraded to ${plan.name} Plan (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})!`, 'success');
      if (onPlanSelected) onPlanSelected(plan.id);
      onClose();
    }, 600);
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
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
              <span>Transparent & Affordable SaaS Pricing</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Choose the Right Plan for Your Field Service Team
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1">
              Built specifically for CCTV, AC, RO, Electrical, Plumbing & Field Repair agencies. Upgrade or switch anytime.
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
          {/* Referral Promo Code Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Have a Referral Code? Get 10% Extra Discount</span>
                  {isReferralDiscountActive && (
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                      10% Applied
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {referralFeedback ? referralFeedback.message : 'Enter any partner/business referral code to save 10% on your subscription.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. SF-APEX10"
                className="px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase outline-hidden focus:ring-2 focus:ring-amber-500 w-full sm:w-36"
              />
              <button
                type="button"
                onClick={handleApplyPromoCode}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              const isPro = plan.id === 'plan-pro';
              const rawMonthlyPrice =
                billingCycle === 'yearly'
                  ? Math.round((plan.yearlyPrice || plan.price * 10) / 12)
                  : plan.price;
              const rawYearlyTotal = plan.yearlyPrice || plan.price * 10;

              // Apply 10% referral discount if active
              const discountMultiplier = isReferralDiscountActive ? 0.9 : 1.0;
              const price = Math.round(rawMonthlyPrice * discountMultiplier);
              const yearlyTotal = Math.round(rawYearlyTotal * discountMultiplier);

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
                  {plan.badge && (
                    <div
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                        isPro
                          ? 'bg-indigo-600 text-white shadow-indigo-600/40'
                          : 'bg-slate-800 dark:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isPro && <Flame className="w-3 h-3 text-amber-300" />}
                      <span>{plan.badge}</span>
                    </div>
                  )}

                  {/* Plan Name & Target Audience */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                          Current Plan
                        </span>
                      )}
                    </div>
                    {plan.targetAudience && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {plan.targetAudience}
                      </p>
                    )}
                  </div>

                  {/* Pricing Display */}
                  <div className="mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {price.toLocaleString('en-IN')}
                      </span>
                      {isReferralDiscountActive && (
                        <span className="text-sm line-through text-slate-400 font-semibold">
                          ₹{rawMonthlyPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        / month
                      </span>
                    </div>

                    {isReferralDiscountActive && (
                      <div className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3" />
                        <span>10% Referral Discount Active</span>
                      </div>
                    )}

                    {billingCycle === 'yearly' ? (
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        Billed annually: ₹{yearlyTotal.toLocaleString('en-IN')}/yr (2 Months Free)
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Billed monthly, cancel anytime
                      </div>
                    )}
                  </div>

                  {/* Capacity Limits Pills */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Staff Limit</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {plan.maxStaff >= 999 ? 'Unlimited' : `Up to ${plan.maxStaff} Techs`}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Jobs / Month</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {plan.maxJobs >= 9999 ? 'Unlimited' : `${plan.maxJobs} Jobs`}
                      </div>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 flex-1 mb-6 text-xs text-slate-700 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Select / Active Button */}
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isUpgrading}
                    className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      isCurrent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : isPro
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Active Plan (Renew)</span>
                      </>
                    ) : (
                      <>
                        <span>Select {plan.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Refer & Earn 10% Cash Bonus Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-700/50 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1 max-w-lg">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  <Gift className="w-3 h-3" />
                  <span>Referral Partner Program</span>
                </div>
                <h4 className="text-base font-black tracking-tight text-white">
                  Share Your Referral Code & Earn 10% Cash Bonus!
                </h4>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  When other service owners register using your code <span className="text-amber-300 font-mono font-bold">{myReferralCode}</span>, they get <strong className="text-white">10% OFF</strong>, and you earn <strong className="text-emerald-300">10% Referral Bonus</strong> credited instantly to your wallet.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-mono font-bold text-amber-300 text-center">
                  {myReferralCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyMyReferral}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-400/20"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Invite Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Add-ons & Custom Expansion Section */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Optional Add-On Packs & Modules</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scale your operations on demand without switching full subscription tiers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {ADDONS.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold text-xs text-slate-900 dark:text-slate-100 mb-1">
                        <span>{addon.name}</span>
                        <span className="text-indigo-600 dark:text-indigo-400">
                          ₹{addon.price.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">{addon.unit}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {addon.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[11px] font-semibold">
                      <span className={isSelected ? 'text-indigo-600 dark:text-indigo-300 font-bold' : 'text-slate-400'}>
                        {isSelected ? '✓ Added to Cart' : '+ Add Pack'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guarantee & Features Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-semibold">14-Day Money Back Guarantee</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 justify-center">
              <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-semibold">GST Invoice & Tax Input Included</span>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 justify-center">
              <Headphones className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="font-semibold">Free Hindi/English Onboarding Call</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
