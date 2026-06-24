import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  Gift,
  HelpCircle,
  Scissors,
  ShoppingBag,
  Star,
  Store,
  Users,
} from 'lucide-react';

/**
 * Partner sidebar navigation groups.
 * Exported so PartnerLayout can use them if needed.
 */
export const partnerNavGroups = [
  {
    title: 'Tổng quan',
    items: [{ label: 'Dashboard', path: '/partner/dashboard', icon: BarChart3 }],
  },
  {
    title: 'Quản lý nhà cung cấp',
    items: [
      { label: 'Hồ sơ nhà cung cấp', path: '/partner/profile', icon: Store },
      { label: 'Dịch vụ', path: '/partner/services', icon: Scissors },
      { label: 'Khuyến mãi', path: '/partner/promotions', icon: Gift },
      { label: 'Lịch làm việc', path: '/partner/schedule', icon: CalendarDays },
    ],
  },
  {
    title: 'Vận hành',
    items: [
      { label: 'Booking', path: '/partner/bookings', icon: ShoppingBag },
      { label: 'Khách hàng', path: '/partner/customers', icon: Users },
      { label: 'Đánh giá', path: '/partner/reviews', icon: Star },
    ],
  },
  {
    title: 'Tài chính & hệ thống',
    items: [
      { label: 'Doanh thu', path: '/partner/revenue', icon: CreditCard },
      { label: 'Thông báo', path: '/partner/notifications', icon: Bell },
      { label: 'Hỗ trợ', path: '/partner/support', icon: HelpCircle },
    ],
  },
];

/**
 * PartnerSidebar — sidebar navigation component cho role PARTNER / PROVIDER.
 * Được gọi bởi DashboardLayout thông qua PartnerLayout.
 *
 * @param {{ onItemClick?: () => void }} props
 */
const PartnerSidebar = ({ onItemClick }) => (
  <div className="space-y-5">
    {partnerNavGroups.map((group) => (
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
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    ))}
  </div>
);

export default PartnerSidebar;
