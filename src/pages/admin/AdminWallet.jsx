import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminBookingDisputes, getAdminWalletAutoConfirm, getAdminWalletFailedTopUps, getAdminWalletPendingTransactions, openAdminBookingDisputeChat, resolveAdminBookingDispute, resolveAdminWalletFailedTopUp, reviewAdminWalletTransaction, updateAdminWalletAutoConfirm, updateAdminWalletStatus } from '../../api/wallet';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
const labels = { TOP_UP: 'Nạp ví', WITHDRAW: 'Rút tiền', PENDING_ADMIN_APPROVAL: 'Chờ duyệt', COMPLETED: 'Hoàn tất', REJECTED: 'Từ chối', FAILED: 'Thất bại/hết hạn' };

export default function AdminWallet() {
    const [pending, setPending] = useState([]);
    const [failedTopUps, setFailedTopUps] = useState([]);
    const [bookingDisputes, setBookingDisputes] = useState([]);
    const [autoConfirm, setAutoConfirm] = useState(false);
    const [walletLock, setWalletLock] = useState({ userId: '', status: 'ACTIVE', note: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const [txs, failed, setting, disputes] = await Promise.all([getAdminWalletPendingTransactions(), getAdminWalletFailedTopUps(), getAdminWalletAutoConfirm(), getAdminBookingDisputes()]);
            setPending(Array.isArray(txs) ? txs : []);
            setFailedTopUps(Array.isArray(failed) ? failed : []);
            setAutoConfirm(Boolean(setting?.enabled));
            setBookingDisputes(Array.isArray(disputes) ? disputes : []);
        } catch (err) { setError(err.response?.data?.message || 'Không tải được dữ liệu ví admin.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const toggleAuto = async () => {
        setMessage(''); setError('');
        if (!window.confirm(`${autoConfirm ? 'Tắt' : 'Bật'} tự động cộng tiền nạp ví?`)) return;
        try { const result = await updateAdminWalletAutoConfirm(!autoConfirm); setAutoConfirm(Boolean(result.enabled)); setMessage(`Đã ${result.enabled ? 'bật' : 'tắt'} tự động cộng tiền nạp ví.`); }
        catch (err) { setError(err.response?.data?.message || 'Không cập nhật được cấu hình.'); }
    };

    const review = async (id, action) => {
        const reviewNote = window.prompt(action === 'APPROVE' ? 'Ghi chú duyệt giao dịch' : 'Lý do từ chối', '') || '';
        if (!window.confirm(`${action === 'APPROVE' ? 'Duyệt' : 'Từ chối'} giao dịch ví này?`)) return;
        setMessage(''); setError('');
        try { await reviewAdminWalletTransaction(id, { action, reviewNote }); setMessage('Đã xử lý giao dịch ví.'); await load(); }
        catch (err) { setError(err.response?.data?.message || 'Không xử lý được giao dịch.'); }
    };

    const resolveFailed = async (id, action) => {
        const reviewNote = window.prompt(action === 'APPROVE' ? 'Ghi chú xác minh đã nhận tiền' : 'Lý do đóng khiếu nại', '') || '';
        if (!window.confirm(`${action === 'APPROVE' ? 'Xác nhận đã nhận tiền và cộng ví' : 'Đóng/từ chối khiếu nại'} cho giao dịch nạp thất bại này?`)) return;
        setMessage(''); setError('');
        try { await resolveAdminWalletFailedTopUp(id, { action, reviewNote }); setMessage('Đã xử lý giao dịch nạp ví thất bại.'); await load(); }
        catch (err) { setError(err.response?.data?.message || 'Không xử lý được giao dịch nạp thất bại.'); }
    };

    const submitLock = async (e) => {
        e.preventDefault(); setMessage(''); setError('');
        try { await updateAdminWalletStatus(walletLock.userId, { status: walletLock.status, note: walletLock.note }); setMessage('Đã cập nhật trạng thái ví người dùng.'); setWalletLock({ userId: '', status: 'ACTIVE', note: '' }); }
        catch (err) { setError(err.response?.data?.message || 'Không cập nhật được trạng thái ví.'); }
    };

    const resolveBookingDispute = async (dispute) => {
        const escrow = Number(dispute.escrowAmount || 0);
        const refundToUserAmount = Number(window.prompt(`Hoàn về ví user bao nhiêu? Escrow hiện có ${money(escrow)}`, escrow) || 0);
        const releaseToProviderAmount = Number(window.prompt('Chuyển sang ví provider bao nhiêu?', Math.max(0, escrow - refundToUserAmount)) || 0);
        const reason = window.prompt('Lý do/audit note xử lý dispute', '') || '';
        if (refundToUserAmount < 0 || releaseToProviderAmount < 0) { setError('Số tiền phân bổ không được âm.'); return; }
        if (refundToUserAmount + releaseToProviderAmount > escrow) { setError('Tổng phân bổ không được vượt escrow.'); return; }
        if (!window.confirm(`Xử lý dispute ${dispute.bookingCode}: hoàn user ${money(refundToUserAmount)}, chuyển provider ${money(releaseToProviderAmount)}?`)) return;
        setMessage(''); setError('');
        try { await resolveAdminBookingDispute(dispute.bookingId, { refundToUserAmount, releaseToProviderAmount, reason }); setMessage('Đã xử lý dispute booking.'); await load(); }
        catch (err) { setError(err.response?.data?.message || 'Không xử lý được dispute booking.'); }
    };

    const openBookingDisputeChat = async (dispute) => {
        try {
            const conversation = await openAdminBookingDisputeChat(dispute.bookingId);
            const conversationId = conversation?.conversationId || conversation?.id;
            if (conversationId) window.location.href = `/chat?conversationId=${conversationId}`;
        } catch (err) { setError(err.response?.data?.message || 'Không mở được chat dispute booking.'); }
    };

    return <AdminLayout title="Quản lý ví">
        {message && <div className="mb-4 rounded-2xl bg-green-50 p-4 font-bold text-green-700">{message}</div>}
        {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}
        <div className="metrics">
            <div className="metric-card"><div className="metric-label">Giao dịch chờ duyệt</div><div className="metric-value">{pending.length}</div><div className="metric-change metric-up">Nạp/rút thủ công</div></div>
            <div className="metric-card"><div className="metric-label">Nạp thất bại/khiếu nại</div><div className="metric-value">{failedTopUps.length}</div><div className="metric-change metric-down">Quá hạn 5 phút</div></div>
            <div className="metric-card"><div className="metric-label">Booking dispute</div><div className="metric-value">{bookingDisputes.length}</div><div className="metric-change metric-down">Escrow cần phân bổ</div></div>
            <div className="metric-card"><div className="metric-label">Tự động cộng tiền</div><div className="metric-value">{autoConfirm ? 'ON' : 'OFF'}</div><button className="btn btn-primary" onClick={toggleAuto}>{autoConfirm ? 'Tắt tự động' : 'Bật tự động'}</button></div>
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
            <h3>Khóa/mở ví người dùng</h3>
            <form onSubmit={submitLock} className="search-bar" style={{ marginBottom: 0 }}>
                <input placeholder="User ID" value={walletLock.userId} onChange={e => setWalletLock({ ...walletLock, userId: e.target.value })} />
                <select value={walletLock.status} onChange={e => setWalletLock({ ...walletLock, status: e.target.value })}>
                    <option value="ACTIVE">ACTIVE - hoạt động</option><option value="INBOUND_LOCKED">Khóa nhận/nạp</option><option value="OUTBOUND_LOCKED">Khóa chuyển/rút</option><option value="LOCKED">Khóa hoàn toàn</option>
                </select>
                <button className="btn btn-primary">Cập nhật</button>
            </form>
        </div>
        <div className="card">
            <h3>Danh sách giao dịch chờ admin xác nhận</h3>
            <table><thead><tr><th>Mã</th><th>User</th><th>Loại</th><th>Số tiền</th><th>Ngân hàng/PayOS</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
                {loading ? <tr><td colSpan="7">Đang tải...</td></tr> : pending.length === 0 ? <tr><td colSpan="7">Không có giao dịch chờ duyệt.</td></tr> : pending.map(tx => <tr key={tx.id}><td>{tx.transactionCode}</td><td>{tx.userCode}<br /><span className="text-muted">{tx.userName}</span></td><td>{labels[tx.type] || tx.type}</td><td className="fw-500">{money(tx.amount)}</td><td>{tx.type === 'WITHDRAW' ? `${tx.bankName} - ${tx.bankAccountNumber} - ${tx.bankAccountHolder}` : tx.gatewayName}</td><td><span className="badge badge-info">{labels[tx.status] || tx.status}</span></td><td><button className="btn btn-sm btn-success" onClick={() => review(tx.id, 'APPROVE')}>Duyệt</button> <button className="btn btn-sm btn-danger" onClick={() => review(tx.id, 'REJECT')}>Từ chối</button></td></tr>)}
            </tbody></table>
        </div>
        <div className="card" style={{ marginTop: 24 }}>
            <h3>Booking dispute / escrow cần admin xử lý</h3>
            <table><thead><tr><th>Booking</th><th>User</th><th>Provider</th><th>Dịch vụ</th><th>Lịch hẹn</th><th>Escrow</th><th>Lý do</th><th>Thao tác</th></tr></thead><tbody>
                {loading ? <tr><td colSpan="8">Đang tải...</td></tr> : bookingDisputes.length === 0 ? <tr><td colSpan="8">Không có booking dispute cần xử lý.</td></tr> : bookingDisputes.map(dispute => <tr key={dispute.bookingId}><td>{dispute.bookingCode}<br /><span className="badge badge-danger">{dispute.statusLabel || dispute.status}</span></td><td>#{dispute.customerUserId}<br /><span className="text-muted">{dispute.customerName || '—'}</span></td><td>{dispute.providerName || `#${dispute.providerId}`}</td><td>{dispute.serviceName}</td><td>{dispute.appointmentDate}<br /><span className="text-muted">{dispute.appointmentTime}</span></td><td className="fw-500">{dispute.escrowAmountDisplay || money(dispute.escrowAmount)}</td><td>{dispute.disputeReason || '—'}</td><td><button className="btn btn-sm btn-primary" onClick={() => resolveBookingDispute(dispute)}>Resolve split</button> <button className="btn btn-sm" onClick={() => openBookingDisputeChat(dispute)}>Mở chat</button></td></tr>)}
            </tbody></table>
        </div>
        <div className="card" style={{ marginTop: 24 }}>
            <h3>Nạp ví thất bại / khiếu nại cần kiểm tra</h3>
            <table><thead><tr><th>Mã</th><th>User</th><th>Số tiền</th><th>PayOS</th><th>Ghi chú hệ thống</th><th>Thời gian</th><th>Thao tác</th></tr></thead><tbody>
                {loading ? <tr><td colSpan="7">Đang tải...</td></tr> : failedTopUps.length === 0 ? <tr><td colSpan="7">Không có giao dịch nạp thất bại cần xử lý.</td></tr> : failedTopUps.map(tx => <tr key={tx.id}><td>{tx.transactionCode}</td><td>{tx.userCode}<br /><span className="text-muted">{tx.userName}</span></td><td className="fw-500">{money(tx.amount)}</td><td>{tx.gatewayName}<br /><span className="text-muted">{tx.gatewayTransactionId}</span></td><td>{tx.reviewNote || tx.note || '—'}</td><td>{tx.createdAt || '—'}</td><td><button className="btn btn-sm btn-success" onClick={() => resolveFailed(tx.id, 'APPROVE')}>Đã nhận tiền - cộng ví</button> <button className="btn btn-sm btn-danger" onClick={() => resolveFailed(tx.id, 'REJECT')}>Đóng/Từ chối</button></td></tr>)}
            </tbody></table>
        </div>
    </AdminLayout>;
}