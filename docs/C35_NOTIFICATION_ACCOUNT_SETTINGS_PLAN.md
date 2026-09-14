# C35 — Nhắc lãi lặp lại, cài đặt thông báo và hợp nhất tài khoản

Trạng thái: `COMPLETED`

Người dùng phê duyệt trực tiếp trong hội thoại ngày 2026-09-14.

## Phạm vi

- Bổ sung nhắc lặp hằng ngày cho khoản lãi đã đến hạn nhưng chưa thu/đóng đủ; dừng ngay khi nghĩa vụ
  đến hạn đã được thanh toán hoặc khoản vay không còn thuộc trạng thái được nhắc.
- Giữ việc tạo/gửi notification idempotent theo tài khoản, khoản vay, loại và ngày nghiệp vụ; giờ gửi
  vẫn theo cấu hình từng tài khoản trong múi giờ `Asia/Ho_Chi_Minh`.
- Tinh gọn card thông báo trên thiết bị: dùng công tắc viên thuốc có nhãn truy cập để bật/tắt, đặt ô
  chọn giờ cùng hàng với `Giờ nhận thông báo`, bỏ chú thích múi giờ thừa và lưu giờ ngay khi đổi.
- Gộp `Tài khoản của tôi` vào `Cài đặt`: mọi vai trò được vào trang Cài đặt để xem tài khoản, đổi mật
  khẩu và đăng xuất; chỉ OWNER nhìn thấy phần quản trị tài khoản. Route `/account` chuyển hướng giữ
  tương thích sang `/settings` và không còn mục điều hướng riêng.
- Đối chiếu toàn bộ tài khoản kỹ thuật trên Supabase, giữ đúng một tài khoản QA có thể dùng lại và
  xóa các tài khoản test cũ không còn cần thiết nếu không phá vỡ ràng buộc audit. Không xóa dữ liệu
  tài chính hoặc làm mất dấu vết audit; mọi thao tác xóa remote phải dùng danh sách đích xác định.
- Cập nhật tài liệu vận hành để nêu rõ thời điểm nhắc lần đầu, điều kiện lặp, điều kiện dừng và các
  nguyên nhân thiết bị có thể không hiện Push dù server đã gửi.

## Acceptance criteria

1. Khoản LENDING/BORROWING còn hoạt động và còn dư lãi tại ngày đến hạn tạo một nhắc mỗi ngày sau
   hạn; thanh toán đủ làm ngày sau không còn nhắc. Khoản BAD_DEBT/SETTLED không nhận nhắc lãi.
2. Migration có pgTAP bao phủ nhắc lần đầu, nhắc lặp, dừng sau thanh toán, hai chiều khoản vay và
   idempotency; nghiệp vụ tiền vẫn do PostgreSQL quyết định bằng số nguyên VND.
3. Công tắc Push có `role="switch"`, `aria-checked`, thao tác được bằng bàn phím và vùng chạm tối
   thiểu 44px. Giờ và select nằm cùng hàng từ 320px, không tràn ngang; đổi giờ lưu tự động và có
   phản hồi trạng thái.
4. Menu chỉ còn một mục `Cài đặt`; `/account` chuyển hướng tới `/settings`. EDITOR/VIEWER xem được
   thông tin cá nhân nhưng không thể xem/quản trị người dùng; OWNER giữ đủ chức năng hiện tại.
5. Supabase chỉ còn OWNER và đúng một tài khoản QA có thể đăng nhập lại. Nếu ràng buộc audit không
   cho phép xóa vật lý một tài khoản, checkpoint phải ghi rõ tài khoản đó, bằng chứng và biện pháp
   thay thế không phá audit trước khi tuyên bố hoàn tất.
6. `git diff --check`, lint, typecheck, unit/script tests, build, Auth, E2E, DB lint và pgTAP đều đạt.

## Ngoài phạm vi

- Vercel Preview/Production, Git push, đổi secret, Google resources hoặc thay đổi dữ liệu tài chính.
- Thay đổi chính sách mật khẩu hoặc phân quyền nghiệp vụ hiện hành.

## Kết quả tài khoản remote và ngoại lệ audit

Ngày 2026-09-14, truy vấn chỉ đọc trên Supabase dùng chung xác nhận có 1 OWNER và 29 tài khoản kỹ
thuật; toàn bộ tài khoản kỹ thuật đều có `is_active = false` và đã bị ban ở Auth. Ba danh tính sau
đang được khóa bởi tham chiếu tài chính `ON DELETE RESTRICT`, nên phải giữ để bảo toàn người tạo/cập
nhật trong lịch sử:

- `c21_smoke_20260908`: 2 đối tác, 2 khoản vay và 6 giao dịch.
- `c21_smoke_20260908b`: 4 đối tác, 4 khoản vay và 12 giao dịch.
- `c21_smoke_c22cleanup_20260909`: 6 khoản vay và 6 giao dịch.

26 tài khoản còn lại không có tham chiếu trong `counterparties`, `loans`, `transactions`,
`loan_lifecycle_events`, `loan_term_corrections`, `loan_settlement_reversals` hoặc
`legacy_loan_onboardings`. Sau khi người dùng xác nhận danh sách đích, lệnh xóa fail-closed đã bị
rollback nguyên transaction bởi trigger `private.validate_profile_governance()` với mã `55000` và
thông báo `Profiles cannot be deleted; deactivate the account instead`. Không có tài khoản hoặc dữ
liệu nào bị xóa một phần.

Danh sách 26 tài khoản không có tham chiếu nhưng vẫn phải giữ do bất biến profile không xóa vật lý:

- `codex_smoke_36832493`.
- `c23_smoke_mtvlzdzw`, `c23_smoke_mtvm0vpo`, `c23_smoke_mtvm1zki`, `c23_smoke_mtvm2vj5`,
  `c23_smoke_mtvm3y8c`, `c23_smoke_mtvm4x5p`, `c23_smoke_mtvmeu54`.
- `c24_probe_mtw8b1rq`, `c24_smoke_mtw8kcoa`, `c24_stable_mtw8m7gx`.
- `c26_smoke_mtwwc9vn`, `c26_smoke_mtwwgkp3`, `c26_smoke_mtwwm5ux`, `c26_smoke_mtwwpsp9`,
  `c26_smoke_mtwwrea4`.
- `c28_smoke_mtz4im7v`, `c28_smoke_mtz4kstk`, `c28_smoke_mtz4lt0j`, `c28_smoke_mtz4sebj`,
  `c28_smoke_mtz5b3uu`, `c28_smoke_mtz5czsf`.
- `c31_smoke_mtzrjbph`, `c31_smoke_mtzt1uzl`, `c31_smoke_mu0ko2u1`, `c31_smoke_mu0kpatn`.

Biện pháp thay thế an toàn là giữ cả 29 profile ở trạng thái vô hiệu hóa/ban; RLS, RPC và màn hình
đăng nhập đều từ chối chúng. QA remote tiếp theo phải dùng tài khoản tạm theo script, vô hiệu hóa
ngay sau smoke và không tạo dữ liệu tài chính nếu checkpoint không cho phép. Muốn xóa vật lý 26
profile cần một checkpoint kiến trúc riêng để thiết kế migration/xóa có kiểm soát; C35 không tắt
trigger, không sửa khóa ngoại và không đổi chính sách mật khẩu để lách rào chắn.

## Gate hoàn tất

- `git diff --check`: đạt.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`: đạt; unit/script 74/74.
- `pnpm test:auth`: đạt 6/6.
- `pnpm test:e2e`: đạt 21/21.
- DB lint sạch; pgTAP đạt 448/448 với migration C35.
