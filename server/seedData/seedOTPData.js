const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Student = require('../models/StudentModel');
const Guard = require('../models/GuardModel');
const Warden = require('../models/Warden');
const Hostel = require('../models/Hostel');
const OTP = require('../models/OTPModel');
const Visit = require('../models/VisitModel');
const OverrideRequest = require('../models/OverrideRequestModel');
const AuditLog = require('../models/AuditLogModel');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DBURL);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing OTP system data...');
    await Guard.deleteMany({});
    await Warden.deleteMany({});
    await Hostel.deleteMany({});
    await OTP.deleteMany({});
    await Visit.deleteMany({});
    await OverrideRequest.deleteMany({});
    await AuditLog.deleteMany({});

    // Create hostel first
    console.log('Creating hostel...');
    const hostel = await Hostel.create({
      name: 'VJ Hostel',
      address: 'VNRVJIET Campus, Hyderabad',
      capacity: 500,
      currentOccupancy: 350,
      facilities: ['WiFi', 'Mess', 'Laundry', 'Recreation Room', 'Study Hall'],
      contactNumber: '+919876543210',
      isActive: true
    });
    console.log('Created hostel');

    // Create Guards
    console.log('Creating guards...');
    const guards = [
      {
        username: 'guard1',
        name: 'Rajesh Kumar',
        email: 'guard1@hostel.com',
        password: 'guard123',
        phone: '+919876543210',
        shift: 'morning',
        permissions: {
          canRequestOTP: true,
          canVerifyOTP: true,
          canCheckout: true,
          canOverride: false,
          canViewReports: true
        }
      },
      {
        username: 'guard2',
        name: 'Suresh Reddy',
        email: 'guard2@hostel.com',
        password: 'guard123',
        phone: '+919876543211',
        shift: 'evening',
        permissions: {
          canRequestOTP: true,
          canVerifyOTP: true,
          canCheckout: true,
          canOverride: false,
          canViewReports: true
        }
      },
      {
        username: 'guard3',
        name: 'Venkat Rao',
        email: 'guard3@hostel.com',
        password: 'guard123',
        phone: '+919876543212',
        shift: 'night',
        permissions: {
          canRequestOTP: true,
          canVerifyOTP: true,
          canCheckout: true,
          canOverride: true,
          canViewReports: true
        }
      }
    ];

    const createdGuards = await Guard.create(guards);
    console.log(`Created ${createdGuards.length} guards`);

    // Create Wardens
    console.log('Creating wardens...');
    const wardens = [
      {
        username: 'warden1',
        name: 'Dr. Priya Sharma',
        email: 'warden1@hostel.com',
        password_hash: await bcrypt.hash('warden123', 10),
        hostel_id: hostel._id,
        phone: '+919876543220',
        is_active: true
      },
      {
        username: 'warden2',
        name: 'Prof. Lakshmi Devi',
        email: 'warden2@hostel.com',
        password_hash: await bcrypt.hash('warden123', 10),
        hostel_id: hostel._id,
        phone: '+919876543221',
        is_active: true
      }
    ];

    const createdWardens = await Warden.create(wardens);
    console.log(`Created ${createdWardens.length} wardens`);

    // Update existing students with OTP-related fields
    console.log('Updating existing students with OTP fields...');
    const students = await Student.find({ is_active: true }).limit(10);
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      // Add room numbers if not present
      if (!student.room) {
        student.room = `${Math.floor(Math.random() * 12) + 1}${String(Math.floor(Math.random() * 39) + 1).padStart(2, '0')}`;
      }

      // Add sample whitelist and backup contacts
      student.whitelist = [
        {
          name: 'Parent',
          phone: student.parentMobileNumber || `+91987654${String(3230 + i).padStart(4, '0')}`
        }
      ];

      student.backupContacts = [
        {
          name: 'Emergency Contact',
          phone: `+91987654${String(3240 + i).padStart(4, '0')}`
        }
      ];

      student.autoApproveParents = Math.random() > 0.5;
      
      student.preferences = {
        allowVisitorsOutOfHours: Math.random() > 0.7,
        requirePhotoVerification: Math.random() > 0.3,
        maxVisitorsPerDay: Math.floor(Math.random() * 5) + 3
      };

      await student.save();
    }

    console.log(`Updated ${students.length} students with OTP fields`);

    console.log('\n=== SEED DATA SUMMARY ===');
    console.log(`Guards created: ${createdGuards.length}`);
    console.log(`Wardens created: ${createdWardens.length}`);
    console.log(`Students updated: ${students.length}`);
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Guards:');
    guards.forEach((guard, index) => {
      console.log(`  ${guard.username} / ${guard.password} (${guard.shift} shift)`);
    });
    
    console.log('\nWardens:');
    wardens.forEach((warden, index) => {
      console.log(`  ${warden.username} / warden123`);
    });

    console.log('\n=== SAMPLE STUDENT DATA ===');
    students.slice(0, 3).forEach(student => {
      console.log(`  ${student.name} (Room ${student.room})`);
      console.log(`    Email: ${student.email}`);
      console.log(`    Phone: ${student.phoneNumber}`);
      console.log(`    Whitelist: ${student.whitelist.map(w => w.name).join(', ')}`);
    });

    console.log('\nSeed data created successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
