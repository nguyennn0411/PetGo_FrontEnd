import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { AdminDialog, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { createCategory, deleteCategory, deleteCategoryHard, getCategories, updateCategory } from '../../api/admin';

const emptyForm = {
    name: '',
    parentId: '',
    description: '',
    active: true,
};

const countCategories = (items = []) => items.reduce((total, item) => total + 1 + countCategories(item.children || []), 0);

const flattenCategories = (items = [], level = 0, parentNames = []) => (items || []).flatMap((item) => {
    const path = [...parentNames, item.name].filter(Boolean);
    return [
        { ...item, level, pathLabel: path.join(' / ') },
        ...flattenCategories(item.children || [], level + 1, path),
    ];
});

const collectDescendantIds = (category) => (category?.children || []).flatMap((child) => [child.id, ...collectDescendantIds(child)]);

const AdminServices = () => {
    const setPageTitle = useContext(AdminTitleContext);
    useEffect(() => { setPageTitle('Quản lý danh mục'); }, []);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteMode, setDeleteMode] = useState('soft');
    const [moveToCategoryId, setMoveToCategoryId] = useState('');
    const { showToast } = useAdminToast();
    const { dialog, confirmDialog, closeDialog } = useAdminDialog();

    const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
    const totalCategories = useMemo(() => countCategories(categories), [categories]);
    const activeCategories = useMemo(() => flatCategories.filter((item) => item.active).length, [flatCategories]);
    const hiddenCategories = useMemo(() => flatCategories.filter((item) => !item.active).length, [flatCategories]);

    const filteredCategories = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return categories;

        const filterTree = (items = []) => items
            .map((item) => {
                const children = filterTree(item.children || []);
                const matches = item.name?.toLowerCase().includes(keyword)
                    || item.description?.toLowerCase().includes(keyword)
                    || item.parentName?.toLowerCase().includes(keyword);

                return matches || children.length > 0 ? { ...item, children } : null;
            })
            .filter(Boolean);

        return filterTree(categories);
    }, [categories, searchTerm]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getCategories();
            setCategories(data.result || []);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách danh mục:', error);
            showToast({
                tone: 'error',
                title: 'Không tải được danh mục',
                message: getAdminErrorMessage(error, 'Không thể tải danh mục dịch vụ.'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        setEditingCategory(category);
        setFormData(category
            ? {
                name: category.name || '',
                parentId: category.parentId ? String(category.parentId) : '',
                description: category.description || '',
                active: category.active !== false,
            }
            : emptyForm);
        setShowModal(true);
    };

    const toPayload = (data) => ({
        name: data.name?.trim(),
        parentId: data.parentId ? Number(data.parentId) : null,
        description: data.description?.trim() || null,
        active: Boolean(data.active),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = toPayload(formData);
            if (editingCategory) {
                await updateCategory(editingCategory.id, payload);
                showToast({
                    tone: 'success',
                    title: 'Đã cập nhật danh mục',
                    message: `Danh mục "${payload.name}" đã được lưu thay đổi.`,
                });
            } else {
                await createCategory(payload);
                showToast({
                    tone: 'success',
                    title: 'Đã tạo danh mục mới',
                    message: `Danh mục "${payload.name}" đã sẵn sàng để sử dụng.`,
                });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Lỗi khi lưu danh mục:', error);
            showToast({
                tone: 'error',
                title: 'Lưu danh mục thất bại',
                message: getAdminErrorMessage(error, 'Không thể lưu danh mục lúc này.'),
            });
        }
    };

    const handleOpenDeleteModal = (category) => {
        setDeleteTarget(category);
        setDeleteMode('soft');
        setMoveToCategoryId('');
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        const cat = deleteTarget;
        setShowDeleteModal(false);

        if (deleteMode === 'soft') {
            try {
                await deleteCategory(cat.id);
                showToast({ tone: 'success', title: 'Đã ẩn danh mục', message: `Danh mục "${cat.name}" và danh mục con đã được ẩn.` });
                fetchData();
            } catch (error) {
                showToast({ tone: 'error', title: 'Ẩn thất bại', message: getAdminErrorMessage(error, 'Không thể ẩn danh mục.') });
            }
        } else {
            try {
                await deleteCategoryHard(cat.id, moveToCategoryId || null);
                showToast({ tone: 'success', title: 'Đã xóa danh mục', message: `Danh mục "${cat.name}" đã bị xóa vĩnh viễn.` });
                fetchData();
            } catch (error) {
                const msg = error.response?.data?.message || error.message || 'Không thể xóa danh mục.';
                showToast({ tone: 'error', title: 'Xóa thất bại', message: msg });
            }
        }
    };

    const deleteMoveOptions = useMemo(() => {
        if (!deleteTarget) return [];
        const blockedIds = new Set([deleteTarget.id, ...collectDescendantIds(deleteTarget)]);
        return flatCategories.filter((item) => !blockedIds.has(item.id) && item.active);
    }, [deleteTarget, flatCategories]);

    const handleRestore = async (category) => {
        try {
            await updateCategory(category.id, {
                name: category.name,
                parentId: category.parentId || null,
                description: category.description || null,
                active: true,
            });
            showToast({
                tone: 'success',
                title: 'Đã hiện lại danh mục',
                message: `Danh mục "${category.name}" đã được kích hoạt trở lại.`,
            });
            fetchData();
        } catch (error) {
            console.error('Lỗi khi hiện danh mục:', error);
            showToast({
                tone: 'error',
                title: 'Hiện lại danh mục thất bại',
                message: getAdminErrorMessage(error, 'Không thể hiện lại danh mục.'),
            });
        }
    };

    const parentOptions = useMemo(() => {
        if (!editingCategory) return flatCategories;
        const blockedIds = new Set([editingCategory.id, ...collectDescendantIds(editingCategory)]);
        return flatCategories.filter((item) => !blockedIds.has(item.id));
    }, [editingCategory, flatCategories]);

    return (
        <>
            <AdminDialog dialog={dialog} onResolve={closeDialog} />

            <div className="metrics metrics-3">
                <div className="metric-card">
                    <div className="metric-label">Tổng số danh mục</div>
                    <div className="metric-value">{totalCategories}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Đang hoạt động</div>
                    <div className="metric-value">{activeCategories}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Đã ẩn</div>
                    <div className="metric-value">{hiddenCategories}</div>
                </div>
            </div>

            <div className="search-bar" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <input
                        type="text"
                        placeholder="🔍  Tìm tên danh mục, mô tả, danh mục cha..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: 420 }}
                    />
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Danh mục mới</button>
            </div>

            <div className="card mb-0">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 80 }}>ID</th>
                            <th>Tên danh mục</th>
                            <th>Danh mục cha</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Đang tải...</td></tr>
                        ) : countCategories(filteredCategories) > 0 ? (
                            filteredCategories.map((category) => (
                                <CategoryRows
                                    key={category.id}
                                    category={category}
                                    level={0}
                                    onEdit={handleOpenModal}
                                    onDelete={handleOpenDeleteModal}
                                    onRestore={handleRestore}
                                />
                            ))
                        ) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Không tìm thấy danh mục nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showDeleteModal && deleteTarget && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }} onClick={() => setShowDeleteModal(false)}>
                    <div className="modal" style={{ background: '#fff', width: 520, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: 18, color: '#dc3545' }}>Xóa danh mục dịch vụ</div>
                            <button onClick={() => setShowDeleteModal(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <p style={{ margin: 0, fontSize: 14, color: '#555' }}>
                                Bạn đang xóa danh mục: <strong>{deleteTarget.name}</strong>
                                {(deleteTarget.children || []).length > 0 && <span> (bao gồm {deleteTarget.children.length} danh mục con)</span>}
                            </p>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', background: deleteMode === 'soft' ? '#fff8e1' : '#fff' }}>
                                <input type="radio" name="deleteMode" value="soft" checked={deleteMode === 'soft'} onChange={() => setDeleteMode('soft')} />
                                <div><div style={{ fontWeight: 600 }}>Ẩn danh mục (Soft delete)</div><div style={{ fontSize: 12, color: '#888' }}>Danh mục và danh mục con sẽ bị ẩn, có thể khôi phục sau.</div></div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', background: deleteMode === 'hard' ? '#ffebee' : '#fff' }}>
                                <input type="radio" name="deleteMode" value="hard" checked={deleteMode === 'hard'} onChange={() => setDeleteMode('hard')} />
                                <div><div style={{ fontWeight: 600 }}>Xóa vĩnh viễn (Hard delete)</div><div style={{ fontSize: 12, color: '#888' }}>Danh mục sẽ bị xóa khỏi CSDL, không thể khôi phục.</div></div>
                            </label>

                            {deleteMode === 'hard' && (
                                <div style={{ paddingLeft: 36 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Di chuyển dịch vụ đến danh mục:</label>
                                    <select
                                        value={moveToCategoryId}
                                        onChange={(e) => setMoveToCategoryId(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {deleteMoveOptions.map((item) => (
                                            <option key={item.id} value={item.id}>{`${'— '.repeat(item.level)}${item.pathLabel}`}</option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Nếu danh mục có dịch vụ, bắt buộc phải chọn danh mục để di chuyển đến.</div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ padding: 24, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button type="button" className="btn" onClick={() => setShowDeleteModal(false)}>Hủy</button>
                            <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                                {deleteMode === 'soft' ? 'Ẩn danh mục' : 'Xóa vĩnh viễn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }} onClick={() => setShowModal(false)}>
                    <div className="modal" style={{
                        background: '#fff', width: 560, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        animation: 'modalFadeIn 0.3s ease',
                    }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 18 }}>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</div>
                                <div className="text-tiny text-muted">Chỉ quản lý tên, danh mục cha, mô tả và trạng thái.</div>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Tên danh mục *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={120}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Danh mục cha</label>
                                    <select
                                        value={formData.parentId}
                                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
                                    >
                                        <option value="">Không có - danh mục cấp cao nhất</option>
                                        {parentOptions.map((item) => (
                                            <option key={item.id} value={item.id}>{`${'— '.repeat(item.level)}${item.pathLabel}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Mô tả</label>
                                    <textarea
                                        maxLength={255}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, minHeight: 90 }}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        style={{ width: 18, height: 18 }}
                                    />
                                    <span style={{ fontSize: 14, fontWeight: 600 }}>Hoạt động</span>
                                </label>
                            </div>
                            <div className="modal-footer" style={{ padding: 24, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">{editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const CategoryRows = ({ category, level, onEdit, onDelete, onRestore }) => (
    <>
        <tr>
            <td className="text-tiny">{category.id}</td>
            <td className="fw-500">
                <div style={{ paddingLeft: level * 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {level > 0 && <span className="text-muted">↳</span>}
                    <span>{category.name}</span>
                    {(category.children || []).length > 0 && <span className="badge badge-info">{category.children.length} con</span>}
                </div>
            </td>
            <td>{category.parentName || '—'}</td>
            <td>{category.description ? (category.description.length > 45 ? `${category.description.substring(0, 45)}...` : category.description) : '—'}</td>
            <td>
                {category.active
                    ? <span className="badge badge-success">Hoạt động</span>
                    : <span className="badge badge-danger">Đã ẩn</span>}
            </td>
            <td>
                <div className="d-flex gap-6">
                    <button className="btn btn-sm" onClick={() => onEdit(category)}>Sửa</button>
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(category)}>Xóa</button>
                    {!category.active && (
                        <button className="btn btn-sm btn-success" onClick={() => onRestore(category)}>Hiện</button>
                    )}
                </div>
            </td>
        </tr>
        {(category.children || []).map((child) => (
            <CategoryRows
                key={child.id}
                category={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onRestore={onRestore}
            />
        ))}
    </>
);

export default AdminServices;