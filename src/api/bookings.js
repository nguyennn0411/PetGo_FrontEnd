import api from './axios';

const unwrapPayload = (data) => data?.result || data;

export const getBookingCreateContext = async (params = {}) => {
  const response = await api.get('/bookings/create-context', { params });
  return unwrapPayload(response.data);
};

export const createBooking = async (payload) => {
  const response = await api.post('/bookings', payload);
  return unwrapPayload(response.data);
};

export const getBookingSummary = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}/summary`);
  return unwrapPayload(response.data);
};

export const getMyBookings = async (userId, status = 'ALL') => {
  const response = await api.get(`/users/${userId}/bookings`, {
    params: { status },
  });
  return response.data;
};

export const getBookingDetail = async (userId, bookingId) => {
  const response = await api.get(`/users/${userId}/bookings/${bookingId}`);
  return response.data;
};

export const getBookingRescheduleContext = async (userId, bookingId) => {
  const response = await api.get(`/users/${userId}/bookings/${bookingId}/reschedule-context`);
  return response.data;
};

export const rescheduleBooking = async (userId, bookingId, payload) => {
  const response = await api.post(`/users/${userId}/bookings/${bookingId}/reschedule`, payload);
  return response.data;
};

export const cancelBooking = async (userId, bookingId, payload) => {
  const response = await api.post(`/users/${userId}/bookings/${bookingId}/cancel`, payload);
  return response.data;
};
