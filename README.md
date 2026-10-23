# Quản Lý Vay Cá Nhân

Webapp/PWA quản lý các khoản đi vay và cho vay cá nhân, sử dụng Next.js, Supabase, Vercel và
Google Apps Script.

## Trạng thái

- C114 `COMPLETED` local: đã harden Web Push egress/DNS, recovery đổi mật khẩu và CSP nonce; báo
  cáo tại `docs/security-c114/report.md`. C115 rollout remote đang `AWAITING_APPROVAL`.
- C113 `COMPLETED`: audit toàn diện local đã sửa lỗi toàn vẹn Google Sync, cách vẽ giá trị 0 trên
  biểu đồ và side effect ghi evidence của E2E; báo cáo nằm tại `docs/audit-c113/report.md`.
- C100 vẫn `IN_PROGRESS`: backend tối ưu đã phát hành, chỉ còn nghiệm thu định lượng trên iPhone
  thật theo acceptance hiện hành.
- Production: <https://tindung.vercel.app>.
- Stable Preview: <https://tindung-preview.vercel.app>.
- GitHub private, Supabase Singapore, Google/Clasp và Vercel đã được liên kết.

Trạng thái hiện hành luôn lấy từ `PROJECT_CONTEXT.md`; danh sách trên chỉ là ảnh chụp tại thời điểm
cập nhật README. Roadmap tóm tắt nằm trong `docs/IMPLEMENTATION_PLAN.md`; tài liệu checkpoint đã
hoàn tất được lưu trong Git history.

## Kiến trúc

```text
apps/web             Next.js PWA
apps/google-sync     Apps Script đồng bộ Google Sheets/Drive
packages             Contract dùng chung
supabase             Migration, RLS, database/Edge Functions
docs                 Tài liệu kỹ thuật và checkpoint hiện hành
```

Supabase là nguồn dữ liệu chuẩn. Google Sheets chỉ là bản đối chiếu một chiều; Google Drive lưu
snapshot định kỳ.

Tài liệu chính:

- Nghiệp vụ và database: `docs/DOMAIN_SPEC.md`, `docs/FINANCIAL_ENGINE.md`
- Auth và workflow: `docs/AUTH.md`, `docs/WEB_WORKFLOWS.md`, `docs/DASHBOARD.md`
- PWA/Push và đồng bộ: `docs/PWA_NOTIFICATIONS.md`, `docs/GOOGLE_SYNC.md`
- Vận hành: `docs/CI.md`, `docs/BACKUP_RESTORE.md`, `docs/VERCEL_PREVIEW_RUNBOOK.md`
- UI/UX và hướng dẫn: `docs/DESIGN_SYSTEM.md`, `docs/USER_GUIDE.md`

## Phát triển local

Yêu cầu Node.js 24 và pnpm 11.9:

```bash
pnpm install
pnpm dev
```

Các gate hiện có:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:auth
pnpm test:e2e
supabase db lint --level warning
supabase test db
```

Các lệnh Supabase database ở trên mặc định dành cho môi trường Docker local. Không đăng nhập, liên
kết, migrate hoặc deploy remote nếu chưa có phạm vi được người dùng phê duyệt.

## Tiếp tục dự án

Đọc theo thứ tự:

1. `AGENTS.md`
2. `PROJECT_CONTEXT.md`
3. Checkpoint liên quan trong `docs/IMPLEMENTATION_PLAN.md`
4. `git status --short --branch`

Không triển khai checkpoint đang chờ nếu chưa có phê duyệt rõ của người dùng.
