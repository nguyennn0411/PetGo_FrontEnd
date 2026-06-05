import React, { useEffect, useMemo, useState } from 'react';
import { getAdminUsers } from '../../api/admin';
import { createAdminNotification, getAdminNotifications } from '../../api/notifications';
import AdminLayout from '../../components/AdminLayout';
import { getAdminErrorMessage, useAdminToast } from '../../components/admin/AdminFeedback';

const initialForm = {
  title: '',
  content: '',
  audienceType: 'ALL',
  recipientUserIds: [],
  category: 'SYSTEM',
  priority: 'NORMAL',
  actionUrl: '',
  expiresAt: '',
};

const categoryOptions = ['SYSTEM', 'ACCOUNT', 'BOOKING', 'MEMBERSHIP', 'PAYMENT', 'PARTNER', 'PROMOTION'];
const priorityOptions = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const userRoleFilters = ['ALL', 'USER', 'SHOP', 'ADMIN'];
const userStatusFilters = ['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED'];

const priorityBadgeClass = {
  LOW: 'badge-gray',
  NORMAL: 'badge-info',
  HIGH: 'badge-warning',
  URGENT: 'badge-danger',
};

const AdminNotifications = () => {
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const { showToast } = useAdminToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [notificationPayload, usersPayload] = await Promise.all([
        getAdminNotifications(),
        getAdminUsers(),
      ]);
      setNotifications(notificationPayload || []);
      setUsers(usersPayload?.result || usersPayload || []);
    } catch (err) {
      const message = getAdminErrorMessage(err, 'Không thể tải dữ liệu thông báo.');
      setError(message);
      showToast({
        tone: 'error',
        title: 'Không tải được dữ liệu thông báo',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const values = [
        user.fullName,
        user.email,
        user.phoneNumber,
        user.userCode,
        user.status,
        ...(user.roles || []),
      ];
      const matchesSearch = !keyword || values.some((value) => String(value || '').toLowerCase().includes(keyword));
      const roles = (user.roles || []).map((role) => String(role || '').toUpperCase());
      const matchesRole = userRoleFilter === 'ALL' || roles.includes(userRoleFilter);
      const matchesStatus = userStatusFilter === 'ALL' || String(user.status || '').toUpperCase() === userStatusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [searchTerm, userRoleFilter, userStatusFilter, users]);

  const metrics = useMemo(() => {
    const totalRecipients = notifications.reduce((sum, item) => sum + (item.totalRecipients || 0), 0);
    const unreadRecipients = notifications.reduce((sum, item) => sum + (item.unreadRecipients || 0), 0);
    const urgentCount = notifications.filter((item) => item.priority === 'URGENT' || item.priority === 'HIGH').length;
    return { totalRecipients, unreadRecipients, urgentCount };
  }, [notifications]);

  const updateForm = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const toggleRecipient = (userId) => {
    setForm((prev) => ({
      ...prev,
      recipientUserIds: prev.recipientUserIds.includes(userId)
        ? prev.recipientUserIds.filter((item) => item !== userId)
        : [...prev.recipientUserIds, userId],
    }));
  };

  const selectVisibleRecipients = () => {
    const visibleIds = filteredUsers.map((user) => String(user.id));
    setForm((prev) => ({
      ...prev,
      recipientUserIds: Array.from(new Set([...prev.recipientUserIds, ...visibleIds])),
    }));
  };

  const clearVisibleRecipients = () => {
    const visibleIds = new Set(filteredUsers.map((user) => String(user.id)));
    setForm((prev) => ({
      ...prev,
      recipientUserIds: prev.recipientUserIds.filter((userId) => !visibleIds.has(userId)),
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Vui lòng nhập tiêu đề thông báo.';
    if (!form.content.trim()) return 'Vui lòng nhập nội dung thông báo.';
    if (form.audienceType === 'INDIVIDUAL' && form.recipientUserIds.length === 0) {
      return 'Vui lòng chọn ít nhất một người nhận.';
    }
    if (form.actionUrl.trim() && !/^\/|^https?:\/\//i.test(form.actionUrl.trim())) {
      return 'Link hành động phải bắt đầu bằng /, http:// hoặc https://.';
    }
    return '';
  };

  const buildPayload = () => {
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      audienceType: form.audienceType,
      category: form.category,
      priority: form.priority,
      actionUrl: form.actionUrl.trim() || null,
      expiresAt: form.expiresAt || null,
    };
    if (form.audienceType === 'INDIVIDUAL') {
      payload.recipientUserIds = form.recipientUserIds.map(Number).filter(Boolean);
    }
    if (form.audienceType === 'ALL') {
      payload.targetRoles = ['USER', 'SHOP'];
    }
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      setSuccess('');
      setError(validationMessage);
      showToast({
        tone: 'warning',
        title: 'Thiếu thông tin gửi thông báo',
        message: validationMessage,
      });
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await createAdminNotification(buildPayload());
      setForm(initialForm);
      setSearchTerm('');
      setUserRoleFilter('ALL');
      setUserStatusFilter('ALL');
      setSuccess('Đã tạo và gửi thông báo thành công.');
      showToast({
        tone: 'success',
        title: 'Đã gửi thông báo',
        message: 'Thông báo đã được tạo và gửi đến nhóm người nhận đã chọn.',
      });
      await loadData();
    } catch (err) {
      const message = getAdminErrorMessage(err, 'Tạo thông báo thất bại.');
      setError(message);
      showToast({
        tone: 'error',
        title: 'Tạo thông báo thất bại',
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const audienceLabel = (notification) => {
    if (notification.audienceType === 'ALL') return 'Gửi tất cả';
    if (notification.audienceType === 'ROLE') return `Role: ${(notification.targetRoles || []).join(', ')}`;
    return `${notification.totalRecipients || 0} người nhận riêng`;
  };

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

  return (
    <AdminLayout title="Quản lý thông báo">
      <div className="metrics metrics-3">
        <Metric label="Thông báo đã gửi" value={notifications.length} hint="" />
        <Metric label="Tổng lượt nhận" value={metrics.totalRecipients} hint="Bao gồm user và partner" />
        <Metric label="Chưa đọc" value={metrics.unreadRecipients} hint={`${metrics.urgentCount} thông báo ưu tiên cao`} danger />
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header">
            <div>
              <div className="card-title">Tạo thông báo mới</div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi thông báo'}
            </button>
          </div>

          <div className="d-flex flex-column" style={{ gap: 12 }}>
            <Field label="Tiêu đề">
              <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Ví dụ: Lịch bảo trì hệ thống" maxLength={180} />
            </Field>
            <Field label="Nội dung">
              <textarea value={form.content} onChange={(event) => updateForm('content', event.target.value)} placeholder="Nhập nội dung hiển thị cho người nhận..." rows={5} maxLength={4000} />
            </Field>

            <div className="grid2" style={{ marginBottom: 0 }}>
              <Field label="Nhóm nhận">
                <select value={form.audienceType} onChange={(event) => updateForm('audienceType', event.target.value)}>
                  <option value="ALL">Gửi tất cả</option>
                  <option value="INDIVIDUAL">Gửi riêng</option>
                </select>
              </Field>
            </div>

            {form.audienceType === 'INDIVIDUAL' && (
              <Field label={`Người nhận riêng (${form.recipientUserIds.length} đã chọn)`}>
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo tên, email, mã user, role..." style={{ marginBottom: 8 }} />
                <div className="grid2" style={{ marginBottom: 8 }}>
                  <select value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
                    {userRoleFilters.map((role) => <option key={role} value={role}>{role === 'ALL' ? 'Tất cả role' : role}</option>)}
                  </select>
                  <select value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)}>
                    {userStatusFilters.map((status) => <option key={status} value={status}>{status === 'ALL' ? 'Tất cả trạng thái' : status}</option>)}
                  </select>
                </div>
                <div className="d-flex align-center justify-between flex-wrap" style={{ gap: 8, marginBottom: 8 }}>
                  <div className="text-tiny">Hiển thị {filteredUsers.length} tài khoản phù hợp bộ lọc.</div>
                  <div className="d-flex gap-6">
                    <button type="button" className="btn btn-sm" onClick={selectVisibleRecipients} disabled={filteredUsers.length === 0}>Chọn tất cả đang lọc</button>
                    <button type="button" className="btn btn-sm" onClick={clearVisibleRecipients} disabled={filteredUsers.length === 0}>Bỏ chọn đang lọc</button>
                  </div>
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto', border: '0.5px solid var(--border-tertiary)', borderRadius: 8 }}>
                  {filteredUsers.length === 0 ? (
                    <div className="text-muted text-small" style={{ padding: 12 }}>Không tìm thấy tài khoản phù hợp.</div>
                  ) : filteredUsers.map((user) => {
                    const userId = String(user.id);
                    return (
                      <label key={user.id} className="d-flex align-center" style={{ gap: 10, padding: '10px 12px', borderBottom: '0.5px solid var(--border-tertiary)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.recipientUserIds.includes(userId)} onChange={() => toggleRecipient(userId)} style={{ width: 'auto' }} />
                        <div className="flex-1">
                          <div className="fw-500">{user.fullName} <span className="text-tiny">({user.userCode})</span></div>
                          <div className="text-muted text-small">{user.email} • {(user.roles || ['USER']).join(', ')} • {user.status || '—'}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </Field>
            )}

            {form.audienceType === 'ALL' && <div className="card" style={{ marginBottom: 0, background: 'var(--bg-info)', color: 'var(--text-info)', padding: 12 }}>Thông báo sẽ được gửi tới toàn bộ tài khoản có role USER hoặc SHOP.</div>}

            <div className="grid2" style={{ marginBottom: 0 }}>
              <Field label="Mức ưu tiên">
                <select value={form.priority} onChange={(event) => updateForm('priority', event.target.value)}>
                  {priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Loại thông báo">
                <select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                  {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
            </div>


            <div className="grid2" style={{ marginBottom: 0 }}>
              <Field label="Hết hạn (tuỳ chọn)">
                <input type="datetime-local" value={form.expiresAt} onChange={(event) => updateForm('expiresAt', event.target.value)} />
              </Field>
              <Field label="Link hành động (tuỳ chọn)">
                <input value={form.actionUrl} onChange={(event) => updateForm('actionUrl', event.target.value)} placeholder="/my-bookings hoặc https://..." maxLength={500} />
              </Field>
            </div>
          </div>
        </form>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Lịch sử thông báo đã gửi</div>
            </div>
            <button className="btn btn-sm" onClick={loadData} disabled={loading}>{loading ? 'Đang tải...' : 'Refresh'}</button>
          </div>

          <div className="stack-list">
            {loading ? (
              <div className="stack-item text-muted">Đang tải dữ liệu...</div>
            ) : notifications.length === 0 ? (
              <div className="stack-item text-muted">Chưa có thông báo nào.</div>
            ) : notifications.map((notification) => {
              const readPercent = notification.totalRecipients ? Math.round((notification.readRecipients || 0) / notification.totalRecipients * 100) : 0;
              return (
                <div key={notification.id} className="stack-item" style={{ alignItems: 'flex-start', gap: 16 }}>
                  <div className="flex-1">
                    <div className="d-flex align-center gap-6 flex-wrap" style={{ marginBottom: 6 }}>
                      <span className={`badge ${priorityBadgeClass[notification.priority] || 'badge-info'}`}>{notification.priority}</span>
                      <span className="badge badge-gray">{notification.category}</span>
                      <span className="text-tiny">{audienceLabel(notification)}</span>
                    </div>
                    <div className="fw-500">{notification.title}</div>
                    <div className="text-muted text-small" style={{ marginTop: 4 }}>{notification.content}</div>
                    {notification.actionUrl && <div className="text-tiny mt-8">Link: {notification.actionUrl}</div>}
                    <div className="text-tiny mt-8">Gửi lúc {formatDateTime(notification.sentAt)} bởi {notification.createdByName || 'Admin'} {notification.expiresAt ? `• hết hạn ${formatDateTime(notification.expiresAt)}` : ''}</div>
                  </div>
                  <div style={{ minWidth: 180 }}>
                    <div className="d-flex justify-between text-small"><span>Đã đọc</span><b>{notification.readRecipients || 0}/{notification.totalRecipients || 0}</b></div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${readPercent}%` }} /></div>
                    <div className="text-tiny mt-8">{notification.unreadRecipients || 0} chưa đọc</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const Metric = ({ label, value, hint, danger }) => (
  <div className="metric-card">
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
    <div className={`metric-change ${danger ? 'metric-down' : 'metric-up'}`}>{hint}</div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="d-flex flex-column" style={{ gap: 6, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
    {label}
    <div className="notification-field">{children}</div>
  </label>
);

const InfoItem = ({ title, content }) => (
  <div className="stack-item" style={{ alignItems: 'flex-start' }}>
    <div>
      <div className="fw-500">{title}</div>
      <div className="text-muted text-small">{content}</div>
    </div>
  </div>
);

export default AdminNotifications;
