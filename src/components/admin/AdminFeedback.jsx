export {
    AppInlineNotice as AdminInlineNotice,
    AppToastStack as AdminToastStack,
    getAppErrorMessage as getAdminErrorMessage,
    useAppToast as useAdminToast,
} from '../AppFeedback';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const toneConfig = {
    success: { icon: CheckCircle2, defaultTitle: 'Thành công' },
    error: { icon: AlertTriangle, defaultTitle: 'Không thể hoàn tất' },
    warning: { icon: AlertTriangle, defaultTitle: 'Cần chú ý' },
    info: { icon: Info, defaultTitle: 'Thông tin' },
};

const getToneConfig = (tone) => toneConfig[tone] || toneConfig.info;

export const useAdminDialog = () => {
    const [dialog, setDialog] = useState(null);
    const resolverRef = useRef(null);

    const openDialog = useCallback((config) => new Promise((resolve) => {
        resolverRef.current = resolve;
        setDialog({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            tone: 'info',
            ...config,
        });
    }), []);

    const closeDialog = useCallback((value) => {
        if (resolverRef.current) {
            resolverRef.current(value);
            resolverRef.current = null;
        }
        setDialog(null);
    }, []);

    const confirmDialog = useCallback((options = {}) => openDialog({
        mode: 'confirm',
        confirmLabel: 'Xác nhận',
        cancelLabel: 'Hủy',
        ...options,
    }), [openDialog]);

    const promptDialog = useCallback((options = {}) => openDialog({
        mode: 'prompt',
        confirmLabel: 'OK',
        cancelLabel: 'Hủy',
        defaultValue: '',
        multiline: true,
        ...options,
    }), [openDialog]);

    useEffect(() => () => {
        if (resolverRef.current) resolverRef.current(null);
    }, []);

    return { dialog, confirmDialog, promptDialog, closeDialog };
};

export const AdminDialog = ({ dialog, onResolve }) => {
    const [value, setValue] = useState('');
    const [fieldError, setFieldError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        setValue(dialog?.defaultValue || '');
        setFieldError('');
        if (dialog?.mode === 'prompt') {
            window.setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [dialog?.id, dialog?.defaultValue, dialog?.mode]);

    if (!dialog) return null;

    const tone = dialog.tone || 'info';
    const config = getToneConfig(tone);
    const Icon = config.icon;
    const isPrompt = dialog.mode === 'prompt';
    const confirmButtonClass = tone === 'error' || tone === 'danger'
        ? 'btn-danger'
        : tone === 'warning'
            ? 'btn-warning'
            : tone === 'success'
                ? 'btn-success'
                : 'btn-primary';

    const handleCancel = () => onResolve?.(isPrompt ? null : false);
    const handleConfirm = () => {
        if (isPrompt) {
            if (dialog.required && !value.trim()) {
                setFieldError(dialog.requiredMessage || 'Vui lòng nhập nội dung trước khi tiếp tục.');
                return;
            }
            onResolve?.(value);
            return;
        }
        onResolve?.(true);
    };

    return (
        <div className="admin-dialog-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && handleCancel()}>
            <div className={`admin-dialog admin-dialog-${tone}`} role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title">
                <div className="admin-dialog-header">
                    <div className="admin-dialog-icon">
                        <Icon size={24} strokeWidth={2.5} />
                    </div>
                    <div className="admin-dialog-heading">
                        <div id="admin-dialog-title" className="admin-dialog-title">{dialog.title || config.defaultTitle}</div>
                        {dialog.message ? <div className="admin-dialog-message">{dialog.message}</div> : null}
                    </div>
                    <button className="admin-dialog-close" type="button" onClick={handleCancel} aria-label="Đóng hộp thoại">
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </div>

                {isPrompt ? (
                    <div className="admin-dialog-body">
                        {dialog.multiline === false ? (
                            <input
                                ref={inputRef}
                                value={value}
                                onChange={(event) => { setValue(event.target.value); setFieldError(''); }}
                                placeholder={dialog.placeholder || 'Nhập nội dung...'}
                                maxLength={dialog.maxLength || undefined}
                            />
                        ) : (
                            <textarea
                                ref={inputRef}
                                value={value}
                                onChange={(event) => { setValue(event.target.value); setFieldError(''); }}
                                placeholder={dialog.placeholder || 'Nhập nội dung...'}
                                rows={dialog.rows || 4}
                                maxLength={dialog.maxLength || undefined}
                            />
                        )}
                        {dialog.helperText ? <div className="admin-dialog-helper">{dialog.helperText}</div> : null}
                        {fieldError ? <div className="admin-dialog-error">{fieldError}</div> : null}
                    </div>
                ) : null}

                <div className="admin-dialog-actions">
                    <button type="button" className="btn" onClick={handleCancel}>{dialog.cancelLabel || 'Hủy'}</button>
                    <button type="button" className={`btn ${confirmButtonClass}`} onClick={handleConfirm}>{dialog.confirmLabel || 'Xác nhận'}</button>
                </div>
            </div>
        </div>
    );
};
