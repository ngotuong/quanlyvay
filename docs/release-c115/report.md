# C115 — Rollout C114 và hậu kiểm

Trạng thái: `IN_PROGRESS` ngày 23/10/2026. OWNER đã phê duyệt checkpoint C115 trong hội thoại
hiện tại. Báo cáo này chỉ ghi bằng chứng đã hoàn tất; Production vẫn là cổng đang chờ.

## 1. Supabase migration-first

- Project đích: `hmfxnstrqfqpvsgfmjmd`.
- Backup mã hóa trước migration: `qlv-prod-20261022T233437Z`; manifest có 6 tệp, checksum và
  SQL-shape đạt, retention dry-run không xóa backup.
- Migration duy nhất còn thiếu trước rollout là
  `20261022100000_c114_security_hardening.sql`; dry-run xác nhận đúng phạm vi rồi `db push`
  áp thành công.
- Remote migration history đã có `20261022100000`; schema lint mức warning sạch.
- `profiles.password_reset_generation` là `bigint NOT NULL DEFAULT 0`; không có profile mang
  generation không hợp lệ sau migration.
- Inventory endpoint đã sanitize: 1 subscription dùng `fcm.googleapis.com`, 4 subscription dùng
  `web.push.apple.com`; cả hai hostname nằm trong provider policy mặc định. Không ghi endpoint,
  token hoặc dữ liệu tài khoản vào báo cáo.

## 2. Preview C115

### Candidate và rollback

| Vai trò | Deployment | URL | Target / trạng thái / region |
| --- | --- | --- | --- |
| Candidate và stable Preview C115 | `dpl_BRfVm4hf5jfk5FJe2mXPxmrt3hC4` | `https://quan-ly-vay-ca-nhan-5ydpf15dp-ngotuong2105.vercel.app` / `https://tindung-preview.vercel.app` | Preview / Ready / Functions `sin1` |
| Rollback Preview C115 trước hotfix | `dpl_8pxn5Ze87nbvdNbaF5CQeQ1oan9b` | `https://quan-ly-vay-ca-nhan-97arw9mvp-ngotuong2105.vercel.app` | Preview / Ready / Functions `sin1` |
| Rollback Preview C112 | `dpl_2a8avNFZHZxcDsZvheXP84dLu8Ri` | `https://quan-ly-vay-ca-nhan-74fc7gb9r-ngotuong2105.vercel.app` | Preview / Ready / Functions `sin1` |

Candidate thuộc đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`. Vercel CLI không trả mảng
region ở deployment-level; kiểm tra function inventory của root pipeline xác nhận toàn bộ Server
Functions ở `sin1`.

### Gate và smoke

- Root create/resume trên candidate cuối đều đạt `git diff --check`, lint, typecheck, unit
  `138 PASS`, build `19 route` và full E2E `94 PASS / 18 SKIP / 0 FAIL`; hai lượt lần lượt chạy
  27,1 và 27,2 phút.
- Upload metadata guard đạt 248 tệp, 5.473.036 byte. Guard được sửa để hiểu chính xác tệp `.git`
  dạng managed-worktree và vẫn fail-closed với secret, dump, symlink hoặc ignore drift.
- Immutable candidate: `/login` và `/sw.js` HTTP 200; CSP có nonce khác nhau giữa hai request,
  `script-src` không có `'unsafe-inline'`; console không warning/error.
- Authenticated immutable smoke đạt trên Dashboard, Khoản vay, Đối tác, Thông báo, Cài đặt và
  Đổi mật khẩu; không route nào quay về login.
- Root resume chỉ chuyển alias sau candidate smoke; hậu kiểm stable alias xác nhận đúng deployment,
  project, target Preview và trạng thái Ready.
- Stable alias public smoke: `/login` và `/sw.js` HTTP 200; nonce hiện diện/độc nhất,
  `script-src` không có `'unsafe-inline'`.
- Stable alias authenticated smoke đạt trên sáu route như candidate; browser console sạch.
- Cửa sổ candidate và post-alias đều có Vercel `level:error = 0`, HTTP 500 = 0.

### Nghiệm thu iPhone thật

- OWNER xác nhận ngày 23/10/2026 trên iPhone thật: đã bật và đăng ký Web Push, thiết bị nhận được
  notification, chạm notification mở đúng webapp. Nút thử Preview không ghi dữ liệu Supabase.
- Bằng chứng này chứng nhận permission/subscription, hiển thị notification và deep-link trên thiết
  bị thật; delivery provider vận hành tiếp tục được hậu kiểm cùng Production runtime sau rollout.

## 3. Công việc còn lại

1. Tạo Production candidate từ repository root, giữ alias hiện hành,
   chạy public/Auth/CSP/service-worker/runtime smoke, re-inspect candidate cùng rollback C112 rồi
   promote. Hậu kiểm cả `tindung.vercel.app` và alias mặc định; nếu fail trả alias về C112.
2. Cập nhật deployment Production, kết quả từng smoke, source/final documentation SHA và Required
   CI trước khi chuyển C115 thành `COMPLETED`.

Lượt Required CI đầu của source commit `d8a4154` dừng ở Gitleaks do hai mật khẩu fixture tổng hợp
trong E2E bị nhận nhầm là generic API key; workflow policy và quality/build đạt. Bản khắc phục chỉ
allow đúng hai fingerprint lịch sử và đánh dấu inline fixture, không bỏ rule hoặc ignore theo file;
phải chạy lại full-history scan và Required CI trên SHA kế tiếp.

Lượt CI kế tiếp xác nhận full-history secret scan sạch nhưng dependency audit phát hiện ba advisory
Next.js mới công bố cho dải `16.0.0–16.4.0` (hai critical, một high). C115 nâng bản vá tối thiểu
`next` và `eslint-config-next` từ `16.3.8` lên `16.4.1`, đồng thời port nguyên patch lint C76 và
minimum-release-age exclusions sang đúng version. `pnpm install --frozen-lockfile` bằng pnpm 11.9.0
đạt; `pnpm audit --audit-level high` còn 0 vulnerability. Lint, typecheck, unit `138 PASS`, build
`19 route` và full E2E `94 PASS / 18 SKIP / 0 FAIL` trong 27,3 phút dưới Next.js 16.4.1 đều đạt.
Source hotfix `aa7be6c8b4e1ef62645b2f27bb0241dcada4feec` đã fast-forward lên `origin/main`.
Required CI `39906882151` của đúng SHA đạt đủ 5 job: quality/build, workflow policy,
dependency/secret scan, Supabase Auth pgTAP/E2E và Required CI gate.
