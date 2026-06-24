import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminProtectedRoute = ({ children }) => {
  const { account, loadingAccount } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (loadingAccount) return;
    if (!account) {
      navigate('/login', { replace: true });
      return;
    }
    const roles = account.roles || [];
    const isAdmin = roles.some((r) => String(r).toUpperCase() === 'ADMIN');
    if (!isAdmin) {
      navigate('/login', { replace: true });
    }
  }, [account, loadingAccount, navigate]);

  if (loadingAccount) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-500">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (!account) return null;

  const roles = account.roles || [];
  const isAdmin = roles.some((r) => String(r).toUpperCase() === 'ADMIN');
  if (!isAdmin) return null;

  return children;
};

export default AdminProtectedRoute;
