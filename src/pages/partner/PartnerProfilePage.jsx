import React, { useEffect, useMemo, useState } from 'react';
import { Camera, ImagePlus, Save, X } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerErrorState, PartnerLoadingState, PartnerStatusBadge, getPartnerErrorMessage, usePartnerToast } from '../../components/partner/PartnerStates';
import { getPartnerProfile, updatePartnerProfile } from '../../api/partner';

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

    const promptImageUrl = (field, label) => {
        const nextUrl = window.prompt(`Nhập URL ${label}`, form[field] || '');
        if (nextUrl !== null) updateField(field, nextUrl.trim());
    };

    const addGalleryImage = () => {
        if (galleryImages.length >= maxGalleryImages) {
            showToast({ tone: 'warning', title: 'Thư viện đã đầy', message: `Thư viện ảnh chỉ được tối đa ${maxGalleryImages} ảnh.` });
            return;
        }
        const nextUrl = window.prompt('Nhập URL ảnh thư viện', '');
        const normalized = nextUrl?.trim();
        if (!normalized) return;
        updateField('photoUrls', [...galleryImages, normalized].slice(0, maxGalleryImages));
        showToast({ tone: 'success', title: 'Đã thêm ảnh thư viện', message: 'Ảnh mới đã được thêm vào thư viện.' });
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
                        <div className="relative h-56 sm:h-72 bg-orange-50 group cursor-pointer" onClick={() => promptImageUrl('coverImageUrl', 'ảnh bìa')}>
                            <img src={currentCover} alt="Ảnh bìa nhà cung cấp" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); promptImageUrl('coverImageUrl', 'ảnh bìa'); }} className="absolute right-5 top-5 px-4 py-2 rounded-2xl bg-white/90 text-gray-900 font-black text-sm flex items-center gap-2 shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <Camera className="w-4 h-4" /> Đổi ảnh bìa
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); promptImageUrl('mainImageUrl', 'ảnh đại diện'); }} className="absolute -bottom-14 left-6 sm:left-8 w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-white shadow-2xl overflow-hidden group/avatar">
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
                </div>
            )}
        </PartnerLayout>
    );
};

export default PartnerProfilePage;