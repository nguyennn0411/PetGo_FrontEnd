import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  RefreshCw,
  Award,
  Heart,
  ChevronDown
} from 'lucide-react';

export default function App() {
  // Trạng thái bộ lọc thời gian
  const [timePeriod, setTimePeriod] = useState('Tháng này');
  
  // Trạng thái tìm kiếm đơn hàng
  const [searchTerm, setSearchTerm] = useState('');
  
  // Trạng thái lọc theo trạng thái đơn hàng
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  // Trạng thái hover biểu đồ để hiển thị chi tiết điểm dữ liệu
  const [hoveredBar, setHoveredBar] = useState(null);

  // Trạng thái thêm nhanh đơn hàng giả lập để tăng tính tương tác
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer: '',
    product: 'Thức ăn hạt Royal Canin',
    amount: '',
    status: 'Đã giao'
  });

  // Dữ liệu ban đầu
  const [orders, setOrders] = useState([
    { id: 'OD-9082', customer: 'Nguyễn Minh Thư', product: 'Thức ăn hạt Royal Canin 2kg', amount: 450000, date: '2026-06-18', status: 'Đã giao', petType: 'Chó' },
    { id: 'OD-9081', customer: 'Trần Hoàng Long', product: 'Cát vệ sinh đậu nành Catz', amount: 180000, date: '2026-06-18', status: 'Đang xử lý', petType: 'Mèo' },
    { id: 'OD-9080', customer: 'Lê Mỹ Duyên', product: 'Pate Whiskas vị cá ngừ (Hộp 12)', amount: 240000, date: '2026-06-17', status: 'Đã giao', petType: 'Mèo' },
    { id: 'OD-9079', customer: 'Phạm Tuấn Kiệt', product: 'Sữa tắm dưỡng lông SOS 500ml', amount: 155000, date: '2026-06-17', status: 'Đã hủy', petType: 'Cả hai' },
    { id: 'OD-9078', customer: 'Vũ Thị Thanh', product: 'Đồ chơi xương gặm cao su dẻo', amount: 85000, date: '2026-06-16', status: 'Đã giao', petType: 'Chó' },
    { id: 'OD-9077', customer: 'Hoàng Quốc Bảo', product: 'Balo phi hành gia vận chuyển mèo', amount: 350000, date: '2026-06-16', status: 'Đã giao', petType: 'Mèo' },
    { id: 'OD-9076', customer: 'Đặng Kim Ngân', product: 'Nệm tròn lông cừu êm ái cho thú cưng', amount: 290000, date: '2026-06-15', status: 'Đã giao', petType: 'Cả hai' },
    { id: 'OD-9075', customer: 'Nguyễn Hải Nam', product: 'Thuốc trị rận tai Frontline', amount: 195000, date: '2026-06-15', status: 'Đang xử lý', petType: 'Chó' },
    { id: 'OD-9074', customer: 'Bùi Phương Thảo', product: 'Trụ cào móng xơ dừa cao 50cm', amount: 320000, date: '2026-06-14', status: 'Đã giao', petType: 'Mèo' },
  ]);

  // Danh sách sản phẩm bán chạy nhất
  const topProducts = [
    { name: 'Thức ăn hạt Royal Canin 2kg', sales: 12, revenue: 5400000, stock: 15, category: 'Thức ăn' },
    { name: 'Cát vệ sinh đậu nành Catz', sales: 24, revenue: 4320000, stock: 8, category: 'Vệ sinh' },
    { name: 'Balo phi hành gia cao cấp', sales: 8, revenue: 2800000, stock: 4, category: 'Phụ kiện' },
    { name: 'Pate Whiskas cá ngừ (Hộp 12)', sales: 18, revenue: 4320000, stock: 40, category: 'Thức ăn' },
    { name: 'Sữa tắm SOS dưỡng lông', sales: 15, revenue: 2325000, stock: 12, category: 'Mỹ phẩm' },
  ];

  // Dữ liệu biểu đồ doanh số theo tuần gần nhất
  const weeklySalesData = [
    { day: 'Thứ 2', revenue: 520000, orders: 3 },
    { day: 'Thứ 3', revenue: 780000, orders: 5 },
    { day: 'Thứ 4', revenue: 450000, orders: 3 },
    { day: 'Thứ 5', revenue: 950000, orders: 7 },
    { day: 'Thứ 6', revenue: 620000, orders: 4 },
    { day: 'Thứ 7', revenue: 1150000, orders: 9 },
    { day: 'Chủ Nhật', revenue: 458000, orders: 3 },
  ];

  // Tính toán doanh thu thực tế dựa trên danh sách đơn hàng có trạng thái là "Đã giao" và "Đang xử lý"
  const stats = useMemo(() => {
    // Tổng số đơn không tính đơn đã hủy
    const validOrders = orders.filter(o => o.status !== 'Đã hủy');
    const totalRevenue = validOrders.reduce((sum, order) => sum + order.amount, 0);
    const averageOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
    const pendingCount = orders.filter(o => o.status === 'Đang xử lý').length;
    
    // Doanh số mục tiêu tháng này là 5,000,000đ. Doanh thu của chúng ta ~4.9M đạt 98% mục tiêu!
    const target = 5000000;
    const progressPercent = Math.min(Math.round((totalRevenue / target) * 100), 100);

    return {
      totalRevenue,
      orderCount: validOrders.length,
      averageOrderValue,
      pendingCount,
      progressPercent,
      target
    };
  }, [orders]);

  // Định dạng tiền tệ VND
  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Lọc đơn hàng dựa trên tìm kiếm và trạng thái lọc
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'Tất cả' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Hàm thêm đơn hàng mới giả lập
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
      petType: Math.random() > 0.5 ? 'Chó' : 'Mèo'
    };

    setOrders([freshOrder, ...orders]);
    setShowAddModal(false);
    setNewOrder({ customer: '', product: 'Thức ăn hạt Royal Canin', amount: '', status: 'Đã giao' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-12">
      {/* Thanh Điều Hướng Trên Cùng */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Tên Cửa Hàng */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amber-500 to-orange-600 text-white p-2.5 rounded-2xl shadow-md shadow-orange-200">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">PET GO</span>
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Dashboard Doanh Số</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Hệ thống quản trị cửa hàng thú cưng thông minh</p>
            </div>
          </div>

          {/* Các nút điều hướng nhanh */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={() => {
                // Đặt lại dữ liệu mẫu gốc
                setOrders([
                  { id: 'OD-9082', customer: 'Nguyễn Minh Thư', product: 'Thức ăn hạt Royal Canin 2kg', amount: 450000, date: '2026-06-18', status: 'Đã giao', petType: 'Chó' },
                  { id: 'OD-9081', customer: 'Trần Hoàng Long', product: 'Cát vệ sinh đậu nành Catz', amount: 180000, date: '2026-06-18', status: 'Đang xử lý', petType: 'Mèo' },
                  { id: 'OD-9080', customer: 'Lê Mỹ Duyên', product: 'Pate Whiskas vị cá ngừ (Hộp 12)', amount: 240000, date: '2026-06-17', status: 'Đã giao', petType: 'Mèo' },
                  { id: 'OD-9079', customer: 'Phạm Tuấn Kiệt', product: 'Sữa tắm dưỡng lông SOS 500ml', amount: 155000, date: '2026-06-17', status: 'Đã hủy', petType: 'Cả hai' },
                  { id: 'OD-9078', customer: 'Vũ Thị Thanh', product: 'Đồ chơi xương gặm cao su dẻo', amount: 85000, date: '2026-06-16', status: 'Đã giao', petType: 'Chó' },
                  { id: 'OD-9077', customer: 'Hoàng Quốc Bảo', product: 'Balo phi hành gia vận chuyển mèo', amount: 350000, date: '2026-06-16', status: 'Đã giao', petType: 'Mèo' },
                  { id: 'OD-9076', customer: 'Đặng Kim Ngân', product: 'Nệm tròn lông cừu êm ái cho thú cưng', amount: 290000, date: '2026-06-15', status: 'Đã giao', petType: 'Cả hai' },
                  { id: 'OD-9075', customer: 'Nguyễn Hải Nam', product: 'Thuốc trị rận tai Frontline', amount: 195000, date: '2026-06-15', status: 'Đang xử lý', petType: 'Chó' },
                  { id: 'OD-9074', customer: 'Bùi Phương Thảo', product: 'Trụ cào móng xơ dừa cao 50cm', amount: 320000, date: '2026-06-14', status: 'Đã giao', petType: 'Mèo' },
                ]);
              }}
              className="p-2 text-slate-500 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 rounded-xl transition duration-200"
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2 px-4 rounded-xl shadow-md shadow-orange-100 hover:shadow-orange-200 transition duration-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Đơn Mới</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Nội dung chính Dashboard */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
        
        {/* Banner Tổng Quan & Điều khiển bộ lọc */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              Chào bạn quay trở lại, Pet Go Admin! <span className="text-xl">👋</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Dưới đây là thống kê tình hình kinh doanh thời gian thực cho cửa hàng của bạn.</p>
          </div>

          {/* Nhóm Bộ lọc thời gian */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl self-stretch md:self-auto">
            {['Hôm nay', 'Tuần này', 'Tháng này'].map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`flex-1 md:flex-initial text-xs font-bold py-2.5 px-5 rounded-xl transition-all duration-300 ${
                  timePeriod === period 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Chỉ Số Thống Kê Chính */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          
          {/* Thẻ Doanh Thu */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Tổng Doanh Thu</span>
                <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-slate-800">
                {formatVND(stats.totalRevenue)}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4% so với kì trước</span>
              </div>
            </div>
          </div>

          {/* Thẻ Số Đơn Hàng */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Đơn Hàng Đã Giao</span>
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-slate-800">
                {stats.orderCount} <span className="text-sm font-medium text-slate-400">đơn</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Hoàn thành 94% đơn</span>
              </div>
            </div>
          </div>

          {/* Thẻ Giá Trị Trung Bình */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Giá Trị Đơn Trung Bình</span>
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-slate-800">
                {formatVND(stats.averageOrderValue)}
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500">
                <span>Dựa trên giao dịch hợp lệ</span>
              </div>
            </div>
          </div>

          {/* Thẻ Chờ Xử Lý */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Đơn Chờ Xử Lý</span>
                <div className="bg-amber-100 text-amber-600 p-2 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-slate-800">
                {stats.pendingCount} <span className="text-sm font-medium text-slate-400">đơn</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-600">
                <span>Cần đóng gói trong hôm nay</span>
              </div>
            </div>
          </div>

        </div>

        {/* Khối Đồ Thị Doanh Số & Tiến Độ Mục Tiêu */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Cột Trái: Biểu đồ doanh thu tuần (Custom SVG chất lượng cao) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Xu Hướng Doanh Số Tuần</h3>
                <p className="text-slate-400 text-xs mt-0.5">Doanh thu phân bổ theo các ngày trong tuần gần nhất</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 block"></span>
                  <span className="text-slate-500">Doanh thu (VND)</span>
                </div>
              </div>
            </div>

            {/* Đồ thị dạng cột tương tác */}
            <div className="relative mt-8 h-64 flex items-end justify-between px-2 sm:px-6">
              
              {/* Grid Lines giả lập phía sau */}
              <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none z-0">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="w-full border-t border-dashed border-slate-100 h-0"></div>
                ))}
                <div className="w-full border-t border-slate-200 h-0"></div> {/* Đường đáy */}
              </div>

              {/* Các Cột Biểu Đồ */}
              {weeklySalesData.map((data, index) => {
                // Tính tỉ lệ phần trăm chiều cao cột so với doanh thu cao nhất (1,150,000đ)
                const maxVal = 1200000;
                const percentHeight = (data.revenue / maxVal) * 100;

                return (
                  <div 
                    key={index} 
                    className="relative flex flex-col items-center flex-1 group z-10 cursor-pointer"
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip khi hover */}
                    {hoveredBar === index && (
                      <div className="absolute -top-16 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex flex-col items-center gap-0.5 z-30 transition-all duration-200 pointer-events-none">
                        <span>{formatVND(data.revenue)}</span>
                        <span className="text-[10px] text-slate-400">{data.orders} đơn hàng</span>
                        {/* Mũi tên chỉ xuống */}
                        <div className="w-2 h-2 bg-slate-800 transform rotate-45 -mb-1 mt-1"></div>
                      </div>
                    )}

                    {/* Thanh biểu đồ */}
                    <div className="w-8 sm:w-12 bg-slate-100 rounded-t-lg h-48 flex items-end overflow-hidden transition-all duration-300 group-hover:bg-slate-200/50">
                      <div 
                        style={{ height: `${percentHeight}%` }} 
                        className={`w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t from-orange-500 to-amber-400 group-hover:from-orange-600 group-hover:to-amber-500 shadow-sm`}
                      ></div>
                    </div>

                    {/* Nhãn ngày */}
                    <span className="text-xs font-bold text-slate-500 mt-3 group-hover:text-orange-600 transition-colors">
                      {data.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột Phải: Tiến Độ Đạt Mục Tiêu & Sức Khỏe Thương Hiệu */}
          <div className="flex flex-col gap-6">
            
            {/* Thẻ Mục Tiêu Doanh Số */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl flex-1 flex flex-col justify-between relative overflow-hidden">
              {/* Bóng mờ decor */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-white/10 text-white/90 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">Mục Tiêu Tháng 6</span>
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-300">Tiến trình đạt mục tiêu</h4>
                <p className="text-xs text-slate-400 mt-0.5">Mục tiêu tối thiểu để duy trì vận hành tối ưu</p>
              </div>

              <div className="my-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-black">{stats.progressPercent}%</span>
                  <span className="text-xs text-slate-400">
                    {formatVND(stats.totalRevenue)} / {formatVND(stats.target)}
                  </span>
                </div>
                {/* Thanh phần trăm */}
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${stats.progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-1000"
                  ></div>
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                🔥 <span className="font-bold text-white">Tuyệt vời!</span> Doanh thu của bạn hiện đã đạt <span className="text-amber-400 font-bold">{formatVND(stats.totalRevenue)}</span>. Chỉ còn thiếu {formatVND(stats.target - stats.totalRevenue)} nữa là bạn sẽ hoàn thành 100% mục tiêu tháng này.
              </div>
            </div>

            {/* Thẻ Trải Nghiệm Khách Hàng / Fun Facts */}
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-center gap-4">
              <div className="bg-orange-500 text-white p-3 rounded-2xl shrink-0">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">Góc Yêu Thương Thú Cưng</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Đơn hàng cho <span className="font-bold text-orange-600">Mèo</span> chiếm <span className="font-bold">52%</span> tổng doanh số tuần này. Bạn nên chuẩn bị sẵn thêm cát và pate trong kho nhé!
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Khối Chi Tiết Sản Phẩm & Danh Sách Đơn Hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cột 1 & 2: Quản Lý Đơn Hàng Trực Quan */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
            
            {/* Header của bảng quản lý đơn */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Chi Tiết Đơn Hàng Gần Đây</h3>
                <p className="text-slate-400 text-xs mt-0.5">Tìm kiếm và kiểm soát dòng tiền đơn hàng</p>
              </div>

              {/* Bộ lọc đơn hàng nhanh */}
              <div className="flex flex-wrap gap-2">
                {['Tất cả', 'Đã giao', 'Đang xử lý', 'Đã hủy'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                      statusFilter === status
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Thanh tìm kiếm */}
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn, khách hàng, tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition duration-200"
              />
            </div>

            {/* Danh sách đơn hàng table dạng Responsive */}
            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle px-6">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 pt-2">Mã Đơn</th>
                      <th className="pb-3 pt-2">Khách Hàng</th>
                      <th className="pb-3 pt-2">Sản Phẩm</th>
                      <th className="pb-3 pt-2 text-right">Tổng Tiền</th>
                      <th className="pb-3 pt-2 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Mã đơn */}
                          <td className="py-4 text-slate-400 font-mono group-hover:text-orange-600 transition-colors">
                            {order.id}
                          </td>
                          {/* Khách hàng + Badge Thú cưng */}
                          <td className="py-4">
                            <div>
                              <div className="font-bold text-slate-800">{order.customer}</div>
                              <span className={`inline-block text-[9px] px-1.5 py-0.2 mt-0.5 rounded ${
                                order.petType === 'Chó' ? 'bg-blue-50 text-blue-600' : 
                                order.petType === 'Mèo' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                Cho {order.petType}
                              </span>
                            </div>
                          </td>
                          {/* Sản phẩm */}
                          <td className="py-4 text-slate-500 font-medium max-w-[180px] truncate">
                            {order.product}
                          </td>
                          {/* Tổng tiền */}
                          <td className="py-4 text-right font-bold text-slate-800">
                            {formatVND(order.amount)}
                          </td>
                          {/* Trạng thái */}
                          <td className="py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              order.status === 'Đã giao' ? 'bg-emerald-50 text-emerald-700' :
                              order.status === 'Đang xử lý' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {order.status === 'Đã giao' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                              {order.status === 'Đang xử lý' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                              {order.status === 'Đã hủy' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                          Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>

          {/* Cột 3: Top Sản Phẩm Bán Chạy */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">Sản Phẩm Hot Nhất</h3>
              <p className="text-slate-400 text-xs mt-0.5">Xếp hạng sản phẩm có doanh số tốt nhất tháng này</p>

              {/* Danh sách các sản phẩm bán chạy */}
              <div className="mt-6 flex flex-col gap-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      {/* Số thứ tự */}
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                      
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-medium text-slate-400">
                          <span>Phân loại: {product.category}</span>
                          <span>•</span>
                          <span>Kho còn: {product.stock}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-800 block">{product.sales} đã bán</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{formatVND(product.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút xem kho hàng */}
            <button className="w-full mt-6 bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition duration-200">
              <span>Xem báo cáo kho đầy đủ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </main>

      {/* MODAL THÊM ĐƠN HÀNG GIẢ LẬP (Mượt mà, không dùng alert) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-800">Tạo Đơn Hàng Mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full"
              >
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddOrder} className="space-y-4">
              {/* Tên khách hàng */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên Khách Hàng</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên khách hàng (vd: Trần Tiến)"
                  value={newOrder.customer}
                  onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              {/* Sản phẩm */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sản Phẩm Mua</label>
                <div className="relative">
                  <select
                    value={newOrder.product}
                    onChange={(e) => setNewOrder({ ...newOrder, product: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition appearance-none cursor-pointer"
                  >
                    <option value="Thức ăn hạt Royal Canin 2kg">Thức ăn hạt Royal Canin 2kg</option>
                    <option value="Cát vệ sinh đậu nành Catz">Cát vệ sinh đậu nành Catz</option>
                    <option value="Pate Whiskas vị cá ngừ (Hộp 12)">Pate Whiskas vị cá ngừ (Hộp 12)</option>
                    <option value="Sữa tắm dưỡng lông SOS 500ml">Sữa tắm dưỡng lông SOS 500ml</option>
                    <option value="Balo phi hành gia vận chuyển mèo">Balo phi hành gia vận chuyển mèo</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Số tiền */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tổng Số Tiền (VND)</label>
                <input
                  type="number"
                  required
                  placeholder="Nhập số tiền đơn hàng (vd: 250000)"
                  value={newOrder.amount}
                  onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                />
              </div>

              {/* Trạng thái ban đầu */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trạng Thái Đơn</label>
                <div className="relative">
                  <select
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition appearance-none cursor-pointer"
                  >
                    <option value="Đã giao">Đã giao (Hoàn tất)</option>
                    <option value="Đang xử lý">Đang xử lý (Chờ)</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Nút Hành Động */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition duration-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-orange-100 transition duration-200"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}