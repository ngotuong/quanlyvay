# Quản Lý Vay Cá Nhân

Webapp/PWA quản lý các khoản đi vay và cho vay cá nhân, sử dụng Next.js, Supabase, Vercel và Google Apps Script.

## Trạng thái

- C0 — Quản trị dự án: hoàn tất.
- C1 — Monorepo Next.js: hoàn tất.
- C2 — Đặc tả nghiệp vụ: hoàn tất.
- C3 — Supabase local: hoàn tất.
- C4 — Bộ máy tài chính: hoàn tất.
- C5 — Auth và phân quyền local: hoàn tất.
- C6 — Nghiệp vụ web: hoàn tất.
- C7 — Dashboard và UX: hoàn tất.
- C8 — PWA và thông báo local: hoàn tất.
- C9 — Google Sync local: hoàn tất.
- C10 — Supabase remote: hoàn tất.
- C11 — Google/Clasp remote: hoàn tất.
- C12 — Vercel Preview: hoàn tất.
- C13 — Production/UAT: hoàn tất; restore/cleanup, Production deploy, OWNER, Google Sync, snapshot và
  Web Push delivery thật đều đã được kiểm thử.
- C14 — Hiệu năng và độ mượt UX: hoàn tất.
- C15 — Sửa dữ liệu khoản vay và trình bày lãi theo kỳ: hoàn tất.
- C16 — Remediation audit và kiểm thử dữ liệu thực tế đầu tiên: đang thực hiện; các vòng trước đã
  rollout Production, hiện tiếp tục hardening local và đối chiếu dữ liệu thật.
- GitHub private, Supabase Singapore, Google/Clasp và Vercel Production đã liên kết; Production chạy tại `https://tindung.vercel.app`.

Trạng thái hiện tại luôn được lấy từ `PROJECT_CONTEXT.md`; roadmap nằm trong `docs/IMPLEMENTATION_PLAN.md`.

## Kiến trúc đích

```text
apps/web             Next.js PWA
apps/google-sync     Apps Script đồng bộ Google Sheets/Drive
supabase             Migration, RLS, database/Edge Functions
docs                 Kế hoạch và tài liệu kỹ thuật
```

Supabase là nguồn dữ liệu chuẩn. Google Sheets chỉ là bản đối chiếu một chiều; Google Drive lưu snapshot định kỳ.

Đặc tả nghiệp vụ chuẩn nằm trong `docs/DOMAIN_SPEC.md`; contract database authoritative nằm
trong `docs/FINANCIAL_ENGINE.md`; fixture dùng lại cho database engine nằm tại
`packages/domain-contract/fixtures`.

Luồng Auth/RBAC nằm trong `docs/AUTH.md`; các màn hình và workflow nghiệp vụ web nằm trong
`docs/WEB_WORKFLOWS.md`.

Quy tắc PWA/Web Push nằm trong `docs/PWA_NOTIFICATIONS.md`; contract đồng bộ Sheet một chiều,
snapshot và phục hồi nằm trong `docs/GOOGLE_SYNC.md`.

Hướng dẫn thao tác dành cho người dùng nằm trong `docs/USER_GUIDE.md`.

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
supabase start
supabase db reset
supabase db lint --level warning
supabase test db
pnpm test:auth
pnpm test:e2e
```

`supabase start` và các lệnh database trên chỉ thao tác môi trường Docker local. Không chạy
`supabase login`, `supabase link`, `supabase db push` hoặc migration remote nếu chưa có xác nhận riêng.

## Tiếp tục dự án

Agent hoặc kỹ sư bắt đầu bằng cách đọc:

1. `AGENTS.md`
2. `PROJECT_CONTEXT.md`
3. Checkpoint liên quan trong `docs/IMPLEMENTATION_PLAN.md`
4. Kết quả `git status --short --branch`

Không triển khai checkpoint đang chờ nếu chưa có phê duyệt rõ của người dùng.
