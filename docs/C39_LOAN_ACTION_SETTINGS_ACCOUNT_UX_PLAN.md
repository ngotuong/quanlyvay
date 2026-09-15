# C39 — Tái cấu trúc thao tác khoản vay, Thiết lập và quản trị tài khoản

Trạng thái: `COMPLETED` ngày 2026-09-15

Yêu cầu đầu vào: người dùng yêu cầu và phê duyệt trực tiếp ngày 2026-09-15; đồng thời cho phép tạm
hoãn C38 để ưu tiên hoàn tất checkpoint này.

## Vấn đề đã xác nhận

1. Nghiệp vụ tất toán đang nằm trong `LoanActions` ở tab **Thiết lập**, cách xa nơi người dùng thao
   tác khoản vay hằng ngày.
2. `listManagedProfiles()` tải toàn bộ `profiles`; `UserManagement` chỉ loại OWNER hiện tại nên cả
   30 tài khoản kỹ thuật đã vô hiệu hóa/ban vẫn được render thành nhiều card. Đây là vấn đề hiển thị;
   dữ liệu hiện hành vẫn chỉ có một OWNER hoạt động.
3. Tab **Thiết lập** trộn thông tin khoản vay, chi phí, thay đổi lãi suất/trạng thái, nhập số dư cũ,
   sửa sai và hoàn tác tất toán ở cùng cấp, làm mất thứ bậc và khó hiểu mục đích từng nghiệp vụ.

## Phạm vi triển khai

### 1. Hành động chính tại Tổng quan

- Với khoản vay chưa tất toán và người có quyền ghi, đặt hai nút cạnh nhau: **Ghi giao dịch** là
  hành động chính và **Tất toán** là nút danger màu đỏ có icon cùng nhãn văn bản.
- Nút **Tất toán** mở dialog/BottomSheet riêng, hiển thị ngày, preview gốc/lãi/tổng và bước xác nhận
  hiện có; không thay đổi Server Action/RPC hay quy tắc tính tiền authoritative.
- Trên mobile hai nút giữ touch target tối thiểu 44px, không tràn ngang; nút danger không chỉ truyền
  đạt ý nghĩa bằng màu.
- Gỡ form tất toán khỏi tab **Thiết lập**. Khoản đã `SETTLED` không hiện hai nút này và vẫn giữ luồng
  hoàn tác tất toán hợp lệ.

### 2. Tái cấu trúc tab Thiết lập

- Nhóm **Thông tin khoản vay**: tóm tắt điều khoản dễ đọc và hành động chỉnh sửa rõ ràng.
- Nhóm **Điều chỉnh trong quá trình vay**: tách **Chi phí liên quan khoản vay** và thao tác
  **Lãi suất / trạng thái nợ xấu**; thêm mô tả ngắn về tác dụng, thời điểm dùng và hậu quả.
- Nhóm **Dữ liệu cũ và sửa sai**: để collapsed mặc định, chỉ hiện khi nghiệp vụ áp dụng; phân biệt
  rõ “khởi tạo số dư khoản vay cũ” với “sửa dữ liệu ban đầu đã nhập sai”.
- Nhóm danger **Hoàn tác tất toán** chỉ xuất hiện cho khoản đã tất toán và được tách không gian khỏi
  thiết lập thông thường.
- Dùng heading tuần tự, focus rõ, semantic `details`/dialog, light/dark mode và responsive
  375/768/1024/1440; không thêm animation gây layout shift.

### 3. Quản trị tài khoản

- Khu vực **Tài khoản của tôi** chỉ trình bày đúng tài khoản đang đăng nhập và hành động cá nhân.
- Khu vực **Quản trị người dùng** ưu tiên tài khoản phụ đang hoạt động; tài khoản đã vô hiệu hóa
  được gom vào một nhóm thu gọn có số lượng, không render thành hai card rời cho mỗi tài khoản.
- Mỗi tài khoản dùng một card/hàng quản trị cô đọng; phân quyền, bật/tắt và đặt mật khẩu tạm được
  mở theo nhu cầu. Không xóa vật lý profile, không thay đổi bất biến audit/governance.
- Trạng thái “đã vô hiệu hóa” phải rõ; không tạo cảm giác tài khoản vẫn đang hoạt động.

## Ngoài phạm vi

- Không đổi công thức tính lãi, RPC tất toán, dữ liệu tài chính, schema/migration hoặc chính sách
  profile không xóa vật lý.
- Không tạo/xóa/kích hoạt tài khoản remote.
- Không deploy Preview/Production, đổi secret/scheduler, thao tác Google resources hoặc Git push.

## Acceptance criteria

1. Khoản chưa tất toán có hai hành động cạnh nhau ở Tổng quan; tất toán mở preview/xác nhận hiện có
   và không còn nằm trong Thiết lập.
2. Thiết lập có thứ bậc rõ, mô tả đủ để người dùng hiểu khi nào dùng từng nghiệp vụ; phần nâng cao
   thu gọn mặc định và phần danger tách biệt.
3. Trang Cài đặt không còn trải 30 tài khoản vô hiệu hóa thành hàng chục card; tài khoản hoạt động
   được ưu tiên và tài khoản vô hiệu hóa chỉ xuất hiện trong nhóm thu gọn.
4. VIEWER không thấy hành động ghi/tất toán; `SETTLED` không thể tất toán lần nữa; quyền và validation
   Server Action giữ nguyên.
5. Không tràn ngang ở 320/375px, touch target đạt 44px, keyboard/focus/ARIA và light/dark đạt.
6. `git diff --check`, lint, typecheck, unit tests, build, Auth và E2E hiện hành đều đạt; bổ sung
   regression cho vị trí nút tất toán, dialog xác nhận, cấu trúc Thiết lập và danh sách tài khoản.

## Kết quả triển khai

- Tổng quan khoản vay có hai CTA cạnh nhau; **Tất toán** dùng danger style, icon kèm nhãn và mở
  BottomSheet riêng dùng nguyên luồng preview/xác nhận authoritative hiện có. Thiết lập không còn
  form tất toán.
- Thiết lập trình bày điều khoản trực tiếp, các điều chỉnh nghiệp vụ có mô tả, dữ liệu cũ/sửa sai
  thu gọn mặc định và hoàn tác tất toán ở vùng danger riêng.
- Quản trị người dùng dùng một card cô đọng cho mỗi tài khoản, ưu tiên tài khoản đang hoạt động;
  tài khoản vô hiệu hóa được gom trong nhóm thu gọn có số lượng và giải thích lưu giữ audit.
- Tài liệu thao tác và workflow đã đồng bộ. Không có thay đổi schema, RPC, dữ liệu hoặc remote.

## Bằng chứng kiểm thử

- `git diff --check`: đạt.
- `pnpm lint`: đạt.
- `pnpm typecheck`: đạt.
- `pnpm test`: đạt 74/74.
- `pnpm build`: đạt.
- `pnpm test:auth`: đạt 6/6 trên Supabase test cô lập.
- `pnpm test:e2e`: đạt 21/21, gồm mobile 375px, light/dark, keyboard/contrast, tất toán và quản trị
  nhiều tài khoản. Database test đã reset sau khi chạy.
