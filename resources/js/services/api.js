import axios from 'axios';

/**
 * Axios instance configured for future Laravel API integration.
 *
 * Future Laravel Endpoints:
 * ─────────────────────────
 * POST   /api/login
 * POST   /api/logout
 * GET    /api/dashboard
 * GET    /api/haccp/modules
 * GET    /api/haccp/logs
 * POST   /api/haccp/logs
 * GET    /api/haccp/reports
 * GET    /api/recipes
 * POST   /api/recipes
 * PUT    /api/recipes/:id
 * DELETE /api/recipes/:id
 * GET    /api/plans
 * POST   /api/plans
 * PUT    /api/plans/:id
 * DELETE /api/plans/:id
 * GET    /api/suppliers
 * POST   /api/suppliers
 * PUT    /api/suppliers/:id
 * DELETE /api/suppliers/:id
 * GET    /api/cleaning-areas
 * POST   /api/cleaning-areas
 * GET    /api/employees
 * POST   /api/employees
 * GET    /api/review-items
 * POST   /api/review-items
 * GET    /api/activity-history
 */

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chef2comply_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('chef2comply_token');
      localStorage.removeItem('chef2comply_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
