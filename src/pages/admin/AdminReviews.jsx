import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { AdminDialog, AdminToastStack, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { getAdminReviews, moderateAdminReview } from '../../api/adminReviews';

const AdminReviews = () => {
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const { toasts, showToast, dismissToast } = useAdminToast();
  const { dialog, confirmDialog, promptDialog, closeDialog } = useAdminDialog();

  const load = async () => {
    try {
      setLoading(true);
      setPayload(await getAdminReviews({ ...(status ? { status } : {}), ...(keyword.trim() ? { keyword: keyword.trim() } : {}) }));
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Lỗi tải đánh giá',
        message: getAdminErrorMessage(err, 'Không tải được review.'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const moderate = async (review, nextStatus) => {
    const tone = nextStatus === 'VISIBLE' ? 'success' : nextStatus === 'HIDDEN' ? 'error' : 'warning';
    const statusText = nextStatus === 'VISIBLE' ? 'hiển thị' : nextStatus === 'HIDDEN' ? 'ẩn' : 'đánh dấu vi phạm (reported)';

    const adminNote = await promptDialog({
      tone,
      title: 'Phê duyệt đánh giá',
      message: `Nhập ghi chú admin (tuỳ chọn):`,
      defaultValue: review.adminNote || '',
      placeholder: 'Nhập ghi chú...',
      confirmLabel: 'Tiếp tục',
      cancelLabel: 'Hủy',
    });
    if (adminNote === null) return;

    const accepted = await confirmDialog({
      tone,
      title: 'Xác nhận thay đổi?',
      message: `Bạn có chắc muốn ${statusText} đánh giá này?`,
      confirmLabel: 'Cập nhật',
      cancelLabel: 'Hủy',
    });
    if (!accepted) return;

    try {
      await moderateAdminReview(review.reviewId, { status: nextStatus, adminNote });
      showToast({
        tone: 'success',
        title: 'Đã cập nhật đánh giá',
        message: `Đã cập nhật review sang trạng thái ${nextStatus} thành công.`,
      });
      await load();
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Lỗi cập nhật',
        message: getAdminErrorMessage(err, 'Không cập nhật được review.'),
      });
    }
  };

  return (
    <AdminLayout title="Quản lý đánh giá">
      <AdminToastStack toasts={toasts} onDismiss={dismissToast} />
      <AdminDialog dialog={dialog} onResolve={closeDialog} />

      <div className="card mb-0 space-y-4">
        <div className="card-title">Review production</div>
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
