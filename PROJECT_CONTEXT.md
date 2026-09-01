---
project: QuanLyVayCaNhan
roadmap_version: 1.0.134
last_updated: 2026-09-01 17:59:09 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C19
current_status: COMPLETED
next_checkpoint: NONE
---

# Project Context

Tệp này chỉ chứa trạng thái hiện hành để handoff. Nhật ký chi tiết, kế hoạch đã hoàn tất và các cổng
phê duyệt cũ nằm trong Git history, không phải chỉ dẫn cho phiên làm việc mới.

## 1. Trạng thái hiện tại

- C0–C19 đều `COMPLETED`; chưa có checkpoint tiếp theo.
- Không tự triển khai thêm cho đến khi người dùng giao việc hoặc phê duyệt checkpoint mới.
- Worktree chuẩn ở branch `main`; dùng `git status --short --branch` để kiểm tra commit chưa push.
- Production: <https://tindung.vercel.app>.
- Stable Preview: <https://tindung-preview.vercel.app>.
- Chính sách mật khẩu vẫn là tối thiểu 6 ký tự ASCII chữ hoặc số; không tự thay đổi.
- Sau rotate VAPID C19, mỗi thiết bị muốn nhận Web Push phải bấm **Bật thông báo** lại.

## 2. Nguồn sự thật hiện hành

Ưu tiên theo `AGENTS.md`. Trong repository:

1. `PROJECT_CONTEXT.md`: trạng thái vận hành và checkpoint hiện tại.
2. `docs/IMPLEMENTATION_PLAN.md`: danh sách checkpoint và trạng thái tóm tắt.
3. Các contract/runbook còn hiệu lực:
   - `docs/DOMAIN_SPEC.md`, `docs/FINANCIAL_ENGINE.md`
   - `docs/AUTH.md`, `docs/WEB_WORKFLOWS.md`, `docs/DASHBOARD.md`
   - `docs/PWA_NOTIFICATIONS.md`, `docs/GOOGLE_SYNC.md`
   - `docs/BACKUP_RESTORE.md`, `docs/CI.md`, `docs/VERCEL_PREVIEW_RUNBOOK.md`
   - `docs/DESIGN_SYSTEM.md`, `docs/USER_GUIDE.md`
4. Migration, test và code hiện tại là bằng chứng triển khai.

Không dùng commit message, revision log, ảnh audit cũ hoặc nội dung đã xóa trong Git history để suy
ra yêu cầu đang chờ, quyền thao tác remote hay checkpoint mới.

## 3. Kiến trúc và bất biến

- Monorepo pnpm: Next.js PWA ở `apps/web`, Apps Script ở `apps/google-sync`, contract dùng chung ở
  `packages/domain-contract`, migration/test PostgreSQL ở `supabase`.
- Supabase PostgreSQL là nguồn dữ liệu chuẩn; Google Sheets chỉ đồng bộ một chiều để đối chiếu.
- Frontend chỉ mutate qua Server Actions/RPC đã validate; bộ máy tính lãi authoritative ở PostgreSQL.
- Giao dịch tài chính không xóa vật lý; sửa sai bằng reversal/correction và audit append-only.
- Tiền VND dùng số nguyên, lãi suất dùng decimal; ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`, audit UTC.
- Web Push và Google Sync phải idempotent; secret chỉ nằm trong kho secret của môi trường.
- Production hiện có 24 migration và bộ pgTAP 385 assertions.

## 4. Tài khoản và tài nguyên remote

- Google Apps Script, Sheets/Drive và Vercel: `vipmoschino@gmail.com`; giao diện có thể hiển thị
  `ngotuong077@gmail.com` cho cùng tài khoản.
- Supabase: `tuongnt2105@gmail.com`; CLI profile `quanlyvay`.
- GitHub private: `https://github.com/ngotuong/quanlyvay.git`, branch `main` theo dõi `origin/main`.
- Supabase Singapore: project ref `hmfxnstrqfqpvsgfmjmd`.
- Vercel project `quan-ly-vay-ca-nhan`, ID `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, Functions `sin1`.
- Google Sheet authoritative để đối chiếu:
  `1Q12dJCgCvDIjEQyRpeFVtbepGzTl6AsJ_KimAnEvjA8`.
- Apps Script `QuanLyVayCaNhanSync`:
  `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`.
- Drive backup folder: `1loMcJEzDvy5r38K2nz7nCqQHg9KFfz_P`.

Không lưu secret trong repository. Database password, API keys, VAPID và các secret vận hành nằm
trong macOS Keychain/Vercel/Supabase Vault tương ứng.

## 5. Baseline Production sau C19

- Supabase: migration 24/24, DB lint sạch, trigger sanitize audit active.
- Dữ liệu kiểm chứng: 16 đối tác, 31 khoản vay, 338 giao dịch, 526 kỳ lãi, 15 lifecycle,
  9 correction và 489 audit.
- Không còn raw `endpoint`, `p256dh`, `auth_secret` trong Push audit; subscription và delivery cũ
  đều bằng 0 sau rotate VAPID.
- Preview C19: `dpl_2q4dg4wWqW7YQoLaQv9m6Wvc329u`, immutable
  `https://quan-ly-vay-ca-nhan-7syj4kwwp-ngotuong2105.vercel.app`, Ready/`sin1`.
- Production C19: `dpl_4o6JerspEoJUbgu3qXr27twuZZSd`, immutable
  `https://quan-ly-vay-ca-nhan-kdq1gu7kh-ngotuong2105.vercel.app`, Ready/`sin1`.
- Public/authenticated smoke và runtime log của hai deployment đều đạt.
- Google Sheet full sync có 489 audit và không chứa ba Push secret.
- Snapshot sạch `QLV_Snapshot_2026-08-31-C19-clean`, ID
  `1Hebj6010rovOPIWKr2a8JieSnajYg7a8PzqiOL0Ec2g`.
- Backup sạch `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260831T160647Z-c19-clean` đạt SHA-256,
  AES-256-GCM, SQL gate và restore rehearsal cô lập. Thư mục Drive chỉ còn snapshot sạch cùng ba
  tệp backup sạch.

## 6. Gate gần nhất

C19 đạt toàn bộ gate ngày `2026-09-01`:

- `git diff --check`
- lint, typecheck, 54/54 unit/script tests và production build
- Auth 6/6, Playwright E2E 10/10
- Supabase DB lint và pgTAP 385/385
- Production migration list 24/24 và truy vấn hậu kiểm dữ liệu/secret

Commit C19: `eed24e4` — `C19: scrub lịch sử và rotate Web Push`. Các commit local sau `origin/main`
chưa được push; trạng thái chính xác luôn lấy từ `git status --short --branch`.

## 7. Blocker và việc chờ

- Không có blocker triển khai.
- Không có checkpoint chờ phê duyệt.
- Việc đăng ký lại Web Push là thao tác theo từng thiết bị, không chặn chức năng khác.

## 8. Lệnh kiểm tra chuẩn

```bash
git status --short --branch
git diff --check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:auth
pnpm test:e2e
supabase db lint --level warning
supabase test db
```

Các lệnh Supabase/Vercel/Google/GitHub remote vẫn tuân theo cổng phê duyệt trong `AGENTS.md`.
