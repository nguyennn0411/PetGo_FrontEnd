import { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { canAccessPartnerArea } from '../../utils/partnerAccess';
import { getPartnerProfile } from '../../api/partner';
import { PartnerLoadingState } from './PartnerStates';
import DashboardLayout from '../DashboardLayout';
import PartnerSidebar from '../sidebars/PartnerSidebar';

/**
 * PartnerLayout — Wrapper layout cho các trang Partner.
 *
 * Bên trong sử dụng DashboardLayout (shared) + PartnerSidebar.
 * Giữ nguyên logic auth guard (kiểm tra role, redirect nếu chưa đăng ký partner).
 */
const PartnerLayout = ({
  children,
  title = 'Partner Dashboard',
  subtitle = 'Quản lý nhà cung cấp và vận hành booking của bạn',
  providerName,
}) => {
  const { account, loadingAccount } = useContext(AuthContext);
  const [remoteProviderName, setRemoteProviderName] = useState(null);

  /* ── Fetch tên provider nếu chưa được truyền qua props ── */
  useEffect(() => {
    if (providerName || loadingAccount || !account) return undefined;

    let isMounted = true;
    getPartnerProfile()
      .then((profile) => {
        if (!isMounted) return;
        setRemoteProviderName(profile?.businessName || profile?.providerName || null);
      })
      .catch(() => {
        if (!isMounted) return;
        setRemoteProviderName(null);
      });

    return () => {
      isMounted = false;
    };
  }, [providerName, loadingAccount, account]);

  /* ── Auth guards ── */
  if (loadingAccount) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <PartnerLoadingState />
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPartnerArea(account)) {
    return <Navigate to="/partner-registration/provider" replace />;
  }

  /* ── Resolve tên hiển thị ── */
  const resolvedName =
    providerName ||
    remoteProviderName ||
    account?.businessName ||
    account?.providerName ||
    account?.fullName ||
    account?.name ||
    'Partner';

  return (
    <DashboardLayout
      SidebarComponent={PartnerSidebar}
      brandLabel="Partner"
      title={title}
      subtitle={subtitle}
      displayName={resolvedName}
      roleLabel="Verified provider"
      scrollKey="partner_sidebar_scroll_top"
    >
      {children}
    </DashboardLayout>
  );
};

export default PartnerLayout;