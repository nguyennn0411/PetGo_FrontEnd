import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  Heart, 
  ChevronDown, 
  PawPrint, 
  User, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Dữ liệu mẫu các nhà cung cấp đang được so sánh
  const [comparedProviders, setComparedProviders] = useState([
    {
      id: 1,
      name: "Paws & Relax Luxury Spa",
      image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=400",
      address: "Hoà Lạc, TP. Hà Nội",
      rating: 4.8,
      reviews: 156,
      priceFrom: "200.000",
      type: "Spa & Grooming",
      hours: "09:00 - 19:00",
      nextSlot: "Hôm nay, 14:00",
      verified: true,
      cancelPolicy: "Miễn phí trước 24h"
    },
    {
      id: 2,
      name: "Happy Tails Clinic",
      image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400",
      address: "Quận 7, TP. Hồ Chí Minh",
      rating: 4.9,
      reviews: 92,
      priceFrom: "150.000",
      type: "Veterinary Clinic",
      hours: "08:00 - 20:00",
      nextSlot: "Hôm nay, 16:30",
      verified: true,
      cancelPolicy: "Miễn phí trước 12h"
    }
  ]);

  const removeProvider = (id) => {
    setComparedProviders(comparedProviders.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <button
        onClick={() => window.location.href = '/search'}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">So sánh dịch vụ / nhà cung cấp</h1>
            <p className="text-gray-500 font-medium">So sánh chi tiết các lựa chọn để tìm ra dịch vụ phù hợp nhất cho thú cưng của bạn.</p>
          </div>
          
          {/* Add Provider Search */}
          <div className="relative group w-full sm:w-80">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Plus className="w-4 h-4 text-orange-500" />
            </div>
            <input 
              type="text" 
              placeholder="Thêm nhà cung cấp..." 
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-x-auto no-scrollbar">
          <div className="min-w-[800px]">
            {/* Header Row with Images */}
            <div className="grid grid-cols-4 border-b border-gray-50">
              <div className="p-8 flex items-center justify-center bg-gray-50/50">
                 <div className="text-center">
                    <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiêu chí</span>
                 </div>
              </div>
              
              {/* Provider Columns */}
              {[0, 1, 2].map((idx) => {
                const provider = comparedProviders[idx];
                return (
                  <div key={idx} className={`p-8 relative ${idx !== 0 ? 'border-l border-gray-50' : ''}`}>
                    {provider ? (
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => removeProvider(provider.id)}
                          className="absolute top-4 right-4 p-1.5 bg-gray-100 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="w-32 h-32 rounded-[2rem] overflow-hidden mb-4 shadow-lg border-4 border-white">
                          <img src={provider.image} alt={provider.name} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 text-center leading-tight mb-2 h-12 flex items-center">
                          {provider.name}
                        </h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 rounded-full">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                          <span className="text-xs font-black text-yellow-700">{provider.rating} ({provider.reviews})</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-gray-100 rounded-[2rem]">
                         <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                           <Plus className="w-6 h-6 text-gray-300" />
                         </div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Add Provider</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comparison Rows */}
            <ComparisonRow label="Địa chỉ" icon={<MapPin className="w-4 h-4" />}>
              {comparedProviders.map(p => <p key={p.id} className="text-sm font-medium text-gray-600 line-clamp-2">{p.address}</p>)}
            </ComparisonRow>

            <ComparisonRow label="Loại dịch vụ" icon={<PawPrint className="w-4 h-4" />}>
              {comparedProviders.map(p => (
                <span key={p.id} className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg uppercase tracking-wider">
                  {p.type}
                </span>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Giá dịch vụ từ" icon={<CreditCardIcon className="w-4 h-4" />}>
              {comparedProviders.map(p => <p key={p.id} className="text-xl font-black text-gray-900">{p.priceFrom}đ</p>)}
            </ComparisonRow>

            <ComparisonRow label="Giờ làm việc" icon={<Clock className="w-4 h-4" />}>
              {comparedProviders.map(p => <p key={p.id} className="text-sm font-bold text-gray-700">{p.hours}</p>)}
            </ComparisonRow>

            <ComparisonRow label="Slot trống gần nhất" icon={<Calendar className="w-4 h-4" />}>
              {comparedProviders.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-green-600 font-bold text-sm">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   {p.nextSlot}
                </div>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Xác minh" icon={<ShieldCheck className="w-4 h-4" />}>
              {comparedProviders.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 text-blue-600 text-xs font-black uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </div>
              ))}
            </ComparisonRow>

            <ComparisonRow label="Chính sách hủy" icon={<AlertCircle className="w-4 h-4" />}>
              {comparedProviders.map(p => <p key={p.id} className="text-xs font-bold text-gray-400 italic">{p.cancelPolicy}</p>)}
            </ComparisonRow>

            {/* CTA Buttons Row */}
            <div className="grid grid-cols-4 bg-gray-50/30">
              <div className="p-8"></div>
              {[0, 1, 2].map((idx) => {
                const provider = comparedProviders[idx];
                return (
                  <div key={idx} className={`p-8 flex flex-col gap-3 ${idx !== 0 ? 'border-l border-gray-100' : ''}`}>
                    {provider && (
                      <>
                        <button 
                          onClick={() => window.location.href = `/booking?providerId=${provider.id}`}
                          className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-lg hover:bg-orange-500 transition-all uppercase tracking-widest text-[10px]"
                        >
                          Đặt lịch ngay
                        </button>
                        <button 
                          onClick={() => window.location.href = `/providers/${provider.id}`}
                          className="w-full py-4 bg-white border border-gray-200 text-gray-500 font-black rounded-2xl hover:border-orange-500 hover:text-orange-600 transition-all uppercase tracking-widest text-[10px]"
                        >
                          Chi tiết
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

// Component con: Hàng so sánh
const ComparisonRow = ({ label, icon, children }) => {
  // Chuyển đổi children sang mảng để xử lý render an toàn
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className="grid grid-cols-4 border-b border-gray-50 group hover:bg-gray-50/50 transition-colors">
      <div className="p-6 sm:p-8 flex items-center gap-3 border-r border-gray-50 bg-gray-50/30">
        <span className="text-orange-500">{icon}</span>
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      {/* Các ô nội dung */}
      {childrenArray.map((child, i) => (
        <div key={i} className={`p-6 sm:p-8 flex items-center justify-center text-center ${i !== 0 ? 'border-l border-gray-50' : ''}`}>
          {child}
        </div>
      ))}
      {/* Ô trống nếu chưa đủ 3 provider */}
      {childrenArray.length < 3 && [...Array(3 - childrenArray.length)].map((_, i) => (
        <div key={`empty-${i}`} className="p-8 border-l border-gray-50"></div>
      ))}
    </div>
  );
};

// Icon thay thế cho CreditCard vì lucide có thể không nhận
const CreditCardIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
);

export default App;