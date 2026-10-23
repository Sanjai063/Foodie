const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating between 1 and 5'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Please write a review comment'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent user from submitting multiple reviews for the same food item
reviewSchema.index({ user: 1, food: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
