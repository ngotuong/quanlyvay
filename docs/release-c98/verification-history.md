# C98 — Lịch sử verification

C98 đã được OWNER phê duyệt ngày10/10/2026; phạm vi A/C92–C97, nghiệm thu và release C91/runbook.

1. Đọc code phát hiện bốn test C94–C97 khóa port55321, khác CI disposable54321. Kỳ vọng đổi theo
   CI environment giống guard helper hiện hữu; không nới assertion nghiệp vụ/timeout/retry/skip,
   không runtime/schema/Authcontract change. CI remote sẽ xác nhận nhánh54321; local giữ55321.
2. Matrix1 INTERRUPTED/1DID_NOT_RUN:9route375Light đã đo; trace xác nhận helper gọi accessible
   name '+50tr' trong khi nút có aria-label 'Cộng 50 triệu đồng'. Dừng exact runner bằngSIGINT,
   teardown isolatedtestenv; không retryblind/không gọiPASS. Sửa locator theo ARIA hiện hữu,
   thêm actiontimeout15s để lỗi locator không chờ20min. Systemtest dùngdata-theme='system' và
   so backgroundcomputed với explicitmode; code/appdocument xác nhận preference làsystem,
   effective màu doCSSmediaquery. Không đổi sản phẩm để khớp helper.

Gates còn đang chạy; không phát hành trước sourceSHA/RequiredCI/gate đạt. NOT_TESTED physicalphone/
AT/authenticatedSafariFirefox/nativezoom/clipboard/OS-theme/PWA-beforeHTML/remote save. Rawtrace/session/
log ở ignored.cache/c98, không đưa secret hoặc dữ liệu tài chính thật vào Git.

3. Matrix2:2PASS0FAIL3.5m;100main/drawer,72reflow/text200/shortviewport,4Systemprivacy,
  36bigintpresentation/36paintedzoom emulation. Tất cảoverflow0; shape/labels/keyboard/draft/focus
   giữ. Không ledger write với max/signedVND; dữ liệu giả do fixture RPC tạo trên C20-test.
4. Rawcontrast lần đầu21fail do helper chỉparseRGB và coiCSScolor(srgb0..1) nhưRGB0..255.
   Thêm parser đúng normalized255, unknownformat fail thay vì lấyblackfallback. Ngưỡng text4.5/
   large3 giữ; đo lại riêng18route-theme blocks. Raw21 vàmatrix1trace giữ ở.cache/c98.

5. Contrast/probe2PASS0FAIL3.3m:1186textnodes/min4.8294/0fail. Evon rawP1focus-scroll/P2P3zero
   tooltip giữ; actualready375×900before/clearfocus0. 46PNG được sao chép bền;153websrc C97hash
   khớp. Packaginghelper lần đầu khóa nhầm149tracked thành153 (4ignoredDS_Store); assert fail
   trước viếtmanifest, đã dùng đúng C97manifest153. Không source/runtime change.

6. Full-history pinnedgitleaks8.30.1:172commits/1finding, generic-api-key tại C92 reference-manifest
   line6. SHA2565242306f…bd66079 khớp chính xác reference/tokens.css; đây là checksum publicfixture,
   không credential. Thêm .gitleaksignore một fingerprint exactcommit/file/rule/line có giải thích,
   giữ rawredacted finding, không rộng path/rule hoặc rewritehistory. .vercelignore loại metadata này.
   Artifact scan0findings; full-history sẽ chạy lại với exception đã xác minh.
