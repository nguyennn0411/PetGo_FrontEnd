import api from './axios';

export const getAdminHomeSliders = async () => {
    const response = await api.get('/admin/home-sliders');
    return response.data?.result || [];
};

export const createAdminHomeSlider = async (payload) => {
    const response = await api.post('/admin/home-sliders', payload);
    return response.data?.result;
};

export const updateAdminHomeSlider = async (id, payload) => {
    const response = await api.put(`/admin/home-sliders/${id}`, payload);
    return response.data?.result;
};

export const updateAdminHomeSliderVisibility = async (id, active) => {
    const response = await api.patch(`/admin/home-sliders/${id}/visibility`, { active });
    return response.data?.result;
};

export const deleteAdminHomeSlider = async (id) => {
    const response = await api.delete(`/admin/home-sliders/${id}`);
    return response.data;
};
