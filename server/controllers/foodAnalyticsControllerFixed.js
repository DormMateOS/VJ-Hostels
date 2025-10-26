const asyncHandler = require('express-async-handler');
const FoodPause = require('../models/FoodPause');
const FoodCount = require('../models/FoodCount');
const Student = require('../models/StudentModel');
const mongoose = require('mongoose');

// Helper function to get date range based on filter
const getDateRange = (filter, customStart = null, customEnd = null) => {
    const now = new Date();
    let startDate, endDate;

    switch (filter) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
            break;
        case 'yesterday':
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate.setHours(0, 0, 0, 0);
            startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'thisWeek':
            const dayOfWeek = now.getDay();
            startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
        case 'lastWeek':
            const lastWeekEnd = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
            lastWeekEnd.setHours(0, 0, 0, 0);
            endDate = lastWeekEnd;
            startDate = new Date(lastWeekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            endDate.setHours(0, 0, 0, 0);
            break;
        case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate.setHours(0, 0, 0, 0);
            break;
        case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            endDate.setHours(0, 0, 0, 0);
            break;
        case 'lastYear':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), 0, 1);
            endDate.setHours(0, 0, 0, 0);
            break;
        case 'custom':
            startDate = new Date(customStart);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEnd);
            endDate.setHours(0, 0, 0, 0);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            endDate.setHours(0, 0, 0, 0);
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
};

// GET /analytics/dashboard-data
const getDashboardData = asyncHandler(async (req, res) => {
    console.log('=== DASHBOARD DATA API CALLED ===');
    const {
        dateFilter = 'thisMonth',
        customStartDate,
        customEndDate,
        mealTypes = 'breakfast,lunch,snacks,dinner',
        statusFilter = 'all',
        hostelId,
        gender
    } = req.query;

    console.log('Query parameters:', { dateFilter, customStartDate, customEndDate, mealTypes, statusFilter, hostelId, gender });

    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);
    const mealTypeArray = mealTypes.split(',').filter(Boolean);

    console.log('Date range:', { startDate, endDate });
    console.log('Meal type array:', mealTypeArray);

    // Build student filter
    let studentFilter = {};
    if (hostelId) studentFilter.hostel_id = hostelId;
    if (gender) studentFilter.gender = gender;

    // Get students based on filter
    const students = await Student.find(studentFilter).select('_id name room');
    const studentIds = students.map(s => s._id);

    console.log(`Found ${students.length} students matching filters`);

    // Build query for food pauses within date range
    const pauseMatchStage = {
        student_id: { $in: studentIds },
        $or: [
            {
                pause_from: { $gte: startDate, $lte: endDate }
            },
            {
                resume_from: { $gte: startDate, $lte: endDate }
            },
            {
                // Also include pauses that span across the date range
                pause_from: { $lte: startDate },
                $or: [
                    { resume_from: { $gte: endDate } },
                    { resume_from: { $exists: false } },
                    { resume_from: null }
                ]
            }
        ]
    };

    console.log('Food pause query filter:', JSON.stringify(pauseMatchStage, null, 2));

    // Get pause/resume data
    const pauseData = await FoodPause.find(pauseMatchStage)
        .populate('student_id', 'name room')
        .sort({ createdAt: -1 });
    
    console.log(`Found ${pauseData.length} food pause records`);
    if (pauseData.length > 0) {
        console.log('Sample pause data:', JSON.stringify(pauseData[0], null, 2));
    }

    // Get food count data (if available)
    const foodCountData = await FoodCount.find({
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    console.log(`Found ${foodCountData.length} food count records`);

    // Process data for analytics
    const processedData = processAnalyticsData(pauseData, foodCountData, mealTypeArray, startDate, endDate);

    console.log('Processed data summary:', {
        totalPaused: processedData.summary.totalMealsPaused,
        totalServed: processedData.summary.totalMealsServed,
        dailyTrendsCount: processedData.trends.daily.length
    });

    res.json({
        success: true,
        data: processedData,
        filters: {
            dateFilter,
            startDate,
            endDate,
            mealTypes: mealTypeArray,
            statusFilter,
            totalStudents: students.length
        }
    });
});

// Helper function to process analytics data
const processAnalyticsData = (pauseData, foodCountData, mealTypes, startDate, endDate) => {
    console.log('Processing analytics data:', {
        pauseDataCount: pauseData.length,
        foodCountDataCount: foodCountData.length,
        mealTypes,
        dateRange: { startDate, endDate }
    });

    // Initialize result structure
    const result = {
        summary: {
            totalMealsServed: 0,
            totalMealsPaused: 0,
            totalMealsResumed: 0,
            pausePercentage: 0,
            averagePausesPerStudent: 0,
            peakPauseDay: null,
            peakPauseMeal: null
        },
        trends: {
            daily: []
        },
        distributions: {
            mealTypes: {},
            weekdays: {}
        },
        heatmapData: [],
        insights: []
    };

    // Initialize meal type counters
    ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(meal => {
        result.distributions.mealTypes[meal] = { paused: 0, served: 50 }; // Mock served count
    });

    // Initialize weekday counters
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
        result.distributions.weekdays[day] = { paused: 0, served: 0 }; // Will be updated during processing
    });

    // Process pause data
    let totalMealsPaused = 0;
    let totalMealsResumed = 0;
    const mealPauseCounts = {};
    const dailyPauseCounts = {};
    const weekdayPauseCounts = {
        'Sunday': { paused: 0, served: 0 },
        'Monday': { paused: 0, served: 0 },
        'Tuesday': { paused: 0, served: 0 },
        'Wednesday': { paused: 0, served: 0 },
        'Thursday': { paused: 0, served: 0 },
        'Friday': { paused: 0, served: 0 },
        'Saturday': { paused: 0, served: 0 }
    };

    pauseData.forEach(pause => {
        // Parse comma-separated meal types
        const pausedMeals = pause.pause_meals ? pause.pause_meals.split(',') : [];
        
        pausedMeals.forEach(meal => {
            meal = meal.trim();
            if (result.distributions.mealTypes[meal]) {
                result.distributions.mealTypes[meal].paused++;
                totalMealsPaused++;
                mealPauseCounts[meal] = (mealPauseCounts[meal] || 0) + 1;
            }
        });

        // Count pauses by date and weekday
        if (pause.pause_from) {
            dailyPauseCounts[pause.pause_from] = (dailyPauseCounts[pause.pause_from] || 0) + pausedMeals.length;
            
            // Also track by weekday
            const dateObj = new Date(pause.pause_from + 'T00:00:00Z');
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getUTCDay()];
            weekdayPauseCounts[dayName].paused += pausedMeals.length;
        }

        // Count resumed meals
        if (pause.resume_from) {
            const resumedMeals = pause.resume_meals ? pause.resume_meals.split(',') : [];
            totalMealsResumed += resumedMeals.length;
        }
    });

    // Update weekday counters with mock served data
    Object.keys(weekdayPauseCounts).forEach(day => {
        result.distributions.weekdays[day] = weekdayPauseCounts[day];
        if (result.distributions.weekdays[day].served === 0) {
            result.distributions.weekdays[day].served = 50;
        }
    });

    // Generate daily trends
    const startDateObj = new Date(startDate + 'T00:00:00Z');
    const endDateObj = new Date(endDate + 'T00:00:00Z');
    const daysDiff = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
        const currentDate = new Date(startDateObj);
        currentDate.setDate(startDateObj.getDate() + i);
        
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayPauses = dailyPauseCounts[dateStr] || 0;

        result.trends.daily.push({
            date: dateStr,
            served: Math.max(50 - dayPauses, 0), // Mock served count
            paused: dayPauses
        });
    }

    // Update summary statistics
    result.summary.totalMealsPaused = totalMealsPaused;
    result.summary.totalMealsResumed = totalMealsResumed;
    result.summary.totalMealsServed = result.trends.daily.reduce((sum, day) => sum + day.served, 0);
    result.summary.pausePercentage = result.summary.totalMealsServed > 0 ? 
        (totalMealsPaused / (result.summary.totalMealsServed + totalMealsPaused)) * 100 : 0;
    result.summary.averagePausesPerStudent = pauseData.length > 0 ? totalMealsPaused / pauseData.length : 0;

    // Find peak pause day and meal
    const peakPauseDay = result.trends.daily.reduce((max, day) => 
        day.paused > max.paused ? day : max, { paused: 0, date: null });
    const peakPauseMeal = Object.entries(mealPauseCounts).reduce((max, [meal, count]) => 
        count > max.count ? { meal, count } : max, { meal: null, count: 0 });

    result.summary.peakPauseDay = peakPauseDay.date;
    result.summary.peakPauseMeal = peakPauseMeal.meal;

    // Generate insights
    result.insights = generateInsights(totalMealsPaused, result.summary.totalMealsServed, peakPauseMeal.meal, peakPauseDay.date);

    console.log('Processed analytics result summary:', {
        totalPaused: result.summary.totalMealsPaused,
        totalServed: result.summary.totalMealsServed,
        pausePercentage: result.summary.pausePercentage,
        dailyTrendsCount: result.trends.daily.length
    });
    
    return result;
};

// Helper function to generate insights
const generateInsights = (totalPaused, totalServed, peakMeal, peakDay) => {
    const insights = [];
    
    if (totalPaused > 0) {
        insights.push(`Total of ${totalPaused} meals were paused during this period.`);
        
        if (peakMeal) {
            insights.push(`${peakMeal} was the most frequently paused meal type.`);
        }
        
        if (peakDay) {
            insights.push(`${peakDay} had the highest number of meal pauses.`);
        }
        
        const pauseRate = totalServed > 0 ? (totalPaused / (totalServed + totalPaused) * 100).toFixed(1) : 0;
        insights.push(`Overall pause rate is ${pauseRate}% of total meal services.`);
    } else {
        insights.push('No meal pauses detected in the selected time period.');
    }
    
    return insights;
};

// GET /analytics/export-data
const getExportData = asyncHandler(async (req, res) => {
    // Simple export endpoint
    res.json({
        success: true,
        message: 'Export functionality not implemented yet'
    });
});

module.exports = {
    getDashboardData,
    getExportData
};
