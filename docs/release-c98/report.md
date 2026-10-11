# C98 — Nghiệm thu A và phát hành

C98 COMPLETED ngày11/10/2026. Chuỗi UI/UX C92–C97 đã phát hành trên Preview,
Production và alias mặc định; local gates, CI source/closingproof và authenticated rollout/hậu kiểm đạt.
Source211f8e4/CI38069136549 và closingproof4b22848/CI38144466141 SUCCESS5jobs.
Finalstatus7e130d9/CI38146959473 bị hủy cả2lần do job35m; lượt2 tới102/102 rồi teardown,
không có summaryE2E/PASS. OWNER duyệt riêng deadline jobintegration35→45m ngày11/10;
đã đổi một dòng workflow, giữ test/assertiontimeouts/retries0/102bài/skips/reset/teardown/5jobs/gate.
[AmendmentclosingCI38152652299](https://github.com/ngotuong/quanlyvay/actions/runs/38152652299)
của `eebe68d16493c5aeb574fc3bca86fab8601791d5` SUCCESS đủ5job:pgTAP527/24files/Auth6/0/
E2E83PASS19SKIP0FAIL30.0m,retries0. [Bằng chứng](amended-closing-ci.json),
[lịch sử blocker đã giải quyết](final-ci-blocker.json),[phê duyệt/patch](ci-budget-proposal.md).
Commit trạng thái cuối chỉ sửa tài liệu; CI đúngSHA5SUCCESS phải đạt trước báo OWNER,
SHA/run ghi hội thoại để tránh vòng commit tự thamchiếu. Chưa có checkpoint kếtiếp; không tựmởC99.

Thiết kế A giữ B/Inter/KPI trước task; mobile Dashboard cards/desktop table, tên200 có disclosure,
helper14/ngoại lệ12, notification selected/hover rõ; principal chip+50/+100/+150/+200tr bằng BigInt;
Dashboard interesttask mở drawer1click/0route, shared financial form authoritative. Loading9route,
reservebody/freshbalance, damping/snapback/reducedmotion theo C97. Không thay schema/RPC/Auth/
financialengine/remote data để smoke. C98 ghi exactfingerprint exception cho checksum bị nhận nhầm là APIkey (history vẫn quét đầy đủ),
loại .gitleaksignore khỏi Vercel payload và sửa4test-port assertions theo CI54321/local55321;
assertions nghiệp vụ/timeout/retry/skip giữ nguyên. 153websrc khớp C97, gồm4DS_Store không upload.

## Bằng chứng local hiện có

- Lint/typecheck/unit121/build19/policy/actionlint/audit PASS; fullE2E84PASS18SKIP0FAIL19.4m/retries0.
- Matrix2:2PASS0FAIL3.5m.100samples (9route+drawer×5width375/390/768/1024/1440×LightDark),
  72stress (9route×4viewport/font×2theme),4Systemprivacy,10keyboard/draft/close/focus. Submit0.
- 36VND presentation biên:0/maxsigned64/âm17digit×6width320–1440×2theme, actualVndText/
  formatter, số/₫ cùng dòng và đủ; không ghi max/signed vào ledger.
- 36zoom mô phỏng:CSSwidth=physical/2,DPR2 trên6route×3width×LightDark; ảnh/glyph physical2x
  được đo. Native browser zoom và softkeyboard/phone không được chứng nhận.
- Contrast/probe2PASS0FAIL3.3m; supplemental1PASS0FAIL1.4m,20blocks/1224nodes0fail.18route-theme blocks/1186paintedtextnodes, min4.8294:1,0fail;
  threshold4.5text/3large giữ. Parser normalized color(srgb) đúng; rawmatrix21fail được lưu.
  Focus/nontext chọn C92, C94 và form/control regression được giữ; không toànWCAG/AAA claim.
- Evon nguyênchecks7fixedwidths/theme,55Lightsweep:0overflow/brokenmoney/tinytext/tinytarget/
  console. RawP1preparedfocus-scroll tại375/390; actualready375×900scroll0 trước và sauclearfocus.
  RawP2/P3 zero-tooltip contrast1:1 được giữ; supplement đo ancestor chart-tooltip opacity0
  cả LightDark, không painted. Không dùng tooltipẩn để gọi lỗi contrast thực hoặc xóa raw.
  Focus/nativepickers/density/hoverborder warnings giữ theo selectedA, không redesign lại Gu.
- Đã xem contact sheets40ảnh Sáng/Tối: phân cấpKPI/task/chart, tên/VND/form/card/tables đúngA;
  drawer ở375/1440 có nútHủy/Ghi nhận táchbodycuộn. 56PNGfixture bền trongscreenshots/.
  C97 windows53/55observations/CLS≤.1, reducedmotion vàfinancialguards đã qua fullE2E.
  Supplement screenshots8rootfont/reflow/2paintedzoom đã xem; rootfont32 không chứng nhận resize
  mọi fixed-pxtext200%, nativezoom giữ NOT_TESTED. Kết quả glyph2x/PNG physical của zoom emulation riêng.

## Phát hành và hậu kiểm

[Source CI](https://github.com/ngotuong/quanlyvay/actions/runs/38069136549) của
`211f8e49eee0b78eca4c9723b526604a99780b3d` SUCCESS đủ5job:pgTAP527/24files,Auth6/0,
E2E83PASS19SKIP0FAIL24.9m. RootPreviewcreate84/18/0/19.4m, resume84/18/0/20.2m/retries0.
CLIshim exactHEAD/153runtimehash/5jobCI failclosed trước candidatecreate; không bỏgate.

| Deployment | Immutable URL | Target/region | Alias |
| --- | --- | --- | --- |
| dpl_3BXyNm6T6Kp24CmNqz25YtPgVyD1 | [Previewcandidate](https://quan-ly-vay-ca-nhan-b4oyajmx7-ngotuong2105.vercel.app) | Preview Ready/45routes sin1 | [stablePreview](https://tindung-preview.vercel.app) |
| dpl_5aqr2F3aWQJhTZizH1zMyXgEL7hF | [Productioncandidate](https://quan-ly-vay-ca-nhan-havdwo649-ngotuong2105.vercel.app) | Production Ready/45routes sin1 | [Production](https://tindung.vercel.app), [default](https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app) |

Project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, scope ngotuong2105 vàAPIowner/project/SHA đúng.
188/188regularsourceUID khớp mỗi candidate, không tải bodies. Middleware riêng: Preview sin1,
Production8regions gồm sin1; không đánh đồng với45routeFunctions. Production skip-domain rồi
promote exit0; Preview chỉrootpnpmresume. Baalias inspect đúngIDs/target/Ready/sin1.

Native trước chuyển72mẫu:9route×375/1440×LightDark×2candidate, moneyvisible/Inter/overflow0/
VNDunits/loadedcontent/KPIbeforetask. Extra18privacyhidden/system319baselines giữ riêng. Drawer
1click/0route,480pxdesktop/mobileinset12px, freshbalance/Tabdate/Escape/focusreturn đạt; Quick Amount
+50/+100/+150/+200tr, nháp1000→50001000→150001000,noautosubmit. OWNER hỗtrợ nativeCancel giữ
nháp/focus vàdiscard; không native financialsave. Cua timeout/unsupportedDOM/wronghelperselector/
falsequickassertions/prematurefallback giữ disposition, không coi lượt lỗiPASS. Readiness selector
KPI chung có2sections ởdesktop; đổi finalPreview helper sang unique primarysection không sửa app/test.
23lượt providerdeadline của đợt đầu được giữ, actualcontent được đo sau. Lượt Previewpost batch30s
kernelreset bị loại; final20mẫu được lưu từngmẫu. [Candidates](native-auth-candidates.json),
[aliasAuth](native-auth-aliases.json), [Previewpost](native-auth-preview-post.json).

Sau chuyển60mẫuAuth (20mỗialias):9route×LightDark375,DashboardLightDark1440;6cleandrawerchecks
Tab/Escape/focus/overflow0. Public4/4mỗicandidate vàmỗialias;console0/runtimeerror0/HTTP5000
trongcửasổ smoke timestamps ở [deploymentproof](deployment-proof.json), không zeroerror toànapp.
Preferences System/privacyhidden trêncandidate/Preview/Production, defaultSystem/moneyvisible;
viewportreset. Khôngđánh dấuđãđọc/accountwrite/saveledger. C91rollback PreviewCcJW… vàProduction/
defaultBnfe… freshidentity/Ready/sin1/Public/Auth/log verified, khôngkíchhoạt;[rollback](rollback-proof.json).

Bảo toàn1296initialtracked/10allowedchanged/1286unchanged,153runtime/73financialfiles exact;
17C75exact/15generatedrestored saurootresume. DockerC20-testlabel/DB55322/sixcounts0 sauteardown,
main54322 khôngdùng. [Preservation](preservation.json),56PNGhash/JSONparse PASS. Localserverlog có
negativeAuth/injectedexpenseerror/destination-stream-closed-early, giữ raw không gọi toànapp runtime0.
Closingproof CI đúngSHA SUCCESS5job; [closingproof](closing-ci.json). C98 COMPLETED sau amendmentCI45m đãđạt; không mởcheckpoint kếtiếp.

## Giới hạn và rủi ro

AT/physicalphone/softkeyboard/nativeclipboard/nativezoom/authenticatedSafariFirefox/OS-theme-live/
PWA-beforeHTML/remote save NOT_TESTED. C91 query_canceled57014 chưa xác định nguyên nhân;
không DB tuning trong C98. Smoke remote chỉ đọc và mở/đóng draft, không lưu giao dịch tài chính.
Rawfailures/interrupted/harness được giữ trong [verification-history](verification-history.md).
