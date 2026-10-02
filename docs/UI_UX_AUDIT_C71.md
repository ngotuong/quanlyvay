# C71 — Audit sâu UI/UX và hiệu quả thao tác

Ngày kiểm: 01/10/2026. OWNER phê duyệt C71 trong hội thoại. Đây là audit; không sửa code sản phẩm.

## 1. Kết luận

Phát hiện mới: **1 HIGH, 4 MEDIUM, 1 LOW**. Ưu tiên bảo vệ bản nháp khi Back trong SPA, trạng thái
thao tác thông báo, vùng chạm và bố cục chi phí. Không có bằng chứng mới về sai tiền hoặc mất giao dịch.
Loading mở app và drawer tài chính sau lưu **đang hoạt động trong phép kiểm mới**; không tiếp tục
mô tả chúng là lỗi hiện hành từ C62. Giao diện hiện tại có nền tảng nhất quán, nhưng chưa tối ưu
vị trí công việc và lịch sử trên mobile. Không dùng nhận xét “không đẹp” làm bằng chứng lỗi.

Bản đề xuất review: [proposal.html](audit-c71/proposal.html). Ảnh hiện trạng và đề xuất chỉ dùng
fixture synthetic. Chưa triển khai thiết kế này. C72 chờ duyệt, rollout là checkpoint riêng.

## 2. Phương pháp, môi trường và thay đổi local

- Đọc toàn bộ AGENTS.md, PROJECT_CONTEXT.md và mục C71 của roadmap; git status khi khởi động:
  main…origin/main, hai tệp context/roadmap đã sửa và `docs/UI_UX_AUDIT_C70.md` chưa tracked.
  Bảo toàn các thay đổi C70. HEAD `aeff2ee265edbefe62f7c3af6a724ef9cc87a53a`.
- Chrome headless 154, Next production build local `http://127.0.0.1:3101`; viewport giả lập,
  không phải kiểm thiết bị vật lý. 375/390/768/1024/1440×900, cả light/dark; luồng thực nghiệm
  390×844; landscape 844×390, text 200% ở 640×700 và reduced-motion.
- Kiểm guard `scripts/test-environment.cjs`: chỉ localhost/127.0.0.1:55321, project
  `QuanLyVayCaNhan-C20-test`, reset có `--local`. Đã xác minh API localhost:55321 trước chạy.
  Global setup/teardown reset database thử nghiệm riêng, không project local chính :54321,
  không Supabase dùng chung. Fixture 12 khoản vay, đối tác, thông báo và giao dịch đều synthetic.
- Harness mới `apps/web/test/e2e/c71-audit.spec.ts` opt-in `C71_AUDIT=true`, ghi quan sát chứ
  không assert rằng mọi tính năng sản phẩm đều PASS. PASS của harness = thu thập hợp lệ; lỗi
  sản phẩm vẫn ghi FAIL ở ma trận/báo cáo. Rerun riêng friction giữ ma trận đã chụp ở lượt trước.
- Không có diff runtime/schema/migration. Diff `039be56..HEAD` ở `apps/web/src` và `apps/web/public`
  rỗng; các commit cuối sau source C68 chỉ là ghi trạng thái rollout. Các thay đổi C71 là harness,
  tài liệu và artifact. Chưa commit/push; local C70/C71 chưa đồng bộ GitHub.
- Read-only `vercel inspect https://tindung.vercel.app` xác nhận deployment
  `dpl_HZHgS3m93v2MoYNQSPVHi9vGwZ1T`, Production Ready, Functions sin1, immutable URL
  `https://quan-ly-vay-ca-nhan-6ghj4fitw-ngotuong2105.vercel.app`, đúng C69 trong context.
  Chụp mới login public Production ở 5 viewport × 2 theme, không đăng nhập hoặc tạo tài khoản.
  Authenticated Production không kiểm lại ở C71; không suy ra hành vi local là kết quả Production.
- Production khác local về dữ liệu, network và cấu hình Push: local chưa có public Push key,
  có nút test notification vì không phải VERCEL_ENV=production. Không coi khác biệt này là bug
  Production. Không có write nghiệp vụ, đổi account/secret, deploy hay push remote.

Bằng chứng: [evidence.json](audit-c71/evidence.json), [public-login.json](audit-c71/public-login.json),
[ma trận chi tiết](audit-c71/matrix.md), ảnh `.png` trong `docs/audit-c71/`.

## 3. Phát hiện có bằng chứng mới

### C71-01 — HIGH · mất bản nháp khi dùng Back trong SPA

- Vị trí: `apps/web/src/components/business/form-parts.tsx:66–78`, đặc biệt listener click ở 71–77.
- Route/viewport: `/loans` → link `/loans/new`, 390×844. Nhập “Nhãn phân biệt”, dùng browser Back.
- Expected: hỏi trước khi bỏ bản nháp; chọn ở lại giữ URL, nội dung, scroll và tiến trình.
- Actual: `confirms=0`, trở về `/loans`, input draft không còn. Đã tái hiện bằng navigation SPA,
  không phải full-page GET. Evidence `observations.dirtyBrowserBack`.
- Nguyên nhân: guard hiện chỉ bắt click anchor và beforeunload; history traversal trong SPA không
  đi qua click/beforeunload, không có xử lý tương ứng cho draft. Full-page rời trang vẫn được
  beforeunload bảo vệ: lượt thử đầu xác nhận điều này, không phải mất draft trong trường hợp đó.
- Tác động: mất công nhập thông tin khoản vay; cùng BusinessForm còn dùng ở nhiều form. Phạm vi
  tái hiện hiện chỉ loan creation, chưa khẳng định mọi form đều lỗi trong mọi navigation.
- Sửa: thống nhất guard link/history/close, giữ draft ở lại và chỉ bỏ khi xác nhận. Không vô hiệu
  hóa history, không tạo vòng lặp Back hoặc lưu dữ liệu tài chính vào localStorage.

### C71-02 — MEDIUM · đánh dấu thông báo thiếu lifecycle pending/error

- Vị trí: `apps/web/src/app/notifications/page.tsx:22`, :30;
  `apps/web/src/app/actions/notifications.ts:51–59`, :70.
- Route/viewport: `/notifications?unread=true`, 390×844; delay POST Server Action 1200 ms.
- Expected: có nhãn đang xử lý, chặn gửi lặp, báo kết quả rõ; khi RPC lỗi giữ trạng thái và có retry.
- Actual ở 200 ms: nhãn vẫn “Đánh dấu đã đọc”, `disabled=false`. Thành công sau đó cập nhật danh
  sách; đây không phải lỗi write đã thất bại. Evidence `observations.notificationPending`.
- Nguyên nhân: form dùng button thường, không pending UI/useFormStatus; action bỏ qua error RPC
  và chỉ revalidate. Phần không xử lý RPC error có bằng chứng source, **chưa inject lỗi RPC thực**.
  Không kết luận đã quan sát một lần false success hoặc thông báo bị mất.
- Tác động: người dùng không biết nút đã nhận thao tác; có thể bấm thêm, khó phân biệt chờ/lỗi.
  Mark-read vốn idempotent; không diễn giải thành nguy cơ ghi trùng tiền.
- Sửa: action state có pending/success/error, bắt error, disable trong chờ, retry an toàn. Kiểm
  cả “đánh dấu tất cả” và mở một notification; không đổi RPC/nghiệp vụ nhắc hạn.

### C71-03 — MEDIUM · vùng chạm vẫn chưa đạt contract 44 px

- Vị trí: `apps/web/src/components/business/counterparty-editor.tsx:13`,
  `apps/web/src/app/globals.css:596–599`, :543–544, :973;
  `apps/web/src/styles/ui-primitives.css:80`.
- Route/viewport: ma trận 5 viewport × 2 theme. 390 px: disclosure “Chỉnh sửa thông tin” 25,6 px;
  notification/filter pills 38,4 px; quick “Ghi giao dịch” 42 px; Dashboard “Tùy chỉnh” 43,2 px.
- Repro: mở màn hình tương ứng, đo bounding box control đang hiển thị. Ma trận loại nội dung trong
  details đóng và sr-only; không gán lỗi cho phần chưa hiển thị.
- Expected: vùng tương tác ≥44×44 theo DESIGN_SYSTEM, kể cả disclosure và quick action.
- Actual: một số variant có min-height riêng thấp hoặc chỉ line-height/padding; các nút drawer
  chính và privacy toggle đạt trong mẫu kiểm. `matrix[].targetsUnder44` và ảnh counterparties/loans.
- Tác động: thao tác mobile kém ổn định, khó chạm disclosure nhỏ. Đây là **vi phạm contract dự án**,
  không mặc nhiên là FAIL WCAG 2.5.8 vì chưa đánh giá ngoại lệ spacing/24 px của tiêu chí đó.
- Sửa: chuẩn hóa hit area ở selector/component còn thiếu; kiểm cả width/height sau text zoom,
  không chỉ tăng icon hoặc làm card phình toàn bộ. Bổ sung regression trên control thực sự visible.

### C71-04 — MEDIUM · chi phí vẫn form-first, lịch sử bị đẩy xuống

- Vị trí: `apps/web/src/app/expenses/page.tsx:66–76`; `apps/web/src/app/globals.css:583`, :855;
  `apps/web/src/components/business/general-expense-form.tsx:13`.
- Route/viewport: `/expenses`, 375/390/768 px; 390×900 lúc chưa có chi phí, sau hai lần lưu ở 390×844.
- Expected: người vào xem lịch sử thấy danh sách/empty state sớm; form mở theo nhu cầu, tương tự
  counterparties đã list-first. Đề xuất C72: lịch sử bắt đầu trước y=500 ở 390×844 với 2 fixture.
- Actual: form bắt đầu y=94, danh sách/empty state y=672 khi rỗng; sau có tổng quan danh mục và
  success message danh sách càng xuống sâu. Ảnh `expenses-390-light.png`, `expenses-populated-390.png`.
  Lưu thành công reset input, có message/toast và đúng 2 transaction local; trang này **không dùng
  drawer**, vì vậy không gọi actual là “drawer không tự đóng”.
- Nguyên nhân: form đứng trước list trong DOM; dưới breakpoint layout chỉ một cột.
- Tác động: phải cuộn qua form không cần dùng mỗi lần đối chiếu; visual hierarchy ưu tiên ghi mới
  hơn lịch sử. Đây là ma sát bố cục, không lỗi số liệu hay lưu dữ liệu.
- Sửa: list-first + CTA mở sheet; giữ privacy, permission, validation, idempotency, đảo giao dịch
  và tổng hợp danh mục. Sau success đóng/reset/focus, sau lỗi giữ draft như drawer tài chính.

### C71-05 — MEDIUM · bộ lọc thông báo không cho biết mục đang chọn

- Vị trí: `apps/web/src/app/notifications/page.tsx:24`; style active có sẵn ở `globals.css:545`.
- Route/viewport: `/notifications?unread=true`, 390×844; markup giống nhau ở mọi viewport/theme.
- Expected: “Chưa đọc” được đánh dấu active bằng hình thức và aria-current, “Tất cả” không active.
- Actual: cả hai link `data-active=null`, `aria-current=null`, nền đều rgb(255,255,255). Screenshot
  `notifications-unread-390.png`; JSON `observations.notificationFilter`. Nội dung được lọc đúng.
- Nguyên nhân: trang không truyền params.unread vào thuộc tính active dù CSS đã hỗ trợ.
- Tác động: khó hiểu danh sách hiện đang là tất cả/chưa đọc; hướng dẫn định vị cho AT cũng thiếu,
  nhưng không tuyên bố có lỗi lời đọc VoiceOver vì chưa kiểm câu đọc.
- Sửa: active state theo URL, visual khác rõ và aria-current chính xác; back/forward giữ nhất quán.

### C71-06 — LOW · dashboard chưa ưu tiên tác vụ cụ thể trong màn hình đầu mobile

- Vị trí: `apps/web/src/app/dashboard/page.tsx:235–243`; `globals.css:992–1007`.
- Route/viewport: `/dashboard`, 390×900, 13 công việc synthetic. Checklist hierarchy/spacing.
- Expected theo định hướng trang “Ưu tiên việc đến hạn trước khi xem báo cáo”: một công việc cụ thể
  truy cập sớm, không chỉ tổng số. Mốc đề xuất C72: CTA công việc đầu nằm trước y=650 ở 390×844.
- Actual: period bar y=94/175 px cao, banner y=281/195 px, KPI y=492/349 px, task list bắt đầu
  y=858. Banner “Xem danh sách” đã có trước fold, nên đây **không phải không thể tìm tác vụ**.
  Desktop có task list cạnh biểu đồ, sử dụng không gian tốt hơn. Ảnh dashboard light/dark.
- Nguyên nhân: KPI đứng trước task list ở DOM và mobile xếp hai hàng; filter/banner cùng chiếm cao.
- Tác động: thêm cuộn hoặc đi qua list để mở khoản cụ thể. Severity LOW vì có CTA tổng hợp sớm;
  chưa có nghiên cứu người dùng chứng minh bỏ tác vụ hoặc nhầm số tiền.
- Sửa: gom báo cáo, đưa task cụ thể lên trước KPI trên mobile, giữ bộ lọc và so sánh; không sửa phép
  tính dashboard. Mockup đề xuất thể hiện hướng này, không coi mockup là kết quả phép kiểm.

## 4. Loading, drawer và số thao tác — phép kiểm mới

| Hành trình / trạng thái | Kết quả quan sát | Kết luận |
|---|---|---|
| Cold auth 2 s/10 s có x-e2e-auth-delay-ms local | fallback “Đang mở không gian tài chính…” hiển thị; chưa lộ dữ liệu private | PASS C63 test hiện chạy lại |
| Login thành công / hết auth cookie / resume 2 tab | redirect và boundary đạt; không lộ khoản vay sau hết phiên | PASS C63 test; resume không phải iOS PWA thật |
| Payment lỗi trước dispatch POST | sheet giữ mở, amount 1.234, hướng dẫn thử lại | PASS C71 mới |
| Retry payment | 331 ms từ submit tới hidden, focus về trigger | PASS; một mẫu local |
| Success payment/settlement/restructure ở 375/390/1440 | đóng/reset, toast đúng lần, focus trigger/main; duplicate submit chỉ 1 row | PASS C63 suite mới |
| Dirty drawer: nút/Escape/backdrop/drag | hỏi đúng lần, ở lại giữ note, chấp nhận bỏ reset | PASS C63 mới |
| Giảm gốc 0/invalid, thay amount/date liên tiếp, preview | validation, loại preview cũ, submit đúng dữ liệu | PASS C63 mới; không phải race mọi server response order |
| Navigation bị hủy hoặc giữ RSC 10 s | không progress khi cancel; sau 8,4 s vẫn pending + slow status | PASS C63 mới |
| Đổi tab overview→history, delay RSC 1800 ms | 150 ms: top progress=true, content-loading=0; commit 2006 ms | PASS feedback tồn tại; chữ nhìn thấy tại panel có thể cải thiện |
| Mất mạng | banner cảnh báo xuất hiện, online khôi phục; không ghi khi offline | PASS banner; không kiểm offline storage/sync |
| Back từ detail sau search C71 | query C71 được giữ; scroll trước click 600, sau Back 402 | PASS query; exact scroll NOT_TESTED do Playwright auto-scroll control khi click |
| Back từ form loan creation trong SPA | không confirm, draft mất | FAIL C71-01 |
| Disclosure counterparties save/search/draft | lưu đóng editor, URL search giữ; cancel draft sheet đúng | PASS C64 suite mới |
| Notification mark-read chờ POST 1200 ms | button không disabled, nhãn không đổi | FAIL C71-02 |

Đếm thao tác ở mức **chọn control / chỉnh một field / submit**; không đếm từng ký tự hay từng
phím trên thiết bị. Đây là hành trình tối thiểu thực thi bởi harness, không là thời gian nhập của người.

| Điểm xuất phát | Số thao tác và thời gian đo | Hướng giảm ma sát |
|---|---|---|
| Login đã hiện form | 2 field + submit = 3; chưa đo thời gian người nhập | Giữ autofill/password visibility; không thêm splash chặn thao tác |
| Loans list → quick payment mặc định | link quick + amount + submit = 3; toàn luồng 703 ms | Đã nhanh; không thêm bước đóng sheet thủ công |
| Detail overview → payment | trigger + amount + submit = 3; retry giữ input nên chỉ cần 1 submit | Giữ chuẩn lifecycle hiện có |
| Form chi phí mở, date mặc định | amount + category + submit = 3; save 124/106 ms, đúng 2 rows 1000/2000 | CTA mở sheet thêm 1 bước khi ghi, bù giảm cuộn khi xem lịch sử |
| Overview → history | 1 click; 2006 ms có delay RSC 1800 ms | Pending tại panel nếu cần; không phải thiếu mọi loading |
| Dashboard → chi phí trên mobile | Thêm + Chi phí = 2 chọn navigation; đang phải cuộn qua form khi xem | Giữ menu 5 điểm chạm, sửa thứ tự nội dung thay vì thêm tab tùy tiện |

110 mẫu navigation bằng GET local: min 344 ms, median 370,5 ms, max 450 ms; gồm goto/wait marker,
không screenshot. Không throttling ngoài case delay nêu rõ; laptop/localhost, không CPU mobile.
Các số này không là Web Vitals, SLA hoặc chỉ số Production. Không kết luận app “mượt trên mobile thật”.

## 5. Ma trận và checklist thị giác

[Ma trận chi tiết](audit-c71/matrix.md) có 110 tổ hợp màn hình×width×theme, 20 login public/local,
và bảng trạng thái trên. PASS hình học không có nghĩa toàn bộ UX/accessibility PASS.

| Checklist | Kết quả có bằng chứng | Giới hạn / cải thiện |
|---|---|---|
| Hierarchy | Detail hero/tab/operations phân nhóm rõ; counterparties list-first; desktop dashboard hai vùng | FAIL layout mobile chi phí C71-04; task priority LOW C71-06 |
| Spacing | Không tràn ngang ở 110 mẫu; loan filters 176 px ở390 | Chỉ số spacing không phải đánh giá đẹp tự động; mobile dashboard nhiều lớp trước task |
| Typography | Inter, số tabular, tiền wrap; login labels dễ đọc; các kỳ/timeline có heading | Chưa kiểm Dynamic Type/font hệ thống thật |
| Contrast | Review trực quan ảnh light/dark: text/action/state đọc được trong mẫu | NOT_TESTED toàn bộ tỷ lệ contrast WCAG; không tự gán PASS từ screenshot |
| Consistency | Button/drawer/toast/privacy nhất quán trong luồng kiểm | FAIL hit area/disclosure C71-03; active notification C71-05 |
| Target | Drawer primary, privacy, More keyboard đạt trong mẫu | Các target nhỏ có số đo C71-03; không đổi icon system |
| Scroll/reflow | Page overflow=false, text200=false; landscape không overflow; dialog có vùng cuộn | Exact scroll restoration chưa đủ kiểm; landscape chưa kiểm tới mọi control ở keyboard mềm |
| Focus | More sheet giữ Tab trong dialog; financial success quay trigger/main | Screen-reader câu đọc NOT_TESTED; dirty Back cần sửa |
| Motion | Reduced-motion animation dialog 0,00001 s; không animation buộc hiểu số liệu | Chưa đo FPS/jank compositor trên máy yếu |

Ảnh full-page có fixed nav/modal ở vị trí viewport của lúc chụp, không coi phần fixed phủ lên
vùng trang dài trong PNG là bằng chứng control bị che vĩnh viễn. Đã review ảnh login Production,
dashboard mobile/desktop, detail settings, expense mobile, notification dark và mockup; không có
pixel snapshot threshold để suy ra độ đẹp. Đề xuất giữ palette/type/icon hiện có, giảm lớp và
đưa nội dung đúng nhu cầu lên trước, tránh redesign vô căn cứ.

Screen reader VoiceOver/TalkBack, thiết bị iOS/Android thật, keyboard mềm/safe area/Dynamic Type,
Push permission/delivery vật lý, production authenticated lifecycle, pixel contrast toàn bộ:
**NOT_TESTED**. C70 đã ghi hạn chế; không yêu cầu OWNER học VoiceOver. C71 không bật/tắt hệ thống.

## 6. So sánh C62–C69

| Vấn đề lịch sử | Bằng chứng hiện tại | Trạng thái ở C71 |
|---|---|---|
| C62 UX01/UX04/UX09 drawer/draft/toast | C63 suite hiện chạy lại + C71 retry | FIXED trong luồng kiểm; Back SPA là nhánh thiếu riêng |
| C62 UX02/UX03 startup/navigation | cold delay2/10s, cancel10s, tab1800ms mới | FIXED trong phạm vi kiểm; không chứng minh mọi mạng/thời điểm |
| C62 UX05 zero restructure | C63 invalid/zero/preview mới | FIXED |
| C62 UX06/UX07 list filters/counterparties | C64 hiện chạy lại + geometry matrix | Phần chính FIXED; hit area disclosure còn thiếu |
| C62 UX08 targets | số đo mới25,6/38,4/42/43,2 | PARTIAL, C71-03 còn tồn tại |
| C62 UX10 retry luôn xuất hiện | C64 settlement preview mới | FIXED trong case kiểm |
| C62 UX11 dashboard hierarchy | Có banner/task grid, nhưng task ở858mobile | IMPROVED; LOW C71-06 còn ma sát |
| C62 UX12 render recovery reload | Có GET recovery sau3s ở use-business-action/render-recovery | Không bỏ fallback; C71 chưa đo mọi reload/stale RSC — NOT_TESTED |
| C67/C68 privacy/reflow/modal | C67 suite hiện chạy lại đạt, source không diff | PASS trong mẫu hiện kiểm; không suy ra screen-reader PASS |

Không đủ lịch sử thực nghiệm để gọi C71-01/02/05 là regression do commit C69; ghi lỗi hiện tại,
không gán nguyên nhân cho một commit chỉ từ việc trước đây chưa có test.

## 7. Gates, an toàn và checkpoint tiếp theo

- Lượt đầu `C71_AUDIT=true pnpm test:e2e c71-audit.spec.ts c63-remediation.spec.ts c64-visual-remediation.spec.ts c67-accessibility.spec.ts`:
  16 regression PASS + matrix C71 PASS, friction timeout do harness dùng goBack chờ load trong khi
  beforeunload được dismiss. Sửa **harness**, không sửa sản phẩm; sau đó chuyển sang SPA và đo
  history.back không chờ load. Không xem timeout harness là defect sản phẩm.
- `C71_AUDIT=true pnpm test:e2e c71-audit.spec.ts`: **2 PASS**, 2,0 phút, 110 matrix + friction.
- Bổ sung read-after-write/counts/retry/quick journey vào harness rồi chạy
  `C71_AUDIT=true pnpm test:e2e c71-audit.spec.ts --grep friction`: **1 PASS**, 1,3 phút.
  Ma trận trước được giữ có chủ đích, không nói lượt targeted chụp lại matrix.
- `pnpm lint`: PASS; `pnpm typecheck`: PASS sau phiên bản harness cuối. Build production nằm
  trong gate E2E. Không chạy full unit/DB/CI vì không thay runtime/schema; không tuyên bố CI mới.
- Local log có một `The destination stream closed early` trong case expire cookies/chuyển trang
  C63; browser matrix pageerror=0. Chưa chứng minh là lỗi sản phẩm, không nói mọi server log sạch.
- Global teardown đã reset fixture riêng. Không tạo tài khoản remote C71 nên không có cleanup
  remote cần làm; các account C70 đã inactive/banned theo hồ sơ C70. Secrets/cookies/service keys
  chỉ dùng nội bộ tiến trình, không ghi artifact; ảnh/JSON chỉ chứa fixture/public login. Cache,
  test-results, env bị ignore. Kiểm secret/dump trên file mới và git diff --check trước đóng.
- Đề xuất **C72 — Remediation bản nháp, thông báo và bố cục mobile**, phạm vi/AC tại roadmap mục30.
  C72 chỉ local + kiểm thử; không deploy/push/migration/remote write. Rollout cần checkpoint riêng.
  C71 hoàn tất audit không có nghĩa các lỗi đã sửa hoặc Production đã nhận cải thiện.
