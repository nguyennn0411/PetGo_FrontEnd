import api from "./axios";

export const getAdminUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const updateUserStatus = async (userId, status) => {
  const response = await api.put("/admin/users/status", { userId, status });
  return response.data;
};

export const getPendingProviders = async () => {
  const response = await api.get("/admin/providers/pending");
  return response.data;
};

export const getVerifiedProviders = async () => {
  const response = await api.get("/admin/providers/verified");
  return response.data;
};

export const getAdminProviderDetail = async (providerId) => {
  const response = await api.get(`/admin/providers/${providerId}`);
  return response.data;
};

export const updateProviderVerification = async (providerId, status) => {
  const response = await api.put("/admin/providers/verification", { providerId, status });
  return response.data;
};

export const updateProviderAccountStatus = async (providerId, status) => {
  const response = await api.put("/admin/providers/status", { providerId, status });
  return response.data;
};


export const getCategories = async () => {
  const response = await api.get("/admin/categories");
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post("/admin/categories", data);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.put(`/admin/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/admin/categories/${id}`);
  return response.data;
};

export const getPartnerServiceRequests = async (params = {}) => {
  const response = await api.get('/admin/partner-service-requests', { params });
  return response.data?.result || response.data;
};

export const getPartnerServiceRequestDetail = async (id) => {
  const response = await api.get(`/admin/partner-service-requests/${id}`);
  return response.data?.result || response.data;
};

export const approvePartnerServiceRequest = async (id, payload = {}) => {
  const response = await api.post(`/admin/partner-service-requests/${id}/approve`, payload);
  return response.data?.result || response.data;
};

export const rejectPartnerServiceRequest = async (id, payload = {}) => {
  const response = await api.post(`/admin/partner-service-requests/${id}/reject`, payload);
  return response.data?.result || response.data;
};

export const getAdminPromotions = async (params = {}) => {
  const response = await api.get('/admin/promotions', { params });
  return response.data?.result || response.data;
};

export const getAdminPromotionOptions = async () => {
  const response = await api.get('/admin/promotions/options');
  return response.data?.result || response.data;
};

export const createAdminPromotion = async (payload) => {
  const response = await api.post('/admin/promotions', payload);
  return response.data?.result || response.data;
};

export const updateAdminPromotion = async (id, payload) => {
  const response = await api.put(`/admin/promotions/${id}`, payload);
  return response.data?.result || response.data;
};

export const updateAdminPromotionStatus = async (id, active) => {
  const response = await api.patch(`/admin/promotions/${id}/status`, { active });
  return response.data?.result || response.data;
};
