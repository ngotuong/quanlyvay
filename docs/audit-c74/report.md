# C74 — Audit hành trình UI/UX sau rollout

Ngày 02/10/2026. Runtime được audit: HEAD `4c84d671721b0ad38691f1c7c3691e53efcdfa51`.
Startup main khớp origin/main, không có thay đổi local sẵn có. C74 chỉ thêm tài liệu/harness;
không sửa runtime, migration, credential, dữ liệu remote, deploy hoặc push.

## Phương pháp và giới hạn

- [Ma trận](matrix.md): 9 route/view × 375/390/1440px × light/dark = 54 lượt đo.
  Chrome headless dùng bản Next production build local và Supabase test API55321/DB55322.
  [Số đo](evidence.json), ảnh trong thư mục này đều từ dữ liệu synthetic.
- Hành trình tìm khoản → detail → lịch sử → liên kết quay lại; dashboard → xem tất cả;
  đối tác tìm/thêm; chi phí thêm/draft/error; thông báo filter/read/empty được thao tác local.
  Không ghi nghiệp vụ hoặc đánh dấu đã đọc trên Production/Preview.
- Safari native Production `/dashboard` redirect `/login`, public login render bình thường.
  Phiên Chrome authenticated cũ không truy cập được ở thời điểm audit. Remote authenticated
  Production/Preview mới trong C74: NOT_TESTED. Bằng chứng rollout C73 không được coi là lần
  kiểm C74. Không yêu cầu OWNER đăng nhập lại để hoàn thành audit synthetic.
- Safari authenticated/mobile vật lý/Firefox/VoiceOver/TalkBack/zoom OS: NOT_TESTED.
  Không suy ra WCAG compliance từ geometry, một lần Tab hoặc không tràn ngang.
- Mockup [review.html](review.html) chỉ là đề xuất, không phải sản phẩm đã sửa. Công cụ browser
  từ chối giao thức file://; chưa xác minh render mockup bằng browser, không dùng workaround.
- Không kết luận lại nguyên nhân cảnh báo Chrome của C73. Cảnh báo vẫn OPEN theo
  `docs/C73_RELEASE_BLOCKER.md`; chưa tái hiện trên hostname immutable ở phiên C74 này.

## Phát hiện có bằng chứng mới

Không phát hiện CRITICAL/HIGH trong phạm vi hành trình đã kiểm. MEDIUM có thể gây chọn nhầm
hoặc phải tìm lại; LOW là copy/khả năng đọc. Không phải audit lại toàn bộ tài chính hay bảo mật.

| ID / mức / phân loại | Vị trí | Nguyên nhân và bằng chứng | Tác động | Hướng sửa |
|---|---|---|---|---|
| F1 MEDIUM / Hỏng ngữ cảnh | `apps/web/src/app/dashboard/page.tsx:198`; `apps/web/src/app/globals.css:1087` | `.due-main strong` nowrap/ellipsis áp vào toàn bộ tên dài. Đo: 375px vùng 241px, text 681px; 5 tên bị cắt tại cả375/390 light/dark; desktop1440 cũng cắt tên và ngày ở fixture dài. [Ảnh](dashboard-390-light.png), matrix/evidence `clippedTasks`. | Các khoản cùng tiền tố nhìn giống nhau; phần phân biệt ở cuối biến mất. Phải mở detail rồi quay lại để đọc tên đầy đủ. Không chứng minh đã ghi nhầm giao dịch. | Tách tên đối tác/hướng/nhãn khi có dữ liệu cấu trúc; tên custom phải giữ đầy đủ qua wrap/expand accessible. Không tùy tiện parse chuỗi hoặc rút mất nhãn cuối. Ngày nhắc/kỳ chốt đọc được. |
| F2 MEDIUM / Hỏng đích thao tác | `apps/web/src/app/dashboard/page.tsx:183` và `:201` | List cắt còn5; “Xem tất cả 13 giao dịch” href `/loans`. Đã click và thấy heading “Các khoản vay”, thiếu ngữ cảnh việc đến hạn. `observations.dashboardAll`. | Người dùng phải lọc/tìm lại; danh sách khoản vay không tương đương tập việc (một khoản có thể có nhiều loại việc). Label giao dịch còn gây nhầm với ledger đã ghi. | Đổi sang “việc cần xử lý”, mở rộng đủ tập việc ngay tại dashboard, thu gọn được, giữ vị trí/focus. Không thay số tiền hoặc logic lịch authoritative. |
| F3 LOW / Hỏng khả năng đọc | `apps/web/src/app/loans/[id]/page.tsx:124`; `apps/web/src/components/app/privacy-provider.tsx:38` | PrivacyRegion thay nội dung bằng span không có separator, kế tiếp là text Giải ngân. Click privacy và đo `Nội dung đang ẩnGiải ngân 1/8/2026`. [Ảnh](privacy-detail-390.png). | Dính chữ, hierarchy tiêu đề mất rõ ràng. Đây là copy/layout, không phải bằng chứng lộ secret. | Render metadata thành các phần có separator/khoảng cách ở call site; không tự thêm khoảng trắng toàn cục vào mọi PrivacyRegion. Test cả tên generated/custom và history nếu dùng metadata tương tự. |
| F4 LOW / Hỏng thông điệp trạng thái | `apps/web/src/app/notifications/page.tsx:26` | Cùng empty state cho Tất cả/Chưa đọc. Local đánh dấu unread cuối rồi thấy “Chưa có thông báo… khi bộ nhắc lịch chạy”, dù fixture còn notification đã đọc. `observations.unreadEmpty`. | Người dùng có thể tưởng runner chưa hoạt động hoặc thông báo mất. | Empty theo filter: “Bạn đã đọc hết thông báo”, CTA Tất cả; chưa từng có notification giữ copy riêng. |

## Đề xuất thẩm mỹ / hierarchy, không phải lỗi chắc chắn

- G1: Notifications375/390 có block cấu hình thiết bị trước list, chiếm nhiều vùng nhìn đầu.
  [Ảnh](notifications-unread=true-390-light.png). Đề xuất đưa list lên trước, cấu hình trong
  disclosure có trạng thái bật/tắt rõ. Lựa chọn ưu tiên công việc, không kết luận cấu hình hỏng.
- G2: Desktop danh sách dùng card cao; khi nhiều khoản, phải cuộn dài. [Ảnh](loans-1440-light.png).
  Có thể thêm chế độ hàng gọn sau này; giữ ngoài C75 để không mở rộng redesign cả app.

Không báo màu brand, bo góc, shadow hoặc focus outline hiện hữu thành bug chỉ vì khác gu skill.

## Hành trình và số thao tác

Đếm input/click, không đếm login/setup/direct goto; không gồm thao tác chọn ngày tùy ý.

| Hành trình local | Số thao tác | Kết quả / giới hạn |
|---|---:|---|
| Tìm khoản → detail → history → explicit back | 4 | Query C74 giữ nguyên. Không mở lại lỗi mất bộ lọc cũ. Scroll restoration của explicit back chưa đo riêng. |
| Dashboard → Xem tất cả | 1 | Đến loans chung; F2. Mục tiêu C75:1 thao tác mở đủ cùng tập việc. |
| Đối tác search | 2 | Input + submit, trả1 đối tác. So với loan debounce cần thêm submit; chưa gọi đó là bug. |
| Thêm đối tác tối thiểu | 3 | Mở sheet, nhập tên, lưu; tự đóng, focus về trigger. |
| Thêm chi phí tối thiểu | 4 | Mở sheet, tiền, nhóm, lưu; tự đóng, focus về trigger. |
| Draft chi phí → Escape → hủy bỏ việc đóng | 4 | Mở/nhập/Escape/dismiss; giữ nguyên draft và sheet. Sau đó accept discard để tiếp tục. |
| Chi phí lỗi mạng | 4 | Abort POST local trước dispatch; message phục hồi, giữ draft/sheet. Không ghi giao dịch của probe lỗi. |
| Notifications unread → mark all read | 1 | Filter aria-current đúng; empty copy sai ngữ cảnh F4. Mutation chỉ synthetic. |
| Loan tab history mạng chậm | 1 | DelayRSC1800ms; progress data-visible=true tại200ms. Skeleton0 ở mẫu; đã có phản hồi, không báo “không loading”. |
| Expense sheet keyboard375 | 2 | Mở + Tab:focus nằm trong sheet; Escape đóng, focus về trigger. Chưa test toàn bộ chu kỳ focus trap/AT. |

54 lượt không tràn ngang; pageerror0 trong probe journey. Server destination-stream-closed xuất
hiện khi audit chủ động abort POST/chuyển request; không quy thành lỗi Production.

## Kiểm thử và lịch sử chạy

- Lint/typecheck: PASS sau sửa harness.
- Lượt đầu thu đủ54 matrix, sau đó harness hủy navigation bởi listener dismiss mọi confirm
  còn gắn sau probe dirty; đã sửa cleanup listener, không sửa sản phẩm.
- Lượt tiếp theo setup bị Auth gateway local502 sau reset. Restart riêng container Kong của
  `QuanLyVayCaNhan-C20-test`, không đụng Supabase remote/project anh em. Chạy với
  `E2E_DATABASE_PREPARED=true` trên baseline do teardown trước đã reset; không bỏ kiểm tra đích DB.
- Gate chốt: `C74_AUDIT=true C74_FRICTION_ONLY=true E2E_DATABASE_PREPARED=true pnpm test:e2e c74-audit.spec.ts`.
  Rerun friction giữ matrix đã chụp độc lập; không tuyên bố chụp lại54 lượt. Kết quả chốt/context
  đạt2/2 (49,9s), exit0; teardown xong, profiles/loans/transactions đều0. Diff-check PASS.
  Không rerun toàn bộ CI hoặc phát hành revision này.

## Đề xuất C75 — remediation ngữ cảnh công việc và thông báo

Phạm vi: F1–F4 và G1. Giữ brand và dữ liệu authoritative; không migration, đổi quyết toán, RPC
mutation, credential, push, deployment hoặc sửa các dự án khác. G2 và cảnh báo Chrome OPEN ở backlog.

Acceptance criteria:

1. Fixture có ít nhất13 việc, tên cùng tiền tố và nhãn khác ở cuối. 375/390/1440 light/dark:
   đọc/phân biệt tên/nhãn, hướng, ngày nhắc/kỳ chốt và tiền; không cắt phần thiết yếu không có
   cách mở đầy đủ bằng keyboard/touch; không horizontal overflow.
2. Một click/activation “Xem toàn bộ … việc cần xử lý” hiện đúng13 việc cùng tập nguồn; thu gọn
   về5, label/count đúng, không điều hướng loans chung. Focus/scroll không nhảy mất ngữ cảnh.
3. Privacy on/off: metadata có khoảng cách/separator, không lộ tên/tiền trong text, title, aria;
   không làm đổi ledger/date. Kiểm tên generated/custom và các metadata liên quan.
4. Chưa đọc rỗng và Tất cả rỗng có copy khác; CTA Tất cả giữ hành vi read/count đúng; không
   gọi runner hoặc mark-read ngoài hành động người dùng.
5. Notifications375/390 thấy item đầu hoặc empty trước block cấu hình; disclosure keyboard
   dùng được, trạng thái push/time vẫn truy cập được; không tự xin quyền hoặc đổi setting.
6. Test hồi quy explicit back/query, save tự đóng/focus, draft/error, tab loading tiếp tục đạt.
   Gate runtime: diff-check, lint, typecheck, unit, build, E2E liên quan; không yêu cầu AT vật lý
   mới để đóng checkpoint local. Chưa deploy/push trong C75, rollout phải có checkpoint riêng.
7. Context/roadmap chuyển trạng thái cùng thay đổi, review synthetic có bằng chứng sau sửa;
   checkpoint kế tiếp AWAITING_APPROVAL rồi dừng.
