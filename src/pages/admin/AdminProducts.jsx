import React, { useContext, useEffect, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { AdminDialog, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { formatVnd, shopApi } from '../../api/shop';

const emptyForm = { name: '', slug: '', brand: 'PetGo', categoryId: '', targetSpecies: 'ALL', priceAmount: '', salePriceAmount: '', stockQuantity: 0, sku: '', mainImageUrl: '', shortDescription: '', description: '', featured: true, hot: false, active: true, status: 'ACTIVE' };
const slugify = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminProducts() {
  const setPageTitle = useContext(AdminTitleContext);
  useEffect(() => { setPageTitle('Quản lý sản phẩm shop'); }, []);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [keyword, setKeyword] = useState('');

  const { toast, showToast } = useAdminToast();
  const { dialog, confirmDialog, closeDialog } = useAdminDialog();

  const load = async () => {
    try {
      setProducts(await shopApi.getAdminProducts({ keyword }) || []);
      setCategories(await shopApi.getCategories() || []);
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Lỗi tải sản phẩm',
        message: getAdminErrorMessage(err, 'Không tải được danh sách sản phẩm hoặc danh mục.'),
      });
    }
  };
  useEffect(() => { load(); }, []);

  const openForm = (product = null) => {
    setEditing(product);
    setForm(product ? { ...emptyForm, ...product, categoryId: product.categoryId || '' } : emptyForm);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, slug: form.slug || slugify(form.name), priceAmount: Number(form.priceAmount), salePriceAmount: form.salePriceAmount ? Number(form.salePriceAmount) : null, stockQuantity: Number(form.stockQuantity || 0), categoryId: Number(form.categoryId) };
      if (editing) {
        await shopApi.updateAdminProduct(editing.id, payload);
        showToast({
          tone: 'success',
          title: 'Cập nhật thành công',
          message: `Sản phẩm "${payload.name}" đã được lưu thay đổi.`,
        });
      } else {
        await shopApi.createAdminProduct(payload);
        showToast({
          tone: 'success',
          title: 'Tạo sản phẩm thành công',
          message: `Sản phẩm "${payload.name}" đã được thêm vào shop.`,
        });
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); load();
    } catch (err) {
      showToast({
        tone: 'error',
        title: 'Lưu thất bại',
        message: getAdminErrorMessage(err, 'Không thể lưu thông tin sản phẩm.'),
      });
    }
  };

  // const remove = async (id) => {
  //   const product = products.find((p) => p.id === id);
  //   const name = product ? product.name : 'sản phẩm này';
  //   const accepted = await confirmDialog({
  //     tone: 'warning',
  //     title: 'Ẩn sản phẩm?',
  //     message: `Bạn có chắc muốn ẩn sản phẩm "${name}"? Sản phẩm ẩn sẽ không hiển thị trên cửa hàng.`,
  //     confirmLabel: 'Ẩn sản phẩm',
  //     cancelLabel: 'Hủy',
  //   });
  //   if (!accepted) return;

  //   try {
  //     await shopApi.deleteAdminProduct(id);
  //     showToast({
  //       tone: 'success',
  //       title: 'Đã ẩn sản phẩm',
  //       message: `Sản phẩm "${name}" đã được ẩn thành công.`,
  //     });
  //     load();
  //   } catch (err) {
  //     showToast({
  //       tone: 'error',
  //       title: 'Ẩn sản phẩm thất bại',
  //       message: getAdminErrorMessage(err, 'Không thể ẩn sản phẩm.'),
  //     });
  //   }
  // };
  const remove = async (id) => {
    const accepted = await confirmDialog({
      tone: 'warning',
      title: 'Xóa sản phẩm?',
      message: 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?',
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
    });
    if (!accepted) return;
    try {
      await shopApi.deleteAdminProduct(id);
      showToast({ tone: 'success', title: 'Đã xóa', message: 'Sản phẩm đã được xóa khỏi hệ thống.' });
      load();
    } catch (err) {
      showToast({ tone: 'error', title: 'Xóa thất bại', message: getAdminErrorMessage(err, 'Không thể xóa sản phẩm.') });
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await shopApi.uploadAdminStoreImage(file);
      setForm({ ...form, mainImageUrl: url });
    } catch (err) {
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <AdminDialog dialog={dialog} onResolve={closeDialog} />

      <div className="metrics metrics-3">
        <div className="metric-card"><div className="metric-label">Tổng sản phẩm</div><div className="metric-value">{products.length}</div><div className="metric-change metric-up">PetGo Store</div></div>
        <div className="metric-card"><div className="metric-label">Đang bán</div><div className="metric-value">{products.filter((p) => p.active !== false && p.status === 'ACTIVE').length}</div><div className="metric-change metric-up">Hiển thị ngoài shop</div></div>
        <div className="metric-card"><div className="metric-label">Hết hàng</div><div className="metric-value">{products.filter((p) => Number(p.stockQuantity || 0) <= 0).length}</div><div className="metric-change metric-down">Cần nhập kho</div></div>
      </div>

      <div className="search-bar" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="🔍 Tìm tên, SKU, thương hiệu..." style={{ maxWidth: 420 }} />
        <div style={{ display: 'flex', gap: 8 }}><button className="btn" onClick={load}>Tìm</button><button className="btn btn-primary" onClick={() => openForm()}>+ Thêm sản phẩm</button></div>
      </div>

      <div className="card mb-0">
        <table>
          <thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Loài</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
          <tbody>{products.map((p) => <tr key={p.id}><td><img src={p.mainImageUrl || 'https://placehold.co/80'} style={{ width: 58, height: 58, borderRadius: 16, objectFit: 'cover' }} /></td><td><b>{p.name}</b><br /><span style={{ color: '#888', fontSize: 12 }}>{p.sku || p.productCode}</span></td><td>{p.categoryName}</td><td><b>{formatVnd(p.salePriceAmount || p.priceAmount)}</b>{p.salePriceAmount && <><br /><span style={{ color: '#999', textDecoration: 'line-through', fontSize: 12 }}>{formatVnd(p.priceAmount)}</span></>}</td><td>{p.stockQuantity}</td><td>{p.targetSpecies}</td><td><span className={`status ${p.status === 'ACTIVE' ? 'status-active' : 'status-pending'}`}>{p.status}</span></td><td style={{ textAlign: 'right' }}><button className="btn btn-sm" onClick={() => openForm(p)}>Sửa</button> <button className="btn btn-sm btn-danger" onClick={() => remove(p.id)}>Xóa</button></td></tr>)}</tbody>
        </table>
      </div>

      {showForm && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><form onSubmit={submit} className="card" style={{ width: 'min(760px, 100%)', maxHeight: '90vh', overflow: 'auto' }}><h2>{editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}</h2><div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        <Input label="Tên" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: form.slug || slugify(v) })} required />
        <Input label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} required />
        <div><label>Danh mục</label><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required><option value="">Chọn danh mục</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label>Loài</label><select value={form.targetSpecies} onChange={(e) => setForm({ ...form, targetSpecies: e.target.value })}><option value="ALL">ALL</option><option value="DOG">DOG</option><option value="CAT">CAT</option><option value="BIRD">BIRD</option><option value="OTHER">OTHER</option></select></div>
        <Input label="Giá" type="number" value={form.priceAmount} onChange={(v) => setForm({ ...form, priceAmount: v })} required />
        <Input label="Giá sale" type="number" value={form.salePriceAmount || ''} onChange={(v) => setForm({ ...form, salePriceAmount: v })} />
        <Input label="Tồn kho" type="number" value={form.stockQuantity} onChange={(v) => setForm({ ...form, stockQuantity: v })} />
        <Input label="SKU" value={form.sku || ''} onChange={(v) => setForm({ ...form, sku: v })} />
        <div>
          <label>Ảnh sản phẩm</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="file" accept="image/*" onChange={handleUploadImage} style={{ flex: 1, padding: '8px 0' }} />
            {form.mainImageUrl && <img src={form.mainImageUrl} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} alt="preview" />}
          </div>
        </div>
        <Input label="Thương hiệu" value={form.brand || ''} onChange={(v) => setForm({ ...form, brand: v })} />
      </div><div style={{ marginTop: 12 }}><label>Mô tả ngắn</label><input value={form.shortDescription || ''} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></div><div style={{ marginTop: 12 }}><label>Mô tả</label><textarea rows={4} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}><button type="button" className="btn" onClick={() => setShowForm(false)}>Hủy</button><button className="btn btn-primary">Lưu</button></div></form></div>}
    </>
  );
}
function Input({ label, value, onChange, type = 'text', required = false }) { return <div><label>{label}</label><input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} /></div>; }
