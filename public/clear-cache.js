// Cache clearing script for HomeSwift
// This script clears all caches and forces a fresh reload

if ("caches" in window) {
  caches
    .keys()
    .then((cacheNames) => {
      console.log("Clearing caches:", cacheNames);
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log("Deleting cache:", cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    .then(() => {
      console.log("All caches cleared!");

      // Clear localStorage
      localStorage.clear();
      console.log("LocalStorage cleared!");

      // Clear sessionStorage
      sessionStorage.clear();
      console.log("SessionStorage cleared!");

      // Unregister service workers
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => {
            console.log("Unregistering service workers:", registrations.length);
            return Promise.all(
              registrations.map((registration) => {
                console.log("Unregistering:", registration.scope);
                return registration.unregister();
              })
            );
          })
          .then(() => {
            console.log("All service workers unregistered!");

            // Force reload with cache busting
            console.log("Forcing page reload...");
            window.location.href =
              window.location.origin +
              window.location.pathname +
              "?cache_bust=" +
              Date.now();
          });
      } else {
        // Force reload if no service worker
        console.log("No service worker support, forcing reload...");
        window.location.href =
          window.location.origin +
          window.location.pathname +
          "?cache_bust=" +
          Date.now();
      }
    });
} else {
  console.log("Cache API not supported, forcing reload...");
  window.location.href =
    window.location.origin +
    window.location.pathname +
    "?cache_bust=" +
    Date.now();
}
