# Troubleshooting: Google OAuth Still Showing Supabase URL

## Quick Diagnostic Steps

### Step 1: Verify Supabase Was Updated

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard/project/tproalqyxohnjmkgxt/auth/providers

2. **Click on Google provider**

3. **Check the Client ID**
   - Does it show: `1067853597134-52q9qfuu1t1epa6av8lg4c6v6udcpd2c.apps.googleusercontent.com`?
   - If it shows something different, you need to update it

4. **Check if you clicked "Save"**
   - After pasting the credentials, did you click the "Save" button?
   - Supabase won't apply changes unless you save

### Step 2: Force Clear Browser Cache

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "All time" for time range
3. Check these boxes:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. Click "Clear data"
5. **Close ALL browser windows**
6. Reopen browser

**Or use Incognito Mode:**
1. Press `Ctrl + Shift + N` (Chrome/Edge)
2. Go to your app
3. Test Google sign-in

### Step 3: Wait for Propagation

Google OAuth changes can take **5-15 minutes** to propagate.

**What to do:**
1. Wait 10-15 minutes after saving in Supabase
2. Clear cache again
3. Try in incognito mode
4. Test again

### Step 4: Verify OAuth Consent Screen

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/

2. **Go to: APIs & Services → OAuth consent screen**

3. **Verify these settings:**
   ```
   App name: HomeSwift  ← Must be set!
   User support email: [your email]
   ```

4. **If "App name" is NOT "HomeSwift":**
   - Click "Edit App"
   - Change "App name" to "HomeSwift"
   - Click "Save and Continue"
   - Wait 10 minutes

### Step 5: Check Which OAuth App Is Being Used

**The issue might be that Supabase is still using the old credentials.**

**To verify:**

1. Open browser DevTools (F12)
2. Go to your app: `https://www.homeswift.co/landlord/login`
3. Click "Continue with Google"
4. In the URL bar, you'll see something like:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=XXXXXXX...
   ```

5. **Check the `client_id` parameter:**
   - Does it start with `1067853597134-`?
   - If YES → You're using your OAuth app ✓
   - If NO → Supabase is still using the old credentials ✗

### Step 6: Re-save Credentials in Supabase

If the client_id doesn't match, try this:

1. **Go to Supabase → Authentication → Providers → Google**

2. **Toggle "Enable Sign in with Google" OFF**
   - Click the toggle to disable it
   - Click "Save"

3. **Wait 30 seconds**

4. **Toggle "Enable Sign in with Google" ON**
   - Click the toggle to enable it
   - Paste Client ID: `1067853597134-52q9qfuu1t1epa6av8lg4c6v6udcpd2c.apps.googleusercontent.com`
   - Paste Client Secret: `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`
   - Click "Save"

5. **Test again**

## Common Issues & Fixes

### Issue 1: "Still shows Supabase URL after 15 minutes"

**Possible causes:**
- OAuth consent screen "App name" is not set to "HomeSwift"
- Supabase is using cached credentials
- Wrong Google Cloud project

**Fix:**
1. Go to Google Cloud Console → OAuth consent screen
2. Verify "App name" is "HomeSwift"
3. If not, edit and save
4. Wait 10 minutes
5. Clear browser cache
6. Try in incognito mode

### Issue 2: "redirect_uri_mismatch" error

**Cause:** Redirect URI not in Google Cloud Console

**Fix:**
1. Go to Google Cloud Console → Credentials → Your OAuth client
2. Add this to "Authorized redirect URIs":
   ```
   https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback
   ```
3. Click "Save"
4. Wait 5 minutes

### Issue 3: "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen not configured

**Fix:**
1. Go to Google Cloud Console → OAuth consent screen
2. Ensure "App name" is filled: `HomeSwift`
3. Ensure "User support email" is filled
4. Click "Save"

### Issue 4: Client ID in URL doesn't match

**Cause:** Supabase didn't save the credentials

**Fix:**
1. Disable Google provider in Supabase
2. Save
3. Re-enable Google provider
4. Paste credentials again
5. Save
6. Verify by checking the URL's client_id parameter

## Verification Checklist

Run through this checklist:

- [ ] OAuth consent screen "App name" is "HomeSwift"
- [ ] Created OAuth client in Google Cloud Console
- [ ] Copied Client ID: `1067853597134-52q9qfuu1t1epa6av8lg4c6v6udcpd2c...`
- [ ] Copied Client Secret: `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`
- [ ] Went to Supabase → Authentication → Providers → Google
- [ ] Pasted Client ID in Supabase
- [ ] Pasted Client Secret in Supabase
- [ ] Clicked "Save" in Supabase
- [ ] Waited 10-15 minutes
- [ ] Cleared browser cache (all time)
- [ ] Tested in incognito mode
- [ ] Checked client_id in URL matches `1067853597134-`
- [ ] Consent screen shows "HomeSwift"

## Advanced Debugging

### Check the OAuth URL

1. Open DevTools (F12)
2. Go to Network tab
3. Click "Continue with Google"
4. Look for a request to `accounts.google.com`
5. Check the URL parameters:
   ```
   client_id=1067853597134-52q9qfuu1t1epa6av8lg4c6v6udcpd2c...  ← Should match yours
   redirect_uri=https://tproalqyxohnjmkgxt.supabase.co/auth/v1/callback
   ```

### Check Supabase Logs

1. Go to Supabase Dashboard → Logs → Auth
2. Look for any errors related to Google OAuth
3. Check if the client_id in the logs matches yours

## What Should Happen

### Before Fix
```
┌─────────────────────────────────────────┐
│  Sign in                                │
│  to continue to                         │
│  tproalqyxohnjmkgxt.supabase.co        │
└─────────────────────────────────────────┘
```

### After Fix
```
┌─────────────────────────────────────────┐
│  Sign in                                │
│  to continue to HomeSwift               │
└─────────────────────────────────────────┘
```

## If Nothing Works

**Last resort steps:**

1. **Create a new OAuth client in Google Cloud Console**
   - Maybe the first one has issues
   - Use a different name: "HomeSwift Web Client 2"
   - Get new Client ID and Secret
   - Update Supabase with the new credentials

2. **Check if you're in the right Google Cloud project**
   - Make sure you're in the "HomeSwift" project
   - Not in a different project

3. **Contact Supabase Support**
   - If Supabase isn't saving the credentials
   - They can check server-side logs

## Timeline

- **Immediate**: Update Supabase credentials
- **0-5 minutes**: Clear cache, test in incognito
- **5-10 minutes**: Google propagates changes
- **10-15 minutes**: Should be working
- **15+ minutes**: If still not working, something else is wrong

---

**Current Time**: You just updated Supabase  
**Expected Working**: In 10-15 minutes  
**Next Check**: Try again in 10 minutes with cleared cache
