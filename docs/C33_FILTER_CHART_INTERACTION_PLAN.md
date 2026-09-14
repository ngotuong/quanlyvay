# C33 — Bộ lọc ngày cân bằng và biểu đồ dòng tiền tương tác

Trạng thái: `COMPLETED`

Người dùng phê duyệt trực tiếp trong hội thoại ngày 2026-09-14.

## Phạm vi

- Đổi nhãn hai trường ngày trong bộ lọc nâng cao khoản vay thành `Từ` và `Đến`.
- Giữ hai trường ngày trên cùng một hàng ở mobile và desktop, có chiều rộng/chiều cao đồng đều,
  không chồng lấn hoặc làm tràn ngang ở viewport nhỏ.
- Giữ trường sắp xếp trên một hàng riêng để không làm giảm vùng thao tác của trường ngày.
- Cho phép xem số tiền chính xác của từng cột dòng tiền bằng tap/click và bàn phím, không phụ thuộc
  hover; tooltip phải nằm trọn trong vùng biểu đồ.
- Giữ bảng số liệu làm phương án truy cập thay thế và không thay đổi nghiệp vụ, API, dữ liệu,
  routing, migration hoặc tài nguyên remote.

## Acceptance criteria

1. Hai nhãn ngày là `Từ` và `Đến`; hai control ở cùng một hàng, bằng nhau trong sai số 2 px, cao ít
   nhất 44 px và cách nhau ít nhất 8 px tại viewport 320 px, 375 px và landscape.
2. Dialog vẫn căn giữa, đóng được bằng nút ×/Escape/backdrop và không gây tràn ngang trang.
3. Tap/click một cột tiền vào hoặc tiền ra làm tooltip tương ứng hiện ổn định; bấm lại đóng tooltip.
4. Mỗi cột có tên truy cập, trạng thái được công bố qua `aria-pressed`, hỗ trợ Tab/Enter/Space và có
   vùng chạm rộng tối thiểu 44 px.
5. Tooltip không vượt ra khỏi vùng nhìn của biểu đồ ở cột cao nhất; bảng số liệu vẫn hoạt động.
6. `git diff --check`, lint, typecheck, unit/script tests, build, Auth và E2E áp dụng cho C33 đều đạt.

## Ngoài phạm vi

- Deploy Preview/Production, migration hoặc thay dữ liệu/secret/tài nguyên remote.
- Thay công thức hoặc nguồn dữ liệu dòng tiền.

## Kết quả nghiệm thu

- Hai trường `Từ`/`Đến` dùng lưới hai cột bằng nhau, cùng hàng ở 320 px, 375 px và landscape;
  control cao 44 px, cách nhau 8 px, dialog căn giữa và không tràn ngang.
- Cột dòng tiền là control 44 px có trạng thái `aria-pressed`; tap/click và Enter/Space bật/tắt
  tooltip, Escape đóng trạng thái đang chọn. Tooltip bám theo chiều cao cột nhưng được giới hạn để
  luôn nằm trong vùng biểu đồ; hover/focus và bảng số liệu vẫn được giữ.
- Gate cuối ngày 2026-09-14: `git diff --check`, lint, typecheck, 74/74 unit/script tests, production
  build, Auth 6/6 và E2E 21/21 đều đạt. DB gate không chạy vì C33 không đổi database; Auth/E2E đã
  reset môi trường Supabase local cô lập đủ 30 migration.
- Không deploy, migration remote, thay dữ liệu tài chính, secret, Google resources hoặc Git remote.
