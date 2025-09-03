const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const guardSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
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
  }
}, {
  timestamps: true
});

// Hash password before saving
guardSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
guardSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Guard', guardSchema);
