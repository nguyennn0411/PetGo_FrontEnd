import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, Eye, Filter, RefreshCw, RotateCcw, Search, XCircle } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerEmptyState, PartnerErrorState, PartnerLoadingState, PartnerStatusBadge, getPartnerErrorMessage, usePartnerToast } from '../../components/partner/PartnerStates';
import { confirmPartnerBooking, getPartnerBookings, getPartnerServices, rejectPartnerBooking } from '../../api/partner';

const statuses = [
    ['ALL', 'Tất cả'],
    ['PENDING', 'Chờ provider xác nhận'],
    ['CONFIRMED', 'Đã xác nhận'],
    ['IN_PROGRESS', 'Đang phục vụ'],
    ['COMPLETED', 'Hoàn thành'],
    ['CANCELLED', 'Đã hủy'],
];

const priorityCards = [
    ['PENDING', 'Chờ nhận', 'bg-amber-50 text-amber-700 border-amber-100'],
    ['CONFIRMED', 'Đã nhận', 'bg-green-50 text-green-700 border-green-100'],
    ['IN_PROGRESS', 'Đang làm', 'bg-blue-50 text-blue-700 border-blue-100'],
    ['COMPLETED', 'Hoàn tất', 'bg-gray-50 text-gray-700 border-gray-100'],
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
    const [mutatingId, setMutatingId] = useState(null);
    const [error, setError] = useState('');
    const { showToast } = usePartnerToast();

    const bookingItems = useMemo(() => payload?.bookings || [], [payload]);
    const bookingCounts = useMemo(() => payload?.counts || {}, [payload]);

    const validateRange = () => {
        if (from && to && new Date(from) > new Date(to)) {
            const message = 'Ngày bắt đầu không được sau ngày kết thúc.';
            setError(message);
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
            if (showSuccess) showToast({ tone: 'success', title: 'Đã cập nhật danh sách', message: 'Danh sách booking đã được tải theo bộ lọc hiện tại.' });
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể tải booking partner.');
            setError(message);
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

    const isPendingConfirmation = (booking) => ['PENDING_PROVIDER_CONFIRMATION', 'PENDING_CONFIRMATION'].includes(String(booking?.status || '').toUpperCase());

    const runQuickAction = async (event, booking, actionType) => {
        event.preventDefault();
        event.stopPropagation();
        const isReject = actionType === 'reject';
        const note = isReject
            ? window.prompt('Nhập lý do từ chối booking (tối thiểu 5 ký tự):')
            : null;
        if (isReject) {
            if (note === null) return;
            if (note.trim().length < 5) {
                const message = 'Lý do từ chối cần tối thiểu 5 ký tự.';
                setError(message);
                showToast({ tone: 'warning', title: 'Lý do chưa hợp lệ', message });
                return;
            }
        } else if (!window.confirm(`Xác nhận nhận lịch ${booking.bookingCode}?`)) {
            return;
        }
        try {
            setMutatingId(booking.bookingId);
            setError('');
            if (isReject) {
                await rejectPartnerBooking(booking.bookingId, { reasonCode: 'PROVIDER_REJECTED', reasonText: note.trim(), note: note.trim() });
            } else {
                await confirmPartnerBooking(booking.bookingId, { note: 'Partner xác nhận booking từ danh sách.' });
            }
            const message = isReject ? 'Đã từ chối booking và hoàn tiền về ví user.' : 'Đã xác nhận nhận booking.';
            showToast({ tone: 'success', title: 'Đã cập nhật booking', message });
            await loadBookings(false);
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Thao tác booking thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Thao tác thất bại', message });
        } finally {
            setMutatingId(null);
        }
    };

    const resetFilters = async () => {
        setStatus('ALL');
        setFrom('');
        setTo('');
        setServiceId('');
        await loadBookings(true, { status: 'ALL' });
    };

    return (
        <PartnerLayout title="Duyệt & quản lý booking" subtitle="Xác nhận booking mới, theo dõi lịch phục vụ và hoàn tất dịch vụ">
            <div className="space-y-6">
                <section className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-xs font-black uppercase tracking-widest text-orange-500">Partner bookings</p>
                            <h1 className="mt-2 text-3xl sm:text-4xl font-black leading-tight text-gray-900">Quản lý đặt lịch</h1>
                            <p className="mt-2 text-gray-500 font-semibold">Nhận hoặc từ chối booking mới, theo dõi lịch đã xác nhận.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:min-w-[420px]">
                            {priorityCards.map(([value, label, tone]) => (
                                <div key={value} className={`rounded-2xl px-4 py-3 border ${tone}`}>
                                    <p className="text-xs uppercase tracking-widest font-black">{label}</p>
                                    <p className="mt-1 text-2xl font-black">{bookingCounts?.[value] ?? 0}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {error && <PartnerErrorState message={error} onRetry={loadBookings} />}

                <section className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm space-y-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2"><Filter className="w-4 h-4" /> Bộ lọc</p>
                            <h2 className="text-2xl font-black mt-1">Bộ lọc danh sách</h2>
                        </div>
                        <div className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> {bookingItems.length} booking đang hiển thị
                        </div>
                    </div>

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
                        <button onClick={() => loadBookings(true)} className="self-end px-5 py-3 rounded-2xl bg-gray-900 text-white font-black flex items-center justify-center gap-2 hover:bg-orange-500 transition-all"><Search className="w-4 h-4" /> Lọc</button>
                        <button onClick={resetFilters} className="self-end px-5 py-3 rounded-2xl bg-gray-50 text-gray-600 border border-gray-100 font-black flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 transition-all"><RotateCcw className="w-4 h-4" /> Reset</button>
                    </div>
                </section>

                {loading ? <PartnerLoadingState /> : bookingItems.length ? (
                    <div className="space-y-3">
                        {bookingItems.map((booking) => (
                            <Link to={`/partner/bookings/${booking.bookingId}`} key={booking.bookingId} className={`block bg-white rounded-[2rem] border p-5 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all group ${isPendingConfirmation(booking) ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'}`}>
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isPendingConfirmation(booking) ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : 'bg-orange-50 text-orange-500 group-hover:bg-orange-100'}`}>{isPendingConfirmation(booking) ? <Clock3 className="w-6 h-6" /> : <CalendarDays className="w-6 h-6" />}</div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black">{booking.bookingCode}</h3>
                                                <PartnerStatusBadge status={booking.statusLabel || booking.status} />
                                                {isPendingConfirmation(booking) && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">Chờ nhận lịch</span>}
                                            </div>
                                            <p className="text-gray-700 font-black">{booking.customerName || 'Khách hàng'} · {booking.petName || 'Thú cưng'}</p>
                                            <p className="text-sm text-gray-500 font-semibold">{booking.serviceName} · {booking.appointmentDateDisplay} {booking.appointmentTime}</p>
                                            {booking.customerPhone && <p className="text-xs text-gray-400 font-bold mt-1">SĐT khách: {booking.customerPhone}</p>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col lg:items-end gap-3">
                                        <div className="text-left lg:text-right">
                                            <p className="text-xl font-black text-orange-600">{booking.totalAmountDisplay}</p>
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">{paymentLabels[booking.paymentStatus] || booking.paymentStatus || 'Ví/escrow đang giữ'}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                                            {isPendingConfirmation(booking) && <button disabled={mutatingId === booking.bookingId} onClick={(event) => runQuickAction(event, booking, 'confirm')} className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-black text-xs flex items-center gap-1.5 hover:bg-green-700 shadow-sm disabled:opacity-60"><CheckCircle2 className="w-4 h-4" /> Nhận đặt lịch</button>}
                                            {isPendingConfirmation(booking) && <button disabled={mutatingId === booking.bookingId} onClick={(event) => runQuickAction(event, booking, 'reject')} className="px-3 py-2 rounded-xl bg-red-50 text-red-700 font-black text-xs flex items-center gap-1.5 hover:bg-red-100 disabled:opacity-60"><XCircle className="w-4 h-4" /> Từ chối</button>}
                                            <span className="px-3 py-2 rounded-xl bg-gray-50 text-gray-600 font-black text-xs flex items-center gap-1.5"><Eye className="w-4 h-4" /> Chi tiết</span>
                                        </div>
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