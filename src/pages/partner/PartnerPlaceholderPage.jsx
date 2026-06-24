import React from 'react';
import { Construction } from 'lucide-react';
import PartnerLayout from '../../components/partner/PartnerLayout';

const descriptions = {
    customers: 'Danh sách khách hàng và thú cưng từng sử dụng dịch vụ sẽ được triển khai sau khi chốt phạm vi dữ liệu được phép hiển thị.',
    revenue: 'Doanh thu, invoice và payment sẽ được mở rộng trong phase tài chính.',
    reviews: 'Review list/reply/report sẽ được triển khai sau khi chốt rule partner phản hồi review.',
    notifications: 'Notification center sẽ được triển khai sau khi chốt polling/email/realtime.',
    support: 'Support ticket sẽ được triển khai sau khi chốt scope hỗ trợ/khiếu nại.',
};

const titles = {
    customers: 'Khách hàng',
    revenue: 'Doanh thu',
    reviews: 'Đánh giá',
    notifications: 'Thông báo',
    support: 'Hỗ trợ',
};

const PartnerPlaceholderPage = ({ type }) => (
    <PartnerLayout title={titles[type] || 'Partner'} subtitle="Module phase sau">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 rounded-[2rem] bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-6">
                <Construction className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black mb-3">Đang phát triển</h2>
            <p className="text-gray-500 font-semibold max-w-xl mx-auto">{descriptions[type] || 'Module này sẽ được triển khai trong phase tiếp theo.'}</p>
        </div>
    </PartnerLayout>
);

export default PartnerPlaceholderPage;