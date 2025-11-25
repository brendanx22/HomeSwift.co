# App.jsx - Routes to Add

## Step 1: Add Imports (after line 50)

Add these imports after `const Settings = React.lazy(() => import('./pages/Settings'));`:

```javascript
const EditPropertyForm = React.lazy(() => import('./pages/EditPropertyForm'));

// Legal and Support Pages
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Help = React.lazy(() => import('./pages/Help'));
```

## Step 2: Add Routes (before the closing `</Routes>` tag around line 558)

Add these routes before `</Routes>`:

```javascript
            {/* Legal Pages */}
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Support */}
            <Route path="/help" element={<Help />} />

            {/* User Pages */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Property Edit */}
            <Route 
              path="/properties/:id/edit" 
              element={
                <ProtectedRoute requiredRoles={['landlord']}>
                  <EditPropertyForm />
                </ProtectedRoute>
              } 
            />

            {/* Redirects for consistency */}
            <Route path="/landlord-dashboard" element={<Navigate to="/landlord/dashboard" replace />} />
            <Route path="/properties/new" element={<Navigate to="/list-property" replace />} />
```

## Complete Code Block

Here's the complete section to add (copy this entire block):

```javascript
// Add after line 50 (after const Settings...)
const EditPropertyForm = React.lazy(() => import('./pages/EditPropertyForm'));

// Legal and Support Pages
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Help = React.lazy(() => import('./pages/Help'));
```

```javascript
// Add before </Routes> (around line 558)
            {/* Legal Pages */}
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Support */}
            <Route path="/help" element={<Help />} />

            {/* User Pages */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requiredRoles={['renter', 'landlord']}>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Property Edit */}
            <Route 
              path="/properties/:id/edit" 
              element={
                <ProtectedRoute requiredRoles={['landlord']}>
                  <EditPropertyForm />
                </ProtectedRoute>
              } 
            />

            {/* Redirects for consistency */}
            <Route path="/landlord-dashboard" element={<Navigate to="/landlord/dashboard" replace />} />
            <Route path="/properties/new" element={<Navigate to="/list-property" replace />} />
```

## Verification

After adding these routes, you should have:
- `/terms` - Terms of Service page ✅
- `/privacy` - Privacy Policy page ✅
- `/help` - Help/Support page ✅
- `/settings` - User Settings page ✅
- `/profile` - User Profile page ✅
- `/properties/:id/edit` - Edit Property page ✅
- `/landlord-dashboard` → redirects to `/landlord/dashboard` ✅
- `/properties/new` → redirects to `/list-property` ✅

## Testing

After adding the routes, test by navigating to:
1. http://localhost:3000/terms
2. http://localhost:3000/privacy
3. http://localhost:3000/help
4. http://localhost:3000/settings (when logged in)
5. http://localhost:3000/profile (when logged in)
