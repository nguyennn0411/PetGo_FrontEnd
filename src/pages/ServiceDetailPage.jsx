import { useCallback, useContext, useEffect, useState } from 'react';
import { ArrowLeft, Clock, Heart, MapPin, Star } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPublicServiceById, getServiceAreas, toggleFavorite, getFavoriteIds } from '../api/services';
import { getReviewsByService } from '../api/reviews';
import { AuthContext } from '../context/AuthContext';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const formatPrice = (amount) => {
  if (amount == null) return '0';
  return Math.round(typeof amount === 'string' ? parseFloat(amount) : amount)
    .toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const priceUnitLabel = (unit) => {
  const map = {
    SESSION: '1 lần', PER_SESSION: '1 lần', ONCE: '1 lần', VISIT: '1 lần',
    HOUR: 'giờ', PER_HOUR: 'giờ', DAY: 'ngày', PER_DAY: 'ngày',
    PET: 'thú cưng', PER_PET: 'thú cưng',
  };
  return map?.[unit?.toUpperCase()] || unit || '1 lần';
};

export default function ServiceDetailPage() {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedAreaId = searchParams.get('areaId');
  const navigate = useNavigate();
  const { account } = useContext(AuthContext);
  const [service, setService] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [placeNames, setPlaceNames] = useState({});
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPublicServiceById(serviceId),
      getServiceAreas(serviceId),
      account ? getFavoriteIds().then(ids => setFavorited(ids?.includes(Number(serviceId)))) : Promise.resolve(),
    ])
      .then(([svc, areaData]) => {
        setService(svc);
        const list = Array.isArray(areaData) ? areaData : [];
        setAreas(list);
        list.forEach(a => {
          if (a.pickupLatitude != null && a.pickupLongitude != null) {
            const lat = Number(a.pickupLatitude);
            const lng = Number(a.pickupLongitude);
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`)
              .then(r => r.json())
              .then(data => {
                if (data?.display_name)
                  setPlaceNames(prev => ({ ...prev, [a.id]: data.display_name }));
              })
              .catch(() => {});
          }
        });
      })
      .catch(() => navigate('/services'))
      .finally(() => setLoading(false));
    getReviewsByService(serviceId).then(setReviews).catch(() => {}).finally(() => setReviewsLoading(false));
  }, [serviceId, account]);

  const handleToggleFav = async () => {
    if (!account) { navigate('/login'); return; }
    try {
      const res = await toggleFavorite(service.id);
      setFavorited(res?.favorited ?? !favorited);
    } catch { /* ignore */ }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-sm font-bold text-gray-400">Đang tải...</div>
    </div>
  );

  if (!service) return null;

  const displayAreas = selectedAreaId
    ? areas.filter((a) => String(a.id) === selectedAreaId)
    : areas;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/services" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Image */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-br from-orange-100 to-amber-50">
            {service.imageUrl ? (
              <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Star className="w-16 h-16 text-orange-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm ${service.bookingType === 'LONG' ? 'bg-purple-500/90 text-white' : 'bg-orange-500/90 text-white'}`}>
                {service.bookingType === 'LONG' ? 'Dài hạn' : 'Ngắn hạn'}
              </span>
              {!service.bookable && (
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm bg-gray-500/80 text-white">
                  Tạm ngừng
                </span>
              )}
            </div>
            <button onClick={handleToggleFav}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-md transition-all active:scale-90">
              <Heart className={`w-5 h-5 transition-all ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(service.categories || []).map(c => (
                  <span key={c.id} className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">{c.name}</span>
                ))}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{service.name}</h1>
              {service.serviceCode && (
                <p className="text-xs font-medium text-gray-400 mt-1">Mã dịch vụ: {service.serviceCode}</p>
              )}
            </div>

            {/* Price & Duration */}
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Giá</p>
                <div className="flex items-baseline gap-0.5 mt-1">
                  {(service.priceTiers && service.priceTiers.length > 0) ? (
                    <>
                      <span className="text-[10px] font-bold text-gray-400 mr-0.5">từ</span>
                      <span className="text-2xl font-black text-gray-900">{formatPrice(Math.min(...service.priceTiers.map(t => t.priceAmount)))}</span>
                      <span className="text-sm font-bold text-orange-500">₫</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-gray-900">{formatPrice(service.basePriceAmount)}</span>
                      <span className="text-sm font-bold text-orange-500">₫</span>
                    </>
                  )}
                  <span className="text-xs font-bold text-gray-400 ml-1">/ {priceUnitLabel(service.priceUnit)}</span>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Thời gian</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-900">{service.defaultDurationMinutes} phút</span>
                </div>
              </div>
            </div>

            {/* Price Tiers */}
            {(service.priceTiers && service.priceTiers.length > 0) && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bảng giá chi tiết</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <th className="text-left px-4 py-2.5">Loại</th>
                        <th className="text-left px-4 py-2.5">Cân nặng</th>
                        <th className="text-right px-4 py-2.5">Giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {service.priceTiers.map((t, i) => {
                        const speciesLabel = { DOG: 'Chó', CAT: 'Mèo', ALL: 'Tất cả' }[t.species] || t.species;
                        const weightLabel = t.weightTo >= 200 ? `≥ ${t.weightFrom}kg` : `${t.weightFrom} - ${t.weightTo}kg`;
                        return (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 font-bold text-gray-700">{speciesLabel}</td>
                            <td className="px-4 py-2.5 text-gray-500">{weightLabel}</td>
                            <td className="px-4 py-2.5 text-right font-black text-gray-900">{formatPrice(t.priceAmount)}<span className="text-[10px] font-bold text-orange-500 ml-0.5">₫</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Description */}
            {service.shortDescription && (
              <p className="text-sm font-medium text-gray-600 leading-relaxed">{service.shortDescription}</p>
            )}
            {service.description && (
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{service.description}</div>
            )}

            {/* Areas */}
            {displayAreas.length > 0 && (
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">
                  {selectedAreaId ? 'Khu vực' : 'Khu vực áp dụng'}
                </h2>
                <div className="space-y-3">
                  {displayAreas.map(a => (
                    <div key={a.id} className="rounded-xl border border-gray-100 overflow-hidden">
                      {(a.pickupLatitude != null && a.pickupLongitude != null) && (
                        <div className="h-40">
                          <MapContainer center={[Number(a.pickupLatitude), Number(a.pickupLongitude)]} zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            dragging={false} zoomControl={false} scrollWheelZoom={false} touchZoom={false} doubleClickZoom={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[Number(a.pickupLatitude), Number(a.pickupLongitude)]} icon={defaultIcon}>
                              <Popup>{a.name}</Popup>
                            </Marker>
                          </MapContainer>
                        </div>
                      )}
                      <div className="flex items-start gap-3 p-3">
                        <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg mt-0.5 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900">{a.name}</p>
                          {placeNames[a.id] && <p className="text-xs text-gray-400 mt-0.5 truncate">{placeNames[a.id]}</p>}
                          {a.pickupAddress && <p className="text-xs text-gray-500 mt-0.5">{a.pickupAddress}</p>}
                          {(a.pickupLatitude != null && a.pickupLongitude != null) && (
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                              {Number(a.pickupLatitude).toFixed(6)}, {Number(a.pickupLongitude).toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="pt-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-4">Đánh giá</h2>

              {reviewsLoading ? (
                <div className="text-sm text-gray-400">Đang tải...</div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-400">Chưa có đánh giá nào.</p>
              ) : (
                <>
                  {/* Summary */}
                  <div className="flex items-center gap-3 mb-5 p-4 bg-orange-50 rounded-2xl">
                    <div className="text-center">
                      <div className="text-3xl font-black text-gray-900">
                        {service.averageRating != null ? Number(service.averageRating).toFixed(1) : '0.0'}
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5 justify-center">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(Number(service.averageRating || 0)) ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="w-px h-10 bg-orange-200" />
                    <div className="text-sm text-gray-600">
                      <span className="font-black text-gray-900">{service.totalReviews || 0}</span> đánh giá
                    </div>
                  </div>

                  {/* List */}
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-orange-100 overflow-hidden shrink-0 mt-0.5">
                          {r.userAvatar ? (
                            <img src={r.userAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-orange-500">
                              {(r.userName || '?')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">{r.userName || 'Người dùng'}</span>
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            {r.createdAt && (
                              <span className="text-[10px] text-gray-400 ml-auto">
                                {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                          {r.content && (
                            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Book button */}
            <button onClick={() => {
              if (!account) {
                navigate('/login');
                return;
              }
              if (!service.bookable) return;
              const params = new URLSearchParams({ serviceId: service.id });
              if (displayAreas.length > 0) params.set('areaId', displayAreas[0].id);
              else if (selectedAreaId) params.set('areaId', selectedAreaId);
              navigate(`/booking?${params.toString()}`);
            }}
              disabled={!service.bookable}
              className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-[0.98] ${service.bookable ? 'bg-gray-900 text-white hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {service.bookable ? 'Đặt lịch ngay' : 'Tạm ngừng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
