const exp = require('express');
const outpassApp = exp.Router();
const Outpass = require('../models/OutpassModel');
const expressAsyncHandler = require('express-async-handler');
const crypto = require('crypto');
const verifyAdmin = require('../middleware/verifyAdminMiddleware');
const verifyStudent = require('../middleware/verifyStudentMiddleware');

// Generate unique QR code data
function generateQRCode(outpassId, studentId) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${outpassId}-${studentId}-${timestamp}-${randomString}`;
}

// Admin approves an outpass
outpassApp.put('/approve/:id', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { adminName } = req.body; // Admin's name from the request

        const outpass = await Outpass.findById(id);
        if (!outpass) {
            return res.status(404).json({ message: "Outpass not found" });
        }

        if (outpass.status !== 'pending') {
            return res.status(400).json({ message: "Outpass is not in pending status" });
        }

        // Generate QR code data
        const qrCodeData = generateQRCode(outpass._id, outpass.rollNumber);

        // Update outpass status
        outpass.status = 'approved';
        outpass.qrCodeData = qrCodeData;
        outpass.approvedBy = adminName || 'Admin';
        outpass.approvedAt = new Date();

        await outpass.save();

        res.status(200).json({ 
            message: "Outpass approved successfully", 
            outpass 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Admin rejects an outpass
outpassApp.put('/reject/:id', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { adminName } = req.body;

        const outpass = await Outpass.findById(id);
        if (!outpass) {
            return res.status(404).json({ message: "Outpass not found" });
        }

        if (outpass.status !== 'pending') {
            return res.status(400).json({ message: "Outpass is not in pending status" });
        }

        outpass.status = 'rejected';
        outpass.approvedBy = adminName || 'Admin';
        outpass.approvedAt = new Date();

        await outpass.save();

        res.status(200).json({ 
            message: "Outpass rejected successfully", 
            outpass 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get approved outpasses for a student (Current Passes)
outpassApp.get('/current-passes/:rollNumber', verifyStudent, expressAsyncHandler(async (req, res) => {
    try {
        const { rollNumber } = req.params;

        // Get approved outpasses that are not yet returned
        const currentPasses = await Outpass.find({ 
            rollNumber,
            status: { $in: ['approved', 'out'] }
        }).sort({ approvedAt: -1 });

        res.status(200).json({ currentPasses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get outpass history (returned or rejected)
outpassApp.get('/history/:rollNumber', verifyStudent, expressAsyncHandler(async (req, res) => {
    try {
        const { rollNumber } = req.params;

        const history = await Outpass.find({ 
            rollNumber,
            status: { $in: ['returned', 'rejected'] }
        }).sort({ createdAt: -1 });

        res.status(200).json({ history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Security scan QR code - Mark as OUT
outpassApp.post('/scan/out', expressAsyncHandler(async (req, res) => {
    try {
        const { qrCodeData } = req.body;

        if (!qrCodeData) {
            return res.status(400).json({ message: "QR code data is required" });
        }

        const outpass = await Outpass.findOne({ qrCodeData });
        if (!outpass) {
            return res.status(404).json({ message: "Invalid QR code" });
        }

        if (outpass.status !== 'approved') {
            return res.status(400).json({ 
                message: `Cannot scan out. Current status: ${outpass.status}` 
            });
        }

        // Update status to 'out'
        outpass.status = 'out';
        outpass.actualOutTime = new Date();
        await outpass.save();

        res.status(200).json({ 
            message: "Student checked out successfully", 
            outpass,
            student: {
                name: outpass.name,
                rollNumber: outpass.rollNumber,
                outTime: outpass.actualOutTime
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Security scan QR code - Mark as RETURNED
outpassApp.post('/scan/in', expressAsyncHandler(async (req, res) => {
    try {
        const { qrCodeData } = req.body;

        if (!qrCodeData) {
            return res.status(400).json({ message: "QR code data is required" });
        }

        const outpass = await Outpass.findOne({ qrCodeData });
        if (!outpass) {
            return res.status(404).json({ message: "Invalid QR code" });
        }

        if (outpass.status !== 'out') {
            return res.status(400).json({ 
                message: `Cannot scan in. Current status: ${outpass.status}` 
            });
        }

        // Update status to 'returned'
        outpass.status = 'returned';
        outpass.actualInTime = new Date();
        await outpass.save();

        res.status(200).json({ 
            message: "Student checked in successfully", 
            outpass,
            student: {
                name: outpass.name,
                rollNumber: outpass.rollNumber,
                inTime: outpass.actualInTime
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get outpass details by QR code (for verification)
outpassApp.post('/verify-qr', expressAsyncHandler(async (req, res) => {
    try {
        const { qrCodeData } = req.body;

        if (!qrCodeData) {
            return res.status(400).json({ message: "QR code data is required" });
        }

        const outpass = await Outpass.findOne({ qrCodeData });
        if (!outpass) {
            return res.status(404).json({ message: "Invalid QR code" });
        }

        res.status(200).json({ 
            valid: true,
            outpass: {
                name: outpass.name,
                rollNumber: outpass.rollNumber,
                status: outpass.status,
                outTime: outpass.outTime,
                inTime: outpass.inTime,
                reason: outpass.reason,
                type: outpass.type,
                actualOutTime: outpass.actualOutTime,
                actualInTime: outpass.actualInTime
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get all active outpasses (for security dashboard)
outpassApp.get('/active-passes', expressAsyncHandler(async (req, res) => {
    try {
        const activePasses = await Outpass.find({ 
            status: { $in: ['approved', 'out'] }
        }).sort({ approvedAt: -1 });

        res.status(200).json({ activePasses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get security dashboard statistics
outpassApp.get('/security-stats', expressAsyncHandler(async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const approvedCount = await Outpass.countDocuments({ status: 'approved' });
        const outCount = await Outpass.countDocuments({ status: 'out' });
        const returnedTodayCount = await Outpass.countDocuments({ 
            status: 'returned',
            actualInTime: { $gte: today }
        });

        const recentActivity = await Outpass.find({
            $or: [
                { actualOutTime: { $gte: today } },
                { actualInTime: { $gte: today } }
            ]
        }).sort({ updatedAt: -1 }).limit(10);

        res.status(200).json({
            approvedCount,
            outCount,
            returnedTodayCount,
            recentActivity
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

module.exports = outpassApp;
