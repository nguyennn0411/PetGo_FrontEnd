import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    ArrowDownToLine,
    ArrowUpRight,
    Banknote,
    CheckCircle2,
    Clock3,
    CreditCard,
    History,
    Loader2,
    Lock,
    ReceiptText,
    RefreshCw,
    Send,
    ShieldCheck,
    Sparkles,
    Wallet,
    X,
} from 'lucide-react';
import { createWalletTopUp, getMyWallet, getMyWalletTransactions, requestWalletWithdraw, transferWalletMoney, verifyWalletTopUp } from '../api/wallet';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const statusLabel = {
    ACTIVE: 'Hoạt động',
    INBOUND_LOCKED: 'Khóa nhận/nạp',
    OUTBOUND_LOCKED: 'Khóa chuyển/rút',
    LOCKED: 'Khóa hoàn toàn',
    PAYMENT_PENDING: 'Chờ thanh toán PayOS',
    PENDING_ADMIN_APPROVAL: 'Đã thanh toán - chờ admin duyệt',
    COMPLETED: 'Hoàn tất',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
    FAILED: 'Thất bại/hết hạn',
};

const typeLabel = {
    TOP_UP: 'Nạp ví',
    WITHDRAW: 'Rút tiền',
    TRANSFER: 'Chuyển tiền',
    TRANSFER_IN: 'Nhận tiền',
    TRANSFER_OUT: 'Chuyển tiền',
    PAYMENT: 'Thanh toán',
    REFUND: 'Hoàn tiền',
};

const topUpPresets = [50000, 100000, 200000, 500000, 1000000, 2000000];
const TOP_UP_TTL_SECONDS = 5 * 60;

const actionTabs = [
    { id: 'topup', label: 'Nạp ví', icon: ArrowDownToLine },
    { id: 'transfer', label: 'Chuyển tiền', icon: Send },
    { id: 'withdraw', label: 'Rút tiền', icon: Banknote },
];

export default function WalletPage() {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [activeAction, setActiveAction] = useState('topup');
    const [confirmAction, setConfirmAction] = useState(null);
    const [topUp, setTopUp] = useState({ amount: 50000, note: '' });
    const [transfer, setTransfer] = useState({ recipientAccount: '', amount: 50000, note: '' });
    const [withdraw, setWithdraw] = useState({ amount: 50000, bankName: '', bankAccountNumber: '', bankAccountHolder: '', note: '' });
    const [now, setNow] = useState(Date.now());

    const latestPendingPayOs = useMemo(() => transactions.find((tx) => tx.type === 'TOP_UP' && tx.status === 'PAYMENT_PENDING'), [transactions]);
    const remainingTopUpSeconds = useMemo(() => getTopUpRemainingSeconds(latestPendingPayOs, now), [latestPendingPayOs, now]);
    const isTopUpExpired = Boolean(latestPendingPayOs) && remainingTopUpSeconds <= 0;
    const recentTransactions = useMemo(() => transactions.slice(0, 6), [transactions]);
    const completedCount = useMemo(() => transactions.filter((tx) => tx.status === 'COMPLETED').length, [transactions]);
    const pendingCount = useMemo(() => transactions.filter((tx) => ['PAYMENT_PENDING', 'PENDING_ADMIN_APPROVAL'].includes(tx.status)).length, [transactions]);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [w, txs] = await Promise.all([getMyWallet(), getMyWalletTransactions()]);
            setWallet(w);
            setTransactions(Array.isArray(txs) ? txs : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Không tải được ví.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (latestPendingPayOs) {
            const params = new URLSearchParams(window.location.search);
            if (params.has('orderCode') || params.has('status') || params.has('cancel')) {
                verifyLatest().then(() => {
                    window.history.replaceState({}, document.title, window.location.pathname);
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latestPendingPayOs]);

    const openTopUpConfirm = (event) => {
        event.preventDefault();
        setMessage('');
        setError('');
        if (Number(topUp.amount) < 50000) {
            setError('Số tiền nạp tối thiểu là 50.000đ.');
            return;
        }
        setConfirmAction({
            type: 'topup',
            title: 'Tạo giao dịch nạp ví',
            amount: Number(topUp.amount),
            description: 'PetGo sẽ tạo mã thanh toán PayOS và chuyển bạn sang cổng thanh toán.',
            detail: topUp.note || 'Không có ghi chú',
            confirmLabel: 'Tạo mã nạp',
        });
    };

    const openTransferConfirm = (event) => {
        event.preventDefault();
        setMessage('');
        setError('');
        const recipientAccount = transfer.recipientAccount.trim();
        if (!recipientAccount) {
            setError('Vui lòng nhập UserCode / email / SĐT người nhận.');
            return;
        }
        if (Number(transfer.amount) < 1000) {
            setError('Số tiền chuyển tối thiểu là 1.000đ.');
            return;
        }
        setConfirmAction({
            type: 'transfer',
            title: 'Xác nhận chuyển tiền',
            amount: Number(transfer.amount),
            description: `Chuyển tiền tới ${recipientAccount}. Giao dịch sẽ trừ trực tiếp từ ví PetGo.`,
            detail: transfer.note || 'Không có ghi chú',
            confirmLabel: 'Chuyển tiền',
        });
    };

    const openWithdrawConfirm = (event) => {
        event.preventDefault();
        setMessage('');
        setError('');
        if (Number(withdraw.amount) < 50000) {
            setError('Số tiền rút tối thiểu là 50.000đ.');
            return;
        }
        if (!withdraw.bankName.trim() || !withdraw.bankAccountNumber.trim() || !withdraw.bankAccountHolder.trim()) {
            setError('Vui lòng nhập đủ ngân hàng, số tài khoản và tên chủ tài khoản.');
            return;
        }
        setConfirmAction({
            type: 'withdraw',
            title: 'Tạo yêu cầu rút tiền',
            amount: Number(withdraw.amount),
            description: 'Số tiền sẽ được giữ khỏi số dư khả dụng cho tới khi admin duyệt hoặc từ chối.',
            detail: `${withdraw.bankName} - ${withdraw.bankAccountNumber} - ${withdraw.bankAccountHolder}`,
            confirmLabel: 'Gửi yêu cầu rút',
        });
    };

    const executeConfirmedAction = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        setMessage('');
        setError('');
        try {
            if (confirmAction.type === 'topup') {
                const result = await createWalletTopUp({
                    ...topUp,
                    amount: Number(topUp.amount),
                    returnUrl: `${window.location.origin}/wallet`,
                    cancelUrl: `${window.location.origin}/wallet`,
                });
                setConfirmAction(null);
                if (result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                    return;
                }
                setMessage('Đã tạo yêu cầu nạp ví thành công.');
                await load();
            }

            if (confirmAction.type === 'transfer') {
                await transferWalletMoney({
                    ...transfer,
                    amount: Number(transfer.amount),
                    recipientAccount: transfer.recipientAccount.trim(),
                });
                setConfirmAction(null);
                setMessage('Chuyển tiền thành công.');
                setTransfer({ recipientAccount: '', amount: 50000, note: '' });
                await load();
            }

            if (confirmAction.type === 'withdraw') {
                await requestWalletWithdraw({
                    ...withdraw,
                    amount: Number(withdraw.amount),
                    bankName: withdraw.bankName.trim(),
                    bankAccountNumber: withdraw.bankAccountNumber.trim(),
                    bankAccountHolder: withdraw.bankAccountHolder.trim(),
                });
                setConfirmAction(null);
                setMessage('Đã gửi yêu cầu rút tiền tới admin. Số tiền đã được giữ khỏi số dư khả dụng.');
                setWithdraw({ amount: 50000, bankName: '', bankAccountNumber: '', bankAccountHolder: '', note: '' });
                await load();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Thao tác ví thất bại.');
        } finally {
            setActionLoading(false);
        }
    };

    const verifyLatest = async () => {
        if (!latestPendingPayOs) return;
        setMessage('');
        setError('');
        setActionLoading(true);
        try {
            await verifyWalletTopUp(latestPendingPayOs.id);
            setMessage('Đã đồng bộ trạng thái PayOS.');
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Không đồng bộ được PayOS.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-slate-800">
            <div className="mx-auto max-w-7xl">
                <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl shadow-slate-200/70">
                    <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-8">
                        <div className="relative">
                            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
                            <div className="relative">
                                <div className="mb-8 flex items-center gap-3">
                                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30">
                                        <Wallet className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">PetGo Wallet</p>
                                        <h1 className="text-2xl font-black tracking-tight">Ví thanh toán của bạn</h1>
                                    </div>
                                </div>

                                <p className="text-sm font-bold uppercase tracking-widest text-white/45">Số dư khả dụng</p>
                                <div className="mt-3 flex flex-wrap items-end gap-4">
                                    <h2 className="text-4xl font-black tracking-tight sm:text-6xl">
                                        {loading ? 'Đang tải...' : money(wallet?.balance)}
                                    </h2>
                                    <span className={`mb-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-widest ${wallet?.status === 'ACTIVE' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'}`}>
                                        {statusLabel[wallet?.status] || wallet?.status || '—'}
                                    </span>
                                </div>
                                <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/55">
                                    Dùng ví để đặt lịch, nạp bằng PayOS, chuyển tiền nội bộ và gửi yêu cầu rút tiền về ngân hàng.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            <MetricCard icon={<ReceiptText className="h-5 w-5" />} label="Giao dịch" value={transactions.length} />
                            <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Hoàn tất" value={completedCount} />
                            <MetricCard icon={<Clock3 className="h-5 w-5" />} label="Đang chờ" value={pendingCount} />
                        </div>
                    </div>
                </section>

                {message ? <Feedback tone="success" message={message} /> : null}
                {error ? <Feedback tone="error" message={error} /> : null}

                {latestPendingPayOs ? (
                    <section className={`mt-6 rounded-3xl border p-5 shadow-sm ${isTopUpExpired ? 'border-amber-100 bg-amber-50 text-amber-800' : 'border-orange-100 bg-white text-slate-800'}`}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${isTopUpExpired ? 'bg-amber-100 text-amber-600' : 'bg-orange-50 text-orange-500'}`}>
                                    <Clock3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-black">{isTopUpExpired ? 'Mã nạp gần nhất đã hết hiệu lực' : 'Có giao dịch PayOS đang chờ'}</p>
                                    <p className="mt-1 text-sm font-semibold opacity-75">
                                        {isTopUpExpired
                                            ? 'Nếu bạn đã chuyển tiền, hãy báo admin để được kiểm tra.'
                                            : `Còn ${formatCountdown(remainingTopUpSeconds)} để hoàn tất hoặc đồng bộ lại trạng thái.`}
                                    </p>
                                </div>
                            </div>
                            {!isTopUpExpired ? (
                                <button
                                    onClick={verifyLatest}
                                    disabled={actionLoading}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-500 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    Đồng bộ PayOS
                                </button>
                            ) : null}
                        </div>
                    </section>
                ) : null}

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
                    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Thao tác ví</p>
                                <h2 className="text-2xl font-black tracking-tight text-slate-950">Nạp, chuyển hoặc rút tiền</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
                                {actionTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const active = activeAction === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveAction(tab.id)}
                                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black transition-all ${active ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {activeAction === 'topup' ? (
                            <TopUpForm topUp={topUp} setTopUp={setTopUp} onSubmit={openTopUpConfirm} actionLoading={actionLoading} />
                        ) : null}
                        {activeAction === 'transfer' ? (
                            <TransferForm transfer={transfer} setTransfer={setTransfer} onSubmit={openTransferConfirm} actionLoading={actionLoading} />
                        ) : null}
                        {activeAction === 'withdraw' ? (
                            <WithdrawForm withdraw={withdraw} setWithdraw={setWithdraw} onSubmit={openWithdrawConfirm} actionLoading={actionLoading} />
                        ) : null}
                    </section>

                    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6 lg:self-start">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Gần đây</p>
                                <h2 className="text-xl font-black text-slate-950">Hoạt động ví</h2>
                            </div>
                            <History className="h-5 w-5 text-orange-500" />
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 py-10 text-sm font-bold text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải giao dịch...
                            </div>
                        ) : recentTransactions.length ? (
                            <div className="space-y-3">
                                {recentTransactions.map((tx) => (
                                    <TransactionCard key={tx.id} transaction={tx} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                                <p className="text-sm font-bold text-slate-500">Chưa có giao dịch ví.</p>
                            </div>
                        )}
                    </section>
                </div>

                <section className="mt-6 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Lịch sử</p>
                            <h2 className="text-xl font-black text-slate-950">Tất cả giao dịch</h2>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">{transactions.length} giao dịch</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-4 py-3">Mã</th>
                                    <th className="px-4 py-3">Loại</th>
                                    <th className="px-4 py-3">Số tiền</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Đối tác</th>
                                    <th className="px-4 py-3">Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="px-4 py-8 text-center font-bold text-slate-500">Đang tải...</td></tr>
                                ) : transactions.length ? transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-slate-100 last:border-b-0">
                                        <td className="px-4 py-4 font-black text-slate-900">{tx.transactionCode || `#${tx.id}`}</td>
                                        <td className="px-4 py-4 font-bold text-slate-600">{typeLabel[tx.type] || tx.type}</td>
                                        <td className={`px-4 py-4 font-black ${isMoneyIn(tx) ? 'text-emerald-600' : 'text-slate-900'}`}>{isMoneyIn(tx) ? '+' : '-'}{money(tx.amount)}</td>
                                        <td className="px-4 py-4"><StatusPill status={tx.status} /></td>
                                        <td className="px-4 py-4 font-semibold text-slate-500">{tx.counterpartyUserCode || tx.bankName || '—'}</td>
                                        <td className="px-4 py-4 font-semibold text-slate-500">{tx.createdAt || '—'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="px-4 py-8 text-center font-bold text-slate-500">Chưa có giao dịch.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <ConfirmWalletModal
                action={confirmAction}
                loading={actionLoading}
                onCancel={() => setConfirmAction(null)}
                onConfirm={executeConfirmedAction}
            />
        </main>
    );
}

const MetricCard = ({ icon, label, value }) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-orange-200">{icon}</div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/45">{label}</p>
        <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
);

const Feedback = ({ tone, message }) => (
    <div className={`mt-5 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-bold ${tone === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
        {tone === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
        {message}
    </div>
);

const TopUpForm = ({ topUp, setTopUp, onSubmit, actionLoading }) => (
    <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {topUpPresets.map((amount) => (
                <button
                    key={amount}
                    type="button"
                    onClick={() => setTopUp({ ...topUp, amount })}
                    className={`rounded-2xl border px-3 py-3 text-sm font-black transition-all ${Number(topUp.amount) === amount ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-700 hover:border-orange-200 hover:bg-orange-50/30'}`}
                >
                    {money(amount)}
                </button>
            ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
            <Field label="Số tiền nạp">
                <input className="wallet-input" type="number" min="50000" value={topUp.amount} onChange={(event) => setTopUp({ ...topUp, amount: event.target.value })} placeholder="Nhập số tiền" />
            </Field>
            <Field label="Ghi chú">
                <input className="wallet-input" placeholder="Ví dụ: Nạp để đặt lịch spa" value={topUp.note} onChange={(event) => setTopUp({ ...topUp, note: event.target.value })} />
            </Field>
        </div>
        <SubmitButton icon={<CreditCard className="h-4 w-4" />} loading={actionLoading}>Tạo mã nạp PayOS</SubmitButton>
        <WalletInputStyles />
    </form>
);

const TransferForm = ({ transfer, setTransfer, onSubmit, actionLoading }) => (
    <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Người nhận">
            <input className="wallet-input" placeholder="UserCode / email / SĐT" value={transfer.recipientAccount} onChange={(event) => setTransfer({ ...transfer, recipientAccount: event.target.value })} />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
            <Field label="Số tiền chuyển">
                <input className="wallet-input" type="number" min="1000" value={transfer.amount} onChange={(event) => setTransfer({ ...transfer, amount: event.target.value })} />
            </Field>
            <Field label="Ghi chú">
                <input className="wallet-input" placeholder="Nội dung chuyển tiền" value={transfer.note} onChange={(event) => setTransfer({ ...transfer, note: event.target.value })} />
            </Field>
        </div>
        <SubmitButton icon={<Send className="h-4 w-4" />} loading={actionLoading}>Chuyển tiền</SubmitButton>
        <WalletInputStyles />
    </form>
);

const WithdrawForm = ({ withdraw, setWithdraw, onSubmit, actionLoading }) => (
    <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Số tiền rút">
            <input className="wallet-input" type="number" min="50000" value={withdraw.amount} onChange={(event) => setWithdraw({ ...withdraw, amount: event.target.value })} />
        </Field>
        <div className="grid gap-3 md:grid-cols-3">
            <Field label="Ngân hàng">
                <input className="wallet-input" placeholder="VD: Vietcombank" value={withdraw.bankName} onChange={(event) => setWithdraw({ ...withdraw, bankName: event.target.value })} />
            </Field>
            <Field label="Số tài khoản">
                <input className="wallet-input" placeholder="0123456789" value={withdraw.bankAccountNumber} onChange={(event) => setWithdraw({ ...withdraw, bankAccountNumber: event.target.value })} />
            </Field>
            <Field label="Chủ tài khoản">
                <input className="wallet-input" placeholder="NGUYEN VAN A" value={withdraw.bankAccountHolder} onChange={(event) => setWithdraw({ ...withdraw, bankAccountHolder: event.target.value })} />
            </Field>
        </div>
        <Field label="Ghi chú">
            <input className="wallet-input" placeholder="Ghi chú cho admin nếu cần" value={withdraw.note} onChange={(event) => setWithdraw({ ...withdraw, note: event.target.value })} />
        </Field>
        <SubmitButton icon={<Banknote className="h-4 w-4" />} loading={actionLoading}>Gửi yêu cầu rút</SubmitButton>
        <WalletInputStyles />
    </form>
);

const Field = ({ label, children }) => (
    <label className="block">
        <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        {children}
    </label>
);

const WalletInputStyles = () => (
    <style>{`
        .wallet-input {
            width: 100%;
            height: 3.5rem;
            border-radius: 1rem;
            border: 1px solid rgb(226 232 240);
            background: rgb(248 250 252);
            padding: 0 1rem;
            font-size: 0.875rem;
            font-weight: 800;
            color: rgb(15 23 42);
            outline: none;
            transition: all .18s ease;
        }
        .wallet-input:focus {
            border-color: rgb(251 146 60);
            background: white;
            box-shadow: 0 0 0 4px rgb(255 237 213);
        }
    `}</style>
);

const SubmitButton = ({ icon, loading, children }) => (
    <button
        disabled={loading}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
    >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
    </button>
);

const TransactionCard = ({ transaction }) => (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${isMoneyIn(transaction) ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                {isMoneyIn(transaction) ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
            </div>
            <div>
                <p className="text-sm font-black text-slate-950">{typeLabel[transaction.type] || transaction.type}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{transaction.transactionCode || `#${transaction.id}`}</p>
                <div className="mt-2"><StatusPill status={transaction.status} /></div>
            </div>
        </div>
        <div className="text-right">
            <p className={`text-sm font-black ${isMoneyIn(transaction) ? 'text-emerald-600' : 'text-slate-900'}`}>{isMoneyIn(transaction) ? '+' : '-'}{money(transaction.amount)}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{transaction.createdAt || '—'}</p>
        </div>
    </div>
);

const StatusPill = ({ status }) => (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusClass(status)}`}>
        {statusLabel[status] || status || '—'}
    </span>
);

const ConfirmWalletModal = ({ action, loading, onCancel, onConfirm }) => {
    if (!action) return null;
    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) onCancel();
            }}
        >
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/20">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Xác nhận thao tác ví</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{action.title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-50"
                        aria-label="Đóng modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="space-y-4 p-6">
                    <div className="rounded-2xl bg-slate-950 p-5 text-white">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Số tiền</p>
                        <p className="mt-2 text-4xl font-black text-orange-300">{money(action.amount)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">{action.description}</div>
                    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chi tiết</span>
                        <span className="max-w-[300px] text-right text-sm font-black text-slate-900">{action.detail}</span>
                    </div>
                </div>
                <div className="grid gap-3 border-t border-slate-100 p-6 sm:grid-cols-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="h-12 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:border-slate-300 disabled:opacity-50"
                    >
                        Kiểm tra lại
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        {action.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

function getStatusClass(status) {
    if (status === 'COMPLETED') return 'bg-emerald-100 text-emerald-700';
    if (['PAYMENT_PENDING', 'PENDING_ADMIN_APPROVAL'].includes(status)) return 'bg-amber-100 text-amber-700';
    if (['FAILED', 'REJECTED', 'CANCELLED'].includes(status)) return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
}

function isMoneyIn(tx) {
    return ['TOP_UP', 'TRANSFER_IN', 'REFUND'].includes(tx?.type);
}

function getTopUpRemainingSeconds(tx, now) {
    if (!tx?.createdAt) return TOP_UP_TTL_SECONDS;
    const created = parseVietnameseDateTime(tx.createdAt);
    if (!created) return TOP_UP_TTL_SECONDS;
    return Math.max(0, Math.floor((created.getTime() + TOP_UP_TTL_SECONDS * 1000 - now) / 1000));
}

function parseVietnameseDateTime(value) {
    const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
    if (!match) return null;
    const [, day, month, year, hour, minute] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0);
}

function formatCountdown(seconds) {
    const safe = Math.max(0, Number(seconds || 0));
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
