import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Mail, PawPrint, Phone, RefreshCw, Search, UserRound, X } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerEmptyState, PartnerErrorState, PartnerLoadingState, PartnerStatusBadge } from '../../components/partner/PartnerStates';
import { getPartnerCustomerDetail, getPartnerCustomers } from '../../api/partner';

const statusOptions = [
    ['ALL', 'Tất cả'],
    ['ACTIVE', 'Đang có booking'],
    ['COMPLETED', 'Đã hoàn thành'],
    ['CANCELLED', 'Từng hủy'],
];

const PartnerCustomersPage = () => {
    const [payload, setPayload] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('ALL');
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [error, setError] = useState('');

    const loadCustomers = async (nextPage = page) => {
        try {
            setLoading(true);
            setError('');
            setPayload(await getPartnerCustomers({ status, page: nextPage, size: 12, ...(keyword.trim() ? { keyword: keyword.trim() } : {}) }));
            setPage(nextPage);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách khách hàng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCustomers(0); }, [status]);

    const openCustomer = async (customerUserId) => {
        try {
            setDetailLoading(true);
            setError('');
            setSelectedCustomer(await getPartnerCustomerDetail(customerUserId));
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải chi tiết khách hàng.');
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <PartnerLayout title="Khách hàng" subtitle="Danh sách khách đã từng booking bên provider" providerName={payload?.businessName}>
            <div className="space-y-6">
                {error && <PartnerErrorState message={error} onRetry={() => loadCustomers(page)} />}

                <section className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Tìm kiếm</span>
                            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadCustomers(0)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold" placeholder="Tên, email, SĐT, mã booking, thú cưng..." />
                        </label>
                        <button onClick={() => loadCustomers(0)} className="self-end px-5 py-3 rounded-2xl bg-gray-900 text-white font-black flex items-center justify-center gap-2 hover:bg-orange-500"><Search className="w-4 h-4" /> Tìm</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map(([value, label]) => (
                            <button key={value} onClick={() => setStatus(value)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${status === value ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}>{label}</button>
                        ))}
                    </div>
                </section>

                {loading ? <PartnerLoadingState message="Đang tải khách hàng partner..." /> : payload?.customers?.length ? (
                    <>
                        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {payload.customers.map((customer) => (
                                <button key={customer.customerUserId} onClick={() => openCustomer(customer.customerUserId)} className="text-left bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 min-w-0">
                                            <Avatar url={customer.customerAvatarUrl} name={customer.customerName} />
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-black truncate">{customer.customerName || 'Khách hàng'}</h3>
                                                <div className="flex flex-wrap gap-2 mt-2 text-xs font-bold text-gray-500">
                                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.maskedPhone || 'Ẩn SĐT'}</span>
                                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.maskedEmail || 'Ẩn email'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-right text-orange-600 font-black">{customer.totalSpentDisplay}</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                                        <MiniStat label="Booking" value={customer.bookingCount} />
                                        <MiniStat label="Hoàn thành" value={customer.completedBookingCount} />
                                        <MiniStat label="Thú cưng" value={customer.pets?.length || 0} />
                                        <MiniStat label="Lần cuối" value={customer.lastBookingDateDisplay || 'N/A'} />
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {(customer.pets || []).slice(0, 3).map((pet) => <span key={`${customer.customerUserId}-${pet.petId || pet.petName}`} className="px-3 py-1 rounded-xl bg-orange-50 text-orange-600 text-xs font-black">{pet.petName || 'Thú cưng'} · {pet.bookingCount}</span>)}
                                    </div>
                                </button>
                            ))}
                        </section>
                        <Pagination payload={payload} page={page} onPage={loadCustomers} />
                    </>
                ) : <PartnerEmptyState title="Chưa có khách hàng phù hợp" message="Khách hàng sẽ xuất hiện khi có booking thuộc provider hiện tại." action={<button onClick={() => loadCustomers(0)} className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-black flex items-center gap-2 mx-auto"><RefreshCw className="w-4 h-4" /> Refresh</button>} />}

                {(selectedCustomer || detailLoading) && <CustomerDetailModal customer={selectedCustomer} loading={detailLoading} onClose={() => setSelectedCustomer(null)} />}
            </div>
        </PartnerLayout>
    );
};

const Avatar = ({ url, name }) => url ? <img src={url} alt={name || 'Customer'} className="w-14 h-14 rounded-2xl object-cover" /> : <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center"><UserRound className="w-6 h-6" /></div>;

const MiniStat = ({ label, value }) => <div className="p-3 rounded-2xl bg-gray-50"><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p><p className="font-black text-gray-900">{value}</p></div>;

const Pagination = ({ payload, page, onPage }) => {
    const totalPages = payload?.totalPages || 0;
    if (totalPages <= 1) return null;
    return <div className="flex items-center justify-center gap-3"><button disabled={page <= 0} onClick={() => onPage(page - 1)} className="px-4 py-2 rounded-xl bg-white border border-gray-100 font-black disabled:opacity-40">Trước</button><span className="font-black text-gray-500">Trang {page + 1}/{totalPages}</span><button disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} className="px-4 py-2 rounded-xl bg-white border border-gray-100 font-black disabled:opacity-40">Sau</button></div>;
};

const CustomerDetailModal = ({ customer, loading, onClose }) => (
    <div className="fixed inset-0 z-[70] bg-gray-900/40 p-4 flex items-center justify-center">
        <div className="bg-white rounded-[2rem] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-orange-500">Customer detail</p>
                    <h2 className="text-2xl font-black">{customer?.customerName || 'Đang tải khách hàng'}</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>
            {loading ? <PartnerLoadingState message="Đang tải chi tiết khách hàng..." /> : customer && (
                <div className="space-y-5">
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MiniStat label="Booking" value={customer.bookingCount} />
                        <MiniStat label="Hoàn thành" value={customer.completedBookingCount} />
                        <MiniStat label="Đã hủy" value={customer.cancelledBookingCount} />
                        <MiniStat label="Chi tiêu" value={customer.totalSpentDisplay} />
                    </section>
                    <section className="bg-gray-50 rounded-[1.5rem] p-4 border border-gray-100">
                        <h3 className="font-black mb-3 flex items-center gap-2"><PawPrint className="w-4 h-4 text-orange-500" /> Thú cưng từng booking</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(customer.pets || []).map((pet) => <div key={pet.petId || pet.petName} className="bg-white rounded-2xl p-4 border border-gray-100"><p className="font-black">{pet.petName || 'Thú cưng'}</p><p className="text-sm text-gray-500 font-semibold">{pet.species || 'Pet'} · {pet.breed || 'Chưa rõ giống'} · {pet.bookingCount} booking</p></div>)}
                        </div>
                    </section>
                    <section className="space-y-3">
                        <h3 className="font-black flex items-center gap-2"><CalendarDays className="w-4 h-4 text-orange-500" /> Booking tại provider</h3>
                        {(customer.bookings || []).map((booking) => (
                            <Link key={booking.bookingId} to={`/partner/bookings/${booking.bookingId}`} onClick={onClose} className="block p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-orange-50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div><div className="flex flex-wrap gap-2 mb-1"><p className="font-black">{booking.bookingCode}</p><PartnerStatusBadge status={booking.statusLabel || booking.status} /></div><p className="text-sm text-gray-600 font-bold">{booking.serviceName} · {booking.petName || 'Thú cưng'} · {booking.appointmentDateDisplay} {booking.appointmentTime}</p></div>
                                    <p className="font-black text-orange-600">{booking.totalAmountDisplay}</p>
                                </div>
                            </Link>
                        ))}
                    </section>
                </div>
            )}
        </div>
    </div>
);

export default PartnerCustomersPage;