import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { createWalletTopUp, getMyWallet, getMyWalletTransactions, requestWalletWithdraw, transferWalletMoney, verifyWalletTopUp } from '../api/wallet';
import BankSelector from '../components/BankSelector';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, History, Wallet, AlertCircle, CheckCircle, Banknote, Building2 } from 'lucide-react';

const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
const formatDate = (d) => d || '—';

const statusLabel = {
  ACTIVE: 'Hoạt động', INBOUND_LOCKED: 'Khóa nhận/nạp', OUTBOUND_LOCKED: 'Khóa chuyển/rút', LOCKED: 'Khóa hoàn toàn',
  PAYMENT_PENDING: 'Chờ thanh toán', PENDING_ADMIN_APPROVAL: 'Chờ duyệt', COMPLETED: 'Hoàn tất', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy', FAILED: 'Thất bại',
};

const txTypeIcon = {
  TOP_UP: { icon: ArrowDownLeft, color: '#16a34a', bg: '#f0fdf4', label: 'Nạp tiền' },
  WITHDRAW: { icon: ArrowUpRight, color: '#dc2626', bg: '#fef2f2', label: 'Rút tiền' },
  TRANSFER_IN: { icon: ArrowDownLeft, color: '#2563eb', bg: '#eff6ff', label: 'Nhận chuyển' },
  TRANSFER_OUT: { icon: ArrowUpRight, color: '#dc2626', bg: '#fef2f2', label: 'Chuyển đi' },
  HOLD: { icon: AlertCircle, color: '#d97706', bg: '#fffbeb', label: 'Giữ tiền' },
  RELEASE: { icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', label: 'Giải tỏa' },
  SYSTEM_WITHDRAW: { icon: Banknote, color: '#9333ea', bg: '#faf5ff', label: 'Rút hệ thống' },
};

const topUpPresets = [50000, 100000, 200000, 500000, 1000000, 2000000];
const TOP_UP_TTL_SECONDS = 5 * 60;

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [topUp, setTopUp] = useState({ amount: 50000, note: '' });
  const [transfer, setTransfer] = useState({ recipientAccount: '', amount: 50000, note: '' });
  const [withdraw, setWithdraw] = useState({ amount: 50000, bankName: '', bankAccountNumber: '', bankAccountHolder: '', note: '' });
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState('topup');

  const latestPendingPayOs = useMemo(() => transactions.find(tx => tx.type === 'TOP_UP' && tx.status === 'PAYMENT_PENDING'), [transactions]);
  const remainingTopUpSeconds = useMemo(() => getTopUpRemainingSeconds(latestPendingPayOs, now), [latestPendingPayOs, now]);
  const isTopUpExpired = Boolean(latestPendingPayOs) && remainingTopUpSeconds <= 0;

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [w, txs] = await Promise.all([getMyWallet(), getMyWalletTransactions()]);
      setWallet(w); setTransactions(Array.isArray(txs) ? txs : []);
    } catch (err) { setError(err.response?.data?.message || 'Không tải được ví.'); }
    finally { setLoading(false); }
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
        verifyLatest().then(() => window.history.replaceState({}, document.title, window.location.pathname));
      }
    }
  }, [latestPendingPayOs]);

  const submitTopUp = async (e) => {
    e.preventDefault(); setMessage(''); setError('');
    if (Number(topUp.amount) < 50000) { setError('Số tiền nạp tối thiểu là 50.000₫.'); return; }
    try {
      const result = await createWalletTopUp({ ...topUp, amount: Number(topUp.amount), returnUrl: window.location.origin + '/wallet', cancelUrl: window.location.origin + '/wallet' });
      if (result.checkoutUrl) window.location.href = result.checkoutUrl;
      else { setMessage('Đã tạo yêu cầu nạp ví.'); await load(); }
    } catch (err) { setError(err.response?.data?.message || 'Tạo nạp ví thất bại.'); }
  };

  const submitTransfer = async (e) => {
    e.preventDefault(); setMessage(''); setError('');
    if (!transfer.recipientAccount.trim()) { setError('Vui lòng nhập người nhận.'); return; }
    if (Number(transfer.amount) < 1000) { setError('Số tiền chuyển tối thiểu là 1.000₫.'); return; }
    const ok = await Swal.fire({ icon: 'warning', title: 'Chuyển tiền?', text: `Xác nhận chuyển ${money(transfer.amount)} tới ${transfer.recipientAccount}?`, showCancelButton: true, confirmButtonText: 'Chuyển', cancelButtonText: 'Hủy', confirmButtonColor: '#f97316', reverseButtons: true });
    if (!ok.isConfirmed) return;
    try { await transferWalletMoney({ ...transfer, amount: Number(transfer.amount), recipientAccount: transfer.recipientAccount.trim() }); setMessage('Chuyển tiền thành công.'); setTransfer({ recipientAccount: '', amount: 50000, note: '' }); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Chuyển tiền thất bại.'); }
  };

  const submitWithdraw = async (e) => {
    e.preventDefault(); setMessage(''); setError('');
    if (Number(withdraw.amount) < 50000) { setError('Số tiền rút tối thiểu là 50.000₫.'); return; }
    if (!withdraw.bankName || !withdraw.bankAccountNumber.trim() || !withdraw.bankAccountHolder.trim()) { setError('Vui lòng nhập đủ thông tin ngân hàng.'); return; }
    const ok = await Swal.fire({ icon: 'warning', title: 'Rút tiền?', text: `Xác nhận rút ${money(withdraw.amount)} về ${withdraw.bankAccountHolder} - ${withdraw.bankName}?`, showCancelButton: true, confirmButtonText: 'Rút', cancelButtonText: 'Hủy', confirmButtonColor: '#f97316', reverseButtons: true });
    if (!ok.isConfirmed) return;
    try { await requestWalletWithdraw({ ...withdraw, amount: Number(withdraw.amount), bankName: withdraw.bankName, bankAccountNumber: withdraw.bankAccountNumber.trim(), bankAccountHolder: withdraw.bankAccountHolder.trim() }); setMessage('Đã gửi yêu cầu rút tiền. Số tiền đã được giữ lại.'); setWithdraw({ amount: 50000, bankName: '', bankAccountNumber: '', bankAccountHolder: '', note: '' }); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Tạo yêu cầu rút tiền thất bại.'); }
  };

  const verifyLatest = async () => {
    if (!latestPendingPayOs) return;
    setMessage(''); setError('');
    try { await verifyWalletTopUp(latestPendingPayOs.id); setMessage('Đã đồng bộ trạng thái.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Không đồng bộ được.'); }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 60px', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #f97316, #f59e0b)', borderRadius: 24, padding: '32px 28px',
        color: '#fff', boxShadow: '0 8px 32px rgba(249,115,22,0.25)', marginBottom: 24, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <Wallet size={20} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8 }}>Ví PetGo</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '4px 0 0', letterSpacing: -1 }}>
            {loading ? '...' : money(wallet?.balance)}
          </h1>
          {!loading && Number(wallet?.heldBalance) > 0 && (
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, marginTop: 2 }}>
              Đang giữ: {money(wallet.heldBalance)} · Khả dụng: {money(wallet.balance)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 13, fontWeight: 600, opacity: 0.8 }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20 }}>
              {statusLabel[wallet?.status] || '—'}
            </span>
            <span>Nạp/rút tối thiểu 50.000₫</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {message && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#16a34a' }}><CheckCircle size={18} />{message}</div>}
      {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#dc2626' }}><AlertCircle size={18} />{error}</div>}
      {latestPendingPayOs && isTopUpExpired && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '12px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#d97706' }}><AlertCircle size={18} />Mã nạp gần nhất đã hết hạn. Nếu bạn đã chuyển tiền, hãy liên hệ admin để kiểm tra.</div>}
      {latestPendingPayOs && !isTopUpExpired && <button onClick={verifyLatest} style={{ width: '100%', marginBottom: 16, padding: '12px', border: 'none', borderRadius: 14, background: '#111827', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Đồng bộ trạng thái PayOS</button>}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 14, padding: 3, marginBottom: 20 }}>
        {[
          { key: 'topup', icon: ArrowDownLeft, label: 'Nạp tiền' },
          { key: 'transfer', icon: ArrowLeftRight, label: 'Chuyển tiền' },
          { key: 'withdraw', icon: ArrowUpRight, label: 'Rút tiền' },
          { key: 'history', icon: History, label: 'Lịch sử' },
        ].map(t => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: active ? '#fff' : 'transparent', color: active ? '#f97316' : '#6b7280', transition: 'all 0.2s',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'topup' && (
        <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Nạp ví qua PayOS</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, margin: '0 0 20px' }}>Chọn mệnh giá hoặc nhập số tiền mong muốn</p>
          <form onSubmit={submitTopUp}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {topUpPresets.map(amount => (
                <button key={amount} type="button" onClick={() => setTopUp(prev => ({ ...prev, amount }))}
                  style={{
                    padding: '14px 8px', border: `2px solid ${Number(topUp.amount) === amount ? '#f97316' : '#f3f4f6'}`, borderRadius: 14, cursor: 'pointer',
                    background: Number(topUp.amount) === amount ? '#fff7ed' : '#fff', fontWeight: 800, fontSize: 14, color: Number(topUp.amount) === amount ? '#ea580c' : '#374151', transition: 'all 0.15s',
                  }}>
                  {money(amount)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input type="number" min="50000" value={topUp.amount} onChange={e => setTopUp(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Nhập số tiền"
                style={{ flex: 1, padding: '12px 14px', border: '2px solid #f3f4f6', borderRadius: 14, fontSize: 14, fontWeight: 600, outline: 'none' }} />
              <input value={topUp.note} onChange={e => setTopUp(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Ghi chú (tuỳ chọn)"
                style={{ flex: 1, padding: '12px 14px', border: '2px solid #f3f4f6', borderRadius: 14, fontSize: 14, fontWeight: 500, outline: 'none' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
              Tạo mã nạp
            </button>
          </form>
        </div>
      )}

      {tab === 'transfer' && (
        <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Chuyển tiền</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, margin: '0 0 20px' }}>Chuyển tiền tới người dùng PetGo khác</p>
          <form onSubmit={submitTransfer}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input value={transfer.recipientAccount} onChange={e => setTransfer(prev => ({ ...prev, recipientAccount: e.target.value }))}
                placeholder="UserCode / Email / SĐT người nhận"
                style={{ padding: '12px 14px', border: '2px solid #f3f4f6', borderRadius: 14, fontSize: 14, fontWeight: 500, outline: 'none' }} />
              <input type="number" min="1000" value={transfer.amount} onChange={e => setTransfer(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Số tiền"
                style={{ padding: '12px 14px', border: '2px solid #f3f4f6', borderRadius: 14, fontSize: 14, fontWeight: 600, outline: 'none' }} />
              <input value={transfer.note} onChange={e => setTransfer(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Lời nhắn (tuỳ chọn)"
                style={{ padding: '12px 14px', border: '2px solid #f3f4f6', borderRadius: 14, fontSize: 14, fontWeight: 500, outline: 'none' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: '#111827', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              Chuyển tiền
            </button>
          </form>
        </div>
      )}

      {tab === 'withdraw' && (
        <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Rút tiền</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, margin: '0 0 20px' }}>Yêu cầu rút tiền về tài khoản ngân hàng</p>
          <form onSubmit={submitWithdraw}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input type="number" min="50000" value={withdraw.amount} onChange={e => setWithdraw(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Số tiền rút"
                style={{ padding: '12px 14px', border: '2px solid #f3f4f6', borderRadius: 14, fontSize: 14, fontWeight: 600, outline: 'none' }} />
              <BankSelector value={withdraw.bankName} onChange={val => setWithdraw(prev => ({ ...prev, bankName: val }))} placeholder="Chọn ngân hàng thụ hưởng" />
              <input value={withdraw.bankAccountNumber} onChange={e => setWithdraw(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                placeholder="Số tài khoản"
                style={{ padding: '12px 14px', border: '2px solid #f3f4f6', borderRadius: 14, fontSize: 14, fontWeight: 500, outline: 'none' }} />
              <input value={withdraw.bankAccountHolder} onChange={e => setWithdraw(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                placeholder="Tên chủ tài khoản"
                style={{ padding: '12px 14px', border: '2px solid #f3f4f6', borderRadius: 14, fontSize: 14, fontWeight: 500, outline: 'none' }} />
              <input value={withdraw.note} onChange={e => setWithdraw(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Ghi chú (tuỳ chọn)"
                style={{ padding: '12px 14px', border: '2px solid #f3f4f6', borderRadius: 14, fontSize: 14, fontWeight: 500, outline: 'none' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: '#dc2626', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              Gửi yêu cầu rút
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 20, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Lịch sử giao dịch</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, margin: '0 0 20px' }}>Các giao dịch gần đây của bạn</p>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14, fontWeight: 500 }}>Chưa có giao dịch nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {transactions.map(tx => {
                const meta = txTypeIcon[tx.type] || { icon: History, color: '#6b7280', bg: '#f3f4f6', label: tx.type };
                const Icon = meta.icon;
                const isInflow = ['TOP_UP', 'TRANSFER_IN', 'RELEASE'].includes(tx.type);
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: '#fafafa', border: '1px solid #f3f4f6' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={meta.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{meta.label}</span>
                        <span style={{ fontWeight: 900, fontSize: 14, color: isInflow ? '#16a34a' : '#dc2626' }}>
                          {isInflow ? '+' : '-'}{money(tx.amount)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>
                          {tx.transactionCode} · {tx.bankName || tx.counterpartyUserCode || tx.gatewayName || ''}
                        </span>
                        <span style={{ fontSize: 11, color: '#d1d5db' }}>{formatDate(tx.createdAt)}</span>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: tx.status === 'COMPLETED' ? '#f0fdf4' : tx.status === 'REJECTED' || tx.status === 'FAILED' ? '#fef2f2' : '#fffbeb', color: tx.status === 'COMPLETED' ? '#16a34a' : tx.status === 'REJECTED' || tx.status === 'FAILED' ? '#dc2626' : '#d97706' }}>
                          {statusLabel[tx.status] || tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
