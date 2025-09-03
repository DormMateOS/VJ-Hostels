const OverrideRequest = require('../models/OverrideRequestModel');
const Visit = require('../models/VisitModel');
const Student = require('../models/StudentModel');
const Warden = require('../models/Warden');
const AuditLog = require('../models/AuditLogModel');
const notificationService = require('../services/notificationService');
const OTPUtils = require('../utils/otpUtils');

class OverrideController {
  // Request override
  static async requestOverride(req, res) {
    try {
      const { guardId, visitorName, visitorPhone, studentId, reason, purpose, urgency = 'medium' } = req.body;

      // Validate required fields
      if (!guardId || !visitorName || !visitorPhone || !studentId || !reason || !purpose) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          code: 'MISSING_FIELDS'
        });
      }

      const sanitizedPhone = OTPUtils.sanitizePhoneNumber(visitorPhone);

      // Find student
      const student = await Student.findById(studentId);
      if (!student || !student.is_active) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or inactive',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Check if there's already a pending override for this visitor
      const existingOverride = await OverrideRequest.findOne({
        'visitor.phone': sanitizedPhone,
        studentId,
        status: 'pending'
      });

      if (existingOverride) {
        return res.status(400).json({
          success: false,
          message: 'A pending override request already exists for this visitor',
          code: 'OVERRIDE_EXISTS',
          requestId: existingOverride._id
        });
      }

      // Create override request
      const overrideRequest = await OverrideRequest.create({
        guardId,
        visitor: {
          name: visitorName,
          phone: sanitizedPhone
        },
        studentId,
        reason,
        purpose,
        urgency,
        isOutOfHours: OTPUtils.isOutOfHours()
      });

      // Find available wardens to notify
      const wardens = await Warden.find({ is_active: true });
      
      // Send notifications to wardens
      for (const warden of wardens) {
        try {
          await notificationService.sendOverrideNotification(warden, overrideRequest);
        } catch (error) {
          console.error(`Failed to notify warden ${warden._id}:`, error);
        }
      }

      // Log the action
      await AuditLog.create({
        action: 'override_requested',
        actorId: guardId,
        actorType: 'guard',
        targetId: overrideRequest._id,
        targetType: 'override_request',
        meta: {
          visitorName,
          visitorPhone: sanitizedPhone,
          studentId,
          reason,
          purpose,
          urgency,
          isOutOfHours: overrideRequest.isOutOfHours
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Emit socket event
      req.io.emit('overrideRequested', {
        overrideRequest,
        student: { name: student.name, room: student.room }
      });

      res.json({
        success: true,
        message: 'Override request submitted successfully',
        overrideRequest
      });

    } catch (error) {
      console.error('Override request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Get pending override requests (for wardens)
  static async getPendingOverrides(req, res) {
    try {
      const { wardenId } = req.query;

      const overrides = await OverrideRequest.find({ status: 'pending' })
        .populate('guardId', 'name username')
        .populate('studentId', 'name room phoneNumber')
        .sort({ urgency: -1, createdAt: -1 });

      res.json({
        success: true,
        overrides
      });

    } catch (error) {
      console.error('Get pending overrides error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Approve/Deny override request
  static async processOverride(req, res) {
    try {
      const { requestId } = req.params;
      const { wardenId, action, wardenNotes } = req.body;

      if (!wardenId || !action || !['approved', 'denied'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request parameters',
          code: 'INVALID_PARAMS'
        });
      }

      // Find override request
      const overrideRequest = await OverrideRequest.findById(requestId)
        .populate('studentId', 'name room')
        .populate('guardId', 'name username');

      if (!overrideRequest) {
        return res.status(404).json({
          success: false,
          message: 'Override request not found',
          code: 'OVERRIDE_NOT_FOUND'
        });
      }

      if (overrideRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Override request has already been processed',
          code: 'ALREADY_PROCESSED'
        });
      }

      // Update override request
      const updatedOverride = await OverrideRequest.findByIdAndUpdate(
        requestId,
        {
          status: action,
          wardenId,
          wardenNotes: wardenNotes || '',
          resolvedAt: new Date()
        },
        { new: true }
      ).populate('studentId', 'name room')
        .populate('guardId', 'name username')
        .populate('wardenId', 'name username');

      let visit = null;

      // If approved, create visit record
      if (action === 'approved') {
        visit = await Visit.create({
          visitorName: overrideRequest.visitor.name,
          visitorPhone: overrideRequest.visitor.phone,
          studentId: overrideRequest.studentId._id,
          guardId: overrideRequest.guardId._id,
          purpose: overrideRequest.purpose,
          method: 'override',
          overrideRequestId: requestId,
          notes: `Warden override approved. Reason: ${overrideRequest.reason}`
        });

        // Update override request with visit ID
        await OverrideRequest.findByIdAndUpdate(requestId, { visitId: visit._id });
      }

      // Log the action
      await AuditLog.create({
        action: action === 'approved' ? 'override_approved' : 'override_denied',
        actorId: wardenId,
        actorType: 'warden',
        targetId: requestId,
        targetType: 'override_request',
        meta: {
          originalGuardId: overrideRequest.guardId._id,
          visitorName: overrideRequest.visitor.name,
          visitorPhone: overrideRequest.visitor.phone,
          studentId: overrideRequest.studentId._id,
          reason: overrideRequest.reason,
          wardenNotes,
          visitId: visit?._id
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: action === 'approved' ? 'info' : 'warning'
      });

      // Emit socket events
      req.io.emit('overrideProcessed', {
        overrideRequest: updatedOverride,
        action,
        visit
      });

      if (visit) {
        req.io.emit('visitCreated', {
          visit,
          student: overrideRequest.studentId
        });
      }

      res.json({
        success: true,
        message: `Override request ${action} successfully`,
        overrideRequest: updatedOverride,
        visit
      });

    } catch (error) {
      console.error('Process override error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Get override history
  static async getOverrideHistory(req, res) {
    try {
      const { wardenId, guardId, status, page = 1, limit = 20 } = req.query;

      const query = {};
      if (wardenId) query.wardenId = wardenId;
      if (guardId) query.guardId = guardId;
      if (status) query.status = status;

      const skip = (page - 1) * limit;

      const overrides = await OverrideRequest.find(query)
        .populate('guardId', 'name username')
        .populate('studentId', 'name room phoneNumber')
        .populate('wardenId', 'name username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await OverrideRequest.countDocuments(query);

      res.json({
        success: true,
        overrides,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get override history error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }
}

module.exports = OverrideController;
