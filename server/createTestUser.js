const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Student = require('./models/StudentModel');
const Admin = require('./models/AdminModel');

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DBURL);
    console.log('Connected to MongoDB');

    // Check if test student exists
    const existingStudent = await Student.findOne({ rollNumber: 'S12345' });
    if (!existingStudent) {
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
      console.log('Student Login credentials:');
      console.log('Roll Number: S12345');
      console.log('Password: password123');
    } else {
      console.log('Test student already exists');
      console.log('Student Login credentials:');
      console.log('Roll Number: S12345');
      console.log('Password: password123');
    }

    // Check if test admin exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      // Create a test admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const testAdmin = new Admin({
        username: 'admin',
        password: hashedPassword,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      });
      
      await testAdmin.save();
      console.log('Test admin created successfully');
      console.log('Admin Login credentials:');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Test admin already exists');
      console.log('Admin Login credentials:');
      console.log('Username: admin');
      console.log('Password: admin123');
    }

    console.log('Test users setup complete');
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createTestUsers();
