const User = require('../models/User');

// @desc    Get system user analytics (Total Users, Online Users, and Online Users List)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    // A user is considered ONLINE when lastActiveAt is within the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // 1. Total Registered Users from MongoDB users collection
    const totalUsers = await User.countDocuments();

    // 2. Currently Online Users (lastActiveAt >= current time - 2 minutes)
    const onlineUsers = await User.countDocuments({
      lastActiveAt: { $gte: twoMinutesAgo }
    });

    // 3. Online Users List for the live admin monitor (passwords omitted)
    const onlineUsersList = await User.find({
      lastActiveAt: { $gte: twoMinutesAgo }
    })
      .select('_id name email role lastActiveAt')
      .sort({ lastActiveAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      totalUsers,
      onlineUsers,
      onlineUsersList
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving admin statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAdminStats
};
  