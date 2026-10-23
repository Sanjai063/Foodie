/**
 * ONLINE FOOD ORDERING SYSTEM - SHOPPING CART JS
 */

let appliedDiscount = 0;
let appliedCouponCode = '';

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('cart');
  renderFooter();
  renderCart();

  // Handle promo code apply
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', applyPromoCode);
  }
});

function renderCart() {
  const cart = Cart.getCart();
  const cartTableBody = document.getElementById('cartTableBody');
  const emptyCartState = document.getElementById('emptyCartState');
  const cartContentWrapper = document.getElementById('cartContentWrapper');

  if (cart.length === 0) {
    if (emptyCartState) emptyCartState.classList.remove('d-none');
    if (cartContentWrapper) cartContentWrapper.classList.add('d-none');
    return;
  }

  if (emptyCartState) emptyCartState.classList.add('d-none');
  if (cartContentWrapper) cartContentWrapper.classList.remove('d-none');

  if (cartTableBody) {
    cartTableBody.innerHTML = cart.map(item => {
      const itemTotal = item.price * (item.quantity || 1);
      const foodId = item.food || item._id;

      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              <img src="${item.image || '/images/foods/default-food.jpg'}" alt="${item.name}" class="rounded-3" style="width: 65px; height: 65px; object-fit: cover;" onerror="this.onerror=null;this.src='/images/foods/default-food.jpg'">
              <div>
                <h6 class="mb-1 fw-bold">${item.name}</h6>
                <span class="text-muted small">${formatPrice(item.price)} each</span>
              </div>
            </div>
          </td>
          <td class="text-center">
            <div class="quantity-control">
              <button type="button" class="quantity-btn" onclick="modifyQty('${foodId}', ${(item.quantity || 1) - 1})">
                <i class="bi bi-dash"></i>
              </button>
              <span class="quantity-val">${item.quantity || 1}</span>
              <button type="button" class="quantity-btn" onclick="modifyQty('${foodId}', ${(item.quantity || 1) + 1})">
                <i class="bi bi-plus"></i>
              </button>
            </div>
          </td>
          <td class="text-end fw-bold text-dark">
            ${formatPrice(itemTotal)}
          </td>
          <td class="text-center">
            <button class="btn btn-light text-danger btn-sm rounded-circle p-2" title="Remove" onclick="Cart.removeFromCart('${foodId}'); renderCart();">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  updateOrderCalculations();
}

function modifyQty(foodId, newQty) {
  Cart.updateQuantity(foodId, newQty);
  renderCart();
}

function updateOrderCalculations() {
  const subtotal = Cart.getSubtotal();
  // Free delivery if subtotal >= 500, else 40
  const freeDeliveryThreshold = 500;
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : 40;
  const tax = Math.round(subtotal * 0.05); // 5% GST

  // Discount calculation
  let discountAmount = 0;
  if (appliedCouponCode === 'WELCOME50') {
    discountAmount = Math.min(50, subtotal);
  } else if (appliedCouponCode === 'TASTY20') {
    discountAmount = Math.round(subtotal * 0.20);
  }
  appliedDiscount = discountAmount;

  const grandTotal = Math.max(0, subtotal + deliveryFee + tax - discountAmount);

  document.getElementById('subtotalDisplay').textContent = formatPrice(subtotal);
  document.getElementById('deliveryFeeDisplay').innerHTML = deliveryFee === 0
    ? '<span class="text-success fw-bold">FREE</span>'
    : formatPrice(deliveryFee);
  document.getElementById('taxDisplay').textContent = formatPrice(tax);
  document.getElementById('grandTotalDisplay').textContent = formatPrice(grandTotal);

  // Discount display
  const discountRow = document.getElementById('discountRow');
  const discountDisplay = document.getElementById('discountDisplay');
  if (discountAmount > 0) {
    discountRow.classList.remove('d-none');
    discountDisplay.textContent = `-${formatPrice(discountAmount)}`;
  } else {
    discountRow.classList.add('d-none');
  }

  // Free delivery progress hint
  const deliveryHint = document.getElementById('freeDeliveryHint');
  if (deliveryHint) {
    if (subtotal >= freeDeliveryThreshold) {
      deliveryHint.innerHTML = `
        <div class="alert alert-success py-2 px-3 small rounded-3 mb-3">
          <i class="bi bi-check-circle-fill me-1"></i> You have unlocked <strong>FREE Delivery</strong>!
        </div>
      `;
    } else {
      const remaining = freeDeliveryThreshold - subtotal;
      deliveryHint.innerHTML = `
        <div class="alert alert-warning py-2 px-3 small rounded-3 mb-3">
          <i class="bi bi-truck me-1"></i> Add <strong>${formatPrice(remaining)}</strong> more to get <strong>FREE Delivery</strong>!
        </div>
      `;
    }
  }
}

function applyPromoCode() {
  const codeInput = document.getElementById('promoCodeInput');
  const code = codeInput.value.trim().toUpperCase();
  const alertEl = document.getElementById('promoAlert');

  if (code === 'WELCOME50' || code === 'TASTY20') {
    appliedCouponCode = code;
    showToast(`Promo coupon "${code}" applied successfully!`, 'success');
    if (alertEl) {
      alertEl.className = 'alert alert-success py-2 px-3 small rounded-3 mt-2';
      alertEl.textContent = `Coupon ${code} applied!`;
      alertEl.classList.remove('d-none');
    }
    updateOrderCalculations();
  } else {
    showToast('Invalid promo code. Try WELCOME50 or TASTY20', 'warning');
    if (alertEl) {
      alertEl.className = 'alert alert-danger py-2 px-3 small rounded-3 mt-2';
      alertEl.textContent = 'Invalid promo code. Available demo codes: WELCOME50, TASTY20';
      alertEl.classList.remove('d-none');
    }
  }
}

function proceedToCheckout() {
  const cart = Cart.getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty', 'warning');
    return;
  }

  if (!Auth.isAuthenticated()) {
    showToast('Please log in to proceed to checkout', 'info');
    setTimeout(() => {
      window.location.href = 'login.html?redirect=checkout.html';
    }, 800);
    return;
  }

  window.location.href = 'checkout.html';
}
