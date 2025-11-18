import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command, mode }) => {
  // Environment variables
  const isProduction = mode === 'production';
  const apiUrl = isProduction 
    ? 'https://api.homeswift.co' 
    : 'http://localhost:5000';

  return {
    // Base path for production deployment
    base: '/',
    
    // Environment variables that will be available in the client
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_POSTHOG_KEY': JSON.stringify(process.env.VITE_POSTHOG_KEY),
      'import.meta.env.VITE_POSTHOG_HOST': JSON.stringify(process.env.VITE_POSTHOG_HOST),
    },
    
    // Development server configuration
    server: {
      port: 3000,
      proxy: {
        // Proxy API requests to the backend server
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.error('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        // Proxy WebSocket connections
        '/socket.io': {
          target: apiUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      chunkSizeWarningLimit: 1000, // in kbs
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor and app code
            vendor: ['react', 'react-dom', 'react-router-dom'],
            // Split Supabase client
            supabase: ['@supabase/supabase-js'],
            // Split UI libraries
            ui: ['lucide-react', 'framer-motion'],
          },
        },
      },
    },
    
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
