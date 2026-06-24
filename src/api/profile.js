import api from './axios';

export const getMyProfile = async () => {
  const response = await api.get('/profile/me');
  return response.data?.result || response.data;
};

export const updateMyProfile = async (payload) => {
  const response = await api.put('/profile/me', payload);
  return response.data?.result || response.data;
};

export const uploadUserAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/profile/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.result || response.data;
};

export const uploadUserCover = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/profile/upload-cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.result || response.data;
};
