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

// Sample monthly menu data
const monthlyMenuData = {
    week1: {
        monday: {
            breakfast: "Idli, Sambar, Chutney",
            lunch: "Rice, Dal, Paneer Curry, Salad",
            snacks: "Samosa, Tea",
            dinner: "Chapati, Mixed Veg Curry, Curd"
        },
        tuesday: {
            breakfast: "Poha, Chutney",
            lunch: "Jeera Rice, Rajma, Salad",
            snacks: "Biscuits, Coffee",
            dinner: "Roti, Aloo Gobi, Raita"
        },
        wednesday: {
            breakfast: "Upma, Chutney",
            lunch: "Rice, Chole, Salad",
            snacks: "Pakora, Tea",
            dinner: "Chapati, Bhindi Masala, Curd"
        },
        thursday: {
            breakfast: "Dosa, Chutney",
            lunch: "Rice, Sambar, Potato Fry",
            snacks: "Cake, Coffee",
            dinner: "Roti, Mixed Veg, Raita"
        },
        friday: {
            breakfast: "Paratha, Curd",
            lunch: "Rice, Dal Makhani, Salad",
            snacks: "Chips, Tea",
            dinner: "Chapati, Paneer Butter Masala, Curd"
        },
        saturday: {
            breakfast: "Puri, Aloo Bhaji",
            lunch: "Veg Biryani, Raita",
            snacks: "Mixture, Coffee",
            dinner: "Roti, Gobi Masala, Curd"
        },
        sunday: {
            breakfast: "Bread, Butter, Jam",
            lunch: "Rice, Dal Fry, Salad",
            snacks: "Fruit Salad, Tea",
            dinner: "Chapati, Veg Korma, Curd"
        }
    },
    week2: {
        monday: {
            breakfast: "Idli, Sambar, Chutney",
            lunch: "Rice, Dal, Paneer Curry, Salad",
            snacks: "Samosa, Tea",
            dinner: "Chapati, Mixed Veg Curry, Curd"
        },
        tuesday: {
            breakfast: "Poha, Chutney",
            lunch: "Jeera Rice, Rajma, Salad",
            snacks: "Biscuits, Coffee",
            dinner: "Roti, Aloo Gobi, Raita"
        },
        wednesday: {
            breakfast: "Upma, Chutney",
            lunch: "Rice, Chole, Salad",
            snacks: "Pakora, Tea",
            dinner: "Chapati, Bhindi Masala, Curd"
        },
        thursday: {
            breakfast: "Dosa, Chutney",
            lunch: "Rice, Sambar, Potato Fry",
            snacks: "Cake, Coffee",
            dinner: "Roti, Mixed Veg, Raita"
        },
        friday: {
            breakfast: "Paratha, Curd",
            lunch: "Rice, Dal Makhani, Salad",
            snacks: "Chips, Tea",
            dinner: "Chapati, Paneer Butter Masala, Curd"
        },
        saturday: {
            breakfast: "Puri, Aloo Bhaji",
            lunch: "Veg Biryani, Raita",
            snacks: "Mixture, Coffee",
            dinner: "Roti, Gobi Masala, Curd"
        },
        sunday: {
            breakfast: "Bread, Butter, Jam",
            lunch: "Rice, Dal Fry, Salad",
            snacks: "Fruit Salad, Tea",
            dinner: "Chapati, Veg Korma, Curd"
        }
    },
    week3: {
        monday: {
            breakfast: "Idli, Sambar, Chutney",
            lunch: "Rice, Dal, Paneer Curry, Salad",
            snacks: "Samosa, Tea",
            dinner: "Chapati, Mixed Veg Curry, Curd"
        },
        tuesday: {
            breakfast: "Poha, Chutney",
            lunch: "Jeera Rice, Rajma, Salad",
            snacks: "Biscuits, Coffee",
            dinner: "Roti, Aloo Gobi, Raita"
        },
        wednesday: {
            breakfast: "Upma, Chutney",
            lunch: "Rice, Chole, Salad",
            snacks: "Pakora, Tea",
            dinner: "Chapati, Bhindi Masala, Curd"
        },
        thursday: {
            breakfast: "Dosa, Chutney",
            lunch: "Rice, Sambar, Potato Fry",
            snacks: "Cake, Coffee",
            dinner: "Roti, Mixed Veg, Raita"
        },
        friday: {
            breakfast: "Paratha, Curd",
            lunch: "Rice, Dal Makhani, Salad",
            snacks: "Chips, Tea",
            dinner: "Chapati, Paneer Butter Masala, Curd"
        },
        saturday: {
            breakfast: "Puri, Aloo Bhaji",
            lunch: "Veg Biryani, Raita",
            snacks: "Mixture, Coffee",
            dinner: "Roti, Gobi Masala, Curd"
        },
        sunday: {
            breakfast: "Bread, Butter, Jam",
            lunch: "Rice, Dal Fry, Salad",
            snacks: "Fruit Salad, Tea",
            dinner: "Chapati, Veg Korma, Curd"
        }
    },
    week4: {
        monday: {
            breakfast: "Idli, Sambar, Chutney",
            lunch: "Rice, Dal, Paneer Curry, Salad",
            snacks: "Samosa, Tea",
            dinner: "Chapati, Mixed Veg Curry, Curd"
        },
        tuesday: {
            breakfast: "Poha, Chutney",
            lunch: "Jeera Rice, Rajma, Salad",
            snacks: "Biscuits, Coffee",
            dinner: "Roti, Aloo Gobi, Raita"
        },
        wednesday: {
            breakfast: "Upma, Chutney",
            lunch: "Rice, Chole, Salad",
            snacks: "Pakora, Tea",
            dinner: "Chapati, Bhindi Masala, Curd"
        },
        thursday: {
            breakfast: "Dosa, Chutney",
            lunch: "Rice, Sambar, Potato Fry",
            snacks: "Cake, Coffee",
            dinner: "Roti, Mixed Veg, Raita"
        },
        friday: {
            breakfast: "Paratha, Curd",
            lunch: "Rice, Dal Makhani, Salad",
            snacks: "Chips, Tea",
            dinner: "Chapati, Paneer Butter Masala, Curd"
        },
        saturday: {
            breakfast: "Puri, Aloo Bhaji",
            lunch: "Veg Biryani, Raita",
            snacks: "Mixture, Coffee",
            dinner: "Roti, Gobi Masala, Curd"
        },
        sunday: {
            breakfast: "Bread, Butter, Jam",
            lunch: "Rice, Dal Fry, Salad",
            snacks: "Fruit Salad, Tea",
            dinner: "Chapati, Veg Korma, Curd"
        }
    }
};

// Seed function
const seedFoodMenuData = async () => {
    try {
        console.log('Starting food menu data seeding...');
        
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        const currentYear = now.getFullYear();
        
        // Clear existing data for current month
        await WeeklyFoodMenu.deleteMany({ 
            month: currentMonth, 
            year: currentYear 
        });
        console.log('Cleared existing menu data for current month');
        
        // Insert new data
        const menuPromises = Object.entries(monthlyMenuData).map(([weekName, weekData]) => {
            const weekNumber = parseInt(weekName.replace('week', ''));
            
            return WeeklyFoodMenu.create({
                month: currentMonth,
                year: currentYear,
                week: weekNumber,
                weekName: weekName,
                days: weekData
            });
        });
        
        await Promise.all(menuPromises);
        console.log('Successfully seeded food menu data for all 4 weeks');
        
        // Verify the data
        const count = await WeeklyFoodMenu.countDocuments({ 
            month: currentMonth, 
            year: currentYear 
        });
        console.log(`Total menu records created: ${count}`);
        
    } catch (error) {
        console.error('Error seeding food menu data:', error);
        throw error;
    }
};

// Main execution
const main = async () => {
    try {
        await connectDB();
        await seedFoodMenuData();
        console.log('Food menu data seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

// Run the script
if (require.main === module) {
    main();
}

module.exports = { seedFoodMenuData };
