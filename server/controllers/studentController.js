const Student = require('../models/StudentModel');
const Visit = require('../models/VisitModel');
const AuditLog = require('../models/AuditLogModel');

class StudentController {
  // Get student preferences
  static async getPreferences(req, res) {
    try {
      const { studentId } = req.params;

      const student = await Student.findById(studentId).select('backupContacts whitelist autoApproveParents preferences');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        preferences: {
          backupContacts: student.backupContacts || [],
          whitelist: student.whitelist || [],
          autoApproveParents: student.autoApproveParents,
          ...student.preferences
        }
      });

    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Update student preferences
  static async updatePreferences(req, res) {
    try {
      const { studentId } = req.params;
      const { backupContacts, whitelist, autoApproveParents, preferences } = req.body;

      const student = await Student.findById(studentId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Update fields if provided
      const updateData = {};
      if (backupContacts !== undefined) updateData.backupContacts = backupContacts;
      if (whitelist !== undefined) updateData.whitelist = whitelist;
      if (autoApproveParents !== undefined) updateData.autoApproveParents = autoApproveParents;
      if (preferences !== undefined) updateData.preferences = { ...student.preferences, ...preferences };

      const updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        updateData,
        { new: true }
      ).select('backupContacts whitelist autoApproveParents preferences');

      // Log the action
      await AuditLog.create({
        action: 'student_preferences_updated',
        actorId: studentId,
        actorType: 'student',
        targetId: studentId,
        targetType: 'student',
        meta: {
          updatedFields: Object.keys(updateData)
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: {
          backupContacts: updatedStudent.backupContacts || [],
          whitelist: updatedStudent.whitelist || [],
          autoApproveParents: updatedStudent.autoApproveParents,
          ...updatedStudent.preferences
        }
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Get student's visit history
  static async getVisitHistory(req, res) {
    try {
      const { studentId } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      const query = { studentId };
      if (status) query.status = status;

      const skip = (page - 1) * limit;

      const visits = await Visit.find(query)
        .populate('guardId', 'name username')
        .sort({ entryAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Visit.countDocuments(query);

      res.json({
        success: true,
        visits,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get visit history error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Search students (for guards)
  static async searchStudents(req, res) {
    try {
      const { query, room, limit = 10 } = req.query;

      if (!query && !room) {
        return res.status(400).json({
          success: false,
          message: 'Search query or room number is required',
          code: 'MISSING_SEARCH_PARAMS'
        });
      }

      const searchQuery = { is_active: true };

      if (room) {
        searchQuery.room = new RegExp(room, 'i');
      }

      if (query) {
        searchQuery.$or = [
          { name: new RegExp(query, 'i') },
          { rollNumber: new RegExp(query, 'i') },
          { phoneNumber: new RegExp(query, 'i') }
        ];
      }

      const students = await Student.find(searchQuery)
        .select('name rollNumber room phoneNumber email')
        .limit(parseInt(limit))
        .sort({ name: 1 });

      res.json({
        success: true,
        students
      });

    } catch (error) {
      console.error('Search students error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Update FCM token
  static async updateFCMToken(req, res) {
    try {
      const { studentId } = req.params;
      const { fcmToken } = req.body;

      if (!fcmToken) {
        return res.status(400).json({
          success: false,
          message: 'FCM token is required',
          code: 'MISSING_FCM_TOKEN'
        });
      }

      await Student.findByIdAndUpdate(studentId, { fcmToken });

      res.json({
        success: true,
        message: 'FCM token updated successfully'
      });

    } catch (error) {
      console.error('Update FCM token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }
}

module.exports = StudentController;
