# PostHog Integration Setup Guide

## 📊 Overview

PostHog has been successfully integrated into your HomeSwift application! This guide will help you set up your PostHog account and understand how to use the analytics dashboard.

## 🚀 Quick Start

### Step 1: Create PostHog Account

1. **Visit PostHog**: Go to [https://app.posthog.com/signup](https://app.posthog.com/signup)
2. **Sign Up**: Create an account using your email or Google account
3. **Create Organization**: Name your organization (e.g., "HomeSwift")
4. **Create Project**: Name your project (e.g., "HomeSwift Production")

### Step 2: Get Your API Key

1. After creating your project, you'll see your **Project API Key**
2. It should look like: `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **You already have this key in your `.env` file**: `phc_IruYvpg1uKmSRrYkm30gT70LnmTmgHcfUAay12c2All`

### Step 3: Configure PostHog (Already Done!)

Your `.env` file already contains:
```env
VITE_POSTHOG_KEY=phc_IruYvpg1uKmSRrYkm30gT70LnmTmgHcfUAay12c2All
VITE_POSTHOG_HOST=https://app.posthog.com
```

✅ **No additional configuration needed!**

## 📈 What's Being Tracked

### Automatic Tracking
- **Page Views**: Every page visit is automatically tracked
- **Page Leaves**: When users leave pages
- **Clicks**: Button and link clicks (autocapture)
- **Form Submissions**: Form interactions

### Custom Events Tracked

#### 1. **User Events**
- `user_signup` - When a new user signs up
  - Properties: `user_type`, `signup_method` (google/email)
- `user_login` - When a user logs in
  - Properties: `user_type`, `login_method`
- `role_switched` - When a user switches between landlord/renter roles
  - Properties: `from_role`, `to_role`

#### 2. **Message Events**
- `message_sent` - When a user sends a message
  - Properties: `message_length`, `has_attachments`, `conversation_id`, `user_role`

#### 3. **Listing Events**
- `listing_viewed` - When a user views a property listing
  - Properties: `listing_id`, `listing_title`, `price`, `location`, `property_type`
- `listing_created` - When a landlord creates a new listing
  - Properties: `listing_id`, `price`, `property_type`, `location`

#### 4. **Search Events**
- `search_performed` - When a user performs a search
  - Properties: `query`, `filters`, `results_count`

#### 5. **Application Events**
- `application_submitted` - When a renter submits an application
  - Properties: `listing_id`, `listing_title`

#### 6. **Profile Events**
- `profile_updated` - When a user updates their profile
  - Properties: `update_type`

## 🎯 Accessing Your Analytics

### Admin Dashboard (Built-in)
Visit: `https://www.homeswift.co/admin/analytics`

This dashboard shows:
- Total users
- Messages sent
- Listings viewed
- Page views
- Active users
- Conversion rate
- Recent events

### PostHog Dashboard (Full Analytics)
Visit: [https://app.posthog.com](https://app.posthog.com)

Features available:
1. **Insights**: Create custom charts and analyze trends
2. **Session Recordings**: Watch user sessions (video replays)
3. **Funnels**: Track conversion funnels
4. **Cohorts**: Group users by behavior
5. **Feature Flags**: A/B testing capabilities
6. **Experiments**: Run experiments on features

## 📊 Recommended Dashboards to Create

### 1. User Engagement Dashboard
- Daily active users
- Messages sent per day
- Listings viewed per day
- Average session duration

### 2. Conversion Funnel
1. User signs up
2. Views listings
3. Sends message to landlord
4. Submits application

### 3. Property Performance
- Most viewed listings
- Listings by location
- Average time on listing page
- Listing view to inquiry conversion

### 4. User Behavior
- Renter vs Landlord activity
- Peak usage times
- Most used features
- User retention over time

## 🔧 Advanced Features

### Session Recordings
PostHog automatically records user sessions. To view:
1. Go to PostHog Dashboard
2. Click "Session Recordings" in sidebar
3. Watch real user interactions

### Funnels
Create conversion funnels:
1. Go to "Insights" → "New Insight"
2. Select "Funnel"
3. Add steps (e.g., signup → view listing → send message)
4. Analyze drop-off rates

### Cohorts
Group users by behavior:
1. Go to "Cohorts" → "New Cohort"
2. Define criteria (e.g., "Users who viewed >5 listings")
3. Use in insights and experiments

## 🎨 Custom Event Tracking

To track additional events, use the helper functions in `src/lib/posthog.js`:

```javascript
import { trackEvent } from '../lib/posthog';

// Track a custom event
trackEvent('custom_event_name', {
  property1: 'value1',
  property2: 'value2'
});
```

### Available Helper Functions
- `trackEvent(eventName, properties)` - Track any custom event
- `identifyUser(userId, userProperties)` - Identify a user
- `resetUser()` - Reset user on logout
- `trackPageView(pageName, properties)` - Track page view
- `trackMessageSent(messageData)` - Track message sent
- `trackListingViewed(listingData)` - Track listing viewed
- `trackListingCreated(listingData)` - Track listing created
- `trackSearch(searchData)` - Track search
- `trackSignup(userData)` - Track signup
- `trackLogin(userData)` - Track login
- `trackRoleSwitch(fromRole, toRole)` - Track role switch
- `trackApplicationSubmitted(applicationData)` - Track application
- `trackProfileUpdated(updateType)` - Track profile update

## 🔒 Privacy & Compliance

### GDPR Compliance
PostHog is GDPR compliant. To ensure compliance:

1. **Add Privacy Policy**: Update your privacy policy to mention analytics
2. **Cookie Consent**: Consider adding a cookie consent banner
3. **Data Retention**: Configure data retention in PostHog settings

### Opt-Out
To allow users to opt-out of tracking:

```javascript
import posthog from '../lib/posthog';

// Opt user out
posthog.opt_out_capturing();

// Opt user in
posthog.opt_in_capturing();
```

## 📱 Testing Your Integration

### 1. Check Console
Open browser console and look for:
```
PostHog loaded successfully
```

### 2. Trigger Events
- Sign up/login → Check for `user_signup` or `user_login` event
- View a listing → Check for `listing_viewed` event
- Send a message → Check for `message_sent` event

### 3. Verify in PostHog
1. Go to PostHog Dashboard
2. Click "Events" in sidebar
3. You should see your events appearing in real-time

## 🆘 Troubleshooting

### Events Not Showing Up
1. **Check API Key**: Ensure `VITE_POSTHOG_KEY` is correct in `.env`
2. **Restart Dev Server**: After changing `.env`, restart with `npm run dev`
3. **Check Console**: Look for PostHog errors in browser console
4. **Ad Blockers**: Disable ad blockers that might block PostHog

### Session Recordings Not Working
1. **Enable in PostHog**: Go to Project Settings → Session Recording → Enable
2. **Check Privacy Settings**: Ensure session recording is allowed

### Slow Performance
1. **Reduce Autocapture**: Disable autocapture if not needed
2. **Sample Sessions**: Record only a percentage of sessions
3. **Lazy Load**: PostHog is already lazy-loaded in your app

## 📚 Additional Resources

- **PostHog Docs**: [https://posthog.com/docs](https://posthog.com/docs)
- **PostHog Tutorials**: [https://posthog.com/tutorials](https://posthog.com/tutorials)
- **PostHog Community**: [https://posthog.com/questions](https://posthog.com/questions)
- **PostHog GitHub**: [https://github.com/PostHog/posthog](https://github.com/PostHog/posthog)

## 🎉 You're All Set!

Your PostHog integration is complete and ready to use. Start exploring your analytics at:
- **Built-in Dashboard**: https://www.homeswift.co/admin/analytics
- **PostHog Dashboard**: https://app.posthog.com

Happy analyzing! 📊✨
