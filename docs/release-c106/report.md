# C106 — Nghiệm thu và phát hành C105

Trạng thái: `COMPLETED` ngày 18/10/2026. Preview và Production đều đạt đầy đủ gate, authenticated
smoke, promote/alias và hậu kiểm runtime theo phạm vi C106.

## Preview candidate

- Deployment ID: `dpl_Hq1YyafLYpdxcazFuskQXAseajrm`.
- Immutable URL: https://quan-ly-vay-ca-nhan-l06kvxaje-ngotuong2105.vercel.app.
- Tạo từ repository root bằng `pnpm deploy:preview`; stable alias chưa chuyển.
- Vercel project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview, trạng thái Ready,
  46 lambda outputs tại `sin1`; project Root Directory `apps/web`.

## Gate và smoke đã đạt

- `git diff --check`, lint, typecheck, unit 123 và build 19 route đạt trong root runbook.
- Full E2E: `87 PASS / 18 SKIP / 0 FAIL` trong 21,4 phút, retries 0.
- Upload metadata guard: 250 file đạt.
- Public smoke: `/login` và `/manifest.webmanifest` trả 200; `/api/google-sync/export` và
  `/api/notifications/run` trả 401 đúng auth boundary.
- Pre-auth log trong cửa sổ kiểm tra không có level error hoặc HTTP 500.
- Stable rollback hiện tại được inspect lại là C104 `dpl_CYu2xrf4q5Av8Cn2VRUjY4FDh9ij`,
  target Preview, Ready và Functions `sin1`; chưa kích hoạt rollback.
- Artifacts C75 do E2E sinh lại đã restore exact; `git diff --check` đạt.

## Stable Preview

- OWNER đăng nhập immutable candidate và xác nhận giao diện C106 đạt. Runtime ghi nhận Dashboard,
  Loans, Counterparties và Notifications; level-error và HTTP 500 bằng 0 trong cửa sổ smoke.
- Root resume gate đạt lint, typecheck, unit 123, build 19 route và full E2E
  `87 PASS / 18 SKIP / 0 FAIL` trong 20,6 phút, retries 0.
- Runbook chuyển `https://tindung-preview.vercel.app` thành công sang
  `dpl_Hq1YyafLYpdxcazFuskQXAseajrm`.
- Post-alias inspect trả đúng project, target Preview, Ready, 46 lambda outputs tại `sin1`; public
  smoke 4/4 đạt, runtime level-error/HTTP 500 bằng 0.
- Artifacts C75 sinh lại trong resume gate đã restore exact; `git diff --check` đạt.

## Production candidate

- Production preflight đạt `git diff --check`, lint, typecheck, unit 123, build 19 route và full E2E
  `87 PASS / 18 SKIP / 0 FAIL` trong 20,4 phút, retries 0; upload metadata guard đạt 250 file.
- Rollback trước deploy là C104 `dpl_4W6exy5ENdrbNt9Yq6La5Kz5eGyA` trên cả
  `https://tindung.vercel.app` và `https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app`.
- Candidate ID: `dpl_92pT2tjxRvCTEwyEePzJqMpGa8TG`.
- Immutable URL: https://quan-ly-vay-ca-nhan-kt9gxcuu7-ngotuong2105.vercel.app.
- Candidate đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, Ready,
  46 lambda outputs; Server Functions tại `sin1` và middleware phân phối edge.
- Public smoke đạt: `/login` và `/manifest.webmanifest` trả 200; `/api/google-sync/export` và
  `/api/notifications/run` trả 401. Pre-auth level-error và HTTP 500 bằng 0.
- Sau `--skip-domain`, cả hai Production alias vẫn trỏ rollback C104 như yêu cầu.

## Production rollout và hậu kiểm

OWNER đã đăng nhập Production candidate. Runtime ghi POST `/login`, Dashboard, Loans,
Counterparties và Notifications đều 200; `auth.user` đạt, level-error và HTTP 500 bằng 0.
Candidate và rollback được re-inspect trước khi `vercel promote` kết thúc thành công.

Hai Production alias hiện cùng trỏ `dpl_92pT2tjxRvCTEwyEePzJqMpGa8TG`, target Production, Ready;
public smoke trên từng alias đều đạt 200/200/401/401 và level-error/HTTP 500 bằng 0. OWNER đã đăng
nhập cả hai alias; từng hostname ghi nhận Dashboard, Loans, Counterparties và Notifications đều
200, level-error và HTTP 500 bằng 0. Rollback C104 được giữ nguyên, chưa kích hoạt.

C106 đạt acceptance. Không thay đổi schema/RPC/financial engine, dữ liệu, tài khoản, secrets,
Google, backup hoặc Git remote trong checkpoint phát hành này.
