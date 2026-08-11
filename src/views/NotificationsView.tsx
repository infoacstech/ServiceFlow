import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { notifications, markNotificationRead, currentBusiness } = useApp();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" /> Notifications & WhatsApp Alerts Center
          </h1>
          <p className="text-xs text-slate-500">Live operational alerts & WhatsApp template previewer for {currentBusiness.name}</p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">System Audit Logs & Alerts</h2>
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markNotificationRead(n.id)}
            className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
              n.read
                ? 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800 text-slate-500'
                : 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100 font-medium'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{n.title}</span>
              <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
