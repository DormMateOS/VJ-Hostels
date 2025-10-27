const express = require('express');
const foodApp = express.Router();
const expressAsyncHandler = require('express-async-handler');
const { FoodMenu, FoodFeedback } = require('../models/FoodModel');
const FoodPause = require('../models/FoodPause');
const StudentModel = require('../models/StudentModel');
const { verifyAdmin } = require('../middleware/verifyToken');
const { getMonthlyMenu, updateDayMenu, getCurrentWeek, updateWeekMenu } = require('../controllers/weeklyMenuController');
const { getDashboardData, getExportData } = require('../controllers/foodAnalyticsControllerFixed');

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

    return { startDate, endDate };
};

// Admin API endpoints

// Get all food menus
foodApp.get('/admin/menus', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const menus = await FoodMenu.find().sort({ date: -1 });
        res.status(200).json(menus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get today's food menu
foodApp.get('/admin/menu/today', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let menu = await FoodMenu.findOne({
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });
        
        if (!menu) {
            res.status(404).json({ message: "No menu found for today" });
            return;
        }
        
        res.status(200).json(menu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Create or update food menu
foodApp.post('/admin/menu', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const { date, breakfast, lunch, dinner, snacks } = req.body;
        
        // Convert date string to Date object and set to midnight
        const menuDate = new Date(date);
        menuDate.setHours(0, 0, 0, 0);
        
        // Check if menu already exists for this date
        let menu = await FoodMenu.findOne({
            date: {
                $gte: menuDate,
                $lt: new Date(menuDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });
        
        if (menu) {
            // Update existing menu
            menu.breakfast = breakfast;
            menu.lunch = lunch;
            menu.dinner = dinner;
            menu.snacks = snacks;
            await menu.save();
            res.status(200).json({ message: "Menu updated successfully", menu });
        } else {
            // Create new menu
            const newMenu = new FoodMenu({
                date: menuDate,
                breakfast,
                lunch,
                dinner,
                snacks
            });
            await newMenu.save();
            res.status(201).json({ message: "Menu created successfully", menu: newMenu });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get all feedback with filtering
foodApp.get('/admin/feedback', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const {
            dateFilter = 'today',
            customStartDate,
            customEndDate,
            mealType = 'all'
        } = req.query;

        // Build date filter
        const { startDate, endDate } = getDateRange(dateFilter, customStartDate, customEndDate);
        
        // Build query filter
        let filter = {
            date: {
                $gte: startDate,
                $lt: endDate
            }
        };

        // Add meal type filter if specified
        if (mealType && mealType !== 'all') {
            filter.mealType = mealType;
        }

        const feedback = await FoodFeedback.find(filter)
            .populate('student_id', 'rollNumber name')
            .sort({ createdAt: -1 });
        
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get feedback statistics
foodApp.get('/admin/feedback/stats', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        // Get average ratings by meal type
        const avgRatingsByMeal = await FoodFeedback.aggregate([
            {
                $group: {
                    _id: "$mealType",
                    averageRating: { $avg: "$rating" },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Get rating distribution
        const ratingDistribution = await FoodFeedback.aggregate([
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Get recent feedback trends (last 7 days) using normalized dateStr
        const recentDatesSet = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            recentDatesSet.push(d.toISOString().split('T')[0]);
        }

        const recentTrends = await FoodFeedback.aggregate([
            {
                $match: {
                    dateStr: { $in: recentDatesSet }
                }
            },
            {
                $group: {
                    _id: {
                        date: "$dateStr",
                        mealType: "$mealType"
                    },
                    averageRating: { $avg: "$rating" }
                }
            },
            {
                $sort: { "_id.date": 1 }
            }
        ]);
        
        res.status(200).json({
            avgRatingsByMeal,
            ratingDistribution,
            recentTrends
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Student API endpoints
// Handle food service pause requests
foodApp.post('/pause', expressAsyncHandler(async (req, res) => {
    try {
        const { 
            studentId,       
            pause_from, 
            pause_meals, 
            resume_from, 
            resume_meals 
        } = req.body;

        if (!studentId || !pause_from || !pause_meals) {
            return res.status(400).json({ 
                message: 'studentId, pause_from, and pause_meals are required' 
            });
        }

        // Find student (validation)
        const student = await StudentModel.findOne({ rollNumber: studentId});
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update existing FoodPause or create new one if none exists
        const updatedFoodPause = await FoodPause.findOneAndUpdate(
            { student_id: student._id }, // match by student reference
            {
                $set: {
                    pause_from,
                    pause_meals,
                    resume_from: resume_from || null,
                    resume_meals: resume_meals || null
                }
            },
            { new: true, upsert: true, runValidators: true } 
            // new: return updated doc
            // upsert: create if not exists
        );

        res.status(200).json({
            message: 'Food service pause saved successfully',
            data: updatedFoodPause
        });

    } catch (error) {
        console.error('Error saving food pause:', error);
        res.status(500).json({ 
            message: 'Failed to save food service pause',
            error: error.message 
        });
    }
}));

// Get student food pause/resume status
foodApp.get('/student-status', expressAsyncHandler(async (req, res) => {
    try {
        const { studentId } = req.query;

        if (!studentId) {
            return res.status(400).json({ message: 'studentId is required' });
        }
        
        const student = await StudentModel.findOne({ rollNumber: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get food pause record for this student
        const foodPause = await FoodPause.findOne({ student_id: student._id });
        
        if (!foodPause) {
            return res.status(200).json({
                pause_from: null,
                resume_from: null,
                pause_meals: null,
                resume_meals: null
            });
        }

        res.status(200).json({
            pause_from: foodPause.pause_from,
            resume_from: foodPause.resume_from,
            pause_meals: foodPause.pause_meals,
            resume_meals: foodPause.resume_meals
        });
    } catch (error) {
        console.error('Error fetching student status:', error);
        res.status(500).json({ 
            message: 'Failed to fetch student status',
            error: error.message 
        });
    }
}));

// Edit existing food pause (with time validation)
foodApp.post('/edit-pause', expressAsyncHandler(async (req, res) => {
    try {
        const { 
            studentId,       
            pause_from, 
            pause_meals
        } = req.body;

        if (!studentId || !pause_from || !pause_meals) {
            return res.status(400).json({ 
                message: 'studentId, pause_from, and pause_meals are required' 
            });
        }

        const student = await StudentModel.findOne({ rollNumber: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if student has existing pause
        const existingPause = await FoodPause.findOne({ student_id: student._id });
        if (!existingPause) {
            return res.status(404).json({ message: 'No existing pause found to edit' });
        }

        // Validate edit timing (2 hours before meal)
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const currentDate = now.toISOString().split('T')[0];
        
        const mealTimings = {
            breakfast: { editDeadline: "05:00" },
            lunch: { editDeadline: "10:30" },
            snacks: { editDeadline: "14:30" },
            dinner: { editDeadline: "17:30" }
        };

        // If editing today's pause, check time restrictions
        if (pause_from === currentDate) {
            const requestedMeals = pause_meals.split(',');
            for (const meal of requestedMeals) {
                const mealTrim = meal.trim();
                if (mealTimings[mealTrim] && currentTime >= mealTimings[mealTrim].editDeadline) {
                    return res.status(400).json({ 
                        message: `Cannot edit ${mealTrim} - deadline passed (2 hours before meal time)` 
                    });
                }
            }
        }

        // Update the pause
        const updatedFoodPause = await FoodPause.findOneAndUpdate(
            { student_id: student._id },
            {
                $set: {
                    pause_from,
                    pause_meals,
                    resume_from: null, // Single day pause only
                    resume_meals: null
                }
            },
            { new: true, upsert: false }
        );

        res.status(200).json({
            message: 'Food service pause updated successfully',
            data: updatedFoodPause
        });

    } catch (error) {
        console.error('Error updating food pause:', error);
        res.status(500).json({ 
            message: 'Failed to update food service pause',
            error: error.message 
        });
    }
}));

// Cancel food pause
foodApp.delete('/cancel-pause/:studentId', expressAsyncHandler(async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await StudentModel.findOne({ rollNumber: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const deletedPause = await FoodPause.findOneAndDelete({ student_id: student._id });
        
        if (!deletedPause) {
            return res.status(404).json({ message: 'No pause found to cancel' });
        }

        res.status(200).json({
            message: 'Food pause cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling food pause:', error);
        res.status(500).json({ 
            message: 'Failed to cancel food pause',
            error: error.message 
        });
    }
}));

// Get weekly food menu for students
foodApp.get('/student/menu/week', expressAsyncHandler(async (req, res) => {
    try {
        // Get start and end of current week (Monday to Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
        // Calculate Monday
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
        // Get YYYY-MM-DD for Monday and Sunday
        const mondayStr = monday.toISOString().split('T')[0];
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const sundayStr = sunday.toISOString().split('T')[0];
        // Find all menus where date is between monday and sunday (date part only)
        const menus = await FoodMenu.aggregate([
            {
                $addFields: {
                    dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } }
                }
            },
            {
                $match: {
                    dateStr: { $gte: mondayStr, $lte: sundayStr }
                }
            },
            { $sort: { date: 1 } }
        ]);
        res.status(200).json(menus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Get today's food menu for students
foodApp.get('/student/menu/today', expressAsyncHandler(async (req, res) => {
    try {
        const today = new Date();
        // Get YYYY-MM-DD string for today in UTC
        const todayStr = today.toISOString().split('T')[0];
        // Find menu where date matches today (date part only)
        let menu = await FoodMenu.findOne({
            $expr: {
                $eq: [
                    { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } },
                    todayStr
                ]
            }
        });
        if (!menu) {
            res.status(404).json({ message: "No menu found for today" });
            return;
        }
        res.status(200).json(menu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Submit food feedback
// Expects: { studentId: <rollNumber or ObjectId>, mealType, rating, feedback }
foodApp.post('/student/feedback', expressAsyncHandler(async (req, res) => {
    try {
        const { studentId, mealType, rating, feedback } = req.body;

        if (!studentId || !mealType || !rating) {
            return res.status(400).json({ message: 'studentId, mealType and rating are required' });
        }

        // Resolve student: allow rollNumber or _id
        let student = null;
        if (/^[0-9a-fA-F]{24}$/.test(String(studentId))) {
            student = await StudentModel.findById(studentId);
        }
        if (!student) {
            student = await StudentModel.findOne({ rollNumber: studentId });
        }
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Today's normalized date string
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        // Upsert feedback for (student_id, mealType, dateStr)
        const update = {
            student_id: student._id,
            mealType,
            rating,
            feedback: feedback || '',
            date: today,
            dateStr
        };

        const opts = { new: true, upsert: true, setDefaultsOnInsert: true };

        const saved = await FoodFeedback.findOneAndUpdate(
            { student_id: student._id, mealType: mealType, dateStr: dateStr },
            update,
            opts
        );

        res.status(201).json({ message: 'Feedback submitted successfully', feedback: saved });
    } catch (error) {
        // Handle unique index conflicts (should not happen due to upsert) and other errors
        console.error('Error saving feedback:', error);
        res.status(500).json({ error: error.message });
    }
}));

// Get today's feedback status for current student
foodApp.get('/student/feedback/today-status', expressAsyncHandler(async (req, res) => {
    try {
        const { studentId } = req.query;

        if (!studentId) {
            return res.status(400).json({ message: 'studentId is required' });
        }

        // Resolve student: allow rollNumber or _id
        let student = null;
        if (/^[0-9a-fA-F]{24}$/.test(String(studentId))) {
            student = await StudentModel.findById(studentId);
        }
        if (!student) {
            student = await StudentModel.findOne({ rollNumber: studentId });
        }
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Today's normalized date string
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        // Find feedback for all 4 meals for today
        const mealTypes = ['breakfast', 'lunch', 'snacks', 'dinner'];
        const feedbackStatus = {};

        for (const mealType of mealTypes) {
            const feedback = await FoodFeedback.findOne({
                student_id: student._id,
                mealType: mealType,
                dateStr: dateStr
            });
            feedbackStatus[mealType] = {
                submitted: !!feedback,
                rating: feedback ? feedback.rating : null,
                feedback: feedback ? feedback.feedback : null
            };
        }

        res.status(200).json(feedbackStatus);
    } catch (error) {
        console.error('Error fetching feedback status:', error);
        res.status(500).json({ error: error.message });
    }
}));

// Note: Student feedback history endpoint removed since feedback is now anonymous

// Get weekly menu for students with date-based structure (next 7 days from today)
foodApp.get('/student/menu/weekly-schedule', expressAsyncHandler(async (req, res) => {
    try {
        // Get next 7 days starting from today
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Calculate 7 days from today
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 6); // 6 days ahead (today + 6 = 7 days total)
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log(`[WEEKLY SCHEDULE] Fetching menus from ${todayStr} to ${endDateStr}`);
        
        // Find all menus where date is between today and next 6 days
        const menus = await FoodMenu.aggregate([
            {
                $addFields: {
                    dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } }
                }
            },
            {
                $match: {
                    dateStr: { $gte: todayStr, $lte: endDateStr }
                }
            },
            { $sort: { date: 1 } }
        ]);
        
        console.log(`[WEEKLY SCHEDULE] Found ${menus.length} menus for the next 7 days:`, menus.map(m => ({ date: m.dateStr, hasBreakfast: !!m.breakfast, hasLunch: !!m.lunch, hasDinner: !!m.dinner, hasSnacks: !!m.snacks })));
        
        // Create a complete schedule array with all 7 days (fill missing days with sample menus)
        const schedule = [];
        const sampleMenus = {
            breakfast: 'Bread, Butter, Jam',
            lunch: 'Rice, Dal Fry, Salad',
            snacks: 'Fruit Salad, Tea',
            dinner: 'Chapati, Veg Korma, Curd'
        };
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Find menu for this date
            const menu = menus.find(m => m.dateStr === dateStr);
            
            if (menu) {
                schedule.push({
                    date: dateStr,
                    dateStr: dateStr,
                    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    breakfast: menu.breakfast || sampleMenus.breakfast,
                    lunch: menu.lunch || sampleMenus.lunch,
                    snacks: menu.snacks || sampleMenus.snacks,
                    dinner: menu.dinner || sampleMenus.dinner
                });
            } else {
                // Add sample menu for missing dates
                schedule.push({
                    date: dateStr,
                    dateStr: dateStr,
                    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    breakfast: sampleMenus.breakfast,
                    lunch: sampleMenus.lunch,
                    snacks: sampleMenus.snacks,
                    dinner: sampleMenus.dinner
                });
            }
        }
        
        console.log(`[WEEKLY SCHEDULE] Returning schedule with ${schedule.length} days`);
        res.status(200).json(schedule);
    } catch (error) {
        console.error('Error fetching weekly schedule:', error);
        res.status(500).json({ error: error.message });
    }
}));

// Get weekly schedule from WeeklyFoodMenu model (the working version)
foodApp.get('/student/menu/weekly-schedule-structured', expressAsyncHandler(async (req, res) => {
    try {
        const { WeeklyFoodMenu } = require('../models/FoodModel');
        
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const dayOfMonth = today.getDate();
        
        // Calculate which week of the month we're in
        const weekOfMonth = Math.ceil(dayOfMonth / 7);
        const currentWeek = Math.min(weekOfMonth, 4);
        
        console.log(`[WEEKLY SCHEDULE STRUCTURED] Fetching for month: ${currentMonth}, year: ${currentYear}, week: ${currentWeek}`);
        
        // Get the current week's menu
        const weekMenu = await WeeklyFoodMenu.findOne({
            month: currentMonth,
            year: currentYear,
            week: currentWeek
        });
        
        console.log(`[WEEKLY SCHEDULE STRUCTURED] Found week menu:`, weekMenu ? 'Yes' : 'No');
        
        // Generate next 7 days starting from today
        const schedule = [];
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            const dayName = dayNames[dayOfWeek];
            
            let dayMenuData = {
                breakfast: 'Bread, Butter, Jam',
                lunch: 'Rice, Dal Fry, Salad', 
                snacks: 'Fruit Salad, Tea',
                dinner: 'Chapati, Veg Korma, Curd'
            };
            
            // If we have week menu data, use it
            if (weekMenu && weekMenu.days && weekMenu.days[dayName]) {
                const menuDay = weekMenu.days[dayName];
                dayMenuData = {
                    breakfast: menuDay.breakfast || dayMenuData.breakfast,
                    lunch: menuDay.lunch || dayMenuData.lunch,
                    snacks: menuDay.snacks || dayMenuData.snacks,
                    dinner: menuDay.dinner || dayMenuData.dinner
                };
            }
            
            schedule.push({
                date: dateStr,
                dateStr: dateStr,
                weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
                ...dayMenuData
            });
        }
        
        console.log(`[WEEKLY SCHEDULE STRUCTURED] Returning ${schedule.length} days of schedule`);
        res.status(200).json(schedule);
        
    } catch (error) {
        console.error('Error fetching structured weekly schedule:', error);
        res.status(500).json({ error: error.message });
    }
}));

// Get today's menu from weekly schedule
foodApp.get('/student/menu/today-from-schedule', expressAsyncHandler(async (req, res) => {
    try {
        const { WeeklyFoodMenu } = require('../models/FoodModel');
        
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const dayOfMonth = today.getDate();
        const dayOfWeek = today.getDay();
        
        // Calculate which week of the month
        const weekOfMonth = Math.ceil(dayOfMonth / 7);
        const adjustedWeek = Math.min(weekOfMonth, 4);
        
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        
        // Find the appropriate week menu
        const weekMenu = await WeeklyFoodMenu.findOne({
            month: currentMonth,
            year: currentYear,
            week: adjustedWeek
        });
        
        if (!weekMenu || !weekMenu.days[dayName]) {
            return res.status(404).json({ message: "No menu found for today" });
        }
        
        const todayMenu = {
            date: today.toISOString().split('T')[0],
            weekday: today.toLocaleDateString('en-US', { weekday: 'long' }),
            ...weekMenu.days[dayName]
        };
        
        res.status(200).json(todayMenu);
    } catch (error) {
        console.error('Error fetching today\'s menu:', error);
        res.status(500).json({ error: error.message });
    }
}));

// Get daily food statistics for admin
foodApp.get('/admin/food/stats/today', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Total number of students
        const totalStudents = await StudentModel.countDocuments();

        // Find students who have active pauses (paused but not yet resumed)
        // Convert today's date to YYYY-MM-DD format to match FoodPause model
        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const pausedStudents = await FoodPause.find({
            $and: [
                { pause_from: { $lte: todayStr } },
                {
                    $or: [
                        { resume_from: { $exists: false } },
                        { resume_from: null },
                        { resume_from: { $gte: todayStr } }
                    ]
                }
            ]
        });

        let breakfastPaused = 0;
        let lunchPaused = 0;
        let snacksPaused = 0;
        let dinnerPaused = 0;

        const pausedStudentIds = pausedStudents.map(p => p.student_id.toString());

        for (const pause of pausedStudents) {
            // pause_meals is stored as comma-separated string, so split it
            const pausedMeals = pause.pause_meals ? pause.pause_meals.split(',') : [];
            
            if (pausedMeals.includes('breakfast')) breakfastPaused++;
            if (pausedMeals.includes('lunch')) lunchPaused++;
            if (pausedMeals.includes('snacks')) snacksPaused++;
            if (pausedMeals.includes('dinner')) dinnerPaused++;
        }

        // Total students taking meals today
        const totalMealsToday = totalStudents - pausedStudentIds.length;

        console.log('=== FOOD STATS DEBUG ===');
        console.log(`Today: ${todayStr}`);
        console.log(`Total students: ${totalStudents}`);
        console.log(`Found ${pausedStudents.length} paused students:`, pausedStudents);
        console.log('======================');

        res.status(200).json({
            totalMealsToday,
            breakfastPaused,
            lunchPaused,
            snacksPaused,
            dinnerPaused,
            debug: {
                totalStudents,
                pausedStudentsCount: pausedStudents.length,
                todayStr,
                pausedStudents: pausedStudents.map(p => ({
                    student_id: p.student_id,
                    pause_from: p.pause_from,
                    resume_from: p.resume_from,
                    pause_meals: p.pause_meals
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Debug endpoint to check food pause records
foodApp.get('/debug/food-pauses', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const allFoodPauses = await FoodPause.find().populate('student_id', 'rollNumber name');
        const today = new Date().toISOString().split('T')[0];
        
        const activePauses = await FoodPause.find({
            $and: [
                { pause_from: { $lte: today } },
                {
                    $or: [
                        { resume_from: { $exists: false } },
                        { resume_from: null },
                        { resume_from: { $gte: today } }
                    ]
                }
            ]
        }).populate('student_id', 'rollNumber name');

        res.status(200).json({
            total: allFoodPauses.length,
            active: activePauses.length,
            today: today,
            allPauses: allFoodPauses,
            activePauses: activePauses
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Weekly menu management routes
foodApp.get('/menu/monthly', getMonthlyMenu);
foodApp.put('/menu/day', updateDayMenu);
foodApp.get('/menu/current-week', getCurrentWeek);
foodApp.put('/menu/week', updateWeekMenu);

// Analytics endpoints
foodApp.get('/analytics/dashboard-data', verifyAdmin, getDashboardData);
foodApp.get('/analytics/export-data', verifyAdmin, getExportData);

// Enhanced food pause management
const foodEnhancedRoutes = require('./foodAPIEnhanced');
foodApp.use('/enhanced', foodEnhancedRoutes);

// Debug endpoint to check food pause data
foodApp.get('/debug/food-pauses', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const pauses = await FoodPause.find().limit(10).populate('student_id', 'name rollNumber');
        const count = await FoodPause.countDocuments();
        
        // Count by date range
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = monthEnd.toISOString().split('T')[0];
        
        const thisMonthCount = await FoodPause.countDocuments({
            $or: [
                { pause_from: { $gte: monthStartStr, $lte: monthEndStr } },
                { resume_from: { $gte: monthStartStr, $lte: monthEndStr } }
            ]
        });
        
        res.json({
            total: count,
            thisMonth: thisMonthCount,
            monthRange: { start: monthStartStr, end: monthEndStr },
            sample: pauses,
            message: `Found ${count} total pause records (${thisMonthCount} in current month)`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Debug endpoint to check food menus
foodApp.get('/debug/food-menus', expressAsyncHandler(async (req, res) => {
    try {
        const { FoodMenu } = require('../models/FoodModel');
        const menus = await FoodMenu.find().sort({ date: -1 }).limit(10);
        const count = await FoodMenu.countDocuments();
        
        const today = new Date().toISOString().split('T')[0];
        const todayMenu = await FoodMenu.findOne({
            $expr: {
                $eq: [
                    { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "UTC" } },
                    today
                ]
            }
        });
        
        res.json({
            total: count,
            sample: menus.map(m => ({
                _id: m._id,
                date: m.date,
                dateStr: m.date.toISOString().split('T')[0],
                breakfast: m.breakfast?.substring(0, 50) + '...',
                lunch: m.lunch?.substring(0, 50) + '...',
                dinner: m.dinner?.substring(0, 50) + '...',
                snacks: m.snacks?.substring(0, 50) + '...'
            })),
            todayMenu: todayMenu ? {
                date: todayMenu.date,
                dateStr: todayMenu.date.toISOString().split('T')[0],
                breakfast: todayMenu.breakfast,
                lunch: todayMenu.lunch,
                dinner: todayMenu.dinner,
                snacks: todayMenu.snacks
            } : null,
            message: `Found ${count} food menu records`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Test endpoint to quickly create sample food pause data
foodApp.post('/debug/create-test-data', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        console.log('[Test Data] Creating sample FoodPause records for testing');
        
        // Get first 5 students
        const students = await StudentModel.find().limit(5);
        if (students.length === 0) {
            return res.status(400).json({ error: 'No students found in database' });
        }
        
        const testPauses = [];
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        // Create pauses for Oct 1-15
        for (let day = 1; day <= 15; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            
            // Create 2-3 pauses per day for different students
            for (let i = 0; i < Math.min(3, students.length); i++) {
                testPauses.push({
                    student_id: students[i]._id,
                    pause_from: dateStr,
                    pause_meals: i % 2 === 0 ? 'breakfast,lunch' : 'lunch,snacks',
                    resume_from: day < 14 ? new Date(year, month, day + 1).toISOString().split('T')[0] : null,
                    resume_meals: day < 14 ? (i % 2 === 0 ? 'breakfast,lunch' : 'lunch,snacks') : null
                });
            }
        }
        
        const result = await FoodPause.insertMany(testPauses);
        console.log(`[Test Data] ✓ Inserted ${result.length} test records`);
        
        res.json({
            success: true,
            message: `Created ${result.length} test FoodPause records for Oct 1-15`,
            inserted: result.length,
            dateRange: {
                start: new Date(year, month, 1).toISOString().split('T')[0],
                end: new Date(year, month, 15).toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('[Test Data] Error:', error);
        res.status(500).json({ error: error.message });
    }
}));

module.exports = foodApp;
