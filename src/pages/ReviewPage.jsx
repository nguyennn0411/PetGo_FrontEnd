import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Calendar,
  Heart,
  Home,
  Loader2,
  PawPrint,
  Send,
  Smile,
  Star,
  User,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createReview, getReviewContext } from '../api/reviews';
import { resolveUserId } from '../utils/userIdentity';

const ReviewPage = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { account } = useContext(AuthContext);
  const userId = useMemo(() => resolveUserId(account), [account]);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [photoUrls, setPhotoUrls] = useState(['']);
  const [contextData, setContextData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadContext = async () => {
    if (!userId) {
      setError('Không xác định được tài khoản người dùng để gửi review.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getReviewContext(userId, bookingId);
      setContextData(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được dữ liệu review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, bookingId]);

  const updatePhoto = (index, value) => {
    setPhotoUrls((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const addPhotoField = () => setPhotoUrls((prev) => [...prev, '']);
  const removePhotoField = (index) => setPhotoUrls((prev) => prev.filter((_, idx) => idx !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      window.alert('Vui lòng chọn số sao đánh giá!');
      return;
    }
    if (!userId) return;

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        userId,
        rating,
        comment,
        photoUrls: photoUrls.map((item) => item.trim()).filter(Boolean),
      };
      const response = await createReview(userId, bookingId, payload);
      setSuccess(response?.message || 'Gửi đánh giá thành công');
      setTimeout(() => navigate('/my-bookings'), 1600);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể gửi đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans text-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Đang tải booking để đánh giá</h2>
          <p className="text-gray-500 font-medium">PetGo đang kiểm tra booking có đủ điều kiện gửi review hay không.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans text-center">
        <div className="animate-in zoom-in duration-500 flex flex-col items-center">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-orange-100/50">
            <Heart className="w-12 h-12 text-orange-500 fill-current" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Cảm ơn bạn!</h2>
          <p className="text-gray-500 mb-8 font-medium">{success}</p>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 animate-pulse">
            Đang quay lại danh sách lịch hẹn...
          </div>
        </div>
      </div>
    );
  }

  if (error && !contextData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans text-center">
        <div className="max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-gray-900 mb-2">Không mở được trang review</h2>
          <p className="text-gray-500 mb-6 font-medium">{error}</p>
          <button onClick={() => navigate('/my-bookings')} className="px-6 py-3 rounded-2xl bg-orange-500 text-white font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all">
            Về My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/bookings/${bookingId}`)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-100">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">Pet<span className="text-orange-500">Go</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 text-gray-400 hover:text-orange-500 transition-colors hidden sm:block" title="Về trang chủ">
              <Home className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Write a Review</h1>
          <p className="text-gray-500 font-medium italic">Review giờ đã ghi vào backend thật theo booking.</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 mb-8 border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gray-100 bg-gray-100">
            {contextData?.providerImage ? (
              <img src={contextData.providerImage} alt={contextData.providerName} className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="flex-1">
            <h3 className="font-black text-gray-900 leading-tight mb-1">{contextData?.providerName}</h3>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">{contextData?.serviceName}</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
              <Calendar className="w-3 h-3" /> {contextData?.appointmentDateDisplay}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-gray-100 shadow-sm">
          {!contextData?.canReview ? (
            <div className="text-center">
              <AlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-gray-900 mb-2">Booking hiện chưa thể đánh giá</h2>
              <p className="text-sm text-gray-500 font-medium mb-6">{contextData?.note}</p>
              <button onClick={() => navigate(`/bookings/${bookingId}`)} className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all">
                Quay về booking detail
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col items-center mb-12">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6">Bạn đánh giá thế nào?</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="transition-transform active:scale-90 hover:scale-110 outline-none"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                    >
                      <Star className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-200 ${(hover || rating) >= star ? 'text-yellow-400 fill-current' : 'text-gray-100'}`} />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <div className="mt-4 px-4 py-1 bg-orange-50 rounded-full">
                    <span className="text-orange-500 font-black text-[10px] uppercase tracking-widest">
                      {rating === 5 ? 'Rất hài lòng 😍' : rating === 4 ? 'Hài lòng 😄' : rating === 3 ? 'Bình thường 🙂' : rating === 2 ? 'Không tốt lắm 😕' : 'Thất vọng 😞'}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Smile className="w-4 h-4 text-orange-500" /> Trải nghiệm của bạn
                  </label>
                  <span className="text-[10px] font-bold text-gray-300 italic">{comment.length}/500</span>
                </div>
                <textarea
                  rows="6"
                  placeholder="Write your experience..."
                  className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-[2rem] text-sm font-medium focus:bg-white focus:border-orange-500 outline-none transition-all placeholder:text-gray-300"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="mb-12 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Camera className="w-4 h-4" /> Ảnh review (URL)</span>
                  <button type="button" onClick={addPhotoField} className="text-[10px] font-black text-orange-600 uppercase tracking-widest">+ Thêm URL ảnh</button>
                </div>
                {photoUrls.map((value, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updatePhoto(index, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-orange-500 focus:bg-white"
                    />
                    {photoUrls.length > 1 && (
                      <button type="button" onClick={() => removePhotoField(index)} className="px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-all">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {error ? (
                <div className="mb-6 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-sm font-medium text-red-600">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-4">
                <button type="submit" disabled={submitting} className={`w-full py-5 font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 ${rating > 0 ? 'bg-gray-900 text-white shadow-gray-200 hover:bg-orange-500 hover:shadow-orange-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'} disabled:opacity-70`}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Review
                </button>

                <div className="flex items-center justify-between pt-4">
                  <button type="button" onClick={() => navigate(`/bookings/${bookingId}`)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Hủy bỏ
                  </button>
                  <button type="button" onClick={() => navigate('/')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors flex items-center gap-1">
                    Về trang chủ
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="mt-12 flex items-start gap-4 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <AlertCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">Cộng đồng PetGo</h4>
            <p className="text-xs font-medium text-blue-700 leading-relaxed">
              Review của bạn sẽ được lưu vào backend, hiển thị trên hồ sơ nhà cung cấp và ảnh hưởng trực tiếp tới điểm rating trung bình.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewPage;
