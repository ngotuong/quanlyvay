# C96 — Drawer giao dịch ngay Dashboard

C96 COMPLETED local ngày10/10/2026. OWNER duyệt C96 trong hội thoại; nguồn trước82151b6,
thiết kế A tại C92. Source local đã triển khai; chưa push/deploy và runtime remote vẫn C91.

Một lần bấm tác vụ lãi của OWNER/EDITOR mở drawer đúng khoản ngay Dashboard. Drawer480px
bên phải desktop/inset16px, bottom sheet mobile/inset12px; header/footer giữ vị trí và nội dung
cuộn. Form chỉ nạp cho khoản được chọn. VIEWER, deep-link cũ và tác vụ gốc quá hạn giữ đúng nghĩa.
Số dư theo ngày từ Supabase; lãi task là projection cuối kỳ, không đánh đồng hai số này.

LoanPaymentForm dùng chung với LoanActions; lưu qua Server Action/RPC hiện hữu, không sửa
schema/actions/validation/engine. Lỗi giữ draft/key, pending khóa đóng/Back/submit lặp;
success đóng/reset/toast, cập nhật KPI/task từ RSC và trả focus về task hoặc heading khi task mất.
Dirty close/Back hỏi một lần; chọn giữ ở lại không mất draft. Forward/reload là phiên mới.
Abort/request-key/deadline12s/retry bảo vệ request cũ; tải số dư theo ngày không ghi đè amount/note.
Nút “Theo số còn lại” chỉ copy snapshot lãi positive authoritative, không tính quyết toán.

| Gate | Kết quả đã có |
|---|---|
| Lint / typecheck / diff | PASS |
| Unit toàn workspace |121PASS0FAIL:58web+11domain+18sync+34scripts |
| Root build |PASS,19static pages và payment-context route dynamic |
| Targeted + original Evon probe |7PASS0FAIL3.5m, actual Chromium production local |
| Full E2E |79PASS18SKIP0FAIL15.5m,retries0;6C96 đạt |
| Matrix |targeted16/full18states Light/Dark,320–1440px,375×420 và375×812 |
| Datafetch/bundle |4matched samples PASS budget; initial521176decoded bytes (+8311), mở thêm11759 |
| Secret/artifact/diff |PASS, pinned gitleaks8.30.1/redacted0findings;8PNG hashes/resources/links/script syntax đạt |
| Preservation |1207trackedbefore/10scopechanged/1197unchanged;140websrcfreeze,73financialprotectedfiles |
| C75/fixture teardown |17C75exact/15generatedrestored;Docker C20-test/DB55322 đúngguard,sixcounts0 |
| pgTAP/Auth standalone |N/A: không thay schema/RPC/Auth contract; full E2E kiểm permissions/Auth boundary |

Source chính: Dashboard server rows/provider, dynamic DashboardPaymentDrawer, LoanPaymentForm,
form-parts/VndInput, API payment-context và dashboard-payment.css. Bằng chứng:
[đối chiếu](comparison.html), [implementation](implementation.md), [performance](performance.json),
[targeted evidence](targeted-evidence.json), [full evidence](full-e2e-evidence.json), [probe](probe-summary.json), [lịch sử kiểm chứng](verification-history.md).

Nominal business reads4overview trước →2payment-context; Auth/profile/layout không tính vào hai
số này. Browser nominal1GET khi mở,0form cho task chưa chọn; date/retry request riêng.
JS decoded Resource Timing không phải HTML/RSC/heap hoặc latency Production. Đo elapsed
baseline846–869ms, C96matched442–860ms local, không cam kết tăng tốc hoặc nhanhgấp3.

Evon raw3mục Hỏng mỗi theme được giữ: tooltip VND có ancestoropacity0 nên không painted;
body scroll1px sau thao tác chuẩn bị clear/focus amount. Full suite375×812 Light/Dark
initialscroll0; clear/focus sau Tab/body checks cuộn188px trong body, header/footer giữ vị trí. Native picker/focus ring theo lựa chọn C92; density/hover của Dashboard có
sẵn nằm ngoài C96. Dáng flat với brand B/Inter, semantic tokens, một submit primary, helper14px.
Không thay motion/skeleton C97. Còn thấy warnings của công cụ và giới hạn thiết bị được giữ rõ.

Phone thật/softkeyboard/AT/SafariFirefox authenticated/nativezoom/OS-theme-live/remote save
NOT_TESTED. Full server log có destination-stream-closed-early như baseline C94/C95 và lỗi Auth/
export chủ động từ các ca kiểm; không gọi PASS là runtimeerrors0 toànapp. C91 query_canceled57014
chưa xác định nguyên nhân vẫn ghi ở context, không mở DB tuning/remote work trong C96.

C97 AWAITING_APPROVAL; dừng theo AGENTS§3, không triển khai loading/motion C97 hoặc rollout C98.
