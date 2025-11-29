# Navbar Data Loading - Complete Debug Guide

## Issues Fixed in This Update

### 1. **Memoization Issues in MessagingContext** ✅
**Problem:** `getAuthToken()` and `loadConversations()` were not memoized, causing them to be recreated on every render and leading to infinite loops.

**Solution:** 
- Added `useCallback` to memoize `getAuthToken()`
- Added `useCallback` to memoize `loadConversations()` with dependencies: `[getAuthToken, onlineUsers]`
- Fixed import statement to include `useCallback`

### 2. **Double Loading of Conversations** ✅
**Problem:** Both MessagingContext AND RenterHomePage were calling `loadConversations()`, causing race conditions and duplicate API calls.

**Solution:** Removed `loadConversations()` call from RenterHomePage since MessagingContext already handles it when user is authenticated.

### 3. **Improved Error Logging** ✅
Added detailed logging throughout:
- Token retrieval with status checks
- API response status codes
- Conversation count after loading
- User authentication status checks

## Data Loading Flow (Corrected)

### When User Authenticates:
```
1. AuthContext updates user state
   ↓
2. RenterHomePage.useEffect detects user change
   ├─ Calls loadData() to load local saved properties Set
   └─ Conversations already loading via MessagingContext
   ↓
3. MessagingContext.useEffect detects isAuthenticated change
   ├─ Calls getAuthToken() (now memoized)
   ├─ Calls loadConversations() (now memoized)
   └─ Loads conversations from API
   ↓
4. useRealtimeUserData hook detects userId change
   ├─ Loads initial saved properties count
   ├─ Loads user profile
   └─ Sets up real-time subscriptions
   ↓
5. RenterHomePage.useEffect for conversations detects change
   ├─ Calculates unread count
   └─ Updates navbar badge
```

## Console Output to Expect

When page loads and user logs in:

```
✅ Supabase access token retrieved
🔐 Auth state changed: { isAuthenticated: true, hasUser: true }
🔄 Loading conversations...
📡 Fetching from: https://api.homeswift.co/api/messages/conversations
📊 Response status: 200
✅ Conversations loaded: X conversations
👤 User loaded, loading user data... [userId]
✅ Loaded saved properties: Y
🔄 loadInitialData effect triggered for userId: [userId]
🔍 Loading initial data for userId: [userId]
✅ Saved properties count loaded: Y
✅ User profile loaded: [Full Name]
📊 Unread count calculated: { unread: Z, conversations: X }
```

## Testing the Fix

### In Browser Console:

```javascript
// 1. Check if conversations are loaded
const messaging = window.__messagingContext; // If exposed for debugging
console.log('Conversations:', messaging?.conversations);

// 2. Check local storage for user
const user = JSON.parse(localStorage.getItem('user'));
console.log('Current user:', user.id);

// 3. Check saved properties from real-time hook
// Should be reflected in navbar heart icon badge

// 4. Filter network requests
// Look for: https://api.homeswift.co/api/messages/conversations
// Should have: Authorization: Bearer [token]
// Status: 200 OK
```

### Manual Testing Checklist:

- [ ] **Saved Properties Badge**
  - [ ] Badge shows count when user has saved properties
  - [ ] Badge updates in real-time when saving/unsaving
  - [ ] Badge disappears when count reaches 0
  - [ ] Clicking badge navigates to /saved page

- [ ] **Messages Badge**
  - [ ] Badge shows unread count when user has conversations
  - [ ] Badge updates when new messages arrive
  - [ ] Badge disappears when all messages are read
  - [ ] Clicking badge navigates to /message-center

- [ ] **Notifications**
  - [ ] NotificationCenter component renders without errors
  - [ ] Notifications display properly
  - [ ] Clicking notification works as expected

- [ ] **Profile Avatar**
  - [ ] User avatar loads in navbar
  - [ ] Falls back to initials if image fails
  - [ ] Clicking avatar opens profile popup
  - [ ] Profile popup closes properly

## Potential Issues and Solutions

### Issue: Badges not showing but conversations exist
**Debug:**
```javascript
// Check if conversations are loaded
console.log('Conversations:', conversations);
console.log('Unread count:', unreadCount);

// Check if conversation objects have unreadCount property
console.log('First conversation:', conversations[0]);
// Should have: { id, unreadCount, otherParticipant, ... }
```

**Solution:** Ensure backend returns `unreadCount` field in conversation objects.

### Issue: Token not available
**Debug:**
```javascript
// Check Supabase session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Has token:', !!session?.access_token);
```

**Solution:** Ensure user is properly authenticated and AuthContext.isAuthenticated is true.

### Issue: API returns 401 or 403
**Debug:**
```javascript
// Check authorization header
// In Network tab, look for messages/conversations request
// Headers should include: Authorization: Bearer [valid_token]
```

**Solution:** Verify Supabase credentials and API middleware authentication.

### Issue: Real-time subscriptions not working
**Debug:**
```javascript
// Check if subscriptions are set up
// Look in console for "✅ Subscribed to saved properties changes"
// Look for "✅ Subscribed to user profile changes"
```

**Solution:** Ensure Supabase real-time is enabled on tables:
- saved_properties
- user_profiles

## Files Modified

1. **src/contexts/MessagingContext.jsx**
   - Added `useCallback` import
   - Memoized `getAuthToken()` function
   - Memoized `loadConversations()` function
   - Updated useEffect dependencies
   - Enhanced error logging

2. **src/pages/RenterHomePage.jsx**
   - Removed duplicate `loadConversations()` call
   - Simplified useEffect dependencies
   - Kept debugging logs for troubleshooting

3. **src/hooks/useRealtimeUserData.js**
   - Already had proper error handling
   - Working correctly with no changes needed

## Performance Considerations

- `getAuthToken` is memoized so it only runs when dependencies change
- `loadConversations` is memoized and debounced by useEffect
- Real-time subscriptions are set up per user ID
- Subscriptions clean up properly on unmount

## Next Steps if Issues Persist

1. Check browser console for any error messages
2. Check Network tab for API response status and content
3. Verify Supabase credentials and permissions
4. Verify backend API is responding correctly
5. Check real-time subscriptions are enabled in Supabase
6. Verify table RLS policies allow reading

