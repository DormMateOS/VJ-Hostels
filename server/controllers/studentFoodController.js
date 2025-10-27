const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');

// MongoDB models
const Student = require('../models/StudentModel');
const FoodPause = require('../models/FoodPause');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const googleOAuth = asyncHandler(async (req, res) => {
    const { credential } = req.body;
    
    if (!credential) {
        return res.status(400).json({ error: 'Missing credential' });
    }

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) {
        return res.status(401).json({ error: 'No email in Google token' });
    }

    const student = await Student.findOne({ email });

    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ 
        studentId: student._id, 
        rollNumber: student.roll_number 
    });
});

const getStudentsByHostel = asyncHandler(async (req, res) => {
    const { hostelId } = req.params;
    
    if (!hostelId) {
        return res.status(400).json({ error: 'Hostel ID is required' });
    }

    // Get students for the specified hostel
    const students = await Student.find({ hostel_id: hostelId }).sort({ name: 1 });
    
    // Get pause status for each student
    const studentsWithStatus = await Promise.all(students.map(async (student) => {
        const currentDate = new Date().toISOString().slice(0, 10);
        
        const pause = await FoodPause.findOne({
            student_id: student._id,
            pause_from: { $lte: currentDate },
            $or: [
                { resume_from: null },
                { resume_from: { $gt: currentDate } }
            ]
        });

        return {
            id: student._id,
            name: student.name,
            roll_number: student.roll_number,
            email: student.email,
            hostel_id: student.hostel_id,
            year: student.year,
            degree: student.degree,
            status: pause ? 'paused' : 'active',
            pause_until: pause?.resume_from || null,
            pause_meals: pause?.pause_meals || null
        };
    }));

    // Get hostel information (assuming hostel model exists)
    const Hostel = require('../models/Hostel');
    const hostel = await Hostel.findById(hostelId).populate('warden_id');

    res.json({
        success: true,
        students: studentsWithStatus,
        hostel: hostel ? {
            hostel_name: hostel.name,
            warden_name: hostel.warden_id?.name || 'Unknown Warden'
        } : { hostel_name: 'Unknown Hostel', warden_name: 'Unknown Warden' },
        total: studentsWithStatus.length,
        active: studentsWithStatus.filter(s => s.status === 'active').length,
        paused: studentsWithStatus.filter(s => s.status === 'paused').length
    });
});

module.exports = {
    googleOAuth,
    getStudentsByHostel
};
