import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, PawPrint, Search, ShoppingBasket, User, X } from 'lucide-react';

const navClass = ({ isActive }) =>
  `font-black uppercase tracking-widest text-xs transition-colors ${isActive ? 'text-orange-600' : 'text-gray-500 hover:text-orange-600'}`;

export default function ShopLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const submitSearch = (event) => {
    event.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/shop/category?keyword=${encodeURIComponent(q)}` : '/shop/category');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-800 font-sans">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-orange-500 text-white p-2.5 rounded-2xl shadow-lg shadow-orange-100">
              <PawPrint className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-gray-900">Pet<span className="text-orange-500">Go</span></div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 -mt-1">Pet Store</div>
            </div>
          </Link>

          <form onSubmit={submitSearch} className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm hạt, pate, phụ kiện..."
                className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-orange-500/20 font-bold"
              />
            </div>
          </form>

          <nav className="hidden lg:flex items-center gap-6">
            <NavLink to="/" className={navClass}>Home</NavLink>
            <NavLink to="/search" className={navClass}>Services</NavLink>
            <NavLink to="/shop" className={navClass}>Store</NavLink>
            <NavLink to="/my-bookings" className={navClass}>Bookings</NavLink>
            <NavLink to="/membership" className={navClass}>Membership</NavLink>
            <Link to="/cart" className="relative p-3 rounded-2xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
              <ShoppingBasket className="w-5 h-5" />
            </Link>
            <Link to="/profile" className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-orange-600" />
            </Link>
          </nav>

          <button className="lg:hidden p-2" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="lg:hidden bg-white border-t border-orange-100 px-4 pb-5 space-y-3">
            <NavLink to="/" className="block font-black text-sm text-gray-600" onClick={() => setOpen(false)}>Trang chủ</NavLink>
            <NavLink to="/search" className="block font-black text-sm text-gray-600" onClick={() => setOpen(false)}>Dịch vụ</NavLink>
            <NavLink to="/shop" className="block font-black text-sm text-orange-600" onClick={() => setOpen(false)}>Cửa hàng</NavLink>
            <NavLink to="/cart" className="block font-black text-sm text-gray-600" onClick={() => setOpen(false)}>Giỏ hàng</NavLink>
            <NavLink to="/my-orders" className="block font-black text-sm text-gray-600" onClick={() => setOpen(false)}>Đơn hàng</NavLink>
          </div>
        )}
      </header>
      {children}
      <footer className="bg-gray-950 text-white mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="text-2xl font-black">Pet<span className="text-orange-500">Go</span> Store</div>
            <p className="mt-3 text-gray-400 max-w-lg text-sm leading-7">Cửa hàng đồ ăn, phụ kiện và sản phẩm chăm sóc thú cưng, đồng bộ cùng hệ thống đặt lịch dịch vụ PetGo.</p>
          </div>
          <div>
            <div className="font-black text-orange-300 uppercase text-xs tracking-widest mb-3">Liên kết</div>
            <div className="space-y-2 text-sm text-gray-400"><div>Dịch vụ chăm sóc</div><div>Cửa hàng thú cưng</div><div>Đơn hàng của tôi</div></div>
          </div>
          <div>
            <div className="font-black text-orange-300 uppercase text-xs tracking-widest mb-3">Hỗ trợ</div>
            <div className="space-y-2 text-sm text-gray-400"><div>Hotline: 1900 6789</div><div>Email: hotro@petgo.vn</div><div>Hà Nội & TP.HCM</div></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
