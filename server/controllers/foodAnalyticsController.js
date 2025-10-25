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
            endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
            break;
        case 'yesterday':
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
        case 'lastYear':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'custom':
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
};

// Helper function to format date for comparison
const formatDateForComparison = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
};

// GET /analytics/dashboard-data
const getDashboardData = asyncHandler(async (req, res) => {
    const {
        dateFilter = 'thisMonth',
        customStartDate,
        customEndDate,
        mealTypes = 'breakfast,lunch,snacks,dinner',
        statusFilter = 'all',
        hostelId,
        gender
    } = req.query;

    const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);
    const mealTypeArray = mealTypes.split(',').filter(Boolean);

    // Build student filter
    let studentFilter = {};
    if (hostelId) studentFilter.hostel_id = hostelId;
    if (gender) studentFilter.gender = gender;

    // Get students based on filter
    const students = await Student.find(studentFilter).select('_id name room');
    const studentIds = students.map(s => s._id);

    // Build aggregation pipeline for food pauses
    // startDate and endDate are already in YYYY-MM-DD format from getDateRange
    console.log('Date range for analytics:', { startDate, endDate });
    
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

    // Get pause/resume data
    const pauseData = await FoodPause.find(pauseMatchStage)
        .populate('student_id', 'name room')
        .sort({ createdAt: -1 });
    
    console.log('Analytics Debug - Date Range:', { startDate, endDate });
    console.log('Analytics Debug - Students found:', students.length);
    console.log('Analytics Debug - Pause data found:', pauseData.length);
    console.log('Analytics Debug - Sample pause data:', pauseData.slice(0, 2));

    // Get food count data
    const foodCountData = await FoodCount.find({
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Process data for analytics
    const processedData = processAnalyticsData(pauseData, foodCountData, mealTypeArray, startDate, endDate);

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
        result.distributions.weekdays[day] = { paused: 0, served: 50 }; // Mock served count
    });

    // Process pause data
    let totalMealsPaused = 0;
    let totalMealsResumed = 0;
    const mealPauseCounts = {};

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

        // Count resumed meals
        if (pause.resume_from) {
            const resumedMeals = pause.resume_meals ? pause.resume_meals.split(',') : [];
            totalMealsResumed += resumedMeals.length;
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
        
        // Count pauses for this specific day
        const dayPauses = pauseData.filter(pause => 
            pause.pause_from === dateStr
        ).reduce((count, pause) => {
            const meals = pause.pause_meals ? pause.pause_meals.split(',') : [];
            return count + meals.length;
        }, 0);

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

    console.log('Processed analytics result:', result);
    
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
        const dayOfWeek = weekdays[new Date(count.date).getDay()];
        
        mealTypes.forEach(meal => {
            const mealCount = count[`${meal}_count`] || 0;
            result.summary.totalMealsServed += mealCount;
            result.distributions.mealTypes[meal].served += mealCount;
            result.distributions.weekdays[dayOfWeek].served += mealCount;
        });
    });

    // Process pause data
    const pausesByDate = {};
    const pausesByMeal = {};
    const pausesByWeekday = {};

    pauseData.forEach(pause => {
        // Process pause events
        if (pause.pause_from >= startDateStr && pause.pause_from <= endDateStr) {
            const pauseMeals = pause.pause_meals.split(',').filter(meal => mealTypes.includes(meal.trim()));
            const pauseDate = pause.pause_from;
            const dayOfWeek = weekdays[new Date(pauseDate).getDay()];

            pauseMeals.forEach(meal => {
                result.summary.totalMealsPaused++;
                result.distributions.mealTypes[meal.trim()].paused++;
                result.distributions.weekdays[dayOfWeek].paused++;

                // Track by date
                if (!pausesByDate[pauseDate]) pausesByDate[pauseDate] = 0;
                pausesByDate[pauseDate]++;

                // Track by meal
                if (!pausesByMeal[meal.trim()]) pausesByMeal[meal.trim()] = 0;
                pausesByMeal[meal.trim()]++;

                // Track by weekday
                if (!pausesByWeekday[dayOfWeek]) pausesByWeekday[dayOfWeek] = 0;
                pausesByWeekday[dayOfWeek]++;
            });
        }

        // Process resume events
        if (pause.resume_from && pause.resume_from >= startDateStr && pause.resume_from <= endDateStr) {
            const resumeMeals = pause.resume_meals.split(',').filter(meal => mealTypes.includes(meal.trim()));
            const resumeDate = pause.resume_from;
            const dayOfWeek = weekdays[new Date(resumeDate).getDay()];

            resumeMeals.forEach(meal => {
                result.summary.totalMealsResumed++;
                result.distributions.mealTypes[meal.trim()].resumed++;
                result.distributions.weekdays[dayOfWeek].resumed++;
            });
        }
    });

    // Calculate summary statistics
    const totalMeals = result.summary.totalMealsServed + result.summary.totalMealsPaused;
    result.summary.pausePercentage = totalMeals > 0 ? (result.summary.totalMealsPaused / totalMeals * 100) : 0;
    
    const uniqueStudents = new Set(pauseData.map(p => p.student_id._id.toString())).size;
    result.summary.averagePausesPerStudent = uniqueStudents > 0 ? (result.summary.totalMealsPaused / uniqueStudents) : 0;

    // Find peak pause day and meal
    result.summary.peakPauseDay = Object.keys(pausesByDate).reduce((a, b) => 
        pausesByDate[a] > pausesByDate[b] ? a : b, Object.keys(pausesByDate)[0]);
    
    result.summary.peakPauseMeal = Object.keys(pausesByMeal).reduce((a, b) => 
        pausesByMeal[a] > pausesByMeal[b] ? a : b, Object.keys(pausesByMeal)[0]);

    // Generate daily trends
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = {
            date: dateStr,
            served: 0,
            paused: pausesByDate[dateStr] || 0,
            resumed: 0
        };

        // Add served count for this date
        const dayFoodCount = foodCountData.find(fc => fc.date === dateStr);
        if (dayFoodCount) {
            mealTypes.forEach(meal => {
                dayData.served += dayFoodCount[`${meal}_count`] || 0;
            });
        }

        result.trends.daily.push(dayData);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate heatmap data
    result.heatmapData = weekdays.map(day => ({
        day,
        breakfast: pausesByWeekday[day] || 0,
        lunch: pausesByWeekday[day] || 0,
        snacks: pausesByWeekday[day] || 0,
        dinner: pausesByWeekday[day] || 0
    }));

    // Generate daily trends data for charts (ensure we have data for the date range)
    const iterDate = new Date(startDate);
    while (iterDate <= endDate) {
        const dateStr = iterDate.toISOString().split('T')[0];
        const existingTrend = result.trends.daily.find(t => t.date === dateStr);
        
        if (!existingTrend) {
            result.trends.daily.push({
                date: dateStr,
                served: 0,
                paused: 0,
                resumed: 0
            });
        }
        
        iterDate.setDate(iterDate.getDate() + 1);
    }
    
    // Sort daily trends by date
    result.trends.daily.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate insights
    result.insights = generateInsights(result, pausesByDate, pausesByMeal, pausesByWeekday);

    return result;
};

// Helper function to generate automated insights
const generateInsights = (data, pausesByDate, pausesByMeal, pausesByWeekday) => {
    const insights = [];

    // Peak pause analysis
    if (data.summary.peakPauseDay) {
        const peakDate = new Date(data.summary.peakPauseDay);
        const dayName = peakDate.toLocaleDateString('en-US', { weekday: 'long' });
        insights.push(`Meal pauses peaked on ${dayName} (${peakDate.toLocaleDateString()}) with ${pausesByDate[data.summary.peakPauseDay]} pauses.`);
    }

    // Meal type analysis
    if (data.summary.peakPauseMeal) {
        insights.push(`${data.summary.peakPauseMeal.charAt(0).toUpperCase() + data.summary.peakPauseMeal.slice(1)} had the highest number of pauses with ${pausesByMeal[data.summary.peakPauseMeal]} total pauses.`);
    }

    // Pause percentage analysis
    if (data.summary.pausePercentage > 20) {
        insights.push(`High pause rate detected: ${data.summary.pausePercentage.toFixed(1)}% of meals were paused during this period.`);
    } else if (data.summary.pausePercentage < 5) {
        insights.push(`Low pause rate: Only ${data.summary.pausePercentage.toFixed(1)}% of meals were paused, indicating good meal satisfaction.`);
    }

    // Weekday pattern analysis
    const weekdayPauses = Object.entries(pausesByWeekday).sort((a, b) => b[1] - a[1]);
    if (weekdayPauses.length > 0) {
        const topDay = weekdayPauses[0];
        insights.push(`${topDay[0]} shows the highest pause activity with ${topDay[1]} pauses.`);
    }

    // Trend analysis
    const recentTrend = data.trends.daily.slice(-7);
    const avgRecentPauses = recentTrend.reduce((sum, day) => sum + day.paused, 0) / recentTrend.length;
    const earlierTrend = data.trends.daily.slice(0, 7);
    const avgEarlierPauses = earlierTrend.reduce((sum, day) => sum + day.paused, 0) / earlierTrend.length;

    if (avgRecentPauses > avgEarlierPauses * 1.2) {
        insights.push(`Pause activity has increased by ${((avgRecentPauses - avgEarlierPauses) / avgEarlierPauses * 100).toFixed(1)}% in recent days.`);
    } else if (avgRecentPauses < avgEarlierPauses * 0.8) {
        insights.push(`Pause activity has decreased by ${((avgEarlierPauses - avgRecentPauses) / avgEarlierPauses * 100).toFixed(1)}% in recent days.`);
    }

    return insights;
};

// GET /analytics/export-data
const getExportData = asyncHandler(async (req, res) => {
    const dashboardData = await getDashboardData(req, res);
    
    // Format data for export
    const exportData = {
        summary: dashboardData.data.summary,
        trends: dashboardData.data.trends,
        distributions: dashboardData.data.distributions,
        insights: dashboardData.data.insights,
        generatedAt: new Date().toISOString(),
        filters: dashboardData.filters
    };

    res.json({
        success: true,
        data: exportData
    });
});

module.exports = {
    getDashboardData,
    getExportData
};
