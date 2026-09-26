# Production readiness

Đây là báo cáo hiện hành sau checkpoint C58, đối chiếu Production với source SHA
`fe32304ac40ae6c44aea218c32e4467ae35f344a` lúc `2026-09-26 15:38 +07`.

## Kết luận

Production có thể tiếp tục phục vụ tải hiện tại. Không còn phát hiện `CRITICAL` hoặc `HIGH` chưa
xử lý từ audit C51. Các remediation nghiệp vụ, dữ liệu, Auth, Push, UI và dashboard đã được áp đúng
Production và có regression test. Trạng thái tổng thể là **READY WITH REMEDIATION** vì còn hai rủi
ro `MEDIUM` cần đóng để khả năng vận hành bền vững, cùng một rủi ro CI `LOW`.

## Ma trận phát hiện

| Nhóm | Trạng thái | Mức độ còn lại | Bằng chứng hiện hành |
|---|---|---:|---|
| Nghiệp vụ và số liệu tài chính | `RESOLVED` | — | Migration C51/C54 hiện diện trên remote; pgTAP 527/527 và E2E 22/22 đạt ở revision Production; restore rehearsal C52 tính được 40/40 khoản và không có invariant tài chính sai. |
| Dữ liệu và database | `RESOLVED` | — | Supabase `ACTIVE_HEALTHY`; 36 migration local/remote khớp đến `20260926001000`; table stats hiện hành ghi 40 khoản, 390 giao dịch, 551 kỳ lãi và 729 audit log. |
| Auth, RLS, Push và secret trong Git | `RESOLVED` | — | C51 thu hồi quyền RPC đổi mật khẩu khỏi authenticated, validate Push endpoint và đóng delivery đã giải quyết; Required CI, dependency audit và Gitleaks 113 commit đều đạt. |
| UI/UX mobile–desktop và accessibility | `RESOLVED` | — | E2E bao phủ 320/375/390/768/1024/1440 px, keyboard, focus, 200% text, contrast AA, dialog cuộn và touch target; authenticated smoke Production C53/C54 đạt. |
| Hiệu năng dashboard | `ACCEPTED_RISK` | `LOW` | C54 giảm bundle từ khoảng 8,074 ms xuống 5,093 ms; ba probe authenticated đạt 5,168–5,555 ms dưới timeout 8 giây. Regression 40 khoản có budget 6 giây, nhưng biên sẽ giảm khi dữ liệu tăng. |
| Thông báo | `RESOLVED` | — | Production endpoint không secret trả 401; Supabase runner POST gần nhất lúc `2026-09-26T08:00:00.544Z` trả 200; không có runtime error Production trong cửa sổ 6 giờ. |
| Kiểm thử | `OPEN` | `LOW` | Required CI của đúng SHA đạt ở attempt 2. Attempt 1 lỗi hạ tầng Auth cục bộ HTTP 502 sau reset; cùng hiện tượng từng xảy ra ở C48, cho thấy readiness gate E2E còn flaky. |
| CI/CD | `ACCEPTED_RISK` | `MEDIUM` | GitHub API xác nhận `main.protected=false`; GitHub Free/private không enforce branch protection. OWNER đã chấp nhận kiểm soát bù: chỉ phát hành đúng SHA có `Required CI gate` xanh. |
| Vercel Production | `RESOLVED` | — | Alias `tindung.vercel.app` trỏ deployment `dpl_2EoTbJAzcGYvdieQWiWUphwMnbT6`, target Production, `READY`; Functions dùng Node 24 và `sin1`; `/login` và manifest trả 200. |
| Google Sync/Apps Script | `RESOLVED` | — | `clasp` xác nhận version 6 và HEAD deployment hiện hữu; source/dist exact; C55 cùng ngày đã full sync 13 tab và retry không tạo trùng. Lệnh API executable chỉ đọc không có quyền chạy từ `clasp`, nên bằng chứng workbook dùng smoke C55. |
| Backup và phục hồi | `OPEN` | `MEDIUM` | Backup `qlv-prod-20260925T170915Z` còn trong RPO với tuổi 15,48 giờ; checksum, GCM và SQL shape của cả sáu file đạt; restore rehearsal C52 dưới RTO 4 giờ. Repository không có lịch daily backup/monitor và chưa có bằng chứng PITR đang bật, nên RPO sẽ hết lúc `2026-09-26T17:09:15Z` nếu không có bản mới. |
| HTTP hardening | `OPEN` | `MEDIUM` | Production có HSTS nhưng thiếu CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` và `Permissions-Policy`. |

## Phát hiện đang mở

### P2 — RPO phụ thuộc thao tác backup thủ công

- Vị trí: `docs/BACKUP_RESTORE.md` yêu cầu logical backup hằng ngày; repository chỉ có công cụ tạo,
  kiểm tra và retention, không có lịch chạy hoặc cảnh báo tuổi backup.
- Nguyên nhân: C52/C54 tạo backup theo checkpoint, chưa thiết lập tác vụ daily fail-closed.
- Không có bằng chứng hiện hành cho thấy PITR của nền tảng đang được bật để bù cho khoảng trống này.
- Tác động: backup hiện tại đạt RPO nhưng có thể âm thầm quá 24 giờ; khi sự cố xảy ra, lượng dữ liệu
  phải nhập lại có thể vượt mục tiêu đã công bố.
- Khắc phục: tự động hóa dump mã hóa qua Keychain/secret store, kiểm tra checksum/GCM/SQL shape,
  chạy retention dry-run và phát cảnh báo trước khi tuổi backup vượt 24 giờ. Không cần nâng gói
  GitHub; chọn môi trường chạy miễn phí/phù hợp với máy vận hành hiện có.

### P2 — Thiếu HTTP security headers

- Vị trí: `apps/web/next.config.ts`; phản hồi thật của `https://tindung.vercel.app/login`.
- Nguyên nhân: Next.js chưa khai báo bộ header bảo mật và proxy chỉ làm mới Supabase session.
- Tác động: trang có thể bị nhúng bởi origin khác, trình duyệt không được yêu cầu chặn MIME sniffing
  và referrer có thể lộ nhiều hơn cần thiết. Auth/RLS vẫn bảo vệ dữ liệu, nhưng lớp phòng thủ trình
  duyệt chưa đầy đủ.
- Khắc phục: thêm CSP tương thích Next.js/Supabase với `frame-ancestors`, `nosniff`, referrer policy,
  permissions policy và COOP phù hợp; kiểm thử login, Server Actions, Push/PWA và authenticated UI
  trước khi rollout.

### P3 — Supabase Auth local đôi khi chưa sẵn sàng sau reset E2E

- Vị trí: `apps/web/test/e2e/global-setup.ts`, đặc biệt cửa sổ retry 30 × 500 ms sau lần reset thứ hai.
- Nguyên nhân: Playwright tự reset database thêm một lần; health endpoint có thể tiếp tục trả 502
  quá 15 giây trên GitHub runner.
- Tác động: CI báo đỏ giả và cần rerun, làm chậm phát hành nhưng không ảnh hưởng Production.
- Khắc phục: dùng readiness deadline dài hơn có backoff, xác minh cả health và admin Auth probe sau
  reset, đồng thời tránh reset trùng nếu integration job đã chuẩn bị đúng database.

## Bằng chứng gate C58

- Local `HEAD` và `origin/main` cùng SHA `fe32304ac40ae6c44aea218c32e4467ae35f344a` trước thay đổi
  tài liệu C58; working tree ban đầu sạch.
- GitHub Actions run `36228844410`, attempt 2: toàn bộ năm job và `Required CI gate` đạt.
- `pnpm ci:validate`, `pnpm audit --audit-level high`, Gitleaks toàn bộ 113 commit và
  `git diff --check` đạt.
- Supabase project `hmfxnstrqfqpvsgfmjmd` `ACTIVE_HEALTHY`; migration local/remote khớp.
- Vercel Production không có runtime error trong cửa sổ kiểm tra; public Auth/Sync endpoints từ
  chối request thiếu secret bằng 401.
- Không deploy, migration, đổi secret, tạo tài nguyên remote, chạy sync, ghi dữ liệu hay push GitHub.
