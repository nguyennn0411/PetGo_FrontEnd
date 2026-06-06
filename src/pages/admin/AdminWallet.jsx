import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminWalletAutoConfirm, getAdminWalletPendingTransactions, reviewAdminWalletTransaction, updateAdminWalletAutoConfirm, updateAdminWalletStatus } from '../../api/wallet';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
const labels = { TOP_UP: 'Nạp ví', WITHDRAW: 'Rút tiền', PENDING_ADMIN_APPROVAL: 'Chờ duyệt', COMPLETED: 'Hoàn tất', REJECTED: 'Từ chối' };

export default function AdminWallet() {
    const [pending, setPending] = useState([]);
    const [autoConfirm, setAutoConfirm] = useState(false);
    const [walletLock, setWalletLock] = useState({ userId: '', status: 'ACTIVE', note: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const [txs, setting] = await Promise.all([getAdminWalletPendingTransactions(), getAdminWalletAutoConfirm()]);
            setPending(Array.isArray(txs) ? txs : []);
            setAutoConfirm(Boolean(setting?.enabled));
        } catch (err) { setError(err.response?.data?.message || 'Không tải được dữ liệu ví admin.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const toggleAuto = async () => {
        setMessage(''); setError('');
        try { const result = await updateAdminWalletAutoConfirm(!autoConfirm); setAutoConfirm(Boolean(result.enabled)); setMessage(`Đã ${result.enabled ? 'bật' : 'tắt'} tự động cộng tiền nạp ví.`); }
        catch (err) { setError(err.response?.data?.message || 'Không cập nhật được cấu hình.'); }
    };

    const review = async (id, action) => {
        const reviewNote = window.prompt(action === 'APPROVE' ? 'Ghi chú duyệt giao dịch' : 'Lý do từ chối', '') || '';
        setMessage(''); setError('');
        try { await reviewAdminWalletTransaction(id, { action, reviewNote }); setMessage('Đã xử lý giao dịch ví.'); await load(); }
        catch (err) { setError(err.response?.data?.message || 'Không xử lý được giao dịch.'); }
    };

    const submitLock = async (e) => {
        e.preventDefault(); setMessage(''); setError('');
        try { await updateAdminWalletStatus(walletLock.userId, { status: walletLock.status, note: walletLock.note }); setMessage('Đã cập nhật trạng thái ví người dùng.'); setWalletLock({ userId: '', status: 'ACTIVE', note: '' }); }
        catch (err) { setError(err.response?.data?.message || 'Không cập nhật được trạng thái ví.'); }
    };

    return <AdminLayout title="Quản lý ví">
        {message && <div className="mb-4 rounded-2xl bg-green-50 p-4 font-bold text-green-700">{message}</div>}
        {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}
        <div className="metrics">
            <div className="metric-card"><div className="metric-label">Giao dịch chờ duyệt</div><div className="metric-value">{pending.length}</div><div className="metric-change metric-up">Nạp/rút thủ công</div></div>
            <div className="metric-card"><div className="metric-label">Tự động cộng tiền</div><div className="metric-value">{autoConfirm ? 'ON' : 'OFF'}</div><button className="btn btn-primary" onClick={toggleAuto}>{autoConfirm ? 'Tắt tự động' : 'Bật tự động'}</button></div>
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
            <h3>Khóa/mở ví người dùng</h3>
            <form onSubmit={submitLock} className="search-bar" style={{ marginBottom: 0 }}>
                <input placeholder="User ID" value={walletLock.userId} onChange={e => setWalletLock({ ...walletLock, userId: e.target.value })} />
                <select value={walletLock.status} onChange={e => setWalletLock({ ...walletLock, status: e.target.value })}>
                    <option value="ACTIVE">ACTIVE - hoạt động</option><option value="INBOUND_LOCKED">Khóa nhận/nạp</option><option value="OUTBOUND_LOCKED">Khóa chuyển/rút</option><option value="LOCKED">Khóa hoàn toàn</option>
                </select>
                <input placeholder="Ghi chú" value={walletLock.note} onChange={e => setWalletLock({ ...walletLock, note: e.target.value })} />
                <button className="btn btn-primary">Cập nhật</button>
            </form>
        </div>
        <div className="card">
            <h3>Danh sách giao dịch chờ admin xác nhận</h3>
            <table><thead><tr><th>Mã</th><th>User</th><th>Loại</th><th>Số tiền</th><th>Ngân hàng/PayOS</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
                {loading ? <tr><td colSpan="7">Đang tải...</td></tr> : pending.length === 0 ? <tr><td colSpan="7">Không có giao dịch chờ duyệt.</td></tr> : pending.map(tx => <tr key={tx.id}><td>{tx.transactionCode}</td><td>{tx.userCode}<br /><span className="text-muted">{tx.userName}</span></td><td>{labels[tx.type] || tx.type}</td><td className="fw-500">{money(tx.amount)}</td><td>{tx.type === 'WITHDRAW' ? `${tx.bankName} - ${tx.bankAccountNumber} - ${tx.bankAccountHolder}` : tx.gatewayName}</td><td><span className="badge badge-info">{labels[tx.status] || tx.status}</span></td><td><button className="btn btn-sm btn-success" onClick={() => review(tx.id, 'APPROVE')}>Duyệt</button> <button className="btn btn-sm btn-danger" onClick={() => review(tx.id, 'REJECT')}>Từ chối</button></td></tr>)}
            </tbody></table>
        </div>
    </AdminLayout>;
}