import api from "./axios";

export const createReview = async (data) => {
  const res = await api.post("/reviews", data);
  return res.data;
};

export const getReviewsByService = async (serviceId) => {
  const res = await api.get("/reviews/service/" + serviceId);
  return res.data.result || [];
};

export const checkReviewed = async (bookingId) => {
  const res = await api.get("/reviews/check/" + bookingId);
  return res.data;
};
