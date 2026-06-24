import React, { useEffect, useMemo, useState } from 'react';
import { Camera, ImagePlus, Link as LinkIcon, Loader2, Save, UploadCloud, X } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerErrorState, PartnerLoadingState, PartnerStatusBadge, getPartnerErrorMessage, usePartnerToast } from '../../components/partner/PartnerStates';
import { getPartnerProfile, updatePartnerProfile, uploadPartnerProfileImage } from '../../api/partner';

const defaultAvatar = 'https://placehold.co/400x400/FFF5F0/FF8A5B?text=PetGo';
const defaultCover = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1600';
const maxGalleryImages = 10;

const editableFields = [
    ['businessName', 'Tên nhà cung cấp / tên shop'],
    ['description', 'Mô tả nhà cung cấp', 'textarea'],
    ['emergencyPhone', 'Số điện thoại vận hành'],
    ['fullAddress', 'Địa chỉ đầy đủ (số nhà, đường, phường/xã)'],
];

const splitAddress = (value = '') => value.split(',').map((part) => part.trim()).filter(Boolean);

const buildFullAddress = (profile) => {
    if (profile?.address) return profile.address;
    return [profile?.primaryAddressLine1, profile?.ward, profile?.district, profile?.city || profile?.province].filter(Boolean).join(', ');
};

const buildForm = (profile) => ({
    businessName: profile?.businessName || '',
    description: profile?.description || '',
    emergencyPhone: profile?.emergencyPhone || '',
    primaryAddressLine1: profile?.primaryAddressLine1 || '',
    ward: profile?.ward || '',
    district: profile?.district || '',
    city: profile?.city || profile?.province || '',
    fullAddress: buildFullAddress(profile),
    mainImageUrl: profile?.mainImageUrl || '',
    coverImageUrl: profile?.coverImageUrl || '',
    photoUrls: Array.isArray(profile?.photoUrls) ? profile.photoUrls.slice(0, maxGalleryImages) : [],
});

const PartnerProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState(buildForm(null));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageModal, setImageModal] = useState(null);
    const [galleryModal, setGalleryModal] = useState(null);
    const [error, setError] = useState('');
    const { showToast } = usePartnerToast();

    const galleryImages = useMemo(() => (Array.isArray(form.photoUrls) ? form.photoUrls : []).map((url) => String(url || '').trim()).filter(Boolean).slice(0, maxGalleryImages), [form.photoUrls]);
    const currentCover = form.coverImageUrl || defaultCover;
    const currentAvatar = form.mainImageUrl || defaultAvatar;

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getPartnerProfile();
            setProfile(data);
            setForm(buildForm(data));
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể tải hồ sơ nhà cung cấp.');
            setError(message);
            showToast({ tone: 'error', title: 'Không tải được hồ sơ', message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProfile(); }, []);

    const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const openImageModal = (field, label) => setImageModal({ field, label, url: form[field] || '', file: null, preview: form[field] || '', dragActive: false, saving: false });

    const saveImageFromModal = async () => {
        if (!imageModal || imageModal.saving) return;
        const normalizedUrl = String(imageModal.url || '').trim();
        if (!imageModal.file && !normalizedUrl) {
            showToast({ tone: 'warning', title: 'Chưa chọn ảnh', message: 'Vui lòng kéo thả file ảnh hoặc nhập link ảnh.' });
            return;
        }
        try {
            setImageModal((prev) => ({ ...prev, saving: true }));
            const imageUrl = imageModal.file ? await uploadPartnerProfileImage(imageModal.file) : normalizedUrl;
            const nextForm = { ...form, [imageModal.field]: imageUrl };
            const addressParts = splitAddress(nextForm.fullAddress);
            const updated = await updatePartnerProfile({
                description: nextForm.description,
                businessName: nextForm.businessName,
                emergencyPhone: nextForm.emergencyPhone,
                primaryAddressLine1: addressParts[0] || nextForm.fullAddress,
                ward: addressParts[1] || '',
                district: addressParts[2] || '',
                city: addressParts.slice(3).join(', ') || '',
                mainImageUrl: nextForm.mainImageUrl,
                coverImageUrl: nextForm.coverImageUrl,
                photoUrls: galleryImages,
            });
            setProfile(updated);
            setForm(buildForm(updated));
            setImageModal(null);
            showToast({ tone: 'success', title: 'Đã cập nhật ảnh', message: `${imageModal.label} đã được lưu vào hồ sơ.` });
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể lưu ảnh hồ sơ nhà cung cấp.');
            showToast({ tone: 'error', title: 'Lưu ảnh thất bại', message });
            setImageModal((prev) => prev ? ({ ...prev, saving: false }) : prev);
        }
    };

    const openGalleryModal = () => {
        if (galleryImages.length >= maxGalleryImages) {
            showToast({ tone: 'warning', title: 'Thư viện đã đầy', message: `Thư viện ảnh chỉ được tối đa ${maxGalleryImages} ảnh.` });
            return;
        }
        setGalleryModal({ urls: [], files: [], previews: [], dragActive: false, saving: false });
    };

    const saveGalleryFromModal = async () => {
        if (!galleryModal || galleryModal.saving) return;
        const linkUrls = (galleryModal.urls || []).map((url) => String(url || '').trim()).filter(Boolean);
        const files = galleryModal.files || [];
        if (!files.length && !linkUrls.length) {
            showToast({ tone: 'warning', title: 'Chưa chọn ảnh', message: 'Vui lòng kéo thả file ảnh hoặc nhập link ảnh.' });
            return;
        }
        try {
            setGalleryModal((prev) => ({ ...prev, saving: true }));
            const uploadedUrls = files.length ? await Promise.all(files.map(uploadPartnerProfileImage)) : [];
            const nextImages = [...galleryImages, ...uploadedUrls, ...linkUrls].map((url) => String(url || '').trim()).filter(Boolean).slice(0, maxGalleryImages);
            const addressParts = splitAddress(form.fullAddress);
            const updated = await updatePartnerProfile({
                description: form.description,
                businessName: form.businessName,
                emergencyPhone: form.emergencyPhone,
                primaryAddressLine1: addressParts[0] || form.fullAddress,
                ward: addressParts[1] || '',
                district: addressParts[2] || '',
                city: addressParts.slice(3).join(', ') || '',
                mainImageUrl: form.mainImageUrl,
                coverImageUrl: form.coverImageUrl,
                photoUrls: nextImages,
            });
            setProfile(updated);
            setForm(buildForm(updated));
            setGalleryModal(null);
            showToast({ tone: 'success', title: 'Đã cập nhật thư viện', message: 'Ảnh giới thiệu shop đã được lưu vào hồ sơ.' });
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể lưu ảnh thư viện.');
            showToast({ tone: 'error', title: 'Lưu ảnh thất bại', message });
            setGalleryModal((prev) => prev ? ({ ...prev, saving: false }) : prev);
        }
    };

    const addGalleryImage = () => {
        openGalleryModal();
    };

    const removeGalleryImage = (index) => {
        const nextImages = galleryImages.filter((_, currentIndex) => currentIndex !== index);
        updateField('photoUrls', nextImages);
        showToast({ tone: 'success', title: 'Đã xóa ảnh thư viện', message: 'Ảnh đã được xóa khỏi thư viện.' });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const addressParts = splitAddress(form.fullAddress);
        try {
            setSaving(true);
            setError('');
            const updated = await updatePartnerProfile({
                description: form.description,
                businessName: form.businessName,
                emergencyPhone: form.emergencyPhone,
                primaryAddressLine1: addressParts[0] || form.fullAddress,
                ward: addressParts[1] || '',
                district: addressParts[2] || '',
                city: addressParts.slice(3).join(', ') || '',
                mainImageUrl: form.mainImageUrl,
                coverImageUrl: form.coverImageUrl,
                photoUrls: galleryImages,
            });
            setProfile(updated);
            setForm(buildForm(updated));
            showToast({ tone: 'success', title: 'Đã cập nhật hồ sơ', message: 'Thông tin nhà cung cấp đã được lưu.' });
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Cập nhật hồ sơ nhà cung cấp thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Cập nhật hồ sơ thất bại', message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <PartnerLayout title="Hồ sơ nhà cung cấp" subtitle="Xem và cập nhật thông tin nhà cung cấp" providerName={profile?.businessName}>
            {loading ? <PartnerLoadingState /> : error && !profile ? <PartnerErrorState message={error} onRetry={loadProfile} /> : (
                <div className="space-y-6">
                    {error && <PartnerErrorState message={error} onRetry={loadProfile} />}

                    <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="relative h-56 sm:h-72 bg-orange-50 group cursor-pointer" onClick={() => openImageModal('coverImageUrl', 'Ảnh bìa')}>
                            <img src={currentCover} alt="Ảnh bìa nhà cung cấp" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); openImageModal('coverImageUrl', 'Ảnh bìa'); }} className="absolute right-5 top-5 px-4 py-2 rounded-2xl bg-white/90 text-gray-900 font-black text-sm flex items-center gap-2 shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <Camera className="w-4 h-4" /> Đổi ảnh bìa
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); openImageModal('mainImageUrl', 'Ảnh đại diện'); }} className="absolute -bottom-14 left-6 sm:left-8 w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-white shadow-2xl overflow-hidden group/avatar">
                                <img src={currentAvatar} alt={profile?.businessName || 'Provider avatar'} className="w-full h-full object-cover" />
                                <span className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/35 transition-colors flex items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100">
                                    <Camera className="w-7 h-7" />
                                </span>
                            </button>
                        </div>
                        <div className="pt-20 px-6 pb-6 sm:px-8">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h2 className="text-3xl font-black">{form.businessName || profile?.businessName}</h2>
                                <PartnerStatusBadge status={profile?.verificationStatus} />
                            </div>
                            <p className="text-gray-500 font-semibold">{form.fullAddress || 'Chưa cập nhật địa chỉ'}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {(profile?.registeredCategories || []).map((cat) => (
                                    <span key={cat.id} className="px-3 py-1 rounded-xl bg-orange-50 text-orange-600 font-black text-xs">{cat.name}</span>
                                ))}
                            </div>
                        </div>
                    </section>

                    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {editableFields.map(([field, label, type]) => (
                                <label key={field} className={type === 'textarea' ? 'md:col-span-2 space-y-2' : 'space-y-2'}>
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</span>
                                    {type === 'textarea' ? (
                                        <textarea value={form[field] || ''} onChange={(e) => updateField(field, e.target.value)} rows={4} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-orange-200 font-semibold" />
                                    ) : (
                                        <input value={form[field] || ''} onChange={(e) => updateField(field, e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-orange-200 font-semibold" />
                                    )}
                                </label>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Thư viện giới thiệu shop ({galleryImages.length}/{maxGalleryImages})</span>
                                <button type="button" onClick={addGalleryImage} disabled={galleryImages.length >= maxGalleryImages} className="text-xs font-black text-orange-500 disabled:text-gray-300 flex items-center gap-1"><ImagePlus className="w-4 h-4" /> Thêm ảnh</button>
                            </div>
                            {galleryImages.length ? <div className="flex gap-3 overflow-x-auto pb-2 snap-x max-w-full">
                                {galleryImages.map((url, index) => (
                                    <div key={`${url}-${index}`} className="relative w-40 h-28 rounded-2xl overflow-hidden bg-orange-50 border border-gray-100 shrink-0 snap-start group">
                                        <img src={url} alt={`Ảnh giới thiệu shop ${index + 1}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeGalleryImage(index)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/95 text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Xóa ảnh khỏi thư viện">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div> : <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm font-bold text-gray-400 text-center">Chưa có ảnh giới thiệu shop. Bấm “Thêm ảnh” để thêm tối đa {maxGalleryImages} ảnh.</div>}
                        </div>
                        <button disabled={saving} className="px-6 py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 disabled:opacity-60 flex items-center gap-2">
                            <Save className="w-5 h-5" />
                            {saving ? 'Đang lưu...' : 'Lưu hồ sơ nhà cung cấp'}
                        </button>
                    </form>
                    {imageModal && <ImagePickerModal imageModal={imageModal} setImageModal={setImageModal} onClose={() => setImageModal(null)} onConfirm={saveImageFromModal} />}
                    {galleryModal && <GalleryImageModal galleryModal={galleryModal} setGalleryModal={setGalleryModal} currentCount={galleryImages.length} onClose={() => setGalleryModal(null)} onConfirm={saveGalleryFromModal} />}
                </div>
            )}
        </PartnerLayout>
    );
};

const ImagePickerModal = ({ imageModal, setImageModal, onClose, onConfirm }) => {
    const applyFile = (file) => {
        if (!file) return;
        if (!file.type?.startsWith('image/')) return;
        setImageModal((prev) => ({ ...prev, file, preview: URL.createObjectURL(file), url: '' }));
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/50 px-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && !imageModal.saving && onClose()}>
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl border border-orange-100 space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Cập nhật ảnh hồ sơ</p>
                        <h3 className="text-2xl font-black text-gray-900">{imageModal.label}</h3>
                        <p className="text-sm font-semibold text-gray-500 mt-1">Kéo thả file ảnh hoặc nhập link ảnh, sau đó bấm xác nhận để lưu ngay.</p>
                    </div>
                    <button type="button" disabled={imageModal.saving} onClick={onClose} className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50"><X className="w-5 h-5" /></button>
                </div>

                <div
                    onDragOver={(event) => { event.preventDefault(); setImageModal((prev) => ({ ...prev, dragActive: true })); }}
                    onDragLeave={() => setImageModal((prev) => ({ ...prev, dragActive: false }))}
                    onDrop={(event) => { event.preventDefault(); setImageModal((prev) => ({ ...prev, dragActive: false })); applyFile(event.dataTransfer.files?.[0]); }}
                    className={`rounded-[2rem] border-2 border-dashed p-6 text-center transition-all ${imageModal.dragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}
                >
                    {imageModal.preview ? (
                        <img src={imageModal.preview} alt="Preview" className="mx-auto h-56 w-full max-w-xl rounded-3xl object-cover shadow-sm" />
                    ) : (
                        <div className="py-10 text-gray-500">
                            <UploadCloud className="mx-auto mb-3 h-10 w-10 text-orange-500" />
                            <p className="font-black text-gray-800">Kéo thả ảnh vào đây</p>
                            <p className="text-sm font-semibold">Hỗ trợ file ảnh PNG, JPG, WEBP...</p>
                        </div>
                    )}
                    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-orange-500">
                        <UploadCloud className="w-4 h-4" /> Chọn file
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => applyFile(event.target.files?.[0])} />
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400"><LinkIcon className="w-4 h-4" /> Hoặc nhập link ảnh</label>
                    <input value={imageModal.url || ''} onChange={(event) => setImageModal((prev) => ({ ...prev, url: event.target.value, file: null, preview: event.target.value }))} placeholder="https://..." className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-orange-200" />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" disabled={imageModal.saving} onClick={onClose} className="rounded-2xl bg-gray-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 disabled:opacity-50">Hủy</button>
                    <button type="button" disabled={imageModal.saving} onClick={onConfirm} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-orange-600 disabled:opacity-60">
                        {imageModal.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {imageModal.saving ? 'Đang lưu...' : 'Xác nhận lưu ảnh'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const GalleryImageModal = ({ galleryModal, setGalleryModal, currentCount, onClose, onConfirm }) => {
    const remaining = Math.max(maxGalleryImages - currentCount, 0);
    const selectedCount = (galleryModal.files?.length || 0) + (galleryModal.urls || []).filter((url) => String(url || '').trim()).length;
    const canAddMore = selectedCount < remaining;

    const applyFiles = (fileList) => {
        const incoming = Array.from(fileList || []).filter((file) => file.type?.startsWith('image/'));
        if (!incoming.length || !remaining) return;
        setGalleryModal((prev) => {
            const used = (prev.files?.length || 0) + (prev.urls || []).filter((url) => String(url || '').trim()).length;
            const accepted = incoming.slice(0, Math.max(remaining - used, 0));
            return {
                ...prev,
                files: [...(prev.files || []), ...accepted],
                previews: [...(prev.previews || []), ...accepted.map((file) => URL.createObjectURL(file))],
                dragActive: false,
            };
        });
    };

    const removeFile = (index) => setGalleryModal((prev) => ({
        ...prev,
        files: (prev.files || []).filter((_, itemIndex) => itemIndex !== index),
        previews: (prev.previews || []).filter((_, itemIndex) => itemIndex !== index),
    }));

    const addLinkInput = () => {
        if (!canAddMore) return;
        setGalleryModal((prev) => ({ ...prev, urls: [...(prev.urls || []), ''] }));
    };

    const updateLink = (index, value) => setGalleryModal((prev) => ({ ...prev, urls: (prev.urls || []).map((url, itemIndex) => itemIndex === index ? value : url) }));
    const removeLink = (index) => setGalleryModal((prev) => ({ ...prev, urls: (prev.urls || []).filter((_, itemIndex) => itemIndex !== index) }));

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-gray-950/50 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && !galleryModal.saving && onClose()}>
            <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl border border-orange-100 space-y-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Thư viện giới thiệu shop</p>
                        <h3 className="text-2xl font-black text-gray-900">Thêm ảnh giới thiệu</h3>
                        <p className="text-sm font-semibold text-gray-500 mt-1">Kéo thả/chọn nhiều ảnh hoặc thêm link ảnh. Ảnh chỉ lưu khi bấm xác nhận.</p>
                    </div>
                    <button type="button" disabled={galleryModal.saving} onClick={onClose} className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50"><X className="w-5 h-5" /></button>
                </div>

                <div className="rounded-2xl border border-yellow-100 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-700">
                    Còn {remaining} vị trí ảnh. Đã chọn mới {selectedCount}/{remaining} ảnh.
                </div>

                <div
                    onDragEnter={(event) => { event.preventDefault(); if (canAddMore) setGalleryModal((prev) => ({ ...prev, dragActive: true })); }}
                    onDragOver={(event) => { event.preventDefault(); if (canAddMore) setGalleryModal((prev) => ({ ...prev, dragActive: true })); }}
                    onDragLeave={(event) => { event.preventDefault(); setGalleryModal((prev) => ({ ...prev, dragActive: false })); }}
                    onDrop={(event) => { event.preventDefault(); applyFiles(event.dataTransfer.files); }}
                    className={`relative min-h-52 rounded-[2rem] border-2 border-dashed transition-all ${!canAddMore ? 'border-gray-100 bg-gray-50 opacity-70' : galleryModal.dragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50 hover:border-orange-200 hover:bg-orange-50/40'}`}
                >
                    <div className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm"><ImagePlus className="w-7 h-7" /></div>
                        <p className="font-black text-gray-700">{canAddMore ? 'Kéo thả ảnh vào đây' : 'Đã đủ số ảnh có thể thêm'}</p>
                        <p className="mt-1 text-xs font-bold text-gray-400">{canAddMore ? 'hoặc bấm để chọn một/nhiều ảnh từ máy' : 'Xóa bớt ảnh đã chọn nếu muốn đổi ảnh khác'}</p>
                        <label className={`mt-4 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest shadow-sm ${canAddMore ? 'cursor-pointer bg-white text-gray-500 hover:text-orange-600' : 'cursor-not-allowed bg-gray-100 text-gray-300'}`}>
                            Chọn ảnh từ máy
                            <input type="file" accept="image/*" multiple disabled={!canAddMore} className="hidden" onChange={(event) => { applyFiles(event.target.files); event.target.value = ''; }} />
                        </label>
                    </div>
                    {galleryModal.saving && <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] bg-white/80 text-orange-600 backdrop-blur-sm"><Loader2 className="w-8 h-8 animate-spin" /><p className="mt-3 text-xs font-black uppercase tracking-widest">Đang upload và lưu ảnh...</p></div>}
                </div>

                {(galleryModal.previews || []).length > 0 && (
                    <div className="flex gap-3 overflow-x-auto rounded-[1.5rem] border border-gray-100 bg-gray-50 p-3">
                        {galleryModal.previews.map((preview, index) => (
                            <div key={`${preview}-${index}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
                                <img src={preview} alt={`Ảnh đã chọn ${index + 1}`} className="h-full w-full object-cover" />
                                <button type="button" onClick={() => removeFile(index)} disabled={galleryModal.saving} className="absolute right-1.5 top-1.5 rounded-full bg-white/95 p-1 text-red-500 shadow-sm"><X className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400"><LinkIcon className="w-4 h-4" /> Link ảnh</label>
                        <button type="button" disabled={!canAddMore || galleryModal.saving} onClick={addLinkInput} className="text-xs font-black text-orange-500 disabled:text-gray-300">+ Thêm link</button>
                    </div>
                    {(galleryModal.urls || []).length ? (galleryModal.urls || []).map((url, index) => (
                        <div key={index} className="flex gap-2">
                            <input value={url} onChange={(event) => updateLink(index, event.target.value)} placeholder="https://..." className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-orange-200" />
                            <button type="button" onClick={() => removeLink(index)} disabled={galleryModal.saving} className="rounded-2xl bg-red-50 px-3 text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                    )) : <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-400">Chưa có link ảnh. Bấm “+ Thêm link” nếu muốn dùng URL thay vì upload file.</p>}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" disabled={galleryModal.saving} onClick={onClose} className="rounded-2xl bg-gray-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200 disabled:opacity-50">Hủy</button>
                    <button type="button" disabled={galleryModal.saving} onClick={onConfirm} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-orange-600 disabled:opacity-60">
                        {galleryModal.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {galleryModal.saving ? 'Đang lưu...' : 'Xác nhận lưu ảnh'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartnerProfilePage;