import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MessageSquareText, RefreshCw, Search, Star } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import { PartnerEmptyState, PartnerErrorState, PartnerLoadingState, PartnerStatusBadge } from '../../components/partner/PartnerStates';
import { getPartnerReviews, getPartnerServices, replyPartnerReview } from '../../api/partner';

const getServiceName = (service) => service?.displayName || service?.customName || service?.serviceName || `Dịch vụ #${service?.id}`;

const PartnerReviewsPage = () => {
    const [payload, setPayload] = useState(null);
    const [services, setServices] = useState([]);
    const [rating, setRating] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [keyword, setKeyword] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const validateRange = () => {
        if (from && to && new Date(from) > new Date(to)) {
            setError('Ngày bắt đầu không được sau ngày kết thúc.');
            return false;
        }
        return true;
    };

    const loadReviews = async (nextPage = page) => {
        if (!validateRange()) return;
        try {
            setLoading(true);
            setError('');
            setPayload(await getPartnerReviews({
                page: nextPage,
                size: 12,
                ...(rating ? { rating } : {}),
                ...(serviceId ? { serviceId } : {}),
                ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
                ...(from ? { from } : {}),
                ...(to ? { to } : {}),
            }));
            setPage(nextPage);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải review partner.');
        } finally {
            setLoading(false);
        }
    };

    const submitReply = async (reviewId, reply) => {
        try {
            setError('');
            setMessage('');
            await replyPartnerReview(reviewId, reply);
            setMessage('Đã lưu phản hồi review.');
            await loadReviews(page);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể phản hồi review.');
        }
    };

    const loadServices = async () => {
        try {
            const data = await getPartnerServices();
            setServices(Array.isArray(data) ? data : []);
        } catch {
            setServices([]);
        }
    };

    useEffect(() => { loadServices(); }, []);
    useEffect(() => { loadReviews(0); }, [rating, serviceId]);

    return (
        <PartnerLayout title="Đánh giá" subtitle="Theo dõi review hiển thị của khách hàng" providerName={payload?.businessName}>
            <div className="space-y-6">
                {error && <PartnerErrorState message={error} onRetry={() => loadReviews(page)} />}
                {message && <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{message}</div>}

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard icon={Star} label="Điểm trung bình" value={payload?.averageRatingDisplay || '0.00'} tone="bg-yellow-50 text-yellow-600" />
                    <SummaryCard icon={MessageSquareText} label="Tổng review" value={payload?.totalReviews || 0} tone="bg-orange-50 text-orange-600" />
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Phân bố sao</p>
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => <div key={star} className="flex items-center gap-2 text-sm font-bold"><span className="w-10">{star}★</span><div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-yellow-400" style={{ width: `${distributionPercent(payload, star)}%` }} /></div><span className="w-8 text-right text-gray-500">{payload?.ratingDistribution?.[star] || 0}</span></div>)}
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-3">
                        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-gray-400">Từ khóa</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadReviews(0)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold" placeholder="Nội dung, khách, booking..." /></label>
                        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-gray-400">Số sao</span><select value={rating} onChange={(event) => setRating(event.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold"><option value="">Tất cả</option>{[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} sao</option>)}</select></label>
                        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-gray-400">Dịch vụ</span><select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold"><option value="">Tất cả dịch vụ</option>{services.map((service) => <option key={service.id} value={service.id}>{getServiceName(service)}</option>)}</select></label>
                        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-gray-400">Từ ngày</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold" /></label>
                        <label className="space-y-2"><span className="text-xs font-black uppercase tracking-widest text-gray-400">Đến ngày</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 font-bold" /></label>
                        <button onClick={() => loadReviews(0)} className="self-end px-5 py-3 rounded-2xl bg-gray-900 text-white font-black flex items-center justify-center gap-2 hover:bg-orange-500"><Search className="w-4 h-4" /> Lọc</button>
                    </div>
                </section>

                {loading ? <PartnerLoadingState message="Đang tải đánh giá partner..." /> : payload?.reviews?.length ? (
                    <>
                        <section className="space-y-4">
                            {payload.reviews.map((review) => <ReviewCard key={review.reviewId} review={review} onReply={submitReply} />)}
                        </section>
                        <Pagination payload={payload} page={page} onPage={loadReviews} />
                    </>
                ) : <PartnerEmptyState title="Chưa có review phù hợp" message="Review hiển thị của khách sẽ xuất hiện tại đây." action={<button onClick={() => loadReviews(0)} className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-black flex items-center gap-2 mx-auto"><RefreshCw className="w-4 h-4" /> Refresh</button>} />}
            </div>
        </PartnerLayout>
    );
};

const distributionPercent = (payload, star) => {
    const count = Number(payload?.ratingDistribution?.[star] || 0);
    const total = Math.max(1, Number(payload?.totalReviews || 0));
    return Math.round((count / total) * 100);
};

const SummaryCard = ({ icon: Icon, label, value, tone }) => <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${tone}`}><Icon className="w-6 h-6" /></div><p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">{label}</p><p className="text-3xl font-black text-gray-900 mt-1">{value}</p></div>;

const ReviewCard = ({ review, onReply }) => {
    const [reply, setReply] = useState(review.providerReply || '');
    const [saving, setSaving] = useState(false);
    const handleReply = async () => {
        setSaving(true);
        try { await onReply(review.reviewId, reply); } finally { setSaving(false); }
    };
    return (
        <article className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    {review.customerAvatarUrl ? <img src={review.customerAvatarUrl} alt={review.customerName || 'Customer'} className="w-14 h-14 rounded-2xl object-cover" /> : <div className="w-14 h-14 rounded-2xl bg-yellow-50 text-yellow-500 flex items-center justify-center"><Star className="w-6 h-6" /></div>}
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1"><h3 className="text-lg font-black">{review.customerName || 'Khách hàng'}</h3><div className="flex text-yellow-400">{[1, 2, 3, 4, 5].map((item) => <Star key={item} className={`w-4 h-4 ${item <= review.rating ? 'fill-current' : ''}`} />)}</div><PartnerStatusBadge status={review.status} /></div>
                        <p className="text-sm text-gray-500 font-semibold">{review.createdAt || 'Chưa rõ ngày'} · {review.serviceName || 'Dịch vụ'} · {review.petName || 'Thú cưng'}</p>
                    </div>
                </div>
                {review.bookingId && <Link to={`/partner/bookings/${review.bookingId}`} className="px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-black uppercase tracking-widest flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {review.bookingCode || 'Booking'}</Link>}
            </div>
            <p className="mt-4 text-gray-700 font-semibold leading-relaxed whitespace-pre-line">{review.comment || 'Khách hàng không để lại nội dung.'}</p>
            {!!review.photos?.length && <div className="mt-4 flex flex-wrap gap-3">{review.photos.map((photo, index) => <img key={`${photo.photoUrl}-${index}`} src={photo.photoUrl} alt="Review" className="w-24 h-24 rounded-2xl object-cover border border-gray-100" />)}</div>}
            <div className="mt-5 rounded-2xl bg-orange-50 border border-orange-100 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-widest text-orange-700">Phản hồi của provider</p>{review.providerRepliedAt && <span className="text-[10px] font-bold text-orange-500">{review.providerRepliedAt}</span>}</div>
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={1000} rows={3} className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-200" placeholder="Nhập phản hồi cho khách hàng..." />
                <button disabled={saving || !reply.trim()} onClick={handleReply} className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu phản hồi'}</button>
            </div>
        </article>
    );
};

const Pagination = ({ payload, page, onPage }) => {
    const totalPages = payload?.totalPages || 0;
    if (totalPages <= 1) return null;
    return <div className="flex items-center justify-center gap-3"><button disabled={page <= 0} onClick={() => onPage(page - 1)} className="px-4 py-2 rounded-xl bg-white border border-gray-100 font-black disabled:opacity-40">Trước</button><span className="font-black text-gray-500">Trang {page + 1}/{totalPages}</span><button disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} className="px-4 py-2 rounded-xl bg-white border border-gray-100 font-black disabled:opacity-40">Sau</button></div>;
};

export default PartnerReviewsPage;