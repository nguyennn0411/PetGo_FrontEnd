import AdminLayout from '../../components/AdminLayout';
import PromotionManager from '../../components/promotions/PromotionManager';
import {
  createAdminPromotion,
  getAdminPromotionOptions,
  getAdminPromotions,
  updateAdminPromotion,
  updateAdminPromotionStatus,
} from '../../api/admin';

const AdminVouchers = () => {
  return (
    <AdminLayout title="Quản lý khuyến mãi">
      <PromotionManager
        loadPromotions={getAdminPromotions}
        loadOptions={getAdminPromotionOptions}
        createPromotion={createAdminPromotion}
        updatePromotion={updateAdminPromotion}
        updatePromotionStatus={updateAdminPromotionStatus}
      />
    </AdminLayout>
  );
};

export default AdminVouchers;
