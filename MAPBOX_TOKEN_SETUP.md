# How to Get a New Mapbox Token

## Quick Fix

Your Mapbox token in `.env` is expired or invalid. Follow these steps to get a new one:

## Step-by-Step Guide

### 1. Visit Mapbox Account
Go to: **https://account.mapbox.com/access-tokens/**

### 2. Sign In or Create Account
- If you have a Mapbox account: **Sign in**
- If you're new: **Create a free account** (credit card not required)

### 3. Create New Token
1. Click the **"Create a token"** button
2. **Name your token:** `HomeSwift-Globe-Map`
3. **Select public scopes** (all should be checked by default):
   - ✅ styles:tiles
   - ✅ styles:read  
   - ✅ fonts:read
   - ✅ datasets:read
   - ✅ vision:read

4. **Leave secret scopes unchecked** (not needed for frontend)

5. **Optional: Restrict by URL**
   - Under "URL restrictions" you can add:
     - `http://localhost:3000/*` (development)
     - `https://homeswift.co/*` (production)
     - `https://www.homeswift.co/*` (production with www)

6. Click **"Create token"**

### 4. Copy Your Token
- Your token will start with `pk.`
- Click the copy icon to copy it
- Example format: `pk.eyJ1Ijoib...` (very long string)

### 5. Update .env File

Open `.env` and find line 39:

```bash
VITE_MAPBOX_TOKEN=your_old_token_here
```

Replace with your new token:

```bash
VITE_MAPBOX_TOKEN=pk.your_new_token_here
```

### 6. Restart Development Server

```bash
# Stop the current server (Ctrl+C if running)
npm run dev
```

### 7. Refresh Browser
- Reload the page (F5)
- The 3D globe map should now load!

---

## Verification

If successful, you should see:
- ✅ 3D rotating globe with Earth
- ✅ Stars in space background
- ✅ Property markers on the map
- ✅ No Mapbox errors in console

If you still see errors:
- Double-check the token was copied correctly
- Ensure no extra spaces before/after the token
- Verify the token starts with `pk.`
- Make sure the line in `.env` is: `VITE_MAPBOX_TOKEN=pk...`

---

## Free Tier Limits

Mapbox free tier includes:
- **200,000** map loads per month
- **50,000** geocoding requests
- Plenty for development and small-to-medium production sites

---

## Need Help?

If you encounter issues:
1. Check the Mapbox dashboard for token status
2. Verify URL restrictions aren't blocking localhost
3. Ensure token has all public scopes enabled
4. Try creating a new token without URL restrictions

---

**That's it!** Your 3D globe map will work once you add a valid token. 🌍✨
