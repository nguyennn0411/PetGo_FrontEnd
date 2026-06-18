import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Heart,
  Info,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Navigation,
  PawPrint,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Star,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getActiveProviderServices, getProviderFilterOptions, searchProviders } from '../api/providers';
import {
  buildProviderAddress,
  formatCurrencyVnd,
  loadFavoriteProviderIds,
  mapTimeOfDayLabel,
  pickProviderImage,
  toggleFavoriteProviderId,
} from '../utils/providerHelpers';

const DEFAULT_FILTERS = {
  query: '',
  partnerName: '',
  city: '',
  serviceCategoryIds: [],
  minPrice: '',
  maxPrice: '',
  minRating: '',
  maxDistanceKm: '',
  timeOfDay: '',
  sortBy: 'FEATURED',
  featuredOnly: false,
};

const findCategoryNode = (items = [], categoryId, parentChain = []) => {
  const target = String(categoryId);
  for (const item of items || []) {
    if (String(item.id) === target) return { node: item, parents: parentChain };
    const found = findCategoryNode(item.children || [], target, [...parentChain, item]);
    if (found) return found;
  }
  return null;
};

const collectCategoryIds = (category) => [String(category.id), ...(category.children || []).flatMap(collectCategoryIds)];

const syncParentCategorySelection = (selectedIds, categories = []) => {
  const selectedSet = new Set(selectedIds.map(String));
  const visit = (category) => {
    const children = category.children || [];
    children.forEach(visit);
    if (!children.length) return;
    const hasSelectedChild = children.some((child) => selectedSet.has(String(child.id)) || collectCategoryIds(child).some((id) => selectedSet.has(id)));
    if (hasSelectedChild) selectedSet.add(String(category.id));
    else selectedSet.delete(String(category.id));
  };
  (categories || []).forEach(visit);
  return Array.from(selectedSet);
};

const SearchFilterPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [layout, setLayout] = useState('grid');
  const [resultView, setResultView] = useState('services');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState({ items: [], totalItems: 0, page: 0, size: 12, hasNext: false, filterOptions: null });
  const [activeServices, setActiveServices] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ serviceCategories: [], cities: [], sortOptions: [], timeOfDayOptions: [] });
  const [favorites, setFavorites] = useState(loadFavoriteProviderIds());
  const [location, setLocation] = useState({ latitude: '', longitude: '', enabled: false, loading: false, label: 'Chưa lấy vị trí' });

  const getInitialFilters = () => {
    const categoryFromUrl = searchParams.get('categoryId') || searchParams.get('category');
    const categoriesCsv = searchParams.get('serviceCategoryIds') || searchParams.get('serviceCategorySlugs');
    const serviceCategoryIds = categoriesCsv
      ? categoriesCsv.split(',').filter(Boolean)
      : categoryFromUrl
        ? [categoryFromUrl]
        : [];

    return {
      query: searchParams.get('query') || searchParams.get('q') || '',
      partnerName: searchParams.get('partnerName') || '',
      city: searchParams.get('city') || '',
      serviceCategoryIds,
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      minRating: searchParams.get('minRating') || '',
      maxDistanceKm: searchParams.get('maxDistanceKm') || '',
      timeOfDay: searchParams.get('timeOfDay') || '',
      sortBy: searchParams.get('sortBy') || 'FEATURED',
      featuredOnly: searchParams.get('featuredOnly') === 'true',
    };
  };

  const [filters, setFilters] = useState(getInitialFilters);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const data = await getProviderFilterOptions();
        setFilterOptions(data || { serviceCategories: [], cities: [], sortOptions: [], timeOfDayOptions: [] });
      } catch {
        setFilterOptions({ serviceCategories: [], cities: [], sortOptions: [], timeOfDayOptions: [] });
      }
    };

    loadOptions();
  }, []);

  const buildParams = (page = 0) => ({
    query: [filters.query, filters.partnerName].filter(Boolean).join(' ') || undefined,
    city: filters.city || undefined,
    serviceCategoryIds: filters.serviceCategoryIds.length ? filters.serviceCategoryIds.join(',') : undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    minRating: filters.minRating || undefined,
    maxDistanceKm: filters.maxDistanceKm || undefined,
    timeOfDay: filters.timeOfDay || undefined,
    sortBy: filters.sortBy || 'FEATURED',
    featuredOnly: filters.featuredOnly || undefined,
    latitude: location.enabled && location.latitude ? location.latitude : undefined,
    longitude: location.enabled && location.longitude ? location.longitude : undefined,
    page,
    size: 12,
  });

  const syncSearchParams = () => {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.partnerName) params.set('partnerName', filters.partnerName);
    if (filters.city) params.set('city', filters.city);
    if (filters.serviceCategoryIds.length) params.set('serviceCategoryIds', filters.serviceCategoryIds.join(','));
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.minRating) params.set('minRating', filters.minRating);
    if (filters.maxDistanceKm) params.set('maxDistanceKm', filters.maxDistanceKm);
    if (filters.timeOfDay) params.set('timeOfDay', filters.timeOfDay);
    if (filters.sortBy && filters.sortBy !== 'FEATURED') params.set('sortBy', filters.sortBy);
    if (filters.featuredOnly) params.set('featuredOnly', 'true');
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  };

  const fetchResults = async (page = 0, append = false) => {
    setLoading(true);
    setError('');
    try {
      const data = await searchProviders(buildParams(page));
      setResult((prev) => ({
        ...data,
        items: append ? [...(prev.items || []), ...(data?.items || [])] : data?.items || [],
      }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tìm thấy dữ liệu phù hợp.');
      if (!append) {
        setResult({ items: [], totalItems: 0, page: 0, size: 12, hasNext: false, filterOptions: null });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveServices = async () => {
    setServicesLoading(true);
    try {
      const data = await getActiveProviderServices(buildParams(0));
      setActiveServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setActiveServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    syncSearchParams();
    const timer = setTimeout(() => {
      fetchResults(0, false);
      fetchActiveServices();
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, location.latitude, location.longitude, location.enabled]);

  const handleCategoryChange = (categoryId) => {
    const value = String(categoryId);
    const found = findCategoryNode(filterOptions.serviceCategories || [], value);
    if (!found?.node) return;
    const targetIds = collectCategoryIds(found.node);
    setFilters((prev) => {
      const selectedSet = new Set(prev.serviceCategoryIds.map(String));
      const shouldSelect = !selectedSet.has(value);
      if (shouldSelect) {
        targetIds.forEach((id) => selectedSet.add(id));
        found.parents.forEach((parent) => selectedSet.add(String(parent.id)));
      } else {
        targetIds.forEach((id) => selectedSet.delete(id));
      }
      return {
        ...prev,
        serviceCategoryIds: syncParentCategorySelection(Array.from(selectedSet), filterOptions.serviceCategories || []),
      };
    });
  };

  const handleToggleFavorite = (providerId) => {
    setFavorites(toggleFavoriteProviderId(providerId));
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, enabled: false, label: 'Trình duyệt không hỗ trợ GPS' }));
      return;
    }

    setLocation((prev) => ({ ...prev, loading: true, label: 'Đang lấy vị trí...' }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          enabled: true,
          loading: false,
          label: 'Đã dùng vị trí hiện tại',
        });
      },
      () => {
        setLocation((prev) => ({ ...prev, enabled: false, loading: false, label: 'Không lấy được vị trí' }));
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setLocation((prev) => ({ ...prev, enabled: false, label: 'Đã tắt vị trí' }));
  };

  const headerStats = useMemo(() => {
    const appliedCategories = filters.serviceCategoryIds.length;
    const appliedExtras = [filters.city, filters.minPrice, filters.maxPrice, filters.minRating, filters.maxDistanceKm, filters.timeOfDay]
      .filter(Boolean).length;
    return appliedCategories + appliedExtras + (filters.featuredOnly ? 1 : 0);
  }, [filters]);

  const serviceResults = useMemo(() => activeServices.map((service) => ({
    ...service,
    provider: {
      id: service.providerId,
      name: service.providerName,
      image: service.providerImage,
      address: service.providerAddress,
    },
  })), [activeServices]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-5 border-b border-gray-100 pb-4">
              <h3
                className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 cursor-pointer lg:cursor-auto"
                onClick={() => setMobileFiltersOpen((v) => !v)}
                aria-expanded={mobileFiltersOpen}
              >
                <SlidersHorizontal className="w-4 h-4 text-orange-500" /> Bộ lọc
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform lg:hidden ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
              </h3>
              <button className="text-xs font-bold text-orange-600" onClick={clearFilters}>
                Xóa tất cả
              </button>
            </div>

            <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block space-y-4 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1`}>
              <FilterGroup label="Tìm kiếm">
                <div className="space-y-3">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500" />
                    <input
                      type="text"
                      value={filters.query}
                      onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                      placeholder="Tên dịch vụ, từ khóa..."
                      className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm font-bold outline-none focus:border-orange-500"
                    />
                  </div>
                  {loading && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang cập nhật kết quả...
                    </div>
                  )}
                </div>
              </FilterGroup>

              <FilterGroup label="Danh mục dịch vụ" collapsible>
                <div className="space-y-3 max-h-64 overflow-auto pr-1">
                  {(filterOptions.serviceCategories || []).map((item) => (
                    <CategoryFilterNode
                      key={item.id}
                      category={item}
                      selectedIds={filters.serviceCategoryIds}
                      onChange={handleCategoryChange}
                    />
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Vị trí">
                <select
                  value={filters.city}
                  onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-orange-500 shadow-sm"
                >
                  <option value="">Tất cả khu vực</option>
                  {(filterOptions.cities || []).map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <button
                    onClick={requestLocation}
                    disabled={location.loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                  >
                    <Navigation className="w-4 h-4" /> {location.loading ? 'Đang lấy vị trí...' : 'Dùng vị trí hiện tại'}
                  </button>
                  <button
                    onClick={() => navigate('/nearby')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 font-semibold text-orange-700 hover:bg-orange-100"
                  >
                    <MapPin className="w-4 h-4" /> Xem gần bạn
                  </button>
                  <span className="text-xs font-medium text-gray-500">{location.label}</span>
                </div>
              </FilterGroup>

              <FilterGroup label="Khoảng giá">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                    placeholder="Min"
                    className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none"
                  />
                  <div className="w-2 h-0.5 bg-gray-200"></div>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                    placeholder="Max"
                    className="w-full p-3 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </FilterGroup>

              <FilterGroup label="Đánh giá">
                {[5, 4, 3].map((star) => (
                  <label key={star} className="flex items-center gap-3 cursor-pointer mb-3 last:mb-0 group">
                    <input
                      type="radio"
                      name="rating"
                      checked={String(filters.minRating) === String(star)}
                      onChange={() => setFilters((prev) => ({ ...prev, minRating: String(star) }))}
                      className="w-4 h-4 text-orange-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                      <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900">{star}.0 trở lên</span>
                    </div>
                  </label>
                ))}
                <button className="text-xs font-semibold text-orange-600" onClick={() => setFilters((prev) => ({ ...prev, minRating: '' }))}>
                  Bỏ lọc đánh giá
                </button>
              </FilterGroup>

              <FilterGroup label="Khoảng cách">
                <select
                  value={filters.maxDistanceKm}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxDistanceKm: e.target.value }))}
                  className="w-full p-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none"
                >
                  <option value="">Không giới hạn</option>
                  <option value="2">Dưới 2 km</option>
                  <option value="5">Dưới 5 km</option>
                  <option value="10">Dưới 10 km</option>
                </select>
              </FilterGroup>

              <FilterGroup label="Khung giờ còn trống">
                <div className="flex flex-wrap gap-2">
                  {(filterOptions.timeOfDayOptions || []).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, timeOfDay: prev.timeOfDay === value ? '' : value }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${filters.timeOfDay === value
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-gray-50 border-transparent hover:border-orange-200 hover:bg-white'
                        }`}
                    >
                      {mapTimeOfDayLabel(value)}
                    </button>
                  ))}
                </div>
              </FilterGroup>

              <FilterGroup label="Khác">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.featuredOnly}
                    onChange={(e) => setFilters((prev) => ({ ...prev, featuredOnly: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-2 border-gray-200 text-orange-500 focus:ring-0 cursor-pointer transition-all"
                  />
                  <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors">
                    Chỉ nhà cung cấp nổi bật
                  </span>
                </label>
              </FilterGroup>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {result.totalItems > 0 ? `${result.totalItems} kết quả phù hợp` : 'Kết quả tìm kiếm'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Đang áp dụng {headerStats} bộ lọc {location.enabled ? 'và vị trí hiện tại' : ''}.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2 shadow-sm" aria-label="Chuyển kiểu kết quả">
                  <button
                    type="button"
                    onClick={() => setResultView('services')}
                    title="Xem dịch vụ"
                    aria-label="Xem dịch vụ"
                    className={`text-sm font-bold transition-colors ${resultView === 'services' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Dịch vụ
                  </button>
                  <span className="h-4 w-px bg-gray-200" aria-hidden="true"></span>
                  <button
                    type="button"
                    onClick={() => setResultView('providers')}
                    title="Xem nhà cung cấp"
                    aria-label="Xem nhà cung cấp"
                    className={`text-sm font-bold transition-colors ${resultView === 'providers' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Nhà cung cấp
                  </button>
                </div>
                <div className="flex bg-white border rounded-2xl p-1">
                  <button
                    onClick={() => setLayout('grid')}
                    className={`p-2 rounded-xl ${layout === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    className={`p-2 rounded-xl ${layout === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                  className="px-4 py-3 bg-white border rounded-2xl text-sm font-bold outline-none"
                >
                  {(filterOptions.sortOptions || ['FEATURED', 'NEAREST', 'TOP_RATED', 'LOWEST_PRICE']).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                {error}
              </div>
            )}

            {(resultView === 'services' ? servicesLoading && serviceResults.length === 0 : loading && result.items.length === 0) ? (
              <div className="py-20 flex items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" /> Đang tìm kiếm...
              </div>
            ) : result.items.length === 0 || (resultView === 'services' && serviceResults.length === 0) ? (
              <div className="bg-white rounded-3xl border p-10 text-center text-gray-500">
                {resultView === 'services' ? 'Không có dịch vụ phù hợp với bộ lọc này.' : 'Không có nhà cung cấp phù hợp với bộ lọc này.'}
              </div>
            ) : (
              <>
                <div className={layout === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : 'space-y-5'}>
                  {resultView === 'services' ? serviceResults.map((service) => (
                    <ServiceResultCard
                      key={`${service.provider?.id}-${service.id}`}
                      service={service}
                      layout={layout}
                    />
                  )) : result.items.map((provider) => (
                    <ProviderResultCard
                      key={provider.id}
                      provider={provider}
                      layout={layout}
                      isFavorite={favorites.includes(provider.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {result.hasNext && (
                    <button
                      disabled={loading}
                      onClick={() => fetchResults((result.page || 0) + 1, true)}
                      className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-orange-500 disabled:opacity-60"
                    >
                      {loading ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/compare')}
                    className="px-6 py-3 rounded-2xl border bg-white font-semibold hover:bg-gray-50"
                  >
                    So sánh dịch vụ / nhà cung cấp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <div className="rounded-lg bg-orange-500 p-1.5">
              <PawPrint className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-gray-900">Pet<span className="text-orange-500">Go</span></span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">© 2025 PetGo Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FilterGroup = ({ label, children, collapsible = false, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-50/70 p-4 rounded-3xl border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        {collapsible ? (
          <h3
            className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wider cursor-pointer"
            onClick={() => setOpen((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(v => !v); } }}
            aria-expanded={open}
          >
            <span>{label}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform lg:hidden ${open ? '' : 'rotate-180'}`} />
          </h3>
        ) : (
          <>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{label}</h3>
            <Info className="w-4 h-4 text-gray-300" />
          </>
        )}
      </div>
      {collapsible ? (open ? children : null) : children}
    </div>
  );
};

const CategoryFilterNode = ({ category, selectedIds, onChange, level = 0 }) => {
  const value = String(category.id);
  const children = Array.isArray(category.children) ? category.children : [];

  return (
    <div>
      <label className="flex items-center gap-3 cursor-pointer group" style={{ paddingLeft: level * 16 }}>
        <input
          type="checkbox"
          checked={selectedIds.includes(value)}
          onChange={() => onChange(value)}
          className="w-5 h-5 min-w-5 min-h-5 shrink-0 rounded-lg border-2 border-gray-200 text-orange-500 focus:ring-0 cursor-pointer transition-all"
        />
        <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors">
          {category.name}
        </span>
      </label>
      {children.length > 0 && (
        <div className="mt-2 space-y-2 border-l border-dashed border-gray-200 ml-2 pl-2">
          {children.map((child) => (
            <CategoryFilterNode
              key={child.id}
              category={child}
              selectedIds={selectedIds}
              onChange={onChange}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProviderResultCard = ({ provider, layout, isFavorite, onToggleFavorite }) => {
  const navigate = useNavigate();
  const providerDetailPath = `/providers/${provider.id}`;
  const cardLayoutClass = layout === 'grid'
    ? 'bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden'
    : 'bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row';

  return (
    <div className={cardLayoutClass}>
      <div className={layout === 'grid' ? 'relative' : 'relative md:w-72 shrink-0'}>
        <button
          type="button"
          onClick={() => navigate(providerDetailPath)}
          className="block h-full w-full overflow-hidden text-left group/image"
          aria-label={`Xem chi tiết nhà cung cấp ${provider.name}`}
        >
          <img
            src={pickProviderImage(provider)}
            alt={provider.name}
            className={`${layout === 'grid' ? 'w-full h-56 object-cover' : 'w-full h-56 md:h-full object-cover'} transition-transform duration-500 group-hover/image:scale-105`}
          />
        </button>
        <button
          onClick={() => onToggleFavorite(provider.id)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/90 shadow-sm"
        >
          <Heart className={isFavorite ? 'w-4 h-4 text-red-500 fill-red-500' : 'w-4 h-4 text-gray-500'} />
        </button>
      </div>

      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(providerDetailPath)}
              className="block text-left text-2xl font-black text-gray-900 transition-colors hover:text-orange-600"
            >
              {provider.name}
            </button>
            <p className="text-sm font-semibold text-orange-600 mt-1">{provider.featuredService || provider.headline || 'Dịch vụ nổi bật'}</p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-sm font-bold shrink-0">
            <Star className="w-4 h-4 fill-current" />
            {provider.rating || '0.0'}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-500">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
            <span>{buildProviderAddress(provider)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>{provider.distance || 'Chưa có khoảng cách'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${provider.openNow ? 'text-green-500' : 'text-gray-300'}`} />
            <span>{provider.openNow ? 'Đang mở cửa' : 'Ngoài giờ hoạt động'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex w-2.5 h-2.5 rounded-full ${provider.instantBooking ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>{provider.instantBooking ? 'Đặt nhanh' : 'Đặt lịch xác nhận'}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(provider.categorySlugs || []).map((item) => (
            <span key={item} className="text-xl font-black text-gray-900 text-xs font-bold uppercase">
              {item}
            </span>
          ))}
          {(provider.availableSlots || []).slice(0, 4).map((slot) => (
            <span key={slot} className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
              {slot}
            </span>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Giá từ</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrencyVnd(provider.priceFrom)}đ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceResultCard = ({ service, layout }) => {
  const navigate = useNavigate();
  const provider = service.provider || {};
  const serviceId = service.providerServiceId || service.id;
  const bookingParams = new URLSearchParams();
  if (provider.id) bookingParams.set('providerId', provider.id);
  if (serviceId && !String(serviceId).startsWith('provider-')) bookingParams.set('serviceId', serviceId);
  const serviceImage = service.photoUrls?.[0] || service.imageUrl || service.thumbnailUrl || pickProviderImage(provider);
  const categoryName = service.categoryName || service.categories?.[0]?.name;
  const duration = service.duration || (service.durationMinutes ? `${service.durationMinutes} phút` : 'Theo lịch hẹn');
  const priceValue = service.priceDisplay || `${formatCurrencyVnd(service.price)}đ`;
  const description = service.description || service.shortDescription || service.desc || 'Đang cập nhật mô tả dịch vụ.';

  return (
    <div className={layout === 'grid'
      ? 'bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5'
      : 'bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-5'}>
      <div className={layout === 'grid' ? 'flex items-start gap-4' : 'flex items-start gap-4 flex-1'}>
        <img
          src={serviceImage}
          alt={service.name}
          className="w-20 h-20 rounded-3xl object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">Dịch vụ</p>
          <h3 className="font-black text-xl text-gray-900 leading-tight">{service.name}</h3>
          <p className="text-sm font-semibold text-gray-500 mt-1 truncate">Tại {provider.name}</p>
          <p className="text-sm text-gray-500 font-medium mt-2 line-clamp-2">{description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
              {duration}
            </span>
            {categoryName && (
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                {categoryName}
              </span>
            )}
            {(provider.categorySlugs || []).slice(0, categoryName ? 2 : 3).map((item) => (
              <span key={item} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold uppercase">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={layout === 'grid' ? 'mt-5 pt-4 border-t flex items-end justify-between gap-3' : 'md:w-56 shrink-0 flex md:flex-col items-end justify-between gap-3'}>
        <div className="text-right md:text-left">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Giá từ</p>
          <p className="text-2xl font-black text-gray-900">{priceValue}</p>
        </div>
        <button
          onClick={() => navigate(`/booking?${bookingParams.toString()}`)}
          className="px-4 py-2 rounded-2xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 whitespace-nowrap"
        >
          Đặt dịch vụ
        </button>
      </div>
    </div>
  );
};

export default SearchFilterPage;
