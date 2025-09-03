const mongoose = require('mongoose');

const foodPauseSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    pause_from: {
        type: String, // Date in YYYY-MM-DD format
        required: true
    },
    pause_meals: {
        type: String, // Comma-separated meal types
        required: true
    },
    resume_from: {
        type: String, // Date in YYYY-MM-DD format
        default: null
    },
    resume_meals: {
        type: String, // Comma-separated meal types
        default: null
    }
}, {
    timestamps: true
});

const FoodPause = mongoose.model('FoodPause', foodPauseSchema);
module.exports = FoodPause;
