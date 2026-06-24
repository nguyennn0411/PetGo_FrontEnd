import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  RefreshCw,
  Award,
  Heart,
  ChevronDown,
  Scissors,
  Layers,
  Sparkles,
  Percent,
  BarChart3,
  CalendarCheck
} from 'lucide-react';

export default function App() {
  // Trạng thái tab hiển thị hiện tại: 'overview' | 'services' | 'products'
  const [activeTab, setActiveTab] = useState('overview');
  
  // Trạng thái tìm kiếm đơn hàng
  const [searchTerm, setSearchTerm] = useState('');
  
  // Trạng thái lọc theo trạng thái đơn hàng
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  // Trạng thái bộ lọc loại đơn (Tất cả, Hàng hóa, Dịch vụ)
  const [typeFilter, setTypeFilter] = useState('Tất cả');

  // Trạng thái hover biểu đồ để hiển thị chi tiết điểm dữ liệu
  const [hoveredBar, setHoveredBar] = useState(null);

  // Trạng thái thêm nhanh đơn hàng giả lập để tăng tính tương tác
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer: '',
    itemType: 'Hàng hóa',
    product: 'Catsrang Adult (Bao 5kg)',
    amount: '',
    status: 'Đã giao'
  });

  // Thông báo toast tạm thời khi ghi nhận doanh thu thành công
  const [toastMessage, setToastMessage] = useState('');

  // 1. DANH MỤC DỊCH VỤ SPA & GROOMING (Phục vụ mục đích phân tích & theo dõi doanh thu)
  const servicesCatalog = [
    {
      id: 'SVC-001',
      name: 'Gói tắm sấy nhanh PetGo',
      category: 'Tắm sấy chó mèo',
      description: 'Bao gồm tắm, sấy, chải lông, vệ sinh tai móng nhẹ.',
      price: 180000,
      imageEmoji: '🐕🚿'
    },
    {
      id: 'SVC-002',
      name: 'Grooming tạo kiểu premium',
      category: 'Cắt tỉa theo giống',
      description: 'Tư vấn kiểu lông, cắt tỉa, sấy tạo phồng và hoàn thiện ngoại hình.',
      price: 350000,
      imageEmoji: '✂️🐩'
    },
    {
      id: 'SVC-003',
      name: 'Spa khử mùi & dưỡng lông',
      category: 'Spa trị liệu',
      description: 'Tắm spa, massage nhẹ, xịt dưỡng và chăm sóc lông cho thú cưng cần thư giãn.',
      price: 280000,
      imageEmoji: '🌸🧼'
    },
    {
      id: 'SVC-004',
      name: 'Grooming mèo lông dài',
      category: 'Cắt tỉa theo giống',
      description: 'Dịch vụ grooming cho mèo lông dài, xử lý lông rối nhẹ và tỉa gọn vùng cần thiết.',
      price: 420000,
      imageEmoji: '🐱✨'
    }
  ];

  // 2. DANH SÁCH SẢN PHẨM / HÀNG HÓA CHI TIẾT (Theo đúng bảng giá image_e0dbbd.png)
  const productsCatalog = [
    // 1. THỨC ĂN HẠT CATSRANG (HÀN QUỐC)
    { id: 1, category: 'Thức ăn hạt Catsrang', name: 'Catsrang Kitten (Mèo con dưới 12 tháng)', spec: 'Bao 5kg', costPrice: 350000, sellPrice: 470000 },
    { id: 2, category: 'Thức ăn hạt Catsrang', name: 'Catsrang Adult (Mèo trưởng thành trên 1 năm)', spec: 'Bao 5kg', costPrice: 350000, sellPrice: 470000 },
    { id: 3, category: 'Thức ăn hạt Catsrang', name: 'Catsrang All Stage (Mèo mọi lứa tuổi)', spec: 'Bao 5kg', costPrice: 350000, sellPrice: 470000 },
    // 2. THỨC ĂN HẠT WHISKAS
    { id: 4, category: 'Thức ăn hạt Whiskas', name: 'Whiskas Junior / Adult Gói Nhỏ', spec: 'Gói 400g - 450g', costPrice: 32000, sellPrice: 49000 },
    { id: 5, category: 'Thức ăn hạt Whiskas', name: 'Whiskas Junior / Adult Gói Vừa', spec: 'Gói 1.1kg - 1.2kg', costPrice: 85000, sellPrice: 120000 },
    // 3. SỮA TẮM CHÓ MÈO
    { id: 6, category: 'Sữa tắm chó mèo', name: 'Sữa tắm SOS Màu Xanh Dương (Cho lông trắng)', spec: 'Chai 530ml', costPrice: 45000, sellPrice: 90000 },
    { id: 7, category: 'Sữa tắm chó mèo', name: 'Sữa tắm SOS Màu Nâu Đỏ (Cho lông màu/nâu)', spec: 'Chai 530ml', costPrice: 45000, sellPrice: 90000 },
    { id: 8, category: 'Sữa tắm chó mèo', name: 'Sữa tắm SOS Màu Trắng (Cho mèo mọi loại lông)', spec: 'Chai 530ml', costPrice: 45000, sellPrice: 90000 },
    { id: 9, category: 'Sữa tắm chó mèo', name: 'Sữa tắm SOS Màu Đen (Trị ve rận, nấm ngứa)', spec: 'Chai 530ml', costPrice: 45000, sellPrice: 90000 },
    // 4. SÚP THƯỞNG CHÓ MÈO
    { id: 10, category: 'Súp thưởng chó mèo', name: 'Súp thưởng CIAO Churu Nhật Bản (Cao cấp)', spec: 'Túi (4 thanh x 14g)', costPrice: 18000, sellPrice: 39000 },
    { id: 11, category: 'Súp thưởng chó mèo', name: 'Súp thưởng CIAO Churu Nhật Bản (Cao cấp)', spec: 'Hộp/Hũ (50 thanh)', costPrice: 230000, sellPrice: 350000 },
    { id: 12, category: 'Súp thưởng chó mèo', name: 'Súp thưởng Wanpy / Shizuka (Phổ thông)', spec: 'Thanh lẻ 14g', costPrice: 1200, sellPrice: 3000 },
    // 5. CÁT VỆ SINH CHO MÈO MOON CAT
    { id: 13, category: 'Cát vệ sinh Moon Cat', name: 'Cát đất sét Moon Cat Bentonite hương Cafe/Chanh', spec: 'Túi 8L (~4kg)', costPrice: 25000, sellPrice: 45000 },
    { id: 14, category: 'Cát vệ sinh Moon Cat', name: 'Cát đất sét Moon Cat Bentonite tiết kiệm', spec: 'Bao lớn 16L/18L', costPrice: 65000, sellPrice: 100000 }
  ];

  // 3. DANH SÁCH ĐƠN HÀNG THỰC TẾ (Tổng Doanh Thu Khởi Tạo Đạt Đúng 4.900.000đ)
  // Phân chia: Doanh thu dịch vụ đạt 1.590.000đ, Doanh thu hàng hóa đạt 3.310.000đ
  const [orders, setOrders] = useState([
    // --- DOANH THU DỊCH VỤ SPA = 1.590.000 đ (Khớp số lượt booking của ảnh: 3 tắm sấy, 3 tạo kiểu) ---
    { id: 'OD-9082', customer: 'Nguyễn Minh Thư', product: 'Gói tắm sấy nhanh PetGo', amount: 180000, date: '2026-06-18', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Chó' },
    { id: 'OD-9081', customer: 'Trần Hoàng Long', product: 'Grooming tạo kiểu premium', amount: 350000, date: '2026-06-18', status: 'Đang xử lý', itemType: 'Dịch vụ', petType: 'Chó' },
    { id: 'OD-9080', customer: 'Lê Mỹ Duyên', product: 'Gói tắm sấy nhanh PetGo', amount: 180000, date: '2026-06-17', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Mèo' },
    { id: 'OD-9078', customer: 'Vũ Thị Thanh', product: 'Grooming tạo kiểu premium', amount: 350000, date: '2026-06-16', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Chó' },
    { id: 'OD-9077', customer: 'Hoàng Quốc Bảo', product: 'Gói tắm sấy nhanh PetGo', amount: 180000, date: '2026-06-16', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Mèo' },
    { id: 'OD-9074', customer: 'Bùi Phương Thảo', product: 'Grooming tạo kiểu premium', amount: 350000, date: '2026-06-14', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Chó' },
    
    // --- DOANH THU HÀNG HÓA = 3.310.000 đ ---
    { id: 'OD-9001', customer: 'Đặng Kim Ngân', product: 'Catsrang Kitten (Bao 5kg)', amount: 470000, date: '2026-06-18', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
    { id: 'OD-9002', customer: 'Lê Hoài Nam', product: 'Catsrang Adult (Bao 5kg) x 2', amount: 940000, date: '2026-06-18', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
    { id: 'OD-9003', customer: 'Nguyễn Bích Ngọc', product: 'Whiskas Junior / Adult Gói Vừa x 3', amount: 360000, date: '2026-06-17', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
    { id: 'OD-9004', customer: 'Trần Thế Vinh', product: 'Sữa tắm SOS Màu Xanh Dương (Cho lông trắng) x 2', amount: 180000, date: '2026-06-17', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Chó' },
    { id: 'OD-9005', customer: 'Phan Minh Trí', product: 'Sữa tắm SOS Màu Nâu Đỏ (Cho lông màu/nâu) x 2', amount: 180000, date: '2026-06-16', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Chó' },
    { id: 'OD-9006', customer: 'Phạm Kiều Trang', product: 'Súp thưởng CIAO Churu Nhật Bản (Cao cấp) Hộp 50 thanh x 2', amount: 700000, date: '2026-06-15', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
    { id: 'OD-9007', customer: 'Mai Quốc Huy', product: 'Cát đất sét Moon Cat Bentonite hương Cafe/Chanh x 4', amount: 180000, date: '2026-06-15', status: 'Đang xử lý', itemType: 'Hàng hóa', petType: 'Mèo' },
    { id: 'OD-9008', customer: 'Đỗ Thúy Vy', product: 'Cát đất sét Moon Cat Bentonite tiết kiệm x 3', amount: 300000, date: '2026-06-14', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
    
    // Đơn hủy (không cộng vào doanh thu)
    { id: 'OD-9079', customer: 'Phạm Tuấn Kiệt', product: 'Súp thưởng Wanpy / Shizuka (Phổ thông) x 10', amount: 30000, date: '2026-06-17', status: 'Đã hủy', itemType: 'Hàng hóa', petType: 'Cả hai' },
  ]);

  // Phân bổ doanh thu biểu đồ cột tuần này (~4.9M)
  const weeklySalesData = [
    { day: 'Thứ 2', revenue: 650000, orders: 2 },
    { day: 'Thứ 3', revenue: 780000, orders: 3 },
    { day: 'Thứ 4', revenue: 560000, orders: 2 },
    { day: 'Thứ 5', revenue: 1120000, orders: 4 },
    { day: 'Thứ 6', revenue: 420000, orders: 1 },
    { day: 'Thứ 7', revenue: 1020000, orders: 3 },
    { day: 'Chủ Nhật', revenue: 350000, orders: 1 },
  ];

  // Tính toán tất cả thống kê tài chính trực tiếp từ dữ liệu đơn hàng
  const stats = useMemo(() => {
    // Chỉ tính doanh thu từ các đơn hàng không bị hủy
    const validOrders = orders.filter(o => o.status !== 'Đã hủy');
    
    const totalRevenue = validOrders.reduce((sum, order) => sum + order.amount, 0);
    
    const serviceRevenue = validOrders
      .filter(o => o.itemType === 'Dịch vụ')
      .reduce((sum, order) => sum + order.amount, 0);
      
    const productRevenue = validOrders
      .filter(o => o.itemType === 'Hàng hóa')
      .reduce((sum, order) => sum + order.amount, 0);

    const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
    const pendingCount = orders.filter(o => o.status === 'Đang xử lý').length;
    
    const servicePercent = totalRevenue > 0 ? Math.round((serviceRevenue / totalRevenue) * 100) : 0;
    const productPercent = totalRevenue > 0 ? Math.round((productRevenue / totalRevenue) * 100) : 0;

    const target = 5000000;
    const progressPercent = Math.min(Math.round((totalRevenue / target) * 100), 100);

    return {
      totalRevenue,
      serviceRevenue,
      productRevenue,
      servicePercent,
      productPercent,
      orderCount: validOrders.length,
      averageOrderValue,
      pendingCount,
      progressPercent,
      target
    };
  }, [orders]);

  // Phân tích doanh số lũy kế theo từng gói dịch vụ để hiển thị ở tab Spa
  const servicesSalesStats = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'Đã hủy' && o.itemType === 'Dịch vụ');
    const totalSpaRev = stats.serviceRevenue || 1; // Tránh chia cho 0

    return servicesCatalog.map(svc => {
      // Đếm số lượng booking thực tế của dịch vụ này từ mảng orders
      const bookingsCount = validOrders.filter(o => o.product === svc.name).length;
      const totalRevenueGenerated = bookingsCount * svc.price;
      const contributionPercent = Math.round((totalRevenueGenerated / totalSpaRev) * 100);

      return {
        ...svc,
        bookings: bookingsCount,
        revenue: totalRevenueGenerated,
        percent: contributionPercent
      };
    });
  }, [orders, stats.serviceRevenue]);

  // Định dạng tiền tệ VND
  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Lọc đơn hàng dựa trên ô tìm kiếm và các thẻ select bộ lọc
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'Tất cả' || order.status === statusFilter;
      const matchesType = typeFilter === 'Tất cả' || order.itemType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, searchTerm, statusFilter, typeFilter]);

  // Trình kích hoạt thông báo góc màn hình
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Ghi nhận nhanh doanh thu trực tiếp cho một dịch vụ Spa
  const handleQuickLogServiceRevenue = (serviceName, price) => {
    const code = `OD-${Math.floor(1000 + Math.random() * 9000)}`;
    const freshOrder = {
      id: code,
      customer: 'Khách Spa Vãng Lai',
      product: serviceName,
      amount: price,
      date: new Date().toISOString().split('T')[0],
      status: 'Đã giao',
      itemType: 'Dịch vụ',
      petType: serviceName.includes('mèo') ? 'Mèo' : 'Chó'
    };
    
    setOrders(prev => [freshOrder, ...prev]);
    showToast(`⚡ Đã cộng dồn +${formatVND(price)} vào doanh số từ gói: ${serviceName}`);
  };

  // Hàm tạo đơn hàng mới từ hộp thoại Modal
  const handleAddOrder = (e) => {
    e.preventDefault();
    if (!newOrder.customer || !newOrder.amount) return;

    const code = `OD-${Math.floor(1000 + Math.random() * 9000)}`;
    const freshOrder = {
      id: code,
      customer: newOrder.customer,
      product: newOrder.product,
      amount: parseFloat(newOrder.amount),
      date: new Date().toISOString().split('T')[0],
      status: newOrder.status,
      itemType: newOrder.itemType,
      petType: Math.random() > 0.5 ? 'Chó' : 'Mèo'
    };

    setOrders([freshOrder, ...orders]);
    setShowAddModal(false);
    showToast(`Tạo thành công hóa đơn đơn hàng ${code} trị giá ${formatVND(newOrder.amount)}`);
    setNewOrder({ customer: '', itemType: 'Hàng hóa', product: 'Catsrang Adult (Bao 5kg)', amount: '', status: 'Đã giao' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-12 relative">
      
      {/* Toast Alert thông báo mượt mà */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce border border-slate-700 max-w-sm">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Thanh Điều Hướng Trên Cùng */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Tên Cửa Hàng */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-orange-500 to-amber-500 text-white p-2.5 rounded-2xl shadow-md shadow-orange-100">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">PET GO</span>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">Kênh Quản Trị</span>
              </div>
              <p className="text-xs text-slate-400 font-bold">Quản lý dòng tiền mảng dịch vụ & hàng hóa thực tế</p>
            </div>
          </div>

          {/* Menu chọn TAB quản lý */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${
                activeTab === 'overview' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📊 Doanh Số Tổng Quan
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'services' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 animate-pulse text-orange-500" />
              Doanh Thu Spa ({formatVND(stats.serviceRevenue)})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'products' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Hàng Hóa & Kho
            </button>
          </div>

          {/* Các nút hành động trên thanh điều hướng */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                // Khôi phục mảng đơn hàng chuẩn mốc 4.900.000đ
                setOrders([
                  { id: 'OD-9082', customer: 'Nguyễn Minh Thư', product: 'Gói tắm sấy nhanh PetGo', amount: 180000, date: '2026-06-18', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Chó' },
                  { id: 'OD-9081', customer: 'Trần Hoàng Long', product: 'Grooming tạo kiểu premium', amount: 350000, date: '2026-06-18', status: 'Đang xử lý', itemType: 'Dịch vụ', petType: 'Chó' },
                  { id: 'OD-9080', customer: 'Lê Mỹ Duyên', product: 'Gói tắm sấy nhanh PetGo', amount: 180000, date: '2026-06-17', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Mèo' },
                  { id: 'OD-9078', customer: 'Vũ Thị Thanh', product: 'Grooming tạo kiểu premium', amount: 350000, date: '2026-06-16', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Chó' },
                  { id: 'OD-9077', customer: 'Hoàng Quốc Bảo', product: 'Gói tắm sấy nhanh PetGo', amount: 180000, date: '2026-06-16', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Mèo' },
                  { id: 'OD-9074', customer: 'Bùi Phương Thảo', product: 'Grooming tạo kiểu premium', amount: 350000, date: '2026-06-14', status: 'Đã giao', itemType: 'Dịch vụ', petType: 'Chó' },
                  { id: 'OD-9001', customer: 'Đặng Kim Ngân', product: 'Catsrang Kitten (Bao 5kg)', amount: 470000, date: '2026-06-18', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
                  { id: 'OD-9002', customer: 'Lê Hoài Nam', product: 'Catsrang Adult (Bao 5kg) x 2', amount: 940000, date: '2026-06-18', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
                  { id: 'OD-9003', customer: 'Nguyễn Bích Ngọc', product: 'Whiskas Junior / Adult Gói Vừa x 3', amount: 360000, date: '2026-06-17', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
                  { id: 'OD-9004', customer: 'Trần Thế Vinh', product: 'Sữa tắm SOS Màu Xanh Dương (Cho lông trắng) x 2', amount: 180000, date: '2026-06-17', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Chó' },
                  { id: 'OD-9005', customer: 'Phan Minh Trí', product: 'Sữa tắm SOS Màu Nâu Đỏ (Cho lông màu/nâu) x 2', amount: 180000, date: '2026-06-16', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Chó' },
                  { id: 'OD-9006', customer: 'Phạm Kiều Trang', product: 'Súp thưởng CIAO Churu Nhật Bản (Cao cấp) Hộp 50 thanh x 2', amount: 700000, date: '2026-06-15', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
                  { id: 'OD-9007', customer: 'Mai Quốc Huy', product: 'Cát đất sét Moon Cat Bentonite hương Cafe/Chanh x 4', amount: 180000, date: '2026-06-15', status: 'Đang xử lý', itemType: 'Hàng hóa', petType: 'Mèo' },
                  { id: 'OD-9008', customer: 'Đỗ Thúy Vy', product: 'Cát đất sét Moon Cat Bentonite tiết kiệm x 3', amount: 300000, date: '2026-06-14', status: 'Đã giao', itemType: 'Hàng hóa', petType: 'Mèo' },
                  { id: 'OD-9079', customer: 'Phạm Tuấn Kiệt', product: 'Súp thưởng Wanpy / Shizuka (Phổ thông) x 10', amount: 30000, date: '2026-06-17', status: 'Đã hủy', itemType: 'Hàng hóa', petType: 'Cả hai' },
                ]);
                showToast("Dữ liệu bán hàng Pet Go đã được đặt lại mốc 4.900.000đ.");
              }}
              className="p-2 text-slate-400 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 rounded-xl transition duration-200"
              title="Đặt lại dữ liệu mốc 4.9tr"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2 px-4 rounded-xl shadow-md shadow-orange-100 transition duration-200 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Hóa Đơn</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Nội dung trang thay đổi theo Tab lựa chọn */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
        
        {/* TAB 1: OVERVIEW (TỔNG QUAN DOANH SỐ) */}
        {activeTab === 'overview' && (
          <div>
            {/* Banner giới thiệu doanh số */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  Báo Cáo Doanh Số Pet Go <span className="text-xl">📊🐈</span>
                </h1>
                <p className="text-slate-500 text-xs mt-1">Hệ thống đồng bộ doanh thu thời gian thực từ doanh mục Hàng hóa & dịch vụ Spa.</p>
              </div>

              {/* Tỷ trọng phân bổ nguồn doanh số */}
              <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg flex items-center gap-1.5">
                  📦 Hàng hóa: <span className="font-extrabold">{stats.productPercent}%</span>
                </div>
                <div className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-1.5">
                  ✂️ Dịch vụ Spa: <span className="font-extrabold">{stats.servicePercent}%</span>
                </div>
              </div>
            </div>

            {/* 4 Chỉ Số Tài Chính Tổng Hợp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              
              {/* Doanh Thu Tổng */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 z-0"></div>
                <div className="relative z-10">
                  <span className="text-slate-400 text-[10px] font-black tracking-wider uppercase">Tổng Doanh Thu Lũy Kế</span>
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-800 mt-2">
                    {formatVND(stats.totalRevenue)}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2.5 text-xs font-bold text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Đạt {stats.progressPercent}% mục tiêu tuần (4.9 Tr)</span>
                  </div>
                </div>
              </div>

              {/* Doanh Thu Hàng Hóa */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 z-0"></div>
                <div className="relative z-10">
                  <span className="text-slate-400 text-[10px] font-black tracking-wider uppercase">Thu từ Bán Hàng Hóa</span>
                  <h3 className="text-2xl lg:text-3xl font-black text-amber-700 mt-2">
                    {formatVND(stats.productRevenue)}
                  </h3>
                  <div className="text-[11px] font-bold text-slate-500 mt-2.5">
                    Đóng góp {stats.productPercent}% cơ cấu doanh số
                  </div>
                </div>
              </div>

              {/* Doanh Thu Dịch Vụ */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 z-0"></div>
                <div className="relative z-10">
                  <span className="text-slate-400 text-[10px] font-black tracking-wider uppercase">Thu từ Gói Dịch Vụ Spa</span>
                  <h3 className="text-2xl lg:text-3xl font-black text-blue-700 mt-2">
                    {formatVND(stats.serviceRevenue)}
                  </h3>
                  <div className="text-[11px] font-bold text-slate-500 mt-2.5">
                    Đóng góp {stats.servicePercent}% cơ cấu doanh số
                  </div>
                </div>
              </div>

              {/* Đơn Chờ Xử Lý */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 z-0"></div>
                <div className="relative z-10">
                  <span className="text-slate-400 text-[10px] font-black tracking-wider uppercase">Số đơn chưa hoàn thành</span>
                  <h3 className="text-2xl lg:text-3xl font-black text-slate-800 mt-2">
                    {stats.pendingCount} <span className="text-sm font-medium text-slate-400">đơn chờ</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Bao gồm cả lịch hẹn chăm sóc chờ duyệt</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Khối Đồ Thị Doanh Số & Tỷ Trọng Phân Bổ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              
              {/* Biểu đồ doanh thu ngày trong tuần */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800">Biểu đồ Phân Bổ Doanh Số (Tuần Này)</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Biểu đồ cột theo dõi biến động doanh thu</p>
                  </div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">Tổng: {formatVND(stats.totalRevenue)}</span>
                </div>

                {/* SVG Biểu đồ cột */}
                <div className="relative mt-8 h-60 flex items-end justify-between px-2 sm:px-6">
                  <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none z-0">
                    {[1, 2, 3, 4].map((idx) => (
                      <div key={idx} className="w-full border-t border-dashed border-slate-100 h-0"></div>
                    ))}
                    <div className="w-full border-t border-slate-200 h-0"></div>
                  </div>

                  {weeklySalesData.map((data, index) => {
                    const maxVal = 1200000;
                    const percentHeight = (data.revenue / maxVal) * 100;

                    return (
                      <div 
                        key={index} 
                        className="relative flex flex-col items-center flex-1 group z-10 cursor-pointer"
                        onMouseEnter={() => setHoveredBar(index)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {hoveredBar === index && (
                          <div className="absolute -top-16 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex flex-col items-center gap-0.5 z-30 pointer-events-none transition-all duration-200">
                            <span>{formatVND(data.revenue)}</span>
                            <span className="text-[9px] text-slate-300">{data.orders} đơn hàng</span>
                            <div className="w-2 h-2 bg-slate-800 transform rotate-45 -mb-1 mt-1"></div>
                          </div>
                        )}

                        <div className="w-6 sm:w-10 bg-slate-100 rounded-t-lg h-44 flex items-end overflow-hidden transition-all duration-300 group-hover:bg-slate-200/50">
                          <div 
                            style={{ height: `${percentHeight}%` }} 
                            className="w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t from-orange-500 to-amber-400 group-hover:from-orange-600 group-hover:to-amber-500 shadow-sm"
                          ></div>
                        </div>

                        <span className="text-xs font-bold text-slate-500 mt-3 group-hover:text-orange-600 transition-colors">
                          {data.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tỷ trọng nguồn thu & phân tích mảng Spa */}
              <div className="flex flex-col gap-6">
                
                {/* Cơ cấu nguồn thu thực tế */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl flex-1 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-white/10 text-white/95 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Cơ cấu nguồn thu</span>
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-300">Dịch Vụ Spa vs Hàng Hóa</h4>
                  </div>

                  <div className="my-5 space-y-4">
                    {/* Hàng hóa */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">📦 Bán Hàng Hóa (Catsrang, SOS, Moon Cat...)</span>
                        <span className="text-amber-400">{formatVND(stats.productRevenue)} ({stats.productPercent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div style={{ width: `${stats.productPercent}%` }} className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                      </div>
                    </div>

                    {/* Dịch vụ */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-300">✂️ Dịch Vụ Spa & Cắt Tỉa PetGo</span>
                        <span className="text-blue-400">{formatVND(stats.serviceRevenue)} ({stats.servicePercent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div style={{ width: `${stats.servicePercent}%` }} className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                    💡 Doanh thu dịch vụ đạt <span className="text-white font-bold">{formatVND(stats.serviceRevenue)}</span> ổn định nhờ các gói trị liệu Spa & Grooming có giá trị đơn trung bình cao.
                  </div>
                </div>

                {/* Sức mạnh thương hiệu */}
                <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 flex items-center gap-3.5">
                  <div className="bg-orange-500 text-white p-2.5 rounded-2xl shrink-0">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">Hiệu suất mảng Dịch vụ</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dịch vụ spa chăm sóc đem lại tỷ suất lợi nhuận ròng cực cao cho cửa hàng do không tốn nhiều giá vốn nhập kho hàng hóa.
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* Bảng Chi Tiết Đơn Hàng Gần Đây */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">Danh Sách Giao Dịch Gần Nhất</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Đơn hàng sản phẩm kết hợp đặt lịch Spa & Grooming</p>
                </div>

                {/* Các bộ lọc kết hợp */}
                <div className="flex flex-wrap gap-2">
                  <select 
                    value={typeFilter} 
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    <option value="Tất cả">Phân loại: Tất cả</option>
                    <option value="Hàng hóa">📦 Hàng hóa</option>
                    <option value="Dịch vụ">✂️ Dịch vụ</option>
                  </select>

                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    <option value="Tất cả">Trạng thái: Tất cả</option>
                    <option value="Đã giao">Đã giao</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Đã hủy">Đã hủy</option>
                  </select>
                </div>
              </div>

              {/* Ô tìm kiếm đơn */}
              <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh tên khách hàng, mã đơn, sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Table hóa đơn */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="pb-3 pt-2">Mã Đơn</th>
                      <th className="pb-3 pt-2">Khách Hàng</th>
                      <th className="pb-3 pt-2">Phân Loại</th>
                      <th className="pb-3 pt-2">Sản Phẩm / Gói Dịch Vụ</th>
                      <th className="pb-3 pt-2 text-right">Doanh Số</th>
                      <th className="pb-3 pt-2 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-bold">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 text-slate-400 font-mono text-xs">{order.id}</td>
                          <td className="py-3.5">
                            <div>
                              <span className="text-slate-800 font-extrabold">{order.customer}</span>
                              <span className="ml-2 inline-block text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {order.petType}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              order.itemType === 'Dịch vụ' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {order.itemType === 'Dịch vụ' ? '✂️ Dịch vụ' : '📦 Hàng hóa'}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500 font-medium max-w-[200px] truncate">{order.product}</td>
                          <td className="py-3.5 text-right text-slate-800 font-extrabold">{formatVND(order.amount)}</td>
                          <td className="py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                              order.status === 'Đã giao' ? 'bg-emerald-50 text-emerald-700' :
                              order.status === 'Đang xử lý' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {order.status === 'Đã giao' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                              {order.status === 'Đang xử lý' && <Clock className="w-3 h-3 text-amber-500" />}
                              {order.status === 'Đã hủy' && <AlertCircle className="w-3 h-3 text-rose-500" />}
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                          Không tìm thấy đơn hàng tương ứng bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: SERVICES SPA (BẢNG QUẢN LÝ DOANH THU DỊCH VỤ - ĐÃ ĐƯỢC ĐƠN GIẢN HÓA) */}
        {activeTab === 'services' && (
          <div>
            {/* Giới thiệu doanh thu mảng Spa */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-2xl">
                  <Scissors className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Hiệu Suất Doanh Thu Gói Spa & Grooming</h2>
                  <p className="text-xs text-slate-400 mt-1">Đồng bộ trực tiếp với danh sách hóa đơn. Chỉ tập trung hiển thị doanh số bán hàng dịch vụ.</p>
                </div>
              </div>

              {/* Card Tổng doanh thu mảng Spa */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 self-stretch md:self-auto flex items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] text-blue-600 font-black block uppercase tracking-wider">Doanh thu mảng Spa</span>
                  <span className="text-xl font-black text-blue-900">{formatVND(stats.serviceRevenue)}</span>
                </div>
                <div className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-xl">
                  {stats.servicePercent}% Tổng thu
                </div>
              </div>
            </div>

            {/* Grid hiển thị thẻ doanh thu dịch vụ theo image_e0dea7.jpg nhưng tối ưu hóa hoàn toàn cho bán lẻ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {servicesSalesStats.map((svc) => (
                <div key={svc.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
                  
                  {/* Badge Active trạng thái bán */}
                  <div className="absolute top-6 right-6">
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100">
                      ACTIVE / ĐANG BÁN
                    </span>
                  </div>

                  <div>
                    {/* Tiêu đề dịch vụ */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{svc.imageEmoji}</span>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base">{svc.name}</h3>
                        <p className="text-slate-400 text-xs font-bold">{svc.category}</p>
                      </div>
                    </div>

                    {/* Mô tả dịch vụ */}
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                      {svc.description}
                    </p>
                  </div>

                  <div>
                    {/* Báo cáo tài chính trực quan cho dịch vụ này */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mb-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Giá niêm yết:</span>
                        <span className="font-extrabold text-slate-800">{formatVND(svc.price)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Số lượt khách đặt (Bookings):</span>
                        <span className="font-extrabold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded">{svc.bookings} lượt</span>
                      </div>

                      <div className="h-px bg-slate-200"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-orange-600 uppercase">Doanh thu mang lại:</span>
                        <span className="text-base font-black text-orange-600">{formatVND(svc.revenue)}</span>
                      </div>
                    </div>

                    {/* Thanh tỷ trọng đóng góp */}
                    <div className="mb-4 text-[11px] font-bold text-slate-500 flex items-center justify-between">
                      <span>Tỷ trọng mảng Spa:</span>
                      <span className="text-blue-600">{svc.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
                      <div style={{ width: `${svc.percent}%` }} className="h-full bg-blue-500 rounded-full"></div>
                    </div>

                    {/* Nút tác vụ tài chính duy nhất: Ghi nhận doanh thu nhanh */}
                    <button 
                      onClick={() => handleQuickLogServiceRevenue(svc.name, svc.price)}
                      className="w-full bg-slate-900 text-white hover:bg-slate-800 py-3 rounded-2xl transition duration-200 flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
                      <span>⚡ Ghi nhận 1 đơn mới (+{formatVND(svc.price)})</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS & INVENTORY (THEO BẢNG GIÁ HÌNH 2) */}
        {activeTab === 'products' && (
          <div>
            {/* Giới thiệu */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 text-amber-600 p-2.5 rounded-2xl">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Bảng giá chi tiết & Định mức Hàng Hóa</h2>
                  <p className="text-xs text-slate-400 mt-1">Dữ liệu thông tin sản phẩm sỉ / lẻ được đồng bộ từ tệp Excel (Đối chiếu theo hình ảnh image_e0dbbd.png)</p>
                </div>
              </div>
            </div>

            {/* Bảng Danh Mục Hàng Hóa */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="pb-3 pt-2">STT</th>
                      <th className="pb-3 pt-2">Nhóm Hàng Hóa</th>
                      <th className="pb-3 pt-2">Tên Sản Phẩm</th>
                      <th className="pb-3 pt-2">Quy Cách</th>
                      <th className="pb-3 pt-2 text-right">Giá Sỉ (Đồng)</th>
                      <th className="pb-3 pt-2 text-right">Giá Bán (Đồng)</th>
                      <th className="pb-3 pt-2 text-right text-emerald-600">Lợi Nhuận / Đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-bold">
                    {productsCatalog.map((prod, index) => {
                      const profit = prod.sellPrice - prod.costPrice;
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 text-slate-400 font-mono">{index + 1}</td>
                          <td className="py-3 text-[10px] uppercase text-slate-400">{prod.category}</td>
                          <td className="py-3 text-slate-800">{prod.name}</td>
                          <td className="py-3 text-slate-500 font-medium">{prod.spec}</td>
                          <td className="py-3 text-right text-slate-500 font-mono">{prod.costPrice.toLocaleString('vi-VN')}</td>
                          <td className="py-3 text-right text-slate-800 font-mono font-extrabold">{prod.sellPrice.toLocaleString('vi-VN')}</td>
                          <td className="py-3 text-right text-emerald-600 font-mono font-extrabold bg-emerald-50/30 px-2 rounded-lg">
                            +{profit.toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* POPUP THÊM ĐƠN HÀNG GIẢ LẬP (Mượt mà, tiện dụng) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 transform transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-800">Tạo hóa đơn thủ công</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full"
              >
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddOrder} className="space-y-4 text-xs">
              
              {/* Tên khách hàng */}
              <div>
                <label className="block font-black text-slate-500 uppercase tracking-wider mb-1.5">Tên Khách Hàng</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên khách hàng (vd: Nguyễn Văn A)"
                  value={newOrder.customer}
                  onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              {/* Loại hóa đơn */}
              <div>
                <label className="block font-black text-slate-500 uppercase tracking-wider mb-1.5">Phân loại nguồn thu</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewOrder({ ...newOrder, itemType: 'Hàng hóa', product: 'Catsrang Adult (Bao 5kg)' })}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition ${
                      newOrder.itemType === 'Hàng hóa'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    📦 Bán Hàng Hóa
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOrder({ ...newOrder, itemType: 'Dịch vụ', product: 'Gói tắm sấy nhanh PetGo' })}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition ${
                      newOrder.itemType === 'Dịch vụ'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✂️ Gói Dịch Vụ
                  </button>
                </div>
              </div>

              {/* Lựa chọn sản phẩm theo loại */}
              <div>
                <label className="block font-black text-slate-500 uppercase tracking-wider mb-1.5">Danh mục lựa chọn</label>
                <div className="relative">
                  <select
                    value={newOrder.product}
                    onChange={(e) => {
                      // Tìm giá trị tiền mặc định tương ứng
                      let defaultVal = 180000;
                      if (newOrder.itemType === 'Dịch vụ') {
                        const target = servicesCatalog.find(s => s.name === e.target.value);
                        if (target) defaultVal = target.price;
                      } else {
                        const target = productsCatalog.find(p => p.name === e.target.value);
                        if (target) defaultVal = target.sellPrice;
                      }
                      setNewOrder({ ...newOrder, product: e.target.value, amount: defaultVal });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 pr-10 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition appearance-none cursor-pointer"
                  >
                    {newOrder.itemType === 'Dịch vụ' ? (
                      servicesCatalog.map(s => <option key={s.id} value={s.name}>{s.name} ({formatVND(s.price)})</option>)
                    ) : (
                      productsCatalog.map(p => <option key={p.id} value={p.name}>{p.name} ({formatVND(p.sellPrice)})</option>)
                    )}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Giá trị thực thu */}
              <div>
                <label className="block font-black text-slate-500 uppercase tracking-wider mb-1.5">Tổng Tiền Thu Thực Tế (VND)</label>
                <input
                  type="number"
                  required
                  placeholder="Nhập số tiền đơn hàng"
                  value={newOrder.amount}
                  onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              {/* Trạng thái đơn */}
              <div>
                <label className="block font-black text-slate-500 uppercase tracking-wider mb-1.5">Trạng Thế Ghi Nhận</label>
                <div className="relative">
                  <select
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 pr-10 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white transition appearance-none cursor-pointer"
                  >
                    <option value="Đã giao">Đã giao (Hoàn thành)</option>
                    <option value="Đang xử lý">Đang xử lý (Lịch hẹn chờ)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2.5 px-4 rounded-xl transition"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md transition"
                >
                  Ghi nhận đơn
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}