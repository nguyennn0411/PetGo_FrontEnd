import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Eye,
    Loader2,
    RefreshCw,
    Send,
    ShieldCheck,
    Store,
    XCircle,
} from 'lucide-react';
import {
    approveRegistration,
    getAdminRegistrationDetail,
    getAdminRegistrations,
    rejectRegistration,
    requestRegistrationAdditionalInfo,
} from '../api/registrations';
import {
    REGISTRATION_STATUS,
    REGISTRATION_STATUS_BADGE_CLASS,
    REGISTRATION_STATUS_LABEL,
    REGISTRATION_TYPE,
} from '../constants/registration';
import { AuthContext } from '../context/AuthContext';

const statusOptions = [
    '',
    REGISTRATION_STATUS.AWAITING_APPROVAL,
    REGISTRATION_STATUS.NEEDS_MORE_INFO,
    REGISTRATION_STATUS.APPROVED,
    REGISTRATION_STATUS.REJECTED,
    REGISTRATION_STATUS.DRAFT,
];

const AdminRegistrationsPage = () => {
    const navigate = useNavigate();
    const { account, loadingAccount } = useContext(AuthContext);
    const [statusFilter, setStatusFilter] = useState(REGISTRATION_STATUS.AWAITING_APPROVAL);
    const [items, setItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [mutating, setMutating] = useState(false);
    const [error, setError] = useState('');

    const isAdmin = useMemo(
        () => (account?.roles || []).some((role) => String(role).toUpperCase() === 'ADMIN'),
        [account]
    );

    const loadList = async () => {
        try {
            setLoadingList(true);
            setError('');
            const data = await getAdminRegistrations({
                type: REGISTRATION_TYPE.PARTNER,
                ...(statusFilter ? { status: statusFilter } : {}),
            });
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách hồ sơ đăng ký.');
        } finally {
            setLoadingList(false);
        }
    };

    const loadDetail = async (id) => {
        if (!id) return;
        try {
            setLoadingDetail(true);
            setError('');
            const data = await getAdminRegistrationDetail(id);
            setDetail(data);
            setSelectedId(id);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải chi tiết hồ sơ đăng ký.');
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        if (!loadingAccount && isAdmin) {
            loadList();
        }
    }, [loadingAccount, isAdmin, statusFilter]);

    const refreshAfterMutation = async (nextDetail) => {
        setDetail(nextDetail);
        await loadList();
    };

    const handleApprove = async () => {
        if (!detail?.id) return;
        const message = window.prompt('Ghi chú duyệt hồ sơ (có thể để trống):', 'Hồ sơ đã được duyệt.');
        if (message === null) return;
        try {
            setMutating(true);
            const updated = await approveRegistration(detail.id, { message });
            await refreshAfterMutation(updated);
            window.alert('Đã duyệt hồ sơ partner.');
        } catch (err) {
            setError(err.response?.data?.message || 'Duyệt hồ sơ thất bại.');
        } finally {
            setMutating(false);
        }
    };

    const handleReject = async () => {
        if (!detail?.id) return;
        const message = window.prompt('Nhập lý do từ chối hồ sơ:');
        if (!message) return;
        try {
            setMutating(true);
            const updated = await rejectRegistration(detail.id, { message });
            await refreshAfterMutation(updated);
            window.alert('Đã từ chối hồ sơ partner.');
        } catch (err) {
            setError(err.response?.data?.message || 'Từ chối hồ sơ thất bại.');
        } finally {
            setMutating(false);
        }
    };

    const handleRequestAdditionalInfo = async () => {
        if (!detail?.id) return;
        const message = window.prompt('Nhập nội dung cần người dùng bổ sung:');
        if (!message) return;
        try {
            setMutating(true);
            const updated = await requestRegistrationAdditionalInfo(detail.id, { message });
            await refreshAfterMutation(updated);
            window.alert('Đã yêu cầu bổ sung thông tin.');
        } catch (err) {
            setError(err.response?.data?.message || 'Yêu cầu bổ sung thông tin thất bại.');
        } finally {
            setMutating(false);
        }
    };

    if (loadingAccount) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!account || !isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-lg w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-white text-center space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black mb-3">Không có quyền truy cập</h1>
                        <p className="text-gray-500 font-medium">Trang xét duyệt đăng ký chỉ dành cho tài khoản admin.</p>
                    </div>
                    <button onClick={() => navigate('/')} className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 transition-all">
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
            

            <main className="max-w-7xl mx-auto px-4 mt-8 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                            <Store className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">Partner registration review</h1>
                            <p className="text-gray-500 font-medium">Xem, duyệt, từ chối hoặc yêu cầu bổ sung thông tin hồ sơ partner.</p>
                        </div>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-black outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        {statusOptions.map((status) => (
                            <option key={status || 'ALL'} value={status}>{status ? REGISTRATION_STATUS_LABEL[status] || status : 'Tất cả trạng thái'}</option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-red-600 font-bold flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <section className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black">Danh sách hồ sơ</h2>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{items.length} hồ sơ</span>
                        </div>

                        {loadingList ? (
                            <div className="bg-white p-12 rounded-[2.5rem] flex justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="bg-white p-10 rounded-[2.5rem] text-center space-y-3">
                                <Clock className="w-10 h-10 text-gray-300 mx-auto" />
                                <p className="font-black text-gray-500">Không có hồ sơ phù hợp bộ lọc.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <RegistrationListItem
                                        key={item.id}
                                        item={item}
                                        active={selectedId === item.id}
                                        onClick={() => loadDetail(item.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="lg:col-span-3">
                        <RegistrationDetail
                            detail={detail}
                            loading={loadingDetail}
                            mutating={mutating}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onRequestAdditionalInfo={handleRequestAdditionalInfo}
                        />
                    </section>
                </div>
            </main>
        </div>
    );
};

const RegistrationListItem = ({ item, active, onClick }) => {
    const badgeClass = REGISTRATION_STATUS_BADGE_CLASS[item.status] || REGISTRATION_STATUS_BADGE_CLASS.DRAFT;
    return (
        <button
            onClick={onClick}
            className={`w-full text-left bg-white p-5 rounded-[2rem] border transition-all hover:shadow-xl hover:shadow-gray-100 ${active ? 'border-orange-200 ring-4 ring-orange-50' : 'border-white'}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-black text-lg truncate">{item.businessName || 'Partner application'}</h3>
                    <p className="text-gray-400 font-bold text-sm truncate">{item.userName} • {item.userEmail}</p>
                </div>
                <Eye className="w-5 h-5 text-orange-500 shrink-0" />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                    {REGISTRATION_STATUS_LABEL[item.status] || item.status}
                </span>
                <span className="text-xs text-gray-400 font-bold">#{item.id}</span>
            </div>
        </button>
    );
};

const RegistrationDetail = ({ detail, loading, mutating, onApprove, onReject, onRequestAdditionalInfo }) => {
    if (loading) {
        return (
            <div className="bg-white p-12 rounded-[2.5rem] flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="bg-white p-12 rounded-[2.5rem] text-center space-y-4">
                <Store className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-2xl font-black">Chọn một hồ sơ</h3>
                <p className="text-gray-500 font-medium">Chi tiết hồ sơ partner sẽ hiển thị tại đây.</p>
            </div>
        );
    }

    const badgeClass = REGISTRATION_STATUS_BADGE_CLASS[detail.status] || REGISTRATION_STATUS_BADGE_CLASS.DRAFT;
    const canReview = detail.status === REGISTRATION_STATUS.AWAITING_APPROVAL;

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-white shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black">{detail.businessName}</h2>
                    <p className="text-gray-500 font-bold">Applicant: {detail.userName} • {detail.userEmail}</p>
                </div>
                <span className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest ${badgeClass}`}>
                    {REGISTRATION_STATUS_LABEL[detail.status] || detail.status}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Số điện thoại nhà cung cấp" value={detail.businessPhone} />
                <DetailField label="Email nhà cung cấp" value={detail.businessEmail} />
                <DetailField label="Địa chỉ nhà cung cấp" value={detail.businessAddress} wide />
                <DetailField label="Mã số thuế" value={detail.taxCode || 'Chưa cung cấp'} />
                <DetailField label="Người đại diện" value={detail.representativeName} />
                <DetailField label="SĐT đại diện" value={detail.representativePhone} />
                <DetailField label="Email đại diện" value={detail.representativeEmail} />
                <DetailField label="Nhóm dịch vụ" value={(detail.serviceCategories || []).map((item) => item.name).join(', ') || 'Chưa chọn'} wide />
                <DetailField label="Mô tả" value={detail.description || 'Không có mô tả'} wide />
                {detail.additionalInformation && <DetailField label="Thông tin bổ sung" value={detail.additionalInformation} wide />}
                {detail.adminMessage && <DetailField label="Admin message" value={detail.adminMessage} wide />}
                {detail.rejectionReason && <DetailField label="Lý do từ chối" value={detail.rejectionReason} wide />}
            </div>

            <div className="space-y-3">
                <h3 className="font-black text-gray-900">Ảnh địa điểm</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(detail.locationImageUrls || []).map((url, index) => (
                        <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="p-3 rounded-2xl bg-gray-50 text-orange-600 font-bold text-sm truncate hover:bg-orange-50 transition-all">
                            Ảnh {index + 1}: {url}
                        </a>
                    ))}
                </div>
            </div>

            {canReview ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-50">
                    <button disabled={mutating} onClick={onApprove} className="py-4 px-5 rounded-2xl bg-green-50 text-green-700 font-black hover:bg-green-600 hover:text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {mutating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        Approve
                    </button>
                    <button disabled={mutating} onClick={onRequestAdditionalInfo} className="py-4 px-5 rounded-2xl bg-blue-50 text-blue-700 font-black hover:bg-blue-600 hover:text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" />
                        More info
                    </button>
                    <button disabled={mutating} onClick={onReject} className="py-4 px-5 rounded-2xl bg-red-50 text-red-700 font-black hover:bg-red-600 hover:text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Reject
                    </button>
                </div>
            ) : (
                <div className="p-4 rounded-2xl bg-gray-50 text-gray-500 font-bold text-center">
                    Hồ sơ không ở trạng thái chờ duyệt nên không thể review.
                </div>
            )}
        </div>
    );
};

const DetailField = ({ label, value, wide }) => (
    <div className={`p-4 bg-gray-50 rounded-2xl ${wide ? 'sm:col-span-2' : ''}`}>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-bold text-gray-900 whitespace-pre-wrap break-words">{value || '—'}</p>
    </div>
);

export default AdminRegistrationsPage;