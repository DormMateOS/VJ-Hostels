const mongoose = require('mongoose');

// Food Menu Schema - Updated for weekly structure
const foodMenuSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    breakfast: {
        type: String,
        required: true
    },
    lunch: {
        type: String,
        required: true
    },
    dinner: {
        type: String,
        required: true
    },
    snacks: {
        type: String,
        required: false
    }
});

// Weekly Food Menu Schema - New schema for monthly menu management
const weeklyFoodMenuSchema = new mongoose.Schema({
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    week: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    },
    weekName: {
        type: String,
        required: true,
        enum: ['week1', 'week2', 'week3', 'week4']
    },
    days: {
        monday: {
            breakfast: { type: String, default: '' },
            lunch: { type: String, default: '' },
            snacks: { type: String, default: '' },
            dinner: { type: String, default: '' }
        },
        tuesday: {
            breakfast: { type: String, default: '' },
            lunch: { type: String, default: '' },
            snacks: { type: String, default: '' },
            dinner: { type: String, default: '' }
        },
        wednesday: {
            breakfast: { type: String, default: '' },
            lunch: { type: String, default: '' },
            snacks: { type: String, default: '' },
            dinner: { type: String, default: '' }
        },
        thursday: {
            breakfast: { type: String, default: '' },
            lunch: { type: String, default: '' },
            snacks: { type: String, default: '' },
            dinner: { type: String, default: '' }
        },
        friday: {
            breakfast: { type: String, default: '' },
            lunch: { type: String, default: '' },
            snacks: { type: String, default: '' },
            dinner: { type: String, default: '' }
        },
        saturday: {
            breakfast: { type: String, default: '' },
            lunch: { type: String, default: '' },
            snacks: { type: String, default: '' },
            dinner: { type: String, default: '' }
        },
        sunday: {
            breakfast: { type: String, default: '' },
            lunch: { type: String, default: '' },
            snacks: { type: String, default: '' },
            dinner: { type: String, default: '' }
        }
    }
}, {
    timestamps: true
});

// Food Feedback Schema
const foodFeedbackSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    feedback: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

const FoodMenu = mongoose.model('FoodMenu', foodMenuSchema);
const WeeklyFoodMenu = mongoose.model('WeeklyFoodMenu', weeklyFoodMenuSchema);
const FoodFeedback = mongoose.model('FoodFeedback', foodFeedbackSchema);

module.exports = { FoodMenu, WeeklyFoodMenu, FoodFeedback };
