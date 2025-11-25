# Google OAuth Landlord Redirect Fix

## What Was Fixed

**Issue**: When landlords clicked "Continue with Google" on `/landlord/login`, they were being redirected to the homepage (`/`) instead of the landlord dashboard (`/landlord/dashboard`).

**Root Cause**: Race condition between `App.jsx` redirect logic and `AuthCallback.jsx` OAuth processing. The App.jsx was redirecting users before AuthCallback finished setting up the role data.

## Changes Made

### File: `src/App.jsx`

**Added**:
1. Check for `/auth/callback` route - skip all redirects when on this page
2. Check for `pendingUserType` in localStorage - skip redirects if OAuth flow is in progress
3. Added `/auth/callback` to the list of auth pages (unauthenticated users allowed)
4. Enhanced console logging for better debugging

**Key Logic**:
```javascript
// Don't redirect if we're in the OAuth callback
if (isAuthCallback) {
  console.log('🔄 In OAuth callback, skipping App.jsx redirects');
  return;
}

// Don't redirect if OAuth flow is in progress
const pendingUserType = localStorage.getItem('pendingUserType');
if (pendingUserType && isAuthenticated) {
  console.log('🔄 OAuth flow in progress, waiting for AuthCallback to complete');
  return;
}
```

## How It Works Now

### OAuth Flow (Landlord Example)

1. **User clicks "Continue with Google" on `/landlord/login`**
   - `loginWithGoogle('landlord')` is called
   - `pendingUserType: 'landlord'` is stored in localStorage
   - User is redirected to Google consent screen

2. **Google redirects back to `/auth/callback`**
   - App.jsx sees `isAuthCallback = true` → **skips all redirects**
   - AuthCallback.jsx takes over

3. **AuthCallback.jsx processes the OAuth response**
   - Reads `pendingUserType` from localStorage → `'landlord'`
   - Creates/updates user profile with `user_type: 'landlord'`
   - Adds/updates `user_roles` table with `role: 'landlord'`
   - Updates localStorage with user data and roles
   - Clears `pendingUserType` from localStorage
   - Redirects to `/landlord/dashboard`

4. **App.jsx sees the redirect to `/landlord/dashboard`**
   - User is authenticated
   - `detectedRole = 'landlord'`
   - User is already on correct route → no redirect needed

## Testing Checklist

### Test 1: New Landlord Google Signup
- [ ] Go to `/landlord/login`
- [ ] Click "Continue with Google"
- [ ] Select Google account
- [ ] Should redirect to `/landlord/dashboard` (NOT `/`)
- [ ] Check localStorage: `currentRole` should be `'landlord'`
- [ ] Check Supabase: `user_profiles.user_type` should be `'landlord'`
- [ ] Check Supabase: `user_roles` should have a row with `role: 'landlord'`

### Test 2: Existing Landlord Google Login
- [ ] Use a Google account that already has a landlord account
- [ ] Go to `/landlord/login`
- [ ] Click "Continue with Google"
- [ ] Should redirect to `/landlord/dashboard` (NOT `/`)
- [ ] No duplicate roles should be created

### Test 3: Renter Google Login (Control Test)
- [ ] Go to `/login` (renter login)
- [ ] Click "Continue with Google"
- [ ] Should redirect to `/chat` (NOT `/`)
- [ ] Check localStorage: `currentRole` should be `'renter'`

### Test 4: Dual Role User
- [ ] Use a Google account that has BOTH renter and landlord roles
- [ ] Go to `/landlord/login`
- [ ] Click "Continue with Google"
- [ ] Should redirect to `/landlord/dashboard`
- [ ] `currentRole` should be `'landlord'`
- [ ] Now go to `/login` (renter)
- [ ] Click "Continue with Google"
- [ ] Should redirect to `/chat`
- [ ] `currentRole` should be `'renter'`

## Console Logs to Watch For

### Successful Landlord OAuth Flow

```
🔐 Google OAuth - Starting with userType: landlord
✅ Stored pendingUserType in localStorage: landlord
✅ Google OAuth initiated successfully, redirecting to Google...

[After Google redirect]

🔄 In OAuth callback, skipping App.jsx redirects
🔍 Pending user type from OAuth: landlord
✅ Using pending user type from OAuth: landlord
🔄 User is now 'landlord', redirecting to: /landlord/dashboard
✅ Cleared pendingUserType from localStorage

[After redirect to dashboard]

AppLayout Auth Debug: {
  isAuthenticated: true,
  detectedRole: 'landlord',
  currentRole: 'landlord',
  path: '/landlord/dashboard'
}
```

### If Something Goes Wrong

**Symptom**: Still redirecting to `/`

**Check**:
1. Browser console for errors
2. localStorage → `pendingUserType` (should be set before redirect, cleared after)
3. localStorage → `currentRole` (should be `'landlord'` after OAuth)
4. localStorage → `userRoles` (should have landlord role)
5. Network tab → Check if `/auth/callback` is being hit
6. Supabase → Check `user_profiles` and `user_roles` tables

**Common Issues**:
- `pendingUserType` not being set → Check `loginWithGoogle()` in AuthContext
- `pendingUserType` not being read → Check AuthCallback.jsx line 38
- Role not being saved → Check Supabase RLS policies on `user_roles`
- Wrong redirect → Check AuthCallback.jsx lines 270-283

## Rollback Instructions

If this fix causes issues, revert `src/App.jsx` to remove:
1. The `isAuthCallback` check (lines 84-88)
2. The `pendingUserType` check (lines 90-94)
3. `/auth/callback` from `authPages` array (line 144)

## Related Files

- `src/App.jsx` - Main redirect logic (MODIFIED)
- `src/contexts/AuthContext.jsx` - `loginWithGoogle()` function
- `src/pages/AuthCallback.jsx` - OAuth callback handler
- `src/pages/LandlordLoginPage.jsx` - Landlord login UI
- `src/pages/LoginPage.jsx` - Renter login UI

## Next Steps

1. **Test the fix** using the checklist above
2. **Deploy to production** if tests pass
3. **Monitor** Supabase logs for any auth errors
4. **Verify** Google Cloud Console redirect URIs are correct

---

**Fixed**: 2025-11-24  
**Status**: Ready for testing  
**Priority**: High - affects all Google OAuth landlord logins
