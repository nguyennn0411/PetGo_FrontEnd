import { useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import AdminSidebar, { adminNavGroups } from './sidebars/AdminSidebar';
import '../styles/AdminDashboard.css';

/**
 * AdminLayout — Wrapper layout cho các trang Admin.
 *
 * Bên trong sử dụng DashboardLayout (shared) + AdminSidebar.
 * Các trang admin (AdminUsers, AdminPartners, …) chỉ cần wrap trong
 * <AdminLayout> mà không cần biết chi tiết sidebar hay grid.
 */
const AdminLayout = ({ children, title }) => {
  const { account } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Tự động resolve tiêu đề dựa trên URL hiện tại ── */
  const activeItem = useMemo(
    () =>
      adminNavGroups
        .flatMap((group) => group.items)
        .find(
          (item) =>
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`),
        ),
    [location.pathname],
  );

  const displayName = account?.fullName || account?.name || account?.email || 'Admin';
  const pageTitle = title || activeItem?.label || 'Dashboard admin';
  const pageSubtitle = activeItem?.subtitle || 'Điều phối và giám sát hệ sinh thái PetGo';

  /* ── Header bên trái: nút quay lại ── */
  const headerLeftExtra = (
    <button
      onClick={() => navigate('/')}
      className="hidden sm:flex p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-orange-500"
      type="button"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );

  /* ── Header bên phải: nút thông báo ── */
  const headerActions = (
    <button
      onClick={() => navigate('/admin/notifications')}
      className="relative p-3 rounded-2xl bg-gray-50 text-gray-500 hover:text-orange-500 hover:bg-orange-50"
      title="Thông báo"
      type="button"
    >
      <MessageSquare className="w-5 h-5" />
    </button>
  );

  return (
    <DashboardLayout
      SidebarComponent={AdminSidebar}
      brandLabel="Admin"
      title={pageTitle}
      subtitle={pageSubtitle}
      displayName={displayName}
      roleLabel="System admin"
      headerLeftExtra={headerLeftExtra}
      headerActions={headerActions}
      shellClassName="admin-shell"
      mainClassName="admin-content-area"
    >
      {children}
    </DashboardLayout>
  );
};

export default AdminLayout;
