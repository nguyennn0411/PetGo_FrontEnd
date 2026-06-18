import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Package, ChevronDown, Filter } from 'lucide-react';
import ShopLayout from '../../components/shop/ShopLayout';
import { formatVnd, getCurrentUserId, shopApi } from '../../api/shop';

const STATUS_CONFIG = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    dot: 'bg-yellow-400',
  },
  PAID: {
    label: 'Đã thanh toán',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  PACKING: {
    label: 'Đang chuẩn bị',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  SHIPPING: {
    label: 'Đang giao',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-400',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
};

const FILTER_OPTIONS = [
  { value: '', label: 'Tất cả đơn hàng' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'PACKING', label: 'Đang chuẩn bị' },
  { value: 'SHIPPING', label: 'Đang giao' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    shopApi.getMyOrders(getCurrentUserId()).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    filter ? orders.filter((o) => o.status === filter) : orders,
    [orders, filter]
  );

  const counts = useMemo(() => {
    const result = {};
    for (const o of orders) result[o.status] = (result[o.status] || 0) + 1;
    return result;
  }, [orders]);

  return (
    <ShopLayout>
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardList className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-black tracking-tight text-gray-950">Đơn hàng của tôi</h1>
        </div>
        <p className="text-sm text-gray-500 font-medium mb-8">Theo dõi trạng thái và lịch sử đặt hàng của bạn</p>

        {/* Filter combobox */}
        <div className="flex items-center gap-3 mb-7">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-black text-gray-700 outline-none focus:border-orange-400 cursor-pointer shadow-sm hover:border-orange-300 transition-colors"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value
                    ? `${STATUS_CONFIG[opt.value]?.label} (${counts[opt.value] || 0})`
                    : `Tất cả đơn hàng (${orders.length})`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="text-xs font-black text-orange-500 hover:text-orange-700 transition-colors"
            >
              Xóa lọc
            </button>
          )}
        </div>


        <div className="space-y-5">
          {loading ? (
            <div className="text-center py-20 font-black text-gray-400">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-orange-100">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <div className="font-black text-gray-900">
                {filter ? `Không có đơn hàng "${FILTER_OPTIONS.find(f => f.value === filter)?.label}"` : 'Bạn chưa có đơn hàng nào.'}
              </div>
            </div>
          ) : (
            filtered.map((order) => (
              <div key={order.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Order header */}
                <div className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${STATUS_CONFIG[order.status]?.bg || 'bg-gray-50'} border-opacity-50`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mã đơn hàng</div>
                      <div className="text-base font-black text-gray-950 tracking-tight">{order.orderCode}</div>
                    </div>
                    <span className="text-gray-200 hidden sm:block">|</span>
                    <div className="hidden sm:block text-xs text-gray-400 font-bold">{order.createdAt?.slice?.(0, 10)}</div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Items */}
                <div className="px-6 py-4 space-y-3">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <img
                        src={item.productImageUrl || 'https://placehold.co/80x80'}
                        className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shrink-0"
                        alt={item.productName}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-gray-900 text-sm truncate">{item.productName}</div>
                        <div className="text-gray-400 font-bold text-xs mt-0.5">Số lượng: {item.quantity}</div>
                      </div>
                      <div className="font-black text-orange-600 text-sm shrink-0">{formatVnd(item.lineTotal)}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Package className="w-4 h-4" />
                    <span>{order.paymentMethod === 'WALLET' ? 'Ví PetGo' : 'PayOS (VietQR)'}</span>
                    <span className="text-gray-200">•</span>
                    <span className="text-gray-400">{order.createdAt?.slice?.(0, 10)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">Tổng cộng:</span>
                    <span className="text-lg font-black text-gray-950">{formatVnd(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </ShopLayout>
  );
}
