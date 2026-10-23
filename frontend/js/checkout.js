/**
 * ONLINE FOOD ORDERING SYSTEM - CHECKOUT JS
 */

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('cart');
  renderFooter();

  // Authentication gate
  if (!Auth.requireAuth()) return;

  const cart = Cart.getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty. Add items first!', 'warning');
    setTimeout(() => { window.location.href = 'menu.html'; }, 1000);
    return;
  }

  // Pre-fill user data
  prefillUserData();

  // Render items list and calculations in summary
  renderCheckoutSummary();

  // Payment method toggler
  setupPaymentToggle();

  // Handle Order submission
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handlePlaceOrder);
  }
});

function prefillUserData() {
  const user = Auth.getUser();
  if (!user) return;

  document.getElementById('customerName').value = user.name || '';
  document.getElementById('customerPhone').value = user.phone || '';

  if (user.address) {
    document.getElementById('deliveryAddress').value = user.address.street || '';
    document.getElementById('deliveryCity').value = user.address.city || '';
    document.getElementById('deliveryPincode').value = user.address.pincode || '';
  }
}

function renderCheckoutSummary() {
  const cart = Cart.getCart();
  const summaryContainer = document.getElementById('checkoutItemsContainer');
  if (!summaryContainer) return;

  summaryContainer.innerHTML = cart.map(item => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-light text-dark border">${item.quantity}x</span>
        <span class="small fw-semibold text-truncate" style="max-width: 180px;">${item.name}</span>
      </div>
      <span class="small fw-bold">${formatPrice(item.price * item.quantity)}</span>
    </div>
  `).join('');

  const subtotal = Cart.getSubtotal();
  const deliveryFee = subtotal >= 500 ? 0 : 40;
  const tax = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + deliveryFee + tax;

  document.getElementById('checkoutSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('checkoutDeliveryFee').innerHTML = deliveryFee === 0
    ? '<span class="text-success fw-bold">FREE</span>'
    : formatPrice(deliveryFee);
  document.getElementById('checkoutTax').textContent = formatPrice(tax);
  document.getElementById('checkoutTotal').textContent = formatPrice(totalAmount);
}

function setupPaymentToggle() {
  const onlineRadio = document.getElementById('payOnline');
  const codRadio = document.getElementById('payCOD');
  const onlineDetails = document.getElementById('onlinePaymentDetails');

  function update() {
    if (onlineRadio.checked) {
      onlineDetails.classList.remove('d-none');
    } else {
      onlineDetails.classList.add('d-none');
    }
  }

  if (onlineRadio && codRadio && onlineDetails) {
    onlineRadio.addEventListener('change', update);
    codRadio.addEventListener('change', update);
  }
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const address = document.getElementById('deliveryAddress').value.trim();
  const city = document.getElementById('deliveryCity').value.trim();
  const pincode = document.getElementById('deliveryPincode').value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Cash on Delivery';

  const submitBtn = document.getElementById('placeOrderBtn');

  if (!name || !phone || !address || !city || !pincode) {
    showToast('Please fill all delivery address fields', 'warning');
    return;
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    showToast('Please enter a valid 10-digit phone number', 'warning');
    return;
  }

  const cart = Cart.getCart();
  const orderItems = cart.map(item => ({
    food: item.food || item._id,
    quantity: item.quantity
  }));

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing Order...';

    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.getToken()}`
      },
      body: JSON.stringify({
        items: orderItems,
        deliveryAddress: { name, phone, address, city, pincode },
        phone,
        paymentMethod
      })
    });

    const data = await response.json();

    if (data.success && data.order) {
      // Clear cart
      Cart.clearCart();
      showToast('Order placed successfully!', 'success');

      // Redirect to Order Tracking page
      setTimeout(() => {
        window.location.href = `tracking.html?id=${data.order._id}&new=true`;
      }, 1000);
    } else {
      showToast(data.message || 'Failed to place order', 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Place Order Now';
    }
  } catch (err) {
    console.error('Order error:', err);
    showToast('Network error while placing order', 'danger');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-shield-check me-2"></i>Place Order Now';
  }
}
