const expressAsyncHandler = require('express-async-handler');
const { FoodMenu, WeeklyFoodMenu } = require('../models/FoodModel');

// Epoch for rotation (choose a Monday so week boundaries align). You can change this later.
const ROTATION_EPOCH_UTC = new Date(Date.UTC(2025, 0, 6)); // 2025-01-06 (Monday)

function getRotationWeekIndex(date = new Date()) {
    // normalize date to UTC midnight
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceEpoch = Math.floor((d - ROTATION_EPOCH_UTC) / msPerWeek);
    const idx = ((weeksSinceEpoch % 4) + 4) % 4; // ensure positive
    return idx + 1; // 1..4
}

/**
 * Get template menu data (returns the 4 rotation templates)
 */
const getMonthlyMenu = expressAsyncHandler(async (req, res) => {
    try {
        // Fetch all 4 templates (week 1..4)
        const weeklyMenus = await WeeklyFoodMenu.find({}).sort({ week: 1 });
        
        res.status(200).json({
            success: true,
            data: weeklyMenus
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
        const { date, week, day, breakfast, lunch, snacks, dinner } = req.body;
        
        let dateObj;
        
        // If date is provided, use it directly
        if (date) {
            dateObj = new Date(date);
            dateObj.setHours(0, 0, 0, 0);
        }
        // If week and day are provided, calculate the date from rotation
        else if (week && day) {
            // This is a template update for the weekly rotation
            const weekNumber = parseInt(week.toString().replace('week', ''));
            
            if (!weekNumber || isNaN(weekNumber) || weekNumber < 1 || weekNumber > 4) {
                return res.status(400).json({ success: false, error: 'Invalid week number' });
            }
            
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayLower = day.toString().toLowerCase();
            
            if (!validDays.includes(dayLower)) {
                return res.status(400).json({ success: false, error: 'Invalid day' });
            }
            
            // Update the weekly rotation template instead
            const emptyWeekStructure = {
                monday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                tuesday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                wednesday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                thursday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                friday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                saturday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                sunday: { breakfast: '', lunch: '', snacks: '', dinner: '' }
            };
            
            let weeklyMenu = await WeeklyFoodMenu.findOne({
                week: weekNumber
            });
            
            if (!weeklyMenu) {
                weeklyMenu = new WeeklyFoodMenu({
                    week: weekNumber,
                    days: emptyWeekStructure
                });
            }
            
            weeklyMenu.days[dayLower] = {
                breakfast: breakfast || '',
                lunch: lunch || '',
                snacks: snacks || '',
                dinner: dinner || ''
            };
            
            await weeklyMenu.save();
            
            return res.status(200).json({
                success: true,
                message: 'Menu template updated successfully',
                data: weeklyMenu.days[dayLower]
            });
        }
        else {
            return res.status(400).json({ success: false, error: 'Either date or (week and day) are required' });
        }
        
        // Update the daily menu (if date was provided)
        const updated = await FoodMenu.findOneAndUpdate(
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
            data: updated
        });
        
    } catch (error) {
        console.error('Error updating day menu:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update menu',
            error: error.message
        });
    }
});

// Get current week number
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


// Create or update entire week menu
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
