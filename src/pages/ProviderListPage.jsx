import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Heart,
  Loader2,
  MapPin,
  Menu,
  PawPrint,
  RefreshCcw,
  Search,
  Star,
  User,
  X,
  Zap,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getProviderFilterOptions, getProviders } from '../api/providers';
import {
  buildProviderAddress,
  formatCurrencyVnd,
  loadFavoriteProviderIds,
  pickProviderImage,
  toggleFavoriteProviderId,
} from '../utils/providerHelpers';

const SORT_OPTIONS = [
  { label: 'Nổi bật nhất', value: 'FEATURED' },
  { label: 'Đánh giá cao nhất', value: 'TOP_RATED' },
  { label: 'Giá thấp nhất', value: 'LOWEST_PRICE' },
  { label: 'Gần nhất', value: 'NEAREST' },
];

const ProviderListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ cities: [] });
  const [providers, setProviders] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, size: 12, hasNext: false, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(loadFavoriteProviderIds());

  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'FEATURED');
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get('featuredOnly') === 'true');

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const data = await getProviderFilterOptions();
        setFilterOptions(data || { cities: [] });
      } catch {
        setFilterOptions({ cities: [] });
      }
    };

    loadOptions();
  }, []);

  const fetchProviders = async (page = 0, append = false) => {
    setLoading(true);
    setError('');

    try {
      const data = await getProviders({
        query: query || undefined,
        city: city || undefined,
        sortBy,
        featuredOnly,
        page,
        size: 12,
      });

      const items = Array.isArray(data?.items) ? data.items : [];
      setProviders((prev) => (append ? [...prev, ...items] : items));
      setPagination({
        page: data?.page ?? page,
        size: data?.size ?? 12,
        hasNext: Boolean(data?.hasNext),
        totalItems: Number(data?.totalItems ?? items.length),
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách nhà cung cấp.');
      if (!append) {
        setProviders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (query) nextParams.set('query', query);
    if (city) nextParams.set('city', city);
    if (sortBy && sortBy !== 'FEATURED') nextParams.set('sortBy', sortBy);
    if (featuredOnly) nextParams.set('featuredOnly', 'true');
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
    fetchProviders(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, sortBy, featuredOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQuery = searchParams.get('query') || '';
      if (query !== currentQuery) {
        const nextParams = new URLSearchParams(searchParams);
        if (query) nextParams.set('query', query);
        else nextParams.delete('query');
        if (nextParams.toString() !== searchParams.toString()) {
          setSearchParams(nextParams, { replace: true });
        }
        fetchProviders(0, false);
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const favoriteProviders = useMemo(
    () => providers.filter((provider) => favorites.includes(provider.id)),
    [favorites, providers],
  );

  const handleToggleFavorite = (providerId) => {
    setFavorites(toggleFavoriteProviderId(providerId));
  };

  const handleLoadMore = () => {
    if (!loading && pagination.hasNext) {
      fetchProviders(pagination.page + 1, true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <section className="bg-white rounded-3xl border shadow-sm p-5 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Tìm nhà cung cấp
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tên provider, dịch vụ, headline..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:border-orange-400"
                />
              </div>
            </div>

            <div className="lg:w-56">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Thành phố
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:border-orange-400"
              >
                <option value="">Tất cả thành phố</option>
                {(filterOptions.cities || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:w-56">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Sắp xếp
              </label>
              <div className="relative">
                <ArrowUpDown className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:border-orange-400"
                >
                  {SORT_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
            <label className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-orange-50 text-orange-700 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="accent-orange-500"
              />
              Chỉ hiện nhà cung cấp nổi bật
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => fetchProviders(0, false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white hover:bg-gray-50 font-semibold"
              >
                <RefreshCcw className="w-4 h-4" /> Tải lại
              </button>
              <button
                onClick={() => navigate('/search')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-orange-500 font-semibold"
              >
                Bộ lọc nâng cao
              </button>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Danh sách nhà cung cấp</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pagination.totalItems} kết quả phù hợp với bộ lọc hiện tại.
            </p>
          </div>
          <Link to="/nearby" className="text-sm font-semibold text-orange-600">
            Xem gần bạn
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {loading && providers.length === 0 ? (
          <div className="py-20 flex items-center justify-center text-gray-500 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải dữ liệu...
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-white rounded-3xl border p-10 text-center text-gray-500">
            Không có nhà cung cấp phù hợp. Bạn thử đổi từ khóa hoặc thành phố.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isFavorite={favorites.includes(provider.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              {pagination.hasNext ? (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-orange-500 disabled:opacity-60"
                >
                  {loading ? 'Đang tải...' : 'Xem thêm'}
                </button>
              ) : (
                <div className="text-sm text-gray-400">Đã hiển thị hết kết quả.</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const ProviderCard = ({ provider, isFavorite, onToggleFavorite }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-lg transition-all">
      <div className="relative">
        <img src={pickProviderImage(provider)} alt={provider.name} className="w-full h-52 object-cover" />
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(provider.id);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/90 shadow hover:scale-105 transition-transform"
        >
          <Heart className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-500'} size={18} />
        </button>

        <div className="absolute left-4 top-4 flex gap-2 flex-wrap">
          {provider.featured && (
            <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-[10px] font-black uppercase tracking-wider">
              Featured
            </span>
          )}
          {provider.hot && (
            <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider">
              Hot
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-lg text-gray-900 leading-tight">{provider.name}</h3>
            <p className="text-sm text-orange-600 font-semibold mt-1">{provider.featuredService || provider.headline || 'Dịch vụ chăm sóc thú cưng'}</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-sm font-bold shrink-0">
            <Star className="w-4 h-4 fill-current" />
            {provider.rating || '0.0'}
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-500">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
            <span>{buildProviderAddress(provider)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${provider.instantBooking ? 'text-green-500' : 'text-gray-300'}`} />
            <span>{provider.instantBooking ? 'Đặt nhanh ngay' : 'Cần xác nhận trước'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {(provider.availableSlots || []).slice(0, 3).map((slot) => (
            <span key={slot} className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
              {slot}
            </span>
          ))}
          {(!provider.availableSlots || provider.availableSlots.length === 0) && (
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
              Chưa có slot hiển thị
            </span>
          )}
        </div>

        <div className="mt-5 pt-4 border-t flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Giá từ</p>
            <p className="text-xl font-black text-gray-900">{formatCurrencyVnd(provider.priceFrom)}đ</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/booking?providerId=${provider.id}`)}
              className="px-4 py-2 rounded-2xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
            >
              Book
            </button>
            <button
              onClick={() => navigate(`/providers/${provider.id}`)}
              className="px-4 py-2 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderListPage;
