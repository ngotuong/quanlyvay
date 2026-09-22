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
| C39–C44 | UX khoản vay, hợp nhất nhắc hạn, nhắc lãi vận hành và rollout | `COMPLETED` |
| C45 | Dọn repository, tài liệu hiện hành và đồng bộ GitHub | `COMPLETED` |
| C46 | Vá dependency và ổn định Supabase Auth E2E/CI | `COMPLETED` |
| C47 | Giảm gốc và tái lập chu kỳ lãi không chồng ngày | `COMPLETED` |
| C48 | Rollout C47 lên Production và đồng bộ GitHub | `COMPLETED` |
| C49 | Bố cục nút khoản vay và cuộn modal giảm gốc trên mobile | `COMPLETED` |
| C50 | Rollout C49 lên Production | `COMPLETED` |

## 3. Checkpoint đã hoàn tất: C47

Mục tiêu: cung cấp một nghiệp vụ nguyên tử để ghi khoản gốc thực trả, tự chốt lãi đến ngày trước
ngày hiệu lực và mở chu kỳ lãi mới trên dư gốc còn lại mà không tạo dòng tiền giải ngân giả.

Acceptance criteria:

1. Bản xem trước authoritative hiển thị gốc trước điều chỉnh, lãi chốt đến D-1, gốc thực trả, dư
   gốc mới, ngày bắt đầu/kết thúc kỳ mới và lãi dự kiến của kỳ mới.
2. RPC ghi nguyên tử giao dịch gốc thực tế, lãi phải trả/thu đến D-1 và mốc tái lập chu kỳ; retry
   cùng idempotency key không tạo dữ liệu trùng và dữ liệu thay đổi sau preview bị từ chối.
3. Ngày D chỉ tính lãi trên dư gốc mới. Không có ngày bị tính hai lần hoặc bỏ trống; tiền lãi đã
   thanh toán không sinh lãi và không tự chuyển thành tiền gốc.
4. Lịch nhắc, dashboard và danh sách khoản vay dùng mốc chu kỳ mới; biểu đồ dòng tiền chỉ phản ánh
   số gốc và lãi thực tế, không có khoản giải ngân tổng hợp.
5. UI có một thao tác rõ nghĩa, touch target tối thiểu 44 px, nhãn và lỗi truy cập được, bản xem
   trước bắt buộc xác nhận trước khi ghi và hoạt động ở viewport mobile 375/390 px.
6. Có migration, pgTAP cho ngày cắt kỳ/idempotency/stale preview/quyền và unit/E2E phù hợp; toàn bộ
   gate áp dụng đạt trước khi hoàn tất checkpoint.

## 4. Checkpoint hoàn tất gần nhất: C48

Mục tiêu: rollout migration và web C47 lên Production, hậu kiểm public/authenticated runtime và
đồng bộ đầy đủ source cùng bằng chứng triển khai lên GitHub.

Acceptance criteria:

1. Có logical backup Production trước migration; migration `20260922090000` áp đúng project
   `hmfxnstrqfqpvsgfmjmd` và remote migration history khớp local.
2. Deployment Production thuộc đúng Vercel project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, ở trạng
   thái Ready, Functions `sin1` và alias `tindung.vercel.app` trỏ đúng deployment mới.
3. Public smoke, authenticated smoke trên route khoản vay đã đổi, mobile 390 px, browser console
   và runtime error log đều đạt; không tạo giao dịch tài chính thật.
4. Ghi deployment/migration/smoke vào `PROJECT_CONTEXT.md`, commit và push `main` lên GitHub; CI
   Required gate đạt.
5. Nếu hậu kiểm web thất bại, rollback alias về deployment Production tốt trước đó; nếu migration
   thất bại thì dừng và không deploy web phụ thuộc schema.

## 5. Checkpoint hoàn tất gần nhất: C49

Mục tiêu: làm rõ nhóm thao tác khoản vay và bảo đảm người dùng có thể đọc, cuộn, xác nhận phương
án giảm gốc trên điện thoại.

Acceptance criteria:

1. "Giao dịch" và "Tất toán" cùng hàng, kích thước đồng đều; nút "Giảm gốc" ở hàng dưới, rộng
   theo nhóm. Dialog vẫn ghi rõ nghiệp vụ đầy đủ "Giảm gốc và mở kỳ mới" trước xác nhận.
2. Dialog dài cuộn dọc được bằng thao tác vuốt trên mobile; phần cuối và nút xác nhận luôn tiếp cận
   được ở 375/390 px, kể cả sau khi preview xuất hiện. Không gây cuộn ngang, không che bởi safe area
   hoặc bàn phím; nút đóng và keyboard navigation vẫn hoạt động.
3. Có kiểm thử hồi quy cho thứ tự/nội dung nút và khả năng cuộn tới nút xác nhận; đạt lint,
   typecheck, unit test, build và E2E áp dụng. Không đổi tính lãi, RPC, dữ liệu hay schema.
4. Chỉ sửa và kiểm chứng local; Preview/Production và GitHub push cần phê duyệt riêng.

## 6. Checkpoint hoàn tất: C50

Mục tiêu: đưa thay đổi UI C49 lên Production an toàn, có khả năng rollback và không tác động dữ
liệu tài chính.

Acceptance criteria:

1. `git diff --check`, lint, typecheck, unit test, build và E2E đạt trước deployment.
2. Candidate thuộc project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, trạng thái
   Ready và toàn bộ Functions ở `sin1`.
3. Public smoke và authenticated smoke route khoản vay ở 375/390 px xác nhận đúng bố cục ba nút,
   dialog preview cuộn tới nút xác nhận, không ghi giao dịch và không có browser/runtime error.
4. Chỉ promote sau khi candidate đạt; hậu kiểm `tindung.vercel.app` trỏ đúng deployment. Nếu hậu
   kiểm thất bại, rollback alias về deployment Production tốt trước đó.
5. Ghi bằng chứng triển khai vào `PROJECT_CONTEXT.md`; không migration, đổi secret hoặc push GitHub.

## 7. Contract không được phá vỡ

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

## 8. Gate chuẩn

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
