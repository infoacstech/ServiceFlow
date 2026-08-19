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
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToSettings,
  onOpenInstallModal,
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
    setIsActivityLogOpen,
    logoutUser,
    showToast,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Voice alert controls
  const [voiceEnabled, setVoiceEnabled] = useState(isVoiceNotificationEnabled());
  const [voiceVolume, setVoiceVolumeState] = useState(getVoiceVolume());
  const [voiceLang, setVoiceLang] = useState<VoiceLanguageCode>(getSelectedVoiceLanguage());

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
        setIsEditing(false);
      }, 1200);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const rolesList: { id: UserRole; label: string; desc: string }[] = [
    { id: 'business_owner', label: 'Business Owner', desc: 'Full administrative and financial access' },
    { id: 'manager', label: 'Manager', desc: 'Dispatch, job management, invoices & inventory' },
    { id: 'technician', label: 'Field Technician', desc: 'Assigned jobs, voice notes & field execution' },
    { id: 'super_admin', label: 'Super Admin', desc: 'Multi-tenant cloud platform administrator' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">User Profile & Account</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentBusiness?.name || 'ServiFlow SaaS'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            
            {/* Profile Overview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md overflow-hidden ring-2 ring-white dark:ring-slate-800">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      (currentUser?.name || currentUser?.email || 'US').substring(0, 2).toUpperCase()
                    )}
                  </div>
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

              {/* Edit Profile Toggle Button */}
              <div className="mt-3.5 pt-3 border-t border-indigo-100/80 dark:border-indigo-900/60 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {isEditing ? 'Editing Profile Details' : 'Manage Personal Details'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </button>
              </div>
            </div>

            {/* Quick Profile Edit Form */}
            {isEditing && (
              <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-3 shadow-sm animate-in fade-in">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" /> Edit Profile Information
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Avatar Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Saved!
                      </>
                    ) : isSaving ? (
                      'Saving...'
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Theme / Appearance Quick Switcher */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> App Display Theme
                </span>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode (White Sand)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (theme !== 'light') toggleTheme();
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    theme === 'light'
                      ? 'bg-white border-amber-400 text-amber-900 shadow-xs ring-1 ring-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
                  {theme === 'light' && <Check className="w-3 h-3 text-amber-600 ml-auto" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (theme !== 'dark') toggleTheme();
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-indigo-500 text-indigo-200 shadow-xs ring-1 ring-indigo-500'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-amber-400" /> Dark Mode
                  {theme === 'dark' && <Check className="w-3 h-3 text-indigo-400 ml-auto" />}
                </button>
              </div>
            </div>

            {/* Voice Notification Quick Controls */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Voice Alert Announcements
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
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                    voiceEnabled
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {voiceEnabled ? 'ACTIVE' : 'MUTED'}
                </button>
              </div>

              {voiceEnabled && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
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
              )}
            </div>

            {/* Role Switcher (Instant testing & role change) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-600" /> Active Workspace Role
              </span>
              <div className="space-y-1">
                {rolesList.map((r) => {
                  const isCurRole = currentUser?.role === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => switchRole(r.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        isCurRole
                          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold">{r.label}</div>
                        <div className="text-[10px] text-slate-400">{r.desc}</div>
                      </div>
                      {isCurRole && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  onNavigateToSettings();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs group"
              >
                <Sliders className="w-4 h-4 text-indigo-600 group-hover:rotate-45 transition-transform" />
                <span>Open Full Settings & Subscription Plans</span>
              </button>

              <button
                onClick={() => {
                  setIsActivityLogOpen(true);
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs"
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>View Activity & Audit Logs</span>
              </button>

              <button
                onClick={() => {
                  onOpenInstallModal();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Install Standalone Mobile/Desktop App</span>
              </button>
            </div>

          </div>

          {/* Footer: Sign Out Action */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => {
                logoutUser();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out from Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
