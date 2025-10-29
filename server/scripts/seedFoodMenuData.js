const mongoose = require('mongoose');
const { WeeklyFoodMenu } = require('../models/FoodModel');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DBURL);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Sample monthly menu data
const WeeklyMenuData = {
    week1: {
        monday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, MYSORE BONDA WITH PEANUT & GINGER CHUTNEY",
            lunch: "WHITE RICE, SAMBAR, CURD, LADY FINGER FRY, PALAK PAPPU,DOSAKAYA CHUTNEY",
            snacks: "NOODLES, VEG/EGG",
            dinner: "WHITE RICE, ROTI, POTATO & TOMATO CURRY"
        },
        tuesday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, TOMATO RICE WITH RAITA",
            lunch: "WHITE RICE, SAMBAR, CURD, VEG PULAV, RAITHA",
            snacks: "MASALA CHAT",
            dinner: "WHITE RICE, ROTI, PIZZA, PANNER CURRY, MANGO PICKLE"
        },
        wednesday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, SET DOSA",
            lunch: "WHITE RICE, SAMBAR, CURD, POORIS (4), ALOO CURRY",
            snacks: "PANI PURI",
            dinner: "WHITE RICE, ROTI, KAJU PANEER, VEG MASALA, COCONUT LEAVES, GONGURA MASALA"
        },
        thursday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, UTTAPAM",
            lunch: "WHITE RICE, SAMBAR, CURD, PALAK RICE WITH RAITHA",
            snacks: "BOYS: MASALA VADA WITH MINT CHUTNEY / GIRLS: ONION PAKODA WITH MINT CHUTNEY",
            dinner: "WHITE RICE, ROTI, PANEER BUTTER MASALA"
        },
        friday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, VADA (4) (BOYS/GIRLS)",
            lunch: "WHITE RICE, SAMBAR, CURD, CRISPY ALOO FRY (B/G), MANGO PAPPU, COCONUT CHUTNEY",
            snacks: "SWEET (GULAB JAMUN), MIRCHI BAJJI",
            dinner: "WHITE RICE, ROTI, VEG BIRYANI, EGG BIRYANI, MASALA GRAVY (EGG CURRY), ONION, CUCUMBER, TOMATO, RAITHA"
        },
        saturday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, GIRLS: IDLY (BOYS) / VADA (4) (GIRLS)",
            lunch: "WHITE RICE, SAMBAR, CURD, (BOYS) IDLY WITH CHICKEN CURRY (LIMITED) / (GIRLS) ALOO CHOLA",
            snacks: "BOYS: MASALA CHAT / GIRLS: VEG MAGGI",
            dinner: "WHITE RICE, ROTI, SAMBAR RICE, BUDDAPAPPU PACHADI, BANANA"
        },
        sunday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, POORI & ALOO (B/G)",
            lunch: "WHITE RICE, SAMBAR, CURD, ALOO AND BEETROOT BEANS FASIA (TOTALURA PAPPU), MATTIGA KULU (MIX VEG CHUTNEY)",
            snacks: "SEASONAL JUICE/FRUITS (LESS WATERMELON)",
            dinner: "GIRLS: VEG BIRYANI WITH BASMATI RICE, CHICKEN CURRY, PANEER CURRY / BOYS: CHICKEN BIRYANI WITH BASMATI RICE, CHICKEN CURRY, PANEER CURRY"
        }
    },
    week2: {
        monday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, PONGAL",
            lunch: "WHITE RICE, SAMBAR, CURD, CABBAGE FRY",
            snacks: "GIRLS/BOYS: NOODLES, VEG EGG",
            dinner: "WHITE RICE, ROTI, EGG CURRY, TOMATO CURRY, DOSAKAYA CHUTNEY"
        },
        tuesday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, PONGAL",
            lunch: "WHITE RICE, SAMBAR, CURD, CABBAGE, SATTILU FRY, TOMATO PAPPU, GONGURA CHUTNEY",
            snacks: "GIRLS: TOMATO SAUCE SALAD (WITH ONION CHUTNEY) / BOYS: ALOO BONDA (PULUSU CHUTNEY)",
            dinner: "WHITE RICE, ROTI, EGG CURRY, TOMATO CURRY, BENDI FRY, MANGO PICKLE"
        },
        wednesday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, IDLY",
            lunch: "WHITE RICE, SAMBAR, CURD, POORIS (4), LITTLE CUT VEGETABLE CURRY, GONGURA CHUTNEY, KAKARAKAYA PAPPU, TOMATO CHUTNEY",
            snacks: "BOYS: SWEET CORN, SENGALU, JAMMUKAI / GIRLS: THREE BEANS SALAD, CORN FLAKES, UPMA",
            dinner: "WHITE RICE, ROTI, ALOO, PANEER, BUTTER MASALA, VANKAYA CHUTNEY"
        },
        thursday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, SENIYA OR UTTAPAM",
            lunch: "WHITE RICE, SAMBAR, CURD, ALU-CHOKA & BINDI AZE, VEG-MANCHURIA",
            snacks: "GIRLS: VEG MAGGI / BOYS: MIRCHI BAJJI + FRIED CHILLIES",
            dinner: "WHITE RICE, ROTI, BENDI, TOMATO CURRY, KAKARAKAYA FRY, DOSAKAYA PAPPU"
        },
        friday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, SETT DOSA",
            lunch: "WHITE RICE, SAMBAR, CURD, SEMIYA PAYASAM (B/G), BENDI FRY, RICE DAL TADKA",
            snacks: "ALOO BONDA",
            dinner: "WHITE RICE, ROTI, VEG BIRYANI, EGG BIRYANI, MASALA GRAVY (EGG CURRY), ONION, CUCUMBER, TOMATO, RAITHA"
        },
        saturday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, UTTAPAM",
            lunch: "WHITE RICE, SAMBAR, CURD, (GIRLS) IDLY WITH CHICKEN CURRY (LIMITED) / (BOYS) ALOO CHOLA",
            snacks: "GIRLS: MASALA CHAT / BOYS: VEG MAGGI",
            dinner: "WHITE RICE, ROTI, SAMBAR RICE, BUDDAPAPPU PACHADI, BANANA"
        },
        sunday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, IDLY (B/G)",
            lunch: "WHITE RICE, SAMBAR, CURD, GHEE ROAST MASALA (B/G) WITH SAMBAR",
            snacks: "TOMATO, MUSKMELON APPLE PACHADI, PAPAD, BANANA, MANGO PICKLE",
            dinner: "GIRLS: VEG BIRYANI WITH BASMATI RICE, CHICKEN CURRY, PANEER CURRY / BOYS: CHICKEN BIRYANI WITH BASMATI RICE, CHICKEN CURRY, PANEER CURRY"
        }
    },
    week3: {
        monday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, MASALA DOSA WITH PEANUT CHUTNEY",
            lunch: "WHITE RICE, SAMBAR, CURD, CAULIFLOWER FRY, KAKARAKAYA FRY",
            snacks: "GIRLS/BOYS: NOODLES, VEG EGG",
            dinner: "WHITE RICE, ROTI, EGG CURRY, TOMATO CURRY, DOSAKAYA CHUTNEY"
        },
        tuesday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, PONGAL",
            lunch: "WHITE RICE, SAMBAR, CURD, CABBAGE, SATTILU FRY, TOMATO PAPPU, GONGURA CHUTNEY",
            snacks: "BOYS: MASALA VADA (OR) BONDA (TOMATO SAUCE)",
            dinner: "WHITE RICE, ROTI, EGG CURRY, TOMATO CURRY, BENDI FRY, MANGO PICKLE"
        },
        wednesday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, BESAN UPMA",
            lunch: "WHITE RICE, SAMBAR, CURD, POORIS (4), LITTLE CUT VEGETABLE CURRY, GONGURA CHUTNEY, KAKARAKAYA PAPPU, TOMATO CHUTNEY",
            snacks: "BOYS: SWEET CORN, SENGALU, JAMMUKAI / GIRLS: THREE BEANS SALAD, CORN FLAKES, UPMA",
            dinner: "WHITE RICE, ROTI, ALOO, PANEER, BUTTER MASALA, VANKAYA CHUTNEY"
        },
        thursday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, ONION UTTAPAM WITH CHUTNEY",
            lunch: "WHITE RICE, SAMBAR, CURD, ALU-CHOKA & BINDI AZE, VEG-MANCHURIA",
            snacks: "GIRLS: VEG MAGGI / BOYS: MIRCHI BAJJI + FRIED CHILLIES",
            dinner: "WHITE RICE, ROTI, BENDI, TOMATO CURRY, KAKARAKAYA FRY, DOSAKAYA PAPPU"
        },
        friday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, SETT DOSA",
            lunch: "WHITE RICE, SAMBAR, CURD, SEMIYA PAYASAM (B/G), BENDI FRY, RICE DAL TADKA",
            snacks: "PANEER PAKODA",
            dinner: "WHITE RICE, ROTI, VEG BIRYANI, EGG BIRYANI, MASALA GRAVY (EGG CURRY), ONION, CUCUMBER, TOMATO, RAITHA"
        },
        saturday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, SETT DOSA",
            lunch: "WHITE RICE, SAMBAR, CURD, (BOYS) IDLY WITH CHICKEN CURRY (LIMITED) / (GIRLS) ALOO CHOLA",
            snacks: "BOYS: PANI PURI",
            dinner: "WHITE RICE, ROTI, SAMBAR RICE, BUDDAPAPPU PACHADI, BANANA"
        },
        sunday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE",
            lunch: "WHITE RICE, SAMBAR, CURD, GHEE ROAST MASALA (B/G) WITH SAMBAR",
            snacks: "TOMATO, MUSKMELON APPLE PACHADI, PAPAD, BANANA, MANGO PICKLE",
            dinner: "GIRLS: VEG BIRYANI WITH BASMATI RICE, CHICKEN CURRY, PANEER CURRY / BOYS: CHICKEN BIRYANI WITH BASMATI RICE, CHICKEN CURRY, PANEER CURRY"
        }
    },
    week4: {
        monday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, PONGAL",
            lunch: "WHITE RICE, SAMBAR, CURD, CABBAGE FRY",
            snacks: "BOYS: FRIED RICE, VEG EGG",
            dinner: "WHITE RICE, ROTI, EGG CURRY, TOMATO CURRY, DOSAKAYA CHUTNEY"
        },
        tuesday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, PONGAL",
            lunch: "WHITE RICE, SAMBAR, CURD, CABBAGE, SATTILU FRY, TOMATO PAPPU, GONGURA CHUTNEY",
            snacks: "GIRLS: TOMATO SAUCE SALAD (WITH ONION CHUTNEY) / BOYS: ALOO BONDA (PULUSU CHUTNEY)",
            dinner: "WHITE RICE, ROTI, EGG CURRY, MASALA VADA, VEG CURRY, MANGO PICKLE"
        },
        wednesday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, ONION UTTAPAM WITH CHUTNEY",
            lunch: "WHITE RICE, SAMBAR, CURD, (GIRLS/BOYS) ALOO FRY",
            snacks: "BOYS: SPROUTS, SWEET CORN / GIRLS: CORN FLAKES, UPMA",
            dinner: "WHITE RICE, ROTI, PANEER BUTTER MASALA"
        },
        thursday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, UTTAPAM",
            lunch: "WHITE RICE, SAMBAR, CURD, (GIRLS/BOYS) JEERA RICE, ONE SPICE ALOO",
            snacks: "BOYS: VEG MANCHURIA / GIRLS: SAMOSA WITH FRIED CHILLIES",
            dinner: "WHITE RICE, ROTI, BENDI, TOMATO CURRY, KAKARAKAYA FRY, DOSAKAYA PAPPU"
        },
        friday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, VADA (4) (BOYS/GIRLS)",
            lunch: "WHITE RICE, SAMBAR, CURD, SEMIYA PAYASAM (B/G), BENDI FRY, RICE DAL TADKA",
            snacks: "VEG MAGGI",
            dinner: "WHITE RICE, ROTI, VEG BIRYANI, EGG BIRYANI, MASALA GRAVY (EGG CURRY), ONION, CUCUMBER, TOMATO, RAITHA"
        },
        saturday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE, SETT DOSA",
            lunch: "WHITE RICE, SAMBAR, CURD, (GIRLS) IDLY WITH CHICKEN CURRY (LIMITED) / (BOYS) ALOO CHOLA",
            snacks: "GIRLS: PANI PURI",
            dinner: "WHITE RICE, ROTI, SAMBAR RICE, BUDDAPAPPU PACHADI, BANANA"
        },
        sunday: {
            breakfast: "IDLY, SAMBAR, CHUTNEY, GHEE",
            lunch: "WHITE RICE, SAMBAR, CURD, GHEE ROAST MASALA (B/G) WITH SAMBAR",
            snacks: "TOMATO, MUSKMELON APPLE PACHADI, PAPAD, BANANA, MANGO PICKLE",
            dinner: "GIRLS: VEG BIRYANI WITH BASMATI RICE, CHICKEN CURRY, PANEER CURRY / BOYS: CHICKEN BIRYANI WITH BASMATI RICE, CHICKEN CURRY, PANEER CURRY"
        }
    }
};

// Seed function
const seedFoodMenuData = async () => {
    try {
        console.log('Starting food menu data seeding...');
        
        // Clear existing rotation templates (we keep a single 4-week template set)
        await WeeklyFoodMenu.deleteMany({});
        console.log('Cleared existing weekly rotation templates');

        // Insert the 4 weekly templates (week1..week4)
        const menuPromises = Object.entries(WeeklyMenuData).map(([weekName, weekData]) => {
            const weekNumber = parseInt(weekName.replace('week', ''));

            return WeeklyFoodMenu.create({
                week: weekNumber,
                weekName: weekName,
                days: weekData
            });
        });
        
        await Promise.all(menuPromises);
        console.log('Successfully seeded food menu data for all 4 weeks');
        
        // Verify the data
        const count = await WeeklyFoodMenu.countDocuments({});
        console.log(`Total weekly templates created: ${count}`);
        
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
