const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal"); 
const Saving = require("../models/Saving"); // Import the new Savings model
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getExchangeRate } = require("../services/currencyService"); // Import exchange rate service

// ✅ Helper function to update the budget's current spending
const updateBudgetSpending = async (userId, category, amount, type, date) => {
  try {
    console.log("Updating budget for:", { userId, category, amount, type });

    console.log("Checking if category matches a budget...");

    const budget = await Budget.findOne({
      userId,
      category,
      startDate: { $lte: date }, // ✅ Use the transaction date instead of new Date()
      endDate: { $gte: date },
    });

    if (!budget) {
      console.log("➡️ No budget found for this user and category.");
      return;
    }

    console.log("✅ Budget found:", budget);

    budget.currentSpending += type === "expense" ? amount : -amount;
    await budget.markModified('currentSpending'); // Mark currentSpending as modified
    await budget.save(); // Save the budget

    console.log("✅ Budget updated! New currentSpending:", budget.currentSpending);
  } catch (error) {
    console.error("❌ Error updating budget:", error.message);
  }
};

// ✅ Helper function to update goal progress
const updateGoalProgress = async (userId, category, amount, date) => {
  try {
    console.log("Checking if category matches a goal...");

    const goal = await Goal.findOne({ userId, name: category });

    if (!goal) {
      console.log("➡️ No goal found with this category name.");
      return;
    }

    console.log("✅ Goal found:", goal);

    // Check if the transaction date is before the goal's deadline
    if (new Date(date) > new Date(goal.deadline)) {
      console.log("❌ Transaction date is after the goal's deadline. Not updating goal.");
      return; // Do not update goal if the date is after the deadline
    }

    // Increase currentAmount of the goal
    goal.currentAmount += amount;

    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }

    await goal.save();

    console.log("✅ Goal updated! New currentAmount:", goal.currentAmount);
  } catch (error) {
    console.error("❌ Error updating goal:", error.message);
  }
};

// ✅ Helper function to allocate 5% of income as savings
const allocateSavings = async (userId, transactionId, category, convertedAmount, date) => {
  try {
    console.log("Allocating 5% of income as savings...");
    
    // Calculate 5% of the converted amount
    const savingsAmount = convertedAmount * 0.05;
    console.log(`Savings amount calculated: ${savingsAmount} LKR`);
    
    // Create description with proper grammar
    const description = `${savingsAmount.toFixed(2)} LKR has been allocated as a saving from ${category} transaction.`;
    
    // Create a new savings record
    const saving = new Saving({
      userId,
      amount: savingsAmount,
      sourceTransactionId: transactionId,
      sourceCategory: category,
      description,
      date
    });
    
    await saving.save();
    console.log("✅ Savings successfully allocated and saved to database!");
    
    return saving;
  } catch (error) {
    console.error("❌ Error allocating savings:", error.message);
    return null;
  }
};

// ✅ Add a Transaction (Updates Budget & Goals) with Currency Conversion
router.post("/", protect, async (req, res) => {
  try {
    const { type, amount, currency, category, date, notes, tags, isRecurring, recurrencePattern } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: "Type, amount, and category are required!" });
    }

    const exchangeRate = await getExchangeRate(currency || "LKR"); // Fetch exchange rate
    const convertedAmount = amount * exchangeRate; // Convert amount to LKR

    const transaction = new Transaction({
      userId: req.user._id,
      type,
      amount,
      currency: currency || "LKR", // Use provided currency or default to LKR
      convertedAmount, // Store converted amount
      category,
      date,
      notes,
      tags,
      isRecurring,
      recurrencePattern,
    });

    await transaction.save();
    await updateBudgetSpending(req.user._id, category, convertedAmount, type, date); // ✅ Pass date and convertedAmount

    if (type === "expense") {
      await updateGoalProgress(req.user._id, category, convertedAmount, date); // ✅ Pass date to updateGoalProgress
    } else if (type === "income") {
      // ✅ NEW CODE: If transaction is income, allocate 5% as savings
      const savedAmount = await allocateSavings(
        req.user._id,
        transaction._id,
        category,
        convertedAmount,
        date || new Date()
      );
      
      // Add savings information to the response if successfully allocated
      if (savedAmount) {
        // We're creating a new response object instead of modifying the transaction
        return res.status(201).json({
          transaction,
          savings: {
            amount: savedAmount.amount,
            description: savedAmount.description
          }
        });
      }
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    // Extract query parameters for filtering and sorting
    const { 
      type, 
      category, 
      notes, 
      tags, 
      sortBy = 'date', 
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build the base query
    const query = {};

    // Add user-specific filtering
    if (req.user.role !== "admin") {
      query.userId = req.user._id;
    }

    // Add optional filters
    if (type) query.type = type;
    if (category) query.category = category;
    
    // Partial text search for notes
    if (notes) {
      query.notes = { $regex: notes, $options: 'i' }; // Case-insensitive partial match
    }

    // Tags filtering - exact match or contains
    if (tags) {
      query.tags = { $in: tags.split(',') }; // Support multiple tags
    }

    // Create sorting object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (pageNumber - 1) * pageLimit;

    // Fetch transactions with filtering, sorting, and pagination
    const transactions = await Transaction.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageLimit);

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalTransactions
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ Get a single transaction by ID (Admin can see any, regular users can only see their own)
router.get("/:id", protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if the logged-in user is the owner of the transaction or an admin
    if (req.user.role !== "admin" && transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to view this transaction" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ Update a Transaction (Adjusts Budget) with Currency Conversion
router.put("/:id", protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Admin can update any transaction; regular users can only update their own
    if (req.user.role !== "admin" && transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Calculate new converted amount if currency or amount is changed
    let exchangeRate;
    let newConvertedAmount = req.body.convertedAmount;
    
    if (req.body.currency && req.body.amount && (
        transaction.currency !== req.body.currency || 
        transaction.amount !== req.body.amount)) {
      exchangeRate = await getExchangeRate(req.body.currency);
      newConvertedAmount = req.body.amount * exchangeRate;
      req.body.convertedAmount = newConvertedAmount;
    }

    // If category or amount changed, adjust the budget
    if (transaction.convertedAmount !== newConvertedAmount || transaction.category !== req.body.category) {
      await updateBudgetSpending(transaction.userId, transaction.category, -transaction.convertedAmount, transaction.type, transaction.date); // Remove old amount
      await updateBudgetSpending(req.user._id, req.body.category, newConvertedAmount, req.body.type, req.body.date || transaction.date); // Add new amount
    }

    // ✅ NEW CODE: Handle savings adjustment when updating an income transaction
    const oldType = transaction.type;
    const newType = req.body.type || oldType;
    
    // If this was an income and is now being changed to an expense, or amount/currency changes
    if (oldType === "income" && (newType === "expense" || 
        transaction.convertedAmount !== newConvertedAmount)) {
      // Find and delete the associated savings record
      await Saving.deleteOne({ sourceTransactionId: transaction._id });
      console.log("✅ Associated savings record deleted due to transaction update");
      
      // If it's still an income, create a new savings record with updated amount
      if (newType === "income") {
        const category = req.body.category || transaction.category;
        const date = req.body.date || transaction.date;
        
        await allocateSavings(
          transaction.userId,
          transaction._id,
          category,
          newConvertedAmount,
          date
        );
        
        console.log("✅ New savings record created with updated amount");
      }
    }
    // If this was an expense and is now being changed to income
    else if (oldType === "expense" && newType === "income") {
      // Create a new savings record
      const category = req.body.category || transaction.category;
      const date = req.body.date || transaction.date;
      
      await allocateSavings(
        transaction.userId,
        transaction._id,
        category,
        newConvertedAmount,
        date
      );
      
      console.log("✅ New savings record created for expense converted to income");
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ Delete a Transaction (Adjusts Budget)
router.delete("/:id", protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Admin can delete any transaction; regular users can only delete their own
    if (req.user.role !== "admin" && transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // ✅ NEW CODE: Delete associated savings record if this was an income transaction
    if (transaction.type === "income") {
      await Saving.deleteOne({ sourceTransactionId: transaction._id });
      console.log("✅ Associated savings record deleted");
    }

    // Use convertedAmount for budget updates when deleting
    await updateBudgetSpending(transaction.userId, transaction.category, -transaction.convertedAmount, transaction.type, transaction.date);
    await transaction.deleteOne();

    res.json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ NEW ROUTE: Get all savings for the logged-in user
router.get("/savings/all", protect, async (req, res) => {
  try {
    const { 
      sortBy = 'date', 
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;
    
    // Build the query
    const query = {};
    
    // Add user-specific filtering (admin can see all)
    if (req.user.role !== "admin") {
      query.userId = req.user._id;
    }
    
    // Create sorting object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Pagination
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (pageNumber - 1) * pageLimit;
    
    // Fetch savings with sorting and pagination
    const savings = await Saving.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageLimit);
      
    // Get total for pagination
    const totalSavings = await Saving.countDocuments(query);
    
    // Get sum of all savings amounts
    const savingsAggregation = await Saving.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const totalAmount = savingsAggregation.length > 0 ? savingsAggregation[0].total : 0;
    
    res.json({
      savings,
      totalSavings,
      totalAmount
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;