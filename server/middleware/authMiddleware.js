const jwt = require('jsonwebtoken');
const Guard = require('../models/GuardModel');
const Student = require('../models/StudentModel');
const Warden = require('../models/Warden');
const AuditLog = require('../models/AuditLogModel');

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      code: 'TOKEN_REQUIRED'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    req.user = user;
    next();
  });
};

// Guard authentication middleware
const authenticateGuard = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Handle different token payload formats
    const guardId = decoded._id || decoded.id || decoded.guardId;
    
    if (!guardId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Fetch guard from database
    const guard = await Guard.findById(guardId);
    
    if (!guard) {
      return res.status(401).json({
        success: false,
        message: 'Guard not found',
        code: 'GUARD_NOT_FOUND'
      });
    }

    if (!guard.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Guard account is inactive',
        code: 'GUARD_INACTIVE'
      });
    }

    // Attach guard and user info to request
    req.user = {
      id: guard._id,
      _id: guard._id,
      role: 'guard',
      email: guard.email,
      name: guard.name
    };
    req.guard = guard;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Student authentication middleware - supports both JWT and Google OAuth tokens
const authenticateStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    // Try JWT first (for new student auth system)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'student') {
        const student = await Student.findById(decoded.id);
        if (!student || !student.is_active) {
          return res.status(403).json({
            success: false,
            message: 'Student account not found or inactive',
            code: 'STUDENT_INACTIVE'
          });
        }
        req.user = decoded;
        req.student = student;
        return next();
      }
    } catch (jwtError) {
      // JWT verification failed, try Google OAuth token validation
      console.log('JWT verification failed, trying Google OAuth validation');
    }

    // Fallback: For Google OAuth tokens, decode and find student by email
    try {
      // Decode Google OAuth token (base64 decode the payload)
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        const email = payload.email;
        
        if (email) {
          const student = await Student.findOne({ 
            email: email,
            is_active: true 
          });

          if (student) {
            req.user = { id: student._id, role: 'student' };
            req.student = student;
            return next();
          }
        }
      }
    } catch (oauthError) {
      console.error('OAuth validation error:', oauthError);
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });

  } catch (error) {
    console.error('Student authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Warden authentication middleware
const authenticateWarden = async (req, res, next) => {
  try {
    await authenticateToken(req, res, async () => {
      if (req.user.role !== 'warden') {
        return res.status(403).json({
          success: false,
          message: 'Warden access required',
          code: 'WARDEN_ACCESS_REQUIRED'
        });
      }

      // Verify warden exists and is active
      const warden = await Warden.findById(req.user.id);
      if (!warden || !warden.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Warden account not found or inactive',
          code: 'WARDEN_INACTIVE'
        });
      }

      req.warden = warden;
      next();
    });
  } catch (error) {
    console.error('Warden authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Modified permission check middleware
const checkPermission = (permission) => {
  return (req, res, next) => {
    // Allow students to request OTP if they're authenticated
    if (req.student) {
      return next();
    }

    // Check guard permissions
    if (!req.guard) {
      return res.status(403).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.guard.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission}`,
        code: 'PERMISSION_DENIED'
      });
    }

    next();
  };
};

// Audit logging middleware
const auditLog = (action) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action after successful response
      if (data.success !== false) {
        setImmediate(async () => {
          try {
            const actorId = req.user?.id || req.guard?._id || req.student?._id || req.warden?._id;
            const actorType = req.guard ? 'guard' : req.student ? 'student' : req.warden ? 'warden' : 'unknown';

            await AuditLog.create({
              action,
              actorId,
              actorType,
              meta: {
                endpoint: req.originalUrl,
                method: req.method,
                body: req.body,
                params: req.params,
                query: req.query
              },
              ipAddress: req.ip,
              userAgent: req.get('User-Agent')
            });
          } catch (error) {
            console.error('Audit log error:', error);
          }
        });
      }

      // Call original json method
      originalJson.call(this, data);
    };

    next();
  };
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
          code: 'TOKEN_INVALID'
        });
      }

      if (decoded.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
          code: 'ADMIN_ACCESS_REQUIRED'
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = {
  authenticateToken,
  authenticateGuard,
  authenticateStudent,
  authenticateWarden,
  authenticateAdmin,
  checkPermission,
  auditLog
};
