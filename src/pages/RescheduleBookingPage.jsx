import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock3,
  Loader2,
  PawPrint,
  RefreshCcw,
  User,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getBookingRescheduleContext, rescheduleBooking } from '../api/bookings';
import { resolveUserId } from '../utils/userIdentity';

const RescheduleBookingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { account } = useContext(AuthContext);
  const userId = resolveUserId(account);

  const [contextData, setContextData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [note, setNote] = useState('');

  const loadContext = async () => {
    if (!userId) {
      setLoading(false);
      setError('Chưa xác định được userId để đổi lịch.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getBookingRescheduleContext(userId, id);
      setContextData(data);
      setSelectedDate(data.availableDates?.[0] || '');
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được dữ liệu đổi lịch.');
      setContextData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, id]);

  const visibleSlots = useMemo(
    () => (contextData?.slots || []).filter((slot) => slot.date === selectedDate),
    [contextData, selectedDate],
  );

  const handleSubmit = async () => {
    if (!selectedSlotId || !userId) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await rescheduleBooking(userId, id, {
        userId,
        newSlotId: Number(selectedSlotId),
        note,
      });
      navigate(`/bookings/${id}`, { state: { flash: result.message || 'Đổi lịch thành công.' } });
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể đổi lịch lúc này.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Đang tải dữ liệu đổi lịch</h1>
          <p className="text-sm text-gray-500 font-medium">PetGo đang lấy các slot còn trống mới nhất.</p>
        </div>
      </div>
    );
  }

  if (error || !contextData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[2rem] border border-red-100 shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Không mở được trang đổi lịch</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">{error || 'Dữ liệu đổi lịch chưa sẵn sàng.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={loadContext} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
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
            <button onClick={() => navigate(`/bookings/${id}`)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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

      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2 space-y-8">
          <div className="text-center lg:text-left">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-blue-100">
              <RefreshCcw className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">Reschedule Booking</h1>
            <p className="text-gray-500 font-medium">Chọn slot mới cho booking <span className="font-black text-gray-900">{contextData.bookingCode}</span>.</p>
          </div>

          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-2 h-8 bg-orange-500 rounded-full" />
              Thông tin hiện tại
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoCard icon={<Calendar className="w-4 h-4 text-blue-500" />} label="Ngày hiện tại" value={contextData.currentDateDisplay} />
              <InfoCard icon={<Clock3 className="w-4 h-4 text-blue-500" />} label="Khung giờ hiện tại" value={contextData.currentTimeDisplay} />
              <InfoCard icon={<PawPrint className="w-4 h-4 text-orange-500" />} label="Nhà cung cấp" value={contextData.providerName} />
              <InfoCard icon={<RefreshCcw className="w-4 h-4 text-orange-500" />} label="Số lần đổi lịch" value={String(contextData.rescheduleCount || 0)} />
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-2 h-8 bg-orange-500 rounded-full" />
              Chọn ngày mới
            </h2>
            <div className="flex flex-wrap gap-3 mb-8">
              {(contextData.availableDates || []).map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlotId('');
                  }}
                  className={`px-5 py-3 rounded-2xl text-sm font-black transition-all ${selectedDate === date ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:border-orange-200 hover:text-orange-600'}`}
                >
                  {new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))}
                </button>
              ))}
            </div>

            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Slot còn trống</h3>
            {visibleSlots.length === 0 ? (
              <div className="rounded-[1.5rem] bg-gray-50 border border-gray-100 p-6 text-sm font-medium text-gray-500">
                Chưa có slot trống cho ngày này. Hãy chọn ngày khác.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleSlots.map((slot) => (
                  <button
                    key={slot.slotId}
                    onClick={() => setSelectedSlotId(String(slot.slotId))}
                    className={`text-left p-5 rounded-[1.5rem] border-2 transition-all ${selectedSlotId === String(slot.slotId) ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-orange-200 bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-base font-black text-gray-900">{slot.label}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                        Còn {slot.capacityRemaining}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dịch vụ: {slot.serviceName || contextData.serviceName}</p>
                  </button>
                ))}
              </div>
            )}

            <textarea
              rows="4"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi chú cho nhà cung cấp nếu cần..."
              className="w-full mt-6 p-5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all outline-none"
            />
          </section>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-28">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="bg-blue-500 p-8 text-white">
              <h3 className="text-xl font-black uppercase tracking-tight">Xác nhận đổi lịch</h3>
              <p className="text-xs font-bold text-blue-100 mt-1 italic">Booking giữ nguyên dịch vụ và thú cưng</p>
            </div>
            <div className="p-8 space-y-6">
              <SummaryRow label="Booking" value={contextData.bookingCode} />
              <SummaryRow label="Dịch vụ" value={contextData.serviceName} />
              <SummaryRow label="Ngày mới" value={selectedDate ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(selectedDate)) : 'Chưa chọn'} />
              <SummaryRow label="Khung giờ mới" value={visibleSlots.find((slot) => String(slot.slotId) === selectedSlotId)?.label || 'Chưa chọn'} />
              {error ? <p className="text-sm font-bold text-red-600 leading-relaxed">{error}</p> : null}
              <button
                disabled={!selectedSlotId || submitting}
                onClick={handleSubmit}
                className="w-full py-5 bg-blue-500 disabled:bg-gray-100 disabled:text-gray-300 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Confirm Reschedule
              </button>
              <button onClick={() => navigate(`/bookings/${id}`)} className="w-full py-5 bg-white border border-gray-100 text-gray-400 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]">
                Back to Detail
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

const InfoCard = ({ icon, label, value }) => (
  <div className="p-5 rounded-[1.5rem] bg-gray-50 border border-gray-100">
    <div className="flex items-center gap-2 mb-2 text-gray-500">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-sm font-bold text-gray-800 leading-relaxed">{value}</p>
  </div>
);

const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between items-center gap-4">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-gray-900 text-right">{value}</span>
  </div>
);

export default RescheduleBookingPage;
