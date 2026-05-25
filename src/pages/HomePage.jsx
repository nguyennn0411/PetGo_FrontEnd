import React, { useContext, useState } from 'react';
import {
  Search,
  MapPin,
  Star,
  Heart,
  Calendar,
  User,
  PawPrint,
  ChevronRight,
  ShieldCheck,
  Clock,
  BadgeCheck,
  Zap,
  Tag,
  MessageCircle,
  Menu,
  X,
  Navigation,
  Scissors,
  Stethoscope,
  Hotel,
  Award,
  Crown,
  Check,
  ArrowRight,
  CheckCircle,
  LogOut,
  Smile,
  Quote,
  Bell
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getRoleLandingPath, hasAdminRole, hasPartnerRole } from '../utils/partnerAccess';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { account, loadingAccount, logout } = useContext(AuthContext);
  const canViewDashboard = account && (hasAdminRole(account) || hasPartnerRole(account));
  const dashboardPath = canViewDashboard ? getRoleLandingPath(account, '/profile') : '/profile';

  const handleProfileMenuNavigate = (path) => {
    setIsProfileMenuOpen(false);
    window.location.href = path;
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout?.();
    window.location.href = '/login';
  };

  // Danh mục dịch vụ
  const categories = [
    { name: 'Pet Spa', icon: <PawPrint className="w-6 h-6" />, slug: 'spa', color: 'bg-orange-100 text-orange-600' },
    { name: 'Grooming', icon: <Scissors className="w-6 h-6" />, slug: 'grooming', color: 'bg-blue-100 text-blue-600' },
    { name: 'Veterinary', icon: <Stethoscope className="w-6 h-6" />, slug: 'clinic', color: 'bg-red-100 text-red-600' },
    { name: 'Pet Boarding', icon: <Hotel className="w-6 h-6" />, slug: 'boarding', color: 'bg-green-100 text-green-600' },
    { name: 'Pet Training', icon: <Award className="w-6 h-6" />, slug: 'training', color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Pet Walking', icon: <Navigation className="w-6 h-6" />, slug: 'walking', color: 'bg-purple-100 text-purple-600' },
  ];

  // Nhà cung cấp gần đây
  const nearbyProviders = [
    { id: 1, name: "Paws & Relax Spa", rating: 4.8, distance: "0.8 km", price: "200.000", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=400" },
    { id: 2, name: "Happy Tails Clinic", rating: 4.9, distance: "1.5 km", price: "150.000", image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400" },
    { id: 3, name: "Resort Pet Heaven", rating: 4.7, distance: "2.2 km", price: "400.000", image: "https://images.unsplash.com/photo-1591768793355-74d7ca738055?auto=format&fit=crop&q=80&w=400" }
  ];

  // Review khách hàng
  const reviews = [
    { id: 1, name: "Minh Anh", pet: "LuLu (Corgi)", rating: 5, text: "Dịch vụ tuyệt vời! Tôi đã đăng ký gói Pro và tiết kiệm được rất nhiều chi phí grooming hàng tháng.", avatar: "https://i.pravatar.cc/100?u=1" },
    { id: 2, name: "Hoàng Nam", pet: "Mimi (Mèo Anh)", rating: 5, text: "Đặt lịch cực nhanh, các bác sĩ thú y ở đây rất tận tâm. Rất hài lòng với PetGo.", avatar: "https://i.pravatar.cc/100?u=2" }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tighter">Pet<span className="text-orange-500">Go</span></span>
          </div>

          {/* Quick Search */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm spa, thú y..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-black uppercase tracking-widest text-gray-500">
            <a href="/" className="text-orange-600">Home</a>
            <a href="/shop" className="hover:text-orange-600 transition-colors">Store</a>
            <a href="/my-orders" className="hover:text-orange-600 transition-colors">My orders</a>
            <a href="/search" className="hover:text-orange-600 transition-colors">Services</a>

            <a href="/my-bookings" className="hover:text-orange-600 transition-colors">My Bookings</a>
            <a href="/favorites" className="hover:text-orange-600 transition-colors">favorites</a>
            <a href="/membership" className="hover:text-orange-600 transition-colors flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-orange-500" /> Membership
            </a>
            {account && (
              <a href="/notifications" className="hover:text-orange-600 transition-colors flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-orange-500" /> Notifications
              </a>
            )}
            {loadingAccount ? (
              <div className="h-9 w-24 rounded-full bg-gray-100 animate-pulse" aria-label="Đang kiểm tra đăng nhập" />
            ) : account ? (
              <div className="relative">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-sm cursor-pointer hover:bg-orange-200 transition-colors"
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                  aria-label="Mở menu tài khoản"
                >
                  <User className="w-5 h-5 text-orange-600" />
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl bg-white border border-gray-100 shadow-2xl p-2 z-[60] normal-case tracking-normal text-left">
                    <button
                      type="button"
                      onClick={() => handleProfileMenuNavigate('/profile')}
                      className="w-full px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-left"
                    >
                      <span className="block text-sm font-black text-gray-900">Profile</span>
                      <span className="block text-[11px] font-semibold text-gray-400 mt-0.5">Thông tin cá nhân</span>
                    </button>
                    {canViewDashboard && (
                      <button
                        type="button"
                        onClick={() => handleProfileMenuNavigate(dashboardPath)}
                        className="w-full px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-left"
                      >
                        <span className="block text-sm font-black text-gray-900">Dashboard</span>
                        <span className="block text-[11px] font-semibold text-gray-400 mt-0.5">Khu vực quản lý theo tài khoản</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-gray-100 px-4 py-3 text-left text-red-500 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-black">Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-600 hover:shadow-orange-200"
              >
                Đăng nhập
              </a>
            )}
          </nav>

          {!loadingAccount && !account && (
            <a
              href="/login"
              className="lg:hidden ml-auto mr-2 inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-md shadow-orange-100 transition-all hover:bg-orange-600"
            >
              Đăng nhập
            </a>
          )}

          <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 overflow-hidden bg-gradient-to-b from-orange-50/50 to-white">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-200 rounded-full blur-[100px] opacity-20 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-7xl font-black text-gray-900 mb-6 leading-tight tracking-tighter">
            Find the best <span className="text-orange-500">pet care</span> <br /> services near you
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-10 font-medium">
            Book trusted pet grooming, spa and veterinary services in seconds. <br className="hidden sm:block" />
            Trusted by 50,000+ pet parents nationwide.
          </p>

          {/* Large Search Bar */}
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 p-3 bg-white rounded-[2.5rem] shadow-2xl border border-gray-50 mb-12">
            <div className="flex-[1.5] flex items-center px-4 gap-3 border-r border-gray-100">
              <Search className="text-orange-500 w-5 h-5" />
              <input type="text" placeholder="Search pet services, spa or clinic" className="w-full bg-transparent outline-none font-bold text-sm" />
            </div>
            <div className="flex-1 flex items-center px-4 gap-3">
              <MapPin className="text-orange-500 w-5 h-5" />
              <input type="text" placeholder="Hồ Chí Minh" className="w-full bg-transparent outline-none font-bold text-sm" />
            </div>
            <button
              onClick={() => window.location.href = '/search'}
              className="bg-gray-900 text-white px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => window.location.href = '/search'}
              className="px-10 py-5 bg-orange-500 text-white font-black rounded-2xl shadow-xl shadow-orange-100 hover:scale-105 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
            >
              Book a Service <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.href = '/membership'}
              className="px-10 py-5 bg-white text-gray-900 font-black rounded-2xl border-2 border-gray-100 hover:border-orange-500 hover:text-orange-600 transition-all uppercase tracking-widest text-xs"
            >
              Explore Membership
            </button>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest mb-12 italic">Popular Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, i) => (
              <div
                key={i}
                onClick={() => window.location.href = `/search?category=${cat.slug}`}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group"
              >
                <div className={`${cat.color} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="font-black text-gray-700 text-sm">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Services */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Pet Services Near You</h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">Dựa trên vị trí hiện tại của bạn</p>
          </div>
          <button onClick={() => window.location.href = '/search'} className="text-sm font-black text-orange-600 hover:underline flex items-center gap-1">
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {nearbyProviders.map((p) => (
            <ProviderCard key={p.id} provider={p} badge="Nearby" />
          ))}
        </div>
      </section>

      {/* NEW SECTION: Membership Promotion */}
      <section className="py-24 bg-blue-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Crown className="w-96 h-96 -rotate-12 text-blue-900" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left: Info */}
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Crown className="w-3.5 h-3.5 fill-current" /> Premium Benefits
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-none italic">
                Pet<span className="text-blue-600">Go</span> Membership
              </h2>
              <p className="text-gray-500 text-xl font-medium leading-relaxed">
                Save more and unlock exclusive benefits for your pet care bookings. Join 10,000+ happy pets today.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BenefitItem text="Discount on pet services" />
                <BenefitItem text="Monthly vouchers" />
                <BenefitItem text="Priority booking slots" />
                <BenefitItem text="Pet care reminders" />
                <BenefitItem text="Exclusive deals" />
                <BenefitItem text="VIP Support 24/7" />
              </ul>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => window.location.href = '/membership'}
                  className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs"
                >
                  View Membership Plans
                </button>
                <button
                  onClick={() => window.location.href = '/membership-payment?plan=pro'}
                  className="px-10 py-5 bg-white text-blue-600 font-black rounded-2xl border-2 border-blue-100 hover:bg-blue-50 transition-all uppercase tracking-widest text-xs"
                >
                  Start Membership
                </button>
              </div>
            </div>

            {/* Right: Plan Teasers */}
            <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-blue-600 shadow-2xl relative">
                <div className="absolute -top-4 left-6 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                  Most Popular
                </div>
                <h3 className="text-xl font-black text-blue-600 mb-2">PRO PLAN</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-gray-900">99.000</span>
                  <span className="text-xs font-bold text-gray-400">/ mo</span>
                </div>
                <button
                  onClick={() => window.location.href = '/membership-payment?plan=pro'}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
                >
                  Upgrade Now
                </button>
              </div>

              <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white transform lg:translate-y-12">
                <h3 className="text-xl font-black text-orange-500 mb-2">PREMIUM</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black">199.000</span>
                  <span className="text-xs font-bold text-gray-400">/ mo</span>
                </div>
                <button
                  onClick={() => window.location.href = '/membership-payment?plan=premium'}
                  className="w-full py-4 bg-white text-gray-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-12">Top Rated Pet Care Providers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <ProviderCard provider={nearbyProviders[0]} badge="Top Rated" />
          <ProviderCard provider={nearbyProviders[1]} badge="Popular" />
          <ProviderCard provider={nearbyProviders[2]} badge="New" />
        </div>
      </section>

      {/* Promotion Banner */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto bg-gradient-to-r from-orange-500 to-yellow-400 rounded-[3rem] p-10 sm:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl shadow-orange-100">
          <div className="text-center md:text-left">
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Get 20% off grooming <br className="hidden sm:block" /> services this month</h2>
            <p className="text-orange-100 text-lg font-medium opacity-90">Dành riêng cho khách hàng đặt lịch qua ứng dụng PetGo.</p>
          </div>
          <button
            onClick={() => window.location.href = '/search'}
            className="px-12 py-5 bg-white text-orange-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest text-sm"
          >
            Book Now
          </button>
        </div>
      </section>

      {/* Why Choose PetGo */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-20 uppercase italic">Why Choose PetGo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <Feature icon={<ShieldCheck className="w-10 h-10" />} title="Verified providers" desc="100% đối tác được kiểm duyệt kỹ lưỡng." />
            <Feature icon={<BadgeCheck className="w-10 h-10" />} title="Transparent pricing" desc="Giá cả công khai, không phí ẩn." />
            <Feature icon={<Quote className="w-10 h-10" />} title="Real reviews" desc="Đánh giá từ khách hàng thực tế." />
            <Feature icon={<Zap className="w-10 h-10" />} title="Easy booking" desc="Đặt lịch nhanh chóng trong 30s." />
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-black text-gray-900 mb-12 text-center uppercase tracking-widest">Happy Pet Parents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative group hover:shadow-xl transition-all">
                <Quote className="absolute top-8 right-8 w-12 h-12 text-orange-50 opacity-10 group-hover:text-orange-100 group-hover:opacity-100" />
                <div className="flex items-center gap-4 mb-6">
                  <img src={rev.avatar} alt={rev.name} className="w-16 h-16 rounded-full border-4 border-orange-50" />
                  <div>
                    <h4 className="font-black text-gray-900">{rev.name}</h4>
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">{rev.pet}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4 text-yellow-400">
                  {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-500 font-medium leading-relaxed italic">"{rev.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tighter">Pet<span className="text-orange-500">Go</span></span>
            </div>
            <p className="text-gray-400 text-sm font-medium leading-relaxed">
              Dịch vụ chăm sóc thú cưng hàng đầu. Chúng tôi mang đến sự an tâm cho chủ nhân và hạnh phúc cho các bé.
            </p>
          </div>
          <FooterGroup title="Quick Links" links={['Home', 'Services', 'Membership', 'Help Center ', 'Store', 'My orders']} />
          <FooterGroup title="Legal" links={['Terms', 'Privacy', 'Cookie Policy']} />
          <FooterGroup title="Contact" links={['Support: 1900 1234', 'petgo.help@gmail.com', 'Hanoi, Vietnam']} />
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-12 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">© 2025 PetGo Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// Component con: Card nhà cung cấp
const ProviderCard = ({ provider, badge }) => (
  <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer">
    <div className="relative h-56 overflow-hidden">
      <img src={provider.image} alt={provider.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm">
        {badge}
      </div>
      <button className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-2xl text-gray-400 hover:text-red-500 transition-all shadow-lg">
        <Heart className="w-4 h-4" />
      </button>
    </div>
    <div className="p-8">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors leading-tight h-12 flex items-center">{provider.name}</h3>
        <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-0.5 rounded-lg shrink-0">
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
          <span className="text-[10px] font-black text-yellow-700">{provider.rating}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
        <div className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-blue-500" /> {provider.distance}</div>
        <div className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-orange-500" /> Giá từ {provider.price}đ</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => window.location.href = '/providers/1'}
          className="py-3 px-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
        >
          Details
        </button>
        <button
          onClick={() => window.location.href = '/booking'}
          className="py-3 px-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all"
        >
          Book Now
        </button>
      </div>
    </div>
  </div>
);

// Component con: Feature
const Feature = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center">
    <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center text-orange-500 mb-6 hover:bg-orange-500 hover:text-white hover:rotate-6 transition-all duration-300 shadow-sm shadow-orange-100">
      {icon}
    </div>
    <h4 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight italic">{title}</h4>
    <p className="text-sm font-medium text-gray-400 px-4">{desc}</p>
  </div>
);

// Component con: Quyền lợi
const BenefitItem = ({ text }) => (
  <li className="flex items-center gap-3">
    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
      <Check className="w-3.5 h-3.5 text-blue-600 stroke-[4px]" />
    </div>
    <span className="text-sm font-bold text-gray-700">{text}</span>
  </li>
);

// Component con: Footer group
const FooterGroup = ({ title, links }) => (
  <div className="space-y-6">
    <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest italic">{title}</h5>
    <ul className="space-y-4">
      {links.map((link, i) => (
        <li key={i}>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-orange-600 transition-colors uppercase tracking-tight">{link}</a>
        </li>
      ))}
    </ul>
  </div>
);

export default App;