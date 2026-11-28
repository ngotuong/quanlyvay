# Báo cáo C123 — Quyền bảng bất biến và idempotency đồng thời

Ngày triển khai: 28/11/2026

Trạng thái: `IN_PROGRESS`; local gate đạt, rollout remote đang thực hiện

## Kết quả local

C123 xử lý hai khoảng trống integrity đã được xác nhận mà không sửa dữ liệu tài chính hoặc thay
đổi phép tính lãi:

1. Thu hồi toàn bộ quyền bảng rồi chỉ cấp lại `SELECT` cho `authenticated` trên ba ledger
   append-only `loan_term_corrections`, `loan_settlement_reversals` và
   `legacy_loan_onboardings`. `anon` không còn quyền; `service_role` giữ nguyên để Server Actions và
   Google Sync tiếp tục chạy. Default privileges của `postgres` không còn tự cấp bảng mới cho
   `anon`/`authenticated`.
2. Thêm advisory transaction lock theo cặp `operation:idempotency_key` trước lần đọc replay đầu
   tiên của năm RPC có race trước row lock: `create_loan`, `correct_loan_terms`,
   `onboard_legacy_loan`, `record_expense` và `reverse_transaction`. Request cùng key được tuần tự
   hóa; request thứ hai đọc lại kết quả đã commit. Request khác key vẫn chạy độc lập và validation
   conflict hiện hữu được giữ nguyên.
3. Helper khóa nằm trong schema `private`, không cấp `EXECUTE` cho `public`, `anon` hoặc
   `authenticated`. Migration fail-closed nếu định nghĩa RPC không còn chứa validation key được
   kỳ vọng.

## Bằng chứng quyền

Catalog local và schema dump read-only của Production trước migration cùng cho thấy đúng ba bảng
phát sinh quyền rộng:

| Bảng | `anon` trước | `authenticated` trước | Sau C123 |
| --- | --- | --- | --- |
| `legacy_loan_onboardings` | `ALL` | `ALL` | `anon`: none; `authenticated`: `SELECT` |
| `loan_settlement_reversals` | `ALL` | `SELECT` | `anon`: none; `authenticated`: `SELECT` |
| `loan_term_corrections` | `ALL` | `ALL` | `anon`: none; `authenticated`: `SELECT` |

RLS và immutable row trigger đã có nhưng không chặn `TRUNCATE`; vì vậy thu hồi capability ở ACL
là lớp bảo vệ bắt buộc. Sau migration local, catalog trả 0 grant `TRUNCATE`, `TRIGGER`,
`REFERENCES`, `MAINTAIN` cho cả hai role và cả năm RPC đều chứa lời gọi khóa.

## Kiểm thử đồng thời và tài chính

`225_c123_privileges_and_idempotency.test.sql` mở hai kết nối PostgreSQL độc lập bằng `dblink`,
giữ advisory lock ở phiên điều phối để bảo đảm hai request thật sự cùng in-flight rồi mới thả.
34 assertion xác nhận:

- hai lần tạo khoản vay trả cùng loan ID và chỉ có một giao dịch giải ngân;
- hai lần sửa điều khoản trả cùng loan ID và chỉ có một correction ledger;
- hai lần onboarding trả cùng ledger ID, chỉ có một onboarding ledger và đúng hai component;
- hai lần ghi chi phí trả cùng transaction ID, chỉ có một transaction và một expense detail;
- hai lần đảo chi phí trả cùng reversal ID và chỉ có một reversal;
- dư gốc authoritative sau onboarding là chính xác, audit chỉ có một insert cho mỗi ledger;
- quyền đọc cần thiết còn nguyên, capability nguy hiểm và quyền gọi helper đều bị từ chối.

Test chạy lặp vẫn đạt; fixture dùng dữ liệu giả cố định và không chạm dữ liệu remote.

## Gate local

- `git diff --check`: PASS.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: `145 PASS / 0 FAIL` (79 web, 20 Google Sync, 11 domain, 35 scripts).
- `pnpm build`: PASS, 19 route.
- `pnpm test:auth`: `6 PASS / 0 FAIL`.
- `supabase test db`: `651 PASS / 30 file`.
- `supabase db lint --local --level warning`: sạch.
- `pnpm test:e2e`: `107 PASS / 18 SKIP / 0 FAIL`, 125 case discovery, 27,6 phút.

## Backup, rollout và rollback

Backup Production `qlv-prod-20261128T123003Z` đã đạt 6 tệp mã hóa, checksum, GCM và SQL-shape;
migration snapshot `20261124100000`. Retention chỉ dry-run, không xóa bản sao lưu.

Trước rollout, remote migration history khớp local đến `20261124100000`; C123 là migration duy
nhất chưa áp. Schema dump Production read-only khớp permission matrix trên. Các bước migration,
Preview/Production, Auth/runtime smoke và deployment rollback sẽ được bổ sung sau khi hoàn tất.

Rollback database không tự động thu hồi các mutation đã commit (C123 không tạo mutation nghiệp vụ).
Nếu cần quay lui ACL/RPC, trước hết rollback web alias về deployment tốt trước đó, sau đó dùng
migration khôi phục định nghĩa năm RPC và grant đã được kiểm duyệt; không dùng `db reset` hay sửa
schema Production trực tiếp. Việc cấp lại capability rộng cho client cần checkpoint phá hủy riêng.

## Rủi ro còn lại

- Advisory lock dùng hash 64-bit; collision lý thuyết chỉ làm hai request khác key chờ nhau trong
  một transaction, không làm sai dữ liệu.
- Test đồng thời dùng PostgreSQL local hai session thật; hành vi network retry của client vẫn phụ
  thuộc timeout bên ngoài nhưng replay database đã được chứng minh.
- Migration không thay đổi lãi, số dư, scheduler, Google Sheets payload hoặc Web Push.

