const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const guardSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    required: true  // Now required since we're using Google OAuth
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Remove username and password fields since we're using Google OAuth
  role: {
    type: String,
    default: 'security',
    enum: ['security', 'head_security']  // Add head_security role
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening', 'night'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  permissions: {
    canRequestOTP: {
      type: Boolean,
      default: true
    },
    canVerifyOTP: {
      type: Boolean,
      default: true
    },
    canCheckout: {
      type: Boolean,
      default: true
    },
    canOverride: {
      type: Boolean,
      default: false
    },
    canViewReports: {
      type: Boolean,
      default: false
    }
  },
  profilePhotoUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Remove password-related methods since we're using Google OAuth

module.exports = mongoose.model('Guard', guardSchema);
