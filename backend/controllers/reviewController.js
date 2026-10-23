const Review = require('../models/Review');
const Food = require('../models/Food');
const Order = require('../models/Order');

// @desc    Get all reviews for a food item
// @route   GET /api/reviews/:foodId
// @access  Public
const getFoodReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ food: req.params.foodId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check if current user can review this food item
// @route   GET /api/reviews/:foodId/can-review
// @access  Private
const canUserReview = async (req, res) => {
  try {
    const foodId = req.params.foodId;

    // Check if user has an order with status 'Delivered' containing this food item
    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      status: 'Delivered',
      'items.food': foodId
    });

    const existingReview = await Review.findOne({
      user: req.user._id,
      food: foodId
    });

    res.status(200).json({
      success: true,
      hasDeliveredOrder: !!deliveredOrder,
      alreadyReviewed: !!existingReview,
      canReview: !!deliveredOrder && !existingReview,
      existingReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a food review
// @route   POST /api/reviews
// @access  Private (User)
const createReview = async (req, res) => {
  try {
    const { foodId, rating, comment } = req.body;

    if (!foodId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide food ID, rating (1-5), and a comment' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    // VERIFICATION: Check if user has completed and received this food in a delivered order
    const deliveredOrder = await Order.findOne({
      user: req.user._id,
      status: 'Delivered',
      'items.food': foodId
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: 'Only customers who have ordered and received this food item can submit a review.'
      });
    }

    // Check if user already reviewed this item
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      food: foodId
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this food item.'
      });
    }

    const review = await Review.create({
      user: req.user._id,
      food: foodId,
      rating: numRating,
      comment: comment.trim()
    });

    // Recalculate average rating & review count for the food item
    const reviews = await Review.find({ food: foodId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    food.rating = parseFloat(avgRating.toFixed(1));
    food.numReviews = reviews.length;
    await food.save();

    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: populatedReview,
      newRating: food.rating,
      numReviews: food.numReviews
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFoodReviews,
  canUserReview,
  createReview
};
