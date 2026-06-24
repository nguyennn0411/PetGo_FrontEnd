import { useContext, useEffect, useMemo, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { toast } from 'react-hot-toast';
import { getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { getAdminServiceList, createAdminService, updateAdminService, deleteAdminService, uploadAdminServiceImage } from '../../api/admin';
import { getCategories } from '../../api/admin';
import { Upload, Trash2 } from 'lucide-react';

const formatPrice = (amount) => {
    if (amount == null) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const priceUnitLabel = (unit) => {
    const map = {
        SESSION: '1 lần', PER_SESSION: '1 lần', ONCE: '1 lần', VISIT: '1 lần',
        HOUR: 'giờ', PER_HOUR: 'giờ', DAY: 'ngày', PER_DAY: 'ngày',
        PET: 'thú cưng', PER_PET: 'thú cưng',
    };
    return map?.[unit?.toUpperCase()] || unit || '1 lần';
};

const emptyForm = {
    serviceCode: '', name: '', categoryIds: [], shortDescription: '', description: '',
    defaultDurationMinutes: 30, basePriceAmount: '', priceUnit: 'SESSION',
    currencyCode: 'VND', imageUrl: '', active: true, bookingType: 'SHORT',
};

const AdminAllServices = () => {
    const setPageTitle = useContext(AdminTitleContext);
    useEffect(() => { setPageTitle('Quản lý dịch vụ'); }, []);
    const { showToast } = useAdminToast();
    const { confirmDialog } = useAdminDialog();

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [categoryTree, setCategoryTree] = useState([]);
    const [selectedCatIds, setSelectedCatIds] = useState(new Set());
    const [showCatFilter, setShowCatFilter] = useState(false);
    const [catSearch, setCatSearch] = useState('');
    const [modalCatSearch, setModalCatSearch] = useState('');

    useEffect(() => {
        loadServices();
        loadCategoryTree();
    }, []);

    const loadServices = async () => {
        setLoading(true);
        try {
            const data = await getAdminServiceList();
            setServices(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast({
                tone: 'error', title: 'Không tải được dịch vụ',
                message: getAdminErrorMessage(error, 'Không thể tải danh sách dịch vụ.'),
            });
        } finally { setLoading(false); }
    };

    const loadCategoryTree = async () => {
        try {
            const data = await getCategories();
            setCategoryTree(data?.result || []);
        } catch (_) { }
    };

    // ── Category tree helpers ──
    const flatCatList = useMemo(() => {
        const result = [];
        const walk = (cats, level = 0) => {
            for (const c of cats) {
                result.push({ ...c, level });
                if (c.children?.length) walk(c.children, level + 1);
            }
        };
        walk(categoryTree);
        return result;
    }, [categoryTree]);

    const filteredCatList = useMemo(() => {
        const kw = catSearch.trim().toLowerCase();
        if (!kw) return flatCatList;
        return flatCatList.filter((c) => c.name?.toLowerCase().includes(kw));
    }, [flatCatList, catSearch]);

    function findNodeById(nodes, id) {
        for (const n of nodes) {
            if (n.id === id) return n;
            if (n.children) {
                const found = findNodeById(n.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    function collectDescendantIds(nodes) {
        const ids = [];
        for (const n of nodes) {
            ids.push(n.id);
            if (n.children) ids.push(...collectDescendantIds(n.children));
        }
        return ids;
    }

    function collectAncestorIds(tree, targetId, chain = []) {
        for (const n of tree) {
            if (n.id === targetId) return chain;
            if (n.children) {
                const found = collectAncestorIds(n.children, targetId, [...chain, n.id]);
                if (found) return found;
            }
        }
        return null;
    }

    function isIndeterminate(node) {
        if (!node.children?.length) return false;
        const descIds = collectDescendantIds(node.children);
        const checked = descIds.filter((id) => selectedCatIds.has(id));
        return checked.length > 0 && checked.length < descIds.length;
    }

    function isNodeChecked(node) {
        if (selectedCatIds.has(node.id)) return true;
        if (node.children) {
            const descIds = collectDescendantIds(node.children);
            return descIds.some((id) => selectedCatIds.has(id));
        }
        return false;
    }

    function handleCatCheck(node, checked) {
        const newSet = new Set(selectedCatIds);
        const descIds = collectDescendantIds(node.children || []);

        if (checked) {
            newSet.add(node.id);
            descIds.forEach((id) => newSet.add(id));
            const ancestors = collectAncestorIds(categoryTree, node.id);
            if (ancestors) ancestors.forEach((id) => newSet.add(id));
        } else {
            newSet.delete(node.id);
            descIds.forEach((id) => newSet.delete(id));
            // Bỏ tick cha nếu không còn con nào được tick (xử lý từ con lên cha)
            const ancestors = collectAncestorIds(categoryTree, node.id);
            if (ancestors) {
                for (let i = ancestors.length - 1; i >= 0; i--) {
                    const ancId = ancestors[i];
                    const ancNode = findNodeById(categoryTree, ancId);
                    if (ancNode && ancNode.children) {
                        const ancDescIds = collectDescendantIds(ancNode.children);
                        const stillChecked = ancDescIds.some((id) => newSet.has(id));
                        if (!stillChecked) newSet.delete(ancId);
                    }
                }
            }
        }
        setSelectedCatIds(newSet);
    }

    // ── Filters ──
    const categoryNames = (s) => (s.categories || []).map((c) => c.name).join(' ');
    const filtered = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        return services.filter((s) => {
            if (activeFilter === 'ACTIVE' && !s.active) return false;
            if (activeFilter === 'INACTIVE' && s.active) return false;
            if (selectedCatIds.size > 0) {
                const sCatIds = new Set((s.categories || []).map((c) => c.id));
                if (![...selectedCatIds].some((id) => sCatIds.has(id))) return false;
            }
            if (!keyword) return true;
            return (s.name?.toLowerCase().includes(keyword)
                || s.serviceCode?.toLowerCase().includes(keyword)
                || categoryNames(s).toLowerCase().includes(keyword)
                || s.bookingType?.toLowerCase().includes(keyword));
        });
    }, [services, searchTerm, activeFilter, selectedCatIds]);

    const metrics = useMemo(() => ({
        total: services.length,
        active: services.filter((s) => s.active).length,
        inactive: services.filter((s) => !s.active).length,
    }), [services]);

    // ── Category checkbox tree renderer ──
    const renderCatNode = (node) => {
        const checked = selectedCatIds.has(node.id);
        const indeterminate = !checked && isIndeterminate(node);
        const visible = filteredCatList.some((c) => c.id === node.id);
        if (!visible) return null;

        return (
            <div key={node.id} style={{ paddingLeft: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '3px 0', fontSize: 13 }}>
                    <input type="checkbox"
                        ref={(el) => { if (el) el.indeterminate = indeterminate; }}
                        checked={checked}
                        onChange={(e) => handleCatCheck(node, e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <span style={{ fontWeight: node.children?.length ? 600 : 400 }}>{node.name}</span>
                </label>
                {node.children?.length > 0 && (
                    <div style={{ borderLeft: '1px solid #e5e7eb', marginLeft: 7 }}>
                        {node.children.map(renderCatNode)}
                    </div>
                )}
            </div>
        );
    };

    // ── Modal category checkbox tree ──
    function getModalDescendantIds(node) {
        const ids = [];
        if (!node.children) return ids;
        for (const n of node.children) {
            ids.push(n.id);
            ids.push(...getModalDescendantIds(n));
        }
        return ids;
    }

    function getModalAncestorIds(tree, targetId, chain = []) {
        for (const n of tree) {
            if (n.id === targetId) return chain;
            if (n.children) {
                const found = getModalAncestorIds(n.children, targetId, [...chain, n.id]);
                if (found) return found;
            }
        }
        return null;
    }

    function handleModalCategoryIdSet(node, checked) {
        const newIds = new Set(formData.categoryIds);
        const descIds = getModalDescendantIds(node);

        if (checked) {
            newIds.add(node.id);
            descIds.forEach((id) => newIds.add(id));
            const ancestors = getModalAncestorIds(categoryTree, node.id);
            if (ancestors) ancestors.forEach((id) => newIds.add(id));
        } else {
            newIds.delete(node.id);
            descIds.forEach((id) => newIds.delete(id));
            // Bỏ tick cha nếu không còn con nào được tick (xử lý từ con lên cha)
            const ancestors = getModalAncestorIds(categoryTree, node.id);
            if (ancestors) {
                for (let i = ancestors.length - 1; i >= 0; i--) {
                    const ancId = ancestors[i];
                    const ancNode = findNodeById(categoryTree, ancId);
                    if (ancNode && ancNode.children) {
                        const ancDescIds = getModalDescendantIds(ancNode);
                        const stillChecked = ancDescIds.some((id) => newIds.has(id));
                        if (!stillChecked) newIds.delete(ancId);
                    }
                }
            }
        }
        setFormData((prev) => ({ ...prev, categoryIds: [...newIds] }));
    }

    function isModalIndeterminate(node) {
        if (!node.children?.length) return false;
        const descIds = getModalDescendantIds(node);
        const checked = descIds.filter((id) => formData.categoryIds.includes(id));
        return checked.length > 0 && checked.length < descIds.length;
    }

    const filteredModalCatList = useMemo(() => {
        const kw = modalCatSearch.trim().toLowerCase();
        const active = flatCatList.filter((c) => c.active !== false);
        if (!kw) return active;
        return active.filter((c) => c.name?.toLowerCase().includes(kw));
    }, [flatCatList, modalCatSearch]);

    const renderModalCatNode = (node) => {
        const checked = formData.categoryIds.includes(node.id);
        const indeterminate = !checked && isModalIndeterminate(node);
        const visible = filteredModalCatList.some((c) => c.id === node.id);
        if (!visible) return null;
        return (
            <div key={node.id} style={{ paddingLeft: node.level * 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '3px 4px', fontSize: 13 }}>
                    <input type="checkbox"
                        ref={(el) => { if (el) el.indeterminate = indeterminate; }}
                        checked={checked}
                        onChange={(e) => handleModalCategoryIdSet(node, e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <span style={{ fontWeight: node.children?.length ? 600 : 400, fontSize: 13 }}>{node.name}</span>
                </label>
            </div>
        );
    };

    // ── CRUD handlers ──
    const handleOpenModal = (service = null) => {
        setEditingService(service);
        setFormData(service ? {
            serviceCode: service.serviceCode || '',
            name: service.name || '',
            categoryIds: (service.categories || []).map((c) => c.id),
            shortDescription: service.shortDescription || '',
            description: service.description || '',
            defaultDurationMinutes: service.defaultDurationMinutes || 30,
            basePriceAmount: service.basePriceAmount ?? '',
            priceUnit: service.priceUnit || 'SESSION',
            currencyCode: service.currencyCode || 'VND',
            imageUrl: service.imageUrl || '',
            active: service.active ?? true,
            bookingType: service.bookingType || 'SHORT',
        } : emptyForm);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                categoryIds: formData.categoryIds.length ? formData.categoryIds : null,
                defaultDurationMinutes: formData.defaultDurationMinutes ? Number(formData.defaultDurationMinutes) : null,
                basePriceAmount: formData.basePriceAmount ? Number(formData.basePriceAmount) : null,
            };
            if (editingService) {
                await updateAdminService(editingService.id, payload);
                showToast({ tone: 'success', title: 'Đã cập nhật dịch vụ', message: '' });
            } else {
                await createAdminService(payload);
                showToast({ tone: 'success', title: 'Đã tạo dịch vụ mới', message: '' });
            }
            setShowModal(false);
            loadServices();
        } catch (error) {
            showToast({
                tone: 'error', title: editingService ? 'Cập nhật thất bại' : 'Tạo thất bại',
                message: getAdminErrorMessage(error, 'Vui lòng thử lại.'),
            });
        } finally { setSaving(false); }
    };

    const handleDelete = async (service) => {
        const confirmed = await confirmDialog({ tone: 'warning', title: 'Xóa dịch vụ', message: `Xóa dịch vụ "${service.name}"?` });
        if (!confirmed) return;
        try {
            await deleteAdminService(service.id);
            showToast({ tone: 'success', title: 'Đã xóa dịch vụ', message: '' });
            loadServices();
        } catch (error) {
            showToast({
                tone: 'error', title: 'Xóa thất bại',
                message: getAdminErrorMessage(error, 'Không thể xóa dịch vụ.'),
            });
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map((s) => s.id)));
        }
    };

    const batchActivate = async () => {
        const ids = [...selectedIds];
        if (!ids.length) return;
        for (const id of ids) { try { await updateAdminService(id, { active: true }); } catch (_) { } }
        showToast({ tone: 'success', title: `Đã kích hoạt ${ids.length} dịch vụ`, message: '' });
        setSelectedIds(new Set()); loadServices();
    };

    const batchDeactivate = async () => {
        const ids = [...selectedIds];
        if (!ids.length) return;
        for (const id of ids) { try { await updateAdminService(id, { active: false }); } catch (_) { } }
        showToast({ tone: 'success', title: `Đã tạm ngưng ${ids.length} dịch vụ`, message: '' });
        setSelectedIds(new Set()); loadServices();
    };

    const batchDelete = async () => {
        const ids = [...selectedIds];
        if (!ids.length) return;
        const confirmed = await confirmDialog({ tone: 'warning', title: 'Xóa hàng loạt', message: `Xóa ${ids.length} dịch vụ đã chọn?` });
        if (!confirmed) return;
        for (const id of ids) { try { await deleteAdminService(id); } catch (_) { } }
        showToast({ tone: 'success', title: `Đã xóa ${ids.length} dịch vụ`, message: '' });
        setSelectedIds(new Set()); loadServices();
    };

    const catFilterCount = selectedCatIds.size;

    return (
        <>
            <div className="metrics metrics-3">
                <div className="metric-card"><div className="metric-label">Tổng dịch vụ</div><div className="metric-value">{metrics.total}</div></div>
                <div className="metric-card"><div className="metric-label">Đang hoạt động</div><div className="metric-value">{metrics.active}</div></div>
                <div className="metric-card"><div className="metric-label">Tạm ngưng</div><div className="metric-value">{metrics.inactive}</div></div>
            </div>

            <div className="search-bar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" placeholder="🔍 Tìm tên dịch vụ, mã dịch vụ, danh mục..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: 320 }} />
                    <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} style={{ maxWidth: 150 }}>
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Tạm ngưng</option>
                    </select>
                    <button className={`btn btn-sm ${catFilterCount > 0 ? 'btn-primary' : ''}`}
                        onClick={() => setShowCatFilter(!showCatFilter)}>
                        📂 Danh mục {catFilterCount > 0 ? `(${catFilterCount})` : ''}
                    </button>
                    {catFilterCount > 0 && (
                        <button className="btn btn-sm" onClick={() => { setSelectedCatIds(new Set()); setCatSearch(''); }}>
                            ✕ Bỏ lọc danh mục
                        </button>
                    )}
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Thêm dịch vụ</button>
                <button className="btn btn-sm" onClick={loadServices}>↻ Làm mới</button>
            </div>

            {showCatFilter && (
                <div className="card" style={{ marginBottom: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>Lọc theo danh mục</span>
                        <button className="btn btn-sm" onClick={() => { setSelectedCatIds(new Set()); setCatSearch(''); }}>
                            Bỏ chọn tất cả
                        </button>
                    </div>
                    <input type="text" placeholder="🔍 Tìm danh mục..."
                        value={catSearch} onChange={(e) => setCatSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, marginBottom: 8 }} />
                    <div style={{ maxHeight: 300, overflowY: 'auto', fontSize: 14 }}>
                        {categoryTree.length === 0 ? (
                            <div className="text-muted" style={{ padding: 12 }}>Không có danh mục.</div>
                        ) : (
                            categoryTree.map(renderCatNode)
                        )}
                    </div>
                </div>
            )}

            {selectedIds.size > 0 && (
                <div style={{ padding: '8px 16px', background: '#fff8e1', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Đã chọn: {selectedIds.size}</span>
                    <button className="btn btn-sm" onClick={batchActivate}>Kích hoạt</button>
                    <button className="btn btn-sm" onClick={batchDeactivate}>Tạm ngưng</button>
                    <button className="btn btn-sm btn-danger" onClick={batchDelete}>Xóa</button>
                    <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setSelectedIds(new Set())}>Bỏ chọn</button>
                </div>
            )}

            <div className="card mb-0">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>
                                <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                    onChange={toggleSelectAll} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                            </th>
                            <th style={{ width: 60 }}>ID</th>
                            <th style={{ width: 60 }}>Ảnh</th>
                            <th>Tên dịch vụ</th>
                            <th>Danh mục</th>
                            <th>Loại đặt lịch</th>
                            <th>Giá</th>
                            <th>Thời lượng</th>
                            <th>Trạng thái</th>
                            <th style={{ width: 120 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: 20 }}>Đang tải...</td></tr>
                        ) : filtered.length > 0 ? (
                            filtered.map((s) => (
                                <tr key={s.id} style={{ background: selectedIds.has(s.id) ? '#fff8e1' : undefined }}>
                                    <td><input type="checkbox" checked={selectedIds.has(s.id)}
                                        onChange={() => toggleSelect(s.id)} style={{ width: 18, height: 18, cursor: 'pointer' }} /></td>
                                    <td className="text-tiny">{s.id}</td>
                                    <td>
                                        {s.imageUrl ? (
                                            <img src={s.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #eee' }} />
                                        ) : (
                                            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#ccc' }}>—</div>
                                        )}
                                    </td>
                                    <td className="fw-500">
                                        <div>{s.name || '—'}</div>
                                        {s.serviceCode && <div className="text-tiny text-muted">{s.serviceCode}</div>}
                                    </td>
                                    <td>{(s.categories || []).map((c) => c.name).join(', ') || '—'}</td>
                                    <td><span className={`badge ${s.bookingType === 'LONG' ? 'badge-info' : 'badge-gray'}`}>{s.bookingType === 'LONG' ? 'Dài hạn' : 'Ngắn hạn'}</span></td>
                                    <td className="fw-500">{formatPrice(s.basePriceAmount)}<span className="text-tiny text-muted">₫/lần</span></td>
                                    <td>{s.defaultDurationMinutes ? `${s.defaultDurationMinutes} phút` : '—'}</td>
                                    <td>{s.active ? <span className="badge badge-success">Hoạt động</span> : <span className="badge badge-danger">Tạm ngưng</span>}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-sm" onClick={() => handleOpenModal(s)}>Sửa</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s)}>Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: 20 }}>Không tìm thấy dịch vụ nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }} onClick={() => setShowModal(false)}>
                    <div className="modal" style={{
                        background: '#fff', width: 640, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        animation: 'modalFadeIn 0.3s ease',
                    }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><div style={{ fontWeight: 700, fontSize: 18 }}>{editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</div></div>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Mã dịch vụ *</label>
                                        <input type="text" required maxLength={32}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
                                            value={formData.serviceCode} onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Tên dịch vụ *</label>
                                        <input type="text" required maxLength={150}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Danh mục *</label>
                                    <input type="text" placeholder="🔍 Tìm danh mục..."
                                        value={modalCatSearch} onChange={(e) => setModalCatSearch(e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, marginBottom: 8 }} />
                                    <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', borderRadius: 8, padding: '8px 4px' }}>
                                        {filteredModalCatList.length === 0 ? (
                                            <div className="text-muted" style={{ padding: '0 8px', fontSize: 13 }}>Không có danh mục.</div>
                                        ) : (
                                            filteredModalCatList.map(renderModalCatNode)
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Ảnh dịch vụ</label>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                        {formData.imageUrl ? (
                                            <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 12, overflow: 'hidden', border: '1px solid #ddd', flexShrink: 0 }}>
                                                <img src={formData.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                                    style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div onDragOver={(e) => e.preventDefault()} onDrop={async (e) => {
                                                e.preventDefault();
                                                const file = e.dataTransfer.files[0];
                                                if (file && file.type.startsWith('image/')) {
                                                    setUploadingImage(true);
                                                    try {
                                                        const url = await uploadAdminServiceImage(file);
                                                        setFormData((prev) => ({ ...prev, imageUrl: url }));
                                                    } catch (err) {
                                                        toast.error(getAdminErrorMessage(err, 'Upload ảnh thất bại.'));
                                                    } finally { setUploadingImage(false); }
                                                }
                                            }} style={{ width: 120, height: 120, borderRadius: 12, border: '2px dashed #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#999', fontSize: 11, fontWeight: 600, background: '#fafafa', flexShrink: 0 }}
                                                onClick={() => document.getElementById('service-image-input')?.click()}>
                                                {uploadingImage ? (
                                                    <div style={{ width: 24, height: 24, border: '3px solid #ddd', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                ) : (
                                                    <><Upload className="w-5 h-5 mb-1" /><span>Kéo thả</span><span>hoặc click</span></>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ fontSize: 12, color: '#999', lineHeight: 1.5 }}>
                                            <div style={{ fontWeight: 600, color: '#666' }}>Yêu cầu:</div>
                                            <div>• Định dạng ảnh (JPEG, PNG)</div>
                                            <div>• Dung lượng tối đa 5MB</div>
                                        </div>
                                    </div>
                                    <input id="service-image-input" type="file" accept="image/*" style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setUploadingImage(true);
                                            try {
                                                const url = await uploadAdminServiceImage(file);
                                                setFormData((prev) => ({ ...prev, imageUrl: url }));
                                            } catch (err) {
                                                toast.error(getAdminErrorMessage(err, 'Upload ảnh thất bại.'));
                                            } finally { setUploadingImage(false); }
                                            e.target.value = '';
                                        }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Giá dịch vụ (VNĐ/lần) *</label>
                                    <div style={{ display: 'flex', gap: 8, maxWidth: 280 }}>
                                        <input type="text" inputMode="numeric" required
                                            style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontVariantNumeric: 'tabular-nums' }}
                                            value={formData.basePriceAmount ? Math.round(Number(formData.basePriceAmount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
                                                setFormData({ ...formData, basePriceAmount: raw });
                                            }} />
                                        <button type="button" onClick={() => setFormData({ ...formData, basePriceAmount: (Number(formData.basePriceAmount || 0) * 1000).toString() })}
                                            style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#f5f5f5', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#666' }}>
                                            .000
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Thời lượng mỗi lượt (phút)</label>
                                        <input type="number" min={1}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
                                            value={formData.defaultDurationMinutes} onChange={(e) => setFormData({ ...formData, defaultDurationMinutes: e.target.value })} />
                                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                            {[15, 30, 45, 60, 90, 120].map((n) => (
                                                <button key={n} type="button" onClick={() => setFormData({ ...formData, defaultDurationMinutes: n })}
                                                    style={{ padding: '4px 10px', border: '1px solid #ddd', borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', fontWeight: 600, fontSize: 11, color: '#666' }}>
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Dùng để tính khung giờ trống</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Loại đặt lịch</label>
                                        <select value={formData.bookingType} onChange={(e) => setFormData({ ...formData, bookingType: e.target.value })}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}>
                                            <option value="SHORT">Ngắn hạn</option>
                                            <option value="LONG">Dài hạn</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Mã tiền tệ</label>
                                    <input type="text" maxLength={3}
                                        style={{ maxWidth: 240, width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
                                        value={formData.currencyCode} onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Mô tả ngắn</label>
                                    <textarea maxLength={255}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, minHeight: 60 }}
                                        value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Mô tả chi tiết</label>
                                    <textarea
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, minHeight: 80 }}
                                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', gap: 24 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })} style={{ width: 18, height: 18 }} />
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>Hoạt động</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ padding: 24, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : editingService ? 'Lưu thay đổi' : 'Tạo dịch vụ'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminAllServices;
