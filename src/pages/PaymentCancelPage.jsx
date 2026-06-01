import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  XCircle,
  ArrowRight,
  RefreshCw,
  Home,
} from 'lucide-react';

export default function PaymentCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode');

  return (
    <div className="min-h-screen bg-gradient-to-tr from-orange-50 via-white to-orange-50 flex items-center justify-center px-6 py-12 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-orange-100 shadow-2xl shadow-orange-100/50 p-8 sm:p-10 relative overflow-hidden text-center space-y-8">
        
        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto shadow-lg shadow-red-100 animate-in zoom-in duration-500">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-black uppercase tracking-widest mb-2">
            Đã hủy
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Thanh toán đã bị hủy</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
            Bạn đã hủy liên kết thanh toán VietQR hoặc giao dịch đã hết hạn. Booking vẫn được lưu ở trạng thái chờ thanh toán.
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 text-left text-xs space-y-3.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold uppercase tracking-wider">Cổng thanh toán</span>
            <span className="text-gray-900 font-black">PayOS (VietQR)</span>
          </div>
          {orderCode && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Mã giao dịch</span>
              <span className="text-gray-900 font-black font-mono">{orderCode}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/my-bookings')}
            className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
          >
            Đến lịch đặt chỗ của tôi <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
