import React from 'react';

/**
 * Lazy import with automatic retry on chunk loading failure.
 * When Vite deploys a new build, old hashed chunk names (e.g. JobsView-1uS_31XC.js)
 * may no longer exist on the server. If the browser or PWA has cached an older index.html,
 * dynamic import fails. This helper intercepts that failure, clears ServiceWorker caches,
 * and forces a clean page reload so the latest bundle is loaded automatically.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>,
  chunkKey: string
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = sessionStorage.getItem(`retry-chunk-${chunkKey}`);

    try {
      const module = await componentImport();
      // Reset flag on successful load
      sessionStorage.removeItem(`retry-chunk-${chunkKey}`);
      return 'default' in module ? module : { default: module };
    } catch (error: any) {
      console.warn(`[LazyLoader] Dynamic chunk failed to load for "${chunkKey}".`, error);

      // Check if it's a dynamic import failure
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.message?.includes('error loading dynamically imported module') ||
        error?.name === 'TypeError';

      if (isChunkError && !pageHasAlreadyBeenForceRefreshed) {
        sessionStorage.setItem(`retry-chunk-${chunkKey}`, 'true');

        // Clear all ServiceWorker caches to discard stale asset hashes
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
            console.log('[LazyLoader] Purged outdated ServiceWorker caches.');
          } catch (e) {
            console.warn('[LazyLoader] Error clearing caches:', e);
          }
        }

        // Unregister service worker so next load gets fresh index.html directly from network
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((r) => r.unregister()));
          } catch (e) {
            console.warn('[LazyLoader] Error unregistering service workers:', e);
          }
        }

        // Hard reload the browser window
        window.location.reload();
        // Return an unresolving promise so React waits during reload rather than crashing
        return new Promise<{ default: T }>(() => {});
      }

      // If already retried once and still failing, throw so ErrorBoundary can show UI
      throw error;
    }
  });
}
