import React from 'react';
import { Clock, AlertTriangle, Sparkles, ArrowRight, ShieldCheck, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface TrialStatusBannerProps {
  onUpgradeClick: () => void;
  onViewReceiptClick?: () => void;
}

export const TrialStatusBanner: React.FC<TrialStatusBannerProps> = ({
  onUpgradeClick,
  onViewReceiptClick,
}) => {
  const { currentBusiness, currentUser, trialStatus, subscriptionPayments } = useApp();

  // Do not show banner for Super Admin users
  if (!currentBusiness || currentUser?.role === 'super_admin') {
    return null;
  }

  // Case 1: Pending UTR Verification
  if (currentBusiness.subscriptionStatus === 'pending_verification') {
    const latestPayment = subscriptionPayments.find(
      (p) => p.businessId === currentBusiness.id && p.status === 'pending'
    );

    return (
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-indigo-900 text-indigo-100 border-b border-indigo-800 px-4 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="p-1 rounded-lg bg-indigo-600 text-white shrink-0 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong className="text-white font-bold">Payment Under Verification:</strong> Your payment reference{' '}
              {latestPayment ? <code className="font-mono bg-indigo-800/80 px-1.5 py-0.5 rounded text-[11px] text-amber-300">{latestPayment.utrNumber}</code> : ''} is being verified by our finance team (15–30 mins). All features remain accessible.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onViewReceiptClick && latestPayment && (
              <button
                type="button"
                onClick={onViewReceiptClick}
                className="px-3 py-1 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
              >
                <Receipt className="w-3 h-3" />
                <span>View Receipt</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Trial Expired
  if (trialStatus.isExpired) {
    return (
      <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-rose-700 text-white border-b border-rose-600 px-3 sm:px-4 py-2 text-xs shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-white/15 text-white shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
            <p className="leading-snug text-[11px] sm:text-xs min-w-0">
              <strong className="font-extrabold tracking-wide uppercase">Trial Expired:</strong>{' '}
              <span className="sm:hidden text-rose-100">
                Choose a plan to resume creating jobs &amp; dispatching.
              </span>
              <span className="hidden sm:inline text-rose-50">
                Select an official ServiFlow subscription plan to continue dispatching technicians and creating jobs without disruption.
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onUpgradeClick}
            className="px-3 py-1.5 rounded-lg bg-white text-rose-800 hover:bg-rose-50 active:scale-95 font-extrabold text-[11px] sm:text-xs flex items-center gap-1 shadow-xs transition-all shrink-0 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3 h-3 text-amber-600 hidden sm:inline" />
            <span>Upgrade</span>
            <span className="hidden sm:inline">Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Trial Ending Soon (3 days or fewer)
  if (trialStatus.isTrial && trialStatus.daysRemaining <= 3) {
    return (
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 text-white border-b border-amber-500 px-3 sm:px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-amber-900/40 text-amber-100 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <p className="leading-snug text-[11px] sm:text-xs min-w-0">
              <strong className="font-bold">Trial Ending:</strong>{' '}
              <strong className="underline decoration-amber-200 font-black tabular-nums">
                {trialStatus.daysRemaining}d left
              </strong>
              <span className="sm:hidden text-amber-100"> — Choose a plan to stay active.</span>
              <span className="hidden sm:inline text-amber-50">
                {' '}on your 14-day trial. Choose your plan to keep your workflows active.
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onUpgradeClick}
            className="px-3 py-1.5 rounded-lg bg-white text-amber-900 hover:bg-amber-50 active:scale-95 font-extrabold text-[11px] flex items-center gap-1 shadow-xs transition-all shrink-0 cursor-pointer whitespace-nowrap"
          >
            <span>Choose Plan</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
