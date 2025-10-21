const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  visitorPhone: {
    type: String,
    required: true,
    trim: true
  },
  visitorName: {
    type: String,
    required: true,
    trim: true
  },
  otpHash: {
    type: String,
    required: true
  },
  otpValue: {
    type: String,
    required: true,
    select: false // Don't include in regular queries for security
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  used: {
    type: Boolean,
    default: false
  },
  locked: {
    type: Boolean,
    default: false
  },
  createdByGuardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guard',
    required: function() {
      return !this.isStudentGenerated; // Only required if not student generated
    }
  },
  groupSize: {
    type: Number,
    default: 1,
    min: 1
  },
  isGroupOTP: {
    type: Boolean,
    default: false
  },
  createdByStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  isStudentGenerated: {
    type: Boolean,
    default: false
  },
  expiryType: {
    type: String,
    enum: ['fixed', 'midnight'],
    default: 'fixed'
  }
}, {
  timestamps: true
});

// Add pre-save middleware to set expiry time
otpSchema.pre('save', function(next) {
  if (this.isStudentGenerated) {
    // Set expiry to midnight for student-generated OTPs
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    this.expiresAt = midnight;
    this.expiryType = 'midnight';
  } else {
    // Set 5-minute expiry for guard-generated OTPs
    this.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    this.expiryType = 'fixed';
  }
  next();
});

// Index for efficient queries
otpSchema.index({ visitorPhone: 1, used: 1, expiresAt: 1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete after 1 hour

module.exports = mongoose.model('OTP', otpSchema);
