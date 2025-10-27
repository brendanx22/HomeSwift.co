# Google OAuth Setup Guide for HomeSwift

## Overview
This guide will help you configure Google OAuth authentication for your HomeSwift application using Supabase. The implementation supports both landlord and renter user types with a single Google account.

## Features Implemented

### ✅ Google OAuth Integration
- **User Type Selection**: Users can sign in as either landlord or renter using the same Google account
- **Seamless Role Management**: Automatically creates and manages user roles based on selection
- **Profile Sync**: Syncs Google profile data (name, avatar) with HomeSwift user profiles
- **Real-time Updates**: Changes to user profiles and roles update across all pages instantly

### ✅ Real-time Data Synchronization
- **Profile Updates**: User profile changes sync automatically across all open tabs/pages
- **Role Changes**: Role updates reflect immediately without page refresh
- **Cross-page Updates**: No need to refresh - data updates in real-time

## Configuration Steps

### 1. Set Up Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project** (if you don't have one)
   - Click "Select a project" → "New Project"
   - Name: `HomeSwift` (or your preferred name)
   - Click "Create"

3. **Enable Google+ API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: `HomeSwift Production`
   
5. **Configure Authorized Origins**
   Add these URLs:
   ```
   https://homeswift.co
   https://www.homeswift.co
   https://tproaiqvkohrlxjmkgxt.supabase.co
   ```

6. **Configure Authorized Redirect URIs**
   Add these URLs:
   ```
   https://tproaiqvkohrlxjmkgxt.supabase.co/auth/v1/callback
   https://homeswift.co/auth/callback
   https://www.homeswift.co/auth/callback
   ```

7. **Save Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret**
   - Keep these secure!

### 2. Configure Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/
   - Select your HomeSwift project

2. **Navigate to Authentication Settings**
   - Click "Authentication" in the sidebar
   - Go to "Providers" tab

3. **Enable Google Provider**
   - Find "Google" in the list
   - Toggle it ON
   - Paste your **Client ID**
   - Paste your **Client Secret**
   - Click "Save"

4. **Configure Redirect URLs**
   - Go to "URL Configuration" in Authentication settings
   - Add Site URL: `https://homeswift.co`
   - Add Redirect URLs:
     ```
     https://homeswift.co/auth/callback
     https://www.homeswift.co/auth/callback
     ```

### 3. Update Environment Variables

Update your `.env` file with the Google OAuth credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://api.homeswift.co/auth/google/callback

# Supabase Configuration (already set)
VITE_SUPABASE_URL=https://tproaiqvkohrlxjmkgxt.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_REDIRECT_URL=https://homeswift.co/auth/callback
```

### 4. Database Setup

Ensure your Supabase database has the required tables:

#### user_profiles table
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('landlord', 'renter')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

#### user_roles table
```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('landlord', 'renter')),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
  ON user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roles"
  ON user_roles FOR UPDATE
  USING (auth.uid() = user_id);
```

### 5. Enable Realtime

In your Supabase dashboard:

1. Go to "Database" → "Replication"
2. Enable replication for these tables:
   - `user_profiles`
   - `user_roles`
3. Click "Save"

## How It Works

### User Flow

1. **User Selects Type**
   - User visits `/user-type` and selects "Landlord" or "Renter"
   - Selection is stored in localStorage as `pendingUserType`

2. **Google OAuth Initiated**
   - User clicks "Continue with Google" on login page
   - `loginWithGoogle(userType)` is called with the selected type
   - User is redirected to Google sign-in

3. **OAuth Callback**
   - Google redirects to `/auth/callback`
   - `AuthCallback` component handles the response
   - Retrieves `pendingUserType` from localStorage

4. **Profile & Role Creation**
   - If new user:
     - Creates user profile with selected user_type
     - Creates initial role in user_roles table
     - Updates Supabase auth metadata
   - If existing user:
     - Uses existing user_type
     - Maintains existing roles

5. **Real-time Sync**
   - Supabase real-time subscriptions listen for changes
   - Profile updates sync across all pages
   - Role changes update immediately

### Multi-Role Support

Users can have both landlord and renter roles:

```javascript
// User can switch between roles
const { switchRole } = useAuth();

// Switch to landlord
await switchRole('landlord');

// Switch to renter
await switchRole('renter');
```

### Real-time Updates

The AuthContext automatically subscribes to changes:

```javascript
// Listens to user_profiles table
supabase
  .channel(`user_profile_${user.id}`)
  .on('postgres_changes', { ... })
  .subscribe();

// Listens to user_roles table
supabase
  .channel(`user_roles_${user.id}`)
  .on('postgres_changes', { ... })
  .subscribe();
```

## Testing

### Test Google OAuth

1. **Renter Login**
   - Go to `/user-type`
   - Select "I'm Looking for a Home"
   - Click "Continue with Google"
   - Sign in with Google
   - Should redirect to `/chat`

2. **Landlord Login**
   - Go to `/user-type`
   - Select "I'm a Property Owner/Manager"
   - Click "Continue with Google"
   - Sign in with same Google account
   - Should redirect to `/landlord/dashboard`

3. **Role Switching**
   - Login as renter
   - Navigate to profile settings
   - Add landlord role
   - Switch between roles
   - Verify pages update without refresh

### Test Real-time Updates

1. Open HomeSwift in two browser tabs
2. Login with the same account in both
3. In tab 1: Update profile (name, avatar)
4. In tab 2: Changes should appear automatically
5. In tab 1: Add a new role
6. In tab 2: New role should appear immediately

## Troubleshooting

### Google OAuth Not Working

**Error**: "redirect_uri_mismatch"
- **Solution**: Verify redirect URIs in Google Cloud Console match exactly
- Check for trailing slashes
- Ensure HTTPS is used in production

**Error**: "Access blocked: This app's request is invalid"
- **Solution**: Enable Google+ API in Google Cloud Console
- Verify OAuth consent screen is configured

### Real-time Not Updating

**Issue**: Changes don't sync across pages
- **Solution**: Check Supabase replication is enabled
- Verify RLS policies allow SELECT on tables
- Check browser console for subscription errors

### User Type Not Saving

**Issue**: User type resets after login
- **Solution**: Verify `user_profiles` table has `user_type` column
- Check `pendingUserType` is set before OAuth redirect
- Ensure `AuthCallback` properly handles user type

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use different credentials for development/production
   - Rotate secrets regularly

2. **Row Level Security**
   - All tables have RLS enabled
   - Users can only access their own data
   - Policies prevent unauthorized access

3. **OAuth Scopes**
   - Only request necessary Google scopes
   - Current scopes: email, profile
   - No access to sensitive Google data

## Production Checklist

- [ ] Google OAuth credentials configured in Google Cloud Console
- [ ] Authorized origins and redirect URIs added
- [ ] Supabase Google provider enabled with credentials
- [ ] Environment variables updated in production
- [ ] Database tables created with RLS policies
- [ ] Realtime replication enabled for user_profiles and user_roles
- [ ] Test Google login for both renter and landlord
- [ ] Verify real-time updates work across tabs
- [ ] Test role switching functionality
- [ ] Verify profile sync from Google

## Support

For issues or questions:
- Check Supabase logs: Dashboard → Logs
- Check browser console for errors
- Verify network requests in DevTools
- Review Supabase auth logs for OAuth flow

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
