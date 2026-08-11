import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PullToRefreshProps {
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children }) => {
  const { syncOfflineQueue, showToast } = useApp();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const startYRef = useRef<number | null>(null);
  const PULL_THRESHOLD = 70;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only initiate pull-to-refresh when scrolled to top
      if (window.scrollY <= 2) {
        startYRef.current = e.touches[0].clientY;
      } else {
        startYRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;

      if (distance > 0 && window.scrollY <= 2) {
        // Apply resistance dampening formula
        const dampenedDistance = Math.min(Math.pow(distance, 0.85) * 1.8, 120);
        setPullDistance(dampenedDistance);
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (startYRef.current === null || isRefreshing) return;

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(60); // Keep indicator visible during refresh

        // Execute sync offline queue & reload or re-fetch
        syncOfflineQueue();
        showToast('Refreshing application data...', 'info');

        setTimeout(() => {
          setIsRefreshing(false);
          setIsSuccess(true);
          showToast('App refreshed & synced with server!', 'success');

          setTimeout(() => {
            setIsSuccess(false);
            setPullDistance(0);
            startYRef.current = null;
            // Full browser window reload if online to get latest code bundle
            if (navigator.onLine) {
              window.location.reload();
            }
          }, 400);
        }, 800);
      } else {
        setPullDistance(0);
        startYRef.current = null;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, syncOfflineQueue, showToast]);

  return (
    <div className="relative min-h-screen">
      {/* Pull-To-Refresh Indicator Banner */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-150 pointer-events-none"
          style={{
            transform: `translateY(${Math.min(pullDistance, 80)}px)`,
            opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold">
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                <span className="text-emerald-600 dark:text-emerald-400">Refreshed!</span>
              </>
            ) : isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Refreshing site...</span>
              </>
            ) : (
              <>
                <RefreshCw
                  className="w-4 h-4 transition-transform duration-200"
                  style={{ transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)` }}
                />
                <span>{pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}</span>
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
