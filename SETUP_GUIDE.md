# Quick Setup Guide - Outpass System Enhancement

## Prerequisites
- Node.js installed
- MongoDB running
- Existing VJ-Hostels project

## Installation Steps

### 1. Frontend Setup
```bash
cd frontend
npm install qrcode.react jspdf qrcode html5-qrcode --legacy-peer-deps
```

### 2. Backend Setup
No additional packages needed. The system uses Node's built-in `crypto` module.

### 3. Database Migration
The existing outpasses will continue to work. New fields will be added automatically when you approve new outpasses.

To update existing outpasses with new schema:
```javascript
// Run this in MongoDB shell or create a migration script
db.outpasses.updateMany(
  {},
  {
    $set: {
      qrCodeData: null,
      actualOutTime: null,
      actualInTime: null,
      approvedBy: null,
      approvedAt: null
    }
  }
)
```

### 4. Start the Application

#### Backend
```bash
cd server
npm start
# or
node server.js
```

#### Frontend
```bash
cd frontend
npm run dev
```

## Testing the System

### As Admin
1. Login as admin
2. Navigate to Outpasses section
3. Approve a pending outpass
4. QR code will be generated automatically

### As Student
1. Login as student
2. Go to Outpass section
3. Apply for outpass
4. After approval, check "Current Passes" tab
5. See QR code displayed
6. Click "Download Pass" to get PDF

### As Security Guard
1. Login with security credentials
2. Navigate to QR Scanner
3. Allow camera permissions
4. Scan student's QR code
5. Approve check-out or check-in

## Creating a Security Guard Account

### Option 1: Direct Database Insert
```javascript
// Run in MongoDB shell
use your_database_name;

db.guards.insertOne({
  username: "security1",
  password: "$2a$10$yourHashedPasswordHere", // Use bcrypt to hash "password123"
  name: "Security Guard 1",
  email: "security1@vnrvjiet.in",
  phoneNumber: "9876543210",
  shift: "day",
  isActive: true,
  role: "security",
  permissions: {
    canRequestOTP: true,
    canVerifyOTP: true,
    canCheckout: true,
    canOverride: false,
    canViewReports: false
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### Option 2: Using API (Requires Admin Auth)
```bash
POST http://localhost:4000/security-api/create-guard
Headers: Authorization: Bearer <admin_token>
Body: {
  "username": "security1",
  "password": "password123",
  "name": "Security Guard 1",
  "email": "security1@vnrvjiet.in",
  "phoneNumber": "9876543210",
  "shift": "day"
}
```

## Environment Variables
Make sure your `.env` file has:
```env
DBURL=mongodb://localhost:27017/vj-hostels
JWT_SECRET=your_secret_key
PORT=4000
```

## API Endpoints Reference

### Outpass Management
- `PUT /admin-api/update-outpass-status/:id` - Approve/reject outpass
- `GET /admin-api/pending-outpasses` - Get pending outpasses
- `GET /student-api/all-outpasses/:rollNumber` - Get student outpasses

### Outpass Operations (New)
- `POST /outpass-api/scan/out` - Check out student
- `POST /outpass-api/scan/in` - Check in student
- `POST /outpass-api/verify-qr` - Verify QR code
- `GET /outpass-api/active-passes` - Get all active passes
- `GET /outpass-api/security-stats` - Get security statistics

### Security Authentication
- `POST /security-api/login` - Security login
- `GET /security-api/profile` - Get guard profile

## Troubleshooting

### QR Scanner Not Working
- Check camera permissions in browser
- Use HTTPS or localhost (HTTP doesn't work for camera on some browsers)
- Try different browser (Chrome recommended)

### QR Code Not Generated
- Check if status is being set to 'approved' not 'accepted'
- Verify crypto module is available
- Check server logs for errors

### PDF Download Not Working
- Check if jspdf and qrcode packages are installed
- Verify browser allows downloads
- Check console for errors

### Database Errors
- Ensure MongoDB is running
- Check connection string in .env
- Verify database permissions

## Camera Permissions

### Chrome
1. Click lock icon in address bar
2. Allow camera access
3. Refresh page

### Firefox
1. Click "i" icon in address bar
2. Click "Permissions"
3. Allow camera

### Safari
1. Safari → Settings → Websites → Camera
2. Allow for your domain

## Status Flow Diagram

```
Student Applies ──────────────────────→ Status: pending
                                              ↓
Admin Reviews ────────┬──────────────→ Status: approved (QR Generated)
                      │                       ↓
                      └──────────────→ Status: rejected
                                              ↓
Student Shows QR at Gate ─────────────→ Status: out (actualOutTime recorded)
                                              ↓
Student Returns & Shows QR ───────────→ Status: returned (actualInTime recorded)
                                              ↓
                                        Moves to History
```

## Default Login Credentials

### Admin
- Check your existing admin credentials

### Student
- Use existing student roll numbers and passwords

### Security
- After creating guard account:
  - Username: security1
  - Password: password123 (or what you set)

## Support
For issues or questions:
1. Check server logs: `server/server.js`
2. Check browser console for frontend errors
3. Verify all packages are installed
4. Ensure MongoDB is running

## Success Indicators
✅ Admin can approve outpasses
✅ QR codes appear in student's Current Passes
✅ PDF downloads with QR code
✅ Security can scan QR codes
✅ Status updates work correctly
✅ Passes move to history when returned

## Next Steps After Setup
1. Test complete flow with one outpass
2. Train security guards on QR scanner usage
3. Inform students about Current Passes feature
4. Monitor the system for first few days
5. Collect feedback and iterate
