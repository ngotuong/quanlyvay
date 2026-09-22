---
project: QuanLyVayCaNhan
roadmap_version: 1.0.199
last_updated: 2026-09-22 15:16:29 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C38
current_status: AWAITING_APPROVAL
last_completed_checkpoint: C48
next_checkpoint: C38
---

# Project Context

Tệp này chỉ chứa trạng thái hiện hành để handoff. Chi tiết checkpoint đã hoàn tất nằm trong Git
history, migration, test và các contract/runbook chuyên biệt.

## 1. Trạng thái hiện tại

- C48 `COMPLETED` ngày 2026-09-22: rollout C47 lên Supabase/Vercel Production, hậu kiểm không ghi
  dữ liệu tài chính và đồng bộ source/bằng chứng lên GitHub. GitHub CI run `35701912815` lần 2
  đạt Required CI gate.
- C48 đã xác minh bản sao lưu logical Production mã hóa trước migration tại
  `.backups/qlv-prod-20260922T070157Z/` (manifest `qlv-prod-20260922T074535Z`, schema/data
  đủ auth/private/public/supabase_migrations, SHA-256 và GCM đạt). Migration
  `20260922090000_c47_principal_restructure.sql` đã áp vào project `hmfxnstrqfqpvsgfmjmd`;
  remote history và hai bảng/RPC mới đã kiểm tra khớp.
- Candidate Vercel `dpl_8Jju8tmv12o8tZ8tQ6ZXWbk6PcFS`, URL bất biến
  <https://quan-ly-vay-ca-nhan-2h5lh7l3c-ngotuong2105.vercel.app>, target Production,
  `Ready`, Functions `sin1`. `/login`, manifest và auth redirect đạt public smoke. Authenticated
  browser smoke trên khoản vay Ngân đã đạt: nút nghiệp vụ mới hiển thị; preview chỉ đọc 22/9/2026
  cho gốc 400 triệu, trả 300 triệu, lãi chốt đến 21/9 là 2,8 triệu, kỳ mới 100 triệu; không bấm
  xác nhận. Viewport 390 px không tràn ngang; console và runtime error log sạch. Đã promote;
  `tindung.vercel.app` được inspect trỏ đúng deployment này, `/login` và manifest trả 200.
  Rollback target là `dpl_9KogDrgcDVQnpqhr7TPobpNwTmAi`; chưa cần rollback.
- C47 `COMPLETED` ngày 2026-09-22: bổ sung nghiệp vụ nguyên tử **Giảm gốc & mở kỳ mới**. Ngày
  hiệu lực D chốt lãi đến D-1, ghi đúng gốc/lãi thực tế và mở kỳ mới trên dư gốc còn lại từ D;
  không tạo khoản vay/giải ngân giả, không tính trùng ngày. UI có preview authoritative, xác nhận,
  stale-preview guard, bố cục mobile 390 px và lịch sử gộp dễ đối chiếu. Lịch nhắc, dashboard,
  danh sách và Google Sheets dùng/nhận mốc cùng ledger mới. Trạng thái rollout remote ở C48.
- C44 đã rollout source C41/C43 và migration `20260917100000` lên Supabase dùng chung, stable
  Preview và Production. Tại thời điểm C44, Preview trỏ
  `dpl_AjvS8ir8eeq8t4V4YmKc12ymedWu` và Production trỏ `dpl_9KogDrgcDVQnpqhr7TPobpNwTmAi`.
  Public/authenticated smoke, mobile
  390 px, console và runtime error log đều sạch; rollback không kích hoạt.
- C45 đã dọn tài liệu lịch sử khỏi cây làm việc, giữ tài liệu kỹ thuật và checkpoint đang mở;
  xóa cache/test artifact được ignore và xác nhận không có lệnh build/test/deploy bị treo. GitHub
  đã xác thực lại và branch `main` đã nhận đầy đủ chuỗi commit qua `09c0d67`.
- C46 `COMPLETED` ngày 2026-09-18: nâng `next`/`eslint-config-next` từ 16.2.12 lên 16.3.5
  (bản đã vá RCE), cập nhật override `nanoid`, `sharp`, `js-yaml` lên bản đã vá và thêm
  health-check retry có giới hạn trước khi Playwright tạo user E2E. Local audit sạch; toàn bộ gate
  gồm pgTAP 477/477, Auth 6/6 và Playwright 21/21 đạt. Không deploy, migrate remote, thay secret
  hoặc dữ liệu Production. GitHub Actions run `35353744921` cho commit `760d59c` đã đạt cả
  Required CI gate.
- C38 `AWAITING_APPROVAL` vẫn chờ riêng: hậu kiểm read-only chu kỳ nhắc lãi Production. Không tự
  gọi worker, gửi Push thủ công hoặc thay đổi dữ liệu.
- Supabase Cron chạy hằng giờ. 10 Push delivery revision ở trạng thái `PENDING` là hàng đợi vận
  hành hợp lệ sau lần rollout ngoài giờ nhận 12:00, không phải lệnh terminal bị treo và không được
  xóa trong công việc dọn repository.
- Production: <https://tindung.vercel.app>.
- Stable Preview: <https://tindung-preview.vercel.app>.

## 2. Dữ liệu và tài khoản

- Supabase project ref dùng chung: `hmfxnstrqfqpvsgfmjmd`, region Singapore.
- Baseline sau C44: 33 migration, 38 khoản vay, 381 giao dịch, 36 notification và 0 thread nhắc
  trùng tại thời điểm rollout.
- Chỉ 1 OWNER hoạt động. Các tài khoản kỹ thuật đã inactive/banned; tài khoản smoke giữ lại không có
  session hoặc refresh token hoạt động.
- Một số profile cũ có ràng buộc audit/tài chính và trigger quản trị cấm xóa vật lý. Không tắt
  trigger, không sửa lịch sử và không xóa giao dịch tài chính để dọn tài khoản.
- Production/Preview dùng chung Supabase; không tạo dữ liệu QA trên tài khoản vận hành.

## 3. Nguồn sự thật

Ưu tiên theo `AGENTS.md`:

1. `PROJECT_CONTEXT.md`: trạng thái vận hành và checkpoint hiện tại.
2. `docs/IMPLEMENTATION_PLAN.md`: roadmap và acceptance criteria đang mở.
3. Contract/runbook còn hiệu lực:
   - `docs/DOMAIN_SPEC.md`, `docs/FINANCIAL_ENGINE.md`
   - `docs/AUTH.md`, `docs/WEB_WORKFLOWS.md`, `docs/DASHBOARD.md`
   - `docs/PWA_NOTIFICATIONS.md`, `docs/GOOGLE_SYNC.md`
   - `docs/BACKUP_RESTORE.md`, `docs/CI.md`, `docs/VERCEL_PREVIEW_RUNBOOK.md`
   - `docs/DESIGN_SYSTEM.md`, `docs/USER_GUIDE.md`
4. Migration, test và code hiện tại là bằng chứng triển khai.

Không dùng commit message, tài liệu đã xóa hoặc nội dung lịch sử để suy ra yêu cầu đang chờ hay
quyền thực hiện thao tác remote mới.

## 4. Kiến trúc và bất biến

- Monorepo pnpm: Next.js PWA ở `apps/web`, Apps Script ở `apps/google-sync`, contract dùng chung
  ở `packages/domain-contract`, migration/test PostgreSQL ở `supabase`.
- Supabase PostgreSQL là nguồn dữ liệu chuẩn; Google Sheets chỉ đồng bộ một chiều để đối chiếu.
- Frontend chỉ mutate qua Server Actions/RPC đã validate; bộ máy tính lãi authoritative ở PostgreSQL.
- Giao dịch tài chính không xóa vật lý; sửa sai bằng reversal/correction và audit append-only.
- Tiền VND dùng số nguyên, lãi suất dùng decimal; ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`, audit UTC.
- Web Push và Google Sync phải idempotent; secret chỉ nằm trong kho secret của môi trường.
- Chính sách mật khẩu hiện hành: tối thiểu 6 ký tự ASCII chữ hoặc số.

## 5. Tài nguyên remote

- GitHub private: <https://github.com/ngotuong/quanlyvay.git>, branch `main` theo dõi
  `origin/main`.
- Vercel project ID: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; Functions region `sin1`.
- Preview bắt buộc chạy từ repository root bằng `pnpm deploy:preview`.
- Google Apps Script/Sheets/Drive, Vercel, Supabase và secret chỉ thao tác khi checkpoint cho phép.

## 6. Kiểm thử gần nhất

C44 đã đạt:

- `git diff --check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 74/74
- `pnpm build`
- `pnpm test:auth`: 6/6
- `pnpm test:e2e`: 21/21
- GitHub Actions CI: run `35353744921` đạt Required CI gate
- database lint sạch và pgTAP 477/477

C45 đã đạt:

- `git diff --check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 74/74
- `pnpm build`

Không chạy lại Auth E2E, browser E2E hoặc database test vì C45 không đổi code, schema, dữ liệu hay
runtime; các gate đó gần nhất đã đạt ở C44 như ghi trên.

C46 đã đạt:

- `pnpm audit --audit-level high`: không còn advisory
- `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74
- `pnpm build`
- database lint sạch và pgTAP 477/477
- `pnpm test:auth`: 6/6
- `pnpm test:e2e`: 21/21

C47 đã đạt:

- migration được tái tạo sạch từ đầu; database lint không lỗi
- pgTAP 504/504, gồm kịch bản 400 triệu → trả 300 triệu + lãi chốt → kỳ mới 100 triệu
- `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74
- `pnpm build`
- `pnpm test:auth`: 6/6
- `pnpm test:e2e`: 22/22, gồm workflow mới trên viewport 390 px
- `git diff --check`

C48 đã đạt:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74, `pnpm build` đạt.
- Backup logical Production mã hóa và kiểm tra integrity đạt; migration Production/history đạt.
- Candidate Production `Ready`, Functions `sin1`; public/authenticated mobile smoke, console và
  runtime log đạt; alias Production đã chuyển và public hậu kiểm đạt.
- Source C47 commit `2ca0c17` đã push `origin/main`; GitHub CI run `35701912815` lần 2 đạt
  tất cả job và Required CI gate, gồm pgTAP/Auth/Playwright E2E. Lần đầu Auth local của runner
  trả HTTP 502 trong 15 giây sau reset (trước khi Playwright chạy); rerun không lặp lại.

## 7. Việc chờ

- Bản `apps/google-sync/src/Config.js` C47 đã có hai bảng đối chiếu mới trong Git nhưng chưa
  `clasp push`; rollout Apps Script không nằm trong acceptance criteria C48 và cần duyệt riêng.
- C38 chờ người dùng phê duyệt tiếp tục. Phạm vi nằm tại
  `docs/C38_PRODUCTION_NOTIFICATION_OBSERVATION.md`.
- Heartbeat quan sát C38 đang `PAUSED`; không tự khởi động lại.
- Không có blocker hoặc lệnh terminal dự án bị treo.
