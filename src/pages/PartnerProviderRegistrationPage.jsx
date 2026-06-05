import React, { useContext } from 'react';
import { ArrowLeft, Home, ShieldCheck, Store } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import PartnerRegistrationPanel from '../components/registration/PartnerRegistrationPanel';
import { AuthContext } from '../context/AuthContext';

const PartnerProviderRegistrationPage = () => {
    const navigate = useNavigate();
    const { account, loadingAccount } = useContext(AuthContext);

    if (loadingAccount) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            </div>
        );
    }

    if (!account) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-16">
            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <button
                        type="button"
                        onClick={() => navigate('/profile?tab=partner-registration')}
                        className="group rounded-full p-2 transition-colors hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600 group-hover:text-orange-500" />
                    </button>
                    <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white">P</span>
                        PetGo
                    </Link>
                    <Link to="/" className="rounded-full p-2 transition-colors hover:bg-gray-100">
                        <Home className="h-6 w-6 text-gray-600" />
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
                <section className="mb-6 overflow-hidden rounded-[2.5rem] border border-white bg-white shadow-xl shadow-gray-200/50">
                    <div className="relative p-8 sm:p-10">
                        <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-[4rem] bg-orange-50" />
                        <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:justify-center lg:items-center">
                            <div className="max-w-2xl space-y-4 text-center">
                                <div>
                                    <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                                        Đăng ký trở thành đối tác PetGo
                                    </h1>
                                </div>
                            </div>
                            <div className="rounded-[2rem] border border-green-100 bg-green-50 px-5 py-4 text-green-700">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-6 w-6 shrink-0" />
                                    <div>
                                        <p className="font-black">Xét duyệt nhanh</p>
                                        <p className="text-sm font-semibold text-green-600">Thông tin của bạn sẽ được xét duyệt trong 1-2 ngày</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <PartnerRegistrationPanel account={account} />
            </main>
        </div>
    );
};

export default PartnerProviderRegistrationPage;
