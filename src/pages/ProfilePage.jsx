import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  Camera,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  LogIn,
  Mail,
  MapPin,
  PawPrint,
  PencilLine,
  Phone,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  User,
} from 'lucide-react';
import api from '../api/axios';
import { updateMyProfile } from '../api/profile';
import NotificationCenter from '../components/NotificationCenter';
import { AuthContext } from '../context/AuthContext';
import {
  formatJoinDate,
  getAccountAddress,
  getAccountAvatar,
  getAccountCover,
  getAccountDisplayName,
  getAccountEmail,
  getAccountPhone,
  resolveUserId,
} from '../utils/userIdentity';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'personal';

  const { account, updateAccount, loadingAccount } = useContext(AuthContext);
  const userId = useMemo(() => resolveUserId(account), [account]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState('');
  const [deletingPetId, setDeletingPetId] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  const displayUser = useMemo(() => ({
    name: getAccountDisplayName(profile?.user || account),
    email: getAccountEmail(profile?.user || account),
    phone: getAccountPhone(profile?.user || account),
    address: getAccountAddress(profile?.user || account),
    joinDate: formatJoinDate(profile?.user?.createdAt || account?.createdAt || account?.joinDate),
    avatar: getAccountAvatar(profile?.user || account),
    cover: getAccountCover(profile?.user || account),
    addressLine1: profile?.user?.addressLine1 || account?.addressLine1 || '',
    city: profile?.user?.city || account?.city || '',
    province: profile?.user?.province || account?.province || '',
    avatarUrl: profile?.user?.avatarUrl || account?.avatarUrl || '',
    coverUrl: profile?.user?.coverUrl || account?.coverUrl || '',
  }), [profile, account]);

  const [editData, setEditData] = useState(displayUser);

  useEffect(() => {
    setEditData(displayUser);
  }, [displayUser]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (next.get('tab') !== activeTab) {
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setBookingsLoading(true);
      setProfileError('');
      setBookingsError('');
      const [profileRes, bookingsRes] = await Promise.all([
        api.get('/profile/me'),
        userId
          ? api.get(`/users/${userId}/bookings`, { params: { status: 'ALL' } })
          : Promise.resolve({ data: { bookings: [] } }),
      ]);

      const profileData = profileRes.data?.result || profileRes.data;
      setProfile(profileData);
      updateAccount?.(profileData?.user || {});

      const bookingPayload = bookingsRes.data?.bookings ? bookingsRes.data : (bookingsRes.data?.result || bookingsRes.data);
      setBookings(bookingPayload?.bookings || []);
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Không thể tải profile.');
      setBookingsError(error.response?.data?.message || 'Không thể tải lịch sử booking.');
    } finally {
      setProfileLoading(false);
      setBookingsLoading(false);
    }
  };

  const loadPets = async () => {
    if (!userId) {
      setPets([]);
      return;
    }

    try {
      setPetsLoading(true);
      setPetsError('');
      const response = await api.get(`/users/${userId}/pets`);
      const payload = response.data?.items ? response.data : (response.data?.result || response.data);
      setPets(payload?.items || []);
    } catch (error) {
      setPetsError(error.response?.data?.message || 'Không thể tải danh sách thú cưng.');
    } finally {
      setPetsLoading(false);
    }
  };

  useEffect(() => {
    if (loadingAccount) return;
    if (!account) return;

    setBookingsLoading(true);
    loadProfile();
    loadPets();
  }, [loadingAccount, userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = await updateMyProfile({
        fullName: editData.name,
        email: editData.email,
        phoneNumber: editData.phone,
        avatarUrl: editData.avatarUrl,
        coverUrl: editData.coverUrl,
        addressLine1: editData.addressLine1,
        city: editData.city,
        province: editData.province,
      });

      setProfile(updated);
      updateAccount?.(updated?.user || {});
      setIsEditModalOpen(false);
    } catch (error) {
      window.alert(error.response?.data?.message || 'Cập nhật profile thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePet = async (petId, petName) => {
    if (!userId) return;
    const accepted = window.confirm(`Bạn có chắc muốn xóa thú cưng ${petName}?`);
    if (!accepted) return;

    try {
      setDeletingPetId(petId);
      await api.delete(`/users/${userId}/pets/${petId}`);
      setPets((prev) => prev.filter((pet) => pet.id !== petId));
      setProfile((prev) => prev ? { ...prev, totalPets: Math.max((prev.totalPets || 1) - 1, 0) } : prev);
    } catch (error) {
      window.alert(error.response?.data?.message || 'Xóa thú cưng thất bại.');
    } finally {
      setDeletingPetId(null);
    }
  };

  const recentBookings = bookings.slice(0, 6);

  if (loadingAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!loadingAccount && !account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-white text-center space-y-6">
          <div className="w-20 h-20 rounded-[2rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-3">Bạn chưa đăng nhập</h1>
            <p className="text-gray-500 font-medium">Đăng nhập để xem hồ sơ, thú cưng và lịch sử booking của bạn.</p>
          </div>
          <button onClick={() => navigate('/login')} className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 transition-all flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" />
            Đi tới đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {profileError && (
          <div className="rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-red-600 font-bold flex items-center justify-between gap-4">
            <span>{profileError}</span>
            <button onClick={loadProfile} className="px-4 py-2 rounded-xl bg-white text-red-600 text-xs font-black uppercase tracking-widest border border-red-100">
              Thử lại
            </button>
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-white">
          <div className="relative h-48 sm:h-64">
            <img src={displayUser.cover} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <button className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-2xl text-white transition-all border border-white/30">
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row items-end gap-6 -mt-16 sm:-mt-20 mb-6">
              <div className="relative group">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2rem] border-4 border-white overflow-hidden shadow-2xl relative bg-white">
                  <img src={displayUser.avatar} alt={displayUser.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-orange-500 p-2.5 rounded-2xl shadow-lg border-4 border-white">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-black mb-1">{displayUser.name}</h1>
                <div className="space-y-1">
                  <p className="text-gray-500 font-bold flex items-center justify-center sm:justify-start gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Tham gia từ {displayUser.joinDate}
                  </p>
                  {userId && <p className="text-xs text-gray-400 font-black uppercase tracking-widest">User ID: {userId}</p>}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setEditData({ ...displayUser }); setIsEditModalOpen(true); }} className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-lg shadow-gray-200 hover:bg-orange-500 hover:shadow-orange-100 transition-all active:scale-95">
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-8">
              <StatItem label="Bookings" value={String(profile?.totalBookings || 0).padStart(2, '0')} />
              <StatItem label="Reviews" value={String(profile?.totalReviews || 0).padStart(2, '0')} />
              <StatItem label="Pets" value={String(profile?.totalPets || pets.length || 0).padStart(2, '0')} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} icon={<User className="w-5 h-5" />} label="Thông tin cá nhân" />
            <TabButton active={activeTab === 'pets'} onClick={() => setActiveTab('pets')} icon={<PawPrint className="w-5 h-5" />} label="Thú cưng của tôi" />
            <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<Clock className="w-5 h-5" />} label="Lịch sử dịch vụ" />
            <TabButton active={activeTab === 'partner-registration'} onClick={() => setActiveTab('partner-registration')} icon={<Store className="w-5 h-5" />} label="Đăng ký Partner" />
            <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<ShieldCheck className="w-5 h-5" />} label="Mật khẩu & Bảo mật" />
            <TabButton active={activeTab === 'payment'} onClick={() => setActiveTab('payment')} icon={<CreditCard className="w-5 h-5" />} label="Phương thức thanh toán" />
            <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<Bell className="w-5 h-5" />} label="Thông báo" />
          </div>

          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'personal' && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {profileLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black">Thông tin cá nhân</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <InfoField icon={<User />} label="Họ và tên" value={displayUser.name} />
                      <InfoField icon={<Mail />} label="Email" value={displayUser.email} />
                      <InfoField icon={<Phone />} label="Số điện thoại" value={displayUser.phone} />
                      <InfoField icon={<MapPin />} label="Địa chỉ" value={displayUser.address} />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'pets' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between px-4 gap-3 flex-wrap">
                  <h2 className="text-2xl font-black">Thú cưng của tôi</h2>
                  <div className="flex gap-3">
                    <button onClick={loadPets} className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    <button onClick={() => navigate('/add-pet')} className="px-4 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-sm flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Thêm mới
                    </button>
                  </div>
                </div>

                {petsError && (
                  <div className="rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-red-600 font-bold flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    {petsError}
                  </div>
                )}

                {petsLoading ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-white flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : pets.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-white text-center space-y-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                      <PawPrint className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black mb-2">Chưa có thú cưng nào</h3>
                      <p className="text-gray-500 font-medium">Thêm hồ sơ thú cưng để đặt dịch vụ nhanh hơn.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {pets.map((pet) => (
                      <div key={pet.id} className="bg-white p-5 rounded-[2rem] border border-gray-50 flex items-center gap-4 hover:shadow-xl hover:shadow-gray-100 transition-all group">
                        <img src={pet.avatarUrl || pet.primaryPhotoUrl || pet.photos?.[0]?.photoUrl || 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=300'} alt={pet.name} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="font-black text-xl truncate">{pet.name}</h3>
                              <p className="text-gray-400 font-bold text-sm italic">{pet.breed || pet.speciesLabel || pet.species} • {pet.ageLabel || 'Chưa cập nhật tuổi'}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 shrink-0">{pet.sizeLabel || pet.size || 'Pet'}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-400 mt-3">
                            {pet.genderLabel && <span>{pet.genderLabel}</span>}
                            {pet.weightKg && <span>{pet.weightKg} kg</span>}
                            {pet.color && <span>{pet.color}</span>}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-5">
                            <button onClick={() => navigate(`/add-pet?petId=${pet.id}`)} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center gap-2">
                              <PencilLine className="w-4 h-4" />
                              Sửa
                            </button>
                            <button onClick={() => handleDeletePet(pet.id, pet.name)} disabled={deletingPetId === pet.id} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 disabled:opacity-70">
                              {deletingPetId === pet.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              Xóa
                            </button>
                            <button onClick={() => navigate(`/add-pet?petId=${pet.id}`)} className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2">
                              <ChevronRight className="w-4 h-4" />
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between px-4 gap-3 flex-wrap">
                  <h2 className="text-2xl font-black">Lịch sử dịch vụ</h2>
                  <button onClick={loadProfile} className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                {bookingsError && (
                  <div className="rounded-[2rem] border border-red-100 bg-red-50 px-5 py-4 text-red-600 font-bold flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    {bookingsError}
                  </div>
                )}

                {bookingsLoading ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-white flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-white text-center space-y-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black mb-2">Chưa có booking nào</h3>
                      <p className="text-gray-500 font-medium">Các booking mới của bạn sẽ xuất hiện tại đây.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {recentBookings.map((item) => (
                      <div key={item.bookingId} className="bg-white p-6 rounded-[2.5rem] border border-gray-50 flex flex-col sm:flex-row sm:items-center gap-6 hover:shadow-xl hover:shadow-gray-100 transition-all group relative overflow-hidden">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.status === 'CANCELLED' ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-600'}`}>
                          <PawPrint className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-black text-lg text-gray-900">{item.providerName}</h3>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : item.status === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                              {item.statusLabel || item.status}
                            </span>
                          </div>
                          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{item.serviceName}</p>
                          <div className="flex items-center gap-4 pt-2 flex-wrap">
                            <div className="flex items-center gap-1 text-gray-500 text-sm font-medium">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {item.appointmentDateDisplay || item.appointmentDate}
                            </div>
                            <div className="flex items-center gap-1 text-orange-600 font-black">{item.totalAmountDisplay || item.totalAmount}</div>
                          </div>
                        </div>
                        <button onClick={() => navigate(`/bookings/${item.bookingId}`)} className="sm:p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'partner-registration' && (
              <PartnerRegistrationChoice onSelectProvider={() => navigate('/partner-registration/provider')} />
            )}

            {activeTab === 'notifications' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <NotificationCenter />
              </div>
            )}

            {(activeTab === 'security' || activeTab === 'payment') && (
              <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-white flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center mb-6">
                  <Settings className="w-10 h-10 text-orange-500 animate-spin-slow" />
                </div>
                <h3 className="text-2xl font-black mb-2">Đang phát triển</h3>
                <p className="text-gray-500 font-medium max-w-xs">Các dữ liệu chính của profile đã chạy thật. Những tab nâng cao này sẽ được hoàn thiện ở bước tiếp theo.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isSaving && setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black">Edit Profile</h2>
                  <p className="text-gray-400 font-bold text-sm">Cập nhật hồ sơ thật từ backend</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6 rotate-180" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ModalInput label="Họ và tên" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                  <ModalInput label="Email" type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                  <ModalInput label="Số điện thoại" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                  <ModalInput label="Địa chỉ dòng 1" value={editData.addressLine1} onChange={(e) => setEditData({ ...editData, addressLine1: e.target.value })} />
                  <ModalInput label="Thành phố" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                  <ModalInput label="Tỉnh" value={editData.province} onChange={(e) => setEditData({ ...editData, province: e.target.value })} />
                  <ModalInput label="Avatar URL" value={editData.avatarUrl} onChange={(e) => setEditData({ ...editData, avatarUrl: e.target.value })} />
                  <ModalInput label="Cover URL" value={editData.coverUrl} onChange={(e) => setEditData({ ...editData, coverUrl: e.target.value })} />
                </div>

                <div className="pt-8 flex gap-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 px-6 bg-gray-100 text-gray-400 font-black rounded-2xl hover:bg-gray-200 hover:text-gray-600 transition-all active:scale-95">
                    Hủy bỏ
                  </button>
                  <button type="submit" disabled={isSaving} className="flex-[2] py-4 px-6 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 hover:bg-orange-500 hover:shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-3">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PartnerRegistrationChoice = ({ onSelectProvider }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
    <div className="space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
        <Store className="w-7 h-7" />
      </div>
      <div>
        <h2 className="text-2xl font-black">Chọn loại đăng ký Partner</h2>
        <p className="text-gray-500 font-medium mt-1">Hiện tại PetGo đang mở đăng ký cho nhà cung cấp dịch vụ.</p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        type="button"
        onClick={onSelectProvider}
        className="group min-h-48 rounded-[2rem] bg-orange-50 p-6 text-left border border-orange-100 transition-all hover:-translate-y-1 hover:bg-orange-500 hover:text-white hover:shadow-2xl hover:shadow-orange-100 active:scale-[0.98]"
      >
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm transition-all group-hover:bg-white/20 group-hover:text-white">
          <Store className="w-7 h-7" />
        </span>
        <span className="block text-xl font-black text-gray-900 transition-colors group-hover:text-white">Đăng ký cho provider</span>
        <span className="mt-2 block text-sm font-semibold leading-relaxed text-gray-500 transition-colors group-hover:text-orange-50">
          Dành cho provider muốn tạo hồ sơ dịch vụ, gửi ảnh địa điểm và chờ xét duyệt.
        </span>
        <span className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-600 transition-colors group-hover:text-white">
          Bắt đầu đăng ký
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </span>
      </button>

      <button
        type="button"
        disabled
        className="min-h-48 cursor-not-allowed rounded-[2rem] bg-gray-50 p-6 text-left border border-gray-100 opacity-80"
      >
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm">
          <Clock className="w-7 h-7" />
        </span>
        <span className="block text-xl font-black text-gray-500">Sắp ra mắt</span>
        <span className="mt-2 block text-sm font-semibold leading-relaxed text-gray-400">
          Luồng đăng ký partner khác đang được chuẩn bị và sẽ được mở ở phiên bản sau.
        </span>
        <span className="mt-5 inline-flex rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
          Đang phát triển
        </span>
      </button>
    </div>
  </div>
);

const StatItem = ({ label, value }) => (
  <div className="text-center group cursor-default">
    <p className="text-2xl font-black text-gray-900 group-hover:text-orange-500 transition-colors">{value}</p>
    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</p>
  </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] font-black transition-all ${active ? 'bg-orange-500 text-white shadow-xl shadow-orange-100' : 'bg-white text-gray-500 border border-gray-50 hover:bg-orange-50 hover:text-orange-600'}`}>
    <span className={active ? 'text-white' : 'text-orange-500'}>{icon}</span>
    {label}
  </button>
);

const InfoField = ({ icon, label, value }) => (
  <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-orange-100 hover:bg-white transition-all group">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
      <span className="text-orange-500">{React.cloneElement(icon, { size: 12 })}</span>
      {label}
    </label>
    <p className="font-black text-gray-900">{value}</p>
  </div>
);

const ModalInput = ({ label, value, onChange, type = 'text' }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} value={value || ''} onChange={onChange} className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none font-bold" />
  </div>
);

export default ProfilePage;
