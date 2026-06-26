import { useContext, useEffect, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { AdminDialog, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { getAdminBookingDisputes, getAdminSystemWallet, getAdminSystemWalletTransactions, getAdminWalletPendingTransactions, resolveAdminBookingDispute, reviewAdminWalletTransaction, systemWalletWithdraw, updateAdminWalletStatus } from '../../api/wallet';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
const labels = { TOP_UP: 'Nạp ví', WITHDRAW: 'Rút tiền', PENDING_ADMIN_APPROVAL: 'Chờ duyệt', COMPLETED: 'Hoàn tất', REJECTED: 'Từ chối', FAILED: 'Thất bại/hết hạn' };

export default function AdminWallet() {
    const setPageTitle = useContext(AdminTitleContext);
    useEffect(() => { setPageTitle('Quản lý ví'); }, []);
    const [pending, setPending] = useState([]);
    const [bookingDisputes, setBookingDisputes] = useState([]);
    const [systemTxs, setSystemTxs] = useState([]);
    const [systemWallet, setSystemWallet] = useState(null);
    const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '', note: '' });
    const [withdrawing, setWithdrawing] = useState(false);
    const [walletLock, setWalletLock] = useState({ userId: '', status: 'ACTIVE', note: '' });
    const [loading, setLoading] = useState(true);

    const { showToast } = useAdminToast();
    const { dialog, confirmDialog, promptDialog, closeDialog } = useAdminDialog();

    const load = async () => {
        setLoading(true);
        try {
            const [txs, disputes, sysTxs, sysWallet] = await Promise.all([
                getAdminWalletPendingTransactions(),
                getAdminBookingDisputes(),
                getAdminSystemWalletTransactions(),
                getAdminSystemWallet(),
            ]);
            setPending(Array.isArray(txs) ? txs : []);
            setBookingDisputes(Array.isArray(disputes) ? disputes : []);
            setSystemTxs(Array.isArray(sysTxs) ? sysTxs : []);
            setSystemWallet(sysWallet);
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

    /* toggleAuto removed — auto-confirm is always enabled */

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

    const handleSystemWithdraw = async (e) => {
        e.preventDefault();
        const amount = parseFloat(withdrawForm.amount);
        if (!amount || amount < 50000) {
            showToast({ tone: 'error', title: 'Số tiền không hợp lệ', message: 'Số tiền rút tối thiểu là 50.000₫.' });
            return;
        }
        if (!withdrawForm.bankName.trim() || !withdrawForm.bankAccountNumber.trim() || !withdrawForm.bankAccountHolder.trim()) {
            showToast({ tone: 'error', title: 'Thiếu thông tin', message: 'Vui lòng nhập đầy đủ thông tin ngân hàng.' });
            return;
        }
        const accepted = await confirmDialog({
            tone: 'warning',
            title: 'Xác nhận rút tiền ví hệ thống',
            message: `Bạn sắp rút ${money(amount)} từ ví hệ thống về tài khoản ${withdrawForm.bankAccountHolder} - ${withdrawForm.bankName} (${withdrawForm.bankAccountNumber}). Tiếp tục?`,
            confirmLabel: 'Xác nhận rút tiền',
            cancelLabel: 'Hủy',
        });
        if (!accepted) return;
        setWithdrawing(true);
        try {
            await systemWalletWithdraw({
                amount,
                bankName: withdrawForm.bankName.trim(),
                bankAccountNumber: withdrawForm.bankAccountNumber.trim(),
                bankAccountHolder: withdrawForm.bankAccountHolder.trim(),
                note: withdrawForm.note.trim() || null,
            });
            showToast({ tone: 'success', title: 'Rút tiền thành công', message: '' });
            setWithdrawForm({ amount: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '', note: '' });
            await load();
        } catch (err) {
            showToast({ tone: 'error', title: 'Rút tiền thất bại', message: getAdminErrorMessage(err, '') });
        } finally { setWithdrawing(false); }
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
        const releaseToPartnerText = await promptDialog({
            tone: 'info',
            title: 'Giải ngân cho đối tác',
            message: `Nhập số tiền muốn giải ngân cho đối tác (max: ${money(maxRelease)})`,
            defaultValue: String(maxRelease),
            required: true,
            multiline: false,
            confirmLabel: 'Tiếp tục',
            cancelLabel: 'Hủy',
        });
        if (releaseToPartnerText === null) return;
        const releaseToPartnerAmount = Number(releaseToPartnerText || 0);

        if (refundToUserAmount < 0 || releaseToPartnerAmount < 0) {
            showToast({ tone: 'error', title: 'Lỗi số tiền', message: 'Số tiền phân bổ không được âm.' });
            return;
        }
        if (refundToUserAmount + releaseToPartnerAmount > escrow) {
            showToast({ tone: 'error', title: 'Lỗi số tiền', message: 'Tổng phân bổ không được vượt escrow.' });
            return;
        }

        const reason = await promptDialog({
            tone: 'info',
            title: 'Lý do xử lý khiếu nại',
            message: 'Nhập ghi chú/lý do xử lý dispute booking này (bắt buộc):',
            placeholder: 'Ví dụ: Hoàn trả 100% cho khách hàng do dịch vụ không được thực hiện...',
            required: true,
            multiline: true,
            confirmLabel: 'Tiếp tục',
            cancelLabel: 'Hủy',
        });
        if (!reason) return;

        const accepted = await confirmDialog({
            tone: 'warning',
            title: 'Xác nhận phân bổ tiền Booking Dispute',
            message: `Bạn có chắc muốn xử lý khiếu nại booking ${dispute.bookingCode}: hoàn khách hàng ${money(refundToUserAmount)}, chuyển đối tác ${money(releaseToPartnerAmount)}?`,
            confirmLabel: 'Xác nhận phân bổ',
            cancelLabel: 'Hủy',
        });
        if (!accepted) return;

        try {
            await resolveAdminBookingDispute(dispute.bookingId, { refundToUserAmount, releaseToPartnerAmount, reason });
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

    return <>
        <AdminDialog dialog={dialog} onResolve={closeDialog} />

        <div className="metrics">
            <div className="metric-card"><div className="metric-label">Giao dịch chờ duyệt</div><div className="metric-value">{pending.length}</div><div className="metric-change metric-up">Yêu cầu rút tiền</div></div>
            <div className="metric-card"><div className="metric-label">Booking dispute</div><div className="metric-value">{bookingDisputes.length}</div><div className="metric-change metric-down">Escrow cần phân bổ</div></div>
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
            <table><thead><tr><th>Booking</th><th>User</th><th>Khu vực</th><th>Dịch vụ</th><th>Lịch hẹn</th><th>Escrow</th><th>Lý do</th><th>Thao tác</th></tr></thead><tbody>
                {loading ? <tr><td colSpan="8">Đang tải...</td></tr> : bookingDisputes.length === 0 ? <tr><td colSpan="8">Không có booking dispute cần xử lý.</td></tr> : bookingDisputes.map(dispute => <tr key={dispute.bookingId}><td>{dispute.bookingCode}<br /><span className="badge badge-danger">{dispute.statusLabel || dispute.status}</span></td><td>#{dispute.customerUserId}<br /><span className="text-muted">{dispute.customerName || '—'}</span></td><td>{dispute.areaName || (dispute.areaId ? `#${dispute.areaId}` : '—')}</td><td>{dispute.serviceName || '—'}</td><td>{dispute.appointmentDate}<br /><span className="text-muted">{dispute.appointmentTime}</span></td><td className="fw-500">{dispute.escrowAmountDisplay || money(dispute.escrowAmount)}</td><td>{dispute.disputeReason || '—'}</td><td><button className="btn btn-sm btn-primary" onClick={() => resolveBookingDispute(dispute)}>Resolve split</button></td></tr>)}
            </tbody></table>
        </div>
        <div className="card" style={{ marginTop: 24 }}>
            <h3>Ví hệ thống (SYSTEM_WALLET) — nhận tiền giải ngân booking</h3>
            {systemWallet && (
                <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Số dư hiện tại:</span>
                    <span style={{ fontWeight: 900, fontSize: 20, color: 'var(--petgo-orange)' }}>{money(systemWallet.balance)}</span>
                    {Number(systemWallet.heldBalance) > 0 && (
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', width: '100%' }}>
                            Đang giữ: {money(systemWallet.heldBalance)}
                        </span>
                    )}
                </div>
            )}
            <details style={{ marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', padding: '8px 0' }}>Rút tiền từ ví hệ thống</summary>
                <form onSubmit={handleSystemWithdraw} style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input type="number" min="50000" step="1000" placeholder="Số tiền rút (₫)" required
                            value={withdrawForm.amount} onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))}
                            style={{ padding: '10px 12px', border: '1px solid var(--border-secondary)', borderRadius: 10, fontSize: 13, fontWeight: 500 }} />
                        <input type="text" placeholder="Ngân hàng thụ hưởng" required
                            value={withdrawForm.bankName} onChange={e => setWithdrawForm(f => ({ ...f, bankName: e.target.value }))}
                            style={{ padding: '10px 12px', border: '1px solid var(--border-secondary)', borderRadius: 10, fontSize: 13, fontWeight: 500 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input type="text" placeholder="Số tài khoản" required
                            value={withdrawForm.bankAccountNumber} onChange={e => setWithdrawForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
                            style={{ padding: '10px 12px', border: '1px solid var(--border-secondary)', borderRadius: 10, fontSize: 13, fontWeight: 500 }} />
                        <input type="text" placeholder="Chủ tài khoản" required
                            value={withdrawForm.bankAccountHolder} onChange={e => setWithdrawForm(f => ({ ...f, bankAccountHolder: e.target.value }))}
                            style={{ padding: '10px 12px', border: '1px solid var(--border-secondary)', borderRadius: 10, fontSize: 13, fontWeight: 500 }} />
                    </div>
                    <input type="text" placeholder="Ghi chú (tuỳ chọn)"
                        value={withdrawForm.note} onChange={e => setWithdrawForm(f => ({ ...f, note: e.target.value }))}
                        style={{ padding: '10px 12px', border: '1px solid var(--border-secondary)', borderRadius: 10, fontSize: 13, fontWeight: 500 }} />
                    <button type="submit" disabled={withdrawing}
                        className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                        {withdrawing ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
                    </button>
                </form>
            </details>
            <table><thead><tr><th>Mã GD</th><th>Loại</th><th>Số tiền</th><th>Số dư trước</th><th>Số dư sau</th><th>Đối tác</th><th>Ghi chú</th><th>Thời gian</th></tr></thead><tbody>
                {loading ? <tr><td colSpan="8">Đang tải...</td></tr> : systemTxs.length === 0 ? <tr><td colSpan="8">Chưa có giao dịch nào.</td></tr> : systemTxs.map(tx => <tr key={tx.id}><td>{tx.transactionCode}</td><td>{tx.type}</td><td className="fw-500">{money(tx.amount)}</td><td>{tx.balanceBefore != null ? money(tx.balanceBefore) : '—'}</td><td>{tx.balanceAfter != null ? money(tx.balanceAfter) : '—'}</td><td>{tx.counterpartyUserName || tx.counterpartyUserCode || '—'}</td><td>{tx.note || '—'}</td><td>{tx.createdAt || '—'}</td></tr>)}
            </tbody></table>
        </div>
    </>;
}