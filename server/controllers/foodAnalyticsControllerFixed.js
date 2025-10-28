const asyncHandler = require('express-async-handler');
const FoodPauseEnhanced = require('../models/FoodPauseEnhanced');
const FoodCount = require('../models/FoodCount');
const Student = require('../models/StudentModel');
const Outpass = require('../models/OutpassModel');
const mongoose = require('mongoose');

// Meal times configuration (in 24-hour format)
const MEAL_TIMES = {
    breakfast: { start: 7, end: 9 },      // 7:00 AM - 9:00 AM
    lunch: { start: 12, end: 14 },         // 12:00 PM - 2:00 PM
    snacks: { start: 16, end: 17 },        // 4:00 PM - 5:00 PM
    dinner: { start: 19, end: 21 }         // 7:00 PM - 9:00 PM
};

// Helper function to format date as YYYY-MM-DD in local timezone (not UTC)
const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to get date range based on filter
// All date ranges are capped at TODAY - no future dates included
const getDateRange = (filter, customStart = null, customEnd = null) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setHours(0, 0, 0, 0);
    let startDate, endDate;

    switch (filter) {
        case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
        case 'yesterday':
            endDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            startDate = new Date(endDate);
            break;
        case 'thisWeek':
            const dayOfWeek = now.getDay();
            startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today); // Cap at today, not end of week
            break;
        case 'lastWeek':
            const lastWeekEnd = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
            lastWeekEnd.setHours(0, 0, 0, 0);
            endDate = new Date(lastWeekEnd.getTime() - 24 * 60 * 60 * 1000); // Yesterday
            startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000); // 7 days back
            break;
        case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today); // Cap at today, not end of month
            break;
        case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of last month
            endDate.setHours(0, 0, 0, 0);
            break;
        case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today); // Cap at today, not end of year
            break;
        case 'lastYear':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear() - 1, 11, 31); // Last day of last year
            endDate.setHours(0, 0, 0, 0);
            break;
        case 'custom':
            startDate = new Date(customStart);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEnd);
            endDate.setHours(0, 0, 0, 0);
            // Cap custom end date at today
            if (endDate > today) {
                endDate = new Date(today);
            }
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today); // Cap at today
    }

    return {
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(endDate)
    };
};

// GET /analytics/dashboard-data
const getDashboardData = asyncHandler(async (req, res) => {
    console.log('=== DASHBOARD DATA API CALLED ===');
    const {
        dateFilter = 'thisMonth',
        customStartDate,
        customEndDate,
        mealTypes = 'all',
        statusFilter = 'all',
        hostelId,
        gender
    } = req.query;

    console.log('Query parameters:', { dateFilter, customStartDate, customEndDate, mealTypes, statusFilter, hostelId, gender });

    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);
    
    // Parse meal types - if 'all', include all meal types
    let mealTypeArray = [];
    if (mealTypes === 'all' || !mealTypes) {
        mealTypeArray = ['breakfast', 'lunch', 'snacks', 'dinner'];
    } else {
        mealTypeArray = mealTypes.split(',').filter(Boolean);
    }

    // Build student filter
    let studentFilter = { is_active: true };
    if (hostelId) studentFilter.hostel_id = hostelId;
    if (gender) studentFilter.gender = gender;

    // Get students based on filter
    const students = await Student.find(studentFilter).select('_id name room hostel');
    const studentIds = students.map(s => s._id);

    // Get students NOT on outpass during this date range (with status 'out' or 'returned')
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    const studentsOnOutpass = await Outpass.find({
        student_id: { $in: studentIds },
        status: { $in: ['out', 'returned'] },
        outTime: { $lt: endDateObj },
        inTime: { $gt: startDateObj }
    }).select('student_id').distinct('student_id');

    // Get available students (not on outpass)
    const availableStudentIds = studentIds.filter(id => 
        !studentsOnOutpass.some(outId => outId.toString() === id.toString())
    );

    console.log(`Available students (not on outpass): ${availableStudentIds.length} out of ${studentIds.length}`);

    // Build query for food pauses within date range using FoodPauseEnhanced model
    let pauseMatchStage = {
        is_active: true,
        approval_status: 'approved',
        student_id: { $in: availableStudentIds },
        pause_start_date: { $lte: endDate },
        pause_end_date: { $gte: startDate }
    };

    // Filter by meal types if specified
    if (mealTypeArray.length < 4) {
        pauseMatchStage.meal_type = { $in: mealTypeArray };
    }

    // Apply status filter if not 'all'
    if (statusFilter && statusFilter !== 'all') {
        pauseMatchStage.approval_status = statusFilter;
    }

    console.log('Food pause query filter:', JSON.stringify(pauseMatchStage, null, 2));

    // Get pause data from FoodPauseEnhanced
    const pauseData = await FoodPauseEnhanced.find(pauseMatchStage)
        .populate('student_id', 'name room hostel')
        .sort({ pause_start_date: 1 });
    
    console.log(`Found ${pauseData.length} food pause records from FoodPauseEnhanced`);
    if (pauseData.length > 0) {
        console.log('Sample pause data:', JSON.stringify(pauseData[0], null, 2));
    }

    // Process data for analytics
    const processedData = processAnalyticsData(pauseData, startDate, endDate, mealTypeArray, availableStudentIds.length);

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
            totalStudents: students.length,
            availableStudents: availableStudentIds.length
        }
    });
});

// Helper function to process analytics data for FoodPauseEnhanced model
const processAnalyticsData = (pauseData, startDate, endDate, mealTypes, totalAvailableStudents) => {
    console.log('Processing analytics data:', {
        pauseDataCount: pauseData.length,
        mealTypes,
        dateRange: { startDate, endDate },
        totalAvailableStudents
    });

    // Initialize result structure
    const result = {
        summary: {
            totalMealsAvailable: 0,
            totalMealsPaused: 0,
            totalMealsServed: 0,
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
        result.distributions.mealTypes[meal] = { paused: 0, served: 0, available: 0 };
    });

    // Initialize weekday counters with detailed meal type breakdown
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    daysOfWeek.forEach(day => {
        result.distributions.weekdays[day] = { paused: 0, served: 0, available: 0, mealBreakdown: {} };
        ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(meal => {
            result.distributions.weekdays[day].mealBreakdown[meal] = { paused: 0, available: 0, served: 0 };
        });
    });

    // Calculate total available meals (students × days × meals that are timely)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const daysDiff = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
    
    // Track available meals per day and meal type
    const mealAvailabilityByDateAndMeal = {};
    
    for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(startDateObj);
        currentDate.setDate(startDateObj.getDate() + i);
        const dateStr = formatLocalDate(currentDate);
        const dayName = daysOfWeek[currentDate.getDay()];
        
        // For each meal type, check if it's timely (before end time on current time)
        const now = new Date();
        
        ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(meal => {
            const mealEndHour = MEAL_TIMES[meal].end;
            
            // Check if meal is still available (timely)
            // If the date is in future, meal is available
            // If the date is today, check if current time is before meal end time
            let isMealTimely = false;
            
            if (dateStr > formatLocalDate(now)) {
                // Future date - meal is available
                isMealTimely = true;
            } else if (dateStr === formatLocalDate(now)) {
                // Today - check if current time is before meal end time
                const currentHour = now.getHours();
                isMealTimely = currentHour < mealEndHour;
            }
            // Past dates - meal is not timely (isMealTimely = false)
            
            if (isMealTimely) {
                if (!mealAvailabilityByDateAndMeal[dateStr]) {
                    mealAvailabilityByDateAndMeal[dateStr] = {};
                }
                mealAvailabilityByDateAndMeal[dateStr][meal] = totalAvailableStudents;
                
                // Update distributions
                result.distributions.mealTypes[meal].available += totalAvailableStudents;
                result.distributions.weekdays[dayName].available += totalAvailableStudents;
                result.distributions.weekdays[dayName].mealBreakdown[meal].available += totalAvailableStudents;
                result.summary.totalMealsAvailable += totalAvailableStudents;
            }
        });
    }

    // Process pause data from FoodPauseEnhanced
    let totalMealsPaused = 0;
    const mealPauseCounts = {};
    const dailyPauseCounts = {};
    const studentPauseCounts = new Map();

    pauseData.forEach(pause => {
        const mealType = pause.meal_type;
        
        // Track pause by meal type
        if (result.distributions.mealTypes[mealType]) {
            result.distributions.mealTypes[mealType].paused++;
            totalMealsPaused++;
            mealPauseCounts[mealType] = (mealPauseCounts[mealType] || 0) + 1;
        }

        // Track pauses by date and meal type
        for (let d = new Date(pause.pause_start_date); d <= new Date(pause.pause_end_date); d.setDate(d.getDate() + 1)) {
            const dateStr = formatLocalDate(d);
            if (dateStr >= startDate && dateStr <= endDate) {
                dailyPauseCounts[dateStr] = (dailyPauseCounts[dateStr] || 0) + 1;
                
                // Track by weekday and meal
                const dayName = daysOfWeek[d.getDay()];
                result.distributions.weekdays[dayName].paused++;
                result.distributions.weekdays[dayName].mealBreakdown[mealType].paused = 
                    (result.distributions.weekdays[dayName].mealBreakdown[mealType].paused || 0) + 1;
            }
        }

        // Count pauses per student
        const studentId = pause.student_id._id.toString();
        studentPauseCounts.set(studentId, (studentPauseCounts.get(studentId) || 0) + 1);
    });

    // Calculate total served = available - paused
    result.summary.totalMealsPaused = totalMealsPaused;
    result.summary.totalMealsServed = result.summary.totalMealsAvailable - totalMealsPaused;
    result.summary.pausePercentage = result.summary.totalMealsAvailable > 0 ? 
        (totalMealsPaused / result.summary.totalMealsAvailable) * 100 : 0;
    result.summary.averagePausesPerStudent = studentPauseCounts.size > 0 ? 
        totalMealsPaused / studentPauseCounts.size : 0;

    // Update meal-wise served counts
    ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(meal => {
        result.distributions.mealTypes[meal].served = 
            result.distributions.mealTypes[meal].available - result.distributions.mealTypes[meal].paused;
    });

    // Update weekday served counts
    daysOfWeek.forEach(day => {
        result.distributions.weekdays[day].served = 
            result.distributions.weekdays[day].available - result.distributions.weekdays[day].paused;
        
        ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(meal => {
            result.distributions.weekdays[day].mealBreakdown[meal].served = 
                result.distributions.weekdays[day].mealBreakdown[meal].available - 
                result.distributions.weekdays[day].mealBreakdown[meal].paused;
        });
    });

    // Generate daily trends with actual calculations
    for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(startDateObj);
        currentDate.setDate(startDateObj.getDate() + i);
        
        const dateStr = formatLocalDate(currentDate);
        const dayPauses = dailyPauseCounts[dateStr] || 0;
        
        // Calculate available meals for this day
        let dayAvailable = 0;
        if (mealAvailabilityByDateAndMeal[dateStr]) {
            Object.values(mealAvailabilityByDateAndMeal[dateStr]).forEach(count => {
                dayAvailable += count;
            });
        }
        
        const dayServed = dayAvailable - dayPauses;

        result.trends.daily.push({
            date: dateStr,
            available: dayAvailable,
            served: Math.max(dayServed, 0),
            paused: dayPauses,
            resumed: 0
        });
    }

    // Find peak pause day and meal
    const peakPauseDay = result.trends.daily.reduce((max, day) => 
        day.paused > max.paused ? day : max, { paused: 0, date: null });
    const peakPauseMeal = Object.entries(mealPauseCounts).reduce((max, [meal, count]) => 
        count > max.count ? { meal, count } : max, { meal: null, count: 0 });

    result.summary.peakPauseDay = peakPauseDay.date;
    result.summary.peakPauseMeal = peakPauseMeal.meal;

    // Generate insights
    result.insights = generateInsights(totalMealsPaused, result.summary.totalMealsServed, 
        result.summary.totalMealsAvailable, studentPauseCounts.size);

    // console.log('Processed analytics result summary:', {
    //     totalPaused: result.summary.totalMealsPaused,
    //     totalServed: result.summary.totalMealsServed,
    //     pausePercentage: result.summary.pausePercentage,
    //     dailyTrendsCount: result.trends.daily.length,
    //     uniqueStudents: studentPauseCounts.size
    // });
    
    return result;
};

// Helper function to generate insights
const generateInsights = (totalPaused, totalServed, totalAvailable, uniqueStudents = 0) => {
    const insights = [];
    
    if (totalPaused > 0) {
        insights.push(`Total of ${totalPaused} meals were paused during this period.`);
        insights.push(`Out of ${totalAvailable} available meals, ${totalServed} were served.`);
        
        if (uniqueStudents > 0) {
            insights.push(`${uniqueStudents} unique students have active pauses.`);
        }
        
        const pauseRate = totalAvailable > 0 ? (totalPaused / totalAvailable * 100).toFixed(1) : 0;
        insights.push(`Overall pause rate is ${pauseRate}% of total meal availability.`);
    } else {
        insights.push('No meal pauses detected in the selected time period.');
        if (totalAvailable > 0) {
            insights.push(`All ${totalAvailable} available meals were served.`);
        }
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
