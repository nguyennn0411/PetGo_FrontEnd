import api from './axios';

export const getHomePage = async (params = {}) => {
  const response = await api.get('/home', { params });
  return response.data;
};
