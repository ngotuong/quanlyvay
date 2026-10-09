# C93 — Refactor tokens/CSS/primitives giữ hình

Trạng thái **COMPLETED**, OWNER duyệt ngày 09/10/2026. Source trước:752fd48 (C92 chỉ docs/static); C91 runtime đang phát hành giữ nguyên. Không deploy/push/remote mutation trong checkpoint này.

Giữ pixel, font/brand/status/geometry và lifecycle hiện tại; OWNER là người duyệt hình. Các màn đối chiếu: Dashboard, bảng mở, detail, drawer, khoản vay, thông báo, chi phí, cài đặt ở375/390/768/1024/1440×900, Light/Dark/System theo OS sáng/tối. Tài liệu cũ được bổ sung vị trí token đúng; không xóa tài liệu hoặc áp A/C94–C97 sớm.

## Cấu trúc và nguyên nhân thay đổi

Entry globals.css chỉ import theo thứ tự: Tailwind → tokens → primitives → playground → foundation → workflows → notifications → dashboard → presentation-overrides. Không thêm layer/specificity/import song song. Các đoạn feature liên tiếp giữ thứ tự rule/điều kiện gốc; override B/C90 vẫn cuối. C93 không đổi class sang utility hoặc thay native picker/focus.

Palette chứa màu nguyên gốc, semantic roles giữ theme/brand/status/chart/auth; component aliases dùng lại vai màu cho Button/Input/Card/Badge. Màu auth/chart cố định trước đây không bị đổi theo primary mới hoặc dark palette vì đó là thay hình. Light opt-out và System selector giữ nguyên, giá trị theme cũ bằng nhau.

Chỉ gỡ13declarations trùng tuyệt đối: cùng selector, cùng conditional context, property/value/important. Giữ dòng về sau; không dùng heuristics gom media hoặc bỏ override khác giá trị. JSON duplicate proof giữ vị trí nguồn trước và rule giữ lại. Không coi số dòng giảm là hiệu năng.

EmptyState có7consumer thật, giữ wrappersection/div/class/children/role/actions; chưa có/search-empty/unread-empty/error không chung thông điệp. ResponsiveTable có2consumer Dashboard, chỉ trích div.table-scroll. Không có phiên bản mobilecard/sticky mới trong C93.

Ngoại lệ màu explicit: palette tokens; theme/manifest metadata trước CSS; Playground accent là user configuration; logo/SVG là tài sản. ShadowRGB Playground dùng semantic channel và alpha do component hiện tại cấp; không thay default/interaction.

## Gate và lỗi được giữ

Baseline trước đầu160samples PASS4.2m; sau đầu160samples PASS4.3m. Raw computed/pixel phát hiện một số snapshot trong lúc focus/dialog transitions đang chạy; không coi khác biệt đó là cùng hình. Bóng dialog rgba vscolor(srgb) biểu diễn cùngRGBA nhưng được chốt alias shadow trực tiếp theo giá trị trước để so computed ổn định. Các ảnh/raw diffs/lượt đầu giữ trong ignored.cache/c93/before và after.

Lượt final chụp ở trạng thái ổn định: reduced-motion cùng điều kiện hai bên, fonts.ready, đợi animation hữu hạn hoàn tất và screenshotanimationsdisabled. Cổng full E2E hiện hữu vẫn kiểm motion/lifecycle theo test gốc; matrix tĩnh không thay thế cổng đó. Tạm dựng lại các file source trước theoSHA đã guard trong phạm vi xác định, lưu chính xác bản refactor trước khi đổi và phục hồi sau lượt before; không reset/delete diện rộng.

Unit đầu2FAIL vì harness trích production function/page chưa nạp ResponsiveTable/EmptyState. Adapter nạp component thật, giữ tất cả assertions/branches; unit sau đạt. Không mock primitive thànhstub hoặc hạ privacy expectations. Lint/typecheck đạt trước full gate.

Final computed: **160/160 khớp**, so standard properties và rectangles; custom properties mới là cấu trúc token được chủ động loại khỏi phép so. Final pixel: **159 cặp full-page khớp tuyệt đối + 1 cặp viewport 375×900 khớp tuyệt đối**. 15 mẫu được đo lại với pointer trung tính và đợi Push support check kết thúc; các lượt raw vẫn giữ. Một ảnh bảng dài 375×5015 có sai khác khi Chromium ghép fixed/sticky bars ngoài viewport; không gọi ảnh đó khớp. Computed toàn trang và viewport cuối trang đều khớp; raw mismatch cùng disposition ở pixel-comparison.json. [Đối chiếu 5 cặp](comparison.html) dùng ảnh synthetic nguyên bản.

| Gate hiện hữu | Kết quả |
|---|---|
| pnpm lint | PASS final |
| pnpm typecheck | PASS, 3 workspace projects |
| pnpm test | PASS 117, không giảm assertions |
| pnpm build | PASS monorepo, 19 routes web |
| pnpm test:e2e | PASS 64 / SKIP 18 / FAIL 0, 12.0 phút, retries 0 |

Full E2E gồm các remediation áp dụng C63/C67/C72/C75/C78/C81/C84/C87/C90; các capture/probe opt-in vẫn giữ skip hiện hữu. Không sửa cấu hình E2E, assertions, timeout hoặc skip. Log negative-path errors và cảnh báo CLI giữ nguyên; không coi mọi log Error là test failure. Evon probe public login Light/Dark ở 375/768/1024/1280/1440/1920 và sweep: raw P0; không suy kết quả này thành toàn app.

DB test được guard đúng Docker label và host port 55322; sáu bảng profiles/loans/transactions/counterparties/notifications/auth.users đều 0 sau teardown. 15 file C75 do E2E sinh được lưu cache rồi phục hồi chính xác; toàn bộ 17 hash C75 giữ nguyên. Source trước có 1132 tracked files:17file thay đổi đúng scope C93,1115file khác khớp hash; không reset diện rộng. Logs/helpers/raw screenshots/session synthetic giữ ở ignored `.cache/c93/`.

Metrics source CSS: trước **1968 dòng / 143046 raw bytes / 24273 gzip bytes**, sau **2033 / 152289 / 26217**. Gzip là phép nén tập nguồn được inventory mô tả, không phải transfer sản phẩm. File lớn nhất từ 1729 xuống 410 dòng; tổng nguồn tăng do thêm lớp token. Hai asset CSS compiled sau build được ghi hash/size riêng; compiled trước không đo. Không tuyên bố refactor làm tải trang nhanh hơn. Inventory gồm tokens, overrides, consumers và 13 duplicate proofs.

Không thay schema/RPC/financial engine nên pgTAP riêng không áp dụng. C93 chỉ local; không yêu cầu CI remote, push hoặc deploy. Artifact hash/160entries, preservation, git diff --check và Gitleaks8.30.1 pinned digest (changed files/diff, redacted) PASS,0findings. C94 được đặt AWAITING_APPROVAL rồi dừng.

## Giới hạn

AT/VoiceOver/TalkBack, phone thật/bàn phím mềm, SafariFirefox authenticated, OS-theme live/PWA trướcHTML/remote save NOT_TESTED. Matrix mô phỏngOS sáng/tối trong Chromium là có phạm vi; không chứng nhận thiết bị/WCAG toànapp. C91 query_canceled57014 chưa xác định nguyên nhân; không schema/RPC/timeout tuning, không mở lại backup/Google/cleanup.
