# C91 — Phát hành bản sửa VND và tab C90

Bản C90 đã chạy trên [Production](https://tindung.vercel.app), [Preview](https://tindung-preview.vercel.app) và default alias. Rollout và hậu kiểm đạt. C91 **COMPLETED** sau khi Required CI của commit bằng chứng chốt đạt. C92 **AWAITING_APPROVAL**, chưa bắt đầu.

Source `ed72b8615e19f2a3e6667014c86da4ac920ed1ba` đã push fast-forward. [Required CI37644195261](https://github.com/ngotuong/quanlyvay/actions/runs/37644195261) SUCCESS cả 5 job đúng SHA: pgTAP527/24files, Auth6/0, E2E63PASS19SKIP17.8m. Local sau patch: lint/typecheck/unit117/build19/policy/actionlint/audit/secret/nativecompat PASS, E2E64PASS18SKIP12.9m/778.1s, retries0/fail0. Root Preview create64/18/11.8m, resume64/18/12.1m, toàn resume 757.3s. CI thêm một ca C72 SQL-lock vốn chỉ chạy local; không thay assertions, retries hay skips.

Preview `dpl_CcJW5X4RDoUjCnPyi34t8uWapJCV`, immutable https://quan-ly-vay-ca-nhan-1ypbqdcn7-ngotuong2105.vercel.app, targetpreview/Ready/sin1. Create và resume chạy repository-root `pnpm deploy:preview`; resume sau Auth/log PASS. Stable alias `tindung-preview.vercel.app` trỏ đúng candidate và hậu kiểm đạt.

Production `dpl_Bnfe3DmqhkZ2vdKKkgZZJrNosEHu`, immutable https://quan-ly-vay-ca-nhan-j2j77wuy3-ngotuong2105.vercel.app, targetproduction/Ready/sin1. Candidate rootdeploy với `--skip-domain` giữ C88 đến khi gate đạt. Promote exit0; `tindung.vercel.app` và `quan-ly-vay-ca-nhan-ngotuong2105.vercel.app` trỏ đúng candidate, hậu kiểm đạt.

Hai candidate đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F` và team `team_1BMzW3A2mFKTuGEyw1Z868Nx`, 43 route Functions chỉ `sin1`. Middleware Preview sin1; Production8regions gồm sin1. API Preview targetnull được giữ cạnh scopedCLI preview/Ready/exactproject-team. Inventory mỗi candidate157source regularfiles/44lambdaentries/0forbidden leaves;157/157 UID khớp CLI drySHA1. Tên thư mục excluded không có childleaf không được coi là file upload. Chỉ đọc metadata/UID, không tải secret/dump/source/bundle bodies và không khẳng định purge mọi copy.

Native Auth trước rollout140unique mẫu: mỗi candidate7route×5viewport375/390/768/1024/1440×LightDark. Actual width/theme,0overflow/1visibleH1/Interloaded/body16/Bcanvas Light234,240,248 và Dark11,18,32/KPI trước task đạt. VND đang vẽ giữ số/₫ một dòng và nằm trong container; Dashboard15, loanlist68, detail5 cụm tiền mỗi mẫu. Bốn tab detail một dòng,14px/48px. Primary hero nhỏ nhất26.25px≥18; secondary17.6px giữ nguyên1.1rem theo C90. 32 kiểm tra interaction cuối đạt:6drawer mỗi candidate Tab/Escape/focus return, tabEnter/current/Back, privacy loại tiền và trigger giao dịch, expenseguard, dashboardquery/Back, notification unread=true/Back, task44px/14px. Console5tabs0; runtimeAuth error0/HTTP5000. System/privacyẩn restored và viewportreset.

Sau chuyển alias54Auth mẫu,18 mỗi alias:7route×LightDark tại390, bổ sung Dashboard375/1440. Actual width/theme/layout/B/Inter/KPI/glyph/tab đạt;12checks cuối tabEnter/Back,drawerkeyboard/Escape/focus,preference restore vàconsole sạch. Public mỗi alias4/4:login/manifest200,export/runner401. Runtime kiểm lại sau toàn bộ Auth: error0/HTTP5000/CLI0. System restore; Preview/Productionprivacyẩn, default giữ hiển thị tiền. 9tabtạm đã đóng,2tab OWNER giữ; không logout/revoke session. Xem alias-auth-post.json.

Rollback C88 fresh Ready/exactproject-team/target/43Functions sin1 đã xác minh trước chuyển: Preview `dpl_DWAs22T33Lt69qo9kdnYbXEs6dov`, Production/default `dpl_3QFNFMS7hvU7pdocnSsUVLrs27wo`. Không cần kích hoạt; không xóa deployment.

Audit đầu FAIL2HIGH: [source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), [sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). OWNER duyệt riêng source-map-js1.2.2/sharp0.35.5;libvips1.3.4 theo Sharp.56lock packageblocks chỉ hai families, không nâng Next/React/Tailwind/CLI, không nới allowlist. Frozeninstall/audit0known/native SVG→PNG→resize→raw/source-map roundtrip Darwinarm64 PASS. Helper đọc sharp/package.json không được export đã chuyển sang public sharp.versions.sharp; giữ lỗi helper, không sửa runtime.

Guard C20-test55322 đúng Dockerlabel/port, sáu counts0.17C75 files exact/15generated restored.274effective baseline hashes khớp, gồm273exactoriginal và1proposal.css chỉ normalize terminalwhitespace. Original bytes/hash trong ignored cache giữ; CSS tokens/rules/render không đổi. C89/C90 source,harness,artifacts bảo toàn; runtime sau sourcecommit không đổi. Staging whitespace failure, watcher gọi trước khi cóSHA và helper failures đều giữ dấu vết.

Native helper sai lệch có disposition: parseFloatglobal/evalunsupported,streamwaittimeout,6samples đo closed-details bị loại,5samples Production319px do tab khôngactive bị loại,implicit DIALOG khiến lượt focus đầufalse rồi final semanticPASS,expenseprivacyguard,query giả địnhunread1 thay vìtrue,Previewquerywait timeout sau đó actualURL/loadedDOM đạt. Default Dashboard Light/Dark cũng có native wait timeout; không nhận mẫu đến khi main/KPI render, final54unique đạt. Không gọi lượt lỗi helper PASS hoặc suy nó là app lỗi.

Giới hạn: remote max/signed/stress ledger, Chi phí empty/distribution/pagination/glyph, physicalAT/mobile/SafariFirefox/OS-theme/PWA trướcHTML/remote save **NOT_TESTED**. Local C90 synthetic bổ trợ, không thay chứng nhận remote/device. Không input/submit/mark-read/pushpermission/finance/account/schema/RPC/secrets/Google/backup mutation hoặc cleanup. Ảnh/tên/amount/UUID/cookie thật không Git; report chỉ redacted aggregates và metadata.

Bằng chứng: evidence.json,candidate-metadata.json,auth-matrix.json,auth-interactions.json,alias-auth-post.json. Closingproof `839d34b348e7dd435688365435cc0336bfcb4eb0`: [Required CI](https://github.com/ngotuong/quanlyvay/actions/runs/37803762628) SUCCESS cả5job đúngSHA, pgTAP527/Auth6/E2E63PASS19SKIP20.0m. Full-history Gitleaks0findings (số commit theo evidence). CI của exact finalstatus SHA phải SUCCESS trước thông báo hoàn tất; SHA/run cuối ghi trong hội thoại để tránh vòng commit tự tham chiếu. C92 AWAITING_APPROVAL, chưa triển khai.

Closing CI [37659616241](https://github.com/ngotuong/quanlyvay/actions/runs/37659616241)
/705b6da attempt1 FAIL: E2E62PASS19SKIP1FAIL20.9m, C87 delayed RSC interceptor
báo `route.continue: Route is already handled!`; pgTAP527/Auth6 và3job còn lại PASS.
Race tái hiện trên synthetic HTTP transport3request: original exit1 cùng lỗi,
drain-before-unroute exit0/3HTTP200. Test-only sửa C87 đợi callbacks trước gỡ routing;
không đổi assertions/timeout/retries/skips hoặc runtime157UID/candidates. 274baseline
manifest vẫn nguyên; C87 nằm ngoài manifest, originalbytes/hash ghi ignoredcache.
Local test startup lần đầu không tới setup vì Docker dừng; helper module/manifest lỗi
chuẩn bị giữ trong evidence. Harness remediation local và exact closing CI đã PASS; failure ban đầu được giữ để truy vết.

Sau bản sửa harness: targeted C87 **3/3 PASS4.3m**, retries0; lint/typecheck PASS.
Full E2E mới **64PASS18SKIP11.5m**, retries0/fail0; exact closing CI đã PASS. Test C87 bị loại khỏi payload bởi `.vercelignore`;
không redeploy chỉ để đưa test lên Vercel. Xem c87-gate-remediation.json.

Hậu kiểm khi tiếp tục ngày08/10: ba alias vẫn đúng ID, public4/4. Probe1h phát hiện
Dashboard database-read error: Preview1, Production/default2 mỗialias (chung deployment),
HTTP5000. SQLSTATE57014 là [query_canceled](https://www.postgresql.org/docs/current/errcodes-appendix.html);
chưa xác định nguyên nhân hủy truy vấn. Thử lại/tải mới ba Dashboard hồi phục, KPI render và
errorBoundaryfalse/loadingfalse. Khoảng hậu kiểm mới từ15:40:44Z tới15:42:29Z không có error
hoặcHTTP500 trên baalias. Giữ lỗi cũ; không gọi toàn bộ cửa sổ1h sạch hoặc đã sửa database.
C91 không chỉnh schema/RPC/timeout; rủi ro tái diễn còn ghi nhận. Offline indicator ở tab
Production khôi phục và navigator-proxy thiếu được ghi, không dùng làm bằng chứng network.
Xem continuation-health.json.
