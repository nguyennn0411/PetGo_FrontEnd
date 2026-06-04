import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, RotateCcw, Save } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerErrorState, PartnerLoadingState, PartnerNotice, getPartnerErrorMessage, usePartnerToast } from '../../components/partner/PartnerStates';
import { getPartnerSchedule, updatePartnerWeeklySchedule } from '../../api/partner';

const defaultWeeklyHours = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    opensAt: '08:00',
    closesAt: '18:00',
    breakStartsAt: '',
    breakEndsAt: '',
    closed: weekday === 7,
}));

const labels = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ nhật' };

const toMinutes = (value) => {
    if (!value) return null;
    const [hour, minute] = value.split(':').map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
};

const PartnerSchedulePage = () => {
    const [weeklyHours, setWeeklyHours] = useState(defaultWeeklyHours);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { showToast } = usePartnerToast();

    const openDays = useMemo(() => weeklyHours.filter((day) => !day.closed), [weeklyHours]);

    const loadSchedule = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getPartnerSchedule();
            if (data?.weeklyHours?.length) {
                setWeeklyHours(defaultWeeklyHours.map((day) => {
                    const existing = data.weeklyHours.find((item) => Number(item.weekday) === day.weekday);
                    return existing ? {
                        weekday: existing.weekday,
                        opensAt: existing.opensAt || '',
                        closesAt: existing.closesAt || '',
                        breakStartsAt: '',
                        breakEndsAt: '',
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
            setSuccess('');
            const payload = weeklyHours.map((day) => ({
                weekday: day.weekday,
                opensAt: day.closed ? '' : day.opensAt,
                closesAt: day.closed ? '' : day.closesAt,
                breakStartsAt: '',
                breakEndsAt: '',
                closed: day.closed,
            }));
            await updatePartnerWeeklySchedule(payload);
            setSuccess('Đã cập nhật lịch làm việc.');
            showToast({ tone: 'success', title: 'Đã cập nhật lịch làm việc', message: 'Lịch làm việc mới đã được lưu.' });
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Cập nhật lịch thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Cập nhật lịch thất bại', message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <PartnerLayout title="Lịch làm việc" subtitle="Cấu hình ngày mở cửa và khung giờ nhận booking">
            <div className="space-y-6">
                {error && <PartnerErrorState message={error} onRetry={loadSchedule} />}
                {success && <PartnerNotice tone="success" title="Đã cập nhật lịch" message={success} onDismiss={() => setSuccess('')} />}

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
                            <div key={day.weekday} className={`grid grid-cols-1 md:grid-cols-[1fr_130px_1fr_1fr] gap-3 items-center p-4 rounded-2xl border ${day.closed ? 'bg-gray-50 border-gray-100' : 'bg-orange-50/50 border-orange-100'}`}>
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
                            </div>
                        ))}
                        <button disabled={saving} className="px-6 py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 disabled:opacity-60 flex items-center gap-2"><Save className="w-5 h-5" /> {saving ? 'Đang lưu...' : 'Lưu lịch tuần'}</button>
                    </form>
                )}
            </div>
        </PartnerLayout>
    );
};

export default PartnerSchedulePage;