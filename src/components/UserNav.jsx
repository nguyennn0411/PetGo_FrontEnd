import React, { useContext, useEffect, useRef, useState } from 'react';
import { Bell, Calendar, Crown, Heart, LogOut, Menu, PawPrint, Search, ShoppingBag, User, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getRoleLandingPath, hasAdminRole, hasPartnerRole } from '../utils/partnerAccess';

const navItems = [
    { to: '/', label: 'Trang chủ' },
    { to: '/search', label: 'Dịch vụ', icon: Search },
    { to: '/shop', label: 'Cửa hàng', icon: ShoppingBag },
    { to: '/my-bookings', label: 'Booking', icon: Calendar },
    { to: '/favorites', label: 'Yêu thích', icon: Heart },
];

const UserNav = ({ activePath = '' }) => {
    const navigate = useNavigate();
    const { account, loadingAccount, logout } = useContext(AuthContext);
    const [open, setOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const canViewDashboard = account && (hasAdminRole(account) || hasPartnerRole(account));
    const dashboardPath = canViewDashboard ? getRoleLandingPath(account, '/profile') : '/profile';

    useEffect(() => {
        if (!profileOpen) {
            return undefined;
        }

        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [profileOpen]);

    const isActive = (path) => activePath ? activePath === path : undefined;

    const handleLogout = () => {
        setProfileOpen(false);
        logout?.();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
                <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="PetGo trang chủ">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-100">
                        <PawPrint className="h-5 w-5" />
                    </span>
                    <span className="text-2xl font-black tracking-tighter text-gray-950">Pet<span className="text-orange-500">Go</span></span>
                </Link>

                <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive: routerActive }) => `relative py-2 text-sm font-extrabold transition-colors ${isActive(item.to) || routerActive ? 'text-orange-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-orange-500' : 'text-gray-600 hover:text-orange-600'}`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="hidden shrink-0 items-center gap-2 lg:flex">
                    <Link to="/membership" className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2.5 text-xs font-black text-orange-700 transition-colors hover:border-orange-200 hover:bg-orange-100">
                        <Crown className="h-4 w-4" /> Membership
                    </Link>
                    {account && (
                        <Link to="/notifications" className="grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:border-orange-200 hover:text-orange-500" aria-label="Thông báo">
                            <Bell className="h-5 w-5" />
                        </Link>
                    )}
                    {loadingAccount ? (
                        <div className="h-10 w-24 animate-pulse rounded-full bg-gray-100" />
                    ) : account ? (
                        <div ref={profileRef} className="relative">
                            <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm font-black text-gray-800 transition-colors hover:border-orange-200 hover:text-orange-600">
                                <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-50 text-orange-600"><User className="h-4 w-4" /></span>
                                <span className="max-w-28 truncate">Tài khoản</span>
                            </button>
                            {profileOpen && (
                                <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-200/70">
                                    <button onClick={() => { setProfileOpen(false); navigate('/profile'); }} className="w-full rounded-2xl px-4 py-3 text-left text-sm font-black hover:bg-orange-50">Hồ sơ cá nhân</button>
                                    {canViewDashboard && <button onClick={() => { setProfileOpen(false); navigate(dashboardPath); }} className="w-full rounded-2xl px-4 py-3 text-left text-sm font-black hover:bg-orange-50">Dashboard</button>}
                                    <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-black text-red-500 hover:bg-red-50"><LogOut className="h-4 w-4" /> Đăng xuất</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login" className="rounded-full px-4 py-2.5 text-sm font-extrabold text-gray-700 transition-colors hover:bg-gray-50 hover:text-orange-600">Đăng nhập</Link>
                            <Link to="/register" className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-black text-white shadow-sm shadow-orange-100 transition-colors hover:bg-orange-600">Đăng ký</Link>
                        </div>
                    )}
                </div>

                <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white lg:hidden" aria-label="Mở menu">
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {open && (
                <div className="border-t border-gray-100 bg-white px-4 py-4 lg:hidden">
                    <div className="grid gap-2">
                        {navItems.map((item) => (
                            <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-gray-800 hover:bg-orange-50">
                                {item.icon ? <item.icon className="h-4 w-4 text-orange-500" /> : <PawPrint className="h-4 w-4 text-orange-500" />}
                                {item.label}
                            </Link>
                        ))}
                        <Link to="/membership" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-gray-800 hover:bg-orange-50">
                            <Crown className="h-4 w-4 text-orange-500" /> Membership
                        </Link>
                        {account && (
                            <Link to="/notifications" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-gray-800 hover:bg-orange-50">
                                <Bell className="h-4 w-4 text-orange-500" /> Thông báo
                            </Link>
                        )}
                        {account ? (
                            <Link to="/profile" onClick={() => setOpen(false)} className="rounded-2xl bg-gray-950 px-4 py-3 text-center text-sm font-black text-white">
                                Hồ sơ cá nhân
                            </Link>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <Link to="/login" onClick={() => setOpen(false)} className="rounded-2xl border border-gray-200 px-4 py-3 text-center text-sm font-black text-gray-800">
                                    Đăng nhập
                                </Link>
                                <Link to="/register" onClick={() => setOpen(false)} className="rounded-2xl bg-orange-500 px-4 py-3 text-center text-sm font-black text-white">
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default UserNav;