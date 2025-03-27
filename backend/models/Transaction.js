const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Every transaction must belong to a user
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true, // Must be either "income" or "expense"
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "LKR", // Default currency is Sri Lankan Rupees
    },
    convertedAmount: {
      type: Number, // Amount converted to LKR
      required: false,
    },
    category: {
      type: String,
      required: true, // Example: Food, Transport, Rent, etc.
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(), // ✅ Ensures proper date parsing
    },
    notes: {
      type: String,
    },
    tags: {
      type: [String], // Allow users to add multiple tags like ["work", "urgent"]
    },
    isRecurring: {
      type: Boolean,
      default: false, // False unless user specifies it’s a recurring transaction
    },
    recurrencePattern: {
      type: String,
      enum: ["5minute", "daily", "weekly", "monthly", null], // ✅ Optional Fix: Enforce valid patterns
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
