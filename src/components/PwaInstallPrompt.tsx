import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Laptop, Monitor, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InstallAppModal } from './InstallAppModal';
import { BrandLogo } from './BrandLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const { showToast, currentBusiness } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    typeof window !== 'undefined' ? (window as any).deferredPwaPrompt || null : null
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (desktop PWA window or mobile full-screen app)
    const isStandaloneApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneApp);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!isStandaloneApp && !dismissed) {
        setShowBanner(true);
      }
    }

    // Capture standard PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      (window as any).deferredPwaPrompt = promptEvent;
      // Only show banner if not standalone and not dismissed recently
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!isStandaloneApp && !dismissed) {
        setShowBanner(true);
      }
    };

    const handlePromptReady = (e: any) => {
      if (e.detail) {
        setDeferredPrompt(e.detail);
        const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
        if (!isStandaloneApp && !dismissed) {
          setShowBanner(true);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);

    // Show banner if iOS and not standalone
    if (isIosDevice && !isStandaloneApp) {
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
    };
  }, []);

  const handleInstallClick = async () => {
    const activePrompt = deferredPrompt || (window as any).deferredPwaPrompt;
    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          showToast('ServiFlow App installed successfully!', 'success');
          setShowBanner(false);
          (window as any).deferredPwaPrompt = null;
          setDeferredPrompt(null);
        } else {
          showToast('App installation deferred', 'info');
        }
      } catch {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <>
      {/* Floating PWA Installation Banner (when in regular browser tab) */}
      {!isStandalone && showBanner && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900/95 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-indigo-500/40 backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md overflow-hidden bg-white/10">
                {currentBusiness?.logo ? (
                  <img src={currentBusiness.logo} alt="App Icon" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <BrandLogo size={40} />
                )}
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5 text-white">
                  <span>Install ServiFlow Standalone</span>
                  <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-bold px-1.5 py-0.5 rounded-md uppercase">
                    Desktop & Mobile
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                  Full-screen standalone app with company icon & real-time auto updates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Device Installation Guide Modal */}
      <InstallAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deferredPrompt={deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredPwaPrompt : null)}
        onInstalled={() => {
          setShowBanner(false);
          setIsStandalone(true);
        }}
      />
    </>
  );
};
