import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getPublicServices, getPublicCategories, toggleFavorite, getFavoriteIds } from '../api/services';
import { getPublicAreas } from '../api/areas';
import LocationPickerModal from '../components/LocationPickerModal';
import { AuthContext } from '../context/AuthContext';

const formatPrice = (amount) => {
  if (amount == null) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const priceUnitLabel = (unit) => {
  const map = {
    SESSION: '1 lần', PER_SESSION: '1 lần', ONCE: '1 lần', VISIT: '1 lần',
    HOUR: 'giờ', PER_HOUR: 'giờ', DAY: 'ngày', PER_DAY: 'ngày',
    PET: 'thú cưng', PER_PET: 'thú cưng',
  };
  return map?.[unit?.toUpperCase()] || unit || '1 lần';
};

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ServicesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCatIds, setSelectedCatIds] = useState(new Set());
  const [bookingTypeFilter, setBookingTypeFilter] = useState('ALL');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [togglingFav, setTogglingFav] = useState(null);
  const [allAreas, setAllAreas] = useState([]);
  const [selectedAreaIds, setSelectedAreaIds] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const { account } = useContext(AuthContext);

  useEffect(() => {
    const catId = searchParams.get('categoryId');
    if (catId) {
      setSelectedCatIds(new Set([Number(catId)]));
    }
    Promise.all([loadServices(), loadCategories(), loadFavoriteIds(), loadAreas()]);
  }, []);

  const loadFavoriteIds = async () => {
    if (!account) return;
    try {
      const ids = await getFavoriteIds();
      setFavoriteIds(new Set(Array.isArray(ids) ? ids : []));
    } catch {
      // not logged in or error — ignore
    }
  };

  const handleToggleFavorite = async (serviceId, e) => {
    e.stopPropagation();
    if (!account) {
      navigate('/login');
      return;
    }
    setTogglingFav(serviceId);
    try {
      const res = await toggleFavorite(serviceId);
      const newSet = new Set(favoriteIds);
      if (res?.favorited) newSet.add(serviceId);
      else newSet.delete(serviceId);
      setFavoriteIds(newSet);
    } catch {
      // ignore
    } finally {
      setTogglingFav(null);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getPublicServices();
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getPublicCategories();
      setAllCategories(Array.isArray(data) ? data : []);
    } catch {
      setAllCategories([]);
    }
  };

  const loadAreas = async () => {
    try {
      const data = await getPublicAreas();
      setAllAreas(Array.isArray(data) ? data : []);
    } catch {
      setAllAreas([]);
    }
  };

  const handleLocationConfirm = useCallback((loc) => {
    setUserLocation({ lat: loc.lat, lng: loc.lng, address: loc.address });
    setLocationModalOpen(false);
  }, []);

  const flatCatList = useMemo(() => {
    const result = [];
    const walk = (cats, level = 0) => {
      for (const c of cats) {
        result.push({ ...c, level });
        if (c.children?.length) walk(c.children, level + 1);
      }
    };
    walk(allCategories);
    return result;
  }, [allCategories]);

  function collectDescendantIds(nodes) {
    const ids = [];
    for (const n of nodes) {
      ids.push(n.id);
      if (n.children) ids.push(...collectDescendantIds(n.children));
    }
    return ids;
  }

  function findNodeById(nodes, id) {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = findNodeById(n.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function collectAncestorIds(tree, targetId, chain = []) {
    for (const n of tree) {
      if (n.id === targetId) return chain;
      if (n.children) {
        const found = collectAncestorIds(n.children, targetId, [...chain, n.id]);
        if (found) return found;
      }
    }
    return null;
  }

  function handleCatCheck(node, checked) {
    const newSet = new Set(selectedCatIds);
    const descIds = collectDescendantIds(node.children || []);

    if (checked) {
      newSet.add(node.id);
      descIds.forEach((id) => newSet.add(id));
      const ancestors = collectAncestorIds(allCategories, node.id);
      if (ancestors) ancestors.forEach((id) => newSet.add(id));
    } else {
      newSet.delete(node.id);
      descIds.forEach((id) => newSet.delete(id));
      const ancestors = collectAncestorIds(allCategories, node.id);
      if (ancestors) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const ancId = ancestors[i];
          const ancNode = findNodeById(allCategories, ancId);
          if (ancNode && ancNode.children) {
            const ancDescIds = collectDescendantIds(ancNode.children);
            const stillChecked = ancDescIds.some((id) => newSet.has(id));
            if (!stillChecked) newSet.delete(ancId);
          }
        }
      }
    }
    setSelectedCatIds(newSet);
  }

  function isIndeterminate(node) {
    if (!node.children?.length) return false;
    const descIds = collectDescendantIds(node.children);
    const checked = descIds.filter((id) => selectedCatIds.has(id));
    return checked.length > 0 && checked.length < descIds.length;
  }

  const renderCatNode = (node) => {
    const checked = selectedCatIds.has(node.id);
    const indeterminate = !checked && isIndeterminate(node);
    return (
      <div key={node.id} style={{ paddingLeft: node.level * 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '3px 0', fontSize: 13 }}>
          <input type="checkbox"
            ref={(el) => { if (el) el.indeterminate = indeterminate; }}
            checked={checked}
            onChange={(e) => handleCatCheck(node, e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <span style={{ fontWeight: node.children?.length ? 600 : 400 }}>{node.name}</span>
        </label>
      </div>
    );
  };

  const areaMap = useMemo(() => {
    const map = {};
    for (const a of allAreas) {
      map[a.id] = a;
    }
    return map;
  }, [allAreas]);

  // Expand each service into service-area pairs
  const expanded = useMemo(() => {
    const result = [];
    for (const s of services) {
      const areas = (s.areaIds || []).map(aid => areaMap[aid]).filter(Boolean);
      if (areas.length > 0) {
        for (const area of areas) {
          result.push({ service: s, area, key: `${s.id}-${area.id}` });
        }
      } else {
        result.push({ service: s, area: null, key: `${s.id}-none` });
      }
    }
    return result;
  }, [services, areaMap]);

  // Filter expanded entries
  const filteredEntries = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return expanded
      .filter(({ service: s, area }) => {
        if (bookingTypeFilter !== 'ALL' && s.bookingType !== bookingTypeFilter) return false;
        if (selectedCatIds.size > 0) {
          const sCatIds = new Set((s.categories || []).map((c) => c.id));
          if (![...selectedCatIds].some((id) => sCatIds.has(id))) return false;
        }
        if (selectedAreaIds.size > 0) {
          if (!area || !selectedAreaIds.has(area.id)) return false;
        }
        if (!kw) return true;
        return (s.name?.toLowerCase().includes(kw)
          || s.serviceCode?.toLowerCase().includes(kw)
          || (s.categories || []).some((c) => c.name?.toLowerCase().includes(kw)));
      })
      .sort((a, b) => {
        if (a.service.bookable && !b.service.bookable) return -1;
        if (!a.service.bookable && b.service.bookable) return 1;
        if (userLocation) {
          const dA = a.area?.pickupLatitude != null ? haversineDistance(userLocation.lat, userLocation.lng, Number(a.area.pickupLatitude), Number(a.area.pickupLongitude)) : Infinity;
          const dB = b.area?.pickupLatitude != null ? haversineDistance(userLocation.lat, userLocation.lng, Number(b.area.pickupLatitude), Number(b.area.pickupLongitude)) : Infinity;
          if (dA !== Infinity && dB !== Infinity) return dA - dB;
          if (dA !== Infinity) return -1;
          if (dB !== Infinity) return 1;
        }
        return 0;
      });
  }, [expanded, search, bookingTypeFilter, selectedCatIds, selectedAreaIds, userLocation]);

  // Group filtered entries by area when area filter is active
  const areaSections = useMemo(() => {
    if (selectedAreaIds.size === 0) return [];
    const map = {};
    for (const entry of filteredEntries) {
      if (!entry.area) continue;
      if (!map[entry.area.id]) map[entry.area.id] = { area: entry.area, entries: [] };
      map[entry.area.id].entries.push(entry);
    }
    const sections = Object.values(map);
    if (userLocation) {
      sections.sort((a, b) => {
        const dA = a.area.pickupLatitude != null ? haversineDistance(userLocation.lat, userLocation.lng, Number(a.area.pickupLatitude), Number(a.area.pickupLongitude)) : Infinity;
        const dB = b.area.pickupLatitude != null ? haversineDistance(userLocation.lat, userLocation.lng, Number(b.area.pickupLatitude), Number(b.area.pickupLongitude)) : Infinity;
        return dA - dB;
      });
    }
    return sections;
  }, [filteredEntries, selectedAreaIds, userLocation]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCatIds(new Set());
    setSelectedAreaIds(new Set());
    setBookingTypeFilter('ALL');
    setUserLocation(null);
    setSearchParams({});
  };

  const hasActiveFilters = search || selectedCatIds.size > 0 || selectedAreaIds.size > 0 || bookingTypeFilter !== 'ALL' || userLocation;

  const renderServiceCard = (entry) => {
    const s = entry.service;
    const area = entry.area;
    return (
      <div key={entry.key} onClick={() => {
          const path = area ? `/services/${s.id}?areaId=${area.id}` : `/services/${s.id}`;
          navigate(path);
        }}
        className={`bg-white rounded-2xl border border-gray-100 transition-all duration-300 group flex flex-col overflow-hidden cursor-pointer ${s.bookable ? 'hover:shadow-xl hover:-translate-y-1.5' : 'opacity-50'}`}>
        <div className="relative h-44 shrink-0 bg-gradient-to-br from-orange-100 to-amber-50">
          {s.imageUrl ? (
            <img src={s.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <Heart className="w-7 h-7 text-orange-300" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          <button onClick={(e) => handleToggleFavorite(s.id, e)}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all z-10 active:scale-90">
            <Heart className={`w-5 h-5 transition-all ${favoriteIds.has(s.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
          <span className={`absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm ${s.bookingType === 'LONG' ? 'bg-purple-500/90 text-white' : 'bg-orange-500/90 text-white'}`}>
            {s.bookingType === 'LONG' ? 'Dài hạn' : 'Ngắn hạn'}
          </span>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-[15px] font-black text-gray-900 group-hover:text-orange-600 transition-colors leading-snug">{s.name}</h3>
          {area && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-blue-600">
              <MapPin className="w-3.5 h-3.5" />
              <span>{area.name}</span>
              {area.pickupAddress && <span className="font-normal text-gray-400 truncate">— {area.pickupAddress}</span>}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5 min-h-[22px]">
            {(s.categories || []).slice(0, 3).map((c) => (
              <span key={c.id} className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">{c.name}</span>
            ))}
          </div>
          {s.shortDescription && (
            <p className="mt-2.5 text-xs font-medium text-gray-500 line-clamp-2 leading-relaxed flex-1">{s.shortDescription}</p>
          )}
          <div className="mt-auto pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-0.5">
                {(s.priceTiers && s.priceTiers.length > 0) ? (
                  <>
                    <span className="text-[10px] font-bold text-gray-400 mr-0.5">từ</span>
                    <span className="text-lg font-black text-gray-900">{formatPrice(Math.min(...s.priceTiers.map(t => t.priceAmount)))}</span>
                    <span className="text-xs font-bold text-orange-500">₫</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-black text-gray-900">{formatPrice(s.basePriceAmount)}</span>
                    <span className="text-xs font-bold text-orange-500">₫</span>
                  </>
                )}
                <span className="text-[10px] font-bold text-gray-400 ml-1">/ {priceUnitLabel(s.priceUnit)}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {s.defaultDurationMinutes} phút
              </div>
            </div>
            <button onClick={(e) => {
              e.stopPropagation();
              if (!s.bookable) return;
              if (!account) {
                toast.error('Vui lòng đăng nhập để đặt lịch.');
                navigate('/login');
                return;
              }
              const params = new URLSearchParams({ serviceId: s.id });
              if (area) params.set('areaId', area.id);
              else if (selectedAreaIds.size > 0) params.set('areaId', [...selectedAreaIds][0]);
              if (userLocation) {
                params.set('lat', userLocation.lat.toFixed(6));
                params.set('lng', userLocation.lng.toFixed(6));
              }
              navigate(`/booking?${params.toString()}`);
            }}
              disabled={!s.bookable}
              className={`w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${s.bookable ? 'bg-gray-900 text-white hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {s.bookable ? 'Đặt lịch ngay' : 'Tạm ngừng'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-black tracking-tight">Dịch vụ</h1>
          <p className="mt-2 text-orange-100 font-medium">Khám phá tất cả dịch vụ chăm sóc thú cưng</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="w-64 shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24 space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Tìm kiếm</h3>
                <input type="text" placeholder="Tên dịch vụ..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Danh mục</h3>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {flatCatList.length === 0 ? (
                    <p className="text-xs text-gray-400">Không có danh mục</p>
                  ) : (
                    flatCatList.map(renderCatNode)
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Loại đặt lịch</h3>
                <div className="space-y-2">
                  {[
                    { value: 'ALL', label: 'Tất cả' },
                    { value: 'SHORT', label: 'Ngắn hạn' },
                    { value: 'LONG', label: 'Dài hạn' },
                  ].map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                      <input type="radio" name="bookingType" value={opt.value}
                        checked={bookingTypeFilter === opt.value}
                        onChange={(e) => setBookingTypeFilter(e.target.value)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Khu vực</h3>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {allAreas.length === 0 ? (
                    <p className="text-xs text-gray-400">Không có khu vực</p>
                  ) : (
                    allAreas.map((a) => {
                      const checked = selectedAreaIds.has(a.id);
                      return (
                        <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '3px 0', fontSize: 13 }}>
                          <input type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = new Set(selectedAreaIds);
                              if (checked) next.delete(a.id); else next.add(a.id);
                              setSelectedAreaIds(next);
                            }}
                            style={{ width: 16, height: 16, cursor: 'pointer' }} />
                          <span style={{ fontWeight: 500 }}>{a.name}</span>
                          {userLocation && a.pickupLatitude != null && a.pickupLongitude != null && (
                            <span className="text-[10px] text-gray-400 ml-auto">
                              {Math.round(haversineDistance(userLocation.lat, userLocation.lng, Number(a.pickupLatitude), Number(a.pickupLongitude)))} km
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-3">Xếp theo khoảng cách</h3>
                <div className="space-y-2">
                  {userLocation ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 rounded-xl px-3 py-2.5">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{userLocation.address || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}</span>
                      <button onClick={() => setUserLocation(null)}
                        className="text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase tracking-wider">Xoá</button>
                    </div>
                  ) : (
                    <button onClick={() => setLocationModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all">
                      <MapPin className="w-4 h-4" />
                      Chọn vị trí
                    </button>
                  )}
                </div>
              </div>

              <LocationPickerModal
                open={locationModalOpen}
                onClose={() => setLocationModalOpen(false)}
                onConfirm={handleLocationConfirm}
                initialLocation={userLocation} />

              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="w-full py-2.5 text-xs font-black uppercase tracking-widest text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all">
                  Xoá bộ lọc
                </button>
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-bold text-gray-500">
                {loading ? 'Đang tải...' : `${filteredEntries.length} dịch vụ`}
              </p>
              <div className="flex gap-2 lg:hidden">
                <select value={bookingTypeFilter} onChange={(e) => setBookingTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm">
                  <option value="ALL">Tất cả</option>
                  <option value="SHORT">Ngắn hạn</option>
                  <option value="LONG">Dài hạn</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[380px] rounded-2xl bg-white animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : selectedAreaIds.size > 0 && areaSections.length > 0 ? (
              areaSections.map(({ area, entries }) => (
                <div key={area.id} className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-900">{area.name}</h2>
                      {area.pickupAddress && <p className="text-xs text-gray-500 mt-0.5">{area.pickupAddress}</p>}
                    </div>
                    {userLocation && area.pickupLatitude != null && (
                      <span className="ml-auto text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full">
                        {Math.round(haversineDistance(userLocation.lat, userLocation.lng, Number(area.pickupLatitude), Number(area.pickupLongitude)))} km
                      </span>
                    )}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {entries.map((entry) => renderServiceCard(entry))}
                  </div>
                </div>
              ))
            ) : filteredEntries.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredEntries.map((entry) => renderServiceCard(entry))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                <p className="text-sm font-bold text-gray-500">Không tìm thấy dịch vụ phù hợp.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
