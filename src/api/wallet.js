import api from './axios';

const unwrap = (response) => response.data?.result ?? response.data;

export const getMyWallet = async () => unwrap(await api.get('/wallet/me'));
export const getMyWalletTransactions = async () => unwrap(await api.get('/wallet/transactions'));
export const createWalletTopUp = async (payload) => unwrap(await api.post('/wallet/top-up', payload));
export const verifyWalletTopUp = async (transactionId) => unwrap(await api.post(`/wallet/top-up/${transactionId}/verify`));
export const transferWalletMoney = async (payload) => unwrap(await api.post('/wallet/transfer', payload));
export const requestWalletWithdraw = async (payload) => unwrap(await api.post('/wallet/withdraw', payload));

export const getAdminWalletPendingTransactions = async () => unwrap(await api.get('/admin/wallet/pending-transactions'));
export const getAdminWalletFailedTopUps = async () => unwrap(await api.get('/admin/wallet/failed-top-ups'));
export const reviewAdminWalletTransaction = async (transactionId, payload) => unwrap(await api.post(`/admin/wallet/transactions/${transactionId}/review`, payload));
export const resolveAdminWalletFailedTopUp = async (transactionId, payload) => unwrap(await api.post(`/admin/wallet/failed-top-ups/${transactionId}/resolve`, payload));
export const updateAdminWalletStatus = async (userId, payload) => unwrap(await api.patch(`/admin/wallet/users/${userId}/status`, payload));
export const getAdminWalletAutoConfirm = async () => unwrap(await api.get('/admin/wallet/settings/auto-confirm-top-up'));
export const updateAdminWalletAutoConfirm = async (enabled) => unwrap(await api.patch('/admin/wallet/settings/auto-confirm-top-up', { enabled }));
export const getAdminBookingDisputes = async () => unwrap(await api.get('/admin/disputes'));
export const resolveAdminBookingDispute = async (bookingId, payload) => unwrap(await api.put(`/admin/disputes/${bookingId}/resolve`, payload));
export const openAdminBookingDisputeChat = async (bookingId) => unwrap(await api.post(`/admin/disputes/${bookingId}/chat`));