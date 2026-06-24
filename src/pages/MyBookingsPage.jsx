import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBookings, cancelMyBooking, getBookingDetail } from '../api/areas';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';

const statusBadge = (status) => {
    const map = {
        PENDING: ['bg-yellow-100 text-yellow-800', 'Chờ xác nhận'],
        CONFIRMED: ['bg-blue-100 text-blue-800', 'Đã xác nhận'],
        IN_PROGRESS: ['bg-blue-100 text-blue-800', 'Đang thực hiện'],
        COMPLETED: ['bg-green-100 text-green-800', 'Hoàn thành'],
        CANCELLED: ['bg-gray-100 text-gray-500', 'Đã hủy'],
        REJECTED: ['bg-red-100 text-red-800', 'Đã từ chối'],
    };
    const [cls, label] = map?.[status] || ['bg-gray-100 text-gray-500', status || 'Không rõ'];
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${cls}`}>{label}</span>;
};

const formatPrice = (amount) => {
    if (amount == null) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await getMyBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch {
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadBookings(); }, []);

    const openDetail = async (booking) => {
        setDetailLoading(true);
        try {
            const detail = await getBookingDetail(booking.id);
            setSelectedBooking(detail);
        } catch {
            toast.error('Không tải được chi tiết.', { duration: 4000 });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCancel = async (id, code) => {
        const ok = await Swal.fire({ icon: 'warning', title: 'Hủy đặt lịch?', text: `Bạn có chắc muốn hủy "${code}"?`, showCancelButton: true, confirmButtonText: 'Hủy', cancelButtonText: 'Không', confirmButtonColor: '#f97316', reverseButtons: true });
        if (!ok.isConfirmed) return;
        try {
            await cancelMyBooking(id);
            toast.success('Đặt lịch đã được hủy.', { duration: 3000 });
            setSelectedBooking(null);
            loadBookings();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Không thể hủy đặt lịch.', { duration: 4000 });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Lịch sử đặt lịch</h1>
                        <p className="text-sm text-gray-500 mt-1">Theo dõi và quản lý các đơn đặt lịch của bạn</p>
                    </div>
                    <Link to="/booking" className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-black text-sm hover:bg-orange-600 transition-all">
                        + Đặt lịch mới
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500 font-bold">Đang tải...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <p className="text-gray-400 font-bold text-lg mb-2">Chưa có đặt lịch nào</p>
                        <p className="text-gray-400 text-sm mb-6">Bắt đầu đặt lịch vận chuyển cho thú cưng của bạn</p>
                        <Link to="/booking" className="px-6 py-3 rounded-xl bg-orange-500 text-white font-black hover:bg-orange-600 transition-all">
                            Đặt lịch ngay
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {bookings.map((b) => (
                            <div key={b.id}
                                onClick={() => openDetail(b)}
                                className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:border-orange-200 hover:shadow-sm transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-black text-gray-900 text-sm">{b.bookingCode}</span>
                                            {statusBadge(b.status)}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {b.serviceName} · {b.areaName}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {b.appointmentDate} · {b.timeSlot} · {b.petName}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-black text-orange-600">{formatPrice(b.totalAmount)}₫</div>
                                        {b.status === 'PENDING' && (
                                            <button onClick={(e) => { e.stopPropagation(); handleCancel(b.id, b.bookingCode); }}
                                                className="mt-2 text-xs font-black text-red-500 hover:underline">
                                                Hủy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedBooking && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
                        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-black text-lg">Chi tiết đặt lịch</h2>
                                    <p className="text-sm text-gray-500">{selectedBooking.bookingCode}</p>
                                </div>
                                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                            </div>
                            {detailLoading ? (
                                <div className="text-center py-8"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div></div>
                            ) : (
                                <div className="space-y-3">
                                    <DetailRow label="Trạng thái" value={statusBadge(selectedBooking.status)} />
                                    <DetailRow label="Dịch vụ" value={selectedBooking.serviceName} />
                                    <DetailRow label="Khu vực" value={selectedBooking.areaName} />
                                    <DetailRow label="Thú cưng" value={selectedBooking.petName} />
                                    <DetailRow label="Ngày" value={selectedBooking.appointmentDate} />
                                    <DetailRow label="Giờ" value={selectedBooking.timeSlot} />
                                    <DetailRow label="Phí dịch vụ" value={`${formatPrice(selectedBooking.priceAmount)}₫`} />
                                    <DetailRow label="Phí vận chuyển" value={`${formatPrice(selectedBooking.shippingFee)}₫`} />
                                    <DetailRow label="Tổng tiền" value={<span className="font-black text-orange-600">{formatPrice(selectedBooking.totalAmount)}₫</span>} />
                                    {selectedBooking.pickupAddress && <DetailRow label="Địa chỉ đón" value={selectedBooking.pickupAddress} />}
                                    {selectedBooking.customerNote && <DetailRow label="Ghi chú" value={selectedBooking.customerNote} />}
                                    {selectedBooking.status === 'PENDING' && (
                                        <button onClick={() => handleCancel(selectedBooking.id, selectedBooking.bookingCode)}
                                            className="w-full mt-4 py-3 rounded-xl border-2 border-red-200 text-red-600 font-black text-sm hover:bg-red-50 transition-all">
                                            Hủy đặt lịch
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-bold text-gray-900">{value}</span>
        </div>
    );
}
