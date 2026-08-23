import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Megaphone,
  Volume2,
  CheckCheck,
  Radio,
  Sparkles,
  AlertTriangle,
  Briefcase,
  DollarSign,
  Info,
  Calendar,
} from 'lucide-react';
import { speakText, playCustomVoiceNotification } from '../utils/audioNotification';

export const NotificationsView: React.FC = () => {
  const { notifications, markNotificationRead, currentBusiness, systemSettings } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'broadcast' | 'job' | 'payment'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'broadcast') return n.type === 'broadcast' || n.type === 'system';
    if (filterType === 'job') return n.type === 'job';
    if (filterType === 'payment') return n.type === 'payment';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  const getNotifIcon = (type: string, severity?: string) => {
    if (type === 'broadcast') {
      if (severity === 'critical') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      return <Megaphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
    if (type === 'job') return <Briefcase className="w-4 h-4 text-blue-500" />;
    if (type === 'payment') return <DollarSign className="w-4 h-4 text-emerald-500" />;
    return <Info className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Alerts & Communications
            </span>
            <span className="text-xs text-slate-400">{currentBusiness.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" /> Notifications & Broadcast Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin system broadcasts, real-time job dispatch alerts & customer updates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
          <button
            onClick={() =>
              playCustomVoiceNotification(
                'Notification Summary',
                `You have ${unreadCount} unread notification alerts in ${currentBusiness.name}.`
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            <Volume2 className="w-4 h-4" /> Read Out Loud
          </button>
        </div>
      </div>

      {/* Live Super Admin Platform Announcement Banner Card */}
      {systemSettings?.isNoticeActive && systemSettings?.globalNoticeBanner?.trim() && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-5 rounded-3xl border border-indigo-700/60 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/10 text-indigo-200 shrink-0 mt-0.5 sm:mt-0">
              <Megaphone className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                  📢 Live Platform Banner
                </span>
                <span className="text-[11px] text-indigo-200 font-medium">
                  {systemSettings.noticeTitle || 'Platform Broadcast'}
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-1 leading-snug">
                {systemSettings.globalNoticeBanner}
              </p>
            </div>
          </div>
          <button
            onClick={() => speakText(`Live Platform Notice: ${systemSettings.globalNoticeBanner}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all shrink-0 cursor-pointer self-end sm:self-center"
          >
            <Volume2 className="w-3.5 h-3.5" /> Listen
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('broadcast')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            filterType === 'broadcast'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          Super Admin Broadcasts ({notifications.filter((n) => n.type === 'broadcast' || n.type === 'system').length})
        </button>
        <button
          onClick={() => setFilterType('job')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            filterType === 'job'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Job Dispatch ({notifications.filter((n) => n.type === 'job').length})
        </button>
        <button
          onClick={() => setFilterType('payment')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            filterType === 'payment'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Payments & Billing ({notifications.filter((n) => n.type === 'payment').length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Alert Feed & Message Log
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {filteredNotifications.length} message{filteredNotifications.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No alerts found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              You are all caught up! New job assignments, customer updates, and Super Admin broadcasts will appear here.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isBroadcast = n.type === 'broadcast' || n.type === 'system';
            return (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                  isBroadcast
                    ? 'bg-gradient-to-r from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/40 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                    : n.read
                    ? 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800 text-slate-500'
                    : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isBroadcast
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {getNotifIcon(n.type, n.broadcastSeverity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {n.title}
                        </span>
                        {isBroadcast && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.2 rounded-full border border-indigo-200 dark:border-indigo-800">
                            Super Admin Announcement
                          </span>
                        )}
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {n.message}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(`${n.title}. ${n.message}`);
                    }}
                    className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                    title="Speak text aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
