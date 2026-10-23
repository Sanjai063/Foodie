/**
 * ONLINE FOOD ORDERING SYSTEM - ADMIN DASHBOARD JS
 * Central controller for Admin Metrics, Foods CRUD with Dietary indicators, Categories CRUD, Orders, and Users
 */

let cachedCategories = [];

function renderAdminLayout(activePage = 'dashboard') {
  if (!Auth.requireAdmin()) return;

  const sidebarEl = document.getElementById('adminSidebar');
  const user = Auth.getUser();

  if (sidebarEl) {
    sidebarEl.innerHTML = `
      <div class="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom">
        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 42px; height: 42px; font-size: 1.2rem;">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        <div>
          <h6 class="mb-0 fw-bold">Admin Portal</h6>
          <small class="text-muted">${user?.name || 'Administrator'}</small>
        </div>
      </div>

      <nav class="nav flex-column">
        <a class="admin-nav-item ${activePage === 'dashboard' ? 'active' : ''}" href="dashboard.html">
          <i class="bi bi-speedometer2"></i> Dashboard Overview
        </a>
        <a class="admin-nav-item ${activePage === 'foods' ? 'active' : ''}" href="foods.html">
          <i class="bi bi-egg-fried"></i> Food Items
        </a>
        <a class="admin-nav-item ${activePage === 'categories' ? 'active' : ''}" href="categories.html">
          <i class="bi bi-tags"></i> Food Categories
        </a>
        <a class="admin-nav-item ${activePage === 'orders' ? 'active' : ''}" href="orders.html">
          <i class="bi bi-receipt"></i> Orders Management
        </a>
        <a class="admin-nav-item ${activePage === 'users' ? 'active' : ''}" href="users.html">
          <i class="bi bi-people"></i> Registered Users
        </a>
        <hr class="my-3">
        <a class="admin-nav-item text-secondary" href="../index.html" target="_blank">
          <i class="bi bi-box-arrow-up-right"></i> View Customer Website
        </a>
        <a class="admin-nav-item text-danger" href="javascript:void(0)" onclick="Auth.logout('login.html')">
          <i class="bi bi-box-arrow-right"></i> Admin Logout
        </a>
      </nav>
    `;
  }
}

// Helper to format relative time ago for live activity monitoring
function formatTimeAgo(dateString) {
  if (!dateString) return 'Never';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  return formatDate(dateString);
}

// Function to fetch order statistics and user analytics
async function fetchDashboardData() {
  const token = Auth.getToken();
  if (!token) return;

  try {
    const [ordersRes, adminStatsRes] = await Promise.all([
      fetch(`${API_BASE}/orders/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const ordersData = await ordersRes.json();
    const adminData = await adminStatsRes.json();

    if (ordersData.success) {
      const s = ordersData.stats;
      const elRevenue = document.getElementById('statTotalRevenue');
      const elOrders = document.getElementById('statTotalOrders');
      const elPending = document.getElementById('statPendingOrders');
      const elDelivered = document.getElementById('statDeliveredOrders');
      const elFoods = document.getElementById('statTotalFoods');

      if (elRevenue) elRevenue.textContent = formatPrice(s.totalRevenue || 0);
      if (elOrders) elOrders.textContent = s.totalOrders || 0;
      if (elPending) elPending.textContent = s.pendingOrders || 0;
      if (elDelivered) elDelivered.textContent = s.deliveredOrders || 0;
      if (elFoods) elFoods.textContent = s.totalFoods || 0;

      const tableBody = document.getElementById('recentOrdersTableBody');
      if (tableBody) {
        if (!ordersData.recentOrders || ordersData.recentOrders.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No orders yet</td></tr>';
        } else {
          tableBody.innerHTML = ordersData.recentOrders.map(order => `
            <tr>
              <td><span class="font-monospace small fw-bold">#${order._id.substring(order._id.length - 8).toUpperCase()}</span></td>
              <td>${order.user?.name || order.deliveryAddress?.name || 'Customer'}</td>
              <td>${formatPrice(order.totalAmount)}</td>
              <td>${formatDate(order.createdAt)}</td>
              <td>${renderStatusSelect(order._id, order.status)}</td>
              <td>
                <a href="orders.html" class="btn btn-sm btn-outline-primary btn-pill">Manage</a>
              </td>
            </tr>
          `).join('');
        }
      }
    }

    if (adminData.success) {
      // 1. Total Registered Users
      const elTotalUsers = document.getElementById('statTotalUsers');
      if (elTotalUsers) {
        elTotalUsers.textContent = adminData.totalUsers;
      }

      // 2. Currently Online Users
      const elOnlineUsers = document.getElementById('statOnlineUsers');
      if (elOnlineUsers) {
        elOnlineUsers.textContent = adminData.onlineUsers;
      }

      // 3. Online Badge in Table
      const elBadge = document.getElementById('onlineUsersCountBadge');
      if (elBadge) {
        elBadge.textContent = `${adminData.onlineUsers} Active`;
      }

      // 4. Currently Online Users Table List
      const onlineTableBody = document.getElementById('onlineUsersTableBody');
      if (onlineTableBody) {
        const list = adminData.onlineUsersList || [];
        if (list.length === 0) {
          onlineTableBody.innerHTML = `
            <tr>
              <td colspan="5" class="text-center py-4 text-muted">
                <i class="bi bi-moon-stars text-muted me-2"></i>No users currently online (last active > 2 minutes ago)
              </td>
            </tr>
          `;
        } else {
          onlineTableBody.innerHTML = list.map(u => `
            <tr>
              <td>
                <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1">
                  <i class="bi bi-circle-fill me-1 small pulse-dot"></i>Online
                </span>
              </td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center" style="width: 34px; height: 34px; font-size: 0.85rem;">
                    ${(u.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span class="fw-semibold text-dark d-block">${u.name}</span>
                  </div>
                </div>
              </td>
              <td class="text-muted small">${u.email}</td>
              <td>
                <span class="badge ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'} bg-opacity-10 text-${u.role === 'admin' ? 'primary' : 'dark'} rounded-pill text-capitalize">
                  ${u.role}
                </span>
              </td>
              <td>
                <span class="text-muted small">
                  <i class="bi bi-clock me-1"></i>${formatTimeAgo(u.lastActiveAt)}
                </span>
              </td>
            </tr>
          `).join('');
        }
      }
    }
  } catch (err) {
    console.error('Dashboard data fetch error:', err);
  }
}

// ================= DASHBOARD METRICS INITIALIZER ================= //
async function initDashboard() {
  renderAdminLayout('dashboard');

  // Initial fetch
  await fetchDashboardData();

  // Clear previous auto-refresh interval if any
  if (window.__adminDashboardRefreshInterval) {
    clearInterval(window.__adminDashboardRefreshInterval);
  }

  // Set 10-second auto-refresh interval
  window.__adminDashboardRefreshInterval = setInterval(fetchDashboardData, 10000);
}

// ================= FOODS MANAGEMENT ================= //
async function initFoodsManagement() {
  renderAdminLayout('foods');
  await loadCategoriesForDropdown();
  await loadFoodsTable();

  // Add Food Form
  const addFoodForm = document.getElementById('addFoodForm');
  if (addFoodForm) {
    addFoodForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('foodName').value.trim();
      const category = document.getElementById('foodCategory').value;
      const price = parseFloat(document.getElementById('foodPrice').value);
      const image = document.getElementById('foodImage').value.trim();
      const ingredients = document.getElementById('foodIngredients').value;
      const description = document.getElementById('foodDescription').value.trim();
      const isVeg = document.getElementById('foodIsVeg').value === 'true';
      const spiceLevel = document.getElementById('foodSpiceLevel').value;
      const prepTime = document.getElementById('foodPrepTime').value.trim() || '20 mins';
      const calories = parseInt(document.getElementById('foodCalories').value) || 350;
      const available = document.getElementById('foodAvailable').checked;

      try {
        const res = await fetch(`${API_BASE}/foods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}`
          },
          body: JSON.stringify({ name, category, price, image, ingredients, description, isVeg, spiceLevel, prepTime, calories, available })
        });

        const data = await res.json();
        if (data.success) {
          showToast('Food item created successfully!', 'success');
          bootstrap.Modal.getInstance(document.getElementById('addFoodModal')).hide();
          addFoodForm.reset();
          loadFoodsTable();
        } else {
          showToast(data.message || 'Error creating food', 'danger');
        }
      } catch (err) {
        showToast('Network error while saving food', 'danger');
      }
    });
  }

  // Edit Food Form
  const editFoodForm = document.getElementById('editFoodForm');
  if (editFoodForm) {
    editFoodForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editFoodId').value;
      const name = document.getElementById('editFoodName').value.trim();
      const category = document.getElementById('editFoodCategory').value;
      const price = parseFloat(document.getElementById('editFoodPrice').value);
      const image = document.getElementById('editFoodImage').value.trim();
      const ingredients = document.getElementById('editFoodIngredients').value;
      const description = document.getElementById('editFoodDescription').value.trim();
      const isVeg = document.getElementById('editFoodIsVeg').value === 'true';
      const spiceLevel = document.getElementById('editFoodSpiceLevel').value;
      const prepTime = document.getElementById('editFoodPrepTime').value.trim();
      const calories = parseInt(document.getElementById('editFoodCalories').value) || 350;
      const available = document.getElementById('editFoodAvailable').checked;

      try {
        const res = await fetch(`${API_BASE}/foods/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}`
          },
          body: JSON.stringify({ name, category, price, image, ingredients, description, isVeg, spiceLevel, prepTime, calories, available })
        });

        const data = await res.json();
        if (data.success) {
          showToast('Food item updated successfully!', 'success');
          bootstrap.Modal.getInstance(document.getElementById('editFoodModal')).hide();
          loadFoodsTable();
        } else {
          showToast(data.message || 'Error updating food', 'danger');
        }
      } catch (err) {
        showToast('Network error updating food', 'danger');
      }
    });
  }
}

async function loadCategoriesForDropdown() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    if (data.success) {
      cachedCategories = data.data;
      const optionsHtml = cachedCategories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
      const addSelect = document.getElementById('foodCategory');
      const editSelect = document.getElementById('editFoodCategory');
      if (addSelect) addSelect.innerHTML = optionsHtml;
      if (editSelect) editSelect.innerHTML = optionsHtml;
    }
  } catch (err) {
    console.error('Error loading category dropdowns:', err);
  }
}

async function loadFoodsTable() {
  const tableBody = document.getElementById('foodsTableBody');
  if (!tableBody) return;

  try {
    const res = await fetch(`${API_BASE}/foods?sortBy=name`);
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No food items added yet</td></tr>';
        return;
      }

      tableBody.innerHTML = data.data.map(food => {
        const dietIcon = food.isVeg
          ? '<span class="diet-icon-veg me-1"></span>'
          : '<span class="diet-icon-nonveg me-1"></span>';

        return `
          <tr>
            <td>
              <img src="${food.image}" alt="${food.name}" class="rounded-3" style="width: 50px; height: 50px; object-fit: cover;" onerror="this.onerror=null;this.src='/images/foods/default-food.jpg'">
            </td>
            <td>
              <div class="d-flex align-items-center">
                ${dietIcon}
                <h6 class="mb-0 fw-bold ms-1">${food.name}</h6>
              </div>
              <small class="text-muted text-truncate d-block" style="max-width: 250px;">${food.description}</small>
              <small class="text-muted">${food.prepTime || '20 mins'} &bull; ${food.calories ? food.calories + ' kcal' : ''} &bull; ${food.spiceLevel || 'Medium'}</small>
            </td>
            <td><span class="badge ${getCategoryBadgeClass(food.category?.name || 'General')} text-white rounded-pill px-3 py-1 shadow-sm">${food.category?.name || 'General'}</span></td>
            <td class="fw-bold text-primary">${formatPrice(food.price)}</td>
            <td><i class="bi bi-star-fill text-warning me-1"></i>${food.rating} <small class="text-muted">(${food.numReviews})</small></td>
            <td>
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" ${food.available ? 'checked' : ''} onchange="toggleFoodAvailability('${food._id}', this.checked)">
              </div>
            </td>
            <td>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary rounded-circle" title="Edit" onclick='openEditFoodModal(${JSON.stringify(food).replace(/'/g, "&apos;")})'>
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger rounded-circle" title="Delete" onclick="deleteFood('${food._id}', '${food.name.replace(/'/g, "\\'")}')">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading foods:', err);
  }
}

async function toggleFoodAvailability(foodId, isAvailable) {
  try {
    const res = await fetch(`${API_BASE}/foods/${foodId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.getToken()}`
      },
      body: JSON.stringify({ available: isAvailable })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Item set to ${isAvailable ? 'Available' : 'Unavailable'}`, 'success');
    }
  } catch (err) {
    showToast('Failed to toggle availability', 'danger');
  }
}

function openEditFoodModal(food) {
  document.getElementById('editFoodId').value = food._id;
  document.getElementById('editFoodName').value = food.name;
  document.getElementById('editFoodCategory').value = food.category?._id || food.category;
  document.getElementById('editFoodPrice').value = food.price;
  document.getElementById('editFoodImage').value = food.image;
  document.getElementById('editFoodIngredients').value = (food.ingredients || []).join(', ');
  document.getElementById('editFoodDescription').value = food.description;
  document.getElementById('editFoodIsVeg').value = food.isVeg ? 'true' : 'false';
  document.getElementById('editFoodSpiceLevel').value = food.spiceLevel || 'Medium';
  document.getElementById('editFoodPrepTime').value = food.prepTime || '20 mins';
  document.getElementById('editFoodCalories').value = food.calories || 350;
  document.getElementById('editFoodAvailable').checked = food.available;

  const modal = new bootstrap.Modal(document.getElementById('editFoodModal'));
  modal.show();
}

async function deleteFood(foodId, foodName) {
  if (!confirm(`Are you sure you want to delete "${foodName}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/foods/${foodId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast(`Deleted "${foodName}"`, 'info');
      loadFoodsTable();
    } else {
      showToast(data.message || 'Failed to delete food', 'danger');
    }
  } catch (err) {
    showToast('Network error deleting food', 'danger');
  }
}

// ================= CATEGORIES MANAGEMENT ================= //
async function initCategoriesManagement() {
  renderAdminLayout('categories');
  await loadCategoriesTable();

  const addCategoryForm = document.getElementById('addCategoryForm');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('categoryName').value.trim();
      const description = document.getElementById('categoryDescription').value.trim();
      const image = document.getElementById('categoryImage').value.trim();

      try {
        const res = await fetch(`${API_BASE}/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}`
          },
          body: JSON.stringify({ name, description, image })
        });
        const data = await res.json();

        if (data.success) {
          showToast('Category created successfully!', 'success');
          bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
          addCategoryForm.reset();
          loadCategoriesTable();
        } else {
          showToast(data.message || 'Failed to create category', 'danger');
        }
      } catch (err) {
        showToast('Network error creating category', 'danger');
      }
    });
  }

  const editCategoryForm = document.getElementById('editCategoryForm');
  if (editCategoryForm) {
    editCategoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editCategoryId').value;
      const name = document.getElementById('editCategoryName').value.trim();
      const description = document.getElementById('editCategoryDescription').value.trim();
      const image = document.getElementById('editCategoryImage').value.trim();

      try {
        const res = await fetch(`${API_BASE}/categories/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}`
          },
          body: JSON.stringify({ name, description, image })
        });
        const data = await res.json();

        if (data.success) {
          showToast('Category updated successfully!', 'success');
          bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
          loadCategoriesTable();
        } else {
          showToast(data.message || 'Failed to update category', 'danger');
        }
      } catch (err) {
        showToast('Network error updating category', 'danger');
      }
    });
  }
}

async function loadCategoriesTable() {
  const tableBody = document.getElementById('categoriesTableBody');
  if (!tableBody) return;

  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No categories created yet</td></tr>';
        return;
      }

      tableBody.innerHTML = data.data.map(cat => `
        <tr>
          <td>
            <img src="${cat.image || '/images/foods/default-food.jpg'}" alt="${cat.name}" class="rounded-circle" style="width: 45px; height: 45px; object-fit: cover;" onerror="this.onerror=null;this.src='/images/foods/default-food.jpg'">
          </td>
          <td><strong class="text-dark">${cat.name}</strong></td>
          <td class="small text-muted">${cat.description || 'No description'}</td>
          <td><span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1">${cat.foodCount || 0} items</span></td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary rounded-circle" title="Edit" onclick='openEditCategoryModal(${JSON.stringify(cat).replace(/'/g, "&apos;")})'>
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger rounded-circle" title="Delete" onclick="deleteCategory('${cat._id}', '${cat.name.replace(/'/g, "\\'")}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

function openEditCategoryModal(cat) {
  document.getElementById('editCategoryId').value = cat._id;
  document.getElementById('editCategoryName').value = cat.name;
  document.getElementById('editCategoryDescription').value = cat.description || '';
  document.getElementById('editCategoryImage').value = cat.image || '';

  const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
  modal.show();
}

async function deleteCategory(catId, catName) {
  if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;

  try {
    const res = await fetch(`${API_BASE}/categories/${catId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast(`Category "${catName}" deleted`, 'info');
      loadCategoriesTable();
    } else {
      showToast(data.message || 'Cannot delete category', 'danger');
    }
  } catch (err) {
    showToast('Network error deleting category', 'danger');
  }
}

// ================= ORDERS MANAGEMENT ================= //
async function initOrdersManagement() {
  renderAdminLayout('orders');
  await loadAdminOrders();

  const filterSelect = document.getElementById('orderStatusFilter');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      loadAdminOrders(filterSelect.value);
    });
  }
}

async function loadAdminOrders(statusFilter = 'all') {
  const tableBody = document.getElementById('adminOrdersTableBody');
  if (!tableBody) return;

  try {
    let url = `${API_BASE}/orders`;
    if (statusFilter && statusFilter !== 'all') {
      url += `?status=${encodeURIComponent(statusFilter)}`;
    }

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No orders found matching this filter</td></tr>';
        return;
      }

      tableBody.innerHTML = data.data.map(order => `
        <tr>
          <td><span class="font-monospace small fw-bold">#${order._id.substring(order._id.length - 8).toUpperCase()}</span></td>
          <td>
            <strong>${order.deliveryAddress?.name || order.user?.name || 'Customer'}</strong>
            <small class="text-muted d-block">${order.deliveryAddress?.phone || order.phone}</small>
          </td>
          <td>${formatDate(order.createdAt)}</td>
          <td><span class="badge bg-light text-dark border">${order.items.length} item(s)</span></td>
          <td class="fw-bold text-primary">${formatPrice(order.totalAmount)}</td>
          <td>${renderStatusSelect(order._id, order.status)}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary btn-pill px-3" onclick='showAdminOrderModal(${JSON.stringify(order).replace(/'/g, "&apos;")})'>
              <i class="bi bi-eye me-1"></i> Details
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading admin orders:', err);
  }
}

function renderStatusSelect(orderId, currentStatus) {
  const statuses = ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
  return `
    <select class="form-select form-select-sm rounded-pill" style="min-width: 155px;" onchange="updateOrderStatus('${orderId}', this.value)">
      ${statuses.map(s => `
        <option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>
      `).join('')}
    </select>
  `;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.getToken()}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`Order status updated to "${newStatus}"`, 'success');
    } else {
      showToast(data.message || 'Failed to update order status', 'danger');
    }
  } catch (err) {
    showToast('Network error updating status', 'danger');
  }
}

function showAdminOrderModal(order) {
  let modalEl = document.getElementById('adminOrderModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'adminOrderModal';
    modalEl.className = 'modal fade';
    modalEl.setAttribute('tabindex', '-1');
    document.body.appendChild(modalEl);
  }

  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold">Order #${order._id}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <h6 class="fw-bold small text-muted text-uppercase mb-2">Customer & Delivery Details</h6>
              <p class="small mb-1"><strong>Name:</strong> ${order.deliveryAddress?.name || order.user?.name || 'Customer'}</p>
              <p class="small mb-1"><strong>Phone:</strong> ${order.deliveryAddress?.phone || order.phone}</p>
              <p class="small mb-1"><strong>Email:</strong> ${order.user?.email || 'N/A'}</p>
              <p class="small mb-0"><strong>Address:</strong> ${order.deliveryAddress?.address || ''}, ${order.deliveryAddress?.city || ''} - ${order.deliveryAddress?.pincode || ''}</p>
            </div>
            <div class="col-md-6">
              <h6 class="fw-bold small text-muted text-uppercase mb-2">Order Information</h6>
              <p class="small mb-1"><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
              <p class="small mb-1"><strong>Payment Mode:</strong> ${order.paymentMethod} (${order.paymentStatus || 'Pending'})</p>
              <p class="small mb-1"><strong>Current Status:</strong> ${getStatusBadge(order.status)}</p>
              ${order.cancelledAt ? `<p class="small text-danger mb-0"><strong>Cancelled At:</strong> ${formatDate(order.cancelledAt)}</p>` : ''}
            </div>
          </div>

          <h6 class="fw-bold small text-muted text-uppercase mb-2">Items Breakdown</h6>
          <div class="table-responsive mb-3">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <img src="${item.image || '/images/foods/default-food.jpg'}" class="rounded-2" style="width: 35px; height: 35px; object-fit: cover;" onerror="this.onerror=null;this.src='/images/foods/default-food.jpg'">
                        <span class="small fw-semibold">${item.name}</span>
                        ${item.isVeg !== undefined ? (item.isVeg ? '<span class="badge-dietary badge-dietary-veg" style="position:static; padding: 2px 6px; font-size: 0.68rem;"><span class="diet-icon-veg"></span> VEG</span>' : '<span class="badge-dietary badge-dietary-nonveg" style="position:static; padding: 2px 6px; font-size: 0.68rem;"><span class="diet-icon-nonveg"></span> NON-VEG</span>') : ''}
                      </div>
                    </td>
                    <td>${item.quantity}</td>
                    <td>${formatPrice(item.price)}</td>
                    <td class="text-end fw-bold">${formatPrice(item.price * item.quantity)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="border-top pt-2">
            <div class="d-flex justify-content-between small text-muted"><span>Subtotal:</span><span>${formatPrice(order.subtotal)}</span></div>
            <div class="d-flex justify-content-between small text-muted"><span>Delivery Fee:</span><span>${order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}</span></div>
            <div class="d-flex justify-content-between small text-muted"><span>Taxes (5% GST):</span><span>${formatPrice(order.tax)}</span></div>
            <div class="d-flex justify-content-between fw-bold fs-5 mt-2 pt-2 border-top"><span>Grand Total:</span><span class="text-primary">${formatPrice(order.totalAmount)}</span></div>
          </div>
        </div>
        <div class="modal-footer border-0 pt-0 d-flex justify-content-between">
          <button type="button" class="btn btn-outline-dark btn-pill btn-sm" onclick='printOfficialInvoice(${JSON.stringify(order).replace(/'/g, "&apos;")})'>
            <i class="bi bi-printer me-1"></i> Print Tax Invoice
          </button>
          <button type="button" class="btn btn-secondary btn-pill btn-sm" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  `;

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}

// ================= USERS MANAGEMENT ================= //
async function initUsersManagement() {
  renderAdminLayout('users');
  await loadUsersTable();
}

async function loadUsersTable() {
  const tableBody = document.getElementById('usersTableBody');
  if (!tableBody) return;

  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const data = await res.json();

    if (data.success) {
      const currentUser = Auth.getUser();

      tableBody.innerHTML = data.data.map(user => {
        const isSelf = currentUser && currentUser._id === user._id;
        const roleBadge = user.role === 'admin' 
          ? '<span class="badge bg-danger rounded-pill px-3 py-1">Admin</span>'
          : '<span class="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-1">Customer</span>';

        return `
          <tr>
            <td>
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-light text-primary d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                  <i class="bi bi-person"></i>
                </div>
                <div>
                  <strong class="text-dark">${user.name}</strong> ${isSelf ? '<span class="badge bg-info text-dark ms-1 small">You</span>' : ''}
                  <small class="text-muted d-block">${user.email}</small>
                </div>
              </div>
            </td>
            <td>${user.phone || 'N/A'}</td>
            <td>${roleBadge}</td>
            <td><span class="badge bg-light text-dark border">${user.orderCount || 0} order(s)</span></td>
            <td class="small text-muted">${formatDate(user.createdAt)}</td>
            <td>
              ${!isSelf && user.role !== 'admin' ? `
                <button class="btn btn-sm btn-outline-danger rounded-circle" title="Delete User" onclick="deleteUserAccount('${user._id}', '${user.name.replace(/'/g, "\\'")}')">
                  <i class="bi bi-trash"></i>
                </button>
              ` : '<span class="text-muted small">Protected</span>'}
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

async function deleteUserAccount(userId, userName) {
  if (!confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast(`User "${userName}" deleted successfully`, 'info');
      loadUsersTable();
    } else {
      showToast(data.message || 'Failed to delete user', 'danger');
    }
  } catch (err) {
    showToast('Network error deleting user', 'danger');
  }
}
