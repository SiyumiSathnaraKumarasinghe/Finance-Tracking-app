const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  currentSpending: {
    type: Number,
    default: 0, 
  },
});

module.exports = mongoose.model("Budget", BudgetSchema);