import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { BrandLogo } from '../components/BrandLogo';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Clock,
  KeyRound,
  UserCheck,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Phone,
  AlertCircle,
  Gift,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const {
    users,
    loginUser,
    businesses,
    switchRole,
    currentUser,
    showToast,
    registerUser,
    updateUserPassword,
    validateReferralCode,
  } = useApp();

  const [authTab, setAuthTab] = useState<'login' | 'register' | 'super_admin'>('login');

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referral Code Input & Validation State
  const [regReferralCode, setRegReferralCode] = useState('');
  const [referralValidation, setReferralValidation] = useState<{
    isValid: boolean;
    message: string;
    discountPercent: number;
  } | null>(null);

  // Auto-detect referral code or Super Admin portal from URL parameters
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();

      // Check for Super Admin secret direct link: ?admin=portal, ?admin=true, ?superadmin=true, ?portal=admin, #superadmin, etc.
      const isSuperAdminLink =
        urlParams.get('admin') === 'portal' ||
        urlParams.get('admin') === 'true' ||
        urlParams.get('superadmin') === 'true' ||
        urlParams.get('mode') === 'super_admin' ||
        urlParams.get('portal') === 'admin' ||
        hash === '#superadmin' ||
        hash === '#admin';

      if (isSuperAdminLink) {
        setAuthTab('super_admin');
        return;
      }

      const refParam = urlParams.get('ref') || urlParams.get('referral');
      if (refParam) {
        const cleanRef = refParam.trim().toUpperCase();
        setRegReferralCode(cleanRef);
        setAuthTab('register');
        const validation = validateReferralCode(cleanRef);
        setReferralValidation({
          isValid: validation.isValid,
          message: validation.message,
          discountPercent: validation.discountPercent,
        });
      }
    }
  }, [businesses]);

  // Secret keyboard shortcut for Super Admin (Ctrl + Shift + S or Alt + Shift + A)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') ||
        (e.altKey && e.shiftKey && e.key.toLowerCase() === 'a')
      ) {
        e.preventDefault();
        setAuthTab((prev) => (prev === 'super_admin' ? 'login' : 'super_admin'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Secret Logo Multi-Click Trigger (5 clicks within 3 seconds)
  const secretClickCountRef = React.useRef(0);
  const secretClickTimerRef = React.useRef<any>(null);

  const handleSecretLogoClick = () => {
    secretClickCountRef.current += 1;
    if (secretClickTimerRef.current) clearTimeout(secretClickTimerRef.current);
    secretClickTimerRef.current = setTimeout(() => {
      secretClickCountRef.current = 0;
    }, 3000);

    if (secretClickCountRef.current >= 5) {
      secretClickCountRef.current = 0;
      setAuthTab('super_admin');
      showToast('Master Admin Console unlocked', 'info');
    }
  };

  const handleReferralCodeInput = (code: string) => {
    const clean = code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setRegReferralCode(clean);
    if (!clean.trim()) {
      setReferralValidation(null);
      return;
    }
    const val = validateReferralCode(clean);
    setReferralValidation({
      isValid: val.isValid,
      message: val.message,
      discountPercent: val.discountPercent,
    });
  };

  // Super Admin Credentials State
  const [superAdminEmail, setSuperAdminEmail] = useState('admin@serviflow.io');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);
  const [isSuperAdminSubmitting, setIsSuperAdminSubmitting] = useState(false);

  // Forgot Password State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'identifier' | 'verify' | 'new_password' | 'success'>('identifier');
  const [forgotUser, setForgotUser] = useState<User | null>(null);
  const [forgotOtp, setForgotOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regBusinessType, setRegBusinessType] = useState('CCTV & Security');

  // Registration Success Alert State
  const [pendingRegistrationSuccess, setPendingRegistrationSuccess] = useState<User | null>(null);
  // Duplicate Account Alert State
  const [duplicateAccountNotice, setDuplicateAccountNotice] = useState<{
    message: string;
    identifier: string;
    password?: string;
  } | null>(null);

  // Auto-detect business based on email/phone matching or selection
  const cleanId = loginIdentifier.trim().toLowerCase();
  const matchedUser = (users || []).find(
    (u) =>
      cleanId.length >= 3 &&
      ((u.email || '').toLowerCase() === cleanId ||
        (u.phone || '').replace(/[^0-9]/g, '').endsWith(cleanId.replace(/[^0-9]/g, '').slice(-10)))
  );

  let activeBusiness = null;
  if (matchedUser) {
    activeBusiness = businesses.find((b) => b.id === matchedUser.businessId) || null;
  } else if (businesses.length > 0 && businesses[0]?.logo) {
    activeBusiness = businesses[0];
  }

  // Handle Direct Sign In
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = loginIdentifier.trim();

    if (!cleanIdentifier) {
      showToast('Please enter your email address or mobile phone number', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Direct login through AppContext and AuthService
      const loggedIn = await loginUser(
        { email: cleanIdentifier, id: '', name: '', phone: '', role: 'business_owner', businessId: '', status: 'active' },
        loginPassword
      );

      sessionStorage.setItem('serviflow_active_tab', loggedIn.role === 'super_admin' ? 'super_admin' : loggedIn.role === 'technician' ? 'jobs' : 'dashboard');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error('Sign in error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Business Owner Account Registration
  const handleDirectRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim() || !regBusinessName.trim()) {
      showToast('Please complete all required fields including Business Name and Password', 'error');
      return;
    }

    if (regPassword.length < 6) {
      showToast('Password must be at least 6 characters long for secure Firebase Authentication', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        role: 'business_owner',
        businessName: regBusinessName.trim() || `${regName.trim()}'s Services`,
        businessType: regBusinessType || 'CCTV & Security',
      });

      if (result.isPending) {
        setPendingRegistrationSuccess(result.user);
        setDuplicateAccountNotice(null);
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegBusinessName('');
      } else {
        sessionStorage.setItem('serviflow_active_tab', 'dashboard');
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const errMsg = err?.message || 'Registration failed';
      if (errMsg.toLowerCase().includes('already registered')) {
        setDuplicateAccountNotice({
          message: errMsg,
          identifier: regPhone.trim() || regEmail.trim(),
          password: regPassword,
        });
      }
    } finally {
      setIsSubmitting(false);
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
      showToast('Invalid Super Admin credentials. Access is strictly restricted to authorized platform administrators.', 'error');
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
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error('Super Admin sign in error:', err);
    } finally {
      setIsSuperAdminSubmitting(false);
    }
  };

  // FORGOT PASSWORD WORKFLOW HANDLERS
  const handleRequestResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = forgotIdentifier.trim().toLowerCase();
    if (!clean) {
      showToast('Please enter your registered email or mobile number.', 'error');
      return;
    }

    const cleanPhoneDigits = clean.replace(/[^0-9]/g, '');
    const found = users.find((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      const isEmail = uEmail === clean;
      const isPhone = cleanPhoneDigits.length >= 6 && uPhone.endsWith(cleanPhoneDigits.slice(-10));
      return isEmail || isPhone;
    });

    if (!found) {
      showToast('No account found with this email or mobile phone. Please check details.', 'error');
      return;
    }

    // Generate a secure 6-digit verification code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);
    setForgotUser(found);
    setForgotStep('verify');
    showToast(`Verification code generated for ${found.name}: ${otpCode}`, 'success');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotOtp.trim() !== generatedOtp.trim()) {
      showToast('Invalid verification code. Please check and enter the correct 6-digit OTP.', 'error');
      return;
    }
    setForgotStep('new_password');
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUser) return;

    if (forgotNewPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      showToast('New passwords do not match. Please re-enter.', 'error');
      return;
    }

    setIsResetting(true);
    try {
      await updateUserPassword(forgotUser.id, forgotNewPassword);
      setForgotStep('success');
      showToast('Password reset successfully! You can now sign in with your new password.', 'success');
    } catch (err) {
      console.error('Password reset failed:', err);
      showToast('Failed to reset password. Please try again or contact support.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-6 px-4 animate-in fade-in">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {activeBusiness?.logo ? (
            <div
              onClick={handleSecretLogoClick}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 p-1.5 shadow-lg shadow-indigo-500/10 mb-1 overflow-hidden transition-all select-none cursor-default"
            >
              <img
                src={activeBusiness.logo}
                alt={activeBusiness.name}
                className="w-full h-full object-contain rounded-xl pointer-events-none"
              />
            </div>
          ) : (
            <div
              onClick={handleSecretLogoClick}
              className="inline-flex items-center justify-center mb-1 select-none cursor-default transition-transform hover:scale-105"
            >
              <BrandLogo size={64} />
            </div>
          )}

          <h1
            onClick={handleSecretLogoClick}
            className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight select-none cursor-default"
          >
            {activeBusiness?.name || 'ServiFlow'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
            {activeBusiness?.name
              ? `${activeBusiness.name} Employee Portal`
              : 'Field Operations & Service Management System'}
          </p>
        </div>

        {/* Main Clean Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Top Auth Tab Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setPendingRegistrationSuccess(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authTab === 'login'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setPendingRegistrationSuccess(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authTab === 'register'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* SIGN IN TAB */}
          {authTab === 'login' && (
            <form onSubmit={handleDirectLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address or Mobile Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. rajesh@apexsecurity.com or 9876543210"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(true);
                      setForgotStep('identifier');
                      setForgotIdentifier(loginIdentifier || '');
                      setForgotOtp('');
                      setForgotNewPassword('');
                      setForgotConfirmPassword('');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* CREATE ACCOUNT TAB */}
          {authTab === 'register' && (
            <div>
              {pendingRegistrationSuccess ? (
                <div className="p-5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-3 text-amber-900 dark:text-amber-100">
                    <Clock className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-extrabold">Registration Pending Approval</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        Your account request has been submitted successfully.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-amber-200/50">
                    {pendingRegistrationSuccess.role === 'business_owner'
                      ? 'Business owner registrations require platform administrator approval before login access is granted.'
                      : 'Staff member accounts require approval by your Business Owner before first login.'}
                  </p>
                  <button
                    onClick={() => {
                      setPendingRegistrationSuccess(null);
                      setAuthTab('login');
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDirectRegistration} className="space-y-3.5">
                  {duplicateAccountNotice && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-2xl space-y-2.5 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 dark:text-amber-100">
                          <div className="font-bold">{duplicateAccountNotice.message}</div>
                          <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                            An account with this mobile number or email already exists. You can sign in immediately.
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthTab('login');
                            setLoginIdentifier(duplicateAccountNotice.identifier);
                            if (duplicateAccountNotice.password) {
                              setLoginPassword(duplicateAccountNotice.password);
                            }
                            setDuplicateAccountNotice(null);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <span>Sign In Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotIdentifier(duplicateAccountNotice.identifier);
                            setIsForgotPasswordOpen(true);
                            setForgotStep('identifier');
                            setDuplicateAccountNotice(null);
                          }}
                          className="py-2 px-3 rounded-xl bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-bold text-xs transition-all cursor-pointer text-center"
                        >
                          Reset Password (OTP)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Header Info */}
                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                    <div className="font-extrabold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Create Your Business Workspace</span>
                    </div>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                      Register your field service company to manage jobs, field staff, quotes, and billing.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Business Owner Name *
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="rahul@company.com"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Phone *
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="9876543210"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Business / Company Name *
                      </label>
                      <input
                        type="text"
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        placeholder="e.g. Apex Security Solutions"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Industry / Service Domain *
                      </label>
                      <select
                        value={regBusinessType}
                        onChange={(e) => setRegBusinessType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      >
                        <option value="CCTV & Security">CCTV & Security Systems</option>
                        <option value="Solar & Energy">Solar & Renewable Energy</option>
                        <option value="AC Service & HVAC">AC Service & HVAC</option>
                        <option value="Electrical Services">Electrical Services</option>
                        <option value="Plumbing Services">Plumbing Services</option>
                        <option value="Computer & IT Repair">Computer & IT Repair</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Set Master Account Password *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Password (min 6 characters)"
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmitting ? 'Creating Business Workspace...' : 'Create Business Account'}</span>
                  </button>

                  {/* Staff Notice */}
                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Are you a field technician or staff member? Your business owner will invite you and provide your credentials.{' '}
                      <button
                        type="button"
                        onClick={() => setAuthTab('login')}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* SUPER ADMIN ACCORDION / TOGGLE */}
          {authTab === 'super_admin' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 space-y-2">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-extrabold text-sm">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  <span>SaaS Platform Super Admin</span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                  Dedicated high-security portal for platform administrators to manage multi-tenant businesses, global policies, and system operations.
                </p>
              </div>

              <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Super Admin Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={superAdminEmail}
                      onChange={(e) => setSuperAdminEmail(e.target.value)}
                      placeholder="admin@serviflow.io"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Master Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showSuperAdminPassword ? 'text' : 'password'}
                      required
                      value={superAdminPassword}
                      onChange={(e) => setSuperAdminPassword(e.target.value)}
                      placeholder="Enter Super Admin password"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSuperAdminPassword(!showSuperAdminPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showSuperAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSuperAdminSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSuperAdminSubmitting ? 'Authenticating Super Admin...' : 'Sign In to Super Admin Console'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Footer Links */}
        {authTab === 'super_admin' && (
          <div className="text-center pt-1 animate-in fade-in">
            <button
              onClick={() => setAuthTab('login')}
              className="text-xs text-slate-400 hover:text-indigo-600 font-semibold transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <span>← Back to Business Sign In</span>
            </button>
          </div>
        )}
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    Reset Password
                  </h3>
                  <p className="text-xs text-slate-500">
                    Recover your account access in 3 simple steps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Identifier Entry */}
            {forgotStep === 'identifier' && (
              <form onSubmit={handleRequestResetOtp} className="space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enter your registered <strong>Email Address</strong> or <strong>Mobile Phone Number</strong> to receive a 6-digit password reset verification code.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Registered Email or Mobile:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. rajesh@cctvservices.com or 9876543210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-700 dark:text-indigo-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Instant Self-Service Reset
                  </div>
                  <div>An instant 6-digit verification code will be sent to confirm your identity.</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {forgotStep === 'verify' && forgotUser && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-1 text-[11px]">
                  <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Verification Code Sent
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Account: <strong>{forgotUser.name}</strong> ({forgotUser.email || forgotUser.phone})
                  </p>
                  <div className="pt-1 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    Verification OTP: <span className="bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md text-xs">{generatedOtp}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enter 6-Digit OTP Code:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center font-mono font-bold text-base tracking-widest focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setForgotStep('identifier')}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    ← Change Email / Mobile
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Verify Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {forgotStep === 'new_password' && forgotUser && (
              <form onSubmit={handleSaveNewPassword} className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-300">
                  Identity verified! Set your new password for <strong>{forgotUser.name}</strong>.
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password (min 6 characters):
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password:
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                  >
                    {isResetting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save & Reset Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Success Confirmation */}
            {forgotStep === 'success' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Password Reset Complete!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your password has been securely updated. You can now log in to your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    if (forgotUser?.email) setLoginIdentifier(forgotUser.email);
                    setLoginPassword('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
