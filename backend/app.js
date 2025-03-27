const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Global rate limiter - to protect against general flooding
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global rate limiting
app.use(globalLimiter);

// Middleware
app.use(express.json()); // For parsing JSON requests
app.use(cors()); // Allow cross-origin requests

// Import Routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require("./routes/transactionRoutes"); 
const budgetRoutes = require("./routes/budgetRoutes");
const userRoutes = require("./routes/userRoutes");
const goalRoutes = require('./routes/goalRoutes');
const savingsRoutes = require("./routes/savingsRoutes");
const reportRoutes = require('./routes/reportRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use("/api/transactions", transactionRoutes); 
app.use("/api/budgets", budgetRoutes);
app.use("/api/users", userRoutes);
app.use('/api/goals', goalRoutes);
app.use("/api/savings", savingsRoutes);
app.use('/api/reports', reportRoutes);

// Import reminder scheduler to start the cron job
require('./utils/reminderScheduler');

// Import and start the recurring transaction scheduler 
const processRecurringTransactions = require("./utils/recurringTransactionScheduler");
processRecurringTransactions(); // Start the scheduler 

// Import and start the budget notification scheduler
const budgetNotificationScheduler = require("./utils/budgetNotificationScheduler");
budgetNotificationScheduler; //start the scheduler


// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the Personal Finance Tracker API');
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});