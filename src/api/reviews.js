import api from './axios';

export const getReviewContext = async (userId, bookingId) => {
  const response = await api.get(`/users/${userId}/bookings/${bookingId}/review-context`);
  return response.data;
};

export const createReview = async (userId, bookingId, payload) => {
  const response = await api.post(`/users/${userId}/bookings/${bookingId}/reviews`, payload);
  return response.data;
};

export const getMyReviews = async (userId) => {
  const response = await api.get(`/users/${userId}/reviews`);
  return response.data;
};
