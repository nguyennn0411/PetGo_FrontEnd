import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export const APP_TOAST_TONES = ['success', 'error', 'warning', 'info'];

const toneConfig = {
    success: { icon: CheckCircle2, defaultTitle: 'Thành công' },
    error: { icon: XCircle, defaultTitle: 'Không thể hoàn tất' },
    warning: { icon: AlertTriangle, defaultTitle: 'Cần chú ý' },
    info: { icon: Info, defaultTitle: 'Thông tin' },
};

const FeedbackContext = createContext(null);

const getToneConfig = (tone) => toneConfig[tone] || toneConfig.info;

export const getAppErrorMessage = (error, fallback = 'Thao tác thất bại. Vui lòng thử lại.') => {
    const responseData = error?.response?.data;
    if (typeof responseData === 'string') return responseData;
    return responseData?.message || responseData?.error || error?.message || fallback;
};

export const AppToastStack = ({ toasts = [], onDismiss }) => {
    if (!toasts.length) return null;

    return (
        <div className="app-toast-viewport" aria-live="polite" aria-relevant="additions removals">
            {toasts.map((toast) => {
                const config = getToneConfig(toast.tone);
                const Icon = config.icon;
                return (
                    <div key={toast.id} className={`app-toast app-toast-${toast.tone || 'info'}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
                        <div className="app-toast-icon">
                            <Icon size={20} strokeWidth={2.5} />
                        </div>
                        <div className="app-toast-content">
                            <div className="app-toast-title">{toast.title || config.defaultTitle}</div>
                            {toast.message ? <div className="app-toast-message">{toast.message}</div> : null}
                        </div>
                        <button className="app-toast-close" type="button" onClick={() => onDismiss?.(toast.id)} aria-label="Đóng thông báo">
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export const AppInlineNotice = ({ tone = 'info', title, children, onDismiss }) => {
    const config = getToneConfig(tone);
    const Icon = config.icon;

    return (
        <div className={`app-notice app-notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
            <div className="app-notice-icon">
                <Icon size={20} strokeWidth={2.5} />
            </div>
            <div className="app-notice-content">
                <div className="app-notice-title">{title || config.defaultTitle}</div>
                {children ? <div className="app-notice-message">{children}</div> : null}
            </div>
            {onDismiss ? (
                <button className="app-notice-close" type="button" onClick={onDismiss} aria-label="Đóng thông báo">
                    <X size={16} strokeWidth={2.5} />
                </button>
            ) : null}
        </div>
    );
};

export const FeedbackProvider = ({ children, autoDismissMs = 4200 }) => {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const dismissToast = useCallback((toastId) => {
        if (timersRef.current[toastId]) {
            clearTimeout(timersRef.current[toastId]);
            delete timersRef.current[toastId];
        }
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
    }, []);

    const showToast = useCallback((toast, options = {}) => {
        const tone = toast?.tone || 'info';
        const id = toast?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const nextToast = {
            id,
            tone,
            title: toast?.title || getToneConfig(tone).defaultTitle,
            message: toast?.message || '',
        };

        setToasts((currentToasts) => [nextToast, ...currentToasts.filter((item) => item.id !== id)].slice(0, 4));

        const timeout = options.timeout ?? (tone === 'error' ? Math.max(autoDismissMs, 6500) : autoDismissMs);
        if (timeout > 0 && typeof window !== 'undefined') {
            if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
            timersRef.current[id] = window.setTimeout(() => dismissToast(id), timeout);
        }

        return id;
    }, [autoDismissMs, dismissToast]);

    useEffect(() => () => {
        Object.values(timersRef.current).forEach((timerId) => clearTimeout(timerId));
    }, []);

    return (
        <FeedbackContext.Provider value={{ toasts, showToast, dismissToast }}>
            {children}
            <AppToastStack toasts={toasts} onDismiss={dismissToast} />
        </FeedbackContext.Provider>
    );
};

export const useAppToast = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error('useAppToast must be used within FeedbackProvider.');
    }
    return context;
};
