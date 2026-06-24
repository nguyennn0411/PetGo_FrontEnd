import AdminLayout from '../../components/AdminLayout';

const AdminBookings = () => {
    return (
        <AdminLayout title="Quản lý booking toàn hệ thống">
            <div className="card mb-0">
                <h3>Quản lý booking</h3>
                <p className="text-tiny mb-0">
                    Trang admin bookings đang được khôi phục. Trước đó file này bị comment toàn bộ nên
                    không còn <code>export default</code>, làm Vite lỗi build và khiến ứng dụng trắng trang.
                </p>
            </div>
        </AdminLayout>
    );
};

export default AdminBookings;
