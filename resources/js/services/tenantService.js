import axios from 'axios';

// ─── Public API ──────────────────────────────────────────────

/** Get all tenants */
export const getTenants = async () => {
  const response = await axios.get('/admin/api/tenants');
  return response.data;
};

/** Create a new tenant */
export const createTenant = async (data) => {
  const response = await axios.post('/admin/api/tenants', data);
  return response.data;
};

/** Update an existing tenant */
export const updateTenant = async (tenantId, data) => {
  const response = await axios.put(`/admin/api/tenants/${tenantId}`, data);
  return response.data;
};

/** Delete a tenant */
export const deleteTenant = async (tenantId) => {
  const response = await axios.delete(`/admin/api/tenants/${tenantId}`);
  return response.data;
};

/** Toggle tenant status Active <-> Suspended */
export const toggleTenantStatus = async (tenantId) => {
  const response = await axios.patch(`/admin/api/tenants/${tenantId}/toggle-status`);
  return response.data;
};

