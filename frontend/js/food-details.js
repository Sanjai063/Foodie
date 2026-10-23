/**
 * ONLINE FOOD ORDERING SYSTEM - FOOD DETAILS JS
 * Single food item view, dietary tags, favorites toggle, quantity selector, reviews list & submission
 */

let currentFood = null;
let currentQuantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('menu');
  renderFooter();

  const urlParams = new URLSearchParams(window.location.search);
  const foodId = urlParams.get('id');

  if (!foodId) {
    showToast('No food item selected', 'danger');
    setTimeout(() => { window.location.href = 'menu.html'; }, 1000);
    return;
  }

  await loadFoodDetails(foodId);
  await loadReviews(foodId);
  setupReviewForm(foodId);
});

async function loadFoodDetails(foodId) {
  try {
    const res = await fetch(`${API_BASE}/foods/${foodId}`);
    const data = await res.json();

    if (!data.success || !data.data) {
      document.getElementById('foodDetailContainer').innerHTML = `
        <div class="col-12 text-center py-5">
          <h4 class="text-danger">Food item not found</h4>
          <a href="menu.html" class="btn btn-primary btn-pill mt-3">Back to Menu</a>
        </div>
      `;
      return;
    }

    currentFood = data.data;
    renderFoodDetails(currentFood);
  } catch (err) {
    console.error('Error loading food details:', err);
  }
}

function renderFoodDetails(food) {
  document.title = `${food.name} | FoodieBites`;

  document.getElementById('foodImage').src = food.image;
  document.getElementById('foodImage').alt = food.name;
  document.getElementById('foodName').textContent = food.name;
  const catBadge = document.getElementById('foodCategory');
  if (catBadge) {
    catBadge.textContent = food.category ? food.category.name : 'Delicacy';
    const catClass = typeof getCategoryBadgeClass === 'function' ? getCategoryBadgeClass(food.category?.name || food.category) : 'badge-cat-pizza';
    catBadge.className = `badge ${catClass} rounded-pill px-3 py-1 fw-semibold text-white shadow-sm`;
  }

  document.getElementById('foodRating').textContent = food.rating;
  document.getElementById('foodReviewCount').textContent = `(${food.numReviews || 0} reviews)`;
  document.getElementById('foodPrice').textContent = formatPrice(food.price);
  document.getElementById('foodDescription').textContent = food.description;

  // Dietary indicators with semantic glow & color
  const dietaryBadge = document.getElementById('foodDietaryBadge');
  if (dietaryBadge) {
    dietaryBadge.style.position = 'static';
    dietaryBadge.style.display = 'inline-flex';
    if (food.isVeg) {
      dietaryBadge.className = 'badge-dietary badge-dietary-veg';
      dietaryBadge.innerHTML = '<span class="diet-icon-veg"></span> PURE VEG';
    } else {
      dietaryBadge.className = 'badge-dietary badge-dietary-nonveg';
      dietaryBadge.innerHTML = '<span class="diet-icon-nonveg"></span> NON-VEGETARIAN';
    }
  }

  // Meta stats & Spice Heat Scale Badge
  document.getElementById('foodPrepTime').textContent = food.prepTime || '20 mins';
  document.getElementById('foodCalories').textContent = food.calories ? `${food.calories} kcal` : '350 kcal';
  const spiceEl = document.getElementById('foodSpiceLevel');
  if (spiceEl) {
    const level = food.spiceLevel || 'Medium';
    const spiceClass = level === 'Spicy' ? 'badge-spice-spicy' : level === 'Mild' ? 'badge-spice-mild' : 'badge-spice-medium';
    const spiceIcon = level === 'Spicy' ? '🔥' : level === 'Mild' ? '🍃' : '🌶️';
    spiceEl.className = spiceClass;
    spiceEl.innerHTML = `${spiceIcon} ${level}`;
  }

  // Ingredients
  const ingredientsContainer = document.getElementById('ingredientsContainer');
  if (food.ingredients && food.ingredients.length > 0) {
    ingredientsContainer.innerHTML = food.ingredients.map(ing => `
      <span class="ingredient-chip"><i class="bi bi-check2 me-1 text-success"></i>${ing}</span>
    `).join('');
  } else {
    ingredientsContainer.innerHTML = '<span class="text-muted small">Chef\'s secret recipe ingredients</span>';
  }

  // Stock status
  const stockBadge = document.getElementById('foodStockBadge');
  if (food.available) {
    stockBadge.className = 'badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1';
    stockBadge.textContent = 'In Stock & Fresh';
    document.getElementById('addToCartBtn').disabled = false;
  } else {
    stockBadge.className = 'badge bg-danger bg-opacity-10 text-danger rounded-pill px-3 py-1';
    stockBadge.textContent = 'Currently Unavailable';
    document.getElementById('addToCartBtn').disabled = true;
  }

  // Favorite Heart
  const favBtn = document.getElementById('detailFavBtn');
  if (favBtn) {
    favBtn.setAttribute('data-food-id', food._id);
    const isFav = Favorites.isFav(food._id);
    favBtn.innerHTML = `<i class="bi ${isFav ? 'bi-heart-fill text-danger' : 'bi-heart'} fs-5"></i>`;
    favBtn.onclick = () => {
      const nowFav = Favorites.toggle(food._id);
      favBtn.innerHTML = `<i class="bi ${nowFav ? 'bi-heart-fill text-danger' : 'bi-heart'} fs-5"></i>`;
    };
  }

  // Setup quantity controls
  currentQuantity = 1;
  updateQuantityDisplay();

  document.getElementById('qtyMinusBtn').onclick = () => {
    if (currentQuantity > 1) {
      currentQuantity--;
      updateQuantityDisplay();
    }
  };

  document.getElementById('qtyPlusBtn').onclick = () => {
    currentQuantity++;
    updateQuantityDisplay();
  };

  document.getElementById('addToCartBtn').onclick = () => {
    Cart.addToCart(food, currentQuantity);
  };
}

function updateQuantityDisplay() {
  document.getElementById('quantityVal').textContent = currentQuantity;
}

async function loadReviews(foodId) {
  const container = document.getElementById('reviewsListContainer');
  const emptyState = document.getElementById('noReviewsState');

  try {
    const res = await fetch(`${API_BASE}/reviews/${foodId}`);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      if (emptyState) emptyState.classList.add('d-none');
      container.innerHTML = data.data.map(rev => {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
          stars += `<i class="bi bi-star${i <= rev.rating ? '-fill text-warning' : ' text-muted'}"></i>`;
        }

        return `
          <div class="border-bottom py-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <h6 class="fw-bold mb-0">${rev.user ? rev.user.name : 'Verified Customer'} <span class="badge bg-success bg-opacity-10 text-success ms-2 small"><i class="bi bi-patch-check-fill me-1"></i>Verified Buyer</span></h6>
              <small class="text-muted">${formatDate(rev.createdAt)}</small>
            </div>
            <div class="mb-2 fs-6">
              ${stars}
            </div>
            <p class="text-muted mb-0 small">${rev.comment}</p>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('d-none');
    }
  } catch (err) {
    console.error('Error fetching reviews:', err);
  }
}

async function setupReviewForm(foodId) {
  const reviewFormBox = document.getElementById('reviewFormContainer');
  const reviewLoginNotice = document.getElementById('reviewLoginNotice');
  const reviewEligibilityNotice = document.getElementById('reviewEligibilityNotice');
  const reviewForm = document.getElementById('addReviewForm');

  if (!Auth.isAuthenticated()) {
    if (reviewFormBox) reviewFormBox.classList.add('d-none');
    if (reviewLoginNotice) reviewLoginNotice.classList.remove('d-none');
    return;
  }

  try {
    const checkRes = await fetch(`${API_BASE}/reviews/${foodId}/can-review`, {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const checkData = await checkRes.json();

    if (checkData.success) {
      if (checkData.alreadyReviewed) {
        if (reviewFormBox) reviewFormBox.classList.add('d-none');
        if (reviewEligibilityNotice) {
          reviewEligibilityNotice.innerHTML = `
            <div class="alert alert-info py-2 px-3 small rounded-3 mb-0">
              <i class="bi bi-check-circle-fill me-1"></i> You have already reviewed this dish. Thank you for your feedback!
            </div>
          `;
          reviewEligibilityNotice.classList.remove('d-none');
        }
      } else if (!checkData.hasDeliveredOrder) {
        if (reviewFormBox) reviewFormBox.classList.add('d-none');
        if (reviewEligibilityNotice) {
          reviewEligibilityNotice.innerHTML = `
            <div class="alert alert-secondary py-2 px-3 small rounded-3 mb-0">
              <i class="bi bi-info-circle-fill me-1"></i> Reviews are exclusively allowed for verified buyers who have completed and received an order for this food item.
            </div>
          `;
          reviewEligibilityNotice.classList.remove('d-none');
        }
      } else {
        if (reviewFormBox) reviewFormBox.classList.remove('d-none');
        if (reviewEligibilityNotice) reviewEligibilityNotice.classList.add('d-none');
      }
    }
  } catch (err) {
    console.error('Error checking review eligibility:', err);
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rating = reviewForm.querySelector('input[name="rating"]:checked')?.value;
      const comment = document.getElementById('reviewComment').value.trim();
      const submitBtn = reviewForm.querySelector('button[type="submit"]');

      if (!rating) {
        showToast('Please select a star rating (1-5)', 'warning');
        return;
      }

      if (!comment) {
        showToast('Please write a brief comment', 'warning');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Posting...';

        const res = await fetch(`${API_BASE}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}`
          },
          body: JSON.stringify({ foodId, rating, comment })
        });

        const data = await res.json();

        if (data.success) {
          showToast('Thank you! Review posted successfully.', 'success');
          reviewForm.reset();
          if (reviewFormBox) reviewFormBox.classList.add('d-none');
          if (reviewEligibilityNotice) {
            reviewEligibilityNotice.innerHTML = `
              <div class="alert alert-success py-2 px-3 small rounded-3 mb-0">
                <i class="bi bi-check-circle-fill me-1"></i> Review submitted! Thank you.
              </div>
            `;
            reviewEligibilityNotice.classList.remove('d-none');
          }
          await loadFoodDetails(foodId);
          await loadReviews(foodId);
        } else {
          showToast(data.message || 'Failed to submit review', 'danger');
        }
      } catch (err) {
        showToast('Error submitting review', 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Review';
      }
    });
  }
}
