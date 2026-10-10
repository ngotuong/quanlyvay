# C95 — Nhập nhanh tiền gốc

C95 COMPLETED local ngày10/10/2026, theo phê duyệt OWNER. C96 AWAITING_APPROVAL rồi dừng
đúng AGENTS§3. Runtime phát hành vẫn C91; các thay đổi C92–C95 chưa push/deploy.

Nhóm **+50tr/+100tr/+150tr/+200tr** cộng dồn chỉ bật ở **Ghi giao dịch → Tiền gốc**.
VndInput opt-in theo context, BigInt/integerstrings chính xác; vượt trần hoặc draft sai thì
thông báo và giữ giá trị. Callback/dirty nhận đúng1lần, focus/caret về input, reset theo default;
pending/hydration/readOnly/disabled khóa chip. Đổi loại giữ draft, không autosubmit. Snapshot
raw dư gốc từ server chỉ giới hạn nhập nhanh; RPC vẫn quyết định nghiệp vụ theo ngày/ledger.
Không áp nhóm50–200triệu lên lãi/chi phí hoặc sửa layout drawer/loading ngoài checkpoint.

[Đối chiếu ảnh](comparison.html), [inventory7files/9inputs](consumer-inventory.md),
[goal before/after](goal-comparison.json), [regression30checks](regression-evidence.json),
[component proof](component-evidence.json), [probe](probe-summary.json),
[lịch sử kiểm tra](verification-history.md), [preservation](preservation.json),
[source manifest](runtime-source-manifest.json), [ảnh8PNG](screenshot-manifest.json),
[validation](validation.json).

Từ ô principal trống đãfocus của cùng Minh An1.2845b,375/1280×900 Light/Dark,50triệu cần
8phím số trước/1chip activation sau.100/150/200triệu cũng1chip từ trống,16samples0POST submit.
Select/clear/focus là chuẩn bị riêng; số lần này là pointer chip activation so với typing,
không đo thời gian hoặc tuyên bố nhanhgấp3 cho mọi người.10triệu vẫn nhập tay/paste.
Số17digit vượt Number và max signed-bigint được kiểm helper/component, không đưa max vào ledger.
Actual local fixture50triệu qua Server Action/RPC đạt lỗi kết nối→retry cùng key→replay chỉ1transaction,
đóng/announce/focus/reset; draft/invalid paste/native formreset/caret/keyboard/limit đều đạt.

File chính: `components/ui/vnd-input.tsx`, `lib/business/quick-vnd.mjs`, `styles/quick-amount.css`,
`business/loan-actions.tsx`, `app/loans/[id]/page.tsx`; CSSentry/DesignSystem và test unit/E2E C95.
Lỗi edit sau overflow đã sửa: native listener clear lỗi từng cập nhật controlled state trước
React onChange; clear callback giờ chạy trong React change/reset. Không sửa Server Actions,
validation, schema, RPC, financialengine hoặc dependencies.

| Gate | Kết quả trên source cuối |
|---|---|
| Diff / lint / typecheck | PASS |
| Unit toànworkspace |121PASS,0FAIL:58web+11domain+18sync+34scripts |
| Root build |PASS |
| Full E2E |73PASS/18SKIP/0FAIL,14.2m,retries0;4C95 đạt |
| Visual/draft supplemental |2PASS2.8m, actual production Chrome |
| Component lab |callback/dirty/focus/reset/bounds/paste handler PASS; actual VndInput/Button/helper+React19.2.4 |
| Evon original probe |7fixedwidths×LightDark;0mục máy Hỏng, console/contrast/overflow/money/tiny-target0 |
| Responsive C95 |12states có320 và375×420 mô phỏng keyboard;4chip target≥44px và không tràn |
| Preservation |1183trackedbefore,8scopechanged,1175unchanged;17C75exact/15generatedrestored;130websrcfreeze |
| Financial protected source |73schema/actions/validation/domainfiles giữ hash |
| Fixture teardown |Dockerlabel C20-test/DB55322 đúng;6counts0, không mainDB54322 |
| Scoped secret/artifact scan |PASS, gitleaks pinned v8.30.1 redacted0findings; không env/cookie/data thật |
| pgTAP/Auth riêng |N/A cho C95: không thay schema/RPC/auth; không lấy các gate lịch sử làm lượt chạy mới |

Probe measurement rules nguyên bản, chỉ adapter auth synthetic và mở/chọn principal thực.
Không sweep; focus/native-picker warnings giữ theo yêu cầu thiết kế. Raw targeted failures
1PASS3FAIL→2PASS2FAIL→3PASS1FAIL và diagnostic ở ignored `.cache/c95/`; các lỗi harness
note/query/animation/caret sửa đúng, không giảm assertion/timeout/retry/skip hiện hữu.
Full server log có destination-stream-closed-early như baselineC94; raw giữ, không gọi
PASS là runtimeerrors0 toànapp. Console0 chỉ áp các goal/probe được đo.

Phone thật/softkeyboard/nativeclipboard/AT/SafariFirefox/nativezoom/remote save NOT_TESTED;
375×420 chỉ mô phỏng viewport keyboard. Paste hợp lệ ở lab là actual paste handler cộng
thao tác chèn mặc định mô phỏng, không chứng nhận clipboard OS. Không thay layout drawer C96/
loading C97, không phát hành hoặc thay dữ liệu thật. C91 query_canceled57014 vẫn là rủi ro
đã ghi ở context; không mở tuning hoặc thao tác remote từ lịch sử.
