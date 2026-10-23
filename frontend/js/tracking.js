/**
 * ONLINE FOOD ORDERING SYSTEM - ORDER TRACKING JS
 * 5-stage timeline, dynamic ETA calculation, cancellation trigger, and printable tax invoice
 */

const ORDER_STEPS = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered'
];

let pollingInterval = null;
let currentOrderId = null;
let currentOrderData = null;

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('orders');
  renderFooter();

  if (!Auth.requireAuth()) return;

  const urlParams = new URLSearchParams(window.location.search);
  currentOrderId = urlParams.get('id');

  if (!currentOrderId) {
    showToast('No order ID specified', 'danger');
    setTimeout(() => { window.location.href = 'orders.html'; }, 1000);
    return;
  }

  if (urlParams.get('new') === 'true') {
    showToast('🎉 Order placed successfully! Tracking your delivery...', 'success');
  }

  await loadOrderTracking(currentOrderId);

  // Auto-poll every 8 seconds so status changes from admin reflect live
  pollingInterval = setInterval(() => {
    loadOrderTracking(currentOrderId, true);
  }, 8000);
});

async function loadOrderTracking(orderId, isSilent = false) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`
      }
    });

    const data = await res.json();

    if (!data.success || !data.data) {
      if (!isSilent) {
        document.getElementById('trackingMainContainer').innerHTML = `
          <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
            <h4 class="text-danger">Order Not Found</h4>
            <p class="text-muted">Could not find order details for #${orderId}</p>
            <a href="orders.html" class="btn btn-primary btn-pill mx-auto mt-2" style="max-width: 200px;">View My Orders</a>
          </div>
        `;
      }
      return;
    }

    currentOrderData = data.data;
    renderTrackingUI(currentOrderData);
  } catch (err) {
    console.error('Error tracking order:', err);
  }
}

function renderTrackingUI(order) {
  document.getElementById('trackingOrderId').textContent = `#${order._id.substring(order._id.length - 8).toUpperCase()}`;
  document.getElementById('orderPlacedTime').textContent = formatDate(order.createdAt);
  const statusEl = document.getElementById('trackingStatusText');
  if (statusEl) {
    statusEl.outerHTML = `<span id="trackingStatusText">${getStatusBadge(order.status)}</span>`;
  }

  // Cancelled State Handling
  const cancelledBanner = document.getElementById('cancelledBanner');
  const normalTimeline = document.getElementById('normalTimeline');
  const cancelActionBtn = document.getElementById('cancelOrderActionBtn');

  if (order.status === 'Cancelled') {
    if (cancelledBanner) cancelledBanner.classList.remove('d-none');
    if (normalTimeline) normalTimeline.classList.add('d-none');
    if (cancelActionBtn) cancelActionBtn.classList.add('d-none');
  } else {
    if (cancelledBanner) cancelledBanner.classList.add('d-none');
    if (normalTimeline) normalTimeline.classList.remove('d-none');
    updateProgressTimeline(order.status);

    // Can cancel only if Order Placed or Confirmed
    if (cancelActionBtn) {
      if (order.status === 'Order Placed' || order.status === 'Confirmed') {
        cancelActionBtn.classList.remove('d-none');
      } else {
        cancelActionBtn.classList.add('d-none');
      }
    }
  }

  // Live ETA Calculation
  calculateLiveETA(order);

  // Delivery details
  document.getElementById('deliveryRecipient').textContent = order.deliveryAddress?.name || 'Customer';
  document.getElementById('deliveryAddressDisplay').textContent = `${order.deliveryAddress?.address || ''}, ${order.deliveryAddress?.city || ''} - ${order.deliveryAddress?.pincode || ''}`;
  document.getElementById('deliveryPhoneDisplay').textContent = order.deliveryAddress?.phone || order.phone;
  document.getElementById('paymentMethodDisplay').textContent = `${order.paymentMethod} (${order.paymentStatus || 'Pending'})`;

  // Itemized breakdown
  const itemsContainer = document.getElementById('trackingItemsContainer');
  if (itemsContainer) {
    itemsContainer.innerHTML = order.items.map(item => `
      <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
        <div class="d-flex align-items-center gap-2">
          <img src="${item.image || '/images/foods/default-food.jpg'}" alt="${item.name}" class="rounded-2" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.onerror=null;this.src='/images/foods/default-food.jpg'">
          <div>
            <h6 class="mb-0 small fw-bold">${item.name}</h6>
            <small class="text-muted">${item.quantity} x ${formatPrice(item.price)}</small>
          </div>
        </div>
        <span class="small fw-bold">${formatPrice(item.price * item.quantity)}</span>
      </div>
    `).join('');
  }

  document.getElementById('trackingSubtotal').textContent = formatPrice(order.subtotal);
  document.getElementById('trackingDeliveryFee').innerHTML = order.deliveryFee === 0 ? '<span class="text-success fw-bold">FREE</span>' : formatPrice(order.deliveryFee);
  document.getElementById('trackingTax').textContent = formatPrice(order.tax);
  document.getElementById('trackingTotal').textContent = formatPrice(order.totalAmount);
}

function calculateLiveETA(order) {
  const estText = document.getElementById('estimatedTimeText');
  const timerBadge = document.getElementById('liveTimerBadge');
  if (!estText) return;

  if (order.status === 'Delivered') {
    estText.innerHTML = '<span class="text-success fw-bold"><i class="bi bi-check-circle-fill me-1"></i> Order delivered! Bon Appétit.</span>';
    if (timerBadge) timerBadge.innerHTML = '<span class="status-badge status-delivered"><i class="bi bi-check-all"></i> DELIVERED</span>';
    return;
  }

  if (order.status === 'Cancelled') {
    estText.innerHTML = '<span class="text-danger fw-bold"><i class="bi bi-x-circle-fill me-1"></i> This order was cancelled.</span>';
    if (timerBadge) timerBadge.innerHTML = '<span class="status-badge status-cancelled"><i class="bi bi-x-circle"></i> CANCELLED</span>';
    return;
  }

  // Delivery estimation window = 35 minutes from creation
  const orderTime = new Date(order.createdAt).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.floor((now - orderTime) / (1000 * 60));
  const remainingMinutes = Math.max(5, 35 - elapsedMinutes);

  if (order.status === 'Out for Delivery') {
    estText.innerHTML = `<span class="fw-bold" style="color: #0097a7;"><i class="bi bi-bicycle me-1"></i> Delivery partner is approaching! Approx <strong>${Math.min(12, remainingMinutes)} mins</strong></span>`;
    if (timerBadge) timerBadge.innerHTML = `<span class="status-badge status-delivery"><i class="bi bi-stopwatch me-1"></i> ~${Math.min(12, remainingMinutes)} MINS</span>`;
  } else if (order.status === 'Preparing') {
    estText.innerHTML = `<span class="fw-bold" style="color: #d35400;"><i class="bi bi-fire me-1"></i> Kitchen is cooking fresh! Approx <strong>${Math.max(15, remainingMinutes)} mins</strong></span>`;
    if (timerBadge) timerBadge.innerHTML = `<span class="status-badge status-preparing"><i class="bi bi-stopwatch me-1"></i> ~${Math.max(15, remainingMinutes)} MINS</span>`;
  } else {
    estText.innerHTML = `<span class="text-dark fw-bold">Estimated delivery time: <strong>${remainingMinutes} mins</strong></span>`;
    if (timerBadge) timerBadge.innerHTML = `<span class="status-badge status-placed"><i class="bi bi-stopwatch me-1"></i> ~${remainingMinutes} MINS</span>`;
  }
}

function updateProgressTimeline(currentStatus) {
  const currentIndex = ORDER_STEPS.indexOf(currentStatus);
  const progressBar = document.getElementById('trackingProgressBar');
  const steps = document.querySelectorAll('.timeline-step');

  if (currentIndex === -1) return;

  const percentage = (currentIndex / (ORDER_STEPS.length - 1)) * 100;
  if (progressBar) {
    progressBar.style.width = `calc(${percentage}% * 0.85)`;
  }

  steps.forEach((stepEl, idx) => {
    stepEl.classList.remove('completed', 'active');
    if (idx < currentIndex) {
      stepEl.classList.add('completed');
    } else if (idx === currentIndex) {
      stepEl.classList.add('active');
    }
  });
}

async function cancelCurrentOrder() {
  if (!confirm('Are you sure you want to cancel this order? Kitchen preparation has not begun yet.')) return;

  try {
    const res = await fetch(`${API_BASE}/orders/${currentOrderId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.getToken()}`
      },
      body: JSON.stringify({ reason: 'Customer requested cancellation from live tracking screen' })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Order successfully cancelled', 'info');
      await loadOrderTracking(currentOrderId);
    } else {
      showToast(data.message || 'Cannot cancel order', 'danger');
    }
  } catch (err) {
    showToast('Network error while cancelling order', 'danger');
  }
}
