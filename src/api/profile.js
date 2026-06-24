import api from './axios';

export const getMyProfile = async () => {
  const response = await api.get('/profile/me');
  return response.data?.result || response.data;
};

export const updateMyProfile = async (payload) => {
  const response = await api.put('/profile/me', payload);
  return response.data?.result || response.data;
};
