# Google Authentication Setup Guide

## Current Status
✅ **Code Implementation**: Complete  
⚠️ **Supabase Configuration**: Needs verification  
⚠️ **Google Cloud Console**: Needs setup/verification

---

## What's Already Implemented

### 1. Frontend Code (✅ Complete)
- `src/lib/googleAuth.js` - Google OAuth helper functions
- `src/contexts/AuthContext.jsx` - `loginWithGoogle()` function (lines 1250-1300)
- `src/pages/LoginPage.jsx` - Google login button with handler
- `src/pages/AuthCallback.jsx` - OAuth callback handler with role management
- `src/pages/LandlordLoginPage.jsx` - (needs verification)
- `src/pages/SignupPage.jsx` - (needs verification)

### 2. OAuth Flow
```
User clicks "Continue with Google"
  ↓
loginWithGoogle(userType) stores 'pendingUserType' in localStorage
  ↓
Redirects to Google OAuth consent screen
  ↓
Google redirects back to /auth/callback
  ↓
AuthCallback.jsx processes the session:
  - Creates/updates user_profiles
  - Adds/updates user_roles
  - Sets currentRole based on pendingUserType
  - Redirects to appropriate dashboard
```

---

## Required Setup Steps

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**  
   https://console.cloud.google.com/

2. **Create/Select a Project**
   - Click "Select a project" → "New Project"
   - Name: "HomeSwift" (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" (unless you have a Google Workspace)
   - Fill in:
     - App name: **HomeSwift**
     - User support email: **your-email@domain.com**
     - Developer contact: **your-email@domain.com**
   - Add scopes:
     - `email`
     - `profile`
     - `openid`
   - Add test users (if in testing mode):
     - Add your email and any test user emails
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Web application**
   - Name: **HomeSwift Web Client**
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     http://localhost:3000
     https://www.homeswift.co
     https://homeswift.co
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:5173/auth/callback
     http://localhost:3000/auth/callback
     https://www.homeswift.co/auth/callback
     https://homeswift.co/auth/callback
     ```
   - Click "Create"
   - **SAVE** the Client ID and Client Secret

---

### Step 2: Supabase Configuration

1. **Go to Supabase Dashboard**  
   https://app.supabase.com/project/YOUR_PROJECT_ID/auth/providers

2. **Enable Google Provider**
   - Navigate to: **Authentication → Providers**
   - Find "Google" in the list
   - Toggle **Enable Sign in with Google**

3. **Configure Google Provider**
   - Paste your **Google Client ID** (from Step 1)
   - Paste your **Google Client Secret** (from Step 1)
   - Authorized Client IDs: (leave empty unless using mobile)
   - Click "Save"

4. **Verify Redirect URLs**
   - Go to **Authentication → URL Configuration**
   - Ensure these are set:
     - Site URL: `https://www.homeswift.co`
     - Redirect URLs (add all):
       ```
       http://localhost:5173/auth/callback
       http://localhost:3000/auth/callback
       https://www.homeswift.co/auth/callback
       https://homeswift.co/auth/callback
       ```

5. **Email Templates (Optional but Recommended)**
   - Go to **Authentication → Email Templates**
   - Customize the "Confirm signup" template if needed
   - Ensure the redirect URL is correct

---

### Step 3: Environment Variables

Verify your `.env` file has the correct Supabase credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend (if applicable)
VITE_BACKEND_URL=https://api.homeswift.co
VITE_API_URL=https://api.homeswift.co
```

---

### Step 4: Test the Flow

1. **Local Testing**
   ```bash
   npm run dev
   ```

2. **Test Renter Login**
   - Go to http://localhost:5173/login
   - Click "Continue with Google"
   - Select a Google account
   - Should redirect to `/chat` (Renter dashboard)

3. **Test Landlord Login**
   - Go to http://localhost:5173/landlord/login
   - Click "Continue with Google"
   - Select a Google account
   - Should redirect to `/landlord/dashboard`

4. **Check Console Logs**
   Look for these key logs:
   ```
   🔐 Google OAuth - Starting with userType: renter
   ✅ Stored pendingUserType in localStorage: renter
   ✅ Google OAuth initiated successfully, redirecting to Google...
   🔍 Pending user type from OAuth: renter
   ✅ Using pending user type from OAuth: renter
   🔄 User is now 'renter', redirecting to: /chat
   ```

---

## Common Issues & Fixes

### Issue 1: "redirect_uri_mismatch" Error
**Cause**: The redirect URI in Google Cloud Console doesn't match the one Supabase is using.

**Fix**:
1. Check the error message for the exact redirect URI being used
2. Add that exact URI to Google Cloud Console → Credentials → Authorized redirect URIs
3. Wait 5-10 minutes for Google to propagate the change

### Issue 2: "Access blocked: This app's request is invalid"
**Cause**: OAuth consent screen not properly configured.

**Fix**:
1. Go to Google Cloud Console → OAuth consent screen
2. Ensure all required fields are filled
3. Add your email as a test user
4. Publish the app (or keep it in testing mode with test users)

### Issue 3: User redirected but not logged in
**Cause**: Session not being created properly in AuthCallback.

**Fix**:
1. Check browser console for errors
2. Verify Supabase credentials in `.env`
3. Check Network tab for failed API calls
4. Ensure `user_profiles` and `user_roles` tables exist

### Issue 4: Wrong dashboard after login
**Cause**: `pendingUserType` not being set or retrieved correctly.

**Fix**:
1. Check that `loginWithGoogle(userType)` is being called with the correct type
2. Verify localStorage in DevTools → Application → Local Storage
3. Should see `pendingUserType: "renter"` or `"landlord"`

### Issue 5: "Invalid grant" or "Token expired"
**Cause**: OAuth flow interrupted or took too long.

**Fix**:
1. Clear browser cache and cookies
2. Try the flow again
3. Ensure system clock is correct

---

## Database Schema Verification

Ensure these tables exist in Supabase:

### `user_profiles` table
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('renter', 'landlord', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `user_roles` table
```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('renter', 'landlord', 'admin')),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

---

## Security Checklist

- [ ] Google Client Secret is kept secure (not in frontend code)
- [ ] Supabase Anon Key is used (not Service Role Key)
- [ ] RLS policies are enabled on `user_profiles` and `user_roles`
- [ ] OAuth consent screen is properly configured
- [ ] Redirect URIs are whitelisted in both Google and Supabase
- [ ] HTTPS is used in production
- [ ] CORS is properly configured on backend

---

## Next Steps After Google Auth Works

1. **Add more OAuth providers** (Facebook, GitHub, etc.)
2. **Implement email verification** for email/password signups
3. **Add 2FA** for enhanced security
4. **Set up proper error tracking** (Sentry, LogRocket)
5. **Add analytics** for OAuth conversion rates

---

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs → Auth
2. Check browser console for errors
3. Verify Google Cloud Console audit logs
4. Test with a different Google account
5. Try incognito mode to rule out cache issues

---

**Last Updated**: 2025-11-24  
**Status**: Ready for configuration
