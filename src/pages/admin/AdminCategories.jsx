import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { shopApi } from '../../api/shop';

const emptyForm = { name: '', slug: '', iconKey: '', description: '', sortOrder: 0, active: true };
const slugify = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  const load = async () => {
    try {
      const data = await shopApi.getAdminCategories();
      setCategories(data || []);
    } catch (e) {
      console.error(e);
      alert('Lỗi khi tải danh mục');
    }
  };
  useEffect(() => { load(); }, []);

  const openForm = (cat = null) => {
    setEditing(cat);
    setForm(cat ? { ...emptyForm, ...cat } : emptyForm);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, slug: form.slug || slugify(form.name), sortOrder: Number(form.sortOrder || 0) };
      if (editing) await shopApi.updateAdminCategory(editing.id, payload); else await shopApi.createAdminCategory(payload);
      setShowForm(false); setEditing(null); setForm(emptyForm); load();
    } catch (e) {
      console.error(e);
      alert('Lỗi khi lưu danh mục');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const res = await shopApi.uploadAdminStoreImage(file);
      if (res) {
        setForm({ ...form, iconKey: res });
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải ảnh lên');
    } finally {
      setUploadingImage(false);
    }
  };

  const remove = async (id) => { 
    if (await window.confirmAsync('Ẩn danh mục này khỏi Store?')) { 
      try {
        await shopApi.deleteAdminCategory(id); 
        load(); 
      } catch (e) {
        console.error(e);
        alert('Lỗi khi ẩn danh mục');
      }
    } 
  };

  return (
    <AdminLayout title="Quản lý Danh mục Store">
      <div className="metrics metrics-3">
        <div className="metric-card"><div className="metric-label">Tổng danh mục</div><div className="metric-value">{categories.length}</div></div>
        <div className="metric-card"><div className="metric-label">Đang hiển thị</div><div className="metric-value">{categories.filter(c => c.active !== false).length}</div></div>
      </div>

      <div className="search-bar" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button className="btn btn-primary" onClick={() => openForm()}>+ Thêm danh mục</button>
      </div>

      <div className="card mb-0">
        <table>
          <thead><tr><th>ID</th><th>Tên danh mục</th><th>Slug</th><th>Mô tả</th><th>Thứ tự</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
          <tbody>{categories.map((c) => <tr key={c.id}>
            <td>{c.id}</td>
            <td><b>{c.name}</b></td>
            <td>{c.slug}</td>
            <td>{c.description}</td>
            <td>{c.sortOrder}</td>
            <td><span className={`status ${c.active ? 'status-active' : 'status-pending'}`}>{c.active ? 'HIỂN THỊ' : 'ĐÃ ẨN'}</span></td>
            <td style={{ textAlign: 'right' }}>
              <button className="btn btn-sm" onClick={() => openForm(c)}>Sửa</button> 
              {' '}
              <button className="btn btn-sm btn-danger" onClick={() => remove(c.id)}>Ẩn</button>
            </td>
          </tr>)}</tbody>
        </table>
      </div>

      {showForm && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <form onSubmit={submit} className="card" style={{ width: 'min(500px, 100%)', maxHeight: '90vh', overflow: 'auto' }}>
          <h2>{editing ? 'Cập nhật danh mục' : 'Thêm danh mục'}</h2>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <Input label="Tên danh mục" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: form.slug || slugify(v) })} required />
            <Input label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
            <div style={{ marginTop: 12 }}>
              <label>Icon/Image</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                {form.iconKey && <img src={form.iconKey} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ flex: 1, padding: '4px', border: '1px solid #ddd', borderRadius: '8px' }} />
                {uploadingImage && <span style={{ fontSize: 12, color: '#888' }}>Đang tải...</span>}
              </div>
            </div>
            <div style={{ marginTop: 12 }}><label>Mô tả</label><textarea rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd' }} /></div>
            <Input label="Thứ tự hiển thị" type="number" value={form.sortOrder} onChange={(v) => setForm({ ...form, sortOrder: v })} />
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="active-cb" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="active-cb">Hiển thị (Active)</label>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>Hủy</button>
            <button className="btn btn-primary">Lưu</button>
          </div>
        </form>
      </div>}
    </AdminLayout>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }) { 
  return <div style={{ marginTop: 12 }}><label>{label}</label><input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd' }} /></div>; 
}
