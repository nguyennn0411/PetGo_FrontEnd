import api from './axios';

export const getPublicServices = async (params = {}) => {
  const response = await api.get('/services', { params });
  return response.data;
};

export const getPublicServiceById = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}`);
  return response.data;
};

export const getPublicCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const getServiceAreas = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}/areas`);
  return response.data;
};

export const toggleFavorite = async (serviceId) => {
  const response = await api.post(`/favorites/toggle/${serviceId}`);
  return response.data?.result || response.data;
};

export const getUserFavorites = async () => {
  const response = await api.get('/favorites');
  return response.data;
};

export const getFavoriteIds = async () => {
  const response = await api.get('/favorites/ids');
  return response.data;
};
