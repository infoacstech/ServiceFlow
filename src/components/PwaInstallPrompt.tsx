import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const { showToast } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode
    const isStandaloneApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneApp);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Capture standard PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner if iOS and not standalone
    if (isIosDevice && !isStandaloneApp) {
      const dismissed = localStorage.getItem('pwa_ios_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('ServiFlow App installed successfully!', 'success');
        setShowBanner(false);
      } else {
        showToast('App installation deferred', 'info');
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      showToast('To install: open browser menu and select "Add to Home screen"', 'info');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (isIos) {
      localStorage.setItem('pwa_ios_dismissed', 'true');
    }
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Floating PWA Installation Banner */}
      <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 backdrop-blur-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-1.5 text-white">
                <span>Install ServiFlow</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-1.5 py-0.5 rounded-md uppercase">
                  App
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">
                Install on phone home screen for standalone full-screen experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                Install on iPhone / iPad
              </h3>
              <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Install ServiFlow as a standalone application on your iOS device:
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800">
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  Tap the <strong className="inline-flex items-center gap-1 font-bold text-indigo-600"><Share className="w-3.5 h-3.5" /> Share button</strong> at the bottom of Safari browser.
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  Scroll down and select <strong className="inline-flex items-center gap-1 font-bold text-indigo-600"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  Tap <strong>Add</strong> on the top right. Launch ServiFlow anytime directly from your home screen!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Got it!</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
