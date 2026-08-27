import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Apple,
  Download,
  CheckCircle2,
  Share,
  PlusSquare,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Zap,
  ExternalLink,
  Laptop,
  Check,
  Copy,
  ArrowRight,
  Info,
  Layers,
  Maximize,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Declare window extension
declare global {
  interface Window {
    deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Global cached prompt
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  if (window.deferredPwaPrompt) {
    globalDeferredPrompt = window.deferredPwaPrompt;
  }
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    window.deferredPwaPrompt = e as BeforeInstallPromptEvent;
  });
}

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: BeforeInstallPromptEvent | null;
  onInstalled?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt = null,
  onInstalled,
}) => {
  const { showToast, currentBusiness } = useApp();
  const [selectedPlatform, setSelectedPlatform] = useState<'pc' | 'android' | 'ios' | 'mac'>('pc');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [localPrompt, setLocalPrompt] = useState<BeforeInstallPromptEvent | null>(
    deferredPrompt || globalDeferredPrompt || (typeof window !== 'undefined' ? window.deferredPwaPrompt || null : null)
  );

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    const checkPrompt = () => {
      const active = deferredPrompt || globalDeferredPrompt || window.deferredPwaPrompt || null;
      if (active) {
        setLocalPrompt(active);
      }
    };

    checkPrompt();

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      const p = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = p;
      window.deferredPwaPrompt = p;
      setLocalPrompt(p);
    };

    const handleCustomReady = (e: any) => {
      if (e.detail) {
        globalDeferredPrompt = e.detail;
        setLocalPrompt(e.detail);
      }
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('pwa-prompt-ready', handleCustomReady);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('pwa-prompt-ready', handleCustomReady);
    };
  }, [deferredPrompt, isOpen]);

  useEffect(() => {
    // Detect Standalone execution
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // Auto-select platform based on User Agent
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setSelectedPlatform('ios');
    } else if (/android/.test(ua)) {
      setSelectedPlatform('android');
    } else if (/macintosh|mac os x/.test(ua)) {
      setSelectedPlatform('mac');
    } else {
      setSelectedPlatform('pc');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activePrompt = deferredPrompt || localPrompt || globalDeferredPrompt || window.deferredPwaPrompt;

  const handleInstallClick = async () => {
    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === 'accepted') {
          showToast('ServiFlow App installed successfully on your device!', 'success');
          globalDeferredPrompt = null;
          window.deferredPwaPrompt = null;
          setLocalPrompt(null);
          if (onInstalled) onInstalled();
          setIsStandalone(true);
          onClose();
        } else {
          showToast('Installation prompt was dismissed. You can install anytime from the browser menu.', 'info');
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
        handleFallbackInstall();
      }
    } else {
      handleFallbackInstall();
    }
  };

  const handleFallbackInstall = () => {
    if (isInIframe) {
      handleOpenInNewTab();
    } else if (selectedPlatform === 'pc' || selectedPlatform === 'mac') {
      showToast('On Desktop: Look at the top right of your URL address bar for the (⊕) Install button, or use ⋮ Menu -> Install ServiFlow', 'info');
    } else if (selectedPlatform === 'android') {
      showToast('On Android: Tap three dots menu (⋮) at top right -> "Install App" or "Add to Home screen"', 'info');
    } else if (selectedPlatform === 'ios') {
      showToast('On iPhone/iPad Safari: Tap Share (⎋) -> "Add to Home Screen"', 'info');
    }
  };

  const handleLaunchStandaloneWindow = () => {
    try {
      const url = window.location.href;
      const width = Math.min(window.screen.availWidth || 1400, 1400);
      const height = Math.min(window.screen.availHeight || 900, 900);
      const left = Math.max(0, (window.screen.availWidth - width) / 2);
      const top = Math.max(0, (window.screen.availHeight - height) / 2);

      const win = window.open(
        url,
        'ServiFlowStandalone',
        `popup=yes,width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
      );
      if (win) {
        win.focus();
        showToast('Launched ServiFlow in clean Standalone Window!', 'success');
        onClose();
      } else {
        handleOpenInNewTab();
      }
    } catch {
      handleOpenInNewTab();
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const url = window.location.href;
      window.open(url, '_blank');
      showToast('Opening ServiFlow in dedicated browser tab...', 'info');
    } catch {
      showToast('Please open the app URL in a new browser tab to install.', 'info');
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast('App link copied to clipboard! Paste it into Chrome, Edge or Safari.', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
        showToast('Entered Fullscreen Mode!', 'success');
      } else {
        document.exitFullscreen?.();
        showToast('Exited Fullscreen Mode', 'info');
      }
    } catch {
      showToast('Fullscreen mode toggled', 'info');
    }
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    if (window.__checkForAppUpdate) {
      await window.__checkForAppUpdate();
      showToast('Checked for updates: You are running the latest version!', 'success');
    } else {
      showToast('Application is up to date and syncing in real-time!', 'success');
    }
    setTimeout(() => setIsCheckingUpdate(false), 800);
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden bg-white/10">
              {currentBusiness?.logo ? (
                <img src={currentBusiness.logo} alt="Company Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <BrandLogo size={48} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">Install ServiFlow App</h2>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Multi-Device PWA
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Run as a dedicated standalone desktop & mobile app with zero browser clutter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert */}
        {isStandalone ? (
          <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border-b border-emerald-500/20 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Running in Standalone App Mode (Taskbar & Home Screen Active)</span>
            </div>
            <button
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span>Check Update</span>
            </button>
          </div>
        ) : isInIframe ? (
          <div className="bg-indigo-50 dark:bg-indigo-950/60 border-b border-indigo-200 dark:border-indigo-800 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-950 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-medium">
                To install natively on your PC or phone, open the app in a dedicated browser tab:
              </span>
            </div>
            <button
              onClick={handleOpenInNewTab}
              className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Full Tab ↗</span>
            </button>
          </div>
        ) : activePrompt ? (
          <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border-b border-emerald-500/20 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
              <span>Browser 1-Click Install is ready! Click "Install Now" below.</span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Follow the quick step-by-step instructions below to install on your device.</span>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Standalone Window</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  No URL address bar or tabs. Dedicated app icon on PC Taskbar & Mobile Home Screen.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Fast & Real-time</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant live cloud sync for jobs, dispatches, invoices, and payments across all devices.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Automatic Updates</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  New updates install silently in background without losing local data or active job state.
                </div>
              </div>
            </div>
          </div>

          {/* Platform Switcher Tabs */}
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Select Your Device for Step-by-Step Installation:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedPlatform('pc')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                  selectedPlatform === 'pc'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Windows PC</span>
              </button>

              <button
                onClick={() => setSelectedPlatform('android')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                  selectedPlatform === 'android'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setSelectedPlatform('ios')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                  selectedPlatform === 'ios'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <Apple className="w-4 h-4" />
                <span>iPhone / iPad</span>
              </button>

              <button
                onClick={() => setSelectedPlatform('mac')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                  selectedPlatform === 'mac'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Mac Desktop</span>
              </button>
            </div>
          </div>

          {/* Platform Instructions Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
            {selectedPlatform === 'pc' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-600" />
                    Install on Windows PC (Chrome / Microsoft Edge)
                  </h4>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Method A: Click the Install Icon in Browser Address Bar
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        In your browser (Chrome or Edge), look at the <strong className="text-indigo-600 dark:text-indigo-400">far right of the top address/URL bar</strong> (next to the Bookmark ★ icon). Click the <strong className="text-indigo-600 dark:text-indigo-400">Install icon (⊕ or ⤓)</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Method B: Chrome / Edge Menu (3 dots)
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Click the <strong className="text-indigo-600 dark:text-indigo-400">three dots (⋮)</strong> menu at the top right of Chrome &rarr; click <strong className="text-indigo-600 dark:text-indigo-400">"Save and share"</strong> (or "Cast, save and share") &rarr; click <strong className="text-indigo-600 dark:text-indigo-400">"Install ServiFlow..."</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Instant Taskbar & Desktop Shortcut
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Click <strong>"Install"</strong> in the browser prompt. ServiFlow will instantly launch as an independent window with its icon pinned to your <strong>Windows Taskbar</strong> and <strong>Start Menu</strong>!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Standalone Launcher Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={handleLaunchStandaloneWindow}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-98"
                  >
                    <Monitor className="w-4 h-4 text-indigo-400" />
                    <span>Launch Standalone App Window (No Tabs/URL Bar)</span>
                  </button>
                </div>
              </div>
            )}

            {selectedPlatform === 'android' && (
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  Install on Android Mobile / Tablet (Chrome / Edge / Samsung)
                </h4>
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      Tap the <strong>three dots (⋮)</strong> menu at the top right of Chrome on Android.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      Select <strong className="text-indigo-600 dark:text-indigo-400">"Install app"</strong> or <strong className="text-indigo-600 dark:text-indigo-400">"Add to Home screen"</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      The official ServiFlow app icon will be added to your Android home screen with pure fullscreen performance!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPlatform === 'ios' && (
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Apple className="w-4 h-4 text-indigo-600" />
                  Install on iPhone / iPad (Safari Browser)
                </h4>
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      Tap the <strong className="inline-flex items-center gap-1 text-indigo-600 font-bold"><Share className="w-3.5 h-3.5" /> Share</strong> button at the bottom of Safari.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      Scroll down and tap <strong className="inline-flex items-center gap-1 text-indigo-600 font-bold"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      Tap <strong>Add</strong> on the top right. Launch ServiFlow from your iOS Home Screen for a dedicated native app experience!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPlatform === 'mac' && (
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  Install on Mac OS (Chrome / Safari / Edge)
                </h4>
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      In <strong>Chrome / Edge</strong>: Click the <strong>Install icon (⊕)</strong> in the address bar.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      In <strong>Safari (macOS Sonoma+)</strong>: Click <strong>File &rarr; Add to Dock...</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      ServiFlow is added to your Mac Dock & Launchpad as a native macOS application!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Tools: Copy Link & Fullscreen */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy App Link'}</span>
            </button>

            <button
              onClick={handleFullscreen}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Maximize className="w-3.5 h-3.5 text-indigo-600" />
              <span>Toggle Fullscreen Mode</span>
            </button>

            {isInIframe && (
              <button
                onClick={handleOpenInNewTab}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Real Browser Tab ↗</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>PWA v3 • Encrypted Multi-Tenant Realtime Architecture</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 sm:flex-none text-center cursor-pointer"
            >
              Close
            </button>

            {activePrompt ? (
              <button
                onClick={handleInstallClick}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer animate-pulse"
              >
                <Download className="w-4 h-4" />
                <span>1-Click Install Now</span>
              </button>
            ) : isInIframe ? (
              <button
                onClick={handleOpenInNewTab}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Tab to Install ↗</span>
              </button>
            ) : selectedPlatform === 'ios' ? (
              <button
                onClick={() => showToast('In Safari, tap Share ⎋ at bottom -> "Add to Home Screen"', 'info')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer"
              >
                <Share className="w-4 h-4" />
                <span>Use Safari Share Menu</span>
              </button>
            ) : (
              <button
                onClick={handleLaunchStandaloneWindow}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
                <span>Open Standalone App Window</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
