import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Building2, Users, DollarSign, CheckCircle2 } from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const { businesses, switchBusiness, currentBusiness } = useApp();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/30">
            SaaS Super Administrator Console
          </span>
          <h1 className="text-xl font-black mt-1">Multi-Tenant Platform Master Control</h1>
          <p className="text-xs text-purple-200">Manage onboarded service business subscriptions, tenant isolation, & system health</p>
        </div>
      </div>

      {/* SaaS Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Onboarded Businesses</div>
          <div className="text-2xl font-black text-purple-600">{businesses.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Isolated Data Tenants</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 mb-1">Active Subscriptions</div>
          <div className="text-2xl font-black text-emerald-600">{businesses.length}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">100% Active Paying Accounts</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500 mb-1">Estimated Platform ARR</div>
          <div className="text-2xl font-black text-indigo-600">₹{businesses.length * 24000}</div>
          <div className="text-[10px] text-indigo-600 font-bold mt-1">Annual Recurring Revenue</div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b font-bold text-sm text-slate-900 dark:text-slate-100">
          Registered Business Tenants
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="p-3.5">Business Name</th>
                <th className="p-3.5">Industry Type</th>
                <th className="p-3.5">Contact Phone</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5">Plan Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{b.name}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                      {b.type}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{b.mobile}</td>
                  <td className="p-3.5 font-mono text-slate-500">{b.gstNumber || 'Unregistered'}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                      PRO ACTIVE
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => switchBusiness(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xs"
                    >
                      Inspect Tenant Context
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
