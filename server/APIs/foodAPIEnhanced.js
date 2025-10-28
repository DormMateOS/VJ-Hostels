const express = require('express');
const foodEnhancedApp = express.Router();
const expressAsyncHandler = require('express-async-handler');
const FoodPauseEnhanced = require('../models/FoodPauseEnhanced');
const StudentModel = require('../models/StudentModel');
const { verifyAdmin, verifyStudent } = require('../middleware/verifyToken');

// Create enhanced food pause with validation
foodEnhancedApp.post('/pause', expressAsyncHandler(async (req, res) => {
    try {
        const { 
            studentId,
            meals,
            pauseType,
            startDate,
            endDate,
            outpassId = null
        } = req.body;

        if (!studentId || !meals || !pauseType || !startDate || !endDate) {
            return res.status(400).json({ 
                error: 'All required fields must be provided' 
            });
        }

        const student = await StudentModel.findOne({ rollNumber: studentId });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ error: 'Start date cannot be after end date' });
        }

        // Check for overlapping pauses
        const existingPauses = await FoodPauseEnhanced.find({
            student_id: student._id,
            is_active: true,
            $or: meals.map(meal => ({ meal_type: meal })),
            $and: [
                {
                    $or: [
                        { pause_start_date: { $lte: endDate }, pause_end_date: { $gte: startDate } }
                    ]
                }
            ]
        });

        if (existingPauses.length > 0) {
            const conflictingMeals = existingPauses.map(p => p.meal_type);
            return res.status(400).json({ 
                error: `Overlapping pause found for meals: ${conflictingMeals.join(', ')}` 
            });
        }

        // Validate edit timing for today's pauses
        const nowTime = new Date();
        const currentTime = nowTime.toTimeString().slice(0, 5);
        
        // Get current date in local timezone (not UTC)
        const year = nowTime.getFullYear();
        const month = String(nowTime.getMonth() + 1).padStart(2, '0');
        const day = String(nowTime.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;
        
        const mealTimings = {
            breakfast: { editDeadline: "05:00" },
            lunch: { editDeadline: "10:30" },
            snacks: { editDeadline: "14:30" },
            dinner: { editDeadline: "17:30" }
        };

        // Only enforce time-based restrictions for future pauses, not for today
        // For today's pauses that have passed deadline, check if the pause was just cancelled
        if (startDate === currentDate) {
            for (const meal of meals) {
                if (mealTimings[meal] && currentTime >= mealTimings[meal].editDeadline) {
                    // Check if there's an active pause for this meal
                    const activePause = await FoodPauseEnhanced.findOne({
                        student_id: student._id,
                        meal_type: meal,
                        pause_start_date: startDate,
                        is_active: true
                    });
                    
                    // Only block if there's already an active pause
                    if (activePause) {
                        return res.status(400).json({ 
                            error: `Cannot pause ${meal} - deadline passed (2 hours before meal time)` 
                        });
                    }
                }
            }
        }

        // Create pause records for each meal
        const pauseRecords = [];
        for (const meal of meals) {
            const pauseRecord = new FoodPauseEnhanced({
                student_id: student._id,
                meal_type: meal,
                pause_type: pauseType,
                pause_start_date: startDate,
                pause_end_date: endDate,
                outpass_id: outpassId,
                approval_status: 'approved',
                is_active: true
            });
            
            const saved = await pauseRecord.save();
            pauseRecords.push(saved);
        }

        // Send notification (placeholder for future implementation)
        console.log(`Food pause created for student ${student.rollNumber}: ${meals.join(', ')} from ${startDate} to ${endDate}`);

        res.status(201).json({
            message: 'Food pause created successfully',
            pauses: pauseRecords
        });

    } catch (error) {
        console.error('Error creating food pause:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'Duplicate pause detected for the same meal and date range' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
}));

// Get student's paused meals
foodEnhancedApp.get('/my-pauses', expressAsyncHandler(async (req, res) => {
    try {
        const { studentId } = req.query;

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        const student = await StudentModel.findOne({ rollNumber: studentId });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const pauses = await FoodPauseEnhanced.find({ 
            student_id: student._id 
        })
        .populate('outpass_id', 'outTime inTime reason')
        .sort({ createdAt: -1 });

        res.status(200).json(pauses);

    } catch (error) {
        console.error('Error fetching paused meals:', error);
        res.status(500).json({ error: error.message });
    }
}));

// Cancel/Edit pause
foodEnhancedApp.delete('/pause/:pauseId', expressAsyncHandler(async (req, res) => {
    try {
        const { pauseId } = req.params;

        const pause = await FoodPauseEnhanced.findById(pauseId);
        if (!pause) {
            return res.status(404).json({ error: 'Pause not found' });
        }

        // Check if pause can be cancelled (not in the past)
        const currentDate = new Date().toISOString().split('T')[0];
        if (pause.pause_end_date < currentDate) {
            return res.status(400).json({ error: 'Cannot cancel past pauses' });
        }

        // Soft delete - mark as inactive
        pause.is_active = false;
        pause.cancelled_at = new Date();
        await pause.save();

        res.status(200).json({ message: 'Pause cancelled successfully' });

    } catch (error) {
        console.error('Error cancelling pause:', error);
        res.status(500).json({ error: error.message });
    }
}));

// Update pause (for editing)
foodEnhancedApp.put('/pause/:pauseId', expressAsyncHandler(async (req, res) => {
    try {
        const { pauseId } = req.params;
        const { meals, startDate, endDate } = req.body;

        const pause = await FoodPauseEnhanced.findById(pauseId);
        if (!pause) {
            return res.status(404).json({ error: 'Pause not found' });
        }

        // Validate edit timing
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const currentDate = now.toISOString().split('T')[0];
        
        const mealTimings = {
            breakfast: { editDeadline: "05:00" },
            lunch: { editDeadline: "10:30" },
            snacks: { editDeadline: "14:30" },
            dinner: { editDeadline: "17:30" }
        };

        if (pause.pause_start_date === currentDate) {
            if (mealTimings[pause.meal_type] && currentTime >= mealTimings[pause.meal_type].editDeadline) {
                return res.status(400).json({ 
                    error: `Cannot edit ${pause.meal_type} - deadline passed (2 hours before meal time)` 
                });
            }
        }

        // Update pause
        if (startDate) pause.pause_start_date = startDate;
        if (endDate) pause.pause_end_date = endDate;
        
        await pause.save();

        res.status(200).json({
            message: 'Pause updated successfully',
            pause
        });

    } catch (error) {
        console.error('Error updating pause:', error);
        res.status(500).json({ error: error.message });
    }
}));

// Admin: Get all pauses with filters
foodEnhancedApp.get('/admin/pauses', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const {
            dateFilter = 'today',
            mealType = 'all',
            status = 'all',
            page = 1,
            limit = 50
        } = req.query;

        let filter = {};

        // Date filter
        const today = new Date().toISOString().split('T')[0];
        switch (dateFilter) {
            case 'today':
                filter.pause_start_date = { $lte: today };
                filter.pause_end_date = { $gte: today };
                break;
            case 'upcoming':
                filter.pause_start_date = { $gt: today };
                break;
            case 'past':
                filter.pause_end_date = { $lt: today };
                break;
        }

        // Meal type filter
        if (mealType !== 'all') {
            filter.meal_type = mealType;
        }

        // Status filter
        if (status !== 'all') {
            if (status === 'active') {
                filter.is_active = true;
            } else if (status === 'cancelled') {
                filter.is_active = false;
            }
        }

        const pauses = await FoodPauseEnhanced.find(filter)
            .populate('student_id', 'rollNumber name roomNumber')
            .populate('outpass_id', 'outTime inTime reason')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await FoodPauseEnhanced.countDocuments(filter);

        res.status(200).json({
            pauses,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        console.error('Error fetching admin pauses:', error);
        res.status(500).json({ error: error.message });
    }
}));

// Admin: Get pause statistics
foodEnhancedApp.get('/admin/pause-stats', verifyAdmin, expressAsyncHandler(async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Active pauses today
        const activePauses = await FoodPauseEnhanced.countDocuments({
            pause_start_date: { $lte: today },
            pause_end_date: { $gte: today },
            is_active: true
        });

        // Upcoming pauses
        const upcomingPauses = await FoodPauseEnhanced.countDocuments({
            pause_start_date: { $gt: today },
            is_active: true
        });

        // Pauses by meal type (today)
        const pausesByMeal = await FoodPauseEnhanced.aggregate([
            {
                $match: {
                    pause_start_date: { $lte: today },
                    pause_end_date: { $gte: today },
                    is_active: true
                }
            },
            {
                $group: {
                    _id: '$meal_type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent pause trends (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        const recentTrends = await FoodPauseEnhanced.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                    is_active: true
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        meal: '$meal_type'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        res.status(200).json({
            activePauses,
            upcomingPauses,
            pausesByMeal,
            recentTrends
        });

    } catch (error) {
        console.error('Error fetching pause stats:', error);
        res.status(500).json({ error: error.message });
    }
}));

module.exports = foodEnhancedApp;
