import { useEffect, useMemo, useState } from 'react';
import { createWalletTopUp, getMyWallet, getMyWalletTransactions, requestWalletWithdraw, transferWalletMoney, verifyWalletTopUp } from '../api/wallet';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const statusLabel = {
    ACTIVE: 'Hoạt động', INBOUND_LOCKED: 'Khóa nhận/nạp', OUTBOUND_LOCKED: 'Khóa chuyển/rút', LOCKED: 'Khóa hoàn toàn',
    PAYMENT_PENDING: 'Chờ thanh toán PayOS', PENDING_ADMIN_APPROVAL: 'Đã thanh toán - chờ admin duyệt', COMPLETED: 'Hoàn tất', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy'
};

const topUpPresets = [50000, 100000, 200000, 500000, 1000000, 2000000];

const buildQrImageUrl = (tx) => {
    if (!tx?.qrCodeText) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(tx.qrCodeText)}`;
};

export default function WalletPage() {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [topUp, setTopUp] = useState({ amount: 50000, note: '' });
    const [topUpPayment, setTopUpPayment] = useState(null);
    const [transfer, setTransfer] = useState({ recipientAccount: '', amount: 50000, note: '' });
    const [withdraw, setWithdraw] = useState({ amount: 50000, bankName: '', bankAccountNumber: '', bankAccountHolder: '', note: '' });

    const latestPendingPayOs = useMemo(() => transactions.find((tx) => tx.type === 'TOP_UP' && tx.status === 'PAYMENT_PENDING'), [transactions]);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const [w, txs] = await Promise.all([getMyWallet(), getMyWalletTransactions()]);
            setWallet(w); setTransactions(Array.isArray(txs) ? txs : []);
        } catch (err) { setError(err.response?.data?.message || 'Không tải được ví.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const submitTopUp = async (e) => {
        e.preventDefault(); setMessage(''); setError('');
        try {
            const result = await createWalletTopUp({ ...topUp, amount: Number(topUp.amount), returnUrl: window.location.origin + '/wallet', cancelUrl: window.location.origin + '/wallet' });
            setTopUpPayment(result);
            setMessage('Đã tạo thông tin nạp ví. Quét QR bên trái hoặc nhập thông tin thủ công bên phải để thanh toán.');
            await load();
        } catch (err) { setError(err.response?.data?.message || 'Tạo nạp ví thất bại.'); }
    };

    const submitTransfer = async (e) => {
        e.preventDefault(); setMessage(''); setError('');
        try { await transferWalletMoney({ ...transfer, amount: Number(transfer.amount) }); setMessage('Chuyển tiền thành công.'); setTransfer({ recipientAccount: '', amount: 50000, note: '' }); await load(); }
        catch (err) { setError(err.response?.data?.message || 'Chuyển tiền thất bại.'); }
    };

    const submitWithdraw = async (e) => {
        e.preventDefault(); setMessage(''); setError('');
        try { await requestWalletWithdraw({ ...withdraw, amount: Number(withdraw.amount) }); setMessage('Đã gửi yêu cầu rút tiền tới admin.'); setWithdraw({ amount: 50000, bankName: '', bankAccountNumber: '', bankAccountHolder: '', note: '' }); await load(); }
        catch (err) { setError(err.response?.data?.message || 'Tạo yêu cầu rút tiền thất bại.'); }
    };

    const verifyLatest = async () => {
        if (!latestPendingPayOs) return;
        setMessage(''); setError('');
        try { await verifyWalletTopUp(latestPendingPayOs.id); setMessage('Đã đồng bộ trạng thái PayOS.'); await load(); }
        catch (err) { setError(err.response?.data?.message || 'Không đồng bộ được PayOS.'); }
    };

    return <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-amber-400 p-8 text-white shadow-xl">
            <p className="text-sm font-black uppercase tracking-widest opacity-80">Ví PetGo</p>
            <h1 className="mt-2 text-4xl font-black">{loading ? 'Đang tải...' : money(wallet?.balance)}</h1>
            <p className="mt-2 font-bold">Trạng thái: {statusLabel[wallet?.status] || wallet?.status || '—'} • Nạp/rút tối thiểu 50.000đ</p>
        </div>
        {message && <div className="mt-4 rounded-2xl bg-green-50 p-4 font-bold text-green-700">{message}</div>}
        {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}
        {latestPendingPayOs && <button onClick={verifyLatest} className="mt-4 rounded-2xl bg-gray-950 px-5 py-3 font-black text-white">Đồng bộ giao dịch PayOS gần nhất</button>}

        <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <p className="text-sm font-black uppercase tracking-widest text-orange-500">Nạp ví PayOS</p>
                    <h2 className="text-2xl font-black text-gray-950">Chọn mức nạp hoặc nhập số tiền</h2>
                    <p className="mt-1 text-sm font-semibold text-gray-500">Sau khi tạo mã, QR hiển thị bên trái và thông tin nhập thủ công nằm bên phải.</p>
                </div>
                {topUpPayment?.checkoutUrl && <a href={topUpPayment.checkoutUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-gray-950 px-5 py-3 text-center text-sm font-black text-white">Mở trang PayOS</a>}
            </div>
            <form onSubmit={submitTopUp} className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        {topUpPresets.map((amount) => <button key={amount} type="button" onClick={() => setTopUp({ ...topUp, amount })} className={`rounded-2xl border px-3 py-3 text-sm font-black ${Number(topUp.amount) === amount ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-700 hover:border-orange-200'}`}>{money(amount)}</button>)}
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <input className="w-full rounded-2xl border p-3" type="number" min="50000" value={topUp.amount} onChange={e => setTopUp({ ...topUp, amount: e.target.value })} placeholder="Nhập số tiền" />
                        <input className="w-full rounded-2xl border p-3" placeholder="Ghi chú" value={topUp.note} onChange={e => setTopUp({ ...topUp, note: e.target.value })} />
                    </div>
                </div>
                <button className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-white">Tạo mã nạp</button>
            </form>
            {topUpPayment && <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-orange-100 bg-orange-50 p-6 text-center">
                    <p className="text-sm font-black uppercase tracking-widest text-orange-600">Bước 1: Quét QR</p>
                    <div className="mt-4 inline-flex rounded-3xl bg-white p-4 shadow-sm">
                        {buildQrImageUrl(topUpPayment) ? <img src={buildQrImageUrl(topUpPayment)} alt="QR nạp ví PayOS" className="h-64 w-64" /> : <div className="grid h-64 w-64 place-items-center rounded-2xl bg-gray-100 text-sm font-bold text-gray-500">QR sẽ hiển thị sau khi PayOS trả dữ liệu</div>}
                    </div>
                    <p className="mt-4 text-sm font-bold text-gray-600">Quét mã bằng app ngân hàng/ví điện tử. Sau khi thanh toán, bấm đồng bộ hoặc chờ webhook PayOS cập nhật.</p>
                </div>
                <div className="rounded-3xl border bg-white p-6">
                    <p className="text-sm font-black uppercase tracking-widest text-gray-500">Bước 2: Nhập thủ công nếu không quét QR</p>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between gap-4 rounded-2xl bg-gray-50 p-3"><span className="font-bold text-gray-500">Số tiền</span><span className="font-black">{money(topUpPayment.amount)}</span></div>
                        <div className="flex justify-between gap-4 rounded-2xl bg-gray-50 p-3"><span className="font-bold text-gray-500">Mã giao dịch</span><span className="font-black">{topUpPayment.transactionCode}</span></div>
                        <div className="rounded-2xl bg-gray-50 p-3"><p className="font-bold text-gray-500">Nội dung chuyển khoản</p><p className="mt-1 break-all font-black">{topUpPayment.paymentContent || topUpPayment.transactionCode}</p></div>
                        <div className="rounded-2xl bg-amber-50 p-3 font-bold text-amber-700">Lưu ý: nhập đúng số tiền và nội dung để PayOS nhận diện. Nếu không tự động cộng tiền, admin sẽ xác nhận thủ công trước khi số dư thay đổi.</div>
                    </div>
                    <button type="button" onClick={() => verifyWalletTopUp(topUpPayment.id).then(load)} className="mt-4 w-full rounded-2xl bg-gray-950 p-3 font-black text-white">Tôi đã thanh toán - đồng bộ ngay</button>
                </div>
            </div>}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <form onSubmit={submitTransfer} className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Chuyển tiền</h2><input className="mt-4 w-full rounded-2xl border p-3" placeholder="UserCode / email / SĐT" value={transfer.recipientAccount} onChange={e => setTransfer({ ...transfer, recipientAccount: e.target.value })} /><input className="mt-3 w-full rounded-2xl border p-3" type="number" min="1000" value={transfer.amount} onChange={e => setTransfer({ ...transfer, amount: e.target.value })} /><input className="mt-3 w-full rounded-2xl border p-3" placeholder="Ghi chú" value={transfer.note} onChange={e => setTransfer({ ...transfer, note: e.target.value })} /><button className="mt-4 w-full rounded-2xl bg-gray-950 p-3 font-black text-white">Chuyển tiền</button></form>
            <form onSubmit={submitWithdraw} className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Rút tiền</h2><input className="mt-4 w-full rounded-2xl border p-3" type="number" min="50000" value={withdraw.amount} onChange={e => setWithdraw({ ...withdraw, amount: e.target.value })} /><input className="mt-3 w-full rounded-2xl border p-3" placeholder="Ngân hàng" value={withdraw.bankName} onChange={e => setWithdraw({ ...withdraw, bankName: e.target.value })} /><input className="mt-3 w-full rounded-2xl border p-3" placeholder="Số tài khoản" value={withdraw.bankAccountNumber} onChange={e => setWithdraw({ ...withdraw, bankAccountNumber: e.target.value })} /><input className="mt-3 w-full rounded-2xl border p-3" placeholder="Tên chủ tài khoản" value={withdraw.bankAccountHolder} onChange={e => setWithdraw({ ...withdraw, bankAccountHolder: e.target.value })} /><button className="mt-4 w-full rounded-2xl bg-blue-600 p-3 font-black text-white">Gửi yêu cầu rút</button></form>
        </div>
        <section className="mt-8 rounded-3xl border bg-white p-6"><h2 className="text-xl font-black">Lịch sử giao dịch</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th className="p-3">Mã</th><th>Loại</th><th>Số tiền</th><th>Trạng thái</th><th>Đối tác</th><th>Thời gian</th></tr></thead><tbody>{transactions.map(tx => <tr key={tx.id} className="border-t"><td className="p-3 font-bold">{tx.transactionCode}</td><td>{tx.type}</td><td className="font-black">{money(tx.amount)}</td><td>{statusLabel[tx.status] || tx.status}</td><td>{tx.counterpartyUserCode || tx.bankName || '—'}</td><td>{tx.createdAt || '—'}</td></tr>)}</tbody></table></div></section>
    </main>;
}