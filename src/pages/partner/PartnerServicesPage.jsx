import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Copy, Eye, FileText, ImagePlus, Loader2, Plus, Save, Scissors, Search, Send, Trash2, X } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerEmptyState, PartnerErrorState, PartnerLoadingState, PartnerStatusBadge, getPartnerErrorMessage, usePartnerToast } from '../../components/partner/PartnerStates';
import {
    archivePartnerService,
    copyPartnerService,
    copyPartnerServiceChangeRequest,
    deletePartnerServiceDraft,
    getPartnerServiceChangeRequests,
    getPartnerServices,
    savePartnerServiceDraft,
    submitPartnerServiceChangeRequest,
    submitPartnerServiceDraft,
    updatePartnerServiceDraft,
    updatePartnerServiceStatus,
    uploadPartnerServiceImage,
} from '../../api/partner';

const DRAFT_LIMIT = 3;
const MAX_PHOTOS = 5;

const emptyForm = {
    draftId: null,
    providerServiceId: null,
    serviceName: '',
    photoUrls: [],
    priceAmount: '',
    currencyCode: 'VND',
    priceUnit: 'SESSION',
    description: '',
};

const priceUnitOptions = [
    ['SESSION', '1 lần'],
    ['HOUR', 'giờ'],
    ['DAY', 'ngày'],
    ['PET', 'thú cưng'],
];

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const formatPriceInput = (value) => {
    const digits = digitsOnly(value);
    if (!digits) return '';
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed.toLocaleString('vi-VN') : digits;
};

const toNumber = (value, fallback = 0) => {
    const normalized = typeof value === 'string' ? digitsOnly(value) : value;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeImages = (items = []) => (items || []).map((item) => String(item || '').trim()).filter(Boolean).slice(0, MAX_PHOTOS);
const categoryLabel = (categories = []) => categories.map((category) => category.name).filter(Boolean).join(', ') || 'Chờ admin phân loại';

const hasFieldErrors = (errors = {}) => Object.keys(errors).length > 0;

const normalizeServiceErrorMessage = (message, fallback) => {
    const text = message || fallback;
    if (!text) return '';
    if (String(text).includes('Vui lòng chọn ít nhất một loại dịch vụ') || String(text).includes('Loại dịch vụ không thuộc nhóm')) {
        return 'Bạn không cần chọn loại dịch vụ; admin sẽ phân loại khi duyệt. Vui lòng thử gửi lại yêu cầu.';
    }
    return text;
};

const fieldNameFromMessage = (message = '') => {
    const lower = String(message).toLowerCase();
    if (lower.includes('tên dịch vụ')) return 'serviceName';
    if (lower.includes('ảnh')) return 'photoUrls';
    if (lower.includes('giá')) return 'priceAmount';
    if (lower.includes('đơn vị')) return 'priceUnit';
    if (lower.includes('mô tả')) return 'description';
    return null;
};

const statusTone = (status) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'PENDING_REVIEW') return 'PENDING';
    if (normalized === 'APPROVED') return 'ACTIVE';
    if (normalized === 'REJECTED') return 'INACTIVE';
    return normalized || 'DRAFT';
};

const adminMessageToneClass = (status) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'APPROVED') return 'text-green-700 bg-green-50 border border-green-100';
    if (normalized === 'REJECTED') return 'text-red-600 bg-red-50 border border-red-100';
    return 'text-gray-600 bg-gray-50 border border-gray-100';
};

const requestTypeLabel = (type) => String(type || '').toUpperCase() === 'UPDATE' ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ';

const middleEllipsis = (value, maxLength = 44) => {
    const text = String(value || '').trim();
    if (text.length <= maxLength) return text;
    const edgeLength = Math.max(8, Math.floor((maxLength - 3) / 2));
    return `${text.slice(0, edgeLength)}...${text.slice(-edgeLength)}`;
};

const endEllipsis = (value, maxLength = 28) => {
    const text = String(value || '').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(1, maxLength - 3))}...`;
};

const PartnerServicesPage = () => {
    const [services, setServices] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [isImageDragActive, setIsImageDragActive] = useState(false);
    const [requestSearch, setRequestSearch] = useState('');
    const [requestStatusFilter, setRequestStatusFilter] = useState('ALL');
    const [requestTypeFilter, setRequestTypeFilter] = useState('ALL');
    const [requestPageSize, setRequestPageSize] = useState(5);
    const [requestPage, setRequestPage] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const { showToast } = usePartnerToast();

    const activeCount = useMemo(() => services.filter((service) => service.active).length, [services]);
    const drafts = useMemo(() => requests.filter((request) => request.status === 'DRAFT'), [requests]);
    const pendingRequests = useMemo(() => requests.filter((request) => request.status === 'PENDING_REVIEW'), [requests]);
    const pendingUpdateByServiceId = useMemo(() => {
        const map = new Map();
        requests.forEach((request) => {
            if (request.status === 'PENDING_REVIEW' && String(request.requestType || '').toUpperCase() === 'UPDATE' && request.providerServiceId) {
                map.set(Number(request.providerServiceId), request);
            }
        });
        return map;
    }, [requests]);
    const draftSlotsLeft = Math.max(0, DRAFT_LIMIT - drafts.length);
    const filteredRequests = useMemo(() => {
        const keyword = requestSearch.trim().toLowerCase();
        return requests.filter((request) => {
            const status = String(request.status || '').toUpperCase();
            const type = String(request.requestType || '').toUpperCase();
            if (requestStatusFilter !== 'ALL' && status !== requestStatusFilter) return false;
            if (requestTypeFilter !== 'ALL' && type !== requestTypeFilter) return false;
            if (!keyword) return true;
            return [
                request.serviceName,
                request.description,
                request.adminMessage,
                request.priceDisplay,
                request.priceUnitLabel,
                requestTypeLabel(request.requestType),
                categoryLabel(request.categories),
            ].some((value) => String(value || '').toLowerCase().includes(keyword));
        });
    }, [requestSearch, requestStatusFilter, requestTypeFilter, requests]);
    const requestTotalPages = Math.max(1, Math.ceil(filteredRequests.length / requestPageSize));
    const safeRequestPage = Math.min(requestPage, requestTotalPages);
    const pagedRequests = useMemo(() => {
        const start = (safeRequestPage - 1) * requestPageSize;
        return filteredRequests.slice(start, start + requestPageSize);
    }, [filteredRequests, requestPageSize, safeRequestPage]);

    useEffect(() => { setRequestPage(1); }, [requestSearch, requestStatusFilter, requestTypeFilter, requestPageSize]);
    useEffect(() => { if (requestPage !== safeRequestPage) setRequestPage(safeRequestPage); }, [requestPage, safeRequestPage]);

    const loadServices = async () => {
        try {
            setLoading(true);
            setError('');
            const [serviceData, requestData] = await Promise.all([
                getPartnerServices(),
                getPartnerServiceChangeRequests().catch(() => []),
            ]);
            setServices(Array.isArray(serviceData) ? serviceData : []);
            setRequests(Array.isArray(requestData) ? requestData : []);
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể tải dịch vụ partner.');
            setError(message);
            showToast({ tone: 'error', title: 'Không tải được dịch vụ', message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadServices(); }, []);

    const startCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowForm(true);
        setError('');
        setFieldErrors({});
    };

    const startEdit = (service) => {
        const pendingUpdate = pendingUpdateByServiceId.get(Number(service.id));
        if (pendingUpdate) {
            setSelectedRequest(pendingUpdate);
            const message = 'Dịch vụ này đang có yêu cầu cập nhật chờ admin duyệt. Vui lòng xem yêu cầu hiện tại thay vì gửi trùng.';
            showToast({ tone: 'info', title: 'Yêu cầu đang chờ duyệt', message });
            setError('');
            return;
        }
        setEditing(service);
        setForm({
            ...emptyForm,
            providerServiceId: service.id,
            serviceName: service.displayName || service.customName || service.serviceName || '',
            photoUrls: normalizeImages(service.photoUrls),
            priceAmount: service.priceAmount ?? '',
            currencyCode: service.currencyCode || 'VND',
            priceUnit: service.priceUnit || 'SESSION',
            description: service.description || service.shortDescription || '',
        });
        setShowForm(true);
        setError('');
        setFieldErrors({});
    };

    const startEditDraft = (draft) => {
        setEditing(draft.providerServiceId ? services.find((item) => Number(item.id) === Number(draft.providerServiceId)) || null : null);
        setForm({
            ...emptyForm,
            draftId: draft.id,
            providerServiceId: draft.providerServiceId || null,
            serviceName: draft.serviceName || '',
            photoUrls: normalizeImages(draft.photoUrls),
            priceAmount: draft.priceAmount ?? '',
            currencyCode: draft.currencyCode || 'VND',
            priceUnit: draft.priceUnit || 'SESSION',
            description: draft.description || '',
        });
        setShowForm(true);
        setError('');
        setFieldErrors({});
    };

    const resetForm = () => { setEditing(null); setForm(emptyForm); setFieldErrors({}); setShowForm(false); };
    const updateField = (field, value) => {
        setFieldErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const showFormError = (message, fallback) => {
        const normalized = normalizeServiceErrorMessage(message, fallback);
        const fieldName = fieldNameFromMessage(normalized);
        if (fieldName) {
            setFieldErrors((prev) => ({ ...prev, [fieldName]: normalized }));
            setError('');
            showToast({ tone: 'warning', title: 'Thông tin dịch vụ chưa hợp lệ', message: normalized });
            return;
        }
        setError(normalized);
        showToast({ tone: 'error', title: 'Thao tác dịch vụ thất bại', message: normalized });
    };

    const updatePriceAmount = (value) => updateField('priceAmount', digitsOnly(value));

    const appendThousandsToPrice = () => {
        setForm((prev) => {
            const currentDigits = digitsOnly(prev.priceAmount);
            if (!currentDigits) return prev;
            return { ...prev, priceAmount: `${currentDigits}000` };
        });
    };

    const buildPayload = () => ({
        providerServiceId: form.providerServiceId || null,
        serviceName: form.serviceName.trim(),
        photoUrls: normalizeImages(form.photoUrls),
        priceAmount: toNumber(form.priceAmount, 0),
        currencyCode: form.currencyCode || 'VND',
        priceUnit: form.priceUnit || 'SESSION',
        description: form.description.trim(),
    });

    const validateBeforeSubmit = () => {
        const payload = buildPayload();
        const nextErrors = {};
        if (!payload.serviceName) nextErrors.serviceName = 'Tên dịch vụ là bắt buộc.';
        if (payload.photoUrls.length < 1 || payload.photoUrls.length > MAX_PHOTOS) nextErrors.photoUrls = 'Vui lòng cung cấp từ 1 đến 5 ảnh mô tả.';
        if (form.priceAmount === '' || form.priceAmount === null || form.priceAmount === undefined) nextErrors.priceAmount = 'Giá dịch vụ là bắt buộc.';
        else if (payload.priceAmount < 0) nextErrors.priceAmount = 'Giá dịch vụ không được âm.';
        if (!payload.priceUnit) nextErrors.priceUnit = 'Vui lòng chọn đơn vị tính.';
        if (!payload.description) nextErrors.description = 'Mô tả dịch vụ là bắt buộc.';
        return nextErrors;
    };

    const handleSaveDraft = async () => {
        if (!form.draftId && draftSlotsLeft <= 0) {
            const message = 'Bạn đã lưu tối đa 3 bản nháp dịch vụ. Hãy xóa/gửi một bản nháp trước.';
            setError(message);
            showToast({ tone: 'warning', title: 'Đã đạt giới hạn bản nháp', message });
            return;
        }
        try {
            setSaving(true);
            setError('');
            setFieldErrors({});
            const payload = buildPayload();
            if (form.draftId) await updatePartnerServiceDraft(form.draftId, payload);
            else await savePartnerServiceDraft(payload);
            showToast({ tone: 'success', title: 'Đã lưu bản nháp', message: 'Bản nháp dịch vụ đã được lưu.' });
            resetForm();
            await loadServices();
        } catch (err) {
            showFormError(err.response?.data?.message, 'Lưu bản nháp thất bại.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitRequest = async (event) => {
        event.preventDefault();
        const validationErrors = validateBeforeSubmit();
        if (hasFieldErrors(validationErrors)) {
            setFieldErrors(validationErrors);
            setError('');
            showToast({ tone: 'warning', title: 'Thông tin dịch vụ chưa hợp lệ', message: Object.values(validationErrors)[0] || 'Vui lòng kiểm tra lại các trường bắt buộc.' });
            return;
        }
        try {
            setSaving(true);
            setError('');
            setFieldErrors({});
            if (form.draftId) await submitPartnerServiceDraft(form.draftId);
            else await submitPartnerServiceChangeRequest(buildPayload());
            const message = form.providerServiceId ? 'Đã gửi yêu cầu cập nhật dịch vụ để admin duyệt.' : 'Đã gửi yêu cầu tạo dịch vụ để admin duyệt.';
            showToast({ tone: 'success', title: 'Đã gửi yêu cầu dịch vụ', message });
            resetForm();
            await loadServices();
        } catch (err) {
            showFormError(err.response?.data?.message, 'Gửi yêu cầu dịch vụ thất bại.');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadImages = async (files) => {
        const selectedFiles = Array.from(files || []);
        setIsImageDragActive(false);
        if (!selectedFiles.length) return;
        if (form.photoUrls.length >= MAX_PHOTOS) {
            const message = 'Bạn chỉ được thêm tối đa 5 ảnh mô tả.';
            setFieldErrors((prev) => ({ ...prev, photoUrls: message }));
            setError('');
            showToast({ tone: 'warning', title: 'Không thể thêm ảnh', message });
            return;
        }
        const invalid = selectedFiles.find((file) => !file.type.startsWith('image/'));
        if (invalid) {
            const message = 'Vui lòng chỉ chọn file ảnh.';
            setFieldErrors((prev) => ({ ...prev, photoUrls: message }));
            setError('');
            showToast({ tone: 'warning', title: 'File ảnh chưa hợp lệ', message });
            return;
        }
        const oversized = selectedFiles.find((file) => file.size > 5 * 1024 * 1024);
        if (oversized) {
            const message = 'Mỗi ảnh không được vượt quá 5MB.';
            setFieldErrors((prev) => ({ ...prev, photoUrls: message }));
            setError('');
            showToast({ tone: 'warning', title: 'File ảnh quá lớn', message });
            return;
        }
        const availableSlots = MAX_PHOTOS - form.photoUrls.length;
        const uploadFiles = selectedFiles.slice(0, availableSlots);
        try {
            setUploading(true);
            setError('');
            setFieldErrors((prev) => {
                if (!prev.photoUrls) return prev;
                const next = { ...prev };
                delete next.photoUrls;
                return next;
            });
            const urls = await Promise.all(uploadFiles.map((file) => uploadPartnerServiceImage(file)));
            setForm((prev) => ({ ...prev, photoUrls: normalizeImages([...prev.photoUrls, ...urls]) }));
            if (selectedFiles.length > availableSlots) setFieldErrors((prev) => ({ ...prev, photoUrls: `Chỉ còn ${availableSlots} vị trí ảnh, các ảnh dư đã được bỏ qua.` }));
            showToast({ tone: 'success', title: 'Đã tải ảnh lên', message: `Đã thêm ${urls.length} ảnh mô tả dịch vụ.` });
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Upload ảnh dịch vụ thất bại.');
            setFieldErrors((prev) => ({ ...prev, photoUrls: message }));
            showToast({ tone: 'error', title: 'Upload ảnh thất bại', message });
        } finally {
            setUploading(false);
        }
    };

    const canAddMoreImages = !uploading && form.photoUrls.length < MAX_PHOTOS;

    const handleImageDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (canAddMoreImages) setIsImageDragActive(true);
    };

    const handleImageDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const currentTarget = event.currentTarget;
        const relatedTarget = event.relatedTarget;
        if (!currentTarget.contains(relatedTarget)) setIsImageDragActive(false);
    };

    const handleImageDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsImageDragActive(false);
        if (!canAddMoreImages) return;
        handleUploadImages(event.dataTransfer?.files);
    };

    const removeImage = (index) => {
        setFieldErrors((prev) => {
            if (!prev.photoUrls) return prev;
            const next = { ...prev };
            delete next.photoUrls;
            return next;
        });
        setForm((prev) => ({ ...prev, photoUrls: prev.photoUrls.filter((_, idx) => idx !== index) }));
    };

    const handleToggle = async (service) => {
        try {
            await updatePartnerServiceStatus(service.id, !service.active);
            showToast({ tone: 'success', title: 'Đã cập nhật trạng thái', message: 'Trạng thái hiển thị dịch vụ đã được cập nhật.' });
            loadServices();
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Cập nhật trạng thái dịch vụ thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Cập nhật trạng thái thất bại', message });
        }
    };

    const handleArchive = async (service) => {
        if (!window.confirm(`Ẩn dịch vụ ${service.displayName || service.serviceName}? Dịch vụ có booking cũ sẽ không bị xóa.`)) return;
        try {
            await archivePartnerService(service.id);
            showToast({ tone: 'success', title: 'Đã ẩn dịch vụ', message: 'Dịch vụ đã được ẩn khỏi danh sách hiển thị.' });
            loadServices();
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Archive dịch vụ thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Ẩn dịch vụ thất bại', message });
        }
    };

    const handleCopyService = async (service) => {
        if (draftSlotsLeft <= 0) {
            const message = 'Bạn đã lưu tối đa 3 bản nháp dịch vụ.';
            setError(message);
            showToast({ tone: 'warning', title: 'Đã đạt giới hạn bản nháp', message });
            return;
        }
        try {
            await copyPartnerService(service.id);
            showToast({ tone: 'success', title: 'Đã tạo bản nháp', message: 'Đã tạo bản nháp sao chép từ dịch vụ.' });
            await loadServices();
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Tạo bản sao thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Tạo bản sao thất bại', message });
        }
    };

    const handleCopyDraft = async (draft) => {
        if (draftSlotsLeft <= 0) {
            const message = 'Bạn đã lưu tối đa 3 bản nháp dịch vụ.';
            setError(message);
            showToast({ tone: 'warning', title: 'Đã đạt giới hạn bản nháp', message });
            return;
        }
        try {
            await copyPartnerServiceChangeRequest(draft.id);
            showToast({ tone: 'success', title: 'Đã tạo bản nháp', message: 'Đã tạo bản nháp sao chép.' });
            await loadServices();
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Tạo bản sao thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Tạo bản sao thất bại', message });
        }
    };

    const handleDeleteDraft = async (draft) => {
        if (!window.confirm(`Xóa bản nháp ${draft.serviceName || `#${draft.id}`}?`)) return;
        try {
            await deletePartnerServiceDraft(draft.id);
            showToast({ tone: 'success', title: 'Đã xóa bản nháp', message: 'Bản nháp dịch vụ đã được xóa.' });
            await loadServices();
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Xóa bản nháp thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Xóa bản nháp thất bại', message });
        }
    };

    return (
        <PartnerLayout title="Dịch vụ" subtitle="Tạo/cập nhật dịch vụ qua yêu cầu admin duyệt">
            <div className="space-y-6">
                {error && <PartnerErrorState message={error} onRetry={loadServices} />}

                <section className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Dịch vụ của nhà cung cấp</h2>
                        </div>
                        <button type="button" onClick={startCreate} className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 flex items-center justify-center gap-2">
                            <Plus className="w-5 h-5" /> Tạo dịch vụ
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
                        <Metric label="Đang hiển thị" value={activeCount} tone="orange" />
                        <Metric label="Đang ẩn" value={services.length - activeCount} />
                        <Metric label="Bản nháp" value={`${drafts.length}/${DRAFT_LIMIT}`} />
                        <Metric label="Chờ duyệt" value={pendingRequests.length} />
                    </div>
                </section>

                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/60 px-4 py-6 backdrop-blur-sm">
                        <form onSubmit={handleSubmitRequest} className="w-full max-w-4xl bg-white rounded-[2rem] border border-gray-100 p-6 shadow-2xl space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black flex items-center gap-2"><Scissors className="w-5 h-5 text-orange-500" /> {form.providerServiceId ? 'Yêu cầu cập nhật dịch vụ' : 'Yêu cầu tạo dịch vụ'}</h2>
                                    <p className="text-sm text-gray-500 font-semibold mt-1">Admin sẽ duyệt trước khi dịch vụ được áp dụng cho khách đặt lịch.</p>
                                </div>
                                <button type="button" onClick={resetForm} className="p-2 rounded-xl bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-4">

                                <label className="space-y-2 block">
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">1. Tên dịch vụ *</span>
                                    <input value={form.serviceName} onChange={(e) => updateField('serviceName', e.target.value)} maxLength={150} placeholder="Ví dụ: Tắm spa thú cưng" className={`w-full px-4 py-3 rounded-2xl border font-semibold ${fieldErrors.serviceName ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-100'}`} />
                                    <FieldError message={fieldErrors.serviceName} />
                                </label>

                                <div className="space-y-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">2. Ảnh mô tả (1-5 ảnh) *</span>
                                    <label
                                        onDragOver={handleImageDragOver}
                                        onDragEnter={handleImageDragOver}
                                        onDragLeave={handleImageDragLeave}
                                        onDrop={handleImageDrop}
                                        className={`min-h-36 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center text-center p-5 cursor-pointer transition-all ${form.photoUrls.length >= MAX_PHOTOS ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' : isImageDragActive ? 'bg-orange-100 border-orange-400 ring-4 ring-orange-100 scale-[1.01]' : 'bg-orange-50/40 border-orange-100 hover:bg-orange-50'}`}
                                    >
                                        <input type="file" accept="image/*" multiple disabled={uploading || form.photoUrls.length >= MAX_PHOTOS} onChange={(e) => { handleUploadImages(e.target.files); e.target.value = ''; }} className="hidden" />
                                        {uploading ? <Loader2 className="w-8 h-8 text-orange-500 animate-spin" /> : <ImagePlus className="w-8 h-8 text-orange-500" />}
                                        <p className="font-black text-gray-800 mt-2">{uploading ? 'Đang upload ảnh...' : isImageDragActive ? 'Thả ảnh vào đây để upload' : 'Bấm để chọn hoặc kéo thả ảnh mô tả'}</p>
                                        <p className="text-xs font-bold text-gray-400 mt-1">JPG/PNG/WebP • tối đa 5MB/ảnh • {form.photoUrls.length}/{MAX_PHOTOS}</p>
                                    </label>
                                    <FieldError message={fieldErrors.photoUrls} />
                                    {form.photoUrls.length > 0 && (
                                        <div className="flex gap-3 overflow-x-auto rounded-2xl bg-gray-50 border border-gray-100 p-3">
                                            {form.photoUrls.map((url, index) => (
                                                <div key={`${url}-${index}`} className="relative w-28 h-24 rounded-2xl overflow-hidden shrink-0 bg-white">
                                                    <img src={url} alt={`Ảnh dịch vụ ${index + 1}`} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-red-500"><X className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="space-y-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">3. Giá dịch vụ *</span>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatPriceInput(form.priceAmount)}
                                                onChange={(e) => updatePriceAmount(e.target.value)}
                                                placeholder="Ví dụ: 10.000"
                                                className={`w-full px-4 py-3 pr-24 rounded-2xl border font-semibold ${fieldErrors.priceAmount ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-100'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={appendThousandsToPrice}
                                                disabled={!digitsOnly(form.priceAmount)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-black hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                                title="Thêm .000 vào cuối giá"
                                            >
                                                + .000
                                            </button>
                                        </div>
                                        <FieldError message={fieldErrors.priceAmount} />
                                    </label>
                                    <label className="space-y-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Đơn vị tính *</span>
                                        <select value={form.priceUnit} onChange={(e) => updateField('priceUnit', e.target.value)} className={`w-full px-4 py-3 rounded-2xl border font-semibold ${fieldErrors.priceUnit ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                                            {priceUnitOptions.map(([value, label]) => <option key={value} value={value}>/{label}</option>)}
                                        </select>
                                        <FieldError message={fieldErrors.priceUnit} />
                                    </label>
                                </div>

                                <label className="space-y-2 block">
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">4. Mô tả dịch vụ *</span>
                                    <textarea rows="5" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Mô tả chi tiết dịch vụ bao gồm những gì, điều kiện áp dụng, thời lượng dự kiến..." className={`w-full px-4 py-3 rounded-2xl border font-semibold resize-none ${fieldErrors.description ? 'bg-red-50/50 border-red-200' : 'bg-gray-50 border-gray-100'}`} />
                                    <FieldError message={fieldErrors.description} />
                                </label>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button disabled={saving || uploading} className="px-6 py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 disabled:opacity-60 flex items-center gap-2"><Send className="w-5 h-5" /> {saving ? 'Đang gửi...' : (form.providerServiceId ? 'Yêu cầu cập nhật dịch vụ' : 'Yêu cầu tạo dịch vụ')}</button>
                                <button type="button" disabled={saving || uploading || (!form.draftId && draftSlotsLeft <= 0)} onClick={handleSaveDraft} className="px-6 py-4 rounded-2xl bg-orange-50 text-orange-600 font-black disabled:opacity-60 flex items-center gap-2"><Save className="w-5 h-5" /> Lưu nháp ({draftSlotsLeft} còn lại)</button>
                                <button type="button" onClick={resetForm} className="px-6 py-4 rounded-2xl bg-gray-100 text-gray-700 font-black">Hủy</button>
                            </div>
                        </form>
                    </div>
                )}

                {requests.length > 0 && (
                    <section className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2"><FileText className="w-5 h-5 text-orange-500" /> Bản nháp & yêu cầu đã gửi</h2>
                                <p className="text-sm text-gray-500 font-semibold mt-1">Danh sách rút gọn. Bấm Chi tiết để xem đầy đủ ảnh, mô tả và phản hồi admin.</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-black text-xs self-start lg:self-auto">{filteredRequests.length}/{requests.length} mục</span>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
                            <label className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input value={requestSearch} onChange={(e) => setRequestSearch(e.target.value)} placeholder="Tìm theo tên, mô tả, phản hồi admin..." className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-semibold" />
                            </label>
                            <select value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)} className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-black text-sm">
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="DRAFT">Bản nháp</option>
                                <option value="PENDING_REVIEW">Chờ duyệt</option>
                                <option value="APPROVED">Đã duyệt</option>
                                <option value="REJECTED">Từ chối</option>
                            </select>
                            <select value={requestTypeFilter} onChange={(e) => setRequestTypeFilter(e.target.value)} className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-black text-sm">
                                <option value="ALL">Tất cả loại</option>
                                <option value="CREATE">Tạo mới</option>
                                <option value="UPDATE">Cập nhật</option>
                            </select>
                        </div>

                        {filteredRequests.length === 0 ? (
                            <div className="rounded-[1.5rem] bg-gray-50 border border-gray-100 p-6 text-center">
                                <p className="font-black text-gray-900">Không có yêu cầu phù hợp.</p>
                                <p className="text-sm text-gray-500 font-semibold mt-1">Thử đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pagedRequests.map((request) => (
                                    <div key={request.id} className="rounded-[1.5rem] bg-gray-50 border border-gray-100 p-4">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-black text-gray-900" title={request.serviceName || 'Bản nháp chưa đặt tên'}>{middleEllipsis(request.serviceName || 'Bản nháp chưa đặt tên')}</h3>
                                                    <PartnerStatusBadge status={statusTone(request.status)} />
                                                </div>
                                                <p className="text-xs font-bold text-gray-500 mt-1">#{request.id} · {requestTypeLabel(request.requestType)} · {categoryLabel(request.categories)}</p>
                                                <p className="text-sm font-black text-gray-700 mt-2"><Camera className="w-4 h-4 text-orange-500 inline mr-1" />{request.photoUrls?.length || 0} ảnh · {request.priceDisplay} / {request.priceUnitLabel}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 shrink-0">
                                                <button type="button" onClick={() => setSelectedRequest(request)} className="px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-100 font-black text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Chi tiết</button>
                                                {request.status === 'DRAFT' && <button type="button" onClick={() => startEditDraft(request)} className="px-4 py-2 rounded-xl bg-gray-900 text-white font-black text-xs">Sửa nháp</button>}
                                                {request.status === 'DRAFT' && <button type="button" onClick={() => handleDeleteDraft(request)} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-black text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" /> Xóa</button>}
                                                <button type="button" onClick={() => handleCopyDraft(request)} className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-black text-xs flex items-center gap-1"><Copy className="w-3 h-3" /> Sao chép</button>
                                            </div>
                                        </div>
                                        {request.adminMessage && <p className={`text-xs font-bold rounded-2xl p-3 mt-3 line-clamp-2 ${adminMessageToneClass(request.status)}`}>Admin: {request.adminMessage}</p>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {filteredRequests.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold text-gray-500">
                                <label className="flex items-center gap-2">
                                    <span>Hiển thị</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={Math.max(1, filteredRequests.length)}
                                        value={requestPageSize}
                                        onChange={(e) => setRequestPageSize(Math.max(1, Math.min(Math.max(1, filteredRequests.length), Number(e.target.value) || 1)))}
                                        className="w-20 px-3 py-2 rounded-xl bg-gray-100 text-gray-800 font-black border border-gray-100"
                                    />
                                    <span>/ {filteredRequests.length}</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button type="button" disabled={safeRequestPage <= 1} onClick={() => setRequestPage((page) => Math.max(1, page - 1))} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-black disabled:opacity-40">Trước</button>
                                    <span className="px-3 py-2 rounded-xl bg-orange-50 text-orange-600 font-black">{safeRequestPage}/{requestTotalPages}</span>
                                    <button type="button" disabled={safeRequestPage >= requestTotalPages} onClick={() => setRequestPage((page) => Math.min(requestTotalPages, page + 1))} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-black disabled:opacity-40">Sau</button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/60 px-4 py-6 backdrop-blur-sm">
                        <div className="w-full max-w-4xl bg-white rounded-[2rem] border border-gray-100 p-6 shadow-2xl space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">{selectedRequest.serviceName || 'Bản nháp chưa đặt tên'}</h2>
                                    <p className="text-sm text-gray-500 font-semibold mt-1">#{selectedRequest.id} · {requestTypeLabel(selectedRequest.requestType)} · {categoryLabel(selectedRequest.categories)}</p>
                                </div>
                                <button type="button" onClick={() => setSelectedRequest(null)} className="p-2 rounded-xl bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <PartnerStatusBadge status={statusTone(selectedRequest.status)} />
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-black text-xs">{selectedRequest.photoUrls?.length || 0} ảnh</span>
                                <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 font-black text-xs">{selectedRequest.priceDisplay} / {selectedRequest.priceUnitLabel}</span>
                            </div>
                            {selectedRequest.photoUrls?.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto rounded-2xl bg-gray-50 border border-gray-100 p-3">
                                    {selectedRequest.photoUrls.map((url, index) => (
                                        <img key={`${url}-${index}`} src={url} alt={`Ảnh yêu cầu ${index + 1}`} className="w-32 h-28 rounded-2xl object-cover bg-white shrink-0" />
                                    ))}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoBox label="Loại yêu cầu" value={requestTypeLabel(selectedRequest.requestType)} />
                                <InfoBox label="Giá" value={`${selectedRequest.priceDisplay} / ${selectedRequest.priceUnitLabel || ''}`} />
                                <InfoBox label="Phân loại" value={categoryLabel(selectedRequest.categories)} />
                                <InfoBox label="Provider service ID" value={selectedRequest.providerServiceId || 'Tạo mới'} />
                            </div>
                            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Mô tả</p>
                                <p className="text-sm font-semibold text-gray-700 mt-2 whitespace-pre-line">{selectedRequest.description || 'Chưa có mô tả.'}</p>
                            </div>
                            {selectedRequest.adminMessage && <p className={`text-sm font-bold rounded-2xl p-4 ${adminMessageToneClass(selectedRequest.status)}`}>Admin: {selectedRequest.adminMessage}</p>}
                            <div className="flex flex-wrap gap-2">
                                {selectedRequest.status === 'DRAFT' && <button type="button" onClick={() => { startEditDraft(selectedRequest); setSelectedRequest(null); }} className="px-4 py-3 rounded-xl bg-gray-900 text-white font-black text-sm">Sửa nháp</button>}
                                <button type="button" onClick={() => handleCopyDraft(selectedRequest)} className="px-4 py-3 rounded-xl bg-orange-50 text-orange-600 font-black text-sm">Sao chép</button>
                                <button type="button" onClick={() => setSelectedRequest(null)} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-black text-sm">Đóng</button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? <PartnerLoadingState /> : services.length === 0 ? <PartnerEmptyState title="Chưa có dịch vụ được duyệt" message="Tạo yêu cầu dịch vụ đầu tiên bằng nút Tạo dịch vụ phía trên và chờ admin duyệt trước khi hiển thị cho khách." /> : (
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {services.map((service) => (
                            <div key={service.id} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex gap-3 min-w-0 flex-1">
                                        {service.photoUrls?.[0] ? <img src={service.photoUrls[0]} alt={service.displayName || service.serviceName} className="w-14 h-14 rounded-2xl object-cover bg-orange-50" /> : <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center"><Scissors className="w-6 h-6" /></div>}
                                        <div className="min-w-0 flex-1 pr-2">
                                            <h3 className="text-xl font-black truncate" title={service.displayName || service.serviceName}>{service.displayName || service.serviceName || 'Dịch vụ chưa đặt tên'}</h3>
                                            <p className="text-gray-500 font-semibold text-sm">{categoryLabel(service.categories?.length ? service.categories : service.categoryName ? [{ name: service.categoryName }] : [])}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0"><PartnerStatusBadge status={service.active ? 'ACTIVE' : 'INACTIVE'} /></div>
                                </div>
                                <p className="text-gray-500 font-semibold line-clamp-3">{service.description || service.shortDescription || 'Chưa có mô tả.'}</p>
                                <div className="flex items-center justify-between text-sm font-black rounded-2xl bg-gray-50 p-4">
                                    <span className="text-orange-600 text-xl">{service.priceDisplay} / {priceUnitOptions.find(([value]) => value === service.priceUnit)?.[1] || service.priceUnit}</span>
                                    <span>{service.bookingCount} booking</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => startEdit(service)} className="px-4 py-2 rounded-xl bg-gray-900 text-white font-black text-xs">{pendingUpdateByServiceId.has(Number(service.id)) ? 'Xem yêu cầu chờ duyệt' : 'Yêu cầu cập nhật'}</button>
                                    <button onClick={() => handleCopyService(service)} className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-black text-xs">Sao chép</button>
                                    <button onClick={() => handleToggle(service)} className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-black text-xs">{service.active ? 'Ẩn dịch vụ' : 'Hiển thị dịch vụ'}</button>
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </div>
        </PartnerLayout>
    );
};

const Metric = ({ label, value, tone = 'gray' }) => (
    <div className={`rounded-2xl ${tone === 'orange' ? 'bg-orange-50' : 'bg-gray-50'} p-4`}>
        <p className={`text-xs font-black uppercase tracking-widest ${tone === 'orange' ? 'text-orange-500' : 'text-gray-400'}`}>{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
);

const FieldError = ({ message }) => (
    message ? <p className="text-xs font-bold text-red-500 mt-1">{message}</p> : null
);

const InfoBox = ({ label, value }) => (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-sm font-black text-gray-800 mt-1">{value || '—'}</p>
    </div>
);

export default PartnerServicesPage;