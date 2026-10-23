const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide food name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide food description']
  },
  price: {
    type: Number,
    required: [true, 'Please provide food price'],
    min: [0, 'Price must be positive']
  },
  image: {
    type: String,
    required: [true, 'Please provide food image URL']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category']
  },
  ingredients: {
    type: [String],
    default: []
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  spiceLevel: {
    type: String,
    enum: ['Mild', 'Medium', 'Spicy'],
    default: 'Medium'
  },
  prepTime: {
    type: String,
    default: '20-25 mins'
  },
  calories: {
    type: Number,
    default: 350
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Food', foodSchema);
