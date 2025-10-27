const exp = require('express');
const barcodeRouter = exp.Router();
const barcodeController = require('../controllers/barcodeController');
const verifyToken = require('../middleware/verifyToken').default;
const verifySecurityRole = require('../middleware/verifySecurityRole');
require('dotenv').config();

// All barcode routes require authentication and security/guard role
barcodeRouter.use(verifyToken);
barcodeRouter.use(verifySecurityRole);

// Record multiple barcode scans in batch
barcodeRouter.post('/record-scans', barcodeController.recordScans);

// Get scan summary with aggregation
barcodeRouter.get('/summary', barcodeController.getScanSummary);

// Get scan history for a student or all scans
barcodeRouter.get('/history', barcodeController.getScanHistory);

// Verify if a student exists in system
barcodeRouter.post('/verify-student', barcodeController.verifyStudent);

// Delete/clear scans (admin only)
barcodeRouter.delete('/delete', barcodeController.deleteScans);

// Export scans to CSV or JSON
barcodeRouter.get('/export', barcodeController.exportScans);

module.exports = barcodeRouter;
