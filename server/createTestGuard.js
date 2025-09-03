const mongoose = require('mongoose');
const Guard = require('./models/GuardModel');
require('dotenv').config();

async function createTestGuard() {
  try {
    await mongoose.connect(process.env.DBURL);
    console.log('Connected to MongoDB');

    // Check if guard3 exists
    const existingGuard = await Guard.findOne({ username: 'guard3' });
    
    if (existingGuard) {
      console.log('Guard3 already exists');
      console.log('Username:', existingGuard.username);
      console.log('Email:', existingGuard.email);
      console.log('Active:', existingGuard.isActive);
    } else {
      // Create new guard with known credentials
      const newGuard = new Guard({
        username: 'guard3',
        name: 'Test Guard 3',
        email: 'guard3@hostel.com',
        password: 'password123', // This will be hashed automatically
        phone: '9876543210',
        shift: 'morning',
        isActive: true,
        permissions: {
          canRequestOTP: true,
          canVerifyOTP: true,
          canCheckout: true,
          canOverride: false,
          canViewReports: false
        }
      });

      await newGuard.save();
      console.log('Test guard created successfully!');
      console.log('Username: guard3');
      console.log('Password: password123');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestGuard();
