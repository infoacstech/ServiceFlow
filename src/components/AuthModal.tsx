import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import {
  Mail,
  Lock,
  X,
  ArrowRight,
  KeyRound,
  UserPlus,
  Clock,
  ShieldCheck,
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
    showToast,
    registerUser,
  } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'super_admin'>('login');

  // Direct Login States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = loginIdentifier.trim().toLowerCase();
    if (!clean) {
      showToast('Please enter your email or mobile number', 'error');
      return;
    }

    const matchedUser = (users || []).find(
      (u) =>
        u.email.toLowerCase() === clean ||
        u.phone.replace(/[^0-9]/g, '').endsWith(clean.replace(/[^0-9]/g, '').slice(-10))
    );

    if (!matchedUser) {
      showToast('No user account found with this email or mobile number.', 'error');
      return;
    }

    if (matchedUser.password && loginPassword && matchedUser.password !== loginPassword) {
      showToast('Incorrect password. Please try again.', 'error');
      return;
    }

    const userBiz = (businesses || []).find((b) => b.id === matchedUser.businessId);

    if (userBiz?.status === 'suspended') {
      showToast('Your business account access has been suspended by the platform admin.', 'error');
      return;
    }

    if (matchedUser.role === 'business_owner') {
      const bizStatus = userBiz?.status || matchedUser.approvalStatus || 'active';
      if (bizStatus === 'pending' || matchedUser.approvalStatus === 'pending') {
        showToast('Your business registration is pending approval from the platform admin.', 'error');
        return;
      }
      if (bizStatus === 'rejected' || matchedUser.approvalStatus === 'rejected') {
        showToast('Your registration was rejected by the platform admin.', 'error');
        return;
      }
      if (bizStatus === 'suspended' || matchedUser.approvalStatus === 'suspended') {
        showToast('Your business account access has been suspended.', 'error');
        return;
      }
    } else if (matchedUser.role !== 'super_admin') {
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
        showToast('Your access has been blocked by the business owner.', 'error');
        return;
      }
    }

    setCurrentUser(matchedUser);
    if (matchedUser.businessId && matchedUser.businessId !== 'all') {
      switchBusiness(matchedUser.businessId);
    }
    showToast(`Welcome back, ${matchedUser.name}!`, 'success');
    onClose();
  };

  const handleDirectRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      showToast('Please complete all required fields including password', 'error');
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
      onClose();
    }
  };

  const handleSuperAdminLogin = () => {
    switchRole('super_admin');
    showToast('Authenticated as SaaS Super Admin', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
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
        <div className="grid grid-cols-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 m-3 rounded-2xl text-xs font-medium">
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
          <button
            onClick={() => {
              setAuthMode('super_admin');
              setPendingRegistrationSuccess(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'super_admin'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-purple-500" />
            <span className="truncate">Super Admin</span>
          </button>
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
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

          {/* Super Admin Access Tab */}
          {authMode === 'super_admin' && (
            <div className="space-y-3">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Platform Super Admin</span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Access platform-wide administrative controls, manage multi-tenant registrations, and oversee tenant operations.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSuperAdminLogin}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Enter Super Admin Console</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
