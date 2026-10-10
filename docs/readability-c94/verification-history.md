> Nhật ký lịch sử các lượt kiểm chứng C94; các trạng thái draft bên dưới không là việc đang chờ hoặc quyền thực hiện mới. Trạng thái hiện hành ở PROJECT_CONTEXT.md/roadmap.

# C94 — Nhật ký kiểm chứng các lượt local

Trạng thái **IN_PROGRESS**. OWNER phê duyệt C94 ngày09/10/2026 trong hội thoại sau C93.
Source trước `577d6f4ec0f2557e8b234febf39f586ab8446b78`. Chỉ local; bản phát hành vẫn C91.

## Phạm vi đã chọn

Hai bảng Dashboard dưới1024px là thẻ nhãn–giá trị, desktop là bảng. Cùng một DOM/dataset,
role table/rowgroup/row/columnheader/rowheader/cell và scope giữ quan hệ đọc. Header mobile
chỉ visually-hidden; nhãn nhìn thấy trong từng ô aria-hidden, không lặp giá trị tiền/AX.
Giữ headers, sort/order, số0, dấu âm, đơn vị và dữ liệu authoritative. Không đổi mọi bảng.

Task full-width, dòng tiền bên dưới ở desktop; KPI vẫn trước task cả DOM/hình. G2 expense
percentage/managed-account status từ11.2/11.52px lên14px. Helper/chart/table/loan metadata
trong scope dùng14px; unit/bottom-nav có ngoại lệ hiện hữu. Inter/brand B giữ nguyên.

Tên200ký tự vẫn có đầy đủ một bản text trong heading/link; clamp tối đa2dòng khi thu gọn.
NameDisclosure đo truncation với Range/scrollHeight, ResizeObserver và fonts.ready;
chỉ hiện Xem đầy đủ khi cần. Button44px nằm ngoài heading/link, aria-controls/aria-expanded,
Enter/Space giữ URL/focus; expansion không ghi dữ liệu. Privacy dùng provider hiện hữu,
không chứa name trong title/data attributes và không hiện disclosure khi dữ liệu đang ẩn.

Notification selected dùng primary/on-primary/weight600/aria-current; hover chưa chọn dùng
surface-muted/foreground, giữ focus ring. Border control80%muted+surface và error text95%
error+foreground theo đặc tả C92; native pickers/theme/auth/draft/loading không thay lifecycle.

## Bằng chứng và gate

Before32samples/16journeys PASS2.0m, cùng fixture C92 và LightDark375/1440. After-first32
PASS2.0m; chỉ lượt khám phá, chưa phải final source. G2 before/after đo thực đạt14px;
KPI/detail/drawer/notification financial data khớp. Logs/raw captures giữ ignored.cache/c94.

Targeted-first:2FAIL/1PASS3.6m. Hai lỗi test mới: kỳ vọng dấu cách thường thay vì NBSP của
formatter và locator bám nhãn Xem đầy đủ sau khi nhãn đã chuyển Thu gọn tên. Đã sửa kỳ vọng
đúng ký tự và dùng locator control ổn định, giữ assertions cho value/expanded/focus/URL/privacy.
Không gỡ skip/timeout/assertion trong E2E hiện hữu. Targeted-second3PASS/1FAIL2.2m: root-font200% làm table money rem lên32px chật card.
Card money giữ16px theo mẫu/critical VND scope giống runtime hiện hữu; helperrem có thể tăng.
Root-font200% là phép stress riêng, không gọi là toàn bộ text/browser zoom200% vì các vai fixedpx
không tăng theo root. Viewport320CSSpx là reflow đo độc lập. Targeted-third3PASS/1FAIL: detail hero dùng rem/clamp phóng lớn ở root200 gây page overflow.
Chốt30pxdesktop/26pxmobile theo C92; guard17digit/extra-wide trước vẫn có độ ưu tiên cao hơn.
Targeted-fourth **4PASS2.5m**, không hạ value/focus/privacy/overflow assertions. Lượt CSS-zoom200
bổ sung đo Range chiều cao chữ thật (cả rem/fixedpx), với layout640/750/1440pixel chia2;
phương pháp không thay native browser/thiết bị. Matrix-first80samples và84supplement screenshots đã chụp; full gate **FAIL** ở bigint
presentation320px, không gọi lượt đó PASS. Thẻ trong analysis bị hai lớp padding lồng;
19digitmax+unit không vừa phần giá trị còn lại. Mobile khối đối tác dùng inset của analysis
frame, bỏ lớp inset thứ hai; hàng extra-wide cấp nguyên hàng cho tiền rồi giữ inset8px ở nhãn/tên,
không giảm16px hoặc cắt/round tiền. Badge loan desktop13px override cũ được sửa đúng14px.
Bounded stress-second đã đo36bigint cases khớp chữ/unit/dòng/khung; lượt tổng FAIL ở helper
CSS-zoom dùng selector h1/amount không có painted element trên route đối tác mobile. Đổi
helper chọn text element nhìn thấy, giữ điều kiện painted scale≥1.98, không sửa ngưỡng.
Matrix-final2 vẫn FAIL max19digit320px khi thử thêm inset8px vào giá trị; glyph còn đúng nhưng
clientWidth chật padding phải. Bỏ inset của value riêng ca extra-wide, giữ inset nhãn/tên,
đúng16px, không giảm độ rộng chữ hoặc sửa assertion. Table desktop values16px/headers14px
đúng C92 thay vì kế thừa14px toàntable. Trace final2 đã sao lưu trước chạy lượt mới;
logs/raw screenshots các lượt trước giữ, default Playwright trace của lượt cũ có thể bị thay
khi output directory được tái dùng. Final stress/matrix/full gate đang chạy, chưa nghiệm thu.

## Hợp đồng và giới hạn

Thiết kế dùng mẫu A/C92, card flat, brand B/Inter, cả Light/Dark/System. Data trong ảnh/test
là synthetic local C20-test55322, chưa đưa lên account vận hành. Không có Quick Amount C95,
drawer mới C96, loading/motion C97, remote/push/deploy/schema/RPC hoặc engine change.

Mẫu A là đặc tả cấu trúc/nội dung đã chọn. Vùng C96/C97 trong mẫu chưa áp trong C94; app
shell/control không nằm trong G1–G4 giữ runtime. Không đẩy scope sang những checkpoint đó.
AT/phone thật/bàn phím mềm/authenticatedSafariFirefox/OS-theme-live/PWA-beforeHTML/remote
save NOT_TESTED. Root-font200% và reflow là kiểm trong Chromium, không chứng nhận thiết bị.
C91 query_canceled57014 chưa xác định nguyên nhân; không DB tuning trong C94.

Lượt stress-third:36bigint cases đạt; run FAIL vì ngưỡng ratio1.98 cho Range glyph trong CSS zoom
200 đo1.95 (20px→39px, pixel quantization). Phép đo cuối yêu cầu computed zoom chính xác2,
Range height sau bằng2×trước với tolerance2px; ratio giữ làm diagnostic. Không thay rule probe
hoặc test hiện hữu. Trace stress-third đã sao lưu; không gọi lượt này PASS.

Zoom diagnostic-sixth thu36states rồi FAIL: CSS zoom giữ viewport media breakpoints cũ, SELECT
nhắc giờ ở640/layout320 dùng grid desktop và các loan/KPI ở1440/layout720 vẫn dùng desktop.
Đây là diagnostic của CSS property không có trong sản phẩm, không là mô phỏng native browser
zoom đúng. Các lỗi/raw data/ảnh/trace giữ ở cache. Phép nghiệm thu browser-zoom emulation
cuối dùng CDP viewportCSS=physical/2, DPR2; assert innerWidth/DPR/PNG physical width và một
glyph cùng role trước/sau bằng2× với tolerance2pixel, cùng số/đơn vị/focus/overflow gate.
Không gọi mô phỏng là chứng nhận native zoom/SafariFirefox. Không sửa ngưỡng/rule Evon
hoặc gate hiện hữu. ZoomRange cũ lấy bounding toàn đoạn có thể nhiều dòng nên không đo
font; phiên bản mới lấy đúng một glyph cùng role. Tiền16px, unit≥12px theo C92.

Matrix-final4 giữ FAIL: stress chạy ngay sau route render; child .vnd-number có max text nhưng
row vẫn16pxinset, khác precheck đãstable. Final harness xác nhận privacy hide→restore thật
để client amounts hydrate, fonts.ready và2frames sau DOM insertion; giữ exact value/unit/
fits assertions. Final5 diagnostics xác nhận extra-wide=true, :has matches và rowPadding0px;
36bigint cases qua cùng đoạn matrix. Đây là readiness của presentation-only stress, không
đổi runtime hoặc hạ assertion. Source freeze132runtime hashes được kiểm độc lập với build.

Full E2E đầu68PASS/18SKIP/1FAIL12.5m: C81 ordinary short loan row160.171875px >160px.
Giữ cap/assertions hiện hữu; badge14px đổi line-height1.5→1.4, min24px. Targeted C81+C94
cuối8PASS/1SKIP2.8m. Trace full-first sao lưu. Đây là thay đổi cuối sau matrix final5;
Loan/metadata phần bị tác động được xác nhận targeted/full cuối, không nhận ảnh matrix trước
chỉnh là pixel của toàn source cuối. Full cuối đang chạy ngày10/10/2026.

Closing ngày10/10/2026: full69PASS/18SKIP/0FAIL13.7m,retries0, rootbuild19/lint/typecheck/unit117 đạt. Không sửa cap160px hoặc assertion/retry/timeout/skip hiện hữu.
