import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  FileText,
  Gift,
  ListTree,
  Package,
  Scissors,
  ShoppingCart,
  Star,
  Store,
  Users,
  Wallet,
} from 'lucide-react';

/**
 * Admin sidebar navigation groups.
 * Exported so AdminLayout can derive pageTitle / pageSubtitle from them.
 */
export const adminNavGroups = [
  {
    title: 'Quản lý hệ thống',
    items: [
      { id: 'admin-users', icon: Users, label: 'Người dùng', path: '/admin/users', badge: 3, subtitle: 'Quản lý tài khoản, role và trạng thái truy cập' },
      { id: 'admin-partners', icon: Store, label: 'Đối tác', path: '/admin/partners', badge: 5, subtitle: 'Duyệt hồ sơ, quản trị nhà cung cấp và trạng thái provider' },
      { id: 'admin-services', icon: Scissors, label: 'Dịch vụ', path: '/admin/services', subtitle: 'Quản lý danh mục và service taxonomy' },
      { id: 'admin-service-requests', icon: FileText, label: 'Duyệt dịch vụ', path: '/admin/partner-service-requests', subtitle: 'Duyệt yêu cầu tạo/cập nhật dịch vụ từ partner' },
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

/**
 * AdminSidebar — sidebar navigation component cho role ADMIN.
 * Được gọi bởi DashboardLayout thông qua AdminLayout.
 *
 * @param {{ onItemClick?: () => void }} props
 */
const AdminSidebar = ({ onItemClick }) => (
  <div className="space-y-5">
    {adminNavGroups.map((group) => (
      <div key={group.title} className="space-y-2">
        <p className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
          {group.title}
        </p>
        {group.items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-sm transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-xl shadow-orange-100'
                    : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                      }`}
                    >
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
  </div>
);

export default AdminSidebar;
