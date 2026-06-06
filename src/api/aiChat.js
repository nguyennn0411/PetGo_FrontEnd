import api from "./axios";

export const sendAiChatMessage = async (message) => {
  const response = await api.post("/ai-chat/message", {
    message: message,
  });

  return response.data;
};