import axios from 'axios';

const SELECTED_KEY = 'chef2comply_selected_restaurant';

/** Get restaurants for a specific client */
export const getRestaurantsByClient = async (clientId) => {
  const response = await axios.get('/api/branches');
  return response.data;
};

/** Create a restaurant for a client */
export const createRestaurant = async (clientId, data) => {
  const response = await axios.post('/api/branches', data);
  return response.data;
};

/** Update a restaurant */
export const updateRestaurant = async (restaurantId, data) => {
  const response = await axios.put(`/api/branches/${restaurantId}`, data);
  return response.data;
};

/** Delete a restaurant */
export const deleteRestaurant = async (restaurantId) => {
  const response = await axios.delete(`/api/branches/${restaurantId}`);
  const selected = getSelectedRestaurant();
  if (selected && selected.id === restaurantId) {
    localStorage.removeItem(SELECTED_KEY);
  }
  return response.data;
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
