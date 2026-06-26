import React, { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, MapPin, Wallet } from 'lucide-react';
import ShopLayout from '../../components/shop/ShopLayout';
import { AuthContext } from '../../context/AuthContext';
import { formatVnd, getCurrentUserId, shopApi } from '../../api/shop';

const HANOI_CITY = 'Hà Nội';
const HOA_LAC_WARDS = [
  'Hòa Lạc',
  'Thạch Hòa',
  'Tân Xã',
  'Bình Yên',
  'Hạ Bằng',
  'Đồng Trúc',
  'Cần Kiệm',
  'Phú Cát',
  'Yên Bình',
  'Tiến Xuân',
];

const getStoredAccount = () => {
  try {
    const stored = localStorage.getItem('account');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const getUserCheckoutInfo = (account) => ({
  receiverName: account?.fullName || account?.name || account?.username || '',
  receiverPhone: account?.phoneNumber || account?.phone || '',
  receiverEmail: account?.email || '',
});

export default function CheckoutPage() {
  const { account } = useContext(AuthContext);
  const userId = getCurrentUserId();
  const navigate = useNavigate();
  const checkoutAccount = useMemo(() => account || getStoredAccount(), [account]);
  const [cart, setCart] = useState({ items: [], subtotalAmount: 0, shippingFeeAmount: 0, totalAmount: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    ...getUserCheckoutInfo(checkoutAccount),
    shippingAddress: '',
    ward: HOA_LAC_WARDS[0],
    district: '',
    city: HANOI_CITY,
    province: HANOI_CITY,
    paymentMethod: 'WALLET',
    customerNote: '',
  });

  useEffect(() => {
    shopApi.getCart(userId).then(setCart).catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!checkoutAccount) return;
    setForm((prev) => ({
      ...prev,
      ...getUserCheckoutInfo(checkoutAccount),
      city: HANOI_CITY,
      province: HANOI_CITY,
      district: '',
      ward: HOA_LAC_WARDS.includes(prev.ward) ? prev.ward : HOA_LAC_WARDS[0],
    }));
  }, [checkoutAccount]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!cart.items?.length) return toast.error('Giỏ hàng đang trống.');

    try {
      setSubmitting(true);
      const order = await shopApi.checkout({
        userId,
        ...form,
        city: HANOI_CITY,
        province: HANOI_CITY,
        district: '',
      });

      if (form.paymentMethod === 'PAYOS') {
        if (order.checkoutUrl) {
          window.location.href = order.checkoutUrl;
          return;
        }
        throw new Error('Không nhận được liên kết thanh toán PayOS.');
      }

      toast.success(`Đặt hàng thành công: ${order.orderCode}`);
      navigate('/my-orders');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Đặt hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShopLayout>
      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-gray-950 flex items-center gap-3">
          <Wallet className="text-orange-500" /> Thanh toán
        </h1>
        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-7 mt-8">
          <section className="bg-white rounded-[3rem] border border-orange-100 p-7 shadow-sm space-y-6">
            <h2 className="font-black text-xl flex items-center gap-2">
              <MapPin className="text-orange-500" /> Thông tin nhận hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Họ tên" value={form.receiverName} onChange={(v) => update('receiverName', v)} required />
              <Input label="Số điện thoại" value={form.receiverPhone} onChange={(v) => update('receiverPhone', v)} required />
              <Input label="Email" value={form.receiverEmail} onChange={(v) => update('receiverEmail', v)} type="email" />
              <Input label="Tỉnh/Thành phố" value={HANOI_CITY} readOnly />
              <Select label="Phường/Xã" value={form.ward} onChange={(v) => update('ward', v)} options={HOA_LAC_WARDS} required />
            </div>
            <Input label="Địa chỉ cụ thể" value={form.shippingAddress} onChange={(v) => update('shippingAddress', v)} required />
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Ghi chú</label>
              <textarea value={form.customerNote} onChange={(e) => update('customerNote', e.target.value)} rows={3} className="w-full rounded-2xl bg-gray-50 border border-gray-200 p-4 outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Phương thức thanh toán</label>
              <div className="grid grid-cols-2 gap-3">
                {['WALLET', 'PAYOS'].map((m) => (
                  <button type="button" key={m} onClick={() => update('paymentMethod', m)} className={`p-4 rounded-2xl border font-black text-xs ${form.paymentMethod === m ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 text-gray-700'}`}>
                    {m === 'WALLET' ? 'Ví PetGo' : m}
                  </button>
                ))}
              </div>
            </div>
          </section>
          <aside className="bg-white rounded-[3rem] border border-orange-100 p-7 shadow-sm h-max space-y-5">
            <h2 className="font-black text-xl">Đơn hàng của bạn</h2>
            <div className="max-h-72 overflow-auto space-y-3 pr-1">
              {cart.items?.map((item) => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <img src={item.productImageUrl || 'https://placehold.co/100x100'} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="font-black text-gray-900 line-clamp-1">{item.productName}</div>
                    <div className="text-gray-500 font-bold">x{item.quantity}</div>
                  </div>
                  <div className="font-black">{formatVnd(item.lineTotal)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-3 border-t pt-4 font-bold text-gray-600">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatVnd(cart.subtotalAmount)}</span></div>
              {cart.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá (Membership)</span><span>-{formatVnd(cart.discountAmount)}</span></div>}
              <div className="flex justify-between"><span>Phí giao hàng</span><span>{formatVnd(cart.shippingFeeAmount)}</span></div>
              <div className="flex justify-between text-lg font-black text-gray-950"><span>Tổng cộng</span><span className="text-orange-600">{formatVnd(cart.totalAmount)}</span></div>
            </div>
            <button disabled={submitting} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <CircleCheck className="w-5 h-5" /> {submitting ? 'Đang đặt...' : 'Xác nhận đặt hàng'}
            </button>
          </aside>
        </form>
      </main>
    </ShopLayout>
  );
}

function Input({ label, value, onChange, type = 'text', required = false, readOnly = false }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <input type={type} required={required} readOnly={readOnly} value={value} onChange={(e) => onChange?.(e.target.value)} className="w-full rounded-2xl bg-gray-50 border border-gray-200 p-4 outline-none focus:border-orange-400 font-bold read-only:text-gray-500" />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl bg-gray-50 border border-gray-200 p-4 outline-none focus:border-orange-400 font-bold">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}
