const mongoose = require("mongoose");
const Transaction = require("../models/Transaction"); // Import Transaction model

async function processRecurringTransactions() {
  try {
    const now = new Date(); // Current time

    // Find all transactions that are recurring
    const recurringTransactions = await Transaction.find({ isRecurring: true });

    for (const transaction of recurringTransactions) {
      let shouldCreateNew = false;

      // Fetch the latest recurring transaction for this user and category
      const latestTransaction = await Transaction.findOne({
        userId: transaction.userId,
        category: transaction.category,
        isRecurring: true,
      }).sort({ createdAt: -1 }); // Get the most recent one

      if (!latestTransaction) continue; // If no previous recurring transaction, skip

      const lastTransactionTime = new Date(latestTransaction.createdAt); // Use latest transaction time

      // Re-fetch the original transaction to check if it is still recurring
      const originalTransaction = await Transaction.findById(transaction._id);
      if (!originalTransaction || !originalTransaction.isRecurring) {
        continue; // If the transaction was updated to non-recurring, stop processing
      }

      // Determine when the next transaction should occur
      if (transaction.recurrencePattern === "5minute") {
        shouldCreateNew = now - lastTransactionTime >= 5 * 60 * 1000; // 5 minutes
      } else if (transaction.recurrencePattern === "daily") {
        shouldCreateNew = now - lastTransactionTime >= 24 * 60 * 60 * 1000; // 1 day
      } else if (transaction.recurrencePattern === "weekly") {
        shouldCreateNew = now - lastTransactionTime >= 7 * 24 * 60 * 60 * 1000; // 1 week
      } else if (transaction.recurrencePattern === "monthly") {
        shouldCreateNew = now.getMonth() !== lastTransactionTime.getMonth(); // Check if the month changed
      }

      // If it's time to create a new transaction, do it
      if (shouldCreateNew) {
        const newTransaction = new Transaction({
          userId: transaction.userId,
          amount: transaction.amount,
          currency: transaction.currency,
          convertedAmount: transaction.convertedAmount,
          category: transaction.category,
          type: transaction.type,
          date: now, // Set current date for the new transaction
          notes: transaction.notes,
          tags: transaction.tags,
          isRecurring: true,
          recurrencePattern: transaction.recurrencePattern,
        });

        await newTransaction.save();
        console.log(`New recurring transaction created for ${transaction.userId}`);
      }
    }
  } catch (error) {
    console.error("Error processing recurring transactions:", error);
  }
}

// Run this function every minute
setInterval(processRecurringTransactions, 60 * 1000);

module.exports = processRecurringTransactions;
