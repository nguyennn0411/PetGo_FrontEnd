import api from './axios';

export const getMembershipPlans = async () => {
  const response = await api.get('/memberships/plans');
  return response.data;
};

export const getMyMembership = async () => {
  const response = await api.get('/memberships/me');
  return response.data;
};

export const getMembershipCheckoutContext = async ({ planSlug, promoCode }) => {
  const response = await api.get('/memberships/checkout-context', {
    params: {
      planSlug,
      ...(promoCode ? { promoCode } : {}),
    },
  });
  return response.data;
};

export const checkoutMembership = async (payload) => {
  const response = await api.post('/memberships/checkout', payload);
  return response.data;
};
