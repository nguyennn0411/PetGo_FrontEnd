import api from './axios';

const unwrap = (response) => response.data?.result ?? response.data;

export const shopApi = {
  getCategories: async () => unwrap(await api.get('/shop/categories')),
  getProducts: async (params = {}) => unwrap(await api.get('/shop/products', { params })),
  getProductBySlug: async (slug) => unwrap(await api.get(`/shop/products/${slug}`)),

  getCart: async (userId) => unwrap(await api.get('/cart', { params: { userId } })),
  addCartItem: async (payload) => unwrap(await api.post('/cart/items', payload)),
  updateCartItem: async (cartItemId, payload) => unwrap(await api.put(`/cart/items/${cartItemId}`, payload)),
  removeCartItem: async (cartItemId) => unwrap(await api.delete(`/cart/items/${cartItemId}`)),
  clearCart: async (userId) => unwrap(await api.delete('/cart', { params: { userId } })),

  checkout: async (payload) => unwrap(await api.post('/shop/orders/checkout', payload)),
  getMyOrders: async (userId) => unwrap(await api.get('/shop/orders/my', { params: { userId } })),
  getOrderDetail: async (orderCode) => unwrap(await api.get(`/shop/orders/${orderCode}`)),

  getAdminProducts: async (params = {}) => unwrap(await api.get('/admin/products', { params })),
  createAdminProduct: async (payload) => unwrap(await api.post('/admin/products', payload)),
  updateAdminProduct: async (id, payload) => unwrap(await api.put(`/admin/products/${id}`, payload)),
  deleteAdminProduct: async (id) => unwrap(await api.delete(`/admin/products/${id}`)),
  getAdminShopOrders: async (params = {}) => unwrap(await api.get('/admin/shop-orders', { params })),
  updateAdminShopOrderStatus: async (id, payload) => unwrap(await api.put(`/admin/shop-orders/${id}/status`, payload)),
};

export const formatVnd = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

export const resolveProductPrice = (product) => Number(product?.salePriceAmount || product?.priceAmount || 0);

export const getCurrentUserId = () => {
  const stored = localStorage.getItem('petgo_owner_user_id');
  if (stored && Number(stored) > 0) return Number(stored);
  const account = localStorage.getItem('account');
  if (account) {
    try {
      const parsed = JSON.parse(account);
      return Number(parsed.ownerUserId || parsed.userId || parsed.id || 1);
    } catch {
      return 1;
    }
  }
  return 1;
};
