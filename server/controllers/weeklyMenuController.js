const { WeeklyFoodMenu } = require('../models/FoodModel');

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

// Get template menu data (returns the 4 rotation templates)
const getMonthlyMenu = async (req, res) => {
    try {
        // Fetch all 4 templates (week 1..4)
        const weeklyMenus = await WeeklyFoodMenu.find({}).sort({ week: 1 });
        
        // Transform data to match frontend structure
        const monthlyMenuData = {};
        
        weeklyMenus.forEach(weekMenu => {
            monthlyMenuData[weekMenu.weekName] = weekMenu.days;
        });
        
        // If no data found, return empty structure
        if (Object.keys(monthlyMenuData).length === 0) {
            const emptyWeekStructure = {
                monday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                tuesday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                wednesday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                thursday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                friday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                saturday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                sunday: { breakfast: '', lunch: '', snacks: '', dinner: '' }
            };
            
            for (let i = 1; i <= 4; i++) {
                monthlyMenuData[`week${i}`] = { ...emptyWeekStructure };
            }
        }
        
        res.status(200).json({
            success: true,
            data: monthlyMenuData
        });
        
    } catch (error) {
        console.error('Error fetching monthly menu:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch monthly menu',
            error: error.message
        });
    }
};

// Update specific day's menu
const updateDayMenu = async (req, res) => {
    try {
        const { week, day, breakfast, lunch, snacks, dinner } = req.body;
        
        if (!week || !day) {
            return res.status(400).json({
                success: false,
                message: 'Week and day are required'
            });
        }
        
        // Extract week number from week string (e.g., "week1" -> 1)
        const weekNumber = parseInt(week.replace('week', ''));

        // Find the weekly menu document (rotation template is yearless)
        let weeklyMenu = await WeeklyFoodMenu.findOne({
            week: weekNumber,
            weekName: week
        });
        
        // If document doesn't exist, create it
        if (!weeklyMenu) {
            const emptyWeekStructure = {
                monday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                tuesday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                wednesday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                thursday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                friday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                saturday: { breakfast: '', lunch: '', snacks: '', dinner: '' },
                sunday: { breakfast: '', lunch: '', snacks: '', dinner: '' }
            };
            
            weeklyMenu = new WeeklyFoodMenu({
                week: weekNumber,
                weekName: week,
                days: emptyWeekStructure
            });
        }
        
        // Update the specific day's menu
        weeklyMenu.days[day] = {
            breakfast: breakfast || '',
            lunch: lunch || '',
            snacks: snacks || '',
            dinner: dinner || ''
        };
        
        // Save the updated document
        await weeklyMenu.save();
        
        res.status(200).json({
            success: true,
            message: 'Menu updated successfully',
            data: weeklyMenu.days[day]
        });
        
    } catch (error) {
        console.error('Error updating day menu:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update menu',
            error: error.message
        });
    }
};

// Get current week number
const getCurrentWeek = async (req, res) => {
    try {
        const now = new Date();
        const currentWeek = getRotationWeekIndex(now);

        res.status(200).json({
            success: true,
            currentWeek: currentWeek
        });
        
    } catch (error) {
        console.error('Error getting current week:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get current week',
            error: error.message
        });
    }
};

// Create or update entire week menu
const updateWeekMenu = async (req, res) => {
    try {
        const { week, days } = req.body;
        
        if (!week || !days) {
            return res.status(400).json({
                success: false,
                message: 'Week and days data are required'
            });
        }
        
        // Extract week number from week string
        const weekNumber = parseInt(week.replace('week', ''));

        // Update or create the weekly rotation template
        const weeklyMenu = await WeeklyFoodMenu.findOneAndUpdate(
            {
                week: weekNumber,
                weekName: week
            },
            {
                week: weekNumber,
                weekName: week,
                days: days
            },
            {
                upsert: true,
                new: true
            }
        );
        
        res.status(200).json({
            success: true,
            message: 'Week menu updated successfully',
            data: weeklyMenu
        });
        
    } catch (error) {
        console.error('Error updating week menu:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update week menu',
            error: error.message
        });
    }
};

module.exports = {
    getMonthlyMenu,
    updateDayMenu,
    getCurrentWeek,
    updateWeekMenu
};
