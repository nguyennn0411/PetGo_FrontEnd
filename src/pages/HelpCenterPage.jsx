import { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Mail,
  FileWarning,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Scissors,
  Bath,
  Syringe,
  Home,
  ShoppingBag,
  Calendar,
  CreditCard,
  XCircle,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HELP_CENTER_PHONE = '1900 1234';
const HELP_CENTER_EMAIL = 'hotro@petgo.vn';

const HelpCenterPage = () => {
  const navigate = useNavigate();
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'dich-vu', name: 'Dịch vụ', icon: <Scissors className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
    { id: 'spa', name: 'Spa & Grooming', icon: <Bath className="w-5 h-5" />, color: 'bg-pink-100 text-pink-600' },
    { id: 'thu-y', name: 'Thú y', icon: <Syringe className="w-5 h-5" />, color: 'bg-red-100 text-red-600' },
    { id: 'boarding', name: 'Board & Daycare', icon: <Home className="w-5 h-5" />, color: 'bg-green-100 text-green-600' },
    { id: 'shop', name: 'Shop thú cưng', icon: <ShoppingBag className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600' },
    { id: 'booking', name: 'Đặt lịch', icon: <Calendar className="w-5 h-5" />, color: 'bg-orange-100 text-orange-600' },
    { id: 'thanh-toan', name: 'Thanh toán', icon: <CreditCard className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-600' },
    { id: 'tai-khoan', name: 'Tài khoản', icon: <User className="w-5 h-5" />, color: 'bg-amber-100 text-amber-600' },
  ];

  const faqs = [
    {
      category: 'dich-vu',
      question: 'PetGo cung cấp những dịch vụ gì?',
      answer: 'PetGo cung cấp đa dạng dịch vụ chăm sóc thú cưng: tắm gội & spa, cắt tỉa lông, khám thú y, tiêm phòng, board & daycare, huấn luyện, dắt chó đi dạo, và shop bán đồ thú cưng. Bạn có thể dễ dàng đặt lịch qua ứng dụng hoặc website.',
    },
    {
      category: 'booking',
      question: 'Làm thế nào để đặt lịch trên PetGo?',
      answer: 'Bạn chỉ cần chọn dịch vụ mong muốn, chọn khu vực, chọn thú cưng, chọn ngày và khung giờ phù hợp, sau đó xác nhận đặt lịch. Hệ thống sẽ giữ chỗ cho bạn và thông báo đến nhà cung cấp dịch vụ.',
    },
    {
      category: 'booking',
      question: 'Tôi có thể đặt lịch cho nhiều thú cưng cùng lúc không?',
      answer: 'Hiện tại mỗi lần đặt lịch chỉ phục vụ một thú cưng. Nếu bạn có nhiều thú cưng, bạn có thể tạo nhiều đơn đặt lịch khác nhau cho từng bé.',
    },
    {
      category: 'thanh-toan',
      question: 'PetGo hỗ trợ những phương thức thanh toán nào?',
      answer: 'Chúng tôi hỗ trợ thanh toán online qua VNPay, ví điện tử, và thẻ tín dụng/ghi nợ (Visa, Mastercard). Ngoài ra bạn cũng có thể thanh toán trực tiếp khi nhận dịch vụ.',
    },
    {
      category: 'thanh-toan',
      question: 'Phí ship được tính như thế nào?',
      answer: 'Phí vận chuyển được tính dựa trên khoảng cách đường bộ từ điểm đón của khu vực đến vị trí của bạn. 3km đầu tiên được miễn phí, các km sau được tính theo cấu hình phí ship của từng khu vực.',
    },
    {
      category: 'booking',
      question: 'Tôi có thể hủy hoặc đổi lịch không?',
      answer: 'Bạn có thể hủy lịch trước ít nhất 12 tiếng so với giờ hẹn để được hoàn tiền. Đổi lịch được hỗ trợ miễn phí 1 lần cho mỗi đơn, với điều kiện thông báo trước ít nhất 12 tiếng.',
    },
    {
      category: 'tai-khoan',
      question: 'Làm sao để đăng ký tài khoản PetGo?',
      answer: 'Bạn có thể đăng ký tài khoản bằng số điện thoại hoặc email. Chỉ mất 30 giây để tạo tài khoản và bắt đầu đặt lịch chăm sóc thú cưng.',
    },
    {
      category: 'spa',
      question: 'Dịch vụ spa & grooming bao gồm những gì?',
      answer: 'Dịch vụ spa & grooming của PetGo bao gồm: tắm gội bằng sản phẩm chuyên dụng, cắt tỉa lông theo yêu cầu, vệ sinh tai - mắt - răng, cắt móng, và ủ lông thư giãn. Thời gian trung bình từ 45-90 phút tùy giống và kích thước thú cưng.',
    },
    {
      category: 'thu-y',
      question: 'PetGo có bác sĩ thú y không?',
      answer: 'PetGo có đội ngũ bác sĩ thú y giàu kinh nghiệm, cung cấp các dịch vụ khám tổng quát, tiêm phòng, xét nghiệm, điều trị bệnh thông thường. Bạn có thể đặt lịch khám tại nhà hoặc tại cơ sở của đối tác.',
    },
    {
      category: 'boarding',
      question: 'Dịch vụ board & daycare hoạt động thế nào?',
      answer: 'Board (gửi thú cưng qua đêm) và Daycare (gửi ban ngày) là dịch vụ trông giữ thú cưng tại cơ sở đối tác. Thú cưng sẽ được chăm sóc, cho ăn, dắt đi dạo và giám sát 24/7. Bạn có thể đặt lịch theo giờ, theo ngày hoặc theo tuần.',
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    : faqs;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">

      {/* Hero Search */}
      <section className="bg-gradient-to-b from-orange-500 to-orange-600 py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <HelpCircle className="w-96 h-96 absolute -top-20 -right-20 rotate-12" />
          <HelpCircle className="w-64 h-64 absolute -bottom-20 -left-20 -rotate-12" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 rounded-full px-4 py-1.5 text-xs font-bold mb-6 tracking-wider uppercase">
            <MessageCircle className="w-3.5 h-3.5" /> Trung tâm trợ giúp
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">Chúng tôi có thể giúp gì cho bạn?</h1>
          <p className="text-orange-100 text-base sm:text-lg mb-8 font-medium">Tra cứu câu hỏi thường gặp hoặc liên hệ đội ngũ hỗ trợ của PetGo</p>
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl text-sm font-bold shadow-xl shadow-orange-800/20 focus:ring-4 focus:ring-orange-200 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">

            {/* Category Grid */}
            <section>
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-orange-500 rounded-full shrink-0" /> Danh mục
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col items-center gap-3 group"
                  >
                    <div className={`${cat.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                      {cat.icon}
                    </div>
                    <span className="font-black text-gray-700 text-[10px] uppercase tracking-widest text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* FAQ Accordion */}
            <section>
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-orange-500 rounded-full shrink-0" /> Câu hỏi thường gặp
              </h2>
              {filteredFaqs.length === 0 ? (
                <p className="text-sm text-gray-400 font-semibold text-center py-12">Không tìm thấy kết quả phù hợp.</p>
              ) : (
                <div className="space-y-3">
                  {filteredFaqs.map((faq, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                      <button
                        onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                        className="w-full p-5 flex items-center justify-between text-left group"
                      >
                        <span className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-relaxed pr-4">
                          {faq.question}
                        </span>
                        <div className={`p-1.5 rounded-lg shrink-0 transition-all ${activeAccordion === idx ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500'}`}>
                          {activeAccordion === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      {activeAccordion === idx && (
                        <div className="px-5 pb-6">
                          <div className="h-px bg-gray-50 mb-4" />
                          <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                          <div className="mt-4 flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-400">Bài viết này có hữu ích không?</span>
                            <button className="text-xs font-black text-emerald-600 flex items-center gap-1 hover:underline">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Có
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-28 self-start">
            {/* Support Card */}
            <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <MessageCircle className="w-28 h-28 rotate-12" />
              </div>
              <h3 className="text-xl font-black mb-6 relative z-10">Liên hệ hỗ trợ</h3>
              <div className="space-y-5 relative z-10">
                <button onClick={() => navigate('/chat')} className="w-full flex items-center gap-4 group text-left">
                  <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                    <MessageCircle className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black">Live Chat</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Phản hồi trong 2 phút</p>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-0.5">Bắt đầu chat</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-all" />
                </button>
                <a href={`tel:${HELP_CENTER_PHONE.replace(/\s/g, '')}`} className="w-full flex items-center gap-4 group">
                  <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                    <Phone className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black">Hotline</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{HELP_CENTER_PHONE} (24/7)</p>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-0.5">Gọi ngay</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-all" />
                </a>
                <a href={`mailto:${HELP_CENTER_EMAIL}`} className="w-full flex items-center gap-4 group">
                  <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                    <Mail className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black">Email</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{HELP_CENTER_EMAIL}</p>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-0.5">Gửi email</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-all" />
                </a>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
                <button onClick={() => navigate('/chat')} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                  <FileWarning className="w-4 h-4" /> Gửi khiếu nại dịch vụ
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-5">Tiện ích</h4>
              <div className="space-y-3">
                <button onClick={() => navigate('/services')} className="w-full flex items-center justify-between text-gray-400 hover:text-orange-600 transition-colors">
                  <span className="text-sm font-bold">Tìm dịch vụ</span>
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
                <button onClick={() => navigate('/my-bookings')} className="w-full flex items-center justify-between text-gray-400 hover:text-orange-600 transition-colors">
                  <span className="text-sm font-bold">Lịch đã đặt</span>
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
                <button onClick={() => navigate('/shop')} className="w-full flex items-center justify-between text-gray-400 hover:text-orange-600 transition-colors">
                  <span className="text-sm font-bold">Cửa hàng PetGo</span>
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
                <button onClick={() => navigate('/ai-grooming')} className="w-full flex items-center justify-between text-gray-400 hover:text-orange-600 transition-colors">
                  <span className="text-sm font-bold">AI tư vấn chăm sóc</span>
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default HelpCenterPage;
