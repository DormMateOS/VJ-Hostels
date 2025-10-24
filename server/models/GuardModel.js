const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const guardSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true  // Allow null values for non-Google OAuth users
  },
  username: {
    type: String,
    trim: true,
    // Username is unique only when provided, not required for OAuth users
    index: {
      unique: true,
      partialFilterExpression: { username: { $type: 'string' } }
    }
  },
  password: {
    type: String,
    // Required only for non-Google OAuth users
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
  role: {
    type: String,
    default: 'security',
    enum: ['security', 'head_security']
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening', 'night', 'day'],
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

// Hash password before saving (only for non-Google OAuth users)
guardSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for authentication
guardSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Skip password comparison for Google OAuth users
    if (this.googleId && !this.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('Guard', guardSchema);
