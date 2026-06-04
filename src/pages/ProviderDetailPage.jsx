import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  Info,
  Loader2,
  MapPin,
  Maximize2,
  MessageSquare,
  Navigation,
  PawPrint,
  Phone,
  RefreshCcw,
  Share2,
  Star,
  User,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProviderDetail } from '../api/providers';
import { addFavoriteProvider, getFavoriteProviderIds, removeFavoriteProvider } from '../api/favorites';
import { AuthContext } from '../context/AuthContext';
import { resolveUserId } from '../utils/userIdentity';
import { formatCurrencyVnd, providerFallbackImage } from '../utils/providerHelpers';

const getCurrentPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

const buildBookingQuery = ({ providerId, serviceId, slot }) => {
  const searchParams = new URLSearchParams();
  if (providerId) searchParams.set('providerId', providerId);
  if (serviceId) searchParams.set('serviceId', serviceId);
  if (slot?.label) searchParams.set('time', slot.label);
  if (slot?.providerServiceId) searchParams.set('providerServiceId', slot.providerServiceId);
  if (slot?.date) searchParams.set('slotDate', slot.date);
  return `/booking?${searchParams.toString()}`;
};

const renderStars = (rating) => {
  const normalized = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }).map((_, index) => {
    const filled = normalized >= index + 1;
    return <Star key={index} className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />;
  });
};

const ProviderDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { account } = useContext(AuthContext);
  const userId = useMemo(() => resolveUserId(account), [account]);

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState({ latitude: '', longitude: '', enabled: false });
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const fetchProviderDetail = async (coords) => {
    setLoading(true);
    setError('');

    try {
      const data = await getProviderDetail(id, {
        latitude: coords?.latitude || undefined,
        longitude: coords?.longitude || undefined,
      });
      setProvider(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được chi tiết nhà cung cấp.');
      setProvider(null);
    } finally {
      setLoading(false);
    }
  };

  const bootstrapDetail = async () => {
    const coords = await getCurrentPosition();
    if (coords) {
      setLocation({ ...coords, enabled: true });
    } else {
      setLocation({ latitude: '', longitude: '', enabled: false });
    }
    fetchProviderDetail(coords);
  };

  useEffect(() => {
    bootstrapDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let ignore = false;

    const loadFavoriteState = async () => {
      if (!userId || !id) {
        if (!ignore) setIsFavorite(false);
        return;
      }

      try {
        const ids = await getFavoriteProviderIds(userId);
        if (!ignore) setIsFavorite((ids || []).includes(Number(id)));
      } catch {
        if (!ignore) setIsFavorite(false);
      }
    };

    loadFavoriteState();
    return () => {
      ignore = true;
    };
  }, [userId, id]);

  const galleryImages = useMemo(() => {
    if (!provider) return [];
    const images = [provider.bannerImage, provider.mainImage, ...(provider.gallery || [])].filter(Boolean);
    return Array.from(new Set(images));
  }, [provider]);

  const handleToggleFavorite = async () => {
    if (!userId) {
      window.alert('Vui lòng đăng nhập hoặc đặt userId để lưu yêu thích.');
      return;
    }

    try {
      setFavoriteLoading(true);
      if (isFavorite) {
        await removeFavoriteProvider(userId, Number(id));
        setIsFavorite(false);
      } else {
        await addFavoriteProvider(userId, Number(id));
        setIsFavorite(true);
      }
    } catch (err) {
      window.alert(err?.response?.data?.message || 'Không thể cập nhật danh sách yêu thích.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: provider?.name || 'PetGo Provider',
      text: provider?.headline || provider?.description || 'Xem nhà cung cấp thú cưng này trên PetGo',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        window.alert('Đã sao chép liên kết chi tiết nhà cung cấp.');
        return;
      }

      window.prompt('Sao chép liên kết này:', window.location.href);
    } catch {
      // ignore user cancel share
    }
  };

  const openBookingForService = (serviceId) => {
    navigate(buildBookingQuery({ providerId: provider?.id, serviceId }));
  };

  const handleSlotClick = (slot) => {
    setSelectedSlotId(slot.id);
    navigate(buildBookingQuery({ providerId: provider?.id, serviceId: slot.providerServiceId, slot }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Đang tải chi tiết nhà cung cấp</h2>
          <p className="text-sm text-gray-500 font-medium">PetGo đang lấy gallery, dịch vụ, giờ làm việc và slot trống mới nhất.</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white rounded-[2rem] border border-red-100 shadow-sm p-8 text-center">
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Không mở được trang chi tiết</h2>
          <p className="text-sm text-gray-500 font-medium mb-6">{error || 'Nhà cung cấp không tồn tại hoặc chưa có dữ liệu.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={bootstrapDetail}
              className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all"
            >
              Thử lại
            </button>
            <button
              onClick={() => navigate('/search')}
              className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Quay lại tìm kiếm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 pb-20">


      <section className="relative h-[45vh] w-full overflow-hidden bg-gray-900">
        <img
          src={provider.bannerImage || provider.mainImage || providerFallbackImage}
          alt={provider.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div className="absolute bottom-10 left-0 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-end gap-6">
            <div className="text-white flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {provider.featured && (
                  <span className="px-3 py-1 bg-orange-500 text-[10px] font-black uppercase rounded-full tracking-widest">
                    Premium Provider
                  </span>
                )}
                {provider.verificationStatus && (
                  <span className="px-3 py-1 bg-white/15 border border-white/20 text-[10px] font-black uppercase rounded-full tracking-widest backdrop-blur-md">
                    {provider.verificationStatus}
                  </span>
                )}
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                  <span className="text-xs font-black">{provider.rating || '0.0'}</span>
                </div>
                {provider.summary?.distance && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    <Navigation className="w-3.5 h-3.5 text-blue-300" />
                    <span className="text-xs font-black">{provider.summary.distance}</span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-2">{provider.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-white/85">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  {provider.address || 'Đang cập nhật địa chỉ'}
                </div>
                {provider.headline && <span>• {provider.headline}</span>}
                {provider.yearsExperience ? <span>• {provider.yearsExperience}+ năm kinh nghiệm</span> : null}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleShare}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-gray-900 transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`w-14 h-14 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${isFavorite
                  ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-red-500'
                  }`}
              >
                {favoriteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          <div className="space-y-8">
            <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                <div className="relative shrink-0 group mx-auto lg:mx-0">
                  <img
                    src={provider.mainImage || provider.bannerImage || providerFallbackImage}
                    alt={provider.name}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] object-cover shadow-2xl shadow-orange-100/60 border-4 border-white"
                  />
                  <button
                    onClick={() => setPreviewImage(provider.mainImage || provider.bannerImage || providerFallbackImage)}
                    className="absolute inset-0 rounded-[2rem] bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <Maximize2 className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="flex-1 w-full min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {renderStars(provider.rating)}
                    <span className="text-sm font-bold text-gray-600">
                      {provider.rating || '0.0'} • {provider.reviewsCount || 0} đánh giá
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <SummaryTile label="Dịch vụ" value={provider.summary?.totalServices || provider.services?.length || 0} />
                    <SummaryTile label="Đã hoàn tất" value={provider.summary?.totalCompletedBookings || 0} />
                    <SummaryTile label="Hủy miễn phí" value={`${provider.summary?.cancellationFreeHours || 0}h`} />
                    <SummaryTile label="Tình trạng" value={provider.summary?.openNow ? 'Đang mở' : 'Ngoài giờ'} accent={provider.summary?.openNow ? 'green' : 'gray'} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <PrimaryAction onClick={() => navigate(buildBookingQuery({ providerId: provider.id }))}>
                      Đặt lịch ngay
                    </PrimaryAction>
                    <SecondaryAction onClick={() => navigate('/search')}>Xem nhà cung cấp khác</SecondaryAction>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-1">Ảnh giới thiệu</h2>
                  <p className="text-sm font-medium text-gray-500">{provider.summary?.totalGalleryImages || galleryImages.length} ảnh được hiển thị từ backend</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.length ? (
                  galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setPreviewImage(image)}
                      className="group relative overflow-hidden rounded-[1.75rem] aspect-square bg-gray-100"
                    >
                      <img src={image} alt={`${provider.name} ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-10 text-gray-500 text-sm font-medium">
                    Chưa có gallery cho nhà cung cấp này.
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-4">Về cửa hàng</h2>
              <p className="text-gray-500 leading-relaxed font-medium whitespace-pre-line">
                {provider.description || 'Nhà cung cấp chưa cập nhật mô tả chi tiết.'}
              </p>
            </section>

            <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center justify-between gap-4 flex-wrap">
                <span>Danh sách dịch vụ</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{provider.services?.length || 0} Dịch vụ</span>
              </h2>
              <div className="space-y-4">
                {provider.services?.length ? (
                  provider.services.map((service) => (
                    <div
                      key={service.id}
                      className="group p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:bg-white hover:border-orange-100 hover:shadow-xl hover:shadow-orange-100/30 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h4 className="text-lg font-black text-gray-900">{service.name}</h4>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-white px-2.5 py-1 rounded-full border border-gray-100">
                            <Clock className="w-3.5 h-3.5" /> {service.duration || `${service.durationMinutes || 0} min`}
                          </span>
                          {service.categoryName && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                              {service.categoryName}
                            </span>
                          )}
                          {service.featured && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                              Nổi bật
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">{service.desc || 'Đang cập nhật mô tả dịch vụ.'}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-8 border-t sm:border-t-0 pt-4 sm:pt-0">
                        <div className="text-right">
                          <span className="block text-[10px] font-black text-gray-300 uppercase mb-0.5 tracking-widest">Giá từ</span>
                          <span className="text-2xl font-black text-orange-600">{formatCurrencyVnd(service.price)}đ</span>
                        </div>
                        <button
                          onClick={() => openBookingForService(service.id)}
                          className="px-8 py-4 bg-gray-900 text-white text-[10px] font-black rounded-[1.5rem] hover:bg-orange-500 hover:shadow-lg transition-all uppercase tracking-widest"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500 text-sm font-medium">Nhà cung cấp này chưa có dịch vụ đang hoạt động.</div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-1">Đánh giá thực tế</h2>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">
                    {provider.reviewsCount || provider.summary?.totalReviews || 0} Khách hàng đã sử dụng
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-gray-900">{provider.rating || '0.0'}</span>
                  <div className="flex gap-0.5 justify-end">{renderStars(provider.rating)}</div>
                </div>
              </div>

              <div className="space-y-6">
                {provider.reviews?.length ? (
                  provider.reviews.map((review) => (
                    <div key={review.id} className="p-6 sm:p-8 rounded-[2rem] bg-gray-50 border border-gray-100 hover:bg-white hover:border-orange-100 transition-all">
                      <div className="flex justify-between items-start gap-4 mb-4 flex-wrap">
                        <div className="flex items-center gap-4 min-w-0">
                          <img
                            src={review.avatar || 'https://i.pravatar.cc/150?img=12'}
                            alt={review.user}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                          />
                          <div className="min-w-0">
                            <h5 className="font-black text-gray-900 text-lg truncate">{review.user}</h5>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400 tracking-widest uppercase">
                              <span>{review.date}</span>
                              {review.petName && <span>• {review.petName}{review.petBreed ? ` (${review.petBreed})` : ''}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-lg shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs font-black">{review.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed font-medium italic">“{review.comment || 'Khách hàng chưa để lại bình luận chi tiết.'}”</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500 text-sm font-medium">Chưa có review hiển thị cho nhà cung cấp này.</div>
                )}
              </div>
            </section>
          </div>

          <aside className="lg:w-[400px]">
            <div className="sticky top-28 space-y-8">
              <div className="bg-gray-900 text-white p-8 sm:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Clock className="w-32 h-32 rotate-12" />
                </div>
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-orange-500 rounded-xl">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  Giờ làm việc
                </h3>
                <div className="space-y-5 relative z-10">
                  {provider.hours?.length ? (
                    provider.hours.map((hour) => (
                      <div key={hour.weekday} className="flex justify-between items-center text-sm gap-3">
                        <span className="font-bold text-gray-400">{hour.days}</span>
                        <div className="h-px flex-1 border-t border-dashed border-white/20"></div>
                        <span className="font-black text-white text-right">{hour.closed ? 'Đóng cửa' : hour.time}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">Nhà cung cấp chưa cập nhật giờ làm việc.</p>
                  )}
                </div>
                <div className="mt-10 pt-8 border-t border-white/10 relative z-10 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Phone className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Hotline hỗ trợ</p>
                      <p className="text-lg font-black tracking-tight italic">{provider.emergencyPhone || 'Đang cập nhật'}</p>
                    </div>
                  </div>
                  <button className="w-full py-5 bg-white text-gray-900 font-black rounded-2xl hover:bg-orange-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                    <MessageSquare className="w-4 h-4" /> Chat với tư vấn viên
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-8 sm:p-10 rounded-[3rem] shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-black text-gray-900">Slot trống sắp tới</h3>
                </div>
                {provider.summary?.nextAvailableSlot && (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Sớm nhất: {provider.summary.nextAvailableSlot}</p>
                )}
                {provider.slots?.length ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {provider.slots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotClick(slot)}
                          className={`group relative p-4 rounded-2xl text-xs font-black transition-all border ${selectedSlotId === slot.id
                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg'
                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-lg'
                            }`}
                        >
                          <div>{slot.label}</div>
                          <div className={`mt-1 text-[10px] font-bold ${selectedSlotId === slot.id ? 'text-white/80' : 'text-gray-400 group-hover:text-white/80'}`}>
                            Còn {slot.capacityRemaining}
                          </div>
                          <span className="absolute -top-2 -right-2 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 space-y-3">
                      {provider.slots.slice(0, 3).map((slot) => (
                        <div key={`detail-${slot.id}`} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                          <p className="text-sm font-black text-gray-900">{slot.label} • {slot.date}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">{slot.serviceName || 'Dịch vụ bất kỳ'} • {slot.startTime} - {slot.endTime}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-gray-500 text-sm font-medium">Hiện chưa có slot trống hiển thị từ backend.</div>
                )}
                <div className="mt-8 flex items-start gap-3 p-4 bg-orange-50 rounded-2xl text-left border border-orange-100">
                  <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase tracking-tight">
                    Chọn một khung giờ để chuyển ngay sang màn đặt lịch với providerId và providerServiceId tương ứng.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm">
                <h3 className="text-lg font-black text-gray-900 mb-5">Thông tin nhanh</h3>
                <div className="space-y-4 text-sm">
                  <QuickInfoRow icon={<MapPin className="w-4 h-4 text-orange-500" />} label="Địa chỉ" value={provider.address || 'Đang cập nhật'} />
                  <QuickInfoRow icon={<Navigation className="w-4 h-4 text-blue-500" />} label="Khoảng cách" value={provider.summary?.distance || (location.enabled ? 'Đang tính...' : 'Chưa có vị trí')} />
                  <QuickInfoRow icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} label="Membership" value={provider.acceptsMembership ? 'Có hỗ trợ' : 'Không hỗ trợ'} />
                  <QuickInfoRow icon={<RefreshCcw className="w-4 h-4 text-purple-500" />} label="Đặt nhanh" value={provider.instantBooking ? 'Có' : 'Theo xác nhận'} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <button
            onClick={() => setPreviewImage('')}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <img src={previewImage} alt="Provider preview" className="max-w-full max-h-full rounded-[2rem] object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
};

const PrimaryAction = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-8 py-4 bg-orange-500 text-white text-[10px] font-black rounded-[1.5rem] hover:bg-orange-600 hover:shadow-lg transition-all uppercase tracking-widest"
  >
    {children}
  </button>
);

const SecondaryAction = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-6 py-4 bg-gray-100 text-gray-700 text-[10px] font-black rounded-[1.5rem] hover:bg-gray-200 transition-all uppercase tracking-widest"
  >
    {children}
  </button>
);

const SummaryTile = ({ label, value, accent = 'orange' }) => {
  const accentClass = {
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  }[accent] || 'bg-orange-50 text-orange-700 border-orange-100';

  return (
    <div className={`rounded-[1.5rem] border px-4 py-3 ${accentClass}`}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">{label}</p>
      <p className="text-lg font-black leading-none">{value}</p>
    </div>
  );
};

const QuickInfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="font-semibold text-gray-800 leading-snug">{value}</p>
    </div>
  </div>
);

export default ProviderDetailPage;
