# C112 — Nghiệm thu và phát hành giao diện C111

Trạng thái: `COMPLETED` ngày22/10/2026. OWNER phê duyệt trực tiếp trong hội thoại.

## Candidate Preview

- Deployment ID: `dpl_5haoSjVywuPbw8BBz8mVpBFoqB3D`.
- Immutable URL: `https://quan-ly-vay-ca-nhan-gptftby1p-ngotuong2105.vercel.app`.
- Project ID: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`.
- Target/state: `preview` / `Ready`.
- Build: 47 output items; Server Functions tại `sin1`.
- Stable Preview vẫn trỏ C110; chưa đổi alias hoặc Production.

## Gate trước candidate

- Chạy từ repository root bằng `pnpm deploy:preview`.
- `git diff --check`, lint và typecheck: đạt.
- Unit: 123 pass; build: 19 route.
- Full E2E: 92 pass, 18 skip theo điều kiện, 0 fail trong 27,2 phút; retries 0.
- Local database đã reset baseline; upload metadata guard đạt 251 file.
- Public smoke: `/`, `/login`, manifest trả 200; hai API bảo vệ trả 401.
- Vercel pre-auth: level-error 0; HTTP 500 bằng 0.
- Artifacts C75 do E2E sinh lại đã restore exact; diff-check đạt.

## Cổng đang chờ

OWNER đăng nhập trên immutable URL, mở Dashboard và nghiệm thu tiêu đề `Tên • Số tiền` cùng badge
`Cho vay/Đi vay` ở góc trên bên phải trên mobile/desktop. Sau đó kiểm thêm Khoản vay, Đối tác và
Thông báo để tạo authenticated/runtime evidence. Chỉ khi candidate đạt mới chạy resume command của
root runbook để chuyển `tindung-preview.vercel.app`; chưa tạo Production candidate.

OWNER đã đăng nhập candidate. Runtime ghi POST `/login` và Dashboard HTTP200; Loans,
Counterparties và Notifications đều có request HTTP200 trong cùng cửa sổ. Vercel level-error và
HTTP500 bằng0. Browser control trong Work bị tắt nên agent không thể tự chụp/đo DOM candidate.
Khi nghiệm thu, OWNER yêu cầu tăng nhẹ badge hướng và bỏ dòng phụ `Gốc quá hạn và lịch nhắc`.
Candidate này không được promote; replacement candidate phải đi lại toàn bộ root gate.

## Replacement candidate

- Hai chỉnh sửa đạt targeted C96 `1 PASS` trong 2,4 phút; ảnh Chromium 375px đã được soi trực quan.
- Root gate đạt diff-check, lint, typecheck, unit 123 pass, build 19 route.
- Full E2E: 92 pass, 18 skip theo điều kiện, 0 fail trong 26,9 phút; retries 0.
- Upload metadata guard: 251 file; artifacts C75 đã restore exact sau gate.
- Deployment ID: `dpl_2a8avNFZHZxcDsZvheXP84dLu8Ri`.
- Immutable URL: `https://quan-ly-vay-ca-nhan-74fc7gb9r-ngotuong2105.vercel.app`.
- Project/target/state: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F` / `preview` / `Ready`.
- Build: 47 output items; Server Functions tại `sin1`.
- Public smoke: `/`, `/login`, manifest trả 200; hai API bảo vệ trả 401.
- Pre-auth logs: level-error 0; HTTP500 0.
- OWNER đã đăng nhập/nghiệm thu; Login, Dashboard, Loans, Counterparties và Notifications đều có
  request thành công, level-error/HTTP500 bằng 0 trước promote.

## Stable Preview rollback

- Resume runbook đã tạm chuyển `tindung-preview.vercel.app` sang replacement candidate.
- Hậu kiểm ghi một request Dashboard HTTP200 nhưng Server Component lỗi: RPC
  `dashboard.bundle` bị PostgreSQL hủy với mã `57014` sau 8991ms.
- Theo runbook, stable alias đã rollback ngay về C110 `dpl_148HdyQj5mLLoxocf5f3hyhjfDut`.
- Deployment rollback đúng project, target `preview`, `Ready`, 47 outputs và Functions `sin1`.
- Public rollback smoke đạt 200/200/200/401/401; HTTP500 bằng 0.
- Candidate C112 vẫn được giữ. Cần Auth Dashboard smoke mới sạch trước khi resume lại; chưa tạo
  Production candidate.

## Resume stable Preview lần hai

- OWNER chạy năm vòng Khoản vay → Tổng quan trên immutable candidate. Năm `dashboard.bundle` đều
  thành công: 1462,9; 1472,3; 1519,7; 1478,2; 1578,6ms; median 1478,2ms.
- Cửa sổ Auth smoke này không có `57014`, level-error hoặc HTTP500.
- Resume root gate đạt lint, typecheck, unit 123 pass, build 19 route và full E2E
  `92 PASS / 18 SKIP / 0 FAIL` trong 27,2 phút; retries 0.
- `tindung-preview.vercel.app` đã chuyển lại deployment C112
  `dpl_2a8avNFZHZxcDsZvheXP84dLu8Ri`; inspect xác nhận Preview/Ready, 47 outputs, Functions `sin1`.
- Public hậu kiểm stable alias đạt 200/200/200/401/401; cửa sổ log mới level-error 0, HTTP500 0.
- Artifacts C75 đã restore exact; diff-check đạt. OWNER đã phê duyệt stable Preview trong hội thoại.

## Production candidate

- Production preflight đạt `git diff --check`, lint, typecheck, unit 123 pass, build 19 route và
  full E2E `92 PASS / 18 SKIP / 0 FAIL` trong 27,2 phút; retries 0. Upload guard đạt
  251 file / 5.510.970 byte; artifacts C75 đã restore exact sau gate.
- Lượt deploy đầu `dpl_D3GsDGTM2aLYaHmvrFxJzf8JLuRA` lỗi build trước trạng thái Ready do cache
  C106 làm Turbopack báo `next/font/google queries have exactly one entry`. Hai alias Production
  vẫn trỏ C106. Retry một lần bằng `--force --skip-domain` bỏ build cache, không đổi source; build
  cùng Next.js 16.3.8 đạt 19 route.
- Candidate hợp lệ: `dpl_75xKhFuJ4wgspCmGdN4txdtNwyVF` tại
  `https://quan-ly-vay-ca-nhan-967no3d6v-ngotuong2105.vercel.app`.
- Project/target/state: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F` / `production` / `Ready`;
  47 output items, Server Functions tại `sin1`.
- Public smoke đạt 200/200/200/401/401; pre-auth level-error 0, HTTP500 0.
- `--skip-domain` giữ cả `tindung.vercel.app` và alias mặc định ở rollback C106
  `dpl_92pT2tjxRvCTEwyEePzJqMpGa8TG`.
- Đang chờ OWNER đăng nhập immutable Production candidate để kiểm Dashboard, Khoản vay, Đối tác,
  Thông báo và runtime log trước khi re-inspect candidate/rollback rồi promote.

## Production promote và hậu kiểm

- OWNER đã đăng nhập candidate. POST `/login`, Dashboard, Khoản vay, Đối tác và Thông báo đều
  HTTP200; browser console không có warning/error. Năm `dashboard.bundle` đều `outcome: ok` trong
  1456,9–1572,6ms; Vercel level-error 0 và HTTP500 0.
- Candidate và rollback C106 được re-inspect ngay trước promote: cùng project, target Production,
  `Ready`, Functions `sin1`; rollback vẫn là `dpl_92pT2tjxRvCTEwyEePzJqMpGa8TG`.
- `vercel promote` thành công. `tindung.vercel.app` và alias mặc định cùng trỏ
  `dpl_75xKhFuJ4wgspCmGdN4txdtNwyVF`, target Production, `Ready`, 47 outputs, Functions `sin1`.
- Public hậu kiểm mỗi alias đạt 200/200/200/401/401; cửa sổ mới level-error 0 và HTTP500 0.
- `tindung.vercel.app` giữ phiên đăng nhập: Dashboard Auth HTTP200, `dashboard.bundle` 1540,5ms
  `outcome: ok`; ứng dụng prefetch Khoản vay, Đối tác, Thông báo đều HTTP200. Browser control bị
  tắt trong Work settings ngay trước lượt click route, nên không suy prefetch thành visual smoke.
- OWNER xác nhận đã kiểm cả hai Production alias. Log từng hostname ghi Dashboard, Khoản vay, Đối
  tác và Thông báo Auth HTTP200. Dashboard bundle hậu kiểm đạt 1486,8–1625,8ms, tất cả
  `outcome: ok`; level-error 0, HTTP500 0 và không có `57014`.
- Rollback C106 giữ nguyên, chưa kích hoạt. C112 đạt toàn bộ acceptance; rollout còn lại của
  C108/C110 cũng hoàn tất qua deployment C112. C100 tiếp tục `IN_PROGRESS` độc lập.
