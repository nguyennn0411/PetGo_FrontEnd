import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Crown,
  Loader2,
  Lock,
  PawPrint,
  Shield,
  ShieldCheck,
  Ticket,
  Wallet,
  Zap,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { checkoutMembership, getMembershipCheckoutContext } from '../api/memberships';
import { createPayOsPayment } from '../api/payments';

const paymentOptions = [
  { id: 'PAYOS', name: 'Thanh toán PayOS (VietQR)', icon: <ShieldCheck className="w-5 h-5 text-orange-500" />, desc: 'Quét mã VietQR chuyển khoản nhanh 24/7' },
  { id: 'MOMO', name: 'Ví MoMo', icon: <Wallet className="w-5 h-5" />, desc: 'Thanh toán nhanh qua App MoMo' },
  { id: 'VNPAY', name: 'VNPay', icon: <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold italic">VN</div>, desc: 'Cổng thanh toán QR Code ngân hàng' },
  { id: 'CARD', name: 'Credit / Debit Card', icon: <CreditCard className="w-5 h-5" />, desc: 'Visa, Mastercard, JCB' },
  { id: 'BANK_TRANSFER', name: 'Chuyển khoản', icon: <Building className="w-5 h-5" />, desc: 'Chuyển khoản ngân hàng trực tiếp' },
];

const faqs = [
  { q: 'Khi nào quyền lợi bắt đầu có hiệu lực?', a: 'Ngay sau khi checkout membership thành công, subscription sẽ được kích hoạt trên backend.' },
  { q: 'Promo code được tính ở đâu?', a: 'Promo được backend kiểm tra ở endpoint checkout-context và checkout để đảm bảo giá trị thanh toán chính xác.' },
  { q: 'Tôi có thể tắt tự động gia hạn sau này không?', a: 'Có. Bạn có thể quay lại trang membership và tắt auto-renew bất cứ lúc nào.' },
];

const currency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const billingCycleLabel = (cycle) => {
  switch ((cycle || '').toUpperCase()) {
    case 'YEARLY':
      return 'năm';
    case 'QUARTERLY':
      return 'quý';
    default:
      return 'tháng';
  }
};

const MembershipPaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { account, loadingAccount } = useContext(AuthContext);

  const planSlug = searchParams.get('plan') || '';
  const [paymentMethod, setPaymentMethod] = useState('PAYOS');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [autoRenew, setAutoRenew] = useState(true);
  const [loading, setLoading] = useState(true);
  const [checkouting, setCheckouting] = useState(false);
  const [error, setError] = useState('');
  const [context, setContext] = useState(null);

  const loadContext = async (promoCode) => {
    if (!planSlug) {
      setError('Thiếu plan trong URL. Vui lòng quay lại trang membership để chọn gói.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await getMembershipCheckoutContext({
        planSlug,
        promoCode: promoCode || undefined,
      });
      setContext(response?.result || response);
      if (response?.autoRenewDefault !== undefined) {
        setAutoRenew(Boolean(response.autoRenewDefault));
      }
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Không thể tải dữ liệu checkout membership.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingAccount && account) {
      loadContext(appliedPromoCode);
    } else if (!loadingAccount) {
      setLoading(false);
    }
  }, [loadingAccount, account, planSlug, appliedPromoCode]);

  const selectedPlan = context?.plan;

  const handleApplyPromo = () => {
    setAppliedPromoCode(promoInput.trim().toUpperCase());
  };

  const handleCheckout = async () => {
    try {
      setCheckouting(true);
      setError('');
      const response = await checkoutMembership({
        planSlug,
        paymentMethod,
        promoCode: appliedPromoCode || undefined,
        autoRenew,
      });
      const result = response?.result || response;

      if (paymentMethod === 'PAYOS') {
        const payOsPayload = {
          subscriptionId: result.subscriptionId,
          paymentMethod: 'PAYOS',
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        };
        const payOsData = await createPayOsPayment(payOsPayload);
        if (payOsData.checkoutUrl) {
          window.location.href = payOsData.checkoutUrl;
          return;
        } else {
          throw new Error('Không tạo được liên kết thanh toán PayOS.');
        }
      }

      navigate(`/membership?checkout=success&subscriptionId=${result.subscriptionId}`);
    } catch (checkoutError) {
      setError(checkoutError?.response?.data?.message || 'Thanh toán membership thất bại.');
    } finally {
      setCheckouting(false);
    }
  };

  const ctaDisabled = !selectedPlan || checkouting;

  if (loadingAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-white text-center space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-3">Bạn cần đăng nhập</h1>
            <p className="text-gray-500 font-medium">Đăng nhập để thanh toán và kích hoạt membership của bạn.</p>
          </div>
          <button onClick={() => navigate('/login')} className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-blue-600 transition-all">
            Đi tới đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Pet<span className="text-orange-500">Go</span></span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <Step text="Chọn gói" completed step={1} />
            <div className="w-8 h-px bg-gray-200"></div>
            <Step text="Thanh toán" active step={2} />
            <div className="w-8 h-px bg-gray-200"></div>
            <Step text="Hoàn tất" step={3} />
          </div>

          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">Complete Your Membership Payment</h1>
          <p className="text-gray-500 font-medium">Trang này lấy giá gói, promo, tổng tiền và checkout trực tiếp từ backend membership.</p>
        </div>

        {error && (
          <div className="mb-8 rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-red-600 font-bold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-blue-600 p-8 text-white relative">
                  <div className="absolute top-4 right-4 opacity-20">
                    <Crown className="w-20 h-20 rotate-12" />
                  </div>
                  {selectedPlan?.popular && (
                    <div className="inline-block bg-white/20 backdrop-blur-md text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest mb-4 border border-white/20">
                      Most Popular Plan
                    </div>
                  )}
                  <h3 className="text-2xl font-black mb-1">{selectedPlan?.name || 'Membership Plan'}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{currency(selectedPlan?.priceAmount)}</span>
                    <span className="text-sm font-bold opacity-70">/ {billingCycleLabel(selectedPlan?.billingCycle)}</span>
                  </div>
                </div>

                <div className="p-8">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Quyền lợi của bạn</h4>
                  <ul className="space-y-4 mb-8">
                    {(selectedPlan?.features || []).map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="mt-0.5 w-5 h-5 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-blue-600 stroke-[4px]" />
                        </div>
                        <span className="text-sm font-bold text-gray-600 leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-6 border-t border-gray-50 space-y-3">
                    <SummaryLine label="Tự động gia hạn" value={autoRenew ? 'Đang bật' : 'Đang tắt'} />
                    {context?.currentSubscription?.planName && (
                      <SummaryLine label="Gói hiện tại" value={context.currentSubscription.planName} />
                    )}
                  </div>
                </div>
              </section>

              <div className="p-8 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <ShieldCheck className="w-24 h-24" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest leading-none">Secure Checkout</p>
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">
                    Giao dịch membership được backend tạo subscription, invoice và payment record thật để bạn có thể theo dõi về sau.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8">
              <section className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-orange-500" /> Promo Code / Voucher
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Enter promo code (Thử: PETGO20)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="flex-1 p-5 bg-gray-50 border-none rounded-2xl font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all placeholder:capitalize"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-10 py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-orange-500 transition-all uppercase tracking-widest text-xs"
                  >
                    Apply
                  </button>
                </div>
                {context?.promoCode && (
                  <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> {context?.promoMessage || `Đã áp dụng ${context.promoCode}`}
                  </div>
                )}
              </section>

              <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 mb-8">Choose Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {paymentOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-4 ${paymentMethod === option.id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-50 bg-white hover:border-gray-200'}`}
                    >
                      <input type="radio" name="payment" className="hidden" checked={paymentMethod === option.id} onChange={() => setPaymentMethod(option.id)} />
                      <div className="flex justify-between items-start">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === option.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {option.icon}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === option.id ? 'border-blue-600 bg-blue-600' : 'border-gray-200'}`}>
                          {paymentMethod === option.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{option.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer">
                  <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-bold text-gray-700">Tự động gia hạn gói membership ở kỳ tiếp theo</span>
                </label>
              </section>

              <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-xl relative overflow-hidden">
                <h3 className="text-xl font-black text-gray-900 mb-8">Billing Summary</h3>

                <div className="space-y-4 mb-10">
                  <SummaryRow label="Membership Fee" value={currency(context?.subtotalAmount)} />
                  <SummaryRow label="Discount" value={`-${currency(context?.discountAmount)}`} isDiscount={Number(context?.discountAmount || 0) > 0} />
                  <SummaryRow label="VAT (0%)" value={currency(context?.taxAmount)} />
                  <div className="h-px bg-gray-100 my-4"></div>
                  <div className="flex justify-between items-end gap-4 flex-wrap">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Total Payment</span>
                      <span className="text-4xl font-black text-blue-600 tracking-tighter leading-none">{currency(context?.totalAmount)}</span>
                    </div>
                    <div className="text-right hidden sm:block">
                      {context?.promoCode ? (
                        <p className="text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full mb-1">
                          Promo: {context.promoCode}
                        </p>
                      ) : null}
                      <p className="text-[9px] font-bold text-gray-400">Thanh toán membership ngay bây giờ</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Checkbox label="Tôi đồng ý với các Điều khoản & Chính sách của PetGo Membership" defaultChecked />
                    <Checkbox label="Tôi xác nhận thông tin gói và phương thức thanh toán là chính xác" defaultChecked />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => navigate('/membership')}
                      className="flex-1 py-5 border-2 border-gray-100 text-gray-400 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Plans
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={ctaDisabled}
                      className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 group disabled:opacity-60 disabled:hover:scale-100"
                    >
                      {checkouting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pay Now'}
                      {!checkouting && <Zap className="w-4 h-4 fill-current group-hover:animate-pulse" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">
                    Bạn có thể tắt tự động gia hạn bất cứ lúc nào ở trang Membership.
                  </p>
                </div>
              </section>
            </div>
          </div>
        )}

        <section className="mt-20 max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-black text-gray-900 mb-8 text-center uppercase tracking-tight">Thanh toán an tâm hơn</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === index ? null : index)} className="w-full p-6 flex justify-between items-center text-left group">
                  <span className="font-black text-gray-700 text-sm group-hover:text-blue-600 transition-colors leading-relaxed">{faq.q}</span>
                  {activeFaq === index ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-gray-500 font-medium leading-relaxed italic border-l-4 border-blue-600 pl-4 bg-blue-50/50 py-3 rounded-r-xl">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

const Step = ({ text, active, completed, step = 1 }) => (
  <div className="flex items-center gap-2">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${completed ? 'bg-green-100 text-green-600' : active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
      {completed ? <Check className="w-4 h-4" /> : step}
    </div>
    <span className={`text-xs font-black uppercase tracking-widest ${active ? 'text-blue-600' : completed ? 'text-green-600' : 'text-gray-400'}`}>{text}</span>
  </div>
);

const SummaryRow = ({ label, value, isDiscount = false }) => (
  <div className="flex justify-between items-center text-sm font-bold">
    <span className="text-gray-500 uppercase tracking-widest text-[10px]">{label}</span>
    <span className={isDiscount ? 'text-green-600' : 'text-gray-900'}>{value}</span>
  </div>
);

const SummaryLine = ({ label, value }) => (
  <div className="flex justify-between text-xs font-bold gap-3">
    <span className="text-gray-400 uppercase tracking-tighter">{label}</span>
    <span className="text-gray-900 text-right">{value}</span>
  </div>
);

const Checkbox = ({ label, defaultChecked }) => (
  <label className="flex items-start gap-3 cursor-pointer">
    <input type="checkbox" defaultChecked={defaultChecked} className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
    <span className="text-sm font-medium text-gray-600">{label}</span>
  </label>
);

export default MembershipPaymentPage;
