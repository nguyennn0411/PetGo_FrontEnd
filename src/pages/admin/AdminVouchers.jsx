import { useContext, useEffect } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import PromotionManager from '../../components/promotions/PromotionManager';
import {
  createAdminPromotion,
  deleteAdminPromotion,
  getAdminPromotionOptions,
  getAdminPromotions,
  updateAdminPromotion,
  updateAdminPromotionStatus,
} from '../../api/admin';

const AdminVouchers = () => {
  const setPageTitle = useContext(AdminTitleContext);
  useEffect(() => { setPageTitle('Quản lý khuyến mãi'); }, []);
  return (
    <PromotionManager
      loadPromotions={getAdminPromotions}
      loadOptions={getAdminPromotionOptions}
      createPromotion={createAdminPromotion}
      updatePromotion={updateAdminPromotion}
      updatePromotionStatus={updateAdminPromotionStatus}
      deletePromotion={deleteAdminPromotion}
    />
  );
};

export default AdminVouchers;
