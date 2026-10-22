# C110 — Nghiệm thu và phát hành C109 trên nền loading C107

Trạng thái: `IN_PROGRESS` ngày20/10/2026. OWNER phê duyệt trực tiếp trong hội thoại.

## Phạm vi

- Candidate Preview mới chứa gia cố loading C107 và giao diện C109.
- Candidate C108 cũ không được chuyển alias vì không chứa C109.
- Stable Preview/Production giữ C106 cho đến khi candidate mới qua đầy đủ gate và smoke.
- Không đổi schema/RPC/financial engine, dữ liệu/tài khoản/secrets/Google/backup hoặc Git remote.

## Candidate Preview

- Deployment ID: `dpl_EpSRPfcMmPgWABjvTBfjcpULtguh`.
- Immutable URL: `https://quan-ly-vay-ca-nhan-bzu57mgrr-ngotuong2105.vercel.app`.
- Project: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`.
- Target/state: `preview` / `Ready`; Server Functions tại `sin1`.
- Stable alias chưa chuyển và tiếp tục phục vụ C106.

## Gate trước candidate

- Chạy từ repository root bằng `pnpm deploy:preview`.
- `git diff --check`, lint và typecheck: đạt.
- Unit: 123 pass; build: 19 route.
- Full E2E: 92 pass, 18 skip theo điều kiện, 0 fail trong 27,0 phút; retries 0.
- Local database đã reset về baseline; upload metadata guard đạt với 251 file.
- Public smoke của runbook đạt: `/login` và `/manifest.webmanifest` trả 200; hai endpoint bảo vệ
  `/api/google-sync/export` và `/api/notifications/run` trả 401.
- Cửa sổ pre-auth không có Vercel level-error hoặc HTTP 500.

## Bước đang chờ

OWNER đã tự đăng nhập immutable URL. POST `/login` và Dashboard trả 200; log Dashboard ghi
`auth.user`, `profile.read`, `dashboard.bundle`, `notifications.count` và
`dashboard.attention-metadata` đều outcome `ok`. Loans, Counterparties và Notifications đều có
phản hồi 200 trong cửa sổ kiểm. Vercel level-error và HTTP 500 bằng 0.

Browser control trong Work bị tắt nên agent chưa thể tự xác nhận browser console, hình ảnh loading,
hàng việc đến hạn hoặc thao tác mở drawer. Chờ OWNER nghiệm thu trực tiếp các điểm này trên
candidate; chỉ sau xác nhận mới chạy resume command chuyển stable Preview. Chưa tạo Production
candidate.

## Stable Preview

- OWNER đã nghiệm thu và phê duyệt candidate trực tiếp trong hội thoại.
- Root resume chạy bằng `pnpm deploy:preview -- --candidate ... --verified-authenticated-smoke`;
  diff/lint/typecheck/unit123/build19 và full E2E `92 PASS / 18 SKIP / 0 FAIL` trong 27,0 phút,
  retries 0.
- Runbook đã chuyển `https://tindung-preview.vercel.app` sang
  `dpl_EpSRPfcMmPgWABjvTBfjcpULtguh`; rollback C106 không kích hoạt.
- Post-alias inspect: đúng project, target `preview`, state `Ready`, Server Functions `sin1`.
- Public smoke sau chuyển alias đạt 200/200/401/401; Vercel level-error và HTTP 500 bằng 0.
- Artifacts C75 do E2E sinh lại đã restore exact; `git diff --check` đạt.
- Đang chờ OWNER đăng nhập và phê duyệt stable Preview. Cookie immutable candidate không dùng chung
  hostname stable; chưa tạo Production candidate.

## Phản hồi stable và candidate thay thế

OWNER đã đăng nhập stable và kiểm lặp vòng Khoản vay → Đối tác → Thông báo → Tổng quan. Ba bước
đầu khá tốt, nhưng lần quay lại Tổng quan chậm hơn một cách ổn định. Runtime cùng phiên ghi lượt
Tổng quan đầu có `dashboard.bundle` 1.600,4ms; hai lượt quay lại là 1.480,4ms và 1.469,1ms. Một
lượt quay lại đồng thời có `profile.read` 1.130,7ms, trong khi lượt còn lại khoảng 47,7ms. Trang
Khoản vay cũng phát sinh một cụm request prefetch trang chi tiết ngay trước vòng quay lại.

Bản khắc phục tắt speculative prefetch trên card khoản vay, quick action “Ghi giao dịch” và link
việc quá hạn. Điều hướng chính vẫn prefetch shell; Tổng quan vẫn đọc lại dữ liệu authoritative và
không cache số dư giữa request/người dùng. Thay đổi này nhằm loại độ trễ tăng thêm do tranh chấp
request; thời gian nền của `dashboard.bundle` khoảng 1,5 giây vẫn tồn tại và phải được đánh giá
riêng bằng số đo thiết bị C100. Stable alias tiếp tục trỏ deployment C110 hiện tại trong lúc chạy
gate và tạo candidate thay thế; chưa tạo Production candidate.

Root create gate của bản khắc phục đạt `git diff --check`, lint, typecheck, unit123, build19 route
và full E2E `92 PASS / 18 SKIP / 0 FAIL` trong 26,7 phút, retries0; upload guard đạt 251 file.
Candidate `dpl_148HdyQj5mLLoxocf5f3hyhjfDut` tại
`https://quan-ly-vay-ca-nhan-6m940n7ty-ngotuong2105.vercel.app` đúng project
`prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `preview`, state `Ready`, Server Functions `sin1`.
Public smoke đạt 200/200/200/401/401 cho `/`, `/login`, manifest và hai API bảo vệ; pre-auth
level-error bằng0. Artifacts C75 đã restore exact và diff-check đạt. Stable alias chưa đổi; chờ
OWNER đăng nhập, kiểm vòng điều hướng và authenticated/runtime smoke trên immutable URL.

OWNER đã đăng nhập candidate và sau yêu cầu kiểm lặp vòng chính phản hồi thời gian quay lại Tổng
quan khoảng 2–3 giây. Runtime cùng phiên ghi POST `/login`, Dashboard, Loans, Counterparties và
Notifications đều HTTP 200. Hai lượt Dashboard có timing đầy đủ: `dashboard.bundle` 1.566,3ms và
1.470,8ms; `profile.read` 47,4ms và 39,5ms. Không còn cụm prefetch hàng loạt route chi tiết khoản
vay; chỉ có một request `/loans/new` của CTA tạo mới. Vercel level-error/HTTP500 bằng0. Candidate
đạt authenticated/performance smoke và đủ điều kiện chạy root resume gate để chuyển stable alias.

Root resume gate đạt lại `git diff --check`, lint, typecheck, unit123, build19 route và full E2E
`92 PASS / 18 SKIP / 0 FAIL` trong 26,9 phút, retries0. Runbook chuyển
`https://tindung-preview.vercel.app` sang đúng deployment thay thế
`dpl_148HdyQj5mLLoxocf5f3hyhjfDut`. Post-alias inspect xác nhận đúng project, target `preview`,
state `Ready`, Functions `sin1`; public smoke đạt 200/200/200/401/401 và Vercel level-error/
HTTP500 bằng0. Artifacts C75 đã restore exact, diff-check đạt; rollback stable C110 trước giữ
nguyên chưa kích hoạt. Chờ OWNER đăng nhập stable Preview và xác nhận lại trước Production.
