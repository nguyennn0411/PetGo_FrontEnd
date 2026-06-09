import React, { useContext, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  MapPin,
  PawPrint,
  Phone,
  RefreshCcw,
  ShieldCheck,
  StickyNote,
  MessageSquareWarning,
  User,
  XCircle,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { confirmBookingCompletedByUser, createBookingDispute, getBookingDetail } from '../api/bookings';
import { resolveUserId } from '../utils/userIdentity';

const STATUS_STYLES = {
  PENDING_PAYMENT: 'bg-orange-50 text-orange-600 border-orange-100',
  PENDING_CONFIRMATION: 'bg-orange-50 text-orange-600 border-orange-100',
  PENDING_PROVIDER_CONFIRMATION: 'bg-orange-50 text-orange-600 border-orange-100',
  CONFIRMED: 'bg-blue-50 text-blue-600 border-blue-100',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
  AWAITING_COMPLETION_CONFIRMATION: 'bg-purple-50 text-purple-600 border-purple-100',
  COMPLETED_BY_USER: 'bg-purple-50 text-purple-600 border-purple-100',
  COMPLETED_BY_PROVIDER: 'bg-purple-50 text-purple-600 border-purple-100',
  COMPLETED: 'bg-green-50 text-green-600 border-green-100',
  DISPUTED: 'bg-red-50 text-red-600 border-red-100',
  ADMIN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-100',
  REJECTED: 'bg-red-50 text-red-600 border-red-100',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

const STATUS_LABELS = {
  PENDING_PROVIDER_CONFIRMATION: 'Chờ provider xác nhận',
  ADMIN_REVIEW: 'Chờ admin xử lý',
  AWAITING_COMPLETION_CONFIRMATION: 'Chờ xác nhận hoàn tất',
  COMPLETED_BY_USER: 'Bạn đã xác nhận hoàn tất',
  COMPLETED_BY_PROVIDER: 'Provider đã xác nhận hoàn tất',
  DISPUTED: 'Đang tranh chấp',
  REJECTED: 'Provider từ chối',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
};

const STATUS_DESCRIPTIONS = {
  PENDING_PROVIDER_CONFIRMATION: 'Booking đã giữ tiền ví và đang chờ provider xác nhận nhận lịch. Nếu quá hạn, booking sẽ chuyển admin review theo rule mới.',
  ADMIN_REVIEW: 'Booking cần admin xử lý trước khi tiếp tục, hoàn tiền hoặc áp dụng phương án khác.',
  AWAITING_COMPLETION_CONFIRMATION: 'Dịch vụ đã tới giai đoạn cần user và provider cùng xác nhận hoàn tất.',
  COMPLETED_BY_USER: 'Bạn đã xác nhận hoàn tất. PetGo đang chờ provider xác nhận để đủ điều kiện giải ngân.',
  COMPLETED_BY_PROVIDER: 'Provider đã xác nhận hoàn tất. Bạn cần xác nhận nếu dịch vụ đã hoàn thành đúng thực tế.',
  DISPUTED: 'Booking đang có khiếu nại, tiền escrow chưa tự động giải ngân cho tới khi admin xử lý.',
};

const BookingDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { account } = useContext(AuthContext);
  const userId = resolveUserId(account);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const loadBooking = async () => {
    if (!userId) {
      setLoading(false);
      setError('Chưa xác định được userId để đọc booking detail.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getBookingDetail(userId, id);
      setBooking(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được chi tiết booking.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, id]);

  const flash = location.state?.flash;

  const statusClass = STATUS_STYLES[booking?.status] || 'bg-gray-50 text-gray-600 border-gray-100';
  const normalizedStatus = String(booking?.status || '').toUpperCase();
  const statusLabel = STATUS_LABELS[normalizedStatus] || booking?.statusLabel || booking?.status;
  const statusDescription = STATUS_DESCRIPTIONS[normalizedStatus] || 'PetGo sẽ cập nhật timeline khi booking chuyển trạng thái mới.';
  const canConfirmCompletedByUser = ['CONFIRMED', 'IN_PROGRESS', 'AWAITING_COMPLETION_CONFIRMATION', 'COMPLETED_BY_PROVIDER'].includes(normalizedStatus);
  const canCreateDispute = ['CONFIRMED', 'IN_PROGRESS', 'AWAITING_COMPLETION_CONFIRMATION', 'COMPLETED_BY_USER', 'COMPLETED_BY_PROVIDER'].includes(normalizedStatus);

  const runUserCompletion = async () => {
    if (!window.confirm('Xác nhận bạn đã nhận xong dịch vụ? Tiền chỉ được giải ngân khi đủ điều kiện escrow theo PetGo.')) return;
    try {
      setMutating(true);
      setError('');
      const result = await confirmBookingCompletedByUser(booking.bookingId);
      setActionMessage(result?.message || 'Đã ghi nhận xác nhận hoàn tất của bạn.');
      await loadBooking();
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể xác nhận hoàn tất booking.');
    } finally {
      setMutating(false);
    }
  };

  const submitDispute = async (event) => {
    event.preventDefault();
    const reason = disputeReason.trim();
    if (reason.length < 10) {
      setError('Vui lòng nhập lý do khiếu nại tối thiểu 10 ký tự.');
      return;
    }
    try {
      setMutating(true);
      setError('');
      const result = await createBookingDispute(booking.bookingId, { reason });
      setActionMessage(result?.message || 'Đã gửi khiếu nại, booking sẽ chờ admin xử lý.');
      setDisputeOpen(false);
      setDisputeReason('');
      await loadBooking();
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tạo khiếu nại cho booking này.');
    } finally {
      setMutating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Đang tải chi tiết booking</h1>
          <p className="text-sm text-gray-500 font-medium">PetGo đang lấy timeline, invoice và trạng thái mới nhất.</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[2rem] border border-red-100 shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Không mở được booking</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">{error || 'Booking không tồn tại.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={loadBooking} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
              Thử lại
            </button>
            <Link to="/my-bookings" className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest hover:bg-gray-200">
              Đi tới My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 min-w-0">
              <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-100">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">Pet<span className="text-orange-500">Go</span></span>
            </button>
          </div>
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-sm">
            <User className="w-5 h-5 text-orange-600" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        {flash ? (
          <div className="mb-6 rounded-[1.5rem] border border-green-100 bg-green-50 px-5 py-4 text-sm font-bold text-green-700 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {flash}
          </div>
        ) : null}
        {actionMessage ? (
          <div className="mb-6 rounded-[1.5rem] border border-green-100 bg-green-50 px-5 py-4 text-sm font-bold text-green-700 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {actionMessage}
          </div>
        ) : null}
        {error ? (
          <div className="mb-6 rounded-[1.5rem] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
                <div className="flex items-center gap-5 min-w-0">
                  {booking.providerImage ? <img src={booking.providerImage} alt={booking.providerName} className="w-20 h-20 rounded-[1.5rem] object-cover border border-gray-100 shrink-0" /> : <div className="w-20 h-20 rounded-[1.5rem] bg-orange-50 border border-orange-100 shrink-0 flex items-center justify-center"><PawPrint className="w-8 h-8 text-orange-400" /></div>}
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Booking code: {booking.bookingCode}</p>
                    <h1 className="text-3xl font-black text-gray-900 leading-tight truncate">{booking.providerName}</h1>
                    <p className="text-sm font-bold text-orange-600 uppercase tracking-widest mt-2">{booking.serviceName}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest self-start ${statusClass}`}>
                  {statusLabel}
                </div>
              </div>

              <div className="mx-8 mb-8 rounded-[1.5rem] border border-orange-100 bg-orange-50 px-5 py-4 text-sm font-bold leading-relaxed text-orange-800">
                {statusDescription}
              </div>

              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoCard icon={<Calendar className="w-4 h-4 text-blue-500" />} label="Ngày hẹn" value={booking.appointmentDateDisplay} />
                <InfoCard icon={<Clock3 className="w-4 h-4 text-blue-500" />} label="Khung giờ" value={booking.appointmentTime} />
                <InfoCard icon={<PawPrint className="w-4 h-4 text-orange-500" />} label="Thú cưng" value={`${booking.petName}${booking.petBreed ? ` (${booking.petBreed})` : ''}`} />
                <InfoCard icon={<MapPin className="w-4 h-4 text-orange-500" />} label="Địa chỉ" value={booking.providerAddress || 'Chưa có địa chỉ'} />
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
              <SectionTitle title="Timeline trạng thái" />
              <div className="space-y-5">
                {booking.timeline?.length ? booking.timeline.map((item, index) => (
                  <div key={`${item.createdAt}-${index}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      {index < booking.timeline.length - 1 ? <div className="w-px flex-1 bg-orange-100 mt-2" /> : null}
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-black text-gray-900">{item.toStatusLabel || STATUS_LABELS[item.toStatus] || item.toStatus}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{item.createdAt}</p>
                      {item.note ? <p className="text-sm text-gray-600 font-medium mt-2 leading-relaxed">{item.note}</p> : null}
                      {item.changedBy ? <p className="text-xs font-bold text-orange-600 mt-2">By: {item.changedBy}</p> : null}
                    </div>
                  </div>
                )) : <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-sm font-bold text-gray-500">Backend chưa trả timeline cho booking này.</div>}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
              <SectionTitle title="Chi tiết booking" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoCard icon={<Phone className="w-4 h-4 text-green-500" />} label="Hotline" value={booking.providerPhone || 'Chưa có số'} />
                <InfoCard icon={<ShieldCheck className="w-4 h-4 text-green-500" />} label="Refund dự kiến" value={booking.estimatedRefundDisplay || '0 đ'} />
                <InfoCard icon={<CreditCard className="w-4 h-4 text-orange-500" />} label="Invoice / Payment" value={`${booking.invoiceStatus || 'Chưa có invoice'}${booking.paymentStatus ? ` • ${booking.paymentStatus}` : ''}`} />
                <InfoCard icon={<RefreshCcw className="w-4 h-4 text-blue-500" />} label="Số lần đổi lịch" value={String(booking.rescheduleCount || 0)} />
              </div>

              {booking.customerNote ? (
                <div className="mt-6 p-5 rounded-[1.5rem] bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <StickyNote className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ghi chú của khách hàng</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed">{booking.customerNote}</p>
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
              <div className="bg-gray-900 p-8 text-white">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Tóm tắt thanh toán</p>
                <h2 className="text-3xl font-black tracking-tight">{booking.totalAmountDisplay}</h2>
              </div>

              <div className="p-8 space-y-5">
                <PriceRow label="Subtotal" value={booking.subtotalAmount} />
                <PriceRow label="Promo discount" value={-Math.abs(Number(booking.promoDiscountAmount || 0))} success />
                <PriceRow label="Tax" value={booking.taxAmount} />
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black text-orange-600">{booking.totalAmountDisplay}</span>
                </div>

                <div className="space-y-3 pt-2">
                  {booking.invoiceId ? (
                    <button onClick={() => navigate(`/invoice?bookingId=${booking.bookingId}`)} className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" /> View Invoice
                    </button>
                  ) : null}
                  {booking.canReschedule ? (
                    <button onClick={() => navigate(`/reschedule/${booking.bookingId}`)} className="w-full py-4 rounded-2xl bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 flex items-center justify-center gap-2">
                      <RefreshCcw className="w-4 h-4" /> Reschedule
                    </button>
                  ) : null}
                  {booking.canCancel ? (
                    <button onClick={() => navigate(`/cancel-booking/${booking.bookingId}`)} className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" /> Cancel Booking
                    </button>
                  ) : null}
                  {booking.canReview ? (
                    <button onClick={() => navigate(`/reviews/create/${booking.bookingId}`)} className="w-full py-4 rounded-2xl bg-green-50 text-green-600 font-black text-xs uppercase tracking-widest hover:bg-green-100 transition-all border border-green-100 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Write Review
                    </button>
                  ) : null}
                  {canConfirmCompletedByUser ? (
                    <button disabled={mutating} onClick={runUserCompletion} className="w-full py-4 rounded-2xl bg-green-50 text-green-600 font-black text-xs uppercase tracking-widest hover:bg-green-100 transition-all border border-green-100 flex items-center justify-center gap-2 disabled:opacity-60">
                      <CheckCircle2 className="w-4 h-4" /> Xác nhận đã hoàn tất
                    </button>
                  ) : null}
                  {canCreateDispute ? (
                    <button disabled={mutating} onClick={() => setDisputeOpen((value) => !value)} className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-2 disabled:opacity-60">
                      <MessageSquareWarning className="w-4 h-4" /> Khiếu nại booking
                    </button>
                  ) : null}
                  {disputeOpen ? (
                    <form onSubmit={submitDispute} className="rounded-2xl border border-red-100 bg-red-50/60 p-4 space-y-3">
                      <textarea value={disputeReason} onChange={(event) => setDisputeReason(event.target.value)} rows={4} placeholder="Mô tả vấn đề cần admin hỗ trợ xử lý..." className="w-full rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-red-300" />
                      <button disabled={mutating} className="w-full py-3 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-60">
                        {mutating ? 'Đang gửi...' : 'Gửi khiếu nại'}
                      </button>
                    </form>
                  ) : null}
                  <button onClick={() => navigate('/my-bookings')} className="w-full py-4 rounded-2xl bg-white text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all border border-gray-100 flex items-center justify-center gap-2">
                    My Bookings <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 flex items-center gap-4">
              {booking.petAvatarUrl ? <img src={booking.petAvatarUrl} alt={booking.petName} className="w-16 h-16 rounded-[1.25rem] object-cover border border-gray-100" /> : <div className="w-16 h-16 rounded-[1.25rem] bg-orange-50 border border-orange-100 flex items-center justify-center"><PawPrint className="w-6 h-6 text-orange-400" /></div>}
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Pet profile</p>
                <p className="text-lg font-black text-gray-900">{booking.petName}</p>
                <p className="text-sm font-bold text-orange-600">{booking.petBreed || 'Chưa có breed'}</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const SectionTitle = ({ title }) => (
  <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
    <div className="w-2 h-8 bg-orange-500 rounded-full" />
    {title}
  </h2>
);

const InfoCard = ({ icon, label, value }) => (
  <div className="p-5 rounded-[1.5rem] bg-gray-50 border border-gray-100">
    <div className="flex items-center gap-2 mb-2 text-gray-500">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-sm font-bold text-gray-800 leading-relaxed">{value}</p>
  </div>
);

const PriceRow = ({ label, value, success = false }) => {
  const amount = Number(value || 0);
  const display = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-black ${success ? 'text-green-600' : 'text-gray-900'}`}>{display}</span>
    </div>
  );
};

export default BookingDetailPage;
