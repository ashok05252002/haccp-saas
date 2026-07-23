/**
 * Restaurant Service
 * Manages restaurant CRUD operations against localStorage.
 * Future: Replace with api calls like api.get(`/clients/${clientId}/restaurants`), etc.
 */
import { defaultRestaurants } from '../data/restaurantsMockData';

const STORAGE_KEY = 'chef2comply_restaurants';
const SELECTED_KEY = 'chef2comply_selected_restaurant';
const CLIENTS_KEY = 'chef2comply_clients';

/** Seed default restaurants if localStorage is empty */
const ensureRestaurantsExist = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRestaurants));
  }
};

const readRestaurants = () => {
  ensureRestaurantsExist();
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

const writeRestaurants = (restaurants) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
};

/** Generate next restaurant ID */
const nextId = (restaurants) => {
  const nums = restaurants.map((r) => parseInt(r.id.replace('REST', ''), 10) || 0);
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `REST${String(max + 1).padStart(3, '0')}`;
};

/** Update the restaurantsCreated count on the parent client */
const syncClientCount = (clientId) => {
  const allRestaurants = readRestaurants();
  const count = allRestaurants.filter((r) => r.clientId === clientId).length;
  const clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
  const idx = clients.findIndex((c) => c.id === clientId);
  if (idx !== -1) {
    clients[idx].restaurantsCreated = count;
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }
};

// ─── Public API ──────────────────────────────────────────────

/** Get restaurants for a specific client */
export const getRestaurantsByClient = async (clientId) => {
  // Future: return api.get(`/clients/${clientId}/restaurants`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = readRestaurants();
      resolve(all.filter((r) => r.clientId === clientId));
    }, 300);
  });
};

/** Create a restaurant for a client */
export const createRestaurant = async (clientId, data) => {
  // Future: return api.post(`/clients/${clientId}/restaurants`, data);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check restaurant limit
      const clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
      const client = clients.find((c) => c.id === clientId);
      if (!client) {
        reject(new Error('Client not found.'));
        return;
      }
      const currentRestaurants = readRestaurants().filter((r) => r.clientId === clientId);
      if (currentRestaurants.length >= client.restaurantLimit) {
        reject(new Error('Restaurant limit reached. Contact Super Admin to increase your limit.'));
        return;
      }

      const restaurants = readRestaurants();
      const newRestaurant = {
        ...data,
        id: nextId(restaurants),
        clientId,
        haccpStatus: 'Active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      restaurants.push(newRestaurant);
      writeRestaurants(restaurants);
      syncClientCount(clientId);
      resolve(newRestaurant);
    }, 400);
  });
};

/** Update a restaurant */
export const updateRestaurant = async (restaurantId, data) => {
  // Future: return api.put(`/restaurants/${restaurantId}`, data);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const restaurants = readRestaurants();
      const idx = restaurants.findIndex((r) => r.id === restaurantId);
      if (idx === -1) {
        reject(new Error('Restaurant not found.'));
        return;
      }
      restaurants[idx] = { ...restaurants[idx], ...data };
      writeRestaurants(restaurants);
      resolve(restaurants[idx]);
    }, 400);
  });
};

/** Delete a restaurant */
export const deleteRestaurant = async (restaurantId) => {
  // Future: return api.delete(`/restaurants/${restaurantId}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      let restaurants = readRestaurants();
      const target = restaurants.find((r) => r.id === restaurantId);
      restaurants = restaurants.filter((r) => r.id !== restaurantId);
      writeRestaurants(restaurants);
      if (target) syncClientCount(target.clientId);
      // Clear selected if it was the deleted one
      const selected = getSelectedRestaurant();
      if (selected && selected.id === restaurantId) {
        localStorage.removeItem(SELECTED_KEY);
      }
      resolve({ success: true });
    }, 300);
  });
};

/** Save selected restaurant to localStorage */
export const selectRestaurant = (restaurant) => {
  localStorage.setItem(SELECTED_KEY, JSON.stringify(restaurant));
};

/** Get selected restaurant from localStorage */
export const getSelectedRestaurant = () => {
  const raw = localStorage.getItem(SELECTED_KEY);
  return raw ? JSON.parse(raw) : null;
};

/** Clear selected restaurant */
export const clearSelectedRestaurant = () => {
  localStorage.removeItem(SELECTED_KEY);
};
