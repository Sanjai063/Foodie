const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/', protect, admin, getAllUsers);
router.get('/:id', protect, admin, getUserById);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
