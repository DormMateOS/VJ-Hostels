# Security/Guard Authentication Fix

## Problem Summary
Security users were unable to register and login via Google OAuth. The following errors were occurring:
- "No auth token found, skipping auth check"
- "Auth check rate limited, skipping..."
- Token storage inconsistencies between OAuth and username/password login
- Missing `comparePassword` method in GuardModel
- Role mapping issues between 'security' and 'guard'

## Root Causes Identified

1. **Missing `comparePassword` Method**: The `GuardModel` was missing the `comparePassword` method that the authentication controller was trying to call.

2. **Field Name Mismatch**: In `passport.js`, the Guard creation used `phone` instead of `phoneNumber`, causing validation errors.

3. **Token Storage Inconsistency**: 
   - OAuth login stored tokens as `token` or `auth-token`
   - Username/password login stored as `guard_token`
   - Security services only checked for `guard_token`

4. **Role Mapping Issues**: Inconsistent handling of 'security' vs 'guard' roles throughout the application.

5. **Incomplete OAuth Registration**: Google OAuth for security didn't properly handle existing guards or update records.

## Changes Made

### 1. Server-Side Changes

#### `/server/models/GuardModel.js`
- **Added**: `comparePassword` method to support password authentication
- **Fixed**: Proper handling of OAuth users (who don't have passwords)

```javascript
// Method to compare password for authentication
guardSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Skip password comparison for Google OAuth users
    if (this.googleId && !this.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};
```

#### `/server/config/passport.js`
- **Fixed**: Changed `phone` to `phoneNumber` for consistency
- **Fixed**: Changed default shift from 'morning' to 'day' (valid enum value)
- **Improved**: Better handling of existing guards with OAuth linking
- **Added**: Error logging for debugging

```javascript
// Now checks for existing guard by googleId OR email
let guard = await Guard.findOne({ $or: [{ googleId: profile.id }, { email: email }] });

// Updates existing guard with Google OAuth if they register with OAuth later
if (!guard.googleId && guard.email === email) {
  guard.googleId = profile.id;
  await guard.save();
}
```

#### `/server/routes/authRoutes.js`
- **Fixed**: JWT generation now maps 'security' role to 'guard' internally
- **Enhanced**: `/check-auth` endpoint now fetches full user data and normalizes role to 'security' for frontend

### 2. Frontend Changes

#### `/frontend/src/context/SecurityContext.jsx`
- **Enhanced**: `checkAuthStatus` now checks multiple token locations:
  - `guard_token` (username/password login)
  - `auth-token` (Google OAuth)
  - `token` (Google OAuth fallback)
- **Added**: Role validation to ensure token is for security/guard role
- **Improved**: Automatic token synchronization - stores OAuth tokens as `guard_token` for consistency
- **Better**: Error handling and token cleanup

#### `/frontend/src/securityServices/api.js`
- **Enhanced**: Request interceptor now checks all possible token locations
- **Added**: Automatic token synchronization for OAuth tokens
- **Improved**: Better debugging with token payload logging

## How It Works Now

### Google OAuth Login Flow (Security)
1. User clicks "Sign in with Google" and selects "Security" role
2. Backend creates/updates Guard record via `passport.js` google-security strategy
3. JWT token generated with role mapped to 'guard' internally
4. Frontend stores token as `auth-token` and `token`
5. On redirect, token is stored as `guard_token` for consistency
6. `SecurityContext` validates the token and role
7. User is authenticated and redirected to `/security` dashboard

### Username/Password Login Flow (Security)
1. User enters username/password
2. Backend validates via `authController.guardLogin`
3. JWT token generated with role 'guard'
4. Token stored as `guard_token`
5. User authenticated and redirected to security dashboard

### Token Resolution Priority
1. `guard_token` (primary)
2. `auth-token` (OAuth fallback)
3. `token` (OAuth fallback)

## Testing Instructions

### Test Case 1: New Security User with Google OAuth
1. Clear all localStorage tokens
2. Go to login page
3. Select "Security" role
4. Click "Sign in with Google"
5. Use a @vnrvjiet.in email
6. Should create new Guard record and redirect to `/security`

### Test Case 2: Existing Security User with Google OAuth
1. Ensure a Guard exists with specific email (no googleId)
2. Login with Google OAuth using same email
3. Should link Google account to existing Guard
4. Should redirect to `/security` dashboard

### Test Case 3: Username/Password Login
1. Use existing Guard credentials
2. Login via username/password
3. Should authenticate and redirect to `/security`

### Test Case 4: Token Persistence
1. Login via any method
2. Refresh the page
3. Should remain authenticated
4. Navigate between security pages
5. Should maintain authentication

## Database Considerations

### Guard Schema Required Fields
- `email` (required, unique)
- `name` (required)
- `phoneNumber` (required) - can be 'N/A' for OAuth users
- `shift` (required) - must be one of: 'morning', 'evening', 'night', 'day'
- `isActive` (default: true)

### OAuth vs Manual Guards
- **OAuth Guards**: Have `googleId`, may not have username/password
- **Manual Guards**: Have username and hashed password, no googleId
- **Hybrid**: Can have both OAuth and username/password (via linking)

## Troubleshooting

### Issue: "No auth token found"
**Solution**: This message is normal when not logged in. It will disappear after successful login.

### Issue: "Invalid credentials" for OAuth user trying password login
**Solution**: OAuth users cannot use password login unless they've also set up a password separately.

### Issue: Token exists but user not authenticated
**Solution**: Check that token role matches 'guard' or 'security'. Other roles won't authenticate in security context.

### Issue: 401 Unauthorized after login
**Solution**: Ensure JWT_SECRET is consistent between token generation and verification. Check server logs for token validation errors.

## Future Enhancements

1. Add email verification for new security registrations
2. Implement 2FA for security users
3. Add security admin panel to approve/activate new guards
4. Implement password reset flow for manual guards
5. Add session management and force logout
6. Implement refresh tokens for better security

## Files Modified

### Backend
1. `/server/models/GuardModel.js` - Added comparePassword method
2. `/server/config/passport.js` - Fixed OAuth registration flow
3. `/server/routes/authRoutes.js` - Enhanced JWT generation and auth check

### Frontend
1. `/frontend/src/context/SecurityContext.jsx` - Multi-token support
2. `/frontend/src/securityServices/api.js` - Enhanced token resolution

## Notes

- All changes are backward compatible
- Existing username/password guards continue to work
- OAuth flow now properly creates and authenticates guards
- Token resolution is transparent to users
- Security role properly mapped throughout the application
