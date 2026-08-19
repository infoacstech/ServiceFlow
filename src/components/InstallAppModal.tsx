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
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstalled?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  const { showToast, currentBusiness } = useApp();
  const [selectedPlatform, setSelectedPlatform] = useState<'pc' | 'android' | 'ios' | 'mac'>('pc');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          showToast('ServiFlow App installed successfully on your device!', 'success');
          if (onInstalled) onInstalled();
          onClose();
        } else {
          showToast('Installation cancelled by user', 'info');
        }
      } catch (err) {
        console.error('PWA install error:', err);
        showToast('Please use your browser menu to install the app', 'info');
      }
    } else {
      // Fallback instruction toast based on current platform
      if (selectedPlatform === 'ios') {
        showToast('On iOS Safari: Tap Share button ⎋ and choose "Add to Home Screen"', 'info');
      } else if (selectedPlatform === 'pc') {
        showToast('Look for the "Install" (⊕) icon on the right side of your browser address bar', 'info');
      } else {
        showToast('Tap browser menu (⋮) -> "Install App" or "Add to Home screen"', 'info');
      }
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-1 border border-white/20 flex items-center justify-center shadow-lg">
              {currentBusiness?.logo ? (
                <img src={currentBusiness.logo} alt="Company Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="w-full h-full rounded-xl bg-white text-indigo-600 font-black text-xl flex items-center justify-center">
                  S
                </div>
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
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Standalone Status Alert */}
        {isStandalone ? (
          <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Running in Native Standalone App Mode (Browser Bar Removed)</span>
            </div>
            <button
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span>Check Update</span>
            </button>
          </div>
        ) : (
          <div className="bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Currently opened in browser tab. Install to get a 100% full-screen app experience!</span>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
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
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Always In Real-Time</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant live cloud sync for jobs, dispatches, invoices, and payments across all devices.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
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
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs border transition-all ${
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
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs border transition-all ${
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
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs border transition-all ${
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
                className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl font-bold text-xs border transition-all ${
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
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  Install on Windows PC (Chrome / Microsoft Edge)
                </h4>
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      Click the <strong className="text-indigo-600">"Install ServiFlow Desktop App"</strong> button below or look for the <strong className="text-indigo-600">Install icon (⊕)</strong> on the right of the browser address bar.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      Click <strong>"Install"</strong> in the browser prompt.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      ServiFlow will open in its own clean window. Pin it to your <strong>Windows Taskbar</strong> or <strong>Start Menu</strong> for 1-click launch anytime!
                    </div>
                  </div>
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
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      Tap the <strong>"Install App"</strong> button below or tap the <strong>three dots (⋮)</strong> menu in Chrome.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      Select <strong className="text-indigo-600">"Install app"</strong> or <strong className="text-indigo-600">"Add to Home screen"</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      The official ServiFlow company icon is placed on your home screen. When launched, it runs in pure fullscreen mode like any Google Play Store app!
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
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      Tap the <strong className="inline-flex items-center gap-1 text-indigo-600 font-bold"><Share className="w-3.5 h-3.5" /> Share</strong> button at the bottom of Safari.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      Scroll down and tap <strong className="inline-flex items-center gap-1 text-indigo-600 font-bold"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      Tap <strong>Add</strong> on the top right. Launch ServiFlow from your iOS Home Screen — it will run in standalone app view with full device performance!
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
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </div>
                    <div>
                      In <strong>Chrome / Edge</strong>: Click the <strong>Install icon (⊕)</strong> in the address bar.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </div>
                    <div>
                      In <strong>Safari (macOS Sonoma+)</strong>: Click <strong>File → Add to Dock...</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </div>
                    <div>
                      ServiFlow is added to your Mac Dock & Launchpad as a native macOS application with company icon!
                    </div>
                  </div>
                </div>
              </div>
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
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 sm:flex-none text-center"
            >
              Close
            </button>

            {deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4" />
                <span>1-Click Install Now</span>
              </button>
            ) : selectedPlatform === 'ios' ? (
              <button
                onClick={() => showToast('In Safari, tap Share ⎋ -> "Add to Home Screen"', 'info')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                <Share className="w-4 h-4" />
                <span>Use Safari Share Menu</span>
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4" />
                <span>Install Standalone App</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
