const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require("jsonwebtoken");
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

function generateJwt(user, role) {
  // Map security role to guard for consistency
  const actualRole = role === 'security' ? 'guard' : (role || user.role);
  
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: actualRole
    },
    process.env.JWT_SECRET, 
    { expiresIn: "24h" }
  );
}


// Role-based Google OAuth
router.get('/google/:role', (req, res, next) => {
  const role = req.params.role;
  if (!['student', 'admin', 'security'].includes(role)) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_role`);
  }
  
  // Store role in session for callback
  req.session.selectedRole = role;
  passport.authenticate(`google-${role}`, { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
  '/callback/:role',
  (req, res, next) => {
    const role = req.params.role;
    passport.authenticate(`google-${role}`, (err, user, info) => {
        // Verbose logging for debugging auth failures
        console.log(`Auth callback invoked for role=${role} - session.selectedRole=${req.session?.selectedRole || 'n/a'}`);
        if (err) {
          console.error(`${role} authentication error:`, err);
          if (info) console.error('Passport info:', info);
          // Include minimal info in redirect (generic) and log details server-side
          return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
        }

        if (!user) {
          console.warn(`No ${role} user found or unauthorized email. Passport info:`, info);
          return res.redirect(`${process.env.CLIENT_URL}/login?error=unauthorized`);
        }

        req.logIn(user, (err) => {
          if (err) {
            console.error(`${role} login error:`, err);
            if (err.stack) console.error(err.stack);
            return res.redirect(`${process.env.CLIENT_URL}/login?error=login_failed`);
          }

          console.log(`Successful ${role} login for user:`, { id: user._id, email: user.email, role: user.role });
          const token = generateJwt(user, role);

          // Redirect to role-specific route with JWT
          return res.redirect(`${process.env.CLIENT_URL}/?auth=success&token=${token}&role=${role}`);
        });
    })(req, res, next);
  }
);


// Check authentication status
router.get('/check-auth', authenticateToken, async (req, res) => {
  try {
    // Fetch full user data based on role
    let userData = null;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'guard' || userRole === 'security') {
      const Guard = require('../models/GuardModel');
      userData = await Guard.findById(userId).select('-password');
      if (userData) {
        // Normalize role to 'security' for frontend consistency
        userData = userData.toObject();
        userData.role = 'security';
      }
    } else if (userRole === 'student') {
      const Student = require('../models/StudentModel');
      userData = await Student.findById(userId).select('-password');
      if (userData) {
        userData = userData.toObject();
        userData.role = 'student';
      }
    } else if (userRole === 'admin') {
      const Admin = require('../models/AdminModel');
      userData = await Admin.findById(userId);
      if (userData) {
        userData = userData.toObject();
        userData.role = 'admin';
      }
    }

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userData,
      role: userData.role
    });
  } catch (error) {
    console.error('Check auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// OTP System Authentication Routes
router.post('/guard/login', AuthController.guardLogin);
router.post('/student/login', AuthController.studentLogin);
router.post('/warden/login', AuthController.wardenLogin);
router.get('/verify', authenticateToken, AuthController.verifyToken);

// Logout route
router.get('/logout', (req, res) => {
    req.logout(err => {
        if(err) return next(err);
        res.redirect('/');
    })
})

module.exports = router;
