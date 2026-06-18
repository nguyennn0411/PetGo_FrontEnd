import { useContext, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronLeft,
  FileText,
  Gift,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Wallet,
  Scissors,
  ShoppingBag,
  Star,
  Store,
  Users,
  Package,
  ListTree,
  ShoppingCart,
  X,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../styles/AdminDashboard.css';

const navGroups = [
  // {
  //   title: 'Tổng quan',
  //   items: [
  //     {
  //       id: 'admin-dashboard',
  //       icon: BarChart3,
  //       label: 'Dashboard',
  //       path: '/admin/dashboard',
  //       subtitle: 'Tổng quan hệ thống và tình trạng vận hành',
  //     },
  //   ],
  // },
  {
    title: 'Quản lý hệ thống',
    items: [
      { id: 'admin-users', icon: Users, label: 'Người dùng', path: '/admin/users', badge: 3, subtitle: 'Quản lý tài khoản, role và trạng thái truy cập' },
      { id: 'admin-partners', icon: Store, label: 'Đối tác', path: '/admin/partners', badge: 5, subtitle: 'Duyệt hồ sơ, quản trị nhà cung cấp và trạng thái provider' },
      { id: 'admin-services', icon: Scissors, label: 'Dịch vụ', path: '/admin/services', subtitle: 'Quản lý danh mục và service taxonomy' },
      { id: 'admin-service-requests', icon: FileText, label: 'Duyệt dịch vụ', path: '/admin/partner-service-requests', subtitle: 'Duyệt yêu cầu tạo/cập nhật dịch vụ từ partner' },
      // { id: 'admin-bookings', icon: CalendarDays, label: 'Booking', path: '/admin/bookings', subtitle: 'Theo dõi booking toàn hệ thống' },
      { id: 'admin-wallet', icon: Wallet, label: 'Ví', path: '/admin/wallet', subtitle: 'Duyệt nạp/rút, khóa ví và cấu hình tự động cộng tiền' },
      { id: 'admin-reviews', icon: Star, label: 'Review', path: '/admin/reviews', badge: 2, subtitle: 'Giám sát đánh giá và nội dung bị báo cáo' },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { id: 'admin-notifications', icon: Bell, label: 'Thông báo', path: '/admin/notifications', subtitle: 'Tạo và theo dõi thông báo gửi tới user/partner' },
      { id: 'admin-logs', icon: FileText, label: 'Admin Log', path: '/admin/logs', subtitle: 'Theo dõi thao tác quản trị và audit trail' },
    ],
  },
  {
    title: 'Khác',
    items: [
      { id: 'admin-reports', icon: BarChart3, label: 'Báo cáo', path: '/admin/reports', subtitle: 'Phân tích tăng trưởng, doanh thu và khu vực' },
      { id: 'admin-vouchers', icon: Gift, label: 'Khuyến mãi', path: '/admin/vouchers', subtitle: 'Quản lý voucher, flash sale và mã ưu đãi' },
    ],
  },
  {
    title: 'Cửa hàng (Store)',
    items: [
      { id: 'admin-categories', icon: ListTree, label: 'Danh mục', path: '/admin/categories', subtitle: 'Quản lý danh mục sản phẩm cửa hàng' },
      { id: 'admin-products', icon: Package, label: 'Sản phẩm', path: '/admin/products', subtitle: 'Quản lý sản phẩm, tồn kho và giá bán' },
      { id: 'admin-orders', icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/shop-orders', subtitle: 'Xử lý và theo dõi đơn hàng mua sắm' },
    ],
  },
];

const AdminLayout = ({ children, title }) => {
  const { account, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const activeItem = useMemo(() => (
    navGroups
      .flatMap((group) => group.items)
      .find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
  ), [location.pathname]);

  const displayName = account?.fullName || account?.name || account?.email || 'Admin';
  const pageTitle = title || activeItem?.label || 'Dashboard admin';
  const pageSubtitle = activeItem?.subtitle || 'Điều phối và giám sát hệ sinh thái PetGo';

  const handleLogout = () => {
    logout?.();
    navigate('/login');
  };

  return (
    <div className="admin-shell min-h-screen bg-gray-50 text-gray-900 font-sans lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 shadow-2xl lg:shadow-none transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 px-6 flex items-center justify-between border-b border-gray-50">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black">P</div>
            <div>
              <p className="text-xl font-black tracking-tight">PetGo</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Admin</p>
            </div>
          </Link>
          <button className="lg:hidden p-2" onClick={() => setOpen(false)} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-5 overflow-y-auto h-[calc(100vh-5rem)]">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-sm transition-all ${isActive ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-sm text-red-500 hover:bg-red-50 transition-all" type="button">
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </nav>
      </aside>

      {open && <div className="fixed inset-0 bg-gray-900/30 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 lg:ml-72 min-w-0">
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
          <div className="h-20 px-4 sm:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setOpen(true)} type="button">
                <Menu className="w-6 h-6" />
              </button>
              <button onClick={() => navigate('/')} className="hidden sm:flex p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-orange-500" type="button">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black truncate">{pageTitle}</h1>
                <p className="text-xs sm:text-sm text-gray-500 font-semibold truncate">{pageSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" title="Về trang thương mại" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600">
                <Home className="w-4 h-4" /> Trang thương mại
              </Link>
              <button onClick={() => navigate('/admin/notifications')} className="relative p-3 rounded-2xl bg-gray-50 text-gray-500 hover:text-orange-500 hover:bg-orange-50" title="Thông báo" type="button">
                <MessageSquare className="w-5 h-5" />
              </button>
              <div className="text-right hidden md:block">
                <p className="text-sm font-black truncate max-w-48">{displayName}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-green-600">System admin</p>
              </div>
            </div>
          </div>
        </header>
        <main className="admin-content-area p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
