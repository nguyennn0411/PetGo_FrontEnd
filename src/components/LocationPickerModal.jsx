import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation, MapPin, Plus, Trash2, Check, Loader, Search, Bookmark } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getUserLocations, createUserLocation, deleteUserLocation } from '../api/areas';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DraggableMarker = ({ position, onMove }) => {
  useMapEvents({
    click(e) { onMove(e.latlng.lat, e.latlng.lng); },
  });
  return <Marker draggable position={position} icon={defaultIcon}
    eventHandlers={{ dragend: (e) => {
      const ll = e.target.getLatLng();
      onMove(ll.lat, ll.lng);
    }}} />;
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

export default function LocationPickerModal({ open, onClose, onConfirm, initialLocation }) {
  const { account } = useContext(AuthContext);
  const [pos, setPos] = useState(initialLocation || { lat: 10.8231, lng: 106.6297 });
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState('');
  const [savedLocs, setSavedLocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('pick'); // 'pick' | 'saved'
  const [sq, setSq] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (initialLocation) setPos(initialLocation);
  }, [initialLocation]);

  useEffect(() => {
    if (!open) return;
    if (account) {
      getUserLocations().then(setSavedLocs).catch(() => setSavedLocs([]));
    }
    reverseGeocode(pos.lat, pos.lng);
  }, [open, account]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`/geocode/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
      const data = await res.json();
      if (data.display_name) setAddress(data.display_name);
    } catch { /* ignore */ }
  };

  const handleMove = useCallback((lat, lng) => {
    setPos({ lat, lng });
    reverseGeocode(lat, lng);
  }, []);

  const doSearch = async (query) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/geocode/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=vi`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch { setSearchResults([]); } finally { setSearching(false); }
  };

  const handleSearchInput = (value) => {
    setSq(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(value), 400);
  };

  const handleSelectSearchResult = (r) => {
    handleMove(Number(r.lat), Number(r.lon));
    setSq('');
    setSearchResults([]);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { handleMove(p.coords.latitude, p.coords.longitude); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveCurrent = async () => {
    if (!account) return;
    setSaving(true);
    try {
      const name = address ? address.split(',').slice(0, 2).join(',').trim() : `Vị trí (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`;
      const loc = await createUserLocation({
        name: name.substring(0, 100),
        latitude: pos.lat,
        longitude: pos.lng,
        address: address || null,
      });
      setSavedLocs(prev => [loc, ...prev]);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUserLocation(id);
      setSavedLocs(prev => prev.filter(l => l.id !== id));
    } catch { /* ignore */ }
  };

  const handleSelectSaved = (loc) => {
    handleMove(Number(loc.latitude), Number(loc.longitude));
    setTab('pick');
  };

  const sortedSaved = useMemo(() => {
    if (!pos) return savedLocs;
    return [...savedLocs].sort((a, b) => {
      const dA = haversineDistance(pos.lat, pos.lng, Number(a.latitude), Number(a.longitude));
      const dB = haversineDistance(pos.lat, pos.lng, Number(b.latitude), Number(b.longitude));
      return dA - dB;
    });
  }, [savedLocs, pos]);

  const isCurrentSaved = useMemo(() => {
    const EPS = 0.0001;
    return savedLocs.some(l => Math.abs(Number(l.latitude) - pos.lat) < EPS && Math.abs(Number(l.longitude) - pos.lng) < EPS);
  }, [savedLocs, pos]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">Chọn vị trí của bạn</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          <button onClick={() => setTab('pick')}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'pick' ? 'text-orange-600 border-orange-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
            <MapPin className="w-4 h-4 inline mr-1.5" />Chọn trên bản đồ
          </button>
          {account && (
            <button onClick={() => setTab('saved')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'saved' ? 'text-orange-600 border-orange-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              <MapPin className="w-4 h-4 inline mr-1.5" />Địa điểm đã lưu ({savedLocs.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'pick' ? (
            <div className="p-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-orange-300">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input type="text" placeholder="Tìm địa điểm..." value={sq}
                    onChange={e => handleSearchInput(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent" />
                  {searching && <Loader className="w-4 h-4 text-gray-400 animate-spin" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <button key={i} onClick={() => handleSelectSearchResult(r)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-orange-50 border-b border-gray-50 last:border-0">
                        <span className="font-medium text-gray-800">{r.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Map */}
              <div className="h-72 rounded-xl overflow-hidden border border-gray-200">
                <MapContainer center={[pos.lat, pos.lng]} zoom={13} style={{ height: '100%', width: '100%' }}
                  key={`${pos.lat}-${pos.lng}`}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <DraggableMarker position={[pos.lat, pos.lng]} onMove={handleMove} />
                </MapContainer>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={handleGetLocation} disabled={locating}
                  className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-100 transition-all disabled:opacity-50">
                  <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                  {locating ? 'Đang lấy...' : 'Lấy vị trí hiện tại'}
                </button>
                <button onClick={() => handleMove(10.8231, 106.6297)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
                  Mặc định (TP.HCM)
                </button>
              </div>

              {/* Address + Save */}
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500">TOẠ ĐỘ</p>
                    <p className="text-sm font-medium text-gray-800">{pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}</p>
                    {address && <p className="text-xs text-gray-500 mt-1 truncate">{address}</p>}
                  </div>
                  {account && !isCurrentSaved && (
                    <button onClick={handleSaveCurrent} disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-all shrink-0 mt-0.5">
                      {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
                      Lưu
                    </button>
                  )}
                  {account && isCurrentSaved && (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />Đã lưu
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {savedLocs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Chưa có địa điểm nào được lưu.</p>
              ) : (
                sortedSaved.map(loc => (
                  <div key={loc.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group"
                    onClick={() => handleSelectSaved(loc)}>
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{loc.name}</p>
                      {loc.address && <p className="text-xs text-gray-500 truncate">{loc.address}</p>}
                      <p className="text-[10px] text-gray-400">{Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDelete(loc.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">
            Huỷ
          </button>
          <button onClick={() => onConfirm({ lat: pos.lat, lng: pos.lng, address })}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all">
            <Check className="w-4 h-4" /> Xác nhận vị trí
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
