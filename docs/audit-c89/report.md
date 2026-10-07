# C89 — Nghiệm thu UI/UX B sau C88

Ngày 06/10/2026. OWNER đã phê duyệt C89 trong hội thoại. Audit dùng Evon `ui-ux`, nhánh
review, giữ phương án B đã duyệt. Chỉ tài liệu, ảnh synthetic và harness audit thay đổi;
không sửa sản phẩm, commit/push, deploy hoặc ghi dữ liệu vận hành.

Kết luận: các luồng chính đã kiểm hoạt động; còn **F1 MEDIUM** về cách đọc số tiền trên
chi tiết khoản vay và **F2 LOW / Lệch hệ** về tab mobile. Không tìm thấy CRITICAL/HIGH
trong phạm vi kiểm này. Không suy rộng thành chứng nhận toàn bộ Production hoặc accessibility.
Đề xuất C90 chỉ sửa F1–F2; bốn đề xuất Gu ở cuối không mặc định nằm trong remediation.

[Xem ảnh trước/sau và phạm vi C90](review.html). Ảnh sau là CSS tạm trong DOM local có
dữ liệu giả, **chưa được áp dụng vào code hay phát hành**.

## Bằng chứng và phạm vi

- Khởi động đọc đầy đủ AGENTS/context/C89, Git sạch `main = origin/main` tại
  `b98fe64d332ea31ffee2b2e3adebc5ec7756744a`. Source B giữ nguyên so với C88.
- Chrome local chạy bản production build với fixture disposable C20-test API55321/DB55322.
  Bảy màn: Tổng quan, Khoản vay, Chi tiết, Đối tác, Chi phí, Thông báo, Cài đặt.
  **70 mẫu = 7 × 375/390/768/1024/1440 × Light/Dark**; 60 hành trình ở cùng breakpoint/theme.
  Tên tiếng Việt200 ký tự, khoản tiền17 chữ số, ghi chú500/nhóm80, 26 chi phí/2 trang,
  và trạng thái Chi phí trống. Ảnh trống ban đầu dùng System với thiết bị Light;
  tên file `expenses-empty-390-light.png` không chứng nhận manual Light.
- Production `tindung.vercel.app` và Preview `tindung-preview.vercel.app`: **140 mẫu
  authenticated chỉ đọc**, cùng7 màn/5 khổ/2 theme. Đo actual viewport/theme từng mẫu;
  overflow0, h1 hiển thị1, body16px, KPI trước Việc cần xử lý. Privacy ẩn nguyên trạng;
  do đó remote **không chứng nhận đọc số tiền dài khi hiện**, local bổ trợ riêng.
- Ba mẫu Settings còn `document.fonts.status=loading` ở thời điểm lấy mẫu đầu;
  hậu kiểm riêng sau `document.fonts.ready` đạt loaded/body16/overflow0, đúng width/theme.
  Không xóa kết quả ban đầu. Console error0 trên hai tab ma trận; không lấy đó làm
  kiểm tra toàn bộ runtime log Vercel, network error hoặc thiết bị khác.
- Preview: menu Thêm → Cài đặt2 click; công việc5 →17 →5, giữ focus, scroll sau focus285
  không đổi khi thu gọn. Lần Enter đầu làm công cụ focus control ngoài viewport và
  cuộn0→285; không gọi đó là invariant scroll0. Lọc chưa đọc/Back/Forward đạt sau khi
  URL và aria-current render đầy đủ. Một phép lấy aria-current quá sớm được giữ là
  HARNESS_INCOMPLETE, không quy lỗi app. System/privacy ban đầu khôi phục từnghost,
  viewport reset và các tab audit tạm đóng. Không fill/submit/mark-read/requestPermission.
- Evon **14 probe /98 fixed samples**, thêm385 Light sweep1440→375 bước20. Giữ nguyên
  rules của skill; adapter chỉ nạp storageState của fixture local, không phiên OWNER.
  Toàn bộ raw reports/log/P được giữ và đối chiếu, không lấy exit0 thành zero defects.
- [Local matrix/hành trình](local-evidence.json), [native tổng hợp đã redacted](native-evidence.json),
  [probe reconciliation](probe-reconciliation.json), [CSS minh họa và phép đo](proposal-evidence.json),
  [gate](validation.json), [DB/source/C75 hậu kiểm](postgate.json).

## Đối chiếu yêu cầu OWNER

| Yêu cầu | Quan sát lần này | Giới hạn |
| --- | --- | --- |
| Phân vùng, bớt trắng đơn điệu | Canvas Light xanh xám, sidebar navy, KPI chính cobalt, các surface phân biệt; Dark có nền/panel khác nhau | Giữ hướng B đã duyệt; không đánh giá “đẹp” bằng màu trắng hay rule flat của skill |
| Chữ dễ đọc | Body16px; control phụ14px; không phải mọi metadata đều16 | Một số nhãn phụ11.2–11.52px, G2 Gu |
| Nút phụ gọn | Tùy chỉnh, Nâng cao, Xem tất cả44px, chữ14; không còn action banner lớn | Không hạ hit target dưới44px để tiết kiệm chỗ |
| Có loading lúc mở app/chuyển tab | Auth2/10s, Light/Dark: feedback65–86ms local; resolve2.323–10.100s. Native branded startup đã quan sát; regression SPA delayed/cancel PASS | Loading sau HTML đầu; không bảo đảm trước TTFB hoặc cold PWA trên điện thoại thật |
| Lưu xong drawer tự đóng | Existing C63/C72/C84 regression kiểm success/announce/focus/reset, lỗi/validation/draft/pending/retry và commit-once đạt | Chỉ fixture local, không lưu giao dịch thật để “smoke” |
| KPI trên Việc cần xử lý | DOM/geometry local và remote đạt | Không thay thứ tự hay số liệu |
| Theme Sáng/Tối/Theo thiết bị | Radio keyboard/persistence/reload local đạt; hai host native đổi và trả System | Thay đổi theme OS thật chưa thử |

## Phát hiện cần remediation

| ID / mức độ / hạng | File, vị trí và nguồn | Nguyên nhân → tác động | Hướng sửa đề xuất |
| --- | --- | --- | --- |
| **F1 / MEDIUM / Hỏng** | `apps/web/src/app/globals.css:839` và `:849`; VndText tại `apps/web/src/components/ui/vnd-text.tsx:6`, PrivacyAmount tại `apps/web/src/components/app/privacy-provider.tsx:84`; `proposal-evidence.json` before, detail PNG, Evon brokenMoney | Hero `overflow-wrap:anywhere` tách chuỗi17 chữ số thành2 dòng ở375/390/768/1024. Selector `.overview-supporting span {display:grid}` tràn xuống cả span số/₫ mới của VndText: ký hiệu tiền xuống dòng ngay cả `0 ₫`. Không mất chữ số hoặc sai quyết toán, nhưng đọc tiền khó và dễ nhầm; overflow0 không phát hiện vấn đề | Cô lập layout ở wrapper, giữ số +₫ cùng dòng; tiền dài dùng đủ chiều ngang và cỡ chữ thích ứng tối thiểu18px ở hero, không ellipsis/làm tròn/rút gọn. Kiểm cả số0, thường, dài và âm tại các nơi dùng VndText |
| **F2 / LOW / Lệch hệ** | `apps/web/src/app/globals.css:692` đối chiếu `apps/web/src/styles/ui-primitives.css:59–61`; detail Light/Dark P1/P2 | Override basis0/min-width0/white-space normal bóp tab; container con không dùng đủ ngang. Tổng quan/Các kỳ lãi2 dòng ở375/390, trong khi tab base dùng intrinsic basis auto. Chữ đủ, điều hướng đúng, target48px; là lệch trình bày, không lỗi mất chức năng | Cho hàng tab dùng đủ ngang, basis theo nội dung, label một dòng; giữ active/keyboard/Back và target44px+, scroller nội bộ có thể dùng nếu thật sự thiếu chỗ |

Minh họa F1–F2 dùng **cùng DOM/fixture/theme/width trước và sau**, chỉ `page.addStyleTag`.
Mười tổ hợp5 khổ ×2 theme: số1 dòng, ký hiệu cùng dòng, không clipping/page overflow,
tab1 dòng/target48px. Đây là hướng sửa khả thi với khoản17 chữ số đã thử, chưa phải
implementation được duyệt hoặc chứng nhận mọi số hợp lệ. Giới hạn BigInt tối đa của
validation `9223372036854775807` chưa được thử trong audit này; C90 phải kiểm thêm presentation.
Ảnh fullpage chứa fixed bottom nav tại vị trí viewport đầu; không suy ảnh nối dài thành
content bị che khi người dùng cuộn. Regression nav clearance được kiểm riêng.

## Evon: mọi P đã đối chiếu

| Nguồn | P | Kết luận và bằng chứng |
| --- | --- | --- |
| dashboard Light/Dark | P1/P2 mỗi theme,4 tổng | False positive tooltip opacity0. Focused tooltip opacity1: màu thực child kế thừa foreground, contrast15.962/14.588:1; `tooltip-shown-*.png` và proofs |
| detail Light/Dark | P1/P2 mỗi theme,4 tổng | F2, labels wrap có thật. Khả dụng điều hướng vẫn đạt; so sánh actual PNG và Range rects |
| expenses Light/Dark | P1 mỗi theme,2 tổng | False positive nút thuộc details đang đóng. Mở thật: height44, textHeight17, lineHeight16.8, một dòng; `expense-reversal-open-*.png` |
| notifications Light/Dark | P1 mỗi theme,2 tổng | G4 Gu: hover chung fill với selected theo rule595. aria-current vẫn đúng; không gọi là chọn sai filter |

Các brokenMoney dashboard ngoài danh sáchP được kiểm độc lập: tại5khổ/2theme, mỗi
VndText số1 dòng và unit giao cùng vertical line. Probe lệch top vì ₫ có cỡ chữ nhỏ
hơn, không phải chữ số bị tách như F1. Bằng chứng `proofs.dashboardAmounts`.
Warnings về drawnFocusRings/native picker/border hover không mặc định là lỗi: giữ focus
ring và control native có token/keyboard theo contract hiện hành. Không bỏ focus để hợp gu skill.
Các nhóm denseItems/orphanWords/table/tinyTexts/radio wrap được ghi nhận ở Gu và JSON;
không biến mất vì không thuộc P. Không phát hiện page overflow, smallTapTargets hoặc
brokenImages trong14 báo cáo gốc. Điều này không thay thế kiểm AT/device.

## Bước thao tác và hồi quy

Mỗi hành trình chạy10 tổ hợp. Đếm trong hành trình, **không tính goto khởi tạo**;
Escape, confirm discard, thao tác phím và Back được tách khỏi click. JSON có scroll từngclick.

| Hành trình | Click / nhập / lịch sử | Kết quả |
| --- | --- | --- |
| Tìm khoản vay → Nâng cao → chi tiết → Giao dịch → Back | 3 /1 /1 | Query giữ, Escape trả focus, dialog đóng |
| Công việc đến hạn → giao dịch → Back | 1 /0 /1, thêm2 Enter mở/thu gọn list | Đi thẳng dialog; toggle sau explicit focus giữscroll/focus. Click vào item ngoài viewport có auto-scroll451/558 hoặc route transition0→392, không gọi mọi click là scroll0 |
| Tìm đối tác → editor → giữ/bỏ nháp | 4 /2 /0 | Hai confirm có kết quả đúng, không submit |
| Chi phí trang2 → Back → mở sheet/nháp | 2 /1 /1 | Top pager trong viewport,25→1→25; Escape giữ nháp hoặc discard đóng/trảfocus |
| Chưa đọc → Back/Forward | 1 /0 /2 | Filter giữ, không mark-read |
| Sáng → Tối → System → reload | 1 /0 /0,2 ArrowRight+reload | Radio keyboard/persistence đúng |

Existing regression22/22 PASS5.5m: C63 financial3/success/error/reset/dismiss/cancel;
C67 privacy/mobile menu; C72 drafts/history/expense duplicate save/notification pending,
retry/timeout và responsive; C75 identity/privacy/query/loading; C84 pending editor/theme;
C87 compact header/pager/branded startup/SPA. Audit1/1 PASS7.6m. Minh họa/reconciliation
1/1 PASS1.9m ở cả hai lượt; lượt2 thêm kiểm dashboard glyph ranges. Không giảm
assertion/retries/skips, không thay suite cũ. Không tái hiện lỗi interceptor C87 của CI C88
trong selected run này; không kết luận race đã sửa.

## Gu, tùy OWNER — chưa chọn để sửa

| ID / ưu tiên | Bằng chứng/file | Đề xuất nếu OWNER muốn, không thuộc C90 |
| --- | --- | --- |
| G1 / MEDIUM | dashboard bảng577/697px trong khung301/267px mobile; `globals.css:1110–1111`, table-scroll | Ghim cột nhận diện hoặc cards khi cần so sánh nhiều cột. Hiện có scroller giữ đủ số, không page overflow; chưa chứng minh sai ghép dữ liệu |
| G2 / LOW | Expense percentage11.2px `globals.css:1552`; managed-user status11.52px `:1346` | Nhãn phụ tối thiểu12–14px; không đổi toàn app chỉ để hợp thang font của skill |
| G3 / LOW | Tên hợp lệ200 ký tự khiến heading nhiều dòng: detail-375 PNG; `globals.css:1590`, `apps/web/src/app/loans/[id]/page.tsx:124` | Có thể cân nhắc disclosure full name; phải luôn truy cập được tên đầy đủ và giữ accessible identity. Không cắt tên âm thầm |
| G4 / LOW | Notification hover/active chung fill, `globals.css:595`; Evon P1 hai theme | Tách màu hover khỏi selected; giữ aria-current/border. Hiện không chọn sai trạng thái |

## Giới hạn và checkpoint tiếp theo

Chưa thử VoiceOver/screen reader thật, mobile vật lý, Safari/Firefox authenticated,
OS theme đổi thật, mạng/PWA cold trước HTML, network/performance toàn Production,
remote save/dirty form/timeout/đa trang khi dataset không có state đó. Không yêu cầu OWNER
học VoiceOver; không biến localPASS thành chứng nhận các ca này. Không audit lại schema,
đối soát nghiệp vụ hay vận hành backup ngoài phạm vi C89. Cảnh báo Chrome/interceptor
lịch sử giữ nguyên residual risk, không suy ra nguyên nhân mới.

**C90 AWAITING_APPROVAL**: chỉ F1–F2 ở presentation chi tiết khoản vay; bảo toàn B,
KPI trước công việc, font/brand, số authoritative, RPC/schema/Auth/session và tất cả luồng save.
Không deploy/push/remote mutation. AC chi tiết ở roadmap section48: glyph geometry,
range0/âm/ordinary/17 chữ số/max hợp lệ,10 breakpoint/theme,privacy/keyboard/history,
regression/gates/teardown/source scope. G1–G4 không tự triển khai.

C89 hoàn tất audit không đồng nghĩa F1–F2 đã sửa. Chờ OWNER duyệt C90 theo AGENTS mục3.
