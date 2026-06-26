import api from "./axios";

export const getAdminUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const updateUserStatus = async (userId, status) => {
  const response = await api.put("/admin/users/status", { userId, status });
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

export const deleteCategoryHard = async (id, moveServicesToCategoryId) => {
  const response = await api.delete(`/admin/categories/${id}`, {
    params: { hardDelete: true, moveServicesToCategoryId },
  });
  return response.data;
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

export const deleteAdminPromotion = async (id) => {
  const response = await api.delete(`/admin/promotions/${id}`);
  return response.data;
};

export const getAdminServiceList = async () => {
  const response = await api.get('/admin/services/list');
  return response.data?.result || response.data;
};

export const createAdminService = async (data) => {
  const response = await api.post('/admin/services', data);
  return response.data?.result || response.data;
};

export const updateAdminService = async (id, data) => {
  const response = await api.put(`/admin/services/${id}`, data);
  return response.data?.result || response.data;
};

export const deleteAdminService = async (id) => {
  const response = await api.delete(`/admin/services/${id}`);
  return response.data?.result || response.data;
};

export const uploadAdminServiceImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/admin/services/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.result || response.data;
};

export const getAdminReviews = async (params = {}) => {
  const response = await api.get('/admin/reviews', { params });
  return response.data?.result || response.data;
};

export const getAdminReviewDetail = async (id) => {
  const response = await api.get(`/admin/reviews/${id}`);
  return response.data?.result || response.data;
};

export const toggleAdminReviewHidden = async (id) => {
  const response = await api.put(`/admin/reviews/${id}/toggle-hidden`);
  return response.data?.result || response.data;
};

export const replyAdminReview = async (id, reply) => {
  const response = await api.put(`/admin/reviews/${id}/reply`, { reply });
  return response.data?.result || response.data;
};

export const deleteAdminReview = async (id) => {
  const response = await api.delete(`/admin/reviews/${id}`);
  return response.data;
};


