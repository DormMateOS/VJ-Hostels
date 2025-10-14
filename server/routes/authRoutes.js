const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require("jsonwebtoken");
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

function generateJwt(user, role) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: role || user.role
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
      if (err) {
        console.error(`${role} authentication error:`, err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }

      if (!user) {
        console.log(`No ${role} user found or unauthorized email`);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=unauthorized`);
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error(`${role} login error:`, err);
          return res.redirect(`${process.env.CLIENT_URL}/login?error=login_failed`);
        }

        console.log(`Successful ${role} login for user:`, user);
        const token = generateJwt(user, role);

        // Redirect to role-specific route
        return res.redirect(`${process.env.CLIENT_URL}/?auth=success&token=${token}&role=${role}`);
      });
    })(req, res, next);
  }
);


// Check authentication status
router.get('/check-auth', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
      role: req.user.role
    });
  } catch (error) {
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
