import React, { useState, useRef, useCallback } from 'react';
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
  const { syncOfflineQueue, isOffline, showToast } = useApp();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const hasFiredThresholdHapticRef = useRef(false);

  const PULL_THRESHOLD = 70;
  const MAX_PULL = 100;

  // Safe Haptic Feedback helper
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore devices where vibrate isn't allowed
      }
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) {
        isDraggingRef.current = false;
        startYRef.current = null;
        startXRef.current = null;
        return;
      }

      // Check if page or container is at the very top before allowing pull gesture
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop <= 2) {
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
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current || startYRef.current === null || startXRef.current === null || isRefreshing) {
        return;
      }

      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop > 2) {
        if (pullDistance > 0) {
          setPullDistance(0);
          setIsPulling(false);
        }
        isDraggingRef.current = false;
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startYRef.current;
      const diffX = Math.abs(currentX - startXRef.current);

      // If horizontal swipe or scrolling up, do not intercept natural scroll
      if (diffX > Math.abs(diffY) || diffY <= 5) {
        if (pullDistance > 0) {
          setPullDistance(0);
          setIsPulling(false);
        }
        return;
      }

      // Elastic dampened pull calculation
      const dampened = Math.min(diffY * 0.4, MAX_PULL);
      setPullDistance(dampened);
      setIsPulling(true);

      // Haptic tick on threshold cross
      if (dampened >= PULL_THRESHOLD && !hasFiredThresholdHapticRef.current) {
        hasFiredThresholdHapticRef.current = true;
        triggerHaptic(15);
      } else if (dampened < PULL_THRESHOLD && hasFiredThresholdHapticRef.current) {
        hasFiredThresholdHapticRef.current = false;
      }
    },
    [isRefreshing, triggerHaptic, PULL_THRESHOLD, MAX_PULL, pullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current || startYRef.current === null || isRefreshing) {
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
      setPullDistance(45);
      triggerHaptic([15, 30, 15]);

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          syncOfflineQueue(false);
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
        showToast('Failed to refresh data. Please try again.', 'error');
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      hasFiredThresholdHapticRef.current = false;
    }
  }, [pullDistance, PULL_THRESHOLD, isRefreshing, onRefresh, syncOfflineQueue, isOffline, showToast, triggerHaptic]);

  const rotationDeg = Math.min((pullDistance / PULL_THRESHOLD) * 360, 360);
  const progressRatio = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative w-full min-h-full ${className}`}
    >
      {/* Pull-To-Refresh Visual Indicator Banner */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="sticky top-2 left-0 right-0 z-30 flex items-center justify-center pointer-events-none transition-transform duration-100 ease-out mb-2"
          style={{
            transform: `translateY(${Math.min(pullDistance * 0.35, 20)}px)`,
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
          transform: isPulling ? `translateY(${Math.min(pullDistance * 0.2, 12)}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

