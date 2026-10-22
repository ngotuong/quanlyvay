# C108 — Nghiệm thu và phát hành C107

Trạng thái: `IN_PROGRESS` — OWNER đã đăng nhập; chờ nghiệm thu loading trên Preview. Báo cáo màn trắng đã được OWNER xác nhận là ở Production C106.

## Preview candidate

- Deployment ID: `dpl_2FBPHGYTWwmXJTU6qiyJLfspuc2a`
- Immutable URL: `https://quan-ly-vay-ca-nhan-ca4naima0-ngotuong2105.vercel.app`
- Project: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`
- Target/state: `preview` / `READY`
- Build region: `sfo1`; 46 lambda outputs, toàn bộ Server Functions: `sin1`
- Stable alias chưa chuyển; vẫn phục vụ deployment C106.

## Gate trước candidate

- `git diff --check`: đạt.
- Lint, typecheck: đạt.
- Unit: 123 pass.
- Build: 19 route.
- Full E2E: 90 pass, 18 skip theo điều kiện, 0 fail trong 26,2 phút; retries 0.
- Upload metadata guard: 251 file, đạt.
- Artifacts C75 do E2E sinh lại đã restore exact.

## Smoke candidate trước đăng nhập

- Public smoke `/`, `/login`, `/manifest.webmanifest`, `/icons/brand-symbol-192.png`: 4/4 HTTP 200.
- Vercel error-level logs: 0.
- Vercel HTTP 500 logs: 0.
- Candidate đã được mở tại `/login`; chưa nhập hoặc lưu thông tin đăng nhập bằng automation.
  [Ảnh màn hình chờ đăng nhập](preview-login.png).

## Bước đang chờ

OWNER đăng nhập immutable URL và kiểm cold/warm launch cùng chuyển Tổng quan → Khoản vay → Đối tác → Thông báo trên desktop và iPhone standalone. Sau đó agent kiểm authenticated routes, browser console và Vercel runtime logs. Chỉ khi đạt mới chạy resume command của root runbook để chuyển `tindung-preview.vercel.app`; chưa tạo Production candidate.

## Lỗi nghiệm thu và xử lý đang thực hiện

OWNER báo mở app phần lớn là màn trắng, loading nháy rồi trắng rồi nháy. Chưa xác định báo cáo
áp dụng riêng candidate hay cả alias C106; đã hỏi rõ hostname. Browser candidate đăng nhập thành
công, lần reload kiểm tra không có console error; điều này không phủ nhận lỗi trên thiết bị.

Phát hiện source có watchdog 15 giây tự ẩn overlay kể cả Auth/page chưa resolve và completion
timer không kiểm lại nội dung ở thời điểm ẩn. Bản sửa local đang kiểm: chỉ ẩn khi main có nội dung
nhìn thấy, kiểm liên tục cả khi fade, chờ lâu hiện nút tải lại thay vì lộ fallback rỗng. Bổ sung
regression deadline và cold launch authenticated kiểm từng frame. Chưa deploy bản sửa.

Kiểm tra bản sửa local: lint/typecheck/diff-check đạt; targeted loading 5 PASS / 0 FAIL trong
1,8 phút, retries0 (gồm slow deadline bằng client clock và authenticated continuous-frame).
Root `pnpm deploy:preview` đang chạy gate đầy đủ để tạo candidate thay thế; chưa có URL mới.

## OWNER làm rõ ngày20/10/2026

Hiện tượng nháy/trắng được báo ở biểu tượng `tindung.vercel.app`, vẫn chạy C106. Nhận định
ban đầu candidate C107 thất bại chưa có căn cứ và được đính chính. Preview chưa được OWNER
nghiệm thu loading. Bản gia cố local tiếp tục quy trình gate trước candidate mới, không promote
Production và không coi đây là đã tái hiện/sửa xong lỗi thực tế trên iPhone.


C108 candidate thay thế ngày20/10/2026: `dpl_KbaqYgwgDw8iDhopneTyPjydQxke`,
https://quan-ly-vay-ca-nhan-dyfgihcyr-ngotuong2105.vercel.app, project
`prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, targetPreview/READY, 46lambda outputs toàn bộ sin1.
Root create gate: diff/lint/typecheck/unit123/build19, full E2E `92 PASS / 18 SKIP / 0 FAIL`
trong26,5 phút, retries0; upload guard251. Public4/4 HTTP200, pre-auth error/HTTP500=0.
15 artifacts C75 đã restore exact từ HEAD sau backup. Bản gia cố giữ loading khi main chưa có
nội dung nhìn thấy; kiểm lại trong thời gian fade; sau15s hiện tải lại thay vì tự ẩn overlay.
OWNER cần tự đăng nhập hostname mới và nghiệm thu loading; chưa authenticated smoke, chưa resume
stable Preview, chưa Production. Báo cáo trắng ở biểu tượng tindung.vercel.app là trên C106.

## Authenticated smoke candidate thay thế — 20/10/2026

- OWNER đã tự đăng nhập immutable Preview.
- Dashboard, Khoản vay, Đối tác và Thông báo đều mở thành công bằng điều hướng thật trong browser.
- Sau mỗi lượt: `data-application-ready=true`, nội dung chính có dữ liệu nhìn thấy, không còn
  `.content-loading`, `.application-boot-loading` hoặc `data-navigation-pending`.
- Browser console: 0 warning/error. Vercel runtime: 0 level-error và 0 HTTP 500 trong cửa sổ kiểm.
- Số đo từ browser automation khoảng 3,1 giây/mục có gồm thời gian chờ của công cụ, chỉ dùng làm
  smoke; không dùng làm cam kết hiệu năng hay số đo iPhone.

Candidate đã qua smoke kỹ thuật nhưng vẫn chờ OWNER kiểm trực tiếp cold/warm launch trên iPhone
standalone và desktop, xác nhận không trắng/nháy. Chưa chuyển stable Preview hoặc Production.
