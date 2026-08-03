import axios from 'axios';

export const getSavedPlans = async () => {
  const response = await axios.get('/api/bulk-plans');
  return response.data || [];
};

export const getPlanById = async (id) => {
  const response = await axios.get(`/api/bulk-plans/${id}`);
  return response.data || null;
};

export const savePlan = async (planData) => {
  if (planData.id) {
    const response = await axios.put(`/api/bulk-plans/${planData.id}`, planData);
    return response.data.plan;
  } else {
    const response = await axios.post('/api/bulk-plans', planData);
    return response.data.plan;
  }
};

export const deletePlan = async (id) => {
  await axios.delete(`/api/bulk-plans/${id}`);
  return true;
};
