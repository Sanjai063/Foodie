const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const Food = require('./models/Food');
const Order = require('./models/Order');
const Review = require('./models/Review');

const categoriesData = require('./data/categories.json');
const foodsRawData = require('./data/foods.json');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_ordering_db';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for database seeding...');

    // Clear existing collections
    await User.deleteMany();
    await Category.deleteMany();
    await Food.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();
    console.log('Cleared existing collections.');

    // 1. Seed Categories (11 diverse categories)
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${createdCategories.length} categories.`);

    const catMap = {};
    createdCategories.forEach((c) => {
      catMap[c.name] = c._id;
    });

    // 2. Seed Users
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const userPasswordHash = await bcrypt.hash('user123', 10);

    const usersData = [
      {
        name: 'System Admin',
        email: 'admin@foodie.com',
        phone: '9876543210',
        password: adminPasswordHash,
        address: { street: '100 Tech Park, MG Road', city: 'Bengaluru', pincode: '560001' },
        role: 'admin'
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543211',
        password: userPasswordHash,
        address: { street: '42 Maple Street, Green Glen', city: 'Bengaluru', pincode: '560103' },
        role: 'user'
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '9876543212',
        password: userPasswordHash,
        address: { street: '18 Lotus Apartments, Koramangala', city: 'Bengaluru', pincode: '560034' },
        role: 'user'
      },
      {
        name: 'Alex Turner',
        email: 'alex@example.com',
        phone: '9876543213',
        password: userPasswordHash,
        address: { street: '7 Sunset Boulevard, Indiranagar', city: 'Bengaluru', pincode: '560038' },
        role: 'user'
      }
    ];

    const createdUsers = await User.insertMany(usersData);
    console.log(`Seeded ${createdUsers.length} users (1 Admin, 3 Customers).`);

    const adminUser = createdUsers.find(u => u.role === 'admin');
    const johnUser = createdUsers.find(u => u.email === 'john@example.com');
    const priyaUser = createdUsers.find(u => u.email === 'priya@example.com');

    // 3. Map foods to their respective Category ObjectIds
    const formattedFoods = foodsRawData.map(item => ({
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: catMap[item.categoryName] || createdCategories[0]._id,
      ingredients: item.ingredients,
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      spiceLevel: item.spiceLevel || 'Medium',
      prepTime: item.prepTime || '20 mins',
      calories: item.calories || 350,
      rating: item.rating || 4.5,
      numReviews: item.numReviews || 0,
      available: item.available !== undefined ? item.available : true
    }));

    const createdFoods = await Food.insertMany(formattedFoods);
    console.log(`Seeded ${createdFoods.length} food items across all 11 categories.`);

    const margherita = createdFoods.find(f => f.name.includes('Margherita')) || createdFoods[0];
    const biryani = createdFoods.find(f => f.name.includes('Biryani')) || createdFoods[1];
    const lavaCake = createdFoods.find(f => f.name.includes('Lava Cake')) || createdFoods[2];
    const fries = createdFoods.find(f => f.name.includes('Peri-Peri')) || createdFoods[3];

    // 4. Seed Sample Orders
    // Order 1: Delivered (allows John Doe to review Margherita & Lava Cake)
    const order1 = await Order.create({
      user: johnUser._id,
      items: [
        {
          food: margherita._id,
          name: margherita.name,
          price: margherita.price,
          quantity: 2,
          image: margherita.image,
          isVeg: margherita.isVeg
        },
        {
          food: lavaCake._id,
          name: lavaCake.name,
          price: lavaCake.price,
          quantity: 1,
          image: lavaCake.image,
          isVeg: lavaCake.isVeg
        }
      ],
      deliveryAddress: {
        name: johnUser.name,
        phone: johnUser.phone,
        address: johnUser.address.street,
        city: johnUser.address.city,
        pincode: johnUser.address.pincode
      },
      phone: johnUser.phone,
      paymentMethod: 'Demo Online Payment',
      paymentStatus: 'Paid',
      subtotal: 797,
      deliveryFee: 0,
      tax: 40,
      totalAmount: 837,
      status: 'Delivered',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    // Order 2: Out for Delivery for Priya Sharma (allows tracking demonstration)
    const order2 = await Order.create({
      user: priyaUser._id,
      items: [
        {
          food: biryani._id,
          name: biryani.name,
          price: biryani.price,
          quantity: 1,
          image: biryani.image,
          isVeg: biryani.isVeg
        },
        {
          food: fries._id,
          name: fries.name,
          price: fries.price,
          quantity: 1,
          image: fries.image,
          isVeg: fries.isVeg
        }
      ],
      deliveryAddress: {
        name: priyaUser.name,
        phone: priyaUser.phone,
        address: priyaUser.address.street,
        city: priyaUser.address.city,
        pincode: priyaUser.address.pincode
      },
      phone: priyaUser.phone,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
      subtotal: 479,
      deliveryFee: 40,
      tax: 24,
      totalAmount: 543,
      status: 'Out for Delivery',
      createdAt: new Date(Date.now() - 35 * 60 * 1000)
    });

    // Order 3: Order Placed for John Doe (allows cancellation demonstration!)
    const order3 = await Order.create({
      user: johnUser._id,
      items: [
        {
          food: biryani._id,
          name: biryani.name,
          price: biryani.price,
          quantity: 2,
          image: biryani.image,
          isVeg: biryani.isVeg
        }
      ],
      deliveryAddress: {
        name: johnUser.name,
        phone: johnUser.phone,
        address: johnUser.address.street,
        city: johnUser.address.city,
        pincode: johnUser.address.pincode
      },
      phone: johnUser.phone,
      paymentMethod: 'Demo Online Payment',
      paymentStatus: 'Paid',
      subtotal: 640,
      deliveryFee: 0,
      tax: 32,
      totalAmount: 672,
      status: 'Order Placed',
      createdAt: new Date(Date.now() - 10 * 60 * 1000)
    });

    console.log('Seeded 3 sample orders (Delivered, Out for Delivery, Order Placed).');

    // 5. Seed Reviews
    const sampleReviews = [
      {
        user: johnUser._id,
        food: margherita._id,
        rating: 5,
        comment: 'Crispy sourdough crust and fresh mozzarella! One of the best authentic pizzas in town.'
      },
      {
        user: johnUser._id,
        food: lavaCake._id,
        rating: 5,
        comment: 'Pure chocolate heaven! The hot gooey molten core flows out wonderfully with the ice cream.'
      }
    ];

    await Review.insertMany(sampleReviews);
    console.log(`Seeded ${sampleReviews.length} verified buyer reviews.`);

    console.log('====================================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(` Seeded ${createdCategories.length} Categories, ${createdFoods.length} Food Items, ${createdUsers.length} Users, 3 Orders`);
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
