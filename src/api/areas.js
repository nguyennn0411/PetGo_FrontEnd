import api from './axios';

const unwrap = (response) => response.data?.result ?? response.data;

export const getAreas = async () => unwrap(await api.get('/admin/areas'));
export const createArea = async (data) => unwrap(await api.post('/admin/areas', data));
export const updateArea = async (id, data) => unwrap(await api.put(`/admin/areas/${id}`, data));
export const deleteArea = async (id) => api.delete(`/admin/areas/${id}`);

export const getAreaServices = async (areaId) => unwrap(await api.get(`/admin/areas/${areaId}/services`));
export const addAreaService = async (areaId, data) => unwrap(await api.post(`/admin/areas/${areaId}/services`, data));
export const updateAreaService = async (areaId, configId, data) => unwrap(await api.put(`/admin/areas/${areaId}/services/${configId}`, data));
export const removeAreaService = async (areaId, configId) => api.delete(`/admin/areas/${areaId}/services/${configId}`);

export const getAreaSchedules = async (areaId) => unwrap(await api.get(`/admin/areas/${areaId}/schedule`));
export const updateAreaSchedules = async (areaId, data) => unwrap(await api.put(`/admin/areas/${areaId}/schedule`, data));

export const getAreaOverrides = async (areaId, from, to) => unwrap(await api.get(`/admin/areas/${areaId}/schedule/overrides`, { params: { from, to } }));
export const upsertAreaOverride = async (areaId, data) => unwrap(await api.put(`/admin/areas/${areaId}/schedule/overrides`, data));
export const deleteAreaOverride = async (areaId, date) => api.delete(`/admin/areas/${areaId}/schedule/overrides/${date}`);

export const getShippingFees = async (areaId) => unwrap(await api.get(`/admin/areas/${areaId}/shipping-fees`));
export const addShippingFee = async (areaId, data) => unwrap(await api.post(`/admin/areas/${areaId}/shipping-fees`, data));
export const updateShippingFee = async (areaId, configId, data) => unwrap(await api.put(`/admin/areas/${areaId}/shipping-fees/${configId}`, data));
export const deleteShippingFee = async (areaId, configId) => api.delete(`/admin/areas/${areaId}/shipping-fees/${configId}`);

export const getPublicAreas = async () => {
  const response = await api.get('/areas');
  return response.data;
};

export const getCreateContext = async (areaId) => unwrap(await api.get('/bookings/create-context', { params: { areaId } }));
export const getAvailabilityDates = async (params) => unwrap(await api.get('/bookings/availability/dates', { params }));
export const getAvailabilitySlots = async (params) => unwrap(await api.get('/bookings/availability/slots', { params }));
export const calculateShippingFee = async (data) => unwrap(await api.post('/bookings/shipping-fee', data));
export const createBooking = async (data) => unwrap(await api.post('/bookings', data));
export const getMyBookings = async () => unwrap(await api.get('/bookings/my'));
export const getBookingDetail = async (id) => unwrap(await api.get(`/bookings/${id}`));
export const cancelMyBooking = async (id) => unwrap(await api.put(`/bookings/${id}/cancel`));

export const getUserLocations = async () => {
  const response = await api.get('/user/locations');
  return response.data?.result || [];
};

export const createUserLocation = async (data) => {
  const response = await api.post('/user/locations', data);
  return response.data?.result;
};

export const updateUserLocation = async (id, data) => {
  const response = await api.put(`/user/locations/${id}`, data);
  return response.data?.result;
};

export const deleteUserLocation = async (id) => {
  await api.delete(`/user/locations/${id}`);
};
