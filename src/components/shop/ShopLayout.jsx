import React from 'react';

export default function ShopLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-gray-800 font-sans">
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
