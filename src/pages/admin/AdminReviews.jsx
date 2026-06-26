import { Star, MessageCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { AdminDialog, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { getAdminReviews, toggleAdminReviewHidden, replyAdminReview, deleteAdminReview } from '../../api/admin';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export default function AdminReviews() {
  const setPageTitle = useContext(AdminTitleContext);
  useEffect(() => { setPageTitle('Quản lý đánh giá'); }, []);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterHidden, setFilterHidden] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const { showToast } = useAdminToast();
  const { dialog, confirmDialog, closeDialog } = useAdminDialog();

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getAdminReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Không tải được đánh giá',
        message: getAdminErrorMessage(err, 'Danh sách đánh giá chưa được tải.'),
      });
    } finally { setLoading(false); }
  };

  const handleToggleHidden = async (id) => {
    const review = reviews.find(r => r.id === id);
    const isHidden = review?.hidden;
    const accepted = await confirmDialog({
      tone: isHidden ? 'success' : 'warning',
      title: isHidden ? 'Hiện đánh giá?' : 'Ẩn đánh giá?',
      message: isHidden ? 'Đánh giá này sẽ hiển thị lại trên trang dịch vụ.' : 'Đánh giá này sẽ bị ẩn khỏi trang dịch vụ.',
      confirmLabel: isHidden ? 'Hiện' : 'Ẩn',
      cancelLabel: 'Hủy',
    });
    if (!accepted) return;
    try {
      const updated = await toggleAdminReviewHidden(id);
      setReviews(reviews.map(r => r.id === id ? updated : r));
      if (selectedReview?.id === id) setSelectedReview(updated);
      showToast({
        tone: 'success',
        title: isHidden ? 'Đã hiện đánh giá' : 'Đã ẩn đánh giá',
        message: '',
      });
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Thao tác thất bại',
        message: getAdminErrorMessage(err, 'Không thể cập nhật trạng thái.'),
      });
    }
  };

  const handleDelete = async (id) => {
    const accepted = await confirmDialog({
      tone: 'error',
      title: 'Xóa đánh giá?',
      message: 'Hành động này không thể hoàn tác. Đánh giá sẽ bị xóa vĩnh viễn.',
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
    });
    if (!accepted) return;
    try {
      await deleteAdminReview(id);
      setReviews(reviews.filter(r => r.id !== id));
      if (selectedReview?.id === id) setShowDetail(false);
      showToast({ tone: 'success', title: 'Đã xóa đánh giá', message: '' });
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Xóa thất bại',
        message: getAdminErrorMessage(err, 'Không thể xóa đánh giá.'),
      });
    }
  };

  const handleViewDetail = (review) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
    setReplying(false);
    setShowDetail(true);
  };

  const handleReply = async () => {
    if (!selectedReview) return;
    try {
      const updated = await replyAdminReview(selectedReview.id, replyText);
      setReviews(reviews.map(r => r.id === selectedReview.id ? updated : r));
      setSelectedReview(updated);
      setReplying(false);
      showToast({ tone: 'success', title: 'Đã phản hồi', message: '' });
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Phản hồi thất bại',
        message: getAdminErrorMessage(err, 'Không thể gửi phản hồi.'),
      });
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const userName = (r.userName || '').toLowerCase();
      const svcName = (r.serviceName || '').toLowerCase();
      const content = (r.content || '').toLowerCase();
      if (!userName.includes(q) && !svcName.includes(q) && !content.includes(q)) return false;
    }
    if (filterRating && r.rating !== Number(filterRating)) return false;
    if (filterHidden === 'hidden' && !r.hidden) return false;
    if (filterHidden === 'visible' && r.hidden) return false;
    return true;
  });

  const StarDisplay = ({ rating }) => (
    <span className="d-flex gap-6" style={{ gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={13} fill={s <= rating ? '#f97316' : '#e5e7eb'} color={s <= rating ? '#f97316' : '#e5e7eb'} />
      ))}
    </span>
  );

  return (
    <>
      <AdminDialog dialog={dialog} onResolve={closeDialog} />

      <div className="metrics metrics-3">
        <div className="metric-card">
          <div className="metric-label">Tổng đánh giá</div>
          <div className="metric-value">{reviews.length}</div>
          <div className="metric-change metric-up">{reviews.filter(r => !r.hidden).length} đang hiển thị</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Đánh giá 5 sao</div>
          <div className="metric-value">{reviews.filter(r => r.rating === 5).length}</div>
          <div className="metric-change metric-up">{(reviews.length > 0 ? (reviews.filter(r => r.rating === 5).length / reviews.length * 100).toFixed(0) : 0)}% tổng số</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Đang ẩn</div>
          <div className="metric-value">{reviews.filter(r => r.hidden).length}</div>
          <div className="metric-change metric-down">Cần xem xét</div>
        </div>
      </div>

      <div className="card">
        <div className="search-bar" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder="🔍  Tìm theo người dùng, dịch vụ, nội dung..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select value={filterRating} onChange={e => setFilterRating(e.target.value)}>
            <option value="">Tất cả sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
          <select value={filterHidden} onChange={e => setFilterHidden(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="visible">Đang hiển thị</option>
            <option value="hidden">Đang ẩn</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Dịch vụ</th>
              <th>Đánh giá</th>
              <th>Nội dung</th>
              <th>Ngày</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Đang tải dữ liệu...</td></tr>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="d-flex align-center gap-6">
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: '#fff7ed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, color: '#f97316', fontSize: 13, flexShrink: 0,
                      }}>
                        {(r.userName || '?')[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{r.userName || 'Người dùng'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{r.serviceName || `#${r.serviceId}`}</td>
                  <td><StarDisplay rating={r.rating} /></td>
                  <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {r.content || '—'}
                  </td>
                  <td className="text-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(r.createdAt)}</td>
                  <td>
                    <span className={`badge ${r.hidden ? 'badge-warning' : 'badge-success'}`}>
                      {r.hidden ? 'Đã ẩn' : 'Hiển thị'}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-6">
                      <button className="btn btn-sm" onClick={() => handleViewDetail(r)} title="Xem chi tiết">
                        <MessageCircle size={14} />
                      </button>
                      <button className={`btn btn-sm ${r.hidden ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => handleToggleHidden(r.id)}
                        title={r.hidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}>
                        {r.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)} title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Không có đánh giá nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedReview && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Chi tiết đánh giá</span>
              <button className="modal-close" onClick={() => setShowDetail(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* User info */}
              <div className="d-flex align-center gap-6" style={{ marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: '#fff7ed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: '#f97316', fontSize: 18,
                }}>
                  {(selectedReview.userName || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedReview.userName || 'Người dùng'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ID: {selectedReview.userId}</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)', width: '30%' }}>Dịch vụ</td>
                    <td style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)', fontWeight: 500 }}>{selectedReview.serviceName || `#${selectedReview.serviceId}`}</td>
                  </tr>
                  <tr>
                    <td className="text-muted" style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)' }}>Đánh giá</td>
                    <td style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)' }}><StarDisplay rating={selectedReview.rating} /></td>
                  </tr>
                  <tr>
                    <td className="text-muted" style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)' }}>Booking ID</td>
                    <td style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)', fontWeight: 500 }}>#{selectedReview.bookingId}</td>
                  </tr>
                  <tr>
                    <td className="text-muted" style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)' }}>Ngày tạo</td>
                    <td style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)', fontWeight: 500 }}>{formatDate(selectedReview.createdAt)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted" style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)' }}>Trạng thái</td>
                    <td style={{ padding: '8px 0', borderBottom: '0.5px solid var(--border-tertiary)' }}>
                      <span className={`badge ${selectedReview.hidden ? 'badge-warning' : 'badge-success'}`}>
                        {selectedReview.hidden ? 'Đã ẩn' : 'Đang hiển thị'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Content */}
              <div style={{ marginTop: 16 }}>
                <div className="text-muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Nội dung đánh giá</div>
                <div style={{
                  background: 'var(--bg-secondary)', borderRadius: 12, padding: 12,
                  fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  color: selectedReview.content ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}>
                  {selectedReview.content || '(Không có nội dung)'}
                </div>
              </div>

              {/* Reply */}
              <div style={{ marginTop: 16 }}>
                <div className="d-flex align-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="text-muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Phản hồi của admin</span>
                  {!replying && selectedReview.reply && (
                    <button className="btn btn-sm" onClick={() => setReplying(true)} style={{ fontSize: 12 }}>Sửa</button>
                  )}
                </div>
                {replying ? (
                  <div>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Nhập phản hồi..."
                      rows={3}
                      style={{
                        width: '100%', border: '1px solid var(--border-secondary)', borderRadius: 12,
                        padding: 10, fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
                      }}
                    />
                    <div className="d-flex gap-6" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
                      <button className="btn" onClick={() => { setReplying(false); setReplyText(selectedReview.reply || ''); }} style={{ fontSize: 12 }}>Hủy</button>
                      <button className="btn btn-primary" onClick={handleReply} style={{ fontSize: 12 }}>
                        {selectedReview.reply ? 'Cập nhật' : 'Gửi phản hồi'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--bg-secondary)', borderRadius: 12, padding: 12,
                    fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    color: selectedReview.reply ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    cursor: selectedReview.reply ? 'default' : 'pointer',
                  }} onClick={() => { if (!selectedReview.reply) setReplying(true); }}>
                    {selectedReview.reply || '(Chưa có phản hồi — nhấp để thêm)'}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowDetail(false)}>Đóng</button>
              <button className={`btn ${selectedReview.hidden ? 'btn-success' : 'btn-warning'}`}
                onClick={() => handleToggleHidden(selectedReview.id)}>
                {selectedReview.hidden ? 'Hiện đánh giá' : 'Ẩn đánh giá'}
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(selectedReview.id)}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
