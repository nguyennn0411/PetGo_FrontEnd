import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Copy, Eye, Lock, RotateCcw, Save, Trash2, Unlock } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerErrorState, PartnerLoadingState, getPartnerErrorMessage, usePartnerToast } from '../../components/partner/PartnerStates';
import {
    copyPartnerScheduleDay,
    copyPartnerScheduleMonth,
    copyPartnerScheduleYear,
    createPartnerBookingLock,
    deletePartnerScheduleDayOverride,
    getPartnerBookingLocks,
    getPartnerSchedule,
    getPartnerServices,
    savePartnerScheduleDay,
    unlockPartnerBookingLock,
    updatePartnerWeeklySchedule,
} from '../../api/partner';
import { getBookingAvailableSlots } from '../../api/bookings';

const defaultWeeklyHours = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    opensAt: '08:00',
    closesAt: '18:00',
    breakStartsAt: '',
    breakEndsAt: '',
    closed: weekday === 7,
}));

const labels = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ nhật' };

const todayIso = () => new Date().toISOString().slice(0, 10);

const addDaysIso = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
};

const toMinutes = (value) => {
    if (!value) return null;
    const [hour, minute] = value.split(':').map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
};

const previewReasonLabels = {
    AVAILABLE: 'Có thể đặt',
    FULL: 'Hết capacity',
    CLOSED: 'Đóng cửa',
    NOT_CONFIGURED: 'Chưa cấu hình lịch',
    PAST: 'Đã qua',
    LEAD_TIME_REQUIRED: 'Không đạt lead time',
    LOCKED_BY_PROVIDER: 'Đã khóa bởi provider',
    BREAK_TIME: 'Giờ nghỉ',
    OUTSIDE_WORKING_HOURS: 'Ngoài giờ làm việc',
};

const PartnerSchedulePage = () => {
    const [weeklyHours, setWeeklyHours] = useState(defaultWeeklyHours);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [providerId, setProviderId] = useState(null);
    const [dayOverrides, setDayOverrides] = useState([]);
    const [bookingLocks, setBookingLocks] = useState([]);
    const [services, setServices] = useState([]);
    const [overrideForm, setOverrideForm] = useState({ localDate: todayIso(), type: 'CLOSED', startsAt: '', endsAt: '', maxConcurrentOverride: '', reason: '' });
    const [copyForm, setCopyForm] = useState({ sourceDate: todayIso(), targetDates: '', sourceMonth: todayIso().slice(0, 7), targetMonth: todayIso().slice(0, 7), sourceYear: todayIso().slice(0, 4), targetYear: String(Number(todayIso().slice(0, 4)) + 1) });
    const [lockForm, setLockForm] = useState({ providerServiceId: '', appointmentDate: todayIso(), startTime: '09:00', durationMinutes: 60 });
    const [previewForm, setPreviewForm] = useState({ providerServiceId: '', date: todayIso() });
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const { showToast } = usePartnerToast();

    const openDays = useMemo(() => weeklyHours.filter((day) => !day.closed), [weeklyHours]);

    const loadSchedule = async () => {
        try {
            setLoading(true);
            setError('');
            const [data, locks, serviceData] = await Promise.all([
                getPartnerSchedule({ from: todayIso(), to: addDaysIso(30) }),
                getPartnerBookingLocks({ activeOnly: true }),
                getPartnerServices(),
            ]);
            setProviderId(data?.providerId || null);
            setDayOverrides(data?.dayOverrides || []);
            setBookingLocks(Array.isArray(locks) ? locks : []);
            const loadedServices = Array.isArray(serviceData) ? serviceData : [];
            setServices(loadedServices);
            const firstServiceId = loadedServices[0]?.id || loadedServices[0]?.providerServiceId || '';
            if (firstServiceId) {
                setLockForm((prev) => ({ ...prev, providerServiceId: prev.providerServiceId || String(firstServiceId) }));
                setPreviewForm((prev) => ({ ...prev, providerServiceId: prev.providerServiceId || String(firstServiceId) }));
            }
            if (data?.weeklyHours?.length) {
                setWeeklyHours(defaultWeeklyHours.map((day) => {
                    const existing = data.weeklyHours.find((item) => Number(item.weekday) === day.weekday);
                    return existing ? {
                        weekday: existing.weekday,
                        opensAt: existing.opensAt || '',
                        closesAt: existing.closesAt || '',
                        breakStartsAt: existing.breakStartsAt || '',
                        breakEndsAt: existing.breakEndsAt || '',
                        closed: Boolean(existing.closed),
                    } : day;
                }));
            }
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể tải lịch làm việc.');
            setError(message);
            showToast({ tone: 'error', title: 'Không tải được lịch làm việc', message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSchedule(); }, []);

    const updateDay = (weekday, field, value) => {
        setWeeklyHours((prev) => prev.map((day) => day.weekday === weekday ? { ...day, [field]: value } : day));
    };

    const applyTemplate = (type) => {
        if (type === 'office') {
            setWeeklyHours(defaultWeeklyHours.map((day) => ({
                ...day,
                opensAt: '08:00',
                closesAt: '18:00',
                closed: day.weekday === 7,
            })));
            return;
        }
        if (type === 'all-week') {
            setWeeklyHours(defaultWeeklyHours.map((day) => ({
                ...day,
                opensAt: '08:00',
                closesAt: '18:00',
                closed: false,
            })));
            return;
        }
        setWeeklyHours(defaultWeeklyHours);
    };

    const toggleClosed = (weekday, closed) => {
        setWeeklyHours((prev) => prev.map((day) => day.weekday === weekday ? {
            ...day,
            closed,
            opensAt: closed ? day.opensAt || '08:00' : day.opensAt || '08:00',
            closesAt: closed ? day.closesAt || '18:00' : day.closesAt || '18:00',
        } : day));
    };

    const validateWeeklyHours = () => {
        if (openDays.length === 0) return 'Vui lòng mở ít nhất một ngày trong tuần.';
        for (const day of weeklyHours) {
            if (day.closed) continue;
            const open = toMinutes(day.opensAt);
            const close = toMinutes(day.closesAt);
            if (open === null || close === null) return `${labels[day.weekday]} cần giờ mở cửa và đóng cửa hợp lệ.`;
            if (open >= close) return `${labels[day.weekday]}: giờ mở cửa phải trước giờ đóng cửa.`;
            const breakStart = toMinutes(day.breakStartsAt);
            const breakEnd = toMinutes(day.breakEndsAt);
            if ((day.breakStartsAt && breakStart === null) || (day.breakEndsAt && breakEnd === null)) return `${labels[day.weekday]} có giờ nghỉ không hợp lệ.`;
            if ((breakStart !== null) !== (breakEnd !== null)) return `${labels[day.weekday]} cần nhập đủ giờ bắt đầu và kết thúc nghỉ.`;
            if (breakStart !== null) {
                if (breakStart >= breakEnd) return `${labels[day.weekday]}: giờ bắt đầu nghỉ phải trước giờ kết thúc nghỉ.`;
                if (breakStart < open || breakEnd > close) return `${labels[day.weekday]}: giờ nghỉ phải nằm trong giờ mở cửa.`;
            }
        }
        return '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationMessage = validateWeeklyHours();
        if (validationMessage) {
            setError(validationMessage);
            showToast({ tone: 'warning', title: 'Lịch làm việc chưa hợp lệ', message: validationMessage });
            return;
        }
        try {
            setSaving(true);
            setError('');
            const payload = weeklyHours.map((day) => ({
                weekday: day.weekday,
                opensAt: day.closed ? '' : day.opensAt,
                closesAt: day.closed ? '' : day.closesAt,
                breakStartsAt: day.closed ? '' : day.breakStartsAt,
                breakEndsAt: day.closed ? '' : day.breakEndsAt,
                closed: day.closed,
            }));
            await updatePartnerWeeklySchedule(payload);
            showToast({ tone: 'success', title: 'Đã cập nhật lịch làm việc', message: 'Lịch làm việc mới đã được lưu.' });
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Cập nhật lịch thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Cập nhật lịch thất bại', message });
        } finally {
            setSaving(false);
        }
    };

    const saveOverride = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            await savePartnerScheduleDay(overrideForm.localDate, {
                ...overrideForm,
                maxConcurrentOverride: overrideForm.maxConcurrentOverride === '' ? null : Number(overrideForm.maxConcurrentOverride),
            });
            showToast({ tone: 'success', title: 'Đã lưu override', message: 'Lịch ngày đã được cập nhật.' });
            await loadSchedule();
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể lưu override ngày.');
            setError(message);
            showToast({ tone: 'error', title: 'Lưu override thất bại', message });
        } finally {
            setSaving(false);
        }
    };

    const deleteOverride = async (date) => {
        if (!window.confirm(`Xóa override ngày ${date}?`)) return;
        await deletePartnerScheduleDayOverride(date);
        await loadSchedule();
    };

    const runCopy = async (type) => {
        try {
            setSaving(true);
            if (type === 'day') {
                await copyPartnerScheduleDay({ sourceDate: copyForm.sourceDate, targetDates: copyForm.targetDates.split(',').map((item) => item.trim()).filter(Boolean) });
            }
            if (type === 'month') {
                await copyPartnerScheduleMonth({ sourceMonth: copyForm.sourceMonth, targetMonth: copyForm.targetMonth });
            }
            if (type === 'year') {
                await copyPartnerScheduleYear({ sourceYear: copyForm.sourceYear, targetYear: copyForm.targetYear });
            }
            showToast({ tone: 'success', title: 'Đã copy lịch', message: 'Cấu hình override đã được sao chép.' });
            await loadSchedule();
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Copy lịch thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Copy lịch thất bại', message });
        } finally {
            setSaving(false);
        }
    };

    const createLock = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            await createPartnerBookingLock({ lockType: 'LOCK_TIME_RANGE', ...lockForm, providerServiceId: Number(lockForm.providerServiceId), durationMinutes: Number(lockForm.durationMinutes) || 60 });
            showToast({ tone: 'success', title: 'Đã khóa slot', message: 'Khung giờ đã được khóa nhận booking mới.' });
            await loadSchedule();
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể tạo booking lock.');
            setError(message);
            showToast({ tone: 'error', title: 'Tạo lock thất bại', message });
        } finally {
            setSaving(false);
        }
    };

    const unlockLock = async (id) => {
        await unlockPartnerBookingLock(id);
        await loadSchedule();
    };

    const deleteLock = async (id) => {
        if (!window.confirm('Xóa booking lock này?')) return;
        await deletePartnerBookingLock(id);
        await loadSchedule();
    };

    const loadPreview = async (event) => {
        event.preventDefault();
        if (!previewForm.providerServiceId) return;
        try {
            setPreviewLoading(true);
            if (!providerId) {
                setError('Không xác định được providerId để preview availability. Vui lòng tải lại trang lịch.');
                return;
            }
            setPreview(await getBookingAvailableSlots({ providerId, providerServiceId: previewForm.providerServiceId, date: previewForm.date }));
        } catch (err) {
            setError(getPartnerErrorMessage(err, 'Không thể tải preview availability.'));
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <PartnerLayout title="Lịch làm việc" subtitle="Cấu hình ngày mở cửa và khung giờ nhận booking">
            <div className="space-y-6">
                {error && <PartnerErrorState message={error} onRetry={loadSchedule} />}

                <section className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-orange-500">Thiết lập tối giản</p>
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2"><CalendarDays className="w-6 h-6 text-orange-500" /> Lịch tuần</h2>
                        </div>
                        <div className="rounded-2xl bg-orange-50 px-5 py-4 text-orange-700 font-black flex items-center gap-2">
                            <Clock className="w-5 h-5" /> {openDays.length}/7 ngày mở cửa
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-5">
                        <button type="button" onClick={() => applyTemplate('office')} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-black text-xs">T2-T7, 08:00-18:00</button>
                        <button type="button" onClick={() => applyTemplate('all-week')} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-black text-xs">Mở cả tuần</button>
                        <button type="button" onClick={() => applyTemplate('reset')} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-black text-xs flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</button>
                    </div>
                </section>

                {loading ? <PartnerLoadingState /> : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                        {weeklyHours.map((day) => (
                            <div key={day.weekday} className={`grid grid-cols-1 md:grid-cols-[1fr_130px_repeat(4,1fr)] gap-3 items-center p-4 rounded-2xl border ${day.closed ? 'bg-gray-50 border-gray-100' : 'bg-orange-50/50 border-orange-100'}`}>
                                <div>
                                    <p className="font-black text-gray-900">{labels[day.weekday]}</p>
                                    <p className="text-xs text-gray-500 font-semibold">{day.closed ? 'Không nhận booking' : `${day.opensAt || '--:--'} - ${day.closesAt || '--:--'}`}</p>
                                </div>
                                <label className="flex items-center gap-2 font-black text-sm">
                                    <input type="checkbox" checked={!day.closed} onChange={(e) => toggleClosed(day.weekday, !e.target.checked)} /> Mở cửa
                                </label>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Từ</span>
                                    <input type="time" disabled={day.closed} value={day.opensAt} onChange={(e) => updateDay(day.weekday, 'opensAt', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-100 font-bold disabled:opacity-50" />
                                </label>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Đến</span>
                                    <input type="time" disabled={day.closed} value={day.closesAt} onChange={(e) => updateDay(day.weekday, 'closesAt', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-100 font-bold disabled:opacity-50" />
                                </label>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nghỉ từ</span>
                                    <input type="time" disabled={day.closed} value={day.breakStartsAt} onChange={(e) => updateDay(day.weekday, 'breakStartsAt', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-100 font-bold disabled:opacity-50" />
                                </label>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nghỉ đến</span>
                                    <input type="time" disabled={day.closed} value={day.breakEndsAt} onChange={(e) => updateDay(day.weekday, 'breakEndsAt', e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-100 font-bold disabled:opacity-50" />
                                </label>
                            </div>
                        ))}
                        <button disabled={saving} className="px-6 py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 disabled:opacity-60 flex items-center gap-2"><Save className="w-5 h-5" /> {saving ? 'Đang lưu...' : 'Lưu lịch tuần'}</button>
                    </form>
                )}

                {!loading && (
                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <form onSubmit={saveOverride} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-orange-500" /> Override theo ngày</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input type="date" value={overrideForm.localDate} onChange={(e) => setOverrideForm({ ...overrideForm, localDate: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <select value={overrideForm.type} onChange={(e) => setOverrideForm({ ...overrideForm, type: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold">
                                    <option value="CLOSED">Đóng cửa</option>
                                    <option value="OPEN">Mở/đổi giờ</option>
                                </select>
                                <input type="time" value={overrideForm.startsAt} onChange={(e) => setOverrideForm({ ...overrideForm, startsAt: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <input type="time" value={overrideForm.endsAt} onChange={(e) => setOverrideForm({ ...overrideForm, endsAt: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <input type="number" min="0" placeholder="Giới hạn tổng tải (optional)" value={overrideForm.maxConcurrentOverride} onChange={(e) => setOverrideForm({ ...overrideForm, maxConcurrentOverride: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <input placeholder="Lý do/ghi chú" value={overrideForm.reason} onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                            </div>
                            <button disabled={saving} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black flex items-center gap-2"><Save className="w-4 h-4" /> Lưu override</button>
                            <div className="space-y-2 max-h-72 overflow-auto">
                                {dayOverrides.length === 0 ? <p className="text-sm font-bold text-gray-400">Chưa có override trong 30 ngày tới.</p> : dayOverrides.map((item) => (
                                    <div key={item.localDate || item.date} className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                                        <div><p className="font-black">{item.localDate || item.date}</p><p className="text-xs font-bold text-gray-500">{item.type || (item.closed ? 'CLOSED' : 'OPEN')} · {item.reason || 'Không có ghi chú'}</p></div>
                                        <button type="button" onClick={() => deleteOverride(item.localDate || item.date)} className="p-2 rounded-xl bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </form>

                        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><Copy className="w-5 h-5 text-orange-500" /> Copy lịch</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input type="date" value={copyForm.sourceDate} onChange={(e) => setCopyForm({ ...copyForm, sourceDate: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <input placeholder="Ngày đích, cách nhau dấu phẩy" value={copyForm.targetDates} onChange={(e) => setCopyForm({ ...copyForm, targetDates: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <button type="button" disabled={saving} onClick={() => runCopy('day')} className="px-4 py-3 rounded-2xl bg-gray-900 text-white font-black">Copy ngày</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input type="month" value={copyForm.sourceMonth} onChange={(e) => setCopyForm({ ...copyForm, sourceMonth: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <input type="month" value={copyForm.targetMonth} onChange={(e) => setCopyForm({ ...copyForm, targetMonth: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <button type="button" disabled={saving} onClick={() => runCopy('month')} className="px-4 py-3 rounded-2xl bg-gray-900 text-white font-black">Copy tháng</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input type="number" value={copyForm.sourceYear} onChange={(e) => setCopyForm({ ...copyForm, sourceYear: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <input type="number" value={copyForm.targetYear} onChange={(e) => setCopyForm({ ...copyForm, targetYear: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <button type="button" disabled={saving} onClick={() => runCopy('year')} className="px-4 py-3 rounded-2xl bg-gray-900 text-white font-black">Copy năm</button>
                            </div>
                        </div>
                    </section>
                )}

                {!loading && (
                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <form onSubmit={createLock} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><Lock className="w-5 h-5 text-orange-500" /> Booking lock</h3>
                            <select value={lockForm.providerServiceId} onChange={(e) => setLockForm({ ...lockForm, providerServiceId: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-100 font-bold">
                                <option value="">Chọn service</option>
                                {services.map((service) => <option key={service.id || service.providerServiceId} value={service.id || service.providerServiceId}>{service.displayName || service.serviceName || service.name}</option>)}
                            </select>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input type="date" value={lockForm.appointmentDate} onChange={(e) => setLockForm({ ...lockForm, appointmentDate: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <input type="time" value={lockForm.startTime} onChange={(e) => setLockForm({ ...lockForm, startTime: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                                <input type="number" min="15" value={lockForm.durationMinutes} onChange={(e) => setLockForm({ ...lockForm, durationMinutes: e.target.value })} className="px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                            </div>
                            <button disabled={saving || !lockForm.providerServiceId} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black flex items-center gap-2 disabled:opacity-60"><Lock className="w-4 h-4" /> Tạo lock</button>
                            <div className="space-y-2 max-h-72 overflow-auto">
                                {bookingLocks.length === 0 ? <p className="text-sm font-bold text-gray-400">Không có lock đang active.</p> : bookingLocks.map((lock) => (
                                    <div key={lock.lockId || lock.id} className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                                        <div><p className="font-black">{lock.appointmentDate} · {lock.startTime}</p><p className="text-xs font-bold text-gray-500">{lock.serviceName || lock.providerServiceName || `Service #${lock.providerServiceId || ''}`} · {lock.status}</p></div>
                                        <div className="flex gap-2"><button type="button" onClick={() => unlockLock(lock.lockId || lock.id)} className="p-2 rounded-xl bg-green-50 text-green-600"><Unlock className="w-4 h-4" /></button><button type="button" onClick={() => deleteLock(lock.lockId || lock.id)} className="p-2 rounded-xl bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div>
                                    </div>
                                ))}
                            </div>
                        </form>

                        <form onSubmit={loadPreview} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><Eye className="w-5 h-5 text-orange-500" /> Preview user thấy</h3>
                            <select value={previewForm.providerServiceId} onChange={(e) => setPreviewForm({ ...previewForm, providerServiceId: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-100 font-bold">
                                <option value="">Chọn service</option>
                                {services.map((service) => <option key={service.id || service.providerServiceId} value={service.id || service.providerServiceId}>{service.displayName || service.serviceName || service.name}</option>)}
                            </select>
                            <input type="date" value={previewForm.date} onChange={(e) => setPreviewForm({ ...previewForm, date: e.target.value })} className="w-full px-4 py-3 rounded-2xl border border-gray-100 font-bold" />
                            <button disabled={previewLoading || !previewForm.providerServiceId} className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-black flex items-center gap-2 disabled:opacity-60"><Eye className="w-4 h-4" /> {previewLoading ? 'Đang tải...' : 'Xem preview'}</button>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {(preview?.slots || []).map((slot) => <div key={slot.startTime || slot.time} className={`rounded-2xl px-3 py-3 text-sm font-black ${slot.status === 'AVAILABLE' || slot.available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{slot.startTime || slot.time}<p className="text-[10px] mt-1">{slot.status || slot.reason || 'AVAILABLE'}</p></div>)}
                            </div>
                            {preview && (!preview.slots || preview.slots.length === 0) ? <p className="text-sm font-bold text-gray-400">Không có slot để hiển thị.</p> : null}
                        </form>
                    </section>
                )}

                {!loading && (
                    <section className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-4">Checklist cấu hình availability</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <ChecklistCard done={openDays.length > 0} title="Weekly schedule" text="Có ít nhất một ngày mở cửa." />
                            <ChecklistCard done title="Day override" text="Hỗ trợ đóng/mở/đổi giờ từng ngày." />
                            <ChecklistCard done title="Copy lịch" text="Hỗ trợ copy day/month/year." />
                            <ChecklistCard done title="Booking lock + preview" text="Khóa slot và xem trước user thấy theo service." />
                        </div>
                    </section>
                )}
            </div>
        </PartnerLayout>
    );
};

const ChecklistCard = ({ done, title, text }) => <div className={`rounded-2xl border px-4 py-3 ${done ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}><p className="font-black">{title}</p><p className="mt-1 text-xs font-bold leading-relaxed">{text}</p></div>;

export default PartnerSchedulePage;