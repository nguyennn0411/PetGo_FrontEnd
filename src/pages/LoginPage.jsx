import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Facebook,
  Github,
  Lock,
  Mail,
  PawPrint,
  ShieldCheck,
} from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPasswordRequest, loginRequest } from '../api/auth';
import { AuthContext } from '../context/AuthContext';
import { getRoleLandingPath } from '../utils/partnerAccess';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => value.trim().toLowerCase();

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const navigate = useNavigate();
  const { account, loadingAccount, login } = useContext(AuthContext);

  useEffect(() => {
    if (!loadingAccount && account) {
      navigate(getRoleLandingPath(account), { replace: true });
    }
  }, [account, loadingAccount, navigate]);

  const openForgotPassword = () => {
    setForgotEmail(email);
    setForgotError('');
    setShowRegisterPrompt(false);
    setIsForgotOpen(true);
  };

  const closeForgotPassword = () => {
    if (isForgotLoading) return;
    setIsForgotOpen(false);
    setForgotError('');
    setShowRegisterPrompt(false);
  };

  const handleForgotEmailChange = (value) => {
    setForgotEmail(value);
    if (showRegisterPrompt) {
      setShowRegisterPrompt(false);
      setForgotError('');
    }
  };

  const handleRetryForgotEmail = () => {
    setForgotEmail('');
    setForgotError('');
    setShowRegisterPrompt(false);
  };

  const handleRegisterFromForgot = () => {
    const normalizedForgotEmail = normalizeEmail(forgotEmail);
    const hasValidEmail = EMAIL_PATTERN.test(normalizedForgotEmail);

    navigate(hasValidEmail ? `/register?email=${encodeURIComponent(normalizedForgotEmail)}` : '/register', {
      state: hasValidEmail ? { email: normalizedForgotEmail } : undefined,
    });
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setShowRegisterPrompt(false);

    const normalizedForgotEmail = normalizeEmail(forgotEmail);
    if (!EMAIL_PATTERN.test(normalizedForgotEmail)) {
      setForgotError('Vui lòng nhập đúng định dạng email, ví dụ name@example.com.');
      return;
    }

    setForgotEmail(normalizedForgotEmail);
    setIsForgotLoading(true);

    try {
      await forgotPasswordRequest({ email: normalizedForgotEmail });
      navigate(`/verify-otp?email=${encodeURIComponent(normalizedForgotEmail)}&purpose=forgot-password`, {
        state: { email: normalizedForgotEmail, purpose: 'forgot-password' },
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể gửi mã đặt lại mật khẩu. Vui lòng thử lại.';

      if (err.response?.status === 404) {
        setForgotError(`${message} Bạn muốn nhập lại email hay đăng ký tài khoản mới?`);
        setShowRegisterPrompt(true);
      } else {
        setForgotError(message);
      }
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginRequest({ userName: email, password });

      // BE trả về HTTP 200 nhưng có code OTP_PENDING -> Chuyển sang trang xác minh OTP
      if (response?.code === 'OTP_PENDING') {
        const redirectEmail = response.email || email.trim().toLowerCase();
        navigate(`/verify-otp?email=${encodeURIComponent(redirectEmail)}`);
        return;
      }

      const authenticatedAccount = login(response);
      navigate(getRoleLandingPath(authenticatedAccount), { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      const errorCode = err.response?.data?.code;

      // Fallback: kiểm tra code OTP_PENDING trong trường hợp lỗi (phòng khi BE trả về non-200)
      if (errorCode === 'OTP_PENDING' || errorMessage.includes('Hệ thống đang chuyển sang trang xác minh OTP')) {
        const redirectEmail = err.response?.data?.email || email.trim().toLowerCase();
        navigate(`/verify-otp?email=${encodeURIComponent(redirectEmail)}`);
        return;
      }

      // OTP đã hết hạn, tài khoản đã bị hủy -> Hiển thị lỗi và gợi ý đăng ký lại
      if (errorMessage.includes('Mã OTP đã hết hạn') || errorMessage.includes('tài khoản đã bị hủy')) {
        setError(errorMessage);
        setShowRegisterPrompt(true);
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
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-white/20">
        <div className="hidden lg:flex flex-col justify-between p-12 bg-orange-500 relative overflow-hidden text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="bg-white p-2 rounded-xl shadow-lg">
                <PawPrint className="w-8 h-8 text-orange-600" />
              </div>
              <span className="text-3xl font-black tracking-tight">PetGo</span>
            </div>

            <h1 className="text-5xl font-black leading-[1.1] mb-6">
              Welcome back to <br />
              <span className="text-orange-100">PetCare Paradise.</span>
            </h1>
            <p className="text-orange-50 text-xl font-medium max-w-md opacity-90 leading-relaxed">
              Managing your pet&apos;s happiness is just a few clicks away. Log in to access your dashboard and bookings.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Secure Authentication</p>
              <p className="text-xs font-medium opacity-70 italic whitespace-nowrap">Your data is protected with 128-bit encryption</p>
            </div>
          </div>

          <div className="absolute bottom-[-10%] right-[-5%] opacity-10">
            <PawPrint className="w-64 h-64 rotate-12" />
          </div>
        </div>

        <div className="flex flex-col p-8 sm:p-12 lg:p-16">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="lg:hidden flex items-center gap-2">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-gray-900">PetGo</span>
            </div>

            <Link
              to="/"
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-black text-orange-600 transition-all hover:border-orange-200 hover:bg-orange-100 hover:text-orange-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Về trang chủ
            </Link>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
              Sign In
            </h2>
            <p className="text-gray-500 font-medium">Please enter your details to login.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-900 ml-1 uppercase tracking-widest">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end mr-1">
                <label className="text-sm font-black text-gray-900 ml-1 uppercase tracking-widest">Password</label>
                <button type="button" onClick={openForgotPassword} className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">Forgot password?</button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-gray-900"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl font-black tracking-wide hover:bg-orange-500 transition-all disabled:opacity-60"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">Or</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="py-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-bold text-gray-700">
              <Facebook className="w-5 h-5" /> Facebook
            </button>
            <button className="py-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-bold text-gray-700">
              <Github className="w-5 h-5" /> Github
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 font-medium mt-8">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-black text-orange-600 hover:text-orange-700 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[2rem] border border-white/30 bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">PetGo Security</p>
                <h3 className="mt-2 text-2xl font-black text-gray-900">Quên mật khẩu?</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                  Nhập email đã đăng ký. Nếu email tồn tại trong hệ thống, PetGo sẽ gửi mã xác thực để bạn đặt lại mật khẩu.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgotPassword}
                disabled={isForgotLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-black text-gray-500 transition-all hover:bg-orange-50 hover:text-orange-600 disabled:opacity-60"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-widest text-gray-900">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-orange-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => handleForgotEmailChange(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isForgotLoading}
                    autoFocus
                    className="w-full rounded-2xl border-2 border-transparent bg-gray-50 py-4 pl-12 pr-4 font-medium text-gray-900 outline-none transition-all focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/5 disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              {forgotError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {forgotError}
                </div>
              )}

              {showRegisterPrompt ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleRetryForgotEmail}
                    className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black text-gray-700 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Nhập lại email
                  </button>
                  <button
                    type="button"
                    onClick={handleRegisterFromForgot}
                    className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition-all hover:bg-orange-600"
                  >
                    Đăng ký ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    disabled={isForgotLoading}
                    className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="rounded-2xl bg-gray-900 px-4 py-3 text-sm font-black text-white transition-all hover:bg-orange-500 disabled:opacity-60"
                  >
                    {isForgotLoading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
