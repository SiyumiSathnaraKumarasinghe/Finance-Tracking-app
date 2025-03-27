const mongoose = require("mongoose");

const savingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    sourceTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    sourceCategory: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Saving", savingsSchema);