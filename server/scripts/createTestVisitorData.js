const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Visit = require('../models/VisitModel');
const Student = require('../models/StudentModel');
const OTP = require('../models/OTPModel');

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DBURL || 'mongodb://localhost:27017/hostel-management');
    console.log('Connected to MongoDB');

    // Find a student to use for test data
    const student = await Student.findOne();
    if (!student) {
      console.log('No students found in database');
      return;
    }

    console.log('Using student:', student.name);

    // Create test OTP
    const testOTP = new OTP({
      studentId: student._id,
      visitorName: 'John Doe',
      visitorPhone: '+919876543210',
      otpHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789',
      otpValue: '123456',
      purpose: 'Meeting',
      isGroupOTP: false,
      groupSize: 1,
      createdByGuardId: student._id, // Using student ID as placeholder
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      status: 'used'
    });

    await testOTP.save();
    console.log('Created test OTP');

    // Create active visit
    const activeVisit = new Visit({
      visitorName: 'John Doe',
      visitorPhone: '+919876543210',
      studentId: student._id,
      guardId: student._id, // Using student ID as placeholder for guard
      entryAt: new Date(),
      exitAt: null,
      method: 'otp',
      purpose: 'Meeting',
      otpId: testOTP._id,
      isGroupVisit: false,
      status: 'active'
    });

    await activeVisit.save();
    console.log('Created active visit');

    // Create completed visit
    const completedVisit = new Visit({
      visitorName: 'Jane Smith',
      visitorPhone: '+919876543211',
      studentId: student._id,
      guardId: student._id,
      entryAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      exitAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      method: 'otp',
      purpose: 'Personal Visit',
      isGroupVisit: false,
      status: 'completed'
    });

    await completedVisit.save();
    console.log('Created completed visit');

    // Create group visit
    const groupVisit = new Visit({
      visitorName: 'Mike Johnson',
      visitorPhone: '+919876543212',
      studentId: student._id,
      guardId: student._id,
      entryAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      exitAt: null,
      method: 'otp',
      purpose: 'Group Study',
      isGroupVisit: true,
      groupVisitors: [
        { name: 'Mike Johnson', phone: '+919876543212', idVerified: true },
        { name: 'Sarah Wilson', phone: '+919876543213', idVerified: true },
        { name: 'Tom Brown', phone: '+919876543214', idVerified: false }
      ],
      status: 'active'
    });

    await groupVisit.save();
    console.log('Created group visit');

    console.log('Test data created successfully!');
    
    // Display summary
    const totalVisits = await Visit.countDocuments();
    const activeVisits = await Visit.countDocuments({ exitAt: null });
    
    console.log(`Total visits: ${totalVisits}`);
    console.log(`Active visits: ${activeVisits}`);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestData();
