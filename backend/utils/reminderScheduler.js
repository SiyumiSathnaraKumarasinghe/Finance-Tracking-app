const cron = require('node-cron');
const mongoose = require('mongoose');
const Goal = require('../models/Goal');  
const Notification = require('../models/Notification');
const connectDB = require('../config/db'); 

// ✅ Connect to MongoDB once
(async () => {
  await connectDB();
})();

// Cron job to send reminders for upcoming deadlines
cron.schedule('*/2 * * * *', async () => { // Runs every 2 minutes
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB connection lost! Retrying...");
      await connectDB();
    }

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));
    
    // ✅ Tomorrow's start and end times
    const tomorrowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const tomorrowEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 23, 59, 59));

    // Find goals that are due today (excluding overdue)
    const dueTodayGoals = await Goal.find({
      deadline: { $gte: todayStart, $lte: todayEnd }
    });

    // Find goals that are due tomorrow
    const upcomingGoals = await Goal.find({
      deadline: { $gte: tomorrowStart, $lte: tomorrowEnd }
    });

    // Process goals that are due today
    for (const goal of dueTodayGoals) {
      await sendReminder(goal, `Reminder: Your goal "${goal.name}" is due today!`);
    }

    // Process goals that are due tomorrow
    for (const goal of upcomingGoals) {
      await sendReminder(goal, `Reminder: Your goal "${goal.name}" is due tomorrow!`);
    }

  } catch (error) {
    console.error('❌ Error fetching goals for reminders:', error);
  }
});

// ✅ Helper function to send a reminder
async function sendReminder(goal, message) {
  try {
    const notification = new Notification({
      userId: goal.userId,
      message,
      type: "reminder",
    });

    await notification.save();
    console.log(`🔔 Reminder: ${message}`);
  } catch (error) {
    console.error('❌ Error saving notification:', error);
  }
}  
