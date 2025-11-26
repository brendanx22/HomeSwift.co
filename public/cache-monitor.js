// Cache monitoring script for HomeSwift
// This script monitors for JavaScript loading errors and automatically clears cache

(function () {
  "use strict";

  let errorCount = 0;
  const maxErrors = 2; // Reduced threshold for faster response

  // Function to clear all caches and reload
  function clearCacheAndReload() {
    console.log("🧹 Clearing all caches and reloading...");

    // Clear browser caches
    if ("caches" in window) {
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            console.log("Deleting cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      });
    }

    // Clear localStorage
    try {
      localStorage.clear();
      console.log("LocalStorage cleared");
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }

    // Clear sessionStorage
    try {
      sessionStorage.clear();
      console.log("SessionStorage cleared");
    } catch (e) {
      console.warn("Failed to clear sessionStorage:", e);
    }

    // Unregister service workers
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        return Promise.all(
          registrations.map(function (registration) {
            console.log("Unregistering service worker:", registration.scope);
            return registration.unregister();
          })
        );
      });
    }

    // Force reload with cache busting
    setTimeout(function () {
      var url =
        window.location.origin +
        window.location.pathname +
        "?cache_bust=" +
        Date.now();
      console.log("🔄 Reloading with cache busting:", url);
      window.location.href = url;
    }, 1000);
  }

  // Monitor for JavaScript loading errors
  window.addEventListener("error", function (e) {
    errorCount++;

    console.error("🚨 Global error detected:", {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      errorCount: errorCount,
    });

    // Check for JavaScript loading errors - be more aggressive
    if (
      e.message &&
      (e.message.includes("Unexpected token") ||
        e.message.includes("Unexpected identifier") ||
        e.message.includes("Script error") ||
        e.message.includes("Loading chunk") ||
        e.message.includes("Failed to load") ||
        e.message.includes("Network error") ||
        e.message.includes("TypeError") ||
        e.message.includes("ReferenceError"))
    ) {
      console.log(
        "🔍 Detected JavaScript loading error, clearing cache immediately..."
      );
      clearCacheAndReload();
      return;
    }

    // Check if error is from a JavaScript file
    if (e.filename && e.filename.endsWith(".js")) {
      console.log("🔍 JavaScript file error detected:", e.filename);
      clearCacheAndReload();
      return;
    }

    // Clear cache on any error if count is high
    if (errorCount >= maxErrors) {
      console.log("⚠️ Error threshold reached, clearing cache...");
      clearCacheAndReload();
    }
  });

  // Monitor for unhandled promise rejections
  window.addEventListener("unhandledrejection", function (e) {
    errorCount++;

    console.error("🚨 Unhandled promise rejection:", {
      reason: e.reason,
      errorCount: errorCount,
    });

    // Be more aggressive with promise rejections
    if (errorCount >= 1) {
      console.log("⚠️ Promise rejection detected, clearing cache...");
      clearCacheAndReload();
    }
  });

  // Monitor for resource loading failures
  window.addEventListener("load", function () {
    // Check if all scripts loaded properly
    var scripts = document.querySelectorAll("script[src]");
    var loadedScripts = 0;

    scripts.forEach(function (script) {
      if (script.complete || script.readyState === "complete") {
        loadedScripts++;
      }
    });

    if (loadedScripts < scripts.length) {
      console.warn(
        "⚠️ Not all scripts loaded properly:",
        loadedScripts + "/" + scripts.length
      );
      clearCacheAndReload();
    }
  });

  // Also check for loading timeout
  setTimeout(function () {
    if (document.readyState === "loading") {
      console.warn("⚠️ Page still loading after timeout, clearing cache...");
      clearCacheAndReload();
    }
  }, 15000); // 15 seconds

  console.log("🔧 Aggressive cache monitor initialized");
})();
