# Quản Lý Vay Cá Nhân

Webapp/PWA quản lý các khoản đi vay và cho vay cá nhân, sử dụng Next.js, Supabase, Vercel và
Google Apps Script.

## Trạng thái

- C0–C37 và C39–C44 đã hoàn tất.
- C45 đã hoàn tất dọn local nhưng đang `BLOCKED` ở bước push do phiên GitHub hết hiệu lực.
- C38 đang `AWAITING_APPROVAL`: hậu kiểm read-only chu kỳ nhắc lãi Production theo lịch thực tế.
- Production: <https://tindung.vercel.app>.
- Stable Preview: <https://tindung-preview.vercel.app>.
- GitHub private, Supabase Singapore, Google/Clasp và Vercel đã được liên kết.

Trạng thái hiện hành luôn lấy từ `PROJECT_CONTEXT.md`. Roadmap tóm tắt nằm trong
`docs/IMPLEMENTATION_PLAN.md`; tài liệu checkpoint đã hoàn tất được lưu trong Git history.

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
