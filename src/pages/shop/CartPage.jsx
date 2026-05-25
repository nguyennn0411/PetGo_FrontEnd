import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBasket, Trash2 } from 'lucide-react';
import ShopLayout from '../../components/shop/ShopLayout';
import { formatVnd, getCurrentUserId, shopApi } from '../../api/shop';

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], subtotalAmount: 0, shippingFeeAmount: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const load = async () => {
    setLoading(true);
    try { setCart(await shopApi.getCart(userId)); } catch { setCart({ items: [], subtotalAmount: 0, shippingFeeAmount: 0, totalAmount: 0 }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateQty = async (item, quantity) => {
    if (quantity < 1) return;
    await shopApi.updateCartItem(item.id, { quantity });
    load();
  };
  const remove = async (id) => { await shopApi.removeCartItem(id); load(); };

  return (
    <ShopLayout>
      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-gray-950 flex items-center gap-3"><ShoppingBasket className="text-orange-500" /> Giỏ hàng</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-7 mt-8">
          <section className="bg-white rounded-[3rem] border border-orange-100 shadow-sm p-5 md:p-7">
            {loading ? <div className="py-16 text-center font-black text-gray-400">Đang tải...</div> : cart.items?.length ? (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-[2rem] border border-orange-100 bg-orange-50/20">
                    <img src={item.productImageUrl || 'https://placehold.co/200x150/FFF5F0/FF8A5B?text=PetGo'} className="w-full sm:w-28 h-28 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <div className="font-black text-gray-900">{item.productName}</div>
                      <div className="text-orange-600 font-black mt-1">{formatVnd(item.unitPrice)}</div>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
                          <button onClick={() => updateQty(item, item.quantity - 1)} className="px-3 py-2 font-black">-</button>
                          <span className="px-4 py-2 font-black">{item.quantity}</span>
                          <button onClick={() => updateQty(item, item.quantity + 1)} className="px-3 py-2 font-black">+</button>
                        </div>
                        <button onClick={() => remove(item.id)} className="text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                    <div className="sm:text-right font-black text-gray-900">{formatVnd(item.lineTotal)}</div>
                  </div>
                ))}
              </div>
            ) : <div className="py-16 text-center"><div className="font-black text-gray-900 mb-2">Giỏ hàng đang trống</div><Link to="/shop/category" className="text-orange-600 font-black">Mua sắm ngay</Link></div>}
          </section>
          <aside className="bg-white rounded-[3rem] border border-orange-100 shadow-sm p-7 h-max space-y-5">
            <h2 className="font-black text-xl text-gray-950">Tóm tắt đơn hàng</h2>
            <div className="space-y-3 text-sm font-bold text-gray-600">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatVnd(cart.subtotalAmount)}</span></div>
              <div className="flex justify-between"><span>Phí giao hàng</span><span>{formatVnd(cart.shippingFeeAmount)}</span></div>
              <div className="flex justify-between text-lg font-black text-gray-950 border-t pt-4"><span>Tổng</span><span className="text-orange-600">{formatVnd(cart.totalAmount)}</span></div>
            </div>
            <button disabled={!cart.items?.length} onClick={() => navigate('/checkout')} className="w-full bg-orange-500 disabled:bg-gray-300 hover:bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Tiến hành thanh toán</button>
          </aside>
        </div>
      </main>
    </ShopLayout>
  );
}
