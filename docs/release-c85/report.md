# C85 — Phát hành UI/theme C83/C84

Trạng thái: IN_PROGRESS. OWNER phê duyệt ngày04/10/2026.

Phạm vi là checkpoint43 roadmap: source C83/C84, CI đúng SHA, root Preview pipeline,
Production candidate/public/Auth/runtime gate trước alias, hậu kiểm stable/default và rollback C82.
Không schema/RPC/remote secret/account/Google, financial submit/mark-read/push permission hoặc cleanup.

## Preflight đang thực hiện

- Lint, unit116, build và typecheck PASS; Node24.15.0/pnpm11.9.0. Máy có pnpm11.19 mặc định;
  dùng npm exec package pnpm11.9.0 với cache trong repository, không đổi global/dependency/lockfile.
- Secret scan pinned Gitleaks diff+tệp text mới: exit0/0finding. Hai literal fixture C83/C84
  trước đây đã chuyển thành UUID idempotency và credential sinh ngẫu nhiên chỉ trong memory của
  test local guarded C20-test. Không rule/ignore mới, không giảm test/assertion/skip/retries.
  Evidence C83/C84 raw2 là lịch sử trước thay đổi harness này, không sửa lại kết quả lịch sử.
- Full E2E local61PASS/12opt-inSKIP9,9m exit0; SQL hậu kiểm sáu bảng0, restore14ảnh C75
  generated exactHEAD. CI37195657702/d10c916 security/quality/policy/pgTAP/Auth PASS,
  E2E59PASS/13SKIP/1FAIL: page.evaluate context destroyed trong matrix. Harness ready(/login) có thể
  đo shell tạm trước authenticated streaming redirect vềdashboard; thêm chờ destination URL,
  không đổi runtime hoặc giảm assertion/retries/skip. Target C84 sau sửa7PASS1opt-inSKIP
  3,4m exit0, DB sáu counts0. Source198248bd3e1dcfb00598bce0b94fa3c9f65d88f2 đã push;
  CI37199726182 SUCCESS đúngSHA198248b mọi5jobs: unit116/Auth6/E2E60PASS13SKIP16,6m.
  Wrapper đã khởi động root Preview sau5jobs/exact-SHA SUCCESS;
  không dùng target local hoặc security job riêng thay Required CI.
- Local upload metadata guard:165regular files/4.329.225bytes/0forbidden; inventory remote
  chưa kiểm, không tải source/secret/dump bodies để xác minh.
- Remote read-only baseline xác nhận stable Preview C82 dpl_5nqKymiAGKqWGiVMz53B6yx5bfWM,
  Production/default C82 dpl_Gk37QbGPKqxohNNq4qorbHQ89Tiy READY trước tạo candidate.

## Giới hạn

C84 synthetic evidence bổ trợ các state không có dữ liệu remote. Không tạo dữ liệu QA trên
Supabase chung; OWNER tự login nếu thiếu phiên. Physical AT/mobile/authenticated Safari/Firefox
vẫn NOT_TESTED; remote OS-change chỉ kiểm khi browser hỗ trợ, không đổi macOS settings.
Không lưu ảnh/tiền/tên/ID/cookie thật vào Git hoặc log. C85 chưa hoàn tất.

## Candidates và việc đang chờ

Root Preview create exit0, mọi local gate đạt; full E2E61PASS12opt-inSKIP9,8m.
SQL hậu kiểm sáu bảng0, restore14ảnh C75 generated exactHEAD; runtime18file C84 unchanged.

| Target | Deployment | Immutable URL | Gate đã đạt |
| --- | --- | --- | --- |
| Preview | dpl_5J776moZkFH36QxFXFP1iYWxwztt | https://quan-ly-vay-ca-nhan-2wgem6s2u-ngotuong2105.vercel.app | Ready/project/43routeFunctions sin1/public4/4 |
| Production | dpl_DVxdAoBYZjpE7gEoFZEW8qc6RmPt | https://quan-ly-vay-ca-nhan-is7a4n3b9-ngotuong2105.vercel.app | Ready/project/43routeFunctions sin1/public4/4 |

Mỗi returned inventory156source+44lambda/0forbidden,156/156UID khớp CLI drySHA1;
11directory placeholders không có child entries. Middleware Preview sin1, Production8regions
bao gồm sin1; không đánh đồng middleware với43routeFunctions chỉsin1. Không tải file bodies.
Production --skip-domain exit0; inspect sauReady cả tindung/default vẫn C82, không cần rollback.
Stable Preview chưa chuyển. Chưa promote hoặc gọi root resume flag verified-authenticated-smoke.

OWNER xác nhận đã đăng nhập cảhai ngày04/10; cảhai dashboard thực render, KPI trước công việc,
không overflow trong mẫu quan sát. Settings cảhai có ba lựa chọn. Auth smoke đầy đủ chưa đạt: tab
Preview cũ timeout sau thao tác đóng bản nháp tài khoản chưa lưu, getJsDialog trả undefined; focus/
screenshot/close cũng timeout. Click theme ở tab mới chưa đổi preference. Nghi hộp thoại native
chặn input, chưa khẳng định nguyên nhân hoặc lỗi sản phẩm; OWNER đã được yêu cầu bỏ bản nháp.
Tab mới giữ phiên Owner và viewport390 áp dụng được; loại mẫu tab cũ sai viewport. Không gọi các
phép đo ban đầu là ma trận năm khổ PASS, chưa kết luận mất draft. Preference Preview đangTối cần
trả vềTheoThiếtBị khi input phục hồi; Production cònTheoThiếtBị. Không submit tài khoản/tài chính.
Giữ C85 IN_PROGRESS, full Auth/theme/draft/history/privacy/pagination/native/postcheck còn pending.
Không dùng public smoke hoặc local matrix thay Auth remote.
Sau login: kiểm immutable candidates, runtime rồi root Preview resume/Production promote,
Auth/public/logs stable/default, closing docs push/Required CI đúng closingSHA trước hoàn tất.

Pre-auth runtime CLI cảhai: error0/HTTP5000, chỉ lưu aggregate counts; chưa thay Auth/runtime
gate sau đăng nhập. Không cần rollback default khi candidate Ready vì inspect vẫnC82.

Hậu kiểm runtime sau Auth một phần: error0/HTTP5000 mỗi candidate, CLIexit0/counts-only.
Inspect ba alias trong lúc browser bị chặn đều vẫnC82; chưa promote/root resume/closingCI.

Gate tài liệu trạng thái partial: JSON/diff-check/CI policy/actionlint/secret scan diff+JSON mới
PASS(exit0). Không chạy lại full local vì không đổi runtime/harness; chưa commit/push closing docs
hoặc dùng CI source thay closingCI. Viewport override đã reset; tab/phiên giữ cho tiếp tục.

## Auth smoke tiếp tục sau OWNER đóng hộp thoại

Kết nối browser được khôi phục bằng binding mới/tab mới cùng phiên.120mẫu thực: hai candidate ×
sáu route dashboard/loans/counterparties/expenses/notifications/settings × năm khổ375/390/768/
1024/1440 × Light/Dark. Khổ/theme thực khớp yêu cầu;0overflow/clippedAmount/summary nhỏ, singleh1,
KPI trước công việc. Min contrast selected description/filter/theme labels5,793:1; expense empty
không có sample selected contrast, không chứng nhận toàn bộ contrast/target.15mẫu Preview bổ sung
(new-loan dark5, existing detail overview dark5, custom dashboard dark5). Helper mask ban đầu gộp
/loans/new vào/:id; đã tách, không gọi cả10 mẫu là detail hiện hữu.

Preview: native close confirm concurrent click/getJsDialog đạt cancel/open, accept/closed. Input
value bị công cụ redact; false equality không phải bằng chứng mất draft. Theme3mode/manual trái
deviceLight/keyboard, reload/SPA loading/cached Forward dark meta đạt. Paymentdrawer390dark date/
focus/Escape/return trigger đạt, không submit; detail4tabs đọc-only. Page99 ba module canonical,
unread/q giữ, no-match counterparty copy đạt. Expense distribution remote trống nên privacy dẫn
xuất NOT_TESTED, bổ trợ local C84. Preference trảsystem/hidden, console0. Runtime sau fullPreview
Auth error0/HTTP5000 CLIexit0. Đã bắt đầu root Preview resume đúng candidate, không tạo mới; pipeline
đang rerun gate bắt buộc, chưa ghi PASS/alias đã chuyển khi chưa exit0.

Production: matrix và3mode/manual/keyboard/close-cancel đạt. Khi kiểm nav từ account draft, input
focus timeout/getJsDialog undefined; cần OWNER bỏ tab draft để phục hồi. Chưa khẳng định lỗi app;
không submit account/finance. Fullhistory/drawer/privacy/pagination/custom/restore/postcheck còn
pending; preference đangDark cần trảsystem sau phục hồi. Chưa promote Production.

## Preview từng chuyển qua root pipeline, checkpoint còn IN_PROGRESS

Root resume exit0: lint/typecheck/unit116/build/E2E61PASS12opt-inSKIP9,9m. SQL read-only sau
teardown đúng C20-test55322 sáu counts0;14PNG C75 generated đã restore exactHEAD,18runtime files
không đổi. Stable tindung-preview.vercel.app inspect đúng dpl_5J776moZkFH36QxFXFP1iYWxwztt,
targetpreview/READY; public4/4. Auth read-only thật30mẫu6routes×5khổsystem/effectiveLight đạt
geometry/singleh1/KPI, Settings ba option có mặt; console0/runtimeerror0/HTTP5000. Cookie/session
alias có sẵn, không yêu cầu OWNER login lại.

Thao tác Dark ở stable chưa đổi preference trong khi confirm Production chặn input; không coi
read-only PASS là interactive PASS; chưa xác lập product failure. Hậu kiểm
interactive cònPENDING; rollback C82 vẫn giữ. Production/default chưapromote và vẫnC82 theo
inspect gần nhất. Không commit/push closing docs hoặc markC85COMPLETED vì fullProduction/Auth/
restore/promote/postcheck/closingCI chưa đạt. Cần OWNER đóng tab ProductionSettings chứa draft
chưa lưu, không cần approval mới; công cụ đã hiện browser và giữtab cho handoff.


## Trạng thái cuối phiên: Preview đã rollback C82

Hậu kiểm tương tác alias C85 không thể hoàn tất do native confirm Production chặn input.
Theo AGENTS4.1/runbook, trả stable Preview về deployment C82 đã xác minh, không giữ một alias
mới thiếu hậu kiểm. Đây là giới hạn kiểm chứng, không kết luận lỗi sản phẩm. Fresh inspect đúng
project/org/root/READY/targetpreview/Functions sin1 và ID dpl_5nqKymiAGKqWGiVMz53B6yx5bfWM;
rollback alias set exit0, inspect alias khớp ID. Public4/4 lúc2026-10-04T13:53:30.925Z đạt.
Native /settings có Auth, visible h1 Cài đặt,0consoleerror; C82 chưa có bộ chọn manual theme là
đúng baseline, không coi là regression C85. Runtime CLI exit0/error0/HTTP5000 sau rollback;
chỉ lưu số đếm, không giữ message bodies. Production/default vẫn dpl_Gk37QbGPKqxohNNq4qorbHQ89Tiy.

C85 IN_PROGRESS, candidates giữ nguyên. Full Production Auth/restore system và hidden, root
Preview resume/hậu kiểm tương tác mới, Production promote/aliases hậu kiểm và closing CI đúng
SHA còn pending. Không commit/push closing tài liệu hoặc mở C86. Viewport đã reset; giữ tab draft
Production để OWNER đóng/bỏ thay đổi và tiếp tục cùng phê duyệt hiện hữu. Không submit tài khoản,
tài chính, mark-read, push permission, remote DB/secret/Google hoặc xóa deployment.


## Production Auth bổ sung sau OWNER đóng tab thứ hai

Input/phiên Auth hoạt động lại trên fresh tab cùng hostname. Thêm10mẫu: custom dashboard và
existing detail overview ở375/390/768/1024/1440Dark đạt singleh1/geometry/KPI. ReloadDark, Back
đổiLight rồi Forwardcached giữ color-scheme/metaLight; ba mode/manual trái deviceLight đạt.
Expenses/page99 canonical, unreadtrue/page99 canonical giữfilter; counterparties q synthetic/
page99 canonical giữq và copy no-match đúng. Detail4tabs singleh1/0overflow. Drawer390Dark:
native dateDark/focusinside/Escapeclosed/return trigger đạt, không submit. Account dirty close
accept bằng confirm native và focussummary đạt; cancel/open đã đạt lượt trước. Exact typed
value redact và dirty-navigation native confirm trước đó bị chặn giữ NOT_TESTED remote, không
đổi thành PASS; full local C84/root gate kiểm navigation, không xác lập lỗi sản phẩm. Expense
phân bổ remote trống và OS theme-change không có capability vẫn NOT_TESTED với local bổ trợ.
Đã trả system/hidden, draftclosed, viewportreset và console0. Runtimecandidate0error/HTTP5000,
fresh provenance targetproduction/Ready/43routeFunctions sin1/middleware8regions đúng project.
Đủ candidate gate trong phạm vi state/môi trường khả dụng; promote/alias/fullpostcheck/closingCI
còn pending. Không submit tài khoản, tài chính, mark-read hoặc thay đổi cài đặt macOS.


## Rollout và hậu kiểm cuối đã đạt, chờ closing CI

Root Preview resume cuối exit0: lint/typecheck/unit116/build/E2E61PASS12opt-inSKIP10,0m.
Trong local reset có assertion transient của CLI được retry theo harness hiện hữu; cuối gate
và teardown đạt, không đổi retries/assertions/CLI. SQL guarded C20-test55322 sixcounts0;
14C75PNG generated restored exactHEAD,18runtimehashes unchanged. Stable Preview chuyển lại
C85 dpl_5J776moZkFH36QxFXFP1iYWxwztt qua rootpipeline. Final Auth tương tác3mode/reload/
cachedForwardmetadata đúngtheme, dashboard5khổ375/390/768/1024/1440KPIbeforetask, loans/detail/
drawer390Darknative date/focus/Escape-return đạt. Trước rollback có30readonlyroute-widthsamples,
final hậu kiểm tập trung các thao tác trước đó bị chặn, không lấy readonly thay interactive.

Production promote exit0, tindung vàdefault inspect đúng dpl_DVxdAoBYZjpE7gEoFZEW8qc6RmPt.
Tindung Auth Settings3mode/reload, six routes/dashboard5khổ/KPI, detail/drawer390Dark/focus/
Escape-return/page99/unread đạt. Default Auth3mode/reload/dashboard5khổ/loans/detail/drawer
đạt. Mọi alias public4/4, Ready/project/target/43routeFunctions sin1; middleware riêng
Preview sin1/Production8regions gồm sin1. Console0/runtimeCLIexit0/error0/HTTP5000 mọihost.
Preferences restore system; Preview/tindung hidden vàdefault visible như banđầu; viewportreset,
draftclosed. C82 rollback giữ nguyên, không cleanup. Ảnh vùng theme không chứa tên/tiền/ID
được xem để xác minh ba lựa chọn, chỉ nằm cache ignored, không ảnh tài chính vào Git.

Các giới hạn ghi trên vẫn giữ nguyên: native dirty-navigation Production NOT_TESTED remote
vì tool không đọc confirm, exactinput bị redact, expense distribution remote thiếu state,
OS theme-change không capability và physical AT/mobile/Safari/Firefox. Local C84/full root
regression bổ trợ; không coi đây là chứng nhận toàn bộ môi trường/remote save/business boundary.
Không có dữ liệu tài chính/tài khoản submit. C85 vẫn IN_PROGRESS cho tới khi closing docs đã
push và Required CI của đúng SHA đạt; không sử dụng source198248b CI thay closing CI.
