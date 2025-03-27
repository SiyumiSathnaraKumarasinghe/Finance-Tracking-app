const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");
const { protect } = require("../middleware/authMiddleware"); // Use 'protect' middleware here

// ✅ 1. Create a new budget (Only for logged-in users)
router.post("/", protect, async (req, res) => {
  try {
    const { category, amount, startDate, endDate } = req.body;
    const newBudget = new Budget({
      userId: req.user.id, // Gets the logged-in user's ID from JWT
      category,
      amount,
      startDate,
      endDate,
    });
    await newBudget.save();
    res.status(201).json({ message: "Budget created successfully!", newBudget });
  } catch (error) {
    res.status(500).json({ error: "Server error!" });
  }
});

// ✅ 2. Get all budgets (Admin can see all, users see only their own)
router.get("/", protect, async (req, res) => {
  try {
    let budgets;
    if (req.user.role === "admin") {
      budgets = await Budget.find(); // Admin gets all budgets
    } else {
      budgets = await Budget.find({ userId: req.user.id }); // Regular user gets only their budgets
    }
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: "Server error!" });
  }
});

// ✅ 3. Get a single budget by ID (Admin can view all, users can view their own)
router.get("/:id", protect, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Admins can see all budgets, users can only see their own
    if (req.user.role !== "admin" && budget.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to view this budget" });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ error: "Server error!" });
  }
});

// ✅ 4. Update a budget (Admin can update any, users can update only their own)
router.put("/:id", protect, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Allow update if user is an admin or owns the budget
    if (req.user.role !== "admin" && budget.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to update this budget" });
    }

    const { category, amount, startDate, endDate } = req.body;
    budget.category = category || budget.category;
    budget.amount = amount || budget.amount;
    budget.startDate = startDate || budget.startDate;
    budget.endDate = endDate || budget.endDate;
    
    await budget.save();
    res.json({ message: "Budget updated successfully!", budget });
  } catch (error) {
    res.status(500).json({ error: "Server error!" });
  }
});

// ✅ 5. Delete a budget (Admin can delete any, users can delete only their own)
router.delete("/:id", protect, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Allow deletion if user is an admin or owns the budget
    if (req.user.role !== "admin" && budget.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to delete this budget" });
    }

    await budget.deleteOne();
    res.json({ message: "Budget deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Server error!" });
  }
});

module.exports = router;
