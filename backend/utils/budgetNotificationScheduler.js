const cron = require("node-cron");
const Budget = require("../models/Budget");
const Notification = require("../models/Notification"); // Ensure you have this model
const User = require("../models/User");

// Schedule task to run every 2 minutes
cron.schedule("*/2 * * * *", async () => {
  const budgets = await Budget.find(); // Get all budgets

  for (const budget of budgets) {
    const { userId, category, amount, currentSpending } = budget;

    let user = null;
    try {
      user = await User.findById(userId); // Fetch user details
    } catch (err) {
      console.error("❌ Error fetching user data:", err.message);
      continue; // Skip to the next iteration if fetching user fails
    }

    if (!user) continue; // Skip if user doesn't exist

    let message = null;
    let recommendation = ""; // Default empty recommendation
    let percentageSpent = (currentSpending / amount) * 100;

    // Check if spending is 100% or more
    if (percentageSpent >= 100) {
      message = `⚠️ - Warning! You have exceeded 100% of your budget for "${category}".`;
      recommendation = "You might want to review your spending habits and possibly adjust your budget or reduce spending.";
    } 
    // Check if spending is 75% or more
    else if (percentageSpent >= 75) {
      message = `📢 - Heads up! You have spent 75% of your budget for "${category}".`;
      recommendation = "Consider adjusting your budget or reducing spending to stay within limits.";
    } 
    // If spending is less than 75%, we suggest increasing the budget
    else if (percentageSpent < 75 && currentSpending < amount) {
      message = `💡 - Good news! You are under budget for "${category}".`;
      recommendation = "You might want to increase your budget or add more categories for better planning.";
    }

    // Print both message and recommendation to the console
    if (message) {
      console.log(`📩 Sending notification to ${user.name}: ${message}`);
      console.log(`💡 Recommendation: ${recommendation}`);  // Print recommendation in the console

      // Retry mechanism to handle network errors
      let retries = 3;
      while (retries > 0) {
        try {
          // Save notification to DB
          await Notification.create({
            userId,
            message: `${message} ${recommendation}`,  // Add the recommendation to the message
            type: "budget",
            timestamp: new Date(),
          });
          break; // Exit loop if notification is saved successfully
        } catch (err) {
          retries--;
          console.error(`❌ Failed to save notification. Retries left: ${retries}`);
          if (retries === 0) {
            console.error("❌ Error saving notification after multiple attempts:", err.message);
          }
        }
      }

      // OPTIONAL: Send email or push notification (future improvement)
    }
  }
});

module.exports = cron;