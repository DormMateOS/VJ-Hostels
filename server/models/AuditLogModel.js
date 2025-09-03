const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'otp_requested',
      'otp_verified',
      'otp_failed',
      'visit_created',
      'visit_checkout',
      'override_requested',
      'override_approved',
      'override_denied',
      'student_preferences_updated',
      'guard_login',
      'warden_login',
      'rate_limit_exceeded',
      'security_alert',
      'notification_sent'
    ]
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    default: null
  },
  actorType: {
    type: String,
    required: true,
    enum: ['guard', 'student', 'warden', 'system']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  targetType: {
    type: String,
    enum: ['student', 'visit', 'otp', 'override_request'],
    default: null
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
