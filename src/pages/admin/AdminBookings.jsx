import { useContext, useEffect, useMemo, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { AdminDialog, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import {
    getAdminBookings, getAdminBookingDetail,
    confirmAdminBooking, completeAdminBooking,
    cancelAdminBooking, rejectAdminBooking,
} from '../../api/adminBookings';
import '../../styles/AdminDashboard.css';

const statusBadge = (status) => {
    const map = {
        PENDING: ['badge-warning', 'Chờ xác nhận'],
        CONFIRMED: ['badge-info', 'Đã xác nhận'],
        IN_PROGRESS: ['badge-info', 'Đang thực hiện'],
        COMPLETED: ['badge-success', 'Hoàn thành'],
        CANCELLED: ['badge-gray', 'Đã hủy'],
        REJECTED: ['badge-danger', 'Đã từ chối'],
    };
    const [cls, label] = map?.[status] || ['badge-gray', status || 'Không rõ'];
    return <span className={`badge ${cls}`}>{label}</span>;
};

const formatPrice = (amount) => {
    if (amount == null) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const availableActions = (status) => {
    switch (status) {
        case 'PENDING': return ['confirm', 'cancel', 'reject'];
        case 'CONFIRMED': return ['complete', 'cancel'];
        case 'IN_PROGRESS': return ['complete'];
        default: return [];
    }
};

export default function AdminBookings() {
    const setPageTitle = useContext(AdminTitleContext);
    useEffect(() => { setPageTitle('Quản lý đặt lịch'); }, []);

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { showToast } = useAdminToast();
    const { dialog, confirmDialog, closeDialog } = useAdminDialog();

    const loadBookings = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (dateFilter) params.date = dateFilter;
            const data = await getAdminBookings(params);
            setBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không tải được danh sách đặt lịch.') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadBookings(); }, [statusFilter, dateFilter]);

    const openDetail = async (booking) => {
        setSelectedBooking(null);
        setDetailLoading(true);
        try {
            const detail = await getAdminBookingDetail(booking.id);
            setSelectedBooking(detail);
        } catch (e) {
            showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không tải được chi tiết đặt lịch.') });
        } finally {
            setDetailLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        return bookings.filter((b) => {
            if (!keyword) return true;
            return (b.bookingCode?.toLowerCase().includes(keyword)
                || b.userName?.toLowerCase().includes(keyword)
                || b.serviceName?.toLowerCase().includes(keyword)
                || b.areaName?.toLowerCase().includes(keyword));
        });
    }, [bookings, searchTerm]);

    const handleAction = async (action) => {
        if (!selectedBooking) return;
        const id = selectedBooking.id;
        const labels = { confirm: 'xác nhận', complete: 'hoàn tất', cancel: 'hủy', reject: 'từ chối' };
        const label = labels[action] || action;
        const ok = await confirmDialog({
            tone: action === 'cancel' || action === 'reject' ? 'warning' : 'success',
            title: `${action === 'reject' ? 'Từ chối' : action === 'cancel' ? 'Hủy' : action === 'complete' ? 'Hoàn tất' : 'Xác nhận'} đặt lịch?`,
            message: `Bạn có chắc muốn ${label} đặt lịch "${selectedBooking.bookingCode}"?`,
            confirmLabel: action === 'reject' ? 'Từ chối' : action === 'cancel' ? 'Hủy' : action === 'complete' ? 'Hoàn tất' : 'Xác nhận',
            cancelLabel: 'Hủy',
        });
        if (!ok) return;

        try {
            const payload = { adminNote: '' };
            switch (action) {
                case 'confirm':
                    await confirmAdminBooking(id, payload);
                    showToast({ tone: 'success', title: 'Đã xác nhận', message: `Đặt lịch ${selectedBooking.bookingCode} đã được xác nhận.` });
                    break;
                case 'complete':
                    await completeAdminBooking(id, payload);
                    showToast({ tone: 'success', title: 'Đã hoàn tất', message: `Đặt lịch ${selectedBooking.bookingCode} đã hoàn tất.` });
                    break;
                case 'cancel':
                    await cancelAdminBooking(id, payload);
                    showToast({ tone: 'success', title: 'Đã hủy', message: `Đặt lịch ${selectedBooking.bookingCode} đã được hủy.` });
                    break;
                case 'reject':
                    await rejectAdminBooking(id, payload);
                    showToast({ tone: 'success', title: 'Đã từ chối', message: `Đặt lịch ${selectedBooking.bookingCode} đã bị từ chối.` });
                    break;
            }
            setSelectedBooking(null);
            loadBookings();
        } catch (e) {
            showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, `Không thể ${label} đặt lịch.`) });
        }
    };

    const metrics = useMemo(() => ({
        total: bookings.length,
        pending: bookings.filter((b) => b.status === 'PENDING').length,
        confirmed: bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS').length,
        completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    }), [bookings]);

    return (
        <div className="admin-shell">
            <AdminDialog dialog={dialog} onResolve={closeDialog} />
            <div className="metrics metrics-4">
                <div className="metric-card"><div className="metric-label">Tổng đặt lịch</div><div className="metric-value">{metrics.total}</div></div>
                <div className="metric-card"><div className="metric-label">Chờ xác nhận</div><div className="metric-value">{metrics.pending}</div></div>
                <div className="metric-card"><div className="metric-label">Đang thực hiện</div><div className="metric-value">{metrics.confirmed}</div></div>
                <div className="metric-card"><div className="metric-label">Hoàn thành</div><div className="metric-value">{metrics.completed}</div></div>
            </div>

            <div className="search-bar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔍 Tìm mã, khách hàng, dịch vụ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: 300 }}
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ xác nhận</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="IN_PROGRESS">Đang thực hiện</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="CANCELLED">Đã hủy</option>
                        <option value="REJECTED">Đã từ chối</option>
                    </select>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{ maxWidth: 180 }}
                    />
                </div>
                <button className="btn btn-sm" onClick={loadBookings}>↻ Làm mới</button>
            </div>

            <div className="card mb-0">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>ID</th>
                            <th>Mã đặt lịch</th>
                            <th>Khách hàng</th>
                            <th>Dịch vụ</th>
                            <th>Khu vực</th>
                            <th>Ngày</th>
                            <th>Giờ</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: 20 }}>Đang tải...</td></tr>
                        ) : filtered.length > 0 ? (
                            filtered.map((b) => (
                                <tr key={b.id}
                                    onClick={() => openDetail(b)}
                                    style={{ cursor: 'pointer' }}>
                                    <td className="text-tiny">{b.id}</td>
                                    <td className="fw-500">{b.bookingCode || '—'}</td>
                                    <td>
                                        <div className="text-small fw-500">{b.userName || '—'}</div>
                                        {b.userPhone && <div className="text-tiny text-muted">{b.userPhone}</div>}
                                    </td>
                                    <td>{b.serviceName || '—'}</td>
                                    <td>{b.areaName || '—'}</td>
                                    <td>{b.appointmentDate || '—'}</td>
                                    <td>{b.timeSlot || '—'}</td>
                                    <td className="fw-500">{formatPrice(b.totalAmount)}<span className="text-tiny text-muted">₫</span></td>
                                    <td>{statusBadge(b.status)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: 20 }}>Không tìm thấy đặt lịch nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedBooking && (
                <div className="modal-overlay" onClick={() => setSelectedBooking(null)} style={overlayStyle}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <div><div style={{ fontWeight: 700, fontSize: 18 }}>Chi tiết đặt lịch</div>
                                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{selectedBooking.bookingCode}</div>
                            </div>
                            <button onClick={() => setSelectedBooking(null)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {detailLoading ? <div style={{ textAlign: 'center', padding: 20 }}>Đang tải chi tiết...</div> : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <InfoRow label="Trạng thái" value={statusBadge(selectedBooking.status)} />
                                        <InfoRow label="Loại đặt lịch" value={selectedBooking.bookingType === 'LONG' ? 'Dài hạn' : 'Ngắn hạn'} />
                                        <InfoRow label="Khách hàng" value={selectedBooking.userName || '—'} />
                                        <InfoRow label="Số điện thoại" value={selectedBooking.userPhone || '—'} />
                                        <InfoRow label="Dịch vụ" value={selectedBooking.serviceName || '—'} />
                                        <InfoRow label="Khu vực" value={selectedBooking.areaName || '—'} />
                                        <InfoRow label="Ngày hẹn" value={selectedBooking.appointmentDate || '—'} />
                                        <InfoRow label="Khung giờ" value={selectedBooking.timeSlot || '—'} />
                                        <InfoRow label="Giờ bắt đầu" value={selectedBooking.startTime || '—'} />
                                        <InfoRow label="Giờ kết thúc" value={selectedBooking.endTime || '—'} />
                                    </div>
                                    <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Thông tin thanh toán</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <InfoRow label="Phí dịch vụ" value={`${formatPrice(selectedBooking.priceAmount)}₫`} />
                                            <InfoRow label="Phí vận chuyển" value={`${formatPrice(selectedBooking.shippingFee)}₫`} />
                                            {selectedBooking.discountAmount > 0 && <InfoRow label="Giảm giá" value={`-${formatPrice(selectedBooking.discountAmount)}₫`} />}
                                            {selectedBooking.promoCode && <InfoRow label="Mã khuyến mãi" value={selectedBooking.promoCode} />}
                                            <InfoRow label="Tổng tiền" value={<span style={{ fontWeight: 700, color: '#f97316', fontSize: 16 }}>{formatPrice(selectedBooking.totalAmount)}₫</span>} />
                                        </div>
                                    </div>
                                    {selectedBooking.customerNote && (
                                        <div>
                                            <div style={{ fontWeight: 700, marginBottom: 4 }}>Ghi chú khách hàng</div>
                                            <div style={{ background: '#f9f9f9', padding: 12, borderRadius: 8, fontSize: 13 }}>{selectedBooking.customerNote}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Thao tác</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {availableActions(selectedBooking.status).map((action) => {
                                                const btnMap = {
                                                    confirm: { label: 'Xác nhận', cls: 'btn-primary' },
                                                    complete: { label: 'Hoàn tất', cls: 'btn-success' },
                                                    cancel: { label: 'Hủy', cls: 'btn-danger' },
                                                    reject: { label: 'Từ chối', cls: 'btn-danger' },
                                                };
                                                const { label, cls } = btnMap[action] || { label: action, cls: '' };
                                                return (
                                                    <button key={action} className={`btn ${cls}`} onClick={() => handleAction(action)}>
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                            {availableActions(selectedBooking.status).length === 0 && (
                                                <span style={{ color: '#888', fontSize: 13 }}>Không có thao tác nào cho trạng thái này.</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
        </div>
    );
}

const overlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
