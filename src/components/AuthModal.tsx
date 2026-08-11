import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone,
  Mail,
  Lock,
  UserCheck,
  ShieldAlert,
  X,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  KeyRound,
  LogOut,
  Smartphone,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    users,
    setCurrentUser,
    businesses,
    switchBusiness,
    switchRole,
    currentUser,
    showToast,
    addStaff,
    currentBusiness,
  } = useApp();

  const [authMode, setAuthMode] = useState<'phone' | 'email' | 'quick'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'business_owner' | 'manager' | 'technician'>('technician');
  const [newName, setNewName] = useState('');

  if (!isOpen) return null;

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    setOtpSent(true);
    setOtpCode('1234'); // Pre-fill default 4-digit code for fast testing
    showToast(`OTP sent to +91 ${phoneNumber}! (Demo OTP: 1234)`, 'info');
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== '1234' && otpCode.length < 4) {
      showToast('Please enter valid 4-digit OTP (Try: 1234)', 'error');
      return;
    }

    // Search existing user by phone number
    const matchedUser = users.find(
      (u) => u.phone.replace(/[^0-9]/g, '').endsWith(phoneNumber.replace(/[^0-9]/g, '').slice(-10))
    );

    if (matchedUser) {
      setCurrentUser(matchedUser);
      switchBusiness(matchedUser.businessId);
      showToast(`Logged in successfully as ${matchedUser.name} (${matchedUser.role})`, 'success');
      onClose();
    } else {
      // Create new staff/technician account with this phone number
      const userName = newName || `Mobile User (${phoneNumber.slice(-4)})`;
      const createdUser = addStaff({
        name: userName,
        email: `${phoneNumber}@serviflow.app`,
        phone: `+91 ${phoneNumber}`,
        role: selectedRole,
        status: 'active',
      });
      setCurrentUser(createdUser);
      showToast(`New account created & logged in for ${userName}`, 'success');
      onClose();
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter email address', 'error');
      return;
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matchedUser) {
      setCurrentUser(matchedUser);
      switchBusiness(matchedUser.businessId);
      showToast(`Welcome back, ${matchedUser.name}!`, 'success');
      onClose();
    } else {
      showToast('No user account found with this email. Please check or use Quick Login.', 'error');
    }
  };

  const handleQuickLogin = (u: any) => {
    setCurrentUser(u);
    switchBusiness(u.businessId);
    showToast(`Switched account to ${u.name} (${u.role.replace('_', ' ')})`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                User Sign In & Mobile Login
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log in via Mobile Number or Email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-2 bg-slate-100 dark:bg-slate-800/80 m-3 rounded-2xl text-xs font-medium">
          <button
            onClick={() => {
              setAuthMode('phone');
              setOtpSent(false);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'phone'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Mobile Number</span>
          </button>
          <button
            onClick={() => setAuthMode('email')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'email'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Email Login</span>
          </button>
          <button
            onClick={() => setAuthMode('quick')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'quick'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Staff Switch</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Mobile Phone Auth Tab */}
          {authMode === 'phone' && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mobile Number (Phone Authentication)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="9876543210"
                        maxLength={10}
                        required
                        className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Technicians & Owners can enter their 10-digit mobile number to get instant OTP.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Name (Required if creating new account)
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Role (if new user)
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'technician', label: 'Technician' },
                        { id: 'manager', label: 'Manager' },
                        { id: 'business_owner', label: 'Owner' },
                        { id: 'super_admin', label: 'Super Admin' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            if (r.id === 'super_admin') {
                              switchRole('super_admin');
                              onClose();
                            } else {
                              setSelectedRole(r.id as any);
                            }
                          }}
                          className={`py-2 text-[11px] rounded-xl border font-medium transition-all ${
                            selectedRole === r.id
                              ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Get Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-300">
                    <p className="font-semibold">OTP sent to +91 {phoneNumber}</p>
                    <p className="text-[11px] mt-0.5 opacity-80">Use OTP: <strong className="font-mono text-indigo-900 dark:text-indigo-200">1234</strong> to verify instantly.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Enter 4-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="1234"
                      maxLength={4}
                      required
                      className="w-full text-center tracking-[1em] font-mono font-bold text-lg px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-center"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Email Login Tab */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@securitysolutions.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In with Email</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Staff Select Tab */}
          {authMode === 'quick' && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Super Admin Portal Access</span>
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                    Full control over all businesses, billing, and platform tenants.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    switchRole('super_admin');
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-all shrink-0"
                >
                  Login Super Admin
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Or click any existing staff member / technician to switch:
              </p>
              {users.map((u) => {
                const isCurrent = currentUser.id === u.id;
                const bizName = businesses.find((b) => b.id === u.businessId)?.name || 'ServiceFlow';
                return (
                  <div
                    key={u.id}
                    onClick={() => handleQuickLogin(u)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-indigo-50/40 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-md font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-2">
                          <span className="capitalize">{u.role.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="truncate">{bizName}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline shrink-0">
                      Login
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400">
          Logged in user: <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong> ({currentUser.role.replace('_', ' ')})
        </div>
      </div>
    </div>
  );
};
