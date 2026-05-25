import React, { useEffect, useState } from 'react';
import { ClipboardList, Package } from 'lucide-react';
import ShopLayout from '../../components/shop/ShopLayout';
import { formatVnd, getCurrentUserId, shopApi } from '../../api/shop';

const statusLabels = { PENDING_PAYMENT: 'Chờ thanh toán', PAID: 'Đã thanh toán', PACKING: 'Đang chuẩn bị', SHIPPING: 'Đang giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', REFUNDED: 'Đã hoàn tiền' };

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { shopApi.getMyOrders(getCurrentUserId()).then(setOrders).finally(() => setLoading(false)); }, []);
  return (
    <ShopLayout>
      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-gray-950 flex items-center gap-3"><ClipboardList className="text-orange-500" /> Đơn hàng của tôi</h1>
        <div className="mt-8 space-y-5">
          {loading ? <div className="text-center py-20 font-black text-gray-400">Đang tải...</div> : orders.length ? orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2.5rem] border border-orange-100 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-50 pb-4">
                <div><div className="text-xs font-black uppercase tracking-widest text-gray-400">Mã đơn</div><div className="text-xl font-black text-gray-950">{order.orderCode}</div></div>
                <div className="px-4 py-2 rounded-full bg-orange-50 text-orange-600 font-black text-sm w-max">{statusLabels[order.status] || order.status}</div>
              </div>
              <div className="space-y-3 mt-4">
                {order.items?.map((item) => <div key={item.id} className="flex gap-3"><img src={item.productImageUrl || 'https://placehold.co/120x120'} className="w-16 h-16 rounded-2xl object-cover" /><div className="flex-1"><div className="font-black text-gray-900">{item.productName}</div><div className="text-gray-500 font-bold text-sm">x{item.quantity}</div></div><div className="font-black text-orange-600">{formatVnd(item.lineTotal)}</div></div>)}
              </div>
              <div className="flex justify-between items-center mt-5 pt-5 border-t border-orange-50"><div className="text-sm font-bold text-gray-500 flex items-center gap-2"><Package className="w-4 h-4" /> {order.paymentMethod}</div><div className="text-xl font-black text-gray-950">{formatVnd(order.totalAmount)}</div></div>
            </div>
          )) : <div className="bg-white rounded-[2.5rem] p-12 text-center border border-orange-100"><div className="font-black text-gray-900">Bạn chưa có đơn hàng shop.</div></div>}
        </div>
      </main>
    </ShopLayout>
  );
}
