import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import HomePage from './pages/HomePage';
import ProviderListPage from './pages/ProviderListPage';
import SearchFilterPage from './pages/SearchFilterPage';
import CompareProvidersPage from './pages/CompareProvidersPage';
import ProviderDetailPage from './pages/ProviderDetailPage';
import NearbyProvidersPage from './pages/NearbyProvidersPage';
import FavoritesPage from './pages/FavoritesPage';

import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import InvoicePage from './pages/InvoicePage';

import MyBookingsPage from './pages/MyBookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import RescheduleBookingPage from './pages/RescheduleBookingPage';
import CancelBookingPage from './pages/CancelBookingPage';
import ReviewPage from './pages/ReviewPage';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ProfilePage from './pages/ProfilePage';
import AddPetPage from './pages/AddPetPage';
import WalletPage from './pages/WalletPage';
import ChatPage from './pages/ChatPage';

import MembershipPage from './pages/MembershipPage';
import MembershipPaymentPage from './pages/MembershipPaymentPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPartners from './pages/admin/AdminPartners';
import AdminBookings from './pages/admin/AdminBookings';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminServices from './pages/admin/AdminServices';
import AdminReviews from './pages/admin/AdminReviews';
import AdminContent from './pages/admin/AdminContent';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminLogs from './pages/admin/AdminLogs';
import AdminReports from './pages/admin/AdminReports';
import HelpCenterPage from './pages/HelpCenterPage';
import ShopHomePage from './pages/shop/ShopHomePage';
import ShopCatalogPage from './pages/shop/ShopCatalogPage';
import ShopProductDetailPage from './pages/shop/ShopProductDetailPage';
import CartPage from './pages/shop/CartPage';
import CheckoutPage from './pages/shop/CheckoutPage';
import ShopOrdersPage from './pages/shop/ShopOrdersPage';
import AdminProducts from './pages/admin/AdminProducts';
import AdminShopOrders from './pages/admin/AdminShopOrders';
import AiChatWidget from './components/AiChatWidget';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />

        <Route path='/providers' element={<ProviderListPage />} />
        <Route path='/providers/:id' element={<ProviderDetailPage />} />
        <Route path='/search' element={<SearchFilterPage />} />
        <Route path='/compare' element={<CompareProvidersPage />} />
        <Route path='/nearby' element={<NearbyProvidersPage />} />
        <Route path='/favorites' element={<FavoritesPage />} />

        <Route path='/booking' element={<BookingPage />} />
        <Route path='/payment' element={<PaymentPage />} />
        <Route path='/payment/success' element={<PaymentSuccessPage />} />
        <Route path='/payment/cancel' element={<PaymentCancelPage />} />
        <Route path='/booking-success' element={<BookingSuccessPage />} />
        <Route path='/invoice' element={<InvoicePage />} />

        <Route path='/my-bookings' element={<MyBookingsPage />} />
        <Route path='/bookings/:id' element={<BookingDetailPage />} />
        <Route path='/reschedule/:id' element={<RescheduleBookingPage />} />
        <Route path='/cancel-booking/:id' element={<CancelBookingPage />} />
        <Route path='/reviews/create/:bookingId' element={<ReviewPage />} />

        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/verify-otp' element={<OtpVerificationPage />} />
        <Route path='/profile' element={withUserShell(<ProfilePage />, '/profile')} />
        <Route path='/wallet' element={withUserShell(<WalletPage />, '/wallet')} />
        <Route path='/add-pet' element={withUserShell(<AddPetPage />, '/profile')} />
        <Route path='/chat' element={withUserShell(<ChatPage />, '')} />
        <Route path='/chat/:conversationId' element={withUserShell(<ChatPage />, '')} />

        <Route path='/membership' element={<MembershipPage />} />
        <Route path='/membership-payment' element={<MembershipPaymentPage />} />

        <Route path='/shop' element={<ShopHomePage />} />
        <Route path='/shop/category' element={<ShopCatalogPage />} />
        <Route path='/shop/product/:slug' element={<ShopProductDetailPage />} />
        <Route path='/cart' element={<CartPage />} />
        <Route path='/checkout' element={<CheckoutPage />} />
        <Route path='/my-orders' element={<ShopOrdersPage />} />


        {/* Admin Routes */}
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
        <Route path='/admin/users' element={<AdminUsers />} />
        <Route path='/admin/partners' element={<AdminPartners />} />
        <Route path='/admin/bookings' element={<AdminBookings />} />
        <Route path='/admin/vouchers' element={<AdminVouchers />} />
        <Route path='/admin/services' element={<AdminServices />} />
        <Route path='/admin/reviews' element={<AdminReviews />} />
        <Route path='/admin/content' element={<AdminContent />} />
        <Route path='/admin/notifications' element={<AdminNotifications />} />
        <Route path='/admin/logs' element={<AdminLogs />} />
        <Route path='/admin/reports' element={<AdminReports />} />
        <Route path='/admin/products' element={<AdminProducts />} />
        <Route path='/admin/shop-orders' element={<AdminShopOrders />} />

        <Route path='/help-center' element={<HelpCenterPage />} />

        <Route path='/home' element={<Navigate to='/' replace />} />
        <Route path='/services' element={<Navigate to='/search' replace />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
        <AiChatWidget />
    </BrowserRouter>
  );
}
