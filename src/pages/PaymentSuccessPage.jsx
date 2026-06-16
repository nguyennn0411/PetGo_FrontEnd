import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPayOsPayment } from '../api/payments';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  const orderCode = searchParams.get('orderCode');

  useEffect(() => {
    const verify = async () => {
      if (!orderCode) {
        setStatus('error');
        setErrorMessage('Không tìm thấy mã giao dịch thanh toán (orderCode).');
        return;
      }

      try {
        // Sync and verify on backend
        // Extract invoiceId from composite orderCode (invoiceId * 10000 + random)
        const invoiceId = Math.floor(Number(orderCode) / 10000);
        const data = await verifyPayOsPayment(invoiceId);
        setPaymentData(data);
        setStatus('success');

        // Automatically redirect after 3.5 seconds
        setTimeout(() => {
          if (data.bookingId) {
            navigate(`/booking-success?bookingId=${data.bookingId}&invoiceId=${data.invoiceId}`, {
              replace: true,
              state: { payment: data },
            });
          } else if (data.subscriptionId) {
            navigate(`/membership?checkout=success&subscriptionId=${data.subscriptionId}`, {
              replace: true,
            });
          } else {
            navigate('/my-bookings', { replace: true });
          }
        }, 3500);
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err?.response?.data?.message || 'Có lỗi xảy ra khi xác thực giao dịch qua cổng PayOS.'
        );
      }
    };

    verify();
  }, [orderCode, navigate]);

  const handleManualRedirect = () => {
    if (!paymentData) {
      navigate('/');
      return;
    }
    if (paymentData.bookingId) {
      navigate(`/booking-success?bookingId=${paymentData.bookingId}&invoiceId=${paymentData.invoiceId}`, {
        replace: true,
        state: { payment: paymentData },
      });
    } else if (paymentData.subscriptionId) {
      navigate(`/membership?checkout=success&subscriptionId=${paymentData.subscriptionId}`, {
        replace: true,
      });
    } else {
      navigate('/my-bookings', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-orange-50 via-white to-orange-50 flex items-center justify-center px-6 py-12 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-orange-100 shadow-2xl shadow-orange-100/50 p-8 sm:p-10 relative overflow-hidden transition-all duration-500">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

        {status === 'verifying' && (
          <div className="text-center space-y-6 py-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Đang xác thực thanh toán</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
                PetGo đang đồng bộ trạng thái giao dịch VietQR của bạn với máy chủ PayOS. Vui lòng giữ kết nối.
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-8 animate-in zoom-in duration-500">
            <div className="relative w-24 h-24 mx-auto">
              {/* Ripple circles */}
              <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-45 duration-1000"></div>
              <div className="relative w-24 h-24 rounded-full bg-green-50 flex items-center justify-center shadow-lg shadow-green-100">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-black uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Thành công
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Giao dịch đã xác nhận!</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Thanh toán đã được ghi nhận. Hệ thống đang chuyển bạn về trang hóa đơn/dịch vụ...
              </p>
            </div>

            {paymentData && (
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 space-y-3.5 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Hóa đơn</span>
                  <span className="text-gray-900 font-black">{paymentData.invoiceNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Số tiền</span>
                  <span className="text-gray-900 font-black text-sm text-orange-600">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: paymentData.currencyCode || 'VND',
                      maximumFractionDigits: 0
                    }).format(paymentData.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">Phương thức</span>
                  <span className="text-gray-900 font-black">PayOS (VietQR)</span>
                </div>
              </div>
            )}

            <button
              onClick={handleManualRedirect}
              className="w-full py-4 bg-gray-950 text-white font-black rounded-2xl hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all duration-300 uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
            >
              Xem ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto shadow-lg shadow-red-100">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Xác thực giao dịch lỗi</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
                {errorMessage}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 transition-all uppercase tracking-widest text-xs"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
