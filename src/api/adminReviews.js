import api from './axios';

export const getAdminReviews = async (params = {}) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data?.result || response.data;
};

export const moderateAdminReview = async (reviewId, payload) => {
    const response = await api.patch(`/admin/reviews/${reviewId}`, payload);
    return response.data?.result || response.data;
};