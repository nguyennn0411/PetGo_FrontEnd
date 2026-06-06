import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, RefreshCw, RotateCcw, Search } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerEmptyState, PartnerErrorState, PartnerLoadingState, PartnerNotice, PartnerStatusBadge, getPartnerErrorMessage, usePartnerToast } from '../../components/partner/PartnerStates';
import { getPartnerBookings, getPartnerServices } from '../../api/partner';

const statuses = [
    ['ALL', 'Tất cả'],
    ['PENDING', 'Chờ xử lý'],
    ['CONFIRMED', 'Đã xác nhận'],
    ['IN_PROGRESS', 'Đang phục vụ'],
    ['COMPLETED', 'Hoàn thành'],
    ['CANCELLED', 'Đã hủy'],
];

const paymentLabels = {
    SUCCEEDED: 'Đã thanh toán',
    PAID: 'Đã thanh toán',
    PENDING: 'Chờ thanh toán',
    PROCESSING: 'Đang xử lý',
    FAILED: 'Thanh toán lỗi',
    CANCELLED: 'Đã hủy',
};

const getServiceName = (service) => service?.displayName || service?.customName || service?.serviceName || `Dịch vụ #${service?.id}`;

const PartnerBookingsPage = () => {
    const [payload, setPayload] = useState(null);
    const [services, setServices] = useState([]);
    const [status, setStatus] = useState('ALL');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { showToast } = usePartnerToast();

    const validateRange = () => {
        if (from && to && new Date(from) > new Date(to)) {
            const message = 'Ngày bắt đầu không được sau ngày kết thúc.';
            setError(message);
            setSuccess('');
            showToast({ tone: 'warning', title: 'Bộ lọc chưa hợp lệ', message });
            return false;
        }
        return true;
    };

    const loadBookings = async (showSuccess = false, overrideParams = null) => {
        if (!overrideParams && !validateRange()) return;
        try {
            setLoading(true);
            setError('');
            const params = overrideParams || {
                status,
                ...(from ? { from } : {}),
                ...(to ? { to } : {}),
                ...(serviceId ? { serviceId } : {}),
            };
            setPayload(await getPartnerBookings(params));
            setSuccess(showSuccess ? 'Đã cập nhật danh sách booking theo bộ lọc hiện tại.' : '');
            if (showSuccess) showToast({ tone: 'success', title: 'Đã cập nhật danh sách', message: 'Danh sách booking đã được tải theo bộ lọc hiện tại.' });
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể tải booking partner.');
            setError(message);
            setSuccess('');
            showToast({ tone: 'error', title: 'Không tải được booking', message });
        } finally {
            setLoading(false);
        }
    };

    const loadServices = async () => {
        try {
            const data = await getPartnerServices();
            setServices(Array.isArray(data) ? data : []);
        } catch {
            setServices([]);
        }
    };

    useEffect(() => { loadServices(); }, []);
    useEffect(() => { loadBookings(false); }, [status]);

    const resetFilters = async () => {
        setStatus('ALL');
        setFrom('');
        setTo('');
        setServiceId('');
        setSuccess('');
        await loadBookings(true, { status: 'ALL' });
    };

    return (
        <PartnerLayout title="Booking" subtitle="Theo dõi và xử lý booking thuộc provider">
            <div className="space-y-6">
                {error && <PartnerErrorState message={error} onRetry={loadBookings} />}
                {success && !error && <PartnerNotice tone="success" title="Đã cập nhật danh sách" message={success} onDismiss={() => setSuccess('')} />}

                <section className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {statuses.map(([value, label]) => (
                            <button key={value} onClick={() => setStatus(value)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${status === value ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}>
                                {label} {payload?.counts?.[value] !== undefined ? `(${payload.counts[value]})` : ''}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr_auto_auto] gap-3">
                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Từ ngày</span>
                            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold" />
                        </label>
                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Đến ngày</span>
                            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold" />
                        </label>
                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Dịch vụ</span>
                            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold">
                                <option value="">Tất cả dịch vụ</option>
                                {services.map((service) => <option key={service.id} value={service.id}>{getServiceName(service)}</option>)}
                            </select>
                        </label>
                        <button onClick={() => loadBookings(true)} className="self-end px-5 py-3 rounded-2xl bg-gray-900 text-white font-black flex items-center justify-center gap-2 hover:bg-orange-500"><Search className="w-4 h-4" /> Lọc</button>
                        <button onClick={resetFilters} className="self-end px-5 py-3 rounded-2xl bg-gray-50 text-gray-600 border border-gray-100 font-black flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-600"><RotateCcw className="w-4 h-4" /> Reset</button>
                    </div>
                </section>

                {loading ? <PartnerLoadingState /> : payload?.bookings?.length ? (
                    <div className="space-y-3">
                        {payload.bookings.map((booking) => (
                            <Link to={`/partner/bookings/${booking.bookingId}`} key={booking.bookingId} className="block bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center"><CalendarDays className="w-6 h-6" /></div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black">{booking.bookingCode}</h3>
                                                <PartnerStatusBadge status={booking.statusLabel || booking.status} />
                                            </div>
                                            <p className="text-gray-700 font-black">{booking.customerName || 'Khách hàng'} · {booking.petName || 'Thú cưng'}</p>
                                            <p className="text-sm text-gray-500 font-semibold">{booking.serviceName} · {booking.appointmentDateDisplay} {booking.appointmentTime}</p>
                                        </div>
                                    </div>
                                    <div className="text-left lg:text-right">
                                        <p className="text-xl font-black text-orange-600">{booking.totalAmountDisplay}</p>
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">{paymentLabels[booking.paymentStatus] || booking.paymentStatus || 'Chưa có payment'}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : <PartnerEmptyState title="Không có booking phù hợp" message="Thử đổi trạng thái, khoảng ngày hoặc dịch vụ để xem booking khác." action={<div className="flex flex-wrap justify-center gap-3"><button onClick={() => loadBookings(true)} className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-black flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button><button onClick={resetFilters} className="px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-black flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reset filter</button></div>} />}
            </div>
        </PartnerLayout>
    );
};

export default PartnerBookingsPage;