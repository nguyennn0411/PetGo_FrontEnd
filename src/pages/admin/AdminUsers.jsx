import React, { useContext, useEffect, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { AdminDialog, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { getAdminUsers, updateUserStatus } from '../../api/admin';

const AdminUsers = () => {
  const setPageTitle = useContext(AdminTitleContext);
  useEffect(() => { setPageTitle('Quản lý người dùng'); }, []);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { showToast } = useAdminToast();
  const { dialog, confirmDialog, closeDialog } = useAdminDialog();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data.result || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách user:', error);
      showToast({
        tone: 'error',
        title: 'Không tải được người dùng',
        message: getAdminErrorMessage(error, 'Danh sách người dùng chưa được tải. Vui lòng thử lại.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const user = users.find(u => u.id === userId);
    const isAdmin = user?.roles?.some(r => r.toUpperCase() === 'ADMIN');

    if (isAdmin) {
      showToast({
        tone: 'warning',
        title: 'Không thể khóa ADMIN',
        message: 'Tài khoản có vai trò ADMIN được bảo vệ để tránh mất quyền quản trị hệ thống.',
      });
      return;
    }

    const newStatus = (currentStatus === 'INACTIVE' || currentStatus === 'inactive') ? 'ACTIVE' : 'INACTIVE';
    const accepted = await confirmDialog({
      tone: newStatus === 'INACTIVE' ? 'error' : 'success',
      title: newStatus === 'INACTIVE' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?',
      message: `Bạn có chắc muốn ${newStatus === 'INACTIVE' ? 'khóa' : 'mở khóa'} tài khoản này?`,
      confirmLabel: newStatus === 'INACTIVE' ? 'Khóa tài khoản' : 'Mở khóa',
      cancelLabel: 'Hủy',
    });
    if (!accepted) return;

    try {
      await updateUserStatus(userId, newStatus);
      // Cập nhật lại state cục bộ để UI thay đổi ngay lập tức
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
      showToast({
        tone: 'success',
        title: 'Đã cập nhật trạng thái',
        message: newStatus === 'INACTIVE' ? 'Tài khoản đã được khóa thành công.' : 'Tài khoản đã được mở khóa thành công.',
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      showToast({
        tone: 'error',
        title: 'Cập nhật thất bại',
        message: getAdminErrorMessage(error, 'Không thể cập nhật trạng thái tài khoản.'),
      });
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(searchTerm)) ||
      u.userCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === '' ||
      u.status.toUpperCase() === filterStatus.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <AdminDialog dialog={dialog} onResolve={closeDialog} />

      <div className="metrics">
        <div className="metric-card">
          <div className="metric-label">Tổng user đang quản lý</div>
          <div className="metric-value">{users.length}</div>
          <div className="metric-change metric-up">{users.filter(u => u.status === 'ACTIVE').length} đang hoạt động</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Tài khoản bị khóa</div>
          <div className="metric-value">{users.filter(u => u.status === 'INACTIVE').length}</div>
          <div className="metric-change metric-down">Cần theo dõi lại lý do vi phạm</div>
        </div>
      </div>

      <div className="card">
        <div className="search-bar" style={{ marginBottom: 0 }}>
          <input
            id="userSearch"
            type="text"
            placeholder="🔍  Tìm theo tên, email, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            id="userStatusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Bị khóa</option>
          </select>
          <button className="btn btn-primary">+ Thêm user</button>
        </div>
        <table id="usersTable">
          <thead>
            <tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>SĐT</th><th>Tham gia</th><th>Trạng thái</th><th>Thao tác</th></tr>
          </thead>
          <tbody id="usersBody">
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(u => (
                <tr key={u.id}>
                  <td className="text-tiny">{u.userCode}</td>
                  <td className="fw-500">{u.fullName}</td>
                  <td className="text-muted">{u.email}</td>
                  <td>
                    {u.roles?.map((role, i) => (
                      <span key={i} className={`badge ${role.toUpperCase() === 'ADMIN' ? 'badge-danger' : 'badge-info'}`} style={{ marginRight: 4 }}>
                        {role}
                      </span>
                    ))}
                  </td>
                  <td>{u.phoneNumber || '—'}</td>
                  <td className="text-muted">{u.createdAt ? u.createdAt.split('T')[0] : '—'}</td>
                  <td>
                    <span className={`badge ${u.status === 'ACTIVE' || u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-6">
                      <button className="btn btn-sm" onClick={() => handleViewUser(u)}>Xem</button>
                      {!u.roles?.some(r => r.toUpperCase() === 'ADMIN') && (
                        <button
                          className={`btn btn-sm ${u.status === 'INACTIVE' || u.status === 'inactive' ? 'btn-success' : 'btn-danger'}`}
                          onClick={() => handleToggleStatus(u.id, u.status)}
                        >
                          {u.status === 'INACTIVE' || u.status === 'inactive' ? 'Mở khóa' : 'Khóa'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Không có người dùng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* USER DETAIL MODAL */}
      {showModal && selectedUser && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div className="modal" style={{
            background: '#fff', width: 450, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            overflow: 'hidden', animation: 'modalFadeIn 0.3s ease'
          }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{
              padding: '16px 20px', borderBottom: '0.5px solid var(--border-tertiary)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div className="modal-title" style={{ fontWeight: 600, fontSize: 16 }}>Chi tiết người dùng</div>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-tertiary)' }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              <div className="d-flex align-center gap-6" style={{ marginBottom: 20 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: 'var(--petgo-orange-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                  color: 'var(--petgo-orange)', fontSize: 24
                }}>
                  {selectedUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="fw-500" style={{ fontSize: 18 }}>{selectedUser.fullName}</div>
                  <div className="text-muted">{selectedUser.email}</div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    ['ID Hệ thống', selectedUser.id],
                    ['Mã User', selectedUser.userCode],
                    ['Số điện thoại', selectedUser.phoneNumber || '—'],
                    ['Ngày tham gia', selectedUser.createdAt || '—'],
                    ['Trạng thái', <span key="st" className={`badge ${selectedUser.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{selectedUser.status}</span>],
                    ['Vai trò', selectedUser.roles?.join(', ') || 'CUSTOMER'],
                  ].map(([label, val], idx) => (
                    <tr key={idx}>
                      <td className="text-muted" style={{ padding: '10px 0', fontSize: 13, borderBottom: '0.5px solid var(--border-tertiary)', width: '35%' }}>{label}</td>
                      <td style={{ padding: '10px 0', fontSize: 13, borderBottom: '0.5px solid var(--border-tertiary)', fontWeight: 500 }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer" style={{ padding: '16px 20px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn" onClick={() => setShowModal(false)} style={{ padding: '8px 16px' }}>Đóng</button>
              {!selectedUser.roles?.some(r => r.toUpperCase() === 'ADMIN') && (
                <button
                  className={`btn ${selectedUser.status === 'INACTIVE' ? 'btn-success' : 'btn-danger'}`}
                  style={{ padding: '8px 16px' }}
                  onClick={() => handleToggleStatus(selectedUser.id, selectedUser.status)}
                >
                  {selectedUser.status === 'INACTIVE' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsers;
