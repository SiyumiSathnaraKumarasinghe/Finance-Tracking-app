const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Saving = require('../models/Saving');
const Goal = require('../models/Goal');
const User = require('../models/User');

const generateAdminReports = async (filters = {}) => {
  try {
    // Build user query if userName filter is provided
    let userQuery = {};
    if (filters.userName) {
      userQuery.name = { $regex: filters.userName, $options: 'i' }; // Case-insensitive search
    }
    
    // Get reports for all users (summary of transactions, budgets, savings, etc.)
    const users = await User.find(userQuery);
    const reports = [];

    for (const user of users) {
      // Get user data with applied filters
      const userReport = await getUserDataWithFilters(user.id, user.name, filters);
      
      // Only include users that have matching data based on filters
      if (hasMatchingData(userReport, filters)) {
        reports.push(userReport);
      }
    }

    return reports;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate admin report");
  }
};

const generateUserReport = async (userId, filters = {}) => {
  try {
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get the financial report for a single user with filters
    return await getUserDataWithFilters(userId, user.name, filters);
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate user report");
  }
};

// Helper function to determine if a user has any data matching the filters
const hasMatchingData = (userReport, filters) => {
  // If category filter is applied, check if there are matching transactions/budgets
  if (filters.category) {
    return userReport.transactions.length > 0 || userReport.budget.length > 0;
  }
  
  // If tag filter is applied, check if there are matching transactions
  if (filters.tags && filters.tags.length > 0) {
    return userReport.transactions.length > 0;
  }
  
  // If date filter is applied, check if there is any data within that date range
  if (filters.startDate || filters.endDate) {
    return userReport.transactions.length > 0 || 
           userReport.budget.length > 0 || 
           userReport.savings.length > 0 || 
           userReport.goals.length > 0;
  }
  
  // If no specific filters applied or if the user has any data at all
  return true;
};

// Helper function to get user data with filters applied
const getUserDataWithFilters = async (userId, userName, filters) => {
  // Build transaction query with filters
  let transactionQuery = { userId };
  let budgetQuery = { userId };
  let savingsQuery = { userId };
  let goalsQuery = { userId };

  // Apply date filters if provided
  if (filters.startDate || filters.endDate) {
    const dateFilter = {};
    if (filters.startDate) {
      dateFilter.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      dateFilter.$lte = new Date(filters.endDate);
    }
    
    transactionQuery.date = dateFilter;
    budgetQuery.createdAt = dateFilter;
    savingsQuery.createdAt = dateFilter;
    goalsQuery.createdAt = dateFilter;
  }

  // Apply category filter if provided
  if (filters.category) {
    transactionQuery.category = filters.category;
    budgetQuery.category = filters.category;
  }

  // Apply tags filter if provided
  if (filters.tags && filters.tags.length > 0) {
    transactionQuery.tags = { $in: filters.tags };
  }

  // Get user data with filters applied
  const userTransactions = await Transaction.find(transactionQuery);
  const userBudget = await Budget.find(budgetQuery);
  const userSavings = await Saving.find(savingsQuery);
  const userGoals = await Goal.find(goalsQuery);

  return {
    userId,
    userName,
    transactions: userTransactions,
    budget: userBudget,
    savings: userSavings,
    goals: userGoals,
  };
};

module.exports = {
  generateAdminReports,
  generateUserReport
};