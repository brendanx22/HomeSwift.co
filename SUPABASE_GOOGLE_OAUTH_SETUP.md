# Quick Setup - Add Your Google OAuth Credentials to Supabase

## What You're Looking At

Your screenshot shows the Supabase Google provider configuration page. Currently, it's **enabled** but you need to add your own Google OAuth credentials to show "HomeSwift" instead of the Supabase URL.

## Current State (from your screenshot)

✅ **Enable Sign in with Google**: ON (green toggle)  
⚠️ **Client ID**: Already filled (Supabase default)  
⚠️ **Client Secret**: Already filled (Supabase default)  
✅ **Callback URL**: `https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback`

## What You Need to Do

### Step 1: Get Your Google OAuth Credentials

**If you haven't created them yet**, follow these steps:

1. **Go to Google Cloud Console**
   - Open: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project** (or select existing)
   - Click the project dropdown at the top
   - Click "New Project"
   - **Project name**: `HomeSwift`
   - Click "Create"
   - Wait for the project to be created (~30 seconds)

3. **Enable Google+ API**
   - In the search bar, type "Google+ API"
   - Click on it and click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to: **APIs & Services** → **OAuth consent screen**
   - Select **External** user type
   - Click "Create"
   
   **Fill in the form**:
   ```
   App name: HomeSwift
   User support email: [your email]
   App logo: [optional - upload your logo]
   
   Developer contact information:
   Email addresses: [your email]
   ```
   
   - Click "Save and Continue"
   - Click "Save and Continue" on Scopes (default scopes are fine)
   - Click "Save and Continue" on Test users
   - Click "Back to Dashboard"

5. **Create OAuth 2.0 Credentials**
   - Go to: **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   
   **Fill in the form**:
   ```
   Application type: Web application
   Name: HomeSwift Web Client
   
   Authorized JavaScript origins:
   - http://localhost:5173
   - http://localhost:3000
   - https://www.homeswift.co
   - https://homeswift.co
   
   Authorized redirect URIs:
   - http://localhost:5173/auth/callback
   - http://localhost:3000/auth/callback
   - https://www.homeswift.co/auth/callback
   - https://homeswift.co/auth/callback
   - https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback
   ```
   
   ⚠️ **IMPORTANT**: The last redirect URI must be your Supabase callback URL from the screenshot:
   ```
   https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback
   ```
   
   - Click "Create"
   
6. **Copy Your Credentials**
   - A popup will show your **Client ID** and **Client Secret**
   - **Copy both** and save them somewhere safe
   - You'll need these in the next step

### Step 2: Add Credentials to Supabase

Now go back to the Supabase page you have open:

1. **Clear the existing values** (they're Supabase defaults)
   - Click in the "Client IDs" field
   - Delete the existing value
   - Paste your **Client ID** from Google Cloud Console

2. **Update the Client Secret**
   - Click in the "Client Secret (for OAuth)" field
   - Delete the existing value
   - Paste your **Client Secret** from Google Cloud Console

3. **Verify the Callback URL**
   - Make sure it shows: `https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback`
   - This should already be correct (as shown in your screenshot)

4. **Optional Settings** (you can leave these as default):
   - ☐ Skip nonce checks (leave unchecked)
   - ☐ Allow users without an email (leave unchecked)

5. **Click "Save"** at the bottom right

### Step 3: Test the Changes

1. **Clear your browser cache**
   - Press `Ctrl + Shift + Delete`
   - Select "Cookies and other site data"
   - Click "Clear data"

2. **Go to your app**
   - Navigate to: `http://localhost:5173/landlord/login`
   - Or: `https://www.homeswift.co/landlord/login`

3. **Click "Continue with Google"**

4. **Expected Result**:
   - Google consent screen should show **"HomeSwift"** as the app name
   - NOT the Supabase URL

### Step 4: Verify in Google Cloud Console

After testing, verify the redirect URIs are correct:

1. Go back to Google Cloud Console → **Credentials**
2. Click on your OAuth client ID
3. Verify all these redirect URIs are listed:
   ```
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   https://www.homeswift.co/auth/callback
   https://homeswift.co/auth/callback
   https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback  ← CRITICAL
   ```

## Troubleshooting

### Issue: "redirect_uri_mismatch" error

**Cause**: The Supabase callback URL is not in your Google Cloud Console redirect URIs

**Fix**:
1. Copy this exact URL: `https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback`
2. Go to Google Cloud Console → Credentials → Your OAuth client
3. Add it to "Authorized redirect URIs"
4. Click "Save"
5. Wait 5 minutes and try again

### Issue: Still seeing Supabase URL on consent screen

**Possible causes**:
1. You didn't save the credentials in Supabase
2. Browser cache not cleared
3. Changes haven't propagated (wait 10 minutes)

**Fix**:
1. Go back to Supabase and verify the Client ID is YOUR Client ID (not Supabase's)
2. Clear browser cache and cookies
3. Try in incognito/private mode
4. Wait 10 minutes for Google to propagate changes

### Issue: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not configured

**Fix**:
1. Go to Google Cloud Console → OAuth consent screen
2. Make sure "App name" is set to "HomeSwift"
3. Make sure your email is in "User support email"
4. Click "Save"

### Issue: "Google hasn't verified this app" warning

**This is normal** for new apps. Users can still sign in by clicking "Advanced" → "Go to HomeSwift (unsafe)"

**To remove the warning**:
1. Go to Google Cloud Console → OAuth consent screen
2. Click "Publish App"
3. For basic scopes (email, profile), verification is automatic

## What Changed

### Before (Supabase Default)
- Consent screen shows: `tproalqyxohnjmkgxt.supabase.co`
- Uses Supabase's Google OAuth app
- You have no control over branding

### After (Your OAuth App)
- Consent screen shows: `HomeSwift`
- Uses YOUR Google OAuth app
- You control the branding, logo, and app name

## Security Notes

⚠️ **Keep your Client Secret secure**:
- Never commit it to Git
- Only store it in Supabase dashboard
- If compromised, regenerate it in Google Cloud Console

✅ **Your Supabase callback URL**:
```
https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback
```
This MUST be in your Google Cloud Console redirect URIs.

## Quick Checklist

- [ ] Created Google Cloud project "HomeSwift"
- [ ] Configured OAuth consent screen with app name "HomeSwift"
- [ ] Created OAuth 2.0 credentials
- [ ] Added Supabase callback URL to redirect URIs
- [ ] Copied Client ID and Client Secret
- [ ] Pasted credentials into Supabase (the page you have open)
- [ ] Clicked "Save" in Supabase
- [ ] Cleared browser cache
- [ ] Tested "Continue with Google"
- [ ] Consent screen shows "HomeSwift" ✓

---

**Your Supabase Callback URL**: `https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback`  
**Time Required**: 15-20 minutes  
**Status**: Ready to configure
