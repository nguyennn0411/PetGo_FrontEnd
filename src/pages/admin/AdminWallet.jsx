import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { AdminDialog, AdminToastStack, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { getAdminBookingDisputes, getAdminWalletAutoConfirm, getAdminWalletFailedTopUps, getAdminWalletPendingTransactions, openAdminBookingDisputeChat, resolveAdminBookingDispute, resolveAdminWalletFailedTopUp, reviewAdminWalletTransaction, updateAdminWalletAutoConfirm, updateAdminWalletStatus } from '../../api/wallet';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
const labels = { TOP_UP: 'Nạp ví', WITHDRAW: 'Rút tiền', PENDING_ADMIN_APPROVAL: 'Chờ duyệt', COMPLETED: 'Hoàn tất', REJECTED: 'Từ chối', FAILED: 'Thất bại/hết hạn' };

export default function AdminWallet() {
    const [pending, setPending] = useState([]);
    const [failedTopUps, setFailedTopUps] = useState([]);
    const [bookingDisputes, setBookingDisputes] = useState([]);
    const [autoConfirm, setAutoConfirm] = useState(false);
    const [walletLock, setWalletLock] = useState({ userId: '', status: 'ACTIVE', note: '' });
    const [loading, setLoading] = useState(true);
    
    const { toasts, showToast, dismissToast } = useAdminToast();
    const { dialog, confirmDialog, promptDialog, closeDialog } = useAdminDialog();

    const load = async () => {
        setLoading(true);
        try {
            const [txs, failed, setting, disputes] = await Promise.all([getAdminWalletPendingTransactions(), getAdminWalletFailedTopUps(), getAdminWalletAutoConfirm(), getAdminBookingDisputes()]);
            setPending(Array.isArray(txs) ? txs : []);
            setFailedTopUps(Array.isArray(failed) ? failed : []);
            setAutoConfirm(Boolean(setting?.enabled));
            setBookingDisputes(Array.isArray(disputes) ? disputes : []);
        } catch (err) {
            showToast({
                tone: 'error',
                title: 'Lỗi tải dữ liệu',
                message: getAdminErrorMessage(err, 'Không tải được dữ liệu ví admin.'),
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const toggleAuto = async () => {
        const nextState = !autoConfirm;
        const accepted = await confirmDialog({
            tone: nextState ? 'success' : 'warning',
            title: nextState ? 'Bật tự động cộng tiền?' : 'Tắt tự động cộng tiền?',
            message: `Bạn có chắc muốn ${nextState ? 'bật' : 'tắt'} tự động cộng tiền nạp ví?`,
            confirmLabel: nextState ? 'Bật tự động' : 'Tắt tự động',
            cancelLabel: 'Hủy',
        });
        if (!accepted) return;
        try {
            const result = await updateAdminWalletAutoConfirm(nextState);
            setAutoConfirm(Boolean(result.enabled));
            showToast({
                tone: 'success',
                title: 'Cập nhật cấu hình',
                message: `Đã ${result.enabled ? 'bật' : 'tắt'} tự động cộng tiền nạp ví thành công.`,
            });
        } catch (err) {
            showToast({
                tone: 'error',
                title: 'Lỗi cấu hình',
                message: getAdminErrorMessage(err, 'Không cập nhật được cấu hình.'),
            });
        }
    };

    const review = async (id, action) => {
        const isApprove = action === 'APPROVE';
        const tone = isApprove ? 'success' : 'error';
        const title = isApprove ? 'Duyệt giao dịch ví' : 'Từ chối giao dịch ví';
        const reviewNote = await promptDialog({
            tone,
            title,
            message: isApprove ? 'Nhập ghi chú duyệt giao dịch (tuỳ chọn):' : 'Nhập lý do từ chối giao dịch (bắt buộc):',
            placeholder: isApprove ? 'Nhập ghi chú...' : 'Ví dụ: Sai thông tin chuyển khoản...',
            required: !isApprove,
            confirmLabel: isApprove ? 'Duyệt giao dịch' : 'Từ chối giao dịch',
            cancelLabel: 'Hủy',
        });
        if (reviewNote === null) return;

        try {
            await reviewAdminWalletTransaction(id, { action, reviewNote });
            showToast({
                tone: 'success',
                title: isApprove ? 'Đã duyệt giao dịch' : 'Đã từ chối giao dịch',
                message: 'Giao dịch ví đã được xử lý thành công.',
            });
            await load();
        } catch (err) {
            showToast({
                tone: 'error',
                title: 'Xử lý thất bại',
                message: getAdminErrorMessage(err, 'Không xử lý được giao dịch.'),
            });
        }
    };

    const resolveFailed = async (id, action) => {
        const isApprove = action === 'APPROVE';
        const tone = isApprove ? 'success' : 'error';
        const title = isApprove ? 'Xác nhận nạp ví' : 'Từ chối khiếu nại nạp';
        const reviewNote = await promptDialog({
            tone,
            title,
            message: isApprove ? 'Nhập ghi chú xác minh đã nhận tiền (tuỳ chọn):' : 'Nhập lý do đóng/từ chối khiếu nại (bắt buộc):',
            placeholder: isApprove ? 'Ghi chú xác minh...' : 'Lý do từ chối...',
            required: !isApprove,
            confirmLabel: isApprove ? 'Xác nhận' : 'Từ chối',
            cancelLabel: 'Hủy',
        });
        if (reviewNote === null) return;

        try {
            await resolveAdminWalletFailedTopUp(id, { action, reviewNote });
            showToast({
                tone: 'success',
                title: 'Đã cập nhật giao dịch',
                message: 'Giao dịch nạp ví thất bại đã được xử lý thành công.',
            });
            await load();
        } catch (err) {
            showToast({
                tone: 'error',
                title: 'Xử lý thất bại',
                message: getAdminErrorMessage(err, 'Không xử lý được giao dịch nạp thất bại.'),
            });
        }
    };

    const submitLock = async (e) => {
        e.preventDefault();
        if (!walletLock.userId.trim()) {
            showToast({
                tone: 'warning',
                title: 'Thiếu thông tin',
                message: 'Vui lòng nhập User ID.',
            });
            return;
        }
        const accepted = await confirmDialog({
            tone: 'warning',
            title: 'Cập nhật trạng thái ví?',
            message: `Bạn có chắc muốn chuyển trạng thái ví của user #${walletLock.userId} sang ${walletLock.status}?`,
            confirmLabel: 'Cập nhật',
            cancelLabel: 'Hủy',
        });
        if (!accepted) return;

        try {
            await updateAdminWalletStatus(walletLock.userId, { status: walletLock.status, note: walletLock.note });
            showToast({
                tone: 'success',
                title: 'Cập nhật thành công',
                message: 'Đã cập nhật trạng thái ví người dùng.',
            });
            setWalletLock({ userId: '', status: 'ACTIVE', note: '' });
        } catch (err) {
            showToast({
                tone: 'error',
                title: 'Cập nhật thất bại',
                message: getAdminErrorMessage(err, 'Không cập nhật được trạng thái ví.'),
            });
        }
    };

    const resolveBookingDispute = async (dispute) => {
        const escrow = Number(dispute.escrowAmount || 0);
        
        const refundToUserText = await promptDialog({
            tone: 'warning',
            title: 'Hoàn tiền cho khách hàng',
            message: `Nhập số tiền muốn hoàn về ví khách hàng. Escrow hiện có: ${money(escrow)}`,
            defaultValue: String(escrow),
            required: true,
            multiline: false,
            confirmLabel: 'Tiếp tục',
            cancelLabel: 'Hủy',
        });
        if (refundToUserText === null) return;
        const refundToUserAmount = Number(refundToUserText || 0);

        const maxRelease = Math.max(0, escrow - refundToUserAmount);
        const releaseToProviderText = await promptDialog({
            tone: 'info',
            title: 'Giải ngân cho nhà cung cấp',
            message: `Nhập số tiền muốn giải ngân cho đối tác (max: ${money(maxRelease)})`,
            defaultValue: String(maxRelease),
            required: true,
            multiline: false,
            confirmLabel: 'Tiếp tục',
            cancelLabel: 'Hủy',
        });
        if (releaseToProviderText === null) return;
        const releaseToProviderAmount = Number(releaseToProviderText || 0);

        if (refundToUserAmount < 0 || releaseToProviderAmount < 0) {
            showToast({ tone: 'error', title: 'Lỗi số tiền', message: 'Số tiền phân bổ không được âm.' });
            return;
        }
        if (refundToUserAmount + releaseToProviderAmount > escrow) {
            showToast({ tone: 'error', title: 'Lỗi số tiền', message: 'Tổng phân bổ không được vượt escrow.' });
            return;
        }

        const reason = await promptDialog({
            tone: 'info',
            title: 'Lý do xử lý khiếu nại',
            message: 'Nhập ghi chú/lý do xử lý dispute booking này (bắt buộc):',
            placeholder: 'Ví dụ: Hoàn trả 100% cho khách hàng do nhà cung cấp không phục vụ...',
            required: true,
            multiline: true,
            confirmLabel: 'Tiếp tục',
            cancelLabel: 'Hủy',
        });
        if (!reason) return;

        const accepted = await confirmDialog({
            tone: 'warning',
            title: 'Xác nhận phân bổ tiền Booking Dispute',
            message: `Bạn có chắc muốn xử lý khiếu nại booking ${dispute.bookingCode}: hoàn khách hàng ${money(refundToUserAmount)}, chuyển đối tác ${money(releaseToProviderAmount)}?`,
            confirmLabel: 'Xác nhận phân bổ',
            cancelLabel: 'Hủy',
        });
        if (!accepted) return;

        try {
            await resolveAdminBookingDispute(dispute.bookingId, { refundToUserAmount, releaseToProviderAmount, reason });
            showToast({
                tone: 'success',
                title: 'Đã xử lý khiếu nại',
                message: 'Đã phân bổ tiền ký quỹ booking thành công.',
            });
            await load();
        } catch (err) {
            showToast({
                tone: 'error',
                title: 'Xử lý thất bại',
                message: getAdminErrorMessage(err, 'Không xử lý được dispute booking.'),
            });
        }
    };

    const openBookingDisputeChat = async (dispute) => {
        try {
            const conversation = await openAdminBookingDisputeChat(dispute.bookingId);
            const conversationId = conversation?.conversationId || conversation?.id;
            if (conversationId) window.location.href = `/chat?conversationId=${conversationId}`;
        } catch (err) {
            showToast({
                tone: 'error',
                title: 'Lỗi mở chat',
                message: getAdminErrorMessage(err, 'Không mở được chat dispute booking.'),
            });
        }
    };

    return <AdminLayout title="Quản lý ví">
        <AdminToastStack toasts={toasts} onDismiss={dismissToast} />
        <AdminDialog dialog={dialog} onResolve={closeDialog} />

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