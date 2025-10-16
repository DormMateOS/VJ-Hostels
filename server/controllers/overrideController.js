const OverrideRequest = require('../models/OverrideRequestModel');
const Visit = require('../models/VisitModel');
const Guard = require('../models/GuardModel');
const Student = require('../models/StudentModel');
const notificationService = require('../services/notificationService');

// Request override from guard
const requestOverride = async (req, res) => {
  try {
    const {
      guardId,
      visitorName,
      visitorPhone,
      studentId,
      reason,
      purpose,
      urgency = 'medium'
    } = req.body;

    // Validate required fields
    if (!guardId || !visitorName || !visitorPhone || !studentId || !reason || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Verify guard exists
    const guard = await Guard.findById(guardId);
    if (!guard) {
      return res.status(404).json({
        success: false,
        message: 'Guard not found',
        code: 'GUARD_NOT_FOUND'
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }

    // Create override request
    const overrideRequest = await OverrideRequest.create({
      guardId,
      studentId,
      visitorName,
      visitorPhone,
      reason,
      purpose,
      urgency,
      status: 'pending',
      requestedAt: new Date()
    });

    // Populate references for response
    await overrideRequest.populate('guardId', 'name email phone');
    await overrideRequest.populate('studentId', 'name email room rollNumber');

    // Send notification to wardens/admins
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('overrideRequestCreated', {
          requestId: overrideRequest._id,
          guardName: guard.name,
          studentName: student.name,
          visitorName,
          reason,
          urgency
        });
      }
    } catch (socketError) {
      console.error('Socket notification error:', socketError);
    }

    // Send email/notification to wardens
    try {
      await notificationService.notifyOverrideRequest(overrideRequest, guard, student);
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: 'Override request sent to admin. Please wait for approval.',
      code: 'OVERRIDE_REQUESTED',
      requestId: overrideRequest._id,
      request: overrideRequest
    });

  } catch (error) {
    console.error('Override request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request override',
      error: error.message
    });
  }
};

// Get pending override requests for warden
const getPendingOverrides = async (req, res) => {
  try {
    const overrides = await OverrideRequest.find({
      status: 'pending'
    })
      .populate('guardId', 'name email phone shift')
      .populate('studentId', 'name email room rollNumber')
      .sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      count: overrides.length,
      requests: overrides
    });
  } catch (error) {
    console.error('Get pending overrides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending overrides',
      error: error.message
    });
  }
};

// Process override request (approve/reject)
const processOverride = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, approvedBy, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        code: 'INVALID_STATUS'
      });
    }

    // Update override request
    const overrideRequest = await OverrideRequest.findByIdAndUpdate(
      requestId,
      {
        status,
        approvedBy,
        processedAt: new Date(),
        notes
      },
      { new: true }
    )
      .populate('guardId', 'name email phone')
      .populate('studentId', 'name email room');

    if (!overrideRequest) {
      return res.status(404).json({
        success: false,
        message: 'Override request not found',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    // If approved, create visit
    if (status === 'approved') {
      const visit = await Visit.create({
        visitorName: overrideRequest.visitorName,
        visitorPhone: overrideRequest.visitorPhone,
        studentId: overrideRequest.studentId,
        guardId: overrideRequest.guardId,
        purpose: overrideRequest.purpose,
        method: 'override',
        overrideRequestId: overrideRequest._id,
        status: 'active'
      });

      // Notify guard and student
      try {
        const io = req.app.get('io');
        if (io) {
          io.emit('overrideApproved', {
            requestId: overrideRequest._id,
            visitId: visit._id,
            guardName: overrideRequest.guardId.name,
            studentName: overrideRequest.studentId.name
          });
        }
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
      }

      return res.status(200).json({
        success: true,
        message: 'Override request approved and visit created',
        status: 'approved',
        overrideRequest,
        visit
      });
    }

    // If rejected, just update status
    res.status(200).json({
      success: true,
      message: 'Override request rejected',
      status: 'rejected',
      overrideRequest
    });

  } catch (error) {
    console.error('Process override error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process override request',
      error: error.message
    });
  }
};

// Get override history
const getOverrideHistory = async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const overrides = await OverrideRequest.find(query)
      .populate('guardId', 'name email phone')
      .populate('studentId', 'name email room')
      .sort({ requestedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await OverrideRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      count: overrides.length,
      history: overrides
    });
  } catch (error) {
    console.error('Get override history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch override history',
      error: error.message
    });
  }
};

module.exports = {
  requestOverride,
  getPendingOverrides,
  processOverride,
  getOverrideHistory
};
