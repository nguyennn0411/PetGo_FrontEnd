import api from './axios';

const unwrap = (response) => {
    if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'result')) {
        return response.data.result;
    }
    return response.data;
};

export const getPartnerRegistration = async () => {
    const response = await api.get('/registrations/partner');
    return unwrap(response);
};

export const getPartnerRegistrationHistory = async () => {
    const response = await api.get('/registrations/partner/history');
    return unwrap(response);
};

export const createPartnerRegistrationDraft = async (payload) => {
    const response = await api.post('/registrations/partner/draft', payload);
    return unwrap(response);
};

export const updatePartnerRegistrationDraft = async (payload) => {
    const response = await api.put('/registrations/partner/draft', payload);
    return unwrap(response);
};

export const submitPartnerRegistration = async (payload) => {
    const response = await api.post('/registrations/partner/submit', { application: payload });
    return unwrap(response);
};

export const submitPartnerAdditionalInformation = async (payload) => {
    const { additionalInformation, application } = payload || {};
    const response = await api.post('/registrations/partner/additional-info', {
        additionalInformation,
        application,
    });
    return unwrap(response);
};

export const uploadPartnerRegistrationImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/registrations/partner/images', formData);
    const payload = unwrap(response);
    return payload?.imageUrl || payload?.url || payload;
};

export const getAdminRegistrations = async (filters = {}) => {
    const response = await api.get('/admin/registrations', { params: filters });
    return unwrap(response);
};

export const getAdminRegistrationDetail = async (id) => {
    const response = await api.get(`/admin/registrations/${id}`);
    return unwrap(response);
};

export const approveRegistration = async (id, payload = {}) => {
    const response = await api.post(`/admin/registrations/${id}/approve`, payload);
    return unwrap(response);
};

export const rejectRegistration = async (id, payload = {}) => {
    const response = await api.post(`/admin/registrations/${id}/reject`, payload);
    return unwrap(response);
};

export const requestRegistrationAdditionalInfo = async (id, payload = {}) => {
    const response = await api.post(`/admin/registrations/${id}/request-additional-info`, payload);
    return unwrap(response);
};