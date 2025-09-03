const rateLimit = require('express-rate-limit');
const AuditLog = require('../models/AuditLogModel');

// Rate limiter for OTP requests per phone number
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each phone to 10 OTP requests per windowMs
  keyGenerator: (req) => {
    return req.body.visitorPhone || req.ip;
  },
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res, next, options) => {
    // Log rate limit exceeded
    try {
      await AuditLog.create({
        action: 'rate_limit_exceeded',
        actorId: req.body.guardId || null,
        actorType: 'guard',
        meta: {
          endpoint: '/api/otp/request',
          visitorPhone: req.body.visitorPhone,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning'
      });
    } catch (error) {
      console.error('Failed to log rate limit exceeded:', error);
    }
    
    res.status(options.statusCode).json(options.message);
  }
});

// Rate limiter for OTP verification attempts
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 verification attempts per windowMs
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.',
    code: 'VERIFY_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'GENERAL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Brute force protection for failed OTP attempts per phone
const bruteForceProtection = new Map();

const checkBruteForce = (req, res, next) => {
  const { visitorPhone } = req.body;
  const key = `bf_${visitorPhone}`;
  const now = Date.now();
  
  if (!bruteForceProtection.has(key)) {
    bruteForceProtection.set(key, { attempts: 0, lastAttempt: now });
    return next();
  }
  
  const record = bruteForceProtection.get(key);
  
  // Reset if more than 1 hour has passed
  if (now - record.lastAttempt > 60 * 60 * 1000) {
    bruteForceProtection.set(key, { attempts: 0, lastAttempt: now });
    return next();
  }
  
  // Block if too many attempts
  if (record.attempts >= 5) {
    return res.status(429).json({
      success: false,
      message: 'Account temporarily locked due to too many failed attempts. Please try again later.',
      code: 'BRUTE_FORCE_PROTECTION'
    });
  }
  
  next();
};

const recordFailedAttempt = (visitorPhone) => {
  const key = `bf_${visitorPhone}`;
  const now = Date.now();
  
  if (bruteForceProtection.has(key)) {
    const record = bruteForceProtection.get(key);
    record.attempts += 1;
    record.lastAttempt = now;
  } else {
    bruteForceProtection.set(key, { attempts: 1, lastAttempt: now });
  }
};

const clearBruteForceRecord = (visitorPhone) => {
  const key = `bf_${visitorPhone}`;
  bruteForceProtection.delete(key);
};

module.exports = {
  otpRequestLimiter,
  otpVerifyLimiter,
  generalLimiter,
  checkBruteForce,
  recordFailedAttempt,
  clearBruteForceRecord
};
