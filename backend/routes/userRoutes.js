const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ✅ Get all users (Admin only)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ Update user role, name, and email (Admin can update all users, regular users can only update their own name and email)
router.put("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If the logged-in user is not an admin, they can only update their own name and email
    if (req.user.id !== user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Regular users can only update their own name and email
    if (req.user.id === user.id) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
    }

    // Admins can update any user's name, email, and role
    if (req.user.role === "admin") {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
    }

    await user.save();
    res.json({ message: "User updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// ✅ Delete a user (Admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
