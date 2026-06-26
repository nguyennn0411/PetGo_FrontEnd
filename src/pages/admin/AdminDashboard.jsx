import { useContext, useEffect, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../../api/axios';
import '../../styles/AdminDashboard.css';

const fmt = (n) => {
  if (n == null) return '0';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const toFloat = (v) => (typeof v === 'string' ? parseFloat(v) : v) || 0;

export default function AdminDashboard() {
  const setPageTitle = useContext(AdminTitleContext);
  useEffect(() => { setPageTitle('Báo cáo doanh thu'); }, []);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data.result);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: 400 }}>
        <div className="spinner-border text-orange" role="status" />
      </div>
    );
  }

  const totalRevenue = toFloat(data?.totalRevenue);
  const serviceRevenue = toFloat(data?.serviceRevenue);
  const shippingRevenue = toFloat(data?.serviceShippingRevenue);
  const shopRevenue = toFloat(data?.shopRevenue);
  const totalBookings = data?.totalBookings || 0;
  const totalShopOrders = data?.totalShopOrders || 0;
  const totalUsers = data?.totalUsers || 0;

  const chartData = (data?.dailyRevenue || []).map(d => ({
    date: d.date?.slice(5) || '',
    'Dịch vụ': Math.round(toFloat(d.serviceAmount)),
    'Cửa hàng': Math.round(toFloat(d.shopAmount)),
  }));

  const cards = [
    { label: 'Tổng doanh thu', value: fmt(totalRevenue), color: 'var(--petgo-orange)', icon: '📊', sub: 'Tất cả nguồn' },
    { label: 'Doanh thu dịch vụ', value: fmt(serviceRevenue), color: '#2563eb', icon: '🚗', sub: `Tiền dịch vụ: ${fmt(serviceRevenue - shippingRevenue)} · Phí ship: ${fmt(shippingRevenue)}` },
    { label: 'Doanh thu cửa hàng', value: fmt(shopRevenue), color: '#16a34a', icon: '🛍️', sub: 'Sản phẩm PetGo' },
    { label: 'Đặt lịch đã hoàn thành', value: fmt(totalBookings), color: '#9333ea', icon: '✅', sub: `Đơn hàng: ${fmt(totalShopOrders)}` },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <p style={{ fontWeight: 800, fontSize: 13, margin: '0 0 6px', color: '#111' }}>Ngày {label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ fontSize: 13, margin: '2px 0', color: p.color }}>
              {p.name}: <strong>{fmt(p.value)}₫</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero */}
      <div className="admin-hero" style={{ marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.6, marginBottom: 8 }}>
            Tổng quan doanh thu
          </p>
          <h2 style={{ fontSize: 40, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>
            {fmt(totalRevenue)}<span style={{ fontSize: 18, fontWeight: 600, opacity: 0.5, marginLeft: 6 }}>₫</span>
          </h2>
          <p style={{ fontSize: 14, marginTop: 6, opacity: 0.5, fontWeight: 500 }}>
            Tổng doanh thu toàn hệ thống · {totalUsers} người dùng
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 48, margin: 0 }}>🐾</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: 20,
            padding: '24px 20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid #f3f4f6',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                {card.label}
              </p>
              <span style={{ fontSize: 24 }}>{card.icon}</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, margin: 0, color: card.color }}>
              {card.value}<span style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db', marginLeft: 4 }}>₫</span>
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '28px 24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        border: '1px solid #f3f4f6',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>Doanh thu 30 ngày qua</h3>
        <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600, margin: '0 0 20px' }}>
          Chi tiết theo ngày · Dịch vụ và Cửa hàng
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} barGap={2} barCategoryGap="12%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'tr' : v >= 1_000 ? (v / 1_000).toFixed(0) + 'k' : v} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} iconType="circle" />
            <Bar dataKey="Dịch vụ" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Cửa hàng" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
