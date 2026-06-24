import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCheck, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import {
    getMyNotificationSummary,
    getMyNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '../api/notifications';

const filterOptions = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'UNREAD', label: 'Chưa đọc' },
    { value: 'READ', label: 'Đã đọc' },
];

const priorityClass = {
    LOW: 'bg-gray-100 text-gray-500',
    NORMAL: 'bg-blue-50 text-blue-600',
    HIGH: 'bg-yellow-50 text-yellow-700',
    URGENT: 'bg-red-50 text-red-600',
};

const NotificationCenter = ({ compact = false }) => {
    const [notifications, setNotifications] = useState([]);
    const [summary, setSummary] = useState({ total: 0, unread: 0, read: 0 });
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    const loadNotifications = async (nextFilter = filter) => {
        try {
            setLoading(true);
            setError('');
            const [items, nextSummary] = await Promise.all([
                getMyNotifications(nextFilter),
                getMyNotificationSummary(),
            ]);
            setNotifications(items || []);
            setSummary(nextSummary || { total: 0, unread: 0, read: 0 });
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải thông báo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications(filter);
    }, [filter]);

    const displayItems = useMemo(() => compact ? notifications.slice(0, 5) : notifications, [compact, notifications]);

    const handleMarkRead = async (notificationId) => {
        try {
            setUpdatingId(notificationId);
            const updated = await markNotificationAsRead(notificationId);
            setNotifications((prev) => prev.map((item) => item.notificationId === notificationId ? updated : item));
            setSummary((prev) => ({
                total: prev.total,
                unread: Math.max((prev.unread || 1) - 1, 0),
                read: (prev.read || 0) + 1,
            }));
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể đánh dấu đã đọc.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setUpdatingId('all');
            const nextSummary = await markAllNotificationsAsRead();
            setSummary(nextSummary || summary);
            await loadNotifications(filter);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể đánh dấu tất cả đã đọc.');
        } finally {
            setUpdatingId(null);
        }
    };

    const openActionUrl = async (item) => {
        if (!item.read) {
            await handleMarkRead(item.notificationId);
        }
        if (item.actionUrl) {
            window.location.href = item.actionUrl;
        }
    };

    return (
        <div className={compact ? 'space-y-4' : 'space-y-6'}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={compact ? 'text-xl font-black' : 'text-2xl font-black'}>Thông báo</h2>
                            <p className="text-sm text-gray-500 font-semibold">{summary.unread || 0} chưa đọc / {summary.total || 0} tổng thông báo</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!compact && filterOptions.map((option) => (
                        <button
                            type="button"
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === option.value ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}
                        >
                            {option.label}
                        </button>
                    ))}
                    <button type="button" onClick={() => loadNotifications(filter)} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600" title="Refresh">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleMarkAllRead} disabled={!summary.unread || updatingId === 'all'} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-2">
                        <CheckCheck className="w-4 h-4" />
                        Đọc tất cả
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-red-600 font-bold flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-10 flex items-center justify-center text-orange-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : displayItems.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-10 text-center">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Không có thông báo</h3>
                    <p className="text-gray-500 font-medium">Các thông báo mới từ PetGo sẽ xuất hiện tại đây.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayItems.map((item) => (
                        <div key={item.id} className={`bg-white rounded-[2rem] border p-5 transition-all ${item.read ? 'border-gray-100' : 'border-orange-100 shadow-lg shadow-orange-50'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 w-3 h-3 rounded-full ${item.read ? 'bg-gray-200' : 'bg-orange-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${priorityClass[item.priority] || priorityClass.NORMAL}`}>{item.priority}</span>
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500">{item.category}</span>
                                        {!item.read && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600">Mới</span>}
                                    </div>
                                    <h3 className="font-black text-lg text-gray-900">{item.title}</h3>
                                    <p className="text-gray-500 font-medium mt-1 whitespace-pre-line">{item.content}</p>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mt-3">
                                        {formatDateTime(item.sentAt)} {item.createdByName ? `• ${item.createdByName}` : ''}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    {!item.read && (
                                        <button type="button" onClick={() => handleMarkRead(item.notificationId)} disabled={updatingId === item.notificationId} className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-black hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50">
                                            Đã đọc
                                        </button>
                                    )}
                                    {item.actionUrl && (
                                        <button type="button" onClick={() => openActionUrl(item)} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-900 hover:text-white transition-all" title="Mở liên kết">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const formatDateTime = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString('vi-VN');
};

export default NotificationCenter;