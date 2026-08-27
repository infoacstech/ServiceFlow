import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { AuthService } from '../services/AuthService';
import {
  Mail,
  Lock,
  X,
  ArrowRight,
  KeyRound,
  UserPlus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertCircle,
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
    loginUser,
    showToast,
    registerUser,
    updateUserPassword,
  } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'super_admin' | 'forgot_password'>('login');

  // Direct Login States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password State (Firebase Auth Built-in Password Reset Email)
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetSubmitted, setIsResetSubmitted] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Super Admin States
  const [superAdminEmail, setSuperAdminEmail] = useState('admin@serviflow.io');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [isSuperAdminSubmitting, setIsSuperAdminSubmitting] = useState(false);

  // Direct Registration States
  const [registerRole, setRegisterRole] = useState<'business_owner' | 'manager' | 'technician'>('business_owner');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusinessId, setRegBusinessId] = useState(businesses[0]?.id || '');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regBusinessType, setRegBusinessType] = useState('CCTV & Security');

  const [pendingRegistrationSuccess, setPendingRegistrationSuccess] = useState<User | null>(null);

  if (!isOpen) return null;

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = loginIdentifier.trim();
    if (!clean) {
      showToast('Please enter your email or mobile number', 'error');
      return;
    }

    try {
      await loginUser(
        { email: clean, id: '', name: '', phone: '', role: 'business_owner', businessId: '', status: 'active' },
        loginPassword
      );
      onClose();
    } catch (err) {
      console.error('Sign in error in modal:', err);
    }
  };

  const handleDirectRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      showToast('Please complete all required fields including password', 'error');
      return;
    }

    if (regPassword.length < 6) {
      showToast('Password must be at least 6 characters long for secure Firebase Authentication', 'error');
      return;
    }

    try {
      const result = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        role: registerRole,
        businessId: registerRole !== 'business_owner' ? regBusinessId : undefined,
        businessName: registerRole === 'business_owner' ? regBusinessName || `${regName.trim()}'s Services` : undefined,
        businessType: registerRole === 'business_owner' ? regBusinessType : undefined,
      });

      if (result.isPending) {
        setPendingRegistrationSuccess(result.user);
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Registration error in modal:', err);
    }
  };

  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = superAdminEmail.trim().toLowerCase();
    if (!cleanEmail || !superAdminPassword) {
      showToast('Please enter Super Admin email and password', 'error');
      return;
    }

    if (cleanEmail !== 'admin@serviflow.io' && cleanEmail !== 'superadmin@serviflow.io') {
      showToast('Invalid Super Admin credentials. Access is strictly restricted to platform administrators.', 'error');
      return;
    }

    setIsSuperAdminSubmitting(true);
    try {
      const loggedIn = await loginUser(
        { email: cleanEmail, id: '', name: '', phone: '', role: 'super_admin', businessId: 'all', status: 'active' },
        superAdminPassword
      );

      if (loggedIn.role !== 'super_admin') {
        showToast('Access denied: Account is not authorized for Super Administrator access.', 'error');
        return;
      }

      sessionStorage.setItem('serviflow_active_tab', 'super_admin');
      onClose();
    } catch (err: any) {
      console.error('Super Admin sign in error in modal:', err);
    } finally {
      setIsSuperAdminSubmitting(false);
    }
  };

  // FORGOT PASSWORD / FIREBASE AUTH PASSWORD RESET EMAIL HANDLER
  const handleSendPasswordResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setResetError('Please enter a valid email address.');
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setResetError('Please enter a valid email address.');
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setIsSendingReset(true);
    try {
      await AuthService.sendPasswordReset(cleanEmail);
      setIsResetSubmitted(true);
      showToast('Password reset email sent. Please check your inbox.', 'success');
    } catch (err: any) {
      console.warn('Password reset error in modal:', err);
      if (err?.code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.');
        showToast('Please enter a valid email address.', 'error');
      } else if (err?.code === 'auth/too-many-requests') {
        setResetError('Too many reset attempts. Please wait a few minutes before trying again.');
        showToast('Too many reset attempts. Please wait a moment.', 'error');
      } else {
        // Prevent account enumeration: show success confirmation
        setIsResetSubmitted(true);
        showToast('If an account exists for this email address, a password reset email has been sent.', 'info');
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  // Secret click handler for modal header
  const secretModalClicksRef = React.useRef(0);
  const secretModalTimerRef = React.useRef<any>(null);

  const handleSecretModalHeaderClick = () => {
    secretModalClicksRef.current += 1;
    if (secretModalTimerRef.current) clearTimeout(secretModalTimerRef.current);
    secretModalTimerRef.current = setTimeout(() => {
      secretModalClicksRef.current = 0;
    }, 3000);

    if (secretModalClicksRef.current >= 5) {
      secretModalClicksRef.current = 0;
      setAuthMode('super_admin');
      showToast('Master Admin Console unlocked', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div
              onClick={handleSecretModalHeaderClick}
              className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md select-none cursor-default"
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3
                onClick={handleSecretModalHeaderClick}
                className="text-base font-bold text-slate-900 dark:text-slate-100 select-none cursor-default"
              >
                User Sign In & Registration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct account access with credentials
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
        <div
          className={`grid ${
            authMode === 'super_admin' ? 'grid-cols-3' : 'grid-cols-2'
          } p-1.5 bg-slate-100 dark:bg-slate-800/80 m-3 rounded-2xl text-xs font-medium`}
        >
          <button
            onClick={() => {
              setAuthMode('login');
              setPendingRegistrationSuccess(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Sign In</span>
          </button>
          <button
            onClick={() => {
              setAuthMode('register');
              setPendingRegistrationSuccess(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Register</span>
          </button>
          {authMode === 'super_admin' && (
            <button
              onClick={() => {
                setAuthMode('super_admin');
                setPendingRegistrationSuccess(null);
              }}
              className="py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-semibold shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-purple-500" />
              <span className="truncate">Super Admin</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Direct Sign In Tab */}
          {authMode === 'login' && (
            <form onSubmit={handleDirectLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address or Mobile Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. name@company.com or 9876543210"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot_password');
                      setIsResetSubmitted(false);
                      setResetError(null);
                      setForgotEmail(loginIdentifier && loginIdentifier.includes('@') ? loginIdentifier.trim() : '');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Registration Tab */}
          {authMode === 'register' && (
            <div>
              {pendingRegistrationSuccess ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100 text-sm">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span>Registration Pending Approval</span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Account request submitted for <strong>{pendingRegistrationSuccess.name}</strong> as{' '}
                    <strong>{pendingRegistrationSuccess.role.replace('_', ' ')}</strong>.{' '}
                    {pendingRegistrationSuccess.role === 'business_owner'
                      ? 'Your business registration is pending approval from the platform admin. You will be notified once approved.'
                      : 'You will be able to log in once your Business Owner approves your request.'}
                  </p>
                  <button
                    onClick={() => {
                      setPendingRegistrationSuccess(null);
                      setAuthMode('login');
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                  >
                    Go to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDirectRegistration} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Role
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRegisterRole('business_owner')}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-xl border ${
                          registerRole === 'business_owner'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterRole('manager')}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-xl border ${
                          registerRole === 'manager'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Manager
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterRole('technician')}
                        className={`py-1.5 px-2 text-[11px] font-bold rounded-xl border ${
                          registerRole === 'technician'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Technician
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Full Name *"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="Email *"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 outline-hidden"
                    />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Mobile Phone *"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 outline-hidden"
                    />
                  </div>

                  {registerRole === 'business_owner' ? (
                    <input
                      type="text"
                      value={regBusinessName}
                      onChange={(e) => setRegBusinessName(e.target.value)}
                      placeholder="Business Name *"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 outline-hidden"
                    />
                  ) : businesses.length > 0 ? (
                    <select
                      value={regBusinessId || businesses[0]?.id}
                      onChange={(e) => setRegBusinessId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 outline-hidden"
                    >
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  <div>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Set Password *"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Forgot Password Tab */}
          {authMode === 'forgot_password' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Reset Password</h3>
                    <p className="text-[11px] text-slate-500 font-normal">Recover your account securely</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setIsResetSubmitted(false);
                    setResetError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-bold cursor-pointer transition-colors"
                >
                  ← Back to Login
                </button>
              </div>

              {!isResetSubmitted ? (
                <form onSubmit={handleSendPasswordResetEmail} noValidate className="space-y-3.5 text-xs">
                  <div>
                    <label htmlFor="modal-reset-email" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Registered Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="modal-reset-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (resetError) setResetError(null);
                        }}
                        placeholder="Enter your registered email"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-hidden transition-all ${
                          resetError
                            ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                    {resetError && (
                      <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold mt-1.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{resetError}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setIsResetSubmitted(false);
                        setResetError(null);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingReset}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 transition-all"
                    >
                      {isSendingReset ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Password Reset Email</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3.5 text-center py-2 animate-in fade-in">
                  <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Password Reset Email Sent
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      If an account exists for this email address, a password reset email has been sent. Please check your inbox and follow the link to create a new password.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setIsResetSubmitted(false);
                        if (forgotEmail.trim()) {
                          setLoginIdentifier(forgotEmail.trim());
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Super Admin Access Tab */}
          {authMode === 'super_admin' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Platform Super Admin</span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Access platform-wide administrative controls, manage multi-tenant registrations, and oversee tenant operations.
                </p>
              </div>

              <form onSubmit={handleSuperAdminLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Super Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    placeholder="admin@serviflow.io"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Master Password
                  </label>
                  <input
                    type="password"
                    required
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                    placeholder="Enter Super Admin password"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSuperAdminSubmitting}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSuperAdminSubmitting ? 'Authenticating...' : 'Sign In to Super Admin Console'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
