import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  Loader2,
  PawPrint,
  PencilLine,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { createPet, getPetDetail, updatePet } from '../api/pets';
import { resolveUserId } from '../utils/userIdentity';

const SPECIES_OPTIONS = [
  { value: 'DOG', label: 'Chó' },
  { value: 'CAT', label: 'Mèo' },
  { value: 'BIRD', label: 'Chim' },
  { value: 'RABBIT', label: 'Thỏ' },
  { value: 'HAMSTER', label: 'Hamster' },
  { value: 'REPTILE', label: 'Bò sát' },
  { value: 'OTHER', label: 'Khác' },
];

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Đực' },
  { value: 'FEMALE', label: 'Cái' },
  { value: 'UNKNOWN', label: 'Chưa rõ' },
];

const SIZE_OPTIONS = [
  { value: 'XS', label: 'XS - Rất nhỏ' },
  { value: 'S', label: 'S - Nhỏ' },
  { value: 'M', label: 'M - Trung bình' },
  { value: 'L', label: 'L - Lớn' },
  { value: 'XL', label: 'XL - Rất lớn' },
  { value: 'UNKNOWN', label: 'Chưa rõ' },
];

const emptyForm = {
  name: '',
  species: 'DOG',
  breed: '',
  gender: 'UNKNOWN',
  dateOfBirth: '',
  ageLabel: '',
  weightKg: '',
  color: '',
  size: 'UNKNOWN',
  avatarUrl: '',
  healthNotes: '',
  allergyNotes: '',
  behaviorNotes: '',
  vaccinationNotes: '',
  photoUrlsText: '',
};

const normalizePetToForm = (pet) => ({
  name: pet?.name || '',
  species: pet?.species || 'DOG',
  breed: pet?.breed || '',
  gender: pet?.gender || 'UNKNOWN',
  dateOfBirth: pet?.dateOfBirth || '',
  ageLabel: pet?.ageLabel || '',
  weightKg: pet?.weightKg ?? '',
  color: pet?.color || '',
  size: pet?.size || 'UNKNOWN',
  avatarUrl: pet?.avatarUrl || '',
  healthNotes: pet?.healthNotes || '',
  allergyNotes: pet?.allergyNotes || '',
  behaviorNotes: pet?.behaviorNotes || '',
  vaccinationNotes: pet?.vaccinationNotes || '',
  photoUrlsText: (pet?.photos || []).map((photo) => photo.photoUrl).join('\n'),
});

const buildPayload = (form) => ({
  name: form.name.trim(),
  species: form.species,
  breed: form.breed.trim() || null,
  gender: form.gender || null,
  dateOfBirth: form.dateOfBirth || null,
  ageLabel: form.ageLabel.trim() || null,
  weightKg: form.weightKg === '' ? null : Number(form.weightKg),
  color: form.color.trim() || null,
  size: form.size || 'UNKNOWN',
  avatarUrl: form.avatarUrl?.trim() || null,
  healthNotes: form.healthNotes.trim() || null,
  allergyNotes: form.allergyNotes.trim() || null,
  behaviorNotes: form.behaviorNotes.trim() || null,
  vaccinationNotes: form.vaccinationNotes.trim() || null,
  photoUrls: form.photoUrlsText
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean),
});

const buildMultipartPayload = (payload, avatarFile) => {
  const formData = new FormData();

  formData.append(
    'data',
    new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    })
  );

  if (avatarFile) {
    formData.append('avatarFile', avatarFile);
  }

  return formData;
};

const AddPetPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const petId = searchParams.get('petId');
  const isEditMode = Boolean(petId);

  const { account, loadingAccount } = useContext(AuthContext);
  const userId = useMemo(() => resolveUserId(account), [account]);

  const [formData, setFormData] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [localAvatarPreview, setLocalAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPet, setLoadingPet] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditMode || !userId) return;

    let isMounted = true;

    const fetchPet = async () => {
      try {
        setLoadingPet(true);
        setError('');

        const data = await getPetDetail(userId, petId);

        if (!isMounted) return;

        setFormData(normalizePetToForm(data));
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Không tải được thông tin thú cưng.');
      } finally {
        if (isMounted) setLoadingPet(false);
      }
    };

    fetchPet();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, userId, petId]);

  useEffect(() => {
    return () => {
      if (localAvatarPreview) {
        URL.revokeObjectURL(localAvatarPreview);
      }
    };
  }, [localAvatarPreview]);

  const previewPhotos = formData.photoUrlsText
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean);

  const avatarPreview = localAvatarPreview || formData.avatarUrl?.trim() || previewPhotos[0] || '';

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh không được vượt quá 5MB.');
      return;
    }

    if (localAvatarPreview) {
      URL.revokeObjectURL(localAvatarPreview);
    }

    setError('');
    setAvatarFile(file);
    setLocalAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setError('Không tìm thấy userId. Hãy đăng nhập trước khi lưu thú cưng.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên thú cưng.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = buildPayload(formData);
      const multipartPayload = buildMultipartPayload(payload, avatarFile);

      if (isEditMode) {
        await updatePet(userId, petId, multipartPayload);
      } else {
        await createPet(userId, multipartPayload);
      }

      setSuccess(true);
      setTimeout(() => navigate('/profile?tab=pets'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu thú cưng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const showLoginRequired = !loadingAccount && !userId;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/profile?tab=pets')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-orange-500" />
          </button>

          <span className="font-black text-xl tracking-tight">
            {isEditMode ? 'Cập nhật thú cưng' : 'Thêm thú cưng mới'}
          </span>

          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-white">
          <div className="p-8 sm:p-12">
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
                </div>

                <h2 className="text-3xl font-black mb-2">Hoàn tất!</h2>

                <p className="text-gray-500 font-bold">
                  {isEditMode
                    ? 'Thông tin thú cưng đã được cập nhật.'
                    : 'Thú cưng của bạn đã được thêm thành công.'}
                </p>

                <p className="text-gray-400 text-sm mt-1">Đang chuyển hướng về trang cá nhân...</p>
              </div>
            ) : loadingPet ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                <p className="font-black text-gray-900">Đang tải dữ liệu thú cưng...</p>
              </div>
            ) : showLoginRequired ? (
              <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 text-center space-y-4">
                <h2 className="text-2xl font-black text-amber-900">Bạn cần đăng nhập trước</h2>

                <p className="text-amber-700 font-medium max-w-xl mx-auto">
                  Trang này cần `userId` từ tài khoản đã đăng nhập để gọi API Pet CRUD.
                </p>

                <p className="text-xs text-amber-600 font-bold">
                  Nếu bạn đang test backend độc lập, có thể lưu thủ công `petgo_user_id` vào localStorage.
                </p>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black hover:bg-orange-500 transition-all"
                  >
                    Đăng nhập
                  </button>

                  <button
                    onClick={() => navigate('/profile')}
                    className="px-6 py-3 bg-white text-gray-700 rounded-2xl font-black border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    Quay lại profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col items-center">
                  <label className="relative group cursor-pointer">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-[2.5rem] bg-orange-50 border-4 border-dashed border-orange-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:bg-orange-100 group-hover:border-orange-300">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Pet preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-10 h-10 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest text-center px-3">
                            Chọn ảnh từ máy
                          </span>
                        </>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />

                    <div className="absolute -bottom-2 -right-2 bg-orange-500 p-2.5 rounded-2xl shadow-lg border-4 border-white transition-transform group-hover:scale-110">
                      {isEditMode ? (
                        <PencilLine className="w-5 h-5 text-white" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </label>

                  <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest italic text-center">
                    Nhấn vào khung ảnh để chọn ảnh từ máy.
                  </p>

                  {avatarFile && (
                    <p className="text-xs font-bold text-orange-500 mt-2">
                      Đã chọn: {avatarFile.name}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-[1.75rem] text-sm font-bold flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormInput
                    label="Tên thú cưng"
                    value={formData.name}
                    onChange={handleChange('name')}
                    placeholder="VD: Mochi, Lu, ..."
                    required
                  />

                  <FormSelect
                    label="Loại thú cưng"
                    value={formData.species}
                    onChange={handleChange('species')}
                    options={SPECIES_OPTIONS}
                  />

                  <FormInput
                    label="Giống loài"
                    value={formData.breed}
                    onChange={handleChange('breed')}
                    placeholder="VD: Golden Retriever"
                  />

                  <FormInput
                    label="Tuổi hiển thị"
                    value={formData.ageLabel}
                    onChange={handleChange('ageLabel')}
                    placeholder="VD: 2 tuổi"
                  />

                  <FormInput
                    label="Ngày sinh"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange('dateOfBirth')}
                  />

                  <FormInput
                    label="Cân nặng (kg)"
                    type="number"
                    step="0.1"
                    value={formData.weightKg}
                    onChange={handleChange('weightKg')}
                    placeholder="VD: 15.5"
                  />

                  <FormSelect
                    label="Giới tính"
                    value={formData.gender}
                    onChange={handleChange('gender')}
                    options={GENDER_OPTIONS}
                  />

                  <FormSelect
                    label="Kích thước"
                    value={formData.size}
                    onChange={handleChange('size')}
                    options={SIZE_OPTIONS}
                  />

                  <FormInput
                    label="Màu sắc"
                    value={formData.color}
                    onChange={handleChange('color')}
                    placeholder="VD: Vàng kem"
                  />
                </div>

              

                <div className="grid grid-cols-1 gap-6">
                  <TextAreaField
                    label="Ghi chú sức khỏe"
                    value={formData.healthNotes}
                    onChange={handleChange('healthNotes')}
                    placeholder="Tình trạng sức khỏe, bệnh nền, lưu ý khi chăm sóc..."
                  />

                  <TextAreaField
                    label="Dị ứng"
                    value={formData.allergyNotes}
                    onChange={handleChange('allergyNotes')}
                    placeholder="Các loại thức ăn, thuốc hoặc môi trường cần tránh..."
                  />

                  <TextAreaField
                    label="Hành vi"
                    value={formData.behaviorNotes}
                    onChange={handleChange('behaviorNotes')}
                    placeholder="Thân thiện, nhút nhát, tăng động, thích đi dạo..."
                  />

                  <TextAreaField
                    label="Tiêm phòng"
                    value={formData.vaccinationNotes}
                    onChange={handleChange('vaccinationNotes')}
                    placeholder="Đã tiêm những mũi nào, thời điểm tiêm gần nhất..."
                  />
                </div>

                <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-50 flex gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />

                  <div className="space-y-1">
                    <p className="text-sm font-black text-blue-900">Gợi ý nhập liệu</p>

                    <p className="text-xs font-bold text-blue-600/80 leading-relaxed italic">
                      Bạn có thể nhập ageLabel để hiển thị đẹp trên UI, còn dateOfBirth giúp backend có dữ liệu chuẩn hơn cho các chức năng sau.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/profile?tab=pets')}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-sm hover:bg-gray-200 hover:text-gray-600 transition-all active:scale-95"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-200 hover:bg-orange-500 hover:shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isEditMode ? 'Đang cập nhật...' : 'Đang lưu...'}
                      </>
                    ) : (
                      <>
                        <PawPrint className="w-5 h-5" />
                        {isEditMode ? 'Lưu thay đổi' : 'Xác nhận thêm'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const FormInput = ({ label, placeholder, type = 'text', value, onChange, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
      {label}
    </label>

    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300"
      {...props}
    />
  </div>
);

const FormSelect = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
      {label}
    </label>

    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none font-bold text-gray-900 appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
    </div>
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
      {label}
    </label>

    <textarea
      rows={4}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 resize-none"
    />
  </div>
);

export default AddPetPage;