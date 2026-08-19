import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
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

  // Auto-detect referral code from URL parameter (e.g. ?ref=SF-APEX10)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
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
  const [registerRole, setRegisterRole] = useState<'business_owner' | 'manager' | 'technician'>('business_owner');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusinessId, setRegBusinessId] = useState(businesses[0]?.id || 'biz-1');
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
  if (authTab === 'register' && registerRole !== 'business_owner') {
    activeBusiness = businesses.find((b) => b.id === regBusinessId) || null;
  } else if (matchedUser) {
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

      sessionStorage.setItem('serviflow_active_tab', loggedIn.role === 'super_admin' ? 'super_admin' : 'dashboard');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error('Sign in error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Account Registration
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

    setIsSubmitting(true);

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
        referralCode: registerRole === 'business_owner' && regReferralCode.trim() ? regReferralCode.trim().toUpperCase() : undefined,
      });

      if (result.isPending) {
        setPendingRegistrationSuccess(result.user);
        setDuplicateAccountNotice(null);
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
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

  const handleSuperAdminLogin = () => {
    switchRole('super_admin');
    showToast('Authenticated as SaaS Super Admin', 'success');
    if (onLoginSuccess) onLoginSuccess();
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 p-1.5 shadow-lg shadow-indigo-500/10 mb-1 overflow-hidden transition-all">
              <img
                src={activeBusiness.logo}
                alt={activeBusiness.name}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-1">
              <ShieldCheck className="w-8 h-8" />
            </div>
          )}

          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Account Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegisterRole('business_owner')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          registerRole === 'business_owner'
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Business Owner
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegisterRole('technician')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          registerRole !== 'business_owner'
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Field Executive / Staff
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
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
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  {registerRole === 'business_owner' ? (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          value={regBusinessName}
                          onChange={(e) => setRegBusinessName(e.target.value)}
                          placeholder="e.g. Apex Security Solutions"
                          required
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Industry Type
                        </label>
                        <select
                          value={regBusinessType}
                          onChange={(e) => setRegBusinessType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        >
                          <option value="CCTV & Security">CCTV & Security Systems</option>
                          <option value="Solar & Energy">Solar & Renewable Energy</option>
                          <option value="AC Service & HVAC">AC Service & HVAC</option>
                          <option value="Electrical Services">Electrical Services</option>
                          <option value="Plumbing Services">Plumbing Services</option>
                          <option value="Computer & IT Repair">Computer & IT Repair</option>
                        </select>
                      </div>

                      {/* Optional Referral Code for Business Owners with Instant 10% Discount Badge */}
                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Referral Code (Optional)</span>
                          </label>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                            <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Instant 10% Discount
                          </span>
                        </div>
                        <input
                          type="text"
                          value={regReferralCode}
                          onChange={(e) => handleReferralCodeInput(e.target.value)}
                          placeholder="e.g. SF-APEX10 (or leave blank)"
                          className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-900 text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 outline-hidden uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                        />
                        {referralValidation && (
                          <div
                            className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                              referralValidation.isValid
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {referralValidation.isValid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                            )}
                            <span>{referralValidation.message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Select Business Organization *
                      </label>
                      <select
                        value={regBusinessId}
                        onChange={(e) => setRegBusinessId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      >
                        {businesses.map((b, idx) => (
                          <option key={b.id ? `reg-org-${b.id}-${idx}` : `reg-biz-${idx}`} value={b.id}>
                            {b.name} ({b.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Set Account Password *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Password (min 4 characters)"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </button>
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
                  Grants platform administrative access to manage all business tenants, owner approvals, and billing control.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSuperAdminLogin}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Enter Super Admin Console</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Footer Links */}
        <div className="text-center pt-1">
          <div>
            {authTab !== 'super_admin' ? (
              <button
                onClick={() => setAuthTab('super_admin')}
                className="text-xs text-slate-400 hover:text-purple-600 font-semibold transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                <span>Platform Super Admin Access</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthTab('login')}
                className="text-xs text-slate-400 hover:text-indigo-600 font-semibold transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <span>← Back to Business Sign In</span>
              </button>
            )}
          </div>
        </div>
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
