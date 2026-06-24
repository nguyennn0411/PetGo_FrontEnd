import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Star,
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
  Quote,
  ChevronLeft,
} from 'lucide-react';
import { getActiveProviderServices, getProviderFilterOptions } from '../api/providers';
import { getHomePage } from '../api/home';
import { formatCurrencyVnd, pickProviderImage } from '../utils/providerHelpers';

const categoryMarqueeStyles = `
  @keyframes petgoCategoryMarquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
`;

const App = () => {
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [sliders, setSliders] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loadingFeaturedServices, setLoadingFeaturedServices] = useState(true);

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

  useEffect(() => {
    const loadHome = async () => {
      try {
        const data = await getHomePage();
        setSliders(Array.isArray(data?.sliders) ? data.sliders : []);
      } catch {
        setSliders([]);
      }
    };

    loadHome();
  }, []);

  useEffect(() => {
    const loadFeaturedServices = async () => {
      setLoadingFeaturedServices(true);
      try {
        const data = await getActiveProviderServices({
          sortBy: 'FEATURED',
          featuredOnly: true,
          page: 0,
          size: 3,
        });
        const services = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.content)
            ? data.content
            : Array.isArray(data)
              ? data
              : [];
        setFeaturedServices(services.slice(0, 3));
      } catch {
        setFeaturedServices([]);
      } finally {
        setLoadingFeaturedServices(false);
      }
    };

    loadFeaturedServices();
  }, []);

  const fallbackSliders = [
    {
      id: 'fallback-1',
      title: 'PetGo - Chăm sóc thú cưng trong một chạm',
      subtitle: '',
      imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1600',
      ctaLabel: 'Khám phá PetGo',
      ctaUrl: '/search',
    },
    {
      id: 'fallback-promotion',
      title: 'Giảm 20% dịch vụ spa thú cưng trong tháng này',
      subtitle: 'Dành riêng cho khách hàng đặt lịch qua ứng dụng PetGo.',
      imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1600',
      ctaLabel: 'Đặt lịch ngay',
      ctaUrl: '/search',
    },
  ];

  const promotionSlider = fallbackSliders[1];
  const homeSliders = sliders.length ? [...sliders, promotionSlider] : fallbackSliders;

  useEffect(() => {
    if (homeSliders.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % homeSliders.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [homeSliders.length]);

  const goToSlide = (index) => setActiveSlide((index + homeSliders.length) % homeSliders.length);

  const flattenCategories = (categories = [], parentName = '') => categories.flatMap((category) => {
    const current = {
      ...category,
      displayName: parentName ? `${parentName} / ${category?.name || 'Dịch vụ'}` : category?.name,
      isChild: Boolean(parentName),
    };
    return [current, ...flattenCategories(category?.children || [], category?.name || parentName)];
  });

  const visibleCategories = useMemo(() => flattenCategories(serviceCategories).slice(0, 12), [serviceCategories]);
  const marqueeCategories = useMemo(() => [...visibleCategories, ...visibleCategories], [visibleCategories]);

  const introSteps = [
    { title: 'Tìm dịch vụ phù hợp', desc: 'Lọc spa, thú y, khách sạn thú cưng hoặc dịch vụ theo nhu cầu của bé.', icon: <Search className="w-5 h-5" /> },
    { title: 'So sánh đối tác', desc: 'Xem đánh giá, khoảng cách, giá tham khảo và thông tin cửa hàng trước khi chọn.', icon: <BadgeCheck className="w-5 h-5" /> },
    { title: 'Đặt lịch & theo dõi', desc: 'Quản lý lịch hẹn, thanh toán, hóa đơn và nhắc lịch trong cùng một tài khoản.', icon: <Calendar className="w-5 h-5" /> },
  ];

  const audienceCards = [
    { title: 'Dành cho chủ nuôi', desc: 'Một nơi để tìm dịch vụ đáng tin cậy, lưu địa điểm yêu thích và chăm sóc thú cưng đều đặn hơn.', cta: 'Khám phá dịch vụ', href: '/search', icon: <User className="w-6 h-6" /> },
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

  // Review khách hàng
  const reviews = [
    { id: 1, name: "Minh Anh", pet: "LuLu (Corgi)", rating: 5, text: "Dịch vụ tuyệt vời! Tôi đã đăng ký gói Pro và tiết kiệm được rất nhiều chi phí grooming hàng tháng.", avatar: "https://i.pravatar.cc/100?u=1" },
    { id: 2, name: "Hoàng Nam", pet: "Mimi (Mèo Anh)", rating: 5, text: "Đặt lịch cực nhanh, các bác sĩ thú y ở đây rất tận tâm. Rất hài lòng với PetGo.", avatar: "https://i.pravatar.cc/100?u=2" }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <style>{categoryMarqueeStyles}</style>
      {/* Home Slider */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-white pt-6 pb-8 sm:pt-10 sm:pb-12">
        <div className="absolute -top-24 right-[-6rem] h-80 w-80 rounded-full bg-orange-200/40 blur-[120px]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-orange-100 bg-white shadow-2xl shadow-orange-100/60">
            <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {homeSliders.map((slide) => (
                <div key={slide.id} className="min-w-full">
                  <button
                    type="button"
                    onClick={() => { if (slide.ctaUrl) window.location.href = slide.ctaUrl; }}
                    className="group relative block h-[340px] w-full overflow-hidden text-left sm:h-[430px] lg:h-[520px]"
                    aria-label={slide.ctaLabel || slide.title || 'PetGo banner'}
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.title || 'PetGo banner'}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950/60 to-transparent" />
                    <div className="relative z-10 flex h-full max-w-3xl flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
                      <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
                        {slide.title}
                      </h1>
                      {slide.subtitle && (
                        <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/85 sm:text-lg">
                          {slide.subtitle}
                        </p>
                      )}
                      <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-2xl bg-orange-500 px-7 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-orange-950/20 transition-all group-hover:bg-white group-hover:text-orange-600">
                        {slide.ctaLabel || 'Khám phá ngay'} <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
            {homeSliders.length > 1 && (
              <>
                <button type="button" onClick={() => goToSlide(activeSlide - 1)} className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition hover:bg-orange-500 hover:text-white sm:flex" aria-label="Slider trước">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => goToSlide(activeSlide + 1)} className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg transition hover:bg-orange-500 hover:text-white sm:flex" aria-label="Slider sau">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
                  {homeSliders.map((slide, index) => (
                    <button key={`dot-${slide.id}`} type="button" onClick={() => goToSlide(index)} className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-orange-500' : 'w-2.5 bg-white/80'}`} aria-label={`Chuyển đến slider ${index + 1}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-18 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 mb-3">PetGo là gì?</p>

              <p className="mt-5 text-base font-medium leading-8 text-gray-500">
                PetGo giúp bạn tìm kiếm, so sánh, đặt lịch và quản lý các nhu cầu chăm sóc thú cưng hằng ngày — từ spa làm đẹp, khám thú y đến khách sạn lưu trú.
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
              <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">Danh mục dịch vụ</h2>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-100 bg-gray-50/60 p-4 sm:p-6">
            {loadingCategories ? (
              <div className="flex gap-4 overflow-hidden">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="h-52 min-w-[260px] rounded-3xl bg-white animate-pulse sm:min-w-[300px]" />
                ))}
              </div>
            ) : visibleCategories.length ? (
              <div className="group relative overflow-hidden py-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-gray-50 via-gray-50/90 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-gray-50 via-gray-50/90 to-transparent" />
                <div
                  className="flex w-max gap-4 motion-reduce:animate-none group-hover:[animation-play-state:paused]"
                  style={{ animation: 'petgoCategoryMarquee 32s linear infinite' }}
                >
                  {marqueeCategories.map((cat, index) => (
                    <button
                      type="button"
                      key={`${getCategorySearchValue(cat)}-${index}`}
                      onClick={() => window.location.href = `/search?serviceCategoryIds=${getCategorySearchValue(cat)}`}
                      className="group/card min-w-[260px] rounded-3xl border border-gray-100 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/60 sm:min-w-[300px] lg:min-w-[320px]"
                    >
                      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition-all group-hover/card:bg-orange-500 group-hover/card:text-white">
                        {getCategoryIcon(cat?.name)}
                      </span>
                      <span className="block min-h-10 text-sm font-black leading-5 text-gray-900 group-hover/card:text-orange-600">
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

      {/* Featured Services */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Dữ liệu thật từ PetGo</p>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Dịch vụ nổi bật</h2>
          </div>
          <button
            onClick={() => window.location.href = '/search?featuredOnly=true'}
            className="inline-flex w-fit items-center gap-2 rounded-2xl bg-orange-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-orange-600 transition-all hover:bg-orange-500 hover:text-white"
          >
            Xem thêm <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loadingFeaturedServices ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-[430px] animate-pulse rounded-[2.5rem] border border-gray-100 bg-gray-50" />
            ))}
          </div>
        ) : featuredServices.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredServices.map((service, index) => (
              <FeaturedServiceCard
                key={`${service.providerServiceId || service.id || service.serviceName || service.name}-${index}`}
                service={service}
                badge={index === 0 ? 'Nổi bật' : index === 1 ? 'Phổ biến' : 'Gợi ý'}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <p className="text-sm font-bold text-gray-500">Chưa có dịch vụ nổi bật từ hệ thống.</p>
            <button
              onClick={() => window.location.href = '/search'}
              className="mt-5 rounded-2xl bg-gray-900 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-orange-500"
            >
              Khám phá dịch vụ
            </button>
          </div>
        )}
      </section>

      {/* Audiences */}
      <section className="py-20 bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10 max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 mb-3">PetGo dành cho ai?</p>
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
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Crown className="w-3.5 h-3.5 fill-current" /> Quyền lợi cao cấp
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-none italic">
                Gói hội viên Pet<span className="text-blue-600">Go</span>
              </h2>
              <p className="text-gray-500 text-xl font-medium leading-relaxed">
                Tiết kiệm nhiều hơn và mở khóa các quyền lợi độc quyền cho mỗi lịch chăm sóc thú cưng. Tham gia cùng hơn 10.000 thú cưng hạnh phúc ngay hôm nay.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BenefitItem text="Giảm giá dịch vụ thú cưng" />
                <BenefitItem text="Voucher hằng tháng" />
                <BenefitItem text="Ưu tiên khung giờ đặt lịch" />
                <BenefitItem text="Nhắc lịch chăm sóc thú cưng" />
                <BenefitItem text="Ưu đãi độc quyền" />
                <BenefitItem text="Hỗ trợ VIP 24/7" />
              </ul>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => window.location.href = '/membership'}
                  className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs"
                >
                  Xem gói hội viên
                </button>
                <button
                  onClick={() => window.location.href = '/membership'}
                  className="px-10 py-5 bg-white text-blue-600 font-black rounded-2xl border-2 border-blue-100 hover:bg-blue-50 transition-all uppercase tracking-widest text-xs"
                >
                  Bắt đầu hội viên
                </button>
              </div>
            </div>

            <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-blue-600 shadow-2xl relative">
                <div className="absolute -top-4 left-6 bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
                  Phổ biến nhất
                </div>
                <h3 className="text-xl font-black text-blue-600 mb-2">GÓI PRO</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-gray-900">99.000</span>
                  <span className="text-xs font-bold text-gray-400">/ tháng</span>
                </div>
                <button
                  onClick={() => window.location.href = '/membership'}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
                >
                  Nâng cấp ngay
                </button>
              </div>

              <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white transform lg:translate-y-12">
                <h3 className="text-xl font-black text-orange-500 mb-2">PREMIUM</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black">199.000</span>
                  <span className="text-xs font-bold text-gray-400">/ tháng</span>
                </div>
                <button
                  onClick={() => window.location.href = '/membership'}
                  className="w-full py-4 bg-white text-gray-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all"
                >
                  Nâng cấp ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose PetGo */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-20 uppercase italic">Vì sao chọn PetGo?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <Feature icon={<ShieldCheck className="w-10 h-10" />} title="Đối tác đã xác minh" desc="100% đối tác được kiểm duyệt kỹ lưỡng." />
            <Feature icon={<BadgeCheck className="w-10 h-10" />} title="Giá cả minh bạch" desc="Giá cả công khai, không phí ẩn." />
            <Feature icon={<Quote className="w-10 h-10" />} title="Đánh giá thật" desc="Đánh giá từ khách hàng thực tế." />
            <Feature icon={<Zap className="w-10 h-10" />} title="Đặt lịch dễ dàng" desc="Đặt lịch nhanh chóng trong 30 giây." />
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-black text-gray-900 mb-12 text-center uppercase tracking-widest">Khách hàng yêu thú cưng nói gì?</h2>
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
          <FooterGroup title="Liên kết nhanh" links={['Trang chủ', 'Dịch vụ', 'Hội viên', 'Trung tâm hỗ trợ', 'Cửa hàng', 'Đơn hàng của tôi']} />
          <FooterGroup title="Pháp lý" links={['Điều khoản', 'Quyền riêng tư', 'Chính sách cookie']} />
          <FooterGroup title="Liên hệ" links={['Hỗ trợ: 1900 1234', 'petgo.help@gmail.com', 'Hà Nội, Việt Nam']} />
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-12 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">© 2025 Nền tảng PetGo. Mọi quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
};

// Component con: Card dịch vụ nổi bật
const FeaturedServiceCard = ({ service, badge }) => {
  const provider = service.provider || {};
  const providerId = service.providerId || provider.id;
  const serviceId = service.providerServiceId || service.id;
  const serviceName = service.name || service.displayName || service.serviceName || service.customName || 'Dịch vụ PetGo';
  const providerName = service.providerName || provider.name || 'Đối tác PetGo';
  const serviceImage = service.photoUrls?.[0]
    || service.imageUrl
    || service.thumbnailUrl
    || pickProviderImage({ image: service.providerImage || provider.image });
  const categoryName = service.categoryName || service.categories?.[0]?.name || 'Dịch vụ';
  const duration = service.duration || (service.durationMinutes ? `${service.durationMinutes} phút` : 'Theo lịch hẹn');
  const rawPrice = service.priceAmount ?? service.price ?? service.priceFrom;
  const priceLabel = service.priceDisplay
    || service.priceAmountDisplay
    || service.priceFromDisplay
    || (rawPrice !== null && rawPrice !== undefined && rawPrice !== '' ? `${formatCurrencyVnd(rawPrice)}đ` : 'Liên hệ');
  const rating = service.rating || service.providerRating || service.avgRating || provider.rating || '0.0';
  const bookingParams = new URLSearchParams();
  if (providerId) bookingParams.set('providerId', providerId);
  if (serviceId && !String(serviceId).startsWith('provider-')) bookingParams.set('serviceId', serviceId);
  const bookingUrl = bookingParams.toString() ? `/booking?${bookingParams.toString()}` : '/booking';
  const detailUrl = providerId ? `/providers/${providerId}` : '/search?featuredOnly=true';

  return (
    <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
      <div className="relative h-56 overflow-hidden">
        <img src={serviceImage} alt={serviceName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm">
          {badge}
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-yellow-50/95 px-3 py-1.5 text-yellow-700 shadow-sm backdrop-blur-md">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span className="text-[10px] font-black">{rating}</span>
        </div>
      </div>
      <div className="p-8">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-orange-500">{categoryName}</p>
        <h3 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors leading-tight min-h-14">{serviceName}</h3>
        <p className="mt-2 text-sm font-bold text-gray-500 line-clamp-1">Tại {providerName}</p>
        <p className="mt-4 text-sm font-medium leading-6 text-gray-500 line-clamp-2">
          {service.description || service.shortDescription || service.desc || 'Đang cập nhật mô tả dịch vụ.'}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest my-6">
          <div className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-blue-500" /> {duration}</div>
          <div className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-orange-500" /> {priceLabel}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => window.location.href = detailUrl}
            className="py-3 px-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            Chi tiết
          </button>
          <button
            onClick={() => window.location.href = bookingUrl}
            className="py-3 px-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all"
          >
            Đặt lịch ngay
          </button>
        </div>
      </div>
    </div>
  );
};

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
