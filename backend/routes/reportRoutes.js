// routes/reportRoutes.js
const express = require('express');
const { generateReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Change here
const router = express.Router();

// Route to generate financial reports with optional query parameters for filtering
router.get('/generate', protect, generateReport);

module.exports = router;