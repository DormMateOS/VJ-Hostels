const expressAsyncHandler = require('express-async-handler');
const { FoodMenu } = require('../models/FoodModel');

/**
 * Get monthly menu
 */
const getMonthlyMenu = expressAsyncHandler(async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        
        const targetMonth = month ? parseInt(month) : now.getMonth();
        const targetYear = year ? parseInt(year) : now.getFullYear();
        
        // Get all menus for the specified month
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 1);
        
        const menus = await FoodMenu.find({
            date: {
                $gte: startDate,
                $lt: endDate
            }
        }).sort({ date: 1 });
        
        res.status(200).json({
            success: true,
            month: targetMonth,
            year: targetYear,
            menus: menus
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Update day menu
 */
const updateDayMenu = expressAsyncHandler(async (req, res) => {
    try {
        const { date, breakfast, lunch, snacks, dinner } = req.body;
        
        if (!date) {
            return res.status(400).json({ success: false, error: 'Date is required' });
        }
        
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        
        const updatedMenu = await FoodMenu.findOneAndUpdate(
            { date: dateObj },
            {
                breakfast: breakfast || '',
                lunch: lunch || '',
                snacks: snacks || '',
                dinner: dinner || ''
            },
            { new: true, upsert: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'Menu updated successfully',
            menu: updatedMenu
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get current week menu
 */
const getCurrentWeek = expressAsyncHandler(async (req, res) => {
    try {
        const now = new Date();
        const dayOfWeek = now.getDay();
        
        // Calculate week start (Sunday = 0)
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const menus = await FoodMenu.find({
            date: {
                $gte: weekStart,
                $lt: weekEnd
            }
        }).sort({ date: 1 });
        
        res.status(200).json({
            success: true,
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            menus: menus
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Update week menu
 */
const updateWeekMenu = expressAsyncHandler(async (req, res) => {
    try {
        const { weekData } = req.body;
        
        if (!weekData || !Array.isArray(weekData)) {
            return res.status(400).json({ success: false, error: 'Week data array is required' });
        }
        
        const updatedMenus = [];
        
        for (const dayMenu of weekData) {
            const dateObj = new Date(dayMenu.date);
            dateObj.setHours(0, 0, 0, 0);
            
            const updated = await FoodMenu.findOneAndUpdate(
                { date: dateObj },
                {
                    breakfast: dayMenu.breakfast || '',
                    lunch: dayMenu.lunch || '',
                    snacks: dayMenu.snacks || '',
                    dinner: dayMenu.dinner || ''
                },
                { new: true, upsert: true }
            );
            
            updatedMenus.push(updated);
        }
        
        res.status(200).json({
            success: true,
            message: 'Week menu updated successfully',
            menus: updatedMenus
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = {
    getMonthlyMenu,
    updateDayMenu,
    getCurrentWeek,
    updateWeekMenu
};
