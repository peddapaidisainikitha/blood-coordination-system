/**
 * UI Utilities — Toast, Form Validation, Helpers
 */

// ---- Toast Notifications ----
const showToast = (message, type = 'info', duration = 4000) => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="font-size:1.2rem">${icons[type]}</span><span>${message}</span>`;
  toast.onclick = () => toast.remove();

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// ---- Loading Overlay ----
const showLoading = () => {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div style="text-align:center"><div class="spinner"></div><p style="margin-top:12px;color:#6b7280">Loading...</p></div>';
    document.body.appendChild(overlay);
  }
  overlay.classList.remove('hidden');
};

const hideLoading = () => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
};

// ---- Form Validation ----
const validateForm = (formEl) => {
  let isValid = true;
  const fields = formEl.querySelectorAll('[data-required]');

  fields.forEach(field => {
    clearFieldError(field);
    const value = field.value.trim();
    const errorEl = formEl.querySelector(`[data-error="${field.name || field.id}"]`);

    if (!value) {
      showFieldError(field, errorEl, 'This field is required');
      isValid = false;
      return;
    }

    if (field.type === 'email' && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
      showFieldError(field, errorEl, 'Enter a valid email address');
      isValid = false;
      return;
    }

    if (field.dataset.minLength && value.length < parseInt(field.dataset.minLength)) {
      showFieldError(field, errorEl, `Minimum ${field.dataset.minLength} characters required`);
      isValid = false;
      return;
    }

    if (field.dataset.match) {
      const matchField = formEl.querySelector(`[name="${field.dataset.match}"]`) ||
                         formEl.querySelector(`#${field.dataset.match}`);
      if (matchField && value !== matchField.value.trim()) {
        showFieldError(field, errorEl, 'Passwords do not match');
        isValid = false;
        return;
      }
    }

    if (field.type === 'tel' && !/^[0-9]{10,15}$/.test(value)) {
      showFieldError(field, errorEl, 'Enter a valid phone number (10-15 digits)');
      isValid = false;
    }
  });

  return isValid;
};

const showFieldError = (field, errorEl, message) => {
  field.classList.add('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
};

const clearFieldError = (field) => {
  field.classList.remove('error');
  const id = field.name || field.id;
  const errorEl = field.closest('form')?.querySelector(`[data-error="${id}"]`);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }
};

// ---- Date/Time Helpers ----
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// ---- Blood Group Color ----
const bloodGroupColor = (bg) => {
  const positive = ['A+', 'B+', 'AB+', 'O+'];
  return positive.includes(bg) ? '#dc2626' : '#1e40af';
};

// ---- Status Badge HTML ----
const statusBadge = (status) => {
  const map = {
    active: 'badge-active', fulfilled: 'badge-fulfilled',
    cancelled: 'badge-cancelled', pending: 'badge-pending',
    expired: 'badge-cancelled', available: 'badge-available',
    low: 'badge-low', unavailable: 'badge-unavailable',
    critical: 'badge-critical'
  };
  return `<span class="badge ${map[status] || 'badge-pending'}">${status}</span>`;
};

// ---- Urgency Badge HTML ----
const urgencyBadge = (level) => {
  const icons = { critical: '🔴', urgent: '🟠', moderate: '🟡' };
  const cls = { critical: 'urgency-critical', urgent: 'urgency-urgent', moderate: 'urgency-moderate' };
  return `<span class="${cls[level] || ''}">${icons[level] || ''} ${level}</span>`;
};

// ---- Geolocation ----
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error('Location access denied. Please enter your location manually.')),
      { timeout: 10000, maximumAge: 60000 }
    );
  });
};

// ---- Modal Helpers ----
const openModal = (id) => {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
};
const closeModal = (id) => {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
};

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ---- Tabs ----
const initTabs = (containerEl) => {
  const btns = containerEl.querySelectorAll('.tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      containerEl.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === target);
      });
    });
  });
};

// ---- Auth Guard ----
const requireAuth = (allowedRoles = []) => {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    showToast('Please login to continue', 'warning');
    setTimeout(() => window.location.href = '/pages/login.html', 1000);
    return false;
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    showToast('Access denied', 'error');
    setTimeout(() => window.location.href = '/index.html', 1000);
    return false;
  }
  return true;
};

// ---- Sidebar navigation ----
const initSidebar = () => {
  const navItems = document.querySelectorAll('.sidebar-nav-item[data-section]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;
      // Update active nav item
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      // Show target section
      document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === target);
      });
      // Close sidebar on mobile
      document.querySelector('.sidebar')?.classList.remove('open');
    });
  });

  // Hamburger toggle
  const hamburger = document.querySelector('.hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('open');
    });
  }
};

// Expose helpers as globals
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.validateForm = validateForm;
window.timeAgo = timeAgo;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.statusBadge = statusBadge;
window.urgencyBadge = urgencyBadge;
window.bloodGroupColor = bloodGroupColor;
window.getCurrentLocation = getCurrentLocation;
window.openModal = openModal;
window.closeModal = closeModal;
window.initTabs = initTabs;
window.requireAuth = requireAuth;
window.initSidebar = initSidebar;
