# C92 — Kết quả thiết kế đã chốt

C92 **COMPLETED** ngày09/10/2026. OWNER chọn **A**, sửa Quick Amount thành50tr/100tr/150tr/…; mẫu chốt4nút +50tr/+100tr/+150tr/+200tr. Đã audit stack/component/token, đo baseline và khóa [đặc tả](selected-design.md). Chưa sửa runtime/deploy hoặc thay dữ liệu thật.

Baseline fresh chạy Chrome production build của sourcef1f474d, fixture C20-test55322 đã guard.32samples,375/1280×900, Light/Dark;0pageoverflow/0pageerror, body16.12journeys đo disclosure, mở việc và nhập tiền. Ba thao tác mở bảng; một click mở interest task đi qua detail;8phím số từ empty focused input thành10.000.000. Không submit. Automatic scrolling khác scroll gesture của người; không suy người dùng không cần cuộn. Không nghiên cứu tỷ lệ người đọc sai.

G1: trong probe scroll nội bộ ở375, cả hai bảng mất first-column visibility khi cuộn (static); khung scroller giữ các số. G2: expense percentage11.2px và managed-user status11.52px ở hai theme/khổ. G3: có tên200 và metadata fixture; detail-long before mới NOT_MEASURED, nguồn Gu lịch sử C89 được phân biệt. G4: chưa coi screenshot là kiểm toàn bộ tương tác/human reading.

Baseline helper đầu: getAttribute(open) trả chuỗi rỗng, điều kiện falsy đóng một bảng đã mở và làm counter thành4. Lượt đầu giữ trong ignoredcache, không dùng làm finaltable baseline; sửa so với null, rerun3click/đềuopen. Sau đó mở rộng thêm2scene để đo G2. Source và toàn bộ artifacts có sẵn giữ hash. Teardown chỉ localC20-test, sáu bảng rỗng.

Prototype QA đầu154samples có19fail: task-name link chưa đủ44px và một focus-loopA. Khắc phục vùng bấm và trap theo BottomSheet hiện hữu; lượt kế tiếp154/0fail, hai keyboard journeys Tab/Escape/return-focus đạt. Lượt hiện tại thêm scope/semantics rồi106/0fail. Các lượt lỗi và code/render được giữ trong `.cache/c92/qa-first`, `qa-second` cùng logs; không gọi lượt lỗi PASS.

Probe Evon nguyên script (không nới rule) trên table A-Light/B-Dark,6khổ và24sweep widths. RawP1 nêu cột Đối tác dưới200px có2/4bodycells hơn1dòng. Rule comment nói bảng không cuộn nhưng code không loại scroller; không phải header wrap. A đã nới desktop224px. B-mobile136px là đích có chủ ý để còn chiều ngang tiền: có scroller, first column sticky, tên dài có disclosure. RawP củaB giữ kèm disposition/geometry; OWNER chọn A, B không triển khai; không xóa khỏi report hoặc tăng cột chỉ để né rule.

Prototype dùng snapshot token/primitives/Inter và logo brand-symbol của app. Giữ navbar7mục và mobile4+Thêm. Tất cả số là giả và lấy từ cùng backend fixture; max/negative chỉ scene trình bày, không ledger. Các scene/phạm vi là mẫu tĩnh; không triển khai QuickAmount calculation, API submit, dirty/pending business lifecycle hoặc route mutation trong app. Không giả đã ghi thành công.

Wireframes và32ảnh before được đóng băng trong [reference](reference/README.md);9ảnh mẫu A trong screenshots/, baseline/QA/contrast JSON ở đây. Cache giữ logs/code/lượt lỗi đầy đủ. Quy tắc AGENTS/context về cập nhật checkpoint và filesystem thắng câu skill “chưa qua cổng2 không đụng file dự án/TMPDIR”: chỉ sửa progress/docs C92, code mẫu ở cache, không appsrc. Brief được coi đủ từ checkpoint đã duyệt; OWNER đã qua cổng chọn mẫu theo acceptance2; C92 vẫn chỉ docs/mẫu độc lập.

NOT_TESTED: VoiceOver/TalkBack, mobile vật lý/bàn phím mềm, SafariFirefox authenticated, OS-theme/PWA trướcHTML/remote save. C92 không xử lý nguyên nhân Dashboard query_canceled57014 đã ghi C91; không schema/RPC/timeout tuning hoặc mở lại backup/Google/cleanup từ lịch sử.

Kết quả cuối hiện tại: prototype106/0fail, Tab/Escape/focus2/2; token contrast10cases
min text4.74686:1, control border3.86095:1. Parser color(srgb) fractions đã sửa trước
kết luận; initialtext error/error-surface4.4148 được giữ và chỉnh token error-text trong
mẫu, không runtime. EvonA thirdrawP0; BrawP1 giữ disposition136px +scroll/sticky/full-name.
NativeA/B đã mở và đọc AX bằng Codex in-app ở lượt review. Sau lựa chọn, nativeA/Tiền gốc xác nhận4nhãn accessible “Cộng50/100/150/200triệu đồng”; tab mẫu A giữ làm deliverable.
Files nguồn giữhash; C92 đãCOMPLETED, C93AWAITING_APPROVAL.

## Gate sau lựa chọn OWNER

Bổ sung cùng fixture khoản Minh An: chọn Tiền gốc, clear/focus rồi gõ50.000.000.375/1280×900 LightDark đều8phím số, normalized50000000, submit0.32samples/16journeys, test1PASS1.6m; baseline12journeys10triệu trước chọn giữ ởcache. Teardown55322sáu bảng đều0.32ảnh before cuối cập nhật drawer50triệu/Tiền gốc; trạng thái empty prototype có giới hạn bổ trợ được ghi rõ.

Prototype cuối110samples0fail, keyboard2/2 và4checks nhãn chip OWNER đạt. Contrast10cases mintext4.74686/control3.86095; syntax/diff/secret gate đạt. Source/artifacts có sẵn1063file giữ SHA256, không thay product code. Lint/typecheck/unit/build/fullE2E sản phẩm không chạy lại cho thay đổi docs/static này; baseline riêng đã dùng production build, không lấy prototype thay gate C93–C98.

Launch đầu baseline root pnpm exec không tìm Playwright; chưa chạy test/fixture, sửa đường gọi --dir apps/web/config tuyệt đối. QA đầu chưa có server sau chuyển lượt, connection refused; mở lại serverlocalhost scoped rồi110PASS. Hai log lỗi giữ trongcache, không gọi PASS.

C94 được ghi rõ thêm taskdesktopfull-width/cashflowbelow theo A khi OWNER duyệt checkpoint đó; C96 dùng drawerA, C95 dùng nhóm50triệu. Thay tiêu chí cũ10triệu/≤2chips bằng50triệu/1chip theo chỉ dẫn OWNER;10triệu vẫn gõ/paste. Không tự thực hiện các checkpoint sau.
