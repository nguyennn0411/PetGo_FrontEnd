import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminReviews, moderateAdminReview } from '../../api/adminReviews';

const AdminReviews = () => {
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true); setError('');
      setPayload(await getAdminReviews({ ...(status ? { status } : {}), ...(keyword.trim() ? { keyword: keyword.trim() } : {}) }));
    } catch (err) { setError(err.response?.data?.message || 'Không tải được review.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);

  const moderate = async (review, nextStatus) => {
    const adminNote = window.prompt('Ghi chú admin', review.adminNote || '') || '';
    if (!window.confirm(`Cập nhật review sang ${nextStatus}?`)) return;
    try { setError(''); setMessage(''); await moderateAdminReview(review.reviewId, { status: nextStatus, adminNote }); setMessage('Đã cập nhật review.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Không cập nhật được review.'); }
  };

  return (
    <AdminLayout title="Quản lý đánh giá">
      <div className="card mb-0 space-y-4">
        <div className="card-title">Review production</div>
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <div className="flex gap-3 flex-wrap">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-control" style={{ maxWidth: 180 }}><option value="">Tất cả</option><option value="VISIBLE">VISIBLE</option><option value="HIDDEN">HIDDEN</option><option value="REPORTED">REPORTED</option></select>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} className="form-control" placeholder="Tìm comment, provider, booking..." style={{ maxWidth: 320 }} />
          <button className="btn" onClick={load}>Lọc</button>
        </div>
        <div className="table-responsive">
          <table><thead><tr><th>Review</th><th>User / Provider</th><th>Reply</th><th>Admin</th><th>Thao tác</th></tr></thead><tbody>
            {loading ? <tr><td colSpan="5">Đang tải...</td></tr> : !payload?.reviews?.length ? <tr><td colSpan="5">Chưa có review.</td></tr> : payload.reviews.map((review) => <tr key={review.reviewId}>
              <td><b>{review.rating}★</b> <span className="badge badge-info">{review.status}</span><br />{review.comment || '—'}<br /><span className="text-muted">{review.bookingCode} · {review.serviceName} · {review.createdAt}</span></td>
              <td>{review.customerName || 'User'}<br /><span className="text-muted">{review.providerName || 'Provider'}</span></td>
              <td>{review.providerReply || 'Chưa phản hồi'}<br /><span className="text-muted">{review.providerRepliedAt || ''}</span></td>
              <td>{review.adminNote || '—'}<br /><span className="text-muted">{review.adminReviewedAt || ''}</span></td>
              <td><button className="btn btn-sm btn-success" onClick={() => moderate(review, 'VISIBLE')}>Hiện</button> <button className="btn btn-sm btn-danger" onClick={() => moderate(review, 'HIDDEN')}>Ẩn</button> <button className="btn btn-sm" onClick={() => moderate(review, 'REPORTED')}>Đánh dấu report</button></td>
            </tr>)}
          </tbody></table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
