# C91 — Phát hành bản sửa VND/tab C90

C91 IN_PROGRESS. OWNER phê duyệt checkpoint và bản vá riêng dependency ngày07/10/2026.
Làm việc tại repository canonical `/Users/ngotuong/AppsScript/QuanLyVayCaNhan` theohandoff;
worktree6f9e thiếuC89/C90 và handoff. Giữ source/artifacts C89/C90, không triển khai C92–C98.

## Source và gate

RuntimeC90 chỉ globals.css: đủ chữ số/₫ cùng dòng và tab chi tiết một dòng/48px.
C63 chỉ readiness assertion settlement-preview trước đo drag; không đổi lifecycle nghiệp vụ.

Audit lượt đầu FAIL2HIGH:
[source-map-js GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q),
[sharp GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w).
Sau OWNER duyệt: overrides source-map-js1.2.2/sharp0.35.5, libvips1.3.4 đi kèmSharp.
Lock package blocks chỉ đổi hai families, không nângNext/React/Tailwind/CLI, không nới allowlist.
Frozeninstall/policy/actionlint/audit/lint/typecheck/unit117/build19 PASS. NativeSVG→PNG→resize→raw
và source-map roundtrip đạt Darwinarm64. Helper lầnđầu đọcsharp/package.json không đượcexport;
đổi helper đọc publicsharp.versions.sharp rồiPASS, không sửa runtime.

PrepatchfullE2E64PASS18opt-inSKIP12.9m/777.5s, retries0/fail0; postpatchfullE2E đang chạy.
Sourcepush/RequiredCI đúngSHA chạy song song; candidate chỉ tạo khi local+exactCI đềuPASS.
Không giảm assertions/retries/skips; giữ auditFAIL và mọi rawfailure. CIpgTAP/Auth theo workflow.

## Rollback và preservation

Freshinspect/API metadata/publicsmoke C88 rollback ngày07/10:
Preview dpl_DWAs22T33Lt69qo9kdnYbXEs6dov / quan-ly-vay-ca-nhan-fhyaozonj-ngotuong2105.vercel.app;
Production/default dpl_3QFNFMS7hvU7pdocnSsUVLrs27wo / quan-ly-vay-ca-nhan-p352oynyb-ngotuong2105.vercel.app.
Đúngproject prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F/team/target/Ready,43routeFunctions sin1;
middlewarePreview sin1/Production8regions gồm sin1. Public4/4 mỗialias:login/manifest200,
export/runner401. Candidate/alias/Auth/log/metadata gate bản mới vẫnPENDING. Không cleanup.

274baseline files:122source,92C89artifacts,40C90artifacts,17C75 và3harness.
Prepatchteardown đúngC20-test55322 verifiedlabel/port:sixcounts0,274hashmatch;
15C75generated restored từngfile exactbaseline,17C75match. Saupostpatchfullsuite hậu kiểm lại.
PinnedGitleaks8.30.1 newsource/docs/diff/artifacts0findings; scan lại trướcpush/closing.
Uploadguard dự đoánmetadata local166filesPASS, remoteinventory/UIDmatch phải kiểmcandidate;
không tảisecret/dump/bundle bodies. BrowserbaselineSystem/privacyẩn được giữ, tabtạm đóng.

## Giới hạn và kế tiếp

PhysicalAT/mobile/SafariFirefox/OS/mạngPWA trướcHTML/remote save và max/signed ledger NOT_TESTED.
Không QAdata remote, finance/account/session/mark-read/pushpermission/schema/RPC/secrets/Google/
backup mutation. Đăng nhập candidate thiếu phiên do OWNER tự thực hiện theo roadmap.
Ảnh/tên/amount/IDs/cookie thật chỉcacheignored nếu cần, khôngGit.
C92NOT_STARTED. ChỉCOMPLETED sau local/sourceCI/candidate/aliases/log/closingCI đúngSHA đạt.

Stagingdiff lầnđầu FAIL tạiC89proposal.css line12(trailing whitespace/blankEOF).
Chỉ normalize whitespace cuối file; toànCSS tokens/rules/nội dung và render giữ nguyên.
Originalbytes/hash lưuignoredcache, originalbaseline giữ; effectivepreservation khai báo
ngoại lệ1file này.273file còn lại exactbaseline, source/runtime/C89harness/C90 toàn bộ giữ.
WatcherCI lầnđầu gọi trướcsourcecommit bị thiếuSHA, không cóCI/deploy nào chạy ở lượt đó.
