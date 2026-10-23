# C115 — Rollout C114 và hậu kiểm

Trạng thái: `IN_PROGRESS` ngày 23/10/2026. OWNER đã phê duyệt checkpoint C115 trong hội thoại
hiện tại. Báo cáo này chỉ ghi bằng chứng đã hoàn tất; Web Push trên Safari/iPhone thật và
Production vẫn là cổng đang chờ.

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
| Candidate và stable Preview C115 | `dpl_8pxn5Ze87nbvdNbaF5CQeQ1oan9b` | `https://quan-ly-vay-ca-nhan-97arw9mvp-ngotuong2105.vercel.app` / `https://tindung-preview.vercel.app` | Preview / Ready / Functions `sin1` |
| Rollback Preview C112 | `dpl_2a8avNFZHZxcDsZvheXP84dLu8Ri` | `https://quan-ly-vay-ca-nhan-74fc7gb9r-ngotuong2105.vercel.app` | Preview / Ready / Functions `sin1` |

Candidate thuộc đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`. Vercel CLI không trả mảng
region ở deployment-level; kiểm tra function inventory của root pipeline xác nhận toàn bộ Server
Functions ở `sin1`.

### Gate và smoke

- Root create/resume đều đạt `git diff --check`, lint, typecheck, unit `138 PASS`, build `19 route`
  và full E2E `94 PASS / 18 SKIP / 0 FAIL`; lượt resume cuối chạy 27,5 phút.
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

## 3. Công việc còn lại

1. OWNER nghiệm thu Web Push trên Safari/iPhone thật ở stable Preview: permission/subscription,
   gửi notification vận hành hợp lệ và mở notification về đúng app; không tạo dữ liệu QA phá hủy.
2. Commit/push fast-forward source C113–C115 và xác nhận Required CI của đúng SHA.
3. Chỉ sau hai cổng trên mới tạo Production candidate từ repository root, giữ alias hiện hành,
   chạy public/Auth/CSP/service-worker/runtime smoke, re-inspect candidate cùng rollback C112 rồi
   promote. Hậu kiểm cả `tindung.vercel.app` và alias mặc định; nếu fail trả alias về C112.
4. Cập nhật deployment Production, kết quả từng smoke, source/final documentation SHA và Required
   CI trước khi chuyển C115 thành `COMPLETED`.

Lượt Required CI đầu của source commit `d8a4154` dừng ở Gitleaks do hai mật khẩu fixture tổng hợp
trong E2E bị nhận nhầm là generic API key; workflow policy và quality/build đạt. Bản khắc phục chỉ
allow đúng hai fingerprint lịch sử và đánh dấu inline fixture, không bỏ rule hoặc ignore theo file;
phải chạy lại full-history scan và Required CI trên SHA kế tiếp.
