# C83 — Audit sâu module và lựa chọn giao diện

Ngày04/10/2026. OWNER phê duyệt C83 trong hội thoại. Audit source/runtime C82 từ
`2d040e9f3c41cdbdc043a2c446153140f7b9f95e`, local main khớp origin/main trước khi bắt đầu.
Thay đổi local C83 chỉ tài liệu, prototype, bằng chứng synthetic và harness observation;
không sửa runtime/schema/RPC, commit/push hoặc deploy. Production giữ C82.

Audit: Next.js16.3.8/React19.2.4, Tailwind4.3.3, lucide, component nội bộ8file.
Token ở `apps/web/src/app/globals.css`, Inter có subset Vietnamese.69fileTSX; toàn CSS có
41box-shadow,14gradient,5backdrop-filter,111border-radius declarations (kể cả override/responsive,
không phải số component riêng). Giữ hệ màu xanh và brand hiện hữu; không coi phong cách là lỗi.
Dark đang hoạt động qua `prefers-color-scheme`; chưa có app preference hoặc bộ chọn ba chế độ.
Áp dụng Evon ui-ux, nhánh review V; giữ focus-visible của app theo yêu cầu accessibility OWNER.

## Phương pháp và giới hạn bằng chứng

| Nguồn | Phạm vi | Kết quả/giới hạn |
| --- | --- | --- |
| Chrome local production build |130lượt:11route/view + expenses-empty/private,5khổ×2theme |Không tràn ngang; có findings bên dưới, không phải assertion sản phẩm hoàn hảo |
| Evon trên local synthetic |40khổ cố định +220sweep (1440→375,bước20),4module×Light/Dark |9mã P:7vàoF4,2báo nhầm selected filter được loại có lý do |
| CUA authenticated Production |20lượt:counterparties/expenses/notifications/settings×5khổ,Light |Overflow0, mỗi view thường1h1, loading kết thúc, consoleerror0; thêm một URL notifications page99 tái hiện F1 |
| Prototype A/B |80samples,4view×2variant×5khổ×2theme |Render thật, dữ liệu giả; không tràn. Thêm20stress samples không tràn/cắt text trong mockup. Evon A4view/Bcounterparties50fixed+55sweep; finalP0 sau sửa riêng mockup |

Khổ375/390/768/1024/1440. JSON chính `local-evidence.json`, `remote-evidence.json`,
`proposal-evidence.json`, `probe-ledger.json`, `proposal-probe-ledger.json`.
Local C20-test được helper guard project QuanLyVayCaNhan-C20-test/API55321/DB55322.
Ảnh lưu trong repository đều synthetic; remote chỉ lưu aggregate metadata, không tên/tiền/ID/
cookie/ảnh thật. Production chỉ đọc, mở/đóng form trống; không save/mark-read/đổi giờ/permission.

Dark Production C83 **NOT_TESTED**: IAB kết nối hiện tại báo Light và không có API đổi colorScheme;
tab OWNER trước đó bật Dark không thay thế bằng chứng lượt này. Local Dark đã kiểm.
Remote save/error injection/account actions/push subscribe, mobile vật lý, VoiceOver,
authenticated Safari/Firefox **NOT_TESTED** theo phạm vi hoặc năng lực công cụ. Không yêu cầu
OWNER tự học VoiceOver. Không audit lại backup/CI/release từ log checkpoint đã hoàn tất.

## Findings ưu tiên

Không có CRITICAL/HIGH được xác nhận trong phạm vi audit.7finding:6MEDIUM(F1–F5,F7),1LOW(F6), thêm1Lệch hệ và3Gu. Severity là ảnh hưởng công việc,
Hỏng/Lệch hệ/Gu theo phân loại Evon; yêu cầu bổ sung mới không tự quy thành regression.

| Mã | Severity / hạng | Người dùng vấp ở đâu | Hướng xử lý |
| --- | --- | --- | --- |
| F1 |MEDIUM / Hỏng |Trang ngoài giới hạn: đối tác trống, chi phí báo chưa có dù còn26bản ghi, thông báo lỗi tải |Chuẩn hóa page bằng tổng sau filter; URL canonical và trạng thái rỗng đúng |
| F2 |MEDIUM / Hỏng |Đóng editor khi đang lưu nói “bỏ thay đổi” nhưng server vẫn lưu |Theo dõi pending, khóa dismiss và chỉ reset/close khi xác nhận thành công |
| F3 |MEDIUM / Hỏng |Rời quản lý tài khoản mất draft mà không hỏi |Đăng ký dirty guard, bảo vệ close/navigation; giữ draft khi cancel/error |
| F4 |MEDIUM / Hỏng |Tổng chi phí Dark2,74:1; nhiều chữ phụ Light dưới4,5:1 |Dùng semantic text roles tương phản đủ, kiểm cả theme và nền selected/tinted |
| F5 |MEDIUM / Hỏng |Ẩn tiền vẫn để lộ tỷ lệ và hình dạng phân bổ chi phí |Ẩn dữ liệu biểu đồ dẫn xuất cùng amounts, một notice trung tính |
| F6 |LOW / Hỏng |Phần trăm bị cắt trước Math.round:99%,0%,0% cho phân bổ khác0 |Định dạng tỷ lệ từ số nguyên với precision rõ; không thay số tiền authoritative |
| F7 |MEDIUM / Hỏng |Tên/ghi chú dài không có khoảng trắng đẩy nội dung ra ngoài màn, nút thao tác mất khỏi viewport |min-width:0 trên grid/flex child, wrap-anywhere cho free text; giữ tiền nguyên dòng |
| L1 |LOW / Lệch hệ |CSS Dark nhưng html color-scheme vẫn normal |Cùng contract effective theme cho token/utilities/native controls/meta |
| G1 |MEDIUM / Gu — yêu cầu OWNER |Không có lựa chọn Sáng/Tối/Theo thiết bị |Đề xuất A ở Cài đặt, B thêm quick menu; xem theme-spec.md |
| G2 |LOW / Gu |25card đối tác/chi phí lặp hàng thao tác, đảo giao dịch chữ nhỏ |Hàng gọn desktop, card mobile; thao tác phụ ít lặp, target44px |
| G3 |LOW / Gu |Thông báo25mục×tối đa5dòng, badge Mới lặp |Đề xuất hàng gọn nhưng giữ đầy đủ ngữ cảnh và trạng thái đọc; chưa chọn scope rút nội dung |

### F1 — Page vượt tập kết quả không có lối hồi phục hợp lý

**Trigger:** `/counterparties?page=99`, `/expenses?page=99`,
`/notifications?unread=true&page=99`, ở toàn bộ5khổ×2theme local. Chuỗi page cũng có thể cũ
sau số bản ghi/filter thay đổi; user không bắt buộc tự gõ99 mới gặp cùng gốc lỗi.
**Bằng chứng:** đối tác `Trang99/2 ·28bản ghi` nhưng0row và không empty-state;
chi phí `Trang99/2 ·26bản ghi` đồng thời “Chưa có chi phí chung”; notification query range
ngoài tập gây “Chưa thể tải dữ liệu”. Production readonly đã tái hiện notification page99.
**Gốc/vị trí:** `components/business/pagination.tsx:3–18` chỉ kiểm số nguyên/range rộng;
`app/counterparties/page.tsx:16,35,42` slice theo page chưa clamp;
`app/expenses/page.tsx:69,78` dùng items rỗng cho empty toàn hệ thống;
`lib/business/queries.ts:64–73` range PostgREST ngoài tập bị coi là lỗi tải chung.
**Tác động:** không thấy dữ liệu đang có, hiểu sai empty, Thử lại giữ URL sai có thể không phục hồi.
**Sửa:** clamp/redirect page theo total đã lọc, giữ query/unread, distinguish zero records với
out-of-range. Không thay nghiệp vụ hoặc dữ liệu financial. Kiểm25/26rows,filter co tập,
page-1/page99/empty và Back/Forward, không loop.

### F2 — “Bỏ thay đổi” khi request đã gửi không hủy được save

**Trigger:** sửa tên đối tác synthetic, delay Server Action2giây, bấm Lưu rồi đóng summary,
chấp nhận confirm “Đóng và bỏ các thay đổi này?”.
**Bằng chứng:** `editorPendingClose.closedWhilePending=true`, confirm có wording bỏ thay đổi,
`editorPendingClosePersisted=true`. Không chạy save này trên Production.
**Gốc/vị trí:** `components/business/counterparty-editor.tsx:12–18` chỉ có dirty, không nhận
onPendingChange dù `counterparty-form.tsx:13–21` đã hỗ trợ. Close remount form, không cancel RPC.
**Tác động:** UI hứa hủy nhưng dữ liệu được cập nhật; người dùng mất phản hồi và dễ thao tác lại.
**Sửa:** pending guard cùng sheet hiện hữu; không giả hủy request đã gửi. Giữ form pending,
thông báo đã gửi/chờ xác nhận; success close/focus, error giữ draft và retry xác định.

### F3 — Draft cài đặt không được đăng ký vào guard

**Trigger:** mở Quản lý tài khoản của Editor giả, sửa Tên hiển thị, chọn Thông báo, quay lại.
**Bằng chứng:** `settingsDraftNavigation.confirmDialogs=0,leftPage=true,settingsDraftLost=true`.
Không submit tài khoản hoặc password, không thay quyền.
**Gốc/vị trí:** `components/auth/user-management.tsx:77–84,88–92,103–108` dùng form action
trực tiếp, không `registerDraft`/BusinessForm hoặc lifecycle tương đương;
`components/app/dirty-navigation-guard.tsx:7–20` chỉ biết các form đã đăng ký.
**Tác động:** mất input không báo; khác hành vi các form nghiệp vụ đã được sửa.
**Sửa:** reuse dirty/pending/error/focus lifecycle nhưng giữ Server Actions/validation/quyền hiện tại.
Không thêm rule Auth hoặc lưu password draft. Kiểm close/link/Back/Forward/reload, cancel giữ input.

### F4 — Tương phản chữ theo vai bị lệch nền thực tế

**Bằng chứng đo:** Dark tổng chi phí `#4f39f6`/`#111827`2,74:1, chữ20px/700 cần3:1.
Light search placeholder3,41:1, mô tả page4,45:1, eyebrow4,10:1,
ngày thông báo trên unread tint4,14:1, push config note4,32:1 (chữ thường cần4,5:1).
Đủ5khổ cho các dòng chung; description chỉdesktop1024/1440. Không lấy pixel ảnh nén để kết luận.
**Gốc/vị trí:** `app/expenses/page.tsx:42` hardcoded text-indigo-600, thay vì semantic Dark role;
`app/globals.css:252–258,532,589,908,929` accent/muted/placeholder và nền tinted chưa cùng budget.
**Tác động:** số tổng khó đọc trong Dark; người thị lực thấp khó đọc hint/date/feedback.
**Sửa:** giữ sắc brand, dùng token/variant tương phản đủ trên nền thực tế, kiểm normal/hover/
selected/disabled/focus cả hai theme; không sửa font/brand vì gu. Đây là7mã probe được đưa lên bảng.

### F5 — Privacy che nhãn/tiền nhưng vẫn để lại tỷ lệ và bar

**Trigger:** expenses có3danh mục, bật Ẩn số tiền. **Bằng chứng:**10samples vẫn hiện
`99%,0%,0%` và barWidths `99%,0%,0%`, dù29amountmasked; `expenses-private-390-*.png`.
**Gốc/vị trí:** `app/expenses/page.tsx:54,57–58` tỷ lệ và width đứng ngoài PrivacyRegion.
**Tác động:** vẫn nhìn ra mức tập trung chi phí trong chế độ che dữ liệu; hành vi khác biểu đồ
dashboard/loan đã có privacy contract. Không phải network/data-access bypass; dữ liệu authenticated
vẫn cần ở client cho restore theo kiến trúc hiện hành.
**Sửa:** thay vùng phân bổ bằng một notice khi privacy; không giữ %/width/tooltip/accessible name
dẫn xuất. Restore biểu đồ đầy đủ; không đổi result từ database.

### F6 — Tỷ lệ hiển thị bị floor, Math.round không còn phần lẻ

**Bằng chứng:** fixture matrix tổng1.287.325.000, nhóm lớn1.284.500.000 có tỷ lệ99,7805% nhưng
hiện99%; hai nhóm dương đều0%. Tổng phần trăm99%, không phải nearest rounding như code diễn đạt.
Sau drawer save250.000, probe tổng1.287.575.000; không trộn hai thời điểm này.
**Gốc/vị trí:** `app/expenses/page.tsx:48` phép chia BigInt thực hiện trước Number/Math.round.
**Tác động:** hiểu sai độ lớn tương đối của nhóm nhỏ; không làm sai số tiền ghi nhận/quyết toán.
**Sửa:** quy tắc precision trình bày rõ, tính integer-scaled ratio/round đúng; format vi-VN.
Kiểm zero/1÷3/tỷ lệ rất nhỏ/tiền lớn, không floating-point quyết toán tiền.

### F7 — Chuỗi dài hợp lệ làm tràn toàn bộ trang

**Trigger:** counterparties tên120ký tự/notes500ký tự không khoảng trắng; expense category80/
note500ký tự, số tiền9.999.999.999VND, đều RPC chấp nhận. Chuỗi URL/mã hoặc ghi chú dán vào
cũng có thể không có điểm ngắt. Supplement riêng20samples5khổ×2theme×2module.
**Bằng chứng:** đối tác overflow4199–4992px; chi phí4896–5689px.375px lần lượt4992/5689;
390px4977/5674. Ảnh `unbroken-counterparties-390-light.png`, `unbroken-expenses-390-dark.png`
cho thấy tên/notes chạy khỏi card và hành động bên phải không còn trong vùng đọc.
**Gốc/vị trí:** `app/counterparties/page.tsx:35–38`, `app/expenses/page.tsx:51–54,71–72`;
`app/globals.css:583–587,602`: grid/flex item thiếu min-width:0, free text overflow-wrap:normal.
**Tác động:** phải cuộn ngang nhiều màn, khó đọc/chỉnh sửa; overflow0 ở matrix thường không
chứng minh layout chịu dữ liệu biên. Không xếp lỗi validation vì input này đang hợp lệ.
**Sửa:** giới hạn min-content đúng ở card/list/flex, wrap-anywhere free text; không truncate dữ
kiện quyết định hoặc cắt amount, không dùng overflow:hidden để che triệu chứng. Kiểm120/500/80,
worded/unbroken, tiền lớn, privacy và typography cả5khổ×2theme.

### L1 và Gu — không tự đổi nhận diện

**L1:** cả4module Dark probe đọc html `color-scheme:normal`; root Dark tokens ở
`app/globals.css:52`, chỉ dialog date có color-scheme riêng ở180. Xếp Lệch hệ, không chứng minh
mọi native control đã hỏng; kiểm selector/date/autofill và scrollbar trong C84 theo theme-spec.

**G1:** `app/settings/page.tsx:20–28` chỉ tài khoản/quản trị; media-only ởglobals52/837/1093 và
layout metadata41. Không có control/persistence/manual priority. Thêm feature theo yêu cầu OWNER,
không coi việc OS tự bật Dark là lỗi Auth. A khuyên dùng, B cho người thường đổi nhanh.

**G2:** counterparties page36–39 dựng card + edit-summary riêng cho mỗi bản ghi; expenses70–73
tương tự. Summary đảo giao dịch có text-box dưới24px trong130matrix; CSS728 chỉ giảm font,
summary::after598 còn glyph24px. Probe tap selector bỏ qua `summary`, nên không dùng P0 để
tuyên bố target đã đạt; chưa khẳng định WCAG target failure khi chưa xét hit region/spacing.
Ưu tiên44px hoặc menu action có nhãn rõ, giữ confirm/đảo/audit và toàn bộ tiền/ngày/ghi chú.

**G3:** notification source28 giữ title/body/ngày/badge từng mục; probe thấy25mục tối đa5dòng.
Đề xuất compact là Gu, không cắt dữ kiện nhận diện khoản vay. Prototype có text Đã đọc/Chưa đọc,
không chỉ dùng màu. C84 mặc định giữ body nguồn, chưa duyệt rút nội dung hoặc thêm lọc ngày.

## Đối chiếu máy đo

App Light7mã, Dark2mã. **9tổng =7F4 +2loại**: notifications LightP3/DarkP1 coi link “Tất cả”
đang selected (`aria-current=page,data-active=true`) là link thường; giữ nền selected sau hover
là đúng. Source notification page24 và ảnh fixed đã đối chiếu. Mọi mã có trong `probe-ledger.json`.
Không loại dòng4,45:1 vì gần ngưỡng. Không đổi sidebar/font/shadow/gradient theo gu skill.
Prototype final50fixed+55sweep, P0; lịch sử sửa mockup được ghi trong ledger, không che lỗi bằng skip.

Console normal remote0; local server errors khi page99 và abort POST có chủ ý được ghi riêng,
không quy lỗi transport injection thành lỗi Production. Local/error/privacy findings vẫn OPEN
cho remediation; audit PASS chỉ xác nhận đã thu được bằng chứng.

## Phương án review

`proposal.html` là trang đối chiếu trước/sau render thật và2hướng A/B cho4module, có Light/Dark.
Prototype A/B chưa gọi API hoặc lưu preference; theme-spec là đặc tả C84, không chứng nhận tính
đúng no-flash/persistence từ bản HTML mô phỏng. KPI trước Việc cần xử lý không thay đổi.

**C84 đề xuất:** sửa F1–F7,L1; triển khai theme theoA; compact đối tác/chi phíG2, thông báo giữ
ngữ cảnh và trạng thái đọc. C84 thực hiện local, không tự remote/account/schema/push/deploy.
Nếu OWNER chọn B thayA thì chọn trước khi dựng; không thêm cả hai lối nhanh không cần thiết.
Roadmap mục42 chứa scope/acceptance criteria; sau C83 dừng ở C84 AWAITING_APPROVAL.

## Gate

Audit chính1PASS4,8m; C63/C67/C72/C75 regression22PASS4,1m (gồm SQL-lock timeout thật local).
Sáu ảnh C75 do harness sinh khác đã đối chiếu và restore đúng HEAD; không hoàn nguyên thay đổi OWNER.
Supplement1PASS2,3m:20samples valid-unbroken tái hiện F7; PushManager bị gỡ trước load nhận
unsupported nhưng disclosure vẫn “Chưa bật”, switchdisabled và Notification.permission=default.
Thiếu keylocal cũng góp phần disable nên không suy từ đây thành lỗi permission; không request
thật và chưa chứng nhận nhánh granted/denied/subscription.0/0/0profiles/loans/transactions đã
xác minh bằng SQL trên đúng container C20-test sau teardown. Lint/typecheck PASS;
diff/JS/JSON/secret scan xác minh ở `validation.json` cuối. Scanner raw1finding/exit1 đã đối chiếu đúng literal RPC idempotency key synthetic,0secret thật; không sửa ignore list/rule. Chi tiết `security-evidence.json`.
Harness run đầu fail strict selector trùng Tên hiển thị; run tiếp interrupted khi locator link không khớp badge số. Sửa selector và giới hạn actionTimeout riêng audit, không đổi assertion/retry/skip regression. Run cuối đạt. Không cần CI remote mới vì C83 không được phép commit/push. Required CI C82 không dùng làm gate
cho thay đổi local C83. Không tuyên bố release mới hoặc chứng nhận toàn bộ Production.
