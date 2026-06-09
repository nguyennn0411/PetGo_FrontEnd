import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Heart,
  Info,
  Loader2,
  MapPin,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getFavorites, removeFavoriteProvider } from '../api/favorites';
import { resolveUserId } from '../utils/userIdentity';

const getCurrentPosition = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { account } = useContext(AuthContext);
  const userId = useMemo(() => resolveUserId(account), [account]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coords, setCoords] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const loadData = async () => {
    if (!userId) {
      setError('Không xác định được tài khoản người dùng để tải danh sách yêu thích.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const position = await getCurrentPosition();
      setCoords(position);
      const data = await getFavorites(userId, position || {});
      setItems(data?.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách yêu thích.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleRemove = async (providerId) => {
    if (!userId) return;
    try {
      setRemovingId(providerId);
      await removeFavoriteProvider(userId, providerId);
      setItems((prev) => prev.filter((item) => item.providerId !== providerId));
    } catch (err) {
      window.alert(err?.response?.data?.message || 'Không thể xóa khỏi danh sách yêu thích.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">My Favorites</h1>
          </div>
          {!loading && !error && (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-gray-100">
              {items.length} địa điểm đã lưu{coords ? ' • đã tính khoảng cách' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-16 text-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900 mb-2">Đang tải danh sách yêu thích</h2>
            <p className="text-sm text-gray-500 font-medium">PetGo đang lấy các provider bạn đã lưu.</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[2rem] border border-red-100 shadow-sm p-10 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Không tải được danh sách yêu thích</h2>
            <p className="text-sm text-gray-500 font-medium mb-6">{error}</p>
            <button onClick={loadData} className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">
              Thử lại
            </button>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {items.map((item) => (
              <div key={item.providerId} className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col sm:flex-row">
                <div className="sm:w-56 h-56 sm:h-auto overflow-hidden relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <button
                    onClick={() => handleRemove(item.providerId)}
                    disabled={removingId === item.providerId}
                    className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur-md rounded-2xl text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    title="Xóa khỏi yêu thích"
                  >
                    {removingId === item.providerId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg uppercase tracking-wider">
                      {item.featuredService || 'Pet Service'}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 rounded-lg shrink-0">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                      <span className="text-xs font-black text-yellow-700">{item.rating || 0}</span>
                    </div>
                  </div>

                  <h3 onClick={() => navigate(`/providers/${item.providerId}`)} className="text-xl font-black text-gray-900 mb-2 leading-tight hover:text-orange-600 transition-colors cursor-pointer">
                    {item.name}
                  </h3>

                  <div className="flex items-start gap-2 text-sm text-gray-500 mb-3 leading-relaxed">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{item.address || 'Đang cập nhật địa chỉ'}</span>
                  </div>

                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">
                    {item.savedAt ? `Đã lưu lúc ${item.savedAt}` : 'Đã lưu vào danh sách yêu thích'}
                    {item.distance && item.distance !== '--' ? ` • ${item.distance}` : ''}
                  </div>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5 block">Giá từ</span>
                      <span className="text-xl font-black text-gray-900">{item.priceFromDisplay || 'Liên hệ'}</span>
                    </div>
                    <div className="flex gap-2 flex-1 justify-end">
                      <button
                        onClick={() => navigate(`/providers/${item.providerId}`)}
                        className="px-5 py-3 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px]"
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => navigate(`/booking?providerId=${item.providerId}`)}
                        className="px-6 py-3 bg-gray-900 text-white font-black rounded-2xl shadow-lg hover:bg-orange-500 transition-all uppercase tracking-widest text-[10px] flex items-center gap-2"
                      >
                        Đặt lịch ngay <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-gray-200 flex flex-col items-center">
            <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mb-8 relative">
              <Heart className="w-14 h-14 text-orange-200" />
              <div className="absolute -top-2 -right-2 bg-white p-3 rounded-full shadow-lg">
                <Search className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Chưa có địa điểm yêu thích</h3>
            <p className="text-gray-400 font-medium max-w-sm mb-10 leading-relaxed">
              Bạn chưa lưu provider nào vào backend. Hãy vào trang chi tiết provider rồi bấm tim để thêm vào danh sách yêu thích.
            </p>
            <button onClick={() => navigate('/search')} className="px-10 py-5 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-100 uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all">
              Explore Services <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default FavoritesPage;
