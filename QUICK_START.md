# Quick Start Guide for New Authentication System

## Setup Instructions

### 1. Update Environment Variables

Open `/server/.env` and ensure these variables are set:

```env
ADMIN_EMAIL=gurramkarthik2006@gmail.com
SECURITY_EMAIL=gurramkarthik2005@gmail.com
ALLOWED_EMAIL_DOMAIN=vnrvjiet.in
```

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Find your OAuth 2.0 Client ID
4. Update **Authorized redirect URIs** to include:
   - Development: `http://localhost:6201/auth/google/callback`
   - Production: `https://your-domain.com/auth/google/callback`

### 3. Create Test Student (Optional)

Run this script to create a test student for OAuth testing:

```bash
cd server
node scripts/createTestStudentForOAuth.js
```

This will create a student with:
- Email: `21pa1a0501@vnrvjiet.in`
- Roll Number: `21pa1a0501`
- Name: Test Student

### 4. Start the Application

#### Start Server:
```bash
cd server
npm run dev
```

#### Start Frontend:
```bash
cd frontend
npm run dev
```

### 5. Test the Login Flow

1. Navigate to `http://localhost:3201` (or your frontend URL)
2. You'll see a single "Continue with Google" button
3. Click the button and select one of these accounts:

   **For Admin Access:**
   - Use: `gurramkarthik2006@gmail.com`
   - Expected Result: Redirects to `/admin`

   **For Security Access:**
   - Use: `gurramkarthik2005@gmail.com`
   - Expected Result: Redirects to `/security`

   **For Student Access:**
   - Use: Any `*@vnrvjiet.in` email with a matching roll number in database
   - Example: `21pa1a0501@vnrvjiet.in` (if you ran the test script)
   - Expected Result: Redirects to `/student`

## How It Works

### Role Detection Algorithm

```
User clicks "Continue with Google"
    ↓
Google returns user's email
    ↓
System checks email:
    ├─ Matches ADMIN_EMAIL? → Admin role
    ├─ Matches SECURITY_EMAIL? → Security role
    ├─ Ends with @vnrvjiet.in?
    │   ↓
    │   Extract roll number (part before @)
    │   ↓
    │   Check if roll number exists in database
    │   ├─ Yes → Student role
    │   └─ No → Error: "Please use your official hostel email"
    │
    └─ None of the above → Error: "Unauthorized email"
```

## Adding New Students

To allow a new student to log in:

1. Add their record to the `Student` collection in MongoDB
2. Ensure the `rollNumber` field matches the email prefix
3. Example:
   ```javascript
   {
     rollNumber: "22pa1a0601",  // Must match email prefix
     email: "22pa1a0601@vnrvjiet.in",
     name: "New Student",
     // ... other required fields
   }
   ```

## Changing Admin/Security Emails

To update authorized admin or security emails:

1. Edit `/server/.env` file
2. Update `ADMIN_EMAIL` or `SECURITY_EMAIL` values
3. Restart the server
4. The changes will take effect immediately

## Troubleshooting

### Error: "Unauthorized email"
- **Cause**: Email doesn't match any authorized pattern
- **Solution**: 
  - For students: Use an email ending with `@vnrvjiet.in`
  - For admin/security: Verify email matches `.env` settings

### Error: "Please use your official hostel email"
- **Cause**: Student's roll number not found in database
- **Solution**: Add student record to database with correct roll number

### Login button not working
- **Check**: Browser console for errors
- **Check**: Network tab - is request reaching `/auth/google`?
- **Check**: Server logs for error messages

### Redirects to wrong page after login
- **Check**: User's role is correctly assigned in database
- **Check**: Token contains correct role information
- **Check**: Frontend routing logic for role-based navigation

## Security Notes

1. **Never commit `.env` files** to version control with real credentials
2. **Admin/Security emails** should be kept confidential
3. **Roll number verification** prevents unauthorized institutional email users
4. **JWT tokens** expire after 24 hours for security

## Production Deployment

Before deploying to production:

1. ✅ Update `ADMIN_EMAIL` and `SECURITY_EMAIL` in production `.env`
2. ✅ Update Google OAuth callback URL in Google Cloud Console
3. ✅ Set `ALLOWED_EMAIL_DOMAIN` to your institution's domain
4. ✅ Update `SERVER_URL` and `CLIENT_URL` in `.env`
5. ✅ Ensure MongoDB has all student records with correct roll numbers
6. ✅ Test all three role types (student, admin, security) in production

## Support

For issues or questions:
1. Check server logs: `tail -f server/logs/error.log`
2. Check browser console for frontend errors
3. Review `AUTHENTICATION_CHANGES.md` for detailed technical documentation
