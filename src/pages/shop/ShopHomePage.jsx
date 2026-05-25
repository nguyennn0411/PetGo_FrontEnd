import React, { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Bone, PackageCheck, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ShopLayout from '../../components/shop/ShopLayout';
import ProductCard from '../../components/shop/ProductCard';
import { getCurrentUserId, shopApi } from '../../api/shop';

export default function ShopHomePage() {
  const [categories, setCategories] = useState([]);
  const [hotProducts, setHotProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cats, hot, featured] = await Promise.all([
          shopApi.getCategories(),
          shopApi.getProducts({ hot: true }),
          shopApi.getProducts({ featured: true }),
        ]);
        setCategories(cats || []);
        setHotProducts(hot || []);
        setFeaturedProducts(featured?.length ? featured : hot || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải dữ liệu cửa hàng từ backend. Hãy chạy Spring Boot ở cổng 8080.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addToCart = async (product) => {
    await shopApi.addCartItem({ userId: getCurrentUserId(), productId: product.id, quantity: 1 });
    alert('Đã thêm sản phẩm vào giỏ hàng!');
  };

  return (
    <ShopLayout>
      <main className="max-w-7xl mx-auto px-4 py-10 space-y-16">
        <section className="relative overflow-hidden bg-gradient-to-r from-orange-100 via-amber-50 to-mint-50 rounded-[3rem] p-8 md:p-14 flex flex-col lg:flex-row items-center gap-10 shadow-2xl shadow-orange-100/60">
          <div className="absolute -right-10 -top-10 text-[12rem] opacity-10 select-none">🐾</div>
          <div className="flex-1 relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-black text-orange-600 shadow-sm">
              <Bone className="w-4 h-4" /> PetGo Store - Cửa hàng thú cưng
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight text-gray-950">
              Đồ ăn, phụ kiện & chăm sóc cho <span className="text-orange-500">boss yêu</span>
            </h1>
            <p className="text-gray-600 text-lg font-medium max-w-2xl leading-8">Mua hạt, pate, đồ chơi, vòng cổ, sữa tắm và sản phẩm vệ sinh thú cưng ngay trên PetGo. Dữ liệu lấy trực tiếp từ API backend và DB MySQL của bạn.</p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/shop/category')} className="px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-200 flex items-center gap-2">Mua ngay <ArrowRight className="w-4 h-4" /></button>
              <button onClick={() => navigate('/cart')} className="px-8 py-4 rounded-2xl bg-white text-gray-900 font-black uppercase tracking-widest text-xs border border-orange-100 hover:border-orange-400">Xem giỏ hàng</button>
            </div>
          </div>
          <div className="flex-1 relative z-10">
            <img className="w-full max-w-md mx-auto rounded-full border-[12px] border-white object-cover aspect-square shadow-2xl" src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=700" alt="PetGo Store" />
          </div>
        </section>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 font-bold rounded-2xl p-4">{error}</div>}

        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-950 tracking-tight">Danh mục nổi bật</h2>
              <p className="text-gray-500 font-bold text-sm mt-1">Lấy từ bảng product_categories</p>
            </div>
            <Link to="/shop/category" className="font-black text-orange-600 text-sm flex items-center gap-1">Xem tất cả <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {(categories || []).slice(0, 8).map((category, index) => (
              <button key={category.id || index} onClick={() => navigate(`/shop/category?categoryId=${category.id}`)} className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl mb-4">{category.iconKey === 'ball' ? '🎾' : category.iconKey === 'collar' ? '🦮' : category.iconKey === 'soap' ? '🧴' : '🦴'}</div>
                <div className="font-black text-gray-900">{category.name}</div>
                <div className="text-xs font-bold text-gray-400 mt-1 line-clamp-2">{category.description || 'Sản phẩm PetGo Store'}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[3rem] p-6 md:p-9 border border-orange-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-950">🔥 Sản phẩm hot</h2>
              <p className="text-gray-500 font-bold text-sm">Lấy từ API /shop/products?hot=true</p>
            </div>
            <Link to="/shop/category" className="hidden sm:inline-flex text-orange-600 font-black text-sm">Xem cửa hàng</Link>
          </div>
          {loading ? <div className="text-center py-12 font-black text-gray-400">Đang tải...</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(hotProducts.length ? hotProducts : featuredProducts).slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-[2rem] p-7 border border-orange-100 flex gap-4 items-start"><Truck className="w-8 h-8 text-orange-500" /><div><h3 className="font-black text-gray-900">Giao hàng nhanh</h3><p className="text-sm text-gray-500 font-medium mt-1">Đóng gói an toàn cho mọi đơn shop.</p></div></div>
          <div className="bg-white rounded-[2rem] p-7 border border-orange-100 flex gap-4 items-start"><BadgeCheck className="w-8 h-8 text-emerald-500" /><div><h3 className="font-black text-gray-900">Sản phẩm chính hãng</h3><p className="text-sm text-gray-500 font-medium mt-1">Quản lý tồn kho, giá sale từ backend.</p></div></div>
          <div className="bg-white rounded-[2rem] p-7 border border-orange-100 flex gap-4 items-start"><PackageCheck className="w-8 h-8 text-blue-500" /><div><h3 className="font-black text-gray-900">Theo dõi đơn</h3><p className="text-sm text-gray-500 font-medium mt-1">Đơn hàng đồng bộ invoices và payments.</p></div></div>
        </section>
      </main>
    </ShopLayout>
  );
}
