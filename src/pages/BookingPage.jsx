import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCreateContext, getAvailabilityDates, getAvailabilitySlots, calculateShippingFee, createBooking, getUserLocations } from '../api/areas';
import { getPublicServiceById, getServiceAreas } from '../api/services';
import { getAdminErrorMessage } from '../components/admin/AdminFeedback';
import { toast } from 'react-hot-toast';
import LocationPicker from '../components/LocationPicker';
import { AuthContext } from '../context/AuthContext';
import {
  MapPin, Clock, Sparkles, Calendar, Truck, Check, Search, Plus,
  Sunrise, Sun, Moon, Wallet, AlertCircle, FileText, Info, Phone,
  Scissors, HelpCircle, Bookmark
} from 'lucide-react';

const formatPrice = (amount) => {
  if (amount == null) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const SectionBlocker = ({ message }) => (
  <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-sm font-bold text-gray-400">
    <HelpCircle className="w-4 h-4 shrink-0" />
    <span>{message}</span>
  </div>
);

const SectionHeader = ({ icon: Icon, title, note }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h2 className="text-lg font-black text-gray-900">{title}</h2>
      {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
    </div>
  </div>
);

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { account } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [context, setContext] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pickupPos, setPickupPos] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [useDefaultPickup, setUseDefaultPickup] = useState(true);
  const [shippingFee, setShippingFee] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);

  const [serviceAreas, setServiceAreas] = useState([]);
  const [serviceAreasLoading, setServiceAreasLoading] = useState(false);

  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [savedLocations, setSavedLocations] = useState([]);
  const [savedLocationsLoading, setSavedLocationsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const ctx = await getCreateContext(null);
        setContext(ctx);
        const sid = searchParams.get('serviceId');
        if (sid && ctx?.services) {
          let match = ctx.services.find(s => s.id === Number(sid));
          if (match) {
            if (!match.priceTiers || !match.priceTiers.length) {
              try {
                const full = await getPublicServiceById(sid);
                match = { ...match, ...full };
              } catch {}
            }
            setSelectedService(match);
          }
        }
      } catch (e) {
        toast.error(getAdminErrorMessage(e, 'Không tải được thông tin.'), { duration: 4000 });
      } finally { setLoading(false); }
    };
    load();
  }, []);

  // When service changes, fetch areas that have this service
  useEffect(() => {
    if (!selectedService) { setServiceAreas([]); return; }
    setServiceAreasLoading(true);
    setSelectedArea(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setPickupPos(null);
    setShippingFee(null);
    setUseDefaultPickup(true);
    setAvailableDates([]);
    setAvailableSlots([]);
    getServiceAreas(selectedService.id)
      .then(data => setServiceAreas(Array.isArray(data) ? data : []))
      .catch(() => setServiceAreas([]))
      .finally(() => setServiceAreasLoading(false));
  }, [selectedService]);

  // Auto-select area + pickup location from URL params
  const urlInitRef = useRef(false);
  useEffect(() => {
    if (urlInitRef.current || serviceAreas.length === 0) return;
    const aid = searchParams.get('areaId');
    if (!aid) return;

    const match = serviceAreas.find(a => a.id === Number(aid));
    if (!match) return;

    urlInitRef.current = true;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const hasUrlPickup = lat && lng;
    const pLat = hasUrlPickup ? Number(lat) : null;
    const pLng = hasUrlPickup ? Number(lng) : null;

    setSelectedArea(match);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableDates([]);
    setAvailableSlots([]);

    if (hasUrlPickup) {
      setUseDefaultPickup(false);
      setPickupPos([pLat, pLng]);
      setFeeLoading(true);
      Promise.all([
        getCreateContext(match.id),
        calculateShippingFee({ areaId: match.id, pickupLatitude: pLat, pickupLongitude: pLng }),
      ])
        .then(([ctx, fee]) => { setContext(ctx); setShippingFee(fee); })
        .catch(() => { /* keep existing context */ })
        .finally(() => setFeeLoading(false));
    } else {
      setPickupPos(null);
      setShippingFee(null);
      setUseDefaultPickup(true);
      setContextLoading(true);
      getCreateContext(match.id)
        .then(ctx => setContext(ctx))
        .catch(() => { /* keep existing */ })
        .finally(() => setContextLoading(false));
    }
  }, [searchParams, serviceAreas]);

  const pets = context?.pets || [];
  const walletBalance = context?.walletBalance || 0;

  const filteredAreas = useMemo(() => {
    if (!areaSearchQuery.trim()) return serviceAreas;
    const q = areaSearchQuery.toLowerCase();
    return serviceAreas.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.pickupAddress && a.pickupAddress.toLowerCase().includes(q))
    );
  }, [serviceAreas, areaSearchQuery]);

  const handleAreaSelect = async (area) => {
    setSelectedArea(area);
    setSelectedDate(null);
    setSelectedSlot(null);
    setPickupPos(null);
    setShippingFee(null);
    setUseDefaultPickup(true);
    setContextLoading(true);
    try {
      const ctx = await getCreateContext(area.id);
      setContext(ctx);
    } catch (e) { /* keep existing */ } finally { setContextLoading(false); }
  };

  const loadDates = useCallback(async () => {
    if (!selectedArea || !selectedService) return;
    setDatesLoading(true);
    try {
      const data = await getAvailabilityDates({ areaId: selectedArea.id, serviceId: selectedService.id, days: 30 });
      setAvailableDates(Array.isArray(data) ? data : []);
    } catch { setAvailableDates([]); } finally { setDatesLoading(false); }
  }, [selectedArea, selectedService]);

  useEffect(() => {
    if (selectedArea && selectedService) {
      loadDates();
      setSelectedDate(null);
      setSelectedSlot(null);
      setAvailableSlots([]);
    }
  }, [selectedArea, selectedService, loadDates]);

  const loadSlots = useCallback(async () => {
    if (!selectedArea || !selectedService || !selectedDate) return;
    setSlotsLoading(true);
    try {
      const data = await getAvailabilitySlots({ areaId: selectedArea.id, serviceId: selectedService.id, date: selectedDate });
      setAvailableSlots(Array.isArray(data) ? data : []);
    } catch { setAvailableSlots([]); } finally { setSlotsLoading(false); }
  }, [selectedArea, selectedService, selectedDate]);

  useEffect(() => {
    if (selectedDate) { loadSlots(); setSelectedSlot(null); }
  }, [selectedDate, loadSlots]);

  const groupedSlots = useMemo(() => {
    const morning = [], afternoon = [], evening = [];
    availableSlots.forEach(s => {
      if (s.status !== 'AVAILABLE') return;
      const hour = parseInt(s.startTime.split(':')[0], 10);
      if (hour < 12) morning.push(s);
      else if (hour < 18) afternoon.push(s);
      else evening.push(s);
    });
    return { morning, afternoon, evening };
  }, [availableSlots]);

  const calcShippingFee = async (lat, lng) => {
    if (!selectedArea) return;
    setFeeLoading(true);
    try {
      const data = await calculateShippingFee({ areaId: selectedArea.id, pickupLatitude: lat, pickupLongitude: lng });
      setShippingFee(data);
    } catch { setShippingFee(null); } finally { setFeeLoading(false); }
  };

  useEffect(() => {
    const hasUrlPickup = searchParams.get('lat') && searchParams.get('lng');
    if (hasUrlPickup) return;
    if (selectedArea?.pickupLatitude && selectedArea?.pickupLongitude && useDefaultPickup && !pickupPos) {
      const lat = Number(selectedArea.pickupLatitude);
      const lng = Number(selectedArea.pickupLongitude);
      setPickupPos([lat, lng]);
      setPickupAddress(selectedArea.pickupAddress || '');
      calcShippingFee(lat, lng);
    }
  }, [selectedArea, useDefaultPickup, searchParams]);

  const handleLocationChange = useCallback((lat, lng) => {
    setPickupPos([lat, lng]);
    calcShippingFee(lat, lng);
  }, [selectedArea]);

  useEffect(() => {
    if (!account || useDefaultPickup) {
      setSavedLocations([]);
      return;
    }
    setSavedLocationsLoading(true);
    getUserLocations()
      .then(data => setSavedLocations(Array.isArray(data) ? data : []))
      .catch(() => setSavedLocations([]))
      .finally(() => setSavedLocationsLoading(false));
  }, [account, useDefaultPickup]);

  const isSavedLocationSelected = useCallback((loc) => {
    if (!pickupPos) return false;
    const EPS = 0.0001;
    return Math.abs(pickupPos[0] - Number(loc.latitude)) < EPS
      && Math.abs(pickupPos[1] - Number(loc.longitude)) < EPS;
  }, [pickupPos]);

  const handleSelectSavedLocation = useCallback((loc) => {
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    setPickupAddress(loc.address || '');
    handleLocationChange(lat, lng);
  }, [handleLocationChange]);

  useEffect(() => {
    if (!pickupPos) return;
    const lat = pickupPos[0], lng = pickupPos[1];
    const fetchAddr = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`,
          { headers: { 'User-Agent': 'PetGo/1.0' } }
        );
        const data = await res.json();
        if (data.display_name) setPickupAddress(data.display_name);
      } catch { }
    };
    fetchAddr();
  }, [pickupPos]);

  const servicePrice = useMemo(() => {
    if (!selectedService) return 0;
    if (!selectedService.priceTiers?.length)
      return Number(selectedService.basePriceAmount) || 0;

    const species = selectedPet?.species;
    if (!species)
      return Math.min(...selectedService.priceTiers.map(t => Number(t.priceAmount)));

    const weight = Number(selectedPet?.weightKg) || 0;

    for (const tier of selectedService.priceTiers) {
      const ts = tier.species;
      if (ts !== 'ALL' && ts !== species) continue;
      if (weight >= Number(tier.weightFrom) && weight <= Number(tier.weightTo))
        return Number(tier.priceAmount);
      if (Number(tier.weightTo) >= 200 && weight >= Number(tier.weightFrom))
        return Number(tier.priceAmount);
    }

    const last = selectedService.priceTiers[selectedService.priceTiers.length - 1];
    return Number(last.priceAmount);
  }, [selectedService, selectedPet]);

  const totalAmount = useMemo(() => {
    return servicePrice + (shippingFee?.shippingFee ? Number(shippingFee.shippingFee) : 0);
  }, [servicePrice, shippingFee]);

  const canSubmit = !!(selectedArea && selectedService && selectedPet && selectedDate && selectedSlot);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createBooking({
        petId: selectedPet.id,
        areaId: selectedArea.id,
        serviceId: selectedService.id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        pickupLatitude: pickupPos ? pickupPos[0] : null,
        pickupLongitude: pickupPos ? pickupPos[1] : null,
        pickupAddress: pickupAddress || null,
        promoCode: promoCode.trim() || null,
        customerNote: customerNote.trim() || null,
      });
      toast.success('Đặt lịch thành công! Đơn đặt lịch của bạn đang chờ xác nhận.', { duration: 4000 });
      navigate('/my-bookings');
    } catch (e) {
      toast.error(getAdminErrorMessage(e, 'Không thể đặt lịch. Vui lòng thử lại.'), { duration: 4000 });
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-orange-100/30">
        <div className="text-center p-8 bg-white/60 backdrop-blur-md rounded-3xl border border-orange-100 shadow-xl">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl">🐾</span></div>
          </div>
          <p className="text-gray-800 font-black text-xl tracking-tight">PetGo đang chuẩn bị...</p>
          <p className="text-gray-500 text-sm mt-2">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-orange-100/10 pb-12 font-sans antialiased text-gray-900">
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white shadow-lg">
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[10%] w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,#fff_1px,transparent_1px)] bg-[length:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Đặt lịch dịch vụ</h1>
              <p className="text-orange-100 text-sm mt-1 font-medium">Điền thông tin bên dưới để đặt lịch chăm sóc thú cưng</p>
            </div>
            <div className="flex items-center gap-4 self-start md:self-auto bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
              <Wallet className="w-7 h-7 text-amber-300 shrink-0" />
              <div>
                <div className="text-[10px] font-black uppercase text-orange-200 tracking-wider">Số dư ví</div>
                <div className="text-lg font-black text-white">{formatPrice(walletBalance)}₫</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 space-y-6">
            {/* ═══ 1. Dịch vụ ═══ */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-500/5 p-5 sm:p-7">
              <SectionHeader icon={Sparkles} title="Dịch vụ" note={selectedService ? 'Dịch vụ đã chọn' : 'Quay lại trang dịch vụ để chọn'} />
              {selectedService ? (
                <div className="p-4 rounded-2xl border-2 border-orange-500 bg-orange-50/30 shadow-md shadow-orange-100/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {selectedService.imageUrl ? (
                        <img src={selectedService.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-orange-100" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                          {selectedService.bookingType === 'LONG' ? <Scissors className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-extrabold text-gray-900">{selectedService.name}</div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="text-base font-black text-orange-600">
                            {selectedService.priceTiers?.length > 0
                              ? `từ ${formatPrice(Math.min(...selectedService.priceTiers.map(t => Number(t.priceAmount))))}₫`
                              : `${formatPrice(selectedService.basePriceAmount)}₫`}
                          </span>
                          <span className="text-xs text-gray-400 font-bold flex items-center gap-0.5"><Clock className="w-3 h-3" />{selectedService.defaultDurationMinutes} phút</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${selectedService.bookingType === 'LONG' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                            {selectedService.bookingType === 'LONG' ? 'Dài hạn' : 'Ngắn hạn'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => navigate('/services')}
                      className="shrink-0 px-3 py-1.5 text-xs font-extrabold text-orange-600 bg-orange-100 hover:bg-orange-200 rounded-xl transition-colors">
                      Đổi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <span className="text-4xl mb-3 block">🔍</span>
                  <p className="text-gray-500 font-black text-sm mb-3">Chưa chọn dịch vụ</p>
                  <button onClick={() => navigate('/services')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition-all">
                    <Sparkles className="w-4 h-4" /> Chọn dịch vụ
                  </button>
                </div>
              )}
            </div>

            {/* ═══ 2. Khu vực ═══ */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-500/5 p-5 sm:p-7">
              <SectionHeader icon={MapPin} title="Khu vực" note="Chọn khu vực có dịch vụ này và còn slot trống" />
              {!selectedService ? (
                <SectionBlocker message="Vui lòng chọn dịch vụ trước" />
              ) : serviceAreasLoading ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-500 font-bold text-sm">Đang tải khu vực...</p>
                </div>
              ) : (
                <>
                  <div className="relative w-full max-w-sm mb-4">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Tìm khu vực..."
                      value={areaSearchQuery} onChange={(e) => setAreaSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 hover:bg-gray-100/70 focus:bg-white border-2 border-gray-100 focus:border-orange-500 rounded-xl focus:outline-none font-bold transition-all" />
                  </div>
                  {filteredAreas.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                      <span className="text-4xl mb-3 block">🗺️</span>
                      <p className="text-gray-500 font-black text-sm">Không tìm thấy khu vực nào hỗ trợ dịch vụ này.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredAreas.map((a) => {
                        const sel = selectedArea?.id === a.id;
                        return (
                          <div key={a.id} onClick={() => handleAreaSelect(a)}
                            className={`relative p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 group min-w-0 ${sel ? 'border-orange-500 bg-orange-50/30 shadow-md shadow-orange-100/50' : 'border-gray-100 bg-white hover:border-orange-200 hover:shadow-md'}`}>
                            {sel && <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow"><Check className="text-white w-3 h-3 stroke-[3px]" /></div>}
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sel ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 pr-4">
                                <div className="font-extrabold text-gray-900">{a.name}</div>
                                {a.pickupAddress && <div className="text-xs text-gray-500 mt-0.5 flex items-start gap-1"><span className="text-[10px] mt-0.5">📍</span><span>{a.pickupAddress}</span></div>}
                                {a.pickupPhone && <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 font-semibold"><Phone className="w-3 h-3 shrink-0" />{a.pickupPhone}</div>}
                                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100/70 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-1">
                                    <span>🟢</span> Ngắn: {a.shortSlots ?? 10}
                                  </span>
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1">
                                    <span>🔵</span> Dài: {a.longSlots ?? 3}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ═══ 3. Thú cưng ═══ */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-500/5 p-5 sm:p-7">
              <SectionHeader icon={Sparkles} title="Thú cưng" note="Chọn thú cưng cho lịch hẹn này" />
              {pets.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-orange-100 rounded-2xl bg-orange-50/10">
                  <div className="text-3xl mb-2">🐶</div>
                  <p className="text-gray-600 font-black text-sm mb-1">Bạn chưa thêm hồ sơ thú cưng nào</p>
                  <button onClick={() => navigate('/add-pet')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition-all mt-2">
                    <Plus className="w-4 h-4" /> Thêm ngay
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {pets.map((p) => {
                    const sel = selectedPet?.id === p.id;
                    return (
                      <div key={p.id} onClick={() => setSelectedPet(p)}
                        className={`relative p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 group min-w-0 ${sel ? 'border-orange-500 bg-orange-50/30 shadow-md shadow-orange-100/50' : 'border-gray-100 bg-white hover:border-orange-200 hover:shadow-md'}`}>
                        {sel && <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow"><Check className="text-white w-3 h-3 stroke-[3px]" /></div>}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100/50 border border-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🐕</span>}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900 text-sm">{p.name}</div>
                            <div className="text-xs text-gray-500 font-semibold mt-0.5">{p.breed || 'Chưa rõ giống'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ═══ 4. Ngày & Giờ ═══ */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-500/5 p-5 sm:p-7">
              <SectionHeader icon={Calendar} title="Ngày & giờ" note="Chọn thời gian phù hợp cho lịch hẹn" />
              {!selectedArea ? (
                <SectionBlocker message="Vui lòng chọn dịch vụ và khu vực trước" />
              ) : datesLoading ? (
                <div className="text-center py-10"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-gray-500 font-bold text-sm">Đang tải lịch trống...</p></div>
              ) : (
                <>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span>CHỌN NGÀY (30 ngày tới)</span>
                    <span className="h-0.5 flex-1 bg-gray-100" />
                  </h3>
                  <div className="flex gap-2.5 overflow-x-auto pb-4 mb-6 scrollbar-thin scroll-smooth">
                    {availableDates.filter(d => d.status === 'AVAILABLE').length === 0 ? (
                      <p className="text-gray-400 text-sm py-6 w-full text-center font-bold bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">Không có ngày khả dụng trong 30 ngày tới.</p>
                    ) : (
                      availableDates.filter(d => d.status === 'AVAILABLE').map((d) => {
                        const dateObj = new Date(d.date + 'T00:00:00');
                        const dayName = dateObj.toLocaleDateString('vi-VN', { weekday: 'short' });
                        const dayNum = dateObj.getDate();
                        const month = dateObj.getMonth() + 1;
                        const isSelected = selectedDate === d.date;
                        return (
                          <button key={d.date} onClick={() => setSelectedDate(d.date)}
                            className={`shrink-0 w-18 md:w-22 py-3.5 rounded-2xl border-2 font-black transition-all flex flex-col items-center ${isSelected ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200' : 'border-gray-100 bg-white hover:border-orange-200 text-gray-700 hover:text-orange-600'}`}>
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>{dayName}</span>
                            <span className="text-lg md:text-xl font-extrabold my-1">{dayNum}</span>
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>T{month}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {selectedDate && (
                    <>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span>CHỌN KHUNG GIỜ</span>
                        <span className="h-0.5 flex-1 bg-gray-100" />
                      </h3>
                      {slotsLoading ? (
                        <div className="text-center py-8"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                      ) : availableSlots.filter(s => s.status === 'AVAILABLE').length === 0 ? (
                        <p className="text-gray-400 text-sm py-6 text-center font-bold bg-gray-50 rounded-2xl">Ngày này đã hết khung giờ trống.</p>
                      ) : (
                        <div className="space-y-5">
                          {[{ key: 'morning', label: 'Sáng', icon: Sunrise, color: 'text-amber-600', data: groupedSlots.morning },
                          { key: 'afternoon', label: 'Chiều', icon: Sun, color: 'text-orange-600', data: groupedSlots.afternoon },
                          { key: 'evening', label: 'Tối', icon: Moon, color: 'text-purple-700', data: groupedSlots.evening },
                          ].map(g => g.data.length > 0 && (
                            <div key={g.key}>
                              <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-2.5 ${g.color}`}>
                                <g.icon className="w-4 h-4" /><span>{g.label} ({g.data.length})</span>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                {g.data.map(s => (
                                  <button key={s.startTime} onClick={() => setSelectedSlot(s)}
                                    className={`py-2 rounded-xl border-2 text-sm font-extrabold transition-all ${selectedSlot?.startTime === s.startTime ? 'border-orange-500 bg-orange-500 text-white shadow' : 'border-gray-100 bg-white hover:border-orange-200 text-gray-600 hover:text-orange-600'}`}>
                                    {s.startTime}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* ═══ 5. Vị trí đón ═══ */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-500/5 p-5 sm:p-7">
              <SectionHeader icon={Truck} title="Vị trí đón" note="Chọn đón tại điểm hẹn hoặc yêu cầu đón tận nơi" />
              {!selectedArea ? (
                <SectionBlocker message="Vui lòng chọn dịch vụ và khu vực trước" />
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4 mb-5">
                    <label className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col ${useDefaultPickup ? 'border-orange-500 bg-orange-50/20 shadow-md' : 'border-gray-100 bg-white hover:border-orange-200'}`}>
                      <input type="radio" name="pickupMode" className="sr-only" checked={useDefaultPickup}
                        onChange={() => {
                          setUseDefaultPickup(true);
                          if (selectedArea?.pickupLatitude && selectedArea?.pickupLongitude) {
                            const lat = Number(selectedArea.pickupLatitude);
                            const lng = Number(selectedArea.pickupLongitude);
                            setPickupPos([lat, lng]);
                            setPickupAddress(selectedArea.pickupAddress || '');
                            calcShippingFee(lat, lng);
                          }
                        }} />
                      {useDefaultPickup && <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow"><Check className="text-white w-3 h-3 stroke-[3px]" /></div>}
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${useDefaultPickup ? 'bg-orange-500 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="pr-4">
                          <div className="font-extrabold text-gray-900 text-sm">Đón tại điểm hẹn</div>
                          <p className="text-xs text-gray-500 mt-0.5">{selectedArea?.pickupAddress || 'Địa chỉ mặc định'}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-gray-100/50 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Phí ship</span>
                        <span className="text-xs font-black text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full">Miễn phí</span>
                      </div>
                    </label>
                    <label className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col ${!useDefaultPickup ? 'border-orange-500 bg-orange-50/20 shadow-md' : 'border-gray-100 bg-white hover:border-orange-200'}`}>
                      <input type="radio" name="pickupMode" className="sr-only" checked={!useDefaultPickup}
                        onChange={() => { setUseDefaultPickup(false); setPickupPos(null); setShippingFee(null); }} />
                      {!useDefaultPickup && <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow"><Check className="text-white w-3 h-3 stroke-[3px]" /></div>}
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!useDefaultPickup ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="pr-4">
                          <div className="font-extrabold text-gray-900 text-sm">Vị trí khác</div>
                          <p className="text-xs text-gray-500 mt-0.5">Tài xế PetGo đến đón tại vị trí bạn chọn</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-gray-100/50 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Phí ship</span>
                        <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Tính theo km</span>
                      </div>
                    </label>
                  </div>
                  {useDefaultPickup ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-md">
                        <LocationPicker
                          initialLat={selectedArea?.pickupLatitude ? Number(selectedArea.pickupLatitude) : 10.8231}
                          initialLng={selectedArea?.pickupLongitude ? Number(selectedArea.pickupLongitude) : 106.6297}
                          pickupLat={selectedArea?.pickupLatitude ? Number(selectedArea.pickupLatitude) : null}
                          pickupLng={selectedArea?.pickupLongitude ? Number(selectedArea.pickupLongitude) : null}
                          pickupLabel={selectedArea?.pickupAddress || 'Điểm đón'}
                          onLocationChange={() => { }}
                          height={260} searchEnabled={false} draggable={false} showDistance={false} />
                      </div>
                      <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-500 text-white rounded-lg"><Check className="w-4 h-4 stroke-[3px]" /></div>
                        <div><div className="font-extrabold text-emerald-800 text-sm">Điểm hẹn cố định</div><div className="text-xs text-emerald-700">Miễn phí ship</div></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-100 text-orange-700 flex items-start gap-2 text-xs font-semibold">
                        <Info className="w-4 h-4 shrink-0 text-orange-500 mt-0.5" /><div>Kéo thả marker trên bản đồ để chọn vị trí đón hoặc chọn vị trí bạn đã lưu.</div>
                      </div>
                      {account && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Bookmark className="w-4 h-4 text-orange-500" />
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Vị trí đã lưu</h3>
                          </div>
                          {savedLocationsLoading ? (
                            <div className="py-4 text-center text-xs font-bold text-gray-400">Đang tải vị trí đã lưu...</div>
                          ) : savedLocations.length === 0 ? (
                            <div className="py-3 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs font-semibold text-gray-400 text-center">
                              Chưa có vị trí nào được lưu. Bạn có thể lưu vị trí khi chọn trên trang Dịch vụ.
                            </div>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {savedLocations.map((loc) => {
                                const selected = isSavedLocationSelected(loc);
                                return (
                                  <button
                                    key={loc.id}
                                    type="button"
                                    onClick={() => handleSelectSavedLocation(loc)}
                                    className={`text-left p-3 rounded-2xl border-2 transition-all flex items-start gap-3 ${selected ? 'border-orange-500 bg-orange-50/30 shadow-md shadow-orange-100/50' : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/20'}`}
                                  >
                                    <div className={`p-2 rounded-lg shrink-0 ${selected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                      <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-extrabold text-gray-900 truncate">{loc.name}</div>
                                      {loc.address && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{loc.address}</div>}
                                    </div>
                                    {selected && (
                                      <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                                        <Check className="text-white w-3 h-3 stroke-[3px]" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="rounded-2xl overflow-hidden border border-gray-200/80 shadow-md">
                        <LocationPicker
                          key={`custom-${pickupPos?.[0]}-${pickupPos?.[1]}`}
                          initialLat={pickupPos?.[0] ?? (selectedArea?.pickupLatitude ? Number(selectedArea.pickupLatitude) : 10.8231)}
                          initialLng={pickupPos?.[1] ?? (selectedArea?.pickupLongitude ? Number(selectedArea.pickupLongitude) : 106.6297)}
                          pickupLat={selectedArea?.pickupLatitude ? Number(selectedArea.pickupLatitude) : null}
                          pickupLng={selectedArea?.pickupLongitude ? Number(selectedArea.pickupLongitude) : null}
                          pickupLabel={selectedArea?.pickupAddress || 'Trụ sở'}
                          onLocationChange={handleLocationChange}
                          height={300} searchEnabled={true} draggable={true} showDistance={true} />
                      </div>
                      {feeLoading && (
                        <div className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-100 flex items-center gap-3">
                          <div className="w-5 h-5 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" /><span className="text-xs font-extrabold text-orange-700">Đang tính phí ship...</span>
                        </div>
                      )}
                      {shippingFee && !feeLoading && (
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Khoảng cách</span>
                            <div className="text-sm font-extrabold text-gray-800">{Number(shippingFee.distanceKm).toFixed(2)} km</div>
                          </div>
                          <div className="sm:text-right">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Phí ship</span>
                            <div className="text-xl font-black text-orange-600">{formatPrice(shippingFee.shippingFee)}₫</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ═══ 6. Ghi chú & Mã giảm giá ═══ */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-500/5 p-5 sm:p-7">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Mã khuyến mãi</label>
                  <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Nhập mã ưu đãi..."
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:border-orange-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Ghi chú</label>
                  <textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Lưu ý về thú cưng, cách bồng bế..."
                    rows={1}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:border-orange-500 transition-all resize-none" />
                </div>
              </div>
            </div>

            {/* ═══ 7. Nút đặt lịch ═══ */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-orange-500/5 p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-gray-600">
                    {canSubmit ? 'Bạn đã điền đầy đủ thông tin' : (
                      <span className="text-amber-600 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Thiếu: {!selectedService && 'dịch vụ '}{!selectedArea && 'khu vực '}{!selectedPet && 'thú cưng '}{!selectedDate && 'ngày '}{!selectedSlot && 'giờ'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">Kiểm tra kỹ thông tin trước khi đặt lịch</div>
                </div>
                <button onClick={handleSubmit} disabled={!canSubmit || submitting || walletBalance < totalAmount}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm text-white transition-all flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Đang xử lý...</span></> : <><Check className="w-4 h-4 stroke-[3px]" /><span>Đặt lịch ngay</span></>}
                </button>
              </div>
              {walletBalance < totalAmount && (
                <div className="mt-4 p-4 bg-red-50/40 rounded-2xl border border-red-100 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="text-xs font-bold text-red-700 flex-1">Số dư không đủ. Bạn cần thêm {formatPrice(totalAmount - walletBalance)}₫.</div>
                  <button onClick={() => navigate('/wallet')} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl">Nạp tiền</button>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 border-b border-dashed border-gray-200">
                <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-1.5">
                  <FileText className="w-4.5 h-4.5 text-orange-500" /> Chi tiết đơn hàng
                </h3>
              </div>
              <div className="p-5 space-y-3.5">
                <SidebarItem icon="🐾" title="Dịch vụ" value={selectedService?.name} empty="Chưa chọn dịch vụ" />
                <SidebarItem icon="📍" title="Khu vực" value={selectedArea?.name} empty={selectedService ? 'Chưa chọn khu vực' : null} />
                <SidebarItem icon="🐕" title="Thú cưng" value={selectedPet?.name} empty={selectedService ? 'Chưa chọn thú cưng' : null} />
                <SidebarItem icon="📅" title="Thời gian" value={selectedDate && selectedSlot ? `${new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })} ${selectedSlot.startTime}-${selectedSlot.endTime}` : null} empty={selectedPet ? 'Chưa chọn thời gian' : null} />
                {selectedService && (
                  <div className="pt-3.5 border-t border-dashed border-gray-200 space-y-2 text-xs font-semibold text-gray-600">
                    <div className="flex justify-between"><span>Phí dịch vụ</span><span className="text-gray-900 font-bold">{formatPrice(servicePrice)}₫</span></div>
                    <div className="flex justify-between"><span>Phí vận chuyển</span><span className="text-gray-900 font-bold">{shippingFee ? `${formatPrice(shippingFee.shippingFee)}₫` : '—'}</span></div>
                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-black">
                      <span className="text-gray-800">TỔNG CỘNG</span>
                      <span className="text-orange-600 text-lg font-black">{formatPrice(totalAmount)}₫</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scrollbar-thin::-webkit-scrollbar { height: 5px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #f1f1f1; border-radius: 99px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
}

const SidebarItem = ({ icon, title, value, empty }) => (
  value ? (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
      <span className="text-base">{icon}</span>
      <div className="min-w-0">
        <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{title}</div>
        <div className="font-extrabold text-gray-900 text-xs truncate mt-0.5">{value}</div>
      </div>
    </div>
  ) : empty && (
    <div className="text-center py-3 border border-dashed border-gray-200 rounded-2xl text-[11px] text-gray-400 font-semibold">
      {empty}
    </div>
  )
);
