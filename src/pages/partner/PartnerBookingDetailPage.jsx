import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, NotebookPen, Play, Save, X, XCircle } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerErrorState, PartnerLoadingState, PartnerStatusBadge, getPartnerErrorMessage, usePartnerToast } from '../../components/partner/PartnerStates';
import { cancelPartnerBooking, confirmCompletedByProvider, confirmPartnerBooking, getPartnerBookingDetail, rejectPartnerBooking, startPartnerBooking, updatePartnerBookingInternalNote } from '../../api/partner';

const PartnerBookingDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [mutating, setMutating] = useState(false);
    const [error, setError] = useState('');
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelError, setCancelError] = useState('');
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState('');
    const { showToast } = usePartnerToast();

    const normalizedStatus = String(booking?.status || '').toUpperCase();
    const canConfirmNewBooking = booking?.canConfirm || normalizedStatus === 'PENDING_PROVIDER_CONFIRMATION';
    const canProviderComplete = booking?.canComplete || ['IN_PROGRESS', 'AWAITING_COMPLETION_CONFIRMATION', 'COMPLETED_BY_USER'].includes(normalizedStatus);

    const loadDetail = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getPartnerBookingDetail(id);
            setBooking(data);
            setNote(data?.internalNote || '');
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Không thể tải chi tiết booking.');
            setError(message);
            showToast({ tone: 'error', title: 'Không tải được chi tiết booking', message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDetail(); }, [id]);

    const runAction = async (action, confirmMessage, successMessage = 'Cập nhật booking thành công.') => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        try {
            setMutating(true);
            setError('');
            await action();
            await loadDetail();
            showToast({ tone: 'success', title: 'Đã cập nhật booking', message: successMessage });
            return true;
        } catch (err) {
            const message = getPartnerErrorMessage(err, 'Thao tác booking thất bại.');
            setError(message);
            showToast({ tone: 'error', title: 'Thao tác booking thất bại', message });
            return false;
        } finally {
            setMutating(false);
        }
    };

    const saveNote = () => runAction(() => updatePartnerBookingInternalNote(id, note), null, 'Đã lưu ghi chú nội bộ.');

    const submitCancel = async () => {
        const normalized = cancelReason.trim();
        if (normalized.length < 5) {
            const message = 'Vui lòng nhập lý do hủy tối thiểu 5 ký tự.';
            setCancelError(message);
            showToast({ tone: 'warning', title: 'Lý do hủy chưa hợp lệ', message });
            return;
        }
        const succeeded = await runAction(
            () => cancelPartnerBooking(id, { reasonCode: 'PARTNER_CANCELLED', reasonText: normalized, note: normalized }),
            null,
            'Đã hủy booking và ghi nhận lý do.'
        );
        if (!succeeded) return;
        setCancelOpen(false);
        setCancelReason('');
        setCancelError('');
    };

    const submitReject = async () => {
        const normalized = rejectReason.trim();
        if (normalized.length < 5) {
            const message = 'Vui lòng nhập lý do từ chối tối thiểu 5 ký tự.';
            setRejectError(message);
            showToast({ tone: 'warning', title: 'Lý do từ chối chưa hợp lệ', message });
            return;
        }
        const succeeded = await runAction(
            () => rejectPartnerBooking(id, { reasonCode: 'PROVIDER_REJECTED', reasonText: normalized, note: normalized }),
            null,
            'Đã từ chối booking và hoàn tiền về ví user.'
        );
        if (!succeeded) return;
        setRejectOpen(false);
        setRejectReason('');
        setRejectError('');
    };

    return (
        <PartnerLayout title="Chi tiết booking" subtitle={booking?.bookingCode || 'Booking detail'}>
            <div className="space-y-6">
                <button onClick={() => navigate('/partner/bookings')} className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-gray-500 font-black flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Quay lại</button>
                {error && <PartnerErrorState message={error} onRetry={loadDetail} />}
                {loading ? <PartnerLoadingState /> : booking && (
                    <>
                        <section className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <h2 className="text-3xl font-black">{booking.bookingCode}</h2>
                                        <PartnerStatusBadge status={booking.statusLabel || booking.status} />
                                    </div>
                                    <p className="text-gray-500 font-semibold">{booking.appointmentDateDisplay} · {booking.appointmentTime}</p>
                                    <p className="text-orange-600 font-black text-2xl mt-2">{booking.totalAmountDisplay}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {canConfirmNewBooking && <button disabled={mutating} onClick={() => runAction(() => confirmPartnerBooking(id), 'Xác nhận nhận booking mới này?', 'Đã xác nhận nhận booking.')} className="px-4 py-3 rounded-2xl bg-green-50 text-green-600 font-black flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Xác nhận nhận lịch</button>}
                                    {canConfirmNewBooking && <button disabled={mutating} onClick={() => setRejectOpen(true)} className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 font-black flex items-center gap-2"><XCircle className="w-4 h-4" /> Từ chối & hoàn tiền</button>}
                                    {booking.canStart && <button disabled={mutating} onClick={() => runAction(() => startPartnerBooking(id), 'Bắt đầu phục vụ booking này?', 'Đã chuyển booking sang đang phục vụ.')} className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-600 font-black flex items-center gap-2"><Play className="w-4 h-4" /> Bắt đầu</button>}
                                    {canProviderComplete && <button disabled={mutating} onClick={() => runAction(() => confirmCompletedByProvider(id), 'Xác nhận provider đã hoàn tất dịch vụ?', 'Đã ghi nhận provider xác nhận hoàn tất.')} className="px-4 py-3 rounded-2xl bg-orange-50 text-orange-600 font-black flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Xác nhận hoàn tất</button>}
                                    {booking.canCancel && <button disabled={mutating} onClick={() => setCancelOpen(true)} className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 font-black flex items-center gap-2"><XCircle className="w-4 h-4" /> Hủy booking</button>}
                                </div>
                            </div>
                        </section>

                        {booking.customerNote && (
                            <section className="bg-yellow-50 rounded-[2rem] border border-yellow-100 p-5 text-yellow-800 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 mt-1 shrink-0" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">Ghi chú khách hàng</p>
                                    <p className="font-bold">{booking.customerNote}</p>
                                </div>
                            </section>
                        )}

                        <section className="bg-orange-50 rounded-[2rem] border border-orange-100 p-5 text-orange-800 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 mt-1 shrink-0" />
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest">Workflow luồng mới</p>
                                <p className="font-bold">Confirm/reject là xác nhận nhận lịch mới. Xác nhận hoàn tất là bước sau khi dịch vụ diễn ra; tiền escrow chỉ giải ngân khi đủ điều kiện.</p>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                                <h3 className="text-xl font-black">Khách hàng & thú cưng</h3>
                                <Info label="Khách hàng" value={booking.customerName} />
                                <Info label="Email" value={booking.customerEmail} />
                                <Info label="Số điện thoại" value={booking.customerPhone} />
                                <Info label="Thú cưng" value={`${booking.petName || ''}${booking.petBreed ? ` (${booking.petBreed})` : ''}`} />
                            </div>
                            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                                <h3 className="text-xl font-black">Dịch vụ & thanh toán</h3>
                                <Info label="Dịch vụ" value={booking.serviceName} />
                                <Info label="Thời lượng" value={`${booking.serviceDurationMinutes || 0} phút`} />
                                <Info label="Invoice" value={`${booking.invoiceNumber || 'N/A'} · ${booking.invoiceStatus || 'Chưa có trạng thái'}`} />
                                <Info label="Payment" value={`${booking.paymentMethod || 'N/A'} · ${booking.paymentStatus || 'Chưa có trạng thái'}`} />
                                <Info label="Tạm tính / giảm giá / thuế" value={`${Number(booking.subtotalAmount || 0).toLocaleString('vi-VN')} đ · ${Number(booking.promoDiscountAmount || 0).toLocaleString('vi-VN')} đ · ${Number(booking.taxAmount || 0).toLocaleString('vi-VN')} đ`} />
                                <Info label="Số lần đổi lịch" value={booking.rescheduleCount ?? 0} />
                            </div>
                        </section>

                        <section className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                            <h3 className="text-xl font-black flex items-center gap-2"><NotebookPen className="w-5 h-5 text-orange-500" /> Ghi chú nội bộ</h3>
                            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-semibold" placeholder="Ghi chú chỉ nhà cung cấp nhìn thấy" />
                            <button onClick={saveNote} disabled={mutating} className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-black flex items-center gap-2"><Save className="w-4 h-4" /> Lưu ghi chú</button>
                        </section>

                        <section className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-4">
                            <h3 className="text-xl font-black">Timeline</h3>
                            {(booking.timeline || []).length ? (booking.timeline || []).map((item, index) => (
                                <div key={index} className="p-4 rounded-2xl bg-gray-50">
                                    <p className="font-black">{item.fromStatusLabel || item.fromStatus || 'Start'} → {item.toStatusLabel || item.toStatus}</p>
                                    <p className="text-sm text-gray-500 font-semibold">{item.note} · {item.changedBy} · {item.createdAt}</p>
                                </div>
                            )) : <p className="p-4 rounded-2xl bg-gray-50 text-gray-500 font-bold">Chưa có lịch sử trạng thái cho booking này.</p>}
                        </section>

                        {cancelOpen && (
                            <div className="fixed inset-0 z-[80] bg-gray-900/40 p-4 flex items-center justify-center">
                                <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-6 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-red-500">Hủy booking</p>
                                            <h3 className="text-2xl font-black">Nhập lý do hủy</h3>
                                        </div>
                                        <button onClick={() => setCancelOpen(false)} className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-500"><X className="w-5 h-5" /></button>
                                    </div>
                                    <p className="text-sm text-gray-500 font-semibold">Lý do sẽ được lưu vào lịch sử booking để admin/customer support theo dõi khi cần.</p>
                                    <textarea value={cancelReason} onChange={(event) => { setCancelReason(event.target.value); setCancelError(''); }} rows={4} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-semibold" placeholder="Ví dụ: Provider hết slot do nhân sự nghỉ đột xuất, đã liên hệ khách để hỗ trợ đặt lại lịch..." />
                                    {cancelError && <p className="text-sm font-bold text-red-600">{cancelError}</p>}
                                    <div className="flex flex-wrap justify-end gap-3">
                                        <button onClick={() => setCancelOpen(false)} className="px-5 py-3 rounded-2xl bg-gray-50 text-gray-600 font-black">Đóng</button>
                                        <button onClick={submitCancel} disabled={mutating} className="px-5 py-3 rounded-2xl bg-red-500 text-white font-black flex items-center gap-2"><XCircle className="w-4 h-4" /> Xác nhận hủy</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {rejectOpen && (
                            <div className="fixed inset-0 z-[80] bg-gray-900/40 p-4 flex items-center justify-center">
                                <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-6 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-red-500">Từ chối booking</p>
                                            <h3 className="text-2xl font-black">Nhập lý do từ chối</h3>
                                        </div>
                                        <button onClick={() => setRejectOpen(false)} className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-500"><X className="w-5 h-5" /></button>
                                    </div>
                                    <p className="text-sm text-gray-500 font-semibold">Booking sẽ chuyển sang REJECTED và hệ thống hoàn khoản escrow về ví user.</p>
                                    <textarea value={rejectReason} onChange={(event) => { setRejectReason(event.target.value); setRejectError(''); }} rows={4} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-semibold" placeholder="Ví dụ: Provider không thể nhận lịch do hết nhân sự trong khung giờ này..." />
                                    {rejectError && <p className="text-sm font-bold text-red-600">{rejectError}</p>}
                                    <div className="flex flex-wrap justify-end gap-3">
                                        <button onClick={() => setRejectOpen(false)} className="px-5 py-3 rounded-2xl bg-gray-50 text-gray-600 font-black">Đóng</button>
                                        <button onClick={submitReject} disabled={mutating} className="px-5 py-3 rounded-2xl bg-red-500 text-white font-black flex items-center gap-2"><XCircle className="w-4 h-4" /> Từ chối & hoàn tiền</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PartnerLayout>
    );
};

const Info = ({ label, value }) => (
    <div className="p-4 rounded-2xl bg-gray-50">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="font-black text-gray-900">{value ?? 'N/A'}</p>
    </div>
);

export default PartnerBookingDetailPage;