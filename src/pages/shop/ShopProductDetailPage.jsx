import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, ShoppingBasket, Star, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ShopLayout from '../../components/shop/ShopLayout';
import { formatVnd, getCurrentUserId, resolveProductPrice, shopApi } from '../../api/shop';

export default function ShopProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    shopApi.getProductBySlug(slug)
      .then(setProduct)
      .catch((err) => setError(err.response?.data?.message || 'Không tìm thấy sản phẩm.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = async () => {
    await shopApi.addCartItem({ userId: getCurrentUserId(), productId: product.id, quantity });
    alert('Đã thêm sản phẩm vào giỏ hàng!');
  };

  return (
    <ShopLayout>
      <main className="max-w-7xl mx-auto px-4 py-10">
        <Link to="/shop/category" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 font-black text-sm mb-8"><ArrowLeft className="w-4 h-4" /> Quay lại cửa hàng</Link>
        {loading && <div className="text-center py-24 font-black text-gray-400">Đang tải...</div>}
        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 font-bold">{error}</div>}
        {product && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white rounded-[3rem] border border-orange-100 p-5 shadow-sm">
              <img src={product.mainImageUrl || 'https://placehold.co/700x600/FFF5F0/FF8A5B?text=PetGo'} alt={product.name} className="w-full aspect-square object-cover rounded-[2.4rem]" />
            </div>
            <div className="bg-white rounded-[3rem] border border-orange-100 p-7 md:p-10 shadow-sm space-y-6">
              <div>
                <div className="text-xs font-black text-orange-600 uppercase tracking-widest mb-2">{product.categoryName || 'PetGo Store'}</div>
                <h1 className="text-4xl font-black tracking-tight text-gray-950 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-2 text-sm mt-4 font-bold text-amber-500"><Star className="w-4 h-4 fill-current" /> {Number(product.averageRating || 0).toFixed(1)} <span className="text-gray-400">({product.totalReviews || 0} đánh giá)</span></div>
              </div>
              <div className="flex items-end gap-3">
                <div className="text-4xl font-black text-orange-600">{formatVnd(resolveProductPrice(product))}</div>
                {product.salePriceAmount && <div className="text-lg font-bold text-gray-400 line-through">{formatVnd(product.priceAmount)}</div>}
              </div>
              <p className="text-gray-600 font-medium leading-8">{product.description || product.shortDescription || 'Sản phẩm chất lượng dành cho thú cưng.'}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-orange-50 rounded-2xl p-4"><div className="text-gray-400 font-black uppercase text-[10px]">Loài phù hợp</div><div className="font-black text-gray-900">{product.targetSpecies}</div></div>
                <div className="bg-orange-50 rounded-2xl p-4"><div className="text-gray-400 font-black uppercase text-[10px]">Tồn kho</div><div className="font-black text-gray-900">{product.stockQuantity || 0} sản phẩm</div></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 font-black">-</button>
                  <span className="px-4 py-3 font-black">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 font-black">+</button>
                </div>
                <button onClick={addToCart} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"><ShoppingBasket className="w-5 h-5" /> Thêm vào giỏ</button>
                <button className="p-4 bg-pink-50 text-pink-500 rounded-2xl"><Heart className="w-5 h-5" /></button>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 text-emerald-800 font-bold"><Truck className="w-5 h-5 mt-0.5" /> Giao hàng 1-3 ngày, hỗ trợ thanh toán COD, MOMO, VNPAY, chuyển khoản.</div>
            </div>
          </div>
        )}
      </main>
    </ShopLayout>
  );
}
