import React from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { AppInlineNotice, getAppErrorMessage, useAppToast } from '../AppFeedback';

export const usePartnerToast = useAppToast;
export const getPartnerErrorMessage = getAppErrorMessage;

export const PartnerNotice = ({ tone = 'info', title, message, children, onDismiss }) => (
    <AppInlineNotice tone={tone} title={title} onDismiss={onDismiss}>
        {children || message}
    </AppInlineNotice>
);

export const PartnerLoadingState = ({ message = 'Đang tải dữ liệu partner...' }) => (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-10 text-center shadow-sm">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 font-bold">{message}</p>
    </div>
);

export const PartnerEmptyState = ({ title = 'Chưa có dữ liệu', message = 'Dữ liệu sẽ xuất hiện tại đây khi có phát sinh.', action }) => (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-10 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 font-semibold max-w-lg mx-auto">{message}</p>
        {action && <div className="mt-5">{action}</div>}
    </div>
);

export const PartnerErrorState = ({ message = 'Không thể tải dữ liệu.', onRetry }) => (
    <div className="app-notice app-notice-error flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
            <div className="app-notice-icon shrink-0">
                <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            <div className="app-notice-content">
                <div className="app-notice-title">Không thể hoàn tất</div>
                <div className="app-notice-message">{message}</div>
            </div>
        </div>
        {onRetry && (
            <button onClick={onRetry} className="btn btn-sm btn-danger flex items-center justify-center gap-2 shrink-0">
                <RefreshCw className="w-4 h-4" />
                Thử lại
            </button>
        )}
    </div>
);

export const PartnerStatusBadge = ({ status }) => {
    const normalized = String(status || '').toUpperCase();
    const cls = normalized.includes('INACTIVE')
        ? 'bg-gray-50 text-gray-500 border-gray-100'
        : normalized.includes('CANCEL')
            ? 'bg-red-50 text-red-600 border-red-100'
            : normalized.includes('COMPLETE') || normalized === 'ACTIVE' || normalized.includes('CONFIRMED')
                ? 'bg-green-50 text-green-600 border-green-100'
                : normalized.includes('PROGRESS')
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-orange-50 text-orange-600 border-orange-100';
    return <span className={`px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest ${cls}`}>{status || 'N/A'}</span>;
};