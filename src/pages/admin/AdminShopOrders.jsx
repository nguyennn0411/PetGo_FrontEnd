import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { formatVnd, shopApi } from '../../api/shop';

const statuses = ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPING', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

export default function AdminShopOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const load = async () => setOrders(await shopApi.getAdminShopOrders({ status }));
  useEffect(() => { load(); }, []);
  const updateStatus = async (id, next) => { await shopApi.updateAdminShopOrderStatus(id, { status: next, note: 'Admin cập nhật trạng thái' }); load(); };
  const revenue = orders.filter((o) => ['PAID', 'PACKING', 'SHIPPING', 'COMPLETED'].includes(o.status)).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  return (
    <AdminLayout title="Quản lý đơn hàng shop">
      <div className="metrics metrics-3"><div className="metric-card"><div className="metric-label">Tổng đơn</div><div className="metric-value">{orders.length}</div><div className="metric-change metric-up">Đơn PetGo Store</div></div><div className="metric-card"><div className="metric-label">Đang giao</div><div className="metric-value">{orders.filter((o) => o.status === 'SHIPPING').length}</div><div className="metric-change metric-up">Theo dõi vận chuyển</div></div><div className="metric-card"><div className="metric-label">Doanh thu</div><div className="metric-value">{formatVnd(revenue)}</div><div className="metric-change metric-up">Đã ghi nhận</div></div></div>
      <div className="search-bar" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 260 }}><option value="">Tất cả trạng thái</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select><button className="btn btn-primary" onClick={load}>Lọc đơn</button></div>
      <div className="card mb-0"><table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>{orders.map((o) => <tr key={o.id}><td><b>{o.orderCode}</b><br /><span style={{ color: '#888', fontSize: 12 }}>{o.createdAt?.slice?.(0, 10)}</span></td><td><b>{o.receiverName}</b><br /><span style={{ color: '#888', fontSize: 12 }}>{o.receiverPhone}</span></td><td>{o.items?.slice(0, 2).map((i) => <div key={i.id}>{i.productName} x{i.quantity}</div>)}</td><td><b>{formatVnd(o.totalAmount)}</b></td><td>{o.paymentMethod}</td><td><span className="status status-active">{o.status}</span></td><td><select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div>
    </AdminLayout>
  );
}
