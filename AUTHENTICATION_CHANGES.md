# Authentication System Changes

## Overview
The authentication system has been updated to implement role-based access control using email verification instead of manual role selection.

## Changes Made

### 1. Environment Variables (`.env`)
Added new variables for authorized admin and security emails:
```env
ADMIN_EMAIL=gurramkarthik2006@gmail.com
SECURITY_EMAIL=gurramkarthik2005@gmail.com
```

### 2. Backend Changes

#### `config/passport.js`
- **Removed**: Three separate Google OAuth strategies (`google-student`, `google-admin`, `google-security`)
- **Added**: Single unified Google OAuth strategy (`google`)
- **Logic**:
  - Checks if email matches `ADMIN_EMAIL` → assigns `admin` role
  - Checks if email matches `SECURITY_EMAIL` → assigns `security` role
  - Checks if email ends with `@vnrvjiet.in` → extracts roll number and verifies in database → assigns `student` role
  - Any other email → rejects with error message

#### `routes/authRoutes.js`
- **Removed**: `/auth/google/:role` and `/auth/callback/:role` routes
- **Added**: 
  - `/auth/google` - Single OAuth initiation endpoint
  - `/auth/google/callback` - Unified callback handler
- **Callback URL**: Already configured as `http://localhost:6201/auth/google/callback`

### 3. Frontend Changes

#### `auth/LoginPage.jsx`
- **Removed**: Role selection buttons (Student, Admin, Security)
- **Removed**: State variables: `selectedRole`, `hoverRole`
- **Updated**: Single "Continue with Google" button
- **Updated**: Error handling to display specific messages for different authentication failures

#### `auth/GoogleOAuthButton.jsx`
- **Removed**: `selectedRole` prop requirement
- **Updated**: Redirects to `/auth/google` instead of `/auth/google/:role`

## Authentication Flow

### For Students
1. User clicks "Continue with Google"
2. User selects their `*@vnrvjiet.in` email
3. System extracts roll number from email (part before `@`)
4. System checks if roll number exists in `Student` collection
5. ✅ If exists → Login successful with `student` role
6. ❌ If not exists → Error: "Please use your official hostel email to log in"

### For Admin
1. User clicks "Continue with Google"
2. User selects `gurramkarthik2006@gmail.com`
3. System matches email with `ADMIN_EMAIL` environment variable
4. ✅ Login successful with `admin` role

### For Security
1. User clicks "Continue with Google"
2. User selects `gurramkarthik2005@gmail.com`
3. System matches email with `SECURITY_EMAIL` environment variable
4. ✅ Login successful with `security` role

### For Unauthorized Users
1. User clicks "Continue with Google"
2. User selects any other email
3. ❌ Error: "Unauthorized email. Please use your institutional email or contact administrator."

## Testing Checklist

### Prerequisites
- [ ] Server is running on port 6201
- [ ] Frontend is running on port 3201
- [ ] MongoDB is connected and accessible
- [ ] `.env` file has `ADMIN_EMAIL` and `SECURITY_EMAIL` set

### Test Cases

#### Test 1: Student Login (Valid Roll Number)
- [ ] Navigate to login page
- [ ] Click "Continue with Google"
- [ ] Select an email ending with `@vnrvjiet.in`
- [ ] Verify roll number exists in database
- [ ] Expected: Redirect to `/student` dashboard
- [ ] Expected: Toast message "Successfully logged in with Google!"

#### Test 2: Student Login (Invalid Roll Number)
- [ ] Navigate to login page
- [ ] Click "Continue with Google"
- [ ] Select an email ending with `@vnrvjiet.in` but roll number NOT in database
- [ ] Expected: Redirect back to login with error
- [ ] Expected: Toast message "Please use your official hostel email to log in."

#### Test 3: Admin Login
- [ ] Navigate to login page
- [ ] Click "Continue with Google"
- [ ] Select `gurramkarthik2006@gmail.com`
- [ ] Expected: Redirect to `/admin` dashboard
- [ ] Expected: Toast message "Successfully logged in with Google!"

#### Test 4: Security Login
- [ ] Navigate to login page
- [ ] Click "Continue with Google"
- [ ] Select `gurramkarthik2005@gmail.com`
- [ ] Expected: Redirect to `/security` dashboard
- [ ] Expected: Toast message "Successfully logged in with Google!"

#### Test 5: Unauthorized Email
- [ ] Navigate to login page
- [ ] Click "Continue with Google"
- [ ] Select any random Gmail account (not matching above patterns)
- [ ] Expected: Redirect back to login with error
- [ ] Expected: Toast message "Unauthorized email. Please use your institutional email."

## Database Setup for Testing

To test student login, ensure you have a student record with a roll number matching the email:

```javascript
// Example: If testing with email "21pa1a0501@vnrvjiet.in"
// Ensure this document exists in Student collection:
{
  rollNumber: "21pa1a0501",
  name: "Test Student",
  email: "21pa1a0501@vnrvjiet.in",
  // ... other fields
}
```

## Troubleshooting

### Issue: "Authentication failed"
- Check server logs for detailed error
- Verify Google OAuth credentials are correct
- Ensure callback URL in Google Cloud Console matches: `http://localhost:6201/auth/google/callback`

### Issue: "Unauthorized email"
- For students: Verify email ends with `@vnrvjiet.in`
- For admin: Verify email matches `ADMIN_EMAIL` in `.env`
- For security: Verify email matches `SECURITY_EMAIL` in `.env`

### Issue: Student login rejected despite using institutional email
- Check if roll number (extracted from email) exists in database
- Verify the `rollNumber` field in database matches the email prefix
- Example: Email `21pa1a0501@vnrvjiet.in` requires `rollNumber: "21pa1a0501"` in database

## Important Notes

1. **Roll Number Extraction**: The system automatically extracts the roll number from the email address (everything before the `@` symbol)

2. **Google Cloud Console**: Make sure the callback URL is updated in your Google Cloud Console to:
   - Development: `http://localhost:6201/auth/google/callback`
   - Production: Update to your production domain

3. **Token Storage**: Tokens are stored in localStorage under:
   - `token`
   - `auth-token`
   - `guard_token` (for security role only)

4. **Role Assignment**: Roles are auto-detected based on email - no manual selection required

5. **Security**: Admin and Security emails are stored in `.env` file - never commit actual production emails to version control!
