const mongoose = require('mongoose');

const overrideRequestSchema = new mongoose.Schema({
  guardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  visitor: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  wardenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warden',
    default: null
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  wardenNotes: {
    type: String,
    trim: true,
    default: ''
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  isOutOfHours: {
    type: Boolean,
    default: false
  },
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
overrideRequestSchema.index({ status: 1, createdAt: -1 });
overrideRequestSchema.index({ wardenId: 1, status: 1 });
overrideRequestSchema.index({ guardId: 1, createdAt: -1 });

module.exports = mongoose.model('OverrideRequest', overrideRequestSchema);
