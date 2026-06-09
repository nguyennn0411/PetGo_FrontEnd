import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    BadgeCheck,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    Clock,
    Loader2,
    MapPin,
    PawPrint,
    ShieldCheck,
    User,
    Wallet,
    RefreshCcw,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createBooking, getBookingAvailableDates, getBookingAvailableSlots, getBookingCreateContext } from '../api/bookings';
import { resolveUserId } from '../utils/userIdentity';

const toIsoDate = (value) => {
    if (!value) return '';
    const normalized = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
    const viDateMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (viDateMatch) {
        const [, day, month, year] = viDateMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return normalized;
};

const formatIsoDate = (value) => {
    if (!value) return 'Chưa chọn';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatCurrency = (value, currency = 'VND') => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
}).format(Number(value || 0));

const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const reasonLabels = {
    AVAILABLE: 'Có thể đặt',
    FULL: 'Slot đã hết capacity',
    CLOSED: 'Provider đóng cửa ngày này',
    NOT_CONFIGURED: 'Provider chưa cấu hình lịch',
    PAST: 'Khung giờ đã qua',
    LEAD_TIME_REQUIRED: 'Không đạt thời gian đặt trước tối thiểu',
    LOCKED_BY_PROVIDER: 'Provider đang khóa nhận lịch',
    BREAK_TIME: 'Trùng giờ nghỉ của provider',
    OUTSIDE_WORKING_HOURS: 'Ngoài giờ làm việc',
};

const submitErrorLabels = {
    FULL: 'Slot vừa chọn đã hết capacity. Vui lòng tải lại slot và chọn giờ khác.',
    CLOSED: 'Provider đóng cửa vào ngày/giờ đã chọn. Vui lòng chọn ngày khác.',
    NOT_CONFIGURED: 'Provider chưa cấu hình lịch cho dịch vụ này.',
    PAST: 'Khung giờ đã qua. Vui lòng chọn slot mới.',
    LEAD_TIME_REQUIRED: 'Khung giờ không đạt thời gian đặt trước tối thiểu. Vui lòng chọn giờ xa hơn.',
    LOCKED_BY_PROVIDER: 'Provider đang khóa nhận lịch ở khung giờ này.',
    BREAK_TIME: 'Khung giờ trùng giờ nghỉ của provider.',
    OUTSIDE_WORKING_HOURS: 'Khung giờ ngoài giờ làm việc của provider.',
};

const normalizeAvailabilityItems = (response = {}) => {
    const items = response.slots || [];
    if (items.length) return items;
    if (response.date) {
        return [{
            date: response.date,
            status: response.status || 'AVAILABLE',
            reason: response.reason,
            capacityRemaining: response.maxConcurrent,
        }];
    }
    return [];
};

const BookingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { account } = useContext(AuthContext);

    const userId = resolveUserId(account);
    const providerId = Number(searchParams.get('providerId') || '');
    const initialProviderServiceId = searchParams.get('providerServiceId') || searchParams.get('serviceId');
    const serviceLockedByQuery = Boolean(initialProviderServiceId);
    const initialSlotDate = toIsoDate(searchParams.get('slotDate') || '');
    const initialTime = searchParams.get('time') || '';

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [contextData, setContextData] = useState(null);
    const [dateOptions, setDateOptions] = useState([]);
    const [slots, setSlots] = useState([]);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        petId: '',
        providerServiceId: initialProviderServiceId || '',
        appointmentDate: '',
        startTime: '',
        slotId: '',
        customerNote: '',
    });

    const loadContext = async ({ providerServiceId, keepDate = false, keepTime = false } = {}) => {
        if (!userId || !providerId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await getBookingCreateContext({
                providerId,
                providerServiceId: providerServiceId || undefined,
                slotDate: keepDate ? formData.appointmentDate || initialSlotDate || undefined : initialSlotDate || undefined,
                time: keepTime ? formData.startTime || initialTime || undefined : initialTime || undefined,
            });
            const normalizedData = {
                ...data,
                selectedDate: toIsoDate(data.selectedDate),
                slots: (data.slots || []).map((slot) => ({ ...slot, date: toIsoDate(slot.date) })),
                availableDates: [],
            };
            setContextData(normalizedData);
            setDateOptions([]);
            setSlots([]);
            const onlyPet = normalizedData.pets?.length === 1 ? normalizedData.pets[0] : null;
            setFormData((prev) => ({
                ...prev,
                petId: prev.petId || (onlyPet ? String(onlyPet.id) : ''),
                providerServiceId: String(normalizedData.selectedProviderServiceId || providerServiceId || prev.providerServiceId || ''),
                appointmentDate: keepDate ? prev.appointmentDate || normalizedData.selectedDate || '' : normalizedData.selectedDate || '',
                startTime: keepTime ? prev.startTime || normalizedData.selectedTime || '' : normalizedData.selectedTime || '',
                slotId: normalizedData.selectedSlotId ? String(normalizedData.selectedSlotId) : '',
            }));
        } catch (err) {
            setError(getErrorMessage(err, 'Không tải được dữ liệu đặt lịch.'));
            setContextData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContext({ providerServiceId: initialProviderServiceId, keepDate: false, keepTime: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, providerId]);

    const selectedService = useMemo(
        () => contextData?.services?.find((service) => String(service.id) === String(formData.providerServiceId)) || null,
        [contextData, formData.providerServiceId],
    );

    const selectedPet = useMemo(
        () => contextData?.pets?.find((pet) => String(pet.id) === String(formData.petId)) || null,
        [contextData, formData.petId],
    );

    const loadDates = async (serviceId = formData.providerServiceId) => {
        if (!providerId || !serviceId) return;
        setAvailabilityLoading(true);
        setError('');
        try {
            const response = await getBookingAvailableDates({ providerId, providerServiceId: serviceId, days: 14 });
            setDateOptions(normalizeAvailabilityItems(response).map((item) => ({ ...item, date: toIsoDate(item.date) })));
        } catch (err) {
            setError(getErrorMessage(err, 'Không tải được ngày khả dụng.'));
            setDateOptions([]);
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const loadSlots = async (date, serviceId = formData.providerServiceId) => {
        if (!providerId || !serviceId || !date) return;
        setSlotsLoading(true);
        setError('');
        try {
            const response = await getBookingAvailableSlots({ providerId, providerServiceId: serviceId, date });
            setSlots(normalizeAvailabilityItems(response).map((slot) => ({ ...slot, date: toIsoDate(slot.date || date) })));
        } catch (err) {
            setError(getErrorMessage(err, 'Không tải được khung giờ khả dụng.'));
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    useEffect(() => {
        if (formData.providerServiceId && contextData) loadDates(formData.providerServiceId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.providerServiceId, contextData]);

    const visibleDates = dateOptions;
    const slotsForDate = useMemo(() => slots.filter((slot) => slot.date === formData.appointmentDate), [formData.appointmentDate, slots]);

    const bookingSummary = useMemo(() => ({
        providerName: contextData?.provider?.name || 'Đang cập nhật',
        providerAddress: contextData?.provider?.address || 'Chưa có địa chỉ',
        serviceName: selectedService?.name || 'Chưa chọn dịch vụ',
        petName: selectedPet?.label || 'Chưa chọn thú cưng',
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
        totalAmount: selectedService?.priceAmount || 0,
        currencyCode: selectedService?.currencyCode || 'VND',
    }), [contextData, selectedService, selectedPet, formData.appointmentDate, formData.startTime]);

    const walletBalance = Number(contextData?.walletBalance || 0);
    const missingAmount = Math.max(0, Number(bookingSummary.totalAmount || 0) - walletBalance);
    const hasAvailableSlot = slotsForDate.some((slot) => (slot.status || 'AVAILABLE') === 'AVAILABLE');
    const isSubmitDisabled = loading || submitting || !formData.petId || !formData.providerServiceId || !formData.appointmentDate || !formData.startTime || missingAmount > 0 || !hasAvailableSlot;
    const submitHint = !formData.petId ? 'Chọn thú cưng trước khi đặt lịch.'
        : !formData.providerServiceId ? 'Chọn dịch vụ trước khi đặt lịch.'
            : !formData.appointmentDate ? 'Chọn ngày hẹn trước khi đặt lịch.'
                : !formData.startTime ? 'Chọn khung giờ còn trống trước khi đặt lịch.'
                    : missingAmount > 0 ? 'Ví PetGo chưa đủ số dư, vui lòng nạp ví.'
                        : !hasAvailableSlot ? 'Không có slot khả dụng để gửi yêu cầu.'
                            : 'Sẵn sàng gửi yêu cầu đặt lịch.';

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleServiceChange = async (event) => {
        const value = event.target.value;
        setFormData((prev) => ({ ...prev, providerServiceId: value, appointmentDate: '', startTime: '', slotId: '' }));
        setSlots([]);
        await loadContext({ providerServiceId: value, keepDate: false, keepTime: false });
    };

    const handleDateChange = (date) => {
        setFormData((prev) => ({ ...prev, appointmentDate: date, startTime: '', slotId: '' }));
        setErrors((prev) => ({ ...prev, appointmentDate: undefined, startTime: undefined }));
        loadSlots(date);
    };

    const handleSlotSelect = (slot) => {
        setFormData((prev) => ({ ...prev, appointmentDate: slot.date, startTime: slot.startTime, slotId: slot.slotId ? String(slot.slotId) : '' }));
        setErrors((prev) => ({ ...prev, startTime: undefined }));
    };

    const validateForm = () => {
        const nextErrors = {};
        if (!formData.petId) nextErrors.petId = 'Vui lòng chọn thú cưng';
        if (!formData.providerServiceId) nextErrors.providerServiceId = 'Vui lòng chọn dịch vụ';
        if (!formData.appointmentDate) nextErrors.appointmentDate = 'Vui lòng chọn ngày hẹn';
        if (!formData.startTime) nextErrors.startTime = 'Vui lòng chọn khung giờ';
        if (missingAmount > 0) nextErrors.wallet = 'Ví PetGo không đủ để đặt lịch';
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !userId || !providerId) return;
        setSubmitting(true);
        setError('');
        try {
            const booking = await createBooking({
                petId: Number(formData.petId),
                providerId,
                providerServiceId: Number(formData.providerServiceId),
                slotId: formData.slotId ? Number(formData.slotId) : undefined,
                appointmentDate: formData.appointmentDate,
                startTime: formData.startTime,
                customerNote: formData.customerNote || undefined,
            });
            navigate(`/booking-success?bookingId=${booking.bookingId}`, { replace: true, state: { bookingId: booking.bookingId, booking } });
        } catch (err) {
            const data = err?.response?.data || {};
            const errorCode = data.code || data.errorCode || data.status;
            if (errorCode === 'INSUFFICIENT_WALLET_BALANCE') {
                const missing = data.missingAmount != null ? formatCurrency(data.missingAmount, bookingSummary.currencyCode) : 'một khoản tiền';
                setErrors((prev) => ({ ...prev, wallet: `Ví PetGo không đủ. Bạn còn thiếu ${missing}.` }));
                setError(`Ví PetGo không đủ để giữ tiền booking. Vui lòng nạp thêm ${missing} rồi thử lại.`);
            } else if (submitErrorLabels[errorCode]) {
                setError(submitErrorLabels[errorCode]);
                if (['FULL', 'LEAD_TIME_REQUIRED', 'LOCKED_BY_PROVIDER', 'BREAK_TIME', 'OUTSIDE_WORKING_HOURS', 'PAST'].includes(errorCode)) {
                    setErrors((prev) => ({ ...prev, startTime: submitErrorLabels[errorCode] }));
                    loadSlots(formData.appointmentDate);
                }
            } else {
                setError(getErrorMessage(err, 'Không tạo được booking. Vui lòng thử lại.'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!providerId) return <BlockingState icon={<AlertCircle className="h-10 w-10 text-red-500" />} title="Thiếu thông tin nhà cung cấp" message="BookingPage cần providerId từ trang provider." action={<Link to="/search" className="rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white">Quay lại tìm kiếm</Link>} />;
    if (!userId) return <BlockingState icon={<ShieldCheck className="h-10 w-10 text-orange-500" />} title="Bạn chưa đăng nhập" message="Bạn cần đăng nhập để tiếp tục đặt lịch." action={<Link to="/login" className="rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white">Đăng nhập</Link>} />;

    return (
        <div className="min-h-screen bg-[#f7f8fc] text-gray-900">
            <header className="sticky top-0 z-40 border-b border-white/80 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <button onClick={() => navigate(`/providers/${providerId}`)} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-700 shadow-sm hover:border-orange-300 hover:text-orange-600">
                        <ChevronLeft className="h-4 w-4" /> Quay lại
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="rounded-2xl bg-orange-500 p-2 text-white shadow-lg shadow-orange-200/60"><PawPrint className="h-5 w-5" /></div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">PetGo booking</p>
                            <h1 className="text-lg font-black leading-none">Đặt lịch mới</h1>
                        </div>
                    </div>
                    <Link to="/my-bookings" className="hidden rounded-2xl bg-gray-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-orange-500 sm:inline-flex">Lịch của tôi</Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                {error ? <div className="mb-6 flex items-start gap-3 rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div>{error}</div></div> : null}

                {loading ? (
                    <div className="rounded-[2rem] bg-white p-16 text-center shadow-sm">
                        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-500" />
                        <h2 className="text-xl font-black">Đang tải thông tin đặt lịch</h2>
                        <p className="mt-2 text-sm text-gray-500">Vui lòng chờ trong giây lát.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
                        <section className="space-y-6">
                            <div className="overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Đặt lịch</p>
                                        <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">Chọn thông tin hẹn</h2>
                                        <p className="mt-3 max-w-2xl text-sm font-medium text-gray-500">Hoàn tất các bước bên dưới để gửi yêu cầu đặt lịch cho provider.</p>
                                    </div>
                                    <div className="rounded-3xl bg-orange-50 px-5 py-4 text-orange-700">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">Provider</p>
                                        <p className="mt-1 text-base font-black">{contextData?.provider?.name || 'Đang cập nhật'}</p>
                                    </div>
                                </div>
                            </div>

                            <StepIndicator formData={formData} missingAmount={missingAmount} />

                            <div className="space-y-6">
                                <CardSection title="1. Chọn thú cưng" icon={<User className="h-5 w-5" />}>
                                    {contextData?.pets?.length ? <div className="grid gap-3 sm:grid-cols-2">{contextData.pets.map((pet) => <PetCard key={pet.id} pet={pet} active={String(formData.petId) === String(pet.id)} onClick={() => updateField('petId', String(pet.id))} />)}</div> : <EmptyBlock title="Chưa có thú cưng" message="Bạn cần thêm thú cưng trước khi đặt lịch." action={<Link to="/add-pet" className="rounded-2xl bg-orange-500 px-4 py-3 text-xs font-black uppercase tracking-widest text-white">Thêm thú cưng</Link>} />}
                                    {errors.petId ? <FieldError text={errors.petId} /> : null}
                                </CardSection>

                                <CardSection title="2. Chọn dịch vụ" icon={<ShieldCheck className="h-5 w-5" />}>
                                    <div className="relative">
                                        <select value={formData.providerServiceId} onChange={handleServiceChange} disabled={serviceLockedByQuery && !!selectedService} className="w-full appearance-none rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 pr-12 text-sm font-semibold outline-none focus:border-orange-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-orange-50 disabled:text-orange-700">
                                            <option value="">-- Chọn dịch vụ --</option>
                                            {(contextData?.services || []).map((service) => <option key={service.id} value={service.id}>{service.name} · {service.priceDisplay}</option>)}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    {selectedService ? <ServicePreview service={selectedService} /> : null}
                                    {errors.providerServiceId ? <FieldError text={errors.providerServiceId} /> : null}
                                </CardSection>

                                <CardSection title="3. Chọn ngày" icon={<Calendar className="h-5 w-5" />}>
                                    {availabilityLoading ? <LoadingInline text="Đang tải ngày trống..." /> : visibleDates.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleDates.map((option, index) => <DateCard key={option.date || index} date={option.date} option={option} active={formData.appointmentDate === option.date} onClick={() => handleDateChange(option.date)} />)}</div> : <EmptyBlock title="Chưa có ngày phù hợp" message="Vui lòng thử lại hoặc chọn dịch vụ khác." action={<button type="button" onClick={() => loadDates()} className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white"><RefreshCcw className="h-4 w-4" /> Thử lại</button>} />}
                                    {errors.appointmentDate ? <FieldError text={errors.appointmentDate} /> : null}
                                </CardSection>

                                <CardSection title="4. Chọn khung giờ" icon={<Clock className="h-5 w-5" />}>
                                    {slotsLoading ? <LoadingInline text="Đang tải khung giờ..." /> : slotsForDate.length ? <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">{slotsForDate.map((slot, index) => <SlotCard key={slot.slotId || `${slot.date}-${slot.startTime}-${index}`} slot={slot} active={String(formData.slotId) === String(slot.slotId) || (!formData.slotId && formData.startTime === slot.startTime)} onClick={() => handleSlotSelect(slot)} />)}</div> : <EmptyBlock title="Chưa có khung giờ" message={formData.appointmentDate ? 'Ngày này chưa còn khung giờ phù hợp.' : 'Hãy chọn ngày trước.'} action={formData.appointmentDate ? <button type="button" onClick={() => loadSlots(formData.appointmentDate)} className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white"><RefreshCcw className="h-4 w-4" /> Tải lại</button> : null} />}
                                    {errors.startTime ? <FieldError text={errors.startTime} /> : null}
                                    {errors.wallet ? <FieldError text={errors.wallet} /> : null}
                                </CardSection>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 rounded-[2rem] bg-white p-5 shadow-sm">
                                <Link to={`/providers/${providerId}`} className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-700 hover:border-orange-300 hover:text-orange-600">Hủy</Link>
                                <button onClick={handleSubmit} disabled={isSubmitDisabled} title={submitHint} className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-100 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {submitting ? 'Đang gửi...' : 'Đặt lịch'}
                                </button>
                            </div>
                        </section>

                        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                            <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
                                <h3 className="text-lg font-black text-gray-950">Tóm tắt đặt lịch</h3>
                                <div className="mt-5 space-y-3 text-sm"><SummaryLine label="Provider" value={bookingSummary.providerName} /><SummaryLine label="Địa chỉ" value={bookingSummary.providerAddress} /><SummaryLine label="Thú cưng" value={bookingSummary.petName} /><SummaryLine label="Dịch vụ" value={bookingSummary.serviceName} /><SummaryLine label="Ngày" value={formatIsoDate(bookingSummary.appointmentDate)} /><SummaryLine label="Giờ" value={bookingSummary.startTime || 'Chưa chọn'} /></div>
                                <div className="mt-5 rounded-3xl bg-gray-950 p-5 text-white">
                                    <div className="flex items-center justify-between gap-4"><span className="text-xs font-black uppercase tracking-widest text-white/50">Tổng tiền</span><span className="text-xl font-black">{formatCurrency(bookingSummary.totalAmount, bookingSummary.currencyCode)}</span></div>
                                    <div className="mt-3 flex items-center justify-between gap-4 text-sm"><span className="inline-flex items-center gap-2 text-white/60"><Wallet className="h-4 w-4 text-orange-300" /> Ví PetGo</span><span className="font-bold">{formatCurrency(walletBalance, contextData?.walletCurrencyCode || 'VND')}</span></div>
                                </div>
                                {missingAmount > 0 ? <div className="mt-4 rounded-3xl bg-red-50 p-4 text-sm font-semibold text-red-600">Ví còn thiếu {formatCurrency(missingAmount, bookingSummary.currencyCode)}. <Link to="/wallet" className="font-black underline">Nạp ví</Link></div> : <p className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Ví đủ số dư để đặt lịch.</p>}
                                <p className="mt-4 text-xs font-bold text-gray-500">{submitHint}</p>
                            </div>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
};

const BlockingState = ({ icon, title, message, action }) => <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6"><div className="w-full max-w-xl rounded-[2rem] border border-orange-100 bg-white p-8 text-center shadow-sm"> <div className="mb-4 flex justify-center">{icon}</div><h1 className="mb-2 text-2xl font-black text-gray-900">{title}</h1><p className="mb-6 text-sm font-medium text-gray-500">{message}</p>{action}</div></div>;
const CardSection = ({ title, icon, children }) => <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-2xl bg-orange-50 p-3 text-orange-500">{icon}</div><h2 className="text-xl font-black text-gray-900">{title}</h2></div>{children}</section>;
const EmptyBlock = ({ title, message, action }) => <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center"><p className="text-base font-black text-gray-900">{title}</p><p className="mt-2 text-sm text-gray-500">{message}</p>{action ? <div className="mt-4 flex justify-center">{action}</div> : null}</div>;
const FieldError = ({ text }) => <p className="mt-3 text-sm font-semibold text-red-600">{text}</p>;
const LoadingInline = ({ text }) => <div className="flex items-center gap-2 rounded-3xl bg-gray-50 p-5 text-sm font-semibold text-gray-500"><Loader2 className="h-4 w-4 animate-spin text-orange-500" />{text}</div>;
const StepIndicator = ({ formData, missingAmount }) => {
    const steps = [
        { label: 'Pet', done: !!formData.petId },
        { label: 'Dịch vụ', done: !!formData.providerServiceId },
        { label: 'Ngày', done: !!formData.appointmentDate },
        { label: 'Giờ', done: !!formData.startTime },
        { label: 'Xác nhận', done: !!formData.petId && !!formData.providerServiceId && !!formData.appointmentDate && !!formData.startTime && missingAmount <= 0 },
    ];
    return <div className="rounded-[2rem] border border-white bg-white p-4 shadow-sm"><div className="grid gap-2 sm:grid-cols-5">{steps.map((step, index) => <div key={step.label} className={`rounded-2xl px-4 py-3 text-center ${step.done ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}><p className="text-[10px] font-black uppercase tracking-widest">{index + 1}</p><p className="mt-1 text-sm font-black">{step.label}</p></div>)}</div></div>;
};
const PetCard = ({ pet, active, onClick }) => <button type="button" onClick={onClick} className={`rounded-3xl border p-4 text-left transition-all ${active ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100/60' : 'border-gray-200 bg-white hover:border-orange-200 hover:shadow-sm'}`}><div className="flex items-center gap-4"><img src={pet.avatarUrl || 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=300'} alt={pet.name} className="h-14 w-14 rounded-2xl object-cover" /><div><p className="font-black text-gray-900">{pet.name}</p><p className="text-sm text-gray-500">{pet.breed || pet.species}</p><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{pet.ageLabel || 'Chưa rõ tuổi'}</p></div></div></button>;
const ServicePreview = ({ service }) => <div className="mt-4 rounded-3xl border border-gray-200 bg-gray-50 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-gray-900">{service.name}</p><p className="mt-1 text-sm text-gray-500">{service.description || 'Chưa có mô tả.'}</p></div><span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">{service.durationLabel}</span></div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-widest text-gray-400">{service.categoryName || 'Dịch vụ chăm sóc'}</p><p className="text-xl font-black text-gray-900">{service.priceDisplay}</p></div></div>;
const DateCard = ({ date, option, active, onClick }) => { const status = option?.status || 'AVAILABLE'; const disabled = status !== 'AVAILABLE'; return <button type="button" disabled={disabled} onClick={onClick} className={`rounded-3xl border p-4 text-left transition-all ${disabled ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-70' : active ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100/60' : 'border-gray-200 bg-white hover:border-orange-200 hover:shadow-sm'}`}><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{reasonLabels[status] || status}</p><p className="mt-2 text-lg font-black text-gray-900">{formatIsoDate(date)}</p>{option?.reason || disabled ? <p className="mt-2 text-xs font-semibold text-orange-700">{option?.reason || reasonLabels[status]}</p> : null}</button>; };
const SlotCard = ({ slot, active, onClick }) => { const status = slot.status || 'AVAILABLE'; const disabled = status !== 'AVAILABLE'; return <button type="button" disabled={disabled} onClick={onClick} className={`rounded-3xl border p-4 text-left transition-all ${disabled ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400' : active ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg shadow-orange-100/60' : 'border-gray-200 bg-white hover:border-orange-200 hover:shadow-sm'}`}><p className="text-xl font-black">{slot.startTime || slot.label}</p><p className="mt-1 text-[10px] font-black uppercase tracking-widest">{disabled ? (reasonLabels[status] || status) : `Còn ${slot.capacityRemaining ?? '?'} chỗ`}</p>{slot.reason ? <p className="mt-2 text-xs font-semibold">{slot.reason}</p> : null}</button>; };
const SummaryLine = ({ label, value }) => <div className="flex items-start justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{label}</span><span className="text-right text-sm font-bold text-gray-900">{value}</span></div>;

export default BookingPage;