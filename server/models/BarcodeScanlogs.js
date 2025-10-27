const mongoose = require('mongoose');

const barcodeScanSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    index: true
  },
  year: {
    type: String,
    required: true
  },
  deptCode: {
    type: String,
    required: true
  },
  deptName: {
    type: String,
    required: true
  },
  entry: {
    type: String,
    enum: ['Direct Entry', 'Lateral Entry', 'Unknown'],
    default: 'Unknown'
  },
  scannedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guard',
    required: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  notes: String,
  checkInTime: Date,
  checkOutTime: Date,
  sessionId: String // For grouping multiple scans in one session
}, { timestamps: true });

// Index for efficient querying
barcodeScanSchema.index({ scannedAt: 1 });
barcodeScanSchema.index({ rollNumber: 1, scannedAt: -1 });
barcodeScanSchema.index({ scannedBy: 1, scannedAt: -1 });
barcodeScanSchema.index({ year: 1, deptCode: 1, scannedAt: -1 });

module.exports = mongoose.model('BarcodeScanlogs', barcodeScanSchema);
