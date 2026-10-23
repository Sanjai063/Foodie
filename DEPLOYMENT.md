# FoodieBites - Production Deployment Guide 🚀
### Full-Stack Online Food Ordering System
**Deployment Architecture:**
* **Frontend:** Render (Static Site)
* **Backend:** Render (Web Service)
* **Database:** MongoDB Atlas (Cloud Database)

---

## Quick Reference Summary

| Component | Service | Root Directory | Build Command | Start / Publish |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | Render Web Service | `backend` | `npm install` | `npm start` |
| **Frontend** | Render Static Site | `frontend` | *(leave blank)* | `.` |
| **Database** | MongoDB Atlas | N/A | N/A | Free M0 Cluster |

> **Exact file and line to configure your backend URL:**
> Open [`frontend/js/config.js`](frontend/js/config.js) &rarr; **Line 22**:
> ```javascript
> PROD_API_BASE_URL: 'https://your-backend-name.onrender.com/api',
> ```

---

## Phase 1: MongoDB Atlas Setup (Cloud Database)

1. **Sign Up / Log In**:
   * Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database) and sign in or create a free account.

2. **Create a Free Cluster**:
   * Click **Create** or **Build a Database**.
   * Choose the **M0 Free** (Shared) tier.
   * Choose a cloud provider and region closest to your users (e.g., AWS - Mumbai `ap-south-1` or Singapore/US).
   * Name your cluster (e.g., `foodiebites-cluster`) and click **Create Deployment**.

3. **Create a Database User**:
   * In the **Security** &rarr; **Database Access** menu, click **Add New Database User**.
   * Authentication method: **Password**.
   * Username: e.g., `foodie_admin`.
   * Password: Create a strong password (e.g., `FoodieBitesPass2026`). *Save this password securely!*
   * Database User Privileges: Select **Read and write to any database**.
   * Click **Add User**.

4. **Configure Network Access (Crucial for Render)**:
   * In the **Security** &rarr; **Network Access** menu, click **Add IP Address**.
   * Click **Allow Access from Anywhere** (this sets `0.0.0.0/0`).
   * *Why is this required?* Render hosts dynamic IP addresses. If you don't whitelist `0.0.0.0/0`, Render will be blocked from connecting to your MongoDB cluster.
   * Click **Confirm**.

5. **Get Your Connection String**:
   * In the **Database** &rarr; **Deployments** menu, click **Connect** next to your cluster.
   * Select **Drivers** (Node.js).
   * Copy the connection string format:
     ```
     mongodb+srv://foodie_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   * Replace `<password>` with your database user password.
   * Insert your database name before `?`:
     ```
     mongodb+srv://foodie_admin:FoodieBitesPass2026@cluster0.xxxxx.mongodb.net/food_ordering_db?retryWrites=true&w=majority
     ```
   * Save this connection string for Phase 3 and Phase 4.

---

## Phase 2: Push Code to GitHub

1. Open PowerShell or Terminal in the root project folder:
   ```bash
   cd "C:\Users\Sanjai\.gemini\antigravity\scratch\online-food-ordering"
   ```

2. Initialize Git, stage all files, and verify secrets are ignored:
   ```bash
   git init
   git add .
   git status
   ```
   *(Notice that `.env` and `node_modules` are excluded thanks to `.gitignore`)*

3. Commit your code:
   ```bash
   git commit -m "feat: Prepare FoodieBites for production deployment to Render and Atlas"
   ```

4. Create a new repository on [GitHub](https://github.com/new):
   * Name: `online-food-ordering-system`
   * Visibility: **Public** or **Private**
   * Do not initialize with README, .gitignore, or license (we already created them).

5. Link and push to GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/online-food-ordering-system.git
   git push -u origin main
   ```

---

## Phase 3: Deploy Backend on Render (Web Service)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** &rarr; **Web Service**.
3. Select **Build and deploy from a Git repository**, click **Next**, and connect your GitHub repository.
4. Configure the Web Service settings:
   * **Name**: `foodiebites-backend` (or any unique name)
   * **Region**: Choose the region closest to your MongoDB Atlas region (e.g., Singapore, Frankfurt, or Ohio).
   * **Root Directory**: `backend` *(IMPORTANT)*
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free`

5. **Add Environment Variables**:
   Under the **Environment Variables** section, click **Add Environment Variable** for each:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `MONGODB_URI` | `mongodb+srv://foodie_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/food_ordering_db?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `foodiebites_production_jwt_secret_key_wad_2026` | Secure secret string for JWT tokens |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `5000` | Optional (Render injects its own PORT automatically) |
   | `CLIENT_URL` | `*` *(or update later with your Render frontend URL)* | CORS allowed origin |

6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build and deployment to complete.
8. Once deployed, Render will provide your public backend URL, for example:
   ```
   https://foodiebites-backend.onrender.com
   ```
9. Verify your backend is running by visiting:
   ```
   https://foodiebites-backend.onrender.com/api/health
   ```
   You should see:
   ```json
   {
     "status": "OK",
     "message": "Online Food Ordering System API is running smoothly",
     "timestamp": "2026-..."
   }
   ```

---

## Phase 4: Seed Database in Production (All 39 Foods & 11 Categories)

Before testing the frontend, seed your MongoDB Atlas database with all 11 food categories, 39 food items, admin credentials, sample user, and demo reviews.

### Method 1: Local Terminal Run (Easiest & Fastest)
In your local computer's terminal:
```powershell
cd "C:\Users\Sanjai\.gemini\antigravity\scratch\online-food-ordering\backend"

# Set your Atlas URI temporarily and run the seeder
$env:MONGODB_URI="mongodb+srv://foodie_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/food_ordering_db?retryWrites=true&w=majority"
npm run seed
```
*(On Mac/Linux Bash: `MONGODB_URI="mongodb+srv://..." npm run seed`)*

You will see:
```
Connected to MongoDB for database seeding...
Cleared existing collections.
Seeded 11 categories.
Seeded 2 users (Admin & Customer).
Seeded 39 food items with verified images.
Database seeding completed successfully!
```

---

## Phase 5: Connect Frontend to Backend & Deploy on Render (Static Site)

### Step 1: Update API Base URL in Frontend
1. Open [`frontend/js/config.js`](frontend/js/config.js) in your editor.
2. Locate **Line 22**:
   ```javascript
   PROD_API_BASE_URL: 'https://foodiebites-backend.onrender.com/api',
   ```
3. Replace `https://foodiebites-backend.onrender.com` with your **actual** Render backend URL from Phase 3 (keep `/api` at the end).
4. Save the file.

### Step 2: Commit and Push the Configuration
```bash
git add frontend/js/config.js
git commit -m "chore: Update PROD_API_BASE_URL with deployed Render backend endpoint"
git push origin main
```

### Step 3: Create Render Static Site
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** &rarr; **Static Site**.
3. Connect your GitHub repository: `online-food-ordering-system`.
4. Configure the Static Site settings:
   * **Name**: `foodiebites-frontend` (or any unique name)
   * **Root Directory**: `frontend` *(IMPORTANT)*
   * **Build Command**: *(LEAVE COMPLETELY BLANK)*
   * **Publish Directory**: `.` *(a single period represents the root directory)*
5. Click **Create Static Site**.
6. Deployment will take about 30 seconds.
7. Render will provide your public frontend URL, for example:
   ```
   https://foodiebites-frontend.onrender.com
   ```

### Step 4: Update Backend CORS with Frontend URL
1. Go back to Render Dashboard &rarr; select your `foodiebites-backend` Web Service.
2. Go to **Environment** tab.
3. Edit or add the `CLIENT_URL` variable:
   * Key: `CLIENT_URL`
   * Value: `https://foodiebites-frontend.onrender.com` (your exact frontend URL)
4. Click **Save Changes**. Render will automatically restart the backend with the new CORS setting.

---

## Phase 6: Post-Deployment Verification & Viva Checklist

Visit your live frontend URL (`https://foodiebites-frontend.onrender.com`) and test all core flows:

1. **Homepage & Navigation**:
   * Verify all 11 category badges load with accurate icons and counts.
   * Verify popular foods load with images, ratings, and price tags.
2. **Menu Page**:
   * Filter by category (Pizza, Burgers, Biryani, North Indian, Desserts, Beverages, etc.).
   * Test the **Pure Veg** switch.
   * Test the **Price Range** slider.
   * Test search by dish or ingredient.
3. **Food Details & Reviews**:
   * Click any food card to view ingredients, nutritional facts, prep time, spice level, and customer reviews.
4. **Cart & Checkout**:
   * Add 2-3 items to cart. Adjust quantities.
   * Proceed to checkout. Fill in delivery address and place order (Cash on Delivery or UPI).
5. **Live Order Tracking**:
   * View the interactive step progress bar (Placed &rarr; Confirmed &rarr; Preparing &rarr; Out for Delivery &rarr; Delivered).
   * Test the **Print Invoice** button to generate a formatted PDF tax invoice.
6. **Customer Account**:
   * Register a new account (`/register.html`).
   * Log in and view **My Orders** and **Profile**.
7. **Admin Dashboard & Real-Time User Analytics**:
   * Visit `/admin/login.html`.
   * Credentials:
     * **Email**: `admin@foodie.com`
     * **Password**: `admin123`
   * Verify Metrics: Total Revenue, Total Orders, Total Food Items.
   * Verify **Total Registered Users** (queried directly from MongoDB).
   * Verify **Currently Online Users** (real-time heartbeat tracking, 2-minute active window, auto-refreshes every 10 seconds).
   * Verify **Currently Online Users Live Monitor** table showing active users with relative activity timestamps.
   * Manage Foods: Add a food, edit price/availability, delete food.
   * Manage Orders: Update order status to "Out for Delivery" or "Delivered".

---

## Troubleshooting Common Deployment Issues

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **First request takes 30-50 seconds** | Render Free Tier services spin down after 15 mins of inactivity. | This is normal for free tier ("cold start"). Subsequent requests will be instant. |
| **"MongoDB connection failed" in backend logs** | IP address not whitelisted in MongoDB Atlas or incorrect password in URI. | In MongoDB Atlas, go to **Network Access** &rarr; verify `0.0.0.0/0` is added. Check URI password for typos or special characters. |
| **CORS error in browser console** | Frontend origin does not match backend CORS whitelist. | In Render backend **Environment**, set `CLIENT_URL` to your frontend URL, e.g. `https://foodiebites-frontend.onrender.com` (no trailing slash). |
| **API calls failing on deployed frontend** | `frontend/js/config.js` still has the placeholder URL. | Edit Line 22 of [`frontend/js/config.js`](frontend/js/config.js) to your deployed backend URL + `/api`, then `git commit` and `git push`. |
| **Food images not loading** | Root directory incorrect on Render Static Site. | Ensure **Root Directory** is `frontend` and **Publish Directory** is `.` on Render Static Site settings. |
