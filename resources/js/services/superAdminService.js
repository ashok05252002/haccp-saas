/**
 * Super Admin Service
 * Provides dashboard stats computed from localStorage data.
 * Future: Replace with api.get('/super-admin/dashboard').
 */
import { defaultClients } from '../data/clientsMockData';
import { defaultRestaurants } from '../data/restaurantsMockData';

const CLIENTS_KEY = 'chef2comply_clients';
const RESTAURANTS_KEY = 'chef2comply_restaurants';

const ensureSeeded = () => {
  if (!localStorage.getItem(CLIENTS_KEY)) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(defaultClients));
  }
  if (!localStorage.getItem(RESTAURANTS_KEY)) {
    localStorage.setItem(RESTAURANTS_KEY, JSON.stringify(defaultRestaurants));
  }
};

export const getSuperAdminDashboardStats = async () => {
  // Future: return api.get('/super-admin/dashboard');
  return new Promise((resolve) => {
    setTimeout(() => {
      ensureSeeded();
      const clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
      const restaurants = JSON.parse(localStorage.getItem(RESTAURANTS_KEY) || '[]');

      const totalClients = clients.length;
      const activeClients = clients.filter((c) => c.status === 'Active').length;
      const totalRestaurantsAllowed = clients.reduce((sum, c) => sum + (c.restaurantLimit || 0), 0);
      const restaurantsCreated = restaurants.length;

      resolve({
        totalClients,
        activeClients,
        totalRestaurantsAllowed,
        restaurantsCreated,
      });
    }, 300);
  });
};
