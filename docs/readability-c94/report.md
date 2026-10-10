# C94 — Khả năng đọc theo thiết kế A

Trạng thái **COMPLETED** local ngày10/10/2026; OWNER duyệt ngày09/10/2026. Source trước `577d6f4ec0f2557e8b234febf39f586ab8446b78`; duyệt09/10, tiếp tục chốt ngày10/10/2026.
[Đối chiếu before/after](comparison.html) gồm12ảnh runtime với cùng dữ liệu giả, viewport/theme;
C94 chủ động đổi hình. Thiết kế A đã chọn tại C92, brand B/Inter/LightDarkSystem được giữ.

## Kết quả triển khai

- Hai bảng Dashboard dưới1024px thành thẻ nhãn–giá trị; desktop giữ table/cột nhận diện224px,
  scroller khi cần. Một DOM/dataset, role/scope đầy đủ; thead mobile visually-hidden, nhãn ô
  aria-hidden để không lặp AX. Giữ headers, sort/order, số0/âm/unit và mỗi giá trị authoritative.
- Task desktop full-width, dòng tiền bên dưới; KPI vẫn trước task cả DOM và hình.
- Expense percentage/managed-account status từ11.2/11.52px lên14px. Helper/table headings14px,
  table values16px; hero30desktop/26mobile. VND unit≥12px và bottom-nav12px là ngoại lệ C92.
- Tên200ký tự ở identity slots clamp2dòng, vẫn đầy đủ trong heading/link/rowheader. NameDisclosure
  chỉ hiện Xem đầy đủ khi Range/scrollHeight đo truncation, có ResizeObserver/fonts.ready.
  Button44px nằm ngoài heading/link, aria-controls/expanded, Enter/Space giữ URL/focus.
  Privacy không chứa tên trong title/data attributes và gỡ disclosure khi dữ liệu đang ẩn.
- Notification selected dùng primary/on-primary/600/aria-current; hover chưa chọn surface-muted/
  foreground, focus giữ rõ. Shared border-strong80%muted+surface và error-text95%error+foreground
  theo C92 áp consumers hiện hữu. Giữ native picker, RPC/validation và lifecycle.
- Mobile khối đối tác dùng inset của analysis frame; hàng tiền extra-wide nhường nguyên hàng
  cho tiền, giữ inset8px ở tên/nhãn. Không hạ tiền dưới16px, cắt/round, chia chữ số hoặc đơn vị.

File chính: `styles/readability.css`, `styles/tokens.css`, `business/name-disclosure.tsx`,
Dashboard/Loan list/detail/Counterparties/Notifications, entry CSS, unit adapter và C94E2E.

## Kiểm chứng

| Gate / phương pháp | Kết quả |
|---|---|
| Before32samples/16journeys | PASS2.0m |
| Final matrix80 + supplement84 | PASS,5widths375/390/768/1024/1440LightDark +320/1920/375×667 |
| Bigint presentation36cases | PASS0/max19digit/negative17digit; actual VndText, không ledger mutation |
| Zoom-emulation36states | PASSviewportCSS=physical/2,DPR2, PNGwidth đúng, same-role glyphphysical2x ±2px, overflow0 |
| Actual data comparison | KPI/detail/drawer/notifications/table headers/order/values khớp before |
| Targeted C81+C94 sau sửa cuối | 8PASS/1SKIP2.8m, giữ nguyên C81 height≤160px/assertions/timeout/retry |
| pnpm lint/typecheck/test/build | PASS;117unit,19web routes; source freeze132runtime hashes |
| pnpm test:e2e | PASS69/SKIP18/FAIL0,13.7m,retries0; first68/18/1FAIL vẫn giữ lịch sử |
| Artifact/diff/secret/preservation/fixture teardown | PASS;1157before/1145unchanged,17C75exact/15restored,sixcounts0 |

Matrix/probe final5 **1PASS6.5m**, pageErrors0, ảnh/ma trận ngày09/10 trước chỉnh badge
line-height1.5→1.4 cuối. Chỉnh cuối chỉ Loan badge line-box, giữ14px; C81 ordinary row160.17px
đã về budget≤160px, C81+C94 targeted8PASS/1SKIP. Ma trận80 trước chỉnh không được gọi source
cuối tuyệt đối; phần Loan/metadata được kiểm lại với gate C81+C94 và full E2E cuối. Evon8probes4routes×LightDark,6fixedwidths
375/390/768/1024/1440/1920 và55step sweep mỗi routeLight. RawP Dashboard2/theme,
Expenses1/theme, Notifications/Settings0; không gọi raw toànappP0. [Đối chiếu probe](evon-reconciliation.json):
zero-money tooltip opacity0 không painted; actual visible zero text≥4.5 và active tooltipopacity1.
Collapsed reversal bị probe tính wrap, nhưng actual open button1line,height≥44. Probe rules/
assertions không sửa. Focus/native-picker warnings theo lựa chọn OWNER, không tự bỏ để theo Gu.

[Rendered evidence](rendered-evidence.json), [data equality](data-comparison.json), [paint/open-state](probe-reconciliation.json),
[nhật ký lỗi/phương pháp](verification-history.md). Logs/helpers/raw shots/session synthetic giữ
ignored `.cache/c94/`; trace final2/final3/final4 và các stress lỗi đã sao lưu, output mặc định của
lượt cũ có thể bị tái dùng nên không hứa giữ mọi trace. Các lượt FAIL không được đổi thành PASS.

## Phạm vi và giới hạn

Không có Quick Amount C95, drawerA C96, loading/motion C97, push/deploy/remote/schema/RPC/
financial engine change. C93/C92 artifacts và source ngoài scope được kiểm hash trước commit.
CSS root-font200% giữ gate stress hiện hữu, không làm mọi fixedpx text tăng; CSS property zoom2
được lưu diagnostic FAIL vì giữ media breakpoints cũ. Phép nghiệm thu zoom emulation dùng
CSS viewport nửa/DPR2 và đo physical glyph/PNG, không thay đổi stylesheet để chiều test giả.

AT/phone thật/bàn phím mềm/native browser zoom/authenticatedSafariFirefox/OS-theme-live/
PWA-beforeHTML/remote save NOT_TESTED. Đây không phải chứng nhận WCAG/thiết bị hoặc Production.
C91 query_canceled57014 chưa xác định nguyên nhân; không DB tuning, Google hoặc backup trong C94.

C94 chốt local: root build19routes/lint/typecheck/unit117/fullE2E69PASS18SKIP13.7m đạt.
Existing assertions/timeout/retry/skip không sửa. 12PNG hash/JSON/matrix/context-status/diff và
secret scan redacted trên changed files/diff được chốt trước commit. pgTAP không áp dụng vì
không schema/RPC đổi; không lấy CI/pgTAP C91 làm gate C94. Không push/deploy/remote mutation.
C95 AWAITING_APPROVAL rồi dừng theo AGENTS§3. Bộ dữ liệu/ảnh đều synthetic; không performance claim.
