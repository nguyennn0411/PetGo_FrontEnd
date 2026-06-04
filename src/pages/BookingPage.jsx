import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  PawPrint,
  ShieldCheck,
  StickyNote,
  User,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getBookingCreateContext, createBooking } from '../api/bookings';
import { resolveUserId } from '../utils/userIdentity';

const STEP_TITLES = [
  'Chọn thú cưng',
  'Chọn dịch vụ',
  'Xác nhận nhà cung cấp',
  'Chọn ngày hẹn',
  'Chọn khung giờ',
];

const formatIsoDate = (value) => {
  if (!value) return 'Chưa chọn';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatCurrency = (value, currency = 'VND') => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { account } = useContext(AuthContext);

  const userId = resolveUserId(account);
  const providerId = Number(searchParams.get('providerId') || '');
  const initialProviderServiceId = searchParams.get('providerServiceId') || searchParams.get('serviceId');
  const initialSlotDate = searchParams.get('slotDate') || '';
  const initialTime = searchParams.get('time') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [contextData, setContextData] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    petId: '',
    providerServiceId: initialProviderServiceId || '',
    appointmentDate: '',
    startTime: '',
    slotId: '',
    customerNote: '',
  });

  const loadContext = async ({ providerServiceId, keepDate = false, keepTime = false } = {}) => {
    if (!userId || !providerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getBookingCreateContext({
        userId,
        providerId,
        providerServiceId: providerServiceId || undefined,
        slotDate: keepDate ? formData.appointmentDate || initialSlotDate || undefined : initialSlotDate || undefined,
        time: keepTime ? formData.startTime || initialTime || undefined : initialTime || undefined,
      });

      setContextData(data);
      setFormData((prev) => ({
        ...prev,
        providerServiceId: String(data.selectedProviderServiceId || providerServiceId || prev.providerServiceId || ''),
        appointmentDate: keepDate
          ? prev.appointmentDate || data.selectedDate || ''
          : data.selectedDate || '',
        startTime: keepTime
          ? prev.startTime || data.selectedTime || ''
          : data.selectedTime || '',
        slotId: data.selectedSlotId ? String(data.selectedSlotId) : '',
      }));
    } catch (err) {
      setError(getErrorMessage(err, 'Không tải được dữ liệu đặt lịch.'));
      setContextData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext({ providerServiceId: initialProviderServiceId, keepDate: false, keepTime: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, providerId]);

  const selectedService = useMemo(
    () => contextData?.services?.find((service) => String(service.id) === String(formData.providerServiceId)) || null,
    [contextData, formData.providerServiceId],
  );

  const selectedPet = useMemo(
    () => contextData?.pets?.find((pet) => String(pet.id) === String(formData.petId)) || null,
    [contextData, formData.petId],
  );

  const availableDates = contextData?.availableDates || [];
  const slotsForDate = useMemo(
    () => (contextData?.slots || []).filter((slot) => slot.date === formData.appointmentDate),
    [contextData, formData.appointmentDate],
  );

  const selectedSlot = useMemo(() => {
    if (!formData.slotId) {
      return slotsForDate.find((slot) => slot.startTime === formData.startTime) || null;
    }
    return (contextData?.slots || []).find((slot) => String(slot.slotId) === String(formData.slotId)) || null;
  }, [contextData, formData.slotId, formData.startTime, slotsForDate]);

  const bookingSummary = useMemo(() => ({
    providerName: contextData?.provider?.name || 'Đang cập nhật',
    providerAddress: contextData?.provider?.address || 'Chưa có địa chỉ',
    serviceName: selectedService?.name || 'Chưa chọn dịch vụ',
    petName: selectedPet?.label || 'Chưa chọn thú cưng',
    appointmentDate: formData.appointmentDate,
    startTime: formData.startTime,
    totalAmount: selectedService?.priceAmount || 0,
    currencyCode: selectedService?.currencyCode || 'VND',
  }), [contextData, selectedService, selectedPet, formData.appointmentDate, formData.startTime]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleServiceChange = async (event) => {
    const value = event.target.value;
    updateField('providerServiceId', value);
    setFormData((prev) => ({
      ...prev,
      providerServiceId: value,
      appointmentDate: '',
      startTime: '',
      slotId: '',
    }));
    await loadContext({ providerServiceId: value, keepDate: false, keepTime: false });
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      appointmentDate: date,
      startTime: '',
      slotId: '',
    }));
    if (errors.appointmentDate || errors.startTime) {
      setErrors((prev) => ({ ...prev, appointmentDate: undefined, startTime: undefined }));
    }
  };

  const handleSlotSelect = (slot) => {
    setFormData((prev) => ({
      ...prev,
      appointmentDate: slot.date,
      startTime: slot.startTime,
      slotId: String(slot.slotId),
    }));
    if (errors.startTime) {
      setErrors((prev) => ({ ...prev, startTime: undefined }));
    }
  };

  const validateStep = () => {
    const nextErrors = {};
    if (step === 1 && !formData.petId) nextErrors.petId = 'Vui lòng chọn thú cưng';
    if (step === 2 && !formData.providerServiceId) nextErrors.providerServiceId = 'Vui lòng chọn dịch vụ';
    if (step === 4 && !formData.appointmentDate) nextErrors.appointmentDate = 'Vui lòng chọn ngày hẹn';
    if (step === 5 && !formData.startTime) nextErrors.startTime = 'Vui lòng chọn khung giờ';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep() || !userId || !providerId) return;

    setSubmitting(true);
    setError('');
    try {
      const booking = await createBooking({
        userId,
        petId: Number(formData.petId),
        providerId,
        providerServiceId: Number(formData.providerServiceId),
        slotId: formData.slotId ? Number(formData.slotId) : undefined,
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
        customerNote: formData.customerNote || undefined,
      });

      navigate(`/booking-success?bookingId=${booking.bookingId}`, {
        replace: true,
        state: { bookingId: booking.bookingId, booking },
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Không tạo được booking. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!providerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[2rem] p-8 border border-red-100 shadow-sm text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Thiếu thông tin nhà cung cấp</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">BookingPage cần `providerId` từ Provider Detail để nạp dịch vụ và slot khả dụng.</p>
          <Link to="/search" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
            Quay lại tìm kiếm <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[2rem] p-8 border border-orange-100 shadow-sm text-center">
          <ShieldCheck className="w-10 h-10 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Bạn chưa đăng nhập</h1>
          <p className="text-sm text-gray-500 font-medium mb-3">Bạn cần đăng nhập để tiếp tục.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
              Đăng nhập
            </Link>
            <Link to={`/providers/${providerId}`} className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest hover:bg-gray-200">
              Quay lại
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <button
            onClick={() => navigate(`/providers/${providerId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại provider
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-xl">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">Pet<span className="text-orange-500">Go</span></span>
          </div>
          <Link to="/my-bookings" className="hidden sm:inline-flex text-xs font-black uppercase tracking-widest text-gray-500 hover:text-orange-600">
            Lịch hẹn của tôi
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">Tạo lịch hẹn mới</h1>
            <p className="text-sm text-gray-500 font-medium">Chúng tôi đã nhận sẵn provider từ trang chi tiết. Bạn chỉ cần chọn pet, dịch vụ, ngày và giờ phù hợp.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bước hiện tại</p>
            <p className="text-sm font-black text-gray-900">{step}/5 · {STEP_TITLES[step - 1]}</p>
          </div>
        </div>

        {error && !loading ? (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700 font-medium flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 sm:p-6 flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
              {STEP_TITLES.map((title, index) => {
                const itemStep = index + 1;
                const completed = itemStep < step;
                const active = itemStep === step;
                return (
                  <div key={title} className="flex items-center gap-3 min-w-max">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${completed ? 'bg-orange-100 text-orange-600' : active ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-gray-100 text-gray-400'}`}>
                      {completed ? <CheckCircle2 className="w-5 h-5" /> : itemStep}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bước {itemStep}</p>
                      <p className={`text-sm font-black ${active ? 'text-gray-900' : 'text-gray-500'}`}>{title}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 sm:p-8 min-h-[420px]">
              {loading ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 mb-2">Đang chuẩn bị dữ liệu booking</h2>
                  <p className="text-sm text-gray-500 font-medium">PetGo đang nạp thú cưng, dịch vụ và các slot còn trống của nhà cung cấp.</p>
                </div>
              ) : (
                <>
                  {step === 1 && (
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-2">1. Chọn thú cưng của bạn</h2>
                      <p className="text-sm text-gray-500 font-medium mb-6">Chọn một pet thuộc tài khoản hiện tại để tạo booking.</p>
                      {contextData?.pets?.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {contextData.pets.map((pet) => {
                            const active = String(formData.petId) === String(pet.id);
                            return (
                              <button
                                key={pet.id}
                                type="button"
                                onClick={() => updateField('petId', String(pet.id))}
                                className={`text-left rounded-[1.75rem] border-2 p-5 transition-all ${active ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100/50' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-orange-200'}`}
                              >
                                <div className="flex items-center gap-4">
                                  <img
                                    src={pet.avatarUrl || 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=300'}
                                    alt={pet.name}
                                    className="w-16 h-16 rounded-2xl object-cover border border-white shadow-sm"
                                  />
                                  <div>
                                    <h3 className="text-lg font-black text-gray-900">{pet.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium">{pet.breed || pet.species}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{pet.ageLabel || 'Chưa rõ tuổi'}</p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6">
                          <p className="text-sm font-medium text-orange-800 mb-4">Tài khoản này chưa có thú cưng nào để đặt lịch.</p>
                          <Link to="/add-pet" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
                            Thêm thú cưng mới <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                      {errors.petId ? <p className="mt-4 text-sm text-red-500 font-medium">{errors.petId}</p> : null}
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-2">2. Chọn dịch vụ chăm sóc</h2>
                      <p className="text-sm text-gray-500 font-medium mb-6">Danh sách dưới đây được lấy trực tiếp từ nhà cung cấp bạn vừa chọn.</p>
                      <div className="relative mb-6">
                        <select
                          value={formData.providerServiceId}
                          onChange={handleServiceChange}
                          className="w-full rounded-[1.75rem] border-2 border-transparent bg-gray-50 px-5 py-4 appearance-none outline-none focus:border-orange-500 focus:bg-white font-black text-gray-900"
                        >
                          <option value="">-- Chọn dịch vụ --</option>
                          {(contextData?.services || []).map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} · {service.priceDisplay}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-5 h-5 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {selectedService ? (
                        <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-5">
                          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                            <h3 className="text-lg font-black text-gray-900">{selectedService.name}</h3>
                            <span className="text-xs font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-3 py-1 rounded-full">{selectedService.durationLabel}</span>
                          </div>
                          <p className="text-sm text-gray-500 font-medium mb-4">{selectedService.description || 'Chưa có mô tả chi tiết.'}</p>
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{selectedService.categoryName || 'Dịch vụ chăm sóc'}</p>
                            <p className="text-2xl font-black text-gray-900">{selectedService.priceDisplay}</p>
                          </div>
                        </div>
                      ) : null}
                      {errors.providerServiceId ? <p className="mt-4 text-sm text-red-500 font-medium">{errors.providerServiceId}</p> : null}
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-2">3. Xác nhận nhà cung cấp</h2>
                      <p className="text-sm text-gray-500 font-medium mb-6">Booking này đang nối trực tiếp từ trang chi tiết provider mà bạn vừa xem.</p>
                      <div className="rounded-[2rem] border border-gray-100 bg-gray-50 overflow-hidden">
                        <img
                          src={contextData?.provider?.image || 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1200'}
                          alt={contextData?.provider?.name || 'Provider'}
                          className="w-full h-56 object-cover"
                        />
                        <div className="p-6">
                          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                            <h3 className="text-2xl font-black text-gray-900">{contextData?.provider?.name}</h3>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-gray-100 text-xs font-black text-gray-700">
                              <ShieldCheck className="w-4 h-4 text-orange-500" /> {contextData?.provider?.rating || '0.0'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 font-medium mb-3">{contextData?.provider?.headline || 'Nhà cung cấp dịch vụ chăm sóc thú cưng trên PetGo.'}</p>
                          <div className="flex items-start gap-2 text-sm text-gray-500 font-medium">
                            <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <span>{contextData?.provider?.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-2">4. Chọn ngày hẹn</h2>
                      <p className="text-sm text-gray-500 font-medium mb-6">Những ngày dưới đây có ít nhất một slot còn trống cho dịch vụ bạn đã chọn.</p>
                      {availableDates.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {availableDates.map((date) => {
                            const active = formData.appointmentDate === date;
                            return (
                              <button
                                key={date}
                                type="button"
                                onClick={() => handleDateChange(date)}
                                className={`rounded-[1.75rem] border-2 p-5 text-left transition-all ${active ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100/50' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-orange-200'}`}
                              >
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ngày có slot</p>
                                <p className="text-lg font-black text-gray-900">{formatIsoDate(date)}</p>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 text-sm text-orange-800 font-medium">
                          Dịch vụ này hiện chưa có slot khả dụng trong vài ngày tới. Bạn hãy đổi sang dịch vụ khác hoặc quay lại trang provider để chọn slot mới.
                        </div>
                      )}
                      {errors.appointmentDate ? <p className="mt-4 text-sm text-red-500 font-medium">{errors.appointmentDate}</p> : null}
                    </div>
                  )}

                  {step === 5 && (
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-2">5. Chọn khung giờ trống</h2>
                      <p className="text-sm text-gray-500 font-medium mb-6">Chọn một slot còn chỗ. Khi tạo booking, backend sẽ kiểm tra lại khả dụng trước khi lưu.</p>
                      {slotsForDate.length ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                          {slotsForDate.map((slot) => {
                            const active = String(formData.slotId) === String(slot.slotId) || (!formData.slotId && formData.startTime === slot.startTime);
                            return (
                              <button
                                key={slot.slotId}
                                type="button"
                                onClick={() => handleSlotSelect(slot)}
                                className={`rounded-[1.5rem] border-2 px-4 py-4 transition-all ${active ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-lg shadow-orange-100/50' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-orange-200 text-gray-800'}`}
                              >
                                <p className="text-lg font-black">{slot.startTime}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">Còn {slot.capacityRemaining} chỗ</p>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 text-sm text-orange-800 font-medium mb-6">
                          Chưa có slot nào cho ngày này. Hãy quay lại bước trước để chọn ngày khác.
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Ghi chú cho provider</label>
                        <textarea
                          value={formData.customerNote}
                          onChange={(event) => updateField('customerNote', event.target.value)}
                          rows={4}
                          placeholder="Ví dụ: Bé hơi nhát, dị ứng mùi quá mạnh, cần báo trước khi xong..."
                          className="w-full rounded-[1.75rem] border border-gray-200 bg-white px-5 py-4 outline-none focus:border-orange-500 text-sm font-medium text-gray-700 resize-none"
                        />
                      </div>
                      {errors.startTime ? <p className="mt-4 text-sm text-red-500 font-medium">{errors.startTime}</p> : null}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={prevStep}
                disabled={step === 1 || loading || submitting}
                className="px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Quay lại
              </button>
              {step < 5 ? (
                <button
                  onClick={nextStep}
                  disabled={loading || submitting}
                  className="px-8 py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-500 shadow-lg shadow-gray-200"
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || submitting || !slotsForDate.length}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu đặt lịch'}
                </button>
              )}
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28">
            <div className="bg-gray-900 text-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">Tóm tắt booking</h2>
                <Calendar className="w-5 h-5 text-orange-400" />
              </div>
              <div className="space-y-5 text-sm font-medium">
                <SummaryItem icon={<ShieldCheck className="w-4 h-4 text-orange-400" />} label="Nhà cung cấp" value={bookingSummary.providerName} />
                <SummaryItem icon={<PawPrint className="w-4 h-4 text-orange-400" />} label="Dịch vụ" value={bookingSummary.serviceName} />
                <SummaryItem icon={<User className="w-4 h-4 text-orange-400" />} label="Thú cưng" value={bookingSummary.petName} />
                <SummaryItem icon={<MapPin className="w-4 h-4 text-orange-400" />} label="Địa chỉ" value={bookingSummary.providerAddress} />
                <SummaryItem icon={<Calendar className="w-4 h-4 text-orange-400" />} label="Ngày hẹn" value={formatIsoDate(bookingSummary.appointmentDate)} />
                <SummaryItem icon={<Clock className="w-4 h-4 text-orange-400" />} label="Giờ hẹn" value={bookingSummary.startTime || 'Chưa chọn'} />
                <SummaryItem icon={<StickyNote className="w-4 h-4 text-orange-400" />} label="Ghi chú" value={formData.customerNote || 'Không có'} />
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tổng tạm tính</p>
                  <p className="text-2xl font-black">{formatCurrency(bookingSummary.totalAmount, bookingSummary.currencyCode)}</p>
                </div>
                {selectedService ? (
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest">
                    {selectedService.durationLabel}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Lưu ý</h3>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> Backend sẽ kiểm tra lại dịch vụ, thú cưng và khung giờ trước khi tạo yêu cầu.</li>
                <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> Yêu cầu mới sẽ ở trạng thái <strong className="text-gray-800">PENDING_CONFIRMATION</strong> để provider duyệt/xếp lịch.</li>
                <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" /> Bạn chỉ thanh toán trước nếu provider hoặc dịch vụ yêu cầu; nếu không, thanh toán sau khi provider nhận lịch.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

const SummaryItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-black text-white leading-snug">{value}</p>
    </div>
  </div>
);

export default BookingPage;
