import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, DollarSign, Scissors, Star, Store } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerEmptyState, PartnerErrorState, PartnerLoadingState, PartnerStatusBadge } from '../../components/partner/PartnerStates';
import { getPartnerDashboardSummary } from '../../api/partner';

const metricConfig = [
    ['todayBookings', 'Booking hôm nay', CalendarDays, 'bg-orange-50 text-orange-600'],
    ['pendingBookings', 'Chờ xử lý', Clock, 'bg-yellow-50 text-yellow-600'],
    ['upcomingBookings', 'Sắp diễn ra', AlertTriangle, 'bg-blue-50 text-blue-600'],
    ['completedBookings', 'Hoàn thành', CheckCircle2, 'bg-green-50 text-green-600'],
    ['cancelledBookings', 'Đã hủy', AlertTriangle, 'bg-red-50 text-red-600'],
    ['monthlyRevenueDisplay', 'Doanh thu tháng', DollarSign, 'bg-emerald-50 text-emerald-600'],
    ['averageRating', 'Rating', Star, 'bg-purple-50 text-purple-600'],
    ['completionRate', 'Tỷ lệ hoàn thành', CheckCircle2, 'bg-gray-100 text-gray-700'],
];

const PartnerDashboardPage = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadSummary = async () => {
        try {
            setLoading(true);
            setError('');
            setSummary(await getPartnerDashboardSummary());
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải tổng quan partner.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSummary(); }, []);

    return (
        <PartnerLayout title="Partner Dashboard" subtitle="Tổng quan vận hành provider" providerName={summary?.businessName}>
            <div className="space-y-6">
                {loading ? <PartnerLoadingState /> : error ? <PartnerErrorState message={error} onRetry={loadSummary} /> : (
                    <>
                        <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-8 text-white shadow-xl overflow-hidden relative">
                            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-orange-500/20 blur-2xl" />
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <p className="text-orange-300 font-black uppercase tracking-widest text-xs mb-3">Partner workspace</p>
                                    <h2 className="text-3xl font-black mb-2">{summary?.businessName || 'Dịch vụ của bạn'}</h2>
                                    <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-300">
                                        <PartnerStatusBadge status={summary?.verificationStatus || 'VERIFIED'} />
                                        <span>{summary?.status || 'ACTIVE'}</span>
                                        <span>{summary?.completionRate || 0}% hoàn thành</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Link to="/partner/services" className="px-5 py-3 bg-white text-gray-900 rounded-2xl font-black text-sm hover:bg-orange-100 flex items-center gap-2"><Scissors className="w-4 h-4" /> Dịch vụ</Link>
                                    <Link to="/partner/schedule" className="px-5 py-3 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Lịch</Link>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {metricConfig.map(([key, label, Icon, cls]) => (
                                <div key={key} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${cls}`}><Icon className="w-6 h-6" /></div>
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">{label}</p>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{key === 'completionRate' ? `${summary?.[key] || 0}%` : summary?.[key] ?? 0}</p>
                                </div>
                            ))}
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-black">Booking cần xử lý</h3>
                                    <Link to="/partner/bookings" className="text-orange-600 font-black text-sm">Xem tất cả</Link>
                                </div>
                                {summary?.actionRequiredBookings?.length ? (
                                    <div className="space-y-3">
                                        {summary.actionRequiredBookings.map((booking) => (
                                            <Link to={`/partner/bookings/${booking.bookingId}`} key={booking.bookingId} className="block p-4 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-all">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-black">{booking.bookingCode} · {booking.customerName || 'Khách hàng'}</p>
                                                        <p className="text-sm text-gray-500 font-semibold">{booking.serviceName} · {booking.appointmentDateDisplay} {booking.appointmentTime}</p>
                                                    </div>
                                                    <PartnerStatusBadge status={booking.statusLabel || booking.status} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : <PartnerEmptyState title="Không có booking cần xử lý" message="Các booking chờ confirm/start/complete sẽ xuất hiện tại đây." />}
                            </div>

                            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                                <h3 className="text-xl font-black mb-5">Dịch vụ được đặt nhiều</h3>
                                {summary?.topServices?.length ? (
                                    <div className="space-y-3">
                                        {summary.topServices.map((service) => (
                                            <div key={service.providerServiceId} className="p-4 rounded-2xl bg-gray-50 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Store className="w-5 h-5" /></div>
                                                    <p className="font-black">{service.serviceName || 'Dịch vụ'}</p>
                                                </div>
                                                <span className="font-black text-orange-600">{service.bookingCount} booking</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <PartnerEmptyState title="Chưa có dữ liệu dịch vụ" message="Top service sẽ được cập nhật khi phát sinh booking." />}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </PartnerLayout>
    );
};

export default PartnerDashboardPage;