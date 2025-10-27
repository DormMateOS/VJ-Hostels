const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Student = require('../models/StudentModel.js');
const Admin = require('../models/AdminModel.js');
const Guard = require('../models/GuardModel.js');

// Allow overriding institutional email check in development
const ALLOW_NON_INSTITUTIONAL = process.env.ALLOW_NON_INSTITUTIONAL === 'true';
function isInstitutionalEmail(email) {
    if (ALLOW_NON_INSTITUTIONAL) return true;
    return typeof email === 'string' && email.endsWith('@vnrvjiet.in');
}

// Student Google OAuth
passport.use('google-student', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/callback/student`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        if (!isInstitutionalEmail(email)) {
            console.warn('Rejected student login due to email domain:', email);
            return done(null, false, { message: 'Only institutional emails allowed' });
        }

        let student = await Student.findOne({ googleId: profile.id });
        if (!student) {
            student = await Student.create({
                googleId: profile.id,
                username: profile.displayName,
                name: profile.displayName,
                email: email,
                role: 'student',
                password: 'N/A',
                rollNumber: 'N/A',
                phoneNumber: 'N/A',
                parentMobileNumber: 'N/A',
            });
        }

        return done(null, student);
    } catch (err) {
        return done(err, null);
    }
}));


// Admin Google OAuth
passport.use('google-admin', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/callback/admin`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        if (!isInstitutionalEmail(email)) {
            console.warn('Rejected admin login due to email domain:', email);
            return done(null, false, { message: 'Only institutional emails allowed' });
        }

        let admin = await Admin.findOne({ googleId: profile.id });
        if (!admin) {
            admin = await Admin.create({
                googleId: profile.id,
                username: profile.displayName,
                name: profile.displayName,
                email: email,
                role: 'admin',
            });
        }

        return done(null, admin);
    } catch (err) {
        return done(err, null);
    }
}));

// Security/Guard Google OAuth
passport.use('google-security', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/auth/callback/security`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        if (!isInstitutionalEmail(email)) {
            console.warn('Rejected security login due to email domain:', email);
            return done(null, false, { message: 'Only institutional emails allowed' });
        }

        let guard = await Guard.findOne({ $or: [{ googleId: profile.id }, { email: email }] });
        if (!guard) {
            // Create a new guard record with Google OAuth
            guard = await Guard.create({
                googleId: profile.id,
                name: profile.displayName,
                email: email,
                role: 'security',
                phoneNumber: 'N/A', // Fixed: was 'phone'
                shift: 'day', // Default shift
                isActive: true,
                // Don't set password for OAuth users
            });
        } else if (!guard.googleId && guard.email === email) {
            // Update existing guard with Google OAuth
            guard.googleId = profile.id;
            await guard.save();
        }

        return done(null, guard);
    } catch (err) {
        console.error('Security OAuth error:', err);
        return done(err, null);
    }
}));


passport.serializeUser((user, done) => {
  done(null, { id: user.id, role: user.role || 'student' }); 
});

passport.deserializeUser(async (data, done) => {
  try {
    let user;
    if (data.role === 'admin') {
      user = await Admin.findById(data.id);
    } else if (data.role === 'security') {
      user = await Guard.findById(data.id);
    } else {
      user = await Student.findById(data.id);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
