# C62 — Audit UI/UX sâu

Ngày audit: 29–30/09/2026. Phạm vi: trải nghiệm webapp, không sửa code sản phẩm.
Baseline: `114c02a46fd4b5f2616459fa7f11ec871bc67931`; `main` trước audit ahead origin/main sáu commit
C60. Diff chưa push thuộc script backup/tài liệu; không có thay đổi UI giữa HEAD và origin/main.
Hai tài liệu context/roadmap đã sửa từ phiên lập C62 được bảo toàn. C61 chưa được thực hiện.

## Phương pháp và bằng chứng

Chrome qua Playwright, Next production build tại `http://127.0.0.1:3101`, Supabase test cô lập
`QuanLyVayCaNhan-C20-test` API `127.0.0.1:55321`, DB cổng 55322. Reset chỉ database test được
kiểm tra guard trong `scripts/test-environment.cjs`; toàn bộ tên/số tiền/ảnh là fixture tổng hợp.
Không truy cập tài khoản hay mutate Production. Không dùng báo cáo C58 để kết luận UI đạt.

- Harness: `apps/web/test/e2e/c62-audit.spec.ts`; chạy riêng vì dùng user từ global setup.
- [Số đo và inventory runtime](audit-c62/evidence.json); [mockup tương tác](audit-c62/proposal.html).
- 45 lượt route × viewport (375/390/768/1024/1440), thêm chi tiết khoản vay, landscape,
  reduced-motion, mất mạng và điều hướng chậm. Screenshot chờ skeleton biến mất trước khi chụp.
- `ms` trong inventory là thời gian goto đến khi nội dung sẵn sàng + 100ms ổn định; không phải
  Web Vitals. CPU không throttle; thử delay RSC là latency nhân tạo, không phải benchmark Production.
- Thang severity: HIGH = cản trở hoàn tất tác vụ/khả năng hiểu trạng thái quan trọng; MEDIUM =
  dễ gây nhầm hoặc tăng công thao tác; LOW = thiếu nhất quán nhỏ. Không gán CRITICAL nếu chưa có
  bằng chứng tác động dữ liệu. Nhận định thẩm mỹ là đánh giá chuyên môn, tách khỏi lỗi chức năng.

## Phát hiện và hướng khắc phục

Đường dẫn rút gọn `app/`, `components/`, `lib/`, `styles/` đều nằm dưới `apps/web/src/`.
Các tên form không có prefix nằm ở `apps/web/src/components/business/`.
Tổng: 2 HIGH (một lỗi runtime, một nguy cơ cần đo cold-start), 9 MEDIUM, 1 LOW; không có CRITICAL.
Severity của nguy cơ là ưu tiên điều tra, không chứng nhận lỗi đã xảy ra.

### UX01 — HIGH · functional/usability · Drawer không kết thúc tác vụ sau lưu

**Đã tái hiện browser.** Mở khoản → Giao dịch → nhập 1.000 → Ghi nhận. Server trả thành công,
form reset rỗng nhưng dialog còn mở (`observations.payment` và ảnh payment-success-390.png).
Expected: đóng sau xác nhận thành công, giữ toast bên ngoài và đưa focus về nút gọi/dòng cập nhật.
Lượt đo cuối ghi nhận phản hồi sau 464ms (một mẫu local, không phải SLA). Actual khiến người dùng phải đóng thủ công, không chắc thao tác đã xong, dễ thử gửi thêm.
Nguồn: `apps/web/src/components/business/loan-actions.tsx:34` chỉ clear dirty;
`form-parts.tsx:42` chỉ reset, không có completion callback. Không kết luận mọi drawer đều lỗi giống
nhau: tất toán có thể unmount khi trạng thái khoản chuyển SETTLED, cần kiểm riêng.
Sửa: callback onCommitted ở parent từng tác vụ, đóng duy nhất khi `ok` của request hiện hành;
không đóng khi validation/network/stale-preview fail. Regression: thành công đóng đúng một lần,
focus hợp lý, toast đọc được, danh sách mới; thất bại giữ dữ liệu; double-submit không tạo ghi trùng.

### UX02 — HIGH · usability/performance · Khoảng chờ trước khi app shell render

**Bằng chứng code; chưa đo cold-start trên điện thoại thật.** `app/layout.tsx:52–54` await phiên
và unread count trước khi trả shell; `app/loading.tsx` chỉ che phần route dưới layout. Do đó skeleton
route không bảo đảm feedback trong lúc layout/auth đang chờ. Login có pending trên nút sau submit,
nhưng không tương đương trạng thái khởi động phiên. Trường hợp cần tái hiện thêm: cold URL/PWA khi
Auth chậm, phiên hết hạn, quay lại tab lâu không dùng. Không khẳng định app hoàn toàn không loading.
Sửa: tách shell/fallback không chứa số tiền khỏi boundary auth/data, tránh flash login sai;
phản hồi checking-session rõ ràng, không delay giả. Gate: giữ chậm auth 2s/10s thấy trạng thái chờ;
phiên hết hạn về login một lần, deep-link được bảo toàn; chưa xác thực không lộ dữ liệu.

### UX03 — MEDIUM · functional · Tiến trình điều hướng có thể báo sai

`components/app/navigation-feedback.tsx:25–32`: click capture đặt pending trước dirty-form guard;
timer 8s tự xóa pending dù request chưa kết thúc. Không theo dõi popstate/router navigation bằng
state machine. Đã tái hiện: sửa đối tác → bấm Khoản vay → hủy confirm; URL vẫn /counterparties nhưng progress=true sau 200ms. Với RSC delay 10s, ở 8,4s URL vẫn /dashboard nhưng progress=false. Ba lượt delay 1,8s đều có progress ở 120ms và hoàn tất sau 1.985–2.046ms. Nguồn observations.cancelNavigation/slowNavigation và timings trong evidence.json.
Sửa: gắn pending vào lifecycle của navigation, cancel khi chặn điều hướng; khi quá lâu hiển thị
slow/retry thay vì biến mất. Gate: hủy rời form không có progress treo; request 10s vẫn feedback;
back/forward, query-only và click lại cùng route không để pending giả.

### UX04 — MEDIUM · usability · Quy tắc đóng drawer và dirty state khác nhau

`loan-actions.tsx:48–81`: payment hỏi khi dirty; settlement/restructure chỉ kiểm submit disabled.
`BusinessForm` chỉ bảo vệ rời trang/link, không nối dirty vào sheet. Khi đóng draft giảm gốc, parent không có dirty guard tương ứng payment. Nút disabled khi chưa có
preview là type=button nên không khớp selector submit: không đủ bằng chứng kết luận drawer rỗng
bị khóa. Browser: nhập ghi chú ở Giảm gốc → Escape; confirmations=0, dialog đóng. Đây là thiếu cảnh báo, chưa chứng minh draft bị xóa khỏi bộ nhớ. Cần phân biệt pending với disabled.
Sửa: truyền pending/dirty rõ ràng từ form, không query CSS disabled để quyết định close. Gate: drawer
rỗng luôn đóng được; draft hỏi giữ/bỏ; saving có phản hồi rõ; Escape/backdrop/nút/drag cùng chính sách.

### UX05 — MEDIUM · functional · Nhập 0 trong giảm gốc có trạng thái tính vô hạn

**Code-confirmed, cần regression browser.** `principal-restructure-form.tsx:21–24` return khi số gốc
<=0, nhưng dòng 56 hiển thị “Đang tính…” khi string `0` truthy và result null. Không có request
đang chạy. Sửa: state invalid/idle/loading/success/error riêng; 0 báo lỗi tại field, không spinner.
Gate: rỗng, 0, vượt gốc, nhập nhanh, đổi ngày, abort request không để preview cũ hay loading treo.

### UX06 — MEDIUM · visual/usability · Bộ lọc và card quá cao trên mobile

**Ảnh runtime loans-390.png.** Trước khoản đầu tiên có CTA, card lọc nhiều hàng, clear-filter và chip;
trạng thái vừa ở select vừa chip, vừa trong card. Giá trị select bị cắt “Đang hoạt đ…”. Card khoản
lặp số tiền trong tiêu đề và dư gốc, chứa nhiều metadata nên một viewport chủ yếu chỉ xem được một
khoản. `app/globals.css:536–538` metadata .75rem; số tiền trong grid 3 cột nhỏ dù quan trọng.
Sửa: search + filter compact, chip chỉ khi khác mặc định, card ưu tiên tên/dư gốc/việc đến hạn;
metadata phụ trong detail. Gate: nhãn filter không mơ hồ, số tiền đọc đủ ở 375px/font lớn,
không tăng số bước ghi thanh toán từ list, thử dữ liệu 25+ khoản và tên dài.

### UX07 — MEDIUM · visual/usability · Form thêm đối tác lấn danh sách và thiếu tìm kiếm

`app/counterparties/page.tsx:24–34`: form thêm đứng trước list trên mobile; list tải toàn bộ rồi slice,
không ô tìm kiếm. Người thường sửa/xem đối tác phải đi qua form và phân trang. Ảnh counterparties-390.
Sửa: list-first với search, CTA mở form theo nhu cầu; edit xong thu gọn, highlight dòng đã đổi.
Gate: tìm/sửa đối tác không cần qua form thêm; không mất nội dung khi lỗi; trả đúng page/search.

### UX08 — MEDIUM · accessibility/design-contract · Vùng chạm thiếu nhất quán

Runtime quét kích thước phát hiện summary “Chỉnh sửa thông tin” cao khoảng 26px và một số tab
thông báo khoảng 38px. `counterparties/page.tsx:29`, `styles/ui-primitives.css:80` quick action
min-height 42px. Không tự gán fail WCAG cho mọi control <44px: WCAG 2.2 AA 2.5.8 là 24px hoặc
ngoại lệ spacing; label của radio/checkbox có thể mở rộng hit area. Nhưng thấp hơn contract nội bộ
44px và khó chạm hơn. Sửa: đo hit area thực, nâng action thường dùng >=44px; giữ label clickable.
Gate: hình học + click cạnh control, focus visible, không overlap vùng chạm.

### UX09 — MEDIUM · feedback/accessibility · Thông báo cùng nội dung bị bỏ qua

`form-parts.tsx:69–74`: dedupe chỉ bằng message, không request ID; lần save sau có cùng message
không phát toast lại nếu component còn mounted. `ToastProvider` nằm ngoài native dialog top-layer:
trong lúc dialog còn mở toast có thể bị scrim che/inert; inline message còn nhưng không giải quyết
trải nghiệm hoàn tất. Sửa: dùng operation identity, đóng thành công rồi announce từ live-region bền.
Gate: hai lần lưu hợp lệ có cùng message đều báo; không announce đôi; screen reader kiểm thực.

### UX10 — MEDIUM · usability · Nút tải lại xuất hiện ngay khi không có lỗi

`settlement-form.tsx:32–34` luôn hiển thị “Tải lại bảng tất toán”, restructure dòng 58 luôn có
“Tính lại phương án” sau nhập. Preview đã tự fetch; action này dễ bị hiểu là bước bắt buộc, cạnh
tranh với xác nhận thật. Sửa: retry khi lỗi/stale hoặc action phụ nhẹ có lý do; tự tính có trạng thái
rõ. Gate: không cần bấm reload ở happy path; vẫn retry được khi mạng lỗi, giữ xác nhận tài chính.

### UX11 — LOW · visual · Hierarchy dashboard cần tập trung vào công việc

Ảnh dashboard-1440/390: banner lịch nhắc và panel lịch dự kiến lặp ngữ cảnh, chart dữ liệu 0 vẫn
chiếm khối lớn; nhiều border/card/nhãn cùng độ nổi bật, chữ metadata nhỏ. Đây là đánh giá thị giác
trên fixture ít dữ liệu, không suy ra mọi dataset đều như vậy. Nguồn `app/dashboard/page.tsx`,
`app/globals.css:959–1034`. Sửa: khối “Cần xử lý” có CTA trực tiếp, báo cáo là lớp sau; empty-chart
gọn với diễn giải. Gate: mockup cả dataset trống/ít/nhiều, đo thời gian tìm việc đến hạn.

### UX12 — MEDIUM · performance/usability · Recovery có thể reload toàn trang sau lưu

`lib/business/render-recovery.mjs:5–13` gọi location.reload sau 3s nếu revision không đổi. Đây là
fallback bảo vệ cập nhật dữ liệu, không phải lỗi tài chính; có nguy cơ mất scroll/focus và tạo cảm
giác chớp app. Chưa tái hiện reload ở lượt thanh toán đo. Sửa chỉ sau khi xác định nguyên nhân render
không commit; duy trì read-after-write correctness, đừng xóa fallback chỉ để làm animation đẹp.
Gate: 3 lần mutation có refresh chậm/failed, không mất draft khác, không tự gửi lại mutation.

## Quy chuẩn mục tiêu và bản thiết kế

Giữ định hướng fintech sáng/cobalt hiện có, không dùng khuyến nghị dark-only tự động từ skill vì
không phù hợp contract dự án. Giảm số surface cạnh tranh; typography body 16, secondary 14,
heading 24/28, amount 24–32 tabular; spacing 4/8/12/16/24/32; radius 10–16; shadow nhẹ; một primary
CTA cho tác vụ. Đỏ cho nguy hiểm/trạng thái, không làm nút tất toán áp đảo ghi giao dịch thường ngày.

Mockup HTML có app shell, dashboard, danh sách/chi tiết, payment drawer, login/checking/loading;
responsive cả mobile/desktop. Dữ liệu giả, delay chỉ minh họa pending trong mockup, không là yêu cầu
thêm delay sản phẩm. Mô phỏng success đóng + toast, lỗi giữ drawer; mockup chưa phải implementation.

State contract: idle → editing → validating → saving → success/field-error/network-uncertain.
Chỉ success authoritative mới close/reset. Lỗi giữ input và focus field đầu; uncertain giữ mã request
để retry an toàn. Cancel khi dirty hỏi một lần; pending không nhầm với disabled do preview/validation.
Đóng phải restore focus; khi trigger biến mất, focus heading/dòng kế tiếp. Loading route bảo toàn shell,
không phủ lại toàn app mỗi tab, không announce liên tục hoặc tự tắt vì hết timer.

## Baseline thao tác và mục tiêu

Đơn vị là quyết định click/tap, không đếm từng ký tự; chọn field + nhập tính một lượt nhập; scroll
phụ thuộc viewport/dataset. Đây là walkthrough cấu trúc trên fixture, chưa là usability study người thật.

| Luồng / điểm xuất phát | Baseline thao tác tối thiểu | Thừa/ma sát | Mục tiêu |
|---|---|---|---|
| Tạo khoản từ list, đối tác có sẵn, mặc định cho vay | 1 mở + 1 tìm + 1 chọn đối tác + 1 nhập gốc + 1 nhập rate + 1 lưu = 6 | Các tùy chọn nâng cao dài | <=6; disclosure tùy chọn, không bỏ field nghiệp vụ |
| Ghi lãi từ detail | 1 mở + 1 nhập tiền + 1 lưu + 1 đóng = 4 | Đóng tay sau success đã tái hiện | 3, tự close; không tự submit |
| Tất toán từ detail, giữ ngày | 1 mở + 1 xác nhận + 1 lưu = 3 | Reload trông như bước thứ tư | 3; giữ preview + xác nhận |
| Giảm gốc từ detail | 1 mở + 1 nhập gốc + 1 xác nhận + 1 lưu + có thể 1 đóng | Preview dài; chính sách đóng draft khác payment | 4; submit/summary tiếp cận được |
| Sửa đối tác đang thấy trong list | 1 mở disclosure + 1 sửa + 1 lưu + 1 thu gọn = 4 | List nằm dưới form thêm, tìm nhiều trang | 3 ở dòng đã tìm; search riêng |
| Tìm khoản cần thu từ dashboard | 1 mở lịch/danh sách + chọn khoản = >=2 | Lặp ngữ cảnh; chưa đo người dùng | Một click tới khoản/CTA đúng ngữ cảnh |

## Ma trận bằng chứng

PASS dưới đây chỉ là render nội dung và không tràn ngang tài liệu, không phải toàn bộ UX đạt.
Mỗi hàng lấy từ evidence.json, OWNER, theme light; `/account` chuyển về settings.

| Route / trạng thái dữ liệu sẵn sàng | 375 | 390 | 768 | 1024 | 1440 | Vấn đề khác |
|---|---|---|---|---|---|---|
| /dashboard | PASS | PASS | PASS | PASS | PASS | UX11 |
| /loans | PASS | PASS | PASS | PASS | PASS | UX06 |
| /loans/new | PASS | PASS | PASS | PASS | PASS | Form dài, cần thiết kế disclosure |
| /counterparties | PASS | PASS | PASS | PASS | PASS | UX07–08 |
| /expenses | PASS | PASS | PASS | PASS | PASS | Empty fixture, không đại diện danh sách dài |
| /notifications | PASS | PASS | PASS | PASS | PASS | UX08 |
| /account → /settings | PASS | PASS | PASS | PASS | PASS | Alias route |
| /settings | PASS | PASS | PASS | PASS | PASS | OWNER có quản trị tài khoản |
| /audit | PASS | PASS | PASS | PASS | PASS | Disclosure nhỏ UX08 |

| Hành trình / trạng thái | Môi trường | Kết quả / giới hạn |
|---|---|---|
| Login → bắt buộc đổi mật khẩu → dashboard | Chrome desktop | PASS happy path, ảnh login-desktop |
| Payment success → reset/close | 390 | FAIL UX01; server thành công, form reset nhưng drawer mở |
| Giảm gốc draft → Escape | 390 | FAIL UX04; không confirm, drawer đóng |
| Navigation bị hủy / kéo dài 10s | 390 | FAIL UX03; progress sai lifecycle |
| Navigation delay 1,8s × 3 | 390 | PASS feedback ở 120ms; không đại diện cold auth |
| Offline / trở lại online | 390 | PASS thông báo offline; suite kiểm lỗi/retry riêng |
| Payment drawer landscape + reduced motion | 844×390 | PASS hộp nằm trong viewport, chưa đo mọi animation |
| Tăng font 200% | 640×450 | PASS không overflow; browser zoom thật NOT_TESTED |
| Cold auth chậm, PWA resume, hết phiên, restore scroll | Thiết bị thật/remote | NOT_TESTED; UX02 là nguy cơ code, không phải lỗi đã tái hiện |
| VoiceOver/NVDA, bàn phím mềm iOS/Android | Thiết bị thật | NOT_TESTED; giả lập viewport không thay thế thiết bị |
| Remote authenticated comparison | Production | NOT_TESTED trong C62, không cần đổi phiên/tài khoản |

### Inventory form và quyền

| Nhóm | Kiểm trong C62 | Phần cần regression bổ sung |
|---|---|---|
| Tạo đối tác, tạo khoản + quick create, payment, nợ xấu | Suite business-flow/c20: mutation, validation, giữ input, dirty guard | Toàn bộ close/focus/toast theo từng operation |
| Tất toán, đảo tất toán, giảm gốc | Suite business-flow/c20: preview, stale, ledger/history | Dirty/pending/close nhất quán; 0-principal UX05 |
| Sửa/đảo giao dịch | Đọc component; suite chỉ kiểm đảo tất toán, không suy ra sửa giao dịch đạt | Matrix lỗi/đóng/focus của từng drawer NOT_TESTED |
| Chi phí chung/khoản, chỉnh khoản/đối tác | Đọc source, layout; sửa đối tác + cancel runtime | Mọi nhánh save/error/double-submit NOT_TESTED |
| Login/đổi mật khẩu/logout, tạo nhiều tài khoản | Suite hiện hữu; local OWNER/EDITOR/VIEWER | Expiry/resume, assistive technology NOT_TESTED |
| Filters/tabs, đọc thông báo, cài đặt cá nhân/menu | Suite hiện hữu deep link, settings cả ba role, offline/retry | Back/forward/scroll trên mọi màn NOT_TESTED |
| Drawer/dialog chung, toast, live-region, recovery | Đọc source và runtime payment/giảm gốc/menu | Repeated toast, focus sau trigger unmount, recovery UX12 |

Audit không phát hiện blocker truy cập môi trường local; các ô NOT_TESTED là giới hạn bằng chứng,
không được chuyển thành PASS. Không có màn báo cáo riêng: chart/báo cáo ở dashboard; tài khoản cá
nhân ở settings; quản trị user chỉ OWNER. Không có screen CRUD riêng cho mỗi loại giao dịch.

## Coverage, giới hạn và backlog kiểm thử

PASS chỉ dành cho tiêu chí đã đo, không có nghĩa toàn màn hình không lỗi. Các route dùng OWNER trong
harness chính; quyền EDITOR/VIEWER, workflows khác được kiểm bởi suite hiện hữu khi chạy trong C62.
`/account` redirect `/settings`; báo cáo nằm trong dashboard, lịch nhắc nằm trong dashboard/notifications,
không có route báo cáo độc lập. `/ui-playground` là dev/preview surface, không phải luồng vận hành.

- Login/change-password: happy path browser; cold-auth latency/PWA standalone thiết bị thật NOT_TESTED.
- Dashboard/list/new/counterparties/expenses/notifications/settings/audit: 5 widths trong evidence.json;
  45 measurements là layout/render, không chứng nhận mọi trạng thái hoặc quyền.
- Loan detail/drawer payment: success được tái hiện; lỗi/error/dirty/navigation mở rộng ghi trong evidence.
- Landscape/reduced-motion và tăng font 200% được kiểm; tăng font không thay thế browser zoom 200%.
- Browser zoom thật, iOS Safari/Android keyboard, VoiceOver/NVDA, resume PWA/session expiry và concurrent
  edit giữa hai tab: NOT_TESTED; cần kiểm ở remediation. Không có phiên remote được sử dụng.
- Contrast chỉ mẫu control mà suite đo, chưa đo mọi token/text; không công bố WCAG compliance toàn app.
- Chưa có RUM INP/CLS hay profile CPU waterfall đầy đủ; thời gian local không ngoại suy Production.

Thiếu regression trọng yếu: auto-close sau commit, không khóa close khi preview disabled, cancelled
navigation không progress, timeout navigation, repeated toast, 0-principal loading, cold Auth fallback,
focus sau unmount và restore scroll. Test hiện hữu thường assert message/data; success assertion chưa
kiểm “tác vụ kết thúc đúng” nên CI xanh không bác bỏ phản hồi OWNER.

## Ưu tiên remediation

1. C63 đề xuất: UX01–05 và UX09, trạng thái action/navigation/focus; tác động thường xuyên, chi phí
   vừa, rủi ro regression tài chính cần E2E local. UX02 cần tái hiện cold-auth trước chỉnh boundary.
2. Checkpoint tiếp theo sau C63: UX06–08/10–11, thiết kế lại shell/list/detail/dashboard theo mockup
   đã duyệt, đo số bước/dữ liệu 25+ khoản/tên dài; chi phí vừa–lớn.
3. UX12: điều tra render recovery có đo đạc; không bỏ read-after-write fallback khi chưa có thay thế.
   Mobile thật và assistive technology là gate trước rollout UX lớn, không tự coi desktop emulation đủ.

Tham chiếu tiêu chí: [W3C Target Size AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
phân biệt 24px với contract 44px; [W3C Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
cho thông báo kết quả không cần chuyển focus. Skill áp dụng: ui-ux-pro-max; không dùng đề xuất màu/style
tự động làm bằng chứng lỗi.


## Gate kết thúc C62 — 30/09/2026

- `pnpm lint`, `pnpm typecheck`: PASS sau chỉnh harness cuối.
- `C62_AUDIT=true pnpm test:e2e c62-audit.spec.ts`: 1 PASS (1,7 phút), production build của
  Playwright webServer đạt; 45 route/width rows và 30 ảnh tổng hợp gồm mockup được giữ trong repo.
- `pnpm test:e2e`: 23 PASS (2,7 phút), harness C62 opt-in được skip có chủ đích (1 skipped).
  Suite build lại Next production, test fixture/reset/teardown trên DB test cô lập. Các log lỗi
  DB/HTTP do test fault injection không phải kết luận runtime Production lỗi.
- Mockup smoke: payment success tự close và toast hiện; hình mobile/desktop được kiểm trực quan.
- `git diff --check`: PASS. Scan nội dung audit/harness không thấy token/private-key/JWT/connection
  string; ảnh lấy từ fixture test, không lấy dữ liệu tài chính thật.
- Không chạy lại unit/pgTAP/Auth standalone vì chỉ thêm audit/harness/mockup, không đổi runtime,
  schema hoặc logic nghiệp vụ. Full E2E vẫn kiểm Auth và mutation fixture qua DB local.
- Chỉ hoàn tất **audit với các giới hạn ghi rõ**, không chứng nhận UI đã sửa hay Production đạt
  toàn bộ UX/a11y. C63 chờ phê duyệt; chưa triển khai remediation, commit/push hoặc deploy.
