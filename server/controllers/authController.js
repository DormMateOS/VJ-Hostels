const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Guard = require('../models/GuardModel');
const Student = require('../models/StudentModel');
const Warden = require('../models/Warden');
const AuditLog = require('../models/AuditLogModel');

class AuthController {
  // Generate JWT token
  static generateToken(user, role) {
    return jwt.sign(
      { 
        id: user._id, 
        role,
        username: user.username || user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // Guard login
  static async guardLogin(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Find guard by username or email
      const guard = await Guard.findOne({
        $or: [
          { username: username },
          { email: username }
        ]
      });

      if (!guard || !guard.isActive) {
        await AuditLog.create({
          action: 'guard_login',
          actorId: null,
          actorType: 'guard',
          meta: {
            username,
            success: false,
            reason: 'invalid_credentials'
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'warning'
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check password
      const isValidPassword = await guard.comparePassword(password);
      if (!isValidPassword) {
        await AuditLog.create({
          action: 'guard_login',
          actorId: guard._id,
          actorType: 'guard',
          meta: {
            username,
            success: false,
            reason: 'invalid_password'
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'warning'
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Update last login
      await Guard.findByIdAndUpdate(guard._id, { lastLogin: new Date() });

      // Generate token
      const token = AuthController.generateToken(guard, 'guard');

      // Log successful login
      await AuditLog.create({
        action: 'guard_login',
        actorId: guard._id,
        actorType: 'guard',
        meta: {
          username,
          success: true
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: guard._id,
          name: guard.name,
          username: guard.username,
          email: guard.email,
          shift: guard.shift,
          permissions: guard.permissions
        }
      });

    } catch (error) {
      console.error('Guard login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Student login (simple token-based)
  static async studentLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Find student
      const student = await Student.findOne({ email, is_active: true });

      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check password
      const isValidPassword = await student.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate token
      const token = AuthController.generateToken(student, 'student');

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          room: student.room,
          phoneNumber: student.phoneNumber
        }
      });

    } catch (error) {
      console.error('Student login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Warden login
  static async wardenLogin(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Find warden
      const warden = await Warden.findOne({
        $or: [
          { username: username },
          { email: username }
        ],
        is_active: true
      });

      if (!warden) {
        await AuditLog.create({
          action: 'warden_login',
          actorId: null,
          actorType: 'warden',
          meta: {
            username,
            success: false,
            reason: 'invalid_credentials'
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'warning'
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, warden.password_hash);
      if (!isValidPassword) {
        await AuditLog.create({
          action: 'warden_login',
          actorId: warden._id,
          actorType: 'warden',
          meta: {
            username,
            success: false,
            reason: 'invalid_password'
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'warning'
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate token
      const token = AuthController.generateToken(warden, 'warden');

      // Log successful login
      await AuditLog.create({
        action: 'warden_login',
        actorId: warden._id,
        actorType: 'warden',
        meta: {
          username,
          success: true
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: warden._id,
          name: warden.name,
          username: warden.username,
          email: warden.email,
          phone: warden.phone
        }
      });

    } catch (error) {
      console.error('Warden login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Verify token
  static async verifyToken(req, res) {
    try {
      const { user } = req;

      let userData = null;

      if (user.role === 'guard') {
        const guard = await Guard.findById(user.id).select('-password');
        userData = guard;
      } else if (user.role === 'student') {
        const student = await Student.findById(user.id).select('-password');
        userData = student;
      } else if (user.role === 'warden') {
        const warden = await Warden.findById(user.id).select('-password_hash');
        userData = warden;
      }

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        user: userData,
        role: user.role
      });

    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }
}

module.exports = AuthController;
