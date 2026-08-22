/**
 * Utility functions for managing Service Worker and Cache Storage
 */

export interface ClearCacheResult {
  success: boolean;
  unregisteredWorkersCount: number;
  clearedCachesCount: number;
  error?: string;
}

/**
 * Unregisters all active service workers, clears all CacheStorage caches,
 * and forces a clean page reload to fetch latest production assets.
 */
export async function clearAppCache(autoReload: boolean = true): Promise<ClearCacheResult> {
  let unregisteredWorkersCount = 0;
  let clearedCachesCount = 0;

  try {
    // 1. Unregister all active Service Workers
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        const unregistered = await registration.unregister();
        if (unregistered) {
          unregisteredWorkersCount++;
        }
      }
    }

    // 2. Clear all CacheStorage entries
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        const deleted = await caches.delete(key);
        if (deleted) {
          clearedCachesCount++;
        }
      }
    }

    // 3. Clear temporary sessionStorage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch (e) {
      console.warn('Session storage clearing ignored:', e);
    }

    // 4. Force reload if requested
    if (autoReload && typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload();
      }, 700);
    }

    return {
      success: true,
      unregisteredWorkersCount,
      clearedCachesCount,
    };
  } catch (error: any) {
    console.error('Failed to clear app cache:', error);
    return {
      success: false,
      unregisteredWorkersCount,
      clearedCachesCount,
      error: error?.message || 'Failed to clear cache',
    };
  }
}
