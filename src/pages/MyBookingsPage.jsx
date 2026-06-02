import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  PawPrint,
  Search,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyBookings } from '../api/bookings';
import { resolveOwnerUserId } from '../utils/ownerUser';

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_STYLES = {
  PENDING_PAYMENT: 'bg-orange-50 text-orange-600 border-orange-100',
  PENDING_CONFIRMATION: 'bg-orange-50 text-orange-600 border-orange-100',
  CONFIRMED: 'bg-blue-50 text-blue-600 border-blue-100',
  COMPLETED: 'bg-green-50 text-green-600 border-green-100',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

const STATUS_ICONS = {
  PENDING_PAYMENT: <Clock3 className="w-3 h-3" />,
  PENDING_CONFIRMATION: <Clock3 className="w-3 h-3" />,
  CONFIRMED: <CheckCircle2 className="w-3 h-3" />,
  COMPLETED: <CheckCircle2 className="w-3 h-3" />,
  CANCELLED: <XCircle className="w-3 h-3" />,
};

const fallbackImage = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { account } = useContext(AuthContext);
  const ownerUserId = resolveOwnerUserId(account);

  const [activeTab, setActiveTab] = useState('ALL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = async (status = activeTab) => {
    if (!ownerUserId) {
      setLoading(false);
      setError('Chưa xác định được ownerUserId. Hãy đăng nhập hoặc lưu localStorage.petgo_owner_user_id để test.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await getMyBookings(ownerUserId, status);
      setData(response);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách booking.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerUserId, activeTab]);

  const counts = useMemo(() => data?.counts || {}, [data]);
  const bookings = data?.bookings || [];

  const renderStatusBadge = (booking) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[booking.status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {STATUS_ICONS[booking.status] || <Clock3 className="w-3 h-3" />}
      {booking.statusLabel || booking.status}
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">My Bookings</h1>
            <p className="text-gray-500 font-medium">Danh sách booking thật lấy từ backend sau bước Payment / Invoice.</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-2 text-sm font-black text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 px-5 py-3 rounded-2xl border border-orange-100"
          >
            <Search className="w-4 h-4" /> Explore Services
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-6 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${activeTab === tab.key
                  ? 'bg-gray-900 text-white shadow-xl scale-105'
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-orange-200 hover:text-orange-600 shadow-sm'
                }`}
            >
              {tab.label} <span className="ml-2 opacity-70">{counts[tab.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 text-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900 mb-2">Đang tải booking</h2>
            <p className="text-sm text-gray-500 font-medium">PetGo đang đồng bộ danh sách đặt lịch của bạn.</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[2.5rem] border border-red-100 shadow-sm p-10 text-center">
            <AlertCircle className="w-9 h-9 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Không tải được booking</h2>
            <p className="text-sm text-gray-500 font-medium mb-6">{error}</p>
            <button onClick={() => loadBookings(activeTab)} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
              Thử lại
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Chưa có booking ở tab này</h2>
            <p className="text-sm text-gray-500 font-medium mb-6">Bạn có thể quay lại tìm dịch vụ phù hợp cho thú cưng của mình.</p>
            <button onClick={() => navigate('/search')} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
              Explore Services
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.bookingId} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100 shrink-0">
                        <img src={booking.providerImage || fallbackImage} alt={booking.providerName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-orange-600 transition-colors truncate">
                          {booking.providerName}
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mt-1">Booking ID: {booking.bookingCode}</p>
                      </div>
                    </div>
                    <div>{renderStatusBadge(booking)}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <MetaBlock icon={<CheckCircle2 className="w-4 h-4" />} title="Dịch vụ" value={booking.serviceName} tone="orange" />
                    <MetaBlock icon={<PawPrint className="w-4 h-4" />} title="Thú cưng" value={booking.petLabel} tone="orange" />
                    <MetaBlock icon={<Calendar className="w-4 h-4" />} title="Ngày giờ" value={`${booking.appointmentDateDisplay} • ${booking.appointmentTime}`} tone="blue" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Tổng thanh toán</p>
                      <p className="text-2xl font-black text-gray-900">{booking.totalAmountDisplay}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end">
                      <button onClick={() => navigate(`/bookings/${booking.bookingId}`)} className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-gray-100 inline-flex items-center gap-2">
                        Details <ChevronRight className="w-4 h-4" />
                      </button>
                      {booking.canReschedule ? (
                        <button onClick={() => navigate(`/reschedule/${booking.bookingId}`)} className="px-5 py-3 rounded-2xl bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100">
                          Reschedule
                        </button>
                      ) : null}
                      {booking.canCancel ? (
                        <button onClick={() => navigate(`/cancel-booking/${booking.bookingId}`)} className="px-5 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100">
                          Cancel
                        </button>
                      ) : null}
                      {booking.canReview ? (
                        <button onClick={() => navigate(`/reviews/create/${booking.bookingId}`)} className="px-5 py-3 rounded-2xl bg-green-50 text-green-600 text-xs font-black uppercase tracking-widest hover:bg-green-100 transition-all border border-green-100">
                          Review
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <button onClick={() => navigate('/search')} className="text-sm font-black text-orange-600 hover:text-orange-700 inline-flex items-center gap-2">
            Explore more services <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};

const MetaBlock = ({ icon, title, value, tone = 'orange' }) => {
  const tones = {
    orange: 'bg-orange-50 text-orange-500',
    blue: 'bg-blue-50 text-blue-500',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone] || tones.orange}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">{title}</p>
        <p className="text-sm font-bold text-gray-700">{value}</p>
      </div>
    </div>
  );
};

export default MyBookingsPage;
