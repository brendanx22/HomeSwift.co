// Version-based cache management
const APP_VERSION = "2.0.0"; // Increment this when you deploy changes
const VERSION_KEY = "homeswift_app_version";

export const checkAndClearCache = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);

  if (storedVersion !== APP_VERSION) {
    console.log(
      `Version mismatch: ${storedVersion} -> ${APP_VERSION}. Clearing cache...`
    );

    // Clear all caches
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
    if (authData.userRoles)
      localStorage.setItem("userRoles", authData.userRoles);
    if (authData.supabase_auth_token)
      localStorage.setItem("supabase.auth.token", authData.supabase_auth_token);

    // Clear sessionStorage
    sessionStorage.clear();

    // Update version
    localStorage.setItem(VERSION_KEY, APP_VERSION);

    // Force reload to get fresh content
    console.log("Cache cleared! Reloading...");
    window.location.reload(true);
  } else {
    console.log(`App version ${APP_VERSION} is current`);
  }
};

export const getAppVersion = () => APP_VERSION;

export const forceUpdate = () => {
  // Increment version and clear cache
  const newVersion = `${APP_VERSION}.${Date.now()}`;
  localStorage.setItem(VERSION_KEY, newVersion);
  checkAndClearCache();
};
