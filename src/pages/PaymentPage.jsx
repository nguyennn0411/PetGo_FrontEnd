import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Loader2,
  Lock,
  PawPrint,
  ShieldCheck,
  Ticket,
  User,
  Wallet,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getPaymentCheckoutContext, checkoutPayment, createPayOsPayment } from '../api/payments';

const formatCurrency = (value, currency = 'VND') => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const PAYMENT_OPTIONS = [
  { id: 'PAYOS', name: 'Thanh toán PayOS (VietQR)', icon: <ShieldCheck className="w-5 h-5 text-orange-500" />, desc: 'Quét mã VietQR chuyển khoản nhanh 24/7' },
  { id: 'COD', name: 'Thanh toán tại spa (COD)', icon: <Banknote className="w-5 h-5 text-gray-500" />, desc: 'Trả tiền khi sử dụng dịch vụ tại cửa hàng' },
  { id: 'MOMO', name: 'Ví MoMo', icon: <Wallet className="w-5 h-5 text-pink-500" />, desc: 'Thanh toán nhanh qua ứng dụng MoMo' },
  { id: 'VNPAY', name: 'VNPay', icon: <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold italic">VN</div>, desc: 'Thanh toán QR / Internet Banking' },
  { id: 'CARD', name: 'Thẻ tín dụng / Ghi nợ', icon: <CreditCard className="w-5 h-5 text-gray-700" />, desc: 'Visa, Mastercard, JCB' },
  { id: 'BANK_TRANSFER', name: 'Chuyển khoản ngân hàng', icon: <ShieldCheck className="w-5 h-5 text-green-600" />, desc: 'Chuyển khoản thủ công vào tài khoản PetGo' },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const bookingId = Number(searchParams.get('bookingId') || location.state?.bookingId || 0);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [promoInput, setPromoInput] = useState('');
  const [checkoutContext, setCheckoutContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoFeedback, setPromoFeedback] = useState('');

  const loadCheckoutContext = async (promoCode = '') => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const firstLoad = !checkoutContext;
    if (firstLoad) setLoading(true);
    else setPromoLoading(true);

    setError('');
    try {
      const data = await getPaymentCheckoutContext({ bookingId, promoCode: promoCode || undefined });
      setCheckoutContext(data);
      setPromoInput(data.promoCode || promoCode || '');
      setPromoFeedback(data.promoMessage || '');
    } catch (err) {
      const message = getErrorMessage(err, 'Không tải được thông tin checkout.');
      if (promoCode) {
        setPromoFeedback('');
      }
      setError(message);
    } finally {
      setLoading(false);
      setPromoLoading(false);
    }
  };

  useEffect(() => {
    loadCheckoutContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const selectedMethod = useMemo(
    () => PAYMENT_OPTIONS.find((item) => item.id === paymentMethod) || PAYMENT_OPTIONS[0],
    [paymentMethod],
  );

  const handleApplyPromo = async () => {
    setError('');
    await loadCheckoutContext(promoInput.trim());
  };

  const handleClearPromo = async () => {
    setPromoInput('');
    setPromoFeedback('');
    setError('');
    await loadCheckoutContext('');
  };

  const handleCheckout = async () => {
    if (!bookingId) return;
    setSubmitting(true);
    setError('');
    try {
      if (paymentMethod === 'PAYOS') {
        const payload = {
          bookingId,
          paymentMethod: 'PAYOS',
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        };
        const data = await createPayOsPayment(payload);
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        } else {
          throw new Error('Không tạo được liên kết thanh toán PayOS.');
        }
      }

      const payment = await checkoutPayment({
        bookingId,
        paymentMethod,
        promoCode: checkoutContext?.promoCode || promoInput.trim() || undefined,
      });

      navigate(`/booking-success?bookingId=${payment.bookingId}&invoiceId=${payment.invoiceId}&paymentId=${payment.paymentId}`, {
        replace: true,
        state: { payment },
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể hoàn tất thanh toán.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[2rem] border border-red-100 shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Thiếu booking để thanh toán</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">PaymentPage cần `bookingId` từ BookingPage sau khi tạo booking thành công.</p>
          <Link to="/my-bookings" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
            Đi tới My Bookings <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Đang tải trang thanh toán</h1>
          <p className="text-sm text-gray-500 font-medium">PetGo đang lấy booking, giá tiền và hóa đơn chờ xử lý.</p>
        </div>
      </div>
    );
  }

  if (!checkoutContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[2rem] border border-red-100 shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Không tải được checkout</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">{error || 'Dữ liệu thanh toán chưa sẵn sàng.'}</p>
          <button onClick={() => loadCheckoutContext()} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-100">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">Pet<span className="text-orange-500">Go</span></span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mr-4">
              <Lock className="w-3.5 h-3.5" /> Secure Checkout
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <h1 className="text-3xl font-black text-gray-900 mb-10 tracking-tight">Thanh toán Booking</h1>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600 font-medium flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-orange-500" /> Chọn phương thức thanh toán
              </h2>
              <div className="space-y-4">
                {PAYMENT_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={`relative p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all flex items-center justify-between group ${paymentMethod === option.id ? 'border-orange-500 bg-orange-50/30' : 'border-gray-50 hover:border-orange-100 bg-white'}`}
                  >
                    <input type="radio" name="payment" className="hidden" checked={paymentMethod === option.id} onChange={() => setPaymentMethod(option.id)} />
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === option.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-400'}`}>
                        {option.icon}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 leading-tight mb-1">{option.name}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter leading-none">{option.desc}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === option.id ? 'border-orange-500 bg-orange-500' : 'border-gray-200'}`}>
                      {paymentMethod === option.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-100 px-5 py-4 text-sm text-gray-600 font-medium">
                Bạn đang chọn: <span className="font-black text-gray-900">{selectedMethod.name}</span>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <Ticket className="w-6 h-6 text-orange-500" /> Mã giảm giá (Promo)
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi của bạn..."
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="flex-1 p-5 bg-gray-50 border-none rounded-2xl font-bold uppercase placeholder:capitalize outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={promoLoading || submitting}
                  className="px-8 py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-orange-500 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  {promoLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
                {checkoutContext.promoCode ? (
                  <button
                    onClick={handleClearPromo}
                    disabled={promoLoading || submitting}
                    className="px-6 py-5 bg-white border border-gray-200 text-gray-700 font-black rounded-2xl hover:border-orange-200 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                  >
                    Bỏ mã
                  </button>
                ) : null}
              </div>
              {promoFeedback ? (
                <p className="mt-4 text-sm font-bold text-green-600 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> {promoFeedback}
                </p>
              ) : null}
            </section>

            <div className="flex flex-col sm:flex-row gap-6">
              <PolicyBox title="Trạng thái booking" desc={`Booking hiện ở trạng thái: ${checkoutContext.bookingStatus}. Checkout chỉ ghi nhận thanh toán/hóa đơn; booking vẫn cần shop duyệt/xếp lịch trước khi được nhận.`} />
              <PolicyBox title="Chính sách hóa đơn" desc="Invoice sẽ được sinh tự động sau checkout. Bạn có thể mở lại từ màn hình thành công hoặc trang booking detail sau này." />
            </div>
          </div>

          <aside className="space-y-8 lg:sticky lg:top-28">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
              <div className="bg-gray-900 p-8 text-white relative">
                <div className="absolute top-4 right-4 opacity-10">
                  <ShieldCheck className="w-16 h-16" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest mb-1">Booking Info</h3>
                <p className="text-xs font-bold text-gray-400">Xem lại thông tin lịch hẹn của bạn</p>
              </div>

              <div className="p-8 space-y-6">
                <SummaryRow label="Mã booking" value={checkoutContext.bookingCode} />
                <SummaryRow label="Nhà cung cấp" value={checkoutContext.providerName} />
                <SummaryRow label="Dịch vụ" value={checkoutContext.serviceName} />
                <SummaryRow label="Thú cưng" value={checkoutContext.petName} />
                <SummaryRow label="Ngày & Giờ" value={`${checkoutContext.appointmentDate} • ${checkoutContext.startTime}`} />
              </div>

              <div className="px-8 pb-8 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <span>Giá gốc</span>
                  <span>{formatCurrency(checkoutContext.subtotalAmount, checkoutContext.currencyCode)}</span>
                </div>
                {!!Number(checkoutContext.discountAmount) && (
                  <div className="flex justify-between items-center text-sm font-bold text-green-600 uppercase tracking-widest">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(checkoutContext.discountAmount, checkoutContext.currencyCode)}</span>
                  </div>
                )}
                {!!Number(checkoutContext.taxAmount) && (
                  <div className="flex justify-between items-center text-sm font-bold text-gray-500 uppercase tracking-widest">
                    <span>Thuế</span>
                    <span>{formatCurrency(checkoutContext.taxAmount, checkoutContext.currencyCode)}</span>
                  </div>
                )}
                <div className="h-px bg-gray-100 my-4"></div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Tổng thanh toán</span>
                    <span className="text-3xl font-black text-orange-600 leading-none">{formatCurrency(checkoutContext.totalAmount, checkoutContext.currencyCode)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={submitting || promoLoading}
                    className="px-6 py-4 bg-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Đang xử lý...' : 'Hoàn tất checkout'}
                  </button>
                </div>
                {checkoutContext.invoiceNumber ? (
                  <button
                    onClick={() => navigate(`/invoice?invoiceId=${checkoutContext.invoiceId}`)}
                    className="w-full mt-3 px-5 py-4 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                  >
                    Xem invoice hiện tại
                  </button>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const SummaryRow = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-sm font-black text-gray-900 leading-relaxed">{value}</p>
  </div>
);

const PolicyBox = ({ title, desc }) => (
  <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
        <ShieldCheck className="w-5 h-5 text-orange-500" />
      </div>
      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{title}</h3>
    </div>
    <p className="text-sm font-medium text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

export default PaymentPage;
