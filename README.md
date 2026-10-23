# FoodieBites - Online Food Ordering System

> **College Web Application Development (WAD) Full-Stack Project**  
> Built with HTML5, CSS3, Vanilla JavaScript, Bootstrap 5, Node.js, Express.js, MongoDB & Mongoose. Secured with JWT and bcryptjs.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Extended Food Variety & Cuisines (39 Dishes)](#2-extended-food-variety--cuisines-39-dishes)
3. [Key Features](#3-key-features)
   - [Customer Features](#customer-features)
   - [Admin Features](#admin-features)
   - [Advanced Viva Features](#advanced-viva-features)
4. [Technology Stack](#4-technology-stack)
5. [Folder Structure](#5-folder-structure)
6. [Prerequisites & Requirements](#6-prerequisites--requirements)
7. [Installation & Setup Guide](#7-installation--setup-guide)
8. [Database Setup & Seeding](#8-database-setup--seeding)
9. [Running the Application](#9-running-the-application)
10. [Demo Login Credentials](#10-demo-login-credentials)
11. [REST API Reference](#11-rest-api-reference)
12. [Common Errors & Troubleshooting](#12-common-errors--troubleshooting)
13. [WAD Viva Preparation & Oral Exam Guide](#13-wad-viva-preparation--oral-exam-guide)
14. [Future Enhancements](#14-future-enhancements)

---

## 1. Project Overview

**FoodieBites** is a full-featured, responsive, production-grade **Online Food Ordering and Delivery Management System** built for college Web Application Development (WAD) practical exams and vivas.

It gives students a realistic, full-stack food delivery experience modeled after real-world platforms like Swiggy, Zomato, and DoorDash. Customers can browse, search with resilient error handling, filter by 11 cuisine categories, toggle **Pure Veg**, save favorite dishes to a wishlist, place orders via COD or Demo Online Payment, track orders across a **5-stage progress timeline** with a live ETA countdown, **cancel orders** before kitchen prep, print official **tax invoices**, and post **verified-buyer reviews**.

---

## 2. Extended Food Variety & Cuisines (39 Dishes)

The food catalog includes **39 diverse dishes** across **11 cuisine categories**, with dietary badges (Veg / Non-Veg), spice levels (`Mild 🍃`, `Medium 🌶️`, `Spicy 🔥`), preparation times, and calorie counts:

1. **Stone-Baked Pizza**: Classic Margherita, Spicy Paneer Tikka, Farmhouse Garden Fresh, Smoky BBQ Chicken & Onion Pizza.
2. **Artisanal Burgers**: Crispy Veggie Crunch, Smoky BBQ Paneer, Classic Grilled Chicken Cheeseburger.
3. **Royal Biryani**: Royal Hyderabadi Dum Paneer Biryani, Hyderabadi Chicken Dum Biryani, Lucknowi Awadhi Mutton Biryani.
4. **North Indian**: Paneer Butter Masala, Dal Makhani & Garlic Naan, Amritsari Chole Bhature, Murgh Makhani (Butter Chicken).
5. **South Indian**: Crispy Mysore Masala Dosa, Pure Ghee Paper Roast Dosa, Steamed Idli & Medu Vada Combo, Onion & Tomato Podi Uttapam.
6. **Chinese & Asian**: Schezwan Hakka Noodles, Crispy Veg Manchurian Gravy, Steamed Veg Dim Sums (Momos), Wok Chilli Garlic Fried Rice.
7. **Italian & Pastas**: Creamy Alfredo White Sauce Penne, Fiery Arrabbiata Red Sauce Pasta, Cheesy Pull-Apart Garlic Bread.
8. **Snacks & Street Food**: Cheesy Peri-Peri Loaded Fries, Mumbai Special Pav Bhaji, Dahi Puri & Chaat Platter, Crispy Punjabi Samosas.
9. **Healthy & Salads**: Mediterranean Greek Feta Salad, High-Protein Quinoa & Roasted Veggie Bowl.
10. **Desserts & Bakery**: Molten Chocolate Lava Cake, Gulab Jamun with Creamy Rabri, Royal Kesar Pista Rasmalai, New York Baked Cheesecake.
11. **Beverages & Shakes**: Belgian Chocolate Milkshake, Fresh Virgin Mojito Cooler, Iced Caramel Frappe, Chilled Kesar Mango Lassi.

---

## 3. Key Features

### Customer Features
- **User Authentication**:
  - Secure registration and login with bcrypt password hashing and JWT authentication.
  - 1-click credential buttons on the login page for viva demonstration.
  - Profile management (name, phone, delivery address) and password changer.
- **Food Catalog & Dynamic Filtering**:
  - Resilient live debounced search (escapes special characters like `\`, `*`, `?` to prevent regex crashes).
  - 11 horizontal category pills (Pizza, Burger, Biryani, South Indian, Italian, Salads, etc.).
  - **Pure Veg Toggle Switch**: 1-click filter for vegetarian meals.
  - Interactive price range slider (₹80 to ₹600).
  - Sorting: Top Rated, Price Low-to-High, Price High-to-Low, Name (A-Z).
- **Dish Details**:
  - Large dish picture, key ingredients list, dietary badge (Veg/Non-Veg), spice level, prep time, and calories.
  - Interactive quantity stepper (- / +).
  - Customer review list displaying star ratings and **Verified Buyer** badges.
  - **Verified Buyer Review Guard**: Only customers who received a `Delivered` order containing that dish can submit reviews.
- **Shopping Cart**:
  - Persisted in browser `localStorage` (`foodie_cart`) so page reloads never lose cart items.
  - Auto calculation of subtotal, delivery fee (Free on orders >= ₹500, else ₹40), and 5% GST.
  - Free delivery progress indicator ("Add ₹X more to get Free Delivery!").
  - Promo code discounts: `TASTY20` (20% off) and `WELCOME50` (₹50 off).
- **Checkout & Order Placement**:
  - Pre-fills saved user address and contact phone.
  - Payment choices: **Cash on Delivery** or **Demo Online Payment** (simulated card & CVV inputs).
- **Order Tracking & Live ETA**:
  - 5-stage visual progress timeline:
    `Order Placed` &rarr; `Confirmed` &rarr; `Preparing` &rarr; `Out for Delivery` &rarr; `Delivered`
  - Dynamic estimated arrival time and countdown badge.
  - Auto-polling every 8 seconds so status changes in the Admin portal update the customer's screen live.
- **Order Cancellation**:
  - Customers can cancel an order if it is still in `Order Placed` or `Confirmed` status. Once preparation begins, cancellation is locked.
- **Printable Tax Invoice**:
  - 1-click "Print Tax Invoice" button generating a GST tax invoice with order items, tax breakdown, and restaurant seal.
- **Wishlist / Favorites**:
  - Heart toggle button on every food card to save dishes to favorites (stored in `localStorage`).
  - Dedicated "My Favorites" filter tab on the menu page.
- **3D Design & Liquid Glass Effect**:
  - **Liquid Glassmorphism**: Translucent frosted cards (`backdrop-filter: blur(18px) saturate(180%)`), iridescent ambient fluid orbs floating gently in the background, and specular reflection highlights.
  - **Interactive 3D Mouse Tilt**: Zero-dependency hardware-accelerated 3D pitch (`rotateX`) and roll (`rotateY`) following cursor movement with dynamic specular glare sheen.
  - **Layered Z-Depth**: Dietary VEG/NON-VEG badges, pricing, and ratings elevated along the Z-axis in 3D perspective space.
  - **3D Tactile Buttons & Timeline**: Tactile button press physics and illuminated 3D glass spheres for the 5-stage order tracking pipeline.
- **Semantic Multi-Hue Color System (Purpose-Driven Colors)**:
  - **11 Cuisine Badges**: Distinct gradients & glows for Pizza (crimson), Burger (amber), Biryani (saffron), North Indian (tandoor), South Indian (banana leaf green), Chinese (scarlet), Italian (amethyst purple), Snacks (sunset gold), Healthy (teal), Desserts (rose), and Beverages (cyan).
  - **Dietary Indicators**: Dedicated Emerald Green glow for Pure Veg (`.badge-dietary-veg`) and Crimson Red for Non-Veg (`.badge-dietary-nonveg`).
  - **Spice Heat Scale**: Mild (Mint), Medium (Amber), and Spicy (Fire scarlet).
  - **5-Stage Tracking Pipeline**: Distinct milestone colors & glow pulse for Placed (Sky Blue), Confirmed (Indigo), Preparing (Culinary Amber), Out for Delivery (Teal), and Delivered (Victory Emerald).
  - **Action Button Hierarchy**: Purpose-matched colors for Viewing, Tracking, Printing Invoices, and Cancelling.

### Admin Features
- **Admin Gateway**: Role-protected portal (`req.user.role === 'admin'`).
- **Dashboard Overview**: 6 metric stat cards (Total Revenue, Orders, Pending, Delivered, Foods, Customers) + recent orders table.
- **Food Inventory Management**: Add, edit, delete dishes, toggle instant in-stock availability switch, and set dietary types, spice levels, prep times, and calories.
- **Category Management**: Add, edit, and delete cuisine categories.
- **Order Fulfillment**: Filter orders by status and transition stages directly via dropdown menu.
- **User Management**: View all registered customers and delete accounts with self-deletion protection.

---

## 4. Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5.3.3, Bootstrap Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication & Security** | JSON Web Tokens (JWT), bcryptjs password hashing |
| **Architecture** | MVC Pattern (Model-View-Controller), REST API |

---

## 5. Folder Structure

```
online-food-ordering/
├── frontend/
│   ├── index.html              # Customer home page
│   ├── login.html              # Customer login with 1-click demo buttons
│   ├── register.html           # Customer registration page with validation
│   ├── menu.html               # Filterable menu (pure veg toggle, favorites, category pills)
│   ├── food-details.html       # Dish details, ingredients chips, verified reviews
│   ├── cart.html               # Persistent cart with quantity modifiers & promo engine
│   ├── checkout.html           # Address form, COD vs Demo Online Payment
│   ├── orders.html             # Order history with cancellation & print invoice
│   ├── tracking.html           # 5-stage live progress timeline & ETA countdown
│   ├── profile.html            # Profile info edit & password change
│   │
│   ├── admin/
│   │   ├── login.html          # Admin authentication gateway
│   │   ├── dashboard.html      # 6 Metrics cards & recent orders table
│   │   ├── foods.html          # Food inventory CRUD (Add/Edit modals, in-stock toggle)
│   │   ├── categories.html     # Category management CRUD
│   │   ├── orders.html         # Live order management & status updater
│   │   └── users.html          # Registered user accounts list & deletion
│   │
│   ├── css/
│   │   └── style.css           # Modern food-delivery UI styling & print invoice styles
│   │
│   └── js/
│       ├── app.js              # Core helpers (Auth, Cart, Favorites, Toasts, Tax Invoice)
│       ├── auth.js             # Login, registration, profile controller
│       ├── menu.js             # Live search, category filtering, pure veg toggle
│       ├── food-details.js     # Single food page & verified-buyer review submission
│       ├── cart.js             # Cart table rendering & price calculations
│       ├── checkout.js         # Order creation & demo payment handling
│       ├── orders.js           # Order history display & cancellation
│       ├── tracking.js         # 5-stage progress visualizer & ETA countdown
│       └── admin.js            # Admin metrics, modals, and CRUD controllers
│
├── backend/
│   ├── server.js               # Express application entry & static frontend server
│   ├── package.json            # Node.js dependencies and scripts
│   ├── .env                    # Local environment config
│   ├── seeder.js               # Database seeder script
│   ├── data/                   # Seed data JSON sources (11 categories & 39 foods)
│   │
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt password hashing
│   │   ├── Category.js         # Food categories schema
│   │   ├── Food.js             # Food schema (isVeg, spiceLevel, prepTime, calories)
│   │   ├── Order.js            # Order schema with cancellation tracking
│   │   └── Review.js           # Verified customer reviews schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth
│   │   ├── foodRoutes.js       # /api/foods
│   │   ├── categoryRoutes.js   # /api/categories
│   │   ├── orderRoutes.js      # /api/orders
│   │   ├── userRoutes.js       # /api/users
│   │   └── reviewRoutes.js     # /api/reviews
│   │
│   ├── controllers/            # Controller business logic
│   └── middleware/             # JWT auth & admin authorization
│
└── README.md
```

---

## 6. Prerequisites & Requirements

1. **Node.js** (v16 or higher). Verify with `node -v`.
2. **npm** (v8 or higher). Verify with `npm -v`.
3. **MongoDB**: Local MongoDB Server on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI.

---

## 7. Installation & Setup Guide

### Step 1: Open Project Backend
```powershell
cd C:\Users\Sanjai\.gemini\antigravity\scratch\online-food-ordering\backend
```

### Step 2: Install Node Packages
```powershell
npm install
```

### Step 3: Configure Environment Variables
Verify `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/food_ordering_db
JWT_SECRET=wad_food_ordering_secret_key_2026_jwt
```

---

## 8. Database Setup & Seeding

Run the seeder command:
```powershell
node seeder.js
```
This populates MongoDB with:
- **11 Categories**: Pizza, Burger, Biryani, North Indian, South Indian, Chinese, Italian, Snacks & Street Food, Healthy & Salads, Desserts, Beverages.
- **39 Food Items** across all cuisines with Veg/Non-Veg tags, spice levels, and prep times.
- **1 Admin** and **3 Customer** accounts.
- **3 Sample Orders** (`Delivered`, `Out for Delivery`, `Order Placed`).
- **2 Verified Reviews**.

---

## 9. Running the Application

### Start the Server
```powershell
npm start
```
*Console confirms:*
```
 MongoDB connected successfully!
 Database: food_ordering_db
 Server running on http://localhost:5000
 Frontend accessible at http://localhost:5000
 Admin panel accessible at http://localhost:5000/admin/login.html
```

### Accessing the Web Application
- **Customer Home**: [http://localhost:5000](http://localhost:5000)
- **Menu Catalog**: [http://localhost:5000/menu.html](http://localhost:5000/menu.html)
- **Customer Login**: [http://localhost:5000/login.html](http://localhost:5000/login.html)
- **Admin Dashboard**: [http://localhost:5000/admin/login.html](http://localhost:5000/admin/login.html)

---

## 10. Demo Login Credentials

| Role | Email | Password | Pre-loaded State |
|---|---|---|---|
| **System Admin** | `admin@foodie.com` | `admin123` | Full control over inventory, orders, and users |
| **Customer (John)** | `john@example.com` | `user123` | Has 1 Delivered order (can review dishes) & 1 Placed order |
| **Customer (Priya)**| `priya@example.com` | `user123` | Has 1 Out for Delivery order (shows 4th timeline stage) |
| **Customer (Alex)** | `alex@example.com` | `user123` | Fresh customer account |

---

## 11. REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new customer
- `POST /api/auth/login`: Authenticate and issue JWT
- `GET /api/auth/profile`: Get logged-in user profile [Private]
- `PUT /api/auth/profile`: Update user profile [Private]
- `PUT /api/auth/change-password`: Update password [Private]

### Foods (`/api/foods`)
- `GET /api/foods`: Filterable food list (`search`, `category`, `isVeg`, `spiceLevel`, `maxPrice`, `sortBy`)
- `GET /api/foods/:id`: Food details by ID
- `POST /api/foods`: Add dish [Admin]
- `PUT /api/foods/:id`: Edit dish [Admin]
- `DELETE /api/foods/:id`: Delete dish [Admin]

### Orders (`/api/orders`)
- `POST /api/orders`: Place order from cart [Private]
- `GET /api/orders/my-orders`: Get customer order history [Private]
- `GET /api/orders/:id`: Get order details [Private]
- `PUT /api/orders/:id/cancel`: Customer cancels order before prep [Private]
- `GET /api/orders`: Get all orders with status filter [Admin]
- `PUT /api/orders/:id/status`: Update fulfillment status [Admin]
- `GET /api/orders/dashboard-stats`: Metrics overview [Admin]

### Reviews (`/api/reviews`)
- `GET /api/reviews/:foodId`: List reviews for dish
- `GET /api/reviews/:foodId/can-review`: Verify customer delivered order [Private]
- `POST /api/reviews`: Submit verified review [Private]

---

## 12. Common Errors & Troubleshooting

### 1. `EADDRINUSE: address already in use :::5000`
Run in PowerShell:
```powershell
Get-Process -Name node | Stop-Process -Force
```
Then restart `npm start`.

### 2. `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`
Ensure the MongoDB Windows service is active:
```powershell
Start-Service -Name MongoDB
```

---

## 13. WAD Viva Preparation & Oral Exam Guide

1. **Architecture**: Clean MVC separation. Mongoose models enforce schema integrity; Express controllers handle business rules and validation; pure HTML5/CSS3/Vanilla JS renders the UI.
2. **Security**: Passwords hashed using `bcryptjs` with 10 salt rounds before database persistence. Authenticated sessions verified using stateless JSON Web Tokens (JWT).
3. **Cart Persistence**: Cart serialized in browser `localStorage` as JSON under `foodie_cart`. Persists across page reloads without database calls until checkout.
4. **Resilient Search**: Query input regex special characters are sanitized, preventing regex crash errors.
5. **Order Cancellation Rule**: Customers can cancel an order in `Order Placed` or `Confirmed` status. Once preparation starts (`Preparing`), cancellations are locked.
6. **Verified Buyer Reviews**: `reviewController.js` validates that the user has received a completed order with status `Delivered` containing the dish before accepting a review.

---

**Developed for College Web Application Development (WAD) Practical Evaluation.**
