# Fix Google OAuth Consent Screen Branding

## Issue
When users click "Continue with Google", the consent screen shows the Supabase URL instead of "HomeSwift" as the app name.

## Why This Happens

The app name displayed on the Google OAuth consent screen comes from **Google Cloud Console**, NOT from Supabase or your app code. If you see a Supabase URL, it means:

1. You haven't configured the OAuth consent screen in Google Cloud Console, OR
2. You're using Supabase's default Google OAuth (which uses Supabase's credentials)

## Solution: Set Up Your Own Google OAuth App

### Step 1: Go to Google Cloud Console

1. Open https://console.cloud.google.com/
2. Select your project (or create a new one)
   - Click the project dropdown at the top
   - Click "New Project"
   - Name: **HomeSwift**
   - Click "Create"

### Step 2: Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**

2. **User Type**: Select **External**
   - Click "Create"

3. **App Information**:
   ```
   App name: HomeSwift
   User support email: your-email@domain.com
   App logo: (Optional - upload your logo, 120x120px PNG/JPG)
   ```

4. **App Domain** (Optional but recommended):
   ```
   Application home page: https://www.homeswift.co
   Application privacy policy: https://www.homeswift.co/privacy
   Application terms of service: https://www.homeswift.co/terms
   ```

5. **Authorized Domains**:
   ```
   homeswift.co
   supabase.co (needed for the callback)
   ```

6. **Developer Contact Information**:
   ```
   Email addresses: your-email@domain.com
   ```

7. Click **Save and Continue**

8. **Scopes**:
   - Click "Add or Remove Scopes"
   - Select these scopes:
     - `email` (See your email address)
     - `profile` (See your personal info)
     - `openid` (Authenticate using OpenID Connect)
   - Click "Update"
   - Click "Save and Continue"

9. **Test Users** (if app is in Testing mode):
   - Click "Add Users"
   - Add your email and any test user emails
   - Click "Save and Continue"

10. **Summary**:
    - Review your settings
    - Click "Back to Dashboard"

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**

2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**

3. **Application type**: Web application

4. **Name**: HomeSwift Web Client

5. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:3000
   https://www.homeswift.co
   https://homeswift.co
   ```

6. **Authorized redirect URIs**:
   ```
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   https://www.homeswift.co/auth/callback
   https://homeswift.co/auth/callback
   
   IMPORTANT: Also add your Supabase callback URL:
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   
   **How to find your Supabase callback URL**:
   - Go to Supabase Dashboard → Authentication → Providers
   - Find "Google" provider
   - Look for "Callback URL (for OAuth)" - copy this exact URL
   - Example: `https://abcdefgh.supabase.co/auth/v1/callback`

7. Click **Create**

8. **SAVE YOUR CREDENTIALS**:
   - Copy the **Client ID**
   - Copy the **Client Secret**
   - Keep these safe!

### Step 4: Configure Supabase with Your Google Credentials

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**

2. Find **Google** in the list

3. Toggle **Enable Sign in with Google** to ON

4. **Paste your credentials**:
   ```
   Client ID: [paste from Google Cloud Console]
   Client Secret: [paste from Google Cloud Console]
   ```

5. **Authorized Client IDs**: Leave empty (unless using mobile)

6. Click **Save**

### Step 5: Verify the Callback URL

1. In Supabase Dashboard → **Authentication** → **URL Configuration**

2. Verify these settings:
   ```
   Site URL: https://www.homeswift.co
   
   Redirect URLs (add all):
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   https://www.homeswift.co/auth/callback
   https://homeswift.co/auth/callback
   ```

3. Click **Save**

### Step 6: Test the Changes

1. **Clear browser cache and cookies** (important!)

2. Go to your app: `http://localhost:5173/landlord/login`

3. Click **"Continue with Google"**

4. **Expected Result**:
   - Google consent screen shows **"HomeSwift"** as the app name
   - Shows your app logo (if you uploaded one)
   - Shows "HomeSwift wants to access your Google Account"

5. **If you still see Supabase URL**:
   - Wait 5-10 minutes for Google to propagate changes
   - Clear browser cache again
   - Try in incognito mode
   - Verify you saved the Client ID/Secret in Supabase

## Publishing Your OAuth App (Optional)

By default, your app is in **Testing** mode, which means:
- Only test users you added can sign in
- Users see a warning: "Google hasn't verified this app"

### To Remove the Warning:

1. Go to Google Cloud Console → **OAuth consent screen**

2. Click **Publish App**

3. **Verification Process**:
   - For apps requesting only basic scopes (email, profile), verification is automatic
   - For apps requesting sensitive scopes, you'll need to submit for verification
   - This can take 1-2 weeks

4. **While in Testing**:
   - Add all users who need access to the "Test users" list
   - They'll see a warning but can still sign in

## Troubleshooting

### Issue: Still seeing Supabase URL

**Possible Causes**:
1. You didn't save the Client ID/Secret in Supabase
2. You're using the wrong Google project
3. Browser cache not cleared
4. Changes haven't propagated (wait 10 minutes)

**Fix**:
- Double-check Supabase → Authentication → Providers → Google
- Verify Client ID matches the one from Google Cloud Console
- Try incognito mode
- Wait 10 minutes and try again

### Issue: "redirect_uri_mismatch" Error

**Cause**: The redirect URI in your request doesn't match the ones in Google Cloud Console

**Fix**:
1. Check the error message for the exact redirect URI being used
2. Add that exact URI to Google Cloud Console → Credentials → Authorized redirect URIs
3. Make sure to include the Supabase callback URL: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

### Issue: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not properly configured

**Fix**:
1. Go to Google Cloud Console → OAuth consent screen
2. Ensure all required fields are filled
3. Add your email as a test user
4. Save changes and wait 5 minutes

### Issue: Users see "Google hasn't verified this app"

**This is normal** for apps in Testing mode.

**Options**:
1. **Keep in Testing mode**: Add all users to the test users list
2. **Publish the app**: Click "Publish App" in OAuth consent screen
3. **Submit for verification**: Required for sensitive scopes (not needed for basic email/profile)

## What Users Will See

### Before Fix (Using Supabase Default)
```
[Supabase Logo]
abcdefgh.supabase.co wants to access your Google Account
```

### After Fix (Using Your OAuth App)
```
[HomeSwift Logo]
HomeSwift wants to access your Google Account

This will allow HomeSwift to:
• See your email address
• See your personal info
```

## Security Best Practices

1. **Keep Client Secret secure**:
   - Never commit to Git
   - Only store in Supabase dashboard
   - Rotate if compromised

2. **Use HTTPS in production**:
   - All redirect URIs should use `https://`
   - Only use `http://localhost` for development

3. **Limit authorized domains**:
   - Only add domains you own
   - Remove test domains before going live

4. **Monitor OAuth usage**:
   - Check Google Cloud Console → APIs & Services → Dashboard
   - Look for unusual activity

## Checklist

- [ ] Created Google Cloud project named "HomeSwift"
- [ ] Configured OAuth consent screen with app name "HomeSwift"
- [ ] Added app logo (optional)
- [ ] Created OAuth 2.0 credentials
- [ ] Added all redirect URIs (including Supabase callback)
- [ ] Copied Client ID and Client Secret
- [ ] Pasted credentials into Supabase
- [ ] Verified Supabase redirect URLs
- [ ] Tested in incognito mode
- [ ] Consent screen shows "HomeSwift" ✓

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [OAuth Consent Screen Best Practices](https://support.google.com/cloud/answer/10311615)

---

**Last Updated**: 2025-11-24  
**Status**: Ready to configure  
**Time Required**: 15-20 minutes
