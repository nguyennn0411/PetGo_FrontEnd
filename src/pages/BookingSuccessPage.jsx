import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Home,
  ListOrdered,
  Loader2,
  PawPrint,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getBookingSummary } from '../api/bookings';

const formatCurrency = (value, currency = 'VND') => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'Chờ thanh toán';
    case 'PENDING_CONFIRMATION':
      return 'Chờ xác nhận';
    case 'PENDING_PROVIDER_CONFIRMATION':
      return 'Chờ provider xác nhận';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'IN_PROGRESS':
      return 'Đang thực hiện';
    case 'AWAITING_COMPLETION_CONFIRMATION':
      return 'Chờ xác nhận hoàn tất';
    case 'COMPLETED_BY_USER':
      return 'Bạn đã xác nhận hoàn tất';
    case 'COMPLETED_BY_PROVIDER':
      return 'Provider đã xác nhận hoàn tất';
    case 'COMPLETED':
      return 'Hoàn thành';
    case 'DISPUTED':
      return 'Đang tranh chấp';
    case 'ADMIN_REVIEW':
      return 'Chờ admin xử lý';
    case 'REJECTED':
      return 'Provider từ chối';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return status || 'Đã tạo';
  }
};

const getPaymentStatusLabel = (status) => {
  switch (status) {
    case 'SUCCEEDED':
      return 'Thanh toán thành công';
    case 'PENDING':
      return 'Đã tạo phiếu thanh toán';
    case 'AUTHORIZED':
      return 'Đã ủy quyền';
    default:
      return status || 'Đã ghi nhận';
  }
};

const BookingSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const invoiceId = searchParams.get('invoiceId') || location.state?.payment?.invoiceId;

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking && !!bookingId);
  const [error, setError] = useState('');

  const payment = location.state?.payment || null;

  useEffect(() => {
    const fetchSummary = async () => {
      if (!bookingId || booking) return;
      setLoading(true);
      setError('');
      try {
        const data = await getBookingSummary(bookingId);
        setBooking(data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Không tải được booking vừa tạo.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [bookingId, booking]);

  const totalDisplay = useMemo(() => {
    if (payment?.totalAmount != null) return payment.totalAmountDisplay || formatCurrency(payment.totalAmount, payment.currencyCode);
    if (booking?.totalAmount != null) return booking.totalAmountDisplay || formatCurrency(booking.totalAmount, booking.currencyCode);
    return '';
  }, [payment, booking]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-7 h-7 text-green-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Đang tải kết quả đặt lịch</h1>
          <p className="text-sm text-gray-500 font-medium">PetGo đang tải thông tin đặt lịch.</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[2rem] border border-red-100 shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Không đọc được booking vừa tạo</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">{error || 'Booking đã tạo nhưng front end chưa tải lại được dữ liệu.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {bookingId ? (
              <button onClick={() => navigate(`/booking-success?bookingId=${bookingId}`, { replace: true })} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
                Thử lại
              </button>
            ) : null}
            <Link to="/my-bookings" className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest hover:bg-gray-200">
              Xem lịch đặt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-12 animate-in zoom-in duration-700">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100/50">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Đặt lịch thành công!</h1>
          <p className="text-gray-500 font-medium">Lịch hẹn đã được tạo và đang chờ nhà cung cấp xác nhận.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden mb-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-gray-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mã đặt lịch</p>
              <h3 className="text-2xl font-black">{booking.bookingCode}</h3>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-xl border border-orange-500/30">
              <CheckCircle2 className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-black uppercase tracking-widest">{getStatusLabel(booking.status)}</span>
            </div>
          </div>

          <div className="p-8 sm:p-10 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <DetailItem icon={<ShieldCheck className="w-5 h-5 text-orange-500" />} label="Nhà cung cấp" value={booking.providerName} />
              <DetailItem icon={<PawPrint className="w-5 h-5 text-orange-500" />} label="Dịch vụ & Thú cưng" value={booking.serviceName} subValue={`${booking.petName}${booking.petBreed ? ` · ${booking.petBreed}` : ''}`} />
              <DetailItem icon={<Calendar className="w-5 h-5 text-orange-500" />} label="Ngày hẹn" value={booking.appointmentDate} />
              <DetailItem icon={<Clock className="w-5 h-5 text-orange-500" />} label="Giờ hẹn" value={`${booking.startTime} - ${booking.endTime}`} />
            </div>

            {payment ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-[2rem] bg-gray-50 border border-gray-100 p-6">
                <DetailItem icon={<CreditCard className="w-5 h-5 text-orange-500" />} label="Thanh toán" value={getPaymentStatusLabel(payment.paymentStatus)} />
                <DetailItem icon={<FileText className="w-5 h-5 text-orange-500" />} label="Hóa đơn" value={payment.invoiceNumber} />
              </div>
            ) : null}

            <div className="pt-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng tiền</p>
                <p className="text-3xl font-black text-gray-900">{totalDisplay}</p>
              </div>
              {invoiceId ? (
                <button
                  onClick={() => navigate(`/invoice?invoiceId=${invoiceId}`)}
                  className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-orange-500 hover:text-white transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  Xem hóa đơn <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="px-8 sm:px-10 pb-8">
            <BookingEscrowTimeline status={booking.status} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/my-bookings" className="flex-1 py-5 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
            <ListOrdered className="w-4 h-4" /> Xem lịch đặt của tôi
          </Link>
          <Link to="/" className="flex-1 py-5 bg-white border-2 border-gray-100 text-gray-900 font-black rounded-2xl hover:border-orange-500 hover:text-orange-600 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Về trang chủ
          </Link>
        </div>
      </main>
    </div>
  );
};

const DetailItem = ({ icon, label, value, subValue }) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <span className="block text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">{label}</span>
      <span className="block text-sm font-black text-gray-900 leading-tight">{value}</span>
      {subValue ? <span className="block text-xs font-bold text-gray-400 mt-1">{subValue}</span> : null}
    </div>
  </div>
);

const BookingEscrowTimeline = ({ status }) => {
  const normalized = String(status || '').toUpperCase();
  const steps = [
    { key: 'HELD', title: 'Đã giữ tiền ví', description: 'PetGo đã trừ số dư khả dụng và giữ tiền trong escrow/admin hold.', active: true, icon: <Wallet className="w-4 h-4" /> },
    { key: 'PROVIDER_CONFIRM', title: 'Chờ provider xác nhận', description: 'Provider xác nhận nhận lịch hoặc từ chối để hoàn tiền.', active: ['PENDING_PROVIDER_CONFIRMATION', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_COMPLETION_CONFIRMATION', 'COMPLETED_BY_USER', 'COMPLETED_BY_PROVIDER', 'COMPLETED'].includes(normalized), icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'SERVICE', title: 'Dịch vụ diễn ra', description: 'User mang thú cưng tới cơ sở theo ngày giờ đã đặt.', active: ['CONFIRMED', 'IN_PROGRESS', 'AWAITING_COMPLETION_CONFIRMATION', 'COMPLETED_BY_USER', 'COMPLETED_BY_PROVIDER', 'COMPLETED'].includes(normalized), icon: <Calendar className="w-4 h-4" /> },
    { key: 'COMPLETE', title: 'Hai bên xác nhận hoàn tất', description: 'User và provider cùng xác nhận trước khi đủ điều kiện giải ngân.', active: ['COMPLETED_BY_USER', 'COMPLETED_BY_PROVIDER', 'COMPLETED'].includes(normalized), icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'PAYOUT', title: 'Giải ngân / dispute', description: 'Đủ điều kiện thì giải ngân cho provider; có khiếu nại thì admin xử lý.', active: ['COMPLETED', 'DISPUTED', 'ADMIN_REVIEW'].includes(normalized), icon: <FileText className="w-4 h-4" /> },
  ];

  return <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-5"><h4 className="mb-5 text-sm font-black uppercase tracking-widest text-gray-900">Quy trình tiếp theo</h4><div className="space-y-4">{steps.map((step, index) => <div key={step.key} className="flex gap-4"><div className="flex flex-col items-center"><div className={`flex h-9 w-9 items-center justify-center rounded-full border ${step.active ? 'border-green-100 bg-green-100 text-green-600' : 'border-gray-200 bg-white text-gray-300'}`}>{step.icon}</div>{index < steps.length - 1 ? <div className="mt-2 h-8 w-px bg-gray-200" /> : null}</div><div><p className={`text-sm font-black ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</p><p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">{step.description}</p></div></div>)}</div></div>;
};

export default BookingSuccessPage;
