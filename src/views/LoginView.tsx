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
  Building2,
  UserPlus,
  Clock,
  KeyRound,
  UserCheck,
  Sparkles,
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
  } = useApp();

  const [authTab, setAuthTab] = useState<'login' | 'register' | 'super_admin'>('login');

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Form State
  const [registerRole, setRegisterRole] = useState<'business_owner' | 'manager' | 'technician'>('business_owner');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusinessId, setRegBusinessId] = useState(businesses[0]?.id || 'biz-1');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regBusinessType, setRegBusinessType] = useState('CCTV & Security');

  // Selected Organization state for custom logo preview on sign-in
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // Registration Success Alert State
  const [pendingRegistrationSuccess, setPendingRegistrationSuccess] = useState<User | null>(null);

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
  } else if (selectedOrgId) {
    activeBusiness = businesses.find((b) => b.id === selectedOrgId) || null;
  } else if (businesses.length > 0 && businesses[0]?.logo) {
    activeBusiness = businesses[0];
  }

  // Handle Direct Sign In
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = loginIdentifier.trim().toLowerCase();

    if (!cleanIdentifier) {
      showToast('Please enter your email address or mobile phone number', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find user locally by email or phone
      let matchedUser = (users || []).find(
        (u) =>
          (u.email || '').toLowerCase() === cleanIdentifier ||
          (u.phone || '').replace(/[^0-9]/g, '').endsWith(cleanIdentifier.replace(/[^0-9]/g, '').slice(-10))
      );

      // Firestore fallback query if not in local memory yet
      if (!matchedUser) {
        try {
          const qEmail = query(collection(db, 'users'), where('email', '==', cleanIdentifier));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            matchedUser = snapEmail.docs[0].data() as User;
          } else {
            const digitsOnly = cleanIdentifier.replace(/[^0-9]/g, '');
            if (digitsOnly.length >= 6) {
              const allUsersSnap = await getDocs(collection(db, 'users'));
              const foundDoc = allUsersSnap.docs.find((d) => {
                const uData = d.data() as User;
                return (uData.phone || '').replace(/[^0-9]/g, '').endsWith(digitsOnly.slice(-10));
              });
              if (foundDoc) {
                matchedUser = foundDoc.data() as User;
              }
            }
          }
        } catch (fsErr) {
          console.warn('Firestore fallback user query error:', fsErr);
        }
      }

      if (!matchedUser) {
        showToast('No account found with this email or mobile phone. Please check details or register.', 'error');
        setIsSubmitting(false);
        return;
      }

      // Password Check
      if (matchedUser.password && loginPassword && matchedUser.password !== loginPassword) {
        showToast('Incorrect password. Please try again.', 'error');
        setIsSubmitting(false);
        return;
      }

      // Business & Status Checks
      const userBiz = (businesses || []).find((b) => b.id === matchedUser.businessId);

      if (userBiz?.status === 'suspended') {
        showToast('Your business account access has been suspended by the platform admin.', 'error');
        setIsSubmitting(false);
        return;
      }

      if (matchedUser.role === 'business_owner') {
        const bizStatus = userBiz?.status || matchedUser.approvalStatus || 'active';
        if (bizStatus === 'pending' || matchedUser.approvalStatus === 'pending') {
          showToast('Your business registration is pending approval from the platform admin.', 'error');
          setIsSubmitting(false);
          return;
        }
        if (bizStatus === 'rejected' || matchedUser.approvalStatus === 'rejected') {
          showToast('Your registration was rejected by the platform admin.', 'error');
          setIsSubmitting(false);
          return;
        }
        if (bizStatus === 'suspended' || matchedUser.approvalStatus === 'suspended') {
          showToast('Your business account access has been suspended.', 'error');
          setIsSubmitting(false);
          return;
        }
      } else if (matchedUser.role !== 'super_admin') {
        const staffStatus = matchedUser.approvalStatus || 'active';
        if (staffStatus === 'pending') {
          showToast('Waiting for Owner approval. Contact your business owner to activate your account.', 'error');
          setIsSubmitting(false);
          return;
        }
        if (staffStatus === 'rejected') {
          showToast('Your registration was rejected by the business owner.', 'error');
          setIsSubmitting(false);
          return;
        }
        if (staffStatus === 'blocked' || staffStatus === 'suspended') {
          showToast('Your access has been blocked by the business owner.', 'error');
          setIsSubmitting(false);
          return;
        }
      }

      // Execute Login & Set Active Tab
      sessionStorage.setItem('serviflow_active_tab', matchedUser.role === 'super_admin' ? 'super_admin' : 'dashboard');
      await loginUser(matchedUser, loginPassword);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Account Registration
  const handleDirectRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      showToast('Please complete all required fields including password', 'error');
      return;
    }

    if (regPassword.length < 4) {
      showToast('Password should be at least 4 characters long', 'error');
      return;
    }

    const result = registerUser({
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
      if (onLoginSuccess) onLoginSuccess();
    }
  };

  const handleSuperAdminLogin = () => {
    switchRole('super_admin');
    showToast('Authenticated as SaaS Super Admin', 'success');
    if (onLoginSuccess) onLoginSuccess();
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
              {businesses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Company Organization (Optional)
                    </label>
                    {activeBusiness?.logo && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Custom Logo
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedOrgId || activeBusiness?.id || ''}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="">Auto-Detect from Email/Mobile</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
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
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>
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

        {/* Bottom Footer Link */}
        <div className="text-center pt-1">
          {authTab !== 'super_admin' ? (
            <button
              onClick={() => setAuthTab('super_admin')}
              className="text-xs text-slate-400 hover:text-purple-600 font-semibold transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>Platform Super Admin Access</span>
            </button>
          ) : (
            <button
              onClick={() => setAuthTab('login')}
              className="text-xs text-slate-400 hover:text-indigo-600 font-semibold transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <span>← Back to Business Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
