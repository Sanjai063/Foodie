const express = require('express');
const router = express.Router();
const {
  getFoodReviews,
  canUserReview,
  createReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:foodId', getFoodReviews);
router.get('/:foodId/can-review', protect, canUserReview);
router.post('/', protect, createReview);

module.exports = router;
