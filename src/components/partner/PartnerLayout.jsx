import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Bell,
    CalendarDays,
    CreditCard,
    Gift,
    HelpCircle,
    Home,
    LogOut,
    Menu,
    Scissors,
    ShoppingBag,
    Star,
    Store,
    Users,
    X,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { canAccessPartnerArea } from '../../utils/partnerAccess';
import { getPartnerProfile } from '../../api/partner';
import { PartnerLoadingState } from './PartnerStates';

const partnerSidebarScrollKey = 'partner_sidebar_scroll_top';

const navGroups = [
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

const PartnerLayout = ({ children, title = 'Partner Dashboard', subtitle = 'Quản lý nhà cung cấp và vận hành booking của bạn', providerName }) => {
    const navigate = useNavigate();
    const { account, loadingAccount, logout } = useContext(AuthContext);
    const [open, setOpen] = useState(false);
    const [remoteProviderName, setRemoteProviderName] = useState(null);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const saved = sessionStorage.getItem(partnerSidebarScrollKey);
        if (sidebarRef.current && saved) {
            sidebarRef.current.scrollTop = Number(saved) || 0;
        }
    }, []);

    useEffect(() => {
        if (providerName || loadingAccount || !account) return undefined;

        let isMounted = true;
        getPartnerProfile()
            .then((profile) => {
                if (!isMounted) return;
                setRemoteProviderName(profile?.businessName || profile?.providerName || null);
            })
            .catch(() => {
                if (!isMounted) return;
                setRemoteProviderName(null);
            });

        return () => {
            isMounted = false;
        };
    }, [providerName, loadingAccount, account]);

    if (loadingAccount) {
        return <div className="min-h-screen bg-gray-50 p-6"><PartnerLoadingState /></div>;
    }

    if (!account) {
        return <Navigate to="/login" replace />;
    }

    if (!canAccessPartnerArea(account)) {
        return <Navigate to="/partner-registration/provider" replace />;
    }

    const handleLogout = () => {
        logout?.();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans lg:flex">
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 shadow-2xl lg:shadow-none transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-20 px-6 flex items-center justify-between border-b border-gray-50">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black">P</div>
                        <div>
                            <p className="text-xl font-black tracking-tight">PetGo</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Partner</p>
                        </div>
                    </Link>
                    <button className="lg:hidden p-2" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
                </div>

                <nav
                    ref={sidebarRef}
                    onScroll={() => {
                        if (sidebarRef.current) {
                            sessionStorage.setItem(partnerSidebarScrollKey, String(sidebarRef.current.scrollTop));
                        }
                    }}
                    className="p-4 space-y-5 overflow-y-auto h-[calc(100vh-5rem)]"
                >
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
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-sm text-red-500 hover:bg-red-50 transition-all">
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
                            <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setOpen(true)}><Menu className="w-6 h-6" /></button>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-black truncate">{title}</h1>
                                <p className="text-xs sm:text-sm text-gray-500 font-semibold truncate">{subtitle}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/" title="Về trang thương mại" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600">
                                <Home className="w-4 h-4" /> Trang thương mại
                            </Link>
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-black truncate max-w-48">{providerName || remoteProviderName || account?.businessName || account?.providerName || account?.fullName || account?.name || 'Partner'}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Verified provider</p>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default PartnerLayout;