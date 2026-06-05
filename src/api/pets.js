import api from './axios';

export const getUserPets = async (userId) => {
  const response = await api.get(`/users/${userId}/pets`);
  return response.data;
};

export const getPetDetail = async (userId, petId) => {
  const response = await api.get(`/users/${userId}/pets/${petId}`);
  return response.data;
};

export const createPet = async (userId, payload) => {
  const response = await api.post(`/users/${userId}/pets`, payload);
  return response.data;
};

export const updatePet = async (userId, petId, payload) => {
  const response = await api.put(`/users/${userId}/pets/${petId}`, payload);
  return response.data;
};

export const deletePet = async (userId, petId) => {
  const response = await api.delete(`/users/${userId}/pets/${petId}`);
  return response.data;
};
