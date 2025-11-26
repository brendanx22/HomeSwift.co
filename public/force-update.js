// Force Update Script for HomeSwift
// This script forces a complete cache clear and update for deployed apps

(function () {
  "use strict";

  console.log("🔄 Force Update Script Loaded");

  // Check if we need to force update
  const urlParams = new URLSearchParams(window.location.search);
  const forceUpdate = urlParams.get("force_update");
  const cacheBust = urlParams.get("cache_bust");
  const hardReset = urlParams.get("hard_reset");

  // Function to perform complete cache clearing
  function performHardReset() {
    console.log("🧹 Performing HARD RESET - clearing everything...");

    // Show loading message
    document.body.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #FF6B35 0%, #e85e2f 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999999;
      ">
        <div style="
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        "></div>
        <h2 style="margin: 0; font-size: 24px; font-weight: 600;">Updating HomeSwift</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Clearing cache and reloading...</p>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;

    // Clear all caches aggressively
    Promise.all([
      // Clear browser caches
      "caches" in window
        ? caches
            .keys()
            .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        : Promise.resolve(),

      // Clear all localStorage
      new Promise(() => {
        try {
          localStorage.clear();
        } catch (e) {
          console.warn("Failed to clear localStorage:", e);
        }
      }),

      // Clear all sessionStorage
      new Promise(() => {
        try {
          sessionStorage.clear();
        } catch (e) {
          console.warn("Failed to clear sessionStorage:", e);
        }
      }),
    ]).then(() => {
      console.log("✅ All storage cleared");

      // Unregister all service workers
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => {
            return Promise.all(registrations.map((reg) => reg.unregister()));
          })
          .then(() => {
            console.log("✅ Service workers unregistered");

            // Clear IndexedDB
            if ("indexedDB" in window) {
              indexedDB
                .databases()
                .then((databases) => {
                  return Promise.all(
                    databases.map((db) => indexedDB.deleteDatabase(db.name))
                  );
                })
                .then(() => {
                  console.log("✅ IndexedDB cleared");
                  forceReload();
                })
                .catch((e) => {
                  console.warn("Failed to clear IndexedDB:", e);
                  forceReload();
                });
            } else {
              forceReload();
            }
          });
      } else {
        forceReload();
      }
    });

    function forceReload() {
      // Force reload with maximum cache busting
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const newUrl =
        window.location.origin +
        window.location.pathname +
        "?updated=" +
        timestamp +
        "&r=" +
        random;

      console.log("🔄 Force reloading to:", newUrl);

      // Use location.replace to prevent back button issues
      setTimeout(() => {
        window.location.replace(newUrl);
      }, 2000);
    }
  }

  // Check if force update is needed
  if (hardReset === "true" || forceUpdate === "true") {
    console.log("🚀 Force update triggered");
    performHardReset();
    return;
  }

  // Check for cache busting
  if (cacheBust) {
    console.log("💨 Cache bust detected, clearing caches...");

    // Light cache clear for cache busting
    if ("caches" in window) {
      caches.keys().then((keys) => {
        Promise.all(keys.map((key) => caches.delete(key))).then(() => {
          console.log("✅ Caches cleared for cache bust");
        });
      });
    }
  }

  // Auto-update check for deployed apps
  function checkForUpdates() {
    const lastUpdateCheck = localStorage.getItem("last_update_check");
    const now = Date.now();
    const checkInterval = 30 * 60 * 1000; // 30 minutes

    if (!lastUpdateCheck || now - parseInt(lastUpdateCheck) > checkInterval) {
      console.log("🔍 Checking for app updates...");

      // Try to fetch the latest manifest or version file
      fetch("/manifest.webmanifest?t=" + now, {
        cache: "no-cache",
        headers: { "Cache-Control": "no-cache" },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Manifest fetch failed");
        })
        .then((manifest) => {
          console.log("📦 Latest manifest:", manifest);

          // Check if version changed (you need to add version to your manifest)
          const currentVersion =
            localStorage.getItem("app_version") || "unknown";
          const manifestVersion = manifest.version || "unknown";

          if (
            currentVersion !== manifestVersion &&
            currentVersion !== "unknown"
          ) {
            console.log("🆕 New version detected:", manifestVersion);
            localStorage.setItem("app_version", manifestVersion);
            performHardReset();
          } else {
            console.log("✅ App is up to date");
            localStorage.setItem("app_version", manifestVersion);
          }
        })
        .catch((error) => {
          console.warn("⚠️ Update check failed:", error);
        });

      localStorage.setItem("last_update_check", now.toString());
    }
  }

  // Run update check on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkForUpdates);
  } else {
    checkForUpdates();
  }

  // Add global function for manual force update
  window.forceAppUpdate = function () {
    console.log("🔄 Manual force update triggered");
    performHardReset();
  };

  // Add keyboard shortcut for developers (Ctrl+Shift+U)
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && e.key === "U") {
      e.preventDefault();
      console.log("🔄 Developer force update triggered");
      performHardReset();
    }
  });

  // Monitor for update failures
  let errorCount = 0;
  const maxErrors = 2;

  window.addEventListener("error", function (e) {
    if (
      e.message &&
      (e.message.includes("Unexpected token") ||
        e.message.includes("Loading chunk") ||
        e.message.includes("Failed to load"))
    ) {
      errorCount++;
      console.log("🚨 App error detected:", errorCount);

      if (errorCount >= maxErrors) {
        console.log("⚠️ Too many errors, forcing update...");
        performHardReset();
      }
    }
  });
})();
