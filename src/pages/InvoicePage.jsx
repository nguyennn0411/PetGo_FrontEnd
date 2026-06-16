import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  Download,
  FileText,
  ListOrdered,
  Loader2,
  PawPrint,
  Printer,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getInvoiceByBookingId, getInvoiceById } from '../api/invoices';

const formatCurrency = (value, currency = 'VND') => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const InvoicePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const bookingId = searchParams.get('bookingId');

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInvoice = async () => {
    setLoading(true);
    setError('');
    try {
      const data = invoiceId ? await getInvoiceById(invoiceId) : await getInvoiceByBookingId(bookingId);
      setInvoice(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được invoice.');
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!invoiceId && !bookingId) {
      setLoading(false);
      setError('Thiếu invoiceId hoặc bookingId để mở hóa đơn.');
      return;
    }
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, bookingId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Đang tải invoice</h1>
          <p className="text-sm text-gray-500 font-medium">PetGo đang lấy hóa đơn và chi tiết thanh toán từ backend.</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white rounded-[2rem] border border-red-100 shadow-sm p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Không mở được invoice</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">{error || 'Invoice chưa sẵn sàng.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={loadInvoice} className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600">
              Thử lại
            </button>
            <Link to="/my-bookings" className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest hover:bg-gray-200">
              Đi tới My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 print:hidden">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Invoice / Receipt</h1>
            <p className="text-gray-500 font-medium">Hóa đơn được sinh tự động từ checkout PetGo.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm flex items-center gap-2 font-bold text-xs">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handlePrint} className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-orange-500 transition-all shadow-lg flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden relative print:shadow-none print:border-none print:rounded-none">
          <div className="bg-gray-900 p-10 text-white flex flex-col sm:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-orange-500 p-1.5 rounded-lg">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight">Pet<span className="text-orange-500">Go</span></span>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                PetGo Marketplace Platform<br />
                Láng Hòa Lạc, Thạch Thất, Hà Nội<br />
                petgo.contact@gmail.com
              </p>
            </div>
            <div className="text-right">
              <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-500/30">
                {invoice.invoiceStatus}
              </span>
              <h2 className="text-3xl font-black mt-4 tracking-tight">#{invoice.invoiceNumber}</h2>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Mã Booking: {invoice.bookingCode}</p>
            </div>
          </div>

          <div className="p-10 space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Thông tin thanh toán</h3>
                <div className="space-y-4">
                  <InfoBlock icon={<Calendar className="w-4 h-4 text-orange-500" />} label="Ngày phát hành" value={invoice.issuedAt || 'Chưa rõ'} />
                  <InfoBlock icon={<CreditCard className="w-4 h-4 text-orange-500" />} label="Phương thức" value={invoice.paymentMethod || 'Chưa rõ'} />
                  <InfoBlock icon={<ShieldCheck className="w-4 h-4 text-orange-500" />} label="Trạng thái payment" value={invoice.paymentStatus || 'Chưa rõ'} />
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Đơn vị cung cấp</h3>
                <div className="space-y-1">
                  <p className="text-sm font-black text-gray-900">{invoice.providerName}</p>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed">{invoice.providerAddress}</p>
                  <p className="text-xs font-bold text-gray-400 mt-2 italic">Tel: {invoice.providerPhone || 'Chưa có'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dịch vụ & Thú cưng</h4>
                  <p className="text-base font-black text-gray-900">{invoice.serviceName}</p>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-tight mt-1 flex items-center gap-1">
                    <PawPrint className="w-3 h-3" /> Pet: {invoice.petName}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Thời gian lịch hẹn</p>
                  <div className="flex sm:justify-end items-center gap-2 text-sm font-bold text-gray-700">
                    <Calendar className="w-4 h-4" /> {invoice.appointmentDate}
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <Clock className="w-4 h-4" /> {invoice.appointmentTime}
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-4">
                {(invoice.items || []).map((item, index) => (
                  <div key={`${item.itemType}-${index}`} className="flex justify-between items-center text-sm gap-4">
                    <div>
                      <span className="font-bold text-gray-500 uppercase tracking-widest block">{item.itemName}</span>
                      {item.description ? <span className="text-xs text-gray-400 font-medium">{item.description}</span> : null}
                    </div>
                    <span className={`font-black ${item.lineTotal < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {item.lineTotal < 0 ? '-' : ''}{formatCurrency(Math.abs(Number(item.lineTotal || 0)), invoice.currencyCode)}
                    </span>
                  </div>
                ))}
                <div className="h-px bg-gray-200 my-4 border-t border-dashed"></div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Tổng cộng cuối cùng</span>
                    </div>
                    <p className="text-4xl font-black text-orange-600 tracking-tight">{formatCurrency(invoice.totalAmount, invoice.currencyCode)}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <CheckCircle2 className="w-12 h-12 text-green-100 mb-2" />
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-tighter">Giao dịch đã ghi nhận</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-gray-50">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-loose">
                Hóa đơn này được tạo tự động bởi hệ thống đặt lịch PetGo.<br />
                Mọi thắc mắc vui lòng liên hệ <span className="text-gray-900">1900 1234</span> hoặc email hỗ trợ.
              </p>
            </div>
          </div>
          <div className="h-2 bg-orange-500 w-full"></div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 print:hidden">
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex-1 py-5 bg-white border-2 border-gray-100 text-gray-900 font-black rounded-2xl hover:border-orange-500 hover:text-orange-600 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
          >
            <ListOrdered className="w-4 h-4" /> Go to My Bookings
          </button>
          <button
            onClick={() => navigate(`/booking-success?bookingId=${invoice.bookingId}&invoiceId=${invoice.invoiceId}`)}
            className="flex-1 py-5 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 hover:bg-orange-500 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
          >
            <FileText className="w-4 h-4" /> Back to Success Page
          </button>
        </div>
      </main>
    </div>
  );
};

const InfoBlock = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 p-1.5 bg-gray-100 rounded-lg shrink-0">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-700 leading-tight">{value}</p>
    </div>
  </div>
);

export default InvoicePage;
