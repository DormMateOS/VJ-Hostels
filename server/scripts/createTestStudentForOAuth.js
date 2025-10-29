const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('../models/StudentModel');

/**
 * Script to create a test student for OAuth testing
 * This student can be used to test the new unified OAuth flow
 */
async function createTestStudent() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DBURL);
        console.log('✅ Connected to MongoDB');

        // Test student data
        // Email: 21pa1a0501@vnrvjiet.in
        // Roll number extracted from email: 21pa1a0501
        const testStudent = {
            rollNumber: '21pa1a0501',
            username: 'teststudent',
            name: 'Test Student',
            email: '21pa1a0501@vnrvjiet.in',
            phoneNumber: '9876543210',
            parentMobileNumber: '9876543211',
            password: 'test123', // Will be hashed automatically
            role: 'student',
            is_active: true
        };

        // Check if student already exists
        const existingStudent = await Student.findOne({ 
            rollNumber: testStudent.rollNumber 
        });

        if (existingStudent) {
            console.log('⚠️  Student with roll number', testStudent.rollNumber, 'already exists');
            console.log('Existing student:', {
                id: existingStudent._id,
                rollNumber: existingStudent.rollNumber,
                email: existingStudent.email,
                name: existingStudent.name
            });
        } else {
            // Create new student
            const student = await Student.create(testStudent);
            console.log('✨ Test student created successfully!');
            console.log('Student details:', {
                id: student._id,
                rollNumber: student.rollNumber,
                email: student.email,
                name: student.name
            });
        }

        console.log('\n📝 Testing Instructions:');
        console.log('1. Navigate to the login page');
        console.log('2. Click "Continue with Google"');
        console.log('3. Use the email: 21pa1a0501@vnrvjiet.in');
        console.log('4. You should be logged in successfully as a student');

    } catch (error) {
        console.error('❌ Error creating test student:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    }
}

// Run the script
createTestStudent();
