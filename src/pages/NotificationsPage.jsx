import React, { useContext } from 'react';
import { ArrowLeft, LogIn, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from '../components/NotificationCenter';
import { AuthContext } from '../context/AuthContext';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { account, loadingAccount } = useContext(AuthContext);

    if (loadingAccount) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black text-orange-500">Đang tải...</div>;
    }

    if (!account) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-lg w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-white text-center space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black mb-3">Bạn chưa đăng nhập</h1>
                        <p className="text-gray-500 font-medium">Đăng nhập để xem và đánh dấu đã đọc các thông báo của bạn.</p>
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
            

            <main className="max-w-5xl mx-auto px-4 mt-6">
                <NotificationCenter />
            </main>
        </div>
    );
};

export default NotificationsPage;