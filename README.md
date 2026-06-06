# PetGo Frontend - Bản ghép hoàn chỉnh theo tiến độ cuối

Đây là bản đã ghép từ toàn bộ các gói tiến độ bạn tải lên, theo thứ tự:
1. Function 2: Provider list / search / nearby
2. Function 3: Provider detail
3. Function 4: Pet CRUD (frontend phần Add/Edit pet + pets API)
4. Function 5: Booking create
5. Function 6: Payment + Invoice
6. Function 7: My bookings / detail / reschedule / cancel
7. Function 8: Favorites + Reviews
8. Function 9: Auth + Profile thật
9. Function 10: Membership thật

## Những gì tôi đã làm khi ghép
- Chọn bản nền function 2 + 3 để giữ các màn provider đã nối API thật.
- Chỉ lấy đúng phần cần thiết từ function 4 (`pets.js`, `AddPetPage.jsx`) để tránh ghi đè ngược các màn provider bằng bản mock cũ hơn.
- Áp các patch function 5 -> 10 theo đúng thứ tự.
- Sửa lại `src/App.jsx` để loại bỏ route trùng / import sai.
- Khôi phục `src/utils/providerHelpers.js` bản đầy đủ vì patch function 8 đã ghi đè bằng bản rút gọn, gây lỗi build.
- Thêm scaffold chạy độc lập: `package.json`, `vite.config.js`, `index.html`.

## Cách chạy
```bash
npm install
npm run dev
```

Backend mặc định được proxy sang:
- `http://localhost:8080`

Frontend gọi API qua:
- `/api/v1/...`

## Các nhóm chức năng đã nối backend thật
- Auth / profile
- Provider list / search / nearby / detail
- Pet create / update / detail
- Booking create
- Payment / invoice
- My bookings / detail / reschedule / cancel
- Favorites
- Reviews
- Membership / membership checkout

## Các màn vẫn giữ giao diện gốc do không có patch backend tương ứng trong các file bạn cung cấp
- `CompareProvidersPage.jsx`
- một số phần trình bày trong `HomePage.jsx`, `HelpCenterPage.jsx`

## Ghi chú
- Một vài màn vẫn giữ fallback `localStorage.petgo_user_id` để hỗ trợ test nhanh khi backend auth chưa hoàn chỉnh.
- `NearbyProvidersPage` dùng bản đồ mô phỏng vị trí marker, nhưng dữ liệu danh sách nearby lấy từ API thật.
