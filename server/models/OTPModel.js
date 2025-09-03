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
    ref: 'Admin',
    required: true
  },
  groupSize: {
    type: Number,
    default: 1,
    min: 1
  },
  isGroupOTP: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
otpSchema.index({ visitorPhone: 1, used: 1, expiresAt: 1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete after 1 hour

module.exports = mongoose.model('OTP', otpSchema);
