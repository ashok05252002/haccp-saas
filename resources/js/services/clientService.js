/**
 * Client Service
 * Manages client CRUD operations against localStorage.
 */
import { defaultClients } from '../data/clientsMockData';

const STORAGE_KEY = 'chef2comply_clients';

const ensureClientsExist = () => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultClients));
  }
};

/** Get all clients from localStorage */
export const getClients = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      ensureClientsExist();
      resolve(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    }, 200);
  });
};

/** Find a client by email (sync helper for legacy authService) */
export const findClientByEmail = (email) => {
  ensureClientsExist();
  const clients = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return clients.find((c) => c.email === email);
};
