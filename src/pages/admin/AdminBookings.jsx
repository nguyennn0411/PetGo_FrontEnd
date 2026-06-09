import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminBookingDisputes, openAdminBookingDisputeChat, resolveAdminBookingDispute } from '../../api/wallet';

const AdminBookings = () => {
  const [disputes, setDisputes] = useState([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [error, setError] = useState('');
  const [resolveForms, setResolveForms] = useState({});

  const loadDisputes = async () => {
    try {
      setLoadingDisputes(true);
      setError('');
      const data = await getAdminBookingDisputes();
      setDisputes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được dispute/admin review.');
    } finally {
      setLoadingDisputes(false);
    }
  };

  useEffect(() => { loadDisputes(); }, []);

  const updateResolveForm = (bookingId, field, value) => setResolveForms((prev) => ({ ...prev, [bookingId]: { ...(prev[bookingId] || {}), [field]: value } }));

  const resolveDispute = async (bookingId) => {
    const form = resolveForms[bookingId] || {};
    const payload = {
      refundToUserAmount: Number(form.userRefundAmount || 0),
      releaseToProviderAmount: Number(form.providerPayoutAmount || 0),
      reason: form.reason || 'Admin resolve dispute/admin review',
    };
    await resolveAdminBookingDispute(bookingId, payload);
    await loadDisputes();
  };

  const openChat = async (bookingId) => {
    try {
      const conversation = await openAdminBookingDisputeChat(bookingId);
      const conversationId = conversation?.conversationId || conversation?.id;
      if (conversationId) window.location.href = `/chat?conversationId=${conversationId}`;
    } catch (err) {
      setError(err?.response?.data?.message || 'Không mở được chat dispute.');
    }
  };

  const fmt = (num) => num.toLocaleString('vi-VN') + 'đ';

  const statusBadge = (s) => {
    const map = {
      confirmed: ['badge-success', 'Đã xác nhận'],
      pending: ['badge-warning', 'Chờ xác nhận'],
      in_progress: ['badge-info', 'Đang thực hiện'],
      completed: ['badge-gray', 'Hoàn thành'],
      cancelled: ['badge-danger', 'Đã hủy'],
    };
    const [cls, label] = map[s] || ['badge-gray', s];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  return (
    <AdminLayout title="Quản lý booking toàn hệ thống">
      <div className="card mb-0">
        <div className="d-flex justify-between align-center mb-12">
          <div>
            <h3>Dispute / Admin review escrow</h3>
            <p className="text-tiny">Bảng này chỉ hiển thị dữ liệu thật từ backend. Booking thường nên dùng endpoint admin thật trong task riêng.</p>
          </div>
          <button className="btn btn-sm" onClick={loadDisputes}>{loadingDisputes ? 'Đang tải...' : 'Tải lại'}</button>
        </div>
        {error ? <p className="badge badge-danger">{error}</p> : null}
        <table>
          <thead><tr><th>Booking</th><th>User / Provider</th><th>Escrow</th><th>Lý do</th><th>Split xử lý</th><th>Thao tác</th></tr></thead>
          <tbody>
            {disputes.length === 0 ? <tr><td colSpan="6" className="text-center text-tiny">Không có dispute/admin review đang chờ.</td></tr> : disputes.map((item) => {
              const bookingId = item.bookingId || item.id;
              return <tr key={bookingId}>
                <td><strong>{item.bookingCode || bookingId}</strong><br /><span className="text-tiny">{statusBadge((item.status || 'DISPUTED').toLowerCase())}</span></td>
                <td>{item.customerName || item.userName || 'User'}<br /><span className="text-tiny">{item.providerName || 'Provider'}</span></td>
                <td className="text-orange fw-500">{item.escrowAmountDisplay || fmt(Number(item.escrowAmount || item.totalAmount || 0))}</td>
                <td>{item.reason || item.disputeReason || item.adminReviewReason || 'Cần admin xử lý'}</td>
                <td>
                  <div className="d-flex gap-6 flex-wrap">
                    <input style={{ width: 120 }} type="number" placeholder="Refund user" value={resolveForms[bookingId]?.userRefundAmount || ''} onChange={(e) => updateResolveForm(bookingId, 'userRefundAmount', e.target.value)} />
                    <input style={{ width: 120 }} type="number" placeholder="Payout provider" value={resolveForms[bookingId]?.providerPayoutAmount || ''} onChange={(e) => updateResolveForm(bookingId, 'providerPayoutAmount', e.target.value)} />
                    <input style={{ minWidth: 180 }} placeholder="Reason" value={resolveForms[bookingId]?.reason || ''} onChange={(e) => updateResolveForm(bookingId, 'reason', e.target.value)} />
                  </div>
                </td>
                <td><button className="btn btn-sm btn-success" onClick={() => resolveDispute(bookingId)}>Resolve split</button> <button className="btn btn-sm" onClick={() => openChat(bookingId)}>Mở chat</button></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
