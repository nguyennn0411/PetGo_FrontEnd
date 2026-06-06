import React, { useContext, useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Loader2,
  PawPrint,
  ShieldAlert,
  User,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { cancelBooking, getBookingDetail } from '../api/bookings';
import { resolveUserId } from '../utils/userIdentity';

const REASONS = [
  { code: 'CHANGE_OF_PLANS', label: 'Tôi thay đổi kế hoạch' },
  { code: 'FOUND_ANOTHER_PROVIDER', label: 'Tôi đã chọn nhà cung cấp khác' },
  { code: 'PRICE_TOO_HIGH', label: 'Chi phí chưa phù hợp' },
  { code: 'PET_NOT_READY', label: 'Thú cưng chưa sẵn sàng' },
  { code: 'SICK_OR_EMERGENCY', label: 'Bận việc / có tình huống khẩn cấp' },
  { code: 'OTHER', label: 'Lý do khác' },
];

const CancelBookingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { account } = useContext(AuthContext);
  const userId = resolveUserId(account);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  const loadBooking = async () => {
    if (!userId) {
      setLoading(false);
      setError('Chưa xác định được userId để hủy booking.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getBookingDetail(userId, id);
      setBooking(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được booking để hủy.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, id]);

  const handleConfirmCancel = async () => {
    if (!selectedReason || !isAgreed || !userId) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await cancelBooking(userId, id, {
        userId,
        reasonCode: selectedReason,
        reasonText: selectedReason === 'OTHER' ? reasonText : reasonText || undefined,
      });
      navigate(`/bookings/${id}`, { state: { flash: result.message || 'Đã hủy booking thành công.' } });
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể hủy booking lúc này.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Đang tải booking</h1>
          <p className="text-sm text-gray-500 font-medium">PetGo đang lấy chính sách hủy và refund dự kiến.</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[2rem] border border-red-100 shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Không mở được trang hủy booking</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">{error || 'Booking không tồn tại hoặc không còn cho phép hủy.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={loadBooking} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
              Thử lại
            </button>
            <button onClick={() => navigate(`/bookings/${id}`)} className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest hover:bg-gray-200">
              Về Booking Detail
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/bookings/${id}`)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
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

      <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">Cancel Booking</h1>
          <p className="text-gray-500 font-medium">Chúng tôi rất tiếc khi bạn không thể tham gia lịch hẹn này.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thông tin lịch hẹn</span>
                <span className="text-[10px] font-black text-gray-900 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-100">ID: {booking.bookingCode}</span>
              </div>
              <div className="p-8 space-y-5">
                <h3 className="text-xl font-black text-gray-900">{booking.providerName}</h3>
                <p className="text-sm font-bold text-orange-600 uppercase tracking-wider">{booking.serviceName}</p>
                <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {booking.appointmentDateDisplay}</span>
                  <span className="flex items-center gap-2"><Clock3 className="w-4 h-4" /> {booking.appointmentTime}</span>
                  <span className="flex items-center gap-2"><PawPrint className="w-4 h-4" /> {booking.petName}</span>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 sm:p-10">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                Lý do bạn muốn hủy?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {REASONS.map((reason) => (
                  <label
                    key={reason.code}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedReason === reason.code ? 'border-orange-500 bg-orange-50/30' : 'border-gray-50 hover:border-orange-100 bg-white'}`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      className="hidden"
                      onChange={() => setSelectedReason(reason.code)}
                      checked={selectedReason === reason.code}
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedReason === reason.code ? 'border-orange-500 bg-orange-500' : 'border-gray-200'}`}>
                      {selectedReason === reason.code && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-sm font-bold ${selectedReason === reason.code ? 'text-gray-900' : 'text-gray-500'}`}>{reason.label}</span>
                  </label>
                ))}
              </div>

              {selectedReason === 'OTHER' ? (
                <textarea
                  rows="3"
                  value={reasonText}
                  onChange={(event) => setReasonText(event.target.value)}
                  placeholder="Vui lòng chia sẻ thêm lý do để PetGo cải thiện dịch vụ..."
                  className="w-full mt-6 p-5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                />
              ) : null}
            </section>

            <div className="flex items-center justify-between p-6 bg-blue-50 rounded-[2rem] border border-blue-100 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-blue-900">Bạn muốn đổi lịch thay vì hủy?</p>
                  <p className="text-xs font-medium text-blue-700/70">PetGo hỗ trợ dời lịch nếu booking vẫn còn slot khác.</p>
                </div>
              </div>
              {booking.canReschedule ? (
                <button onClick={() => navigate(`/reschedule/${booking.bookingId}`)} className="px-6 py-3 bg-white text-blue-600 font-black rounded-xl border border-blue-200 hover:bg-blue-600 hover:text-white transition-all text-[10px] uppercase tracking-widest shadow-sm">
                  Reschedule
                </button>
              ) : null}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
              <div className="bg-red-500 p-8 text-white relative">
                <div className="absolute top-4 right-4 opacity-20">
                  <AlertTriangle className="w-16 h-16" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Chính sách hoàn phí</h3>
                <p className="text-xs font-bold text-red-100 mt-1 italic">Vui lòng đọc kỹ trước khi xác nhận hủy.</p>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  <PolicyItem label="Số tiền hoàn lại" value={booking.estimatedRefundDisplay} success />
                  <PolicyItem label="Trạng thái hiện tại" value={booking.statusLabel} />
                  <PolicyItem label="Hạn hủy miễn phí" value={booking.cancellationDeadline || 'Theo provider'} />
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">
                      Booking này hiện có thể hủy: <span className="text-gray-900">{booking.canCancel ? 'Có' : 'Không'}</span>. Refund ước tính lấy từ backend theo chính sách provider.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group pt-4 border-t border-gray-50">
                  <div className="relative mt-0.5">
                    <input type="checkbox" className="peer hidden" onChange={() => setIsAgreed(!isAgreed)} checked={isAgreed} />
                    <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isAgreed ? 'bg-red-500 border-red-500' : 'bg-white border-gray-200 peer-hover:border-red-300'}`}>
                      {isAgreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                    Tôi đã hiểu và đồng ý với các chính sách hủy lịch của PetGo.
                  </span>
                </label>

                {error ? <p className="text-sm font-bold text-red-600 leading-relaxed">{error}</p> : null}

                <div className="space-y-3 pt-2">
                  <button
                    disabled={!selectedReason || !isAgreed || submitting}
                    onClick={handleConfirmCancel}
                    className="w-full py-5 bg-red-500 disabled:bg-gray-100 disabled:text-gray-300 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Confirm Cancel
                  </button>
                  <button onClick={() => navigate(`/bookings/${booking.bookingId}`)} className="w-full py-5 bg-white border border-gray-100 text-gray-400 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]">
                    Keep Booking
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const PolicyItem = ({ label, value, success }) => (
  <div className="flex justify-between items-center gap-4">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-black ${success ? 'text-green-600' : 'text-gray-900'} text-right`}>{value}</span>
  </div>
);

export default CancelBookingPage;
