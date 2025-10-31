# HomeSwift Deployment Guide

## 📋 Overview

This guide covers deploying HomeSwift with:
- ✅ Development and Production environments
- ✅ Multi-role Google OAuth (one account, multiple roles)
- ✅ Admin dashboard on subdomain (admin.homeswift.co)
- ✅ Airbnb-style property browsing interface
- ✅ Custom Google OAuth branding

## 🌍 Environment Setup

### Development Environment

**File**: `.env.development`

```env
# Frontend
VITE_BACKEND_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://tproaiqvkohrlxjmkgxt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_URL=http://localhost:3000
VITE_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
VITE_POSTHOG_KEY=phc_IruYvpg1uKmSRrYkm30gT70LnmTmgHcfUAay12c2All
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_ADMIN_URL=http://localhost:3001
```

**To run development**:
```bash
# Copy development env
cp .env.development .env

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Production Environment

**File**: `.env.production`

```env
# Frontend
VITE_BACKEND_URL=https://api.homeswift.co
VITE_API_URL=https://api.homeswift.co
VITE_SUPABASE_URL=https://tproaiqvkohrlxjmkgxt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_URL=https://homeswift.co
VITE_SUPABASE_REDIRECT_URL=https://homeswift.co/auth/callback
VITE_POSTHOG_KEY=phc_IruYvpg1uKmSRrYkm30gT70LnmTmgHcfUAay12c2All
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_ADMIN_URL=https://admin.homeswift.co
```

**To build for production**:
```bash
# Copy production env
cp .env.production .env

# Build
npm run build

# Preview build
npm run preview
```

## 🔐 Google OAuth Configuration

### 1. Configure Google Cloud Console

1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/)
2. **Select your project** or create a new one
3. **Enable APIs**: 
   - Go to "APIs & Services" → "Library"
   - Enable "Google+ API"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. **User Type**: External
3. **App Information**:
   - **App name**: `HomeSwift`
   - **User support email**: `info@homeswift.co`
   - **App logo**: Upload your HomeSwift logo (120x120px minimum)
   - **App domain**: `homeswift.co`
   - **Authorized domains**: 
     - `homeswift.co`
     - `supabase.co`
4. **Developer contact**: `info@homeswift.co`
5. **Scopes**: Add these scopes:
   - `email`
   - `profile`
   - `openid`

### 3. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. **Application type**: Web application
4. **Name**: `HomeSwift Web Client`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://homeswift.co
   https://www.homeswift.co
   https://tproaiqvkohrlxjmkgxt.supabase.co
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://homeswift.co/auth/callback
   https://www.homeswift.co/auth/callback
   https://tproaiqvkohrlxjmkgxt.supabase.co/auth/v1/callback
   ```
7. **Save** and copy your:
   - Client ID
   - Client Secret

### 4. Configure Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Authentication" → "Providers"
4. Find "Google" and click "Enable"
5. **Paste your Google OAuth credentials**:
   - Client ID: `your_google_client_id`
   - Client Secret: `your_google_client_secret`
6. **Redirect URL**: Copy the Supabase callback URL
7. **Save**

### 5. Customize Google OAuth Branding

The OAuth consent screen will now show:
- ✅ **App Name**: HomeSwift
- ✅ **App Logo**: Your HomeSwift logo
- ✅ **App Domain**: homeswift.co
- ❌ **No Supabase branding** (hidden)

## 🎨 Multi-Role Support

### How It Works

One Google account can be used for **both** landlord and renter roles:

1. **First Login** (as Renter):
   - User goes to `/login`
   - Clicks "Continue with Google"
   - Selects Google account
   - Role: `renter` is created
   - Redirected to `/chat` (property browsing)

2. **Second Login** (as Landlord - Same Account):
   - User goes to `/landlord/login`
   - Clicks "Continue with Google"
   - Selects **same** Google account
   - Role: `landlord` is added (keeps `renter`)
   - Redirected to `/landlord/dashboard`

3. **Role Switching**:
   - User now has both roles
   - Can switch between them anytime
   - No need to log out/in

### Implementation Details

**Files involved**:
- `src/contexts/AuthContext.jsx` - User identification
- `src/pages/AuthCallback.jsx` - Role management
- `src/pages/LoginPage.jsx` - Renter login
- `src/pages/LandlordLoginPage.jsx` - Landlord login

**Key Logic**:
```javascript
// AuthCallback.jsx checks for pendingUserType
const pendingUserType = localStorage.getItem('pendingUserType');

// If user doesn't have this role, add it
if (!hasCurrentRole) {
  await supabase.from('user_roles').insert({
    user_id: user.id,
    role: userType,
    is_primary: isFirstRole
  });
}
```

## 🏢 Admin Dashboard Subdomain

### Setup admin.homeswift.co

#### Option 1: Separate Deployment (Recommended)

1. **Create new Vite project** for admin:
```bash
cd ..
npm create vite@latest homeswift-admin -- --template react
cd homeswift-admin
```

2. **Copy admin files**:
```bash
cp ../HomeSwift.co/src/pages/AdminDashboard.jsx src/pages/
cp ../HomeSwift.co/src/lib/posthog.js src/lib/
```

3. **Configure DNS**:
   - Add CNAME record: `admin.homeswift.co` → your hosting provider
   - Or A record pointing to your server IP

4. **Deploy separately** to admin subdomain

#### Option 2: Same Deployment with Routing

1. **Configure your web server** (Nginx/Apache):

**Nginx**:
```nginx
server {
    server_name admin.homeswift.co;
    root /var/www/homeswift/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /admin {
        try_files $uri $uri/ /index.html;
    }
}
```

2. **Update App.jsx** route:
```javascript
// Check if on admin subdomain
if (window.location.hostname === 'admin.homeswift.co') {
  // Show only admin dashboard
  return <AdminDashboard />;
}
```

#### Option 3: Redirect to Admin Route

Simplest option - just redirect:
```
admin.homeswift.co → homeswift.co/admin/analytics
```

Configure in your DNS/hosting provider.

## 🏠 Airbnb-Style Interface

### New Property Browsing Page

**Route**: `/chat` (replaces old chat page)
**Component**: `RenterHomePage.jsx`

**Features**:
- ✅ Airbnb-style property grid
- ✅ Image carousels with dots
- ✅ Favorite/heart button
- ✅ Search bar with filters
- ✅ Category tabs
- ✅ Responsive grid layout
- ✅ Hover effects and animations

**Old Chat Page**: Moved to `/messages`

### Customization

Edit `src/pages/RenterHomePage.jsx`:

```javascript
// Change categories
const categories = [
  { icon: '🏠', label: 'All homes' },
  { icon: '🏖️', label: 'Beachfront' },
  // Add more...
];

// Customize grid columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
```

## 🚀 Deployment Steps

### 1. Pre-Deployment Checklist

- [ ] Configure Google OAuth (see above)
- [ ] Update Supabase with Google credentials
- [ ] Set up environment variables
- [ ] Test multi-role functionality locally
- [ ] Verify PostHog tracking
- [ ] Test admin dashboard

### 2. Deploy Main App (homeswift.co)

```bash
# Build for production
npm run build

# Deploy to your hosting provider
# (Vercel, Netlify, AWS, etc.)
```

**Vercel**:
```bash
vercel --prod
```

**Netlify**:
```bash
netlify deploy --prod
```

### 3. Deploy Admin Dashboard (admin.homeswift.co)

Follow Option 1, 2, or 3 from Admin Dashboard Subdomain section above.

### 4. Configure DNS

Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | @ | Your server IP |
| CNAME | www | homeswift.co |
| CNAME | admin | Your hosting provider |
| CNAME | api | Your API server |

### 5. SSL Certificates

Ensure SSL is enabled for:
- ✅ homeswift.co
- ✅ www.homeswift.co
- ✅ admin.homeswift.co
- ✅ api.homeswift.co

Most hosting providers (Vercel, Netlify) handle this automatically.

## 🧪 Testing

### Test Multi-Role OAuth

1. **Clear browser data**:
   ```javascript
   localStorage.clear();
   ```

2. **Test as Renter**:
   - Go to `/login`
   - Click "Continue with Google"
   - Verify redirected to `/chat`
   - Check console: `Setting primary role to: renter`

3. **Log out**

4. **Test as Landlord** (same account):
   - Go to `/landlord/login`
   - Click "Continue with Google"
   - Use **same** Google account
   - Verify redirected to `/landlord/dashboard`
   - Check console: `Adding new role 'landlord' for user`

5. **Verify both roles exist**:
   - Check Supabase `user_roles` table
   - Should see two rows for same user_id

### Test Admin Dashboard

1. Go to `https://admin.homeswift.co` (or `/admin/analytics`)
2. Verify analytics are loading
3. Check PostHog events
4. Test quick links to PostHog

### Test Property Browsing

1. Go to `/chat`
2. Verify Airbnb-style grid loads
3. Test image carousels
4. Test favorite button
5. Test search and filters
6. Click property → verify redirects to details

## 📊 Monitoring

### PostHog Events to Monitor

- `user_signup` - Track new signups
- `user_login` - Track logins
- `role_switched` - Track role changes
- `listing_viewed` - Track property views
- `message_sent` - Track messages
- `search_performed` - Track searches

### Key Metrics

- Daily active users
- Signup conversion rate
- Property view to inquiry rate
- Multi-role adoption rate
- Search effectiveness

## 🔧 Troubleshooting

### Google OAuth Not Working

1. **Check redirect URIs**: Must match exactly
2. **Verify domains**: All domains must be authorized
3. **Check Supabase config**: Credentials must be correct
4. **Clear browser cache**: Old OAuth tokens may be cached

### Multi-Role Not Working

1. **Check console logs**: Look for `pendingUserType`
2. **Verify AuthCallback**: Should see role creation logs
3. **Check database**: Verify `user_roles` table has both roles
4. **Clear localStorage**: `localStorage.clear()`

### Admin Dashboard Not Loading

1. **Check DNS**: Verify subdomain points correctly
2. **Check SSL**: Ensure HTTPS is enabled
3. **Check routing**: Verify route is configured
4. **Check PostHog**: Verify API key is correct

## 📝 Environment Variables Reference

| Variable | Development | Production |
|----------|-------------|------------|
| VITE_APP_URL | http://localhost:3000 | https://homeswift.co |
| VITE_BACKEND_URL | http://localhost:5000 | https://api.homeswift.co |
| VITE_ADMIN_URL | http://localhost:3001 | https://admin.homeswift.co |
| VITE_SUPABASE_REDIRECT_URL | http://localhost:3000/auth/callback | https://homeswift.co/auth/callback |

## 🎉 You're Ready!

Your HomeSwift application is now configured with:
- ✅ Development and production environments
- ✅ Multi-role Google OAuth
- ✅ Custom Google branding
- ✅ Admin dashboard on subdomain
- ✅ Airbnb-style property browsing
- ✅ PostHog analytics

For support, refer to:
- `POSTHOG_SETUP_GUIDE.md` - PostHog configuration
- `README.md` - General project info
- Supabase Docs - https://supabase.com/docs
- Google OAuth Docs - https://developers.google.com/identity/protocols/oauth2
