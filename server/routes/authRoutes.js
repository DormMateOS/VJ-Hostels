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


// Unified Google OAuth - Auto-detect role based on email
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// Unified Google OAuth Callback
router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      console.log('🔄 Auth callback invoked');
      
      if (err) {
        console.error('❌ Authentication error:', err);
        if (info) console.error('Passport info:', info);
        return res.redirect(`${process.env.CLIENT_URL}/?error=auth_failed`);
      }

      if (!user) {
        console.warn('⚠️ No user found or unauthorized email. Info:', info);
        const errorMessage = info?.message || 'unauthorized';
        return res.redirect(`${process.env.CLIENT_URL}/?error=${encodeURIComponent(errorMessage)}`);
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('❌ Login error:', err);
          if (err.stack) console.error(err.stack);
          return res.redirect(`${process.env.CLIENT_URL}/?error=login_failed`);
        }

        const role = user.role;
        console.log(`✅ Successful ${role} login for user:`, { 
          id: user._id, 
          email: user.email, 
          role: role 
        });
        
        const token = generateJwt(user, role);

        // Redirect to frontend with JWT and role
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
