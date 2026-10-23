/**
 * ONLINE FOOD ORDERING SYSTEM - MENU JS
 * Live search, category filtering, price filtering, pure veg toggle, favorites filter, and sorting
 */

let allCategories = [];
let activeCategory = 'all';
let isPureVegActive = false;
let isFavoritesOnlyActive = false;

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('menu');
  renderFooter();

  // Read query params
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search') || '';
  const catParam = urlParams.get('cat') || 'all';
  const filterParam = urlParams.get('filter') || '';

  if (searchParam) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = searchParam;
  }

  if (filterParam === 'favs') {
    isFavoritesOnlyActive = true;
  }

  activeCategory = catParam;

  await loadCategoryPills();
  setupFilterListeners();
  fetchAndRenderFoods();
});

async function loadCategoryPills() {
  const container = document.getElementById('categoryPillsContainer');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    if (data.success) {
      allCategories = data.data;

      let html = `
        <button class="category-filter-pill ${activeCategory === 'all' && !isFavoritesOnlyActive ? 'active' : ''}" data-cat="all">
          <i class="bi bi-grid-fill me-1"></i> All Items
        </button>
      `;

      data.data.forEach(cat => {
        const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase() && !isFavoritesOnlyActive;
        html += `
          <button class="category-filter-pill ${isActive ? 'active' : ''}" data-cat="${cat.name}">
            ${cat.name}
          </button>
        `;
      });

      container.innerHTML = html;

      container.querySelectorAll('.category-filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.category-filter-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeCategory = btn.getAttribute('data-cat');
          isFavoritesOnlyActive = false;
          updateFavsFilterBtn();
          fetchAndRenderFoods();
        });
      });
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

function setupFilterListeners() {
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const priceRange = document.getElementById('priceRange');
  const priceDisplay = document.getElementById('priceDisplay');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const vegToggleBtn = document.getElementById('vegToggleBtn');
  const favsFilterBtn = document.getElementById('favsFilterBtn');

  // Debounced search
  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchAndRenderFoods();
      }, 350);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', fetchAndRenderFoods);
  }

  if (priceRange && priceDisplay) {
    priceRange.addEventListener('input', () => {
      priceDisplay.textContent = formatPrice(priceRange.value);
    });
    priceRange.addEventListener('change', fetchAndRenderFoods);
  }

  // Pure Veg Toggle
  if (vegToggleBtn) {
    vegToggleBtn.addEventListener('click', () => {
      isPureVegActive = !isPureVegActive;
      vegToggleBtn.classList.toggle('active', isPureVegActive);
      fetchAndRenderFoods();
    });
  }

  // Favorites Filter Tab
  if (favsFilterBtn) {
    favsFilterBtn.addEventListener('click', () => {
      isFavoritesOnlyActive = !isFavoritesOnlyActive;
      updateFavsFilterBtn();
      fetchAndRenderFoods();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'rating';
      if (priceRange) {
        priceRange.value = 600;
        if (priceDisplay) priceDisplay.textContent = formatPrice(600);
      }
      activeCategory = 'all';
      isPureVegActive = false;
      isFavoritesOnlyActive = false;

      if (vegToggleBtn) vegToggleBtn.classList.remove('active');
      updateFavsFilterBtn();

      const container = document.getElementById('categoryPillsContainer');
      if (container) {
        container.querySelectorAll('.category-filter-pill').forEach(b => b.classList.remove('active'));
        const allBtn = container.querySelector('[data-cat="all"]');
        if (allBtn) allBtn.classList.add('active');
      }

      fetchAndRenderFoods();
    });
  }
}

function updateFavsFilterBtn() {
  const btn = document.getElementById('favsFilterBtn');
  if (btn) {
    if (isFavoritesOnlyActive) {
      btn.className = 'btn btn-danger btn-sm btn-pill';
      btn.innerHTML = '<i class="bi bi-heart-fill me-1"></i> Favorites Active';
    } else {
      btn.className = 'btn btn-outline-danger btn-sm btn-pill';
      btn.innerHTML = '<i class="bi bi-heart me-1"></i> My Favorites';
    }
  }
}

async function fetchAndRenderFoods() {
  const container = document.getElementById('foodGridContainer');
  const countBadge = document.getElementById('itemCountBadge');
  if (!container) return;

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading delicious items...</span>
      </div>
    </div>
  `;

  const search = document.getElementById('searchInput')?.value.trim() || '';
  const sortBy = document.getElementById('sortSelect')?.value || 'rating';
  const maxPrice = document.getElementById('priceRange')?.value || '600';

  let url = `${API_BASE}/foods?sortBy=${encodeURIComponent(sortBy)}&maxPrice=${maxPrice}`;
  if (activeCategory && activeCategory !== 'all' && !isFavoritesOnlyActive) {
    url += `&category=${encodeURIComponent(activeCategory)}`;
  }
  if (isPureVegActive) {
    url += `&isVeg=true`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      let items = data.data;

      // Filter by favorites if active
      if (isFavoritesOnlyActive) {
        const favIds = Favorites.get();
        items = items.filter(food => favIds.includes(food._id));
      }

      if (countBadge) countBadge.textContent = `${items.length} dishes available`;

      if (items.length === 0) {
        container.innerHTML = `
          <div class="col-12 text-center py-5">
            <div class="py-4">
              <i class="bi bi-search display-1 text-muted opacity-50"></i>
              <h4 class="mt-3 fw-bold">No dishes found</h4>
              <p class="text-muted">Try resetting your filters, pure veg toggle, or search query.</p>
              <button class="btn btn-outline-primary btn-pill mt-2" onclick="document.getElementById('clearFiltersBtn').click()">Reset All Filters</button>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = items.map(food => {
        const isFav = Favorites.isFav(food._id);
        const dietIcon = food.isVeg
          ? '<span class="badge-dietary badge-dietary-veg"><span class="diet-icon-veg"></span> VEG</span>'
          : '<span class="badge-dietary badge-dietary-nonveg"><span class="diet-icon-nonveg"></span> NON-VEG</span>';

        const spiceBadge = food.spiceLevel === 'Spicy'
          ? '<span class="badge-spice-spicy">🔥 Spicy</span>'
          : food.spiceLevel === 'Mild'
          ? '<span class="badge-spice-mild">🍃 Mild</span>'
          : '<span class="badge-spice-medium">🌶️ Medium</span>';

        const catBadgeClass = getCategoryBadgeClass(food.category?.name || food.category);

        return `
          <div class="col">
            <div class="card-custom">
              <div class="food-card-img-wrap">
                <img src="${food.image}" alt="${food.name}" class="food-card-img" onerror="this.onerror=null;this.src='/images/foods/default-food.jpg'">
                <span class="badge-category ${catBadgeClass}">${food.category ? food.category.name : 'Food'}</span>
                ${dietIcon}
                <button type="button" class="btn-favorite ${isFav ? 'active' : ''}" data-food-id="${food._id}" onclick="Favorites.toggle('${food._id}', event)" title="Save to Favorites">
                  <i class="bi ${isFav ? 'bi-heart-fill text-danger' : 'bi-heart text-muted'}"></i>
                </button>
                <span class="badge-rating"><i class="bi bi-star-fill text-warning"></i> ${food.rating}</span>
              </div>
              <div class="food-card-body">
                <h5 class="food-title">${food.name}</h5>
                <p class="food-desc">${food.description}</p>
                <div class="food-meta-info">
                  ${spiceBadge}
                  <span><i class="bi bi-clock me-1"></i>${food.prepTime || '20 mins'}</span>
                  <span>&bull;</span>
                  <span>${food.calories ? food.calories + ' kcal' : '350 kcal'}</span>
                </div>
                <div class="food-card-footer">
                  <span class="food-price">${formatPrice(food.price)}</span>
                  <div class="d-flex gap-1">
                    <a href="food-details.html?id=${food._id}" class="btn btn-outline-primary btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;" title="View Details">
                      <i class="bi bi-eye"></i>
                    </a>
                    <button class="btn btn-primary btn-sm btn-pill px-3" onclick='Cart.addToCart(${JSON.stringify({ _id: food._id, name: food.name, price: food.price, image: food.image, isVeg: food.isVeg })})'>
                      <i class="bi bi-cart-plus me-1"></i> Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Activate 3D tilt engine & specular glare on new cards
      if (typeof Tilt3D !== 'undefined') {
        Tilt3D.init();
      }
    } else {
      container.innerHTML = `<div class="col-12 alert alert-danger">${data.message || 'Error loading foods'}</div>`;
    }
  } catch (err) {
    console.error('Error fetching foods:', err);
    container.innerHTML = `<div class="col-12 alert alert-danger">Network error connecting to API</div>`;
  }
}
