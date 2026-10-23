/**
 * ONLINE FOOD ORDERING SYSTEM - CORE APP UTILITIES
 * Shared helpers for API calls, authentication, shopping cart, favorites, toasts, and UI components
 */

// Base API URL configuration (centralized in js/config.js)
const API_BASE = window.API_BASE_URL || window.API_BASE || 'http://localhost:5000/api';

// ================= AUTHENTICATION HELPERS ================= //
const Auth = {
  getToken() {
    return localStorage.getItem('foodie_token');
  },
  getUser() {
    const userStr = localStorage.getItem('foodie_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },
  setUser(user, token) {
    if (token) localStorage.setItem('foodie_token', token);
    if (user) localStorage.setItem('foodie_user', JSON.stringify(user));
    this.startHeartbeat();
  },
  clearAuth() {
    this.stopHeartbeat();
    localStorage.removeItem('foodie_token');
    localStorage.removeItem('foodie_user');
  },
  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },
  isAdmin() {
    const user = this.getUser();
    return this.isAuthenticated() && user && user.role === 'admin';
  },
  async logout(redirectPath = '/login.html') {
    this.stopHeartbeat();
    const token = this.getToken();

    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.warn('Logout notification error:', err);
      }
    }

    this.clearAuth();
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
      if (window.location.pathname.includes('/admin/') && !redirectPath.startsWith('/')) {
        window.location.href = '../login.html';
      } else {
        window.location.href = redirectPath;
      }
    }, 600);
  },
  startHeartbeat() {
    this.stopHeartbeat();
    if (!this.isAuthenticated()) return;

    const ping = async () => {
      const token = this.getToken();
      if (!token) {
        this.stopHeartbeat();
        return;
      }
      try {
        await fetch(`${API_BASE}/auth/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        // Network glitches won't disrupt browsing
      }
    };

    // Immediate ping to establish active status immediately
    ping();

    // Regular heartbeat every 30 seconds
    window.__foodieHeartbeatTimer = setInterval(ping, 30000);
  },
  stopHeartbeat() {
    if (window.__foodieHeartbeatTimer) {
      clearInterval(window.__foodieHeartbeatTimer);
      window.__foodieHeartbeatTimer = null;
    }
  },
  requireAuth(redirectUrl = null) {
    if (!this.isAuthenticated()) {
      const current = redirectUrl || window.location.pathname + window.location.search;
      const target = window.location.pathname.includes('/admin/') ? '../login.html' : 'login.html';
      window.location.href = `${target}?redirect=${encodeURIComponent(current)}`;
      return false;
    }
    return true;
  },
  requireAdmin() {
    if (!this.isAdmin()) {
      showToast('Admin privileges required', 'danger');
      const target = window.location.pathname.includes('/admin/') ? 'login.html' : 'admin/login.html';
      window.location.href = target;
      return false;
    }
    return true;
  }
};

// ================= SHOPPING CART HELPERS ================= //
const Cart = {
  getCart() {
    try {
      const cartStr = localStorage.getItem('foodie_cart');
      return cartStr ? JSON.parse(cartStr) : [];
    } catch (e) {
      return [];
    }
  },
  saveCart(cart) {
    localStorage.setItem('foodie_cart', JSON.stringify(cart));
    this.updateCartBadge();
  },
  addToCart(food, quantity = 1) {
    const cart = this.getCart();
    const foodId = food._id || food.id;
    const existingIndex = cart.findIndex(item => (item.food === foodId || item._id === foodId));

    const qty = parseInt(quantity) || 1;

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        food: foodId,
        _id: foodId,
        name: food.name,
        price: Number(food.price),
        image: food.image,
        isVeg: food.isVeg !== undefined ? food.isVeg : true,
        quantity: qty
      });
    }

    this.saveCart(cart);
    showToast(`Added ${qty}x "${food.name}" to cart!`, 'success');
  },
  updateQuantity(foodId, newQuantity) {
    let cart = this.getCart();
    const qty = parseInt(newQuantity);
    if (qty <= 0) {
      this.removeFromCart(foodId);
      return;
    }
    const item = cart.find(i => (i.food === foodId || i._id === foodId));
    if (item) {
      item.quantity = qty;
      this.saveCart(cart);
    }
  },
  removeFromCart(foodId) {
    let cart = this.getCart();
    const removedItem = cart.find(i => (i.food === foodId || i._id === foodId));
    cart = cart.filter(i => (i.food !== foodId && i._id !== foodId));
    this.saveCart(cart);
    if (removedItem) {
      showToast(`Removed "${removedItem.name}" from cart`, 'info');
    }
  },
  clearCart() {
    localStorage.removeItem('foodie_cart');
    this.updateCartBadge();
  },
  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  },
  getSubtotal() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  },
  updateCartBadge() {
    const badges = document.querySelectorAll('.cart-count-badge');
    const count = this.getCartCount();
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
  }
};

// ================= FAVORITES / WISHLIST HELPERS ================= //
const Favorites = {
  get() {
    try {
      const str = localStorage.getItem('foodie_favorites');
      return str ? JSON.parse(str) : [];
    } catch (e) {
      return [];
    }
  },
  isFav(foodId) {
    return this.get().includes(foodId);
  },
  toggle(foodId, event = null) {
    if (event) event.stopPropagation();
    let favs = this.get();
    const index = favs.indexOf(foodId);
    let isNowFav = false;

    if (index > -1) {
      favs.splice(index, 1);
      showToast('Removed from favorites', 'info');
    } else {
      favs.push(foodId);
      showToast('Saved to your favorites! ❤️', 'success');
      isNowFav = true;
    }

    localStorage.setItem('foodie_favorites', JSON.stringify(favs));
    this.updateIcons();
    return isNowFav;
  },
  updateIcons() {
    const favs = this.get();
    document.querySelectorAll('.btn-favorite').forEach(btn => {
      const foodId = btn.getAttribute('data-food-id');
      const icon = btn.querySelector('i');
      if (favs.includes(foodId)) {
        btn.classList.add('active');
        if (icon) icon.className = 'bi bi-heart-fill text-danger';
      } else {
        btn.classList.remove('active');
        if (icon) icon.className = 'bi bi-heart text-muted';
      }
    });
  }
};

// ================= TOAST NOTIFICATION HELPER ================= //
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;

  const icon = type === 'success' ? 'bi-check-circle-fill' :
               type === 'danger' ? 'bi-exclamation-triangle-fill' :
               type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';

  toast.innerHTML = `<i class="bi ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

// ================= FORMATTERS ================= //
function formatPrice(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ================= SEMANTIC MULTI-HUE COLOR SYSTEM HELPERS ================= //
function getCategoryBadgeClass(catName = '') {
  if (!catName) return 'badge-cat-pizza';
  const lower = (typeof catName === 'string' ? catName : (catName.name || '')).toLowerCase();
  if (lower.includes('pizza')) return 'badge-cat-pizza';
  if (lower.includes('burger')) return 'badge-cat-burger';
  if (lower.includes('biryani')) return 'badge-cat-biryani';
  if (lower.includes('north')) return 'badge-cat-north-indian';
  if (lower.includes('south')) return 'badge-cat-south-indian';
  if (lower.includes('chinese')) return 'badge-cat-chinese';
  if (lower.includes('italian')) return 'badge-cat-italian';
  if (lower.includes('snack')) return 'badge-cat-snacks';
  if (lower.includes('salad') || lower.includes('health')) return 'badge-cat-healthy';
  if (lower.includes('dessert')) return 'badge-cat-desserts';
  if (lower.includes('beverage')) return 'badge-cat-beverages';
  return 'badge-cat-pizza';
}

function getStatusBadge(status) {
  let statusClass = 'status-placed';
  let icon = 'bi-cart-check';

  if (status === 'Order Placed') {
    statusClass = 'status-placed';
    icon = 'bi-cart-check';
  } else if (status === 'Confirmed') {
    statusClass = 'status-confirmed';
    icon = 'bi-patch-check';
  } else if (status === 'Preparing') {
    statusClass = 'status-preparing';
    icon = 'bi-fire';
  } else if (status === 'Out for Delivery') {
    statusClass = 'status-delivery';
    icon = 'bi-bicycle';
  } else if (status === 'Delivered') {
    statusClass = 'status-delivered';
    icon = 'bi-check-all';
  } else if (status === 'Cancelled') {
    statusClass = 'status-cancelled';
    icon = 'bi-x-circle';
  }

  return `<span class="status-badge ${statusClass}"><i class="bi ${icon}"></i> ${status}</span>`;
}

// ================= PRINTABLE TAX INVOICE HELPER ================= //
function printOfficialInvoice(order) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups to print your tax invoice.');
    return;
  }

  const invoiceHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice #${order._id.substring(order._id.length - 8).toUpperCase()}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #2f3542; }
        .invoice-box { max-width: 750px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 12px; }
        .brand-title { color: #ff4757; font-weight: 800; font-size: 28px; }
        .stamp { display: inline-block; border: 2px dashed #2ed573; color: #2ed573; padding: 6px 14px; font-weight: 700; border-radius: 6px; text-transform: uppercase; }
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <h1 class="brand-title mb-1">FoodieBites</h1>
            <p class="text-muted small mb-0">GSTIN: 29AABCU9603R1ZM &bull; FSSAI Lic No. 11223344556677</p>
            <p class="text-muted small mb-0">100 Tech Park, MG Road, Bengaluru, Karnataka - 560001</p>
          </div>
          <div class="text-end">
            <span class="stamp">${order.paymentStatus === 'Paid' ? 'PAID / VERIFIED' : order.status.toUpperCase()}</span>
            <p class="small text-muted mt-2 mb-0">Invoice: <strong>#INV-${order._id.substring(order._id.length - 8).toUpperCase()}</strong></p>
            <p class="small text-muted mb-0">Date: ${formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-6">
            <h6 class="fw-bold text-uppercase small text-muted">Billed To:</h6>
            <h6 class="fw-bold mb-1">${order.deliveryAddress?.name || 'Valued Customer'}</h6>
            <p class="small text-muted mb-1">${order.deliveryAddress?.address || ''}, ${order.deliveryAddress?.city || ''} - ${order.deliveryAddress?.pincode || ''}</p>
            <p class="small text-muted mb-0">Contact: ${order.deliveryAddress?.phone || order.phone}</p>
          </div>
          <div class="col-6 text-end">
            <h6 class="fw-bold text-uppercase small text-muted">Order Details:</h6>
            <p class="small text-muted mb-1">Payment Method: <strong>${order.paymentMethod}</strong></p>
            <p class="small text-muted mb-1">Payment Status: <strong>${order.paymentStatus || 'Pending'}</strong></p>
            <p class="small text-muted mb-0">Fulfillment Status: <strong>${order.status}</strong></p>
          </div>
        </div>

        <table class="table table-bordered align-middle mb-4">
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Description / Dish</th>
              <th class="text-center">Dietary</th>
              <th class="text-center">Qty</th>
              <th class="text-end">Unit Price</th>
              <th class="text-end">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${item.name}</strong></td>
                <td class="text-center"><span class="badge ${item.isVeg ? 'bg-success' : 'bg-danger'}">${item.isVeg ? 'VEG' : 'NON-VEG'}</span></td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-end">${formatPrice(item.price)}</td>
                <td class="text-end">${formatPrice(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="row justify-content-end mb-4">
          <div class="col-6">
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted small">Subtotal:</span>
              <span class="fw-bold small">${formatPrice(order.subtotal)}</span>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted small">Delivery Charges:</span>
              <span class="small">${order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}</span>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted small">GST (5% SGST + CGST):</span>
              <span class="small">${formatPrice(order.tax)}</span>
            </div>
            <div class="d-flex justify-content-between py-2 border-top fs-5 fw-bold">
              <span>Grand Total:</span>
              <span class="text-danger">${formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div class="text-center border-top pt-3 text-muted small">
          <p class="mb-1">Thank you for dining with FoodieBites! Delicious food delivered with care.</p>
          <p class="mb-3">This is a computer-generated tax invoice for college Web Application Development project.</p>
          <div class="no-print">
            <button class="btn btn-primary px-4 btn-sm rounded-pill" onclick="window.print()">Print Invoice / Save PDF</button>
            <button class="btn btn-outline-secondary px-3 btn-sm rounded-pill ms-2" onclick="window.close()">Close</button>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(invoiceHtml);
  printWindow.document.close();
}

// ================= NAVBAR & FOOTER RENDERERS ================= //
function renderNavbar(activePage = 'home') {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  const isUserLoggedIn = Auth.isAuthenticated();
  const user = Auth.getUser();
  const isAdmin = Auth.isAdmin();
  const inAdminFolder = window.location.pathname.includes('/admin/');
  const rootPrefix = inAdminFolder ? '../' : './';

  let authLinksHtml = '';
  if (isUserLoggedIn) {
    authLinksHtml = `
      <div class="dropdown">
        <button class="btn btn-outline-primary btn-pill dropdown-toggle d-flex align-items-center gap-2" type="button" id="userMenuBtn" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle"></i>
          <span>${user.name.split(' ')[0]}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="userMenuBtn">
          <li><h6 class="dropdown-header">Signed in as <strong>${user.name}</strong></h6></li>
          <li><a class="dropdown-item" href="${rootPrefix}profile.html"><i class="bi bi-person me-2"></i>My Profile</a></li>
          <li><a class="dropdown-item" href="${rootPrefix}orders.html"><i class="bi bi-bag-check me-2"></i>My Orders</a></li>
          ${isAdmin ? `<li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-primary" href="${rootPrefix}admin/dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Admin Dashboard</a></li>` : ''}
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="Auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
        </ul>
      </div>
    `;
  } else {
    authLinksHtml = `
      <div class="d-flex align-items-center gap-2">
        <a href="${rootPrefix}login.html" class="btn btn-outline-primary btn-pill">Log In</a>
        <a href="${rootPrefix}register.html" class="btn btn-primary btn-pill">Sign Up</a>
      </div>
    `;
  }

  placeholder.innerHTML = `
    <nav class="navbar navbar-expand-lg sticky-top">
      <div class="container">
        <a class="navbar-brand" href="${rootPrefix}index.html">
          <i class="bi bi-fire"></i> FoodieBites
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNavbar">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            <li class="nav-item">
              <a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="${rootPrefix}index.html">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activePage === 'menu' ? 'active' : ''}" href="${rootPrefix}menu.html">Menu</a>
            </li>
            ${isUserLoggedIn ? `
            <li class="nav-item">
              <a class="nav-link ${activePage === 'orders' ? 'active' : ''}" href="${rootPrefix}orders.html">My Orders</a>
            </li>
            ` : ''}
          </ul>
          
          <div class="d-flex align-items-center gap-3">
            <a href="${rootPrefix}menu.html?filter=favs" class="btn btn-light position-relative rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;" title="View Favorites">
              <i class="bi bi-heart fs-5 text-danger"></i>
            </a>
            <a href="${rootPrefix}cart.html" class="btn btn-light position-relative rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;" title="View Cart">
              <i class="bi bi-cart3 fs-5 text-dark"></i>
              <span class="cart-count-badge" style="display: none;">0</span>
            </a>
            ${authLinksHtml}
          </div>
        </div>
      </div>
    </nav>
  `;

  Cart.updateCartBadge();
  Favorites.updateIcons();
}

function renderFooter() {
  const placeholder = document.getElementById('footer-placeholder');
  if (!placeholder) return;

  const inAdminFolder = window.location.pathname.includes('/admin/');
  const rootPrefix = inAdminFolder ? '../' : './';

  placeholder.innerHTML = `
    <footer>
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4 col-md-6">
            <h4 class="text-white mb-3"><i class="bi bi-fire text-danger me-2"></i>FoodieBites</h4>
            <p class="text-muted">Order your favorite delicious meals, hot pizzas, royal biryanis, South Indian dosas, Italian pastas, and decadent desserts delivered fresh to your doorstep in minutes.</p>
            <div class="d-flex gap-2 mt-3">
              <a href="#" class="btn btn-sm btn-outline-light rounded-circle"><i class="bi bi-facebook"></i></a>
              <a href="#" class="btn btn-sm btn-outline-light rounded-circle"><i class="bi bi-instagram"></i></a>
              <a href="#" class="btn btn-sm btn-outline-light rounded-circle"><i class="bi bi-twitter-x"></i></a>
            </div>
          </div>
          <div class="col-lg-2 col-md-6">
            <h5>Quick Links</h5>
            <ul class="list-unstyled">
              <li class="mb-2"><a href="${rootPrefix}index.html">Home</a></li>
              <li class="mb-2"><a href="${rootPrefix}menu.html">Browse Menu</a></li>
              <li class="mb-2"><a href="${rootPrefix}cart.html">Shopping Cart</a></li>
              <li class="mb-2"><a href="${rootPrefix}orders.html">Track Orders</a></li>
            </ul>
          </div>
          <div class="col-lg-3 col-md-6">
            <h5>Top Cuisines</h5>
            <ul class="list-unstyled">
              <li class="mb-2"><a href="${rootPrefix}menu.html?cat=Pizza">Stone-baked Pizza</a></li>
              <li class="mb-2"><a href="${rootPrefix}menu.html?cat=Biryani">Royal Dum Biryani</a></li>
              <li class="mb-2"><a href="${rootPrefix}menu.html?cat=South%20Indian">Crispy Dosas & Idlis</a></li>
              <li class="mb-2"><a href="${rootPrefix}menu.html?cat=Italian">Artisan Italian Pastas</a></li>
            </ul>
          </div>
          <div class="col-lg-3 col-md-6">
            <h5>Admin & Support</h5>
            <ul class="list-unstyled">
              <li class="mb-2"><a href="${rootPrefix}admin/login.html"><i class="bi bi-shield-lock me-1"></i> Admin Portal</a></li>
              <li class="mb-2 text-muted"><i class="bi bi-envelope me-1"></i> support@foodiebites.com</li>
              <li class="mb-2 text-muted"><i class="bi bi-telephone me-1"></i> +91 98765 43210</li>
              <li class="mb-2 text-muted"><i class="bi bi-geo-alt me-1"></i> Bengaluru, Karnataka, India</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom text-center">
          <p class="mb-0">&copy; ${new Date().getFullYear()} FoodieBites Online Food Ordering System. Built for College Web Application Development (WAD) Project.</p>
        </div>
      </div>
    </footer>
  `;
}

// ================= AMBIENT LIQUID ORBS & 3D TILT ENGINE ================= //
const AmbientBackground = {
  inject() {
    if (document.querySelector('.liquid-backdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'liquid-backdrop';
    backdrop.innerHTML = `
      <div class="liquid-orb liquid-orb-1"></div>
      <div class="liquid-orb liquid-orb-2"></div>
      <div class="liquid-orb liquid-orb-3"></div>
    `;
    document.body.prepend(backdrop);
  }
};

const Tilt3D = {
  init(selector = '.card-custom, .category-card, .stat-card, .tilt-3d, .hero-floating-card') {
    // Only activate for devices with mouse/pointer
    if (window.matchMedia && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el._hasTilt3D) return;
      el._hasTilt3D = true;

      // Add specular glare tracker if not already present
      if (!el.querySelector('.tilt-glare') && el.classList.contains('card-custom')) {
        const glare = document.createElement('div');
        glare.className = 'tilt-glare';
        el.appendChild(glare);
      }

      el.addEventListener('mouseenter', () => {
        el.style.transition = 'transform 0.12s ease-out, box-shadow 0.25s ease';
      });

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const maxTilt = el.dataset.tiltMax ? parseFloat(el.dataset.tiltMax) : 9;
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        el.style.setProperty('--mouse-x', `${percentX}%`);
        el.style.setProperty('--mouse-y', `${percentY}%`);

        el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale3d(1.025, 1.025, 1.025)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.4, 1), box-shadow 0.3s ease';
        el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
        el.style.setProperty('--mouse-x', '50%');
        el.style.setProperty('--mouse-y', '50%');
      });
    });
  },

  observe() {
    const observer = new MutationObserver(() => {
      this.init();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
};

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  AmbientBackground.inject();
  Cart.updateCartBadge();
  Favorites.updateIcons();
  Tilt3D.init();
  Tilt3D.observe();

  if (Auth.isAuthenticated()) {
    Auth.startHeartbeat();
  }
});


