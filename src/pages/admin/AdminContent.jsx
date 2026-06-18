import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { AdminDialog, AdminToastStack, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { createAdminHomeSlider, deleteAdminHomeSlider, getAdminHomeSliders, updateAdminHomeSlider, updateAdminHomeSliderVisibility } from '../../api/adminHomeSliders';

const emptyForm = { title: '', subtitle: '', imageUrl: '', ctaLabel: '', ctaUrl: '', sortOrder: 0, active: true };

const AdminContent = () => {
  const [sliders, setSliders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const { toasts, showToast, dismissToast } = useAdminToast();
  const { dialog, confirmDialog, closeDialog } = useAdminDialog();

  const loadSliders = async () => {
    setLoading(true);
    try {
      setSliders(await getAdminHomeSliders() || []);
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Lỗi tải slider',
        message: getAdminErrorMessage(err, 'Không tải được danh sách slider trang chủ.'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSliders(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await updateAdminHomeSlider(editingId, form);
        showToast({
          tone: 'success',
          title: 'Cập nhật thành công',
          message: 'Đã lưu thay đổi slider trang chủ.',
        });
      } else {
        await createAdminHomeSlider(form);
        showToast({
          tone: 'success',
          title: 'Tạo slider thành công',
          message: 'Đã thêm slider trang chủ mới thành công.',
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      loadSliders();
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Lưu slider thất bại',
        message: getAdminErrorMessage(err, 'Lưu slider thất bại. Vui lòng kiểm tra lại dữ liệu.'),
      });
    }
  };

  const handleToggleVisibility = async (id, active) => {
    try {
      await updateAdminHomeSliderVisibility(id, active);
      showToast({
        tone: 'success',
        title: active ? 'Đã hiển thị slider' : 'Đã ẩn slider',
        message: 'Trạng thái hiển thị của slider đã được cập nhật.',
      });
      loadSliders();
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Cập nhật thất bại',
        message: getAdminErrorMessage(err, 'Không thể cập nhật trạng thái hiển thị slider.'),
      });
    }
  };

  const deleteSlider = async (slider) => {
    const accepted = await confirmDialog({
      tone: 'warning',
      title: 'Xóa slider trang chủ?',
      message: `Bạn có chắc chắn muốn xóa slider "${slider.title || 'này'}"? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa slider',
      cancelLabel: 'Hủy',
    });
    if (!accepted) return;

    try {
      await deleteAdminHomeSlider(slider.id);
      showToast({
        tone: 'success',
        title: 'Đã xóa slider',
        message: 'Đã xóa slider trang chủ thành công.',
      });
      loadSliders();
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Xóa slider thất bại',
        message: getAdminErrorMessage(err, 'Không thể xóa slider này.'),
      });
    }
  };

  const editSlider = (slider) => {
    setEditingId(slider.id);
    setForm({ title: slider.title || '', subtitle: slider.subtitle || '', imageUrl: slider.imageUrl || '', ctaLabel: slider.ctaLabel || '', ctaUrl: slider.ctaUrl || '', sortOrder: slider.sortOrder || 0, active: Boolean(slider.active) });
  };

  return (
    <AdminLayout title="Quản lý nội dung">
      <AdminToastStack toasts={toasts} onDismiss={dismissToast} />
      <AdminDialog dialog={dialog} onResolve={closeDialog} />

      <div className="tabs">
        <div className="tab active">Slider trang chủ</div>
        <div className="tab">Blog & SEO</div>
        <div className="tab">Trang tĩnh</div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Cấu hình slider trang chủ</div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingId(null); setForm(emptyForm); }}>+ Thêm slider</button>
        </div>
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 18 }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <input className="input" placeholder="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input className="input" placeholder="URL ảnh" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required />
            <input className="input" placeholder="Mô tả" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            <input className="input" placeholder="Nhãn nút CTA" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} />
            <input className="input" placeholder="URL CTA" value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} />
            <input className="input" type="number" placeholder="Thứ tự" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>
          <label className="d-flex align-center gap-6" style={{ marginTop: 12 }}><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Hiển thị slider</label>
          <div className="d-flex gap-6" style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" type="submit">{editingId ? 'Cập nhật' : 'Tạo slider'}</button>
            {editingId && <button className="btn btn-sm" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Hủy sửa</button>}
          </div>
        </form>
        <div className="stack-list">
          {loading ? <div className="text-tiny">Đang tải...</div> : sliders.map((b) => (
            <div key={b.id} className="stack-item" style={{ padding: '12px 0' }}>
              <div className="d-flex align-center gap-6" style={{ width: '100%' }}>
                <img src={b.imageUrl} alt={b.title} style={{ width: 90, height: 52, objectFit: 'cover', background: 'var(--petgo-orange-light)', borderRadius: 8 }} />
                <div className="flex-1" style={{ marginLeft: 10 }}>
                  <div className="fw-500" style={{ fontSize: 13 }}>{b.title}</div>
                  <div className="text-tiny">Thứ tự: {b.sortOrder} · {b.ctaUrl || 'Chưa có CTA'}</div>
                </div>
                <span className={`badge ${b.active ? 'badge-success' : 'badge-gray'}`}>{b.active ? 'Đang hiển thị' : 'Ẩn'}</span>
                <div className="d-flex gap-6" style={{ marginLeft: 10 }}>
                  <button className="btn btn-sm" onClick={() => editSlider(b)}>Sửa</button>
                  <button className="btn btn-sm" onClick={() => handleToggleVisibility(b.id, !b.active)}> {b.active ? 'Ẩn' : 'Hiện'} </button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteSlider(b)}>Xóa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContent;
