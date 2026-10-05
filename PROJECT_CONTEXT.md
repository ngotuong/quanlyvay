---
project: QuanLyVayCaNhan
roadmap_version: 1.0.296
last_updated: 2026-10-05
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C88
current_status: IN_PROGRESS
last_completed_checkpoint: C87
next_checkpoint: C88
---

# Project Context

Tệp này chỉ chứa trạng thái hiện hành để handoff. Chi tiết checkpoint đã hoàn tất nằm trong Git
history, migration, test và các contract/runbook chuyên biệt.

## 1. Trạng thái hiện tại

- Checkpoint hiện tại C88 `IN_PROGRESS`: OWNER phê duyệt ngày05/10/2026 trong hội thoại.
  Đang kiểm source/upload, đồng bộ C86/C87, exact-SHA Required CI và rollout Preview/Production
  theo roadmap section46. Local C88 lint/typecheck/unit117/build/full E2E63PASS15opt-inSKIP
  exit0, policy/audit/diff/Gitleaks PASS; DB C20-test55322 sáu counts0/C75 restored/runtime12hash
  khớp C87. Đang đồng bộ source rồi chờ exact-SHA CI; aliases giữ C85 đến khi candidate đạt.
- C87 `COMPLETED` local ngày05/10/2026: OWNER phê duyệt B. Đã áp G1–G5 với Evon ui-ux:
  canvas/sidebar navy/KPI cobalt, body16/nhãn14/KPI18–24, control phụ/toggle header44px,
  branded startup/visible SPA feedback và top pagination Chi phí. Giữ logo/Inter/status,
  KPI trước công việc, đầy đủ VND; không đổi authoritative/RPC/schema/Auth/session.
  Final lint/typecheck/unit117/build19/full E2E64PASS14opt-inSKIP15,1m exit0; diff/secret scan
  đạt, không giảm assertion/retries. 88samples375/390/768/1024/1440 Light/Dark, gồm18stress
  bigint/âm/tên200:0overflow/clipped,1visibleh1;18before cùngDB/fixture/theme/width.
  Evon vòng3:8probe/56fixed+220Light sweep,6rawP đã đối chiếu falsepositive:4tooltip opacity0
  (khi hiện15,962/14,588:1),2closed-details không painted; open form44px/1line. Giữ raw/log/history.
  Startup Auth2/10s93–134ms, TTFB3,2–9ms local; SPA1800/cancel/reduced-motion đạt. Top pager
 375/390 y193,39px,scroll0→0,page2 25→1/BackForward; footer/count/canonical giữ nguyên.
  C81 budgets460/700/160 và C72 nav-clearance đạt. Lượt đầu full59PASS15SKIP4FAIL và targeted
 3PASS1FAIL được giữ; hai lượt dừng trước capture không gọi gate xanh. Sửa specificity chữ
  dashboard/thông báo trước vòng3, final12runtime hashes khớp qua gate.
  SQL đúngC20-test55322 verifiedlabel/port sáu counts0;17C75files restore exact baseline,
  C86 artifacts/harness hashes bảo toàn. Review HTTP22/22 và native5khổ10ảnh0broken/overflow;
  viewportreset. Report/review/validation/probe reconciliation ở docs/remediation-c87/.
  Không commit/push/deploy/remote finance/account/mark-read/push permission/secret/Google/
  cleanup. Không blocker local; cold trướcHTML/PWA/mạng native,AT/mobile/Safari/Firefox thật
  và rollout C87 vẫn NOT_TESTED. C88 chờ duyệt, dừng theo AGENTS mục3.
- C86 `COMPLETED` ngày05/10/2026, OWNER phê duyệt và yêu cầu soi nền trắng/chữ nhỏ/control
  phụ lớn/cold-start. Evon nhánh V,36hành trình6×375/390/1440×Light/Dark đạt functional;
 5đề xuất Gu/UX MEDIUM có đo/file/cause/impact/fix, không gọi font/brand là lỗi nghiệp vụ.
  Remote sáu nhóm route tại390 và12sample dashboard/loans375/390/1440 Light/Dark đúng viewport
  đạt geometry0overflow; các sample nhắm sai active-tab đã loại rõ, giữ raw. Không dirty-edit
  remote; expense remote empty không distribution/page2, giữ NOT_TESTED với local bổ trợ.
  H1/return/search/query/close/dirty-discard/empty/filter/BackForward/radio-arrow đạt local.
  Startup delay Auth2000ms final fallback60/75ms resolve2398/2340ms, SPA1800ms feedback đạt;
  cold trướcHTML/network/PWA/physical AT/mobile/Safari/Firefox vẫn NOT_TESTED. Không kết luận
  loading không tồn tại. Gu: body nền/card1,07:1, KPIlabel13/number16mobile, control phụ16/750/
  toggle324×46, expense25rows body5386px chỉ footer pager. Hai prototypeA/B +startup fake,
 20sample5khổ×2theme×2variant0overflow/clipped/KPI-before-task/singleh1/fontload.
  App4Evon28fixed+110sweep, raw2P tooltipopacity0 falsepositive: supplement khi hiện đạt
 17,74/16,96:1; loại có bằng chứng, không đổi probe/rule/ignore. Prototype4Evon28fixed+110sweep
  cuối0P; các lượt clipping/tiny-Mở và harness-unroute FAIL giữ lịch sử/report.
  Final C86 opt-in2/2PASS2,8m (main36+4app probe+supplement), lint/typecheck/buildE2E/JSON/JS/
 19HTTPlinks/diff/Gitleaks pinned artifacts+diff PASS. DB C20-test55322 verifiedlabel/port:
  profiles/loans/transactions/counterparties/notifications/authUsers six counts0 sau teardown.
  Production System/ẩn tiền/dialog0/viewportreset/consoleerror0; chỉ đóng agent-created tabs.
  Report/matrix/prototypes/ảnh fake tại docs/audit-c86/, harness c86-audit.spec.ts. Runtime/src
  không đổi so với198248b và HEAD9813a6b; không commit/push/deploy/remote finance/account/
  mark-read/pushpermission/schema/RPC/secret/Google/backup/cleanup. Lúc chốt C86 đề xuất C87 chờ duyệt; đã hoàn tất local ở trên.

- C85 `COMPLETED`: OWNER phê duyệt ngày04/10; release C83/C84 đã qua candidate,
  hậu kiểm Preview/Production/default và closing proof Required CI đúng SHA.
  Source198248bd3e1dcfb00598bce0b94fa3c9f65d88f2 đã push; Required CI37199726182 SUCCESS5jobs.
  Local/root create/resume lint/typecheck/unit116/build/E2E61PASS12opt-inSKIP; root resume cuối
  exit0/10,0m, không giảm assertion/retries hoặc đổi CLI/CI. Test SQL đúng C20-test55322
  sáu counts0,14C75PNG generated restored exactHEAD,18runtime source hashes unchanged.
  Preview dpl_5J776moZkFH36QxFXFP1iYWxwztt /
  https://quan-ly-vay-ca-nhan-2wgem6s2u-ngotuong2105.vercel.app,
  alias https://tindung-preview.vercel.app qua root pnpm deploy:preview.
  Production dpl_DVxdAoBYZjpE7gEoFZEW8qc6RmPt /
  https://quan-ly-vay-ca-nhan-is7a4n3b9-ngotuong2105.vercel.app,
  aliases https://tindung.vercel.app và https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app.
  Candidates/aliases Ready/đúngproject/43routeFunctions sin1; middleware Preview sin1,
  Production8regions gồm sin1. Candidate inventory156source+44lambda/0forbidden/156UIDmatch;
  chỉ metadata, source/bundle bodies NOT_TESTED. Mọi candidate/alias public4/4 và Auth/runtime
  error0/HTTP5000. Auth matrix120mẫu6routes×5khổ×2theme/haihost; thêm Preview15/Production10,
  singleh1/geometry/KPI trước Việc cần xử lý, selected mincontrast5,793:1 đạt trong mẫu.
  Theme3mode/manual trái deviceLight/keyboard/reload/cachedhistory/meta,4detailtabs/page99/
  filters/empty,390Darkdrawer date/focus/Escape/return đạt. Draft closecancel cảhai/accept cảhai
  đạt; exact input value redact và dirtynav Production native tool block NOT_TESTED remote,
  local C84/root regression bổ trợ. OS themechange/expense distribution thiếu remote state,
  physical AT/mobile/authenticated Safari/Firefox vẫn NOT_TESTED, không gọi là product fail.
  Hai confirm từng chặn input cần OWNER đóngtab; Preview từng rollbackC82 do thiếu hậu kiểm,
  provenance/public/Auth/log rollback đạt. Sau OWNER đóngtab thứhai, input phục hồi; final
  root resume/public/Auth interactive/cachedhistory/drawer/nămkhổ dashboard Preview đạt.
  Production promote exit0; public/Auth Settings3mode/reload/routes/drawer/nămkhổ KPI đạt;
  default Auth3mode/reload/dashboard/loans/detail/drawer đạt. Console/runtime/HTTP5000 mọihost.
  Preferences trảsystem, Preview/Production che tiền, default giữhiện như banđầu; viewportreset,
  draftclosed. Không submit finance/account/mark-read/push permission, schema/RPC/secret/Google/
  cleanup. C82rollback giữ nguyên. Docs JSON/diff/secret/policy/actionlint PASS; closing proof
  b568caeb2f83da5eae6787845652c728537aa48b/CI37213927772 attempt2 SUCCESS5jobs đúng SHA;
  Bằng chứng lịch sử: closing proof b568cae/CI37213927772 attempt1 FAIL: E2E59PASS/
  13SKIP/1FAIL17,8m, expense read error rồi matrix inline-reversal locator timeout240s vị trí200.
  Không có RPCcode/status để xác lập nguyên nhân; không kết luận harness/gateway/app failure.
  Rerun failed jobs attempt2 cùngSHA SUCCESS: E2E60PASS13SKIP15,4m/pgTAP527/Auth PASS;
  không đổi assertion/skip/retries/runtime.13SKIP gồm12opt-in+C72SQL-lock local-only covered.
  Final status9813a6b/Required CI37217274995 SUCCESS5jobs đúng SHA đã xác minh; Git sạch/main=origin.
  Report/bằng chứng docs/release-c85/ giữ cả raw failures/giới hạn.
- C84 `COMPLETED` local ngày04/10, OWNER duyệt phương án A trong hội thoại: sửa F1–F7/L1,
  bộ chọn Sáng/Tối/Theo thiết bị ở Cài đặt mọi vai trò, cookie từng hostname và SSR/manual/
  system/no-flash; compact đối tác/chi phí, menu44px, phân bổ thu gọn/không dẫn xuất khi che.
  Canonical pagination/count/filter, pending dismiss, account dirty/error/retry/close/focus/
  password memory-only đạt. Không đổi Server Actions Auth, quyền, RPC/schema hoặc quyết toán.
  Literal color-scheme inherit bị CSS build đổi thành normal; dùng token native cho dialog/date.
  Cached SPA history khôi phục meta cũ đã sửa bằng đồng bộ head với preference, chỉ ghi khi
  khác/cleanup observer. Critical2/2 PASS2,0m; source cuối lint/typecheck/unit116/build/full
  E2E61 PASS12 opt-in SKIP10,7m/exit0.12SKIP:11audit/evidence cũ + Evon đã chạy riêng;
  không giảm assertion/retries. Raw chẩn đoán/lượt FAIL giữ trong report, không coi là PASS.
  90samples375/390/768/1024/1440×Light/Dark:70route-requests (Auth/login vềdashboard),
  10unbroken expense trang2 và10reversal mở; overflow/clipped/amount/summary target0.
  Min normal5,397/large6,702/focus5,169:1 trong mẫu; manual trái OS/cookie/no-JS/blocked/
  history/meta/startup/native/draft, create/reset local và VIEWER boundary đạt.
  Evon40fixed+220sweep/8probe qua3vòng hình, raw4P loại có lý do (closed-details/selected-filter).
  Sau đó chỉ native/cached-head functional fix, không thêm vòng Gu; source cuối có ảnh và
  rendered gate riêng. Review40ảnh/42HTTP200/CUA5khổ0broken/overflow, viewport reset.
  DB55322 đúngC20-testSQL profiles/loans/transactions/counterparties/notifications/authUsers0;
  14ảnh C75 generated restore exactHEAD (ban đầu sạch), C83 local bảo toàn. Gitleaks pinned
  raw2/exit1 reviewpublic fixture id/password,0OWNER/Production/external credential; không
  đổi rule/ignore. CI/source-release chưa chạy, review local không thay exact-SHA CI C85.
  Report/review/JSON/26PNG/8log `docs/remediation-c84/`, unit/E2E C84 và C20/C64 locator cập nhật,
  DESIGN_SYSTEM/USER_GUIDE theo contract. Không commit/push/deploy, remote finance/account/
  push permission/Google/schema/secret/cleanup. HEAD/origin tracking vẫn2d040e9f3c41cdbdc043a2c446153140f7b9f95e.
  Không blocker local; physical AT/mobile/authenticated Safari/Firefox/Production C84 NOT_TESTED.
- C83 `COMPLETED` local ngày04/10/2026, OWNER phê duyệt trong hội thoại: audit với Evon ui-ux,
  130mẫu module/state Light/Dark5khổ,20mẫu unbroken text hợp lệ,40Evon fixed+220sweep.
  7finding(F1–F5/F7MEDIUM,F6LOW),1Lệch hệ,3Gu; lỗi page99/pending-close/editor và settings
  draft, contrast, privacy phân bổ, tỷ lệ floor, tràn chuỗi120/500/80 đã có bằng chứng.
  Production20mẫu Light chỉ đọc/0overflow/0consoleerror và page99notification lỗi tải tái hiện;
  không save/mark-read/account/push permission hoặc ảnh/tên/tiền/ID/cookie thật vào Git.
  Dark Production C83/physical AT/mobile/authenticated Safari/Firefox NOT_TESTED; local Dark
  không thay bằng chứng remote. App media-only, theme-spec đề xuất manual/system/persistence/
  no-flash/keyboard, chưa implement. Hai prototype A/B80mẫu+20stress0overflow/0clipped,
  final Evon50fixed+55sweep0P, image/linkHTTP18/18 và CUA deliverable mở được.
  App probe9P(7Light/2Dark):7vàoF4,2loại selected-filter báo nhầm có lý do; không giấu P.
  Audit chính1PASS4,8m, supplement1PASS2,3m, C63/C67/C72/C75 regression22PASS4,1m;
  lint/typecheck/build qua webServer/diff/JS/JSON đạt. DB55322 C20-test0/0/0verifiedSQL.
  Sáu ảnh C75 harness sinh đã restore chính xác HEAD. Gitleaks pinned raw1/exit1 là literal
  RPC idempotency key synthetic ở harness178; review0secret thật, không đổi rule/ignore list.
  Báo cáo/spec/JSON/ảnh/review `docs/audit-c83/`, harness `c83-audit.spec.ts`.
  Không blocker thực hiện C83; findings chờ C84, không sửa runtime/schema/RPC hoặc remote,
  không commit/push/deploy. Git HEAD/origin vẫn2d040e9f3c41cdbdc043a2c446153140f7b9f95e.
- C82 `COMPLETED` ngày04/10, OWNER duyệt03/10: source
  8ecdeb4ac5960673958ec2c75d597d1fdb1375c5 đã push; Required CI37171480847 SUCCESS cả5jobs,
  unit113/pgTAP527/Auth6/E2E53PASS10SKIP12,7m.10SKIP gồm9evidence opt-in và1SQL-lock C72
  local-only đã PASS full local. Lint/typecheck/unit113/build/full local54PASS9SKIP7,8m;
  root Preview resume54PASS9SKIP8,0m exit0, DB55322 C20-test teardown0/0/0. Không giảm
  assertion/retries hoặc đổi CI workflow/CLI. Sửa harness hook300s, capture sau functional
  checks và guarded gateway refresh sau reset; không thay runtime C81 hoặc health180s.
  Preview dpl_5nqKymiAGKqWGiVMz53B6yx5bfWM /
  https://quan-ly-vay-ca-nhan-a9a3nuj8p-ngotuong2105.vercel.app, target preview,
  alias https://tindung-preview.vercel.app qua root pnpm deploy:preview.
  Production dpl_Gk37QbGPKqxohNNq4qorbHQ89Tiy /
  https://quan-ly-vay-ca-nhan-g2w3dh0i0-ngotuong2105.vercel.app, target production,
  aliases https://tindung.vercel.app và https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app.
  Candidates/aliases Ready, đúng project prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F,
  43routeFunctions sin1; middleware riêng Preview sin1/Production8regions gồm sin1.
  Mỗi candidate returned metadata151source+44lambda,0forbidden regular filenames,
  151/151UID khớp dry SHA1;11directory placeholders không có child entries.
  Static/bundle/source bodies NOT_TESTED, không tải secret/dump. Public4/4 mỗi host;
  Auth candidates168mẫu Light/Dark375/390/1440 đạt default/custom/KPI-before-task/
  privacy/restore/keyboard/loans/detail4tab singleh1/2form guards/drawer escape-focus.
  Preset/custom date keyboard URL đạt. Stable Preview/Production Auth dark375/390/1440
  dashboard và390guards/loans/detail4tab, default390 privacy/drawer/focus đạt.
  Browsererror/runtimeerror/HTTP5000 sau candidate/aliases. Không submit/mark-read/push
  permission; không đưa amount/name/recordID/cookie/ảnh thật vào Git. CUA timeout đã bỏ,
  rerun nhỏ đạt; viewport reset. Production skip-domain từng tự chuyển default alias,
  đã rollback riêng default vềC79 trước Auth; final promote/hậu kiểm đủ đạt, không cần
  rollback cuối. C79 Preview/Production rollback vẫn giữ, không cleanup.
  Required CI37179819051 của closing SHA1492fe0b0fdb7dc73a2dc50978978d933671fd19 SUCCESS cả5jobs.
  JSON/script-syntax/CI policy/actionlint/diff/Gitleaks pinned PASS. Final closing
  SHA2d040e9f3c41cdbdc043a2c446153140f7b9f95e có Required CI37180794295 SUCCESS đúng SHA;
  API read-only xác nhận lại04/10. Không còn closing C82 đang chờ.
  Không schema/RPC/remote data/secret/account/Google mutation. Remote save/error/business
  boundary và physical AT/mobile/Safari/Firefox không được chứng nhận; chi tiết và lịch sử
  gate tại docs/release-c82/report.md và evidence.json. Không blocker release còn mở.
- C81 `COMPLETED` local03/10: OWNER duyệt A, kết hợp Evon ui-ux. Dashboard gọn, KPI vẫn trên
  task ở6khổ×2theme; reference C80 task1440 527→456,53px và390 811→697,42px. Loan row thường
 1440 154,16px≤160, mobile giữ card/số tiền nguyên dòng; trạng thái/hướng/0/tiền tỷ/tên200
  và filter/sort/page/returnTo/quick action đạt. F1 copy D–D+30 đúng lịch nhắc, F2 explicit
  privacy guard trước hai form, F3 single record h1, F4 one hidden chart notice/restore.
  C75 full đầu phát hiện scroll383px do fixed nav che toggle; sửa focus reveal trong
  attention-items, giữ nguyên assertion. Target C75 3/3 PASS; full cuối54PASS/9SKIP8,3m exit0,
  unit108/lint/typecheck/build/diff/secret scan đạt.9SKIP là capture opt-in (7cũ+C80+Evon C81),
  không skip regression C63/C72/C75/C78/C81.78mẫu functional và4probe cuối0P,28fixed/110sweep,
  manual breakpoint/light/dark/hidden review. DB55322 teardown profiles/loans/transactions0.
 6ảnh C75 do harness ghi khác đã restore đúng HEAD, không hoàn nguyên thay đổi OWNER.
  Report/JSON/ảnh/review docs/remediation-c81/. Không blocker local; chưa commit/push/deploy,
  không đổi schema/RPC/remote data/secret/account/Google. C80 local được bảo toàn.
  Native IAB HTTP review timeout/file protocol bị policy chặn; HTML/ảnh và headless picker/
  image-load PASS, không vượt policy. Physical AT/mobile/Safari/Firefox/Chrome warning vẫn
  chưa chứng nhận; shared Gu ngoài scope ghi rõ trong report. Production vẫn C79.
- C80 `COMPLETED` local03/10: OWNER phê duyệt audit, bổ sung dùng Evon ui-ux.33mẫu Production
  light chỉ đọc,78mẫu app local375/390/1440 light/dark,56mẫu mockup7khổ×2theme×4route,
  4sweep light55mẫu/route;8probe runs final0P và manual review fixed/breakpoint.2MEDIUM:
  copy gọi lịch nhắc thành giao dịch/tháng này; drawer privacy hướng tới nút ngoài modal.
  2LOW: detail mobile hai h1;26placeholder chart hidden (Gu). G1/G2 là đề xuất mật độ;
  không mở lại C78 privacy/focus đã đóng. Hai phương án dashboard+loans HTML, A khuyên dùng,
  dữ liệu/ảnh giả. Report/evidence/review ở `docs/audit-c80/`; nguồn/lỗi/ảnh/gate/giới hạn rõ.
  21regression PASS; audit đầu fail cookie setup, sửa harness rồi1/1 PASS1.8m/78mẫu.
  Lint/typecheck, JS/JSON, ci:validate(policy/actionlint), diff/Gitleaks pinned PASS;
  DB55322 profiles/loans/transactions0. Manual render phát hiện KPI bóp tiền ở1020px đã sửa
  trong mockup;0clippedKpiAmounts, không tràn và KPI trước task. Bốn ảnh C75 harness sinh
  lại đã restore đúng HEAD. Không runtime/schema/RPC/remote/account/secret/commit/push/deploy.
  Production dark C80/physical AT/mobile/Safari/Firefox/Chrome warning NOT_TESTED/OPEN;
  local dark không thay bằng chứng remote. Viewport test đã reset, không yêu cầu học VoiceOver.
- C79 `COMPLETED`03/10: source `8c8a8843ed4ecf12063f398fb6f1736feeb0d606` push fast-forward,
  Required CI `37097003400` mọi5job PASS (pgTAP527/Auth6/E2E50PASS8SKIP). Packaging fix exclude
  test/Playwright config sau TS2307 không giảm gate local/CI hoặc đổi UI/nghiệp vụ.
  Preview `dpl_CZj4ehKjxCmzc4VazPcMfr87eLbs` /
  <https://quan-ly-vay-ca-nhan-abk6l77md-ngotuong2105.vercel.app>, target preview, Ready,
  alias <https://tindung-preview.vercel.app>. Production `dpl_8x3Fy2rW6detxLGbsmrGSEqjhkyG` /
  <https://quan-ly-vay-ca-nhan-h8muagbnq-ngotuong2105.vercel.app>, target production, Ready,
  alias <https://tindung.vercel.app> và default <https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app>.
  Đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`,43route Functions sin1; middleware riêng
  Preview sin1, Production8regions gồm sin1. Returned src/out metadata mỗi150source+44lambda,
  0forbidden filenames,150/150source UID khớp dry SHA1; không tải source/dump/bundle bodies.
  Candidates Auth light/dark375/390/1440 privacy axis/tooltip/accessible money/KPI/focus PASS;
  KPI dư nợ/lãi ròng ở trên Việc cần xử lý. Stable aliases Auth dark375/390/1440 và default390dark
  PASS; loan1-period summary Preview và3-period chart cảhai/aliases hidden/restore, settings
  routes thực đã kiểm. Public4/4 từng candidate/alias; console/error/HTTP5000 sau Auth/promote/
  cleanup. State khác thiếu remote giữ NOT_TESTED với C78local boundary matrix bổ trợ.
  Root Preview resume full lint/typecheck/unit105/build/E2E51PASS7SKIP6.9m exit0, DB55322 về0/0/0;
  restore đúng4ảnh synthetic C75 do harness ghi. Production promote exit0, Preview root alias
  exit0, không cần rollback. OWNER tự login các hostname thiếu phiên, không extract credential.
  Cleanup CLI --safe từng ID đúng C73 Preview `dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb` và Production
  `dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx` exit0/removed1 mỗi lệnh sau aliases/Auth/log gate.
  Hai ID absent inventory, inspect not-found, source file API404, immutable URLs404
  DEPLOYMENT_NOT_FOUND. F3 đóng theo scope hai deployment; không tuyên bố purge mọi cache/copy.
  Rollback C76 Preview `dpl_BBavYTasgvQ51wyTQbWunqysM6Fq` và Production
  `dpl_AurpzZ3pUxe7Xp7dWnxuWa2fjXxw` vẫn Ready/public4/4; không xóa deployment khác/backup local.
  C76 có hai benchmark SQL source UID khớp tracked files (known operational exception), không
  gọi strict C78guard0forbidden. Failed candidate `dpl_FQzWmo7sohL4Bv9XHJWdyw8WpTBQ` giữ nguyên.
  Không schema/RPC/secret/account/Google/dữ liệu tài chính thay đổi. Physical AT/mobile/Safari/
  Firefox và post-login native Chrome badge chưa chứng nhận; lịch sử warning nguyên nhân OPEN.
  Closing docs JSON/CI policy/actionlint/Gitleaks/diff-check PASS; closing SHA5ad7b77 có Required
  CI37109057462 SUCCESS cả5jobs, main=origin/main lúc startup C80. Không dùng source run thay
  closing CI. Report/evidence docs/release-c79/.

- C78 `COMPLETED` local03/10: che ba nhãn trục tiền bằng PrivacyAmount, bỏ rAF ghi đè focus menu,
  hủy timer khi reopen/navigation; thêm metadata upload guard fail-closed vào root pipeline.
  `.vercelignore` loại trừ scripts SQL và cache/backups/tmp lồng, không đọc secret/dump bằng guard.
  KPI dư nợ/lãi ròng vẫn trên Việc cần xử lý. Lint/typecheck/unit105/build/full E2E51PASS7SKIP,
  diff/secret scan đạt; DB55322 profiles/loans/transactions0. Không commit/push/deploy/remote mutation.
  Report/ảnh synthetic tại `docs/remediation-c78/`. F1/F2 đã sửa local; F3 remote C73 vẫn OPEN.
  Production vẫn bản C76, không lấy gate local làm bằng chứng rollout hoặc remote inventory sạch.

- C50 `COMPLETED` ngày 2026-09-22: đã bỏ C38 khỏi roadmap hiện hành và rollout C49 lên
  Production. Candidate `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC`, URL bất biến
  <https://quan-ly-vay-ca-nhan-nqhmlw9kq-ngotuong2105.vercel.app>, target Production,
  `Ready`, Functions `sin1`. Public smoke `/login`, manifest và route khoản vay đạt.
  Authenticated smoke trên khoản vay Ngân ở viewport thực 367 px xác nhận **Giao dịch** và
  **Tất toán** cùng hàng 149×48 px, **Giảm gốc** hàng dưới 305×48 px, không tràn ngang; preview
  400 triệu → trả 300 triệu + lãi chốt 2,8 triệu → kỳ mới 100 triệu cuộn tới nút xác nhận.
  Dialog đã đóng mà không xác nhận hoặc ghi giao dịch; runtime error log sạch.
  `tindung.vercel.app` đã promote và inspect trỏ đúng deployment mới; rollback target là
  `dpl_8Jju8tmv12o8tZ8tQ6ZXWbk6PcFS`, không cần rollback. Không migration, đổi secret hoặc
  push GitHub.
- C49 `COMPLETED` ngày 2026-09-22: nhóm thao tác khoản vay nay có **Giao dịch** và **Tất toán**
  cùng hàng, đồng kích thước; **Giảm gốc** ở hàng riêng bên dưới trên cả mobile và desktop.
  Dialog vẫn dùng tiêu đề đầy đủ **Giảm gốc và mở kỳ mới**, cuộn dọc được sau khi preview dài
  xuất hiện, chặn overscroll ra trang và chừa safe area cuối màn hình. E2E kiểm tra hình học ở
  375/390/1024 px, cuộn thực tới nút xác nhận ở 375/390 px, không tràn ngang và luồng ghi nguyên
  tử vẫn đạt. Không đổi tính lãi, RPC, schema hoặc dữ liệu Production; chưa deploy hay push.
- C48 `COMPLETED` ngày 2026-09-22: rollout C47 lên Supabase/Vercel Production, hậu kiểm không ghi
  dữ liệu tài chính và đồng bộ source/bằng chứng lên GitHub. GitHub CI run `35701912815` lần 2
  đạt Required CI gate.
- C48 đã xác minh bản sao lưu logical Production mã hóa trước migration tại
  `.backups/qlv-prod-20260922T070157Z/` (manifest `qlv-prod-20260922T074535Z`, schema/data
  đủ auth/private/public/supabase_migrations, SHA-256 và GCM đạt). Migration
  `20260922090000_c47_principal_restructure.sql` đã áp vào project `hmfxnstrqfqpvsgfmjmd`;
  remote history và hai bảng/RPC mới đã kiểm tra khớp.
- Candidate Vercel `dpl_8Jju8tmv12o8tZ8tQ6ZXWbk6PcFS`, URL bất biến
  <https://quan-ly-vay-ca-nhan-2h5lh7l3c-ngotuong2105.vercel.app>, target Production,
  `Ready`, Functions `sin1`. `/login`, manifest và auth redirect đạt public smoke. Authenticated
  browser smoke trên khoản vay Ngân đã đạt: nút nghiệp vụ mới hiển thị; preview chỉ đọc 22/9/2026
  cho gốc 400 triệu, trả 300 triệu, lãi chốt đến 21/9 là 2,8 triệu, kỳ mới 100 triệu; không bấm
  xác nhận. Viewport 390 px không tràn ngang; console và runtime error log sạch. Đã promote;
  `tindung.vercel.app` được inspect trỏ đúng deployment này, `/login` và manifest trả 200.
  Rollback target là `dpl_9KogDrgcDVQnpqhr7TPobpNwTmAi`; chưa cần rollback.
- C47 `COMPLETED` ngày 2026-09-22: bổ sung nghiệp vụ nguyên tử **Giảm gốc & mở kỳ mới**. Ngày
  hiệu lực D chốt lãi đến D-1, ghi đúng gốc/lãi thực tế và mở kỳ mới trên dư gốc còn lại từ D;
  không tạo khoản vay/giải ngân giả, không tính trùng ngày. UI có preview authoritative, xác nhận,
  stale-preview guard, bố cục mobile 390 px và lịch sử gộp dễ đối chiếu. Lịch nhắc, dashboard,
  danh sách và Google Sheets dùng/nhận mốc cùng ledger mới. Trạng thái rollout remote ở C48.
- C44 đã rollout source C41/C43 và migration `20260917100000` lên Supabase dùng chung, stable
  Preview và Production. Tại thời điểm C44, Preview trỏ
  `dpl_AjvS8ir8eeq8t4V4YmKc12ymedWu` và Production trỏ `dpl_9KogDrgcDVQnpqhr7TPobpNwTmAi`.
  Public/authenticated smoke, mobile
  390 px, console và runtime error log đều sạch; rollback không kích hoạt.
- C45 đã dọn tài liệu lịch sử khỏi cây làm việc, giữ tài liệu kỹ thuật và checkpoint đang mở;
  xóa cache/test artifact được ignore và xác nhận không có lệnh build/test/deploy bị treo. GitHub
  đã xác thực lại và branch `main` đã nhận đầy đủ chuỗi commit qua `09c0d67`.
- C46 `COMPLETED` ngày 2026-09-18: nâng `next`/`eslint-config-next` từ 16.2.12 lên 16.3.5
  (bản đã vá RCE), cập nhật override `nanoid`, `sharp`, `js-yaml` lên bản đã vá và thêm
  health-check retry có giới hạn trước khi Playwright tạo user E2E. Local audit sạch; toàn bộ gate
  gồm pgTAP 477/477, Auth 6/6 và Playwright 21/21 đạt. Không deploy, migrate remote, thay secret
  hoặc dữ liệu Production. GitHub Actions run `35353744921` cho commit `760d59c` đã đạt cả
  Required CI gate.
- Supabase Cron chạy hằng giờ. 10 Push delivery revision ở trạng thái `PENDING` là hàng đợi vận
  hành hợp lệ sau lần rollout ngoài giờ nhận 12:00, không phải lệnh terminal bị treo và không được
  xóa trong công việc dọn repository.
- Production: <https://tindung.vercel.app>.
- Stable Preview: <https://tindung-preview.vercel.app>.
- C52 audit ngày 2026-09-25: project Supabase `ACTIVE_HEALTHY`; remote migration mới nhất là
  `20260922090000`. Job `qlv-notification-runner-hourly` đang `active`, lịch `0 * * * *`, và 10
  lần chạy gần nhất trong `cron.job_run_details` đều `succeeded` đến 09:00 UTC. Production
  `/login` và manifest trả 200, `/api/notifications/run` không có secret trả 401; Vercel inspect
  cho thấy deployment Production `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC` `READY`, Functions `sin1`,
  alias `tindung.vercel.app` trỏ đúng deployment. Runtime log có POST runner trả 200 lúc
  `2026-09-25T09:00:00.494Z` và GET không secret trả 401 lúc `2026-09-25T09:10:44.053Z`.
- `pnpm ci:validate` đạt; GitHub CI run `35704013587` trên `origin/main` SHA
  `71a7509146db42c7cd754f76d6533c45f66653ea` đạt toàn bộ job và Required CI gate. API branch
  protection trả HTTP 403 vì GitHub Free không hỗ trợ private repository này. OWNER xác nhận không
  nâng gói; kiểm soát bù là chỉ phát hành revision sau khi Required CI gate của đúng SHA đạt.
  Tại thời điểm audit ban đầu, backup full gần nhất là
  `qlv-prod-20260922T074535Z`, tạo `2026-09-22T07:45:35Z`, checksum hợp lệ nhưng tuổi 73,45 giờ,
  vượt RPO 24 giờ và chỉ tới migration `20260917100000`; retention mới chạy dry-run, không xóa.
- C52 `COMPLETED` ngày 2026-09-25: tạo khóa AES-256-GCM trong macOS Keychain với service
  `com.ngotuong.quanlyvay.backup`, tạo backup Production mã hóa trực tiếp tại
  `.backups/qlv-prod-20260925T093801Z/`, không ghi SQL thuần. Manifest
  `qlv-prod-20260925T093801Z` gồm sáu file auth/private/public/supabase_migrations, migration
  `20260922090000`; checksum, GCM, SQL shape và RPO 24 giờ đều đạt. Retention dry-run giữ bản mới,
  không có candidate.
- Restore rehearsal dùng image Supabase PostgreSQL `17.6.1.155` trong container cô lập đã đạt.
  Số dòng của 13 bảng trọng yếu khớp Production (gồm 40 khoản vay, 390 giao dịch, 551 kỳ lãi,
  715 audit log, 32 Auth user và 34 migration); toàn bộ 59 khóa ngoại không có orphan, chín nhóm
  bất biến tài chính/audit đều 0 lỗi. `calculate_loan` chạy được cho 40/40 khoản, không có dư gốc
  hoặc lãi âm; RLS trả 0 khoản vay cho role authenticated không có identity. Database tạm và log
  tạm đã được hủy sau rehearsal; thời gian toàn bộ phiên rehearsal dưới RTO 4 giờ.
- C53 đã áp migration `20260925100000_c51_integrity_remediation.sql` lên đúng Supabase Production
  và đối chiếu remote history/quyền RPC. Candidate Vercel
  `dpl_CBcpZCoGkZ8CwwcsB6heNt7pxE2C`, URL bất biến
  <https://quan-ly-vay-ca-nhan-m27mmv1p1-ngotuong2105.vercel.app>, target Production, `READY`,
  Functions `sin1`. Public smoke đạt; authenticated smoke đạt luồng đổi mật khẩu bắt buộc,
  dashboard 390/1440 px, chọn đối tác bằng bàn phím và preview giảm gốc chỉ đọc, không ghi giao
  dịch. Tài khoản smoke đã thu hồi toàn bộ session và trả về inactive/banned.
- C53 bị chặn trước khi promote: runtime log candidate có `dashboard.read_failed` mã PostgreSQL
  `57014`. Ba probe qua role authenticated đều bị statement timeout sau 8.147–8.391 ms;
  `EXPLAIN ANALYZE` quyền quản trị cho cùng bundle mất khoảng 8.074 ms với 882.665 shared buffer
  hits. Alias `tindung.vercel.app` vẫn trỏ deployment tốt trước đó
  `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC`; candidate chưa được promote, source chưa commit/push.
- C54 đã loại bỏ blocker bằng hai projection authoritative chỉ tính phần so sánh giao diện dùng.
  Migration `20260926001000_c54_dashboard_bundle_performance.sql` đã áp đúng Production; các chỉ số
  cash/accrual profit và số dư đối chiếu khớp implementation cũ. Bundle Production giảm từ khoảng
  8,074 ms xuống 5,093 ms; ba probe authenticated đạt 5,168–5,555 ms, không còn `57014`.
- Backup trước migration C54 là `qlv-prod-20260925T170915Z`, gồm migration C51
  `20260925100000`; sáu ciphertext đạt checksum, GCM, SQL shape và RPO 24 giờ. Candidate mới
  `dpl_2EoTbJAzcGYvdieQWiWUphwMnbT6`, URL bất biến
  <https://quan-ly-vay-ca-nhan-jwuqab8e3-ngotuong2105.vercel.app>, đúng project, target Production,
  `READY`, Functions `sin1`. Public và authenticated smoke đạt; dashboard render đủ KPI/dòng tiền/
  lịch dự kiến, browser/runtime error bằng 0, không ghi tài chính. Alias `tindung.vercel.app` đã
  promote và hậu kiểm authenticated đạt; rollback target là
  `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC` nhưng không cần kích hoạt.
- C53 và C54 `COMPLETED` ngày 2026-09-26. Commit triển khai
  `91a16565599a14dc739c5af6880c999e9b8febf6` đã push fast-forward lên `main`; local và remote
  khớp SHA. GitHub Actions run `36221129972` đạt Dependency/secret scan, Quality/build, Workflow
  policy, Supabase/Auth/pgTAP/E2E và `Required CI gate`. Hậu kiểm sau push xác nhận alias
  `tindung.vercel.app` vẫn trỏ đúng `dpl_2EoTbJAzcGYvdieQWiWUphwMnbT6` `Ready`, target Production,
  Functions `sin1`.
- C55 `COMPLETED` ngày 2026-09-26: source/dist khớp đã được push lên Apps Script project hiện hữu
  `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`; immutable version 6 là
  `C55 readable Google Sync reconciliation tabs`. HEAD deployment vẫn là
  `AKfycbzgUCt7yolAjpgaoCrj7GtvyA1df29E2975-AxfTuM`; không tạo project, workbook, thư mục Drive
  hoặc trigger mới.
- Workbook hiện hữu `QuanLyVayCaNhanSync` đã full sync một chiều thành công: `Tổng quan` ghi 13
  tab dữ liệu; hai tab C47 đúng contract, lần giảm gốc hiện hữu có đúng một dòng và tab hoàn tác
  không có dòng dữ liệu. Header cố định, có filter và chiều rộng tối thiểu dễ đọc. Log ghi
  `runGoogleSheetFullSync` lúc 13:57:18 hoàn tất trong 68,927 giây; lần `runGoogleSheetSync` kế tiếp
  lúc 13:58:36 hoàn tất trong 4,311 giây, giữ nguyên source version và số dòng, xác nhận retry không
  tạo bản ghi trùng. Không có đường ghi ngược Supabase.
- C58 `COMPLETED` ngày 2026-09-26: hậu kiểm xác nhận Supabase `ACTIVE_HEALTHY`, 36 migration
  local/remote khớp, Vercel Production `READY`, notification runner gần nhất trả 200, Apps Script
  version 6/HEAD còn hiện hữu và GitHub Required CI của đúng SHA đạt. Backup mới nhất tuổi 15,48
  giờ đạt checksum/GCM/SQL shape và RPO 24 giờ. Báo cáo hiện hành nằm tại
  `docs/PRODUCTION_READINESS.md`.
- C58 không còn phát hiện `CRITICAL`/`HIGH`. Hai phát hiện `MEDIUM` còn mở là daily backup chưa
  được tự động hóa/cảnh báo và Production thiếu HTTP security headers. Supabase Auth E2E còn một
  lỗi flaky `LOW`; branch protection GitHub Free/private và biên hiệu năng dashboard được ghi nhận
  là `ACCEPTED_RISK` có kiểm soát bù.
- C59 `COMPLETED` ngày 2026-09-26: Production đã trả CSP có `frame-ancestors 'none'`, header
  chống MIME sniffing, referrer/permissions policy, X-Frame-Options và COOP. Candidate
  `dpl_QQ4ymp6KrfYHngugdMdv4zu5bRrJ`, URL bất biến
  <https://quan-ly-vay-ca-nhan-8ewqm47qv-ngotuong2105.vercel.app>, target Production,
  `READY`, Functions `sin1`; public và authenticated smoke desktop/mobile/PWA đạt, console và
  runtime error/500 sạch. Alias `tindung.vercel.app` đã promote; rollback target là
  `dpl_2EoTbJAzcGYvdieQWiWUphwMnbT6`, chưa cần kích hoạt.
- Backup Production mã hóa `qlv-prod-20260926T115433Z`, migration `20260926001000`, gồm sáu
  ciphertext đã đạt checksum, GCM, SQL shape và RPO. LaunchAgent
  `com.ngotuong.quanlyvay.backup` chạy mỗi giờ trên máy vận hành, ngưỡng tạo 20 giờ, dùng khóa
  Keychain hiện hữu; lần kickstart kết thúc mã 0 với `not-due`. Retention chỉ dry-run, không xóa.
- Run tài liệu `36241927827` đã tái hiện Auth health 502 lâu hơn 60 giây. C59 bỏ reset đầu Auth
  integration bị trùng, giữ reset dọn và tăng readiness deadline/backoff lên 180 giây. Commit sửa
  cuối `0c7dca7e891290f76d8014c09c0640cb952423f1` đã push fast-forward; GitHub Actions run
  `36242767835` đạt attempt 1 toàn bộ job và `Required CI gate`.

## 2. Dữ liệu và tài khoản

- Supabase project ref dùng chung: `hmfxnstrqfqpvsgfmjmd`, region Singapore.
- Baseline sau C44: 33 migration, 38 khoản vay, 381 giao dịch, 36 notification và 0 thread nhắc
  trùng tại thời điểm rollout.
- Chỉ 1 OWNER hoạt động. Các tài khoản kỹ thuật đã inactive/banned; tài khoản smoke giữ lại không có
  session hoặc refresh token hoạt động.
- Một số profile cũ có ràng buộc audit/tài chính và trigger quản trị cấm xóa vật lý. Không tắt
  trigger, không sửa lịch sử và không xóa giao dịch tài chính để dọn tài khoản.
- Production/Preview dùng chung Supabase; không tạo dữ liệu QA trên tài khoản vận hành.

## 3. Nguồn sự thật

Ưu tiên theo `AGENTS.md`:

1. `PROJECT_CONTEXT.md`: trạng thái vận hành và checkpoint hiện tại.
2. `docs/IMPLEMENTATION_PLAN.md`: roadmap và acceptance criteria đang mở.
3. Contract/runbook còn hiệu lực:
   - `docs/DOMAIN_SPEC.md`, `docs/FINANCIAL_ENGINE.md`
   - `docs/AUTH.md`, `docs/WEB_WORKFLOWS.md`, `docs/DASHBOARD.md`
   - `docs/PWA_NOTIFICATIONS.md`, `docs/GOOGLE_SYNC.md`
   - `docs/BACKUP_RESTORE.md`, `docs/CI.md`, `docs/VERCEL_PREVIEW_RUNBOOK.md`
   - `docs/DESIGN_SYSTEM.md`, `docs/USER_GUIDE.md`
4. Migration, test và code hiện tại là bằng chứng triển khai.

Không dùng commit message, tài liệu đã xóa hoặc nội dung lịch sử để suy ra yêu cầu đang chờ hay
quyền thực hiện thao tác remote mới.

## 4. Kiến trúc và bất biến

- Monorepo pnpm: Next.js PWA ở `apps/web`, Apps Script ở `apps/google-sync`, contract dùng chung
  ở `packages/domain-contract`, migration/test PostgreSQL ở `supabase`.
- Supabase PostgreSQL là nguồn dữ liệu chuẩn; Google Sheets chỉ đồng bộ một chiều để đối chiếu.
- Frontend chỉ mutate qua Server Actions/RPC đã validate; bộ máy tính lãi authoritative ở PostgreSQL.
- Giao dịch tài chính không xóa vật lý; sửa sai bằng reversal/correction và audit append-only.
- Tiền VND dùng số nguyên, lãi suất dùng decimal; ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`, audit UTC.
- Web Push và Google Sync phải idempotent; secret chỉ nằm trong kho secret của môi trường.
- Chính sách mật khẩu hiện hành: tối thiểu 6 ký tự ASCII chữ hoặc số.

## 5. Tài nguyên remote

- GitHub private: <https://github.com/ngotuong/quanlyvay.git>, branch `main` theo dõi
  `origin/main`.
- Vercel project ID: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; Functions region `sin1`.
- Preview bắt buộc chạy từ repository root bằng `pnpm deploy:preview`.
- Google Apps Script/Sheets/Drive, Vercel, Supabase và secret chỉ thao tác khi checkpoint cho phép.
- Google Apps Script project C55: `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`,
  version 6. Workbook smoke:
  <https://docs.google.com/spreadsheets/d/1Q12dJCgCvDIjEQyRpeFVtbepGzTl6AsJ_KimAnEvjA8/edit>.
  Rollback: checkout source Google Sync của commit trước C55 (hoặc đối chiếu immutable version 3),
  build để tái tạo `dist`, rồi `clasp push`; version 6 được giữ làm bằng chứng. Không cần rollback.

## 6. Kiểm thử gần nhất

C87 ngày05/10: lint/typecheck/unit117/build19/full E2E64PASS14opt-inSKIP15,1m/exit0.
88rendered samples,18before cùngfixture;8Evon vòng3/56fixed+220sweep,6rawP được đối chiếu
falsepositive bằng trạng thái visible/painted. Contrast visible tooltip15,962/14,588 và
C84 AA/focus regression đạt. DB C20-test55322 sixcounts0;17C75files/C86 hashes bảo toàn;
review22HTTP/native5khổ0broken/overflow, JSON/diff/Gitleaks pinned đạt. Full thất bại59/15/4
và targeted3/1 giữ rõ ở docs/remediation-c87/report.md; không lấy gate cũ làm final PASS.
Không pgTAP/Auth độc lập mới vì schema/Auth không đổi; full E2E hồi quy tài chính vẫn đạt.
Không CI hoặc rollout C87; C88 chờ duyệt, physical AT/mobile/cold native vẫn NOT_TESTED.

C86 ngày05/10: opt-in final2/2PASS2,8m gồm36journeys và4Evon app probe/supplement;
28fixed+110sweep app,2P hidden tooltip được đối chiếu falsepositive bằng opacity/visible contrast.
Prototype20samples0overflow/clipped/singleh1/KPI-order,4Evon28fixed+110sweep0P. Lint/typecheck,
Next build quaE2E, JSON/JS/19HTTP/diff/Gitleaks artifacts+diff PASS. DB55322 sixcounts0.
No runtime/schema/Auth/workflow diff, không chạy lại full unit/pgTAP/Auth/CI độc lập cho audit.
Giới hạn và raw failures tại docs/audit-c86/report.md; đề xuất C87 đã được thực hiện ở trên.

C84 ngày04/10: lint/typecheck/unit116/build/full E2E61PASS12opt-inSKIP10,7m exit0;
critical2PASS2,0m.90rendered samples, min contrast normal5,397/large6,702/focus5,169:1,
0overflow/clipped/amount/summary nhỏ. Evon8probe40fixed+220sweep cuốiraw4P đã đối chiếu;
40ảnh/42HTTP200/CUA5khổ/JS/JSON/diff đạt. SQL C20-test55322 six counts0;14C75PNG restored.
Gitleaks raw2reviewpublic fixture id/password,0OWNER/Production credential; không đổi rule.
Chi tiết các lượt FAIL, fix native optimizer/cached meta và giới hạn `docs/remediation-c84/`.
Không CI hoặc rollout mới; source18file giữ nguyên qua gate cuối, C85 chờ duyệt.

C83 ngày04/10: audit chính1/1PASS4,8m/130samples, supplement1/1PASS2,3m/20samples;
C63/C67/C72/C75 regression22/22PASS4,1m gồm real local SQL-lock timeout/retry. Lint/typecheck
PASS, Next production build chạy bởi webServer trước E2E PASS; diff/JS/JSON/18HTTPlinks PASS.
Evon app40fixed+220sweep có9Pđã đối chiếu, prototype50fixed+55sweepfinal0P, static80samples+
20stress0overflow/0clipped. DB55322C20-testSQL profiles/loans/transactions0/0/0 sau teardown.
Secret scan raw1falsepositive đã review đúng public synthetic p_idempotency_key,0credential;
không giảm rule/ignore list/assertion/skip. `docs/audit-c83/validation.json` và security-evidence
lưu giới hạn/résult riêng. Không full-suite/unit/pgTAP mới cho audit docs/harness khi targeted
regression đã đạt; không chạy CI/push/deploy cho C83.

C82 ngày04/10: lint/typecheck/unit113/build, full local54PASS9opt-inSKIP7,8m và root
Preview resume54PASS9SKIP8,0m exit0. Source CI37171480847 và closing proof CI37179819051
SUCCESS mọi5job đúng từng SHA; pgTAP527/Auth6/CI E2E53PASS10SKIP ở source. Closing job
full integration cũng PASS, chi tiết run liên kết trong report. DB55322 C20-test0/0/0.
Candidates168mẫu Auth light/dark375/390/1440, public4/4 và stable/default postcheck đạt;
error/HTTP5000. Metadata guard/151UIDmatch/diff/Gitleaks/JSON/JS/policy/actionlint PASS.
Không chạy lại full local cho final status docs vì không đổi source runtime/harness;
Required CI của đúng final status SHA vẫn phải được xác minh trước báo kết quả.


C81 đạt03/10: lint/typecheck/unit108/build; full E2E cuối54PASS/9SKIP8,3m exit0 sau sửa
C75 toggle focus bị mobile nav che. Target C75 3/3 PASS1,5m; C81 opt-in4/4 PASS4,6m trước
mobile money refinement, sau đó full capture C81 4test PASS nhưng toàn suite C75 fail
(54PASS/8SKIP/1FAIL10,9m), không gọi lượt đó là gate xanh. Lượt full cuối kiểm money-nowrap,
78mẫu functional/single h1/privacy/guard và mọi regression bắt buộc.9SKIP chỉ opt-in evidence.
DB55322 profiles/loans/transactions0/0/0, diff/Gitleaks pinned v8.30.1 diff+tệp text mới PASS,
JSON/JS review parse/image-load đạt.4Evon probe cuối0P,28fixed+110sweep; các Gu ngoài scope
và lỗi harness/giới hạn ghi ở report. Không cần pgTAP/Auth riêng vì schema/Auth không đổi;
không dùng local gate thay bằng chứng rollout. Bản runtime C81 đã phát hành qua C82; đoạn này là bằng chứng local trước release.


C80 đã đạt (03/10/2026): lint/typecheck;21test hồi quy C63/C72/C75/C78 PASS; audit opt-in
rerun1/1 PASS1.8m/78mẫu sau sửa cookie harness; JS syntax/JSON parse, ci:validate,
diff-check và Gitleaks trên diff+tệp text mới. DB55322 teardown0profiles/loans/transactions.
Mockup56mẫu và8probe runs0P,4sweep55mẫu, privacy/keyboard/ca biên/0clippedKpiAmounts đạt.
Không chạy lại full unit/pgTAP/build riêng vì runtime/schema không đổi; E2E dùng production
build của harness. Không lấy capture PASS làm kết luận mọi UX/AT/Production đã đạt.

- C79 ngày03/10: source8c8a884 Required CI37097003400 SUCCESS mọi5job, pgTAP527/Auth6/E2E50/8;
  root initial và resume lint/typecheck/unit105/build/E2E51PASS7SKIP exit0, resume6.9m, DB0/0/0.
  Candidate full light/dark375/390/1440; stable Auth dark375/390/1440, default390dark/privacy/focus/
  KPI/loan-interest/console PASS; public4/4, runtime error/5000 sau Auth/alias/cleanup.
  Actual source metadata150/150UIDSHA1match/0forbidden; hai C73 removal/404/inventory absence
  và C76 rollback Ready/public PASS. Closing JSON/policy/actionlint/Gitleaks/diff PASS.
  Packaging compiler before TS2307/after PASS; optional filtered Next/font harness failure không
  dùng làm green gate, actual Vercel builds Ready. Discard inactive-tab viewport/light samples và
  close-before-animation measurement; eager focus cycles rerun PASS. Không chứng nhận AT/physical
  browsers hoặc source contents/cache toàn bộ. Source không đổi sau8c8a884; closing CI exact SHA
  xác minh trước completion message, không lấy source CI thay.

- C78 ngày03/10: lint/typecheck/unit105/105/build PASS; final full E2E51PASS7audit-opt-inSKIP6,5m,
  C78 riêng3PASS1,7m. Browser36 cases:6 dashboard +24 loan1/2/3/12 +6zero;32 eager focus cycles
  không thêm chờ + keyboard/close-before-frame/reopen/navigation PASS. SSR period0/1/2/3/12 và
  cash empty/zero/mixed đạt;0-period không ép RPC trái nghiệp vụ. Guard3 fixtures PASS, local
  payload prediction191files/4.541.300bytes; actual remote inventory NOT_TESTED trong C78.
  Diff/credential scan redacted PASS; teardown/read-only DB55322=0/0/0. Before C77 được bảo toàn,
  ảnh lịch sử C75 do harness tự ghi lại đã trả về bản trước test. Không schema/RPC/CI remote.
  Lượt đầu có lỗi harness readiness/fixture-idempotency/selector menu ẩn; đã sửa và chạy lại full
  gate, không lấy lượt fail làm PASS. Native Safari/Firefox/AT/mobile vật lý chưa kiểm.

- C77 ngày03/10: local audit2 tasks completed2,0m,12privacy+64menu+10drawer. Có15 eager-focus
  failures được giữ làm evidence; không product PASS. Lint/typecheck/build qua E2E/diff/scan đạt;
  teardown/read-only DB55322=0/0/0. Không chạy lại full unit/DB/CI vì runtime/schema không đổi.


- C76 chốt 03/10: lint/typecheck/unit94/build19/full audit PASS sau patch dev lint;
  root full E2E48PASS5SKIP6,5m PASS trước patch;
  source CI37032143402 SUCCESS5jobs (CI pgTAP527/Auth6/E2E47PASS6SKIP).
  Candidate Auth/public và alias hậu kiểm đạt, runtime error0/HTTP5000. CI của commit tài liệu
  chốt được kiểm exact SHA trên GitHub trước completion message; không dùng source run thay thế.

C75 ngày 2026-10-02 (bằng chứng lịch sử):

- Lint/typecheck/diff-check, unit/script80, build19 route PASS.
- C63/C67/C72 regression19 PASS; business-flow11 PASS; final C75 3 PASS56,8s.
- Six matrix375/390/1440 light/dark13 tasks không overflow/clipping; keyboard/focus/scroll,
  privacy generated/custom, distinct empty state, query back và loading đạt.
- Teardown DB disposable55322: profiles/loans/transactions0; không thay remote.
- Giới hạn và lịch sử harness tại `docs/remediation-c75/report.md`; chưa CI/deploy C75.

C72 ngày 2026-10-01:

- `git diff --check`, lint, typecheck, build: PASS; `pnpm test`80/80 PASS.
- Full E2E45 PASS/3 audit opt-in SKIP, 6 phút; toàn bộ6 C72 và regression hiện hữu đạt.
- 100 route/width/theme/text samples, 20 ảnh synthetic, keyboard focus/target/overflow đạt.
  Hai expense fixture list y436,86; dashboard13 task đầu bottom648,03 px.
- Read-only hậu kiểm DB disposable :55321: profiles/loans/transactions0; secret-pattern scan sạch,
  không SQL/dump/env staged hoặc file mới. Không chứng nhận browser/AT/thiết bị chưa kiểm.
- Chi tiết và giới hạn tại `docs/UI_UX_REMEDIATION_C72.md`; chưa có CI/deployment C72 mới.


C62 ngày 2026-09-30:

- `pnpm lint`, `pnpm typecheck`, `git diff --check`: PASS.
- Audit opt-in `C62_AUDIT=true pnpm test:e2e c62-audit.spec.ts`: 1/1 PASS (1,7 phút).
- `pnpm test:e2e`: 23/23 PASS (2,7 phút), 1 skip đúng chủ đích là harness audit opt-in.
  Hai lần đều build Next production qua Playwright webServer; không sửa code runtime.
- Mockup payment smoke đạt close + toast. 45 route/width samples, 30 ảnh tổng hợp; secret pattern
  scan sạch. Database test 55321/55322 được guard/reset, không dùng DB Production/Preview.
- Không chạy lại unit/pgTAP/Auth standalone vì phạm vi chỉ tài liệu/mockup/harness. Không tuyên bố
  kiểm xong thiết bị thật, screen reader, cold auth/expiry/PWA resume hoặc browser zoom thật.

C63 ngày 2026-09-30:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (80/80) và `pnpm build`: PASS.
- `pnpm test:e2e`: 32/32 bài chạy PASS trong 4,0 phút; 1 skip đúng chủ đích là harness audit
  C62 opt-in. Playwright build/start Next production và chỉ reset database local cô lập
  `QuanLyVayCaNhan-C20-test` trên API 55321/database 55322.
- Ma trận C63 kiểm payment → giảm gốc → tất toán tại 375/390/1440 px; 390×480 dark mô phỏng
  viewport bàn phím thấp, reduced-motion, focus trap/restore, dirty/pending, submit trùng, toast,
  preview stale/read-after-write, navigation 10 giây và Auth 2/10 giây đều đạt.
- Không đổi migration, RPC, schema hoặc công thức tài chính. VoiceOver/TalkBack, bàn phím mềm và
  PWA resume trên thiết bị thật vẫn là giới hạn đã ghi tại `docs/UI_UX_REMEDIATION_C63.md`.

C64 ngày 2026-09-30:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (80/80) và `pnpm build`: PASS.
- `C64_EVIDENCE=true pnpm test:e2e`: 35 bài chạy PASS; 1 skip đúng chủ đích là harness C62 opt-in.
  Playwright dùng production build/start và database local cô lập.
- Dashboard/list/detail/filter/đối tác được kiểm tại 390/1440 px, light/dark, reduced-motion và
  200% text; ảnh tại `docs/audit-c64/`. Drawer C63, stale guard và số liệu tài chính không đổi.
- Chưa kiểm screen reader, bàn phím mềm, safe-area và browser zoom trên thiết bị thật; giới hạn chi
  tiết tại `docs/UI_UX_REMEDIATION_C64.md`.


C44 đã đạt:

- `git diff --check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 74/74
- `pnpm build`
- `pnpm test:auth`: 6/6
- `pnpm test:e2e`: 21/21
- GitHub Actions CI: run `35353744921` đạt Required CI gate
- database lint sạch và pgTAP 477/477

C45 đã đạt:

- `git diff --check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 74/74
- `pnpm build`

Không chạy lại Auth E2E, browser E2E hoặc database test vì C45 không đổi code, schema, dữ liệu hay
runtime; các gate đó gần nhất đã đạt ở C44 như ghi trên.

C46 đã đạt:

- `pnpm audit --audit-level high`: không còn advisory
- `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74
- `pnpm build`
- database lint sạch và pgTAP 477/477
- `pnpm test:auth`: 6/6
- `pnpm test:e2e`: 21/21

C47 đã đạt:

- migration được tái tạo sạch từ đầu; database lint không lỗi
- pgTAP 504/504, gồm kịch bản 400 triệu → trả 300 triệu + lãi chốt → kỳ mới 100 triệu
- `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74
- `pnpm build`
- `pnpm test:auth`: 6/6
- `pnpm test:e2e`: 22/22, gồm workflow mới trên viewport 390 px
- `git diff --check`

C48 đã đạt:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74, `pnpm build` đạt.
- Backup logical Production mã hóa và kiểm tra integrity đạt; migration Production/history đạt.
- Candidate Production `Ready`, Functions `sin1`; public/authenticated mobile smoke, console và
  runtime log đạt; alias Production đã chuyển và public hậu kiểm đạt.
- Source C47 commit `2ca0c17` đã push `origin/main`; GitHub CI run `35701912815` lần 2 đạt
  tất cả job và Required CI gate, gồm pgTAP/Auth/Playwright E2E. Lần đầu Auth local của runner
  trả HTTP 502 trong 15 giây sau reset (trước khi Playwright chạy); rerun không lặp lại.

C49 đã đạt:

- `git diff --check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 74/74
- `pnpm build`
- `pnpm test:e2e`: 22/22, gồm bố cục nút ở 375/390/1024 px và cuộn tới nút xác nhận ở
  375/390 px sau preview
- Không chạy lại Auth E2E hoặc pgTAP vì C49 chỉ đổi nhãn, bố cục, CSS cuộn và E2E UI; không đổi
  Auth, schema, RPC hay nghiệp vụ tài chính.

C50 đã đạt:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74, `pnpm build`
- `pnpm test:e2e`: 22/22
- Candidate đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, `Ready`,
  Functions `sin1`; authenticated smoke không ghi dữ liệu và runtime log đạt.
- Alias Production đã chuyển và public hậu kiểm đạt; không cần rollback.

C51 đã đạt:

- `git diff --check`, lint, typecheck, unit test, build, Auth 6/6, Playwright E2E 22/22
- database lint và toàn bộ pgTAP local đạt

C52 đã đạt:

- `pnpm ci:validate`, GitHub CI run `35704013587`, Production public smoke và notification runner
- backup Production mã hóa: checksum, GCM, SQL shape, manifest/RPO và retention dry-run
- restore rehearsal cô lập: row count, toàn bộ khóa ngoại, invariant tài chính, calculation và RLS
- `git diff --check`; không deploy, migrate remote, push GitHub hoặc thay đổi dữ liệu nghiệp vụ

C53 đã đạt trước khi gặp blocker:

- Backup trước migration `qlv-prod-20260925T093801Z`: checksum, GCM, SQL shape và RPO 24 giờ đạt
- `git diff --check`, `pnpm ci:validate`, lint, typecheck, unit test 74/74 và build đạt
- database reset/lint đạt; pgTAP 514/514, Auth 6/6 và Playwright E2E 22/22 đạt
- Migration C51 đã áp Production; notification Cron tiếp tục `succeeded` sau migration
- Candidate đúng project/target/region và các public/authenticated smoke C51 không ghi tài chính đạt
- Runtime log **không đạt** do dashboard RPC bị `57014`; alias/push/CI vì vậy chưa thực hiện

C54 đã đạt:

- Full local gate: `git diff --check`, CI policy/actionlint, lint, typecheck, unit 74/74, build,
  database reset/lint, pgTAP 527/527, Auth 6/6 và Playwright 22/22
- Regression 40 khoản chạy bundle dưới budget 6 giây; Production giảm khoảng 37% xuống 5,093 ms,
  ba probe authenticated liên tiếp đều đạt và số liệu so sánh khớp implementation cũ
- Backup `qlv-prod-20260925T170915Z` đạt checksum/GCM/SQL shape/RPO; remote history khớp đến
  migration `20260926001000`
- Candidate/alias Production đúng project, target, region; public/authenticated smoke và log đạt;
  notification Cron tiếp tục `succeeded`; tài khoản smoke inactive/banned, 0 session/refresh token
- Commit `91a16565599a14dc739c5af6880c999e9b8febf6` đã push fast-forward; local/remote khớp SHA và
  GitHub run `36221129972` đạt toàn bộ job cùng `Required CI gate`

C55 đã đạt:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` và `pnpm build`
- Google Sync typecheck, 18/18 unit test, build và so khớp exact source/dist
- `clasp push` đúng project; immutable Apps Script version 6 và HEAD deployment được xác minh
- Full sync/smoke workbook 13 tab đạt; hai tab C47 đúng contract, header đọc được và retry giữ
  nguyên số dòng/source version
- Không chạy Auth E2E, browser E2E hoặc database test vì C55 chỉ đổi Apps Script/Sheet đối chiếu
  một chiều và tài liệu; không đổi web, Auth, schema, RPC hoặc dữ liệu authoritative

C56 đã đạt:

- Commit C55 `fdd7254d97a58231bf918f110c23aa53257c2ded` đã push fast-forward lên `main`;
  local/remote khớp SHA sau push
- `git diff --check`, `pnpm ci:validate`, Gitleaks toàn bộ 110 commit và `pnpm audit
  --audit-level high` đều đạt; commit không chứa `dist`, `.clasp.json`, secret hoặc dữ liệu
  tài chính
- GitHub Actions run `36226393389` của đúng SHA đạt Workflow policy, Dependency and secret scan,
  Quality and build, Supabase Auth/pgTAP/E2E và `Required CI gate`
- Hậu kiểm chỉ đọc xác nhận Apps Script version 6, HEAD deployment
  `AKfycbzgUCt7yolAjpgaoCrj7GtvyA1df29E2975-AxfTuM` và workbook hiện hữu vẫn mở được
  với các tab đối chiếu C47
- Không deploy Vercel, chạy migration, thay secret, tạo tài nguyên Google hoặc sửa dữ liệu

C57 đã đạt:

- Xác minh release chính thức `supabase/setup-cli` v3.0.1, commit ký hợp lệ
  `45a513f8c64c0bc8e0e3dfe572b5c95be85f6359`, dùng composite action và Node.js 24
- Workflow pin full SHA v3.0.1; policy local chặn revision cũ. Supabase CLI vẫn khóa 2.109.0,
  không đổi permission, secret hoặc các phiên bản toolchain khác
- Gate local đạt: `git diff --check`, `pnpm ci:validate`, `pnpm test` (75 test workspace/script),
  dependency audit và Gitleaks trên diff không phát hiện secret
- Commit `a24bcafdfa90c975ff465ed78422094f587d42ad` đã push fast-forward; GitHub Actions run
  `36228136823` đạt tất cả job và `Required CI gate`
- Integration log không cò cảnh báo Node.js 20 deprecated; API annotations của job rỗng
- Không deploy Vercel/Apps Script, migration, thay secret, tạo tài nguyên remote hoặc sửa dữ liệu

C58 đã đạt:

- `git diff --check`, `pnpm ci:validate`, dependency audit mức high và Gitleaks toàn bộ 113 commit
- GitHub run `36228844410` attempt 2 trên đúng SHA `fe32304a` đạt toàn bộ job và Required CI gate
- Supabase/Vercel/notification/Apps Script được hậu kiểm chỉ đọc; backup checksum, GCM, SQL shape,
  RPO và retention dry-run đạt
- Không chạy lại full local test vì source runtime không đổi và CI của đúng SHA đã đạt full gate;
  C58 chỉ thêm tài liệu audit

C59 đã đạt:

- `git diff --check`, `pnpm ci:validate`, `pnpm audit --audit-level high`, lint, typecheck, unit
  test 79/79 và build; Gitleaks trên diff và toàn bộ history trong CI không phát hiện secret
- database reset/lint đạt; pgTAP 527/527, Auth 6/6 và Playwright E2E 23/23
- Backup `qlv-prod-20260926T115433Z` đạt checksum/GCM/SQL shape/RPO; LaunchAgent chạy thử mã 0,
  lịch mỗi giờ và ngưỡng 20 giờ đã được nạp
- Candidate/alias Production đúng project, target, region; public/authenticated smoke, PWA,
  security headers, console và runtime log đạt; rollback không cần kích hoạt
- Commit `66e2e8d88d6bb92d2b8b4fdc8c0ccc7e7c8ff7a5` đã push fast-forward; GitHub run
  `36241173845` attempt 1 đạt toàn bộ job cùng `Required CI gate`
- Run `36241927827` tái hiện 502 sau reset dọn; remediation bỏ reset đầu Auth bị trùng và tăng
  deadline lên 180 giây. Local chuỗi Auth 6/6 → E2E 23/23 đạt; commit `0c7dca7` và run
  `36242767835` đạt ngay attempt 1 toàn bộ job cùng `Required CI gate`

## 7. Việc chờ

- C88 `IN_PROGRESS`: đã được OWNER phê duyệt05/10; đồng bộ C86/C87 và rollout B sau
  exact-SHA CI/candidate/Auth/log gate. Scope/acceptance tại roadmap section46. Không blocker C87 local.
  Chưa chứng nhận các state remote/thiết bị chưa kiểm; không tự mở rộng kiểm AT hoặc cleanup.
- C85 source/closing proof CI và rollout/hậu kiểm đạt, không còn blocker native input. Final
  status9813a6b có Required CI37217274995 SUCCESS5jobs đúng SHA đã xác minh trước báo hoàn tất. Giới hạn
  remote dirtynav/OS themechange/expense distribution/physical AT được ghi report, không giấu
  NOT_TESTED hoặc kết luận lỗi app.
- C82 release/public/Auth/log/source CI/closing proof CI đạt; không còn blocker release.
  Final closing2d040e9 có Required CI37180794295 SUCCESS đúng SHA; không còn bước chốt C82 pending.
  Physical AT/mobile/Safari/Firefox và Chrome badge lịch sử chưa chứng nhận;
  không tự mở rộng incident, rotation hoặc thao tác tài nguyên remote.
- C77 `COMPLETED` local03/10:12 privacy samples375/390/1440 light/dark; dashboard scale lộ6/6,
  loan3-period chart hidden6/6. Focus64 menu cycles: eager15/32 lỗi, settled32/32 đạt;10 drawer đạt.
  Trace có focus/settings→close không key giữa; rAF initial focus vô điều kiện phù hợp timing,
  Tab-wrap3 mẫu có targetclose nên không quy sai trap. Native remote/user/mobile incidence chưa đo.
  Source inventory2C73 mỗi329 files gồm63ciphertext/11manifest/3log +58test artifacts. Output44
  lambda entries0forbidden, static/bundle contents NOT_TESTED. public=false logs/source,
  /_src/_logs307Vercel và6artifactHEAD404; không tải nội dung hoặc khẳng định khônglộtoànbộ.
  Active aliases vẫnC76, ProdC73 còn default project alias. Đích cleanup ghi docs/audit-c77/report.md.
  Opt-in audit lượt cuối2 tasks completed2,0m có15 lỗi ghi nhận; lint/typecheck/build E2E/diff/scan
  PASS; DB test55322 profiles/loans/transactions0/0/0. Không runtime/RPC/schema/data remote,
  credential/account/Google/deploy/push/commit mutation. Dữ liệu/12PNG mới đều synthetic.
  C76 closing CI37087420173 trêne5fdcfa đã xác nhận SUCCESS5job; không CI C77 vì audit local.

- C62 `COMPLETED` ngày 2026-09-30: audit UI/UX local và mockup hoàn tất; báo cáo
  `docs/UI_UX_AUDIT_C62.md`, bằng chứng `docs/audit-c62/`, harness opt-in
  `apps/web/test/e2e/c62-audit.spec.ts`. Có 12 phát hiện: 2 HIGH (một runtime, một nguy cơ cold auth),
  9 MEDIUM, 1 LOW. Đã tái hiện payment success vẫn mở drawer, đóng draft giảm gốc không confirm,
  progress sai khi cancel/chờ hơn 8s. Không kết luận mất draft hoặc sai tiền từ các hiện tượng này.
  45 route/viewport không tràn ngang không có nghĩa UI đạt; report tách lỗi, nguy cơ source và
  NOT_TESTED. Cold auth, thiết bị thật, screen reader, zoom browser thật còn cần bằng chứng.
  Thay đổi chỉ gồm tài liệu, fixture evidence/mockup và harness; không sửa code sản phẩm, không
  ghi dữ liệu remote/deploy/push. Sáu commit C60 chưa đồng bộ giữ nguyên; C62 chưa local commit.
- C63 `COMPLETED` ngày 2026-09-30: payment/tất toán/giảm gốc đóng và reset sau server commit,
  giữ draft khi lỗi, chặn submit trùng, toast sau dialog, focus hợp lý và preview mới khi mở lại.
  Progress bám transition thật; fallback Auth không chứa dữ liệu riêng tư. Regression phát hiện
  preview tất toán được tải khi drawer ẩn và đã sửa bằng lifecycle mount theo lần mở. Toàn bộ gate
  local đạt; không deploy, push, migration hoặc ghi dữ liệu remote.
- C64 `COMPLETED` ngày 2026-09-30: dashboard ưu tiên việc đến hạn, filter/card khoản vay gọn, detail
  giữ hierarchy số dư/action, đối tác list-first có search và drawer thêm/sửa, retry preview chỉ hiện
  khi lỗi/stale. Full local gate và ảnh evidence đạt; không đổi schema/RPC/công thức, không deploy,
  push hoặc ghi dữ liệu remote.
- C65 `COMPLETED` ngày 2026-09-30: giữ nguyên sáu commit C60, gom C62–C64 cùng dependency override
  vá `brace-expansion` vào commit `9a1497b54a62b42ca93e79a518a7dcfc178fc155` và push
  fast-forward; C65 hoàn tất luôn mục tiêu C61. Full-history gitleaks và `pnpm audit --audit-level
  high` sạch. GitHub Actions run `36697102128` attempt 1 dừng fail-closed khi Supabase Auth local
  trả 502; rerun attempt 2 trên đúng SHA đạt Integration, security, policy, quality/build và
  `Required CI gate`.
- Stable Preview hiện trỏ deployment `dpl_6JfpS3eqM89Jtjr2b8JVzvZHLaZw`, immutable URL
  <https://quan-ly-vay-ca-nhan-rj9pn2zao-ngotuong2105.vercel.app>, project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `preview`, trạng thái `Ready`, Functions `sin1`;
  alias <https://tindung-preview.vercel.app> đã được promote sau gate. Public và authenticated
  smoke ở Chrome/Safari đạt cho privacy mode, heading, modal focus/state và bottom nav ở Chrome
  zoom 400%/mức zoom tối đa Safari; không ghi giao dịch tài chính, tài khoản kỹ thuật đã
  deactive/ban. App console không có lỗi; CSP message của Vercel Toolbar được tách riêng, không ảnh
  hưởng luồng app. Runtime error và HTTP 500 log đều rỗng. Rollback target đã xác minh là
  `dpl_FrsRPc3CqyKpkdkutFGCZ16Foq5u`; không cần rollback. Không đổi schema/migration, secret,
  Apps Script/Sheets, dữ liệu nghiệp vụ hoặc Production alias.
- C66 `COMPLETED` ngày 2026-10-01: audit Safari/Chrome thật và E2E cô lập ghi nhận 2 HIGH, 2 MEDIUM,
  1 LOW tại `docs/UI_UX_AUDIT_C66.md`. HIGH gồm privacy mode còn lộ số tiền qua accessible name và
  bottom navigation chồng chữ ở zoom 400%. Focus sheet **Thêm**, outline heading và semantic trạng
  thái mở là backlog còn lại. Safari login/zoom 200% đạt; full E2E đạt 35 PASS + 1 audit skip. Không
  có iPhone/Android hay screen reader bật nên VoiceOver/TalkBack, bàn phím mềm và safe-area thiết bị
  thật giữ `NOT_TESTED`. Không sửa code, dữ liệu, deploy hoặc push.
- C67 `COMPLETED` ngày 2026-10-01: privacy mode không còn đưa tiền thật vào accessible name/tooltip;
  bottom nav reflow không chồng nhãn ở Chrome zoom 400% và mức zoom tối đa Safari; sheet **Thêm**
  có focus loop, focus return, `aria-expanded`/`aria-controls`; action banner dùng heading cấp 2.
  Regression C67 4/4 và full E2E 39 PASS + 1 audit skip; lint, typecheck, 80/80 unit/script và build
  19 route đạt. Tài khoản/DB test synthetic đã dọn; không đổi nghiệp vụ/schema/dữ liệu remote,
  deploy hoặc push. Chi tiết tại `docs/UI_UX_REMEDIATION_C67.md`.
- C68 `COMPLETED` ngày 2026-10-01: nâng `next`/`eslint-config-next` lên `16.3.8` để vá
  `GHSA-vcvr-r3jv-pc5j`, ổn định focus trap/bottom-sheet và full E2E. Các commit cuối
  `27125e9`, `993bfb6`, `f448a6b`, `d2bd90d1872ca31aedf592019662904794b251f5` đã push
  fast-forward; GitHub Actions run `36818958055` đạt toàn bộ job và `Required CI gate` trên đúng
  SHA cuối. Local đạt audit sạch, CI policy, lint, typecheck, 80/80 unit/script, build 19 route,
  stress focus 20/20, drawer tài chính 9/9 và full E2E 39 PASS + 1 audit skip.
- Candidate Preview `dpl_6JfpS3eqM89Jtjr2b8JVzvZHLaZw`, immutable URL
  <https://quan-ly-vay-ca-nhan-rj9pn2zao-ngotuong2105.vercel.app>, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `preview`, `Ready`, Functions `sin1`. Chrome/Safari
  thật và authenticated smoke xác nhận privacy accessible name không lộ tiền, heading H1→H2,
  bottom nav không chồng ở zoom 400%/mức tối đa Safari, focus loop/Escape/focus return và
  `aria-expanded` đúng. Stable alias đã chuyển sau gate và smoke lại đạt; runtime error/HTTP 500
  đều 0. Rollback target `dpl_FrsRPc3CqyKpkdkutFGCZ16Foq5u` không cần kích hoạt. Tài khoản smoke
  đã inactive/banned; Git không chứa credential/cache. Production không đổi.
- C69 `COMPLETED` ngày 2026-10-01: revision `039be56a2fba3e2acc60adb4c4f10b85c14b0fbe`
  có GitHub Actions run `36827783372` đạt toàn bộ job và `Required CI gate`. Preflight local đạt
  dependency audit, CI policy/actionlint, lint, typecheck, 80/80 unit/script, build 19 route,
  full E2E 39 PASS + 1 audit skip và Gitleaks toàn bộ 133 commit.
- Production candidate `dpl_HZHgS3m93v2MoYNQSPVHi9vGwZ1T`, immutable URL
  <https://quan-ly-vay-ca-nhan-6ghj4fitw-ngotuong2105.vercel.app>, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `production`, `Ready`, Functions `sin1`. Public smoke
  đạt `/login`/manifest 200 và hai API không secret 401. Authenticated Chrome smoke đạt privacy,
  heading H1→H2, modal focus/state và reflow 500/390/320 px; Safari tải đúng login trên candidate.
  Một phép đo focus tự động timeout lần đầu, chạy lại cùng candidate/tài khoản đạt và không có lỗi
  console/runtime.
- Alias <https://tindung.vercel.app> đã promote sau gate, inspect trỏ đúng candidate; public,
  authenticated Chrome và Safari login smoke sau promote đều đạt. Runtime error và HTTP 500 đều
  0. Rollback target `dpl_QQ4ymp6KrfYHngugdMdv4zu5bRrJ` không cần kích hoạt. Tài khoản smoke đã
  inactive/banned; không đổi schema/RPC, công thức tài chính, Supabase data/secret, Apps
  Script/Sheets hoặc ghi giao dịch tài chính.
- C70 `COMPLETED` ngày 2026-10-01 theo phạm vi điều chỉnh OWNER đã đồng ý: tổng hợp kiểm
  accessibility khả dụng trên Production, giữ VoiceOver/TalkBack/mobile thật NOT_TESTED.
  Safari login semantic/keyboard/focus đạt. Chrome Production đạt privacy attributes, dashboard
  heading, modal focus/state, reflow 320/390/500 px, loans/detail bốn tab và landscape giả lập;
  console/pageerror = 0. Tài khoản kỹ thuật VIEWER inactive/banned đã hậu kiểm đọc-only đạt.
  Bằng chứng/giới hạn tại `docs/UI_UX_AUDIT_C70.md`; gate tài liệu `git diff --check` đạt.
  Không sửa runtime/harness, không cần chạy lại full suite. Cache/helper/credential bị Git ignore.
  Giới hạn còn mở: VoiceOver đã bật nhưng bind công cụ timeout -10005/không thu được đầu ra;
  adb/simctl không có. Không coi đóng C70 là PASS screen reader/mobile hay đóng toàn bộ rủi ro
  accessibility. Không yêu cầu OWNER học VoiceOver. VoiceOver đã bật ở lượt trước, chưa tắt;
  phiên chốt tài liệu này không thao tác hệ thống. Blocker đóng C70 đã được gỡ bằng phạm vi
  OWNER điều chỉnh; giới hạn kiểm chứng vẫn được lưu, chưa có phát hiện screen reader mới đủ bằng chứng.
- C71 `COMPLETED` ngày 2026-10-01: audit UI/UX có 110 tổ hợp screen/viewport/theme local
  synthetic và 20 login local/Production public. Báo cáo `docs/UI_UX_AUDIT_C71.md`, ma trận/ảnh/
  mockup tại `docs/audit-c71/`, harness opt-in `apps/web/test/e2e/c71-audit.spec.ts`.
  Có 1 HIGH (Back SPA làm mất draft), 4 MEDIUM (pending/error thông báo, target, chi phí form-first,
  active filter), 1 LOW (task dashboard dưới KPI mobile). Không sửa các lỗi trong audit.
  Loading cold auth và financial drawer close/reset/toast/focus đã kiểm lại đạt; không coi lỗi
  C62 đã sửa là hiện hành. Screen reader/mobile thật/contrast toàn bộ tiếp tục NOT_TESTED.
  Gates: lint/typecheck PASS phiên bản cuối; 16 regression C63/C64/C67 PASS ở lượt đầu; C71
  matrix+friction 2 PASS ở lượt rerun, friction bổ sung read-after-write/count/retry/quick journey
  1 PASS. Lượt đầu một timeout harness do goBack chờ load khi dismiss beforeunload đã sửa ở
  harness, không sản phẩm. Build chạy trong gate E2E; không chạy lại full unit/DB suite/CI.
  Teardown + hậu kiểm read-only DB riêng :55321: profiles/loans/transactions đều 0; artifact
  secret-pattern scan PASS, không SQL/dump, git diff --check PASS. Không thay runtime/schema,
  dữ liệu dùng chung, secret, tài khoản remote, deploy, commit hoặc push. Local C70/C71 chưa
  đồng bộ GitHub. Production inspect chỉ đọc vẫn C69 dpl_HZHgS3m93v2MoYNQSPVHi9vGwZ1T/sin1;
  không kiểm lại authenticated Production trong C71, không tuyên bố rollout remediation.
- C72 `COMPLETED` local ngày 01/10/2026, OWNER phê duyệt trong hội thoại: đã sửa sáu phát hiện
  C71 về draft Back/Forward/link/close, notification pending/error/retry/active, target44px,
  expense sheet list-first và task priority mobile. Báo cáo `docs/UI_UX_REMEDIATION_C72.md`,
  đối chiếu ảnh `docs/remediation-c72/review.html`. Không thay RPC/schema/quyết toán VND.
  Lint/typecheck/diff-check, 80 unit, build và full E2E45 PASS/3 audit opt-in SKIP đều đạt.
  Geometry100 samples không overflow/target nhỏ; task bottom648,03, expense list top436,86 px.
  RPC timeout thật trên fixture local giữ unread, retry đạt; teardown profiles/loans/transactions0.
  Secret/artifact scan sạch. Thay đổi C70/C71 bảo toàn; C70–C72 chưa commit/push/deploy.
  Không blocker local. Safari/Firefox, screen reader/mobile vật lý tiếp tục NOT_TESTED.
- C73 `COMPLETED` ngày 02/10/2026: C70–C72 đã đồng bộ và rollout Preview/Production.
  Source `a5cd7b142ae2a8b24247537477ab6437c742be5c` có Required CI run `36961824893`
  SUCCESS: toàn bộ job, Auth6/6, pgTAP, E2E44 PASS/4 SKIP (3 audit opt-in, 1 timeout chỉ local).
  Run trước `36960703897` fail do fixture prepared tạo trùng Auth user; sửa riêng C72 test setup
  gọi resetLocalDatabase có guard, không đổi runtime/schema. Local/preflight/resume root đạt
  lint/typecheck/80 unit/build/diff-check và E2E45 PASS/3 audit SKIP.
  Candidate sớm `dpl_A5ViQwiJSrfATNwSyWq7VEvCc2Hh` tạo trước CI xanh không được phát hành.
- Preview C73: `dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb`, immutable URL
  <https://quan-ly-vay-ca-nhan-c6pft4h1k-ngotuong2105.vercel.app>, target preview, Ready,
  project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, Functions sin1. Root `pnpm deploy:preview`
  tạo sau CI xanh; root resume đã promote <https://tindung-preview.vercel.app> sau Auth/log gate.
  Public/authenticated candidate đạt dashboard375/390/1440 light/dark, loan detail/history,
  counterparties, expenses, notifications/unread active filter; sheet mở/đóng/focus return đạt.
  Stable alias inspect/public/Auth dashboard/expense sheet/unread filter đạt, runtime error/5000.
  Console chỉ CSP Vercel Toolbar; lỗi M_ID trước đó có source chrome-extension, không phải app.
  Rollback `dpl_6JfpS3eqM89Jtjr2b8JVzvZHLaZw` không kích hoạt.
- Production C73: `dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx`, immutable URL
  <https://quan-ly-vay-ca-nhan-7g0uxlwrm-ngotuong2105.vercel.app>, target production, Ready,
  cùng project/Functions sin1. Root deploy dùng --skip-domain; `tindung.vercel.app` giữ bản cũ
  trong khi kiểm candidate. OWNER tự đăng nhập, Auth smoke dashboard/loan detail/history/đối tác/
  expenses/notifications, sheets/return focus/filter và375/390/1440 light/dark đạt; console sạch.
  Login/manifest200, hai API không secret401. Dashboard không cookie dùng HTTP200 streaming
  NEXT_REDIRECT/login; browser thực về/login, không coi là bypass Auth.
  Promote <https://tindung.vercel.app> sau gate; inspect đúng ID, public/Auth dashboard desktop/
  mobile390dark/expense sheet/unread filter và console đạt. Skeleton dashboard xuất hiện rồi
  render task priority, không tràn ngang; controlled-delay loading có bằng chứng local E2E.
  Runtime error/HTTP500 trước và sau promote0, CLI exit0. Rollback
  `dpl_HZHgS3m93v2MoYNQSPVHi9vGwZ1T` không kích hoạt.
- C73 không migration, đổi RPC/secret/account, Apps Script/Sheets hoặc lưu/mark-read/ghi tài chính
  remote. Browser artifact tài chính không đưa vào Git. Required CI của commit tài liệu cuối phải
  được xác minh trước báo hoàn tất; kết quả exact SHA được báo trong hội thoại, không dùng run cũ.
  Chrome badge Nguy hiểm xuất hiện sau login trên hai hostname immutable, nguyên nhân OPEN.
  OWNER coi không quan trọng và phê duyệt tiếp tục; không kết luận do password toàn số/false
  positive/source compromise, không bypass hoặc đổi security setting. Stable aliases không hiện
  badge tại lần kiểm. Bằng chứng/rủi ro: `docs/C73_RELEASE_BLOCKER.md`.
  Screen reader/mobile vật lý và browser ngoài Chrome authenticated C73 vẫn NOT_TESTED.
- C74 `COMPLETED` ngày02/10/2026: audit54 lượt trên9 route/view ở375/390/1440 light/dark,
  synthetic Chrome local build; không tràn ngang. Bốn phát hiện mới: F1/F2 MEDIUM (tên công việc
  bị cắt/mất ngữ cảnh khi Xem tất cả), F3/F4 LOW (privacy dính chữ/empty unread sai copy).
  Hai đề xuất hierarchy/thẩm mỹ được phân biệt rõ. Báo cáo/matrix/evidence/mockup trong
  `docs/audit-c74/`; harness opt-in `apps/web/test/e2e/c74-audit.spec.ts`.
  Back query, save tự đóng/focus, draft/error, progress tab và sheet keyboard được kiểm lại.
  Lint/typecheck PASS, targeted audit2/2 PASS49,9s; matrix được giữ từ lượt chụp trước,
  không tuyên bố chụp lại khi rerun friction. Teardown DB test xong, profiles/loans/transactions0.
  Lượt đầu harness dismiss confirm làm abort navigation; đã sửa listener. Lượt kế local Auth502,
  restart riêng Kong test rồi dùng baseline đã reset với E2E_DATABASE_PREPARED=true; không sửa
  runtime/schema. Destination stream closed khi chủ động abort probe không quy là lỗi remote.
  Git diff-check PASS; chỉ tài liệu/ảnh synthetic/harness mới, không credential/dump/ảnh dữ liệu
  thật vào thay đổi. Không sửa sản phẩm, commit/push, deploy hoặc mutation remote.
  Safari public login đã quan sát; authenticated Safari/Chrome remote C74 không truy cập được,
  mobile vật lý/AT/Firefox NOT_TESTED. Browser từ chối file:// mockup, chưa xác minh render,
  không workaround. Cảnh báo Chrome C73 vẫn OPEN, không xác nhận nguyên nhân.
- C75 `COMPLETED` local ngày02/10/2026: OWNER phê duyệt trong hội thoại; sửa F1–F4 và G1.
  AttentionItems mở/thu gọn toàn bộ tập server tại dashboard, giữ focus/scroll; tên custom/ngày
  wrap đầy đủ, hướng cạnh loại việc, không parse chuỗi hoặc đổi nguồn quyết toán. Metadata
  heading/history có separator đúng; notification empty theo filter, CTA Tất cả, list trước
  push disclosure có trạng thái/keyboard. Không tự requestPermission/change setting.
  Report/review/ảnh synthetic/evidence `docs/remediation-c75/`; regression C75
  `apps/web/test/e2e/c75-remediation.spec.ts`. Six matrix375/390/1440 light/dark13 tasks,
  overflow0/clipped0, expand13/collapse5 giữ focus/scroll. Generated/custom privacy attributes,
  unread/all empty, explicit-back query và controlled RSC1800ms progress đạt.
  Lint/typecheck/diff-check PASS, unit/script80 PASS, pnpm build19 route PASS; C63/C67/C72
  regression19 PASS, business-flow11/11 PASS1,4 phút, final C75 3/3 PASS56,8s (rebuild cuối).
  Lượt đầu C75 fail locator đổi label/fixture idempotency; sửa harness reuse counterpart,
  stable locator. PWA filtered run thiếu suite đổi mật khẩu; full file đạt, không đổi remote.
  C72 test first-task kiểm trên mobile nav thực thay magic650px; không bỏ kiểm ưu tiên mobile.
  Ảnh sau đã xem, sửa clearance marker disclosure và align-start để chart không kéo dài theo
  task list. HTML review chưa browser render-verify vì giới hạn file://; PNG app là render thật.
  Teardown và read-only hậu kiểm profiles/loans/transactions0 trên DB test riêng55322.
  Thay đổi C74 sẵn có được bảo toàn. Không migration/RPC/Auth/credential/data remote,
  commit/push hoặc deployment. Chỉ fixture local synthetic mutate/reset; restart riêng Kong test
  để tránh gateway stale, không tác động project anh em. Không blocker local.
  Desktop compact G2/cảnh báo Chrome C73 OPEN ngoài phạm vi; Safari/Firefox/AT/mobile vật lý
  chưa kiểm mới, không coi đây là chứng nhận accessibility.
- C76 `COMPLETED` ngày 2026-10-03: rollout/Auth và sửa dependency lint blocker đạt.
  Production dependency graph/runtime source không đổi; CI mới đạt. Runtime source
  `d3fc37003ddcc551f4d9c285f1a49deb95179698`, Required CI `37032143402` SUCCESS cả5 job.
  KPI dư nợ/lãi ròng ở trên Việc cần xử lý tại375/390/1440 light/dark, khớp DOM/reading order.
  Root `pnpm deploy:preview` resume đạt lint/typecheck/unit90/build19/E2E48PASS5SKIP6,5m,
  exit0; DB test riêng55322 hậu kiểm profiles/loans/transactions0/0/0. Sáu ảnh mới chỉ synthetic.
  Preview `dpl_BBavYTasgvQ51wyTQbWunqysM6Fq`, immutable
  <https://quan-ly-vay-ca-nhan-cadt65ibt-ngotuong2105.vercel.app>, target preview,
  alias <https://tindung-preview.vercel.app>;
  Production `dpl_AurpzZ3pUxe7Xp7dWnxuWa2fjXxw`, immutable
  <https://quan-ly-vay-ca-nhan-f1v8nx2ba-ngotuong2105.vercel.app>, target production,
  alias <https://tindung.vercel.app>. Cả hai Ready, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, 43 Functions sin1, inventory245 regular leaves/0 forbidden.
  Candidate Auth smoke thực trước promote: dashboard/full task/name wrap/privacy metadata,
  biểu đồ kỳ có dữ liệu/empty, notification list/disclosure/unread empty, loans/detail/history/loading,
  counterparties/expenses và đóng drawer bằng nút; không save/mark-read/push permission/time mutation.
  Hậu kiểm alias: dashboard mobile/desktop Production, task toggle/privacy, notifications unread,
  loans/detail/history/loading; Preview dashboard/notification route đạt. Public mỗi alias4/4:
  login/manifest200, export/runner401; runtime error0 và HTTP5000 sau Auth/cả hai alias.
  Console không có app exception; CSP chặn vercel.live Toolbar trên Preview, exception M_ID
  truy nguồn chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js.
  Rollback trước promote: Preview `dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb`, Production
  `dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx`; không cần rollback, không xóa deployment cũ.
  Chưa chứng nhận AT/mobile vật lý/Safari/Firefox; remote save/permission/giờ chỉ regression local.
  OPEN: intermittent C67 focus, source artifacts rollback C73, cảnh báo Chrome immutable C73;
  thêm P2 privacy: trục chart vẫn hiện thang tiền khi ẩn (dashboard/page.tsx:171 dùng span
  CSS privacy-amount, không PrivacyAmount). Không đưa giá trị thật vào tài liệu.
  Đây là presentation có sẵn, không thay tiền/DB; đề xuất C77 audit trước remediation.
  Không còn blocker C76 về mở khóa/login; không đổi auto-lock/credential/schema/secret/Google/data remote.
  Source gate đã đạt; commit chốt tài liệu phải có Required CI đúng SHA trước báo hoàn tất.
  Bằng chứng/source/CI/history: docs/release-c76/report.md và evidence.json.

C76 dependency follow-up: CI37085353144/40e09d5 phát hiện HIGH braces dev lint; scoped
Next plugin16.3.8 tinyglobby0.2.15 alias + compatibility patch đã loại dependency này, không
bỏ rule/audit allowlist. Pinned frozen install11.9/lint/typecheck/unit94/build19/policy/full audit
PASS,4 regression glob/internal-link PASS. Production graph125 snapshots/runtime source không
đổi, không redeploy. Required CI 37086389279 của 437fea7f5a879372ffcba0a5d199a7eb8a61e01c SUCCESS cả5 job.
Root local E2E48/5 trước patch; full integration CI kiểm lại patch. Chi tiết docs/release-c76/.

- C52 `COMPLETED` ngày 2026-09-25: backup Production mã hóa và restore rehearsal đạt; CI dùng kiểm
  soát bù phù hợp GitHub Free/private; notification runner, Production smoke và runtime log đạt.
  Không deploy, migrate remote, push GitHub, `clasp push` hoặc thay đổi dữ liệu nghiệp vụ.
- C53/C54 `COMPLETED` ngày 2026-09-26: migration C51/C54, backup, rollout Vercel Production,
  authenticated smoke, runtime log, commit/push và Required CI gate đúng SHA đều đạt. Không còn
  blocker dashboard hoặc source local chưa đồng bộ GitHub.
- C55 `COMPLETED` ngày 2026-09-26: Apps Script version 6 và workbook hiện hữu đã nhận schema đối
  chiếu C47; full sync, log, hiển thị và retry idempotent đều đạt. Không ghi ngược Supabase, không
  tạo tài nguyên Google mới và không đưa secret/dữ liệu tài chính vào Git.
- C56 `COMPLETED` ngày 2026-09-26: commit C55 đã push fast-forward, local/remote khớp SHA,
  GitHub run `36226393389` đạt `Required CI gate`; Apps Script version 6/HEAD và workbook được
  hậu kiểm chỉ đọc thành công.
- C57 `COMPLETED` ngày 2026-09-26: action Supabase đã pin v3.0.1/full SHA; run
  `36228136823` đạt `Required CI gate`, không cò cảnh báo Node.js 20 hay annotation job.
- C58 `COMPLETED` ngày 2026-09-26: ma trận Production readiness đã chốt tại
  `docs/PRODUCTION_READINESS.md`; không còn phát hiện CRITICAL/HIGH, còn hai MEDIUM và một LOW.
- C59 `COMPLETED` ngày 2026-09-26: HTTP headers, lịch backup và Auth readiness đã đạt; Production,
  local full gate và Required CI của revision sửa cuối đều xanh.
- C60 `COMPLETED` ngày 2026-09-27: LaunchAgent tự tạo backup
  `qlv-prod-20260927T120432Z`, exit 0, đúng project `hmfxnstrqfqpvsgfmjmd` và migration
  `20260926001000`. Cả sáu ciphertext đạt checksum/GCM/SQL shape, quyền file `0600`, tuổi khi hậu
  kiểm 0,83 giờ; không còn `.partial`, FIFO hoặc SQL thuần. Retention 7 daily/4 weekly/12 monthly
  chỉ dry-run: giữ bốn bản và nêu một candidate, không xóa. LaunchAgent vẫn loaded, chu kỳ 3.600
  giây; secret/log/Git scan sạch. Các lần đầu fail-closed đã phơi bày hai sai lệch môi trường:
  `--file` không nhận thiết bị/FIFO dưới launchd và `migration list` có thể trả bảng; pipeline nay
  dùng stdout mặc định và parser có regression cho JSON/bảng. RPO vượt khoảng 10 phút trong lúc
  remediation rồi đã phục hồi; cảnh báo hoạt động đúng và không mất backup hợp lệ.
- C61 `COMPLETED` qua C65 ngày 2026-09-30: toàn bộ commit remediation C60 đã được push
  fast-forward; secret/dependency scan và `Required CI gate` của đúng SHA đạt. Không migration,
  thay secret hoặc sửa dữ liệu.
- OWNER xác nhận tiếp tục dùng GitHub Free/private và không nâng gói. Branch protection không được
  enforce; rủi ro được giảm bằng quy tắc chỉ phát hành SHA có Required CI gate xanh.
- Không còn blocker C52–C54 hoặc lệnh terminal dự án bị treo.
