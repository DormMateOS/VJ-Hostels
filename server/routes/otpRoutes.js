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

// OTP Routes
router.post('/request', 
  otpRequestLimiter,
  authenticateGuard,
  checkPermission('canRequestOTP'),
  auditLog('otp_requested'),
  OTPController.requestOTP
);

router.post('/verify',
  otpVerifyLimiter,
  checkBruteForce,
  authenticateGuard,
  checkPermission('canVerifyOTP'),
  auditLog('otp_verified'),
  OTPController.verifyOTP
);

// Visit Routes
router.post('/visits/:visitId/checkout',
  authenticateGuard,
  checkPermission('canCheckout'),
  auditLog('visit_checkout'),
  OTPController.checkout
);

router.get('/visits/active',
  authenticateGuard,
  OTPController.getActiveVisits
);

router.get('/visits/history',
  authenticateGuard,
  OTPController.getVisitHistory
);

// Override Routes
router.post('/override/request',
  authenticateGuard,
  auditLog('override_requested'),
  OverrideController.requestOverride
);

router.get('/override/pending',
  authenticateWarden,
  OverrideController.getPendingOverrides
);

router.post('/override/:requestId/process',
  authenticateWarden,
  auditLog('override_processed'),
  OverrideController.processOverride
);

router.get('/override/history',
  authenticateWarden,
  OverrideController.getOverrideHistory
);

// Student Routes
router.get('/students/search',
  authenticateGuard,
  StudentController.searchStudents
);

router.get('/students/:studentId/preferences',
  authenticateStudent,
  StudentController.getPreferences
);

router.post('/students/:studentId/preferences',
  authenticateStudent,
  auditLog('student_preferences_updated'),
  StudentController.updatePreferences
);

router.post('/students/:studentId/fcm-token',
  authenticateStudent,
  StudentController.updateFCMToken
);

// Student OTP Routes
router.get('/students/:studentId/active-otps',
  authenticateStudent,
  OTPController.getStudentActiveOTPs
);

router.get('/students/:studentId/visits',
  authenticateStudent,
  OTPController.getStudentVisits
);

module.exports = router;
