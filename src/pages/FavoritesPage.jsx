import { useContext, useEffect, useMemo, useState } from 'react';
import { Heart, Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserFavorites, toggleFavorite } from '../api/services';
import { AuthContext } from '../context/AuthContext';

const formatPrice = (amount) => {
  if (amount == null) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { account, loadingAccount } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingFav, setTogglingFav] = useState(null);

  useEffect(() => {
    if (loadingAccount) return;
    if (!account) { setLoading(false); return; }
    loadFavorites();
  }, [loadingAccount, account]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await getUserFavorites();
      setFavorites(Array.isArray(data) ? data : []);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (serviceId) => {
    setTogglingFav(serviceId);
    try {
      await toggleFavorite(serviceId);
      setFavorites((prev) => prev.filter((s) => s.id !== serviceId));
    } catch {
      // ignore
    } finally {
      setTogglingFav(null);
    }
  };

  if (loadingAccount || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-white text-center space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-3">Bạn chưa đăng nhập</h1>
            <p className="text-gray-500 font-medium">Đăng nhập để xem danh sách yêu thích.</p>
          </div>
          <button onClick={() => navigate('/login')} className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 transition-all flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" />
            Đi tới đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-black tracking-tight">Dịch vụ yêu thích</h1>
          <p className="mt-2 text-orange-100 font-medium">{favorites.length} dịch vụ</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {favorites.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((s) => (
              <div key={s.id}
                className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all group overflow-hidden">
                <div className="relative">
                  {s.imageUrl && (
                    <div style={{ width: '100%', height: 160, overflow: 'hidden' }}>
                      <img src={s.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(s.id); }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md transition-all z-10">
                    {togglingFav === s.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                    ) : (
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    )}
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${s.bookingType === 'LONG' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                      {s.bookingType === 'LONG' ? 'Dài hạn' : 'Ngắn hạn'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-gray-900 group-hover:text-orange-600 transition-colors leading-tight">{s.name}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(s.categories || []).slice(0, 3).map((c) => (
                      <span key={c.id} className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{c.name}</span>
                    ))}
                  </div>
                  {s.shortDescription && (
                    <p className="mt-3 text-xs font-medium text-gray-500 line-clamp-2 leading-relaxed">{s.shortDescription}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-gray-900">{formatPrice(s.basePriceAmount)}</span>
                      <span className="text-xs font-bold text-gray-400">₫</span>
                      <span className="text-[10px] font-bold text-gray-400 ml-1">/ {s.priceUnit === 'SESSION' ? '1 lần' : s.priceUnit}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{s.defaultDurationMinutes} phút</span>
                  </div>
                  <button onClick={() => navigate(`/booking?serviceId=${s.id}`)}
                    className="mt-4 w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all">
                    Đặt lịch
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">Chưa có dịch vụ yêu thích</h3>
            <p className="text-gray-500 font-medium mb-6">Khám phá và thêm dịch vụ yêu thích để đặt lịch nhanh hơn.</p>
            <button onClick={() => navigate('/services')}
              className="rounded-xl bg-gray-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-orange-500 transition-all">
              Khám phá dịch vụ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
