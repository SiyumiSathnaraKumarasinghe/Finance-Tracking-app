const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const { protect } = require('../middleware/authMiddleware');

// Create a new goal
router.post('/', protect, async (req, res) => {
  const { name, targetAmount, deadline } = req.body;

  try {
    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({ message: 'Name, target amount, and deadline are required' });
    }

    const goal = new Goal({
      userId: req.user.id,
      name,
      targetAmount,
      deadline,
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Get all goals (Admin can see all, users can only see their own)
router.get('/', protect, async (req, res) => {
  try {
    let goals;
    if (req.user.role === 'admin') {
      // Admin can see all goals
      goals = await Goal.find();
    } else {
      // Regular users can only see their own goals
      goals = await Goal.find({ userId: req.user.id });
    }
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Get a single goal by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Admin users can access any goal, regular users can only access their own
    if (goal.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Update a goal (to track progress)
router.put('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Allow name update
    goal.name = req.body.name || goal.name;

    // Include deadline update
    goal.deadline = req.body.deadline || goal.deadline;

    // Update current amount or other details
    goal.currentAmount = req.body.currentAmount || goal.currentAmount;
    goal.targetAmount = req.body.targetAmount || goal.targetAmount;

    // Check if the goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    } else {
      goal.isCompleted = false;
    }

    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// Delete a goal by ID
router.delete('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await goal.deleteOne();
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
