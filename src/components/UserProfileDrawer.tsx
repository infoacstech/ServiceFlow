import React, { useState } from 'react';
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
  VolumeX,
  LogOut,
  Sliders,
  Sparkles,
  Check,
  Save,
  Download,
  History,
  RotateCcw,
  Camera,
  CheckCircle2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  ChevronRight,
} from 'lucide-react';
import { UserRole } from '../types';
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

  // Password Change States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Voice alert controls
  const [voiceEnabled, setVoiceEnabled] = useState(isVoiceNotificationEnabled());
  const [voiceVolume, setVoiceVolumeState] = useState(getVoiceVolume());
  const [voiceLang, setVoiceLang] = useState<VoiceLanguageCode>(getSelectedVoiceLanguage());

  // Keep state in sync if currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  if (!isOpen) return null;

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

  const rolesList: { id: UserRole; label: string; desc: string }[] = [
    { id: 'business_owner', label: 'Business Owner', desc: 'Full administrative and financial access' },
    { id: 'manager', label: 'Manager', desc: 'Dispatch, job management, invoices & inventory' },
    { id: 'technician', label: 'Field Technician', desc: 'Assigned jobs, voice notes & field execution' },
    { id: 'super_admin', label: 'Super Admin', desc: 'Multi-tenant cloud platform administrator' },
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
                {/* Profile Overview Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-slate-50 to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md overflow-hidden ring-2 ring-white dark:ring-slate-800 shrink-0">
                      {avatar || currentUser?.avatar ? (
                        <img src={avatar || currentUser?.avatar} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        (name || currentUser?.email || 'US').substring(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                          {currentUser?.name || 'Guest User'}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          {currentUser?.role?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        {currentUser?.email || 'No email attached'}
                      </p>
                      {currentUser?.phone && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          {currentUser.phone}
                        </p>
                      )}
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
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Avatar Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
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

                {/* Direct Log Out Button inside Profile Tab */}
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
                  <div className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Sign Out from Account
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    Exit your active session on this device. You can log back in anytime.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      await logoutUser();
                      if (onSignOut) onSignOut();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-600/20"
                  >
                    <LogOut className="w-4 h-4" /> Log Out (लॉग आउट)
                  </button>
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
                        className="w-full text-xs p-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
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
                {/* Role Switcher */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Shield className="w-4 h-4 text-purple-600" /> Active Workspace Role
                  </span>
                  <div className="space-y-1.5">
                    {rolesList.map((r) => {
                      const isCurRole = currentUser?.role === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => switchRole(r.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isCurRole
                              ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold">{r.label}</div>
                            <div className="text-[10px] text-slate-400">{r.desc}</div>
                          </div>
                          {isCurRole && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-Tenant Switcher (If multiple businesses exist) */}
                {businesses.length > 1 && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <Building2 className="w-4 h-4 text-indigo-600" /> Switch Business Organization
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
