import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Save,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Check,
  Sun,
  Moon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  WifiOff,
  Clock,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  KeyRound,
  CreditCard,
  Sparkles,
  Flame,
  Star,
  ArrowRight,
  Headphones,
  FileText,
  Gift,
  Tag,
  Copy,
  Send,
  Wallet,
  Banknote,
  Share2,
  Users,
  Award,
  User,
  UserCheck,
  Volume2,
  VolumeX,
  Plus,
  X,
  Radio,
  Camera,
  Wrench,
  Sliders,
  LogOut,
  Smartphone,
  Download,
} from 'lucide-react';
import { InstallAppModal } from '../components/InstallAppModal';
import { Plan } from '../types';
import {
  isVoiceNotificationEnabled,
  setVoiceNotificationEnabled,
  getVoiceVolume,
  setVoiceVolume,
  getSelectedVoiceLanguage,
  setSelectedVoiceLanguage,
  SUPPORTED_VOICE_LANGUAGES,
  speakText,
  playCustomVoiceNotification,
  playNotificationChime,
} from '../utils/audioNotification';

export const SettingsView: React.FC = () => {
  const {
    currentBusiness,
    updateBusinessProfile,
    plans,
    theme,
    toggleTheme,
    isOffline,
    isSimulatedOffline,
    pendingSyncQueue,
    manualSyncLogs,
    triggerManualSync,
    clearSyncLogs,
    toggleSimulateOffline,
    currentUser,
    updateUserPassword,
    updateUserProfile,
    purgeTenantTransactionalData,
    showToast,
    referralRecords,
    referralPayoutRequests,
    requestReferralPayout,
    logoutUser,
  } = useApp();

  const isOwnerOrAdmin = currentUser?.role === 'business_owner' || currentUser?.role === 'super_admin';
  const isTech = currentUser?.role === 'technician';

  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'my_profile' | 'profile' | 'subscription' | 'referrals' | 'sync' | 'security' | 'appearance' | 'reset'
  >(isOwnerOrAdmin ? 'profile' : 'my_profile');

  // User Profile Form State
  const [userProfileData, setUserProfileData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    avatar: currentUser?.avatar || '',
    skills: currentUser?.skills || ['General Maintenance', 'Field Diagnostics'],
    status: (currentUser?.status || 'active') as 'active' | 'inactive' | 'on_leave',
  });
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userSavedSuccess, setUserSavedSuccess] = useState(false);

  // Voice & Audio Preference States
  const [voiceEnabled, setVoiceEnabled] = useState(isVoiceNotificationEnabled());
  const [voiceVolume, setVoiceVol] = useState(getVoiceVolume());
  const [voiceLang, setVoiceLang] = useState(getSelectedVoiceLanguage());
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleUserProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    if (!userProfileData.name.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    setIsSavingUser(true);
    try {
      await updateUserProfile(currentUser.id, userProfileData);
      setUserSavedSuccess(true);
      setTimeout(() => setUserSavedSuccess(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  // Referral Payout Request State
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank_transfer' | 'subscription_credit'>('upi');
  const [payoutUpiId, setPayoutUpiId] = useState('');
  const [payoutAccountNum, setPayoutAccountNum] = useState('');
  const [payoutIfsc, setPayoutIfsc] = useState('');
  const [payoutHolderName, setPayoutHolderName] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Subscription Pricing Billing Toggle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);

  // Reset Workspace Modal / Action State
  const [isResetTenantModalOpen, setIsResetTenantModalOpen] = useState(false);
  const [resetTenantConfirmText, setResetTenantConfirmText] = useState('');
  const [isResettingTenant, setIsResettingTenant] = useState(false);

  // Password Change State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passChangeSuccess, setPassChangeSuccess] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassInput.trim()) {
      showToast('Please enter a new password', 'error');
      return;
    }

    if (newPassInput.length < 4) {
      showToast('Password must be at least 4 characters long', 'error');
      return;
    }

    if (newPassInput !== confirmPassInput) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (currentUser?.password && currentPassInput !== currentUser.password) {
      showToast('Current password is incorrect', 'error');
      return;
    }

    if (currentUser?.id) {
      updateUserPassword(currentUser.id, newPassInput.trim());
    }
    setPassChangeSuccess(true);
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    showToast('Your password has been updated successfully!', 'success');
    setTimeout(() => setPassChangeSuccess(false), 3000);
  };

  const myReferralCode = currentBusiness?.referralCode || `SF-${(currentBusiness?.name || 'SERVICE').substring(0, 4).toUpperCase()}10`;
  const myReferralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(myReferralCode)}`
    : `https://serviflow.app/?ref=${encodeURIComponent(myReferralCode)}`;

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(myReferralLink);
    showToast(`Referral invite link copied to clipboard: ${myReferralLink}`, 'success');
  };

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(myReferralCode);
    showToast(`Referral code copied: ${myReferralCode}`, 'success');
  };

  const handleWhatsAppShare = () => {
    const text = `🌟 Hey! I am using ServiFlow Field Service Software for my business. Register your business with my Referral Code *${myReferralCode}* to get an INSTANT 10% DISCOUNT on your subscription: ${myReferralLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || payoutAmount <= 0) {
      showToast('Please enter a valid payout amount', 'error');
      return;
    }
    const currentBal = currentBusiness?.referralBalance || 0;
    if (payoutAmount > currentBal) {
      showToast(`Amount exceeds available referral balance (₹${currentBal.toLocaleString('en-IN')})`, 'error');
      return;
    }

    if (payoutMethod === 'upi' && !payoutUpiId.trim()) {
      showToast('Please enter your UPI ID (e.g. name@okhdfcbank)', 'error');
      return;
    }

    if (payoutMethod === 'bank_transfer' && (!payoutAccountNum.trim() || !payoutIfsc.trim() || !payoutHolderName.trim())) {
      showToast('Please complete all bank account details (Account Number, IFSC, Holder Name)', 'error');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      await requestReferralPayout({
        amount: payoutAmount,
        payoutMethod,
        upiId: payoutMethod === 'upi' ? payoutUpiId.trim() : undefined,
        bankAccount: payoutMethod === 'bank_transfer' ? {
          accountNumber: payoutAccountNum.trim(),
          ifsc: payoutIfsc.trim().toUpperCase(),
          holderName: payoutHolderName.trim(),
        } : undefined,
        notes: payoutNotes.trim() || undefined,
      });

      setIsPayoutModalOpen(false);
      setPayoutAmount(0);
      setPayoutUpiId('');
      setPayoutAccountNum('');
      setPayoutIfsc('');
      setPayoutHolderName('');
      setPayoutNotes('');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit payout request', 'error');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const [formData, setFormData] = useState({
    name: currentBusiness.name,
    type: currentBusiness.type,
    logo: currentBusiness.logo || '',
    mobile: currentBusiness.mobile,
    whatsapp: currentBusiness.whatsapp || currentBusiness.mobile,
    email: currentBusiness.email,
    address: currentBusiness.address,
    city: currentBusiness.city,
    state: currentBusiness.state,
    pin: currentBusiness.pin,
    gstNumber: currentBusiness.gstNumber || '',
    currency: currentBusiness.currency,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [logFilter, setLogFilter] = useState<'ALL' | 'SUCCESS' | 'NO_CHANGES' | 'OFFLINE_QUEUED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncLogLimit, setSyncLogLimit] = useState<number | 'all'>(10);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleManualSyncClick = () => {
    setIsSyncing(true);
    setTimeout(() => {
      triggerManualSync('MANUAL_BUTTON');
      setIsSyncing(false);
    }, 600);
  };

  const handlePlanUpgrade = (plan: Plan) => {
    setIsUpgradingPlan(true);
    setTimeout(() => {
      updateBusinessProfile({ planId: plan.id });
      setIsUpgradingPlan(false);
      playNotificationChime();
      playCustomVoiceNotification(`Subscription updated to ${plan.name} plan.`);
      showToast(`Subscription upgraded to ${plan.name} (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})!`, 'success');
    }, 600);
  };

  const currentPlan =
    plans.find((p) => p.id === currentBusiness?.planId) ||
    plans.find((p) => p.id === 'plan-starter') ||
    plans[0];

  const allFilteredLogs = (manualSyncLogs || []).filter((log) => {
    const matchesFilter = logFilter === 'ALL' || log.status === logFilter;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesQuery =
      q === '' ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.technicianName || '').toLowerCase().includes(q) ||
      (log.id || '').toLowerCase().includes(q) ||
      Boolean(
        log.itemsSynced?.some(
          (item) =>
            (item.jobId || '').toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q)
        )
      );

    return matchesFilter && matchesQuery;
  });

  const filteredLogs = syncLogLimit === 'all' ? allFilteredLogs : allFilteredLogs.slice(0, syncLogLimit);
  const lastSyncLog = manualSyncLogs[0];

  const ADDONS = [
    {
      id: 'addon-extra-tech',
      name: 'Extra Technician Seat',
      price: billingCycle === 'yearly' ? 1490 : 149,
      unit: billingCycle === 'yearly' ? '/tech/year' : '/tech/month',
      desc: 'Add 1 additional field technician beyond your current plan quota',
    },
    {
      id: 'addon-whatsapp-pack',
      name: '1,000 WhatsApp / SMS Pack',
      price: 499,
      unit: 'one-time',
      desc: 'Automated invoice, job assignment & dispatch notifications sent to customer WhatsApp',
    },
    {
      id: 'addon-white-label',
      name: 'Custom White-Label App Setup',
      price: 9999,
      unit: 'one-time',
      desc: 'Custom business branding, dedicated domain & branded app icon installer packages',
    },
  ];

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const tabs = isOwnerOrAdmin
    ? [
        { id: 'profile', label: 'Company Profile & Logo', icon: Building2 },
        { id: 'my_profile', label: 'Owner Profile', icon: UserCheck },
        { id: 'subscription', label: 'Subscription & Pricing Plans', icon: CreditCard, highlight: true },
        { id: 'referrals', label: 'Refer & Earn (10% Bonus)', icon: Gift, highlight: true, isReferral: true },
        { id: 'sync', label: 'Offline Sync & Logs', icon: RefreshCw },
        { id: 'security', label: 'Password & Security', icon: KeyRound },
        { id: 'appearance', label: 'Theme & Audio Preferences', icon: Sun },
        { id: 'reset', label: 'Danger Zone / Reset', icon: Trash2 },
      ]
    : [
        { id: 'my_profile', label: isTech ? 'My Profile & Skills' : 'My Profile', icon: UserCheck },
        { id: 'security', label: 'Password & Security', icon: KeyRound },
        { id: 'appearance', label: 'Audio & App Preferences', icon: Sun },
        { id: 'sync', label: 'Offline Sync Status', icon: RefreshCw },
      ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            {isTech ? 'Technician Profile & Settings' : isOwnerOrAdmin ? 'Profile & Business Settings' : 'Staff Profile & Settings'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTech
              ? 'Manage your personal profile, technical skills, voice language preferences, and security'
              : isOwnerOrAdmin
              ? 'Manage company profile, SaaS subscription & pricing plans, offline sync logs, and security'
              : 'Manage your staff profile details, audio preferences, and security'}
          </p>
        </div>

        {/* Current Plan or Role Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          {isOwnerOrAdmin ? (
            <div className="px-3.5 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <div className="text-xs">
                <span className="font-extrabold text-indigo-900 dark:text-indigo-200">{currentPlan?.name} Plan</span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  Active
                </span>
              </div>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                {(currentUser?.role || 'Staff').replace('_', ' ')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80 dark:border-slate-800">
        {tabs.map((tab: any) => {
          const Icon = tab.icon;
          const isActive = activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/70 dark:border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? (tab.isReferral ? 'text-amber-500' : 'text-indigo-600 dark:text-indigo-400') : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.isReferral && !isActive && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold flex items-center gap-0.5">
                  <Tag className="w-2.5 h-2.5" /> 10%
                </span>
              )}
              {tab.highlight && !tab.isReferral && !isActive && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-extrabold">
                  Plans
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 0: USER PERSONAL PROFILE (ROLE AWARE) */}
      {activeSettingsTab === 'my_profile' && (
        <form onSubmit={handleUserProfileSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 text-xs animate-in fade-in">
          {userSavedSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-2xl font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Personal Profile Updated Successfully!
            </div>
          )}

          {/* User Badge & Avatar Card */}
          <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-800/80 dark:to-indigo-950/30 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md overflow-hidden ring-2 ring-indigo-500/30">
                  {userProfileData.avatar ? (
                    <img src={userProfileData.avatar} alt={userProfileData.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(userProfileData.name || 'US').substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 cursor-pointer transition-colors" title="Change Avatar">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          showToast('Avatar image must be under 2MB', 'error');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setUserProfileData((prev) => ({ ...prev, avatar: ev.target!.result as string }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {userProfileData.name || currentUser?.name || 'User Profile'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase">
                    {(currentUser?.role || 'Staff').replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Business Tenant: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentBusiness?.name}</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    userProfileData.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${userProfileData.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {userProfileData.status === 'active' ? 'On Duty / Available' : 'On Leave / Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Duty Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setUserProfileData((prev) => ({
                  ...prev,
                  status: prev.status === 'active' ? 'on_leave' : 'active'
                }))}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                  userProfileData.status === 'active'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                }`}
              >
                {userProfileData.status === 'active' ? 'Switch to On Leave' : 'Set as Available (On Duty)'}
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={userProfileData.name}
                onChange={(e) => setUserProfileData({ ...userProfileData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Mobile / WhatsApp Number * (For Job Dispatch)
              </label>
              <input
                type="tel"
                required
                value={userProfileData.phone}
                onChange={(e) => setUserProfileData({ ...userProfileData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                value={userProfileData.email}
                onChange={(e) => setUserProfileData({ ...userProfileData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"
                placeholder="name@business.com"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                Assigned Role in Business
              </label>
              <div className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 capitalize">
                {(currentUser?.role || 'staff').replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Specializations & Skills (especially useful for Technicians and Managers) */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div>
              <label className="font-bold text-slate-900 dark:text-white block mb-0.5">
                Technical Skills & Specializations
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Specify services and equipments you specialize in for smart job routing and assignments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(userProfileData.skills || []).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1.5"
                >
                  <Wrench className="w-3 h-3 text-indigo-500" />
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => setUserProfileData((prev) => ({
                      ...prev,
                      skills: prev.skills?.filter((_, i) => i !== idx) || []
                    }))}
                    className="p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900 text-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-200 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Add Skill Input */}
              <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newSkillInput.trim()) {
                        setUserProfileData((prev) => ({
                          ...prev,
                          skills: [...(prev.skills || []), newSkillInput.trim()]
                        }));
                        setNewSkillInput('');
                      }
                    }
                  }}
                  placeholder="+ Add skill..."
                  className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSkillInput.trim()) {
                      setUserProfileData((prev) => ({
                        ...prev,
                        skills: [...(prev.skills || []), newSkillInput.trim()]
                      }));
                      setNewSkillInput('');
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Common Skill Suggestions */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Add Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'CCTV Installation',
                  'IP Camera Config',
                  'AC Repair & Gas Refill',
                  'Inverter & Solar Servicing',
                  'Electrical Wiring',
                  'Plumbing & Drainage',
                  'Fire Alarm & Sensors',
                  'Access Control & Biometrics',
                  'PC & Network Hardware',
                ]
                  .filter((s) => !(userProfileData.skills || []).includes(s))
                  .slice(0, 6)
                  .map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() =>
                        setUserProfileData((prev) => ({
                          ...prev,
                          skills: [...(prev.skills || []), suggested],
                        }))
                      }
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      + {suggested}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSavingUser}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSavingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSavingUser ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: COMPANY PROFILE */}
      {activeSettingsTab === 'profile' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Business Settings Updated Successfully!
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="font-semibold block mb-1">Company / Business Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="font-semibold block mb-1">Industry Type *</label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div className="col-span-2 p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                  Company Branding Logo *
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload a company logo image. Displayed on Invoices, Quotations, and the Technician Login screen.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden relative group">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Company Logo" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <div className="text-center text-slate-400 text-[10px] font-bold">No Logo</div>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 3 * 1024 * 1024) {
                              alert('Image file is too large. Please select an image under 3MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              if (result) {
                                setFormData((prev) => ({ ...prev, logo: result }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <span>Upload Logo Image</span>
                    </label>

                    {formData.logo && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 font-semibold text-xs transition-colors"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="Or paste image URL (e.g., https://example.com/logo.png)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Primary Mobile *</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">WhatsApp Business No</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div className="col-span-2">
              <label className="font-semibold block mb-1">Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">GSTIN / Tax ID</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-mono uppercase"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t dark:border-slate-800 flex justify-end">
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer">
              <Save className="w-4 h-4" /> Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: SUBSCRIPTION & PRICING PLANS */}
      {activeSettingsTab === 'subscription' && (
        <div className="space-y-6">
          {/* Active Subscription Summary Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active SaaS Subscription
              </div>
              <h2 className="text-xl font-black tracking-tight">
                {currentBusiness.name} • {currentPlan.name} Tier
              </h2>
              <p className="text-xs text-indigo-200/80">
                Capacity: Up to {currentPlan.maxStaff >= 999 ? 'Unlimited' : currentPlan.maxStaff} staff technicians & {currentPlan.maxJobs >= 9999 ? 'Unlimited' : currentPlan.maxJobs} jobs/month
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs text-indigo-200">Current Plan Rate</div>
                <div className="text-xl font-black text-white">₹{currentPlan.price}/mo</div>
              </div>
            </div>
          </div>

          {/* Billing Cycle Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Available SaaS Plans & Pricing Tiers
              </h3>
              <p className="text-xs text-slate-500">
                Compare tiers and upgrade or switch seamlessly to unlock higher staff and feature limits
              </p>
            </div>

            <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-emerald-950 font-black">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* 3-Tier SaaS Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const isCurrent = currentBusiness.planId === plan.id;
              const isPro = plan.id === 'plan-pro';
              const price =
                billingCycle === 'yearly'
                  ? Math.round((plan.yearlyPrice || plan.price * 10) / 12)
                  : plan.price;
              const yearlyTotal = plan.yearlyPrice || plan.price * 10;

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl border-2 transition-all relative flex flex-col p-5 sm:p-6 ${
                    isPro
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xl shadow-indigo-600/10'
                      : isCurrent
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  {plan.badge && (
                    <div
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                        isPro
                          ? 'bg-indigo-600 text-white shadow-indigo-600/40'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {isPro && <Flame className="w-3 h-3 text-amber-300" />}
                      <span>{plan.badge}</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                          Current Tier
                        </span>
                      )}
                    </div>
                    {plan.targetAudience && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {plan.targetAudience}
                      </p>
                    )}
                  </div>

                  <div className="mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-slate-400">₹</span>
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        / month
                      </span>
                    </div>

                    {billingCycle === 'yearly' ? (
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        Billed annually: ₹{yearlyTotal.toLocaleString('en-IN')}/year (2 Months Free)
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Billed monthly, cancel anytime
                      </div>
                    )}
                  </div>

                  {/* Quota Highlights */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold">Staff Limit</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {plan.maxStaff >= 999 ? 'Unlimited' : `Up to ${plan.maxStaff} Techs`}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold">Jobs / Month</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {plan.maxJobs >= 9999 ? 'Unlimited' : `${plan.maxJobs} Jobs`}
                      </div>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 flex-1 mb-6 text-xs text-slate-700 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="leading-snug text-[11px]">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlanUpgrade(plan)}
                    disabled={isUpgradingPlan}
                    className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      isCurrent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        : isPro
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Active Plan</span>
                      </>
                    ) : (
                      <>
                        <span>Upgrade to {plan.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add-ons Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Optional Add-On Packs & Custom Expansion</span>
              </h4>
              <p className="text-xs text-slate-500">
                Purchase dedicated technician seats or WhatsApp automated alert packs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ADDONS.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold text-xs text-slate-900 dark:text-slate-100 mb-1">
                        <span>{addon.name}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                          ₹{addon.price.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">{addon.unit}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {addon.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-semibold">
                      <span className={isSelected ? 'text-indigo-600 dark:text-indigo-300 font-bold' : 'text-slate-400'}>
                        {isSelected ? '✓ Pack Selected' : '+ Add Pack'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: REFER & EARN 10% BONUS PROGRAM */}
      {activeSettingsTab === 'referrals' && (
        <div className="space-y-6">
          {/* Hero Banner with Referral Code & Share CTA */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border border-indigo-700/50 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Partner & Referral Bonus System</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Refer Business Owners & Earn <span className="text-amber-400">10% Cash Bonus</span>
                </h2>
                <p className="text-sm text-indigo-200 leading-relaxed">
                  Give other service businesses <strong className="text-white">10% Discount</strong> on registration and subscription plans. When they sign up using your referral code, you get <strong className="text-emerald-300">10% Referral Bonus</strong> credited directly to your wallet!
                </p>

                {/* Referral Code Quick Display Box */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-1.5 pl-4">
                    <span className="text-xs text-slate-300 font-semibold mr-2">Your Referral Code:</span>
                    <span className="font-mono font-black text-amber-300 text-base tracking-wider mr-3">
                      {myReferralCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReferralCode}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Copy Referral Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyReferralLink}
                    className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Invite Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Wallet Summary Card in Banner */}
              <div className="lg:w-72 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 text-white flex flex-col justify-between shrink-0 shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-indigo-200">
                    <span>Available Referral Balance</span>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black tracking-tight text-white">
                    ₹{(currentBusiness?.referralBalance || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Total Earned: ₹{(currentBusiness?.referralEarnings || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/15">
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutAmount(currentBusiness?.referralBalance || 0);
                      setIsPayoutModalOpen(true);
                    }}
                    disabled={(currentBusiness?.referralBalance || 0) <= 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Banknote className="w-4 h-4 text-indigo-600" />
                    <span>Request Payout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Referrals</div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {referralRecords.length}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Businesses Registered</div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Bonus Earned</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  ₹{(currentBusiness?.referralEarnings || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">10% Lifetime Bonus</div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available Balance</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{(currentBusiness?.referralBalance || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Ready for Withdrawal</div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Discount Benefit</div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  10% OFF
                </div>
                <div className="text-[10px] text-slate-400 font-medium">For You & Referred Friends</div>
              </div>
            </div>
          </div>

          {/* How It Works Explainer Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>How the 10% Referral & Bonus Program Works</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simple 4-step reward system for growing the field service community
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                  1
                </div>
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Share Your Code</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Give your unique referral code <span className="font-mono font-bold text-indigo-600">{myReferralCode}</span> to fellow service business owners.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md">
                  2
                </div>
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Owner Gets 10% OFF</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  When they register using your code, an instant 10% discount is applied to their account and subscription plan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center justify-center shadow-md">
                  3
                </div>
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">You Earn 10% Bonus</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  You automatically receive a 10% cash bonus credited instantly to your referral wallet balance.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                  4
                </div>
                <h4 className="font-black text-xs text-slate-900 dark:text-slate-100">Instant Withdrawal</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Withdraw your bonus directly to your UPI ID, Bank Account, or apply it as credit toward your next subscription renewal.
                </p>
              </div>
            </div>
          </div>

          {/* Referral Records & Payout Requests Tabulated Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Referred Businesses Log */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Your Referred Businesses</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    List of businesses that signed up using your code
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-black">
                  {referralRecords.length} Total
                </span>
              </div>

              {referralRecords.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <Gift className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No referrals yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Share your referral code <strong className="text-indigo-600 font-mono">{myReferralCode}</strong> with your contractor network to start earning!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {referralRecords.map((record) => (
                    <div key={record.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                          {record.referredBusinessName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Owner: {record.referredOwnerName}</span>
                          <span>•</span>
                          <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          +₹{(record.bonusEarned || record.bonusAmount || 0).toLocaleString('en-IN')} Bonus
                        </div>
                        <span className="inline-block px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Payout Requests History */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Payout Requests & Withdrawals</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track the status of your bonus payouts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPayoutAmount(currentBusiness?.referralBalance || 0);
                    setIsPayoutModalOpen(true);
                  }}
                  disabled={(currentBusiness?.referralBalance || 0) <= 0}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Withdraw</span>
                </button>
              </div>

              {referralPayoutRequests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No payout requests yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Once you accumulate referral bonuses, you can request instant payouts to your UPI or bank account.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {referralPayoutRequests.map((payout) => (
                    <div key={payout.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>₹{payout.amount.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] font-normal text-slate-400 capitalize">
                            via {payout.payoutMethod.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{new Date(payout.requestedAt).toLocaleDateString()}</span>
                          {payout.upiId && <span>• UPI: {payout.upiId}</span>}
                          {payout.bankAccount && <span>• Bank: ending in {payout.bankAccount.accountNumber.slice(-4)}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${
                          payout.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                            : payout.status === 'approved'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
                            : payout.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                        }`}>
                          {payout.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REFERRAL PAYOUT REQUEST MODAL */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-transparent dark:from-indigo-950/30 dark:via-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Request Referral Bonus Payout
                  </h3>
                  <p className="text-xs text-slate-500">
                    Available Balance: <strong className="text-emerald-600 dark:text-emerald-400">₹{(currentBusiness?.referralBalance || 0).toLocaleString('en-IN')}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Payout Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={currentBusiness?.referralBalance || 0}
                    value={payoutAmount || ''}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    placeholder="Enter amount to withdraw"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Max Available: ₹{(currentBusiness?.referralBalance || 0).toLocaleString('en-IN')}</span>
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(currentBusiness?.referralBalance || 0)}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Withdraw All
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Payout Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI Transfer', icon: Zap },
                    { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
                    { id: 'subscription_credit', label: 'Plan Credit', icon: Sparkles },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = payoutMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayoutMethod(m.id as any)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-black shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="text-[11px] leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {payoutMethod === 'upi' && (
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={payoutUpiId}
                    onChange={(e) => setPayoutUpiId(e.target.value)}
                    required
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              )}

              {payoutMethod === 'bank_transfer' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={payoutHolderName}
                      onChange={(e) => setPayoutHolderName(e.target.value)}
                      required
                      placeholder="Account holder's full legal name"
                      className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        type="text"
                        value={payoutAccountNum}
                        onChange={(e) => setPayoutAccountNum(e.target.value)}
                        required
                        placeholder="Account number"
                        className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={payoutIfsc}
                        onChange={(e) => setPayoutIfsc(e.target.value.toUpperCase())}
                        required
                        placeholder="e.g. HDFC0001234"
                        className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold uppercase focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {payoutMethod === 'subscription_credit' && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Instant Subscription Credit:</span> ₹{payoutAmount.toLocaleString('en-IN')} will be credited directly to reduce your upcoming monthly or yearly subscription renewals.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Note / Reference
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Referral earnings withdrawal for June"
                  className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout || payoutAmount <= 0}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  {isSubmittingPayout ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Payout...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Request ₹{payoutAmount.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: OFFLINE SYNC OPERATIONS LOG */}
      {activeSettingsTab === 'sync' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Manual Sync Operations Log
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Live Audit Trail
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Detailed transparency status, timestamps, latency metrics, and itemized results of manual & automatic technician syncs.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleManualSyncClick}
                disabled={isSyncing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchronizing...' : 'Trigger Manual Sync'}
              </button>

              <button
                type="button"
                onClick={toggleSimulateOffline}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  isSimulatedOffline
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <WifiOff className="w-3.5 h-3.5" />
                {isSimulatedOffline ? 'Simulating Offline' : 'Test Offline'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-indigo-500" /> Pending Queue
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                {pendingSyncQueue.length} <span className="text-xs font-normal text-slate-500">records</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {pendingSyncQueue.length > 0 ? 'Awaiting cloud sync' : 'All local changes synced'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" /> Last Sync Status
              </div>
              <div className="flex items-center gap-1.5 font-black text-sm">
                {lastSyncLog ? (
                  <span
                    className={`px-2 py-0.5 rounded-lg text-xs ${
                      lastSyncLog.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : lastSyncLog.status === 'NO_CHANGES'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {lastSyncLog.status}
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal">None yet</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {lastSyncLog ? new Date(lastSyncLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ready'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Connection Mode
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {isOffline || isSimulatedOffline ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <WifiOff className="w-4 h-4" /> Offline
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Cloud Online
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500">
                {isSimulatedOffline ? 'Simulated Offline Mode' : 'Live Network Link'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-purple-500" /> Sync History
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                {manualSyncLogs.length} <span className="text-xs font-normal text-slate-500">entries</span>
              </div>
              <div className="text-[10px] text-slate-500">Persisted locally</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search sync logs by Job ID, technician, or result details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['ALL', 'SUCCESS', 'NO_CHANGES', 'OFFLINE_QUEUED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setLogFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    logFilter === st
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'OFFLINE_QUEUED' ? 'Queued' : st}
                </button>
              ))}
            </div>

            {manualSyncLogs.length > 0 && (
              <button
                type="button"
                onClick={clearSyncLogs}
                className="px-2.5 py-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <div className="space-y-2.5 pt-1">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Database className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  No sync operation logs match your current filter.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const hasItems = log.itemsSynced && log.itemsSynced.length > 0;

                const statusColors = {
                  SUCCESS: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200',
                  NO_CHANGES: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 text-blue-900 dark:text-blue-200',
                  OFFLINE_QUEUED: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 text-amber-900 dark:text-amber-200',
                  FAILED: 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-200',
                }[log.status];

                return (
                  <div key={log.id} className={`p-3.5 rounded-2xl border transition-all space-y-2 ${statusColors}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold uppercase text-[11px]">{log.status}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {log.technicianName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{log.details}</p>

                    {hasItems && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex items-center justify-between w-full text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <ArrowUpRight className="w-3.5 h-3.5" /> View {log.itemsSynced!.length} synced items
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px]">
                            {log.itemsSynced!.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <span className="font-mono font-bold text-indigo-600">{item.jobId}</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{item.description}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PASSWORD & SECURITY */}
      {activeSettingsTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" /> Account Password & Security
            </h2>
            <p className="text-xs text-slate-500">
              Change password for <strong className="text-slate-700 dark:text-slate-200">{currentUser?.name || 'User'}</strong> ({currentUser?.email || currentUser?.phone || ''}).
            </p>
          </div>

          {passChangeSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Password updated successfully!
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {currentUser?.password && (
              <div>
                <label className="font-semibold block mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
                />
              </div>
            )}

            <div>
              <label className="font-semibold block mb-1">New Password *</label>
              <input
                type="password"
                required
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="Min 4 chars"
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassInput}
                onChange={(e) => setConfirmPassInput(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 font-medium"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" /> Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: THEME & APPEARANCE / AUDIO PREFERENCES */}
      {activeSettingsTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />} Appearance & Theme Mode
            </h2>
            <p className="text-xs text-slate-500">Switch between Light Mode (White Sand) and Dark Mode.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (theme !== 'light') toggleTheme();
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Light Mode</div>
                  <div className="text-[10px] text-slate-500">Clean, crisp interface</div>
                </div>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-amber-600" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (theme !== 'dark') toggleTheme();
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                theme === 'dark'
                  ? 'bg-indigo-950/60 border-indigo-700 text-indigo-200 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Dark Mode</div>
                  <div className="text-[10px] text-slate-500">Eye-safe dark slate theme</div>
                </div>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* Voice Notification Audio Alerts Section */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Voice & Audio Notification Center
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receive spoken announcements in Hindi, Marathi, Gujarati, English, etc. when jobs are assigned or updated.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setVoiceEnabled(val);
                    setVoiceNotificationEnabled(val);
                    if (val) {
                      playNotificationChime();
                      playCustomVoiceNotification('Voice notifications are now activated.');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {voiceEnabled && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-4">
                {/* Language Selector */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                    Voice Announcement Language
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SUPPORTED_VOICE_LANGUAGES.map((lang) => {
                      const isSelected = voiceLang === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setVoiceLang(lang.code);
                            setSelectedVoiceLanguage(lang.code);
                            playNotificationChime();
                            if (lang.code === 'hi-IN') {
                              speakText('सर्विसफ्लो वॉयस नोटिफिकेशन सक्रिय है।', { lang: 'hi-IN' });
                            } else if (lang.code === 'mr-IN') {
                              speakText('सर्व्हिसफ्लो व्हॉईस सूचना सुरू झाली आहे.', { lang: 'mr-IN' });
                            } else if (lang.code === 'gu-IN') {
                              speakText('સર્વિસફ્લો વૉઇસ નોટિફિકેશન સક્રિય છે.', { lang: 'gu-IN' });
                            } else {
                              speakText(`ServiFlow voice notification set to ${lang.name}.`, { lang: lang.code });
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-white dark:bg-slate-900 border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold shadow-xs'
                              : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{lang.flag}</span>
                            <div>
                              <div className="text-xs font-semibold leading-tight">{lang.name}</div>
                              <div className="text-[10px] text-slate-400">{lang.nativeName}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Volume Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-600" /> Announcement Volume
                    </span>
                    <span>{Math.round(voiceVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={voiceVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVoiceVol(v);
                      setVoiceVolume(v);
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Test Voice Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      playNotificationChime();
                      playCustomVoiceNotification('New job assigned: CCTV Camera Installation at Bandra West.');
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Test Voice Notification
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Standalone App Installation Section */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Install App on Mobile & Desktop (ऐप इंस्टॉल करें)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download fullscreen standalone application for Android, iPhone / iPad (iOS Safari), and Windows/Mac Chrome.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsInstallModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install Instructions</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: DANGER ZONE RESET */}
      {activeSettingsTab === 'reset' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-200/80 dark:border-rose-900/60 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" /> Workspace Clean Testing Data Reset
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Clear test customers, jobs, invoices, and expenses for <strong className="text-slate-700 dark:text-slate-200">{currentBusiness.name}</strong> only. Your login credentials and settings will remain safe.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setResetTenantConfirmText('');
                setIsResetTenantModalOpen(true);
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Reset Workspace Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Tenant Reset Confirmation Modal */}
      {isResetTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-500/40 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                  Reset Workspace Testing Data
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{currentBusiness.name}</p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (resetTenantConfirmText.trim().toUpperCase() !== 'RESET') {
                  showToast('Please type RESET to confirm workspace data reset.', 'error');
                  return;
                }
                setIsResettingTenant(true);
                try {
                  await purgeTenantTransactionalData(currentBusiness.id);
                  setIsResetTenantModalOpen(false);
                  setResetTenantConfirmText('');
                } finally {
                  setIsResettingTenant(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                This will delete all test customers, jobs, orders, invoices, and payments for <strong>{currentBusiness.name}</strong>.
              </p>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Type <span className="font-mono text-rose-600 dark:text-rose-400 font-black">RESET</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={resetTenantConfirmText}
                  onChange={(e) => setResetTenantConfirmText(e.target.value)}
                  placeholder="RESET"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold tracking-widest text-center"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isResettingTenant}
                  onClick={() => {
                    setIsResetTenantModalOpen(false);
                    setResetTenantConfirmText('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isResettingTenant || resetTenantConfirmText.trim().toUpperCase() !== 'RESET'}
                  className={`px-5 py-2 rounded-xl font-extrabold text-white flex items-center gap-2 shadow-md cursor-pointer transition-all ${
                    resetTenantConfirmText.trim().toUpperCase() === 'RESET' && !isResettingTenant
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isResettingTenant ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Resetting Workspace...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Reset</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Standalone Installation Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
