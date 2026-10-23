const Food = require('../models/Food');
const Category = require('../models/Category');

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// @desc    Get all foods with search, filtering and sorting
// @route   GET /api/foods
// @access  Public
const getFoods = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sortBy, available, isVeg, spiceLevel } = req.query;
    let query = {};

    // Search by name, description, or ingredients (bulletproof)
    if (search && search.trim() !== '') {
      try {
        const cleaned = search.trim().replace(/\\+$/, ''); // Strip trailing unescaped backslashes
        const safeSearch = escapeRegex(cleaned || search.trim().replace(/\\/g, ''));
        const reg = new RegExp(safeSearch, 'i');
        query.$or = [
          { name: reg },
          { description: reg },
          { ingredients: reg }
        ];
      } catch (err) {
        const simple = search.trim().replace(/[^a-zA-Z0-9 ]/g, '');
        if (simple) {
          query.$or = [{ name: new RegExp(simple, 'i') }];
        }
      }
    }

    // Filter by category
    if (category && category !== 'all') {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const foundCategory = await Category.findOne({ name: { $regex: new RegExp(`^${escapeRegex(category)}$`, 'i') } });
        if (foundCategory) {
          query.category = foundCategory._id;
        }
      }
    }

    // Filter by Pure Veg / Non-Veg
    if (isVeg !== undefined && isVeg !== '') {
      query.isVeg = isVeg === 'true';
    }

    // Filter by Spice Level
    if (spiceLevel && spiceLevel !== 'all') {
      query.spiceLevel = spiceLevel;
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
    }

    // Filter by availability
    if (available !== undefined && available !== '') {
      query.available = available === 'true';
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sortBy === 'price_asc') sortOption = { price: 1 };
    else if (sortBy === 'price_desc') sortOption = { price: -1 };
    else if (sortBy === 'rating') sortOption = { rating: -1 };
    else if (sortBy === 'name') sortOption = { name: 1 };

    const foods = await Food.find(query)
      .populate('category', 'name image')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: foods.length,
      data: foods
    });
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single food by ID
// @route   GET /api/foods/:id
// @access  Public
const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate('category', 'name image');
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    res.status(200).json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new food item
// @route   POST /api/foods
// @access  Private/Admin
const createFood = async (req, res) => {
  try {
    const { name, description, price, image, category, ingredients, available, isVeg, spiceLevel, prepTime, calories } = req.body;

    if (!name || !description || price === undefined || !image || !category) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    let ingredientsList = ingredients;
    if (typeof ingredients === 'string') {
      ingredientsList = ingredients.split(',').map(item => item.trim()).filter(Boolean);
    }

    const food = await Food.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      image: image.trim(),
      category,
      ingredients: ingredientsList || [],
      isVeg: isVeg !== undefined ? isVeg : true,
      spiceLevel: spiceLevel || 'Medium',
      prepTime: prepTime || '20-25 mins',
      calories: calories ? Number(calories) : 350,
      available: available !== undefined ? available : true
    });

    const populatedFood = await Food.findById(food._id).populate('category', 'name image');
    res.status(201).json({ success: true, message: 'Food item created successfully', data: populatedFood });
  } catch (error) {
    console.error('Create food error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update food item
// @route   PUT /api/foods/:id
// @access  Private/Admin
const updateFood = async (req, res) => {
  try {
    const { name, description, price, image, category, ingredients, available, rating, isVeg, spiceLevel, prepTime, calories } = req.body;
    let food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    if (name) food.name = name.trim();
    if (description) food.description = description.trim();
    if (price !== undefined) {
      if (Number(price) < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative' });
      food.price = Number(price);
    }
    if (image) food.image = image.trim();
    if (category) food.category = category;
    if (available !== undefined) food.available = available;
    if (rating !== undefined) food.rating = rating;
    if (isVeg !== undefined) food.isVeg = isVeg;
    if (spiceLevel) food.spiceLevel = spiceLevel;
    if (prepTime) food.prepTime = prepTime;
    if (calories !== undefined) food.calories = Number(calories);

    if (ingredients !== undefined) {
      if (typeof ingredients === 'string') {
        food.ingredients = ingredients.split(',').map(item => item.trim()).filter(Boolean);
      } else if (Array.isArray(ingredients)) {
        food.ingredients = ingredients;
      }
    }

    const updatedFood = await food.save();
    const populated = await Food.findById(updatedFood._id).populate('category', 'name image');

    res.status(200).json({ success: true, message: 'Food item updated successfully', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete food item
// @route   DELETE /api/foods/:id
// @access  Private/Admin
const deleteFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }

    await Food.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Food item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood
};
