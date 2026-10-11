# C98 — Lịch sử verification

C98 đã được OWNER phê duyệt ngày10/10/2026; phạm vi A/C92–C97, nghiệm thu và release C91/runbook.

1. Đọc code phát hiện bốn test C94–C97 khóa port55321, khác CI disposable54321. Kỳ vọng đổi theo
   CI environment giống guard helper hiện hữu; không nới assertion nghiệp vụ/timeout/retry/skip,
   không runtime/schema/Authcontract change. CI remote sẽ xác nhận nhánh54321; local giữ55321.
2. Matrix1 INTERRUPTED/1DID_NOT_RUN:9route375Light đã đo; trace xác nhận helper gọi accessible
   name '+50tr' trong khi nút có aria-label 'Cộng 50 triệu đồng'. Dừng exact runner bằngSIGINT,
   teardown isolatedtestenv; không retryblind/không gọiPASS. Sửa locator theo ARIA hiện hữu,
   thêm actiontimeout15s để lỗi locator không chờ20min. Systemtest dùngdata-theme='system' và
   so backgroundcomputed với explicitmode; code/appdocument xác nhận preference làsystem,
   effective màu doCSSmediaquery. Không đổi sản phẩm để khớp helper.

Gates còn đang chạy; không phát hành trước sourceSHA/RequiredCI/gate đạt. NOT_TESTED physicalphone/
AT/authenticatedSafariFirefox/nativezoom/clipboard/OS-theme/PWA-beforeHTML/remote save. Rawtrace/session/
log ở ignored.cache/c98, không đưa secret hoặc dữ liệu tài chính thật vào Git.

3. Matrix2:2PASS0FAIL3.5m;100main/drawer,72reflow/text200/shortviewport,4Systemprivacy,
  36bigintpresentation/36paintedzoom emulation. Tất cảoverflow0; shape/labels/keyboard/draft/focus
   giữ. Không ledger write với max/signedVND; dữ liệu giả do fixture RPC tạo trên C20-test.
4. Rawcontrast lần đầu21fail do helper chỉparseRGB và coiCSScolor(srgb0..1) nhưRGB0..255.
   Thêm parser đúng normalized255, unknownformat fail thay vì lấyblackfallback. Ngưỡng text4.5/
   large3 giữ; đo lại riêng18route-theme blocks. Raw21 vàmatrix1trace giữ ở.cache/c98.

5. Contrast/probe2PASS0FAIL3.3m:1186textnodes/min4.8294/0fail. Evon rawP1focus-scroll/P2P3zero
   tooltip giữ; actualready375×900before/clearfocus0. 46PNG được sao chép bền;153websrc C97hash
   khớp. Packaginghelper lần đầu khóa nhầm149tracked thành153 (4ignoredDS_Store); assert fail
   trước viếtmanifest, đã dùng đúng C97manifest153. Không source/runtime change.

6. Full-history pinnedgitleaks8.30.1:172commits/1finding, generic-api-key tại C92 reference-manifest
   line6. SHA2565242306f…bd66079 khớp chính xác reference/tokens.css; đây là checksum publicfixture,
   không credential. Thêm .gitleaksignore một fingerprint exactcommit/file/rule/line có giải thích,
   giữ rawredacted finding, không rộng path/rule hoặc rewritehistory. .vercelignore loại metadata này.
   Artifact scan0findings; full-history sẽ chạy lại với exception đã xác minh.

7. Source83bc0fe/CI38068842563:QualityFAIL tại2scriptunit tests do .vercelignore thêm .gitleaksignore
   nhưng metadata guard rules chưa đồng bộ. Policy/securityPASS, integration còn chạy ở thời điểm
   phát hiện. Đây là thiếu sót packaging C98, không runtime UI lỗi. Thêm đúng rule vào supported
   contract, assertUploadMetadata chặn .gitleaksignore trực tiếp và bổ sung assertion bảo vệ;
   existing assertions/timeout/retry/skip giữ. Không coi CI này SUCCESS hoặc tạo deployment.

8. Source211f8e4/CI38069136549:guard sửa đúng contract;121unit PASS, remoteQuality/Policy/Security
   PASS; integration đang chạy. SourceCI83bc0fe overallCANCELLED do concurrency khi push bản sửa,
   QualityFAIL vẫn được giữ; không lấy integration bị hủy làm bằng chứng PASS. Chuẩn bị ignored
   CLI shim fail-closed trước deploy:exactHEAD,153runtimehash và5jobRequiredCI SUCCESS rồi mới gọi
   VercelCLI nguyên bản. Rootpnpm deploy:preview vẫn chạy đủ gate; localgates có thể chạy trong
   khi CI tiếp tục, candidate creation bị chặn nếu CI chưa SUCCESS. Không bypass pipeline/gate.

9. Full local84PASS18SKIP0FAIL19.4m/retries0; extra contrast drawer1PASS0FAIL1.4m:20blocks/1224
   textnodes0fail/min4.8294. Zero-tooltip số0/₫ có ancestoropacity0 cả LightDark: rawP2/P3 không
   painted, không loại raw. Restore15generated C75exact17;1296trackedbefore/10allowedchanged/
   1286unchanged/153runtimefreeze/73financialprotected/DB55322guard/sixcounts0. RootPreview create
   chạy đủ gate trong khi sourceCI tiếp tục, ignoredshim kiểm CI exactSHA trước bất kỳ candidate.

10. SourceCI38069136549 SUCCESS5job;pgTAP527/24files/Auth6/0/E2E83PASS19SKIP0FAIL24.9m.
    RootPreviewcreate84PASS18SKIP0FAIL19.4m vàsourceCIshim PASS trướcdeploy. Preview3BXy…/
    Production5aqr… immutableReady/public4/4/188UIDmatches/preauth0errors500 mỗi bản;45route
    Functions sin1. Baalias vẫnC91. Nativecua mỗicandidate redirects/login, OWNER_LOGIN làblocker;
    đãmởtabs7/8 vàhỏi. Khôngverifiedflag/resume/promote/alias/financial/account/schema/secretwrite.
    Restore15C75phasepreview-create exact17/1296initial10scope/1286unchanged/153runtime/73financial/
    C20-test55322guard/sixcounts0. LocalservernegativeAuth/injectedexpense/stream-closed giữ raw.

11. OWNER đãđăng nhập cả2candidate 11/10; DashboardAuth đạt. Preview9route Light375/privacyẩn
    nativecontent/fonts/overflow0, privacyguard/drawer1click0route/quickdraft1000→50001000→150001000
    đạt; khôngsubmit. Helper prematurefallback bị loại, compareDocumentPosition khôngsupport sửa
    bằng DOMorder, sai class loan-card-link đổi đúng source loan-card. Hai falsequick assertions
    do hànhđộng select/fill/click quá sát được kiểm lại với nháp1000 stable trước cộng, không lấy
    lượt lỗi làmPASS. DirtyHủy nativeconfirm chặnCDP, getJsDialog khôngtrảhandle; công cụ từchối
    điều khiểnCodexapp. OWNER được nhờHủy/Cancel, native dirtyreject chưachứngnhận;local/CI giữ.

12. OWNER discardnháp verified; nativecandidate72requested PASS; 23CuaDashboardreadydeadline
    observed loading, actualready finalmeasure accepted. Bothprefs restored. Productionpromoteexit0,
    tindung/default exactcandidateC98/45sin1,40Authsamples4cleandrawers/public4each/runtime0/console0.
    FreshC91rollback43sin1/identity/Auth/public/runtime verified, notactivated. RootPreviewresume
    reruns unchangedgate; C75generated files await exactrestore after teardown. No remote save.

13. RootPreviewresume PASS84/18/0/20.2m,retries0; freshrollbackC91 inspected/asserted beforealias,
    stablePreview exactcandidate/publicgatePASS. Restore15C75exact17/153runtime73financial/C20six0.
    FinalPreviewpost20Auth+2cleandrawerPASS/public4/console0/runtime0error500; all3aliasesC98.
    Cua30sbatchkernelreset midclean drawerexcluded; Escapeclosed/focusrestored; finalsamples saved
    individually. DesktopKPIhelper wait strict2sections correcteduniqueprimaryselector, noapp/testchange.
    FinalclosingCI stillpending, noCOMPLETEclaim. PrivateDashboardJPEGcacheonly, noGitfinance/identity.

14. Closingproof4b22848/CI38144466141 SUCCESS5jobs exactSHA; pgTAP527/24files/Auth6/0/
    E2E83PASS19SKIP0FAIL27.4m/retries0. Supabaseimagepull từngDockerHubtoomanyrequests nhưngCLI
    phục hồi vàjobPASS; lograw giữcache,khônggiảmtesttimeout/assertions/retry/skip. Scopedsecret26files
    pinnedredactedexit0/JSON56PNGhash/diff/sourcefreeze/C75/C20zero PASS trướcclosingcommit.
    C98COMPLETED; finalstatusdocs-only cònkiểmexactSHA CI trước báoOWNER, khôngtựmởcheckpointmới.
