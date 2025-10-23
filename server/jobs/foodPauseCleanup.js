const FoodPause = require('../models/FoodPause');
const mongoose = require('mongoose');

// Helper: get YYYY-MM-DD string for a Date
function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

async function cleanupExpiredFoodPauses() {
  try {
    // Today's date string
    const todayStr = toDateStr(new Date());
    const toRemove = await FoodPause.find({
      resume_from: { $ne: null },
      resume_from: { $lte: todayStr }
    });

    if (!toRemove.length) {
      console.log('[foodPauseCleanup] No expired/resumed FoodPause documents to remove.');
      return;
    }

    const ids = toRemove.map(d => d._id);
    const res = await FoodPause.deleteMany({ _id: { $in: ids } });
    console.log(`[foodPauseCleanup] Removed ${res.deletedCount} FoodPause document(s)`);
  } catch (err) {
    console.error('[foodPauseCleanup] Error during cleanup:', err);
  }
}

// Schedule a job to run at next midnight, then every 24 hours
function scheduleDailyCleanup() {
  try {
    // Calculate ms until next local midnight
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0); // next midnight
    const msUntilNext = next.getTime() - now.getTime();

    console.log(`[foodPauseCleanup] Scheduling first run in ${msUntilNext}ms`);

    setTimeout(() => {
      // Run immediately at midnight
      cleanupExpiredFoodPauses();

      // Then run every 24 hours
      setInterval(() => {
        cleanupExpiredFoodPauses();
      }, 24 * 60 * 60 * 1000);
    }, msUntilNext);
  } catch (err) {
    console.error('[foodPauseCleanup] Scheduling error:', err);
  }
}

module.exports = {
  cleanupExpiredFoodPauses,
  scheduleDailyCleanup
};
