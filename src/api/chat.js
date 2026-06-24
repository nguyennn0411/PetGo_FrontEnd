import api from './axios';

const unwrap = (response) => response.data?.result || response.data;

export const startProviderChat = async (providerId) => {
    const response = await api.post(`/chat/conversations/direct/provider/${providerId}`);
    return unwrap(response);
};

export const startSupportChat = async () => {
    const response = await api.post('/chat/conversations/support');
    return unwrap(response);
};

export const startBookingChat = async (bookingId) => {
    const response = await api.post(`/chat/conversations/booking/${bookingId}`);
    return unwrap(response);
};

export const getChatConversations = async () => {
    const response = await api.get('/chat/conversations');
    return unwrap(response);
};

export const getChatMessages = async (conversationId, limit = 50) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, { params: { limit } });
    return unwrap(response);
};

export const sendChatMessage = async (conversationId, content) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
    return unwrap(response);
};

export const sendChatImage = async (conversationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/chat/conversations/${conversationId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(response);
};

export const deleteChatMessage = async (conversationId, messageId) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages/${messageId}/delete`);
    return unwrap(response);
};

export const markChatAsRead = async (conversationId) => {
    const response = await api.post(`/chat/conversations/${conversationId}/read`);
    return unwrap(response);
};