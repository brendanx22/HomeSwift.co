import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Share
} from 'lucide-react';

// PWA Service Worker Registration
export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // iOS Detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker update events
    const handleUpdateAvailable = () => {
      console.log('Service worker update detected');
      setUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    }
  };

  const handleUpdate = () => {
    // Reload the page to get the new version
    window.location.reload();
  };

  return {
    isOnline,
    isInstallable,
    isInstalled,
    isIOS,
    installApp,
    updateAvailable,
    handleUpdate
  };
};

// Offline Indicator Component
export const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-3 shadow-lg"
    >
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-5 h-5" />
        <span className="font-medium">You're offline</span>
        <span className="text-sm opacity-90">Some features may be limited</span>
      </div>
    </motion.div>
  );
};

// PWA Install Prompt Component
export const PWAInstallPrompt = () => {
  const { isInstallable, installApp, isInstalled, isIOS } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  // Show only if not installed, not dismissed, and either installable (Android/Desktop) or iOS
  const shouldShow = !isInstalled && !dismissed && (isInstallable || isIOS);

  if (!shouldShow) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-6 left-4 right-4 z-[9999] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 p-6 max-w-sm mx-auto"
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-[#FF6B35] rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-100">
          <img src="/images/logo.png" className="w-6 h-6 object-contain invert grayscale" alt="HS" />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-[#1C2C3E] mb-1">Install HomeSwift</h3>
          <p className="text-xs text-[#1C2C3E]/60 mb-4 leading-relaxed">
            {isIOS 
              ? "Tap the 'Share' icon in Safari then 'Add to Home Screen' to get the full experience."
              : "Install our app for a faster, better experience with offline access."}
          </p>

          <div className="flex items-center space-x-2">
            {!isIOS ? (
              <button
                onClick={installApp}
                className="flex-1 bg-[#FF6B35] text-white py-2.5 px-4 rounded-xl text-[13px] font-bold hover:bg-orange-600 transition-colors"
              >
                Install App
              </button>
            ) : (
              <div className="flex-1 flex items-center bg-gray-50 py-2.5 px-4 rounded-xl space-x-2">
                <Share size={14} className="text-[#FF6B35]" />
                <span className="text-[11px] font-bold text-[#1C2C3E]/80 uppercase tracking-wider">Step 1: Tap Share</span>
              </div>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2.5 bg-gray-100 text-[#1C2C3E]/60 rounded-xl text-[13px] font-bold hover:bg-gray-200 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-[#1C2C3E]/20 hover:text-[#1C2C3E]/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

// Update Available Prompt Component
export const UpdatePrompt = ({ onUpdate }) => {
  const { updateAvailable } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !updateAvailable) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-4 left-4 right-4 z-50 bg-blue-500 text-white rounded-lg shadow-2xl p-6 max-w-sm mx-auto"
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold mb-1">Update Available</h3>
          <p className="text-sm text-blue-100 mb-3">
            A new version of HomeSwift is available with improved features
          </p>

          <div className="flex space-x-2">
            <button
              onClick={onUpdate}
              className="flex-1 bg-white text-blue-500 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 border border-blue-300 text-white rounded-lg text-sm hover:bg-blue-400 transition-colors"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-blue-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

// Cache Management Component
export const CacheManager = () => {
  const [cacheInfo, setCacheInfo] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    checkCache();
  }, []);

  const checkCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const cacheInfo = {};

        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          cacheInfo[name] = keys.length;
        }

        setCacheInfo(cacheInfo);
      } catch (error) {
        console.error('Error checking cache:', error);
      }
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        setClearing(true);
        const cacheNames = await caches.keys();

        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );

        await checkCache();
        toast.success('Cache cleared successfully');
      } catch (error) {
        console.error('Error clearing cache:', error);
        toast.error('Failed to clear cache');
      } finally {
        setClearing(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Offline Cache</h3>

      {cacheInfo ? (
        <div className="space-y-3">
          {Object.entries(cacheInfo).map(([name, count]) => (
            <div key={name} className="flex justify-between items-center">
              <span className="text-gray-600">{name}</span>
              <span className="font-medium">{count} items</span>
            </div>
          ))}

          <button
            onClick={clearCache}
            disabled={clearing}
            className="w-full mt-4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {clearing ? (
              <>
                <RefreshCw className="w-4 h-4 inline-block mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              'Clear Cache'
            )}
          </button>
        </div>
      ) : (
        <p className="text-gray-600">No cache information available</p>
      )}
    </div>
  );
};

// Service Worker Registration
export const registerServiceWorker = async (onUpdate) => {
  // Skip in development or if not in browser
  if (!import.meta.env.PROD || typeof window === 'undefined') {
    console.log('Service Worker: Skipping in development or server-side');
    return null;
  }

  // Temporarily disable service worker to debug JavaScript loading issues
  console.log('Service Worker: Temporarily disabled to debug JS loading issues');
  return null;

  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker: Not supported in this browser');
    return null;
  }

  // Check if we're in an iframe
  if (window.self !== window.top) {
    console.log('Service Worker: Skipping in iframe');
    return null;
  }

  try {
    // Check for existing service workers but don't aggressively unregister them
    console.log('Service Worker: Checking for existing service workers...');
    const registrations = await navigator.serviceWorker.getRegistrations();

    // Only unregister if we have conflicting registrations (different scope)
    if (registrations.length > 0) {
      console.log(`Service Worker: Found ${registrations.length} existing registration(s)`);
      
      // Check if any registration has a different scope
      const hasConflictingScope = registrations.some(reg => reg.scope !== window.location.origin + '/');
      
      if (hasConflictingScope) {
        console.log('Service Worker: Found conflicting scopes, cleaning up...');
        await Promise.all(registrations.map(reg => {
          console.log('Service Worker: Unregistering service worker:', reg.scope);
          return reg.unregister();
        }));
      } else {
        console.log('Service Worker: Existing registrations have compatible scope, keeping them');
        // Don't unregister if scopes are compatible
      }
    } else {
      console.log('Service Worker: No existing registrations found');
    }

    // Only clear caches if we unregistered conflicting workers
    if (registrations.length > 0 && registrations.some(reg => reg.scope !== window.location.origin + '/')) {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          console.log(`Service Worker: Found ${cacheNames.length} caches to clear`);
          await Promise.all(
            cacheNames.map(cacheName => {
              console.log('Service Worker: Deleting cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        } catch (cacheError) {
          console.error('Service Worker: Error clearing caches:', cacheError);
        }
      }
    }

    // Register new service worker
    console.log('Service Worker: Registering new service worker...');
    const registration = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none',
      scope: '/'
    });

    console.log('Service Worker: Registered successfully');

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      console.log('Service Worker: New service worker found');

      newWorker.addEventListener('statechange', () => {
        console.log('Service Worker: State changed to:', newWorker.state);

        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('Service Worker: New update available');
          if (onUpdate) {
            onUpdate();
          }
        }
      });
    });

    // Check for updates periodically
    const checkForUpdates = async () => {
      try {
        console.log('Service Worker: Checking for updates...');
        await registration.update();
      } catch (error) {
        console.error('Service Worker: Error checking for updates:', error);
      }
    };

    // Check for updates on page load
    await checkForUpdates();

    // Check for updates every hour
    const updateInterval = setInterval(checkForUpdates, 60 * 60 * 1000);

    // Clean up interval on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(updateInterval);
    });

    // Handle controller changes (when a new service worker takes over)
    // Note: Removed automatic reload to prevent unwanted page refreshes
    // Users will get update notification instead
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker: Controller changed, showing update notification...');
      // The update will be handled by the UpdatePrompt component
      if (onUpdate) {
        onUpdate();
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker: Registration failed:', error);
    return null;
  }
};

// PWA Meta Tags Component (for index.html)
export const PWAMetaTags = () => (
  <>
    <meta name="theme-color" content="#ffffff" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="HomeSwift" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="msapplication-TileColor" content="#ffffff" />
    <meta name="msapplication-tap-highlight" content="no" />

    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#FF6B35" />
  </>
);
