const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require("jsonwebtoken");
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

function generateJwt(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role || "student"
    },
    process.env.JWT_SECRET, 
    { expiresIn: "1h" }
  );
}


// Student Google OAuth
router.get('/google', 
    passport.authenticate('google-student', { scope: ['profile', 'email'] })
);

router.get(
  '/student/callback',
  (req, res, next) => {
    passport.authenticate('google-student', (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }

      if (!user) {
        console.log("No user found or unauthorized email");
        return res.redirect(`${process.env.CLIENT_URL}/login?error=unauthorized`);
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect(`${process.env.CLIENT_URL}/login?error=login_failed`);
        }

        console.log("Successful login for user:", user);
        const token = generateJwt(user);

        // Redirect with token as URL parameter for frontend to handle
        return res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
      });
    })(req, res, next);
  }
);


// Admin Google OAuth
router.get('/google/admin', 
    passport.authenticate('google-admin', { scope: ['profile', 'email'] })
);

router.get(
  '/admin/callback',
  (req, res, next) => {
    passport.authenticate('google-admin', (err, user, info) => {
      if (err) {
        console.error("Admin authentication error:", err);
        return res.redirect(`${process.env.ADMIN_CLIENT_URL || 'http://localhost:5174'}/login?error=auth_failed`);
      }

      if (!user) {
        console.log("No admin user found or unauthorized email");
        return res.redirect(`${process.env.ADMIN_CLIENT_URL || 'http://localhost:5174'}/login?error=unauthorized`);
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Admin login error:", err);
          return res.redirect(`${process.env.ADMIN_CLIENT_URL || 'http://localhost:5174'}/login?error=login_failed`);
        }

        console.log("Successful admin login for user:", user);
        const token = generateJwt(user);

        // Redirect with token and admin email as URL parameters for frontend to handle
        return res.redirect(`${process.env.ADMIN_CLIENT_URL || 'http://localhost:5174'}/auth/callback?token=${token}&admin=${encodeURIComponent(user.email)}`);
      });
    })(req, res, next);
  }
);

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
