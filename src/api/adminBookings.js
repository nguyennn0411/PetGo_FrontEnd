import api from './axios';

const unwrap = (response) => response.data?.result ?? response.data;

export const getAdminBookings = async (params = {}) => unwrap(await api.get('/admin/bookings', { params }));
export const getAdminBookingDetail = async (id) => unwrap(await api.get(`/admin/bookings/${id}`));
export const confirmAdminBooking = async (id, data) => unwrap(await api.put(`/admin/bookings/${id}/confirm`, data));
export const completeAdminBooking = async (id, data) => unwrap(await api.put(`/admin/bookings/${id}/complete`, data));
export const cancelAdminBooking = async (id, data) => unwrap(await api.put(`/admin/bookings/${id}/cancel`, data));
export const rejectAdminBooking = async (id, data) => unwrap(await api.put(`/admin/bookings/${id}/reject`, data));
export const updateAdminBookingNote = async (id, data) => api.put(`/admin/bookings/${id}/note`, data);
