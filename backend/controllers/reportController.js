// controllers/reportController.js
const reportService = require('../services/reportService');
const User = require('../models/User');

const generateReport = async (req, res) => {
  try {
    // Extract filter parameters from query string
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      category: req.query.category,
      userName: req.query.userName,
      tags: req.query.tags ? req.query.tags.split(',') : null
    };

    // Check if the user is an admin
    if (req.user.role === 'admin') {
      // If Admin: Generate reports for all users with filters
      const allUserReports = await reportService.generateAdminReports(filters);
      return res.json(allUserReports);
    } else {
      // If Regular User: Generate personal report with filters
      const userReport = await reportService.generateUserReport(req.user.id, filters);
      return res.json(userReport);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  generateReport
};