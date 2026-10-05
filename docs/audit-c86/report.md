# C86 — Audit hiệu quả thao tác và phản hồi thị giác

Trạng thái: `COMPLETED` — audit trong phạm vi và giới hạn ghi dưới. OWNER phê duyệt C86 và bổ sung bốn phản hồi trực tiếp ngày 05/10/2026.
Repo baseline `9813a6b1b91322e82ef33374928679a22774c0db`; runtime C83/C84 phát hành từ `198248bd3e1dcfb00598bce0b94fa3c9f65d88f2`, không có diff runtime giữa hai SHA. Production `tindung.vercel.app`.
Không sửa runtime, schema/RPC hoặc dữ liệu dùng chung; chưa commit/push/deploy.

## Kết luận trong phạm vi đã kiểm

36 hành trình local đã thực hiện được. Điều đó xác nhận thao tác chạy được, không xác nhận thiết kế đẹp hoặc phù hợp OWNER. Phản hồi nền quá đơn điệu, chữ nhỏ và control phụ nặng có bằng chứng hình học và CSS. Có năm đề xuất ưu tiên MEDIUM về cảm giác đọc/hiệu quả thao tác; phân loại **Gu/UX** thay vì gọi màu/font/mật độ là lỗi nghiệp vụ. Không có phát hiện HIGH/CRITICAL mới trong phạm vi C86. Không suy rộng thành chứng nhận toàn bộ nghiệp vụ tài chính, accessibility hay mọi trình duyệt.

Audit stack: Next 16.3.8 + React 19.2.4 + Tailwind v4; bộ UI nội bộ tại `apps/web/src/components/ui`, token/CSS tại `src/app/globals.css` và `src/styles/ui-primitives.css`. Không có shadcn/Radix hay thư viện chart chuyên dụng. Inter có subset Vietnamese và được nạp trong build hiện hữu. Nội dung chính có phong cách phẳng với card sáng; tầng app header/nav có blur. Scan file runtime, loại tên lớp nổi: glass2files/gradient2/raised1/color-utility0; đây là số file, không phải chứng nhận phong cách hoặc số màu. Các màu icon lãi/đi vay/cho vay có vai, không trung tính hóa chúng bằng luật Gu của skill.

Skill Evon áp dụng nhánh **V — soi**, đối chiếu N1–N12, typography/nhịp/card/button và probe thật. Phản hồi mới của OWNER ưu tiên chữ dễ đọc hơn mặc định 14px của skill; không áp nhịp nhỏ chỉ vì skill thích dày dữ liệu. Không đổi font hoặc vai màu trong app khi chưa duyệt remediation. A/B dưới đây là mô phỏng tĩnh đề xuất, không phải app đã chỉnh.

## Phát hiện / đề xuất

| ID | Mức / hạng | File, vị trí | Bằng chứng và nguyên nhân | Tác động thấy được | Hướng khắc phục / phạm vi |
| --- | --- | --- | --- | --- | --- |
| G1 | MEDIUM · Gu thị giác | `apps/web/src/app/globals.css:15`, `:631`, `:1438`, `:1440`; dashboard/card/shell | Light nền #f6f7fb/card #fff, chênh luminance khoảng1,07:1. KPI, công việc và nhắc lịch đều card trắng/viền nhạt. Compact override bỏ bóng và hạ nhấn banner; không thay hệ phân vùng tương ứng. Remote390 và local375/390/1440 thấy cùng cấu trúc. Không gọi ranh giới card này là trượt WCAG. | Mắt khó tách các vùng; nhiều khối cùng trọng lượng, cảm giác trắng đơn điệu theo OWNER. | C87 chọn A (nền xanh xám rõ) hoặc B (thêm sidebar navy/KPI xanh). Giữ blue hiện hữu, màu có nghĩa, số liệu và thứ tự KPI. B thay vai màu sidebar/KPI nên là đề xuất cần OWNER chọn, không áp ngầm. |
| G2 | MEDIUM · Gu typography | `globals.css:566`, `:1052`, `:1434`, `:1435`, `:1483`, `:1495`; `app/layout.tsx:16` | Inter đã nạp; body16px. Nhãn KPI13px; comparison12px; nav mobile11,2px; số KPI16px mobile/20px desktop; tên khoản vay desktop14px. Thang font phân tán qua nhiều override compact. | Thông tin cần đọc nhỏ hơn control phụ16px/750; tên/giá trị không nổi rõ. Font không hỏng dấu; vấn đề chủ yếu ở cỡ và hierarchy, không quy kết Inter “cũ”. | C87 body16/nhãn14/nav≥12, KPI18–24 phù hợp VND nguyên dòng; ưu tiên Inter hiện hữu, cân weight400/500/600. Giữ focus và đọc đủ tên/số dài. |
| G3 | MEDIUM · Gu control | `ui-primitives.css:2`, `:12`; `globals.css:1030`, `:1403`; `business/attention-items.tsx:12`, `dashboard-period-filter.tsx:62`, `loan-advanced-filters.tsx:34` | .ui-button weight750; Tùy chỉnh≈129,77×44; Nâng cao≈139,56×44; attention-toggle324×46 tại390,309×46 tại375,555,81×46 tại1440. Toggle100% + margin12 tạo một hàng phụ riêng trước danh sách. | Hành động xem/mở phụ hút mắt hơn KPI/nhãn; chiếm chiều ngang và đẩy việc đầu xuống. | C87 chuyển toggle vào header, chữ14/weight500–600; control có chiều rộng theo nội dung. Giữ vùng chạm44 mobile và focus; không chỉ thu button xuống24px để nhìn gọn. Không bỏ toàn bộ công việc hoặc đổi tập dữ liệu authoritative. |
| G4 | MEDIUM · Gu startup + giới hạn cần đo | `app/layout.tsx:50`, `:84`; `app/loading.tsx:1`; `globals.css:217`; `lib/supabase/proxy.ts:27`; `components/app/navigation-feedback.tsx` | Loading thực đã có spinner + chữ. Auth local trì hoãn2000ms: fallback nhìn thấy khoảng60–78ms ở lượt main đã đạt; sau đó app resolve≈2,35s. Production native mở tab/SPA từng quan sát content skeleton/status. Proxy await getClaims trước layout, RootLayout await cookies trước boundary; UI không thể vẽ trước khi nhận HTML/CSS. Không tái hiện có kiểm soát màn trắng lâu trên máy OWNER, không kết luận loading “không tồn tại”. | Màn mở chưa có nhận diện rõ; nếu chậm trước response, người dùng vẫn có thể thấy trắng. Bằng chứng Auth chậm không chứng nhận toàn bộ cold-start/PWA/cache. | C87 branded splash + skeleton theo vùng; không giả % hoặc delay. Đo TTFB/first-feedback riêng, kiểm Auth2/10s và SPA1800ms/manual themes/reduced-motion. Không chuyển Auth sang client hoặc hiện dữ liệu riêng tư để né trắng. |
| G5 | MEDIUM · Gu / hiệu quả thao tác | `app/expenses/page.tsx:50`; `business/pagination.tsx:10` | Fixture26 chi phí,25 dòng/trang: body5386,47px tại375/390;3172,05px tại1440. Pagination chỉ render sau danh sách. Journey có1 lần auto-scroll của runner tới lối Trang sau; không quy thành số cử chỉ vuốt của người thật. | Muốn chuyển trang ngay phải tìm/cuộn tới cuối danh sách dài. | C87 lối Trang sau/Trang trước gần đầu danh sách Chi phí, count/canonical/query giữ nguyên; footer vẫn dùng được. Không rút pageSize, giấu ghi chú hay thay dữ liệu để đạt chiều cao thấp. |

Mỗi đề xuất có lý do người dùng thấy, metadata/code và ảnh; màu/font chưa được chọn sẵn để sửa trong C86. Không coi mọi điểm Gu khác của probe là lỗi sản phẩm.

## Sáu hành trình và số thao tác

Ma trận chi tiết trong `local-evidence.json`:6hành trình×375/390/1440×Light/Dark=36. PASS là kết thúc đúng hành trình quan sát, không là PASS về Gu.

| Hành trình | Click local mobile / desktop | Nhập / history | Navigation được thực hiện | Scroll quan sát |
| --- | --- | --- | --- | --- |
| Tìm khoản vay → detail → mở giao dịch → Escape | 2 / 2 | 1lần nhập;1Escape | 1query replace +1detail | 0lần runner auto-scroll trong mẫu |
| Công việc dashboard → detail/drawer → Escape → Back | 1 / 1 | 1Escape +1Back | detail +Back=2 | mobile1auto-scroll tới việc; desktop0 |
| Tìm đối tác → sửa nháp → đóng/bỏ nháp | 3 / 3 | 2lần nhập,1confirm bỏ nháp | 1formGET | 0auto-scroll trong mẫu |
| Chưa đọc → Back → Forward | 1 / 1 | 2history | filter +Back +Forward=3 | 0auto-scroll |
| Mở phân bổ → trang sau → Back | 2 / 2 | 1Back | trang2 +Back=2 | 1auto-scroll tới pagination |
| Từ khoản vay → Cài đặt → theme → Back | 3 / 2 | 1Back | Settings +Back=2 | 0auto-scroll |

Khởi tạo goto của mỗi journey không tính như thao tác của người dùng. Click không bao gồm nhập/Escape/confirm; history tách riêng. `urlTransitions` trong raw JSON là các URL đọc tại bước chốt, không ghi mọi history event; bảng trên tính operation đã thực hiện, không dùng raw này làm tổng navigation. Scroll của runner là thay đổi scrollY khi locator tự đưa control vào tầm nhìn, không tương đương vuốt/chạm vật lý. Không dùng thời gian runner làm tốc độ người thật. Có1click Thêm thêm khi đổi theme ở mobile, phù hợp cấu trúc menu hiện hành; đây là tradeoff của nav, chưa đề nghị thêm bộ chọn theme toàn app trong C87.

Production: Auth có sẵn, không yêu cầu OWNER đăng nhập lại. Kiểm sáu nhóm route/chặng chỉ đọc tại390; tìm/open/close khoản vay và việc dashboard, search/open/close editor đối tác, unread-empty/Back/Forward, expense-empty, Settings3mode/Back. Dirty editor remote không nhập/bỏ để tránh lặp native confirm blocker lịch sử; giữ NOT_TESTED_REMOTE với local dirty-confirm bổ trợ. Remote expense distribution/pagination thiếu dữ liệu, giữ NOT_TESTED; không tạo chi phí thật. Dashboard/loans có metadata responsive Light/Dark bổ sung. Chi tiết đúng khổ/mode và giới hạn ở `remote-evidence.json`; không lấy samples sai active viewport làm bằng chứng375/1440.

## Evon: đối chiếu kết quả máy với hình thật

App dashboard/loans:4probe,28fixed samples375/390/768/1024/1280/1440/1920 và110sweep Light; ảnh/menu-open đã quan sát. Probe báo dashboard P1 ở cả Light/Dark: child span0₫ trong tooltip ancestor opacity0 bị tính contrast1:1. `probe-reconciliation.json` + tooltip Light/Dark render thật chứng minh hidden effective opacity0; khi hover opacity1, chữrgb17,24,39 trên trắng và chữrgb248,250,252 trênrgb17,24,39 đọc rõ. Tỷ lệ chữ khi hiện khoảng17,74/16,96:1. Script `isVisible` chỉ kiểm opacity của chính span, còn checkContrast nhân ancestor opacity, nên màu bị trộn về chính nền. **Loại2mã có lý do đo nhầm**, không sửa rule/ignore hay skill gốc. Loans0P. Đối chiếu tổng2P:0finding Hỏng,2false positive được kiểm bổ sung. Các báo font nhỏ/sidebar/control/header là Gu theo hệ dự án, gộp G1–G3; không coi font/brand khác skill là Hỏng.

12 phép thử N1–N12: trạng thái/hierarchy N2/N3/N12 và effort/readability N8/N9 đưa vào G1–G5; N1 lifecycle/nav và N6 empty/feedback đã quan sát trong matrix; N4 màu có chữ, N5 dùng bộ UI nội bộ; N7 không tự điền/submit mới; N10 không viết logic sản phẩm; N11 không sửa layout runtime. AT/chạm thực chưa được kiểm, không dùng keyboard Chromium thay VoiceOver/TalkBack.

## Minh họa và cách duyệt

Mở `proposal.html` qua http://127.0.0.1:3186/proposal.html. A/B là mô phỏng dashboard với số liệu giả, Light/Dark, desktop/mobile; thêm startup hiện tại/đề xuất. Không chứng nhận nghiệp vụ chart: cột biểu đồ trong mockup chỉ minh họa hình thức. B cho nhận diện mạnh hơn theo phản hồi OWNER; A ít đổi vai màu. Không có thư viện mới, ảnh/credential remote hoặc font mới; dùng Inter Latin/Vietnamese/font và brand asset của build hiện hữu, SVG Lucide từ dependency sẵn.

20sample A/B375/390/768/1024/1440×Light/Dark:fontLoaded/single visibleh1/KPI-before-task đạt,0overflow/0clippedKpiAmounts. Mẫu có tên dài, tiền1.240.000.000VND; không rút gọn số để giấu clipping. Prototype đầu font20mobile làm tràn amount, hạ18 và unit12,6 mới đạt; button Mở có vùng ngang<24 được probe phát hiện, nới min-width44. Raw trước fix giữ tại `.cache/c86/`, không tuyên bố các lượt ấy xanh. Final4Evon prototype probes28fixed+110sweep có0P sau sửa; không giảm gate. Đây là bản đề xuất tĩnh, các nút chưa nối handler. Không gọi prototype ảnh “bản webapp đã sửa”.

Thang chữ prototype: body16,metadata14,heading24/20,KPI18mobile/24desktop,nav12mobile/15desktop. Brand: blue hiện hữu#1d4ed8, Dark#93c5fd; B thêm navy#152c4c ở sidebar và một card blue như một thay đổi vai đề xuất. B sidebar muted đã nâng sáng để đọc trên navy. Giữ vùng chạm44 và focus-visible; không gỡ focus theo mặc định Gu của skill vì dự án đã yêu cầu accessibility. Loading không giả phần trăm, reduced-motion giữ dấu tĩnh.

G5 chưa nối vào mockup dashboard vì nằm ở route Chi phí; remediation acceptance đo riêng trên fixture26records. Màu/font của module khác sẽ theo cùng hệ trong C87 được chọn, cần review đúng route, không lấy dashboard đẹp làm chứng nhận toàn bộ app.

## Gate và lịch sử

- Main lần1:1PASS2,2m,36journeys. Lần2 FAIL ở observation network route: `Route is already handled` sau unroute khi request trì hoãn còn chạy. Không quy thành lỗi app. Harness đổi unrouteAll behavior wait; lần3:1PASS2,8m,36journeys +4Evon app probes. Không đổi runtime, timeout/assertion/retries/skip để che lỗi.
- Supplement:1PASS1,2m,tooltip opacity/visible contrast Light/Dark và radio ArrowRight Light→Dark→System. Source main còn sửa capture restore theme sau J6 để tên ảnh không đảo màu; ảnh before đã lấy từ Evon đúng mode.
- Final source audit:2/2PASS2,8m, exit0;36journeys +4Evon app probes +supplement. Startup final Light60ms/Dark75ms, resolve2398/2340ms dưới Auth-delay2000ms; SPA1800ms feedback đạt. Lint/typecheck PASS, prototype render20samples/4Evon probes PASS,19localHTMLlinksHTTP200, JS syntax/JSONparse/diff-check và Gitleaks pinned artifacts/diff PASS. DB đúngC20-test55322 verifiedlabel/port; profiles/loans/transactions/counterparties/notifications/authUsers đều0 sau teardown. Production preferences trảsystem/ẩn tiền, dialogs0/viewportreset/consoleerror0; chỉ tab do agent tạo đã đóng. Không chạy full unit/pgTAP/Auth/CI riêng vì runtime/schema/Auth/workflow không đổi; build thật chạy qua Playwright webServer.
- Không commit/push/deploy trong C86. Không thay CLI/CI settings, backup/deployment/Google, remote finance/account/notification/push.

## Giới hạn

Production chưa nhập dirty đối tác; expense remote không có dữ liệu cho phân bổ/trang2. Không có network/OS emulation/cold PWA trên native browser; client before-HTML trắng chưa xác lập nguyên nhân. Physical mobile/Safari/Firefox/AT không kiểm mới. Thiếu trạng thái phân biệt NOT_TESTED, không biến thành PASS từ matrix local. Không yêu cầu OWNER học VoiceOver. Dữ liệu/ảnh local giả và metadata remote ẩn danh, không lưu tên/tiền/recordID/cookie thật.

## Checkpoint tiếp theo

Đề xuất C87 `AWAITING_APPROVAL`: sửa local G1–G5 theo hướng OWNER chọn A/B, typography dễ đọc, control phụ gọn, startup có nhận diện và pagination Chi phí gần đầu. Acceptance cụ thể nằm trong roadmap section45. Không tự bắt đầu C87; rollout sẽ là checkpoint sau remediation local được duyệt.
