import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// -------------------------------------------------------------
// Progressive Web App (PWA) & Seamless Auto-Update Engine
// -------------------------------------------------------------
let swRegistration: ServiceWorkerRegistration | null = null;
let isRefreshing = false;

if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        swRegistration = reg;
        console.log('[ServiFlow PWA] Service Worker registered in scope:', reg.scope);

        // Check for updates immediately on startup
        reg.update().catch((e) => console.warn('[ServiFlow PWA] Initial update check notice:', e));

        // When a new update is found
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[ServiFlow PWA] New app version available. Activating in background...');
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            };
          }
        };
      })
      .catch((err) => console.warn('[ServiFlow PWA] Registration error:', err));
  });

  // Handle seamless automatic reload when ServiceWorker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isRefreshing) {
      isRefreshing = true;
      console.log('[ServiFlow PWA] ServiceWorker updated. Refreshing application smoothly...');
      window.location.reload();
    }
  });

  // Periodically check for new updates every 5 minutes in background
  setInterval(() => {
    if (swRegistration) {
      swRegistration.update().catch(() => {});
    }
  }, 5 * 60 * 1000);

  // Check for updates when user returns to the tab or app comes to foreground
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && swRegistration) {
      swRegistration.update().catch(() => {});
    }
  });

  // Check for updates when internet connection is restored
  window.addEventListener('online', () => {
    if (swRegistration) {
      swRegistration.update().catch(() => {});
    }
  });
}

// Global update check helper for UI components
declare global {
  interface Window {
    __checkForAppUpdate?: () => Promise<boolean>;
  }
}

window.__checkForAppUpdate = async () => {
  if (swRegistration) {
    try {
      await swRegistration.update();
      return true;
    } catch (e) {
      console.warn('Update check failed:', e);
      return false;
    }
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
