// Cache monitoring script for HomeSwift
// This script monitors for JavaScript loading errors and automatically clears cache

(function () {
  "use strict";

  let errorCount = 0;
  const maxErrors = 3;

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

    // Check for JavaScript loading errors
    if (
      e.message &&
      (e.message.includes("Unexpected token") ||
        e.message.includes("Unexpected identifier") ||
        e.message.includes("Script error") ||
        e.message.includes("Loading chunk") ||
        e.message.includes("Failed to load"))
    ) {
      console.log(
        "🔍 Detected JavaScript loading error, checking error count..."
      );

      if (errorCount >= maxErrors) {
        console.log(
          "⚠️ Too many errors detected, clearing cache and reloading..."
        );
        clearCacheAndReload();
        return;
      }
    }

    // Check if error is from a JavaScript file
    if (e.filename && e.filename.endsWith(".js")) {
      console.log("🔍 JavaScript file error detected:", e.filename);

      if (errorCount >= 2) {
        console.log(
          "⚠️ JavaScript file errors detected, clearing cache and reloading..."
        );
        clearCacheAndReload();
        return;
      }
    }
  });

  // Monitor for unhandled promise rejections
  window.addEventListener("unhandledrejection", function (e) {
    errorCount++;

    console.error("🚨 Unhandled promise rejection:", {
      reason: e.reason,
      errorCount: errorCount,
    });

    if (errorCount >= maxErrors) {
      console.log(
        "⚠️ Too many promise rejections, clearing cache and reloading..."
      );
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

      // Wait a bit and then check again
      setTimeout(function () {
        if (errorCount > 0) {
          console.log("⚠️ Scripts failed to load, clearing cache...");
          clearCacheAndReload();
        }
      }, 3000);
    }
  });

  console.log("🔧 Cache monitor initialized");
})();
