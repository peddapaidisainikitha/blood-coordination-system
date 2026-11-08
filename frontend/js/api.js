/**
 * API Client — Blood Coordination System
 * Centralised fetch wrapper with auth token injection.
 */

const API_BASE = '/api';

// ---- Token Management ----
const getToken = () => localStorage.getItem('bcs_token');
const setToken = (t) => localStorage.setItem('bcs_token', t);
const removeToken = () => localStorage.removeItem('bcs_token');

const getUser = () => {
  try {
    const u = localStorage.getItem('bcs_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};
const setUser = (u) => localStorage.setItem('bcs_user', JSON.stringify(u));
const removeUser = () => localStorage.removeItem('bcs_user');

const isLoggedIn = () => !!getToken();
const getUserRole = () => getUser()?.role || null;

// ---- Core Fetch ----
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid server response' }));

  if (!res.ok) {
    if (res.status === 401) {
      // Auto logout on invalid token
      removeToken();
      removeUser();
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/pages/login.html';
      }
    }
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
};

// ---- Auth ----
const Auth = {
  registerPatient: (data) => apiFetch('/auth/register/patient', { method: 'POST', body: JSON.stringify(data) }),
  registerDonor: (data) => apiFetch('/auth/register/donor', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch('/auth/me'),
  changePassword: (data) => apiFetch('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  logout: () => { removeToken(); removeUser(); window.location.href = '/pages/login.html'; }
};

// ---- Blood Banks ----
const BloodBanks = {
  getAll: (params = {}) => apiFetch('/blood-banks?' + new URLSearchParams(params)),
  getNearby: (params) => apiFetch('/blood-banks/nearby?' + new URLSearchParams(params)),
  search: (params) => apiFetch('/blood-banks/search?' + new URLSearchParams(params)),
  getById: (id) => apiFetch(`/blood-banks/${id}`),
  getInventory: (id) => apiFetch(`/blood-banks/${id}/inventory`),
  add: (data) => apiFetch('/blood-banks', { method: 'POST', body: JSON.stringify(data) }),
  updateInventory: (id, data) => apiFetch(`/blood-banks/${id}/inventory`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ---- Donors ----
const Donors = {
  getAll: (params = {}) => apiFetch('/donors?' + new URLSearchParams(params)),
  getNearby: (params) => apiFetch('/donors/nearby?' + new URLSearchParams(params)),
  getProfile: () => apiFetch('/donors/profile'),
  updateProfile: (data) => apiFetch('/donors/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updateAvailability: (isAvailable) => apiFetch('/donors/availability', { method: 'PUT', body: JSON.stringify({ isAvailable }) }),
  getHistory: () => apiFetch('/donors/history'),
  getNotifications: () => apiFetch('/donors/notifications'),
  markNotificationRead: (id) => apiFetch(`/donors/notifications/${id}/read`, { method: 'PUT' }),
};

// ---- Emergency Requests ----
const Emergency = {
  create: (data) => apiFetch('/emergency', { method: 'POST', body: JSON.stringify(data) }),
  getMyRequests: () => apiFetch('/emergency/my-requests'),
  getForDonor: () => apiFetch('/emergency/for-donor'),
  getAll: (params = {}) => apiFetch('/emergency?' + new URLSearchParams(params)),
  getById: (id) => apiFetch(`/emergency/${id}`),
  respond: (id, response) => apiFetch(`/emergency/${id}/respond`, { method: 'PUT', body: JSON.stringify({ response }) }),
  cancel: (id) => apiFetch(`/emergency/${id}/cancel`, { method: 'PUT' }),
};

// ---- Admin ----
const AdminAPI = {
  getStats: () => apiFetch('/admin/stats'),
  getUsers: (params = {}) => apiFetch('/admin/users?' + new URLSearchParams(params)),
  verifyDonor: (id) => apiFetch(`/admin/donors/${id}/verify`, { method: 'PUT' }),
  verifyBloodBank: (id) => apiFetch(`/admin/blood-banks/${id}/verify`, { method: 'PUT' }),
  deactivateUser: (id, userType) => apiFetch(`/admin/users/${id}/deactivate`, { method: 'PUT', body: JSON.stringify({ userType }) }),
  flagDuplicate: (id, isDuplicate) => apiFetch(`/admin/requests/${id}/flag-duplicate`, { method: 'PUT', body: JSON.stringify({ isDuplicate }) }),
  createAdmin: (data) => apiFetch('/admin/create', { method: 'POST', body: JSON.stringify(data) }),
};
