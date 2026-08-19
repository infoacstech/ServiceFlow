import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, CheckCircle2, ArrowDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  className = '',
  disabled = false,
}) => {
  const { syncOfflineQueue, showToast, isOffline } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const hasFiredThresholdHapticRef = useRef(false);

  const PULL_THRESHOLD = 65;
  const MAX_PULL = 95;

  // Safe multi-profile haptic feedback helper
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore devices where vibration is restricted or ungranted
      }
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;

      const container = containerRef.current;
      if (!container) return;

      // Only engage if container is scrolled to the absolute top
      const isScrolledToTop = container.scrollTop <= 2 && window.scrollY <= 2;
      if (isScrolledToTop && e.touches.length === 1) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isDraggingRef.current = true;
        hasFiredThresholdHapticRef.current = false;
      } else {
        isDraggingRef.current = false;
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDraggingRef.current || startYRef.current === null || startXRef.current === null || isRefreshing) {
        return;
      }

      const container = containerRef.current;
      if (!container || container.scrollTop > 2) {
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startYRef.current;
      const diffX = Math.abs(currentX - startXRef.current);

      // If user is swiping horizontally rather than pulling down, abort pull-to-refresh
      if (diffX > Math.abs(diffY) && diffX > 15 && diffY < 20) {
        isDraggingRef.current = false;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      if (diffY > 0) {
        // Elastic logarithmic spring damping
        const dampened = Math.min(Math.pow(diffY, 0.82) * 1.6, MAX_PULL);
        setPullDistance(dampened);
        setIsPulling(true);

        // Haptic feedback tick when crossing threshold for the first time
        if (dampened >= PULL_THRESHOLD && !hasFiredThresholdHapticRef.current) {
          hasFiredThresholdHapticRef.current = true;
          triggerHaptic(12); // Subtle crisp haptic tick
        } else if (dampened < PULL_THRESHOLD && hasFiredThresholdHapticRef.current) {
          hasFiredThresholdHapticRef.current = false;
        }

        // Prevent default native rubber-band bounce if user is pulling actively
        if (e.cancelable && dampened > 10) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    },
    [isRefreshing, triggerHaptic, PULL_THRESHOLD, MAX_PULL]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current || startYRef.current === null || isRefreshing) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = false;
    startYRef.current = null;
    startXRef.current = null;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(52); // Sits cleanly at header height while refreshing
      triggerHaptic([15, 30, 15]); // Double pulse haptic on activation

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default: Sync offline queue and refresh cached tenant data
          syncOfflineQueue();
        }

        setIsRefreshing(false);
        setIsSuccess(true);
        triggerHaptic([10, 40, 20]); // Confirmation success haptic

        showToast(
          isOffline
            ? 'Local changes preserved offline.'
            : 'Application data refreshed and cloud-synced!',
          'success'
        );

        setTimeout(() => {
          setIsSuccess(false);
          setPullDistance(0);
          setIsPulling(false);
          hasFiredThresholdHapticRef.current = false;
        }, 600);
      } catch (err) {
        console.error('Pull to refresh failed:', err);
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
        showToast('Refresh finished.', 'info');
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      hasFiredThresholdHapticRef.current = false;
    }
  }, [pullDistance, PULL_THRESHOLD, isRefreshing, onRefresh, syncOfflineQueue, isOffline, showToast, triggerHaptic]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

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
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-y-auto overscroll-y-contain ${className}`}
    >
      {/* Pull-To-Refresh Visual Indicator Banner */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="sticky top-2 left-0 right-0 z-30 flex items-center justify-center pointer-events-none transition-transform duration-100 ease-out"
          style={{
            transform: `translateY(${Math.min(pullDistance * 0.4, 28)}px)`,
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
                <span className="text-[11px] tracking-tight">Syncing field data...</span>
              </>
            ) : (
              <>
                {pullDistance >= PULL_THRESHOLD ? (
                  <ArrowDown
                    className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-bounce"
                  />
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

      {/* Main Content Body with smooth pushdown elasticity */}
      <div
        className="w-full h-full transition-transform duration-100 ease-out"
        style={{
          transform: isPulling ? `translateY(${Math.min(pullDistance * 0.25, 20)}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
