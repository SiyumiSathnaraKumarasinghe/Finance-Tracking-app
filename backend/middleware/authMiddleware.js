const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect middleware to ensure the user is authenticated
const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from the authorization header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fix: Use `userId` instead of `id`
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      console.log("Authenticated User:", req.user); // ✅ Debugging to check role

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Admin only middleware to restrict access to admin users
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // User is admin, proceed to the next middleware/route handler
  } else {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }
};

module.exports = { protect, adminOnly };
