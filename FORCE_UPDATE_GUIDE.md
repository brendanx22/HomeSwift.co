# HomeSwift Force Update Guide

## For Deployed Devices That Won't Update

If you're using HomeSwift on a device that's not updating properly, follow these steps to force a complete refresh:

### Automatic Methods (Try First)

#### 1. **Built-in Force Update Button**

- Look for the **"Force Update"** button in the bottom-right corner of the app
- Click it to automatically clear all caches and reload
- This is available on all production builds

#### 2. **Keyboard Shortcut (Desktop)**

- Press **Ctrl + Shift + U** to force update
- This will clear all caches and reload the app

#### 3. **URL Parameters**

Add any of these to the end of the URL:

- `?force_update=true` - Force update with cache clearing
- `?hard_reset=true` - Complete reset including IndexedDB
- `?cache_bust=true` - Light cache clearing

Example: `https://homeswift.co?hard_reset=true`

### Manual Methods (If Automatic Doesn't Work)

#### 4. **Browser Hard Refresh**

- **Desktop**: Ctrl + Shift + R (Windows/Linux) or Cmd + Shift + R (Mac)
- **Mobile**: Pull down to refresh (multiple times)

#### 5. **Clear Browser Data**

**Chrome/Edge:**

1. Go to Settings → Privacy and security → Clear browsing data
2. Select "All time" for time range
3. Check: Cookies, Cached images and files, Site data
4. Click "Clear data"

**Safari:**

1. Go to Settings → Safari → Clear History and Website Data
2. Choose "All History"
3. Confirm

**Firefox:**

1. Go to Settings → Privacy & Security → Clear Data
2. Check "Cookies and site data" and "Cached Web Content"
3. Click "Clear"

#### 6. **PWA Specific Steps**

If installed as a PWA (Progressive Web App):

**Android:**

1. Go to Settings → Apps → HomeSwift
2. Tap "Storage & cache"
3. Tap "Clear storage" and "Clear cache"
4. Reinstall the PWA from the browser

**iOS:**

1. Go to Settings → Safari → Clear History and Website Data
2. Remove the PWA from home screen
3. Reinstall from Safari

#### 7. **Developer Tools (Advanced)**

1. Open Developer Tools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Go to Service Workers → Unregister all
5. Refresh the page

### What Gets Cleared

When you force update, the following is cleared:

- ✅ All browser caches
- ✅ LocalStorage data
- ✅ SessionStorage data
- ✅ Service Workers
- ✅ IndexedDB databases
- ✅ PWA cached files

### What Gets Preserved

- 🔄 Your login session (re-authenticates automatically)
- 🔄 Server-side data (properties, messages, etc.)
- 🔄 Your account and preferences

### Troubleshooting

**Still not updating after force update?**

1. Check your internet connection
2. Try a different browser
3. Restart your device
4. Contact support if issues persist

**Seeing errors after update?**

1. The update might take a few seconds to complete
2. If errors persist, try the hard reset method
3. Clear all browser data as a last resort

### Prevention Tips

To avoid caching issues in the future:

- Keep your browser updated
- Don't use "offline mode" in browsers
- Regularly clear browser data on mobile devices
- Update the app when prompted

### Support

If you continue to experience issues after trying all methods:

- Email: support@homeswift.co
- Include: Device type, browser, and what you've tried
- We'll help you get the latest version running

---

**Note**: Force updating is safe and will not delete your account or data. It only clears local cache files to ensure you get the latest version of the app.
