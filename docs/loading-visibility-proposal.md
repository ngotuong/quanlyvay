# Đề xuất checkpoint kế tiếp — Giữ loading nhìn thấy tới khi nội dung sẵn sàng

Trạng thái: `NOT_STARTED`; chưa được phê duyệt và chưa triển khai. Tài liệu này ghi nhận vấn đề
ngoài phạm vi C100 sau khi OWNER báo loading biến mất khi mở app và chuyển mục trên mobile/desktop.

## Chẩn đoán đã xác minh

- Root Auth fallback, route `loading.tsx`, skeleton và navigation feedback vẫn tồn tại; E2E C87/C97
  có delay kiểm soát vẫn thấy và đạt.
- Trên Production, khi mở Tổng quan, navigation feedback bị xoá ngay lúc URL đổi, trong khi route
  skeleton vẫn còn và dữ liệu thật chưa sẵn sàng. Khoảng trống này làm người dùng thấy trang cũ
  hoặc chuyển thẳng sang trang mới mà không nhận biết trạng thái chờ.
- Ảnh `apple-touch-startup-image` chỉ do iOS chọn ở cold launch. Warm resume có thể dùng snapshot
  hệ điều hành và bỏ qua ảnh; desktop không dùng startup image này.
- Suspense root có thể resolve trước lần paint đầu tiên. Test delay chứng minh fallback hoạt động,
  nhưng không bảo đảm mọi reload bình thường sẽ vẽ đủ lâu để mắt nhận ra.

## Phạm vi đề xuất

1. Giữ navigation feedback cho tới khi target route đã commit và vùng `.content-loading` kết thúc;
   chuyển việc clear state ra effect, tránh cập nhật state trong render.
2. Áp thời gian hiển thị tối thiểu ngắn, dự kiến 450–600 ms, chỉ sau khi navigation thực sự bắt đầu;
   không trì hoãn dữ liệu, không dùng animation để tuyên bố tăng tốc.
3. Với document boot, dùng overlay cùng token/component hiện có và tự gỡ sau hydration/ready với
   minimum-visible time; giữ no-JS, reduced-motion, theme, Auth privacy và iOS launch image hiện tại.
4. Kiểm cold/warm, click/Back/Forward/cancel/error, dirty draft, mobile/desktop, light/dark và
   screen reader status. Đo feedback onset, thời gian nội dung sẵn sàng và tổng latency riêng.

Checkpoint này không thay RPC/schema/financial engine, không cache HTML tài chính và không che lỗi
bằng spinner vô hạn. Chỉ được triển khai sau khi C100 hoàn tất và OWNER phê duyệt riêng.
