# Implementation Plan

## 1. Quy tắc roadmap

- Đây là roadmap chuẩn cho dự án `QuanLyVayCaNhan`.
- Chỉ triển khai checkpoint đã được người dùng phê duyệt rõ.
- Khi chuyển trạng thái phải cập nhật đồng thời bảng này và `PROJECT_CONTEXT.md`.
- Không đổi phạm vi checkpoint sau phê duyệt. Việc phát sinh phải được ghi thành revision hoặc checkpoint mới có lý do.
- Trạng thái hợp lệ: `NOT_STARTED`, `AWAITING_APPROVAL`, `APPROVED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`.

## 2. Bảng checkpoint

| ID | Checkpoint | Đầu ra và acceptance criteria | Gate xác nhận | Trạng thái |
|---|---|---|---|---|
| C0 | Quản trị dự án | Git local branch `main`; tạo `AGENTS.md`, `PROJECT_CONTEXT.md`, roadmap, README, `.gitignore`; không có remote | Duyệt checkpoint | `COMPLETED` |
| C1 | Monorepo Next.js | pnpm workspace; `apps/web` dùng Next.js App Router, TypeScript, Tailwind, ESLint; lint/typecheck/build đạt | Duyệt checkpoint | `COMPLETED` |
| C2 | Đặc tả nghiệp vụ | Khóa kiểu dữ liệu, quy tắc ngày/lãi, trả thiếu/thừa, trả gốc, tất toán, nợ xấu; bộ test fixture chuẩn được review | Duyệt checkpoint | `COMPLETED` |
| C3 | Supabase local | `supabase init`; migration cho người dùng, đối tác, khoản vay, giao dịch, kỳ lãi, chi phí, thông báo, audit; RLS/database tests đạt | Duyệt checkpoint; chưa đăng nhập | `COMPLETED` |
| C4 | Bộ máy tài chính | Database functions tính kỳ lãi, chia đoạn dư nợ, đổi lãi suất, đảo giao dịch và tính lại lịch sử; test tiền đạt | Duyệt checkpoint | `COMPLETED` |
| C5 | Auth và phân quyền local | Username/password ánh xạ Supabase Auth; owner/editor/viewer; không tự đăng ký; RLS tests đạt | Duyệt checkpoint | `COMPLETED` |
| C6 | Nghiệp vụ web | CRUD đối tác/khoản vay; nhập lãi/gốc/chi phí; tất toán, nợ xấu, timeline, audit; Playwright flow đạt | Duyệt checkpoint | `COMPLETED` |
| C7 | Dashboard và UX | KPI tiền mặt/dồn tích, dư nợ, lãi dự kiến, đến hạn/quá hạn, biểu đồ dòng tiền; responsive 375–1440px, dark mode | Duyệt checkpoint | `COMPLETED` |
| C7G | GitHub remote | Xác nhận tài khoản/tên/visibility; tạo repository, thêm `origin`, push branch `main`; không chứa secret | Xác nhận tài khoản + tạo remote + push | `COMPLETED` |
| C8 | PWA và thông báo local | Manifest, service worker, installable PWA, notification center, Web Push, idempotency và nhắc quá hạn hằng ngày | Duyệt checkpoint | `COMPLETED` |
| C9 | Google Sync local | Apps Script đồng bộ một chiều, cấu trúc Sheet, snapshot tuần, retention 12 tuần; test bằng mock; chưa `clasp login` | Duyệt checkpoint | `COMPLETED` |
| C10 | Supabase remote | Dùng tài khoản Supabase mới để tạo project `quan-ly-vay-ca-nhan` tại Singapore, link CLI, cấu hình secret và áp migration | Xác nhận tài khoản và thao tác remote | `COMPLETED` |
| C11 | Google/Clasp remote | Xác nhận Google account; tạo Apps Script `QuanLyVayCaNhanSync`, Sheet đối chiếu, Drive backup; push mã và trigger snapshot tuần | Xác nhận tài khoản và từng tài nguyên | `COMPLETED` |
| C12 | Vercel Preview | Khắc phục revision audit local; kiểm tra usage tài khoản Vercel cũ, tạo/link project `quan-ly-vay-ca-nhan` với root `apps/web`, cấu hình env, deploy Preview và kích hoạt trigger Google Sync theo giờ | Xác nhận tài khoản và deploy | `COMPLETED` |
| C13 | Production/UAT | Kiểm thử dữ liệu mẫu, quyền, Push, sync, backup/restore; xóa seed; production deploy và checklist vận hành | Xác nhận production riêng | `COMPLETED` |
| C14 | Hiệu năng và độ mượt UX | Đồng vùng Vercel Functions với Supabase Singapore; giảm waterfall truy vấn Auth/dữ liệu/thông báo; phản hồi chuyển trang tức thời, loading ổn định; đo trước/sau và kiểm tra responsive/accessibility | Duyệt checkpoint; deploy Production xác nhận riêng | `COMPLETED` |
| C15 | Sửa dữ liệu khoản vay và trình bày lãi theo kỳ | Cho phép sửa an toàn dữ liệu khởi tạo bằng giao dịch đảo/thay thế và audit; nhập/hiển thị lãi suất theo chu kỳ 15/30 ngày cùng tiền lãi cả kỳ; tên khoản vay không bắt buộc và tự sinh nhãn phân biệt; nhãn lợi nhuận rõ nghĩa | Duyệt checkpoint; migration remote và deploy Production xác nhận riêng | `COMPLETED` |
| C16 | Kiểm thử dữ liệu thực tế đầu tiên | Người dùng nhập các khoản vay hiện hữu; đối chiếu từng hợp đồng, lịch lãi, dòng tiền và Dashboard với ghi chép thủ công; chỉ sửa sai lệch đã xác nhận và không xóa giao dịch tài chính | Duyệt checkpoint; mọi sửa dữ liệu Production xác nhận riêng | `AWAITING_APPROVAL` |

## 3. Contract cốt lõi

```text
LoanDirection: LENDING | BORROWING
LoanStatus: ACTIVE | OVERDUE | BAD_DEBT | SETTLED
UserRole: OWNER | EDITOR | VIEWER
TransactionType: DISBURSEMENT | INTEREST_PAYMENT | PRINCIPAL_PAYMENT | EXPENSE | REVERSAL
```

- Web mutate dữ liệu qua Server Actions/RPC đã validate bằng Zod.
- Bộ máy tính lãi authoritative nằm trong Supabase.
- Tiền VND dùng số nguyên; lãi suất dùng decimal.
- Ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`; audit timestamp dùng UTC.
- Google Sheets không ghi ngược vào Supabase.
- Notification và sync phải idempotent.

## 4. Test gate

Chạy các gate đã tồn tại và áp dụng cho checkpoint:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
supabase test db
```

Các test tài chính bắt buộc bao phủ: kỳ 15/30 ngày, kỳ cuối rút ngắn, ranh giới ngày, trả thiếu/thừa, trả gốc giữa kỳ, đổi lãi suất, tất toán sớm, quá hạn không phạt, dừng/bật lại nợ xấu, đảo giao dịch, RLS viewer, notification idempotency và phục hồi snapshot.

## 5. Revision log

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0.48 | 2026-08-03 | Sau xác nhận riêng, áp migration C15 lên Supabase Production và hậu kiểm history 8/8, bốn RPC, dữ liệu hiện hữu 1 khoản vay/1 giao dịch không đổi. Deploy Vercel Production `dpl_8LugJRs4T3YB3R9u4gUhkfqZnENr` Ready tại `sin1`; canonical/browser/smoke/cron đạt. C15 chuyển `COMPLETED`, C16 chờ duyệt. |
| 1.0.47 | 2026-08-03 | C15 local sẵn sàng: thêm correction RPC nguyên tử với reversal, audit và idempotency đầy đủ; tên tùy chọn/tự sinh; lãi theo kỳ và tiền lãi cả kỳ authoritative; đổi nhãn Dashboard và cập nhật hướng dẫn. Gate đạt lint/typecheck/28 tests/build, Auth 6/6, E2E 6/6, pgTAP 222/222; chờ xác nhận riêng để áp migration remote và deploy Production. |
| 1.0.46 | 2026-08-03 | Người dùng phê duyệt C15; chuyển `IN_PROGRESS`. Phạm vi gồm sửa an toàn dữ liệu khởi tạo có reversal/audit, nhập và trình bày lãi theo kỳ, tên khoản vay tùy chọn/tự sinh và đổi nhãn lợi nhuận; giữ cổng xác nhận riêng cho migration remote và deploy Production. |
| 1.0.45 | 2026-08-03 | Deploy C14 Production `dpl_Eq1pHfEm95k3shoKEtwy2oP5N1kB` Ready tại `sin1`; TTFB nóng `/login` giảm median 424→247 ms (~42%). Workaround `SUPABASE_PROFILE=supabase` gỡ lỗi profile local; Auth 6/6, E2E 6/6, pgTAP 201/201 và Production browser/smoke đạt. C14 chuyển `COMPLETED`. |
| 1.0.44 | 2026-08-03 | C14 local: đặt Vercel Function tại `sin1`; chạy dữ liệu module và unread count song song sau Auth; song song hóa calculation workspace khoản vay; dedupe profile trong request; thêm prefetch và phản hồi chuyển module có reduced-motion/ARIA. Lint/typecheck/28 tests/build/Vercel build đạt; E2E chờ Supabase local do CLI profile lỗi. |
| 1.0.43 | 2026-08-03 | Người dùng phê duyệt C14; chuyển sang `IN_PROGRESS`. Baseline xác nhận Vercel Function chạy `iad1` trong khi Supabase ở Singapore, các trang còn waterfall Auth → dữ liệu → unread; giữ cổng xác nhận riêng cho deploy. |
| 1.0.42 | 2026-08-03 | Xóa notification/delivery test sau xác nhận, giữ nguyên OWNER subscription; gate cuối và Production smoke đạt. C13 chuyển `COMPLETED`; roadmap không có checkpoint kế tiếp. |
| 1.0.41 | 2026-08-03 | Người dùng xác nhận đã thấy Web Push test trên thiết bị; delivery acceptance đạt. Notification test chờ xác nhận xóa riêng trước khi đóng C13. |
| 1.0.40 | 2026-08-03 | Web Push Production có một OWNER subscription; notification test C13 gửi thành công `claimed=1/sent=1/failed=0`. Sửa Keychain về legacy anon/service-role runtime keys; chờ người dùng xác nhận delivery rồi xóa test item. |
| 1.0.39 | 2026-08-03 | Xác minh alias Google `ngotuong077@gmail.com` cùng tài khoản `vipmoschino@gmail.com`; cập nhật Apps Script sync secret, xóa bypass Preview cũ và manual sync retry hoàn tất. Google Sync hourly hoạt động trở lại. |
| 1.0.38 | 2026-08-03 | Supabase CLI đăng nhập đúng `tuongnt2105@gmail.com`, xác minh linked Production ref và phục hồi publishable/secret keys vào Keychain. Apps Script UI chờ đăng nhập `vipmoschino@gmail.com` để cập nhật Script Properties. |
| 1.0.37 | 2026-08-03 | Ghi cố định ánh xạ Google/Vercel=`vipmoschino@gmail.com`, Supabase=`tuongnt2105@gmail.com`; đăng xuất Supabase sai và chờ login đúng. Bật Apps Script API executable MYSELF, push/deploy `@3`; CLI nhận diện hàm nhưng OAuth client không có quyền chạy nên Script Properties còn chờ UI chủ sở hữu. |
| 1.0.36 | 2026-08-03 | Rotate VAPID/cron/sync, phục hồi 5 mục Keychain, cập nhật Vercel và redeploy Production Ready; smoke đạt. Apps Script source đã push nhưng Script Properties chưa cập nhật do API executable không tìm thấy hàm, nên sync giờ tạm gián đoạn. Supabase OAuth hiện không có quyền Production ref; API keys chưa phục hồi. |
| 1.0.35 | 2026-08-03 | Đăng nhập lại OWNER Production đạt; notification UI/service worker đúng nhưng in-app browser không cấp Notification permission nên chưa có subscription/delivery thật. Cần Chrome/Safari và xử lý secret Keychain. |
| 1.0.34 | 2026-08-03 | Người dùng xác nhận đổi mật khẩu Production thành công; bàn giao login cho phiên kiểm thử Web Push. Phát hiện generic-password items dự án biến mất khỏi Keychain trong khi remote vẫn hoạt động; chưa rotate secret khi chưa có xác nhận riêng. |
| 1.0.33 | 2026-08-03 | Sau xác nhận riêng, cập nhật Auth remote đúng diff minimum 10→6 và composition→rỗng, hậu kiểm config up-to-date; redeploy Production Ready `dpl_C3LZT8ZipBxVe5JHT1NKWb2cxACs`, smoke đạt và bàn giao người dùng thử lại đổi mật khẩu. |
| 1.0.32 | 2026-08-03 | C13 UAT tái hiện Supabase Auth còn policy 10 ký tự/composition khiến đổi mật khẩu 6 ký tự thất bại. Chuẩn bị local config 6 ký tự không yêu cầu thành phần, log lỗi an toàn và E2E `123456`/`abcdef`; chờ xác nhận PATCH Auth remote và redeploy Production. |
| 1.0.31 | 2026-08-03 | Sau xác nhận riêng, redeploy Production chính sách mật khẩu bằng deployment Ready `dpl_5hhHjcJeod8atQYMsLXEsQB1vwdk`, smoke route/secret đạt; bootstrap và xác minh OWNER `ngotuong`, credential tạm lưu Keychain và bắt đổi lần đầu. |
| 1.0.30 | 2026-08-03 | Đổi contract mật khẩu local thành tối thiểu 6 ký tự chỉ gồm chữ hoặc số, dùng chung cho bootstrap/Server Action/UI; lint/typecheck/27 tests/build/E2E 6/6 đạt. Chờ xác nhận redeploy Production trước khi bootstrap OWNER `ngotuong`. |
| 1.0.29 | 2026-08-03 | Cấu hình đủ 8 Production env, deploy Production Ready, cron/smoke/export đạt và chuyển Google Sync sang Production canonical; wrapper tạm đã xóa. C13 còn chờ bootstrap OWNER thật và Web Push delivery thiết bị. |
| 1.0.28 | 2026-08-03 | C13 restore snapshot toàn trình, sửa cursor restore và xóa wrapper tạm; xóa đúng dữ liệu/hai tài khoản UAT, sync workbook về nguồn rỗng; full gate đạt. Production chưa deploy vì environment chưa có 8 biến, chờ xác nhận cấu hình secret riêng. |
| 1.0.27 | 2026-08-02 | Sau xác nhận riêng, redeploy Preview chứa bản cast exact-string; deployment đúng target Preview/Ready, stable alias đã cập nhật, smoke route/secret/export type đạt trên dữ liệu UAT và không có Production cron. |
| 1.0.26 | 2026-08-02 | C13 deploy Preview mới và hậu kiểm các lỗi UAT; thêm cast `text` cho tiền/lãi suất/bigint của Google Sync export, đạt lint/typecheck/25 tests/build/E2E 6/6; chờ xác nhận riêng để redeploy bản cast. |
| 1.0.25 | 2026-08-02 | C13 UAT tạo dữ liệu/EDITOR, notification và sync remote; phát hiện/sửa login OWNER nhiều profile, redirect owner-only, category expense và test harness CLI fallback; local gates gồm Auth 5/5, E2E 6/6 đạt; chờ xác nhận Preview redeploy. |
| 1.0.24 | 2026-08-02 | Người dùng phê duyệt C13; chuyển sang `IN_PROGRESS`, giữ cổng xác nhận riêng cho restore, xóa dữ liệu và Production deploy. |
| 1.0.23 | 2026-08-02 | Hoàn tất C12: Preview Ready và smoke đạt; persistent SSO bypass, Script Properties, hai trigger Apps Script và sync workbook đều xác minh; tạo OWNER tạm theo xác nhận để kiểm tra; C13 chờ phê duyệt. |
| 1.0.22 | 2026-08-02 | Bổ sung Apps Script support cho Vercel automation bypass vì Preview bật SSO; local typecheck/test/build đạt, remote push/property/trigger vẫn chờ xác nhận riêng. |
| 1.0.21 | 2026-08-02 | Hoàn tất workflow placeholder được duyệt: deployment thứ hai đúng Preview và smoke đạt; xóa placeholder/cron Production, thu hồi automation bypass, C12 còn chờ cấu hình Google Sync theo giờ. |
| 1.0.20 | 2026-08-02 | Lần deploy thứ tư vẫn bị ép Production dù target/Git metadata Preview; xóa sạch deployment, sửa `.vercelignore` neo root sau lỗi build và ghi nhận workflow placeholder `--skip-domain` do Vercel staff hướng dẫn, chờ xác nhận riêng. |
| 1.0.19 | 2026-08-02 | Sau xác nhận riêng, áp migration audit thứ bảy lên Supabase remote; xác minh history 7/7, constraint/index/RPC/privilege đúng và không seed/xóa dữ liệu tài chính. |
| 1.0.18 | 2026-08-02 | Dry-run C12 phát hiện source upload thừa; thêm `.vercelignore`, xác minh gói web không còn Clasp/Supabase local state và chọn Git metadata Preview tường minh cho lần deploy có xác nhận tiếp theo. |
| 1.0.17 | 2026-08-02 | Sau xác nhận riêng, xóa deployment Production ngoài ý muốn lần ba và xác minh project Vercel không còn deployment, alias hoặc cron; C12 tiếp tục `IN_PROGRESS`. |
| 1.0.16 | 2026-08-02 | Người dùng duyệt revision C12 để khắc phục các phát hiện audit local trước Production; không mở rộng quyền đối với deployment, secret hoặc tài nguyên remote. |
| 1.0.15 | 2026-08-02 | Ghi nhận lần deploy C12 thứ ba vẫn bị Vercel suy diễn thành Production dù dùng nhánh local `c12-preview` và `--target=preview`; deployment/alias/cron hiện còn nguyên, C12 tiếp tục `IN_PROGRESS` và việc xóa cần xác nhận riêng trong phiên sau. |
| 1.0.14 | 2026-08-01 | Người dùng phê duyệt C12; chuyển sang `IN_PROGRESS`, vẫn giữ cổng xác nhận riêng cho truy cập tài khoản, link project, secret, deploy và trigger. |
| 1.0.13 | 2026-08-01 | Hoàn tất C11 với bound Sheet/Apps Script, Drive backup, snapshot tuần remote, installer có điều kiện và toàn bộ gate lint/typecheck/test/build; C12 chờ phê duyệt. |
| 1.0.12 | 2026-08-01 | Điều chỉnh thứ tự C11–C12 đã được người dùng duyệt: C11 cài snapshot tuần; trigger sync theo giờ chỉ được tạo khi C12 đã cấu hình đủ Vercel URL/secret, tránh lỗi định kỳ. |
| 1.0.11 | 2026-08-01 | Hoàn tất C10 với project Supabase Singapore, 6/6 migration remote không seed, credentials ở Keychain, public signup tắt và RLS smoke đạt; C11 chờ phê duyệt. |
| 1.0.10 | 2026-08-01 | Hoàn tất C9 với export API bảo vệ bằng secret, Apps Script đồng bộ một chiều, 8 tab đối chiếu, snapshot tuần giữ 12 bản và 9 mock tests; C10 chờ xác nhận Supabase remote. |
| 1.0.9 | 2026-08-01 | Hoàn tất C8 với PWA, notification center, Web Push idempotent, 196 pgTAP assertions và 4 Playwright flows; C9 chờ phê duyệt. |
| 1.0.8 | 2026-08-01 | Hoàn tất C7G: GitHub private `ngotuong/quanlyvay`, GitHub CLI 2.97.0 và push `origin/main`; C8 chờ phê duyệt. |
| 1.0.7 | 2026-08-01 | Hoàn tất C7 với dashboard authoritative, 178 pgTAP assertions và 3 Playwright flows; thêm C7G chờ xác nhận GitHub remote. |
| 1.0.6 | 2026-08-01 | Hoàn tất C6 với web workflows, 163 pgTAP assertions và 2 Playwright flows; C7 chờ phê duyệt. |
| 1.0.5 | 2026-08-01 | Hoàn tất C5 với Auth/RBAC local, 146 pgTAP assertions và 5 Auth integration tests; C6 chờ phê duyệt. |
| 1.0.4 | 2026-08-01 | Hoàn tất C4 với financial engine/RPC, 10/10 fixture và 123 pgTAP assertions; C5 chờ phê duyệt. |
| 1.0.3 | 2026-08-01 | Hoàn tất C3 với migration schema/RLS, database lint và 72 pgTAP assertions; C4 chờ phê duyệt. |
| 1.0.2 | 2026-08-01 | Hoàn tất C2 với domain spec, type contract và 10 fixture; C3 chờ phê duyệt. |
| 1.0.1 | 2026-08-01 | Hoàn tất C1; C2 chờ phê duyệt; ghi nhận chiến lược tài khoản remote. |
| 1.0.0 | 2026-08-01 | Khởi tạo roadmap C0–C13; C0 hoàn tất, C1 chờ phê duyệt. |
