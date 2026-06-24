import React from 'react';
import PartnerLayout from '../../components/partner/PartnerLayout';
import PromotionManager from '../../components/promotions/PromotionManager';
import {
    createPartnerPromotion,
    getPartnerPromotionOptions,
    getPartnerPromotions,
    updatePartnerPromotion,
    updatePartnerPromotionStatus,
} from '../../api/partner';

const PartnerPromotionsPage = () => (
    <PartnerLayout title="Khuyến mãi" subtitle="Tạo mã ưu đãi riêng cho dịch vụ của bạn">
        <PromotionManager
            partnerMode
            loadPromotions={getPartnerPromotions}
            loadOptions={getPartnerPromotionOptions}
            createPromotion={createPartnerPromotion}
            updatePromotion={updatePartnerPromotion}
            updatePromotionStatus={updatePartnerPromotionStatus}
        />
    </PartnerLayout>
);

export default PartnerPromotionsPage;