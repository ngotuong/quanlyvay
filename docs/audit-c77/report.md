# C77 — Audit privacy biểu đồ, focus và artifact deployment

Ngày03/10/2026; OWNER đã phê duyệt. Trạng thái COMPLETED local.
Source bắt đầu `e5fdcfa121c3723bab9191d3562bf2761bb60407`, main khớp origin/main, không local diff.
C76 closing CI37087420173 SUCCESS cả5 job đã xác minh trước C77. Audit không sửa runtime,
RPC/schema/DB dùng chung, không deploy/push/xóa deployment hoặc đổi quyền/tài khoản/secret.

## Phương pháp và phạm vi

Audit: Next16.3.8/React19.2.4, Tailwind4 và component UI nội bộ; tokens/style trong
`apps/web/src/app/globals.css`, PrivacyProvider/BottomSheet/AppNav đã có. Giữ brand/layout.
Chrome headless channel chrome, production build local; chỉ dùng Supabase test
QuanLyVayCaNhan-C20-test API55321/DB55322, global setup/teardown có guard. Dữ liệu/số/ảnh đều giả.
Hai route dashboard có dòng tiền và loan interest có3 kỳ;375/390/1440 light/dark,
12 mẫu route/width/theme. Privacy toggle on/off, tooltip đang mở, bảng mở, accessible attributes,
chart DOM và restoration được kiểm. Ảnh chart crop và loan main-content trong thư mục này.
Đã xem5 ảnh đại diện (mobile light/dark, desktop light/dark); không tuyên bố xem từng pixel12 ảnh.
Mobile ảnh loan full-content có sticky navigation ở vị trí scroll, không phải lỗi che nội dung mới.
Không dựng UI mới/đổi token, không sử dụng ảnh thật từ Production.

Focus stress:64 chu kỳ menu mobile375/390, normal/reduced motion; chia32 eager và32 chờ
hai animation frame để phân biệt timing. 10 chu kỳ drawer Thêm đối tác kiểm Tab/Shift+Tab/Escape/
return focus, không fill/save. Document keydown/focusin listener chỉ ghi tag/href/timing synthetic.
Không monkey-patch handler/focus, không bỏ assertion hiện hữu. Audit thu cả thất bại thay vì dừng
ở mẫu đầu; test hoàn tất không có nghĩa sản phẩm không lỗi.

Remote: Vercel API GET source file tree/deployment/project metadata và CLI inspect alias/build
output metadata. Chỉ whitelist field vô hại vào evidence; raw metadata ở cache ignored.
Anonymous HEAD6 artifact paths và HEAD/_src,/_logs,/login mỗi host, không đọc body/follow redirect.
Không gọi file-content API/tải ciphertext/log/manifest, không đọc cookie/token hay financial screenshots.

## Phát hiện

| ID | Mức độ | Vị trí | Hiện tượng / tác động | Nguyên nhân / hướng sửa |
|---|---|---|---|---|
| F1 | MEDIUM / P2 | `apps/web/src/app/dashboard/page.tsx:171`, `globals.css:125` | Khi ẩn tiền, trục vẫn hiện “1 tr”, “500 nghìn” từ fixture ở6/6 mẫu; người nhìn màn hình suy ra quy mô dòng tiền. | Static span chỉ có class privacy-amount; CSS transition không mask. Dùng PrivacyAmount/PrivacyRegion cho scale hoặc mask cả chart, giữ layout và phục hồi số khi bật hiển thị. |
| F2 | MEDIUM / P2 | `apps/web/src/components/app/app-nav.tsx:38–40`; `test/e2e/c67-accessibility.spec.ts:65–68` | Focus người dùng/test vừa chuyển có thể bị kéo về nút đóng; kiểm Tab cuối không ổn định. 15/32 eager lỗi,32/32 settled đạt. | showModal đã focus nút đóng; callback rAF tiếp tục focus vô điều kiện. Chỉ set initial focus một lần, guard/cancel callback khi focus đã di chuyển/dialog đóng. Không dùng sleep/nới timeout để che lỗi. |
| F3 | MEDIUM / P2, public exposure chưa chứng minh | Hai deployment C73 dưới đây; historical upload thiếu exclusion, `.vercelignore` hiện đã sửa trongC76 | Mỗi source package còn77 backup files và58 test artifacts ngoài nhu cầu webapp. Tăng bản sao dữ liệu/metadata và phạm vi truy cập tài khoản nền tảng. | Ignore Git không thay thế exclusion upload. Giữ guard/payload inventory; loại deployment cũ theo danh sách duyệt sau khi có rollback sạch. Không xem404 mẫu là xác nhận không lộ toàn bộ. |

Không phát hiện CRITICAL/HIGH mới có đủ bằng chứng trong phạm vi này. Đây không phải audit toàn bộ
an ninh/financial engine. F3 không chứng minh plaintext/public compromise, không có cơ sở yêu cầu
đổi secret/key chỉ từ source inventory. F2 chứng minh race của initial focus trong harness;
chưa đo tần suất người dùng thật/mobile vật lý hoặc remote native. Không coi mọi lỗi focus là cùng gốc.

## F1: bằng chứng privacy

`browser-evidence.json`:6/6 dashboard beforeAxis = visibleAxis = “1 tr / 500 nghìn / 0 ₫”.
Axis `aria-hidden=true` nên không xuất hiện trong accessible snapshot; F1 là lộ bằng mắt/visible DOM,
không lặp lỗi accessible name C66. Sau toggle: cash-bar-control và tooltip bị gỡ; chart attributes
chứa ₫ count0; bảng fixture không còn giá trị1.000.000, hiển thị dấu*. Bật lại phục hồi buttons.

Loan interest:3 columns trước toggle, entire period-chart-card được gỡ6/6 mẫu sau toggle,
nhờ PrivacyRegion bao ngoài tại `loans/[id]/page.tsx:140`; period amounts dùng PrivacyAmount.
Chưa kiểm branch0/1/2/12 kỳ hoặc tất cả tooltip toàn app; C78 phải bổ sung boundary coverage.
Privacy là lớp trình bày, không phải quyền truy cập: React/server payload vẫn có thể chứa giá trị;
không tuyên bố chống DevTools hoặc thay RLS. Empty chart khác chart có dữ liệu.

Ảnh điển hình: [mobile light](dashboard-hidden-375-light.png),
[mobile dark](dashboard-hidden-390-dark.png), [desktop](dashboard-hidden-1440-light.png).

## F2: timing xác định được

Lượt đầu matrix PASS nhưng focus assertion last-link failed trước Tab; trace được tạo trong
apps/web/test-results (ignored) rồi runner thay output khi rerun. Log lượt đầu vẫn ở cache ignored;
không tuyên bố trace lượt đầu còn lưu hoặc sao chép trace/cookie vào Git.
Lượt đo cuối ghi64 menu cycles:

- eager:17 đạt toàn chuỗi;12 thất bại ở last-focus;3 ở Tab-wrap.
- settled hai rAF:32/32 chuỗi đạt. Không dùng kết quả này để đóng issue.
- drawer counterparties10/10 chuỗi đạt; menu Escape/return/state kiểm được cả sau lỗi.

Ví dụ375 normal: focus close386,7ms → link/settings394,4ms → close396,9ms không keydown giữa.
Ví dụ375 reduced: last link20227,2ms → close20230,7ms → keydownTab20233,4ms có targetclose →
focus link/expenses20233,6ms. Tab trong mẫu này đi từ nút đóng nên trap không sai ranh giới;
focus đã đổi giữa assertion lastFocused và keydown. Source callbackrAF vô điều kiện phù hợp trace.
Đây là bằng chứng mạnh cho race initial focus; chưa instrument tên callback/đo tất cả browser.
BottomSheet event.target trap hiện hữu không cần viết lại nếu không có evidence khác.

C78 cần kiểm opening nhanh/keyboard, close trước callback/reopen/navigation, Tab/Shift+Tab/Escape/
return focus và pending/dirty drawers. Không làm “fix” bằng thêm delay test hoặc bỏ kiểm focus.

## F3: source, build output và quyền truy cập

Đích cleanup đề xuất, chưa thực hiện:

| Môi trường | Deployment C73 | URL |
|---|---|---|
| Preview | dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb | https://quan-ly-vay-ca-nhan-c6pft4h1k-ngotuong2105.vercel.app |
| Production | dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx | https://quan-ly-vay-ca-nhan-7g0uxlwrm-ngotuong2105.vercel.app |

Cả hai Ready/cùng projectprj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F. Mỗi files API trả329 regular
source leaves dưới/src:63 .qlvbak ciphertext,11 manifest.json,3 log; test-results55PNG+3JSON=58.
Con số60 ởC76 history không khớp inventory live hiện hành; C77 dùng58, không tự giả định2file
đã xóa hay overwrite. Không đọc nội dung để xác minh encryption/secret của các bản remote.

CLI inspect build output metadata mỗi deployment44 lambda entries/0 forbidden path;
khác với source tree. Không trả complete static-file tree/bundle content, nên không kết luận
backup không thể có trong output toàn bộ. Source API/src files không phải public web document root.

Deployment metadata public=false là logs/source visibility, không phải webapp private.
Project SSO/password/trustedIPs null; /login200, /_src và/_logs307 vềvercel.com không follow.
Sáu HEAD mẫu artifact404. Kết quả phù hợp logs/source được bảo vệ; chưa kiểm quyền từng thành viên/
ACL account và không chứng minh không có đường khác. Xem tài liệu chính thức về
[logs/source protection](https://vercel.com/docs/project-configuration/security-settings),
[build source paths](https://vercel.com/docs/builds/build-features).

Alias active qua inspect vẫn PreviewC76 dpl_BBavYTasgvQ51wyTQbWunqysM6Fq và ProdC76
 dpl_AurpzZ3pUxe7Xp7dWnxuWa2fjXxw. C73Preview không alias; C73Prod còn default project alias
quan-ly-vay-ca-nhan-ngotuong2105.vercel.app. Không xóa khi chưa duyệt tác động alias/rollback.
Retention project30 ngày/deploymentsToKeep10 không phải bằng chứng artifact đã được xóa.

Phương án: C78 local privacy/focus + guard upload. Checkpoint vận hành riêng sau đó phát hành
revision đạt exact CI, inventory sạch, Auth/public/log/alias gates; dùng C76 sạch làm rollback,
đối chiếu default alias trước khi xóa đúng2 ID trên. Nếu có deployment ô nhiễm khác, trình thêm
danh sách để duyệt; không mở rộng xóa diện rộng. Không xóa backup local dùng cho recovery.

## Gate và giới hạn

- Opt-in C77 local audit lượt cuối2 tasks completed2,0m,12 matrix+64 menu+10 drawer; có15 lỗi
  focus đã lưu, không sửa sản phẩm. Build Next production chạy bởi E2E webServer.
- Lint/typecheck PASS sau harness; git diff-check và credential/artifact scan PASS khi chốt.
- DB test hậu kiểm profiles/loans/transactions0/0/0. Setup/teardown chỉ reset database test riêng.
- Không chạy lại full unit/pgTAP/Auth/E2E suite/CI: runtime/schema không đổi, chỉ test phục vụ audit.
- Mobile vật lý, VoiceOver/TalkBack/Safari/Firefox authenticated NOT_TESTED. Chrome immutable
  badgeC73 OPEN ngoài audit, không xác nhận nguyên nhân. Native browser mới không kiểm lượt này.
- Chưa có commit/push/deploy/migration/remote mutation. C78 AWAITING_APPROVAL; chưa bắt đầu sửa.

## Checkpoint kế tiếp

C78 — Remediation privacy biểu đồ, initial focus và upload guard, local only.
Phạm vi/acceptance đầy đủ tại mục36 của docs/IMPLEMENTATION_PLAN.md. Không đổi card KPI/task order,
brand, cách tính VND/lãi, RPC/schema hay database remote. Remote rollout/cleanup phải ở checkpoint riêng.
