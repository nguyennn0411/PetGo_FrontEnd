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

import MembershipPage from './pages/MembershipPage';
import MembershipPaymentPage from './pages/MembershipPaymentPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPartners from './pages/admin/AdminPartners';
import AdminBookings from './pages/admin/AdminBookings';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminServices from './pages/admin/AdminServices';
import AdminPartnerServiceRequests from './pages/admin/AdminPartnerServiceRequests';
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
import PartnerShopRegistrationPage from './pages/PartnerShopRegistrationPage';
import PartnerDashboardPage from './pages/partner/PartnerDashboardPage';
import PartnerProfilePage from './pages/partner/PartnerProfilePage';
import PartnerServicesPage from './pages/partner/PartnerServicesPage';
import PartnerSchedulePage from './pages/partner/PartnerSchedulePage';
import PartnerBookingsPage from './pages/partner/PartnerBookingsPage';
import PartnerBookingDetailPage from './pages/partner/PartnerBookingDetailPage';
import PartnerCustomersPage from './pages/partner/PartnerCustomersPage';
import PartnerPromotionsPage from './pages/partner/PartnerPromotionsPage';
import PartnerRevenuePage from './pages/partner/PartnerRevenuePage';
import PartnerReviewsPage from './pages/partner/PartnerReviewsPage';
import PartnerNotificationsPage from './pages/partner/PartnerNotificationsPage';
import PartnerPlaceholderPage from './pages/partner/PartnerPlaceholderPage';
import OwnerNav from './components/OwnerNav';

const withOwnerShell = (element, activePath = '') => (
  <div className='petgo-owner-shell min-h-screen'>
    <OwnerNav activePath={activePath} />
    {element}
  </div>
);


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={withOwnerShell(<HomePage />, '/')} />

        <Route path='/providers' element={withOwnerShell(<ProviderListPage />, '/search')} />
        <Route path='/providers/:id' element={withOwnerShell(<ProviderDetailPage />, '/search')} />
        <Route path='/search' element={withOwnerShell(<SearchFilterPage />, '/search')} />
        <Route path='/compare' element={withOwnerShell(<CompareProvidersPage />, '/search')} />
        <Route path='/nearby' element={withOwnerShell(<NearbyProvidersPage />, '/search')} />
        <Route path='/favorites' element={withOwnerShell(<FavoritesPage />, '/favorites')} />

        <Route path='/booking' element={<BookingPage />} />
        <Route path='/payment' element={<PaymentPage />} />
        <Route path='/payment/success' element={<PaymentSuccessPage />} />
        <Route path='/payment/cancel' element={<PaymentCancelPage />} />
        <Route path='/booking-success' element={<BookingSuccessPage />} />
        <Route path='/invoice' element={<InvoicePage />} />

        <Route path='/my-bookings' element={withOwnerShell(<MyBookingsPage />, '/my-bookings')} />
        <Route path='/bookings/:id' element={withOwnerShell(<BookingDetailPage />, '/my-bookings')} />
        <Route path='/reschedule/:id' element={withOwnerShell(<RescheduleBookingPage />, '/my-bookings')} />
        <Route path='/cancel-booking/:id' element={withOwnerShell(<CancelBookingPage />, '/my-bookings')} />
        <Route path='/reviews/create/:bookingId' element={withOwnerShell(<ReviewPage />, '/my-bookings')} />

        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/verify-otp' element={<OtpVerificationPage />} />
        <Route path='/profile' element={withOwnerShell(<ProfilePage />, '/profile')} />
        <Route path='/add-pet' element={withOwnerShell(<AddPetPage />, '/profile')} />

        <Route path='/membership' element={withOwnerShell(<MembershipPage />, '/membership')} />
        <Route path='/membership-payment' element={withOwnerShell(<MembershipPaymentPage />, '/membership')} />

        <Route path='/shop' element={withOwnerShell(<ShopHomePage />, '/shop')} />
        <Route path='/shop/category' element={withOwnerShell(<ShopCatalogPage />, '/shop')} />
        <Route path='/shop/product/:slug' element={withOwnerShell(<ShopProductDetailPage />, '/shop')} />
        <Route path='/cart' element={withOwnerShell(<CartPage />, '/shop')} />
        <Route path='/checkout' element={withOwnerShell(<CheckoutPage />, '/shop')} />
        <Route path='/my-orders' element={withOwnerShell(<ShopOrdersPage />, '/shop')} />


        {/* Admin Routes */}
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
        <Route path='/admin/users' element={<AdminUsers />} />
        <Route path='/admin/partners' element={<AdminPartners />} />
        <Route path='/admin/bookings' element={<AdminBookings />} />
        <Route path='/admin/vouchers' element={<AdminVouchers />} />
        <Route path='/admin/services' element={<AdminServices />} />
        <Route path='/admin/partner-service-requests' element={<AdminPartnerServiceRequests />} />
        <Route path='/admin/reviews' element={<AdminReviews />} />
        <Route path='/admin/content' element={<AdminContent />} />
        <Route path='/admin/notifications' element={<AdminNotifications />} />
        <Route path='/admin/logs' element={<AdminLogs />} />
        <Route path='/admin/reports' element={<AdminReports />} />
        <Route path='/admin/products' element={<AdminProducts />} />
        <Route path='/admin/shop-orders' element={<AdminShopOrders />} />

        {/* Partner Routes */}
        <Route path='/partner-registration/shop' element={<PartnerShopRegistrationPage />} />
        <Route path='/partner' element={<Navigate to='/partner/dashboard' replace />} />
        <Route path='/partner/dashboard' element={<PartnerDashboardPage />} />
        <Route path='/partner/profile' element={<PartnerProfilePage />} />
        <Route path='/partner/services' element={<PartnerServicesPage />} />
        <Route path='/partner/schedule' element={<PartnerSchedulePage />} />
        <Route path='/partner/bookings' element={<PartnerBookingsPage />} />
        <Route path='/partner/bookings/:id' element={<PartnerBookingDetailPage />} />
        <Route path='/partner/customers' element={<PartnerCustomersPage />} />
        <Route path='/partner/promotions' element={<PartnerPromotionsPage />} />
        <Route path='/partner/revenue' element={<PartnerRevenuePage />} />
        <Route path='/partner/reviews' element={<PartnerReviewsPage />} />
        <Route path='/partner/notifications' element={<PartnerNotificationsPage />} />
        <Route path='/partner/support' element={<PartnerPlaceholderPage type='support' />} />

        <Route path='/help-center' element={withOwnerShell(<HelpCenterPage />, '')} />

        <Route path='/home' element={<Navigate to='/' replace />} />
        <Route path='/services' element={<Navigate to='/' replace />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
}
