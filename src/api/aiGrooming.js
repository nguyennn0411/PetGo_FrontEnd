import api from './axios';

export const getAiGroomingSuggestions = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await api.post('/ai-grooming/suggestions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });

  return response.data;
};
