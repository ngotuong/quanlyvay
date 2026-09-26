# Production readiness

Đây là báo cáo hiện hành sau checkpoint C59, đối chiếu Production với source runtime SHA
`66e2e8d88d6bb92d2b8b4fdc8c0ccc7e7c8ff7a5` lúc `2026-09-26 19:24 +07`.

## Kết luận

Production ở trạng thái **READY WITH ACCEPTED RISK**. Không còn phát hiện `CRITICAL`, `HIGH` hoặc
`MEDIUM` đang mở từ audit C51/C58. Hai rủi ro đã được OWNER chấp nhận là giới hạn branch protection
của GitHub Free/private và biên hiệu năng dashboard sẽ giảm khi dữ liệu tăng.

## Ma trận hiện hành

| Nhóm | Trạng thái | Mức độ còn lại | Bằng chứng hiện hành |
|---|---|---:|---|
| Nghiệp vụ và số liệu tài chính | `RESOLVED` | — | Migration C51/C54 hiện diện trên remote; pgTAP 527/527 và E2E 23/23 đạt; restore rehearsal C52 tính được 40/40 khoản và không có invariant tài chính sai. |
| Dữ liệu và database | `RESOLVED` | — | Supabase `ACTIVE_HEALTHY`; 36 migration local/remote khớp đến `20260926001000`; không có migration trong C59. |
| Auth, RLS, Push và secret | `RESOLVED` | — | Full Auth 6/6; Gitleaks trên diff và toàn bộ history trong CI sạch; tài khoản authenticated smoke đã inactive/banned sau kiểm tra. |
| UI/UX mobile–desktop và accessibility | `RESOLVED` | — | E2E bao phủ các viewport chính, keyboard, focus, contrast và touch target; authenticated smoke candidate và alias đạt trên desktop/mobile, không tràn ngang hoặc console error. |
| Hiệu năng dashboard | `ACCEPTED_RISK` | `LOW` | C54 giảm bundle từ khoảng 8.074 ms xuống 5.093 ms; ba probe authenticated đạt 5.168–5.555 ms dưới timeout 8 giây. Cần theo dõi khi dữ liệu tăng. |
| Thông báo và PWA | `RESOLVED` | — | Manifest/PWA và notification UI qua E2E/smoke; Production endpoint không secret trả 401; CSP cho phép worker/blob và kết nối Supabase cần thiết. |
| Kiểm thử | `RESOLVED` | — | Auth readiness dùng deadline 60 giây/backoff và có regression cho 502; CI không reset database lần hai trước Playwright. Run `36241173845` đạt ngay attempt 1. |
| CI/CD | `ACCEPTED_RISK` | `MEDIUM` | GitHub Free/private không enforce branch protection. Kiểm soát bù hiện hành chỉ phát hành đúng SHA có `Required CI gate` xanh; SHA C59 đã đạt. |
| Vercel Production | `RESOLVED` | — | Alias `tindung.vercel.app` trỏ `dpl_QQ4ymp6KrfYHngugdMdv4zu5bRrJ`, target Production, `READY`; Functions `sin1`; public/authenticated smoke và runtime error/500 check đạt. |
| Google Sync/Apps Script | `RESOLVED` | — | Version 6 và HEAD deployment hiện hữu; C55 đã full sync 13 tab và retry không tạo trùng. C59 không đổi bề mặt này. |
| Backup và phục hồi | `RESOLVED` | — | Backup `qlv-prod-20260926T115433Z` gồm sáu ciphertext đạt checksum/GCM/SQL shape/RPO. LaunchAgent chạy mỗi giờ, ngưỡng 20 giờ, khóa ở Keychain, lỗi phát macOS notification; retention chỉ dry-run. |
| HTTP hardening | `RESOLVED` | — | Production trả CSP với `frame-ancestors 'none'`, origin Supabase chính xác, `X-Frame-Options: DENY`, `nosniff`, referrer/permissions policy và COOP; login/Server Components/PWA/Auth smoke đạt. |

## Rủi ro đã chấp nhận

### GitHub Free/private không enforce branch protection

GitHub API xác nhận repository private trên gói hiện tại không hỗ trợ enforcement mong muốn.
Quy trình phát hành dùng kiểm soát bù: push fast-forward, đối chiếu SHA và chỉ công nhận checkpoint
sau khi toàn bộ job cùng `Required CI gate` của chính SHA đó xanh. C59 đã đạt bằng run
`36241173845` trên SHA `66e2e8d88d6bb92d2b8b4fdc8c0ccc7e7c8ff7a5`.

### Biên hiệu năng dashboard sẽ giảm khi dữ liệu tăng

Dashboard hiện đạt dưới statement timeout với regression budget 6 giây trên dữ liệu tương đương
Production. Đây là rủi ro tăng trưởng, chưa phải lỗi hiện hành. Tiếp tục theo dõi latency và số dòng;
không tăng timeout hoặc cache sai hạn số liệu tài chính để che truy vấn chậm.

## Bằng chứng C59

- Local đạt `git diff --check`, CI policy/actionlint, dependency audit, lint, typecheck, unit 79/79,
  build, database reset/lint, pgTAP 527/527, Auth 6/6 và Playwright 23/23.
- Backup Production `qlv-prod-20260926T115433Z` đạt toàn bộ integrity gate. LaunchAgent
  `com.ngotuong.quanlyvay.backup` loaded với interval 3.600 giây; kickstart kết thúc mã 0 và trả
  `not-due` vì bản mới chưa đủ 20 giờ.
- Candidate/alias Production đạt public và authenticated smoke trên các route dashboard, khoản vay,
  đối tác, chi phí, thông báo và tài khoản; PWA/mobile đạt, console sạch, runtime không có error/500.
- Commit `66e2e8d88d6bb92d2b8b4fdc8c0ccc7e7c8ff7a5` đã push fast-forward. GitHub Actions run
  `36241173845` đạt attempt 1 cả Workflow policy, Dependency/secret scan, Quality/build,
  Supabase/Auth/pgTAP/E2E và `Required CI gate`.
- Không migration, đổi secret, xóa backup hoặc sửa dữ liệu tài chính trong C59. Hai tài khoản smoke
  tạm thời đã được vô hiệu hóa và ban sau khi kiểm tra.
