import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Star,
  Heart,
  Calendar,
  User,
  PawPrint,
  ChevronRight,
  ShieldCheck,
  BadgeCheck,
  Zap,
  Tag,
  Navigation,
  Scissors,
  Stethoscope,
  Hotel,
  Award,
  Crown,
  Check,
  ArrowRight,
  CheckCircle,
  Quote,
} from 'lucide-react';
import { getProviderFilterOptions } from '../api/providers';

const App = () => {
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await getProviderFilterOptions();
        setServiceCategories(Array.isArray(data?.serviceCategories) ? data.serviceCategories : []);
      } catch {
        setServiceCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const flattenCategories = (categories = [], parentName = '') => categories.flatMap((category) => {
    const current = {
      ...category,
      displayName: parentName ? `${parentName} / ${category?.name || 'Dịch vụ'}` : category?.name,
      isChild: Boolean(parentName),
    };
    return [current, ...flattenCategories(category?.children || [], category?.name || parentName)];
  });

  const visibleCategories = useMemo(() => flattenCategories(serviceCategories).slice(0, 12), [serviceCategories]);
  const heroCategories = visibleCategories.slice(0, 5);

  const introSteps = [
    { title: 'Tìm dịch vụ phù hợp', desc: 'Lọc spa, thú y, khách sạn thú cưng hoặc dịch vụ theo nhu cầu của bé.', icon: <Search className="w-5 h-5" /> },
    { title: 'So sánh đối tác', desc: 'Xem đánh giá, khoảng cách, giá tham khảo và thông tin cửa hàng trước khi chọn.', icon: <BadgeCheck className="w-5 h-5" /> },
    { title: 'Đặt lịch & theo dõi', desc: 'Quản lý lịch hẹn, thanh toán, hóa đơn và nhắc lịch trong cùng một tài khoản.', icon: <Calendar className="w-5 h-5" /> },
  ];

  const audienceCards = [
    { title: 'Dành cho chủ nuôi', desc: 'Một nơi để tìm dịch vụ đáng tin cậy, lưu địa điểm yêu thích và chăm sóc thú cưng đều đặn hơn.', cta: 'Khám phá dịch vụ', href: '/search', icon: <User className="w-6 h-6" /> },
    { title: 'Dành cho đối tác', desc: 'Cửa hàng có thể giới thiệu hồ sơ, quản lý dịch vụ, lịch làm việc và booking từ khách hàng.', cta: 'Đăng ký đối tác', href: '/partner-registration/shop', icon: <PawPrint className="w-6 h-6" /> },
  ];

  const getCategoryIcon = (categoryName = '') => {
    const normalizedName = categoryName.toLowerCase();
    if (normalizedName.includes('groom')) return <Scissors className="w-5 h-5" />;
    if (normalizedName.includes('clinic') || normalizedName.includes('vet')) return <Stethoscope className="w-5 h-5" />;
    if (normalizedName.includes('board') || normalizedName.includes('hotel')) return <Hotel className="w-5 h-5" />;
    if (normalizedName.includes('train')) return <Award className="w-5 h-5" />;
    if (normalizedName.includes('walk')) return <Navigation className="w-5 h-5" />;
    return <PawPrint className="w-5 h-5" />;
  };

  const getCategorySearchValue = (category) => category?.id ?? category?.slug ?? category?.name;

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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-white pt-14 pb-14 sm:pt-20 sm:pb-20">
        <div className="absolute -top-24 right-[-6rem] h-80 w-80 rounded-full bg-orange-200/40 blur-[120px]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-600 shadow-sm">
                <ShieldCheck className="h-4 w-4" /> Đối tác được kiểm duyệt
              </div>
              <h1 className="mx-auto mb-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-gray-950 sm:text-5xl lg:mx-0 lg:text-6xl">
                Đặt lịch chăm sóc thú cưng <span className="text-orange-500">dễ dàng</span>
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-base font-medium leading-8 text-gray-500 lg:mx-0 sm:text-lg">
                Tìm dịch vụ phù hợp, xem nhà cung cấp uy tín và quản lý lịch hẹn của bé cưng trong một nơi.
              </p>

              <div className="mx-auto mb-5 flex max-w-2xl flex-col gap-3 rounded-3xl border border-orange-100 bg-white p-3 shadow-xl shadow-orange-100/50 lg:mx-0 sm:flex-row">
                <div className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl bg-gray-50 px-4">
                  <Search className="text-orange-500 w-5 h-5" />
                  <input type="text" placeholder="Tìm spa, thú y, khách sạn..." className="w-full bg-transparent text-sm font-bold outline-none" />
                </div>
                <button
                  onClick={() => window.location.href = '/search'}
                  className="rounded-2xl bg-orange-500 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-600"
                >
                  Tìm kiếm
                </button>
              </div>

              <div className="mb-8 flex flex-wrap justify-center gap-2 lg:justify-start">
                {loadingCategories ? (
                  [...Array(4)].map((_, index) => <span key={index} className="h-10 w-28 rounded-full bg-orange-100/70 animate-pulse" />)
                ) : heroCategories.length ? (
                  heroCategories.map((cat) => (
                    <button
                      type="button"
                      key={`hero-chip-${getCategorySearchValue(cat)}`}
                      onClick={() => window.location.href = `/search?serviceCategoryIds=${getCategorySearchValue(cat)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-black text-gray-700 shadow-sm transition-all hover:border-orange-300 hover:text-orange-600"
                    >
                      {getCategoryIcon(cat?.name)}
                      <span className="max-w-[150px] truncate">{cat?.name || 'Dịch vụ'}</span>
                    </button>
                  ))
                ) : (
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-400">Danh mục sẽ hiển thị khi backend sẵn sàng</span>
                )}
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <button
                  onClick={() => window.location.href = '/search'}
                  className="flex items-center gap-2 rounded-2xl bg-gray-950 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-orange-500"
                >
                  Đặt dịch vụ <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.location.href = '/membership'}
                  className="rounded-2xl border border-gray-200 bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-900 transition-all hover:border-orange-300 hover:text-orange-600"
                >
                  Xem membership
                </button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0">
                <HeroStat value="50K+" label="pet parents" />
                <HeroStat value="4.8/5" label="đánh giá" />
                <HeroStat value="24/7" label="hỗ trợ" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-8 hidden rounded-3xl bg-white p-4 shadow-xl shadow-orange-100 lg:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600"><CheckCircle className="h-5 w-5" /></div>
                  <div><p className="text-xs font-black text-gray-900">Booking confirmed</p><p className="text-[10px] font-bold text-gray-400">Grooming · 10:30 AM</p></div>
                </div>
              </div>
              <div className="absolute right-4 bottom-8 hidden rounded-3xl bg-gray-950 p-5 text-white shadow-2xl lg:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-300">Next visit</p>
                <p className="mt-1 text-sm font-black">Happy Tails Clinic</p>
              </div>
              <div className="overflow-hidden rounded-[2.25rem] border-8 border-white bg-orange-50 shadow-2xl shadow-orange-100">
                <img
                  src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=900"
                  alt="Chủ nuôi vui vẻ cùng thú cưng"
                  className="h-[320px] w-full object-cover sm:h-[460px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-18 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 mb-3">PetGo là gì?</p>
              <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-5xl">
                Nền tảng kết nối chủ nuôi với dịch vụ chăm sóc thú cưng đáng tin cậy.
              </h2>
              <p className="mt-5 text-base font-medium leading-8 text-gray-500">
                PetGo giúp bạn tìm kiếm, so sánh, đặt lịch và quản lý các nhu cầu chăm sóc thú cưng hằng ngày — từ grooming, khám thú y đến khách sạn lưu trú.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {introSteps.map((step, index) => (
                <div key={step.title} className="rounded-[2rem] border border-orange-100 bg-orange-50/40 p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
                    {step.icon}
                  </div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-orange-500">Bước {index + 1}</p>
                  <h3 className="text-lg font-black text-gray-950">{step.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="services" className="py-16 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 mb-3">Categories</p>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">Chọn dịch vụ cho bé</h2>
            </div>
            <button
              onClick={() => window.location.href = '/search'}
              className="w-fit rounded-2xl bg-gray-950 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-500"
            >
              Mở trang tìm kiếm
            </button>
          </div>

          <div className="rounded-[2rem] border border-gray-100 bg-gray-50/60 p-4 sm:p-6">
            {loadingCategories ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="h-28 rounded-3xl bg-white animate-pulse" />
                ))}
              </div>
            ) : visibleCategories.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {visibleCategories.map((cat) => (
                  <button
                    type="button"
                    key={getCategorySearchValue(cat)}
                    onClick={() => window.location.href = `/search?serviceCategoryIds=${getCategorySearchValue(cat)}`}
                    className="group rounded-3xl border border-gray-100 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/60"
                  >
                    <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition-all group-hover:bg-orange-500 group-hover:text-white">
                      {getCategoryIcon(cat?.name)}
                    </span>
                    <span className="block min-h-10 text-sm font-black leading-5 text-gray-900 group-hover:text-orange-600">
                      {cat?.displayName || cat?.name || 'Dịch vụ'}
                    </span>
                    {cat?.description ? (
                      <span className="mt-2 block line-clamp-2 text-xs font-medium leading-5 text-gray-500">{cat.description}</span>
                    ) : (
                      <span className="mt-2 block text-xs font-bold text-gray-400">Xem nhà cung cấp phù hợp</span>
                    )}
                    <span className="mt-5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-orange-500">
                      Khám phá <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-sm font-bold text-gray-500">Chưa có dữ liệu danh mục dịch vụ.</p>
                <button
                  onClick={() => window.location.href = '/#services'}
                  className="mt-4 rounded-xl bg-orange-500 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white"
                >
                  Đi tới tìm kiếm
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="py-20 bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 mb-3">PetGo dành cho ai?</p>
            <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">Một hệ sinh thái cho cả chủ nuôi và đơn vị chăm sóc thú cưng.</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {audienceCards.map((card) => (
              <div key={card.title} className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-950">{card.title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-gray-500">{card.desc}</p>
                <button
                  onClick={() => window.location.href = card.href}
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-500"
                >
                  {card.cta} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
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
            onClick={() => window.location.href = '/#services'}
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

const HeroStat = ({ value, label }) => (
  <div className="rounded-2xl border border-orange-100 bg-white/80 p-3 text-center shadow-sm sm:p-4">
    <p className="text-xl font-black text-gray-950">{value}</p>
    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
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