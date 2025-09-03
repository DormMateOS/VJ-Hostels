const express = require('express');
const foodApp = express.Router();
const expressAsyncHandler = require('express-async-handler');
const { FoodMenu, FoodFeedback } = require('../models/FoodModel');
const { verifyAdmin } = require('../middlewares/verifyToken');
const { getMonthlyMenu, updateDayMenu, getCurrentWeek, updateWeekMenu } = require('../controllers/weeklyMenuController');

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

// Get all feedback
foodApp.get('/admin/feedback', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const feedback = await FoodFeedback.find().sort({ createdAt: -1 });
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
        
        // Get recent feedback trends (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentTrends = await FoodFeedback.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
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
// Get student food pause/resume status
foodApp.get('/student-status', expressAsyncHandler(async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).json({ message: 'studentId is required' });
        }
        const StudentModel = require('../models/StudentModel');
        const student = await StudentModel.findOne({ rollNumber: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        // Assuming pause/resume info is stored in student document
        // If not, adjust according to your schema
        res.status(200).json({
            pause_from: student.pause_from || null,
            resume_from: student.resume_from || null,
            pause_meals: student.pause_meals || '',
            resume_meals: student.resume_meals || ''
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
foodApp.post('/student/feedback', expressAsyncHandler(async (req, res) => {
    try {
        const { mealType, rating, feedback } = req.body;
        
        // Create new feedback without storing student details
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newFeedback = new FoodFeedback({
            mealType,
            rating,
            feedback,
            date: today
        });
        await newFeedback.save();
        res.status(201).json({ message: "Feedback submitted successfully", feedback: newFeedback });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}));

// Note: Student feedback history endpoint removed since feedback is now anonymous

// Get weekly menu for students with date-based structure
foodApp.get('/student/menu/weekly-schedule', expressAsyncHandler(async (req, res) => {
    try {
        const { WeeklyFoodMenu } = require('../models/FoodModel');
        
        // Get current date info
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        // Fetch all weeks for current month
        const weeklyMenus = await WeeklyFoodMenu.find({
            month: currentMonth,
            year: currentYear
        }).sort({ week: 1 });
        
        if (!weeklyMenus.length) {
            return res.status(404).json({ message: "No menu found for current month" });
        }
        
        // Convert weekly menu to daily schedule format
        const schedule = [];
        const today = new Date();
        
        // Generate dates for current month
        for (let day = 1; day <= 31; day++) {
            const date = new Date(currentYear, currentMonth - 1, day);
            if (date.getMonth() !== currentMonth - 1) break; // Stop if we've moved to next month
            
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const weekOfMonth = Math.ceil(day / 7);
            const adjustedWeek = Math.min(weekOfMonth, 4); // Cap at week 4
            
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[dayOfWeek];
            
            // Find the appropriate week menu
            const weekMenu = weeklyMenus.find(w => w.week === adjustedWeek);
            
            if (weekMenu && weekMenu.days[dayName]) {
                const dayMenu = weekMenu.days[dayName];
                schedule.push({
                    date: date.toISOString().split('T')[0],
                    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    breakfast: dayMenu.breakfast || '',
                    lunch: dayMenu.lunch || '',
                    snacks: dayMenu.snacks || '',
                    dinner: dayMenu.dinner || ''
                });
            }
        }
        
        res.status(200).json(schedule);
    } catch (error) {
        console.error('Error fetching weekly schedule:', error);
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

// Weekly menu management routes
foodApp.get('/menu/monthly', getMonthlyMenu);
foodApp.put('/menu/day', updateDayMenu);
foodApp.get('/menu/current-week', getCurrentWeek);
foodApp.put('/menu/week', updateWeekMenu);

module.exports = foodApp;
