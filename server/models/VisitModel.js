const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  visitorName: {
    type: String,
    required: true,
    trim: true
  },
  visitorPhone: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  guardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  entryAt: {
    type: Date,
    default: Date.now
  },
  exitAt: {
    type: Date,
    default: null
  },
  method: {
    type: String,
    enum: ['otp', 'preapproved', 'override'],
    required: true
  },
  photoUrl: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  otpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OTP',
    default: null
  },
  overrideRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OverrideRequest',
    default: null
  },
  groupVisitors: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    idVerified: {
      type: Boolean,
      default: false
    }
  }],
  isGroupVisit: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
visitSchema.index({ studentId: 1, entryAt: -1 });
visitSchema.index({ guardId: 1, entryAt: -1 });
visitSchema.index({ visitorPhone: 1, entryAt: -1 });
visitSchema.index({ status: 1, entryAt: -1 });

module.exports = mongoose.model('Visit', visitSchema);
