const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require("jsonwebtoken");

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
        return res.redirect('http://localhost:5173/login?error=auth_failed');
      }
      
      if (!user) {
        console.log("No user found or unauthorized email");
        return res.redirect('http://localhost:5173/login?error=unauthorized');
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.redirect('http://localhost:5173/login?error=login_failed');
        }

        console.log("Successful login for user:", user);
        const token = generateJwt(user);
        
        // Set cookie with appropriate settings for development
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
          maxAge: 3600000 // 1 hour
        });
        
        return res.redirect('http://localhost:5173/home');
      });
    })(req, res, next);
  }
);


// Logout route
router.get('/logout', (req, res) => {
    req.logout(err => {
        if(err) return next(err);
        res.redirect('/');
    })
})

module.exports = router;
