const express = require('express');
const router = express.Router();
const {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood
} = require('../controllers/foodController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.get('/', getFoods);
router.get('/:id', getFoodById);
router.post('/', protect, admin, createFood);
router.put('/:id', protect, admin, updateFood);
router.delete('/:id', protect, admin, deleteFood);

module.exports = router;
