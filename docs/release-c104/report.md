# C104 — Nghiệm thu và phát hành giao diện Tổng quan C103

Trạng thái: `COMPLETED` ngày 17/10/2026. Preview và Production đã phát hành sau đầy đủ gate,
authenticated smoke và hậu kiểm runtime.

## Candidate Preview đã loại

- Deployment ID: `dpl_F6AiVRcgkvK9g5FuH4w5dQsxj9be`.
- Immutable URL: https://quan-ly-vay-ca-nhan-7zlufgwrm-ngotuong2105.vercel.app.
- Root gate đạt `87 PASS / 18 SKIP / 0 FAIL` trong 20,6 phút; đúng project, target Preview,
  trạng thái Ready và Functions `sin1`.
- Authenticated visual smoke ở 390 px phát hiện nhãn preset “Tháng này” bị cắt thành “Thán…”.
  Candidate bị loại và stable alias không được chuyển.

## Sửa lỗi và kiểm tra local

- Preset có lớp nhãn nhìn thấy và chevron riêng; native select trong suốt vẫn giữ keyboard,
  accessible name và hành vi chọn hiện hữu.
- Phân bổ lại bốn cột mobile để hai ngày, mũi tên và preset cùng hàng; nhãn “Tháng này” phải vừa
  ở 375/390/430 px, các vùng chạm tối thiểu 44 px và không tràn ngang.
- Một lệnh targeted lọc riêng test Dashboard không hợp lệ với fixture tuần tự nên login bị từ chối;
  đây là lỗi cách chạy test, không dùng làm bằng chứng đạt.
- Full `business-flow.spec.ts` đầu tiên đạt 10/11 và bắt đúng nhãn còn bị cắt; sau chỉnh CSS chạy lại
  đạt 11/11 trong 2,1 phút. Targeted C72 responsive/focus đạt 1/1 trong 1,6 phút.

## Candidate Preview hiện tại

- Deployment ID: `dpl_CYu2xrf4q5Av8Cn2VRUjY4FDh9ij`.
- Immutable URL: https://quan-ly-vay-ca-nhan-2siohw1x8-ngotuong2105.vercel.app.
- Vercel project: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; target `preview`; trạng thái `READY`;
  danh sách build Functions ở `sin1`.
- Tạo từ repository root bằng `pnpm deploy:preview`; stable alias chưa chuyển.

## Gate và smoke đã đạt

- `git diff --check`, lint, typecheck, unit 123 và build 19 route đạt trong root runbook.
- Full E2E: `87 PASS / 18 SKIP / 0 FAIL` trong 20,7 phút, retries 0.
- Upload metadata guard: 249 file đạt.
- Public smoke: `/login`, `/manifest.webmanifest`, `/sw.js` và `/dashboard` đều HTTP 200.
- `vercel inspect` trả đúng deployment ID, project, target Preview, trạng thái Ready và vùng `sin1`.
- Pre-auth runtime error log không có dòng lỗi trong cửa sổ kiểm tra.
- Artifacts C75 do E2E sinh đã restore exact; database test vẫn ở baseline của gate C103.

## Stable Preview

- OWNER đã đăng nhập immutable candidate. Runtime ghi nhận `/dashboard`, `/loans`, `/counterparties`
  và `/notifications` đều HTTP 200; error log và HTTP 500 đều 0.
- Công cụ đọc tab bị Work settings chặn, nên OWNER trực tiếp xác nhận hai ngày `dd/MM/yyyy`, nhãn
  “Tháng này” đủ chữ, ba control cùng hàng và không tràn ngang.
- Root resume gate đạt lint, typecheck, unit 123, build 19 route và full E2E
  `87 PASS / 18 SKIP / 0 FAIL` trong 20,3 phút, retries 0.
- Runbook chuyển `https://tindung-preview.vercel.app` thành công sang
  `dpl_CYu2xrf4q5Av8Cn2VRUjY4FDh9ij`; inspect alias trả đúng project, target Preview, Ready và
  Functions `sin1`.
- Post-alias public smoke `/login`, `/manifest.webmanifest`, `/sw.js`, `/dashboard` đạt 4/4 HTTP 200;
  runtime error log 0 và không có HTTP 500 trong cửa sổ hậu kiểm.
- Artifacts C75 sinh lại trong resume gate đã restore exact; `git diff --check` đạt.

## Cổng đang chờ

OWNER đã phê duyệt stable Preview trong hội thoại.

## Candidate Production

- Production preflight từ repository root đạt `git diff --check`, lint, typecheck, unit 123,
  build 19 route và full E2E `87 PASS / 18 SKIP / 0 FAIL` trong 20,5 phút, retries 0.
- Upload metadata guard đạt 249 file; artifacts C75 sinh bởi E2E đã restore exact trước upload.
- Tạo từ repository root bằng `vercel deploy --prod --skip-domain`.
- Deployment ID: `dpl_4W6exy5ENdrbNt9Yq6La5Kz5eGyA`; immutable URL:
  https://quan-ly-vay-ca-nhan-2wg3nwzkd-ngotuong2105.vercel.app.
- Đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, trạng thái Ready và
  Functions ở `sin1`.
- Public smoke đạt `/login` 200, manifest 200 và hai endpoint bảo vệ 401; pre-auth runtime error
  và HTTP 500 bằng 0 trong cửa sổ kiểm tra.
- `--skip-domain` giữ nguyên cả `tindung.vercel.app` và alias mặc định ở rollback C102
  `dpl_GhWLqqTVyDbMGBedbiZ9mGJi5fgK`, target Production, Ready và Functions `sin1`.

## Cổng trước promote đã đạt

OWNER đăng nhập immutable Production candidate để chạy authenticated read-only smoke. Chỉ khi các
route Auth đạt và runtime không có lỗi ứng dụng/HTTP 500 mới promote, rồi hậu kiểm hai alias. Nếu
hậu kiểm thất bại, trả alias về rollback C102 đã xác minh.

## Promote và hậu kiểm

- OWNER đăng nhập immutable candidate; runtime xác nhận POST `/login`, `/dashboard`, `/loans`,
  `/counterparties` và `/notifications` đều HTTP 200; level-error bằng 0 trong cửa sổ Auth smoke.
- Candidate và rollback được inspect lại ngay trước promote; `vercel promote` exit 0.
- `tindung.vercel.app` và `quan-ly-vay-ca-nhan-ngotuong2105.vercel.app` cùng trỏ đúng
  `dpl_4W6exy5ENdrbNt9Yq6La5Kz5eGyA`, target Production, Ready và Functions `sin1`.
- Public smoke `/login`, `/manifest.webmanifest`, `/sw.js`, `/dashboard` đạt 4/4 HTTP 200 trên mỗi
  alias; runtime level-error bằng 0 trong cửa sổ hậu kiểm.
- OWNER đăng nhập cả hai alias. Runtime theo từng hostname xác nhận `/dashboard`, `/loans`,
  `/counterparties` và `/notifications` đều HTTP 200; level-error và HTTP 500 bằng 0 trong cửa sổ
  hậu kiểm. Rollback C102 `dpl_GhWLqqTVyDbMGBedbiZ9mGJi5fgK` được giữ nguyên và chưa kích hoạt.

C104 đạt acceptance criteria và hoàn tất. Không có thay đổi schema/RPC/financial engine, dữ liệu,
tài khoản, secret, Google hoặc backup; C100 tiếp tục là checkpoint đang theo dõi hiệu năng riêng.
