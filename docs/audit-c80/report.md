# C80 — Audit UX Production C79 và hai phương án compact

Ngày audit: 03/10/2026, Asia/Ho_Chi_Minh. Trạng thái: **COMPLETED** local. C81 **AWAITING_APPROVAL**, chưa sửa runtime.
OWNER đã duyệt C80; bổ sung rõ yêu cầu dùng skill **Evon / ui-ux** trong hội thoại.

Kết quả chính: hai lỗi UX mức MEDIUM và hai điểm mức LOW được tái hiện. G2 về mật độ danh
sách desktop vẫn còn; thêm một đề xuất Gu về dashboard. Chưa thấy lỗi HIGH/CRITICAL trong
phần được kiểm. Đây là audit trải nghiệm theo C80, không phải chứng nhận toàn bộ nghiệp vụ,
WCAG hoặc Production không có lỗi.

## 1. Nguồn và ranh giới

- Git sạch khi bắt đầu: `main = origin/main`, `5ad7b7735b0fa41561ac79630b343db17ed3720f`.
  Required CI chốt C79 `37109057462` của SHA này SUCCESS cả 5 job theo bằng chứng C79.
- Production: <https://tindung.vercel.app>, C79 deployment `dpl_8x3Fy2rW6detxLGbsmrGSEqjhkyG`,
  source `8c8a8843ed4ecf12063f398fb6f1736feeb0d606`. Đọc bằng phiên OWNER đã đăng nhập trong IAB;
  không đăng nhập lại, lấy credential, submit tài chính, mark-read hoặc sửa cấu hình.
- Local: cùng source runtime, production build của harness hiện hữu; DB Supabase test riêng
  API55321/DB55322. Tất cả tên, tiền và ảnh được lưu ở thư mục này là **synthetic**, không lấy
  từ Production. Chỉ ghi fixture trong DB disposable, teardown về 0 profiles/loans/transactions.
- File mới: audit harness opt-in, báo cáo/bằng chứng/HTML/CSS/JS/ảnh/font mockup. Hai file trạng
  thái cập nhật cùng thay đổi. Không sửa `apps/web/src`, migration, RPC hoặc deploy/push.
- Bốn ảnh C75 bị harness tạo lại đã được trả về đúng HEAD; Git sạch ban đầu nên không ghi đè
  thay đổi có trước của OWNER. Không hoàn nguyên tệp khác.

Audit stack: Next.js 16.3.8, React 19.2.4, Tailwind 4.3.3, Inter tự host, Lucide, bộ UI nội bộ.
Token tại `apps/web/src/app/globals.css`; nút/card/sheet/tab tại `src/components/ui`.
Brand xanh và nền card hiện hữu; mobile header có blur. App có dark qua `prefers-color-scheme`.
Không thêm thư viện, đổi brand/font hay áp toàn bộ hệ token Evon lên sản phẩm.

Skill: `/Users/ngotuong/.codex/skills/evondev-ui-ux/SKILL.md`, nhánh V “soi UI đang có”. Dùng
phân loại **Hỏng / Lệch hệ / Gu**, phép thử N1–N12, đọc component, đo bằng `scripts/probe.mjs`
và soi render. C80 đã cho phép dựng hai mockup local; không áp các cổng brief của thiết kế
mới để xin phê duyệt lại. Mục “sửa thì hỏi” vẫn được tôn trọng: runtime chưa đổi.

## 2. Phương pháp, ma trận và hành trình

Bằng chứng máy đọc: [Production](production-evidence.json), [local](local-evidence.json),
[mockup](mockup-evidence.json), [probe](probe-evidence.json). Bảng dưới tách nguồn, không gộp
thử local thành PASS Production hay headless Chromium thành Safari/thiết bị vật lý.

| Nhóm | 375 light/dark | 390 light/dark | 1440 light/dark | Phương pháp/kết quả |
| --- | --- | --- | --- | --- |
| Production 11 route/state | 11 đo / NOT_TESTED dark | 11 đo / NOT_TESTED dark | 11 đo / NOT_TESTED dark | IAB native, privacy đã bật; 33 mẫu, không tràn trang; các finding ở mục 3 |
| Local 12 route/state + custom-private | 13 + 13 | 13 + 13 | 13 + 13 | Headless Chrome, synthetic; 78 mẫu, 0 overflow trang, 0 pageerror; capture hoàn tất |
| Mockup dashboard và loans, A/B | Đã kiểm cả hai | Đã kiểm cả hai | Đã kiểm cả hai | 56 mẫu gồm cả 768/1024/1280/1920; privacy/keyboard/font/geometry đạt |
| Width sweep mockup | 375–1440, bước 20 px | Nằm trong sweep | Nằm trong sweep | 55 mẫu mỗi route light; 4 route, không phát hiện tràn/cắt theo sweep |

11 mẫu Production gồm dashboard mặc định/custom, loans, counterparties, expenses,
notifications, settings, detail overview/interest/history/settings. Bộ lọc notifications
chưa đọc được kiểm thêm tại390: empty “Bạn đã đọc hết thông báo”, lối về Tất cả, nút mark-all
đã disabled; không bấm item hoặc mark-read. Local thêm unread route và privacy ở custom range.

| Hành trình/trạng thái | Bằng chứng thực tế | Kết quả và giới hạn |
| --- | --- | --- |
| Mở app, tải Auth, resume/expired session | C63 suite trong lượt C80: cold Auth2s/10s, cookies, tab navigation | PASS local; không logout hoặc làm hết hạn phiên thật |
| Chuyển route/tab, loading và hủy điều hướng | Native SPA thấy fallback “Đang mở nội dung…”; C63/C75 navigation, C72 draft | Fallback có hoạt động; local PASS. Không còn cơ sở nói app “không có loading” |
| Dashboard, chọn custom, task expand/focus | Native default/custom; local range dialog mở/Escape; C75 exact-source/task identity/back | PASS hồi quy; không áp preference remote. Khoảng đang xem được ghi rõ trong nguồn |
| Loan list/detail4tab | Native11-route matrix + local6-theme/width matrix | Không tràn; duplicate heading mobile tái hiện; G2 vẫn còn |
| Payment/settlement/restructure error/pending/success/save-close | C63 controlled validation/RPC failure/repeated success | PASS local, drawer đóng/announce/focus. Không ghi tài chính Production |
| Counterparty/expense drawer | Native mở khi privacy hidden, Escape và focus; C72 dirty/pending/errors/duplicate submit/reset | F2 native; lifecycle còn lại PASS local. Không nhập hoặc lưu form thật |
| Notifications transport/timeout/pending/retry/empty | Native unread empty; C72 real local timeout/transport error; C75 hierarchy | PASS local; native không mutate unread/preference/permission |
| Settings | Readonly native/local; labels/targets đo DOM | 47 input13×13 là số đếm input, không phải47 lỗi vùng bấm (xem mục4) |
| Privacy axis/accessible money/focus | C78 controlled matrix + 32-cycle/menu/reopen; C80 private custom | PASS hồi quy; F4 chỉ là presentation noise, không mở lại lỗi lộ trục C78 |

Mỗi finding dựa trên phép đo, thao tác thật hoặc đọc code có nêu rõ. `fontLoaded` ở local
matrix là heuristic `document.fonts.check`, không dùng để chứng nhận font thực; mockup xác
minh cả face đã tải và Inter từ asset nội bộ. Không suy đoán VoiceOver từ DOM/AX snapshot.

## 3. Phát hiện ưu tiên

### F1 — MEDIUM · Hỏng: lịch nhắc bị gọi thành giao dịch và sai mô tả khoảng ngày

- **Trigger:** dashboard có lịch nhắc sắp tới, default hoặc custom range;375/390/1440.
- **Bằng chứng:** Production hiện banner “Lịch nhắc tháng này”, “Có … giao dịch trong tháng này”.
  `apps/web/src/app/dashboard/page.tsx:45–58,90–95` đếm `upcoming`, không đếm transactions.
  Migration `supabase/migrations/20260810183000_c16_actionable_attention.sql:19–20` lọc
  `reminder_date between p_period_end and p_period_end + 30`. Đọc `pg_get_functiondef` trên DB
  test sau toàn bộ migration C54 xác nhận điều kiện này vẫn là code hiện hành, không chỉ lịch sử.
- **Nguyên nhân:** copy được viết theo “tháng này” nhưng dataset là lịch nhắc từ ngày cuối
  báo cáo đến D+30 (hai đầu inclusive). “Giao dịch” ngụ ý đã ghi nhận trong khi đây là việc sắp tới.
- **Tác động:** người dùng có thể hiểu nhầm lịch nhắc là tiền đã thu/trả hoặc nhầm phạm vi khi
  xem custom range. Không có bằng chứng số dư/ledger tính sai; không nâng thành lỗi quyết toán.
- **Hướng sửa:** tên “lịch nhắc sắp tới”; hiển thị hai mốc D–D+30 theo nguồn hiện hữu, phân biệt
  reminderDate và periodEndDate. Các trạng thái clean/overdue/upcoming phải dùng copy đúng
  phạm vi; giữ cảnh báo overdue thật. Không đổi query, RPC, cửa sổ nghiệp vụ hoặc tiền.

### F2 — MEDIUM · Hỏng: mở drawer bị khóa rồi hướng tới nút ở ngoài modal

- **Trigger:** privacy hidden → Thêm chi phí hoặc Thêm đối tác; tái hiện Production390.
- **Bằng chứng:** drawer chỉ có tiêu đề, đóng và câu “Hãy bấm ‘Hiển thị số tiền’ để xem và ghi
  nghiệp vụ”; nút đó ở header ngoài modal, bị native dialog làm inert. Escape đóng và focus
  về trigger đạt ở cả hai. `expense-create-sheet.tsx:26–31`,
  `counterparty-create-sheet.tsx:26–31` đều gọi `showModal` trước `PrivacyForm`;
  `apps/web/src/components/app/privacy-provider.tsx:43–45` thay toàn bộ form bằng notice.
- **Nguyên nhân:** trigger không kiểm trạng thái privacy, còn guard chỉ nằm bên trong sheet.
- **Tác động:** người dùng phải mở → đóng → tìm nút hiển thị → mở lại; lời hướng dẫn trong
  sheet không làm được ngay. Đây là dead-end tương tác tạm thời, vẫn có đường đóng.
- **Hướng sửa:** chặn mở form khi hidden và hiện giải thích/lối đến nút hiện trước modal;
  hoặc bố trí bước xin hiển thị rõ bên trong sheet. Không tự tắt privacy khi bấm tạo mới.
  Dùng một pattern chung cho hai trigger, giữ focus/dirty/pending/save-close hiện hữu.

### F3 — LOW · Lệch hệ: hai heading cấp1 ở detail mobile

- **Trigger:** detail overview/interest/history/settings ở375/390; shown hoặc hidden.
- **Bằng chứng:**33 native samples có8detail mobile visibleH1=2; local16detail mobile cũng=2.
  `apps/web/src/components/app/mobile-module-title.tsx:24` đặt h1 cho tên module;
  `apps/web/src/app/loans/[id]/page.tsx:123–124` thêm h1 tên khoản. Desktop chỉ có1 visible.
- **Nguyên nhân:** mobile heading dùng chung không phân biệt route detail; CSS chỉ ẩn page
  heading của các trang danh sách, không giải quyết heading tên khoản.
- **Tác động:** outline và thứ bậc không nhất quán; tên module lặp với tiêu đề record.
  Nhiều h1 **không tự động** là vi phạm WCAG; chưa có thử screen reader để kết luận cách đọc.
- **Hướng sửa:** giữ tên khoản là h1, tên module mobile thành nhãn/breadcrumb với cấp phù hợp;
  không giấu tên khoản hoặc làm mất tên khi privacy. Kiểm DOM/keyboard cả4tab, hai theme.

### F4 — LOW · Gu:26 notice giống nhau trong biểu đồ đang ẩn

- **Trigger:** custom range13tháng, privacy hidden;375/390/1440.
- **Bằng chứng:** native nhìn thấy placeholder lặp ở mỗi cột; local cả6mẫu có26
  `.bar-pair .privacy-placeholder`,0cash-bar-control/tooltip, trục tiền đều “—”. Chart scrollWidth
  1300 trong vùng239/254/572px. Nguồn `business/cash-flow-bars.tsx:34–61` dùng PrivacyRegion
  cho từng series, `app/privacy-provider.tsx:38–40` sinh cùng câu cho từng cột.
- **Nguyên nhân:** guard ở cấp mỗi cột nên một trạng thái hidden toàn biểu đồ thành26 notice.
- **Tác động:** nhiễu thị giác, chữ bị bóp nhiều dòng, vẫn cần cuộn dù không còn dữ liệu xem.
  Không lộ số tiền/tooltip hoặc hồi quy F1 C78; quyền truy cập dữ liệu vẫn đúng.
- **Hướng sửa:** một notice ở cấp chart, không render track/button/tooltip nhạy cảm khi hidden;
  phục hồi đủ chart/table accessible khi shown. Không sửa component PrivacyRegion toàn cục.

## 4. Nhận xét thiết kế và các kết luận đã loại

| ID | Hạng / mức | Chỗ và bằng chứng | Nguyên nhân/tác động | Hướng đề xuất |
| --- | --- | --- | --- | --- |
| G1 | Gu / LOW | Dashboard: banner141px desktop,195px mobile; KPI y382/437; task y527/808–810. `dashboard/page.tsx:231–243`, `globals.css:1174–1259` | Heading, controls và banner lặp lịch chiếm khoảng đầu trang; nhiều cuộn trước task. Là nhận xét mật độ, không phải lỗi thứ tự KPI | Header/controls gọn; KPI vẫn trước task; gộp lịch nhắc thường vào task. Giữ banner khi overdue cần chú ý. A khuyên dùng |
| G2 | Gu / LOW, tiếp nối G2 C74 | Loans: card đầu281px desktop,336px mobile, y466/501/472. `loans/page.tsx:85–123`, `.loan-card` | Chia nhiều tầng cho mỗi khoản; desktop đọc/so nhiều khoản cần cuộn dài. Card mobile hiện tại vẫn hữu ích | A: hàng desktop, đủ tên/hướng/trạng thái/ngày/rate/gốc ban đầu/gốc còn/lãi phải/lãi đã ghi và lối hành động; mobile giữ card. B: card nhiều cột gọn hơn. Chỉ đổi trình bày |

Không coi brand xanh, bo góc hoặc bóng card hiện hữu là lỗi. Mockup tham khảo Evon theo
hướng phẳng, gom khối/hàng, chữ có thứ bậc; đây là đề xuất Gu đang chờ OWNER chọn.
Không chọn lại G1/G2 cũ từ revision log để tự triển khai.

- Không báo “47 target fail”: input13px có label bấm được260×26px. Label đạt minimum24px;
  touch comfort44px có thể cải thiện sau nhưng khác với tự động fail SC2.5.8. Không thay account
  permissions để thử. [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Không báo thiếu loading hoặc drawer không tự đóng: các case cold Auth/navigation/success
  của C63/C72 đã PASS trong lượt này. Việc mới F2 xảy ra trước form, khác lỗi save-close cũ.
- Không báo C78 privacy/focus hồi quy: axis hidden và focus stress suite hiện hành vẫn PASS.
- Probe mockup ban đầu phát hiện muted text4.45:1 ở light; đã tăng contrast trong token mockup,
  không sửa token runtime. Không làm tròn4.45 thành4.5. [W3C contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Heading phải mô tả nội dung/đúng outline; không dùng tiêu chí “một h1” để tuyên bố WCAG đạt.
  [W3C headings and labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html).

## 5. Hai phương án render thực tế

[Xem so sánh](proposal.html) hoặc <http://127.0.0.1:3180/proposal.html>.
Mọi tên/tiền/chart là giả. Bốn trang là hai phương án cho cùng dashboard + danh sách khoản vay:

| Phương án | Dashboard | Khoản vay | Đánh đổi |
| --- | --- | --- | --- |
| **A — khuyên dùng** | KPI trên; task rộng hơn bên cạnh dòng tiền, mobile chart sau task | Hàng compact desktop, card dọc mobile | Cân bằng báo cáo và việc; dễ đối chiếu khoản vay; ít thay đổi cách đọc tổng quan |
| B | KPI trên; task toàn bề ngang, chart dưới | Card nhiều cột desktop, card dọc mobile | Tên task rộng nhất, giữ kiểu card; cuộn thêm tới chart, so nhiều khoản vẫn kém hàng |

[Dashboard A](compact-a.html) · [Loans A](loans-a.html) · [Dashboard B](compact-b.html) ·
[Loans B](loans-b.html). Link dark trên mỗi trang. Giữ Inter/logo/xanh hiện hữu, token tập trung
ở đầu `mockup.css`, Inter ở `fonts.css` với asset Latin/Vietnamese nội bộ. Grey muted được chọn
đủ tương phản, không biến nhận xét Gu thành yêu cầu đổi brand sản phẩm.

Dáng tham khảo Evon: card và list-row, nút tối thiểu44px, title24/section18/body14/small12,
focus3px rõ, reduced-motion, lưới KPI2×2 mobile và4 desktop, title/tên dài xuống dòng.
Không có dropdown/form nghiệp vụ trong mockup; các control tìm/lọc/tạo/preset/điều hướng mẫu
không gọi API. Chỉ privacy là tương tác trình bày local, không cookie/storage/preference.
Lối vào phân tích vẫn có; khi triển khai phải giữ analysis content thật, không thay bằng demo.

KPI/task DOM và render luôn cùng thứ tự. Ở1440 mockup task y385 thay vì527 của mẫu hiện tại;
mobile mockup task y558/560 thay vì808–810. Đây là so geometry của hai fixture khác nhau và khung
review khác nhau, **không** chứng minh tiết kiệm thao tác/thời gian thực của người dùng.
C81 phải đo lại với cùng fixture/route; không bỏ dữ kiện chỉ để đạt chiều cao nhỏ.

## 6. Gate và giới hạn

- Lượt harness đầu:21 regression PASS, audit capture FAIL do trạng thái cookie chưa được cố
  định khiến test tìm nút Ẩn khi app đang hidden. Sửa duy nhất harness local cookie; rerun C80
  riêng1/1 PASS1.8m, đầy đủ78mẫu. Không coi lỗi harness là lỗi sản phẩm, không giảm timeout
  hoặc sửa runtime để test xanh.
- 21 test hồi quy C63/C72/C75/C78 PASS gồm cold Auth, loading, validation/pending/error,
  dirty/Back/Forward, duplicate-submit, save-close/reset/focus, notifications timeout/retry,
  privacy và stress32 menu cycles. Chúng chứng minh case cụ thể, không chứng minh mọi luồng.
- Lint và typecheck hiện hữu PASS. E2E đã chạy production build trong harness; không chạy lại
  full unit/pgTAP/build riêng vì không có source runtime/schema đổi. DB test hậu kiểm0/0/0.
- Mockup:56 mẫu7khổ×2theme×4route; font/overflow/h1/KPI-before-task/privacy/keyboard đạt;
  tên200ký tự,0VND,1.284.500VND,empty kiểm local. Probe kiểm fixed widths, hover/Tab và sweep;
  danh sách P cuối cùng và ngoại lệ Gu ghi đầy đủ trong `probe-evidence.json`.
  Soi ảnh1020px còn bắt được tiền vượt vùng nội dung KPI dù probe0P; đã đổi ngưỡng KPI2cột
  dưới1280, font mobile clamp và thêm assertion0clippedKpiAmounts. Probe final8runs đều0P.
  Reproduce từ root: chạy server tĩnh bind127.0.0.1/cổng3180 cho thư mục này, rồi
  `node docs/audit-c80/verify-mockups.mjs`; riêng audit app dùng
  `C80_AUDIT=true pnpm test:e2e c80-audit.spec.ts` qua harness DB test hiện hữu.
- `git diff --check`, JSON parse, JS syntax, `pnpm ci:validate` (policy/actionlint) và Gitleaks
  pinned/redact trên diff + mọi file text mới PASS. Link so sánh và ảnh trả200; thư mục chỉ chứa
  tài liệu/script/asset/ảnh synthetic đã review. Không commit/push nên không có run CI mới.
- Production dark **NOT_TESTED trong C80**: IAB chỉ đổi viewport, không có media emulation;
  không đổi OS/Owner preference hoặc dùng DOM mutation. C79 có bằng chứng dark riêng; C80
  dùng local dark đủ ma trận và không dùng lịch sử C79 làm PASS lần audit này.
- Physical mobile, VoiceOver, native Safari/Firefox và nguyên nhân warning Chrome:
  **NOT_TESTED/OPEN**. Không bắt OWNER thao tác VoiceOver để đóng audit; không bypass warning.
- Không có test khẳng định sidebar, modal, virtual keyboard hoặc safe-area trên thiết bị thật.
  Không thay giá trị tài chính/hành vi nghiệp vụ theo mockup, không kiểm transaction Production.

## 7. Checkpoint remediation đề xuất

**C81 — Compact dashboard/danh sách desktop và sửa F1–F4, local**, `AWAITING_APPROVAL` sau khi
C80 hoàn tất. Phạm vi/AC chính thức tại mục39 roadmap. Phương án A là mặc định đề xuất; nếu OWNER
chọn B thì chốt lại trước khi sửa. Gồm UI/copy/privacy guards/outline, không đổi schema/RPC,
ledger, tài khoản, secret, push hoặc deploy. Không redesign settings/notifications hoặc xử lý
Chrome/AT trong checkpoint này. C81 chỉ bắt đầu khi OWNER duyệt; không tự rollout sau local.
