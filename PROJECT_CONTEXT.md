---
project: QuanLyVayCaNhan
roadmap_version: 1.0.141
last_updated: 2026-09-09 00:00:00 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: NONE
current_status: COMPLETED
last_completed_checkpoint: C22
next_checkpoint: NONE
---

# Project Context

Tệp này chỉ chứa trạng thái hiện hành để handoff. Nhật ký chi tiết, kế hoạch đã hoàn tất và các cổng
phê duyệt cũ nằm trong Git history, không phải chỉ dẫn cho phiên làm việc mới.

## 1. Trạng thái hiện tại

- C0–C22 đều `COMPLETED`; không có checkpoint đang chờ phê duyệt.
- C22 đã tất toán có audit 6 khoản `C21 TEST ONLY` trên Preview, không xóa vật lý; dashboard stable
  đã trở về số liệu thật và tài khoản kỹ thuật tạm đã bị vô hiệu hóa.
- C21 hoàn tất sau khi người dùng ủy quyền tự tạo tài khoản/giao dịch test và QA mobile tự động.
- C20: khắc phục audit, bỏ VietQR/tạo phiếu và nâng cấp UI/UX; phạm vi và acceptance criteria
  tại `docs/IMPLEMENTATION_PLAN.md` và `docs/C20_REMEDIATION_PLAN.md`.
- Người dùng đã phê duyệt triển khai C20 trong hội thoại ngày 2026-09-07.
- C20 đã nghiệm thu local với dữ liệu giả; remote rollout cần phạm vi/phê duyệt riêng.
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

## 6. Gate và thay đổi gần nhất

- C22: xác nhận 6 khoản QA × `9.007.199.254.740.993 ₫` (1 ACTIVE, 5 BAD_DEBT), tất toán bằng
  `settle_loan` với idempotency key riêng; cả 6 `SETTLED`, dư gốc 0. Dashboard 2026-09-01–09-09:
  active lending từ `9.007.203.104.740.993` về `3.850.000.000`, bad debt từ
  `45.035.996.783.704.965` về `510.000.000`, total exposure về `4.360.000.000` VND.
- Browser authenticated trên stable Preview xác nhận card “Cho vay đang hoạt động” là
  `3.850.000.000 ₫`; tài khoản cleanup đã deactivate/ban và đăng nhập lại bị từ chối HTTP 400.
- C22 không đổi code ứng dụng, không deploy, không migrate và không xóa audit/financial history.
- C21 local đã đạt: list RPC chỉ tính lãi cho page đã chọn; benchmark 1.000 khoản + 13.000 giao dịch
  có median 102,456 ms, worst 104,726 ms, payload 24.060 bytes/25 cards. DB lint sạch, pgTAP
  431/431 (28 migration local), lint/typecheck, 70 unit/script, build, Auth 6/6 và E2E 21/21 đạt.
- C21 thêm phản hồi điều hướng khoản vay sau ngưỡng 300 ms, có `aria-live`, safe-area và
  reduced-motion; test chậm 500 ms xác nhận trạng thái chờ xuất hiện.
- Stable Preview C21 `dpl_C75aW28nYqMhM8x4owLtJFtAUEyw`, immutable
  `https://quan-ly-vay-ca-nhan-8kd5p2f6z-ngotuong2105.vercel.app`, Preview/Ready/Functions `sin1`.
  Public/authenticated smoke trên immutable URL và stable alias đạt; console sạch, error log bằng 0.
- QA remote dùng tài khoản EDITOR tạm và dữ liệu `C21 TEST ONLY`; payment đã đảo, audit history được
  giữ, tài khoản đã deactivate/ban và đăng nhập lại bị từ chối. Hai profile mobile đạt 11 route,
  touch target 44px, zoom 200%, dark/light, landscape, offline và PWA; stable list→detail 871/837 ms.
- Preview Supabase vẫn có 24 migration vì remote migration ngoài phạm vi. Web fallback có giới hạn
  khi RPC mới trả `PGRST202`; tính tiền/sắp xếp vẫn authoritative trong DB, VND dùng bigint.
- Bằng chứng chi tiết: `docs/C21_VALIDATION.md`.
- C20 đã hoàn tất local: gỡ VietQR/phiếu; thêm privacy SSR, account mobile, form recovery,
  preview tất toán có xác nhận, phân trang/aggregate, snapshot export nhất quán và Push worker hữu hạn.
- Test riêng: `QuanLyVayCaNhan-C20-test`, config `.cache/c20-test`, API `127.0.0.1:55321`.
  Không reset instance local gốc và không thay đổi remote.
- Gate cuối đạt ngày 2026-09-08: lint, typecheck, unit/script 66 tests, build; Auth 6/6;
  E2E production build local 20/20; DB lint sạch và pgTAP 414/414 (27 migration local);
  `git diff --check` sạch.
- Đã thêm revision acknowledgement và fallback GET-only nếu UI không commit sau action thành
  công; không gửi lại giao dịch. Full E2E sau fallback đạt 20/20.
- QA ảnh từng phát hiện tiền lớn bị cắt trong dashboard card dù trang không tràn; đã sửa
  wrap/min-width, xem lại ảnh desktop/mobile và regression chống cắt đã đạt.
- Hồ sơ đóng phát hiện, benchmark, giới hạn thiết bị và rollout đề xuất: `docs/C20_VALIDATION.md`.
- Benchmark fake: 1.000 khoản từ 2025-01-01, 12.000 giao dịch trả lãi; SQL list cũ 15.003 ms /
  10.393.114 bytes, list phân trang 7.240 ms / 24.060 bytes (25 cards, tổng 1.000).

- 2026-09-07: tạo kế hoạch C20, đồng bộ context/roadmap; chỉ thay đổi tài liệu.
- Audit 2026-09-06 tại local HEAD `6054610`: lint, typecheck, 54/54 unit/script tests và build
  đạt; login Production được xem ở desktop/mobile. Chưa kiểm chứng runtime sau đăng nhập.
- Phiên tạo kế hoạch C20: `git diff --check` đạt; chưa chạy gate triển khai C20.
- Báo cáo `docs/AUDIT_2026-09-06.md` là bằng chứng đầu vào; đề xuất sửa VietQR trong báo cáo
  được thay bằng yêu cầu mới của người dùng: gỡ toàn bộ VietQR và phiếu văn bản.

C19 đạt toàn bộ gate ngày `2026-09-01`:

- `git diff --check`
- lint, typecheck, 54/54 unit/script tests và production build
- Auth 6/6, Playwright E2E 10/10
- Supabase DB lint và pgTAP 385/385
- Production migration list 24/24 và truy vấn hậu kiểm dữ liệu/secret

Commit C19: `eed24e4` — `C19: scrub lịch sử và rotate Web Push`. Các commit local sau `origin/main`
chưa được push; trạng thái chính xác luôn lấy từ `git status --short --branch`.

## 7. Blocker và việc chờ

- Không còn blocker cho C22.
- Không còn blocker cho C21. Không có kiểm chứng phần cứng thật; theo ủy quyền mới của người dùng,
  checkpoint dùng Chromium mobile profiles và ghi rõ không thay thế Safari WebKit/phần cứng thật.
- Supabase CLI profile toàn cục hiện lỗi `Unsupported Config Type`; DB lint đã sạch trước lỗi này và
  pgTAP cuối được chạy trực tiếp trong container local sau khi áp đủ migration, không có `not ok`.
- C21 không cho phép Production rollout, Apps Script push hoặc git push.
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
