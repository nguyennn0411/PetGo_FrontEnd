import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import HomePage from './pages/HomePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import InvoicePage from './pages/InvoicePage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import ProfilePage from './pages/ProfilePage';
import AddPetPage from './pages/AddPetPage';
import WalletPage from './pages/WalletPage';
import MembershipPage from './pages/MembershipPage';
import MembershipPaymentPage from './pages/MembershipPaymentPage';
import AdminLayout from './components/AdminLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminServices from './pages/admin/AdminServices';
import AdminContent from './pages/admin/AdminContent';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminWallet from './pages/admin/AdminWallet';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminShopOrders from './pages/admin/AdminShopOrders';
import AdminChat from './pages/admin/AdminChat';
import AdminAreas from './pages/admin/AdminAreas';
import AdminBookings from './pages/admin/AdminBookings';
import AdminAllServices from './pages/admin/AdminAllServices';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReviews from './pages/admin/AdminReviews';
import ChatPage from './pages/ChatPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ShopHomePage from './pages/shop/ShopHomePage';
import ShopCatalogPage from './pages/shop/ShopCatalogPage';
import ShopProductDetailPage from './pages/shop/ShopProductDetailPage';
import CartPage from './pages/shop/CartPage';
import CheckoutPage from './pages/shop/CheckoutPage';
import ShopOrdersPage from './pages/shop/ShopOrdersPage';

import UserNav from './components/UserNav';
import AiChatWidget from './components/AiChatWidget';
import ChatWidget from './components/ChatWidget';
import AiGroomingPage from './pages/AiGroomingPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import FavoritesPage from './pages/FavoritesPage';

const withUserShell = (element, activePath = '') => (
  <div className='petgo-user-shell min-h-screen'>
    <UserNav activePath={activePath} />
    {element}
  </div>
);


export default function App() {
  const [activeChat, setActiveChat] = useState(null);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: 12, fontWeight: 600, fontSize: 13 } }} />
      <Routes>
        <Route path='/' element={withUserShell(<HomePage />, '/')} />

        <Route path='/payment' element={<Navigate to='/wallet' replace />} />
        <Route path='/payment/success' element={withUserShell(<PaymentSuccessPage />)} />
        <Route path='/payment/cancel' element={withUserShell(<PaymentCancelPage />)} />
        <Route path='/invoice' element={withUserShell(<InvoicePage />)} />

        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/verify-otp' element={<OtpVerificationPage />} />
        <Route path='/profile' element={withUserShell(<ProfilePage />, '/profile')} />
        <Route path='/notifications' element={withUserShell(<NotificationsPage />, '/notifications')} />
        <Route path='/wallet' element={withUserShell(<WalletPage />, '/wallet')} />
        <Route path='/add-pet' element={withUserShell(<AddPetPage />, '/profile')} />
        <Route path='/membership' element={withUserShell(<MembershipPage />, '/membership')} />
        <Route path='/membership-payment' element={withUserShell(<MembershipPaymentPage />, '/membership')} />
        <Route path='/chat' element={withUserShell(<ChatPage />, '/chat')} />
        <Route path='/chat/:conversationId' element={withUserShell(<ChatPage />, '/chat')} />
        <Route path='/booking' element={withUserShell(<BookingPage />, '/booking')} />
        <Route path='/my-bookings' element={withUserShell(<MyBookingsPage />, '/my-bookings')} />

        <Route path='/shop' element={withUserShell(<ShopHomePage />, '/shop')} />
        <Route path='/shop/category' element={withUserShell(<ShopCatalogPage />, '/shop')} />
        <Route path='/shop/product/:slug' element={withUserShell(<ShopProductDetailPage />, '/shop')} />
        <Route path='/cart' element={withUserShell(<CartPage />, '/shop')} />
        <Route path='/checkout' element={withUserShell(<CheckoutPage />, '/shop')} />
        <Route path='/my-orders' element={withUserShell(<ShopOrdersPage />, '/shop')} />


        {/* Admin Routes */}
        <Route path='/admin' element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path='dashboard' element={<AdminDashboard />} />
          <Route path='users' element={<AdminUsers />} />
          <Route path='vouchers' element={<AdminVouchers />} />
          <Route path='categories-services' element={<AdminServices />} />
          <Route path='content' element={<AdminContent />} />
          <Route path='notifications' element={<AdminNotifications />} />
          <Route path='wallet' element={<AdminWallet />} />
          <Route path='categories' element={<AdminCategories />} />
          <Route path='products' element={<AdminProducts />} />
          <Route path='shop-orders' element={<AdminShopOrders />} />
          <Route path='chat' element={<AdminChat />} />
          <Route path='reviews' element={<AdminReviews />} />
          <Route path='areas' element={<AdminAreas />} />
          <Route path='services' element={<AdminAllServices />} />
          <Route path='bookings' element={<AdminBookings />} />

        </Route>



        <Route path='/help-center' element={withUserShell(<HelpCenterPage />, '')} />

        <Route path='/home' element={<Navigate to='/' replace />} />
        <Route path="/ai-grooming" element={withUserShell(<AiGroomingPage />, '/ai-grooming')} />
        <Route path='/services' element={withUserShell(<ServicesPage />, '/services')} />
        <Route path='/services/:serviceId' element={withUserShell(<ServiceDetailPage />, '/services')} />
        <Route path='/favorites' element={withUserShell(<FavoritesPage />, '/favorites')} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
      <AiChatWidget open={activeChat === 'ai'} setOpen={(val) => setActiveChat(val ? 'ai' : null)} />
      <ChatWidget open={activeChat === 'support'} setOpen={(val) => setActiveChat(val ? 'support' : null)} />
    </BrowserRouter>
  );
}