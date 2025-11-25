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
      host: "0.0.0.0",
      proxy: {
        // Proxy API requests to the backend server
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: isProduction,
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
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase': ['@supabase/supabase-js'],
            'ui-vendor': ['framer-motion', 'lucide-react']
          }
        }
      },
      terserOptions: isProduction ? {
        compress: {
          // drop_console: true,  // Temporarily disabled for debugging
          drop_debugger: true,
        },
      } : {}
    },

    // Optimize dependencies
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

    // Resolve configuration
    resolve: {
      alias: {
        "@": "/src",
      },
      conditions: ["module", "browser", "default"],
    },

    // Plugins
    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",  // Changed from autoUpdate to prompt users for updates
        injectRegister: 'auto',
        devOptions: {
          enabled: false  // Disable PWA in development
        },
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
          // Aggressive cache cleanup
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,

          // Only cache static assets, NOT JavaScript files
          globPatterns: ["**/*.{css,html,ico,png,svg,jpg,jpeg,gif,woff,woff2,ttf,eot}"],

          // Explicitly exclude JS files from caching
          globIgnores: ["**/*.js", "**/*.jsx", "**/node_modules/**"],

          // Don't cache these routes
          navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],

          runtimeCaching: [
            {
              // Network-first for API calls
              urlPattern: /^https:\/\/api\.homeswift\.co\//,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 300, // 5 minutes
                },
                networkTimeoutSeconds: 10,
              },
            },
            {
              // Network-first for Supabase
              urlPattern: /^https:\/\/[^/]+\.supabase\.co\//,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 300, // 5 minutes only
                },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
      }),
    ],
  };
});
