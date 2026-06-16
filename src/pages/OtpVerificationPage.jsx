import {
  Eye,
  EyeOff,
  Lock,
  PawPrint,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { forgotPasswordRequest, resetPasswordRequest, verifyOtpRequest, resendOtpRequest } from '../api/auth';

const OtpVerificationPage = () => {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from query params or state
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || location.state?.email || '';
  const purpose = queryParams.get('purpose') || location.state?.purpose || 'verify-email';
  const isPasswordReset = purpose === 'forgot-password';

  useEffect(() => {
    if (!email) {
      setError(isPasswordReset ? 'Không tìm thấy thông tin email. Vui lòng quay lại trang đăng nhập.' : 'Không tìm thấy thông tin email. Vui lòng quay lại trang đăng ký.');
    }
  }, [email, isPasswordReset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otpCode.length !== 6) {
      setError('Mã OTP phải có 6 chữ số.');
      return;
    }

    if (isPasswordReset) {
      if (newPassword.length < 6) {
        setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isPasswordReset) {
        await resetPasswordRequest({
          email,
          otpCode,
          newPassword,
        });
        setSuccess('Đặt lại mật khẩu thành công! Đang chuyển sang trang đăng nhập...');
      } else {
        await verifyOtpRequest({
          email,
          otpCode,
        });
        setSuccess('Xác thực thành công! Đang chuyển sang trang đăng nhập...');
      }
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || (isPasswordReset ? 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.' : 'Xác thực thất bại. Vui lòng kiểm tra lại mã OTP.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;

    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      if (isPasswordReset) {
        // Gửi lại OTP đặt lại mật khẩu
        await forgotPasswordRequest({ email });
      } else {
        // Gửi lại OTP xác minh email đăng ký
        await resendOtpRequest(email);
      }
      setSuccess('Mã xác thực mới đã được gửi đến email của bạn.');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã xác thực. Vui lòng thử lại.');
    } finally {
      setIsResending(false);
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
              {isPasswordReset ? (
                <>
                  Reset your <br />
                  <span className="text-orange-500">PetGo password.</span>
                </>
              ) : (
                <>
                  One more step <br />
                  <span className="text-orange-500">to get started.</span>
                </>
              )}
            </h1>
            <p className="text-gray-400 text-xl font-medium max-w-md leading-relaxed">
              {isPasswordReset ? 'Enter the reset code from your email and choose a new secure password.' : 'Verify your email address to ensure your account is secure and active.'}
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
              <ShieldCheck className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-black">Secure Verification</p>
              <p className="text-gray-400 font-medium italic">Your data is safe with us</p>
            </div>
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
            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{isPasswordReset ? 'Reset Password' : 'Verify Email'}</h2>
            <p className="text-gray-500 font-medium">We've sent a 6-digit code to <span className="text-gray-900 font-bold">{email || 'your email'}</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-900 ml-1 uppercase tracking-widest">Enter OTP Code</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                  <Smartphone className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  maxLength="6"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-black text-2xl tracking-[0.5em] text-center text-gray-900"
                  required
                />
              </div>
            </div>

            {isPasswordReset && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-900 ml-1 uppercase tracking-widest">New Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength="6"
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-gray-900"
                      required={isPasswordReset}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-900 ml-1 uppercase tracking-widest">Confirm</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength="6"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-orange-500/30 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all font-medium text-gray-900"
                      required={isPasswordReset}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}
            {success && <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-600">{success}</div>}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-orange-500 transition-all disabled:opacity-60 shadow-xl shadow-gray-200 hover:shadow-orange-200"
            >
              {isLoading ? (isPasswordReset ? 'Resetting...' : 'Verifying...') : (isPasswordReset ? 'Reset Password' : 'Verify & Continue')}
            </button>

            <div className="flex items-center justify-between px-2 pt-2">
              <button
                type="button"
                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => navigate(isPasswordReset ? '/login' : '/register')}
              >
                Change Email
              </button>
              <button
                type="button"
                className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors disabled:cursor-not-allowed disabled:text-gray-300"
                disabled={!isPasswordReset || isResending || isLoading || !email}
                onClick={handleResendCode}
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 font-medium mt-auto pt-8">
            Remember your password?{' '}
            <Link to="/login" className="font-black text-orange-600 hover:text-orange-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
