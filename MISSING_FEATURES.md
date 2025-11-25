# HomeSwift App - Missing Features & Fixes Checklist

## ✅ Recently Fixed
- [x] **Saved Properties Page** - Rebuilt with premium UI, glassmorphism, real-time updates
- [x] **Motion Import** - Added missing framer-motion import
- [x] **PropertyAPI Logging** - Enhanced error logging and defensive checks

---

## 🔧 Currently Being Fixed

### 1. Google Authentication (IN PROGRESS)
**Status**: Code complete, needs configuration

**What's Done**:
- ✅ `loginWithGoogle()` function in AuthContext
- ✅ Google OAuth button on all login/signup pages
- ✅ AuthCallback handler with role management
- ✅ Proper redirect flow

**What's Needed**:
- ⚠️ Google Cloud Console setup (see `GOOGLE_AUTH_SETUP.md`)
- ⚠️ Supabase Google provider configuration
- ⚠️ Testing with real Google accounts

**Files to Review**:
- `src/contexts/AuthContext.jsx` (lines 1250-1300)
- `src/pages/LoginPage.jsx` (lines 163-181)
- `src/pages/AuthCallback.jsx` (entire file)
- `GOOGLE_AUTH_SETUP.md` (setup guide)

---

### 2. Saved Properties Performance (IN PROGRESS)
**Status**: SQL script created, needs execution

**What's Done**:
- ✅ SQL script with indexes and RLS policies
- ✅ Enhanced API logging
- ✅ Defensive code for empty arrays

**What's Needed**:
- ⚠️ Run `sql/fix_saved_properties_performance.sql` in Supabase
- ⚠️ Verify indexes are created
- ⚠️ Test query performance

**Files**:
- `sql/fix_saved_properties_performance.sql`
- `src/lib/propertyAPI.js` (getSavedProperties function)

---

## 🚨 Critical Missing Features

### 3. Service Worker (PWA)
**Issue**: `sw.js` file exists but may not be properly configured

**Current State**:
- ✅ `public/sw.js` exists (13KB file)
- ⚠️ Console shows "sw.js: Not found" error in production
- ⚠️ May need Vite build configuration update

**Fix Needed**:
```javascript
// vite.config.js - verify this configuration
export default defineConfig({
  // ...
  publicDir: 'public', // Ensure this is set
  build: {
    // Ensure sw.js is copied to dist/
  }
})
```

**Test**:
1. Run `npm run build`
2. Check if `dist/sw.js` exists
3. Deploy and verify no console errors

---

### 4. Email Verification Flow
**Issue**: Incomplete email verification for email/password signups

**Current State**:
- ✅ Resend verification button exists
- ⚠️ Backend endpoint may not be implemented
- ⚠️ Verification callback handling unclear

**Files to Check**:
- `src/pages/LoginPage.jsx` (lines 121-161 - resend verification)
- `src/pages/VerifyEmail.jsx`
- Backend: `/api/auth/resend-verification`

**Fix Needed**:
1. Verify backend endpoint exists and works
2. Test email verification flow end-to-end
3. Add better error messages

---

### 5. Backend Token Management
**Issue**: Inconsistent backend token handling

**Current State**:
- ⚠️ Some pages fetch backend token, others don't
- ⚠️ Token stored in localStorage but not always used
- ⚠️ No token refresh mechanism

**Files Affected**:
- `src/pages/LoginPage.jsx` (lines 79-96)
- `src/pages/AuthCallback.jsx` (lines 246-266, 348-365)
- `src/contexts/AuthContext.jsx` (lines 1181-1204)

**Fix Needed**:
1. Centralize backend token management in AuthContext
2. Add token refresh logic
3. Add token expiration handling
4. Use interceptors for API calls

---

## ⚠️ Important Missing Features

### 6. Error Boundary for Saved Properties
**Issue**: No specific error handling for Supabase RLS errors

**Fix Needed**:
```javascript
// Add to SavedProperties.jsx
if (error?.message?.includes('permission denied')) {
  return <RLSErrorMessage />;
}
```

---

### 7. Loading States
**Issue**: Some pages lack proper loading states

**Pages to Check**:
- `src/pages/RenterHomePage.jsx` - ✅ Has loading state
- `src/pages/SavedProperties.jsx` - ✅ Has loading state
- `src/pages/PropertyDetails.jsx` - ⚠️ Needs verification
- `src/pages/MessageCenter.jsx` - ⚠️ Needs verification

---

### 8. Real-time Subscriptions Cleanup
**Issue**: Potential memory leaks from Supabase subscriptions

**Current State**:
- ✅ SavedProperties properly cleans up subscriptions
- ⚠️ Other pages may not

**Fix Pattern**:
```javascript
useEffect(() => {
  const channel = supabase.channel('...');
  // ... setup subscription
  return () => {
    supabase.removeChannel(channel);
  };
}, [deps]);
```

---

### 9. Image Upload & Management
**Issue**: No clear image upload flow for properties

**Needed**:
- Image upload component
- Supabase Storage integration
- Image optimization
- CDN configuration

**Suggested Implementation**:
- Use Supabase Storage buckets
- Add image compression before upload
- Generate thumbnails
- Implement lazy loading

---

### 10. Search & Filtering
**Issue**: Search functionality may not be fully implemented

**Files to Check**:
- `src/pages/PropertyBrowse.jsx`
- `src/pages/RenterHomePage.jsx`
- `src/lib/propertyAPI.js` (searchProperties function)

**Enhancements Needed**:
- Debounced search input
- Advanced filters (price range, bedrooms, etc.)
- Search history
- Saved searches

---

## 🎨 UI/UX Improvements Needed

### 11. Mobile Responsiveness
**Check These Pages**:
- [ ] Login/Signup pages
- [ ] Saved Properties
- [ ] Property Details
- [ ] Dashboard
- [ ] Messages

**Test Breakpoints**:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

---

### 12. Accessibility (a11y)
**Missing**:
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] ARIA labels on interactive elements
- [ ] Focus management
- [ ] Color contrast verification

---

### 13. Dark Mode
**Current State**: Not implemented

**Suggested Approach**:
```javascript
// Add to AuthContext or create ThemeContext
const [theme, setTheme] = useState('light');

// Use Tailwind dark: classes
<div className="bg-white dark:bg-gray-900">
```

---

## 🔒 Security Enhancements

### 14. Rate Limiting
**Missing**:
- Login attempt limits
- API request throttling
- Resend verification cooldown (partially implemented)

---

### 15. Input Validation
**Check**:
- [ ] Email format validation
- [ ] Password strength requirements
- [ ] XSS prevention
- [ ] SQL injection prevention (Supabase handles this)

---

### 16. CSRF Protection
**Needed**:
- CSRF tokens for state-changing operations
- Verify backend implements CSRF protection

---

## 📊 Analytics & Monitoring

### 17. Error Tracking
**Current State**: PostHog initialized but may need Sentry

**Add**:
- Sentry for error tracking
- User session replay
- Performance monitoring

---

### 18. Analytics Events
**Missing Events**:
- Property view
- Property save/unsave
- Search performed
- Filter applied
- Message sent
- Inquiry submitted

**Implementation**:
```javascript
import { trackEvent } from '../lib/posthog';

trackEvent('property_viewed', {
  property_id: id,
  property_type: type,
  price: price
});
```

---

## 🧪 Testing

### 19. Unit Tests
**Status**: Not found

**Needed**:
- Component tests (React Testing Library)
- API function tests
- Utility function tests

---

### 20. E2E Tests
**Status**: Not found

**Suggested**: Playwright or Cypress
- Login flow
- Property search
- Save property
- Message landlord

---

## 📱 Progressive Web App (PWA)

### 21. PWA Features
**Partially Implemented**:
- ✅ Service worker exists
- ✅ Manifest.json exists
- ⚠️ Offline support unclear
- ⚠️ Install prompt may not work

**Enhancements**:
- Add offline page
- Cache API responses
- Background sync for messages
- Push notifications

---

## 🚀 Performance Optimizations

### 22. Code Splitting
**Check**:
- ✅ React.lazy() used in App.jsx
- [ ] Verify all routes are lazy-loaded
- [ ] Check bundle size

**Command**:
```bash
npm run build
# Check dist/ folder sizes
```

---

### 23. Image Optimization
**Needed**:
- WebP format support
- Responsive images (srcset)
- Lazy loading (intersection observer)
- Blur-up placeholders

---

### 24. Database Query Optimization
**In Progress**:
- ✅ Indexes for saved_properties
- [ ] Indexes for properties table
- [ ] Pagination for large lists
- [ ] Cursor-based pagination

---

## 🔄 State Management

### 25. Global State
**Current**: Context API only

**Consider**:
- Zustand for client state
- React Query for server state
- Reduce prop drilling

---

## 📧 Notifications

### 26. Email Notifications
**Missing**:
- New message notification
- Property inquiry notification
- Price drop alerts
- New property matching criteria

---

### 27. In-App Notifications
**Partially Implemented**:
- ✅ NotificationCenter component exists
- ⚠️ Real-time notification delivery unclear
- ⚠️ Notification persistence unclear

---

## 💬 Messaging System

### 28. Real-time Chat
**Check**:
- `src/pages/ChatPage.jsx`
- `src/pages/MessageCenter.jsx`

**Verify**:
- [ ] Supabase Realtime subscriptions
- [ ] Message persistence
- [ ] Read receipts
- [ ] Typing indicators
- [ ] File attachments

---

## 🏠 Property Management

### 29. Landlord Features
**Check**:
- [ ] List new property
- [ ] Edit property
- [ ] Delete property
- [ ] View analytics
- [ ] Manage inquiries

---

### 30. Property Comparison
**File**: `src/pages/PropertyComparison.jsx`

**Verify**:
- [ ] Add properties to compare
- [ ] Side-by-side comparison view
- [ ] Export comparison

---

## 📍 Location Features

### 31. Map Integration
**Missing**:
- Google Maps or Mapbox integration
- Property markers on map
- Neighborhood boundaries
- Nearby amenities

---

### 32. Geolocation
**Needed**:
- "Properties near me" feature
- Distance calculation
- Location-based search

---

## 💳 Payment Integration (Future)

### 33. Stripe/Payment Gateway
**Not Implemented**:
- Landlord subscription plans
- Featured property listings
- Application fees
- Security deposits

---

## 🔐 Advanced Auth Features

### 34. Two-Factor Authentication (2FA)
**Not Implemented**:
- SMS verification
- Authenticator app support
- Backup codes

---

### 35. Social Login
**Partially Done**:
- ✅ Google OAuth (needs config)
- [ ] Facebook Login
- [ ] Apple Sign In
- [ ] GitHub (for developers)

---

## 📋 Priority Order

### Immediate (This Week)
1. ✅ Fix Saved Properties performance (run SQL script)
2. ✅ Configure Google OAuth (follow GOOGLE_AUTH_SETUP.md)
3. ⚠️ Fix Service Worker error
4. ⚠️ Test email verification flow

### Short Term (This Month)
5. Add proper error tracking (Sentry)
6. Implement image upload for properties
7. Add comprehensive search/filtering
8. Mobile responsiveness audit
9. Add unit tests for critical paths

### Medium Term (Next Quarter)
10. Real-time messaging improvements
11. Property comparison feature
12. Map integration
13. Analytics dashboard for landlords
14. Payment integration

### Long Term (Future)
15. Mobile app (React Native)
16. AI-powered property recommendations
17. Virtual tours
18. Tenant screening
19. Lease management

---

## 📝 Documentation Needed

- [ ] API documentation
- [ ] Component library/Storybook
- [ ] Deployment guide
- [ ] Contributing guidelines
- [ ] User manual

---

**Last Updated**: 2025-11-24  
**Next Review**: After Google Auth is configured and tested
