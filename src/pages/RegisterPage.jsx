import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  PawPrint,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { registerRequest } from '../api/auth';

const RegisterPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || location.state?.email || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await registerRequest({
        email,
        password,
        fullName: name,
        phoneNumber: phone,
      });

      // BE trả về HTTP 200 nhưng có code OTP_PENDING (email chưa xác thực, OTP còn hạn)
      if (response?.code === 'OTP_PENDING') {
        const redirectEmail = response.email || email.trim().toLowerCase();
        navigate(`/verify-otp?email=${encodeURIComponent(redirectEmail)}`);
        return;
      }

      setSuccess('Đăng ký thành công! Đang chuyển đến trang xác thực OTP...');
      setTimeout(() => navigate(`/verify-otp?email=${encodeURIComponent(email)}`), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      const errorCode = err.response?.data?.code;

      // Fallback: kiểm tra code OTP_PENDING
      if (errorCode === 'OTP_PENDING' || errorMessage.includes('Hệ thống đang chuyển sang trang xác minh OTP')) {
        const redirectEmail = err.response?.data?.email || email.trim().toLowerCase();
        navigate(`/verify-otp?email=${encodeURIComponent(redirectEmail)}`);
        return;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans selection:bg-orange-100 selection:text-orange-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-white/20">
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gray-900 relative overflow-hidden text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="bg-orange-500 p-2 rounded-xl shadow-lg">
                <PawPrint className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tight">PetGo</span>
            </div>
            <h1 className="text-5xl font-black leading-[1.1] mb-6 text-white">
              Tham gia với chúng tôi <br />
              <span className="text-orange-500">PetGo</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-md leading-relaxed">
              Tạo một tài khoản để bắt đầu đặt lịch các dịch vụ tốt nhất cho những người bạn thú cưng của bạn.
            </p>
          </div>
        </div>

        <div className="flex flex-col p-8 sm:p-12 lg:p-16">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="bg-orange-500 p-1.5 rounded-lg">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900">PetGo</span>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Tạo tài khoản</h2>
            <p className="text-gray-500 font-medium">Nhập đủ thông tin để tạo tài khoản.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField label="Tên đầy đủ" icon={<User className="w-5 h-5" />} value={name} onChange={setName} placeholder="Nguyễn Văn Nam" />
            <InputField label="Email" type="email" icon={<Mail className="w-5 h-5" />} value={email} onChange={setEmail} placeholder="name@example.com" />
            <InputField label="Số điện thoại" type="tel" icon={<Phone className="w-5 h-5" />} value={phone} onChange={setPhone} placeholder="0901234567" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordField label="Mật khẩu" value={password} setValue={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} icon={<Lock className="w-5 h-5" />} />
              <PasswordField label="Xác nhận mật khẩu" value={confirmPassword} setValue={setConfirmPassword} showPassword={showPassword} setShowPassword={setShowPassword} icon={<ShieldCheck className="w-5 h-5" />} />
            </div>

            {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}
            {success && <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-600">{success}</div>}

            <button type="submit" disabled={isLoading} className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 transition-all disabled:opacity-60">
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 font-medium mt-8">
            Bạn đã có tài khoản?{' '}
            <Link to="/login" className="font-black text-orange-600 hover:text-orange-700 transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, icon, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-2">
    <label className="text-sm font-black text-gray-900 ml-1 uppercase tracking-widest">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">{icon}</div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-gray-900" required />
    </div>
  </div>
);

const PasswordField = ({ label, icon, value, setValue, showPassword, setShowPassword }) => (
  <div className="space-y-2">
    <label className="text-sm font-black text-gray-900 ml-1 uppercase tracking-widest">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">{icon}</div>
      <input type={showPassword ? 'text' : 'password'} value={value} onChange={(e) => setValue(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-gray-900" required />
      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

export default RegisterPage;
