const express = require("express");
const router = express.Router();
const Saving = require("../models/Saving");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Get all savings (Admin gets all savings, regular users get only their own)
router.get("/", protect, async (req, res) => {
  try {
    const { 
      sourceCategory, 
      startDate, 
      endDate,
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
    
    // Add optional filters
    if (sourceCategory) query.sourceCategory = sourceCategory;
    
    // Date filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Create sorting object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Pagination
    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (pageNumber - 1) * pageLimit;
    
    // Fetch savings with filtering, sorting, and pagination
    const savings = await Saving.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageLimit);
      
    // Get total for pagination
    const totalSavings = await Saving.countDocuments(query);
    
    // Get sum of all savings amounts that match the query
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

// Get total savings amount
router.get("/total", protect, async (req, res) => {
  try {
    // Admin can see all, regular users only see their own
    const query = req.user.role === "admin" ? {} : { userId: req.user._id };
    
    const savingsAggregation = await Saving.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const totalAmount = savingsAggregation.length > 0 ? savingsAggregation[0].total : 0;
    
    res.json({ totalAmount });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Get savings summary by category
router.get("/summary/category", protect, async (req, res) => {
  try {
    // Admin can see all, regular users only see their own
    const query = req.user.role === "admin" ? {} : { userId: req.user._id };
    
    const categorySummary = await Saving.aggregate([
      { $match: query },
      { $group: { 
          _id: "$sourceCategory", 
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        } 
      },
      { $sort: { totalAmount: -1 } },
      { $project: {
          category: "$_id",
          totalAmount: 1,
          count: 1,
          _id: 0
        }
      }
    ]);
    
    res.json(categorySummary);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Get savings by ID (Admin can see any, regular users can only see their own)
router.get("/:id", protect, async (req, res) => {
  try {
    const saving = await Saving.findById(req.params.id);
    
    if (!saving) {
      return res.status(404).json({ message: "Saving record not found" });
    }
    
    // Check if the logged-in user is the owner of the saving or an admin
    if (req.user.role !== "admin" && saving.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to view this saving record" });
    }
    
    res.json(saving);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Update a saving record (Admin can update any, users can update only their own)
router.put("/:id", protect, async (req, res) => {
  try {
    const saving = await Saving.findById(req.params.id);
    
    if (!saving) {
      return res.status(404).json({ message: "Saving record not found" });
    }
    
    // Check if the logged-in user is the owner of the saving or an admin
    if (req.user.role !== "admin" && saving.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to update this saving record" });
    }
    
    // Don't allow changing userId or sourceTransactionId for security reasons
    const { userId, sourceTransactionId, ...updateData } = req.body;
    
    const updatedSaving = await Saving.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    res.json(updatedSaving);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Delete a saving record (Admin can delete any, users can delete only their own)
router.delete("/:id", protect, async (req, res) => {
  try {
    const saving = await Saving.findById(req.params.id);
    
    if (!saving) {
      return res.status(404).json({ message: "Saving record not found" });
    }
    
    // Check if the logged-in user is the owner of the saving or an admin
    if (req.user.role !== "admin" && saving.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to delete this saving record" });
    }
    
    await saving.deleteOne();
    res.json({ message: "Saving record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;