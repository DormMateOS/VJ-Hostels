const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import the Student model
const Student = require('./models/StudentModel');

// Connect to MongoDB
mongoose.connect(process.env.DBURL)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if there are any students in the database
      const studentCount = await Student.countDocuments();
      console.log(`Found ${studentCount} students in the database`);
      
      if (studentCount === 0) {
        // Create a test student
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const testStudent = new Student({
          name: 'Test Student',
          rollNumber: 'S12345',
          branch: 'Computer Science',
          year: 3,
          profilePhoto: null,
          phoneNumber: '1234567890',
          email: 'test@example.com',
          password: hashedPassword,
          parentMobileNumber: '9876543210',
          roomNumber: 'A101',
          is_active: true
        });
        
        await testStudent.save();
        console.log('Test student created successfully');
        console.log('Login credentials:');
        console.log('Roll Number: S12345');
        console.log('Password: password123');
      } else {
        // List all students
        const students = await Student.find({}, 'name rollNumber email is_active');
        console.log('Students in the database:');
        students.forEach(student => {
          console.log(`- ${student.name} (${student.rollNumber}), Email: ${student.email}, Active: ${student.is_active}`);
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // Close the connection
      mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
