/**
 * Manager Hub Service
 * Currently returns mock data. Replace with api calls for Laravel.
 */
import { managerHubMockData } from '../data/managerHubMockData';

let localData = JSON.parse(JSON.stringify(managerHubMockData));

export const getSuppliers = async () => {
  // Future: return api.get('/suppliers');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...localData.suppliers]), 400);
  });
};

export const addSupplier = async (supplier) => {
  // Future: return api.post('/suppliers', supplier);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSupplier = { id: Date.now(), ...supplier };
      localData.suppliers.push(newSupplier);
      resolve(newSupplier);
    }, 300);
  });
};

export const getCleaningAreas = async () => {
  // Future: return api.get('/cleaning-areas');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...localData.cleaningAreas]), 400);
  });
};

export const addCleaningArea = async (area) => {
  // Future: return api.post('/cleaning-areas', area);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newArea = { id: Date.now(), ...area };
      localData.cleaningAreas.push(newArea);
      resolve(newArea);
    }, 300);
  });
};

export const getEmployees = async () => {
  // Future: return api.get('/employees');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...localData.employees]), 400);
  });
};

export const addEmployee = async (employee) => {
  // Future: return api.post('/employees', employee);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newEmployee = { id: Date.now(), ...employee };
      localData.employees.push(newEmployee);
      resolve(newEmployee);
    }, 300);
  });
};

export const getReviewItems = async () => {
  // Future: return api.get('/review-items');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...localData.reviewItems]), 400);
  });
};

export const addReviewItem = async (item) => {
  // Future: return api.post('/review-items', item);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newItem = { id: Date.now(), ...item };
      localData.reviewItems.push(newItem);
      resolve(newItem);
    }, 300);
  });
};

export const getActivityHistory = async () => {
  // Future: return api.get('/activity-history');
  return new Promise((resolve) => {
    setTimeout(() => resolve([...localData.activityHistory]), 400);
  });
};
