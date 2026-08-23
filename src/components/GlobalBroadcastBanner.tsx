import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Megaphone,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Volume2,
  X,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { speakText } from '../utils/audioNotification';

export const GlobalBroadcastBanner: React.FC = () => {
  const { systemSettings } = useApp();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const noticeText = systemSettings?.globalNoticeBanner?.trim();
  const isActive = systemSettings?.isNoticeActive && !!noticeText;
  const severity = systemSettings?.noticeSeverity || 'info';
  const noticeTitle = systemSettings?.noticeTitle || 'Platform Announcement';

  // Reset dismissal if notice text changes
  useEffect(() => {
    if (noticeText) {
      const dismissedText = sessionStorage.getItem('serviflow_dismissed_broadcast_text');
      if (dismissedText === noticeText) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    }
  }, [noticeText]);

  if (!isActive || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (noticeText) {
      sessionStorage.setItem('serviflow_dismissed_broadcast_text', noticeText);
    }
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakText(`${noticeTitle}: ${noticeText}`);
  };

  // Severity style presets
  const severityStyles = {
    info: {
      container: 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white border-b border-indigo-700/60 shadow-md',
      badge: 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40',
      icon: <Megaphone className="w-4 h-4 text-indigo-300 animate-pulse shrink-0" />,
      tag: '📢 Platform Notice',
    },
    warning: {
      container: 'bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-950 text-white border-b border-amber-600/60 shadow-md',
      badge: 'bg-amber-500/30 text-amber-200 border-amber-400/40',
      icon: <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce shrink-0" />,
      tag: '⚠️ System Alert',
    },
    critical: {
      container: 'bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-white border-b border-rose-600/60 shadow-lg',
      badge: 'bg-rose-500/30 text-rose-200 border-rose-400/40',
      icon: <AlertOctagon className="w-4 h-4 text-rose-300 animate-pulse shrink-0" />,
      tag: '🚨 Critical Broadcast',
    },
    success: {
      container: 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-b border-teal-600/60 shadow-md',
      badge: 'bg-teal-500/30 text-teal-200 border-teal-400/40',
      icon: <Sparkles className="w-4 h-4 text-teal-300 shrink-0" />,
      tag: '✨ Platform Update',
    },
  };

  const style = severityStyles[severity] || severityStyles.info;

  return (
    <aside
      id="global-platform-broadcast-banner"
      aria-label="Platform Announcement"
      className={`relative z-40 px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-300 ${style.container}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        {/* Left: Badge & Live Indicator */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className={`hidden xs:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${style.badge}`}>
            {style.icon}
            <span>{style.tag}</span>
          </span>
        </div>

        {/* Center: Notice Text & Voice Reader */}
        <div className="flex-1 flex items-center justify-center sm:justify-start gap-2 overflow-hidden text-center sm:text-left">
          <span className="font-semibold text-slate-100 truncate text-[11px] sm:text-xs tracking-tight">
            {noticeText}
          </span>
        </div>

        {/* Right Actions: Speak & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSpeak}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Read announcement aloud"
            aria-label="Listen to broadcast"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Dismiss announcement banner"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
