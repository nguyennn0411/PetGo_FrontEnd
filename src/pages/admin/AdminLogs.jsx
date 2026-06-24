import React from 'react';
import AdminLayout from '../../components/AdminLayout';

const AdminLogs = () => {
  const logs = [
    { time: '2026-05-09 14:20:15', admin: 'Admin01', action: 'Duyệt đối tác', detail: 'Pet Spa Harmony (P001)', ip: '192.168.1.15' },
    { time: '2026-05-09 14:15:10', admin: 'Admin01', action: 'Khóa user', detail: 'USR003 - Vi phạm chính sách', ip: '192.168.1.15' },
    { time: '2026-05-09 13:50:44', admin: 'Admin02', action: 'Cập nhật voucher', detail: 'PETGO50 - Thay đổi ngày hết hạn', ip: '1.55.23.10' },
    { time: '2026-05-09 13:10:00', admin: 'Admin01', action: 'Đăng nhập', detail: 'Thành công', ip: '192.168.1.15' },
  ];

  return (
    <AdminLayout title="Log hoạt động admin">
      <div className="search-bar">
        <input type="text" placeholder="🔍  Tìm theo admin, hành động..." />
        <input type="date" />
        <button className="btn">Lọc</button>
      </div>
      <div className="card mb-0">
        <table>
          <thead><tr><th>Thời gian</th><th>Admin</th><th>Hành động</th><th>Chi tiết</th><th>IP</th></tr></thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i}>
                <td className="text-tiny">{l.time}</td>
                <td className="fw-500">{l.admin}</td>
                <td><span className="badge badge-info">{l.action}</span></td>
                <td>{l.detail}</td>
                <td className="text-tiny">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
