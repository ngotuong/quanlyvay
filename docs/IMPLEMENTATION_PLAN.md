# Implementation Plan

Đây là roadmap trạng thái hiện hành. Chi tiết checkpoint đã hoàn tất được lưu trong Git history;
không dùng lịch sử đó làm yêu cầu đang chờ.

## 1. Quy tắc

- Chỉ checkpoint được người dùng phê duyệt rõ mới chuyển sang `IN_PROGRESS`.
- Trạng thái hợp lệ: `NOT_STARTED`, `AWAITING_APPROVAL`, `APPROVED`, `IN_PROGRESS`,
  `BLOCKED`, `COMPLETED`.
- Cập nhật trạng thái đồng thời tại đây và `PROJECT_CONTEXT.md`.
- Hoàn tất checkpoint thì dừng; không tự chuyển sang checkpoint kế tiếp.
- Phạm vi remote, dữ liệu và secret tuân theo cổng phê duyệt trong `AGENTS.md`.

## 2. Roadmap

| ID | Kết quả | Trạng thái |
|---|---|---|
| C0–C19 | Nền tảng, nghiệp vụ, Auth, PWA, đồng bộ, Production và hardening | `COMPLETED` |
| C20–C29 | Remediation, dữ liệu/hiệu năng, UI/UX, nhận diện và rollout | `COMPLETED` |
| C30–C37 | Notification, bộ lọc/biểu đồ, tài khoản/cài đặt và rollout | `COMPLETED` |
| C38 | Hậu kiểm chu kỳ nhắc lãi Production theo lịch thực tế | `AWAITING_APPROVAL` |
| C39–C44 | UX khoản vay, hợp nhất nhắc hạn, nhắc lãi vận hành và rollout | `COMPLETED` |
| C45 | Dọn repository, tài liệu hiện hành và đồng bộ GitHub | `COMPLETED` |
| C46 | Vá dependency và ổn định Supabase Auth E2E/CI | `COMPLETED` |

## 3. Checkpoint đang mở: C38

Mục tiêu: kiểm chứng read-only chu kỳ scheduler kế tiếp tạo/làm mới nhắc lãi đúng hạn và ghi nhận
kết quả Push thực tế.

Acceptance criteria:

1. Đọc lịch sử scheduler/worker và runtime log sau giờ gửi đã cấu hình.
2. Đối chiếu notification `INTEREST_DUE`, ngày nhắc, idempotency/dedupe và nghĩa vụ lãi còn dư
   với dữ liệu authoritative.
3. Đối chiếu `push_deliveries` và subscription để phân biệt không tạo nhắc, không có thiết bị,
   delivery lỗi hoặc delivery thành công.
4. Chỉ đọc; không gọi runner thủ công, thay giờ nhận, tạo giao dịch hoặc sửa dữ liệu.
5. Ghi kết quả vào `PROJECT_CONTEXT.md`, cập nhật trạng thái và dừng.

Phạm vi chi tiết: `docs/C38_PRODUCTION_NOTIFICATION_OBSERVATION.md`.

## 4. Contract không được phá vỡ

```text
LoanDirection: LENDING | BORROWING
LoanStatus: ACTIVE | OVERDUE | BAD_DEBT | SETTLED
UserRole: OWNER | EDITOR | VIEWER
TransactionType: DISBURSEMENT | INTEREST_PAYMENT | PRINCIPAL_PAYMENT | EXPENSE | REVERSAL
```

- Supabase là nguồn dữ liệu chuẩn; Google Sheets không ghi ngược.
- Giao dịch tài chính chỉ đảo/correction, không xóa vật lý.
- Tiền VND là số nguyên; lãi suất decimal; quyết toán authoritative ở PostgreSQL.
- Ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`; audit timestamp UTC.
- Notification và sync idempotent; secret không vào Git/log.

## 5. Gate chuẩn

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:auth
pnpm test:e2e
supabase db lint --level warning
supabase test db
git diff --check
```

Chỉ chạy gate áp dụng cho checkpoint. Không tuyên bố hoàn tất khi gate bắt buộc chưa đạt.
