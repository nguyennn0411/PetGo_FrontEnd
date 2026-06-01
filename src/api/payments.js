import api from './axios';

export const getPaymentCheckoutContext = async ({ bookingId, promoCode } = {}) => {
  const response = await api.get('/payments/checkout-context', {
    params: {
      bookingId,
      promoCode: promoCode || undefined,
    },
  });
  return response.data;
};

export const checkoutPayment = async (payload) => {
  const response = await api.post('/payments/checkout', payload);
  return response.data;
};

export const createPayOsPayment = async (payload) => {
  const response = await api.post('/payments/payos/create', payload);
  return response.data;
};

export const verifyPayOsPayment = async (invoiceId) => {
  const response = await api.get('/payments/payos/verify', {
    params: { invoiceId }
  });
  return response.data;
};
