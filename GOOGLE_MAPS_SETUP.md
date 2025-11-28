# How to Get a Google Maps API Key

## Quick Setup (5 minutes)

Google Maps has a **FREE tier** with **$200 monthly credit** - that's approximately **28,000 map loads per month** for free!

---

## Step-by-Step Guide

### 1. Go to Google Cloud Console
Visit: **https://console.cloud.google.com/**

### 2. Create a Project (if you don't have one)
1. Click **"Select a project"** dropdown at the top
2. Click **"NEW PROJECT"**
3. Name it: `HomeSwift`
4. Click **"CREATE"**

### 3. Enable Required APIs
1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - ✅ **Maps JavaScript API** (required)
   - ✅ **Maps Embed API** (recommended)
   - ✅ **Places API** (optional, for search)
   - ✅ **Geocoding API** (optional, for addresses)

### 4. Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"API key"**
4. Your API key will be created!

### 5. Restrict Your API Key (IMPORTANT for security)

Click **"EDIT API KEY"** and configure:

#### Application Restrictions:
- Select **"HTTP referrers (websites)"**
- Add these referrers:
  ```
  http://localhost:3000/*
  http://localhost:3001/*
  https://homeswift.co/*
  https://www.homeswift.co/*
  ```

#### API Restrictions:
- Select **"Restrict key"**
- Choose:
  - ✅ Maps JavaScript API
  - ✅ Maps Embed API (if enabled)
  - ✅ Places API (if enabled)
  - ✅ Geocoding API (if enabled)

Click **"SAVE"**

### 6. Copy Your API Key
- Copy the API key (starts with `AIza...`)

### 7. Update .env File

Open `.env` and find line 40:

```bash
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

Replace with your actual key:

```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 8. Restart Dev Server

```bash
# Stop current server (Ctrl+C if running)
npm run dev
```

### 9. Refresh Browser
- Reload the page (F5)
- The Google Maps should now load!

---

## Free Tier Details

Google Maps Platform offers:
- **$200 monthly credit** (automatically applied)
- Covers approximately:
  - **28,000 map loads** per month
  - **40,000 geocoding requests**
  - **100,000 static map requests**

**Perfect for development and small-to-medium production sites!**

---

## Verification

If successful, you should see:
- ✅ Google Maps with satellite/street view toggle
- ✅ 3D buildings when zoomed in
- ✅ Property markers on the map
- ✅ Zoom, pan, rotate controls
- ✅ No API errors in console

If you see "For development purposes only" watermark:
- This means billing is not enabled
- You still get the $200 free credit
- To remove watermark: enable billing (but you won't be charged unless you exceed $200/month)

---

## Enable Billing (Optional, for production)

To remove the watermark and get full features:

1. Go to **Billing** in Google Cloud Console
2. Click **"LINK A BILLING ACCOUNT"**
3. Create billing account (credit card required but won't be charged)
4. You still get **$200 free every month**
5. You'll only be charged if you exceed $200/month

**Note:** Most small apps never exceed the free tier!

---

## Features You Get

### 3D Features:
- 📍 Advanced markers with custom icons
- 🏢 3D buildings (automatic)
- 🎯 Tilt/rotate controls
- 🗺️ Street View integration
- 🛰️ Satellite imagery

### Interactive:
- 📌 Click to place markers
- 💬 Info windows for properties
- 🔍 Zoom and pan
- 📱 Mobile touch gestures
- 🎨 Custom styling

---

## Troubleshooting

### "This API project is not authorized to use this API"
- Make sure Maps JavaScript API is **enabled** in your project
- Wait 1-2 minutes for changes to propagate

### "RefererNotAllowedMapError"
- Check HTTP referrers in API key restrictions
- Make sure localhost and your domain are added

### Map shows but features don't work
- Enable additional APIs (Places, Geocoding)
- Check API restrictions include all needed APIs

### "For development purposes only" watermark
- Enable billing to remove (you still get $200 free credit)
- Or keep it for development - it doesn't affect functionality

---

## Cost Calculator

Use the Google Maps pricing calculator to estimate costs:
**https://mapsplatform.google.com/pricing/**

**Example for HomeSwift:**
- 10,000 map loads/month = **FREE** ($0, covered by $200 credit)
- 20,000 map loads/month = **FREE** ($0, covered by $200 credit)
- 50,000 map loads/month = **~$100/month** (after $200 credit)

Most small to medium apps stay well within the free tier!

---

## Security Best Practices

✅ **DO:**
- Restrict API key to specific domains
- Restrict to only needed APIs
- Enable billing alerts
- Monitor usage in Console

❌ **DON'T:**
- Commit API key to public GitHub
- Use same key for dev and production
- Leave key unrestricted
- Share key publicly

---

**That's it!** Your Google Maps will work with 3D features, satellite view, and all the premium features! 🗺️✨
