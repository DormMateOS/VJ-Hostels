const { WeeklyFoodMenu } = require('../models/FoodModel');

// Get monthly menu data
const getMonthlyMenu = async (req, res) => {
    try {
        const { month, year } = req.query;
        
        // Use current month/year if not provided
        const now = new Date();
        const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
        const targetYear = year ? parseInt(year) : now.getFullYear();
        
        // Fetch all weeks for the specified month/year
        const weeklyMenus = await WeeklyFoodMenu.find({
            month: targetMonth,
            year: targetYear
        }).sort({ week: 1 });
        
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
            data: monthlyMenuData,
            month: targetMonth,
            year: targetYear
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
        
        // Get current month/year
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        // Extract week number from week string (e.g., "week1" -> 1)
        const weekNumber = parseInt(week.replace('week', ''));
        
        // Find the weekly menu document
        let weeklyMenu = await WeeklyFoodMenu.findOne({
            month: currentMonth,
            year: currentYear,
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
                month: currentMonth,
                year: currentYear,
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
        const dayOfMonth = now.getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7);
        const currentWeek = Math.min(weekNumber, 4);
        
        res.status(200).json({
            success: true,
            currentWeek: currentWeek,
            month: now.getMonth() + 1,
            year: now.getFullYear()
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
        
        // Get current month/year
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        // Extract week number from week string
        const weekNumber = parseInt(week.replace('week', ''));
        
        // Update or create the weekly menu
        const weeklyMenu = await WeeklyFoodMenu.findOneAndUpdate(
            {
                month: currentMonth,
                year: currentYear,
                week: weekNumber,
                weekName: week
            },
            {
                month: currentMonth,
                year: currentYear,
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
