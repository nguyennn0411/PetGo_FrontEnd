import api from './axios';

export const getFavorites = async (userId, params = {}) => {
  const response = await api.get(`/users/${userId}/favorites`, { params });
  return response.data;
};

export const getFavoriteProviderIds = async (userId) => {
  const response = await api.get(`/users/${userId}/favorites/provider-ids`);
  return response.data;
};

export const addFavoriteProvider = async (userId, providerId) => {
  const response = await api.post(`/users/${userId}/favorites/providers/${providerId}`);
  return response.data;
};

export const removeFavoriteProvider = async (userId, providerId) => {
  const response = await api.delete(`/users/${userId}/favorites/providers/${providerId}`);
  return response.data;
};
