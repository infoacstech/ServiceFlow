import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Globe, Briefcase, Receipt, Repeat, Plus, CheckCircle2, Clock, MapPin } from 'lucide-react';

export const CustomerPortalView: React.FC = () => {
  const { customers, jobs, invoices, contracts, addJob, currentBusiness } = useApp();

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [serviceNotes, setServiceNotes] = useState('Camera display flickering in main hall.');

  const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const customerJobs = jobs.filter((j) => j.customerId === customer?.id);
  const customerInvoices = invoices.filter((inv) => inv.customerId === customer?.id);
  const customerContracts = contracts.filter((c) => c.customerId === customer?.id);

  const handleBookService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    addJob({
      customerId: customer.id,
      serviceId: 'srv-1',
      description: `Customer Portal Request: ${serviceNotes}`,
      priority: 'high',
      assignedStaffId: 'user-tech-1',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '02:00 PM',
      location: customer.address,
      estimatedAmount: 1500,
      status: 'new',
    });

    setIsBookModalOpen(false);
    alert('Your service request has been submitted to the dispatch team!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Customer Switcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Customer Self-Service Web Portal
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">Welcome, {customer?.name}</h1>
          <p className="text-xs text-slate-500">Service Portal powered by {currentBusiness.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold border"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                Simulate Portal as: {c.name} ({c.companyName || 'Individual'})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Request Service Call
          </button>
        </div>
      </div>

      {/* Customer Live Jobs */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-600" /> Active Service Calls & Repair Status
        </h2>

        <div className="space-y-3">
          {customerJobs.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No active service calls for this customer.</div>
          ) : (
            customerJobs.map((j) => (
              <div key={j.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{j.jobId} - {j.description}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Scheduled: {j.scheduledDate} ({j.scheduledTime})</div>
                </div>
                <span className="font-extrabold text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full text-[10px]">
                  {j.status.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleBookService} className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Request Service Visit</h3>
            <div className="text-xs space-y-2">
              <label className="font-semibold block">Describe Equipment Issue / Request</label>
              <textarea
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                className="w-full p-3 rounded-xl border bg-slate-50 h-24"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                Submit Service Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
