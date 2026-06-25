import api from './axios';

const unwrap = (response) => response.data?.result ?? response.data;

export const createConversation = async (payload) => unwrap(await api.post('/chat/conversations', payload));
export const getMyConversations = async () => unwrap(await api.get('/chat/conversations'));
export const getConversationDetail = async (id) => unwrap(await api.get(`/chat/conversations/${id}`));
export const getMessages = async (id) => unwrap(await api.get(`/chat/conversations/${id}/messages`));
export const sendMessage = async (id, payload) => unwrap(await api.post(`/chat/conversations/${id}/messages`, payload));

export const getAdminConversations = async (type) => unwrap(await api.get('/chat/admin/conversations', { params: { type } }));
export const updateConversationStatus = async (id, payload) => unwrap(await api.patch(`/chat/admin/conversations/${id}/status`, payload));
export const deleteConversation = async (id) => unwrap(await api.delete(`/chat/admin/conversations/${id}`));

export const uploadChatImage = async (file) => {
  const form = new FormData();
  form.append('file', file);
  return unwrap(await api.post('/chat/upload-image', form));
};
