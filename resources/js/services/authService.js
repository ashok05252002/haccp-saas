/**
 * Auth Service
 * Handles Super Admin and Client authentication.
 * Future: Replace with api.post('/login'), api.post('/super-admin/login'), etc.
 */
import { SUPER_ADMIN_USER, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_TOKEN } from '../data/superAdminMockData';
import { findClientByEmail } from './clientService';

// ─── Super Admin Login ───────────────────────────────────────

export const loginSuperAdmin = async (email, password) => {
  // Future: return api.post('/super-admin/login', { email, password });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === SUPER_ADMIN_USER.email && password === SUPER_ADMIN_PASSWORD) {
        resolve({ user: SUPER_ADMIN_USER, token: SUPER_ADMIN_TOKEN });
      } else {
        reject(new Error('Invalid Super Admin credentials.'));
      }
    }, 500);
  });
};

// ─── Client Login ────────────────────────────────────────────

export const loginClient = async (email, password) => {
  // Future: return api.post('/login', { email, password });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const client = findClientByEmail(email);
      if (!client) {
        reject(new Error('No account found with this email.'));
        return;
      }
      if (client.password !== password) {
        reject(new Error('Invalid password.'));
        return;
      }
      if (client.status !== 'Active') {
        reject(new Error('Your account is suspended. Please contact Chef2Comply admin.'));
        return;
      }
      const userObj = {
        id: client.id,
        name: client.clientName,
        email: client.email,
        role: 'client',
        restaurantLimit: client.restaurantLimit,
      };
      const token = `mock-client-jwt-${client.id}-${Date.now()}`;
      resolve({ user: userObj, token });
    }, 500);
  });
};

// ─── Shared ──────────────────────────────────────────────────

export const logout = async () => {
  // Future: return api.post('/logout');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 200);
  });
};

export const getCurrentUser = async () => {
  // Future: return api.get('/user');
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = localStorage.getItem('chef2comply_user');
      resolve(user ? JSON.parse(user) : null);
    }, 200);
  });
};
