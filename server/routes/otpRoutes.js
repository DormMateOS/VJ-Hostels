const express = require('express');
const router = express.Router();
const OTPController = require('../controllers/otpController');
const OverrideController = require('../controllers/overrideController');
const StudentController = require('../controllers/studentController');
const { authenticateGuard, authenticateStudent, authenticateWarden, checkPermission, auditLog } = require('../middleware/authMiddleware');
const { otpRequestLimiter, otpVerifyLimiter, checkBruteForce } = require('../middleware/rateLimitMiddleware');

// Add Socket.IO to request object
router.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

// OTP Routes - Request OTP
router.post('/request', 
  otpRequestLimiter,
  authenticateGuard,
  checkPermission('canRequestOTP'),
  auditLog('otp_requested'),
  OTPController.requestOTP
);

// OTP Routes - Verify OTP
router.post('/verify',
  otpVerifyLimiter,
  checkBruteForce,
  authenticateGuard,
  checkPermission('canVerifyOTP'),
  auditLog('otp_verified'),
  OTPController.verifyOTP
);

// Student OTP Generation
router.post('/generate',
  authenticateStudent,
  auditLog('student_otp_generated'),
  OTPController.generateStudentOTP
);

// Visit Routes - Checkout
router.post('/visits/:visitId/checkout',
  authenticateGuard,
  checkPermission('canCheckout'),
  auditLog('visit_checkout'),
  OTPController.checkout
);

// Visit Routes - Get active visits
router.get('/visits/active',
  authenticateGuard,
  OTPController.getActiveVisits
);

// Visit Routes - Get history
router.get('/visits/history',
  authenticateGuard,
  OTPController.getVisitHistory
);

// Override Routes - Request override
router.post('/override/request',
  authenticateGuard,
  auditLog('override_requested'),
  OverrideController.requestOverride
);

// Override Routes - Get pending
router.get('/override/pending',
  authenticateWarden,
  OverrideController.getPendingOverrides
);

// Override Routes - Process override
router.post('/override/:requestId/process',
  authenticateWarden,
  auditLog('override_processed'),
  OverrideController.processOverride
);

// Override Routes - Get history
router.get('/override/history',
  authenticateWarden,
  OverrideController.getOverrideHistory
);

// Student Routes - Search
router.get('/students/search',
  authenticateGuard,
  StudentController.searchStudents
);

// Student Routes - Get preferences
router.get('/students/:studentId/preferences',
  authenticateStudent,
  StudentController.getPreferences
);

// Student Routes - Update preferences
router.post('/students/:studentId/preferences',
  authenticateStudent,
  auditLog('student_preferences_updated'),
  StudentController.updatePreferences
);

// Student Routes - Update FCM token
router.post('/students/:studentId/fcm-token',
  authenticateStudent,
  StudentController.updateFCMToken
);

// Student OTP Routes - Get active OTPs
router.get('/students/:studentId/active-otps',
  authenticateStudent,
  OTPController.getStudentActiveOTPs
);

// Student OTP Routes - Get visits
router.get('/students/:studentId/visits',
  authenticateStudent,
  OTPController.getStudentVisits
);

module.exports = router;
