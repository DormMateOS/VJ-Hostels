const mongoose = require('mongoose');
const { WeeklyFoodMenu } = require('../models/FoodModel');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DBURL || 'mongodb://localhost:27017/vj-hostels');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Test function to check if data exists
const testMenuData = async () => {
    try {
        console.log('Testing menu data...');
        
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        console.log(`Looking for data in month: ${currentMonth}, year: ${currentYear}`);
        
        // Check if any data exists
        const allData = await WeeklyFoodMenu.find({});
        console.log(`Total records in database: ${allData.length}`);
        
        if (allData.length > 0) {
            console.log('Sample record:', JSON.stringify(allData[0], null, 2));
        }
        
        // Check for current month data
        const currentMonthData = await WeeklyFoodMenu.find({
            month: currentMonth,
            year: currentYear
        });
        
        console.log(`Records for current month (${currentMonth}/${currentYear}): ${currentMonthData.length}`);
        
        if (currentMonthData.length > 0) {
            currentMonthData.forEach(record => {
                console.log(`Week ${record.week} (${record.weekName}): ${Object.keys(record.days).length} days`);
            });
        }
        
    } catch (error) {
        console.error('Error testing menu data:', error);
    }
};

// Main execution
const main = async () => {
    try {
        await connectDB();
        await testMenuData();
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

// Run the script
if (require.main === module) {
    main();
}

module.exports = { testMenuData };
