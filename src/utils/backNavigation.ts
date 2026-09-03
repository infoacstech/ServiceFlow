/**
 * Global Android System Back Button & Gesture Navigation Manager
 * Handles:
 * 1. Physical Android Back button & Back swipe gestures
 * 2. Nested overlay/modal/drawer/dropdown dismissal priority
 * 3. Screen navigation history (stack) without forcing return to Dashboard
 * 4. PWA / Mobile Browser popstate & Cordova / Capacitor hardware back events
 * 5. Double-tap to exit protection at root screen
 */

import { useEffect, useRef } from 'react';

type ScreenChangeHandler = (tab: string) => void;
type ToastHandler = (msg: string, type?: 'info' | 'success' | 'error' | 'warning') => void;

interface OverlayEntry {
  id: string;
  close: () => boolean | void;
}

class BackNavigationManager {
  private screenStack: string[] = [];
  private overlayStack: OverlayEntry[] = [];
  private onScreenChange: ScreenChangeHandler | null = null;
  private onToast: ToastHandler | null = null;
  private isProgrammaticPop = false;
  private lastBackPressTime = 0;
  private isInitialized = false;

  public init(initialTab: string, onScreenChange: ScreenChangeHandler, onToast?: ToastHandler) {
    this.onScreenChange = onScreenChange;
    this.onToast = onToast || null;

    if (this.isInitialized) return;
    this.isInitialized = true;
    this.screenStack = [initialTab || 'dashboard'];

    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState({ type: 'screen', tab: initialTab || 'dashboard', depth: 1 }, '');
      } catch (e) {
        console.warn('Navigation history state init failed:', e);
      }

      window.addEventListener('popstate', this.handlePopState);

      // Hardware back button listeners for Cordova & Capacitor Android
      document.addEventListener('backbutton', this.handleHardwareBack, false);
      if ((window as any).Capacitor?.Plugins?.App) {
        try {
          (window as any).Capacitor.Plugins.App.addListener('backButton', () => {
            this.triggerHardwareBack();
          });
        } catch (e) {
          // ignore if plugin not loaded
        }
      }
    }
  }

  private handleHardwareBack = (e?: Event) => {
    if (e) {
      e.preventDefault();
    }
    this.triggerHardwareBack();
  };

  public triggerHardwareBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  private handlePopState = (event: PopStateEvent) => {
    // If the pop was triggered by us programmatically (e.g. closing via UI "X" button), ignore it
    if (this.isProgrammaticPop) {
      this.isProgrammaticPop = false;
      return;
    }

    // 1. If any overlay (modal, drawer, sheet, dropdown) is open, close the top-most overlay first
    if (this.overlayStack.length > 0) {
      const top = this.overlayStack.pop();
      if (top) {
        try {
          top.close();
        } catch (err) {
          console.error('Error closing overlay on back navigation:', err);
        }
      }
      return;
    }

    // 2. If screenStack has more than 1 screen, navigate back through the actual history
    if (this.screenStack.length > 1) {
      this.screenStack.pop(); // Remove current screen
      const previousScreen = this.screenStack[this.screenStack.length - 1];
      if (previousScreen && this.onScreenChange) {
        this.onScreenChange(previousScreen);
      }
      return;
    }

    // 3. Root screen reached! Provide double-tap to exit behavior
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      // User tapped back twice within 2 seconds: Allow exit
      if (this.onToast) {
        this.onToast('Exiting ServiFlow...', 'info');
      }
    } else {
      this.lastBackPressTime = now;
      if (this.onToast) {
        this.onToast('Press back again to exit', 'info');
      }
      // Re-push current screen state so a subsequent back press still triggers popstate
      if (typeof window !== 'undefined') {
        const rootTab = this.screenStack[0] || 'dashboard';
        window.history.pushState({ type: 'screen', tab: rootTab, root: true }, '');
      }
    }
  };

  public pushScreen(tab: string, replace = false) {
    if (!tab) return;
    const current = this.screenStack[this.screenStack.length - 1];
    if (current === tab) return;

    if (replace) {
      if (this.screenStack.length > 0) {
        this.screenStack[this.screenStack.length - 1] = tab;
      } else {
        this.screenStack = [tab];
      }
      if (typeof window !== 'undefined') {
        try {
          window.history.replaceState({ type: 'screen', tab, depth: this.screenStack.length }, '');
        } catch (e) {
          // ignore
        }
      }
    } else {
      this.screenStack.push(tab);
      if (typeof window !== 'undefined') {
        try {
          window.history.pushState({ type: 'screen', tab, depth: this.screenStack.length }, '');
        } catch (e) {
          // ignore
        }
      }
    }
  }

  public registerOverlay(id: string, close: () => boolean | void) {
    // Remove if already present
    this.overlayStack = this.overlayStack.filter((o) => o.id !== id);
    this.overlayStack.push({ id, close });

    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ type: 'overlay', id, depth: this.overlayStack.length }, '');
      } catch (e) {
        // ignore
      }
    }

    return () => {
      this.overlayStack = this.overlayStack.filter((o) => o.id !== id);
    };
  }

  public popOverlay(id: string) {
    const idx = this.overlayStack.findIndex((o) => o.id === id);
    if (idx !== -1) {
      this.overlayStack.splice(idx, 1);
      if (typeof window !== 'undefined') {
        this.isProgrammaticPop = true;
        window.history.back();
      }
    }
  }

  public getScreenStack() {
    return [...this.screenStack];
  }

  public getOverlayCount() {
    return this.overlayStack.length;
  }
}

export const navigationManager = new BackNavigationManager();

/**
 * Custom React Hook to register any modal, drawer, bottom sheet or dropdown
 * with the global Android Back button / gesture handler.
 */
export function useBackHandler(isOpen: boolean, onClose: () => void, id: string) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isRegisteredRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (isRegisteredRef.current) {
        isRegisteredRef.current = false;
        navigationManager.popOverlay(id);
      }
      return;
    }

    isRegisteredRef.current = true;
    const unregister = navigationManager.registerOverlay(id, () => {
      isRegisteredRef.current = false;
      onCloseRef.current();
    });

    return () => {
      if (isRegisteredRef.current) {
        isRegisteredRef.current = false;
        navigationManager.popOverlay(id);
      }
      unregister();
    };
  }, [isOpen, id]);
}
