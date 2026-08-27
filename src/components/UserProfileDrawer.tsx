import React, { useState, useRef } from 'react';
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
    switchRole,
    theme,
    toggleTheme,
    updateUserProfile,
    updateUserPassword,
    setIsActivityLogOpen,
    logoutUser,
    showToast,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'appearance' | 'role'>('profile');

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

  // Keep state in sync if currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer z-[99999]"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 z-[100000]">
        <div className="w-screen max-w-lg h-full max-h-screen bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md overflow-hidden ring-2 ring-indigo-500/30">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  (currentUser?.name || currentUser?.email || 'US').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                  {currentUser?.name || 'User Profile & Settings'}
                </h2>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate flex items-center gap-1">
                  <Building2 className="w-3 h-3 shrink-0" />
                  {currentBusiness?.name || 'ServiFlow'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Subtabs inside Drawer */}
          <div className="px-4 pt-3 pb-1 border-b border-slate-200/80 dark:border-slate-800 flex gap-1 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/30">
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSection === 'profile'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              Profile Info
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('security')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSection === 'security'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              Security & Password
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('appearance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSection === 'appearance'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              Theme & Alerts
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('role')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSection === 'role'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              Role & Business
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            
            {/* SECTION 1: PROFILE INFO */}
            {activeSection === 'profile' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Profile Photo & Quick Overview Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-slate-50 to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Interactive Avatar Container */}
                    <div className="relative group">
                      <div className="w-18 h-18 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md overflow-hidden ring-4 ring-white dark:ring-slate-800 shrink-0">
                        {avatar || currentUser?.avatar ? (
                          <img src={avatar || currentUser?.avatar} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          (name || currentUser?.email || 'US').substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md border-2 border-white dark:border-slate-800 cursor-pointer transition-transform group-hover:scale-110"
                        title="Upload Photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                          {currentUser?.name || 'Guest User'}
                        </h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          {currentUser?.role?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center justify-center sm:justify-start gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        {currentUser?.email || 'No email attached'}
                      </p>
                      {currentUser?.phone && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          {currentUser.phone}
                        </p>
                      )}

                      {/* Photo Upload Actions */}
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-2.5">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" /> Upload Photo
                        </button>
                        {(avatar || currentUser?.avatar) && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatar('');
                              showToast('Photo removed. Click Save Profile to apply.', 'info');
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Form */}
                <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-sm">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <User className="w-4 h-4 text-indigo-600" /> Edit Personal Information
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
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
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
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
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
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
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
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" /> Business Profile
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToSettings();
                        onClose();
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Manage Company →
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                    <div><strong>Company:</strong> {currentBusiness?.name || 'ServiFlow'}</div>
                    <div><strong>Industry:</strong> {currentBusiness?.type || 'Field Services'}</div>
                    {currentBusiness?.mobile && <div><strong>Mobile:</strong> {currentBusiness.mobile}</div>}
                    {currentBusiness?.email && <div><strong>Email:</strong> {currentBusiness.email}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: SECURITY & PASSWORD */}
            {activeSection === 'security' && (
              <div className="space-y-4 animate-in fade-in">
                <form onSubmit={handleUpdatePassword} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-sm">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <KeyRound className="w-4 h-4 text-indigo-600" /> Change Account Password
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
                        className="w-full text-xs p-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <Lock className="w-4 h-4" />
                    {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Shield className="w-4 h-4 text-amber-600" /> Account Security Notice
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Your login is protected with encrypted authentication. Ensure your mobile phone and email are kept up to date for instant self-service OTP recovery.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 3: THEME & ALERTS */}
            {activeSection === 'appearance' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Theme / Appearance Quick Switcher */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" /> Color Mode & Display Theme
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
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        theme === 'light'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs ring-1 ring-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-500" /> Light Mode
                      {theme === 'light' && <Check className="w-3.5 h-3.5 text-amber-600 ml-auto" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (theme !== 'dark') toggleTheme();
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-900 border-indigo-500 text-indigo-200 shadow-xs ring-1 ring-indigo-500'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-amber-400" /> Dark Mode
                      {theme === 'dark' && <Check className="w-3.5 h-3.5 text-indigo-400 ml-auto" />}
                    </button>
                  </div>
                </div>

                {/* Voice Notification Quick Controls */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Voice Alert Announcements
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
                          className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Test Voice Announcement
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4: ROLE & BUSINESS */}
            {activeSection === 'role' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Role Overview & Status */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-purple-600" /> Active Workspace Role
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
                          className={`flex items-center justify-between p-2 rounded-xl ${
                            perm.granted
                              ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                              : 'bg-slate-50/50 dark:bg-slate-800/20 text-slate-400 line-through'
                          }`}
                        >
                          <span className="text-[11.5px] font-medium">{perm.label}</span>
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
                      <span>
                        Role assignments and operational privileges are strictly managed by your Business Administrator in Staff Settings.
                      </span>
                    </div>
                  )}
                </div>

                {/* Multi-Tenant Switcher (Exclusively for Platform Super Admin) */}
                {isSuperAdmin && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <Building2 className="w-4 h-4 text-indigo-600" /> Switch Business Organization (Super Admin)
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {businesses.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => switchBusiness(b.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                            b.id === currentBusiness.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs'
                          }`}
                        >
                          <div className="truncate">
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

            {/* Quick Action Navigation Links */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                onClick={() => {
                  onNavigateToSettings();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 text-xs font-bold transition-all shadow-xs group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-indigo-600 group-hover:rotate-45 transition-transform" />
                  <span>Open Full System Settings (Company, Tax, GST)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-500" />
              </button>

              <button
                onClick={() => {
                  setIsActivityLogOpen(true);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>View Activity & Audit Logs</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => {
                  onOpenInstallModal();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all shadow-xs cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div>Install App on Mobile / Desktop</div>
                    <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-normal">ऐप इंस्टॉल करें (Android, iOS & PC)</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-500" />
              </button>

              {/* Advanced / Troubleshooting Section */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1.5">
                  Advanced & Troubleshooting
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearingCache}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-xs cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <RefreshCw className={`w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 ${isClearingCache ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <div className="text-left">
                      <div>Clear App Cache & Reload (कैश साफ़ करें)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Unregister service workers & reload latest version</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

          </div>

          {/* Footer: Single Unified Sign Out Action */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
            <button
              onClick={async () => {
                await logoutUser();
                if (onSignOut) {
                  onSignOut();
                }
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-600/20"
            >
              <LogOut className="w-4 h-4" /> Log Out from Account (लॉग आउट)
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
