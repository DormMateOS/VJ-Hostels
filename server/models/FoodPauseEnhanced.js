const mongoose = require('mongoose');

const foodPauseEnhancedSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    meal_type: {
        type: String,
        enum: ['breakfast', 'lunch', 'snacks', 'dinner'],
        required: true
    },
    pause_type: {
        type: String,
        enum: ['today', 'tomorrow', 'custom'],
        required: true
    },
    pause_start_date: {
        type: String, // Date in YYYY-MM-DD format
        required: true
    },
    pause_end_date: {
        type: String, // Date in YYYY-MM-DD format
        required: true
    },
    approval_status: {
        type: String,
        enum: ['pending', 'approved', 'cancelled'],
        default: 'approved' // Auto-approved for now, can be changed for admin approval
    },
    outpass_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outpass',
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    },
    cancelled_at: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate pauses for same student, meal, and date
foodPauseEnhancedSchema.index({ 
    student_id: 1, 
    meal_type: 1, 
    pause_start_date: 1,
    pause_end_date: 1,
    is_active: 1
}, { 
    unique: true,
    partialFilterExpression: { is_active: true }
});

// Index for efficient queries
foodPauseEnhancedSchema.index({ student_id: 1, is_active: 1 });
foodPauseEnhancedSchema.index({ pause_start_date: 1, pause_end_date: 1 });
foodPauseEnhancedSchema.index({ outpass_id: 1 });

const FoodPauseEnhanced = mongoose.model('FoodPauseEnhanced', foodPauseEnhancedSchema);
module.exports = FoodPauseEnhanced;
