import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  Phone, 
  Mail, 
  FileWarning, 
  PawPrint, 
  User, 
  Calendar, 
  CreditCard, 
  XCircle, 
  RotateCcw, 
  Star,
  ArrowLeft,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const HelpCenterPage = () => {
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Danh mục FAQ
  const categories = [
    { id: 'booking', name: 'Booking', icon: <Calendar className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
    { id: 'payment', name: 'Payment', icon: <CreditCard className="w-5 h-5" />, color: 'bg-green-100 text-green-600' },
    { id: 'cancellation', name: 'Cancellation', icon: <XCircle className="w-5 h-5" />, color: 'bg-red-100 text-red-600' },
    { id: 'reschedule', name: 'Reschedule', icon: <RotateCcw className="w-5 h-5" />, color: 'bg-orange-100 text-orange-600' },
    { id: 'reviews', name: 'Reviews', icon: <Star className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'account', name: 'Account', icon: <User className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600' },
  ];

  // Dữ liệu câu hỏi FAQ
  const faqs = [
    {
      category: 'booking',
      question: "Làm thế nào để tôi đặt lịch hẹn trên PetGo?",
      answer: "Bạn có thể đặt lịch bằng cách tìm kiếm dịch vụ tại trang chủ hoặc trang tìm kiếm, chọn nhà cung cấp ưng ý, chọn thú cưng và khung giờ phù hợp, sau đó nhấn 'Xác nhận đặt lịch'."
    },
    {
      category: 'payment',
      question: "PetGo hỗ trợ những phương thức thanh toán nào?",
      answer: "Chúng tôi hỗ trợ thanh toán tại cửa hàng (COD), ví điện tử MoMo, VNPay và thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB)."
    },
    {
      category: 'cancellation',
      question: "Tôi có được hoàn tiền khi hủy lịch không?",
      answer: "Nếu bạn hủy lịch trước thời gian quy định (thường là 12-24 tiếng tùy nhà cung cấp), bạn sẽ được hoàn tiền 100% vào ví PetGo hoặc tài khoản ngân hàng trong vòng 3-5 ngày làm việc."
    },
    {
      category: 'reschedule',
      question: "Tôi có thể đổi lịch hẹn bao nhiêu lần?",
      answer: "Hiện tại PetGo hỗ trợ đổi lịch miễn phí 01 lần cho mỗi mã đặt chỗ, với điều kiện thay đổi trước giờ hẹn ít nhất 12 tiếng."
    },
    {
      category: 'reviews',
      question: "Tại sao đánh giá của tôi không hiển thị?",
      answer: "Mọi đánh giá đều trải qua quy trình kiểm duyệt để đảm bảo tính xác thực và không vi phạm tiêu chuẩn cộng đồng. Quá trình này thường mất khoảng 30 phút."
    }
  ];

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      {/* Header PetGo */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => window.location.href = '/'}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
               <div className="bg-orange-500 p-1.5 rounded-lg">
                 <PawPrint className="w-5 h-5 text-white" />
               </div>
               <span className="text-xl font-black text-gray-900 tracking-tight">Pet<span className="text-orange-500">Go</span></span>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => window.location.href = '/my-bookings'} className="text-sm font-bold text-gray-400 hover:text-orange-600 transition-colors hidden sm:block uppercase tracking-widest">
                My Bookings
            </button>
            <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="bg-white border-b border-gray-100 py-16 sm:py-24 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-20 opacity-5 -z-0">
            <HelpCircle className="w-64 h-64 rotate-12" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 tracking-tight">Help Center</h1>
          <p className="text-gray-500 text-lg mb-10 font-medium italic">Chúng tôi ở đây để giúp bạn chăm sóc thú cưng dễ dàng hơn.</p>
          
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-6 h-6 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search help topics..." 
              className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2.5rem] text-lg font-bold focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all outline-none shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* FAQ Content Column */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Category Grid */}
            <section>
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div> Phân loại chủ đề
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <button 
                    key={cat.id}
                    className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center gap-4 group"
                  >
                    <div className={`${cat.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                        {cat.icon}
                    </div>
                    <span className="font-black text-gray-700 text-sm uppercase tracking-widest">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Accordion Questions */}
            <section>
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div> Câu hỏi thường gặp
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all">
                    <button 
                      onClick={() => toggleAccordion(idx)}
                      className="w-full p-6 sm:p-8 flex items-center justify-between text-left group"
                    >
                      <span className="font-black text-gray-900 group-hover:text-orange-600 transition-colors leading-relaxed">
                        {faq.question}
                      </span>
                      <div className={`p-2 rounded-xl transition-all ${activeAccordion === idx ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500'}`}>
                        {activeAccordion === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>
                    {activeAccordion === idx && (
                      <div className="px-6 sm:px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="h-px bg-gray-50 mb-6"></div>
                        <p className="text-gray-500 font-medium leading-relaxed">
                          {faq.answer}
                        </p>
                        <div className="mt-6 flex gap-4">
                            <button className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                                Hữu ích <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1 hover:underline">
                                Không hữu ích
                            </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Support Sidebar */}
          <aside className="space-y-8 lg:sticky lg:top-28">
            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <MessageCircle className="w-32 h-32 rotate-12" />
               </div>
               <h3 className="text-2xl font-black mb-8 relative z-10 italic">Liên hệ hỗ trợ</h3>
               
               <div className="space-y-6 relative z-10">
                  <ContactCard 
                    icon={<MessageCircle className="w-5 h-5 text-orange-500" />} 
                    title="Live Chat" 
                    desc="Phản hồi trong 2 phút" 
                    action="Bắt đầu chat" 
                  />
                  <ContactCard 
                    icon={<Phone className="w-5 h-5 text-orange-500" />} 
                    title="Hotline" 
                    desc="1900 1234 (24/7)" 
                    action="Gọi ngay" 
                  />
                  <ContactCard 
                    icon={<Mail className="w-5 h-5 text-orange-500" />} 
                    title="Email Support" 
                    desc="petgo.help@gmail.com" 
                    action="Gửi email" 
                  />
               </div>

               <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
                  <button className="w-full py-5 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]">
                    <FileWarning className="w-4 h-4" /> Gửi khiếu nại dịch vụ
                  </button>
               </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm">
               <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Liên kết nhanh</h4>
               <div className="space-y-4">
                  <QuickLink label="Quy trình đặt lịch" />
                  <QuickLink label="Chính sách bảo mật" />
                  <QuickLink label="Điều khoản sử dụng" />
                  <QuickLink label="Hợp tác với PetGo" />
               </div>
            </div>
          </aside>

        </div>
      </main>

      {/* Navigation Footer */}
      <div className="max-w-7xl mx-auto px-4 mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
         <button 
            onClick={() => window.location.href = '/'}
            className="px-10 py-4 bg-white border-2 border-gray-100 text-gray-900 font-black rounded-2xl hover:border-orange-500 hover:text-orange-600 transition-all uppercase tracking-widest text-[10px] flex items-center gap-2"
         >
           Back to Home
         </button>
         <button 
            onClick={() => window.location.href = '/my-bookings'}
            className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 hover:bg-orange-500 transition-all uppercase tracking-widest text-[10px] flex items-center gap-2"
         >
           View My Bookings
         </button>
      </div>
    </div>
  );
};

// Component con: Thẻ liên hệ
const ContactCard = ({ icon, title, desc, action }) => (
  <div className="flex items-center justify-between group cursor-pointer">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all">
        {icon}
      </div>
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{desc}</p>
      </div>
    </div>
    <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
      <ExternalLink className="w-4 h-4" />
    </div>
  </div>
);

// Component con: Link nhanh
const QuickLink = ({ label }) => (
  <div className="flex items-center justify-between text-gray-400 hover:text-orange-600 cursor-pointer group transition-colors">
    <span className="text-xs font-bold">{label}</span>
    <ChevronDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
  </div>
);

export default HelpCenterPage;