const BarcodeScanlogs = require('../models/BarcodeScanlogs');
const Student = require('../models/StudentModel');
const expressAsyncHandler = require('express-async-handler');

// Record multiple barcode scans in batch
exports.recordScans = expressAsyncHandler(async (req, res) => {
  try {
    const { scans } = req.body;
    const guardId = req.user.id; // From auth middleware
    const sessionId = `${guardId}-${Date.now()}`;

    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No scans provided' 
      });
    }

    // Create bulk scan records
    const scanRecords = scans.map(scan => ({
      rollNumber: scan.rollNumber,
      year: scan.year,
      deptCode: scan.deptCode,
      deptName: scan.deptName,
      entry: scan.entry || 'Unknown',
      scannedAt: new Date(scan.scannedAt),
      scannedBy: guardId,
      sessionId,
      isVerified: false
    }));

    const inserted = await BarcodeScanlogs.insertMany(scanRecords);

    // Also try to update student last seen timestamp if needed
    const rollNumbers = scans.map(s => s.rollNumber);
    await Student.updateMany(
      { rollNumber: { $in: rollNumbers } },
      { lastSeenAt: new Date() }
    ).catch(err => console.log('Optional student update failed:', err));

    res.status(201).json({
      success: true,
      message: `Successfully recorded ${inserted.length} scans`,
      count: inserted.length,
      sessionId
    });
  } catch (error) {
    console.error('Error recording scans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record scans',
      error: error.message
    });
  }
});

// Get scan summary for a date range
exports.getScanSummary = expressAsyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, deptCode, year } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.scannedAt = {};
      if (startDate) query.scannedAt.$gte = new Date(startDate);
      if (endDate) query.scannedAt.$lte = new Date(endDate);
    }
    if (deptCode) query.deptCode = deptCode;
    if (year) query.year = year;

    const scans = await BarcodeScanlogs.find(query)
      .populate('scannedBy', 'name username shift')
      .sort({ scannedAt: -1 })
      .limit(1000);

    // Aggregate by department and year
    const aggregated = {
      totalScans: scans.length,
      byYear: {},
      byDept: {},
      byGuard: {},
      timelineData: []
    };

    scans.forEach(scan => {
      // By Year
      if (!aggregated.byYear[scan.year]) {
        aggregated.byYear[scan.year] = {
          count: 0,
          students: new Set(),
          depts: {}
        };
      }
      aggregated.byYear[scan.year].count++;
      aggregated.byYear[scan.year].students.add(scan.rollNumber);

      // By Department
      const deptKey = `${scan.year}-${scan.deptCode}`;
      if (!aggregated.byDept[deptKey]) {
        aggregated.byDept[deptKey] = {
          year: scan.year,
          deptCode: scan.deptCode,
          deptName: scan.deptName,
          count: 0,
          uniqueStudents: new Set()
        };
      }
      aggregated.byDept[deptKey].count++;
      aggregated.byDept[deptKey].uniqueStudents.add(scan.rollNumber);

      // By Guard
      if (scan.scannedBy) {
        const guardKey = scan.scannedBy._id.toString();
        if (!aggregated.byGuard[guardKey]) {
          aggregated.byGuard[guardKey] = {
            name: scan.scannedBy.name,
            username: scan.scannedBy.username,
            shift: scan.scannedBy.shift,
            scans: 0
          };
        }
        aggregated.byGuard[guardKey].scans++;
      }
    });

    // Convert Sets to counts
    Object.keys(aggregated.byYear).forEach(year => {
      aggregated.byYear[year].uniqueStudents = aggregated.byYear[year].students.size;
      delete aggregated.byYear[year].students;
    });

    Object.keys(aggregated.byDept).forEach(key => {
      aggregated.byDept[key].uniqueStudents = aggregated.byDept[key].uniqueStudents.size;
    });

    res.status(200).json({
      success: true,
      data: aggregated,
      scanDetails: scans
    });
  } catch (error) {
    console.error('Error getting scan summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scan summary',
      error: error.message
    });
  }
});

// Get individual scan history
exports.getScanHistory = expressAsyncHandler(async (req, res) => {
  try {
    const { rollNumber, limit = 50, offset = 0 } = req.query;

    const query = rollNumber ? { rollNumber } : {};
    
    const scans = await BarcodeScanlogs.find(query)
      .populate('scannedBy', 'name username')
      .sort({ scannedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await BarcodeScanlogs.countDocuments(query);

    res.status(200).json({
      success: true,
      data: scans,
      pagination: {
        total,
        offset: parseInt(offset),
        limit: parseInt(limit),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error getting scan history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scan history',
      error: error.message
    });
  }
});

// Verify a student by roll number
exports.verifyStudent = expressAsyncHandler(async (req, res) => {
  try {
    const { rollNumber } = req.body;

    const student = await Student.findOne({ rollNumber });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get recent scans for this student
    const recentScans = await BarcodeScanlogs.find({ rollNumber })
      .sort({ scannedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      student: {
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
        phone: student.phoneNumber
      },
      recentScans,
      lastScannedAt: recentScans.length > 0 ? recentScans[0].scannedAt : null
    });
  } catch (error) {
    console.error('Error verifying student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify student',
      error: error.message
    });
  }
});

// Clear/delete scans (admin only)
exports.deleteScans = expressAsyncHandler(async (req, res) => {
  try {
    const { sessionId, rollNumber, dateRange } = req.body;

    let query = {};
    if (sessionId) {
      query.sessionId = sessionId;
    } else if (rollNumber) {
      query.rollNumber = rollNumber;
    } else if (dateRange) {
      query.scannedAt = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide sessionId, rollNumber, or dateRange'
      });
    }

    const result = await BarcodeScanlogs.deleteMany(query);

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} scan records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting scans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scans',
      error: error.message
    });
  }
});

// Export scans to CSV/JSON
exports.exportScans = expressAsyncHandler(async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.scannedAt = {};
      if (startDate) query.scannedAt.$gte = new Date(startDate);
      if (endDate) query.scannedAt.$lte = new Date(endDate);
    }

    const scans = await BarcodeScanlogs.find(query)
      .populate('scannedBy', 'name username shift')
      .sort({ scannedAt: -1 });

    if (format === 'csv') {
      // Convert to CSV
      const csv = [
        ['Roll Number', 'Year', 'Department', 'Entry Type', 'Scanned At', 'Scanned By'].join(',')
      ];

      scans.forEach(scan => {
        csv.push([
          scan.rollNumber,
          scan.year,
          scan.deptName,
          scan.entry,
          new Date(scan.scannedAt).toLocaleString(),
          scan.scannedBy?.name || 'Unknown'
        ].join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="barcode-scans.csv"');
      res.send(csv.join('\n'));
    } else {
      // JSON format
      res.status(200).json({
        success: true,
        count: scans.length,
        data: scans
      });
    }
  } catch (error) {
    console.error('Error exporting scans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export scans',
      error: error.message
    });
  }
});
