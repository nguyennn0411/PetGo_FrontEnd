import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Gift, Loader2, Plus, RefreshCw, Save, Tag, X } from 'lucide-react';
import '../../styles/AdminDashboard.css';

const fallbackOptions = {
    promotionTypes: [
        { value: 'PROMO_CODE', label: 'Mã ưu đãi' },
        { value: 'FLASH_SALE', label: 'Flash sale' },
        { value: 'FIRST_BOOKING', label: 'Khách mới' },
        { value: 'LOYALTY', label: 'Khách thân thiết' },
        { value: 'MEMBERSHIP', label: 'Membership' },
        { value: 'SEASONAL', label: 'Theo mùa/sự kiện' },
        { value: 'BUNDLE', label: 'Combo/bundle' },
        { value: 'FREE_SERVICE', label: 'Tặng dịch vụ' },
        { value: 'PARTNER_EXCLUSIVE', label: 'Riêng cho nhà cung cấp' },
    ],
    targetTypes: [
        { value: 'BOOKING', label: 'Booking dịch vụ' },
        { value: 'MEMBERSHIP', label: 'Membership' },
        { value: 'BOTH', label: 'Cả hai' },
    ],
    discountTypes: [
        { value: 'PERCENTAGE', label: 'Giảm theo %' },
        { value: 'FIXED_AMOUNT', label: 'Giảm số tiền' },
        { value: 'FIXED_PRICE', label: 'Giá sau giảm' },
        { value: 'FREE_SERVICE', label: 'Miễn phí' },
        { value: 'BOGO', label: 'Combo/BOGO' },
    ],
    userSegments: [
        { value: 'ALL', label: 'Tất cả khách hàng' },
        { value: 'NEW_USER', label: 'Khách mới' },
        { value: 'RETURNING_USER', label: 'Khách quay lại' },
        { value: 'MEMBERSHIP_ACTIVE', label: 'Hội viên active' },
        { value: 'NON_MEMBER', label: 'Chưa là hội viên' },
    ],
    daysOfWeek: [
        { value: 'MONDAY', label: 'Thứ hai' },
        { value: 'TUESDAY', label: 'Thứ ba' },
        { value: 'WEDNESDAY', label: 'Thứ tư' },
        { value: 'THURSDAY', label: 'Thứ năm' },
        { value: 'FRIDAY', label: 'Thứ sáu' },
        { value: 'SATURDAY', label: 'Thứ bảy' },
        { value: 'SUNDAY', label: 'Chủ nhật' },
    ],
};

const statusOptions = ['ALL', 'ACTIVE', 'SCHEDULED', 'INACTIVE', 'EXPIRED', 'USED_UP'];
const targetFilterOptions = ['ALL', 'BOOKING', 'MEMBERSHIP', 'BOTH'];

const makeEmptyForm = (partnerMode = false) => ({
    id: null,
    code: '',
    name: '',
    description: '',
    promotionType: partnerMode ? 'PARTNER_EXCLUSIVE' : 'PROMO_CODE',
    targetType: partnerMode ? 'BOOKING' : 'BOTH',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '',
    usageLimitTotal: '',
    usageLimitPerUser: '',
    stackable: false,
    autoApply: false,
    priority: partnerMode ? 5 : 10,
    userSegment: 'ALL',
    minCompletedBookings: '',
    applicableDaysOfWeek: [],
    providerIds: [],
    providerServiceIds: [],
    serviceCategoryIds: [],
    membershipPlanIds: [],
    badgeText: '',
    landingPageUrl: '',
    termsAndConditions: '',
    internalNote: '',
    startsAt: '',
    endsAt: '',
    originalStartsAt: '',
    originalEndsAt: '',
    active: true,
});

const normalizeArray = (value) => Array.isArray(value) ? value.map(String) : [];
const normalizeDateTimeInput = (value) => value ? String(value).slice(0, 16) : '';
const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN') + 'đ';
const formatDateTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : 'Không giới hạn';
const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const getCurrentDateTimeInput = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const isPastDateTime = (value) => {
    if (!value) return false;
    const selected = new Date(value);
    if (Number.isNaN(selected.getTime())) return true;
    const now = new Date();
    now.setSeconds(0, 0);
    return selected.getTime() < now.getTime();
};

const isNonNegativeIntegerValue = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0;
};

const hasAdvancedConfig = (promotion = {}, partnerMode = false) => {
    const defaultPriority = partnerMode ? 5 : 10;
    return Boolean(
        Number(promotion.usageLimitTotal || 0) > 0
        || Number(promotion.usageLimitPerUser || 0) > 0
        || Boolean(promotion.stackable)
        || Boolean(promotion.autoApply)
        || Number(promotion.priority ?? defaultPriority) !== defaultPriority
        || (promotion.userSegment && promotion.userSegment !== 'ALL')
        || Number(promotion.minCompletedBookings || 0) > 0
        || normalizeArray(promotion.applicableDaysOfWeek).length > 0
        || normalizeArray(promotion.providerIds).length > 0
        || normalizeArray(promotion.providerServiceIds).length > 0
        || normalizeArray(promotion.serviceCategoryIds).length > 0
        || normalizeArray(promotion.membershipPlanIds).length > 0
        || Boolean(promotion.badgeText)
        || Boolean(promotion.landingPageUrl)
        || Boolean(promotion.termsAndConditions)
        || Boolean(promotion.internalNote)
    );
};

const discountValueLabel = (discountType) => {
    if (discountType === 'PERCENTAGE' || discountType === 'BOGO') return 'Giá trị giảm (%)';
    if (discountType === 'FIXED_PRICE') return 'Giá sau giảm (VND)';
    if (discountType === 'FREE_SERVICE') return 'Giá trị giảm';
    return 'Số tiền giảm (VND)';
};

const discountValuePlaceholder = (discountType) => {
    if (discountType === 'PERCENTAGE' || discountType === 'BOGO') return '20';
    if (discountType === 'FIXED_PRICE') return '99000';
    if (discountType === 'FREE_SERVICE') return 'Tự động miễn phí';
    return '50000';
};

const toNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const toIdArray = (values = []) => values.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);

const labelOf = (options = [], value, fallback = value) => options.find((option) => option.value === value)?.label || fallback;

const statusBadgeClass = (status) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'ACTIVE') return 'bg-green-50 text-green-700 border-green-100';
    if (normalized === 'SCHEDULED') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (normalized === 'EXPIRED' || normalized === 'USED_UP') return 'bg-orange-50 text-orange-700 border-orange-100';
    return 'bg-gray-50 text-gray-600 border-gray-100';
};

const PromotionManager = ({
    partnerMode = false,
    loadPromotions,
    loadOptions,
    createPromotion,
    updatePromotion,
    updatePromotionStatus,
}) => {
    const [promotions, setPromotions] = useState([]);
    const [options, setOptions] = useState(fallbackOptions);
    const [filters, setFilters] = useState({ status: 'ALL', targetType: 'ALL' });
    const [form, setForm] = useState(makeEmptyForm(partnerMode));
    const [showForm, setShowForm] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const mergedOptions = useMemo(() => ({ ...fallbackOptions, ...(options || {}) }), [options]);
    const minDateTime = getCurrentDateTimeInput();
    const visibleTargetFilterOptions = partnerMode ? ['ALL', 'BOOKING'] : targetFilterOptions;
    const availablePromotionTypes = useMemo(
        () => partnerMode
            ? (mergedOptions.promotionTypes || []).filter((option) => option.value !== 'MEMBERSHIP')
            : (mergedOptions.promotionTypes || []),
        [mergedOptions.promotionTypes, partnerMode],
    );
    const availableTargetTypes = useMemo(
        () => partnerMode
            ? (mergedOptions.targetTypes || []).filter((option) => option.value === 'BOOKING')
            : (mergedOptions.targetTypes || []),
        [mergedOptions.targetTypes, partnerMode],
    );

    const metrics = useMemo(() => {
        const active = promotions.filter((item) => item.status === 'ACTIVE').length;
        const totalUsage = promotions.reduce((sum, item) => sum + Number(item.usageCount || 0), 0);
        return { active, totalUsage };
    }, [promotions]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const params = {
                status: filters.status !== 'ALL' ? filters.status : undefined,
                targetType: filters.targetType !== 'ALL' ? filters.targetType : undefined,
            };
            const [promotionData, optionData] = await Promise.all([
                loadPromotions(params),
                loadOptions().catch(() => fallbackOptions),
            ]);
            setPromotions(Array.isArray(promotionData) ? promotionData : []);
            setOptions({ ...fallbackOptions, ...(optionData || {}) });
        } catch (err) {
            setError(getErrorMessage(err, 'Không thể tải dữ liệu khuyến mãi.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filters.status, filters.targetType]);

    const resetForm = () => {
        setForm(makeEmptyForm(partnerMode));
        setShowForm(false);
        setShowAdvanced(false);
    };

    const startCreate = () => {
        setError('');
        setSuccess('');
        setForm(makeEmptyForm(partnerMode));
        setShowAdvanced(false);
        setShowForm(true);
    };

    const startEdit = (promotion) => {
        setError('');
        setSuccess('');
        setForm({
            ...makeEmptyForm(partnerMode),
            ...promotion,
            id: promotion.id,
            discountValue: promotion.discountValue ?? '',
            maxDiscountAmount: promotion.maxDiscountAmount || '',
            minOrderAmount: promotion.minOrderAmount || '',
            usageLimitTotal: promotion.usageLimitTotal || '',
            usageLimitPerUser: promotion.usageLimitPerUser || '',
            priority: promotion.priority ?? 0,
            minCompletedBookings: promotion.minCompletedBookings || '',
            applicableDaysOfWeek: normalizeArray(promotion.applicableDaysOfWeek),
            providerIds: normalizeArray(promotion.providerIds),
            providerServiceIds: normalizeArray(promotion.providerServiceIds),
            serviceCategoryIds: normalizeArray(promotion.serviceCategoryIds),
            membershipPlanIds: normalizeArray(promotion.membershipPlanIds),
            startsAt: normalizeDateTimeInput(promotion.startsAt),
            endsAt: normalizeDateTimeInput(promotion.endsAt),
            originalStartsAt: normalizeDateTimeInput(promotion.startsAt),
            originalEndsAt: normalizeDateTimeInput(promotion.endsAt),
            active: promotion.active !== false,
        });
        setShowAdvanced(hasAdvancedConfig(promotion, partnerMode));
        setShowForm(true);
    };

    const resetAdvancedValues = (state) => ({
        ...state,
        usageLimitTotal: '',
        usageLimitPerUser: '',
        stackable: false,
        autoApply: false,
        priority: partnerMode ? 5 : 10,
        userSegment: 'ALL',
        minCompletedBookings: '',
        applicableDaysOfWeek: [],
        providerIds: [],
        providerServiceIds: [],
        serviceCategoryIds: [],
        membershipPlanIds: [],
        badgeText: '',
        landingPageUrl: '',
        termsAndConditions: '',
        internalNote: '',
    });

    const toggleAdvanced = (checked) => {
        setShowAdvanced(checked);
        if (!checked) {
            setForm((prev) => resetAdvancedValues(prev));
        }
    };

    const updateField = (field, value) => setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (field === 'discountType') {
            next.discountValue = value === 'FREE_SERVICE' ? '1' : (prev.discountType === 'FREE_SERVICE' ? '' : prev.discountValue);
            if (value === 'FREE_SERVICE') {
                next.maxDiscountAmount = '';
            }
        }
        if (field === 'targetType' && value === 'MEMBERSHIP') {
            next.providerIds = [];
            next.providerServiceIds = [];
            next.serviceCategoryIds = [];
        }
        return next;
    });

    const handleMultiSelect = (field, event) => {
        updateField(field, Array.from(event.target.selectedOptions).map((option) => option.value));
    };

    const toggleDay = (day) => {
        setForm((prev) => ({
            ...prev,
            applicableDaysOfWeek: prev.applicableDaysOfWeek.includes(day)
                ? prev.applicableDaysOfWeek.filter((item) => item !== day)
                : [...prev.applicableDaysOfWeek, day],
        }));
    };

    const buildPayload = () => ({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        promotionType: form.promotionType,
        targetType: partnerMode ? 'BOOKING' : form.targetType,
        discountType: form.discountType,
        discountValue: form.discountType === 'FREE_SERVICE' ? 1 : Number(form.discountValue),
        maxDiscountAmount: form.discountType === 'FREE_SERVICE' ? null : toNumberOrNull(form.maxDiscountAmount),
        minOrderAmount: toNumberOrNull(form.minOrderAmount),
        usageLimitTotal: showAdvanced ? toNumberOrNull(form.usageLimitTotal) : null,
        usageLimitPerUser: showAdvanced ? toNumberOrNull(form.usageLimitPerUser) : null,
        stackable: showAdvanced ? Boolean(form.stackable) : false,
        autoApply: showAdvanced ? Boolean(form.autoApply) : false,
        priority: showAdvanced ? (toNumberOrNull(form.priority) ?? (partnerMode ? 5 : 10)) : (partnerMode ? 5 : 10),
        userSegment: showAdvanced ? form.userSegment : 'ALL',
        minCompletedBookings: showAdvanced ? toNumberOrNull(form.minCompletedBookings) : null,
        applicableDaysOfWeek: showAdvanced ? form.applicableDaysOfWeek : [],
        providerIds: partnerMode || !showAdvanced ? [] : toIdArray(form.providerIds),
        providerServiceIds: showAdvanced ? toIdArray(form.providerServiceIds) : [],
        serviceCategoryIds: showAdvanced ? toIdArray(form.serviceCategoryIds) : [],
        membershipPlanIds: partnerMode || !showAdvanced ? [] : toIdArray(form.membershipPlanIds),
        badgeText: showAdvanced ? (form.badgeText.trim() || null) : null,
        landingPageUrl: showAdvanced ? (form.landingPageUrl.trim() || null) : null,
        termsAndConditions: showAdvanced ? (form.termsAndConditions.trim() || null) : null,
        internalNote: showAdvanced ? (form.internalNote.trim() || null) : null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        active: Boolean(form.active),
    });

    const validateForm = () => {
        const code = form.code.trim().toUpperCase();
        if (!code) return 'Vui lòng nhập mã ưu đãi.';
        if (!/^[A-Z0-9_-]{3,50}$/.test(code)) return 'Mã ưu đãi chỉ gồm chữ, số, dấu _ hoặc -, từ 3 đến 50 ký tự.';
        if (!form.name.trim()) return 'Vui lòng nhập tên ưu đãi.';
        const discountValue = Number(form.discountValue);
        if (form.discountType !== 'FREE_SERVICE' && (!Number.isFinite(discountValue) || discountValue <= 0)) return 'Giá trị giảm giá phải lớn hơn 0.';
        if ((form.discountType === 'PERCENTAGE' || form.discountType === 'BOGO') && discountValue > 100) return 'Giảm theo phần trăm không được vượt quá 100%.';
        if (form.maxDiscountAmount !== '' && Number(form.maxDiscountAmount) < 0) return 'Mức giảm tối đa phải >= 0.';
        if (form.minOrderAmount !== '' && Number(form.minOrderAmount) < 0) return 'Đơn tối thiểu phải >= 0.';
        if (form.startsAt && isPastDateTime(form.startsAt) && (!form.id || form.startsAt !== form.originalStartsAt)) return 'Thời gian bắt đầu không được nằm trong quá khứ.';
        if (form.endsAt && isPastDateTime(form.endsAt) && (!form.id || form.endsAt !== form.originalEndsAt)) return 'Thời gian kết thúc không được nằm trong quá khứ.';
        if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
        if (showAdvanced) {
            if (!isNonNegativeIntegerValue(form.usageLimitTotal)) return 'Tổng lượt dùng phải là số nguyên >= 0.';
            if (!isNonNegativeIntegerValue(form.usageLimitPerUser)) return 'Lượt dùng mỗi khách phải là số nguyên >= 0.';
            const totalLimit = toNumberOrNull(form.usageLimitTotal);
            const perUserLimit = toNumberOrNull(form.usageLimitPerUser);
            if (totalLimit && perUserLimit && perUserLimit > totalLimit) return 'Lượt dùng mỗi khách không được lớn hơn tổng lượt dùng.';
            if (!isNonNegativeIntegerValue(form.priority)) return 'Độ ưu tiên phải là số nguyên >= 0.';
            if (!isNonNegativeIntegerValue(form.minCompletedBookings)) return 'Booking hoàn thành tối thiểu phải là số nguyên >= 0.';
            if (form.landingPageUrl.trim() && !/^(https?:\/\/|\/)/i.test(form.landingPageUrl.trim())) return 'Landing page URL phải bắt đầu bằng http(s):// hoặc /.';
        }
        return '';
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validation = validateForm();
        if (validation) {
            setError(validation);
            return;
        }
        try {
            setSaving(true);
            setError('');
            setSuccess('');
            const payload = buildPayload();
            if (form.id) await updatePromotion(form.id, payload);
            else await createPromotion(payload);
            setSuccess(form.id ? 'Đã cập nhật ưu đãi.' : 'Đã tạo ưu đãi mới.');
            resetForm();
            await fetchData();
        } catch (err) {
            setError(getErrorMessage(err, 'Lưu ưu đãi thất bại.'));
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (promotion) => {
        const nextActive = !promotion.active;
        if (!window.confirm(`${nextActive ? 'Bật' : 'Tạm dừng'} mã ${promotion.code}?`)) return;
        try {
            setError('');
            setSuccess('');
            await updatePromotionStatus(promotion.id, nextActive);
            setSuccess(nextActive ? 'Đã bật ưu đãi.' : 'Đã tạm dừng ưu đãi.');
            await fetchData();
        } catch (err) {
            setError(getErrorMessage(err, 'Cập nhật trạng thái thất bại.'));
        }
    };

    const canEditPromotion = (promotion) => partnerMode || promotion.userType === 'ADMIN';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="Đang chạy" value={metrics.active} hint="Ưu đãi active hiện tại" />
                <MetricCard label="Tổng ưu đãi" value={promotions.length} hint={partnerMode ? 'Do nhà cung cấp của bạn tạo' : 'Do admin tạo'} />
                <MetricCard label="Lượt sử dụng" value={metrics.totalUsage} hint="Tổng redemption ghi nhận" />
            </div>

            {error && <Alert tone="danger" message={error} />}
            {success && <Alert tone="success" message={success} />}

            <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-orange-500 font-black">Promotion center</p>
                        <h2 className="text-2xl font-black text-gray-900">Quản lý khuyến mãi</h2>
                        <p className="text-sm text-gray-500 font-semibold">Hỗ trợ mã giảm giá, flash sale, khách mới, membership, combo, miễn phí dịch vụ và phạm vi áp dụng chi tiết.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={fetchData} className="px-4 py-3 rounded-2xl border border-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-gray-50 flex items-center gap-2" disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        <button type="button" onClick={startCreate} className="px-4 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Tạo ưu đãi
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                    <FilterSelect label="Trạng thái" value={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} options={statusOptions} />
                    <FilterSelect label="Phạm vi" value={filters.targetType} onChange={(value) => setFilters((prev) => ({ ...prev, targetType: value }))} options={visibleTargetFilterOptions} />
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-gray-900/60 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && resetForm()}>
                <form onSubmit={handleSubmit} className="w-full max-w-5xl bg-white border border-orange-100 rounded-[2rem] p-5 shadow-2xl space-y-5" onMouseDown={(event) => event.stopPropagation()}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.18em] text-orange-500 font-black">{form.id ? 'Update promotion' : 'New promotion'}</p>
                            <h3 className="text-xl font-black text-gray-900">{form.id ? `Sửa ${form.code}` : 'Tạo ưu đãi mới'}</h3>
                        </div>
                        <button type="button" onClick={resetForm} className="p-3 rounded-2xl bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500"><X className="w-5 h-5" /></button>
                    </div>

                    <section className="space-y-4">
                        <div className="rounded-3xl bg-orange-50/60 border border-orange-100 p-4">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-orange-500 font-black">Cài đặt cơ bản</p>
                            <p className="text-sm text-gray-600 font-semibold mt-1">Chỉ nhập các thông tin cần thiết để ưu đãi hoạt động. Các điều kiện nâng cao nằm ở mục bên dưới.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Mã ưu đãi">
                                <input value={form.code} onChange={(event) => updateField('code', event.target.value.toUpperCase().replace(/\s+/g, '_'))} placeholder="PETGO20" maxLength={50} pattern="[A-Z0-9_-]{3,50}" />
                            </Field>
                            <Field label="Tên ưu đãi">
                                <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Giảm 20% dịch vụ cuối tuần" maxLength={120} />
                            </Field>
                            <Field label="Loại chương trình">
                                <select value={form.promotionType} onChange={(event) => updateField('promotionType', event.target.value)}>
                                    {availablePromotionTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Phạm vi áp dụng">
                                <select value={partnerMode ? 'BOOKING' : form.targetType} onChange={(event) => updateField('targetType', event.target.value)} disabled={partnerMode}>
                                    {availableTargetTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Kiểu giảm giá">
                                <select value={form.discountType} onChange={(event) => updateField('discountType', event.target.value)}>
                                    {mergedOptions.discountTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </Field>
                            <Field label={discountValueLabel(form.discountType)}>
                                <input
                                    type="number"
                                    min="0"
                                    max={form.discountType === 'PERCENTAGE' || form.discountType === 'BOGO' ? 100 : undefined}
                                    step="0.01"
                                    value={form.discountValue}
                                    onChange={(event) => updateField('discountValue', event.target.value)}
                                    placeholder={discountValuePlaceholder(form.discountType)}
                                    disabled={form.discountType === 'FREE_SERVICE'}
                                />
                            </Field>
                            <Field label="Giảm tối đa (tuỳ chọn)">
                                <input type="number" min="0" value={form.maxDiscountAmount} onChange={(event) => updateField('maxDiscountAmount', event.target.value)} placeholder="100000" disabled={form.discountType === 'FREE_SERVICE'} />
                            </Field>
                            <Field label="Đơn tối thiểu">
                                <input type="number" min="0" value={form.minOrderAmount} onChange={(event) => updateField('minOrderAmount', event.target.value)} placeholder="200000" />
                            </Field>
                        </div>

                        <Field label="Mô tả ưu đãi">
                            <textarea rows={3} value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Mô tả ngắn để admin/partner hiểu mục tiêu chiến dịch..." />
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="Bắt đầu">
                                <input
                                    type="datetime-local"
                                    min={form.id && form.startsAt === form.originalStartsAt ? undefined : minDateTime}
                                    value={form.startsAt}
                                    onChange={(event) => updateField('startsAt', event.target.value)}
                                />
                            </Field>
                            <Field label="Kết thúc">
                                <input
                                    type="datetime-local"
                                    min={form.id && form.endsAt === form.originalEndsAt ? undefined : (form.startsAt || minDateTime)}
                                    value={form.endsAt}
                                    onChange={(event) => updateField('endsAt', event.target.value)}
                                />
                            </Field>
                            <div className="flex items-end">
                                <Toggle label="Đang hoạt động" checked={form.active} onChange={(value) => updateField('active', value)} />
                            </div>
                        </div>
                    </section>

                    <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 overflow-hidden">
                        <label className="flex items-center justify-between gap-4 p-4 cursor-pointer">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-700">Cài đặt nâng cao</p>
                                <p className="text-xs font-semibold text-gray-500 mt-1">Bật khi cần giới hạn lượt dùng, phân khúc khách, ngày áp dụng, scope dịch vụ/category/membership hoặc nội dung vận hành.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={showAdvanced} onChange={(event) => toggleAdvanced(event.target.checked)} className="w-5 h-5" />
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                            </div>
                        </label>

                        {showAdvanced && (
                            <div className="border-t border-gray-100 bg-white p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Field label="Tổng lượt dùng">
                                        <input type="number" min="0" step="1" value={form.usageLimitTotal} onChange={(event) => updateField('usageLimitTotal', event.target.value)} placeholder="Không giới hạn" />
                                    </Field>
                                    <Field label="Lượt / khách">
                                        <input type="number" min="0" step="1" value={form.usageLimitPerUser} onChange={(event) => updateField('usageLimitPerUser', event.target.value)} placeholder="1" />
                                    </Field>
                                    <Field label="Độ ưu tiên">
                                        <input type="number" min="0" step="1" value={form.priority} onChange={(event) => updateField('priority', event.target.value)} />
                                    </Field>
                                    <Field label="Nhóm khách hàng">
                                        <select value={form.userSegment} onChange={(event) => updateField('userSegment', event.target.value)}>
                                            {mergedOptions.userSegments.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                        </select>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Field label="Booking hoàn thành tối thiểu">
                                        <input type="number" min="0" step="1" value={form.minCompletedBookings} onChange={(event) => updateField('minCompletedBookings', event.target.value)} placeholder="0" />
                                    </Field>
                                    <div className="md:col-span-2 flex flex-wrap gap-3 items-end">
                                        <Toggle label="Cho phép cộng dồn" checked={form.stackable} onChange={(value) => updateField('stackable', value)} />
                                        <Toggle label="Auto apply" checked={form.autoApply} onChange={(value) => updateField('autoApply', value)} />
                                    </div>
                                </div>

                                <div className="rounded-[1.25rem] bg-gray-50 p-4 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ngày áp dụng trong tuần</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {mergedOptions.daysOfWeek.map((day) => (
                                            <label key={day.value} className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 text-xs font-bold text-gray-600 border border-gray-100 cursor-pointer">
                                                <input type="checkbox" checked={form.applicableDaysOfWeek.includes(day.value)} onChange={() => toggleDay(day.value)} className="w-auto" />
                                                {day.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {!partnerMode && form.targetType !== 'MEMBERSHIP' && (
                                        <MultiSelect label="Giới hạn nhà cung cấp" value={form.providerIds} onChange={(event) => handleMultiSelect('providerIds', event)} options={(mergedOptions.providers || []).map((item) => ({ value: item.id, label: item.name }))} />
                                    )}
                                    {form.targetType !== 'MEMBERSHIP' && (
                                        <>
                                            <MultiSelect label="Giới hạn dịch vụ partner" value={form.providerServiceIds} onChange={(event) => handleMultiSelect('providerServiceIds', event)} options={(mergedOptions.providerServices || []).map((item) => ({ value: item.id, label: `${item.serviceName}${item.providerName ? ` • ${item.providerName}` : ''}` }))} />
                                            <MultiSelect label="Giới hạn nhóm dịch vụ" value={form.serviceCategoryIds} onChange={(event) => handleMultiSelect('serviceCategoryIds', event)} options={(mergedOptions.serviceCategories || []).map((item) => ({ value: item.id, label: `${item.name}${item.parentName ? ` (${item.parentName})` : ''}` }))} />
                                        </>
                                    )}
                                    {!partnerMode && form.targetType !== 'BOOKING' && (
                                        <MultiSelect label="Giới hạn gói membership" value={form.membershipPlanIds} onChange={(event) => handleMultiSelect('membershipPlanIds', event)} options={(mergedOptions.membershipPlans || []).map((item) => ({ value: item.id, label: `${item.name} • ${item.billingCycle || ''}` }))} />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Nhãn hiển thị">
                                        <input value={form.badgeText} onChange={(event) => updateField('badgeText', event.target.value)} placeholder="Hot deal" maxLength={80} />
                                    </Field>
                                    <Field label="Landing page URL">
                                        <input value={form.landingPageUrl} onChange={(event) => updateField('landingPageUrl', event.target.value)} placeholder="/search?promo=..." maxLength={500} />
                                    </Field>
                                    <Field label="Điều khoản áp dụng">
                                        <textarea rows={3} value={form.termsAndConditions} onChange={(event) => updateField('termsAndConditions', event.target.value)} placeholder="Điều kiện sử dụng, ngoại lệ, thời gian áp dụng..." />
                                    </Field>
                                    <Field label="Ghi chú nội bộ">
                                        <textarea rows={3} value={form.internalNote} onChange={(event) => updateField('internalNote', event.target.value)} placeholder="Ghi chú chỉ dành cho vận hành/admin/partner..." />
                                    </Field>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-gray-500">Backend vẫn kiểm tra lại toàn bộ điều kiện khi lưu và khi khách checkout.</p>
                        <button type="submit" disabled={saving} className="px-6 py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-500 flex items-center gap-2 disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Đang lưu...' : 'Lưu ưu đãi'}
                        </button>
                    </div>
                </form>
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-10 text-center text-gray-500 font-bold"><Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />Đang tải khuyến mãi...</div>
                ) : promotions.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-10 text-center">
                        <Gift className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                        <h3 className="text-xl font-black text-gray-900">Chưa có ưu đãi</h3>
                        <p className="text-gray-500 font-semibold mt-1">Tạo ưu đãi đầu tiên để khách hàng dùng khi checkout.</p>
                    </div>
                ) : promotions.map((promotion) => {
                    const usagePercent = promotion.usageLimitTotal ? Math.min(100, Math.round((Number(promotion.usageCount || 0) / Number(promotion.usageLimitTotal)) * 100)) : 0;
                    return (
                        <div key={promotion.id} className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest"><Tag className="w-3 h-3" />{promotion.code}</span>
                                        <span className={`px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest ${statusBadgeClass(promotion.status)}`}>{promotion.status}</span>
                                        <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">{promotion.targetType}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 truncate">{promotion.name}</h3>
                                    <p className="text-sm text-gray-500 font-semibold mt-1">{promotion.description || promotion.scopeSummary}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                                        <MiniInfo label="Giảm giá" value={promotion.discountSummary || labelOf(mergedOptions.discountTypes, promotion.discountType)} />
                                        <MiniInfo label="Đơn tối thiểu" value={formatCurrency(promotion.minOrderAmount)} />
                                        <MiniInfo label="Hiệu lực" value={`${formatDateTime(promotion.startsAt)} → ${formatDateTime(promotion.endsAt)}`} />
                                        <MiniInfo label="Loại" value={labelOf(mergedOptions.promotionTypes, promotion.promotionType)} />
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1"><span>Đã dùng</span><span>{promotion.usageCount || 0}{promotion.usageLimitTotal ? `/${promotion.usageLimitTotal}` : ' lượt'}</span></div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500" style={{ width: promotion.usageLimitTotal ? `${usagePercent}%` : '0%' }} /></div>
                                    </div>
                                </div>
                                <div className="flex lg:flex-col gap-2 lg:min-w-36">
                                    {canEditPromotion(promotion) && <button type="button" onClick={() => startEdit(promotion)} className="px-4 py-2 rounded-xl border border-gray-100 text-gray-600 font-black text-xs uppercase hover:bg-gray-50">Sửa</button>}
                                    <button type="button" onClick={() => toggleStatus(promotion)} className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${promotion.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>{promotion.active ? 'Dừng' : 'Bật'}</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, hint }) => (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
        <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-black">{label}</div>
        <div className="text-3xl font-black text-gray-900 mt-2">{value}</div>
        <div className="text-xs font-bold text-gray-500 mt-1">{hint}</div>
    </div>
);

const Alert = ({ tone, message }) => (
    <div className={`rounded-2xl p-4 text-sm font-bold ${tone === 'danger' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>{message}</div>
);

const Field = ({ label, children }) => (
    <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
        {label}
        <div className="promotion-field">{children}</div>
    </label>
);

const MultiSelect = ({ label, value, onChange, options }) => (
    <Field label={label}>
        <select multiple value={value} onChange={onChange} className="min-h-32">
            {options.length === 0 ? <option disabled>Không có lựa chọn</option> : options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <p className="normal-case tracking-normal text-[11px] font-semibold text-gray-400">Giữ Ctrl/Cmd để chọn nhiều lựa chọn.</p>
    </Field>
);

const FilterSelect = ({ label, value, onChange, options }) => (
    <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
        {label}
        <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-100">
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    </label>
);

const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-gray-50 text-xs font-black uppercase tracking-widest text-gray-600 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="w-auto" />
        {label}
    </label>
);

const MiniInfo = ({ label, value }) => (
    <div className="rounded-2xl bg-gray-50 p-3">
        <div className="text-[9px] uppercase tracking-widest text-gray-400 font-black">{label}</div>
        <div className="text-sm text-gray-900 font-black mt-1 truncate">{value || '—'}</div>
    </div>
);

export default PromotionManager;