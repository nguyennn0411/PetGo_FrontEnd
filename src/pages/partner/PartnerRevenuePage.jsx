import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CreditCard, FileText, ReceiptText, Search, TrendingUp, X } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerEmptyState, PartnerErrorState, PartnerLoadingState, PartnerStatusBadge } from '../../components/partner/PartnerStates';
import { getPartnerInvoiceDetail, getPartnerInvoices, getPartnerRevenueSummary } from '../../api/partner';

const statusOptions = ['ALL', 'PAID', 'PENDING', 'ISSUED', 'CANCELLED'];

const formatInputDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const getDefaultRange = () => {
    const now = new Date();
    return {
        from: formatInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: formatInputDate(now),
    };
};

const PartnerRevenuePage = () => {
    const defaultRange = useMemo(() => getDefaultRange(), []);
    const [summary, setSummary] = useState(null);
    const [invoicePayload, setInvoicePayload] = useState(null);
    const [from, setFrom] = useState(defaultRange.from);
    const [to, setTo] = useState(defaultRange.to);
    const [status, setStatus] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [error, setError] = useState('');

    const buildParams = () => ({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
    });

    const loadRevenue = async () => {
        try {
            setLoading(true);
            setError('');
            const params = buildParams();
            const [summaryData, invoiceData] = await Promise.all([
                getPartnerRevenueSummary(params),
                getPartnerInvoices({ ...params, status }),
            ]);
            setSummary(summaryData);
            setInvoicePayload(invoiceData);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải doanh thu/invoice partner.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRevenue(); }, [status]);

    const openInvoice = async (invoiceId) => {
        try {
            setDetailLoading(true);
            setError('');
            setSelectedInvoice(await getPartnerInvoiceDetail(invoiceId));
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải chi tiết invoice.');
        } finally {
            setDetailLoading(false);
        }
    };

    const metricCards = [
        ['Doanh thu đã thanh toán', summary?.totalRevenueDisplay || '0 đ', TrendingUp, 'bg-emerald-50 text-emerald-600'],
        ['Doanh thu chờ thanh toán', summary?.pendingRevenueDisplay || '0 đ', CreditCard, 'bg-orange-50 text-orange-600'],
        ['Invoice đã thanh toán', summary?.paidInvoices ?? 0, ReceiptText, 'bg-green-50 text-green-600'],
        ['Giá trị TB/booking', summary?.averageBookingValueDisplay || '0 đ', BarChart3, 'bg-blue-50 text-blue-600'],
    ];

    return (
        <PartnerLayout title="Doanh thu" subtitle="Theo dõi revenue, invoice và payment của provider" providerName={summary?.businessName}>
            <div className="space-y-6">
                {error && <PartnerErrorState message={error} onRetry={loadRevenue} />}

                <section className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Từ ngày</span>
                            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold" />
                        </label>
                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Đến ngày</span>
                            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold" />
                        </label>
                        <button onClick={loadRevenue} className="self-end px-5 py-3 rounded-2xl bg-gray-900 text-white font-black flex items-center justify-center gap-2 hover:bg-orange-500">
                            <Search className="w-4 h-4" /> Lọc
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map((item) => (
                            <button key={item} onClick={() => setStatus(item)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${status === item ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}>
                                {item} {invoicePayload?.counts?.[item] !== undefined ? `(${invoicePayload.counts[item]})` : ''}
                            </button>
                        ))}
                    </div>
                </section>

                {loading ? <PartnerLoadingState message="Đang tải doanh thu partner..." /> : (
                    <>
                        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {metricCards.map(([label, value, Icon, cls]) => (
                                <div key={label} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${cls}`}><Icon className="w-6 h-6" /></div>
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">{label}</p>
                                    <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
                                </div>
                            ))}
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <RevenueByService services={summary?.revenueByService || []} />
                            <InvoiceList payload={invoicePayload} onOpen={openInvoice} />
                        </section>
                    </>
                )}

                {(selectedInvoice || detailLoading) && (
                    <InvoiceDetailModal invoice={selectedInvoice} loading={detailLoading} onClose={() => setSelectedInvoice(null)} />
                )}
            </div>
        </PartnerLayout>
    );
};

const RevenueByService = ({ services }) => (
    <div className="lg:col-span-1 bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black">Theo dịch vụ</h2>
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Paid only</span>
        </div>
        {services.length ? (
            <div className="space-y-3">
                {services.map((service) => (
                    <div key={service.providerServiceId || service.serviceName} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-black">{service.serviceName || 'Dịch vụ'}</p>
                                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{service.bookingCount} booking</p>
                            </div>
                            <p className="font-black text-orange-600">{service.revenueDisplay}</p>
                        </div>
                    </div>
                ))}
            </div>
        ) : <PartnerEmptyState title="Chưa có revenue theo dịch vụ" message="Dữ liệu sẽ hiển thị khi invoice được thanh toán." />}
    </div>
);

const InvoiceList = ({ payload, onOpen }) => (
    <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black">Invoice</h2>
            <span className="text-sm text-gray-400 font-black">{payload?.invoices?.length || 0} invoice</span>
        </div>
        {payload?.invoices?.length ? (
            <div className="space-y-3">
                {payload.invoices.map((invoice) => (
                    <button key={invoice.invoiceId} onClick={() => onOpen(invoice.invoiceId)} className="w-full text-left p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-orange-50 transition-all">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white text-orange-500 flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <p className="font-black">#{invoice.invoiceNumber}</p>
                                        <PartnerStatusBadge status={invoice.invoiceStatus} />
                                        {invoice.paymentStatus && <PartnerStatusBadge status={invoice.paymentStatus} />}
                                    </div>
                                    <p className="text-sm text-gray-600 font-bold">{invoice.customerName || 'Khách hàng'} · {invoice.serviceName || 'Dịch vụ'}</p>
                                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{invoice.bookingCode || 'Booking N/A'} · {invoice.appointmentDateDisplay || invoice.issuedAt || 'Chưa rõ ngày'}</p>
                                </div>
                            </div>
                            <div className="text-left lg:text-right">
                                <p className="text-xl font-black text-orange-600">{invoice.totalAmountDisplay}</p>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">{invoice.paymentMethod || 'Payment N/A'}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        ) : <PartnerEmptyState title="Không có invoice" message="Không tìm thấy invoice phù hợp bộ lọc." />}
    </div>
);

const InvoiceDetailModal = ({ invoice, loading, onClose }) => (
    <div className="fixed inset-0 z-[70] bg-gray-900/40 p-4 flex items-center justify-center">
        <div className="bg-white rounded-[2rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-orange-500">Invoice detail</p>
                    <h2 className="text-2xl font-black">{invoice?.invoiceNumber ? `#${invoice.invoiceNumber}` : 'Đang tải invoice'}</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>
            {loading ? <PartnerLoadingState message="Đang tải chi tiết invoice..." /> : invoice && (
                <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                        <PartnerStatusBadge status={invoice.invoiceStatus} />
                        {invoice.paymentStatus && <PartnerStatusBadge status={invoice.paymentStatus} />}
                    </div>
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Info label="Khách hàng" value={invoice.customerName} />
                        <Info label="Liên hệ" value={`${invoice.customerPhone || 'N/A'} · ${invoice.customerEmail || 'N/A'}`} />
                        <Info label="Booking" value={invoice.bookingCode} />
                        <Info label="Lịch hẹn" value={`${invoice.appointmentDateDisplay || 'N/A'} ${invoice.appointmentTime || ''}`} />
                        <Info label="Dịch vụ" value={invoice.serviceName} />
                        <Info label="Thú cưng" value={invoice.petName} />
                        <Info label="Payment" value={`${invoice.paymentMethod || 'N/A'} · ${invoice.paymentStatus || 'N/A'}`} />
                        <Info label="Phát hành / thanh toán" value={`${invoice.issuedAt || 'N/A'} · ${invoice.paidAt || 'Chưa paid'}`} />
                    </section>
                    <section className="rounded-[1.5rem] bg-gray-50 border border-gray-100 p-4">
                        <h3 className="font-black mb-3">Invoice items</h3>
                        <div className="space-y-2">
                            {(invoice.items || []).map((item, index) => (
                                <div key={`${item.itemName}-${index}`} className="flex items-start justify-between gap-4 text-sm">
                                    <div>
                                        <p className="font-black">{item.itemName}</p>
                                        <p className="text-gray-400 font-semibold">{item.description || item.itemType} · SL {item.quantity}</p>
                                    </div>
                                    <p className="font-black">{Number(item.lineTotal || 0).toLocaleString('vi-VN')} đ</p>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between">
                            <span className="font-black">Tổng cộng</span>
                            <span className="text-2xl font-black text-orange-600">{invoice.totalAmountDisplay}</span>
                        </div>
                    </section>
                </div>
            )}
        </div>
    </div>
);

const Info = ({ label, value }) => (
    <div className="p-4 rounded-2xl bg-gray-50">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="font-black text-gray-900 break-words">{value || 'N/A'}</p>
    </div>
);

export default PartnerRevenuePage;