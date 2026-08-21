import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, ArrowDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  className?: string;
  disabled?: boolean;
}

/**
 * Global helper that detects whether ANY interactive overlay is currently active in the DOM.
 * Detects: Modals, Drawers, Bottom sheets, Dialogs, Full-screen forms, Side panels, Popups, and Backdrops.
 */
export function isAnyOverlayActive(): boolean {
  if (typeof document === 'undefined') return false;

  // 1. Check for standard dialog / modal / drawer ARIA and data markers
  const roleElements = document.querySelectorAll(
    '[role="dialog"], [role="alertdialog"], [aria-modal="true"], [data-overlay="true"], [data-modal="true"], [data-drawer="true"], [data-sheet="true"]'
  );
  for (let i = 0; i < roleElements.length; i++) {
    const el = roleElements[i] as HTMLElement;
    if (el.offsetWidth > 0 && el.offsetHeight > 0 && window.getComputedStyle(el).display !== 'none') {
      return true;
    }
  }

  // 2. Check for fixed full-screen or slide-over overlays in the DOM
  const fixedElements = document.querySelectorAll(
    '.fixed.inset-0, .fixed.inset-y-0, .fixed.inset-x-0, [class*="fixed inset-0"], [class*="fixed inset-y-0"]'
  );
  for (let i = 0; i < fixedElements.length; i++) {
    const el = fixedElements[i] as HTMLElement;
    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
      const style = window.getComputedStyle(el);
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        const rect = el.getBoundingClientRect();
        // If element covers at least 40% of viewport width & height, or full viewport height for slide-overs
        if (
          (rect.width >= window.innerWidth * 0.4 && rect.height >= window.innerHeight * 0.4) ||
          rect.height >= window.innerHeight * 0.75
        ) {
          return true;
        }
      }
    }
  }

  // 3. Check for any backdrop overlay or modal containers (e.g. backdrop-blur or dark transparent covers)
  const backdropElements = document.querySelectorAll(
    '[class*="backdrop-blur"], [class*="bg-slate-900/"], [class*="bg-black/"], [class*="bg-slate-950/"], [class*="bg-stone-900/"]'
  );
  for (let i = 0; i < backdropElements.length; i++) {
    const el = backdropElements[i] as HTMLElement;
    const style = window.getComputedStyle(el);
    if (
      (style.position === 'fixed' || style.position === 'absolute') &&
      el.offsetWidth >= window.innerWidth * 0.4 &&
      el.offsetHeight >= window.innerHeight * 0.4
    ) {
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
        return true;
      }
    }
  }

  // 4. Check for native HTML dialogs or modal-open classes
  if (document.querySelector('dialog[open], .modal-open, .overlay-open, [data-state="open"][role="dialog"]')) {
    return true;
  }

  return false;
}

/**
 * Checks if a specific event target or any of its ancestors is inside an overlay element.
 */
export function isEventInsideOverlay(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;

  const overlayAncestor = target.closest(
    '[role="dialog"], [role="alertdialog"], [aria-modal="true"], ' +
    '[data-overlay], [data-modal], [data-drawer], [data-sheet], ' +
    '.modal, .drawer, .sheet, .dialog, .popup, ' +
    '.fixed.inset-0, .fixed.inset-y-0, [class*="fixed inset-0"], [class*="fixed inset-y-0"]'
  );
  if (overlayAncestor) {
    return true;
  }

  // Traverse up parent hierarchy for fixed/absolute containers with zIndex >= 30
  let current: Element | null = target;
  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    if (style.position === 'fixed' || style.position === 'absolute') {
      const zIndex = parseInt(style.zIndex, 10);
      if (zIndex >= 30) {
        const isBottomNav = current.tagName === 'NAV' && current.classList.contains('bottom-0') && current.clientHeight < 100;
        if (!isBottomNav) {
          return true;
        }
      }
    }
    current = current.parentElement;
  }

  return false;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  className = '',
  disabled = false,
}) => {
  const { syncOfflineQueue, isOffline, showToast } = useApp();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [hasActiveOverlay, setHasActiveOverlay] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const hasFiredThresholdHapticRef = useRef(false);

  const PULL_THRESHOLD = 65;
  const MAX_PULL = 110;

  // Real-time MutationObserver to keep track of active modals/drawers/dialogs/sheets
  useEffect(() => {
    const checkOverlayState = () => {
      const isActive = isAnyOverlayActive();
      setHasActiveOverlay(isActive);
      if (isActive) {
        setPullDistance(0);
        setIsPulling(false);
        isDraggingRef.current = false;
        startYRef.current = null;
        startXRef.current = null;
      }
    };

    checkOverlayState();

    const observer = new MutationObserver(() => {
      checkOverlayState();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'open', 'data-state', 'aria-modal'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Lock background scroll when an overlay is active so that background page doesn't scroll
  useEffect(() => {
    if (hasActiveOverlay) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, [hasActiveOverlay]);

  // Safe Haptic Feedback helper
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore devices where vibrate isn't allowed or supported
      }
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Disable pull-to-refresh completely if any overlay is active or touch started inside an overlay
      if (disabled || isRefreshing || hasActiveOverlay || isAnyOverlayActive() || isEventInsideOverlay(e.target)) {
        isDraggingRef.current = false;
        startYRef.current = null;
        startXRef.current = null;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      // Check if page or container is at the top before enabling pull gesture
      const scrollTop = window.scrollY || document.documentElement.scrollTop || containerRef.current?.scrollTop || 0;
      if (scrollTop <= 5) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isDraggingRef.current = true;
        hasFiredThresholdHapticRef.current = false;
      } else {
        isDraggingRef.current = false;
      }
    },
    [disabled, isRefreshing, hasActiveOverlay]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        !isDraggingRef.current ||
        startYRef.current === null ||
        startXRef.current === null ||
        isRefreshing ||
        hasActiveOverlay ||
        isAnyOverlayActive() ||
        isEventInsideOverlay(e.target)
      ) {
        if (pullDistance > 0 || isPulling) {
          setPullDistance(0);
          setIsPulling(false);
        }
        isDraggingRef.current = false;
        return;
      }

      const scrollTop = window.scrollY || document.documentElement.scrollTop || containerRef.current?.scrollTop || 0;
      if (scrollTop > 5) {
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startYRef.current;
      const diffX = Math.abs(currentX - startXRef.current);

      // If horizontal swipe or scrolling up, do not intercept
      if (diffX > Math.abs(diffY) || diffY <= 0) {
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      // Elastic pull calculation
      const dampened = Math.min(Math.pow(diffY, 0.8) * 1.5, MAX_PULL);
      setPullDistance(dampened);
      setIsPulling(true);

      // Haptic tick on threshold cross
      if (dampened >= PULL_THRESHOLD && !hasFiredThresholdHapticRef.current) {
        hasFiredThresholdHapticRef.current = true;
        triggerHaptic(12);
      } else if (dampened < PULL_THRESHOLD && hasFiredThresholdHapticRef.current) {
        hasFiredThresholdHapticRef.current = false;
      }
    },
    [isRefreshing, hasActiveOverlay, triggerHaptic, PULL_THRESHOLD, MAX_PULL, pullDistance, isPulling]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current || startYRef.current === null || isRefreshing || hasActiveOverlay || isAnyOverlayActive()) {
      isDraggingRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    isDraggingRef.current = false;
    startYRef.current = null;
    startXRef.current = null;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(48);
      triggerHaptic([15, 30, 15]);

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          syncOfflineQueue();
        }

        setIsRefreshing(false);
        setIsSuccess(true);
        triggerHaptic([10, 40, 20]);

        showToast(
          isOffline
            ? 'Local changes saved offline.'
            : 'Data refreshed & cloud-synced!',
          'success'
        );

        setTimeout(() => {
          setIsSuccess(false);
          setPullDistance(0);
          setIsPulling(false);
          hasFiredThresholdHapticRef.current = false;
        }, 500);
      } catch (err) {
        console.error('Pull to refresh failed:', err);
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      hasFiredThresholdHapticRef.current = false;
    }
  }, [pullDistance, PULL_THRESHOLD, isRefreshing, hasActiveOverlay, onRefresh, syncOfflineQueue, isOffline, showToast, triggerHaptic]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const rotationDeg = Math.min((pullDistance / PULL_THRESHOLD) * 360, 360);
  const progressRatio = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div ref={containerRef} className={`relative w-full min-h-full ${className}`}>
      {/* Pull-To-Refresh Visual Indicator Banner (Never shown when any overlay is active) */}
      {(pullDistance > 0 || isRefreshing) && !hasActiveOverlay && !isAnyOverlayActive() && (
        <div
          className="sticky top-2 left-0 right-0 z-30 flex items-center justify-center pointer-events-none transition-transform duration-100 ease-out mb-2"
          style={{
            transform: `translateY(${Math.min(pullDistance * 0.35, 24)}px)`,
          }}
        >
          <div
            className={`px-3.5 py-1.5 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all duration-200 ${
              isSuccess
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/25 scale-105'
                : isRefreshing
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700/80 shadow-slate-900/10'
            }`}
            style={{
              opacity: Math.max(progressRatio, 0.4),
              transform: `scale(${0.85 + progressRatio * 0.15})`,
            }}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in" />
                <span className="text-[11px] tracking-tight">Synced & Up to date</span>
              </>
            ) : isRefreshing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span className="text-[11px] tracking-tight">Syncing data...</span>
              </>
            ) : (
              <>
                {pullDistance >= PULL_THRESHOLD ? (
                  <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                ) : (
                  <RefreshCw
                    className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 transition-transform duration-75"
                    style={{ transform: `rotate(${rotationDeg}deg)` }}
                  />
                )}
                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                  {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull down to refresh'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div
        className="w-full transition-transform duration-100 ease-out"
        style={{
          transform: isPulling && !hasActiveOverlay ? `translateY(${Math.min(pullDistance * 0.2, 16)}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

