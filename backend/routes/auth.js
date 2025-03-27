const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Create a store to track login attempts by username/email
const loginAttempts = new Map();

// Middleware to limit login attempts by username/email
const userLoginLimiter = async (req, res, next) => {
  const email = req.body.email?.toLowerCase();
  
  // If no email provided, proceed to next middleware
  if (!email) {
    return next();
  }

  // Get current time
  const now = Date.now();
  
  // Initialize or get existing attempts for this email to prevent Brute Force Attack
  if (!loginAttempts.has(email)) {
    loginAttempts.set(email, { count: 0, resetTime: now + (15 * 60 * 1000) });
  }
  
  const attempts = loginAttempts.get(email);
    
  // Reset counter if the time window has expired
  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + (15 * 60 * 1000);
  }
  
  //Prevent Insecure Authentication (Brute Force Attack)
  // Check if user has exceeded the maximum attempts
  if (attempts.count >= 5) {
    return res.status(429).json({ 
      msg: "Too many login attempts for this account. Please try again after 15 minutes." 
    });
  }
  
  // Store the attempts object so we can modify it after login attempt
  res.locals.loginAttempts = attempts;
  res.locals.userEmail = email;
  
  next();
};

// Regularly clean up the loginAttempts map to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of loginAttempts.entries()) {
    if (now > data.resetTime) {
      loginAttempts.delete(email);
    }
  }
}, 15 * 60 * 1000); // Clean up every 15 minutes

// Register user
router.post('/register', [
  // Sanitize and validate the input for XSS Security testing
  body('name').escape(), // This escapes HTML tags in the name field to prevent XSS
  body('email').isEmail().withMessage('Please enter a valid email'), // Validates email format
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'), // Validates password length
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Default role is 'regular' if not provided
    const userRole = role === 'admin' ? 'admin' : 'regular';

    user = new User({ name, email, password, role: userRole });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.status(201).json({ msg: 'User registered' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login user and return JWT token - Now with username-based rate limiting
router.post('/login', userLoginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      // Increment failed attempt counter on invalid credentials
      if (res.locals.loginAttempts) {
        res.locals.loginAttempts.count++;
      }
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment failed attempt counter on invalid credentials
      if (res.locals.loginAttempts) {
        res.locals.loginAttempts.count++;
      }
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // If login was successful, reset the attempt counter for this user
    if (res.locals.userEmail) {
      loginAttempts.delete(res.locals.userEmail);
    }

    // Generate JWT token
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;