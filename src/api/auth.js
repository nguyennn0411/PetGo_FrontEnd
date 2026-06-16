import api from './axios';

export const loginRequest = async (payload) => {
  const response = await api.post('/auth/login', payload);
  return response.data;
};

export const registerRequest = async (payload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

export const verifyOtpRequest = async (payload) => {
  const response = await api.post('/auth/verify-otp', payload);
  return response.data;
};

export const resendOtpRequest = async (email) => {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
};

export const forgotPasswordRequest = async (payload) => {
  const response = await api.post('/auth/forgot-password', payload);
  return response.data;
};

export const resetPasswordRequest = async (payload) => {
  const response = await api.post('/auth/reset-password', payload);
  return response.data;
};

export const getMyAccount = async () => {
  const response = await api.get('/auth/me');
  return response.data?.result?.user || response.data?.result || response.data;
};
