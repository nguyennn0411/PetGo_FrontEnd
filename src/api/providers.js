import api from './axios';

export const getProviders = async (params = {}) => {
  const response = await api.get('/providers', { params });
  return response.data;
};

export const searchProviders = async (params = {}) => {
  const response = await api.get('/providers/search', { params });
  return response.data;
};

export const getNearbyProviders = async (params = {}) => {
  const response = await api.get('/providers/nearby', { params });
  return response.data;
};

export const getProviderFilterOptions = async () => {
  const response = await api.get('/providers/filter-options');
  return response.data;
};

export const getActiveProviderServices = async (params = {}) => {
  const response = await api.get('/providers/services', { params });
  return response.data;
};

export const getProviderDetail = async (providerId, params = {}) => {
  const response = await api.get(`/providers/${providerId}`, { params });
  return response.data;
};
