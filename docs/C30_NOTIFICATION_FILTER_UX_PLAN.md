# C30 — Tinh gọn Push/Thông báo và bộ lọc mobile

Ngày đề xuất: 2026-09-13. Ngày phê duyệt: 2026-09-13. Ngày hoàn tất: 2026-09-13. Trạng thái: `COMPLETED`.

## Mục tiêu

- Biến nội dung nhắc lãi/quá hạn thành các dòng ngắn, quét nhanh trên màn hình khóa và trong app.
- Làm trạng thái chưa đọc rõ hơn nhưng vẫn truy cập được bằng nhãn/chỉ báo, không dựa vào màu đơn thuần.
- Chuẩn hóa control tìm kiếm/lọc theo cùng design token và khắc phục hai ô ngày chồng lấn trên mobile.
- Hiển thị các dialog form ở giữa màn hình; giữ lối thoát bằng nút `×`, Escape và chạm backdrop.

## Phạm vi triển khai

1. Thêm migration kế tiếp để `generate_due_notifications(date)` tạo body theo cấu trúc nhiều dòng:
   - Dòng 1: `{Đối tác} • {Số tiền gốc}`.
   - Dòng 2: `Giải ngân : DD/MM/YYYY`.
   - Dòng 3: `Số lãi phải thu : …` hoặc `Số lãi phải trả : …` cho nhắc lãi.
   - Notification quá hạn giữ số tiền authoritative phù hợp và thêm dòng
     `Quá hạn : {N} ngày`, tính từ ngày đáo hạn theo ngày nghiệp vụ.
   - Làm mới body của notification chưa đọc hiện hữu; không sửa notification đã đọc hoặc Push đã giao.
2. Cập nhật payload thông báo mẫu và tài liệu PWA theo cùng copy. Ký tự xuống dòng được gửi nguyên
   vẹn; hệ điều hành vẫn có quyền rút gọn hoặc tự wrap theo giới hạn của từng thiết bị.
3. Notification Center dùng trực tiếp body nhiều dòng, bỏ metadata tên khoản vay bị lặp và chỉ giữ
   ngày thông báo gọn. Card chưa đọc có nền đậm hơn card đã đọc, đồng thời giữ viền/nhãn `Mới`.
4. Chuẩn hóa control trong khu vực tìm kiếm/lọc và cài giờ thông báo: chiều cao hiển thị 44px,
   font mobile tối thiểu 16px, cùng radius/padding/focus ring; không thu nhỏ vùng chạm dưới 44px.
5. Dialog form dùng layout căn giữa cả mobile và desktop, giới hạn theo viewport/safe area. Riêng
   bộ lọc nâng cao khoản vay dùng một cột ở mobile để hai date input không chồng nhau; bỏ nút chữ
   `Đóng` phía dưới nhưng giữ nút `×`, Escape và backdrop.
6. Bổ sung regression test cho copy Push/DB, số ngày quá hạn, trạng thái đọc/chưa đọc, kích thước
   control, dialog căn giữa, date input không overlap và không tràn ngang ở mobile/landscape.

## Acceptance criteria

- Push nhắc lãi có đúng ba dòng; notification quá hạn có thêm dòng số ngày quá hạn chính xác.
- Nội dung trong tab Thông báo đồng nhất với Push và không lặp tên khoản vay ở footer.
- Chưa đọc/đã đọc phân biệt rõ trong light/dark mode, đạt contrast và không phụ thuộc riêng vào màu.
- Search/select/date/button thuộc bộ lọc có cùng chiều cao 44px; font input mobile không gây iOS zoom.
- Ở 320/375px và mobile landscape, hai ô ngày không overlap, dialog ở giữa, không có nút chữ `Đóng`
  phía dưới và không tràn ngang; keyboard focus/close behavior vẫn hoạt động.
- Không thay đổi engine tính lãi, API nghiệp vụ, routing, dữ liệu tài chính hoặc cơ chế idempotency.
- Đạt `git diff --check`, lint, typecheck, unit/script tests, build, Auth, E2E, DB lint và pgTAP.

## Ngoài phạm vi

- Không rollout Preview/Production, không migration remote và không thao tác dữ liệu thật.
- Không thay remote secret, Supabase/Google resources, Apps Script, Git remote hoặc Git push.

## Kết quả kiểm chứng

- `git diff --check`, lint, typecheck và production build: đạt.
- Unit/script: 74/74; Auth integration: 6/6; Playwright E2E: 21/21.
- Supabase DB lint: không có schema error; pgTAP: 444/444 trên database test cô lập, đủ 30 migration.
- E2E xác nhận nội dung Push ba dòng, notification quá hạn bốn dòng, màu nền đọc/chưa đọc khác nhau,
  control 44px, modal căn giữa, hai date input không overlap và không tràn ngang tại 320px, 375px
  cùng 812×375 landscape. Ảnh QA `/notifications` light/dark đã được xem lại.
- Chưa deploy hoặc áp migration lên Preview/Production; không thay dữ liệu thật hay tài nguyên remote.
