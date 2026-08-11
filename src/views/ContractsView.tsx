import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RecurringContract } from '../types';
import { Repeat, Plus, Calendar, AlertTriangle, CheckCircle2, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export const ContractsView: React.FC = () => {
  const { contracts, customers, addJob, currentBusiness } = useApp();

  const handleScheduleNextVisit = (c: RecurringContract) => {
    addJob({
      customerId: c.customerId,
      serviceId: 'srv-1',
      description: `AMC Contract Scheduled Visit: ${c.name} (${c.contractNumber})`,
      priority: 'medium',
      assignedStaffId: 'user-tech-1',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '11:00 AM',
      location: customers.find((cust) => cust.id === c.customerId)?.address || 'Site Location',
      estimatedAmount: 0,
      status: 'assigned',
    });
    alert(`New maintenance job scheduled for contract ${c.contractNumber}!`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-600" /> Recurring Service Contracts & AMC ({contracts.length})
          </h1>
          <p className="text-xs text-slate-500">Annual maintenance contracts, visit quotas, automated expiry alerts, & recurring dispatch</p>
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contracts.map((contract) => {
          const customer = customers.find((c) => c.id === contract.customerId);
          const percentUsed = (contract.visitsUsed / contract.visitsAllowed) * 100;

          return (
            <div
              key={contract.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-indigo-600 font-mono">{contract.contractNumber}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      contract.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : contract.status === 'expiring_soon'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {contract.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{contract.name}</h3>
                <div className="text-xs font-semibold text-indigo-600 mt-0.5">{customer?.name} ({customer?.companyName})</div>

                {/* Progress bar of visits */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Visits Completed</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {contract.visitsUsed} of {contract.visitsAllowed} ({contract.visitFrequency})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Contract End Date</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{contract.endDate}</div>
                </div>

                <button
                  onClick={() => handleScheduleNextVisit(contract)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  Schedule Next Visit <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
