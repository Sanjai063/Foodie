/**
 * ONLINE FOOD ORDERING SYSTEM - USER ORDERS JS
 * Order history, cancel order action, and printable tax invoice modal
 */

document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('orders');
  renderFooter();

  if (!Auth.requireAuth()) return;

  await loadMyOrders();
});

async function loadMyOrders() {
  const container = document.getElementById('ordersListContainer');
  const emptyState = document.getElementById('emptyOrdersState');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`
      }
    });

    const data = await res.json();

    if (data.success && data.data.length > 0) {
      if (emptyState) emptyState.classList.add('d-none');

      container.innerHTML = data.data.map(order => {
        const statusBadge = getStatusBadge(order.status);
        const firstFewItems = order.items.slice(0, 3);
        const remainingCount = order.items.length - 3;
        const canCancel = order.status === 'Order Placed' || order.status === 'Confirmed';

        return `
          <div class="card-custom rounded-4 mb-4 overflow-hidden">
            <div class="card-header border-0 p-3 p-md-4 d-flex flex-wrap justify-content-between align-items-center gap-2" style="background: rgba(255, 255, 255, 0.6); border-bottom: 1px solid rgba(255, 255, 255, 0.7) !important;">
              <div>
                <span class="small text-muted d-block">Order Placed</span>
                <span class="fw-semibold small">${formatDate(order.createdAt)}</span>
              </div>
              <div>
                <span class="small text-muted d-block">Total Amount</span>
                <span class="fw-bold text-primary">${formatPrice(order.totalAmount)}</span>
              </div>
              <div>
                <span class="small text-muted d-block">Order ID</span>
                <span class="font-monospace small fw-semibold">#${order._id.substring(order._id.length - 8).toUpperCase()}</span>
              </div>
              <div>
                ${statusBadge}
              </div>
            </div>

            <div class="card-body p-3 p-md-4">
              <div class="row align-items-center g-3">
                <div class="col-md-7">
                  <div class="d-flex flex-wrap gap-3">
                    ${firstFewItems.map(item => `
                      <div class="d-flex align-items-center gap-2">
                        <img src="${item.image || '/images/foods/default-food.jpg'}" alt="${item.name}" class="rounded-3" style="width: 50px; height: 50px; object-fit: cover;" onerror="this.onerror=null;this.src='/images/foods/default-food.jpg'">
                        <div>
                          <h6 class="mb-0 small fw-bold text-truncate" style="max-width: 150px;">${item.name}</h6>
                          <small class="text-muted">${item.quantity} x ${formatPrice(item.price)}</small>
                        </div>
                      </div>
                    `).join('')}
                    ${remainingCount > 0 ? `<div class="d-flex align-items-center text-muted small fw-semibold">+${remainingCount} more</div>` : ''}
                  </div>
                </div>

                <div class="col-md-5 text-md-end">
                  <div class="d-flex flex-wrap justify-content-md-end gap-2">
                    <a href="tracking.html?id=${order._id}" class="btn btn-primary btn-sm btn-pill px-3 shadow-sm">
                      <i class="bi bi-geo-alt me-1"></i> Track Order
                    </a>
                    <button type="button" class="btn btn-action-view btn-sm px-3" onclick='showOrderDetailsModal(${JSON.stringify(order).replace(/'/g, "&apos;")})'>
                      <i class="bi bi-receipt me-1"></i> View Receipt
                    </button>
                    <button type="button" class="btn btn-action-invoice btn-sm px-3" onclick='printOfficialInvoice(${JSON.stringify(order).replace(/'/g, "&apos;")})' title="Print official invoice">
                      <i class="bi bi-printer me-1"></i> Tax Invoice
                    </button>
                    ${canCancel ? `
                      <button type="button" class="btn btn-outline-danger btn-sm btn-pill px-3" onclick="handleCancelCustomerOrder('${order._id}')">
                        Cancel
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('d-none');
    }
  } catch (err) {
    console.error('Error loading orders:', err);
    container.innerHTML = `<div class="alert alert-danger">Error loading orders. Please check your connection.</div>`;
  }
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

async function handleCancelCustomerOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.getToken()}`
      },
      body: JSON.stringify({ reason: 'Customer requested cancellation' })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Order cancelled successfully', 'info');
      await loadMyOrders();
    } else {
      showToast(data.message || 'Failed to cancel order', 'danger');
    }
  } catch (err) {
    showToast('Network error while cancelling order', 'danger');
  }
}

function showOrderDetailsModal(order) {
  let modalEl = document.getElementById('receiptModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'receiptModal';
    modalEl.className = 'modal fade';
    modalEl.setAttribute('tabindex', '-1');
    document.body.appendChild(modalEl);
  }

  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold">Order Receipt</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <div class="text-center mb-3">
            <span class="font-monospace text-muted small">ID: #${order._id}</span>
            <div class="mt-1">${getStatusBadge(order.status)}</div>
          </div>

          <h6 class="fw-bold small text-muted text-uppercase mb-2">Delivery Address</h6>
          <p class="small text-muted mb-3">
            <strong>${order.deliveryAddress?.name || ''}</strong> (${order.deliveryAddress?.phone || order.phone})<br>
            ${order.deliveryAddress?.address || ''}, ${order.deliveryAddress?.city || ''} - ${order.deliveryAddress?.pincode || ''}
          </p>

          <h6 class="fw-bold small text-muted text-uppercase mb-2">Items Ordered</h6>
          <div class="list-group list-group-flush mb-3">
            ${order.items.map(item => `
              <div class="list-group-item px-0 d-flex justify-content-between align-items-center">
                <span class="small">${item.name} &times; ${item.quantity}</span>
                <span class="small fw-semibold">${formatPrice(item.price * item.quantity)}</span>
              </div>
            `).join('')}
          </div>

          <div class="border-top pt-2">
            <div class="d-flex justify-content-between small text-muted mb-1">
              <span>Subtotal:</span>
              <span>${formatPrice(order.subtotal)}</span>
            </div>
            <div class="d-flex justify-content-between small text-muted mb-1">
              <span>Delivery Fee:</span>
              <span>${order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}</span>
            </div>
            <div class="d-flex justify-content-between small text-muted mb-1">
              <span>GST Tax (5%):</span>
              <span>${formatPrice(order.tax)}</span>
            </div>
            <div class="d-flex justify-content-between fw-bold fs-6 mt-2 pt-2 border-top">
              <span>Total:</span>
              <span class="text-primary">${formatPrice(order.totalAmount)}</span>
            </div>
            <div class="d-flex justify-content-between small text-muted mt-1">
              <span>Payment:</span>
              <span>${order.paymentMethod} (${order.paymentStatus || 'Pending'})</span>
            </div>
          </div>
        </div>
        <div class="modal-footer border-0 pt-0 d-flex justify-content-between">
          <button type="button" class="btn btn-outline-dark btn-pill btn-sm" onclick='printOfficialInvoice(${JSON.stringify(order).replace(/'/g, "&apos;")})'>
            <i class="bi bi-printer me-1"></i> Print Tax Invoice
          </button>
          <a href="tracking.html?id=${order._id}" class="btn btn-primary btn-pill btn-sm">
            <i class="bi bi-geo-alt me-1"></i> Track Order
          </a>
        </div>
      </div>
    </div>
  `;

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}
