import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, Menu, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../styles/DashboardLayout.css';

/**
 * DashboardLayout — Layout dùng chung cho tất cả dashboard (Admin, Partner, …).
 *
 * Cấu trúc grid: sidebar 3/12 (25%) + body 9/12 (75%).
 * Sidebar được truyền vào qua prop `SidebarComponent` — tuỳ theo role sẽ render
 * AdminSidebar, PartnerSidebar, v.v.
 *
 * @param {Object} props
 * @param {React.ComponentType<{onItemClick?: () => void}>} props.SidebarComponent — Sidebar nav component
 * @param {string}  props.brandLabel      — Nhãn hiển thị dưới logo ("Admin", "Partner", …)
 * @param {string}  props.title           — Tiêu đề trang hiện tại
 * @param {string}  [props.subtitle]      — Mô tả phụ dưới tiêu đề
 * @param {string}  [props.displayName]   — Tên hiển thị góc phải header
 * @param {string}  [props.roleLabel]     — Nhãn role dưới tên ("System admin", "Verified provider")
 * @param {React.ReactNode} [props.headerLeftExtra]  — Nội dung thêm bên trái header (VD: nút back)
 * @param {React.ReactNode} [props.headerActions]    — Nội dung thêm bên phải header (VD: nút thông báo)
 * @param {string}  [props.shellClassName] — CSS class bao ngoài để scope style (VD: "admin-shell")
 * @param {string}  [props.mainClassName]  — CSS class thêm cho vùng main
 * @param {string}  [props.scrollKey]      — sessionStorage key để lưu vị trí scroll sidebar
 * @param {React.ReactNode} props.children — Nội dung trang
 */
const DashboardLayout = ({
  children,
  SidebarComponent,
  brandLabel = '',
  title = 'Dashboard',
  subtitle = '',
  displayName,
  roleLabel,
  headerLeftExtra,
  headerActions,
  shellClassName = '',
  mainClassName = '',
  scrollKey,
}) => {
  const { account, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);

  /* ── Sidebar scroll persistence ── */
  useEffect(() => {
    if (scrollKey && sidebarRef.current) {
      const saved = sessionStorage.getItem(scrollKey);
      if (saved) sidebarRef.current.scrollTop = Number(saved) || 0;
    }
  }, [scrollKey]);

  const handleSidebarScroll = () => {
    if (scrollKey && sidebarRef.current) {
      sessionStorage.setItem(scrollKey, String(sidebarRef.current.scrollTop));
    }
  };

  /* ── Logout ── */
  const handleLogout = () => {
    logout?.();
    navigate('/login');
  };

  const resolvedDisplayName =
    displayName || account?.fullName || account?.name || account?.email || brandLabel || 'User';

  return (
    <div className={`dashboard-layout ${shellClassName}`.trim()}>
      {/* ════════════════════════════════════════════════════════
          SIDEBAR — 3 / 12  (25 %)
          ════════════════════════════════════════════════════════ */}
      <aside className={`dashboard-sidebar${open ? ' open' : ''}`}>
        {/* Brand */}
        <div className="dashboard-sidebar-brand">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black">
              P
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">PetGo</p>
              {brandLabel && (
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                  {brandLabel}
                </p>
              )}
            </div>
          </Link>
          <button className="lg:hidden p-2" onClick={() => setOpen(false)} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav ref={sidebarRef} onScroll={handleSidebarScroll} className="dashboard-sidebar-nav">
          {SidebarComponent && <SidebarComponent onItemClick={() => setOpen(false)} />}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-sm text-red-500 hover:bg-red-50 transition-all"
            type="button"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="dashboard-overlay" onClick={() => setOpen(false)} />}

      {/* ════════════════════════════════════════════════════════
          BODY — 9 / 12  (75 %)
          ════════════════════════════════════════════════════════ */}
      <div className="dashboard-body">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-inner">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
                onClick={() => setOpen(true)}
                type="button"
              >
                <Menu className="w-6 h-6" />
              </button>
              {headerLeftExtra}
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black truncate">{title}</h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                title="Về trang thương mại"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600"
              >
                <Home className="w-4 h-4" /> Trang thương mại
              </Link>
              {headerActions}
              <div className="text-right hidden md:block">
                <p className="text-sm font-black truncate max-w-48">{resolvedDisplayName}</p>
                {roleLabel && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
                    {roleLabel}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={`dashboard-main ${mainClassName}`.trim()}>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
