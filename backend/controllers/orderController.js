const Order = require('../models/Order');
const Food = require('../models/Food');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (User)
const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, phone, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Please add items to your cart.' });
    }

    if (!deliveryAddress || !deliveryAddress.name || !deliveryAddress.address || !deliveryAddress.city || !deliveryAddress.pincode) {
      return res.status(400).json({ success: false, message: 'Please provide full delivery address details' });
    }

    let orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const food = await Food.findById(item.food);
      if (!food) {
        return res.status(404).json({ success: false, message: `Food item not found: ${item.name || item.food}` });
      }

      if (!food.available) {
        return res.status(400).json({ success: false, message: `"${food.name}" is currently unavailable.` });
      }

      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const itemTotal = food.price * quantity;
      subtotal += itemTotal;

      orderItems.push({
        food: food._id,
        name: food.name,
        price: food.price,
        quantity,
        image: food.image,
        isVeg: food.isVeg !== undefined ? food.isVeg : true
      });
    }

    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const tax = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + deliveryFee + tax;

    const paymentStatus = paymentMethod === 'Demo Online Payment' ? 'Paid' : 'Pending';

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      deliveryAddress: {
        name: deliveryAddress.name.trim(),
        phone: (deliveryAddress.phone || phone || req.user.phone).trim(),
        address: deliveryAddress.address.trim(),
        city: deliveryAddress.city.trim(),
        pincode: deliveryAddress.pincode.trim()
      },
      phone: (phone || deliveryAddress.phone || req.user.phone).trim(),
      paymentMethod: paymentMethod || 'Cash on Delivery',
      paymentStatus,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      status: 'Order Placed'
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private (User)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (User or Admin)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.food', 'name image price isVeg');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Customer cancels order (allowed only if Placed or Confirmed)
// @route   PUT /api/orders/:id/cancel
// @access  Private (User)
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    // Status check
    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    if (order.status === 'Preparing' || order.status === 'Out for Delivery' || order.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order at stage "${order.status}". Kitchen preparation has already commenced.`
      });
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.reason || 'Cancelled by customer';

    if (order.paymentMethod === 'Demo Online Payment') {
      order.paymentStatus = 'Refunded';
    } else {
      order.paymentStatus = 'Cancelled';
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully. Any online payment has been initiated for refund.',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (status === 'Delivered' && order.paymentMethod === 'Cash on Delivery') {
      order.paymentStatus = 'Paid';
    } else if (status === 'Cancelled') {
      order.cancelledAt = new Date();
      if (order.paymentMethod === 'Demo Online Payment') order.paymentStatus = 'Refunded';
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to "${status}"`,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin statistics for dashboard
// @route   GET /api/orders/dashboard-stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({
      lastActiveAt: { $gte: twoMinutesAgo }
    });
    const totalFoods = await Food.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery'] }
    });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });

    const revenueAgg = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        onlineUsers,
        totalFoods,
        totalOrders,
        totalRevenue,
        pendingOrders,
        deliveredOrders,
        cancelledOrders
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getAdminStats
};
