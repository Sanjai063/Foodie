const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// @route   GET /api/admin/stats
// @desc    Get system user analytics (Total Users & Currently Online Users)
// @access  Private/Admin
router.get('/stats', protect, admin, getAdminStats);

module.exports = router;
