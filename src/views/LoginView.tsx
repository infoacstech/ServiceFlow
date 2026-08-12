import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, User } from '../types';
import {
  Phone,
  Mail,
  Lock,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  UserPlus,
  Clock,
  Ban,
  XCircle,
  KeyRound,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const {
    users,
    setCurrentUser,
    businesses,
    switchBusiness,
    switchRole,
    currentUser,
    showToast,
    registerUser,
  } = useApp();

  const [authTab, setAuthTab] = useState<'login' | 'register' | 'super_admin' | 'quick'>('login');

  // Direct Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Phone
  const [loginPassword, setLoginPassword] = useState('');

  // Direct Registration Form States
  const [registerRole, setRegisterRole] = useState<'business_owner' | 'manager' | 'technician'>('business_owner');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusinessId, setRegBusinessId] = useState(businesses[0]?.id || 'biz-1');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regBusinessType, setRegBusinessType] = useState('CCTV & Security');

  // Registration Result Alert State
  const [pendingRegistrationSuccess, setPendingRegistrationSuccess] = useState<User | null>(null);

  // Handle Direct Password Login
  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = loginIdentifier.trim().toLowerCase();

    if (!cleanIdentifier) {
      showToast('Please enter your email address or mobile phone number', 'error');
      return;
    }

    // Match existing user by email or phone
    const matchedUser = (users || []).find(
      (u) =>
        u.email.toLowerCase() === cleanIdentifier ||
        u.phone.replace(/[^0-9]/g, '').endsWith(cleanIdentifier.replace(/[^0-9]/g, '').slice(-10))
    );

    if (!matchedUser) {
      showToast('No user account found with this email or mobile phone number.', 'error');
      return;
    }

    // Password Validation (if password set on user record)
    if (matchedUser.password && loginPassword && matchedUser.password !== loginPassword) {
      showToast('Incorrect password. Please try again.', 'error');
      return;
    }

    // ENFORCE TWO-LAYER APPROVAL & ACCESS CHECKS
    const userBiz = (businesses || []).find((b) => b.id === matchedUser.businessId);

    // Business level status check
    if (userBiz?.status === 'suspended') {
      showToast('Your business account access has been suspended by the platform admin.', 'error');
      return;
    }

    // Role-specific approval checks
    if (matchedUser.role === 'business_owner') {
      const bizStatus = userBiz?.status || matchedUser.approvalStatus || 'active';
      if (bizStatus === 'pending' || matchedUser.approvalStatus === 'pending') {
        showToast('Your business registration is pending approval from the platform admin. You will be notified once approved.', 'error');
        return;
      }
      if (bizStatus === 'rejected' || matchedUser.approvalStatus === 'rejected') {
        showToast('Your registration was rejected by the platform admin.', 'error');
        return;
      }
      if (bizStatus === 'suspended' || matchedUser.approvalStatus === 'suspended') {
        showToast('Your business account access has been suspended by the platform admin.', 'error');
        return;
      }
    } else if (matchedUser.role !== 'super_admin') {
      // Manager & Field Executive (Owner approval layer)
      const staffStatus = matchedUser.approvalStatus || 'active';
      if (staffStatus === 'pending') {
        showToast('Waiting for Owner approval. Contact your business owner to activate your account.', 'error');
        return;
      }
      if (staffStatus === 'rejected') {
        showToast('Your registration was rejected by the business owner.', 'error');
        return;
      }
      if (staffStatus === 'blocked' || staffStatus === 'suspended') {
        showToast('Your access has been blocked by the business owner. Contact them for details.', 'error');
        return;
      }
    }

    // Status is 'active' -> Allow login
    setCurrentUser(matchedUser);
    switchBusiness(matchedUser.businessId);
    showToast(`Welcome back, ${matchedUser.name}!`, 'success');
    if (onLoginSuccess) onLoginSuccess();
  };

  // Handle Direct Registration
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

    // Call registerUser from context
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

  // Quick Switch for Demo Accounts with status enforcement
  const handleQuickSwitch = (u: User) => {
    const userBiz = (businesses || []).find((b) => b.id === u.businessId);

    if (userBiz?.status === 'suspended') {
      showToast('Your business account access has been suspended by the platform admin.', 'error');
      return;
    }

    if (u.role === 'business_owner') {
      const bizStatus = userBiz?.status || u.approvalStatus || 'active';
      if (bizStatus === 'pending' || u.approvalStatus === 'pending') {
        showToast('Your business registration is pending approval from the platform admin. You will be notified once approved.', 'error');
        return;
      }
      if (bizStatus === 'rejected' || u.approvalStatus === 'rejected') {
        showToast('Your registration was rejected by the platform admin.', 'error');
        return;
      }
      if (bizStatus === 'suspended' || u.approvalStatus === 'suspended') {
        showToast('Your business account access has been suspended by the platform admin.', 'error');
        return;
      }
    } else if (u.role !== 'super_admin') {
      const staffStatus = u.approvalStatus || 'active';
      if (staffStatus === 'pending') {
        showToast('Waiting for Owner approval. Contact your business owner to activate your account.', 'error');
        return;
      }
      if (staffStatus === 'rejected') {
        showToast('Your registration was rejected by the business owner.', 'error');
        return;
      }
      if (staffStatus === 'blocked' || staffStatus === 'suspended') {
        showToast('Your access has been blocked by the business owner. Contact them for details.', 'error');
        return;
      }
    }

    setCurrentUser(u);
    switchBusiness(u.businessId);
    showToast(`Logged in as ${u.name} (${u.role.replace('_', ' ')})`, 'success');
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleSuperAdminLogin = () => {
    switchRole('super_admin');
    showToast('Switched to Super Admin Platform Dashboard!', 'success');
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in py-2">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ServiFlow SaaS Authentication & Access Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Direct Account Sign In & Registration
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              No magic links or email invites required. Create account with your password or sign in directly.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-xs">
              <div className="text-indigo-200 text-[10px] uppercase tracking-wider font-semibold">Currently Active</div>
              <div className="font-bold text-white truncate max-w-[140px]">{currentUser.name}</div>
              <div className="text-indigo-300 capitalize text-[11px]">{currentUser.role.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Options / Tabs Column */}
        <div className="lg:col-span-4 p-5 bg-slate-50/80 dark:bg-slate-800/50 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-3">
            Authentication Mode
          </h3>

          <button
            onClick={() => {
              setAuthTab('login');
              setPendingRegistrationSuccess(null);
            }}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-semibold transition-all text-left ${
              authTab === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <div className={`p-2 rounded-xl ${authTab === 'login' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'}`}>
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Direct Account Login</div>
              <div className={`text-[10px] ${authTab === 'login' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Email / Phone + Password
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setAuthTab('register');
              setPendingRegistrationSuccess(null);
            }}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-semibold transition-all text-left ${
              authTab === 'register'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <div className={`p-2 rounded-xl ${authTab === 'register' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'}`}>
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Create New Account</div>
              <div className={`text-[10px] ${authTab === 'register' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Owner, Manager, or Field Tech
              </div>
            </div>
          </button>

          <button
            onClick={() => setAuthTab('super_admin')}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-semibold transition-all text-left ${
              authTab === 'super_admin'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/80'
            }`}
          >
            <div className={`p-2 rounded-xl ${authTab === 'super_admin' ? 'bg-purple-500 text-white' : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Super Admin Access</div>
              <div className={`text-[10px] ${authTab === 'super_admin' ? 'text-purple-100' : 'text-purple-600 dark:text-purple-400'}`}>
                Platform Multi-Tenant Admin
              </div>
            </div>
          </button>

          <button
            onClick={() => setAuthTab('quick')}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-semibold transition-all text-left ${
              authTab === 'quick'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <div className={`p-2 rounded-xl ${authTab === 'quick' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'}`}>
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Switch Demo Account</div>
              <div className={`text-[10px] ${authTab === 'quick' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Test Active / Pending / Blocked
              </div>
            </div>
          </button>
        </div>

        {/* Right Form Content Column */}
        <div className="lg:col-span-8 p-6 sm:p-8">
          {/* TAB 1: Direct Password Login */}
          {authTab === 'login' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  <span>Direct Account Sign In</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter your Email address or Mobile phone number and password to log in.
                </p>
              </div>

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
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Account Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900 text-[11px] text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                  <span>
                    <strong>Owner Approval Enforced:</strong> New Manager & Field Executive accounts require approval by the Business Owner before first login.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Direct Registration (No Links) */}
          {authTab === 'register' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  <span>Direct Account Registration</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create your account with name, contact details, and set your own password. No magic links.
                </p>
              </div>

              {pendingRegistrationSuccess ? (
                <div className="p-6 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-3xl space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-amber-900 dark:text-amber-100">
                      Registration Submitted & Pending Approval!
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-1 leading-relaxed">
                      Thank you, <strong>{pendingRegistrationSuccess.name}</strong>. Your account registration as{' '}
                      <strong>{pendingRegistrationSuccess.role.replace('_', ' ')}</strong> has been created with status{' '}
                      <span className="font-mono font-bold bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded text-amber-950 dark:text-white">pending</span>.
                    </p>
                  </div>
                  <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    {pendingRegistrationSuccess.role === 'business_owner' ? (
                      <p>• <strong>Platform Admin Approval Required:</strong> Your business registration is pending approval from the platform admin. You will be notified once approved.</p>
                    ) : (
                      <p>• <strong>Owner Approval Required:</strong> You cannot log in until the Business Owner approves your request.</p>
                    )}
                    <p>• <strong>Password Saved:</strong> Once approved, you can log in immediately using the password you just set.</p>
                  </div>
                  <button
                    onClick={() => {
                      setPendingRegistrationSuccess(null);
                      setAuthTab('login');
                    }}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Go to Login Page
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDirectRegistration} className="space-y-4">
                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Registration Type *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegisterRole('business_owner')}
                        className={`p-3 text-left rounded-2xl border transition-all ${
                          registerRole === 'business_owner'
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/90 border-indigo-500 ring-1 ring-indigo-500 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-extrabold text-xs">Business Owner</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          Pending Admin Approval
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegisterRole('manager')}
                        className={`p-3 text-left rounded-2xl border transition-all ${
                          registerRole === 'manager'
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/90 border-indigo-500 ring-1 ring-indigo-500 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-extrabold text-xs">Manager</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          Pending Owner Approval
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegisterRole('technician')}
                        className={`p-3 text-left rounded-2xl border transition-all ${
                          registerRole === 'technician'
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/90 border-indigo-500 ring-1 ring-indigo-500 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-extrabold text-xs">Field Executive</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          Pending Owner Approval
                        </div>
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Business Details vs Business Selector */}
                  {registerRole === 'business_owner' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          New Business Name *
                        </label>
                        <input
                          type="text"
                          value={regBusinessName}
                          onChange={(e) => setRegBusinessName(e.target.value)}
                          placeholder="e.g. Apex Security Solutions"
                          required
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Industry Type
                        </label>
                        <select
                          value={regBusinessType}
                          onChange={(e) => setRegBusinessType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        >
                          <option value="CCTV & Security">CCTV & Security Systems</option>
                          <option value="Solar & Energy">Solar & Energy Solutions</option>
                          <option value="AC Service & HVAC">AC Service & HVAC</option>
                          <option value="Electrical Services">Electrical Services</option>
                          <option value="Plumbing Services">Plumbing Services</option>
                          <option value="Computer & IT Repair">Computer & IT Services</option>
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
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
                      Set Your Account Password *
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Enter a secure password"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {registerRole === 'business_owner'
                        ? 'Register Business & Sign In'
                        : 'Submit Account Registration'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: Super Admin */}
          {authTab === 'super_admin' && (
            <div className="space-y-6 max-w-md">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80">
                <div className="flex items-center gap-2.5 text-purple-900 dark:text-purple-200 font-bold text-base">
                  <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <span>SaaS Platform Super Admin</span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-2 leading-relaxed">
                  Super Admin role grants complete administrative control over all tenant businesses, global subscription billing, white-label settings, and system logs.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium space-y-1">
                  <p>✔ Manage all registered businesses</p>
                  <p>✔ View platform revenue analytics & SaaS billing</p>
                  <p>✔ Create multi-tenant organizations</p>
                </div>

                <button
                  onClick={handleSuperAdminLogin}
                  className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Log In as Super Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Quick Switch */}
          {authTab === 'quick' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <span>Quick Demo Staff Login</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click on any account below to test login logic (including Active, Pending, and Blocked checks):
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(users || []).map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const bizName = (businesses || []).find((b) => b.id === u.businessId)?.name || 'ServiFlow';
                  const status = u.approvalStatus || 'active';

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleQuickSwitch(u)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 shadow-xs'
                          : status === 'blocked'
                          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60'
                          : status === 'pending'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60'
                          : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-sm text-slate-800 dark:text-slate-100 shrink-0">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate capitalize">
                            {u.role.replace('_', ' ')} • {bizName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">{u.phone}</div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {status === 'blocked' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            Blocked
                          </span>
                        ) : status === 'pending' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            Pending
                          </span>
                        ) : (
                          <button className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                            Login
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
