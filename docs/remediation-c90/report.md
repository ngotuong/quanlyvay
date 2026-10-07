# C90 — Sửa presentation VND và tab chi tiết khoản vay

Trạng thái: COMPLETED local, toàn bộ gate áp dụng đã đạt. OWNER phê duyệt C90 ngày06/10/2026.
C90 chỉ local; Production/Preview vẫn giữ bản C88. HEAD khởi động và origin/main:
`b98fe64d332ea31ffee2b2e3adebc5ec7756744a`. Không commit/push/deploy trong C90.

## Thay đổi đã chọn và nguyên nhân

| Phát hiện C89 | Nguyên nhân thực tế | Sửa C90 | Tác động |
| --- | --- | --- | --- |
| F1 MEDIUM: tách chữ số và₫ | `globals.css` cho `overflow-wrap:anywhere`; selector `overview-supporting span` áp grid vào cả span số/đơn vị. `overview-next span` cũng lan style vào VndText | `white-space:nowrap`; scope direct wrapper. Tiền extra-wide dùng cả ngang hero, cỡ chữ thích ứng≥18px. Supporting có tiền wide chuyển toàn khối thành hàng đầy ngang | Đọc đầy đủ số và đơn vị trên cùng dòng, không ellipsis/làm tròn. Tiền thường giữ bố cục cũ |
| F2 LOW/Lệch hệ: tab375/390 hai dòng | `.loan-tabs a` basis0/min-width0/normal, list không sử dụng toàn ngang | List width100%; basisauto/min-widthmax-content/nowrap; font14px, target48px | Nhãn một dòng; giữ active, keyboard, query/Back và scroller khi thiếu ngang |

File runtime duy nhất đổi: `apps/web/src/app/globals.css` (loan-tabs, overview-primary/
next/supporting, media≥760). VndText/formatter/PrivacyAmount, Next route/Server Actions,
RPC/SQL/Auth và mọi phép tính authoritative không đổi. B/navy/cobalt/status/Inter/body16,
KPI trước Việc cần xử lý và G1–G4 được giữ. Đọc nguồn + hash117/118 runtime bổ trợ.

## Bằng chứng trước/sau

`before-evidence.json` và `after-evidence.json`:40 route samples gồm detail/dashboard/
loan card/expenses ×375/390/768/1024/1440 ×Light/Dark.50 presentation stress samples:
0;1.000.000;17chữ số;9223372036854775807 và-9223372036854775807. Mỗi stress kiểm5 slot
money trên chi tiết, bằng formatter và VndText thực được SSR; chỉ gắn markup vào DOM local,
không gửi max/signed tới SQL để tránh tràn aggregation hoặc tạo transaction trái validation.
Node gốc được giữ và restore nguyên identity để privacy React vẫn thao tác đúng node.

Hai run reset DB độc lập, cùng định nghĩa fixture/value/theme/width, không phải cùng DOM
hoặc cùng UUID. Text tiền trước/sau khớp chính xác90 rows. Range rect của `.vnd-number`,
vertical overlap₫ và giới hạn padding của container được kiểm; overflow0 đơn thuần không
đủ chứng nhận. Trước60 failing observations được giữ. PASS của before harness chỉ là
thu thập lỗi đã biết, không gọi product trước sửa PASS. Sau0 failing observations,
hero≥18px, tab một dòng48px, body16.10 kiểm keyboardEnter/URL/aria-current/Back/privacy
restore đạt; privacy không còn vnd-number trong DOM. C67/C75/C72 bổ trợ accessible identity,
DOM/title/chart và notification/query. Chỉ presentation synthetic, không quyết toán frontend.

28 ảnh PNG trước/sau:10detail +4max mỗi phase. Mẫu max ảnh375/1440, các khổ còn lại có
JSON measurements. Xem `review.html`; fullpage ghép dài giữ nav ở viewport đầu, không suy
nội dung bị che khi cuộn chỉ từ ảnh. Ảnh1440 iteration đầu phát hiện mảng trống supporting;
đã chỉnh whole-group single-column cho tiền dài, capture/gate cuối dùng source sau chỉnh.

## Evon

Áp dụng skill `/Users/ngotuong/.codex/skills/evondev-ui-ux/SKILL.md`, nhánh V review,
chỉ sửa dòng F1/F2 đã OWNER chọn. Stack Next/React/Tailwind4/custom primitives; không
thêm UI library hoặc formatter mới. Probe copy ignored chỉ inject local synthetic storage
ở3browser contexts, không đổi quy tắc.2executions/14fixed widths gồm1280/1920 và55Light
sweep1440→375 bước20. RawP0, wrappedControls0/brokenMoney0/console0; exit0 không đồng
nghĩa flawless UI.36warning groups ngoàiP giữ và disposition theo `probe-reconciliation.json`:
native-choice (mobile mở/desktop ẩn), More typography, hover border Giảm gốc, visible focus.
Không gỡ focus ring hoặc thay picker để theo gu chưa duyệt; không âm thầm sửa G1–G4.
Owner display label có10 informational ellipsis contexts, không phải clipping tiền;
nguồn AppShell giữ đầy đủ tên trong text/accessibility. Raw `.txt`/JSON được giữ; ảnh probe riêng trong cache ignored, không có session exports trong
artifact durable. Visual QA ảnh mobile Light/Dark, max375 và desktop; ảnh sweep intermediate được kiểm riêng.

## Hồi quy và vấn đề harness giữ bằng chứng

Gate và log chính xác trong `validation.json`.117 unit tests (11domain/18Google sync/
54web/34scripts) PASS. Lint/typecheck/build19 và targeted E2E24/24 PASS7.5m ở final3; retries0/skip0.
Hồi quy C63/C67/C72/C75/C84/C87 gồm success/error/pending/dirty/draft/commit-once/dismiss/
focus, privacy/notifications/query/history/theme và branded loading. Không giảm assertion,
retries hoặc thay opt-in thành skip để vượt gate.

Before-attempt1 setup30s deadline; before-attempt2 Playwright JSX transformation khiến
SSR không nhận React component. Chỉ sửa harness mới: isolated setup300s theo C84, compile
VndText nguồn thực bằng TypeScript về React calls. Before-attempt3 đạt1PASS2.1m;
after-attempt1 đạt2PASS2.9m. Regression-final23PASS6.3m trên CSS trước whole-supporting
polish. Regression-final2 retained23PASS/1FAIL8.0m có lỗi C63 kéo drawer Tất toán tại line364. Trace chứng
minh box grabber tính lúc chưa có settlement-preview, rồi preview xuất hiện trước mouseDown;
centered sheet đổi chiều cao, kéo y182→292 chọn chữ thay vì grabber thực y107. Không có
prompt thứ4. Không quy thành lỗi app từ thao tác chạm sai. C63 regression được thêm assertion
preview visible trước lấy tọa độ, giữ mọi dirty/dismiss/focus/4prompts assertions và timeout.
Final3 toàn bộ24PASS7.5m trên source/harness cuối. Trace/log lỗi ở `.cache/c90/retained-failure-drawer-final2/`, không dùng mẫu lỗi làm PASS.
Stream-closed-early trong luồng cancellation retained, không chứng nhận remote runtime.

## An toàn và giới hạn

Chỉ fixture/reset/teardown C20-test55322 với guard có sẵn. Hậu kiểm Docker label/port,
profiles/loans/transactions/counterparties/notifications/authUsers0 trong `postgate.json`.
C75 generated restore chỉ từ baseline đã hash, không git reset diện rộng.92artifact C89 và
harness C89 giữ hash; không hoàn nguyên local C89 chưa push. Artifact/secret/diff gate cuối
được ghi validation. Không remote finance/account/schema/RPC/secret/Google/backup/resource
cleanup mutation. Cache có fake local session, không được serve/commit; review server chỉ
bind loopback và thư mục artifact synthetic.

NOT_TESTED: VoiceOver/physical mobile, Safari/Firefox authenticated, OS-theme/mạng trước
HTML/PWA cold-start, remote save và remote release runtime. Không bắt OWNER học VoiceOver,
không suy localPASS thành ProductionPASS. C91 đề xuất phát hành riêng, AWAITING_APPROVAL
sau C90 đạt toàn bộ gate; agent dừng theo AGENTS§3.
