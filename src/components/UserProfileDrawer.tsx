import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Sun,
  Moon,
  Volume2,
  LogOut,
  Sliders,
  Sparkles,
  Check,
  Save,
  Download,
  History,
  Camera,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ChevronRight,
  RefreshCw,
  Upload,
  Trash2,
  Info,
} from 'lucide-react';
import { clearAppCache } from '../utils/cacheUtils';
import {
  isVoiceNotificationEnabled,
  setVoiceNotificationEnabled,
  getVoiceVolume,
  setVoiceVolume,
  getSelectedVoiceLanguage,
  setSelectedVoiceLanguage,
  SUPPORTED_VOICE_LANGUAGES,
  speakText,
  playNotificationChime,
  VoiceLanguageCode,
} from '../utils/audioNotification';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings: () => void;
  onOpenInstallModal: () => void;
  onSignOut?: () => void;
}

type TabKey = 'profile' | 'security' | 'appearance' | 'role';

interface TabItem {
  id: TabKey;
  label: string;
  icon: React.ReactNode;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToSettings,
  onOpenInstallModal,
  onSignOut,
}) => {
  const {
    currentUser,
    currentBusiness,
    businesses,
    switchBusiness,
    theme,
    toggleTheme,
    updateUserProfile,
    updateUserPassword,
    setIsActivityLogOpen,
    logoutUser,
    showToast,
  } = useApp();

  const [activeSection, setActiveSection] = useState<TabKey>('profile');

  // Edit Profile States
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Voice alert controls
  const [voiceEnabled, setVoiceEnabled] = useState(isVoiceNotificationEnabled());
  const [voiceVolume, setVoiceVolumeState] = useState(getVoiceVolume());
  const [voiceLang, setVoiceLang] = useState<VoiceLanguageCode>(getSelectedVoiceLanguage());

  // Cache clearing state
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Logout state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Active tab ref for auto-scrolling into view
  const tabNavContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto scroll active tab into view horizontally
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeSection]);

  // Keep state in sync if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      showToast('Clearing active service workers & cache storage...', 'info');
      const res = await clearAppCache(true);
      if (res.success) {
        showToast('App cache cleared successfully! Reloading latest version...', 'success');
      } else {
        showToast(res.error || 'Failed to clear app cache', 'error');
        setIsClearingCache(false);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error clearing app cache', 'error');
      setIsClearingCache(false);
    }
  };

  // Native Image File Picker & Compression Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPEG, PNG, WEBP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size is too large (max 5MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressedBase64);
          showToast('Profile photo loaded. Click "Save Profile Details" to apply.', 'info');
        } else {
          setAvatar(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    if (!name.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile(currentUser.id, {
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar.trim() || undefined,
      });
      setSaveSuccess(true);
      showToast('Profile updated successfully!', 'success');
      setTimeout(() => {
        setSaveSuccess(false);
      }, 1500);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(currentUser.id, newPassword);
      showToast('Password updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      showToast('Logged out successfully', 'info');
      if (onSignOut) {
        onSignOut();
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to logout', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  const isSuperAdmin =
    currentUser?.role === 'super_admin' &&
    ((currentUser?.email || '').trim().toLowerCase() === 'admin@serviflow.io' ||
      (currentUser?.email || '').trim().toLowerCase() === 'superadmin@serviflow.io' ||
      currentUser?.id === 'usr-super-admin-001');

  // Role permissions breakdown
  const rolePermissionsList = [
    { label: 'Dispatch & Manage Jobs', granted: true },
    { label: 'View Invoices & Financials', granted: ['business_owner', 'manager', 'super_admin'].includes(currentUser?.role || '') },
    { label: 'Manage Staff & Attendance Rules', granted: ['business_owner', 'super_admin'].includes(currentUser?.role || '') },
    { label: 'Manage Inventory & Stock', granted: ['business_owner', 'manager', 'super_admin'].includes(currentUser?.role || '') },
    { label: 'Business & Tax Configurations', granted: ['business_owner', 'super_admin'].includes(currentUser?.role || '') },
    { label: 'Multi-Tenant Cloud Administration', granted: isSuperAdmin },
  ];

  const tabs: TabItem[] = [
    { id: 'profile', label: 'Profile Info', icon: <User className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'security', label: 'Security & Password', icon: <KeyRound className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'appearance', label: 'Theme & Alerts', icon: <Sparkles className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'role', label: 'Role & Permissions', icon: <Shield className="w-3.5 h-3.5 shrink-0" /> },
  ];

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden animate-in fade-in duration-200" id="user-profile-drawer-root">
      {/* Backdrop */}
      <div
        id="profile-drawer-backdrop"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer z-[99999]"
        onClick={onClose}
        aria-label="Close drawer backdrop"
      />

      {/* Slide-over panel container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-6 md:pl-10 z-[100000] pointer-events-auto">
        <div
          id="profile-drawer-panel"
          className="w-screen max-w-full sm:max-w-md md:max-w-lg h-full max-h-[100dvh] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
        >
          
          {/* Header */}
          <div className="p-3.5 sm:p-4.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden ring-2 ring-indigo-500/30 shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  (currentUser?.name || currentUser?.email || 'US').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                  {currentUser?.name || 'User Profile & Settings'}
                </h2>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate flex items-center gap-1">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{currentBusiness?.name || 'ServiFlow'}</span>
                </p>
              </div>
            </div>
            <button
              id="profile-drawer-close-btn"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Close Panel"
              aria-label="Close Profile Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1. TOP TAB NAVIGATION: Smooth Horizontally Scrollable & Clear Active Highlight */}
          <div
            ref={tabNavContainerRef}
            className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 shrink-0 px-2.5 sm:px-3.5 py-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            role="tablist"
            aria-label="Profile navigation sections"
          >
            <div className="flex items-center gap-1.5 w-max">
              {tabs.map((tab) => {
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={isActive ? activeTabRef : undefined}
                    id={`profile-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveSection(tab.id)}
                    className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500/50'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SCROLLABLE CONTENT BODY: Optimized Mobile Spacing & Bottom Padding */}
          <div
            id="profile-drawer-scroll-container"
            className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-5 sm:py-5 space-y-4 sm:space-y-4.5 overscroll-contain"
          >
            
            {/* SECTION 1: PROFILE INFO */}
            {activeSection === 'profile' && (
              <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-150">
                {/* Profile Photo & Quick Overview Card */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-slate-50 to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4">
                    {/* Interactive Avatar Container */}
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md overflow-hidden ring-4 ring-white dark:ring-slate-800 shrink-0">
                        {avatar || currentUser?.avatar ? (
                          <img src={avatar || currentUser?.avatar} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          (name || currentUser?.email || 'US').substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md border-2 border-white dark:border-slate-800 cursor-pointer transition-transform group-hover:scale-110 flex items-center justify-center"
                        title="Upload Photo"
                        aria-label="Upload profile photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate max-w-full">
                          {currentUser?.name || 'Guest User'}
                        </h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                          {currentUser?.role?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center justify-center sm:justify-start gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{currentUser?.email || 'No email attached'}</span>
                      </p>
                      {currentUser?.phone && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{currentUser.phone}</span>
                        </p>
                      )}

                      {/* Photo Upload Actions */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                          aria-label="Profile photo upload input"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px]"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload Photo
                        </button>
                        {(avatar || currentUser?.avatar) && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatar('');
                              showToast('Photo removed. Click Save Profile to apply.', 'info');
                            }}
                            className="px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Form */}
                <form onSubmit={handleSaveProfile} className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <User className="w-4 h-4 text-indigo-600 shrink-0" /> Edit Personal Information
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Enter your name"
                      className="w-full text-xs p-2.5 sm:p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs p-2.5 sm:p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden min-h-[42px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address (Sign-In Identifier)
                    </label>
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      disabled
                      className="w-full text-xs p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 font-medium cursor-not-allowed min-h-[42px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 min-h-[44px]"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Saved Successfully!
                      </>
                    ) : isSaving ? (
                      'Saving Profile...'
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Profile Details
                      </>
                    )}
                  </button>
                </form>

                {/* Company Information Overview */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-4 h-4 text-indigo-600 shrink-0" /> Business Profile
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToSettings();
                        onClose();
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer shrink-0"
                    >
                      Manage Settings →
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-1">
                    {currentBusiness?.logo ? (
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        <img src={currentBusiness.logo} alt="Company Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-base">
                        {(currentBusiness?.name || 'S').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{currentBusiness?.name || 'ServiFlow'}</div>
                      <div className="text-slate-500 text-[11px] truncate">{currentBusiness?.type || 'Field Services'}</div>
                      {currentBusiness?.mobile && <div className="text-[11px] truncate">📞 {currentBusiness.mobile}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: SECURITY & PASSWORD */}
            {activeSection === 'security' && (
              <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-150">
                <form onSubmit={handleUpdatePassword} className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" /> Change Account Password
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      New Password (Min 6 Characters) *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Enter new password"
                        className="w-full text-xs p-2.5 sm:p-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden min-h-[42px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 sm:top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Re-enter new password"
                      className="w-full text-xs p-2.5 sm:p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden min-h-[42px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 min-h-[44px]"
                  >
                    <Lock className="w-4 h-4" />
                    {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0" /> Account Security Notice
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Your login is protected with encrypted authentication. Ensure your mobile phone and email are kept up to date for instant self-service OTP recovery.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 3: THEME & ALERTS */}
            {activeSection === 'appearance' && (
              <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-150">
                {/* Theme / Appearance Quick Switcher */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" /> Color Mode & Display Theme
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode (White Sand)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (theme !== 'light') toggleTheme();
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px] ${
                        theme === 'light'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs ring-1 ring-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" /> Light Mode
                      {theme === 'light' && <Check className="w-3.5 h-3.5 text-amber-600 ml-auto shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (theme !== 'dark') toggleTheme();
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px] ${
                        theme === 'dark'
                          ? 'bg-slate-900 border-indigo-500 text-indigo-200 shadow-xs ring-1 ring-indigo-500'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-amber-400 shrink-0" /> Dark Mode
                      {theme === 'dark' && <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto shrink-0" />}
                    </button>
                  </div>
                </div>

                {/* Voice Notification Quick Controls */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> Voice Alert Announcements
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !voiceEnabled;
                        setVoiceEnabled(next);
                        setVoiceNotificationEnabled(next);
                        if (next) {
                          playNotificationChime();
                          speakText('Voice alerts enabled.', { lang: voiceLang });
                        }
                      }}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                        voiceEnabled
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {voiceEnabled ? 'ACTIVE' : 'MUTED'}
                    </button>
                  </div>

                  {voiceEnabled && (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                          <span>Volume</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{Math.round(voiceVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={voiceVolume}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setVoiceVolumeState(v);
                            setVoiceVolume(v);
                          }}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                          Language
                        </label>
                        <select
                          value={voiceLang}
                          onChange={(e) => {
                            const l = e.target.value as VoiceLanguageCode;
                            setVoiceLang(l);
                            setSelectedVoiceLanguage(l);
                          }}
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium min-h-[40px]"
                        >
                          {SUPPORTED_VOICE_LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.name} ({lang.nativeName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playNotificationChime();
                          speakText('This is a test notification. ServiFlow voice alerts are active.', { lang: voiceLang });
                        }}
                        className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer min-h-[44px]"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Test Voice Announcement
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4: ROLE & PERMISSIONS */}
            {activeSection === 'role' && (
              <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-150">
                {/* Role Overview & Status */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-purple-600 shrink-0" /> Active Workspace Role
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 uppercase">
                      {currentUser?.role?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Permissions Checklist */}
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Assigned Capabilities & Permissions:
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      {rolePermissionsList.map((perm, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2.5 rounded-xl ${
                            perm.granted
                              ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                              : 'bg-slate-50/50 dark:bg-slate-800/20 text-slate-400 line-through'
                          }`}
                        >
                          <span className="text-xs font-medium">{perm.label}</span>
                          {perm.granted ? (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security Notice for Non-Super Admins */}
                  {!isSuperAdmin && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                      <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        Role assignments and operational privileges are strictly managed by your Business Administrator in Staff Settings.
                      </span>
                    </div>
                  )}
                </div>

                {/* Multi-Tenant Switcher (Exclusively for Platform Super Admin) */}
                {isSuperAdmin && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <Building2 className="w-4 h-4 text-indigo-600 shrink-0" /> Switch Business Organization (Super Admin)
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {businesses.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => switchBusiness(b.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer min-h-[44px] ${
                            b.id === currentBusiness.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="text-xs font-medium truncate">{b.name}</div>
                            <div className="text-[10px] text-slate-400">{b.type}</div>
                          </div>
                          {b.id === currentBusiness.id && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Action Navigation Links - Clean Card Stack */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                id="profile-action-system-settings"
                onClick={() => {
                  onNavigateToSettings();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 text-xs font-bold transition-all shadow-xs group cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-indigo-600 shrink-0 group-hover:rotate-45 transition-transform" />
                  <span className="text-left">Open Full System Settings (Company, Tax, GST)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0" />
              </button>

              <button
                id="profile-action-audit-logs"
                onClick={() => {
                  setIsActivityLogOpen(true);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-left">View Activity & Audit Logs</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                id="profile-action-install-app"
                onClick={() => {
                  onOpenInstallModal();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all shadow-xs cursor-pointer group min-h-[44px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="text-left min-w-0">
                    <div className="truncate">Install App on Mobile / Desktop</div>
                    <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal truncate">ऐप इंस्टॉल करें (Android, iOS & PC)</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
              </button>

              {/* Advanced & Troubleshooting Section */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1.5">
                  Advanced & Troubleshooting
                </div>
                <button
                  id="profile-action-clear-cache"
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearingCache}
                  className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-xs cursor-pointer group disabled:opacity-50 min-h-[44px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RefreshCw className={`w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 ${isClearingCache ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <div className="text-left min-w-0">
                      <div className="truncate">Clear App Cache & Reload (कैश साफ़ करें)</div>
                      <div className="text-[10px] text-slate-500 font-normal truncate">Unregister service workers & reload latest version</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>
              </div>
            </div>

            {/* Generous bottom spacing spacer so last card is never flush or hidden behind bottom sticky footer */}
            <div className="h-6 sm:h-8" aria-hidden="true" />
          </div>

          {/* 3. FOOTER: Fixed / Sticky Bottom Logout Bar with Safe-Area Inset Support */}
          <div
            id="profile-drawer-footer"
            className="sticky bottom-0 z-20 shrink-0 p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-[max(0.875rem,env(safe-area-inset-bottom,16px))]"
          >
            <button
              id="profile-drawer-logout-btn"
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-600/20 min-h-[44px] disabled:opacity-60"
            >
              <LogOut className={`w-4 h-4 shrink-0 ${isLoggingOut ? 'animate-pulse' : ''}`} />
              <span>{isLoggingOut ? 'Logging out...' : 'Log Out from Account (लॉग आउट)'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
