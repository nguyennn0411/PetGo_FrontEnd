import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  Headphones,
  Loader2,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { cancelMembershipAutoRenew, getMembershipPlans, getMyMembership } from '../api/memberships';

const benefits = [
  {
    title: 'Giảm giá dịch vụ',
    desc: 'Tiết kiệm cho spa, grooming, clinic và nhiều dịch vụ đối tác khác.',
    icon: <Tag className="w-6 h-6" />,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    title: 'Ưu tiên đặt lịch',
    desc: 'Dễ chốt slot giờ cao điểm hơn và hạn chế tình trạng hết chỗ.',
    icon: <Calendar className="w-6 h-6" />,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Voucher hàng tháng',
    desc: 'Nhận thêm giá trị sử dụng hàng tháng dành riêng cho hội viên.',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Nhắc lịch cho bé',
    desc: 'Theo dõi grooming, tiêm phòng và các cột mốc định kỳ dễ hơn.',
    icon: <Bell className="w-6 h-6" />,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Hỗ trợ ưu tiên',
    desc: 'Kênh hỗ trợ nhanh hơn cho các tình huống cần xử lý sớm.',
    icon: <Headphones className="w-6 h-6" />,
    color: 'bg-red-100 text-red-600',
  },
  {
    title: 'Quyền lợi đáng tin cậy',
    desc: 'Thông tin hội viên và mức ưu đãi được đồng bộ trực tiếp từ hệ thống.',
    icon: <ShieldCheck className="w-6 h-6" />,
    color: 'bg-yellow-100 text-yellow-600',
  },
];

const faqs = [
  {
    q: 'Làm thế nào để tôi hủy tự động gia hạn?',
    a: 'Bạn có thể tắt auto-renew ngay trên trang membership. Quyền lợi hiện tại vẫn giữ đến hết kỳ đã thanh toán.',
  },
  {
    q: 'Tôi có thể nâng cấp gói sau này không?',
    a: 'Có. Khi checkout gói mới, hệ thống sẽ chuyển gói hiện tại sang trạng thái không tự động gia hạn và kích hoạt gói mới.',
  },
  {
    q: 'Promo code có áp dụng cho membership không?',
    a: 'Có, nếu promo được cấu hình cho MEMBERSHIP hoặc BOTH trên hệ thống backend.',
  },
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

const statusLabel = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'Đang hoạt động';
    case 'EXPIRED':
      return 'Đã hết hạn';
    case 'CANCELLED':
      return 'Đã hủy';
    case 'PAST_DUE':
      return 'Quá hạn';
    case 'PENDING_PAYMENT':
      return 'Chờ thanh toán';
    default:
      return status || 'Không xác định';
  }
};

const MembershipPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { account, loadingAccount } = useContext(AuthContext);

  const [activeFaq, setActiveFaq] = useState(null);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const successMessage = useMemo(() => {
    if (searchParams.get('checkout') === 'success') {
      return 'Thanh toán membership thành công. Quyền lợi của bạn đã được kích hoạt.';
    }
    return '';
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const plansRes = await getMembershipPlans();
        const payload = plansRes?.result || plansRes;
        setPlans(payload?.plans || []);

        if (account) {
          try {
            const myRes = await getMyMembership();
            const subscription = myRes?.result || myRes;
            setCurrentSubscription(subscription || null);
          } catch (membershipError) {
            if (membershipError?.response?.status === 404) {
              setCurrentSubscription(null);
            } else if (membershipError?.response?.status !== 401) {
              throw membershipError;
            }
          }
        } else {
          setCurrentSubscription(null);
        }
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Không thể tải dữ liệu membership.');
      } finally {
        setLoading(false);
      }
    };

    if (!loadingAccount) {
      load();
    }
  }, [account, loadingAccount]);

  const handleChoosePlan = (plan) => {
    if (!account) {
      navigate('/login');
      return;
    }
    navigate(`/membership-payment?plan=${encodeURIComponent(plan.slug)}`);
  };

  const handleCancelAutoRenew = async () => {
    const accepted = window.confirm('Tắt tự động gia hạn cho gói membership hiện tại?');
    if (!accepted) return;

    try {
      setIsCancelling(true);
      const response = await cancelMembershipAutoRenew('Người dùng tắt tự động gia hạn từ MembershipPage');
      setCurrentSubscription(response?.result || response);
      const next = new URLSearchParams(searchParams);
      next.set('updated', '1');
      setSearchParams(next, { replace: true });
    } catch (cancelError) {
      window.alert(cancelError?.response?.data?.message || 'Không thể tắt tự động gia hạn.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-100">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Pet<span className="text-orange-500">Go</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
            <button onClick={() => navigate('/')} className="hover:text-orange-600 transition-colors">Home</button>
            <button onClick={() => navigate('/search')} className="hover:text-orange-600 transition-colors">Services</button>
            <button onClick={() => navigate('/my-bookings')} className="hover:text-orange-600 transition-colors">My Bookings</button>
            <button onClick={() => navigate('/membership')} className="text-orange-600">Membership</button>
            <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-sm cursor-pointer" onClick={() => navigate('/profile')}>
              <User className="w-5 h-5 text-orange-600" />
            </div>
          </nav>
        </div>
      </header>

      <section className="bg-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-5 -z-0">
          <Sparkles className="w-64 h-64 text-orange-500 rotate-12" />
        </div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6">
            <Zap className="w-3.5 h-3.5 fill-current" /> Membership thật từ backend
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 mb-6 tracking-tighter leading-none">
            PetGo <span className="text-blue-600">Membership</span>
          </h1>
          <p className="text-gray-500 text-lg sm:text-xl max-w-2xl mb-10 font-medium">
            Chọn gói phù hợp để tiết kiệm hơn cho mọi lịch hẹn chăm sóc thú cưng và theo dõi subscription của bạn theo dữ liệu thật từ hệ thống.
          </p>

          {successMessage && (
            <div className="w-full max-w-3xl mb-6 rounded-3xl border border-green-100 bg-green-50 px-6 py-4 text-green-700 font-bold">
              {successMessage}
            </div>
          )}

          {searchParams.get('updated') === '1' && (
            <div className="w-full max-w-3xl mb-6 rounded-3xl border border-blue-100 bg-blue-50 px-6 py-4 text-blue-700 font-bold">
              Đã cập nhật trạng thái tự động gia hạn của gói membership.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
            <QuickStat icon={<Wallet className="w-5 h-5" />} label="Quản lý gói thật" value={plans.length ? `${plans.length} plans` : '--'} />
            <QuickStat icon={<Star className="w-5 h-5" />} label="Gói hiện tại" value={currentSubscription?.planName || 'Chưa đăng ký'} />
            <QuickStat icon={<ShieldCheck className="w-5 h-5" />} label="Trạng thái" value={currentSubscription ? statusLabel(currentSubscription.status) : 'Khách'} />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-14">
        {error && (
          <div className="rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-red-600 font-bold flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {currentSubscription && (
          <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-[2.5rem] p-8 sm:p-10 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Crown className="w-4 h-4 text-yellow-300" /> Membership hiện tại
                </div>
                <h2 className="text-3xl font-black tracking-tight">{currentSubscription.planName}</h2>
                <p className="text-white/70 font-medium max-w-2xl">
                  Trạng thái: <span className="font-black text-white">{statusLabel(currentSubscription.status)}</span>
                  {currentSubscription.expiresAt ? ` · Hết hạn ${currentSubscription.expiresAt}` : ''}
                  {currentSubscription.nextBillingAt ? ` · Kỳ tiếp theo ${currentSubscription.nextBillingAt}` : ''}
                </p>
                {currentSubscription.features?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {currentSubscription.features.slice(0, 5).map((feature) => (
                      <span key={feature} className="px-3 py-2 rounded-full bg-white/10 text-xs font-bold">
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-[2rem] p-6 min-w-[280px] border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60 font-bold uppercase tracking-widest">Auto renew</span>
                  <span className={`font-black ${currentSubscription.autoRenew ? 'text-green-300' : 'text-yellow-300'}`}>
                    {currentSubscription.autoRenew ? 'Bật' : 'Tắt'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60 font-bold uppercase tracking-widest">Giá gói</span>
                  <span className="font-black">{currency(currentSubscription.priceAmount)} / {billingCycleLabel(currentSubscription.billingCycle)}</span>
                </div>
                {currentSubscription.autoRenew && (
                  <button
                    onClick={handleCancelAutoRenew}
                    disabled={isCancelling}
                    className="w-full py-3 rounded-2xl bg-white text-gray-900 font-black hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Tắt tự động gia hạn
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">Quyền lợi hội viên</h2>
            <p className="text-gray-500 font-medium">Những lợi ích cốt lõi được hiển thị đồng bộ cùng gói membership thật từ backend.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${benefit.color}`}>
                  {benefit.icon}
                </div>
                <h3 className="mt-5 text-lg font-black text-gray-900">{benefit.title}</h3>
                <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">Chọn gói phù hợp</h2>
            <p className="text-gray-500 font-medium">Giá, voucher, quyền lợi và trạng thái gói đều lấy từ API membership thật.</p>
          </div>

          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan) => {
                const isCurrent = currentSubscription?.planSlug === plan.slug && ['ACTIVE', 'PAST_DUE', 'PENDING_PAYMENT'].includes((currentSubscription?.status || '').toUpperCase());
                return (
                  <div key={plan.id} className={`relative rounded-[2.5rem] p-8 border shadow-sm bg-white flex flex-col ${plan.popular ? 'border-blue-200 shadow-blue-100/60' : 'border-gray-100'}`}>
                    {plan.popular && (
                      <div className="absolute top-5 right-5 px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                        Popular
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute top-5 left-5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Current
                      </div>
                    )}

                    <div className="pt-6 space-y-3">
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{plan.name}</h3>
                      <p className="text-sm text-gray-500 font-medium min-h-12">{plan.description || 'Quyền lợi membership dành cho pet user thường xuyên sử dụng dịch vụ.'}</p>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-gray-900">{currency(plan.priceAmount)}</span>
                        <span className="text-sm font-bold text-gray-400 pb-1">/ {billingCycleLabel(plan.billingCycle)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Number(plan.discountPercent || 0) > 0 && (
                          <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-black">-{plan.discountPercent}% dịch vụ</span>
                        )}
                        {Number(plan.monthlyVoucherAmount || 0) > 0 && (
                          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-black">Voucher {currency(plan.monthlyVoucherAmount)}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 space-y-4 flex-1">
                      {(plan.features || []).map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <div className="mt-0.5 w-5 h-5 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-blue-600 stroke-[4px]" />
                          </div>
                          <span className="text-sm font-bold text-gray-600 leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleChoosePlan(plan)}
                      className={`mt-8 w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${isCurrent ? 'bg-gray-100 text-gray-500' : 'bg-gray-900 text-white hover:bg-blue-600'}`}
                    >
                      {isCurrent ? 'Đang dùng gói này' : account ? 'Tiếp tục thanh toán' : 'Đăng nhập để đăng ký'}
                      {!isCurrent && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center tracking-tight text-gray-900 mb-8">Câu hỏi thường gặp</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={faq.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === index ? null : index)} className="w-full p-6 flex justify-between items-center text-left">
                  <span className="font-black text-gray-700 text-sm leading-relaxed">{faq.q}</span>
                  {activeFaq === index ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6 text-sm text-gray-500 font-medium leading-relaxed">
                    {faq.a}
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

const QuickStat = ({ icon, label, value }) => (
  <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-5 text-left">
    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-500 mb-4">
      {icon}
    </div>
    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</div>
    <div className="text-lg font-black text-gray-900 leading-tight">{value}</div>
  </div>
);

export default MembershipPage;
