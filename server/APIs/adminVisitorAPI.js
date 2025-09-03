const express = require('express');
const router = express.Router();
const Visit = require('../models/VisitModel');
const OTP = require('../models/OTPModel');
const Student = require('../models/StudentModel');
const { authenticateAdmin } = require('../middleware/authMiddleware');

// Get active visitors
router.get('/active', authenticateAdmin, async (req, res) => {
  try {
    const activeVisits = await Visit.find({ 
      exitAt: null 
    })
    .populate('studentId', 'name email')
    .populate('otpId', 'visitorName visitorPhone purpose isGroupOTP groupSize')
    .sort({ entryAt: -1 });

    const visitors = activeVisits.map(visit => ({
      _id: visit._id,
      visitorName: visit.visitorName || visit.otpId?.visitorName || 'Unknown',
      visitorPhone: visit.visitorPhone || visit.otpId?.visitorPhone,
      studentName: visit.studentId?.name || 'Unknown',
      purpose: visit.purpose || visit.otpId?.purpose || 'Not specified',
      entryTime: visit.entryAt,
      isGroupVisit: visit.isGroupVisit || visit.otpId?.isGroupOTP || false,
      groupSize: visit.groupVisitors?.length || visit.otpId?.groupSize || 1
    }));

    res.json({
      success: true,
      visitors,
      count: visitors.length
    });
  } catch (error) {
    console.error('Error fetching active visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active visitors'
    });
  }
});

// Get visit history
router.get('/history', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.entryAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const visits = await Visit.find(dateFilter)
      .populate('studentId', 'name email')
      .populate('otpId', 'visitorName visitorPhone purpose isGroupOTP groupSize')
      .sort({ entryAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalVisits = await Visit.countDocuments(dateFilter);

    const visitHistory = visits.map(visit => ({
      _id: visit._id,
      visitorName: visit.visitorName || visit.otpId?.visitorName || 'Unknown',
      visitorPhone: visit.visitorPhone || visit.otpId?.visitorPhone,
      studentName: visit.studentId?.name || 'Unknown',
      purpose: visit.purpose || visit.otpId?.purpose || 'Not specified',
      entryTime: visit.entryAt,
      exitTime: visit.exitAt,
      isGroupVisit: visit.isGroupVisit || visit.otpId?.isGroupOTP || false,
      groupSize: visit.groupVisitors?.length || visit.otpId?.groupSize || 1
    }));

    res.json({
      success: true,
      visits: visitHistory,
      pagination: {
        current: page,
        total: Math.ceil(totalVisits / limit),
        count: visitHistory.length,
        totalRecords: totalVisits
      }
    });
  } catch (error) {
    console.error('Error fetching visit history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visit history'
    });
  }
});

// Get visitor statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total visitors (all time)
    const totalVisitors = await Visit.countDocuments();

    // Active visitors (no exit time)
    const activeVisitors = await Visit.countDocuments({ exitAt: null });

    // Today's visitors
    const todayVisitors = await Visit.countDocuments({
      entryAt: { $gte: today }
    });

    // This week's visitors
    const thisWeekVisitors = await Visit.countDocuments({
      entryAt: { $gte: weekAgo }
    });

    // Additional stats
    const avgVisitDuration = await Visit.aggregate([
      {
        $match: { 
          exitAt: { $ne: null },
          entryAt: { $gte: weekAgo }
        }
      },
      {
        $project: {
          duration: { 
            $subtract: ['$exitAt', '$entryAt'] 
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Peak hours analysis
    const peakHours = await Visit.aggregate([
      {
        $match: {
          entryAt: { $gte: weekAgo }
        }
      },
      {
        $project: {
          hour: { $hour: '$entryAt' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 3
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalVisitors,
        activeVisitors,
        todayVisitors,
        thisWeekVisitors,
        avgVisitDurationMs: avgVisitDuration[0]?.avgDuration || 0,
        peakHours: peakHours.map(h => ({
          hour: h._id,
          count: h.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching visitor statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visitor statistics'
    });
  }
});

// Get detailed visit information
router.get('/visit/:visitId', authenticateAdmin, async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await Visit.findById(visitId)
      .populate('studentId', 'name email phone room')
      .populate('otpId', 'visitorName visitorPhone purpose isGroupOTP groupSize createdAt expiresAt');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    const visitDetails = {
      _id: visit._id,
      visitorName: visit.otpId?.visitorName || 'Unknown',
      visitorPhone: visit.otpId?.visitorPhone,
      purpose: visit.otpId?.purpose || 'Not specified',
      entryTime: visit.entryTime,
      exitTime: visit.exitTime,
      isGroupVisit: visit.otpId?.isGroupOTP || false,
      groupSize: visit.otpId?.groupSize || 1,
      student: {
        name: visit.studentId?.name || 'Unknown',
        email: visit.studentId?.email,
        phone: visit.studentId?.phone,
        room: visit.studentId?.room
      },
      otp: {
        createdAt: visit.otpId?.createdAt,
        expiresAt: visit.otpId?.expiresAt
      }
    };

    res.json({
      success: true,
      visit: visitDetails
    });
  } catch (error) {
    console.error('Error fetching visit details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visit details'
    });
  }
});

// Export visitor data (CSV format)
router.get('/export', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.entryTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const visits = await Visit.find(dateFilter)
      .populate('studentId', 'name email')
      .populate('otpId', 'visitorName visitorPhone purpose isGroupOTP groupSize')
      .sort({ entryTime: -1 });

    if (format === 'csv') {
      const csvHeader = 'Visitor Name,Student Name,Purpose,Entry Time,Exit Time,Duration (minutes),Group Visit,Group Size\n';
      
      const csvData = visits.map(visit => {
        const duration = visit.exitTime 
          ? Math.round((visit.exitTime - visit.entryTime) / (1000 * 60))
          : 'Ongoing';
        
        return [
          visit.otpId?.visitorName || 'Unknown',
          visit.studentId?.name || 'Unknown',
          visit.otpId?.purpose || 'Not specified',
          visit.entryTime?.toISOString(),
          visit.exitTime?.toISOString() || '',
          duration,
          visit.otpId?.isGroupOTP ? 'Yes' : 'No',
          visit.otpId?.groupSize || 1
        ].join(',');
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=visitor-data-${Date.now()}.csv`);
      res.send(csvHeader + csvData);
    } else {
      res.json({
        success: true,
        visits: visits.map(visit => ({
          visitorName: visit.otpId?.visitorName || 'Unknown',
          studentName: visit.studentId?.name || 'Unknown',
          purpose: visit.otpId?.purpose || 'Not specified',
          entryTime: visit.entryTime,
          exitTime: visit.exitTime,
          isGroupVisit: visit.otpId?.isGroupOTP || false,
          groupSize: visit.otpId?.groupSize || 1
        }))
      });
    }
  } catch (error) {
    console.error('Error exporting visitor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export visitor data'
    });
  }
});

// Get visitors by specific date
router.get('/by-date', authenticateAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const visits = await Visit.find({
      entryAt: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('studentId', 'name email room')
    .populate('otpId', 'visitorName visitorPhone purpose isGroupOTP groupSize')
    .sort({ entryAt: -1 });

    const visitors = visits.map(visit => ({
      _id: visit._id,
      visitorName: visit.visitorName || visit.otpId?.visitorName || 'Unknown',
      visitorPhone: visit.visitorPhone || visit.otpId?.visitorPhone,
      studentName: visit.studentId?.name || 'Unknown',
      studentRoom: visit.studentId?.room,
      purpose: visit.purpose || visit.otpId?.purpose || 'Not specified',
      entryTime: visit.entryAt,
      exitTime: visit.exitAt,
      isGroupVisit: visit.isGroupVisit || visit.otpId?.isGroupOTP || false,
      groupSize: visit.groupVisitors?.length || visit.otpId?.groupSize || 1,
      groupVisitors: visit.groupVisitors || [],
      status: visit.exitAt ? 'completed' : 'active',
      method: visit.method,
      notes: visit.notes
    }));

    res.json({
      success: true,
      visitors,
      date: selectedDate,
      count: visitors.length
    });
  } catch (error) {
    console.error('Error fetching visitors by date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visitors for selected date'
    });
  }
});

module.exports = router;
