import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Base path for production deployment
  base: '/',
  
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "HomeSwift",
        short_name: "HomeSwift",
        display: "standalone",
        start_url: "/",
        theme_color: "#FF6B35",
        background_color: "#ffffff",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      workbox: {
        // ❌ Do NOT cache JS files — this breaks React and Supabase
        globPatterns: ["**/*.{css,html,ico,png,svg,woff2}"],

        navigateFallbackDenylist: [/react/i, /vendor/i, /supabase/i],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400,
              },
            },
          },
        ],
      },
    }),
  ],

  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "https://api.homeswift.co",
        changeOrigin: true,
        secure: true,
      },
    },
  },

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "terser",

    rollupOptions: {
      output: {
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        // Keep React and related modules together to prevent forwardRef errors
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
        }
      },
    },

    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  // Clean, conflict-free optimization
  optimizeDeps: {
    exclude: ["@supabase/supabase-js"],
    include: [
      '@supabase/postgrest-js',
      '@supabase/functions-js',
      '@supabase/gotrue-js',
      '@supabase/realtime-js',
      '@supabase/storage-js'
    ],
  },

  resolve: {
    alias: {
      "@": "/src",
    },
    // Handle Supabase module resolution
    conditions: ["module", "browser", "default"],
  },
});
