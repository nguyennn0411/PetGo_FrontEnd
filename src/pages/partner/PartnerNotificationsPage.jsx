import React from 'react';
import NotificationCenter from '../../components/NotificationCenter';
import PartnerLayout from '../../components/partner/PartnerLayout';

const PartnerNotificationsPage = () => (
    <PartnerLayout title="Thông báo" subtitle="Nhận thông báo vận hành từ PetGo">
        <NotificationCenter />
    </PartnerLayout>
);

export default PartnerNotificationsPage;