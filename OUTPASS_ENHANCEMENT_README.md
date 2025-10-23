# Outpass Management System - Enhanced Features

## Overview
This document outlines the enhanced outpass management system with QR code functionality, backend integration, and security portal.

## 🎯 Features Implemented

### 1. **Database Schema Updates**
- **OutpassModel** enhanced with:
  - `qrCodeData`: Unique QR identifier for each approved outpass
  - `actualOutTime`: Timestamp when student actually left (scanned out)
  - `actualInTime`: Timestamp when student returned (scanned in)
  - `approvedBy`: Admin who approved the outpass
  - `approvedAt`: Approval timestamp
  - Status enum updated: `['pending', 'approved', 'rejected', 'out', 'returned']`

### 2. **Backend API Endpoints**

#### Outpass API (`/outpass-api`)
- `PUT /approve/:id` - Admin approves outpass (generates QR code)
- `PUT /reject/:id` - Admin rejects outpass
- `GET /current-passes/:rollNumber` - Get student's approved/active passes
- `GET /history/:rollNumber` - Get student's returned/rejected passes
- `POST /scan/out` - Security scans QR for checkout
- `POST /scan/in` - Security scans QR for checkin
- `POST /verify-qr` - Verify QR code validity
- `GET /active-passes` - Get all active passes (for security)
- `GET /security-stats` - Get security dashboard statistics

#### Security Routes (`/security-api`)
- `POST /login` - Security guard login
- `GET /profile` - Get guard profile
- `POST /create-guard` - Admin creates guard account

### 3. **Frontend Components**

#### Student Features
**Current Passes Component** (`/student/outpasses` - Current Passes Tab)
- Displays all approved/active outpasses
- Shows QR code for gate scanning
- Displays student details, reason, timings
- Download pass as PDF with QR code
- Real-time status updates

**Outpass Page Updates**
- Three tabs: Apply, Current Passes, History
- Current Passes: Shows approved & out passes
- History: Shows returned, rejected, and pending passes

#### Security Portal
**Security Dashboard** (`/security`)
- Real-time statistics:
  - Approved passes count
  - Currently out students
  - Returned today count
- Recent activity table
- Quick action buttons

**QR Scanner** (`/security/scanner`)
- Live camera view for QR scanning
- Toggle between Check-Out and Check-In modes
- Displays pass details after scan
- Validates QR code before action
- Shows appropriate action button based on pass status

**Active Passes** (`/security/passes`)
- List all approved and out passes
- Search functionality
- Separate sections for approved and out passes
- Auto-refresh every 30 seconds
- Color-coded status badges

#### Admin Features
- Approve/Reject buttons in outpass management
- QR code automatically generated on approval
- Status changed to 'approved' instead of 'accepted'

### 4. **PDF Download Feature**
- Generate downloadable PDF with outpass details
- Embedded QR code in PDF
- Professional formatting with:
  - Student information
  - Outpass details
  - QR code for security scanning
  - Timestamp of generation

### 5. **Security Flow**

#### Student Flow
1. Student applies for outpass → Status: `pending`
2. Admin approves → Status: `approved`, QR code generated
3. Pass appears in "Current Passes" with QR code
4. Student can download PDF

#### Security Flow
1. Student shows QR code at gate (leaving)
2. Security scans QR → Status changes to `out`
3. `actualOutTime` recorded
4. Student returns and shows QR code
5. Security scans QR → Status changes to `returned`
6. `actualInTime` recorded
7. Pass moves to History automatically

## 📁 File Structure

### Backend
```
server/
├── models/
│   ├── OutpassModel.js (updated)
│   └── GuardModel.js (updated)
├── APIs/
│   ├── outpassAPI.js (new)
│   └── adminAPI.js (updated)
├── routes/
│   └── securityRoutes.js (new)
└── server.js (updated)
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── student/
│   │   │   ├── CurrentPasses.jsx (new)
│   │   │   ├── OutpassPage.jsx (updated)
│   │   │   └── OutpassList.jsx (updated)
│   │   ├── security/
│   │   │   ├── SecurityDashboard.jsx (new)
│   │   │   ├── QRScanner.jsx (new)
│   │   │   └── ActivePasses.jsx (new)
│   │   └── admin/
│   │       └── Outpasses.jsx (updated)
│   ├── layouts/
│   │   └── SecurityLayout.jsx (updated)
│   ├── pages/
│   │   └── SecurityPage.jsx (updated)
│   └── utils/
│       └── outpassPDF.js (new)
```

## 🔧 Technologies Used

### Frontend
- **qrcode.react**: QR code generation in React
- **jspdf**: PDF generation
- **qrcode**: QR code utilities
- **html5-qrcode**: QR code scanning (camera access)
- **lucide-react**: Icons

### Backend
- **crypto**: Generate unique QR code data
- **mongoose**: Database operations
- **express**: API endpoints

## 📦 Installation

### Frontend
```bash
cd frontend
npm install qrcode.react jspdf qrcode html5-qrcode --legacy-peer-deps
```

### Backend
No additional packages needed (using built-in crypto module)

## 🚀 Usage

### For Students
1. Navigate to Outpass section
2. Apply for outpass
3. Wait for admin approval
4. Once approved, view in "Current Passes"
5. Show QR code at security gate
6. Download PDF if needed

### For Admins
1. Go to Outpasses section
2. View pending requests
3. Click "Approve" or "Reject"
4. QR code automatically generated on approval

### For Security
1. Login to security portal
2. Go to QR Scanner
3. Select Check-Out or Check-In mode
4. Scan student's QR code
5. Approve action after verification
6. View all active passes in Active Passes section

## 🔐 Security Features
- QR code contains unique encrypted data
- Timestamp-based validation
- Status-based action control (can't check-in if not checked-out)
- Real-time validation before any action
- Audit trail with timestamps

## 📊 Status Workflow
```
pending → approved → out → returned
           ↓
        rejected
```

## 🎨 UI Highlights
- Color-coded status badges
- Responsive design
- Real-time updates
- Clean, professional PDF output
- Mobile-friendly QR scanner
- Auto-refresh features

## 🔄 Auto-Movement Logic
- Approved passes show in "Current Passes"
- Returned passes automatically move to "History"
- Rejected passes stay in "History"
- No manual intervention needed

## ⚠️ Important Notes
1. Camera permission required for QR scanning
2. QR codes are unique and cannot be reused
3. Each scan is timestamped
4. Status transitions are strictly enforced
5. Past outpasses (returned/rejected) are archived in History

## 🎉 Benefits
- Paperless outpass system
- Real-time tracking
- Reduced manual errors
- Quick verification at gate
- Complete audit trail
- Easy to use for all users
- Downloadable proof of permission

## 🔮 Future Enhancements (Optional)
- SMS notifications on approval
- Late return alerts
- Monthly usage reports
- Integration with student profiles
- Biometric verification
- Parent notification system
