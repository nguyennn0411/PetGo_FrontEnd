import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { AdminDialog, AdminToastStack, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import { approvePartnerServiceRequest, getCategories, getPartnerServiceRequestDetail, getPartnerServiceRequests, rejectPartnerServiceRequest } from '../../api/admin';

const statusOptions = [
    ['PENDING_REVIEW', 'Chờ duyệt'],
    ['APPROVED', 'Đã duyệt'],
    ['REJECTED', 'Đã từ chối'],
    ['ALL', 'Tất cả'],
];

const statusBadge = (status) => {
    const map = {
        PENDING_REVIEW: ['badge-warning', 'Chờ duyệt'],
        APPROVED: ['badge-success', 'Đã duyệt'],
        REJECTED: ['badge-danger', 'Đã từ chối'],
        DRAFT: ['badge-gray', 'Bản nháp'],
    };
    const [cls, label] = map[status] || ['badge-gray', status || 'Không rõ'];
    return <span className={`badge ${cls}`}>{label}</span>;
};

const flattenCategories = (items = [], level = 0, parentNames = []) => (items || []).flatMap((item) => {
    const path = [...parentNames, item.name].filter(Boolean);
    return [
        { ...item, level, pathLabel: path.join(' / ') },
        ...flattenCategories(item.children || [], level + 1, path),
    ];
});

const requestCategoryLabel = (categories = []) => categories.map((category) => category.name).filter(Boolean).join(', ') || 'Chờ admin phân loại';

const buildCategoryTree = (items = [], level = 0) => (items || [])
    .filter((item) => item.active !== false)
    .map((item) => ({
        ...item,
        level,
        children: buildCategoryTree(item.children || [], level + 1),
    }));

const findCategoryNode = (items = [], categoryId, parentChain = []) => {
    const target = String(categoryId);
    for (const item of items || []) {
        if (String(item.id) === target) return { node: item, parents: parentChain };
        const found = findCategoryNode(item.children || [], target, [...parentChain, item]);
        if (found) return found;
    }
    return null;
};

const collectCategoryIds = (category) => [String(category.id), ...(category.children || []).flatMap(collectCategoryIds)];

const syncParentCategorySelection = (selectedIds, categories = []) => {
    const selectedSet = new Set(selectedIds.map(String));
    const visit = (category) => {
        const children = category.children || [];
        children.forEach(visit);
        if (!children.length) return;
        const hasSelectedChild = children.some((child) => selectedSet.has(String(child.id)) || collectCategoryIds(child).some((id) => selectedSet.has(id)));
        if (hasSelectedChild) selectedSet.add(String(category.id));
        else selectedSet.delete(String(category.id));
    };
    (categories || []).forEach(visit);
    return Array.from(selectedSet);
};

const AdminPartnerServiceRequests = () => {
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState('PENDING_REVIEW');
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [reviewCategoryIds, setReviewCategoryIds] = useState([]);
    const [reviewCategoryError, setReviewCategoryError] = useState('');
    const { toasts, showToast, dismissToast } = useAdminToast();
    const { dialog, promptDialog, closeDialog } = useAdminDialog();

    const categoryOptions = useMemo(
        () => flattenCategories(categories).filter((item) => item.active !== false),
        [categories],
    );
    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

    const counts = useMemo(() => ({
        pending: requests.filter((item) => item.status === 'PENDING_REVIEW').length,
        create: requests.filter((item) => item.requestType === 'CREATE').length,
        update: requests.filter((item) => item.requestType === 'UPDATE').length,
    }), [requests]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await getPartnerServiceRequests({ status });
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast({
                tone: 'error',
                title: 'Không tải được yêu cầu',
                message: getAdminErrorMessage(error, 'Không thể tải yêu cầu dịch vụ.'),
            });
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data?.result || data || []);
        } catch (error) {
            showToast({
                tone: 'error',
                title: 'Không tải được danh mục',
                message: getAdminErrorMessage(error, 'Không thể tải danh mục dịch vụ.'),
            });
        }
    };

    useEffect(() => { loadRequests(); }, [status]);
    useEffect(() => { loadCategories(); }, []);

    const openDetail = async (id) => {
        try {
            setDetailLoading(true);
            const data = await getPartnerServiceRequestDetail(id);
            setDetail(data);
            const existingCategoryIds = data?.categoryIds || [];
            setReviewCategoryIds(existingCategoryIds.map((categoryId) => String(categoryId)));
            setReviewCategoryError('');
        } catch (error) {
            showToast({
                tone: 'error',
                title: 'Không mở được chi tiết',
                message: getAdminErrorMessage(error, 'Không thể tải chi tiết yêu cầu.'),
            });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleApprove = async (id) => {
        const categoryIds = reviewCategoryIds.map((value) => Number(value)).filter((categoryId) => Number.isFinite(categoryId) && categoryId > 0);
        if (categoryIds.length === 0) {
            setReviewCategoryError('Vui lòng chọn ít nhất một loại dịch vụ từ service_categories trước khi duyệt.');
            return;
        }
        const message = await promptDialog({
            tone: 'success',
            title: 'Duyệt yêu cầu dịch vụ',
            message: 'Nhập ghi chú gửi cho partner sau khi yêu cầu được duyệt.',
            defaultValue: 'Yêu cầu dịch vụ đã được duyệt.',
            confirmLabel: 'Duyệt yêu cầu',
            cancelLabel: 'Hủy',
            helperText: 'Có thể để trống nếu không cần gửi thêm ghi chú.',
        });
        if (message === null) return;
        try {
            const updated = await approvePartnerServiceRequest(id, { message, categoryId: categoryIds[categoryIds.length - 1], categoryIds });
            setDetail(updated);
            const updatedCategoryIds = updated?.categoryIds || [];
            setReviewCategoryIds(updatedCategoryIds.map((categoryId) => String(categoryId)));
            setReviewCategoryError('');
            await loadRequests();
            showToast({
                tone: 'success',
                title: 'Đã duyệt yêu cầu dịch vụ',
                message: 'Dịch vụ của partner đã được cập nhật theo phân loại admin chọn.',
            });
        } catch (error) {
            const message = error.response?.data?.message || 'Duyệt yêu cầu thất bại.';
            if (message.includes('service_categories') || message.includes('Danh mục') || message.includes('loại dịch vụ')) {
                setReviewCategoryError(message);
            } else {
                showToast({
                    tone: 'error',
                    title: 'Duyệt yêu cầu thất bại',
                    message,
                });
            }
        }
    };

    const handleReject = async (id) => {
        const message = await promptDialog({
            tone: 'error',
            title: 'Từ chối yêu cầu dịch vụ',
            message: 'Nhập lý do để partner biết cần chỉnh sửa nội dung nào.',
            placeholder: 'Ví dụ: Dịch vụ thiếu thông tin giá hoặc mô tả chưa rõ...',
            required: true,
            confirmLabel: 'Từ chối yêu cầu',
            cancelLabel: 'Hủy',
        });
        if (!message) return;
        try {
            const updated = await rejectPartnerServiceRequest(id, { message });
            setDetail(updated);
            await loadRequests();
            showToast({
                tone: 'success',
                title: 'Đã từ chối yêu cầu',
                message: 'Partner sẽ nhìn thấy lý do từ chối do admin nhập.',
            });
        } catch (error) {
            showToast({
                tone: 'error',
                title: 'Từ chối yêu cầu thất bại',
                message: getAdminErrorMessage(error, 'Từ chối yêu cầu thất bại.'),
            });
        }
    };

    const toggleReviewCategory = (categoryId) => {
        const value = String(categoryId);
        const found = findCategoryNode(categoryTree, value);
        if (!found?.node) return;
        const targetIds = collectCategoryIds(found.node);
        setReviewCategoryIds((current) => {
            const selectedSet = new Set(current.map(String));
            const shouldSelect = !selectedSet.has(value);
            if (shouldSelect) {
                targetIds.forEach((id) => selectedSet.add(id));
                found.parents.forEach((parent) => selectedSet.add(String(parent.id)));
            } else {
                targetIds.forEach((id) => selectedSet.delete(id));
            }
            return syncParentCategorySelection(Array.from(selectedSet), categoryTree);
        });
        setReviewCategoryError('');
    };

    return (
        <AdminLayout title="Duyệt yêu cầu dịch vụ partner">
            <AdminToastStack toasts={toasts} onDismiss={dismissToast} />
            <AdminDialog dialog={dialog} onResolve={closeDialog} />

            <div className="metrics metrics-3">
                <div className="metric-card"><div className="metric-label">Đang hiển thị</div><div className="metric-value">{requests.length}</div><div className="metric-change metric-up">Theo bộ lọc hiện tại</div></div>
                <div className="metric-card"><div className="metric-label">Tạo mới</div><div className="metric-value">{counts.create}</div><div className="metric-change metric-up">Yêu cầu tạo dịch vụ</div></div>
                <div className="metric-card"><div className="metric-label">Cập nhật</div><div className="metric-value">{counts.update}</div><div className="metric-change metric-down">Yêu cầu update có highlight</div></div>
            </div>

            <div className="search-bar" style={{ justifyContent: 'space-between' }}>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button className="btn btn-sm" onClick={loadRequests}>↻ Làm mới</button>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Yêu cầu tạo/cập nhật dịch vụ</div>
                        <div className="text-muted text-small">Admin xem trước thay đổi; field nào khác hiện tại sẽ được tô nền vàng.</div>
                    </div>
                    <span className="badge badge-info">{counts.pending} pending</span>
                </div>
                <div className="stack-list">
                    {loading ? <p style={{ padding: 20 }}>Đang tải...</p> : requests.length ? requests.map((item) => (
                        <div key={item.id} className="partner-card" style={{ borderStyle: item.requestType === 'UPDATE' ? 'dashed' : 'solid' }}>
                            <div className="partner-avatar">{item.requestType === 'UPDATE' ? '✏️' : '🆕'}</div>
                            <div className="partner-info">
                                <div className="partner-name" style={{ justifyContent: 'space-between' }}>
                                    <span>{item.serviceName || 'Chưa đặt tên'} {statusBadge(item.status)}</span>
                                    <span className="text-tiny">{item.submittedAt || item.createdAt || '—'}</span>
                                </div>
                                <div className="partner-meta">{item.providerName || 'Partner'} · {item.requestType === 'UPDATE' ? 'Yêu cầu cập nhật dịch vụ' : 'Yêu cầu tạo dịch vụ'}</div>
                                <div className="partner-meta">{requestCategoryLabel(item.categories)} · {item.priceDisplay} / {item.priceUnitLabel}</div>
                                <div className="partner-actions flex-wrap">
                                    <button className="btn btn-sm" onClick={() => openDetail(item.id)}>👁 Xem trước</button>
                                    {item.status === 'PENDING_REVIEW' && <button className="btn btn-sm btn-success" onClick={() => openDetail(item.id)}>✓ Chọn loại & duyệt</button>}
                                    {item.status === 'PENDING_REVIEW' && <button className="btn btn-sm btn-danger" onClick={() => handleReject(item.id)}>✗ Từ chối</button>}
                                </div>
                            </div>
                        </div>
                    )) : <p style={{ padding: 24, textAlign: 'center' }}>Không có yêu cầu phù hợp.</p>}
                </div>
            </div>

            {detail && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetail(null)}>
                    <div className="modal" style={{ background: '#fff', width: 760, maxHeight: '90vh', overflowY: 'auto', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,.3)' }} onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header" style={{ padding: 24, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 20 }}>{detail.requestType === 'UPDATE' ? 'Yêu cầu cập nhật dịch vụ' : 'Yêu cầu tạo dịch vụ'}</div>
                                <div className="text-muted text-small">{detail.providerName} · {statusBadge(detail.status)}</div>
                            </div>
                            <button onClick={() => setDetail(null)} style={{ border: 0, background: 'none', fontSize: 24 }}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: 24 }}>
                            {detail.status === 'PENDING_REVIEW' && (
                                <div className="info-item" style={{ marginBottom: 16, padding: 14, borderRadius: 14, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                                    <label style={{ display: 'block', fontSize: 12, color: '#0369a1', fontWeight: 800, marginBottom: 8 }}>Chọn danh mục cho dịch vụ</label>
                                    <div className="space-y-3 max-h-64 overflow-auto pr-1 rounded-2xl bg-white p-3" style={{ border: `1px solid ${reviewCategoryError ? '#fecaca' : '#bae6fd'}`, background: reviewCategoryError ? '#fef2f2' : '#fff' }}>
                                        {categoryTree.length ? categoryTree.map((category) => (
                                            <AdminCategoryNode
                                                key={category.id}
                                                category={category}
                                                selectedIds={reviewCategoryIds}
                                                onChange={toggleReviewCategory}
                                            />
                                        )) : <div className="text-tiny text-muted" style={{ padding: 10 }}>Chưa có loại dịch vụ khả dụng.</div>}
                                    </div>
                                    <div className="text-tiny text-muted" style={{ marginTop: 8 }}>Đã chọn {reviewCategoryIds.length} loại dịch vụ.</div>
                                    {reviewCategoryError && <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626', fontWeight: 700 }}>{reviewCategoryError}</div>}
                                    <div className="text-tiny text-muted" style={{ marginTop: 8 }}>Partner không chọn loại dịch vụ; admin bắt buộc phân loại một hoặc nhiều loại tại bước duyệt.</div>
                                </div>
                            )}
                            {detailLoading ? <p>Đang tải...</p> : <ServiceRequestPreview detail={detail} />}
                        </div>
                        <div className="modal-footer" style={{ padding: 24, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn" onClick={() => setDetail(null)}>Đóng</button>
                            {detail.status === 'PENDING_REVIEW' && <button className="btn btn-danger" onClick={() => handleReject(detail.id)}>✗ Từ chối</button>}
                            {detail.status === 'PENDING_REVIEW' && <button className="btn btn-success" onClick={() => handleApprove(detail.id)}>✓ Duyệt</button>}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

const AdminCategoryNode = ({ category, selectedIds, onChange, level = 0 }) => {
    const value = String(category.id);
    const children = Array.isArray(category.children) ? category.children : [];

    return (
        <div>
            <label className="flex items-center gap-3 cursor-pointer group" style={{ paddingLeft: level * 16 }}>
                <input
                    type="checkbox"
                    checked={selectedIds.includes(value)}
                    onChange={() => onChange(value)}
                    className="w-5 h-5 rounded-lg border-2 border-gray-200 text-orange-500 focus:ring-0 cursor-pointer transition-all"
                />
                <span className="text-sm font-bold text-gray-500 group-hover:text-gray-900 transition-colors">
                    {category.name}
                </span>
            </label>
            {children.length > 0 && (
                <div className="mt-2 space-y-2 border-l border-dashed border-gray-200 ml-2 pl-2">
                    {children.map((child) => (
                        <AdminCategoryNode
                            key={child.id}
                            category={child}
                            selectedIds={selectedIds}
                            onChange={onChange}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ServiceRequestPreview = ({ detail }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {(detail.changes || []).map((change) => (
                <div key={change.field} className="info-item" style={{ gridColumn: change.field === 'description' || change.field === 'photoUrls' ? '1 / -1' : undefined, padding: 14, borderRadius: 14, background: change.changed ? '#fff7ed' : '#f9fafb', border: change.changed ? '1px solid #fed7aa' : '1px solid #eee' }}>
                    <label style={{ display: 'block', fontSize: 12, color: change.changed ? '#ea580c' : '#777', fontWeight: 800, marginBottom: 8 }}>{change.label}{change.changed ? ' · có thay đổi' : ''}</label>
                    {detail.requestType === 'UPDATE' && (
                        <div style={{ fontSize: 12, color: '#777', marginBottom: 6 }}><b>Hiện tại:</b> {change.currentValue || '—'}</div>
                    )}
                    <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}><b>Đề xuất:</b> {change.proposedValue || '—'}</div>
                </div>
            ))}
        </div>
        <div>
            <label style={{ display: 'block', fontSize: 12, color: '#888', fontWeight: 800, marginBottom: 8 }}>Ảnh mô tả ({detail.photoUrls?.length || 0})</label>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {(detail.photoUrls || []).map((url, index) => (
                    <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" style={{ width: 110, height: 90, flex: '0 0 auto', borderRadius: 12, overflow: 'hidden', background: '#f3f4f6' }}>
                        <img src={url} alt={`Ảnh dịch vụ ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </a>
                ))}
            </div>
        </div>
        {detail.adminMessage && <div className="badge badge-danger" style={{ whiteSpace: 'normal', lineHeight: 1.5 }}>Admin note: {detail.adminMessage}</div>}
    </div>
);

export default AdminPartnerServiceRequests;