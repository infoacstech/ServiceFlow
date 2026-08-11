import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone,
  Mail,
  Lock,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Building2,
  LogOut,
  User,
  KeyRound,
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
    addStaff,
  } = useApp();

  const [authTab, setAuthTab] = useState<'mobile' | 'email' | 'super_admin' | 'quick'>('mobile');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'business_owner' | 'manager' | 'technician'>('technician');
  const [newName, setNewName] = useState('');

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    setOtpSent(true);
    setOtpCode('1234'); // Default pre-filled OTP for fast testing
    showToast(`OTP sent to +91 ${phoneNumber}! (Demo OTP: 1234)`, 'info');
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== '1234' && otpCode.length < 4) {
      showToast('Please enter valid 4-digit OTP (Try: 1234)', 'error');
      return;
    }

    // Match existing user by phone
    const matchedUser = users.find((u) =>
      u.phone.replace(/[^0-9]/g, '').endsWith(phoneNumber.replace(/[^0-9]/g, '').slice(-10))
    );

    if (matchedUser) {
      setCurrentUser(matchedUser);
      switchBusiness(matchedUser.businessId);
      showToast(`Logged in successfully as ${matchedUser.name} (${matchedUser.role})`, 'success');
      if (onLoginSuccess) onLoginSuccess();
    } else {
      // Register new staff user with this phone number
      const nameToUse = newName.trim() || `User (${phoneNumber.slice(-4)})`;
      const createdUser = addStaff({
        name: nameToUse,
        email: `${phoneNumber}@serviflow.app`,
        phone: `+91 ${phoneNumber}`,
        role: selectedRole,
        status: 'active',
      });
      setCurrentUser(createdUser);
      showToast(`Account created & logged in for ${nameToUse}`, 'success');
      if (onLoginSuccess) onLoginSuccess();
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter an email address', 'error');
      return;
    }

    const matchedUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matchedUser) {
      setCurrentUser(matchedUser);
      switchBusiness(matchedUser.businessId);
      showToast(`Welcome back, ${matchedUser.name}!`, 'success');
      if (onLoginSuccess) onLoginSuccess();
    } else {
      showToast('No user account found with this email. Try Quick Switch or Mobile OTP.', 'error');
    }
  };

  const handleQuickSwitch = (u: any) => {
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
              <span>ServiFlow Authentication & Access Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              User & Technician Login Panel
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              Sign in with your Mobile Number (OTP), Email address, or access the Super Admin SaaS portal.
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
            Choose Login Method
          </h3>

          <button
            onClick={() => {
              setAuthTab('mobile');
              setOtpSent(false);
            }}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-semibold transition-all text-left ${
              authTab === 'mobile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <div className={`p-2 rounded-xl ${authTab === 'mobile' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'}`}>
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Mobile Number (OTP)</div>
              <div className={`text-[10px] ${authTab === 'mobile' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                10-Digit Phone Verification
              </div>
            </div>
          </button>

          <button
            onClick={() => setAuthTab('email')}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-xs font-semibold transition-all text-left ${
              authTab === 'email'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <div className={`p-2 rounded-xl ${authTab === 'email' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'}`}>
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Email Login</div>
              <div className={`text-[10px] ${authTab === 'email' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Password or Direct Mail
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
                Instant Staff Account Toggle
              </div>
            </div>
          </button>
        </div>

        {/* Right Form Content Column */}
        <div className="lg:col-span-8 p-6 sm:p-8">
          {/* TAB 1: Mobile Phone OTP */}
          {authTab === 'mobile' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <span>Mobile Phone Login & OTP</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter your 10-digit mobile number to log in or create a new technician / manager profile.
                </p>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="9876543210"
                        maxLength={10}
                        required
                        className="w-full pl-20 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Your Name (Required for new registration)
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Role (if new user)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'technician', label: 'Technician' },
                        { id: 'manager', label: 'Manager' },
                        { id: 'business_owner', label: 'Owner' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRole(r.id as any)}
                          className={`py-2.5 px-2 text-xs rounded-xl border font-semibold transition-all ${
                            selectedRole === r.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400'
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
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Get OTP Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                    <p className="font-bold text-sm">OTP Sent to +91 {phoneNumber}</p>
                    <p className="text-xs mt-1 text-indigo-700 dark:text-indigo-300">
                      Use instant verification code: <strong className="font-mono text-base text-indigo-950 dark:text-white px-2 py-0.5 bg-indigo-200/60 dark:bg-indigo-900 rounded-md">1234</strong>
                    </p>
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
                      className="w-full text-center tracking-[0.8em] font-mono font-black text-2xl px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Verify OTP & Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-center"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Email Login */}
          {authTab === 'email' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <span>Email Sign In</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Log in with your registered corporate or staff email address.
                </p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rajesh@securitysolutions.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
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
                  Click on any staff profile below to switch instantly without password:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  const bizName = businesses.find((b) => b.id === u.businessId)?.name || 'ServiceFlow';
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleQuickSwitch(u)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 shadow-xs'
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
                              <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-md font-semibold">
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
                      <button className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0 ml-2">
                        Login
                      </button>
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
