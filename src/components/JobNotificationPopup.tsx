import React from 'react';
import { useApp } from '../context/AppContext';
import { Notification } from '../types';
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  X,
  Volume2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { speakText, playNotificationChime } from '../utils/audioNotification';

interface JobNotificationPopupProps {
  onOpenJob?: (jobId: string) => void;
}

export const JobNotificationPopup: React.FC<JobNotificationPopupProps> = ({ onOpenJob }) => {
  const { activeJobPopup, dismissJobPopup, currentUser } = useApp();

  if (!activeJobPopup) return null;

  const notif = activeJobPopup;
  const isAssign = notif.actionType === 'assigned' || notif.title.toLowerCase().includes('job issued') || notif.title.toLowerCase().includes('assigned');
  
  // Job assignment popup is strictly for the assigned technician, never the owner/manager who created it
  if (isAssign && currentUser?.role !== 'technician') {
    return null;
  }

  const isCompleted = notif.actionType === 'completed' || notif.title.toLowerCase().includes('completed');
  const isAccepted = notif.actionType === 'accepted';
  const isStarted = notif.actionType === 'started';

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNotificationChime();
    speakText(`${notif.title}. ${notif.message}`);
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div
      id="live-job-notification-banner-popup"
      className="fixed top-4 right-3 sm:right-6 z-[9999] max-w-md w-[calc(100vw-1.5rem)] animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900/95 dark:bg-slate-900/98 backdrop-blur-xl text-white rounded-3xl border-2 border-indigo-500/60 shadow-2xl shadow-indigo-950/70 p-4 sm:p-5 relative overflow-hidden ring-1 ring-white/20">
        {/* Glow Accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              isCompleted
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : isAccepted
                ? 'bg-blue-600 shadow-blue-600/30'
                : 'bg-indigo-600 shadow-indigo-600/30 animate-pulse'
            }`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  {notif.actionType ? `JOB ${notif.actionType.toUpperCase()}` : 'NEW ALERT'}
                </span>
                {notif.priority && (
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(notif.priority)}`}>
                    {notif.priority}
                  </span>
                )}
                {notif.jobId && (
                  <span className="font-mono text-xs font-black text-amber-300">
                    {notif.jobId}
                  </span>
                )}
              </div>
              <h4 className="font-black text-sm text-white tracking-tight mt-0.5">
                {notif.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSpeak}
              className="p-1.5 rounded-xl hover:bg-white/10 text-indigo-300 hover:text-white transition-colors cursor-pointer"
              title="Speak Alert Audio"
              aria-label="Speak Alert"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={dismissJobPopup}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Notification"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message & Details Body */}
        <div className="mt-3 text-xs text-slate-200 space-y-2 relative z-10">
          <p className="leading-relaxed font-medium bg-white/5 p-2.5 rounded-2xl border border-white/5">
            {notif.message}
          </p>

          {/* Key Job Metadata Badges */}
          {(notif.jobLocation || notif.customerName || notif.customerPhone || notif.scheduledDate || notif.scheduledTime) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {notif.customerName && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-white/5 px-2.5 py-1 rounded-xl">
                  <span className="font-semibold text-slate-400">Client:</span>
                  <span className="font-bold text-white truncate">{notif.customerName}</span>
                </div>
              )}

              {notif.customerPhone && (
                <a
                  href={`tel:${notif.customerPhone}`}
                  className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl transition-colors truncate"
                >
                  <Phone className="w-3 h-3 shrink-0" />
                  <span className="font-bold truncate">{notif.customerPhone}</span>
                </a>
              )}

              {notif.scheduledDate && (
                <div className="flex items-center gap-1.5 text-[11px] text-purple-300 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-xl">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span className="truncate">{notif.scheduledDate} {notif.scheduledTime ? `(${notif.scheduledTime})` : ''}</span>
                </div>
              )}

              {notif.jobLocation && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-white/5 px-2.5 py-1 rounded-xl sm:col-span-2 truncate">
                  <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="truncate">{notif.jobLocation}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 relative z-10">
          <button
            onClick={dismissJobPopup}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            Dismiss
          </button>

          <button
            onClick={() => {
              dismissJobPopup();
              if (onOpenJob && notif.jobId) {
                onOpenJob(notif.jobId);
              }
            }}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/40 transition-all active:scale-95 cursor-pointer"
          >
            <span>View Job Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
