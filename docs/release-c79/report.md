# C79 — Rollout privacy/focus C78 và cleanup hai deployment C73

Trạng thái: COMPLETED ngày03/10/2026. OWNER phê duyệt trong hội thoại.
Closing docs phải có Required CI đúng final SHA trước completion message; SHA/run cuối được
báo trong hội thoại, không thay bằng source run hoặc ghi vòng tự tham chiếu vào commit.

Bản sửa privacy/focus C78 đã phục vụ trên Preview/Production. Card dư nợ/lãi ròng vẫn phía trên
Việc cần xử lý. Đã xóa đúng hai deployment C73 chứa source backup/test artifacts; giữ rollback C76.
Không đổi schema/RPC/secret/account/Google/dữ liệu tài chính. Browser thật chỉ thao tác read-only
và client privacy toggle; không save/mark-read/permission hoặc tạo QA account remote.

## Source và quality gate

Source phát hành `8c8a8843ed4ecf12063f398fb6f1736feeb0d606` đã push fast-forward. Required CI
[37097003400](https://github.com/ngotuong/quanlyvay/actions/runs/37097003400) SUCCESS mọi5job:
Dependency/secret scan, Workflow policy, Quality/build, Supabase Auth pgTAP/E2E, Required CI gate.
pgTAP527, Auth6, E2E50PASS8SKIP (7audit opt-in,1timeout cần named local container); timeout case
vẫn chạy trong local full51PASS7SKIP. Không nâng gói GitHub/Vercel hoặc bỏ security gate.
Root Preview initial/resume lint/typecheck/unit105/build/full E2E51PASS7SKIP đều đạt; resume6.9m
exit0. Teardown DB riêng55322 profiles/loans/transactions0/0/0. Chỉ4PNG synthetic C75 do harness
resume ghi lại được restore về source trước test; không hoàn nguyên thay đổi khác.
CI policy/actionlint/dependency audit/history Gitleaks146 trước rollout đạt. Closing docs JSON/
CI policy/actionlint/Gitleaks/diff-check đạt; full runtime tests không chạy thêm riêng cho docs,
full integration sẽ được kiểm trên đúng closing SHA trước báo hoàn tất.

## Candidates và aliases

| Target | Deployment / immutable URL | Alias |
|---|---|---|
| Preview | dpl_CZj4ehKjxCmzc4VazPcMfr87eLbs / https://quan-ly-vay-ca-nhan-abk6l77md-ngotuong2105.vercel.app | https://tindung-preview.vercel.app |
| Production | dpl_8x3Fy2rW6detxLGbsmrGSEqjhkyG / https://quan-ly-vay-ca-nhan-h8muagbnq-ngotuong2105.vercel.app | https://tindung.vercel.app và https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app |

Cảhai Ready/đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, scope ngotuong2105,
Rootapps/web, target tương ứng.43route Functions chỉ sin1; descriptor thứ44 là middleware,
Preview sin1 và Production8regions gồm sin1. Không gọi44route Functions đều độc quyền sin1.
Preview được tạo/resume chỉ qua root `pnpm deploy:preview`; Production root `--target=production
--skip-domain` rồi promote sau candidate gates. Alias inspect đúng IDs; promote/root resume exit0.
Default alias fresh API đã C79 sau baseline C76 trước candidate Ready; không suy actor/trigger
của chuyển alias từ metadata. Default được public/Auth/log kiểm độc lập trước cleanup.

APIreturned src/out metadata mỗi194leaves:150source regular+44lambda descriptors,0forbidden
filenames;150/150source UID khớp SHA1 CLI dry metadata của source đã kiểm.11directories không
child entries không tính là backup/test files. Dry150files/4.246.478bytes chỉ dự báo, không thay
inventory thật. Không tải remote source/dump/bundle bodies; generated static CDN objects/bundle
contents không được enumerate/kiểm độc lập bằng API này. Không chứng minh mọi contents/cache sạch.

## Auth, privacy và hậu kiểm

OWNER tự login hostname thiếu phiên; Preview stable dùng session hiện hữu. IAB Chromium dùng
DOM/AX/read-only và screenshot inline, không extract credential/cookie hoặc lưu ảnh thật vào Git.
Candidates375/390/1440 light/dark (12mẫu) actual width/darkMedia khớp:axis3labels masked khi ẩn,
hidden controls/tooltips0, money aria/title leak0; hiện lại axis/bars phục hồi, Escape→Enter mở
tooltip rồi ẩn gỡ controls/tooltip. KPI trên task, overflow0. Light eager-focus cycles Preview3/
Production4 và390Dark cảhai:close initial focus, ShiftTab/Tabwrap, Escape/return sau đóng đạt;
không thêm chờ trước eager keyboard. Native dialog hidden được đợi sau180ms close animation.

Dashboard range empty và populated, loans/list/detail overview/interest, settings truy cập thật.
Preview1-period summary và cảhai3-period chart được hiện rồi gỡ khi ẩn; money attributes không lộ.
Các period boundaries khác remote NOT_TESTED, C78 local1/2/3/12+empty matrix bổ trợ, không tạo
fixture remote. Stable aliases sau promote Dark375/390/1440 privacy/KPI/focus/loan3period/console
đạt. Default390Dark privacy/tooltip/KPI/focus/console đạt. Sau cleanup cả3alias Auth/dashboard/
axisMasked/KPI/overflow được kiểm lại. Public mỗi candidate/alias4/4:login/manifest200, export/
runner không secret401. Console errors0; runtime --since1h error/HTTP500 mỗi candidate0, queries
exit0 sau full candidate Auth, alias Auth và cleanup. Không cần rollback.

Giữ C76 rollback Preview `dpl_BBavYTasgvQ51wyTQbWunqysM6Fq` và Production
`dpl_AurpzZ3pUxe7Xp7dWnxuWa2fjXxw`, Ready/project/target/43route sin1, public4/4 sau cleanup.
C76 metadata có hai benchmark SQL UID khớp files operational tracked:known exception của C76,
không backup/dump và không gọi strict C78guard0forbidden. Generic helper default sourceSha C79
trên rollback được bỏ khỏi evidence:ID/provenance không chứng minh C76sourceSHA. Không dùng C73
artifact deployment làm rollback; C76 giữ UI cũ khi rollback là giới hạn đã biết.

## Cleanup đúng hai C73

Fresh project/org/target/Ready, all aliases paginationNextnull, scoped inventory và C76 rollback
trước xóa đạt. Cả3stable/default alias đã C79 và Auth/log đạt; hai C73 không serving alias,
không dùng rollback. CLI `vercel remove --safe --yes` từng ID, scope ngotuong2105:

- Preview `dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb`:exit0,removed1.
- Production `dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx`:exit0,removed1.

Sau xóa hai ID absent scoped inventory, inspect notfound, List Deployment Files API404;
URLc6pft4h1k/7g0uxlwrm login404 DEPLOYMENT_NOT_FOUND. Source metadata không còn truy cập được
qua endpoint đã kiểm. Cả3alias và C76rollback public20/20, Ready/Auth/runtime đạt; branch alias
khác và các deployment khác giữ nguyên. F3 đóng trong scope hai deployment; không tuyên bố đã
purge mọi provider internal cache/backup hoặc bản sao bên ngoài. Không bulk deletion/retention,
không tải ciphertext/manifest/log body cũ, không xóa backup local.

## Blocker/harness đã xử lý và giới hạn

Source trước `fdc309faea457dab6fdff1b5c05ef3b6decf14f0`, CI37095805773 đạt nhưng Production
`dpl_FQzWmo7sohL4Bv9XHJWdyw8WpTBQ` ERROR TS2307 ở test/e2e/helpers.ts do scripts excluded
mà test/config còn upload. Trong scope packaging C79, loại thêm apps/web/test và Playwright
config, cập nhật guard contract/fixtures; không giảm tsconfig/typecheck hoặc đưa SQL/secret lại.
Candidate lỗi giữ nguyên, chưa từng dùng stable/rollback, không mở rộng deletion. Compiler
snapshot theo metadata SHA1 trước181files fail TS2307, sau150files typecheckPASS. Optional full
Next snapshot thất bại font/import-map/TTY symlink harness, không lấy làm gate xanh; hai actual
Vercel Ready builds chứng minh payload build sau exclusion.

Root chain đầu bị interrupt khi phát hiện packaging; server con của ownC79 còn port3101 khiến
retry fail. Xác minh PID43784/cwd/PGID43755 và dừng đúng nhóm, rerun full gate đạt; không bật
reuseExistingServer/bỏ gate. Inactive Preview tab retained361px dù viewport applied selected
Production; discarded breakpoint samples, foreground QA actual widths xác minh. Dark perwebview:
newQA tabs vẫnlight; discarded asDark evidence, OWNER chọn originalDarktab và đo lại6mẫu đạt.
Đọc returnfocus trước180ms đóng và quick reopen chưa có link là measurement chưa settled; đợi
native dialog hidden rồi repeated eager cycles đạt. Tooltip active state giữ qua privacy toggle,
Escape reset trước Enter. Backend browser ID đổi sau human turn, rebind existing inventory tab;
old helper viewport closure stale được thay bằng capability hiện hành. Alias login privacy shown
được đặt hidden trước matrix; no-matching-toggle không suy product regression.

Chrome badge lịch sử C73 nguyên nhân OPEN; native Chrome post-login C79 chưa kiểm, không suy
password toàn số/false positive hoặc đóng warning. Safari/Firefox/VoiceOver/TalkBack/mobile vật
lý vẫn NOT_TESTED. Không yêu cầu OWNER học VoiceOver, không bypass warning/security settings.
Evidence JSON không chứa money/name/loanUUID/credential hoặc ảnh thật. Bằng chứng:
`evidence.json`, `source-ci-evidence.json`, `upload-dry-evidence.json`.

C80 AWAITING_APPROVAL: audit UX Production và2phương án desktop compact bằng dữ liệu giả,
không sửa sản phẩm/remote. Scope/acceptance roadmap mục38; chưa bắt đầu và dừng chờ OWNER.
