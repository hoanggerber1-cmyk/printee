# TÀI LIỆU BÀN GIAO DỰ ÁN (HANDOVER.md)
**DỰ ÁN:** PRINTEE - High-end Custom T-Shirt Studio Management System
**NGÀY CẬP NHẬT:** 26/05/2026
**TRẠNG THÁI:** Phase 1, 2, 3 Hoàn thành ổn định • Đã ngắt hoàn toàn dữ liệu giả • Kết nối 100% Real Supabase Production

---

## 1. TỔNG QUAN HỆ THỐNG & CÔNG NGHỆ (TECH STACK)
Hệ thống PRINTEE là nền tảng quản lý cửa hàng phôi áo thun cao cấp và tiếp nhận thiết kế in ấn custom trực tiếp qua màng PET DTF 12 màu hạt mực siêu mịn.

* **Frontend Giao diện:** React 19, Vite (v6), TypeScript (~v5.8).
* **Styling & UI:** Tailwind CSS v4, Lucide React (Hệ thống Icon), Framer Motion (Hiệu ứng chuyển trang mượt mà qua `AnimatePresence`).
* **Backend & Cơ sở dữ liệu:** Real Supabase Cloud Platform (`@supabase/supabase-js`).
* **Cơ chế lưu trữ File:** Supabase Storage Buckets (`banners`, `products`, `albums`, `design-files`, `site-assets`).

---

## 2. KIẾN TRÚC THƯ MỤC & FILE CỐT LÕI
* `src/types.ts`: Khai báo toàn bộ cấu trúc dữ liệu (Interfaces) khớp 1-1 với kiểu trả về của database. Bao gồm cả `SiteSettings`.
* `src/supabaseClient.ts`: Đầu mối kết nối Supabase duy nhất. Đã loại bỏ triệt để LocalStorage và mảng dữ liệu giả (`DEFAULT_PRODUCTS`, `DEFAULT_BANNERS`...).
* `src/pages/AdminDashboard.tsx`: Cổng thông tin quản trị Admin. Đã hoàn thiện Tab "Cài đặt Website" (Cho phép Upload Logo/Favicon và cập nhật toàn bộ thông tin công ty).
* `src/components/Header.tsx` & `Footer.tsx`: Đã gỡ bỏ toàn bộ text fix cứng (hard-coded), chuyển sang chế độ đọc dữ liệu động 100% từ bảng `site_settings`.
* `supabase-setup.sql`: Chứa script SQL để khởi tạo bảng và thiết lập bảo mật RLS chuẩn Production (Admin có toàn quyền CRUD, Khách chỉ được xem và tạo Đơn hàng).

---

## 3. SCHEMA CƠ SỞ DỮ LIỆU CHÍNH THỨC (SUPABASE TABLES)
Hệ thống vận hành tổng cộng 11 bảng dữ liệu quan hệ chặt chẽ:
1.  **`site_settings`:** Lưu tên thương hiệu, hotline, zalo, email, mạng xã hội, logo, văn bản footer.
2.  **`web_cms`:** Lưu nội dung trang chủ (About, Quy trình...).
3.  **`categories`:** Danh mục phôi áo.
4.  **`products`:** Kho phôi áo thun chi tiết.
5.  **`banners`:** Quản lý ảnh trượt trang chủ.
6.  **`albums` & `album_images`:** Sách ảnh Lookbook thời trang.
7.  **`custom_orders`:** Đơn đặt in custom của khách.
8.  **`customers`:** Khách hàng.
9.  **`admin_users`:** Quản trị viên hệ thống.
10. **`media_library`:** Thư viện tệp ảnh.

---

## 4. CÁC CÔNG VIỆC ĐÃ HOÀN THÀNH (MILESTONES)
* **Khắc phục lỗi hỏng Build:** Sửa dứt điểm lỗi Regex `generateSlug` trong `AdminDashboard.tsx`.
* **Loại bỏ dữ liệu giả:** Ngắt toàn bộ LocalStorage, hệ thống giờ đọc/ghi 100% qua Supabase API.
* **Header & Footer Động:** Toàn bộ nội dung chân trang và thanh điều hướng đều lấy từ CSDL.
* **Quản trị Cấu hình (Site Settings):** Admin có thể thay đổi Slogan, Hotline, Địa chỉ, MXH và Upload Logo trực tiếp.
* **Bảo mật RLS:** Đã thiết lập Policy chặn ghi trái phép, chỉ cấp quyền cho Admin thao tác CRUD.

---

## 5. DANH SÁCH VIỆC CẦN LÀM TIẾP THEO (TODO LIST)
1.  **Chuyển đổi xác thực sang Supabase Auth:** Nâng cấp hệ thống Login hiện tại (đang dùng email thuần) sang hệ thống Auth bảo mật (mã hóa mật khẩu bằng JWT) của Supabase.
2.  **Trang Tự Thiết Kế (`CustomOrder.tsx`):** Hoàn thiện quy trình tải file artwork (PNG/SVG) của khách lên bucket `design-files` và tự động sinh đơn hàng vào bảng `custom_orders`.
3.  **Tối ưu Upload Đa Ảnh:** Nâng cấp form thêm Sản phẩm để cho phép tải lên nhiều ảnh phụ cùng lúc.