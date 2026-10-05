# C87 — Phương án B, remediation local G1–G5

Trạng thái `COMPLETED` local. OWNER phê duyệt C87 B trong hội thoại ngày05/10/2026.

Phạm vi: canvas/region và sidebar navy/KPI cobalt; chữ chính16/nhãn14/navigation12/KPI18–24;
control phụ14/500–600, toggle header; startup brand/visible SPA feedback; phân trang Chi phí
đầu danh sách. Không sửa authoritative money/RPC/schema/Auth/session/notification policy.
Không commit/push/deploy, remote finance/account/mark-read/push permission/secret/Google/cleanup.

## Triển khai

- Palette ở `globals.css`, meta theo cùng palette tại `lib/app/theme.mjs`; native color-scheme,
  ba mode và cache/history observer C84 giữ nguyên. Blue/status/logo/Inter được bảo toàn.
- `AttentionItems` nhận heading server và đặt toggle gọn trong header, accessible name giữ
  count/ngữ cảnh. Giữ nguyên full source set,5item default,focus/scroll guard và empty state.
- `VndText` chỉ tách glyph trong chuỗi đã format, nối lại nguyên từng ký tự. Không parse/round/
  settle tiền. Flag độ dài chỉ render cùng số đang hiện, không có khi che. Nội dung dài có
  thêm chiều ngang; labels chart wrap để giữ nghĩa. Ngữ cảnh date range đầy đủ giữ ở title/ARIA.
- Pagination component thêm label/placement tùy chọn; nav đầu Chi phí chỉ khi>1page, footer
  nguyên chức năng, pageSize25/count/canonical/query giữ nguyên. Label link/nav tách rõ.
- Startup có logo/heading/indeterminate track; profile chưa resolve không có private content.
  SPA message không lấy focus/chặn click và bám transition/cancel thật; reduced-motion giữ tĩnh.
- Harness C75/C84/business-flow cập nhật đúng expected palette/copy và scopefooter sau thêm
  top pager; không giảm assertion/skips/retries. Unit privacy load production VndText thật,
  kiểm exact bigint text và hidden length flags. C86 artifacts/harness bảo toàn.

## Gate/lịch sử các lượt trước

- Initial C75/C84:9PASS1SKIP1FAIL4,1m;FAIL expected dark surface cũ, cập nhật expected màu B.
- C87 round1:2regular PASS/evidence FAIL,88samples có2KPI amount clipped375Light/Dark;
  raw matrix vòng1 được giữ; raw8Evon probes vòng2 được giữ riêng. Sửa spacing chỉ số (không chữ tiếng Việt), chart label wrap và range compact.
- Before harness lần đầu đã có cookie cùnghostname ởport3190 nhưng chờ login form; dừng143,
  không gọi là product fail. Next3101 child còn sống đã xác minh PID/cwd rồi dừng riêng;
  không đổi reuseExistingServer hoặc bỏ production rebuild. Before snapshot từ HEAD9813a6b
  chỉ runtime/public/config, node_modules hiện hữu; Root turbopack adapter chỉ ở cache.
  Hai app cùng disposable DB/fixture/Auth/date để ảnh trước/sau có thể đối chiếu.
- Unit đầu FAIL do renderer test chưa map import VndText; thêm map production module, khôngmock
  nó đi. Unit117/117 PASS (domain11/Google18/web54/scripts34), typecheck PASS.
- Round2/resume3/3PASS6,6m:88samples70module+18bigint stress,0overflow/clipped/visibleh1;
 18before images archived-runtime matchedDB/Auth/date/width. Source UI round2 không đổi sau
  capture; chỉ bổ sung proof closed-details vào regular test cho full-suite cuối.
- Auth2000/10000ms Light/Dark thủ công trái OS:feedback78–86ms,TTFB4,6–8,6ms; reduced-motion
  và no private startup đạt. SPA1800ms/message/complete/dirty-cancel đạt.
- 8Evon probes56fixed+220Light sweep; raw4hidden-tooltip-childP được đối chiếu ancestoropacity0
  và khi hover visible. HaiP reversal closed-details sau đó đã được đối chiếu bằng proof paint ở full-suite; form đã
  thực mở cả Light/Dark:1112×44,textheight17,lineheight16,8, không xuống hai dòng.
- Lint/typecheck/unit117/build PASS. Tại lượt này full E2E còn đang chạy; chưa dùng các gate đó để hoàn tất C87.

## Giới hạn

Ảnh/data đều fake trong C20-test55321/55322. Không có test mới trên AT/mobile/Safari/Firefox
vật lý hoặc cold PWA/network native của OWNER. Test local delay Auth không chứng nhận đoạn
trướcHTML dưới mọi điều kiện mạng. Production/Preview vẫn C85, không lấy localB làm rollout.

## Hồi quy full-suite chưa đạt (giữ bằng chứng)

Full đầu:59PASS/15opt-inSKIP/4FAIL10,2m, exit1. C20 expense page41 có hai nav nên locator
global trùng; đã scope footer có tên riêng, vẫn kiểm tổng/count/export. C72 scrollIntoViewIfNeeded
coi task dưới fixed nav là viewport-visible: đo844,09>777px. Bổ sung scroll-margin cho task,
harness cuộn dòng vào giữa trước khi giữ nguyên assertion clearance với nav thật; không kết luận
đây là mất dữ liệu. C81 mobile task719,92>700 và desktop loan161,17>160; giảm padding/margin
trong scope, không thu chữ/cắt giá trị hoặc đổi ngưỡng. Four-regression đầu C20/C72/loan đạt,
C81 desktop task495,44>460; giảm padding KPI/banner và vùng nhãn rỗng, giữ ngưỡng460/700/160.
Các sửa này được kiểm lại trong full-suite cuối và vòng hình thứ3; lượt FAIL trên không gọi là gate xanh.

Full round3 chuẩn bị hình đã dừng exit143 trước C87 capture khi source review phát hiện
selector cũ có specificity cao vẫn giữ dashboard description14px và notification body14px.
Sửa selector cụ thể về16px và helper notification/settings14px theo hợp đồng; giữ ngưỡng
C81, giảm margin nhãn rỗng thêm2px. Chưa chụp vòng hình thứ3 ở lượt dừng; không gọi là gate xanh.

## Đối chiếu phạm vi đã duyệt

| Mục C86 | Thay đổi C87 B | Nguồn chính |
| --- | --- | --- |
| G1, phân vùng đơn điệu | Canvas xanh nhạt, sidebar navy, một KPI cobalt; Light/Dark và màu trạng thái | `apps/web/src/app/globals.css`, `lib/app/theme.mjs` |
| G2, chữ nhỏ | Nội dung chính16px, nhãn14px, KPI18/24px; sửa selector mô tả dashboard/thông báo còn bị CSS cũ đè | `globals.css`, `components/ui/vnd-text.tsx` |
| G3, control phụ chiếm chỗ | Chữ14px, weight500–600, hit area44px; toggle trong header với ARIA/count đầy đủ | `components/business/attention-items.tsx`, `app/dashboard/page.tsx` |
| G4, cảm giác thiếu loading | Fallback có logo/track, nhãn skeleton, thông báo SPA nhìn thấy; giữ Auth và transition thật | `app/layout.tsx`, `app/loading.tsx`, `components/app/navigation-feedback.tsx` |
| G5, phân trang xa | Thêm nav gần đầu Chi phí khi nhiều trang, giữ footer và25 bản ghi/trang | `app/expenses/page.tsx`, `components/business/pagination.tsx` |

Dư nợ/lãi ròng vẫn trước Việc cần xử lý. Không loại bớt khối nghiệp vụ, không thêm quick-theme
toàn app hoặc đổi notification policy. Font Inter và logo hiện hữu được giữ; đây là chỉnh size,
nhịp và vai màu theo B, không đổi font hay thư viện. Số liệu và hình minh họa trong review đều giả.

Quét plaintext Gitleaks pinned v8.30.1 artifacts+diff+hai tệp code mới đã exit0; không đổi rule
hoặc allowlist. JSON parse,22 link/asset HTTP200 và native review375/390/768/1024/1440:
10 ảnh,0broken/overflow,1h1. C86 artifacts/harness vẫn khớp baseline SHA256. Hậu kiểm DB
và restore các ảnh C75 do suite tự ghi đã được xác minh sau teardown cuối.

## Kết quả cuối — C87 hoàn tất local

| Gate | Kết quả |
| --- | --- |
| Lint / typecheck / diff-check | PASS |
| Unit/workspace/scripts |117 PASS (11 domain,18 Google,54 web,34 scripts) |
| Build workspace | PASS,19 route web và Google Sync |
| Full E2E cuối |64 PASS,14 audit/evidence opt-in SKIP,15,1 phút, exit0 |
| C87 rendered matrix |88 mẫu:70 module và18 bigint stress;0overflow/clipped,1visibleh1 |
| Evon vòng3 |8 probe exit0,56 fixed và220 Light sweep;6 rawP đã đối chiếu,0actionableP |
| Database test sau teardown |Đúng project C20-test/port55322; sáu counts đều0 |
| Bảo toàn |17 tệp C75 restore exact bản đầu phiên; mọi hash C86/C75 baseline khớp |

Full-suite giữ nguyên các assertion tài chính/draft/privacy/theme/query/focus và các budget
C81 desktop task≤460/mobile≤700/loan row≤160px. Không thêm retry hoặc skip hồi quy để chốt.
C72 chỉ sửa cách cuộn phép thử có fixed nav, vẫn kiểm dòng nằm phía trên nav thật; C20/C84
chỉ scope nav footer sau thêm nav đầu. C87 có assertion computed-font16px của mô tả/thông báo.

18 ảnh trước/sau từ app được build thật dùng cùng DB/fixture/Auth/date/theme/width;
ảnh vòng3 đã xem Light mobile390 và Dark desktop1440. Tám raw probe vòng2 được giữ riêng,
raw matrix vòng1/vòng2 giữ cả lỗi. `probe-reconciliation.json` giải thích từng6P vòng3:
4P tooltip opacity0 (khi hiện contrast15,962 Light/14,588 Dark) và2P nội dung details đóng
không painted. Nút đảo khi mở thực1112×44px, một dòng17px/line-height16,8; không đổi probe
rule hoặc ignore list. Đây là đối chiếu bằng bằng chứng, không gọi raw probe là0P.

Loading cuối Auth2/10 giây có phản hồi93–134ms, TTFB local3,2–9ms; không dữ liệu riêng tư trước
resolve và reduced-motion đạt. SPA1800ms/complete/dirty-cancel đạt. Pagination375/390 có
nút Trang sau ở y193,39px, scrollY0→0,25rows→1row trang2 và Back/Forward đúng. C86 đo
footer-only list5386px là baseline khác lượt; không dùng số đó làm đo scroll cùngfixture C87.
Review trước/sau cho thấy sự khác biệt cùng fixture; không có nghiên cứu người dùng thật.

`validation.json` giữ hash12file runtime cuối và gate metadata; HEAD/origin tracking vẫn
9813a6b1b91322e82ef33374928679a22774c0db. Không commit/push/deploy hoặc remote mutation.
CI/rollout thuộc C88 `AWAITING_APPROVAL`, chưa thực hiện. Không blocker local còn mở.

Native IAB override rộng hơn panel vật lý tạo screenshot bị cắt phần bên phải; đã loại bản đó.
Ảnh `review-proof.png` cuối dùng viewport mặc định và cuộn native, thể hiện phần Trước/Sau.
Kiểm geometry năm khổ dùng innerWidth thực được quan sát; screenshot panel không thay ma trận
app88 mẫu. Một lệnh cuộn AX root bị detached, cuộn coordinate native theo screenshot đã đạt;
đây là giới hạn công cụ, không quy thành lỗi sản phẩm.
