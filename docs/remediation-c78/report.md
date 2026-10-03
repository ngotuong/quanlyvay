# C78 — Privacy biểu đồ, focus menu và upload guard local

Ngày kiểm: 03/10/2026. OWNER đã phê duyệt C78 trong hội thoại. C78 `COMPLETED` local;
checkpoint C79 `AWAITING_APPROVAL`, chưa rollout.

## Thay đổi và bằng chứng

| Phát hiện C77 | Nguyên nhân và bản sửa C78 | Trạng thái |
|---|---|---|
| F1 MEDIUM/P2: scale tiền hiện khi privacy bật | `apps/web/src/app/dashboard/page.tsx:171`: ba nhãn trục dùng `PrivacyAmount`, fallback `—`, kể cả mốc 0. Tooltip/bar/table tiếp tục dùng PrivacyRegion/PrivacyAmount có sẵn. | Đóng local, chờ rollout |
| F2 MEDIUM/P2: initial focus ghi đè thao tác | `apps/web/src/components/app/app-nav.tsx`: bỏ rAF mở/return-focus, focus đồng bộ một lần khi showModal; hủy timer đóng khi reopen/pathname đổi, bỏ lớp closing. Không viết lại trap BottomSheet. | Đóng local, chờ rollout |
| F3 MEDIUM/P2: source C73 còn backup/test artifacts | `scripts/vercel-upload-guard.mjs` kiểm metadata local fail-closed; root pipeline gọi guard trước upload. `.vercelignore` bổ sung scripts và cache/backups/tmp lồng. | Phòng tái diễn local; cleanup remote vẫn OPEN |

Không đổi schema/RPC/tính lãi hoặc số quyết toán. Bố cục, brand, thứ tự KPI dư nợ/lãi ròng
trên Việc cần xử lý được giữ và kiểm bằng bounding box trong sáu tổ hợp viewport/theme.

## Phương pháp kiểm chứng

- `apps/web/test/e2e/c78-remediation.spec.ts`: Chrome headless trên production build local,
  fixture giả trong DB riêng55322. Sáu tổ hợp375/390/1440 × light/dark: mở tooltip, bật privacy,
  mở bảng số liệu, kiểm scale/visible text/accessible snapshot/attributes, toggle phục hồi số và
  tương tác. Bốn loan fixture tạo qua RPC và đối chiếu `calculate_loan.periods`1/2/3/12;
  mọi nhánh ẩn chart, bỏ title/accessible money và phục hồi đúng text khi hiển thị.
- Zero dashboard dùng kỳ2000-01 không giao dịch, phải hiện empty state, không scale/bar.
  `apps/web/test/unit/chart-privacy.test.mjs` render trực tiếp function production (TS AST),
  provider và chart thật: period0/1/2/3/12, cash rows rỗng/toàn0/mixed0-nonzero. Nhánh0 kỳ chỉ
  render local vì không tạo khoản vay trái quy tắc ngày chỉ để ép calculator trả0 kỳ.
- Focus32 lượt eager:2 viewport ×2 motion ×8, giữ đúng chuỗi C77 và timeout1s;
  không thêm chờ frame/timer để che race. Kiểm last-focus/Tab/Shift+Tab/Escape/return/state.
  Test bổ sung keyboard Enter, close/reopen trong cùng JS task trước frame, close đang pending
  cùng SPA navigation rồi reopen. Metadata failure có status/file/active tag; trace/screenshot
  thất bại của Playwright ở thư mục ignored, không đưa cookie/credential vào report.
- `scripts/vercel-upload-guard.test.mjs`: fake metadata forbidden/valid, ignore drift/negation,
  excluded fixture và stray dump/symlink. Chỉ đọc `.vercelignore`; candidate file chỉ lstat,
  không đọc ciphertext/dump/secret thật. Fixture riêng dưới `.cache`, cleanup đúng fixture.
- C77 before vẫn nguyên tại [audit-c77](../audit-c77/report.md), gồm15 lỗi eager/32.
  After và kết quả C78 tại [browser-evidence.json](browser-evidence.json), không ghi đè C77.

## Giới hạn guard và privacy

Guard là dự đoán metadata local với subset ignore rõ ràng; Vercel quyết định payload thật.
Contract ignore hiện có phải giữ cùng `rules`; thay đổi rule/negation không được hỗ trợ sẽ
chặn pipeline để review. `.env.example` được phép; không kiểm nội dung mọi source file bằng
guard này. Credential scan riêng vẫn bắt buộc. Root scripts SQL không cần cho Next.js build,
nên loại trừ `/scripts/`; root patches/lock/package metadata vẫn được giữ.

Dry-run không chứng minh source/package remote sạch và không xóa hai deployment C73 cũ.
Inventory candidate/output, Auth/runtime smoke, alias/log và cleanup là việc C79 chờ duyệt.
Privacy là che trên giao diện/accessible tree; không bảo vệ payload, DevTools hoặc thay RLS.
Chưa kiểm native Safari/Firefox, VoiceOver/TalkBack và mobile vật lý trong C78.

## Gate local

| Gate | Kết quả |
|---|---|
| corepack pnpm lint / typecheck | PASS / PASS |
| corepack pnpm test |105/105 PASS: domain11, Google Sync18, web47, scripts29; có11 tests C78 mới |
| corepack pnpm build | PASS production build |
| corepack pnpm test:e2e |51 PASS /7 audit opt-in SKIP /0 FAIL,6,5m; retries0 |
| C78 targeted E2E |3/3 PASS,1,7m; final full gate chạy sau khi sửa harness |
| Metadata guard |3/3 unit PASS; actual local prediction191files/4.541.300bytes; chưa upload |
| node --check scripts/deploy-preview.mjs | PASS |
| git diff --check / credential scan | PASS / PASS, Gitleaks pinned redacted stdin intended textual diff + new source/evidence |
| DB riêng55322 hậu kiểm | profiles0 / loans0 / transactions0 |

Trước lượt chốt có lỗi harness đo layout trước khi content sẵn sàng, tái tạo counterparty làm
idempotency input đổi, selector DOM chọn menu desktop ẩn. Đã sửa readiness/fixture/selector,
không thêm waits trong eager-focus sequence. Các lượt fail không được dùng để tuyên bố gate đạt.
Full suite có negative cases permission/cancel/timeout và log lỗi giả lập tương ứng; không dùng
E2E để khẳng định runtime log Production sạch. Các ảnh C75 do harness tự ghi lại đã được trả về
bản trước test; C77 audit được giữ nguyên. Gate evidence tại [local-gate-evidence.json](local-gate-evidence.json).

## Ảnh đối chiếu synthetic

| Viewport/theme | Before C77 | After C78 |
|---|---|---|
|375 light|[before](../audit-c77/dashboard-hidden-375-light.png)|[after](dashboard-hidden-375-light.png)|
|375 dark|[before](../audit-c77/dashboard-hidden-375-dark.png)|[after](dashboard-hidden-375-dark.png)|
|390 light|[before](../audit-c77/dashboard-hidden-390-light.png)|[after](dashboard-hidden-390-light.png)|
|390 dark|[before](../audit-c77/dashboard-hidden-390-dark.png)|[after](dashboard-hidden-390-dark.png)|
|1440 light|[before](../audit-c77/dashboard-hidden-1440-light.png)|[after](dashboard-hidden-1440-light.png)|
|1440 dark|[before](../audit-c77/dashboard-hidden-1440-dark.png)|[after](dashboard-hidden-1440-dark.png)|

Before/after dùng fixture synthetic khác nhau; mục tiêu so sánh là scale tiền khi ẩn,
không suy ra số nghiệp vụ thay đổi từ ảnh. Không có dữ liệu tài chính thật trong ảnh.
Ảnh crop theo card; fixed-shell overlay có thể xuất hiện trong mobile capture, không dùng crop
để kết luận toàn bộ shell bị clipping. Sáu ảnh đã được xem; ba mốc trục và bảng che đúng.

## Điểm dừng

C78 không push/deploy, không đổi database/account/secret/Google hoặc xóa deployment remote.
Production vẫn C76. C79 rollout/cleanup có phạm vi và acceptance criteria
tại roadmap mục37; phải chờ OWNER phê duyệt trước thực hiện. Không tạo local commit trong C78;
source và bằng chứng C77/C78 còn trong working tree để review.
