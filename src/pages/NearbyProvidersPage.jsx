import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Heart,
  Info,
  Loader2,
  Maximize2,
  Navigation,
  Navigation2,
  PawPrint,
  Search,
  SlidersHorizontal,
  Star,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNearbyProviders } from '../api/providers';
import {
  buildFakeMapCoords,
  buildProviderAddress,
  formatCurrencyVnd,
  loadFavoriteProviderIds,
  mapSortValueToApi,
  pickProviderImage,
  toggleFavoriteProviderId,
} from '../utils/providerHelpers';

const NearbyProvidersPage = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('nearest');
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(loadFavoriteProviderIds());
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
    loading: true,
    enabled: false,
    label: 'Đang xác định vị trí...',
  });

  const fetchProviders = async (coords) => {
    setLoading(true);
    setError('');

    try {
      const data = await getNearbyProviders({
        query: searchQuery || undefined,
        latitude: coords?.latitude || undefined,
        longitude: coords?.longitude || undefined,
        sortBy: mapSortValueToApi(sortBy),
        page: 0,
        size: 12,
      });
      setProviders(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách gần bạn.');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      const fallback = {
        latitude: '',
        longitude: '',
        loading: false,
        enabled: false,
        label: 'Trình duyệt không hỗ trợ GPS',
      };
      setLocation(fallback);
      fetchProviders(fallback);
      return;
    }

    setLocation((prev) => ({ ...prev, loading: true, label: 'Đang xác định vị trí...' }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          loading: false,
          enabled: true,
          label: 'Đã dùng vị trí hiện tại',
        };
        setLocation(next);
        fetchProviders(next);
      },
      () => {
        const fallback = {
          latitude: '',
          longitude: '',
          loading: false,
          enabled: false,
          label: 'Không lấy được vị trí, đang dùng dữ liệu chung',
        };
        setLocation(fallback);
        fetchProviders(fallback);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders(location);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, searchQuery]);

  const providersWithCoords = useMemo(
    () => providers.map((provider, index) => ({ ...provider, coords: buildFakeMapCoords(index) })),
    [providers],
  );

  const handleToggleFavorite = (providerId) => {
    setFavorites(toggleFavoriteProviderId(providerId));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col h-screen">
      

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <section className="w-full lg:w-[460px] bg-white border-r border-gray-100 overflow-y-auto no-scrollbar flex flex-col shadow-xl z-20">
          <div className="p-6 border-b border-gray-50">
            <h1 className="text-2xl font-black text-gray-900 mb-2">Nearby Pet Services</h1>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              <Navigation className="w-3 h-3 text-blue-500" />
              <span>{location.label}</span>
            </div>
            {location.enabled && (
              <p className="text-xs text-gray-500 mb-4">
                {location.latitude}, {location.longitude}
              </p>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <SortPill active={sortBy === 'nearest'} label="Nearest" onClick={() => setSortBy('nearest')} />
                <SortPill active={sortBy === 'rating'} label="Top Rated" onClick={() => setSortBy('rating')} />
                <SortPill active={sortBy === 'price'} label="Lowest Price" onClick={() => setSortBy('price')} />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={requestLocation}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-all"
                >
                  {location.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  Làm mới vị trí
                </button>
                <button
                  onClick={() => navigate('/search')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-all"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Bộ lọc nâng cao
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                {error}
              </div>
            )}

            {loading && providersWithCoords.length === 0 ? (
              <div className="py-10 flex items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" /> Đang tải danh sách gần bạn...
              </div>
            ) : providersWithCoords.length === 0 ? (
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-8 text-center text-gray-500">
                Không có nhà cung cấp phù hợp quanh khu vực này.
              </div>
            ) : (
              providersWithCoords.map((provider) => (
                <div
                  key={provider.id}
                  className="group p-4 bg-white rounded-3xl border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer flex gap-4"
                  onClick={() => navigate(`/providers/${provider.id}`)}
                >
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
                    <img src={pickProviderImage(provider)} alt={provider.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-1 right-1">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleFavorite(provider.id);
                        }}
                        className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg"
                      >
                        <Heart className={favorites.includes(provider.id) ? 'w-3 h-3 text-red-500 fill-red-500' : 'w-3 h-3 text-gray-400'} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 justify-between py-1 min-w-0">
                    <div>
                      <div className="flex justify-between items-start mb-1 gap-3">
                        <h3 className="font-black text-gray-900 group-hover:text-orange-600 transition-colors leading-tight text-sm truncate">
                          {provider.name}
                        </h3>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 rounded-lg shrink-0">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                          <span className="text-[10px] font-black text-yellow-700">{provider.rating}</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-2 truncate">
                        {provider.featuredService || provider.headline || 'Dịch vụ nổi bật'}
                      </p>
                      <div className="text-[10px] font-bold text-gray-400 mb-2 truncate">
                        {buildProviderAddress(provider)}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                        <div className="flex items-center gap-1">
                          <Navigation2 className="w-3 h-3 text-blue-400" /> {provider.distance || 'Chưa có'}
                        </div>
                        <div className={`flex items-center gap-1 ${provider.openNow ? 'text-green-500' : 'text-gray-400'}`}>
                          <Clock className="w-3 h-3" /> {provider.openNow ? 'Đang mở' : 'Ngoài giờ'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                      <div>
                        <span className="text-[9px] font-black text-gray-300 uppercase block">Giá từ</span>
                        <span className="text-sm font-black text-gray-900">{formatCurrencyVnd(provider.priceFrom)}đ</span>
                      </div>
                      <button className="px-4 py-2 bg-gray-900 text-white text-[9px] font-black rounded-xl hover:bg-orange-500 transition-all uppercase tracking-widest">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-orange-50 border-t border-orange-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase tracking-tight">
                Trang này đang dùng bản đồ mô phỏng. Danh sách nhà cung cấp và khoảng cách là dữ liệu thật từ API nearby.
              </p>
            </div>
          </div>
        </section>

        <section className="flex-1 relative bg-gray-200 hidden lg:block">
          <div className="absolute inset-0 bg-[#f8f4f0] overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>
                <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-xl relative z-10"></div>
              </div>
            </div>

            {providersWithCoords.map((provider) => (
              <div
                key={provider.id}
                className="absolute cursor-pointer transition-transform hover:scale-125 z-10"
                style={{ top: provider.coords.y, left: provider.coords.x }}
                onClick={() => navigate(`/providers/${provider.id}`)}
              >
                <div className="relative group">
                  <div className="bg-white p-1 rounded-full shadow-lg border-2 border-orange-500">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img src={pickProviderImage(provider)} className="w-full h-full object-cover" alt="marker" />
                    </div>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-[9px] font-black py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                    {provider.name} • {formatCurrencyVnd(provider.priceFrom)}đ
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-3 bg-orange-500"></div>
                </div>
              </div>
            ))}

            <div className="absolute bottom-10 right-10 flex flex-col gap-3">
              <MapControlButton icon={<Maximize2 className="w-5 h-5" />} />
              <MapControlButton icon={<Navigation className="w-5 h-5 text-blue-500" />} />
              <div className="flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <button className="p-3 hover:bg-gray-50 border-b border-gray-100 font-bold text-xl">+</button>
                <button className="p-3 hover:bg-gray-50 font-bold text-xl">-</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const SortPill = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
      active
        ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
        : 'bg-white text-gray-400 border-gray-100 hover:border-orange-200 hover:text-orange-600'
    }`}
  >
    {label}
  </button>
);

const MapControlButton = ({ icon }) => (
  <button className="p-4 bg-white rounded-2xl shadow-xl border border-gray-100 text-gray-600 hover:text-orange-500 transition-all hover:scale-105 active:scale-95">
    {icon}
  </button>
);

export default NearbyProvidersPage;
