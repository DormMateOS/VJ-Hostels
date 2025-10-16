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
    ref: 'Guard',  // Changed from Admin to Guard
    required: true
  },
  checkoutGuardId: {  // Add field to track who checked out the visitor
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guard',
    default: null
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
    enum: ['active', 'completed', 'cancelled'],  // Added cancelled status
    default: 'active'
  },
  cancelledReason: {  // Add field for cancellation reason
    type: String,
    default: null
  },
  // Add audit trail for visit status changes
  statusHistory: [{
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled']
    },
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guard'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
visitSchema.index({ studentId: 1, entryAt: -1 });
visitSchema.index({ guardId: 1, entryAt: -1 });
visitSchema.index({ visitorPhone: 1, entryAt: -1 });
visitSchema.index({ status: 1, entryAt: -1 });

// Add new indexes for guard-related queries
visitSchema.index({ guardId: 1, status: 1 });
visitSchema.index({ checkoutGuardId: 1, exitAt: -1 });

module.exports = mongoose.model('Visit', visitSchema);
