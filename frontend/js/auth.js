/**
 * ONLINE FOOD ORDERING SYSTEM - AUTHENTICATION & USER PROFILE JS
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Handle Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const errorAlert = document.getElementById('errorAlert');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showError(errorAlert, 'Please enter your email and password');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
        if (errorAlert) errorAlert.classList.add('d-none');

        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
          Auth.setUser(data.user, data.token);
          showToast(`Welcome back, ${data.user.name}!`, 'success');

          // Check if there is a redirect url
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get('redirect') || 'index.html';
          setTimeout(() => {
            window.location.href = redirect;
          }, 800);
        } else {
          showError(errorAlert, data.message || 'Invalid credentials');
        }
      } catch (err) {
        showError(errorAlert, 'Network connection error. Is the server running?');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Log In';
      }
    });
  }

  // 2. Handle Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const street = document.getElementById('street') ? document.getElementById('street').value.trim() : '';
      const city = document.getElementById('city') ? document.getElementById('city').value.trim() : '';
      const pincode = document.getElementById('pincode') ? document.getElementById('pincode').value.trim() : '';
      const errorAlert = document.getElementById('errorAlert');
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      // Client-side validations
      if (!name || !email || !phone || !password || !confirmPassword) {
        showError(errorAlert, 'Please fill in all required fields');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError(errorAlert, 'Please enter a valid email address');
        return;
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
        showError(errorAlert, 'Please enter a valid 10-digit phone number');
        return;
      }

      if (password.length < 6) {
        showError(errorAlert, 'Password must be at least 6 characters long');
        return;
      }

      if (password !== confirmPassword) {
        showError(errorAlert, 'Passwords do not match');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';
        if (errorAlert) errorAlert.classList.add('d-none');

        const response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            password,
            address: { street, city, pincode }
          })
        });

        const data = await response.json();

        if (data.success) {
          Auth.setUser(data.user, data.token);
          showToast('Account created successfully! Welcome to FoodieBites.', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 900);
        } else {
          showError(errorAlert, data.message || 'Registration failed');
        }
      } catch (err) {
        showError(errorAlert, 'Network connection error. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign Up';
      }
    });
  }

  // 3. Handle Profile Page
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    if (!Auth.requireAuth()) return;

    loadUserProfile();

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profileName').value.trim();
      const phone = document.getElementById('profilePhone').value.trim();
      const street = document.getElementById('profileStreet').value.trim();
      const city = document.getElementById('profileCity').value.trim();
      const pincode = document.getElementById('profilePincode').value.trim();
      const submitBtn = profileForm.querySelector('button[type="submit"]');

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

        const res = await fetch(`${API_BASE}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}`
          },
          body: JSON.stringify({
            name,
            phone,
            address: { street, city, pincode }
          })
        });

        const data = await res.json();
        if (data.success) {
          Auth.setUser(data.user);
          showToast('Profile updated successfully!', 'success');
          renderNavbar('profile');
        } else {
          showToast(data.message || 'Failed to update profile', 'danger');
        }
      } catch (err) {
        showToast('Network error while saving profile', 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Changes';
      }
    });

    // Handle Password Change Form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
          showToast('New passwords do not match', 'danger');
          return;
        }

        if (newPassword.length < 6) {
          showToast('New password must be at least 6 characters', 'danger');
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
          });

          const data = await res.json();
          if (data.success) {
            showToast('Password changed successfully!', 'success');
            passwordForm.reset();
          } else {
            showToast(data.message || 'Failed to change password', 'danger');
          }
        } catch (err) {
          showToast('Error changing password', 'danger');
        }
      });
    }
  }
});

async function loadUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
    });
    const data = await res.json();

    if (data.success && data.user) {
      const u = data.user;
      document.getElementById('profileName').value = u.name || '';
      document.getElementById('profileEmail').value = u.email || '';
      document.getElementById('profilePhone').value = u.phone || '';
      document.getElementById('profileStreet').value = u.address?.street || '';
      document.getElementById('profileCity').value = u.address?.city || '';
      document.getElementById('profilePincode').value = u.address?.pincode || '';

      document.getElementById('displayUserName').textContent = u.name;
      document.getElementById('displayUserEmail').textContent = u.email;
      document.getElementById('displayUserRole').textContent = u.role.toUpperCase();

      // Load order count
      const ordersRes = await fetch(`${API_BASE}/orders/my-orders`, {
        headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        document.getElementById('userOrderCount').textContent = ordersData.count;
      }
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

function showError(el, message) {
  if (el) {
    el.textContent = message;
    el.classList.remove('d-none');
  } else {
    showToast(message, 'danger');
  }
}
