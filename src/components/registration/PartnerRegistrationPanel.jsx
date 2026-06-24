import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    ImagePlus,
    Loader2,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Send,
    Store,
    User,
    XCircle,
} from 'lucide-react';
import { getProviderFilterOptions } from '../../api/providers';
import {
    getPartnerRegistration,
    submitPartnerAdditionalInformation,
    submitPartnerRegistration,
    uploadPartnerRegistrationImage,
    updatePartnerRegistrationDraft,
    createPartnerRegistrationDraft,
} from '../../api/registrations';
import {
    REGISTRATION_STATUS,
    REGISTRATION_STATUS_BADGE_CLASS,
    REGISTRATION_STATUS_LABEL,
} from '../../constants/registration';
import {
    getAccountAddress,
    getAccountDisplayName,
    getAccountEmail,
    getAccountPhone,
} from '../../utils/userIdentity';

const buildInitialForm = (account, registration) => ({
    businessName: registration?.businessName || '',
    businessPhone: registration?.businessPhone || valueOrEmpty(getAccountPhone(account), 'Chưa có số điện thoại'),
    businessEmail: registration?.businessEmail || valueOrEmpty(getAccountEmail(account), 'Chưa có email'),
    businessAddress: registration?.businessAddress || valueOrEmpty(getAccountAddress(account), 'Chưa cập nhật địa chỉ') || account?.addressLine1 || '',
    taxCode: registration?.taxCode || '',
    representativeName: registration?.representativeName || getAccountDisplayName(account) || '',
    representativePhone: registration?.representativePhone || valueOrEmpty(getAccountPhone(account), 'Chưa có số điện thoại'),
    representativeEmail: registration?.representativeEmail || valueOrEmpty(getAccountEmail(account), 'Chưa có email'),
    description: registration?.description || '',
    serviceCategoryIds: (registration?.serviceCategoryIds || []).map(Number),
    // Draft vẫn không lưu ảnh, nhưng hồ sơ đã gửi/review cần load lại ảnh để user bổ sung hoặc nộp lại không phải upload từ đầu.
    locationImageUrls: registration?.status && registration.status !== REGISTRATION_STATUS.DRAFT
        ? normalizeImageList(registration?.locationImageUrls)
        : [],
});

const valueOrEmpty = (value, placeholder) => (value && value !== placeholder ? value : '');

const MIN_LOCATION_IMAGE_COUNT = 4;
const MAX_LOCATION_IMAGE_COUNT = 10;
const MAX_LOCATION_IMAGE_SIZE = 5 * 1024 * 1024;

const normalizeImageList = (values) => (
    Array.isArray(values)
        ? values.map((item) => String(item || '').trim()).filter(Boolean).slice(0, MAX_LOCATION_IMAGE_COUNT)
        : []
);

const flattenCategoryOptions = (items = [], level = 0, parentNames = []) => (items || []).flatMap((item) => {
    const pathParts = [...parentNames, item.name].filter(Boolean);
    return [
        { ...item, level, pathLabel: pathParts.join(' / ') },
        ...flattenCategoryOptions(item.children || [], level + 1, pathParts),
    ];
});

const getCategoryChildren = (category) => Array.isArray(category?.children) ? category.children : [];

const toCategoryId = (value) => {
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
};

const collectCategoryTreeIds = (category) => {
    const id = toCategoryId(category?.id);
    const childIds = getCategoryChildren(category).flatMap(collectCategoryTreeIds);
    return id === null ? childIds : [id, ...childIds];
};

const findCategoryPath = (items = [], targetId, path = []) => {
    const safeTargetId = toCategoryId(targetId);
    if (safeTargetId === null) return null;

    for (const item of items || []) {
        const nextPath = [...path, item];
        if (toCategoryId(item?.id) === safeTargetId) {
            return nextPath;
        }

        const childPath = findCategoryPath(getCategoryChildren(item), safeTargetId, nextPath);
        if (childPath) return childPath;
    }

    return null;
};

const isCategoryTreeFullySelected = (category, selectedIds) => {
    const treeIds = collectCategoryTreeIds(category);
    return treeIds.length > 0 && treeIds.every((id) => selectedIds.has(id));
};

const syncAncestorCategorySelection = (selectedIds, path = []) => {
    for (let index = path.length - 2; index >= 0; index -= 1) {
        const ancestor = path[index];
        const ancestorId = toCategoryId(ancestor?.id);
        if (ancestorId === null) continue;

        const children = getCategoryChildren(ancestor);
        const allChildrenSelected = children.length > 0
            && children.every((child) => isCategoryTreeFullySelected(child, selectedIds));

        if (allChildrenSelected) selectedIds.add(ancestorId);
        else selectedIds.delete(ancestorId);
    }
};

const flattenCategoryTreeIds = (items = []) => (items || []).flatMap((item) => collectCategoryTreeIds(item));

const normalizeCascadedCategoryIds = (categoryIds = [], categories = []) => {
    const selectedIds = new Set((categoryIds || []).map(toCategoryId).filter((id) => id !== null));

    const selectDescendantsForCheckedParents = (items = []) => {
        (items || []).forEach((item) => {
            const id = toCategoryId(item?.id);
            if (id !== null && selectedIds.has(id)) {
                collectCategoryTreeIds(item).forEach((treeId) => selectedIds.add(treeId));
            }
            selectDescendantsForCheckedParents(getCategoryChildren(item));
        });
    };

    const syncCheckedParentsFromChildren = (items = []) => {
        (items || []).forEach((item) => {
            const children = getCategoryChildren(item);
            syncCheckedParentsFromChildren(children);

            const id = toCategoryId(item?.id);
            if (id === null || children.length === 0) return;

            const allChildrenSelected = children.every((child) => isCategoryTreeFullySelected(child, selectedIds));
            if (allChildrenSelected) selectedIds.add(id);
            else selectedIds.delete(id);
        });
    };

    selectDescendantsForCheckedParents(categories);
    syncCheckedParentsFromChildren(categories);

    return flattenCategoryTreeIds(categories).filter((id) => selectedIds.has(id));
};

const areSameCategoryIds = (left = [], right = []) => {
    if (left.length !== right.length) return false;
    return left.every((id, index) => Number(id) === Number(right[index]));
};

const countCategoryTreeItems = (items = []) => (items || []).reduce(
    (total, item) => total + 1 + countCategoryTreeItems(getCategoryChildren(item)),
    0,
);

const countSelectedCategoryTreeItems = (items = [], selectedIds = new Set()) => (items || []).reduce(
    (total, item) => total + (selectedIds.has(Number(item.id)) ? 1 : 0) + countSelectedCategoryTreeItems(getCategoryChildren(item), selectedIds),
    0,
);

const toPayload = (form, { includeImages = true } = {}) => {
    const payload = {
        ...form,
        serviceCategoryIds: (form.serviceCategoryIds || []).map(Number).filter(Boolean),
        locationImageUrls: normalizeImageList(form.locationImageUrls),
    };

    if (!includeImages) {
        delete payload.locationImageUrls;
    }

    return payload;
};

const validateForm = (form, requireImages = true) => {
    const errors = {};
    const requiredFields = [
        ['businessName', 'Vui lòng nhập tên nhà cung cấp/doanh nghiệp.'],
        ['businessPhone', 'Vui lòng nhập số điện thoại nhà cung cấp.'],
        ['businessEmail', 'Vui lòng nhập email nhà cung cấp.'],
        ['businessAddress', 'Vui lòng nhập địa chỉ nhà cung cấp.'],
        ['representativeName', 'Vui lòng nhập tên người đại diện.'],
        ['representativePhone', 'Vui lòng nhập số điện thoại người đại diện.'],
        ['representativeEmail', 'Vui lòng nhập email người đại diện.'],
    ];

    requiredFields.forEach(([field, message]) => {
        if (!String(form[field] || '').trim()) errors[field] = message;
    });

    if (form.businessEmail && !/^\S+@\S+\.\S+$/.test(form.businessEmail)) {
        errors.businessEmail = 'Email nhà cung cấp không hợp lệ.';
    }
    if (form.representativeEmail && !/^\S+@\S+\.\S+$/.test(form.representativeEmail)) {
        errors.representativeEmail = 'Email người đại diện không hợp lệ.';
    }
    if ((form.serviceCategoryIds || []).length === 0) {
        errors.serviceCategoryIds = 'Vui lòng chọn ít nhất một nhóm dịch vụ.';
    }
    if (requireImages) {
        const imageCount = normalizeImageList(form.locationImageUrls).length;
        if (imageCount < MIN_LOCATION_IMAGE_COUNT) {
            errors.locationImageUrls = 'Vui lòng cung cấp tối thiểu 4 ảnh địa điểm nhà cung cấp.';
        } else if (imageCount > MAX_LOCATION_IMAGE_COUNT) {
            errors.locationImageUrls = 'Chỉ được cung cấp tối đa 10 ảnh địa điểm nhà cung cấp.';
        }
    }

    return errors;
};

const PartnerRegistrationPanel = ({ account }) => {
    const [registration, setRegistration] = useState(null);
    const [form, setForm] = useState(() => buildInitialForm(account, null));
    const [additionalInformation, setAdditionalInformation] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [imageUploads, setImageUploads] = useState({});
    const [centerNotice, setCenterNotice] = useState(null);
    const noticeTimerRef = useRef(null);

    const status = registration?.status || REGISTRATION_STATUS.DRAFT;
    const canEdit = !registration || [
        REGISTRATION_STATUS.DRAFT,
        REGISTRATION_STATUS.NEEDS_MORE_INFO,
        REGISTRATION_STATUS.REJECTED,
    ].includes(status);

    const statusBadgeClass = REGISTRATION_STATUS_BADGE_CLASS[status] || REGISTRATION_STATUS_BADGE_CLASS.DRAFT;
    const categoryOptions = useMemo(() => flattenCategoryOptions(categories), [categories]);
    const isUploadingImages = Object.values(imageUploads).some(Boolean);

    const showCenterNotice = (notice = 'Vui lòng điền đầy đủ thông tin') => {
        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
        const nextNotice = typeof notice === 'string'
            ? { type: 'warning', title: 'Cần kiểm tra thông tin', message: notice }
            : { type: 'info', title: 'Thông báo', ...notice };
        setCenterNotice(nextNotice);
        noticeTimerRef.current = setTimeout(() => setCenterNotice(null), 5000);
    };

    const closeCenterNotice = () => {
        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
        setCenterNotice(null);
    };

    useEffect(() => () => {
        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    }, []);

    const selectedCategoryNames = useMemo(() => {
        const selected = new Set((form.serviceCategoryIds || []).map(Number));
        return categoryOptions.filter((item) => selected.has(Number(item.id))).map((item) => item.pathLabel || item.name);
    }, [categoryOptions, form.serviceCategoryIds]);

    const loadRegistration = async () => {
        try {
            setLoading(true);
            setError('');
            const [registrationData, filterData] = await Promise.all([
                getPartnerRegistration(),
                getProviderFilterOptions().catch(() => ({ serviceCategories: [] })),
            ]);
            const nextRegistration = registrationData || null;
            setRegistration(nextRegistration);
            setForm(buildInitialForm(account, nextRegistration));
            setAdditionalInformation('');
            setCategories(filterData?.serviceCategories || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải hồ sơ đăng ký.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRegistration();
    }, []);

    useEffect(() => {
        if (!registration) {
            setForm(buildInitialForm(account, null));
        }
    }, [account]);

    useEffect(() => {
        if ((categories || []).length === 0) return;

        setForm((prev) => {
            const currentIds = (prev.serviceCategoryIds || []).map(Number).filter(Number.isFinite);
            const normalizedIds = normalizeCascadedCategoryIds(currentIds, categories);
            if (areSameCategoryIds(currentIds, normalizedIds)) return prev;

            return { ...prev, serviceCategoryIds: normalizedIds };
        });
    }, [categories, form.serviceCategoryIds]);

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const addUploadedImage = (value) => {
        setForm((prev) => {
            const images = normalizeImageList(prev.locationImageUrls);
            const nextValue = String(value || '').trim();
            if (nextValue && images.length < MAX_LOCATION_IMAGE_COUNT && !images.includes(nextValue)) {
                images.push(nextValue);
            }
            return { ...prev, locationImageUrls: images };
        });
        setFieldErrors((prev) => ({ ...prev, locationImageUrls: '' }));
    };

    const removeImage = (index) => {
        setForm((prev) => {
            const images = normalizeImageList(prev.locationImageUrls).filter((_, itemIndex) => itemIndex !== index);
            return { ...prev, locationImageUrls: images };
        });
        setFieldErrors((prev) => ({ ...prev, locationImageUrls: '' }));
    };

    const setImageUploading = (index, uploading) => {
        setImageUploads((prev) => {
            const next = { ...prev };
            if (uploading) next[index] = true;
            else delete next[index];
            return next;
        });
    };

    const handleImageFilesSelected = async (selectedFiles) => {
        const files = Array.from(selectedFiles || []);
        if (files.length === 0) return;

        const invalidFile = files.find((file) => !file.type?.startsWith('image/'));
        if (invalidFile) {
            setFieldErrors((prev) => ({ ...prev, locationImageUrls: 'Vui lòng chỉ chọn file ảnh.' }));
            return;
        }

        const oversizedFile = files.find((file) => file.size > MAX_LOCATION_IMAGE_SIZE);
        if (oversizedFile) {
            setFieldErrors((prev) => ({ ...prev, locationImageUrls: 'Mỗi ảnh địa điểm không được vượt quá 5MB.' }));
            return;
        }

        const currentImageCount = normalizeImageList(form.locationImageUrls).length;
        const availableSlots = Math.max(MAX_LOCATION_IMAGE_COUNT - currentImageCount, 0);
        if (availableSlots === 0) {
            setFieldErrors((prev) => ({ ...prev, locationImageUrls: 'Chỉ được cung cấp tối đa 10 ảnh địa điểm nhà cung cấp.' }));
            return;
        }

        const uploadFiles = files.slice(0, availableSlots);
        if (uploadFiles.length === 0) return;

        if (files.length > availableSlots) {
            setFieldErrors((prev) => ({ ...prev, locationImageUrls: `Chỉ còn ${availableSlots} vị trí ảnh.` }));
        } else {
            setFieldErrors((prev) => ({ ...prev, locationImageUrls: '' }));
        }

        await Promise.all(uploadFiles.map(async (file, offset) => {
            const uploadKey = `${Date.now()}-${offset}`;
            setImageUploading(uploadKey, true);

            try {
                const imageUrl = await uploadPartnerRegistrationImage(file);
                addUploadedImage(imageUrl);
            } catch (err) {
                setFieldErrors((prev) => ({
                    ...prev,
                    locationImageUrls: err.response?.data?.message || 'Upload ảnh lên cloud thất bại. Vui lòng thử lại.',
                }));
            } finally {
                setImageUploading(uploadKey, false);
            }
        }));
    };

    const toggleCategory = (categoryId) => {
        const nextId = Number(categoryId);
        const categoryPath = findCategoryPath(categories, nextId) || [];
        const targetCategory = categoryPath[categoryPath.length - 1];
        const toggledIds = targetCategory ? collectCategoryTreeIds(targetCategory) : [nextId];

        setForm((prev) => {
            const current = new Set((prev.serviceCategoryIds || []).map(Number));
            const shouldSelect = !current.has(nextId);

            toggledIds.forEach((id) => {
                if (!Number.isFinite(id)) return;
                if (shouldSelect) current.add(id);
                else current.delete(id);
            });

            syncAncestorCategorySelection(current, categoryPath);

            return { ...prev, serviceCategoryIds: Array.from(current) };
        });
        setFieldErrors((prev) => ({ ...prev, serviceCategoryIds: '' }));
    };

    const handleSaveDraft = async () => {
        if (isUploadingImages) {
            setFieldErrors((prev) => ({ ...prev, locationImageUrls: 'Vui lòng chờ upload ảnh hoàn tất.' }));
            return;
        }

        const errors = validateForm(form, false);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        try {
            setSaving(true);
            setError('');
            const payload = toPayload(form, { includeImages: false });
            const saved = registration?.id
                ? await updatePartnerRegistrationDraft(payload)
                : await createPartnerRegistrationDraft(payload);
            setRegistration(saved);
            showCenterNotice({
                type: 'success',
                title: 'Đã lưu nháp',
                message: 'Hồ sơ của bạn đã được lưu nháp. Bạn có thể tiếp tục chỉnh sửa trước khi gửi xét duyệt.',
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Lưu nháp hồ sơ thất bại.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (isUploadingImages) {
            setFieldErrors((prev) => ({ ...prev, locationImageUrls: 'Vui lòng chờ upload ảnh hoàn tất.' }));
            showCenterNotice('Vui lòng chờ upload ảnh hoàn tất.');
            return;
        }

        const errors = validateForm(form, true);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            showCenterNotice();
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            const submitted = await submitPartnerRegistration(toPayload(form));
            setRegistration(submitted);
            showCenterNotice({
                type: 'success',
                title: 'Đã gửi hồ sơ',
                message: 'Hồ sơ của bạn đang được xét duyệt.',
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Gửi hồ sơ thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitAdditionalInfo = async () => {
        if (isUploadingImages) {
            setFieldErrors((prev) => ({ ...prev, locationImageUrls: 'Vui lòng chờ upload ảnh hoàn tất.' }));
            showCenterNotice('Vui lòng chờ upload ảnh hoàn tất.');
            return;
        }

        const errors = validateForm(form, true);
        if (!additionalInformation.trim()) {
            errors.additionalInformation = 'Vui lòng nhập thông tin bổ sung theo yêu cầu admin.';
        }
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            showCenterNotice();
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            const submitted = await submitPartnerAdditionalInformation({
                additionalInformation,
                application: toPayload(form),
            });
            setRegistration(submitted);
            setAdditionalInformation('');
            showCenterNotice({
                type: 'success',
                title: 'Đã gửi bổ sung',
                message: 'Thông tin bổ sung đã được gửi. Hồ sơ của bạn đang được xét duyệt lại.',
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Gửi thông tin bổ sung thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <RegistrationLoadingState />;
    }

    const noticeOverlay = centerNotice && <CenterNotice notice={centerNotice} onClose={closeCenterNotice} />;

    if (error && !canEdit && status !== REGISTRATION_STATUS.NEEDS_MORE_INFO) {
        return <RegistrationErrorState message={error} onRetry={loadRegistration} />;
    }

    if (status === REGISTRATION_STATUS.AWAITING_APPROVAL) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {noticeOverlay}
                <RegistrationProgressSteps status={status} registration={registration} />
                <AwaitingApprovalView registration={registration} onRefresh={loadRegistration} />
            </div>
        );
    }

    if (status === REGISTRATION_STATUS.APPROVED) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {noticeOverlay}
                <RegistrationProgressSteps status={status} registration={registration} />
                <RegistrationResultView type="approved" registration={registration} onRefresh={loadRegistration} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {noticeOverlay}
            <RegistrationProgressSteps status={status} registration={registration} />
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                <Store className="w-6 h-6" />
                            </div>

                            <h2 className="text-2xl font-black">Mẫu đăng ký cho nhà cung cấp</h2>
                        </div>
                    </div>
                    <span className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest ${statusBadgeClass}`}>
                        {REGISTRATION_STATUS_LABEL[status] || status}
                    </span>
                </div>

                {error && (
                    <InlineAlert type="error" message={error} onRetry={loadRegistration} />
                )}

                {status === REGISTRATION_STATUS.REJECTED && (
                    <InlineAlert
                        type="error"
                        title="Hồ sơ trước đó đã bị từ chối với lý do:"
                        message={registration?.rejectionReason || registration?.adminMessage || 'Bạn có thể chỉnh sửa và gửi lại hồ sơ.'}
                    />
                )}

                {status === REGISTRATION_STATUS.NEEDS_MORE_INFO && (
                    <AdditionalInformationView
                        registration={registration}
                        value={additionalInformation}
                        onChange={setAdditionalInformation}
                        error={fieldErrors.additionalInformation}
                    />
                )}

                <PartnerRegistrationForm
                    form={form}
                    categories={categories}
                    fieldErrors={fieldErrors}
                    selectedCategoryNames={selectedCategoryNames}
                    onFieldChange={updateField}
                    onImageFilesSelected={handleImageFilesSelected}
                    imageUploads={imageUploads}
                    onImageRemove={removeImage}
                    onToggleCategory={toggleCategory}
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    {status !== REGISTRATION_STATUS.NEEDS_MORE_INFO && (
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={saving || submitting || isUploadingImages}
                            className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                            Lưu nháp
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={status === REGISTRATION_STATUS.NEEDS_MORE_INFO ? handleSubmitAdditionalInfo : handleSubmit}
                        disabled={saving || submitting || isUploadingImages}
                        className="flex-[2] py-4 px-6 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 hover:bg-orange-500 hover:shadow-orange-100 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {status === REGISTRATION_STATUS.NEEDS_MORE_INFO ? 'Gửi thông tin bổ sung' : 'Gửi xét duyệt'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PartnerRegistrationForm = ({
    form,
    categories,
    fieldErrors,
    selectedCategoryNames,
    onFieldChange,
    onImageFilesSelected,
    imageUploads,
    onImageRemove,
    onToggleCategory,
}) => {
    const selectedCategoryIds = useMemo(
        () => new Set((form.serviceCategoryIds || []).map(Number)),
        [form.serviceCategoryIds],
    );
    const totalCategoryCount = useMemo(() => countCategoryTreeItems(categories), [categories]);
    const selectedCategoryCount = useMemo(
        () => countSelectedCategoryTreeItems(categories, selectedCategoryIds),
        [categories, selectedCategoryIds],
    );
    const locationImages = normalizeImageList(form.locationImageUrls);
    const uploadingCount = Object.values(imageUploads || {}).filter(Boolean).length;

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <SectionTitle icon={<Building2 />} title="Thông tin nhà cung cấp/doanh nghiệp" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormInput label="Tên nhà cung cấp/doanh nghiệp" value={form.businessName} error={fieldErrors.businessName} onChange={(value) => onFieldChange('businessName', value)} required />
                    <FormInput label="Số điện thoại nhà cung cấp" value={form.businessPhone} error={fieldErrors.businessPhone} onChange={(value) => onFieldChange('businessPhone', value)} icon={<Phone />} required />
                    <FormInput label="Email nhà cung cấp" type="email" value={form.businessEmail} error={fieldErrors.businessEmail} onChange={(value) => onFieldChange('businessEmail', value)} icon={<Mail />} required />
                    <FormInput label="Mã số thuế" value={form.taxCode} onChange={(value) => onFieldChange('taxCode', value)} />
                    <div className="sm:col-span-2">
                        <FormInput label="Địa chỉ nhà cung cấp" value={form.businessAddress} error={fieldErrors.businessAddress} onChange={(value) => onFieldChange('businessAddress', value)} icon={<MapPin />} required />
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <SectionTitle icon={<User />} title="Người đại diện" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <FormInput label="Họ tên" value={form.representativeName} error={fieldErrors.representativeName} onChange={(value) => onFieldChange('representativeName', value)} required />
                    <FormInput label="Số điện thoại" value={form.representativePhone} error={fieldErrors.representativePhone} onChange={(value) => onFieldChange('representativePhone', value)} icon={<Phone />} required />
                    <FormInput label="Email" type="email" value={form.representativeEmail} error={fieldErrors.representativeEmail} onChange={(value) => onFieldChange('representativeEmail', value)} icon={<Mail />} required />
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <SectionTitle icon={<Store />} title="Nhóm dịch vụ nhà cung cấp cung cấp" required />
                    </div>
                    {totalCategoryCount > 0 && (
                        <span className="w-fit rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500">
                            {selectedCategoryCount}/{totalCategoryCount} đã chọn
                        </span>
                    )}
                </div>
                {fieldErrors.serviceCategoryIds && <p className="text-xs text-red-500 font-bold">{fieldErrors.serviceCategoryIds}</p>}

                {(categories || []).length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-[34rem] overflow-y-auto pr-1">
                        {(categories || []).map((category) => (
                            <CategoryTreeCard
                                key={category.id}
                                category={category}
                                selectedCategoryIds={selectedCategoryIds}
                                onToggleCategory={onToggleCategory}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyCategoryState />
                )}

                <SelectedCategorySummary names={selectedCategoryNames} />
            </section>

            <section className="space-y-4">
                <SectionTitle icon={<ImagePlus />} title="Ảnh về địa điểm" required />
                <div className="rounded-2xl border border-yellow-100 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-700">
                    Ảnh mới upload chỉ được lưu vào hồ sơ khi bấm “Gửi xét duyệt/Gửi thông tin bổ sung”.
                </div>
                <p className="text-sm text-gray-500 font-medium">
                    Upload từ {MIN_LOCATION_IMAGE_COUNT} - {MAX_LOCATION_IMAGE_COUNT} ảnh.
                </p>
                {fieldErrors.locationImageUrls && <p className="text-xs text-red-500 font-bold">{fieldErrors.locationImageUrls}</p>}
                <LocationImageUploader
                    images={locationImages}
                    uploadingCount={uploadingCount}
                    onFilesSelected={onImageFilesSelected}
                    onRemove={onImageRemove}
                />
            </section>

            <section className="space-y-4">
                <SectionTitle icon={<FileText />} title="Mô tả thêm" />
                <textarea
                    value={form.description || ''}
                    onChange={(e) => onFieldChange('description', e.target.value)}
                    rows={5}
                    placeholder="Mô tả kinh nghiệm, quy mô nhà cung cấp, thế mạnh dịch vụ..."
                    className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none font-bold resize-none"
                />
            </section>
        </div>
    );
};

const LocationImageUploader = ({ images, uploadingCount, onFilesSelected, onRemove }) => {
    const inputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const uploading = uploadingCount > 0;
    const canUploadMore = images.length < MAX_LOCATION_IMAGE_COUNT;

    const openFilePicker = () => {
        if (!uploading && canUploadMore) inputRef.current?.click();
    };

    const handleFiles = (files) => {
        if (!uploading && canUploadMore) onFilesSelected(files);
    };

    return (
        <div className="space-y-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Upload ảnh địa điểm
                <RequiredMark />
            </span>
            <div
                role="button"
                tabIndex={0}
                onClick={openFilePicker}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openFilePicker();
                    }
                }}
                onDragEnter={(event) => {
                    event.preventDefault();
                    if (!uploading && canUploadMore) setDragActive(true);
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    if (!uploading && canUploadMore) setDragActive(true);
                }}
                onDragLeave={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                }}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                    handleFiles(event.dataTransfer.files);
                }}
                className={`relative min-h-56 overflow-hidden rounded-[2rem] border-2 border-dashed transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 ${!canUploadMore
                    ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-75'
                    : dragActive
                        ? 'cursor-pointer border-orange-400 bg-orange-50'
                        : 'cursor-pointer border-gray-200 bg-gray-50 hover:border-orange-200 hover:bg-orange-50/40'
                    }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                        handleFiles(event.target.files);
                        event.target.value = '';
                    }}
                />

                <div className="flex min-h-56 flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
                        <ImagePlus className="w-7 h-7" />
                    </div>
                    <p className="font-black text-gray-700">{canUploadMore ? 'Kéo thả ảnh vào đây' : 'Đã đủ 10 ảnh'}</p>
                    <p className="mt-1 text-xs font-bold text-gray-400">
                        {canUploadMore ? 'hoặc bấm để chọn một/nhiều ảnh từ máy' : 'Xóa bớt ảnh bên dưới nếu muốn upload ảnh khác'}
                    </p>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-300">JPG/PNG/WebP • tối đa 5MB/ảnh</p>
                    <span className="mt-4 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-500 shadow-sm">
                        {images.length}/{MAX_LOCATION_IMAGE_COUNT} ảnh đã upload
                    </span>
                </div>

                {uploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm text-orange-600">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="mt-3 text-xs font-black uppercase tracking-widest">Đang upload {uploadingCount} ảnh lên cloud...</p>
                    </div>
                )}
            </div>

            {images.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Ảnh đã upload</p>
                        <p className="text-[11px] font-bold text-gray-400">Kéo ngang để xem thêm</p>
                    </div>
                    <div className="flex gap-3 overflow-x-auto rounded-[1.5rem] border border-gray-100 bg-gray-50 p-3">
                        {images.map((imageUrl, index) => (
                            <div key={`${imageUrl}-${index}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
                                <img src={imageUrl} alt={`Ảnh địa điểm ${index + 1}`} className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => onRemove(index)}
                                    className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-red-500 shadow transition-all hover:bg-red-50"
                                    aria-label={`Xóa ảnh địa điểm ${index + 1}`}
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CategoryTreeCard = ({ category, selectedCategoryIds, onToggleCategory }) => {
    const children = getCategoryChildren(category);
    const checked = selectedCategoryIds.has(Number(category.id));
    const selectedChildCount = countSelectedCategoryTreeItems(children, selectedCategoryIds);
    const childCount = countCategoryTreeItems(children);
    const partial = !checked && selectedChildCount > 0;
    const hasSelectionInGroup = checked || selectedChildCount > 0;

    return (
        <article className={`rounded-[2rem] border p-4 transition-all ${hasSelectionInGroup ? 'border-orange-200 bg-orange-50/40 shadow-sm' : 'border-gray-100 bg-white hover:border-orange-100'}`}>
            <CategoryOptionRow
                category={category}
                checked={checked}
                childCount={childCount}
                selectedChildCount={selectedChildCount}
                onToggleCategory={onToggleCategory}
                partial={partial}
                root
            />

            {children.length > 0 && (
                <div className="mt-4 space-y-3 border-l-2 border-orange-100 pl-4">
                    {children.map((child) => (
                        <CategoryTreeNode
                            key={child.id}
                            category={child}
                            selectedCategoryIds={selectedCategoryIds}
                            onToggleCategory={onToggleCategory}
                        />
                    ))}
                </div>
            )}
        </article>
    );
};

const CategoryTreeNode = ({ category, selectedCategoryIds, onToggleCategory }) => {
    const children = getCategoryChildren(category);
    const checked = selectedCategoryIds.has(Number(category.id));
    const selectedChildCount = countSelectedCategoryTreeItems(children, selectedCategoryIds);
    const childCount = countCategoryTreeItems(children);
    const partial = !checked && selectedChildCount > 0;

    return (
        <div className="space-y-3">
            <CategoryOptionRow
                category={category}
                checked={checked}
                childCount={childCount}
                selectedChildCount={selectedChildCount}
                onToggleCategory={onToggleCategory}
                partial={partial}
            />

            {children.length > 0 && (
                <div className="ml-5 space-y-3 border-l border-dashed border-gray-200 pl-4">
                    {children.map((child) => (
                        <CategoryTreeNode
                            key={child.id}
                            category={child}
                            selectedCategoryIds={selectedCategoryIds}
                            onToggleCategory={onToggleCategory}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CategoryOptionRow = ({ category, checked, childCount, selectedChildCount, onToggleCategory, partial = false, root = false }) => {
    const checkboxRef = useRef(null);
    const name = category?.name || 'Nhóm dịch vụ chưa đặt tên';
    const description = category?.description || '';

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = partial && !checked;
        }
    }, [checked, partial]);

    return (
        <label className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-all ${checked ? 'border-orange-300 bg-white text-orange-700 shadow-sm' : partial ? 'border-orange-100 bg-orange-50/70 text-orange-700' : 'border-transparent bg-gray-50 text-gray-600 hover:border-orange-100 hover:bg-white'}`}>
            <input
                ref={checkboxRef}
                type="checkbox"
                checked={checked}
                aria-checked={partial ? 'mixed' : checked}
                onChange={() => onToggleCategory(category.id)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded-lg border-gray-300 text-orange-500 focus:ring-orange-400"
            />
            <span className="min-w-0 flex-1 space-y-1">
                <span className="flex flex-wrap items-center gap-2">
                    {root && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-orange-600">
                            Nhóm chính
                        </span>
                    )}
                    <span className={`${root ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-black leading-snug break-words`}>
                        {name}
                    </span>
                </span>
                {description && <span className="block text-xs font-semibold leading-relaxed text-gray-400">{description}</span>}
            </span>
            {childCount > 0 && (
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${selectedChildCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-white text-gray-400'}`}>
                    {selectedChildCount > 0 ? `${selectedChildCount}/` : ''}{childCount} nhóm con
                </span>
            )}
        </label>
    );
};

const EmptyCategoryState = () => (
    <div className="rounded-[2rem] border border-dashed border-gray-200 bg-gray-50 px-5 py-6 text-center">
        <p className="font-black text-gray-600">Chưa có nhóm dịch vụ đang hoạt động</p>
        <p className="mt-1 text-sm font-medium text-gray-400">Vui lòng thử tải lại sau hoặc liên hệ admin để cấu hình danh mục dịch vụ.</p>
    </div>
);

const SelectedCategorySummary = ({ names }) => {
    if (!names.length) {
        return <p className="text-xs font-bold text-gray-400">Chưa chọn nhóm dịch vụ nào.</p>;
    }

    return (
        <div className="rounded-[2rem] border border-orange-100 bg-orange-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Đã chọn</p>
            <div className="mt-2 flex flex-wrap gap-2">
                {names.map((name, index) => (
                    <span key={`${name}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-600 shadow-sm">
                        {name}
                    </span>
                ))}
            </div>
        </div>
    );
};

const RegistrationProgressSteps = ({ status, registration }) => {
    const hasAdditionalSubmission = Boolean(String(registration?.additionalInformation || '').trim());
    const hasAdditionalCycle = hasAdditionalSubmission
        || status === REGISTRATION_STATUS.NEEDS_MORE_INFO;

    const steps = [
        {
            key: 'create',
            number: '1',
            label: 'Tạo hồ sơ',
            description: status === REGISTRATION_STATUS.DRAFT
                ? 'Điền thông tin còn thiếu hoặc chỉnh sửa thông tin sẵn có.'
                : 'Thông tin hồ sơ đã được ghi nhận.',
            active: status === REGISTRATION_STATUS.DRAFT,
            done: status !== REGISTRATION_STATUS.DRAFT,
        },
        {
            key: 'awaiting',
            number: '2',
            label: 'Chờ xét duyệt',
            description: hasAdditionalSubmission
                ? 'Đang xem lại thông tin bổ sung.'
                : 'Hồ sơ của bạn đang được xét duyệt.',
            active: status === REGISTRATION_STATUS.AWAITING_APPROVAL,
            done: [REGISTRATION_STATUS.NEEDS_MORE_INFO, REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.REJECTED].includes(status),
        },
        {
            key: 'additional',
            number: '2.1',
            label: 'Bổ sung thông tin',
            description: status === REGISTRATION_STATUS.NEEDS_MORE_INFO
                ? 'Bạn cần bổ sung theo yêu cầu.'
                : hasAdditionalSubmission
                    ? 'Thông tin bổ sung đã được gửi lại.'
                    : 'Chỉ dùng khi admin yêu cầu thêm thông tin.',
            active: status === REGISTRATION_STATUS.NEEDS_MORE_INFO,
            done: hasAdditionalSubmission && status !== REGISTRATION_STATUS.NEEDS_MORE_INFO,
            muted: !hasAdditionalCycle,
        },
        {
            key: 'result',
            number: '3',
            label: status === REGISTRATION_STATUS.REJECTED ? 'Đã từ chối' : status === REGISTRATION_STATUS.APPROVED ? 'Đã duyệt' : 'Đã xét duyệt',
            description: status === REGISTRATION_STATUS.REJECTED
                ? 'Bạn có thể chỉnh sửa và gửi lại hồ sơ.'
                : status === REGISTRATION_STATUS.APPROVED
                    ? 'Hồ sơ của bạn đã được duyệt.'
                    : 'Kết quả xét duyệt sẽ hiển thị tại đây.',
            active: [REGISTRATION_STATUS.APPROVED, REGISTRATION_STATUS.REJECTED].includes(status),
            done: status === REGISTRATION_STATUS.APPROVED,
            danger: status === REGISTRATION_STATUS.REJECTED,
        },
    ].filter((step) => step.key !== 'additional' || hasAdditionalCycle);

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
            {steps.map((step, index) => {
                const tone = step.danger ? 'danger' : step.active ? 'active' : step.done ? 'done' : step.muted ? 'muted' : 'idle';
                const toneClass = {
                    active: 'border-orange-200 bg-orange-50 text-orange-700',
                    done: 'border-green-100 bg-green-50 text-green-700',
                    danger: 'border-red-100 bg-red-50 text-red-700',
                    muted: 'border-gray-100 bg-gray-50 text-gray-400',
                    idle: 'border-gray-100 bg-white text-gray-500',
                }[tone];
                const bubbleClass = {
                    active: 'bg-orange-500 text-white',
                    done: 'bg-green-500 text-white',
                    danger: 'bg-red-500 text-white',
                    muted: 'bg-gray-200 text-gray-400',
                    idle: 'bg-gray-100 text-gray-400',
                }[tone];

                return (
                    <React.Fragment key={step.key}>
                        <div className={`min-w-0 flex-1 rounded-[1.5rem] border p-4 transition-all ${toneClass}`}>
                            <div className="flex items-center gap-3">
                                <span className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl px-2 text-sm font-black ${bubbleClass}`}>
                                    {step.done && !step.active && !step.danger ? <CheckCircle2 className="w-4 h-4" /> : step.number || index + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="font-black leading-snug">{step.label}</p>
                                    <p className="mt-1 text-xs font-semibold leading-relaxed opacity-80">{step.description}</p>
                                </div>
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="flex items-center justify-center text-gray-300 md:px-2" aria-hidden="true">
                                <svg
                                    className="h-10 w-14 rotate-90 md:h-12 md:w-16 md:rotate-0"
                                    viewBox="0 0 64 48"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M18 8L44 24L18 40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const AdditionalInformationView = ({ registration, value, onChange, error }) => (
    <div className="p-5 rounded-[2rem] bg-blue-50 border border-blue-100 space-y-4">
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-black text-blue-900">Admin yêu cầu bổ sung thông tin</h3>
                <p className="text-blue-700 font-semibold mt-1">{registration?.adminMessage || 'Vui lòng bổ sung thông tin theo yêu cầu để tiếp tục xét duyệt.'}</p>
            </div>
        </div>
        {registration?.additionalInformation && (
            <div className="rounded-2xl border border-blue-100 bg-white/80 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Thông tin bổ sung đã gửi trước đó</p>
                <p className="mt-2 text-sm font-semibold text-blue-900 whitespace-pre-line">{registration.additionalInformation}</p>
            </div>
        )}
        <div>
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-1">Nội dung bổ sung gửi admin<RequiredMark /></span>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="mt-2 w-full px-5 py-4 bg-white border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 transition-all outline-none font-bold resize-none"
                placeholder="Nhập thông tin bổ sung..."
            />
            {error && <p className="mt-2 text-xs text-red-500 font-bold">{error}</p>}
        </div>
    </div>
);

const AwaitingApprovalView = ({ registration, onRefresh }) => (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-white text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-[2rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10" />
        </div>
        <div>
            <h2 className="text-3xl font-black mb-2">Đang xét duyệt</h2>
            <p className="text-gray-500 font-medium max-w-md mx-auto">Hồ sơ của bạn đang được xét duyệt.</p>
        </div>
        {registration?.additionalInformation && (
            <div className="max-w-xl mx-auto rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Thông tin bổ sung đã gửi</p>
                <p className="mt-2 text-sm font-semibold text-blue-900 whitespace-pre-line">{registration.additionalInformation}</p>
            </div>
        )}
        <button onClick={onRefresh} className="px-5 py-3 rounded-2xl bg-orange-50 text-orange-600 font-black hover:bg-orange-500 hover:text-white transition-all inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Cập nhật trạng thái
        </button>
    </div>
);

const RegistrationResultView = ({ type, registration, onRefresh }) => {
    const approved = type === 'approved';
    return (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-white text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className={`w-20 h-20 rounded-[2rem] ${approved ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} flex items-center justify-center mx-auto`}>
                {approved ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>
            <div>
                <h2 className="text-3xl font-black mb-2">{approved ? 'Đã duyệt' : 'Hồ sơ bị từ chối'}</h2>
                <p className="text-gray-500 font-medium max-w-md mx-auto">
                    {approved
                        ? 'Hồ sơ của bạn đã được duyệt. Bạn có thể vào Partner Dashboard để vận hành nhà cung cấp.'
                        : registration?.rejectionReason || registration?.adminMessage || 'Hồ sơ của bạn đã bị từ chối.'}
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={onRefresh} className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-600 font-black hover:bg-gray-900 hover:text-white transition-all inline-flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
                {approved && (
                    <button onClick={() => { window.location.href = '/partner/dashboard'; }} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black hover:bg-orange-600 transition-all inline-flex items-center justify-center gap-2">
                        <Store className="w-4 h-4" />
                        Go to Partner Dashboard
                    </button>
                )}
            </div>
        </div>
    );
};

const RegistrationLoadingState = () => (
    <div className="bg-white p-12 rounded-[2.5rem] border border-white flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
);

const RegistrationErrorState = ({ message, onRetry }) => (
    <div className="bg-white p-10 rounded-[2.5rem] border border-red-100 text-center space-y-5">
        <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
        </div>
        <p className="text-red-600 font-bold">{message}</p>
        <button onClick={onRetry} className="px-5 py-3 rounded-2xl bg-red-50 text-red-600 font-black hover:bg-red-500 hover:text-white transition-all">Thử lại</button>
    </div>
);

const InlineAlert = ({ type = 'info', title, message, onRetry }) => {
    const error = type === 'error';
    return (
        <div className={`rounded-[2rem] border px-5 py-4 flex items-start justify-between gap-4 ${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                    {title && <p className="font-black">{title}</p>}
                    <p className="font-bold">{message}</p>
                </div>
            </div>
            {onRetry && (
                <button onClick={onRetry} className="px-3 py-2 rounded-xl bg-white text-xs font-black uppercase tracking-widest border border-current/10 shrink-0">Thử lại</button>
            )}
        </div>
    );
};

const CenterNotice = ({ notice, onClose }) => {
    const type = notice?.type || 'info';
    const tone = {
        success: {
            icon: <CheckCircle2 className="w-7 h-7" />,
            iconClass: 'bg-green-50 text-green-600',
            badgeClass: 'bg-green-50 text-green-700 border-green-100',
            buttonClass: 'bg-green-600 hover:bg-green-700 shadow-green-100',
            label: 'Thành công',
        },
        warning: {
            icon: <AlertTriangle className="w-7 h-7" />,
            iconClass: 'bg-orange-50 text-orange-500',
            badgeClass: 'bg-orange-50 text-orange-700 border-orange-100',
            buttonClass: 'bg-orange-500 hover:bg-orange-600 shadow-orange-100',
            label: 'Cần kiểm tra',
        },
        error: {
            icon: <XCircle className="w-7 h-7" />,
            iconClass: 'bg-red-50 text-red-600',
            badgeClass: 'bg-red-50 text-red-700 border-red-100',
            buttonClass: 'bg-red-600 hover:bg-red-700 shadow-red-100',
            label: 'Có lỗi',
        },
        info: {
            icon: <AlertTriangle className="w-7 h-7" />,
            iconClass: 'bg-blue-50 text-blue-600',
            badgeClass: 'bg-blue-50 text-blue-700 border-blue-100',
            buttonClass: 'bg-gray-900 hover:bg-orange-500 shadow-gray-200',
            label: 'Thông báo',
        },
    }[type];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/35 px-4 backdrop-blur-sm" onClick={onClose}>
            <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden rounded-[2.5rem] border border-white bg-white p-6 text-left shadow-2xl shadow-gray-900/20" onClick={(event) => event.stopPropagation()}>
                <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[3rem] bg-orange-50/70" />
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Đóng thông báo"
                >
                    <XCircle className="w-5 h-5" />
                </button>

                <div className="relative space-y-5">
                    <div className="flex items-start gap-4 pr-8">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone.iconClass}`}>
                            {tone.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${tone.badgeClass}`}>
                                {tone.label}
                            </span>
                            <h3 className="mt-3 text-xl font-black leading-tight text-gray-900">{notice?.title || 'Thông báo'}</h3>
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-500">{notice?.message}</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className={`w-full rounded-2xl px-5 py-3 font-black text-white shadow-xl transition-all active:scale-[0.98] ${tone.buttonClass}`}
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};

const RequiredMark = () => <span className="ml-0.5 text-red-500">*</span>;

const SectionTitle = ({ icon, title, required = false }) => (
    <div className="flex items-center gap-2">
        <span className="text-orange-500">{React.cloneElement(icon, { size: 18 })}</span>
        <h3 className="font-black text-gray-900">{title}{required && <RequiredMark />}</h3>
    </div>
);

const FormInput = ({ label, value, onChange, error, type = 'text', icon, required = false }) => (
    <div className="space-y-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            {icon && <span className="text-orange-500">{React.cloneElement(icon, { size: 12 })}</span>}
            {label}
            {required && <RequiredMark />}
        </span>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none font-bold ${error ? 'border-red-200' : 'border-transparent'}`}
        />
        {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
    </div>
);

export default PartnerRegistrationPanel;