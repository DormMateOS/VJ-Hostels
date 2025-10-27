const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Student = require('../models/StudentModel');
const Guard = require('../models/GuardModel');
const OTP = require('../models/OTPModel');
const Visit = require('../models/VisitModel');
const jwt = require('jsonwebtoken');

// Mock notification service
jest.mock('../services/notificationService', () => ({
  sendOTPNotification: jest.fn().mockResolvedValue({ fcmSent: true, smsSent: false })
}));

describe('OTP API Tests', () => {
  let guardToken;
  let testGuard;
  let testStudent;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.DBURL || 'mongodb://localhost:27017/hostel-otp-test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clear test data
    await Student.deleteMany({});
    await Guard.deleteMany({});
    await OTP.deleteMany({});
    await Visit.deleteMany({});

    // Create test guard
    testGuard = await Guard.create({
      username: 'testguard',
      name: 'Test Guard',
      email: 'guard@test.com',
      password: 'password123',
      phone: '+919876543210',
      shift: 'morning',
      permissions: {
        canRequestOTP: true,
        canVerifyOTP: true,
        canCheckout: true
      }
    });

    // Create test student
    testStudent = await Student.create({
      rollNumber: '21071A0501',
      username: 'teststudent',
      name: 'Test Student',
      email: 'student@vnrvjiet.in',
      password: 'password123',
      phoneNumber: '+919876543211',
      room: '101',
      is_active: true
    });

    // Generate guard token
    guardToken = jwt.sign(
      { id: testGuard._id, role: 'guard' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/otp/request', () => {
    it('should successfully request OTP for valid data', async () => {
      const otpData = {
        studentId: testStudent._id,
        visitorName: 'John Doe',
        visitorPhone: '+919876543212',
        guardId: testGuard._id,
        purpose: 'Family visit'
      };

      const response = await request(app)
        .post('/api/otp/request')
        .set('Authorization', `Bearer ${guardToken}`)
        .send(otpData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('OTP sent to student successfully');
      expect(response.body.otpId).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();

      // Verify OTP record was created
      const otpRecord = await OTP.findById(response.body.otpId);
      expect(otpRecord).toBeTruthy();
      expect(otpRecord.studentId.toString()).toBe(testStudent._id.toString());
      expect(otpRecord.visitorPhone).toBe('+919876543212');
      expect(otpRecord.used).toBe(false);
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/otp/request')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          studentId: testStudent._id,
          visitorName: 'John Doe'
          // Missing phone, guardId, purpose
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_FIELDS');
    });

    it('should return error for invalid phone number', async () => {
      const response = await request(app)
        .post('/api/otp/request')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          studentId: testStudent._id,
          visitorName: 'John Doe',
          visitorPhone: 'invalid-phone',
          guardId: testGuard._id,
          purpose: 'Family visit'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_PHONE');
    });

    it('should return error for non-existent student', async () => {
      const fakeStudentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post('/api/otp/request')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          studentId: fakeStudentId,
          visitorName: 'John Doe',
          visitorPhone: '+919876543212',
          guardId: testGuard._id,
          purpose: 'Family visit'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('STUDENT_NOT_FOUND');
    });

    it('should handle whitelisted visitor (pre-approved)', async () => {
      // Add visitor to whitelist
      await Student.findByIdAndUpdate(testStudent._id, {
        whitelist: [{
          name: 'John Doe',
          phone: '+919876543212'
        }]
      });

      const response = await request(app)
        .post('/api/otp/request')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          studentId: testStudent._id,
          visitorName: 'John Doe',
          visitorPhone: '+919876543212',
          guardId: testGuard._id,
          purpose: 'Family visit'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.code).toBe('PRE_APPROVED');
      expect(response.body.visit).toBeDefined();

      // Verify visit was created
      const visit = await Visit.findById(response.body.visit._id);
      expect(visit.method).toBe('preapproved');
    });
  });

  describe('POST /api/otp/verify', () => {
    let otpRecord;
    const testOTP = '123456';

    beforeEach(async () => {
      // Create OTP record for testing
      const OTPUtils = require('../utils/otpUtils');
      const otpHash = await OTPUtils.hashOTP(testOTP, '+919876543212');
      
      otpRecord = await OTP.create({
        studentId: testStudent._id,
        visitorPhone: '+919876543212',
        visitorName: 'John Doe',
        otpHash,
        purpose: 'Family visit',
        createdByGuardId: testGuard._id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      });
    });

    it('should successfully verify valid OTP', async () => {
      const response = await request(app)
        .post('/api/otp/verify')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          visitorPhone: '+919876543212',
          providedOtp: testOTP,
          guardId: testGuard._id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('OTP verified successfully. Entry granted.');
      expect(response.body.visit).toBeDefined();
      expect(response.body.student).toBeDefined();

      // Verify OTP was marked as used
      const updatedOTP = await OTP.findById(otpRecord._id);
      expect(updatedOTP.used).toBe(true);

      // Verify visit was created
      const visit = await Visit.findById(response.body.visit._id);
      expect(visit.method).toBe('otp');
      expect(visit.otpId.toString()).toBe(otpRecord._id.toString());
    });

    it('should return error for invalid OTP', async () => {
      const response = await request(app)
        .post('/api/otp/verify')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          visitorPhone: '+919876543212',
          providedOtp: '999999', // Wrong OTP
          guardId: testGuard._id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('OTP_INVALID');
      expect(response.body.attemptsRemaining).toBeDefined();

      // Verify attempts were incremented
      const updatedOTP = await OTP.findById(otpRecord._id);
      expect(updatedOTP.attempts).toBe(1);
    });

    it('should return error for expired OTP', async () => {
      // Update OTP to be expired
      await OTP.findByIdAndUpdate(otpRecord._id, {
        expiresAt: new Date(Date.now() - 1000) // 1 second ago
      });

      const response = await request(app)
        .post('/api/otp/verify')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          visitorPhone: '+919876543212',
          providedOtp: testOTP,
          guardId: testGuard._id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('OTP_EXPIRED');
    });

    it('should return error for non-existent OTP', async () => {
      const response = await request(app)
        .post('/api/otp/verify')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          visitorPhone: '+919999999999', // Different phone
          providedOtp: testOTP,
          guardId: testGuard._id
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('OTP_NOT_FOUND');
    });
  });

  describe('POST /api/otp/visits/:visitId/checkout', () => {
    let testVisit;

    beforeEach(async () => {
      testVisit = await Visit.create({
        visitorName: 'John Doe',
        visitorPhone: '+919876543212',
        studentId: testStudent._id,
        guardId: testGuard._id,
        purpose: 'Family visit',
        method: 'otp'
      });
    });

    it('should successfully checkout visitor', async () => {
      const response = await request(app)
        .post(`/api/otp/visits/${testVisit._id}/checkout`)
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          guardId: testGuard._id,
          notes: 'Normal checkout'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Visitor checked out successfully');
      expect(response.body.visit.exitAt).toBeDefined();
      expect(response.body.visit.status).toBe('completed');

      // Verify visit was updated
      const updatedVisit = await Visit.findById(testVisit._id);
      expect(updatedVisit.exitAt).toBeTruthy();
      expect(updatedVisit.status).toBe('completed');
    });

    it('should return error for already checked out visit', async () => {
      // First checkout
      await Visit.findByIdAndUpdate(testVisit._id, {
        exitAt: new Date(),
        status: 'completed'
      });

      const response = await request(app)
        .post(`/api/otp/visits/${testVisit._id}/checkout`)
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          guardId: testGuard._id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ALREADY_CHECKED_OUT');
    });

    it('should return error for non-existent visit', async () => {
      const fakeVisitId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/otp/visits/${fakeVisitId}/checkout`)
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          guardId: testGuard._id
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VISIT_NOT_FOUND');
    });
  });

  describe('GET /api/otp/visits/active', () => {
    beforeEach(async () => {
      // Create some test visits
      await Visit.create([
        {
          visitorName: 'John Doe',
          visitorPhone: '+919876543212',
          studentId: testStudent._id,
          guardId: testGuard._id,
          purpose: 'Family visit',
          method: 'otp',
          status: 'active'
        },
        {
          visitorName: 'Jane Smith',
          visitorPhone: '+919876543213',
          studentId: testStudent._id,
          guardId: testGuard._id,
          purpose: 'Academic discussion',
          method: 'preapproved',
          status: 'active'
        },
        {
          visitorName: 'Bob Johnson',
          visitorPhone: '+919876543214',
          studentId: testStudent._id,
          guardId: testGuard._id,
          purpose: 'Personal visit',
          method: 'otp',
          status: 'completed',
          exitAt: new Date()
        }
      ]);
    });

    it('should return active visits', async () => {
      const response = await request(app)
        .get('/api/otp/visits/active')
        .set('Authorization', `Bearer ${guardToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.visits).toHaveLength(2); // Only active visits
      expect(response.body.visits.every(visit => visit.status === 'active')).toBe(true);
    });

    it('should filter by guard ID', async () => {
      const response = await request(app)
        .get(`/api/otp/visits/active?guardId=${testGuard._id}`)
        .set('Authorization', `Bearer ${guardToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.visits).toHaveLength(2);
    });
  });
});
