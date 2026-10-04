# C84 — Sửa UI/UX và lựa chọn giao diện theo phương án A

Trạng thái: COMPLETED local ngày 04/10/2026. OWNER phê duyệt trong hội thoại ngày 04/10/2026.

Phạm vi: F1–F7, L1, G1 và G2 của C83, thực hiện local. Giữ màu xanh/Inter, nguồn dữ liệu,
quyền, validation, RPC, audit/reversal và thứ tự KPI trước Việc cần xử lý. Các bản ghi và ảnh
kiểm thử đều giả trên database C20-test API55321/DB55322. Production vẫn C82.

## Đối chiếu remediation

| ID | Trước C83 | Thay đổi C84 | Kiểm chứng |
| --- | --- | --- | --- |
| F1 | Trang ngoài giới hạn rỗng/lỗi/empty sai | Count sau filter và URL canonical; thông báo đọc count RLS trước range | PASS: 0/25/26, query, back/forward |
| F2 | Đóng editor lúc pending hứa bỏ nhưng server vẫn lưu | Theo dõi pending, chặn dismiss; acknowledged success đóng/clear/focus | PASS: error/cancel/retry/pending/close/focus |
| F3 | Settings mất draft không hỏi | BusinessForm/dirty guard dùng chung; form độc lập, nested close guard; password chỉ trong bộ nhớ | PASS: account fixtures local và regression tài khoản |
| F4 | Dark tổng chi phí 2,74:1, các chữ phụ Light dưới chuẩn | Tổng dùng primary semantic; muted/accent/placeholder đủ tương phản trên các nền | PASS: normal ≥5,397:1; large ≥6,702:1; focus ≥5,169:1 trong mẫu đo |
| F5 | Ẩn tiền vẫn hiện tỷ lệ và bar width | Một notice riêng tư; bỏ hoàn toàn markup phân bổ khi ẩn | PASS: không render dẫn xuất khi ẩn; reload/restore |
| F6 | Phần trăm bị floor trước Math.round | Tỷ lệ trình bày làm tròn 0,01 điểm phần trăm bằng BigInt | Unit đạt; không tính lại số tiền authoritative |
| F7 | Tên120/ghi chú500/category80 unbroken tràn | min-width:0 và overflow-wrap:anywhere; tiền nguyên dòng | PASS: 5 khổ × 2 theme; expense trang2 có80/500 ký tự |
| L1/G1 | Media-only, color-scheme normal | Ba radio ở Cài đặt, cookie cùng host, SSR/CSS manual/system, native/meta thống nhất | PASS: manual trái OS, SSR/no-JS, invalid/blocked, history/meta/native |
| G2 | Mỗi mục có hàng thao tác lặp | Hàng gọn desktop/card mobile, disclosure44px; phân bổ thu gọn | PASS: ảnh/keyboard/bounds; raw P đối chiếu ở dưới |

Chi tiết lỗi trước, nguyên nhân, vị trí và bằng chứng: `../audit-c83/report.md`.
Không rút nội dung thông báo, thêm filter/chính sách nhắc hoặc đổi brand.

## Contract giao diện

Cookie `qlv_theme=light|dark|system`, Path=/, SameSite=Lax, một năm; Secure trên HTTPS.
Thiếu/sai/bị chặn → system. Manual ưu tiên hơn OS. System dùng CSS media trước hydration;
client cập nhật mô tả/phản ứng thiết bị trong system và giữ metadata cached history theo preference hiện hành. SSR đọc cookie cho html và meta,
không thêm thư viện hoặc inline script/CSP exception. Tab khác đọc lựa chọn khi reload.
Theme không ghi vào Supabase và không reload khi đổi, nên giữ draft/focus/scroll/Auth.

Tỷ lệ chi phí chỉ trình bày: `(amount * 10000 + total / 2) / total`, đơn vị 0,01 điểm phần
trăm, rồi định dạng bằng số nguyên. Nhóm rất nhỏ có thể làm tròn thành 0%; tổng các tỷ lệ
làm tròn có thể lệch 100%. Không phân bổ lại tiền để ép tổng hoặc dùng JS float quyết toán.

## Gate và giới hạn

Gate cuối đạt: lint/typecheck, 116 unit, pnpm build, full E2E61 PASS/12 opt-in SKIP10,7 phút/exit0; critical theme/history/native2 PASS2,0 phút. 12 SKIP gồm11 audit/evidence opt-in cũ và Evon C84 đã chạy riêng. Không thêm skip hoặc giảm assertion/retries để đạt gate. Lịch sử chẩn đoán được giữ: lượt target đầu: 3 PASS, 2 FAIL, 1 opt-in SKIP. FAIL thứ nhất tìm được input
account vẫn giữ giá trị cũ sau server render: sửa key theo baseline server của trường profile.
FAIL thứ hai là harness dùng check khi cookie-blocked chủ ý không giữ lựa chọn; đổi sang click
và vẫn assert fallback system/message. Không giảm assertion, retries hoặc skip regression. Lượt target kế đạt 7/7 trước tinh chỉnh
khung hàng/menu và bổ sung cold-theme test. Full đầu tìm regression mất inline success feedback
sau đóng form; đã giữ lại status trong main, vẫn có toast/close/focus. Dừng đúng tiến trình
Playwright đó bằng SIGINT để rebuild: 15 PASS, 1 FAIL, 1 interrupted, 56 chưa chạy; không gọi
lượt này là gate đạt. Lượt full thứ hai: 58 PASS, 4 FAIL, 11 opt-in SKIP, 14,0 phút. Ba FAIL là locator cũ sau đổi bố cục (menu xóa, editor và container tổng); cập nhật locator, mở menu trước xóa và assert tổng có chữ số, không bỏ kiểm xóa an toàn/history/tổng. FAIL thứ tư tìm được native date trong dialog vẫn color-scheme normal: thêm dialog kế thừa theme; giữ assertion Dark trái OS. Lượt full thứ ba: 61 PASS, 1 FAIL, 11 opt-in SKIP, 14,0 phút. Locator/feedback/regression đã đạt; chỉ native date còn FAIL. CSS build thực tế chuyển literal inherit thành normal; dùng token --native-color-scheme light/dark cho dialog/date, không sửa optimizer/CSP. Lượt full cuối kiểm source này cùng SPA theme history và chi phí unbroken trang2; không gọi các lượt FAIL là gate đạt. Full thứ tư: 60 PASS, 1 FAIL, 12 opt-in SKIP, 10,9 phút. Native drawer/date và90mẫu matrix đạt; SPA history khôi phục meta theme-color cũ dù nội dung vẫn Dark. Thêm đồng bộ head với preference hiện hành, cleanup observer khi unmount và chỉ ghi khi giá trị khác để tránh loop; giữ regression Back/Forward. Critical theme/history/native2/2 PASS2,0 phút sau sửa; full cuối đạt61/12.  Một lượt typecheck trùng thời điểm Next build thiếu routes.js sinh tạm; chạy lại sau build đạt, không sửa cấu hình hoặc bỏ typecheck.

Physical AT/mobile/Safari/Firefox và authenticated Production C84 chưa được kiểm. Không lấy
render headless làm chứng nhận VoiceOver, không request push permission hoặc submit remote.
Không commit/push/deploy, schema/migration/secret/Google/cleanup. C83 local được bảo toàn.

Secret scan hiện hành: Gitleaks pinned raw2/exit1 được giữ nguyên. Một finding là idempotency
identifier công khai C83; một là password công khai của tài khoản giả `c84_viewer_test` dùng
riêng trong C20-test. Không phải credential OWNER/Production; không thêm rule/ignore để bỏ
finding. Hậu kiểm SQL sau full gate: profiles/loans/transactions/counterparties/notifications/auth.users đều0 trên project C20-test55322.  `security-evidence.json` ghi phân loại.

## Vị trí triển khai

- F1: `apps/web/src/lib/business/list-page.mjs`, ba route đối tác/chi phí/thông báo,
  `lib/business/queries.ts:getNotificationCenter` (RLS count/range và race unread shrink).
- F2/F3: `counterparty-editor.tsx`, `auth/user-management.tsx`, `form-parts.tsx`,
  `app/dirty-navigation-guard.tsx`. Không đổi các action tài khoản hoặc RPC nghiệp vụ.
- Theme: `app/layout.tsx`, `components/app/theme-provider.tsx`, `lib/app/theme.mjs`,
  `app/settings/page.tsx`, `app/globals.css`. Cookie chỉ chứa preference, không chứa tài khoản.
- F4–F7/G2: semantic CSS, `expense-distribution.tsx`, `percentage.mjs`,
  `delete-counterparty-button.tsx`; desktop chia dòng từ1024px, mobile card và form full-width.
- Hướng dẫn: `docs/DESIGN_SYSTEM.md`, `docs/USER_GUIDE.md`. Test C84 ở unit/E2E; hai harness
  C20/C64 đổi locator để thực hiện đúng đường thao tác mới, giữ regression nghiệp vụ.

## Đối chiếu Evon và kiểm tra ảnh

Ba vòng kiểm hình đã chạy. Lượt cuối trong full3: 40 fixed + 220 sweep trên bốn module,
Light/Dark, khổ375/390/768/1024/1440. Giữ nguyên tám log raw `evon-*.txt`; không sửa
probe để giảm finding. Sau đó chỉ sửa lỗi CSS build của native color-scheme trong drawer
và metadata theme khi quay lại trang SPA đã cache; không thêm vòng tinh chỉnh Gu.
Full gate/ảnh/đo rendered của source cuối kiểm riêng các thay đổi này.

| Nguồn raw cuối | Đối chiếu | Kết luận |
| --- | --- | --- |
| expenses Light P1 / Dark P1: “Xác nhận đảo” wrap1024–1440 | Probe đo layout của nội dung native details đang đóng trong cột hẹp. Form mở span cả hàng; matrix mở form10mẫu đo Range một dòng và nút≥44px; ảnh expense-reversal có bằng chứng riêng | Loại báo nhầm nội dung không hiển thị; không bỏ kiểm form mở |
| notifications Light P1 / Dark P1: rê ra “Tất cả” vẫn nền selected | Link đang có aria-current=page/data-active=true; nền/chữ phải giữ selected sau hover-out, lọc chưa chọn có state riêng | Loại báo nhầm selected state; giữ kiểm tương phản normal/hover/selected và unread tint |
| Menu đối tác Light/Dark ở vòng trước hòa nền khi hover | Dùng primary-soft/primary khi hover/open; raw vòng cuối không còn P này | Đã sửa |

Cảnh báo Gu khác của skill về focus ring/font brand không áp dụng máy móc: C84 giữ brand
Inter/xanh và focus-visible theo AGENTS/đặc tả A được duyệt. Không bỏ vòng focus accessibility.
Đã soi ảnh cài đặt mobile, danh sách desktop, form đảo mở và chuỗi dài trước/sau; khung card
mobile, hàng desktop và nội dung dài đọc đầy đủ. Review HTML có40ảnh (bổ sung ghi chú dài trang2 và form đảo mở), năm khổ không tràn/
không ảnh hỏng; ảnh có scroll và liên kết bản gốc. Fixtures trước/sau khác, không so số tiền.

## Chốt acceptance criteria và handoff

- 90 mẫu rendered: 70 route-request × width/theme (request login khi đã Auth thực tế về
  dashboard, không gọi là70view độc lập), 10 chi phí unbroken trang2 và10form đảo mở. Public
  login/startup riêng hai manual mode, delayed first paint/native drawer đều đạt. Tương phản
  normal/placeholder/unread/hover/selected và focus đo trong `browser-evidence.json`; số liệu
  aggregate và giới hạn ở `validation.json`. Overflow/clipped text/clipped amount/tiny summary0.
- Lifecycle create/manage/reset local, policy must-change, VIEWER không có admin, không browser
  storage password, error/retry/close/clear/focus và nhiều tài khoản đều đạt. Theme giữ draft,
  cookie/reload/route/manual/system, radio keyboard, SSR/no-JS/blocked và cached history/meta.
- Các mjs đã parse, JSON hợp lệ,42HTTP links200, CUA40ảnh ×5khổ0overflow/0broken; viewport
  reset. Source runtime18file giữ nguyên qua final gate.14ảnh C75 harness sinh đã restore
  chính xác HEAD do ban đầu sạch; C83 và thay đổi local khác được bảo toàn.
- Secret scan raw2/exit1 là finding fixture được review, không gọi là raw scanner zero. Không
  Production/OWNER/external credential; cache/storage/build/test-result bị ignore. Review local
  không thay job Secret scan/Required CI của source và closing SHA trong C85.
- Không blocker hoàn tất local C84. Không commit/push/deploy hay ghi dữ liệu remote trong C84;
  Git HEAD/origin tracking vẫn2d040e9f3c41cdbdc043a2c446153140f7b9f95e. Production chưa nhận
  bản sửa này qua checkpoint này. C85 phát hành có scope/AC tại mục43 roadmap, AWAITING_APPROVAL.
