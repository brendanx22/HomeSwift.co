# Cache Busting & Update Deployment Guide

## Problem
Users with old cached versions of the app don't see new changes unless they clear cache or use incognito mode.

## Solutions Implemented

### 1. **Meta Tags in index.html** ✅
Added cache-control meta tags to force browsers to check for updates:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### 2. **Updated Vite PWA Configuration** ✅
Changed PWA settings to prevent aggressive caching:
- Changed `registerType` from `"autoUpdate"` to `"prompt"` - users will be notified of updates
- Added `cleanupOutdatedCaches: true` - removes old caches automatically
- Added `skipWaiting: true` - new service worker activates immediately
- Added `clientsClaim: true` - new service worker takes control immediately
- **Excluded ALL JavaScript files from caching** - prevents stale code
- Reduced cache time from 24 hours to 5 minutes for API calls

### 3. **Update Prompt Component** ✅
The app already has an UpdatePrompt component that:
- Detects when a new version is available
- Shows a beautiful notification to users
- Allows one-click update
- Automatically reloads the page to get the latest version

## How It Works Now

### For New Deployments:
1. You deploy new code to production
2. Service worker detects the change
3. User sees update prompt: "New version available!"
4. User clicks "Update Now"
5. Page reloads with fresh code
6. User has the latest version! 🎉

### Cache Strategy:
- **HTML files**: No cache (always fresh)
- **CSS/Images/Fonts**: Cached (static assets)
- **JavaScript files**: NOT cached (always fresh)
- **API calls**: Network-first, 5 minute cache
- **Supabase calls**: Network-first, 5 minute cache

## Deployment Checklist

When deploying updates:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to production** (your hosting platform)

3. **Verify deployment:**
   - Open your site in incognito mode
   - Check browser console for "Service Worker: Registered successfully"
   - Make a change and verify it shows up

4. **For existing users:**
   - They will see the update prompt automatically
   - Or they can hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## Manual Cache Clear (For Users)

If a user still has issues, they can:

### Chrome/Edge:
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Firefox:
1. Press `Ctrl+Shift+Delete`
2. Select "Cached Web Content"
3. Click "Clear Now"

### Safari:
1. Press `Cmd+Option+E` to empty cache
2. Reload the page

## Testing Cache Busting

### Test 1: Hard Refresh
1. Make a small change (e.g., change a button text)
2. Build and deploy
3. On the live site, press `Ctrl+Shift+R`
4. Verify the change appears

### Test 2: Service Worker Update
1. Make a change and deploy
2. Wait a few seconds
3. You should see the update prompt
4. Click "Update Now"
5. Verify the change appears

### Test 3: New User
1. Open the site in incognito mode
2. Verify you see the latest version immediately

## Advanced: Force Update All Users

If you need to force all users to update immediately:

### Option 1: Version Bump in Service Worker
Add a version number to your service worker:
```javascript
const CACHE_VERSION = 'v2.0.0';
```

### Option 2: Clear All Caches Programmatically
The app has a `CacheManager` component that can clear all caches.

### Option 3: Change Service Worker Scope
In `vite.config.js`, you can change the service worker registration to force a re-registration.

## Monitoring

### Check Service Worker Status:
Open DevTools → Application → Service Workers

You should see:
- Status: "activated and is running"
- Source: /sw.js
- Update on reload: ✓

### Check Cache:
Open DevTools → Application → Cache Storage

You should see:
- Only static assets (CSS, images, fonts)
- NO JavaScript files
- API responses (short-lived)

## Common Issues & Solutions

### Issue: "Changes not showing up"
**Solution:**
1. Check if service worker is registered
2. Hard refresh (`Ctrl+Shift+R`)
3. Clear cache manually
4. Check browser console for errors

### Issue: "Update prompt not showing"
**Solution:**
1. Service worker might not detect changes
2. Wait a few minutes (update check runs every hour)
3. Manually trigger update in DevTools → Application → Service Workers → Update

### Issue: "Old version still loading"
**Solution:**
1. Unregister all service workers in DevTools
2. Clear all caches
3. Hard refresh
4. Service worker will re-register with new version

## Production Deployment Best Practices

1. **Always build before deploying:**
   ```bash
   npm run build
   ```

2. **Test in staging first** (if you have a staging environment)

3. **Deploy during low-traffic hours** to minimize user disruption

4. **Monitor for errors** after deployment

5. **Have a rollback plan** ready

## Vite Build Configuration

The current build configuration ensures cache busting:

```javascript
build: {
  rollupOptions: {
    output: {
      // Hash in filenames ensures cache busting
      chunkFileNames: 'assets/[name]-[hash].js',
      entryFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]',
    }
  }
}
```

Every build creates new filenames with unique hashes, forcing browsers to download new files.

## Summary

✅ **Meta tags** prevent HTML caching
✅ **Vite config** excludes JS from caching
✅ **Service worker** prompts users for updates
✅ **Update component** provides one-click updates
✅ **Hash-based filenames** ensure cache busting

**Result:** Users will always get the latest version, either automatically or with a simple "Update Now" click!

## Emergency Cache Clear

If you need to force clear all user caches immediately, you can add this to your service worker:

```javascript
// In sw.js
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
```

This will clear all caches when the new service worker activates.
