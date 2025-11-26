// Version-based cache management
const APP_VERSION = "2.1.1"; // Increment this when you deploy changes
const VERSION_KEY = "homeswift_app_version";
const CACHE_BUST_KEY = "homeswift_cache_bust";

export const checkAndClearCache = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const currentCacheBust = Date.now();

  // Always clear cache if version changed
  if (storedVersion !== APP_VERSION) {
    console.log(
      `Version mismatch: ${storedVersion} -> ${APP_VERSION}. Clearing cache...`
    );
    performCacheClear();
    return true;
  }

  // Check if we need to force cache clear (every 24 hours)
  const lastCacheBust = localStorage.getItem(CACHE_BUST_KEY);
  const twentyFourHours = 24 * 60 * 60 * 1000;

  if (
    !lastCacheBust ||
    currentCacheBust - parseInt(lastCacheBust) > twentyFourHours
  ) {
    console.log("Periodic cache clear (24 hours)");
    performCacheClear();
    localStorage.setItem(CACHE_BUST_KEY, currentCacheBust.toString());
    return true;
  }

  console.log(`App version ${APP_VERSION} is current`);
  return false;
};

const performCacheClear = () => {
  // Clear all caches aggressively
  if ("caches" in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
        console.log(`Deleted cache: ${cacheName}`);
      });
    });
  }

  // Clear localStorage (except auth data)
  const authData = {
    user: localStorage.getItem("user"),
    userRoles: localStorage.getItem("userRoles"),
    supabase_auth_token: localStorage.getItem("supabase.auth.token"),
  };

  localStorage.clear();

  // Restore auth data
  if (authData.user) localStorage.setItem("user", authData.user);
  if (authData.userRoles) localStorage.setItem("userRoles", authData.userRoles);
  if (authData.supabase_auth_token)
    localStorage.setItem("supabase.auth.token", authData.supabase_auth_token);

  // Clear sessionStorage
  sessionStorage.clear();

  // Update version
  localStorage.setItem(VERSION_KEY, APP_VERSION);
  localStorage.setItem(CACHE_BUST_KEY, Date.now().toString());

  // Force reload to get fresh content
  console.log("Cache cleared! Reloading...");
  window.location.reload(true);
};

export const getAppVersion = () => APP_VERSION;

export const forceUpdate = () => {
  // Clear cache and reload
  localStorage.setItem(VERSION_KEY, "old_version");
  checkAndClearCache();
};
