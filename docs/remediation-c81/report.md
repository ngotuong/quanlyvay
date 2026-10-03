# C81 — Compact dashboard và khoản vay; sửa UX F1–F4

Ngày: 03/10/2026, Asia/Ho_Chi_Minh. Phương án **A**, OWNER đã phê duyệt trong hội thoại.
Trạng thái: **COMPLETED** local. C82 **AWAITING_APPROVAL**. Bản sửa chỉ local; Production vẫn C79.

[Đối chiếu trước/sau](review.html), [ma trận browser](browser-evidence.json).
Toàn bộ tên, tiền, tài khoản và ảnh lưu tại đây là **synthetic** trong DB test disposable.

## 1. Phạm vi và thay đổi

| Nguồn C80 | Kết quả C81 | File chính |
| --- | --- | --- |
| G1 · Gu, dashboard cao | Heading, KPI và banner lịch nhắc gọn; task + dòng tiền cạnh nhau từ1280px. KPI vẫn trên task ở mọi khổ. Cảnh báo gốc quá hạn thật giữ CTA và tương phản. | `apps/web/src/app/globals.css`, `app/dashboard/page.tsx` |
| G2 · Gu, card desktop281px | Từ1280px dùng hàng có ba vùng: biểu tượng, identity/metadata, tiền; quick action giữ riêng. Dưới1280px vẫn card. Mobile ba số tiền dùng dư gốc toàn hàng + hai cột lãi, tránh tách số/ký hiệu. Tên dài được tăng chiều cao. | `globals.css`, `app/loans/page.tsx` |
| F1 · MEDIUM, gọi lịch nhắc thành giao dịch/tháng này | Hiện khoảng D–D+30 inclusive theo period-end authoritative, không gọi lịch nhắc là giao dịch đã ghi. Copy clean/upcoming/overdue phân biệt. Số dư, lãi, so sánh và các truy vấn/RPC không đổi. | `app/dashboard/page.tsx`, `lib/business/dashboard-period.ts`, `docs/DASHBOARD.md` |
| F2 · MEDIUM, drawer hidden hướng tới nút ngoài modal | Trigger hidden hiện giải thích trước modal; nút “Hiển thị số tiền để tiếp tục” phải được bấm rõ rồi mới mở form. Không tự tắt privacy khi bấm thêm. Lifecycle lưu/dirty/pending/error/focus giữ nguyên. | `components/app/privacy-create-guard.tsx`, hai `*-create-sheet.tsx` |
| F3 · LOW, hai h1 ở mobile detail | Nhãn module đổi thành span ở record; tên khoản vẫn là h1 duy nhất, cả4tab/shown/hidden/light/dark. | `components/app/mobile-module-title.tsx` |
| F4 · LOW,26notice ở chart hidden | Guard một lần cho toàn bộ các cột; hidden unmount nội dung và tooltip, một notice. Trục vẫn —, bảng accessible che tiền; restore không giữ tooltip cũ. | `components/business/cash-flow-bars.tsx` |

CSS chỉ bổ sung theo scope dashboard/loan-list, tái sử dụng token/UI nội bộ. Không thêm thư viện,
đổi brand/font hoặc global PrivacyRegion. Không schema/migration/RPC/secret/account/Google,
commit/push/deploy hoặc dữ liệu remote. Thay đổi C80 chưa đồng bộ từ đầu phiên được bảo toàn.

## 2. Bằng chứng về mật độ và dữ kiện

Harness reference tái tạo cùng8 khoản C80: tên, hướng xen kẽ, gốc128.450.000, ngày01/10/2025,
chu kỳ30ngày,3%, cùng khoản baseline của global setup. Báo cáo01–03/10/2026.
C81 trướcAll chỉ reset DB test có guard khi suite trước đã thêm fixture, để so cùng baseline.
Không reset worker tái chạy khi marker C81 đã có.

| Chỉ số | C80 | C81 local | AC |
| --- | --- | --- | --- |
| Task start1440 light/dark | 527px | 456,53px | ≤460px |
| Task start390 light/dark | 811px | 697,42px | ≤700px |
| Ordinary loan row1440 light/dark | card281px | 154,16px | ≤160px |

Dashboard12mẫu375/390/768/1024/1280/1440 × light/dark:0tràn trang,0clipped KPI, KPI bottom
trước task top. Không bỏ cảnh báo hoặc cắt nội dung để đạt số đo. Bộ lọc kỳ, báo cáo và so
sánh kỳ giữ nguyên; không dùng helper ngày để quyết toán tiền.

Loans12mẫu cùng khổ/theme: metadata và tiền nguyên vẹn, tên200ký tự,0và≥1tỷ,4status
ACTIVE/OVERDUE/BAD_DEBT/SETTLED và hai hướng. Search-no-result, xóa lọc, status/direction/sort,
page2, canonical returnTo và quick action có assertion. Unit render server page thật với
empty query fixture kiểm dataset rỗng khác search-no-result và VIEWER không có create CTA. Fixture thêm sau reference dashboard,
nên ảnh danh sách C81 nhiều khoản hơn C80; không coi hai ảnh là so dataset giống nhau.

Chart6mẫu375/390/1440 ×2theme:26bar controls shown, click rồi Escape/Enter, hidden1notice,
0geometry/control/tooltip,3nhãn trục —, AX không tiền; bàn phím mở bảng, restore26bar và
0active tooltip. Detail4tab ×3khổ ×2theme ×shown/hidden =48mẫu single h1/0overflow.
Tổng ma trận functional78mẫu; hai guard kiểm hidden→explicit reveal→open→Escape→focus→reopen.

Các mức tiền lấy từ RPC hiện hữu. Unit render banner thật xác nhận clean/upcoming/overdue,
gross phải thu/phải trả, cảnh báo/CTA và privacy. Unit helper kiểm vượt tháng/năm/năm nhuận;
period resolver mặc định/custom vẫn dùng test hiện hữu. Regression C75 kiểm source set/task
identity/mốc nhắc; C78 kiểm zero/empty/boundaries và focus. C63/C72 kiểm lưu thành công tự đóng,
validation/pending/dirty/error/retry/idempotency/duplicate submit; không giảm assertion để xanh.

## 3. Evon ui-ux và visual review

Skill `/Users/ngotuong/.codex/skills/evondev-ui-ux/SKILL.md`, nhánh V sửa các finding đã duyệt
và A đã chọn. Audit stack/components/style từ C80 được giữ: Next16.3.8, React19.2.4,
Tailwind4.3.3, Inter tự host, Lucide, UI nội bộ, brand xanh và light/dark. Không mở lại brief.

Probe chạy trên app local production build với tài khoản synthetic, không đọc cookie hoặc
credential OWNER. Adapter local trong `.cache/c81/` thêm storageState của harness vào context
và chặn offset -1 của Range khi probe gặp NBSP trong tiền VND; không sửa skill cài đặt,
DOM sản phẩm hoặc kết quả đo. State/cache được Git ignore.

Probe dashboard/loans ×2theme,7khổ375/390/768/1024/1280/1440/1920. Hai sweep light1440→375,
bước20,55mẫu/route. Probe stress chạy sau fixture loans/status, có overdue và tên200ký tự;
khác reference geometry ở mục2. JSON/summary tại [probe-evidence.json](probe-evidence.json); cả4run cuối0P,
28mẫu fixed +110mẫu sweep. Không gộp probe với thiết bị thật.

Đối chiếu mọi P ban đầu (không loại im lặng):

| Nguồn probe lần đầu | Xử lý / lý do |
| --- | --- |
| Dashboard light P1/P2/P5/P9, loans light P1/P5 | Chữ phụ scoped tăng tương phản bằng color-mix với foreground, không đổi global token. |
| Dashboard light P3/P4, loans light P2/P3/P4 | Badge/error/direction scoped tăng tương phản; giữ vai màu và nền. |
| Dashboard light/dark P6 | Bỏ Tailwind individual scale ở overdue CTA; giữ shared Button motion/focus. |
| Dashboard light/dark P7 | Tablet presets được cấp hàng đủ rộng, không còn cuộn ngang chuột bị kẹt ở768px. |
| Dashboard light P8 · Gu hover | Scoped background hover rõ hơn, không đổi logic chọn preset. |
| Dashboard light P10 · singleton legend420–540 | Legend analysis xuống hàng đầy đủ dưới600px, không để một item rớt lẻ. Không đổi dataset/chart. |
| Loans dark | Ban đầu0P; tiếp tục đo lại sau sửa. |

Các tín hiệu Gu vẫn được ghi nhận, không tuyên bố probe hoàn hảo:

- Focus rings giữ vì AC accessibility/keyboard của dự án. Không xóa để theo I13 của skill.
- Sidebar/mobile-nav font650/11,2px, owner caption11,52px, color-scheme html “normal”, native
  date/select filter, hover border và shared card style là phần hiện hữu ngoài C81. Chưa redesign.
- Full name và ngữ cảnh task có thể7dòng với tên200ký tự; giữ đọc đầy đủ theo C75 thay vì cắt
  còn3dòng. Probe orphan đơn ở title nhỏ hoặc empty header được xem trên ảnh, không đổi nghiệp vụ.
- Legend/native disclosure có state mở; font/touch/browser measurements không chứng nhận
  VoiceOver hoặc thao tác vật lý. Không tự đọc lời nói qua DOM.

Đã xem render reference dashboard390/1440 light/dark, loan1440 và viewport390 light/dark,
ảnh breakpoint/probe/sweep và lớp custom/filter. Full money và tên không bị cắt; dashboard
vẫn ưu tiên KPI, alert thật rõ. Kiểm ảnh mới phát hiện tiền/ký hiệu mobile bị split, đã thêm
hai cột tiền có nowrap và assertion; không lấy0P làm thay visual review.

## 4. Gate, vấn đề trong quá trình kiểm và giới hạn

Gate cuối **PASS**: `pnpm lint`, `pnpm typecheck`, `pnpm test`108/108,
`pnpm build`, `pnpm test:e2e`54PASS/9SKIP8,3m exit0.9SKIP là opt-in evidence (7historical,
C80 capture, C81 Evon); không thêm skip hoặc giảm assertion ở C63/C72/C75/C78/C81.
C75 targeted3/3 PASS1,5m sau fix, [closing C75 evidence](regression-c75-evidence.json).
DB55322 profiles/loans/transactions0/0/0; diff-check/JSON/JS/Gitleaks pinned v8.30.1
trên diff+tệp text mới PASS.6ảnh dashboard C75 bị harness ghi khác được restore đúng HEAD,
C75 sạch khi startup; không restore file OWNER hoặc data. Build riêng chạy sau full E2E.
Không chạy CI remote, commit hoặc push trong C81. Closing file-link check phát hiện
C80 không lưu ảnh375; gallery chỉ cho chọn390/1440 có before thật, giữ ảnh375 C81 riêng.
Capture C81 và probe cuối từ lượt full có C75 fail:4test C81 PASS, C75 fail vẫn được giữ
trong kết quả toàn suite (54PASS/8SKIP/1FAIL10,9m). Sau sửa focus, gate cuối chạy lại cảsuite;
ảnh geometry/loans/privacy không phụ thuộc handler focus vừa bổ sung. Không gọi capture
này là bằng chứng full suite xanh. Browser review HTTP local từng timeout; file URL bị policy
IAB chặn. Có artifact HTML/ảnh và headless review picker/image-load PASS, không tuyên bố
native IAB đã render review. Không tìm cách vượt policy bằng browser khác.

Các lần kiểm trước có lỗi được xử lý:

- Expected date zero-pad không khớp formatter, canonical query order sai và retry setup
  tạo lại đối tác cùng idempotency khác input: sửa harness theo contract, không đổi app để né.
- Số đo mobile724,61/desktop504,56 và row162,23 không đạt: sửa bố cục thật, không nới threshold.
- Probe ban đầu thiếu authenticated context rồi lỗi Range-1: adapter như mô tả, không skip probe.
- Full E2E đầu phát hiện C75 scroll383px khi click toggle nằm sau fixed mobile nav.
  `attention-items.tsx` đưa toggle focus vào vùng nhìn thấy khi bị nav che, trước khi expand;
  giữ nguyên C75 source-set/focus/scroll assertion, không sửa hoặc skip regression.
- Unit render empty page thiếu URLSearchParams trong VM harness: bổ sung builtin chuẩn; không đổi runtime.
- Bar Enter trước hydration chưa toggle: test đợi một click thực thành công rồi kiểm Escape/Enter,
  không thêm sleep tùy ý hoặc hạ assertion. Full functional assertions vẫn bắt buộc.

Giới hạn: kiểm trên headless Chrome/desktop viewport giả lập. Chưa deploy C81, chưa authenticated
smoke C81 ở Production, chưa chứng nhận physical mobile/AT/Safari/Firefox hoặc warning Chrome.
pgTAP/Auth riêng không chạy lại trong C81 vì schema/Auth không đổi; full E2E chạy migration/setup
hiện hữu trên DB cô lập. Không nâng cấp gói GitHub hoặc thay đổi repository settings.

C82 chỉ là đề xuất rollout chờ phê duyệt; chi tiết scope/AC trong roadmap. Dừng sau C81 theo
AGENTS mục3, không tự thực hiện remote.
