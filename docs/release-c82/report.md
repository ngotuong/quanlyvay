# C82 — Phát hành UI compact C81

Trạng thái: IN_PROGRESS. OWNER phê duyệt03/10/2026.

Source phát hành `8ecdeb4ac5960673958ec2c75d597d1fdb1375c5` đã push;
[Required CI source](https://github.com/ngotuong/quanlyvay/actions/runs/37171480847) SUCCESS
cả5jobs đúng SHA. Preview/Production/default đã phát hành C82 và đạt public/Auth/log
hậu kiểm. C82 còn IN_PROGRESS đến khi closing docs được push và Required CI đúng
closing SHA SUCCESS. Phần dưới giữ trình tự bằng chứng/failure/giới hạn, không cấp scope mới.

Source C80/C81 `ff8f7060c81609beca0b08f01240acc95369ffb1` đã push fast-forward lên main.
[Required CI source](https://github.com/ngotuong/quanlyvay/actions/runs/37123164406) attempt1 FAILED;
không lấy các job riêng đã đạt để gọi gate toàn bộ xanh. SHA của sửa hook sẽ có CI riêng.

Startup đọc đầy đủ AGENTS/context/mục40 roadmap, git status và fetch: base main=origin/main
5ad7b7735b0fa41561ac79630b343db17ed3720f; toàn bộ thay đổi sẵn có là C80/C81 đã duyệt.
Review runtime xác nhận chỉ presentation/copy/focus/privacy lifecycle, không schema/RPC/queries
quyết toán hoặc remote data. Commit94files gồm evidence synthetic, không credential/dump.

Local lint/typecheck/unit108/build/CI policy/actionlint/JSON/JS/diff/Gitleaks pinned v8.30.1
diff+new-text+staged PASS; dependency audit không advisory. Full E2E C82 54PASS/9opt-in evidenceSKIP8,2m exit0; mọi regression bắt buộc đạt.
DB teardown riêng55322 profiles/loans/transactions0/0/0 được hậu kiểm read-only. Sáu ảnh
C75 do harness ghi lại đã restore từ source đã kiểm; không hoàn nguyên file khác.
Upload metadata guard local160files; CLI dry151regular sourcefiles/4.258.416bytes đạt0forbidden;
đây chỉ dự báo, chưa thay remote inventory. Node helper dry lần đầu ambiguous module syntax;
đã đổi import ESM và chạy đúng guard đạt, không bỏ gate.

Rollback C79 vừa đọc lại Ready/project/target/43routeFunctions sin1:
Preview dpl_CZj4ehKjxCmzc4VazPcMfr87eLbs, Production dpl_8x3Fy2rW6detxLGbsmrGSEqjhkyG.
Middleware tách riêng: Preview sin1, Production8regions gồm sin1. Chưa tạo/promote candidate.
Không cleanup, schema/RPC, secret/account/Google hoặc ghi dữ liệu tài chính remote.

Chưa thể đánh dấu hoàn tất trước candidate Auth/public/log, alias postcheck và closing-SHA CI.

## Blocker gate và remediation harness

Source run37123164406 attempt1 FAILED, không phát hành:39PASS/4FAIL/8SKIP/12NOT_RUN7,3m.
C72 beforeAll timeout120s sau reset bắt đầu12:41:29, reset hoàn tất12:42:06 rồi chờ
Auth readiness; hook bị hủy12:43:29 trước deadline180s của waitForAuthReady. C75/C78/C81
sau đó AuthRetryableFetchError ở bước sign-in, chưa chạy được assertion giao diện.
Không suy đây là lỗi UI hoặc kết luận có Auth outage Production.

Điều chỉnh riêng thời hạn fixture hooks C72/C81 từ120s lên300s để chứa reset + readiness180s
+ tạo fixture. Giữ retries0, timeout interaction/assertion, health deadline/backoff, guard
project/host/port/reset và toàn bộ regression. Không sửa Next/Auth runtime, workflow hoặc
chuyển deployment; cần full local và Required CI SHA mới trước candidate.

## Tiếp tục04/10: CI health và screenshot harness

Hook commit c5f8e2b1c7eaa564c4cee881b22b9286412b9894 đã push. Run37124048932 attempt1
FAILED ở initial globalSetup: Auth health HTTP502 sau180s/93attempts; chưa chạy E2E UI.
Registry pull cũng có Rate exceeded rồi retry; không suy đó là nguyên nhân health502.
Attempt2 rerun failed jobs trên cùng SHA, không coi rerun là PASS trước khi xong.

Full local sau hook53PASS/9SKIP/1FAIL8,0m: C75 kỳ vọng scroll383 nhưng nhận640 sau collapse.
Trace after screenshot call@7884 ghi HTML scroll_top640, trước click call@7886; pre-capture
scroll383 và expand giữ383. 390dark là mẫu fail. Đây là side effect của fullPage screenshot,
không evidence toggle runtime tự cuộn. Chuyển capture sau collapse/focus/scroll/chart checks,
không set lại scroll bằng script, không bỏ assertion, retry hoặc thêm chờ. Runtime không đổi.
C72+C75 targeted và full release gates sẽ kiểm source mới. Sáu PNG và JSON C75 harness đã
restore đúng HEAD để giữ bằng chứng lịch sử, không xóa/restore thay đổi OWNER.

CUA native app com.openai.codex bị policy từ chối khi tìm điều khiển theme; đã dừng, không
workaround hệ thống. Remote browser smoke vẫn chưa bắt đầu; nếu cần theme/login OWNER
thực hiện bước UI công cụ không hỗ trợ theo AGENTS4, không xin lại approval checkpoint.

Targeted C72+C75 sau capture fix:9PASS2,4m exit0; lint/typecheck exit0; DB55322
profiles/loans/transactions0/0/0 read-only. Restore đúng7PNG C75 do targeted tự ghi
(6dashboard và notifications390dark), giữ evidence lịch sử. Diagnostic metadata trace
ở c75-capture-diagnostic.json; không runtime change. Full/source CI mới chưa đạt tại bước này.

Capture fix source62cdb98b77ee8903a25e1e74f8ed82e9930a351d đã push fast-forward.
Run37169996632 đang E2E sau các job quality/security/policy và pgTAP/Auth PASS;
c5 attempt2 bị workflow concurrency hủy, không dùng làm bằng chứng xanh. Full local mới
54PASS/9opt-in evidenceSKIP8,3m exit0; DB55322 teardown0/0/0; restore6dashboard PNG
C75 tự ghi. CLI dry cùng source151regular files/4.258.416bytes/0forbidden.

## Checkpoint kế tiếp đề xuất sau C82

C83 — Audit sâu các module đối tác, chi phí, thông báo và cài đặt cùng control dùng chung,
kết hợp Evon ui-ux; chỉ bắt đầu sau khi C82 hoàn tất và OWNER phê duyệt C83.

Phạm vi đề xuất: Production chỉ đọc/mở/đóng; local synthetic kiểm tìm/lọc/phân trang,
loading/empty/error, dirty/pending/save-close/focus, privacy, bàn phím và control dùng chung.
Đo375/390/768/1024/1440 light/dark, tách lỗi Hỏng/Lệch hệ/Gu. Bổ sung audit/design
bộ chọn Sáng/Tối/Theo thiết bị theo câu hỏi OWNER: ưu tiên lưu lựa chọn, theo device
khi chọn System, no-flash khi mở app/chuyển route và selected/focus/accessibility. Không thay runtime/brand,
nghiệp vụ/schema/RPC/secret/account, ghi tài chính remote, push hoặc deploy.

Acceptance criteria đề xuất: mỗi finding có trigger/file/vị trí/nguyên nhân/tác động/bằng
chứng/hướng sửa; ma trận đủ hoặc ghi rõ NOT_TESTED, không lấy local thay remote. Có bảng
ưu tiên và2–3wireframe synthetic cho phạm vi cần đổi, giữ UI nội bộ/brand. Chạy hồi quy
hiện hữu áp dụng, lint/typecheck/diff/secret/JSON/JS; fixture DB55322 teardown0/0/0.
Chỉ đề xuất C84 remediation với scope/AC cụ thể rồi dừng chờ duyệt; không tự sửa các finding.

## Remediation gateway kiểm thử

Run37169996632 attempt1 FAILED:50PASS/1FAIL/9SKIP/3NOT_RUN14,7m. C81 beforeAll reset
xong02:23:26Z, health qua Kong vẫn502 đến02:26:28Z, chưa assertion UI C81. Các job
security/policy/quality và pgTAP/Auth trước E2E đạt. Rerun attempt2 không thay required gate.

[Supabase CLI issue6016](https://github.com/supabase/cli/issues/6016) mô tả cache DNS của Kong
khi reset khởi động lại Auth/Storage và địa chỉ thay đổi; chỉ dùng làm hướng chẩn đoán.
Đã tái hiện độc lập trên project disposable C20-test/port55321: trước200, Auth/Storage
đổi địa chỉ, Auth container healthy và directhealth200 nhưng Kong502; restart đúng gateway
trả200. Metadata không chứa credential/tiền/IP ở gateway-diagnostic.json. Không khẳng định
đã lấy được container log của runner đã dừng; CI symptom phù hợp cơ chế đã tái hiện local.

scripts/test-environment.cjs refresh đúng Kong sau mỗi guarded reset rồi bắt buộc health
qua gateway. Kiểm http/loopback/port/config project trước reset, Docker project label trước
restart; không wildcard hoặc chạm container khác/remote. Nếu restart/health fail thì gate
fail. Không tăng180s deadline, bỏ assertion, thêm retries, nâng CLI hoặc đổi workflow/runtime.
Unit113 gồm5test boundary/error PASS; lint/typecheck PASS; actual reset+gatewayhealth exit0.
Full E2E và source CI mới vẫn phải đạt trước tạo candidate.

Gateway source8ecdeb4ac5960673958ec2c75d597d1fdb1375c5 đã push, Required CI37171480847
đang chạy. Rerun62cdb attempt2 đã bị concurrency hủy; source mới là gate cần đạt.

Full local gateway source54PASS/9opt-in SKIP7,8m exit0; DB55322 hậu kiểm0/0/0.
Restore8PNG C75 tự ghi (6dashboard+2notifications1440), giữ bằng chứng lịch sử.
Source CI37171480847 đang E2E sau quality/security/policy/pgTAP/Auth; chưa candidate.

Source CI37171480847 SUCCESS cả5jobs, đúng8ecdeb4ac5960673958ec2c75d597d1fdb1375c5.
Unit113, pgTAP527/24files, Auth6, E2E53PASS10SKIP12,7m.10SKIP gồm9evidence opt-in và
case SQL row-lock C72 cố định container C20-test/local-only (c72-remediation.spec.ts:189);
case này PASS trong full local54/9. Không thêm skip hoặc giảm assertion để CI xanh.

Root pnpm deploy:preview chạy gate hiện hữu. Wrapper tạm .cache chỉ chặn upload đến khi
Required CI5jobs SUCCESS đúngSHA8ec và HEAD/source không đổi; inspect/project CLI vẫn
ủy nhiệm Vercel chính thức. Không đổi pipeline tracked, không bypass gate. Production tạo
từ root với --target=production --skip-domain sau local full và source CI PASS; chưa promote.

## Candidates và alias isolation

Root pnpm deploy:preview exit0: lint/typecheck/unit113/build/full54PASS9SKIP7,8m; DB55322
teardown0/0/0. Wrapper cache đã xác nhận đúng source CI/HEAD trước upload, không bỏ gate.
Restore đúng các PNG C75 do lượt root tự ghi; không hoàn nguyên thay đổi OWNER.

Preview: dpl_5nqKymiAGKqWGiVMz53B6yx5bfWM,
<https://quan-ly-vay-ca-nhan-a9a3nuj8p-ngotuong2105.vercel.app>, target preview, Ready,
43routeFunctions exclusive sin1, middleware1sin1. Production: dpl_Gk37QbGPKqxohNNq4qorbHQ89Tiy,
<https://quan-ly-vay-ca-nhan-g2w3dh0i0-ngotuong2105.vercel.app>, target production, Ready,
43routeFunctions exclusive sin1, middleware1/8regions gồm sin1. Đúng project/root/org hiện hữu.

Mỗi candidate public4/4. Returned API metadata src/out có151regular source+44lambda,
0forbidden regular filenames;151/151sourceUID khớp dry SHA1, không tải source/dump/bundle body.
11directory placeholders không có child entries, gồm tên excluded directories; không gọi
đó là file dữ liệu, không tuyên bố static/bundle contents hoặc mọi copy đã được kiểm/purge.

Production CLI --skip-domain exit0 nhưng in Aliased default; inspect chứng minh default
đã chuyển sangdpl_Gk37 trước Auth. tindung.vercel.app vẫnC79. Đã restore riêng default
về immutable C79dpl_8x3 bằng vercel alias set exit0; inspect và public4/4 xác nhận. Không
promote/rollback domain tindung vì vẫn đúng target. Hậu kiểm sau Preview-create: stable
Preview vẫnC79dpl_CZj, default vẫnC79dpl_8x3. Đây là hành vi quan sát thực; không giả định
skip-domain tự bảo đảm default isolation, không suy nguyên nhân provider khi chưa có bằng chứng.

Production pre-Auth logs query exit0, error/HTTP500 entries0; không thay hậu kiểm sau Auth.
Hai immutable login tabs được mở để OWNER tự đăng nhập theo AGENTS4. Chưa Auth matrix,
Preview resume/promote/postcheck hoặc closing CI; không đánh dấu COMPLETED.

Preview pre-Auth error/HTTP500 queries exit0/entries0; hai candidate cùng đạt gate này.
Root Preview đã restore7PNG C75 do harness ghi; JSON parse/JS syntax/diff/secret scan PASS.
Bằng chứng và trạng thái hiện tại chờ OWNER login, không yêu cầu phê duyệt lại checkpoint.

## Auth Light sau OWNER login — 04/10

OWNER xác nhận login cảhai immutable hosts. Dùng native IAB/CUA,84mẫu aggregate ở
375/390/1440:6default,6custom-dashboard,12loan-list shown/hidden,48detail4tab shown/hidden,
12guard chi phí/đối tác. KPI trước task,0overflow/0clippedmoney, copy lịch nhắc D–D+30;
custom chart26bars shown/restore, hidden1notice/0bars/0tooltip/axis—/0money trong bảng,
Enter/Escape và bảng keyboard đạt. Bốn tab record có1h1; hai guard chỉ notice trước
dialog, explicit reveal mở form, Escape/focus return đạt. Không submit/mark-read/permission.
Preset six_months qua click và đổi ngày bằng ArrowUp cập nhật URL đúng haihosts.
Date fill công cụ đổi value nhưng không phát change; không quy thành lỗi runtime,
thao tác keyboard thật kiểm được cập nhật. Snapshot trước render và viewport inactive
Production481px bị loại khỏi matrix; chỉ số sau render/viewport thực được giữ.
Consoleerror0 (querylimit200); runtimeerror/HTTP500 queries exit0/0entries sau lượt Light,
trước một số điều hướng bổ sung. Final post-candidate log vẫn phải chạy sau Dark.

Không ghi tên/số tiền/recordID/cookie/ảnh thật vào Git. Screenshot chỉ inline để soi
layout mobile/desktop; evidence.json chỉ aggregate. Boundary/error/save thực/physical
AT/mobile/Safari/Firefox không được chứng nhận bởi smoke này; synthetic local giữ riêng.
Dark hiện NOT_TESTED, browser matchMedia vẫn Light. Công cụ chỉ quảng bá viewport, native
Codex control bị policy chặn ở lượt trước nên không thử lại hoặc workaround. Đã yêu cầu
OWNER chọn Dark qua async theo AGENTS4; không yêu cầu phê duyệt lại checkpoint.
Viewport override đã reset; stable Preview/tindung/default chưa phát hành C82.

OWNER bật Dark Production tab7: native screenshot481px visual/KPI-before-task/0overflow
đạt, không lưu ảnh thật. Tab6 dùng viewport vẫn matchMedia Light dù tab7 Dark; override
375 áp lên6, không lên7. Required Dark matrix chưa đạt, không dùng481 thay375/390/1440.
Đã yêu cầu bật Dark riêng tab Preview6; không workaround native policy. Hai candidate
Ready/project/43routesin1 và source exactSHA Required CI5jobs SUCCESS được đọc lại
trước release. Chưa alias/promote; viewport đã reset.

## Candidate Auth gate đạt

Tab responsive6 hiện Dark theo matchMedia, không yêu cầu OWNER đổi thêm. Dark84mẫu
tương ứng Light84 đã chạy thực trên haihosts375/390/1440, tổng168 mẫu; không suy từ
local matrix hoặc481px. Default/custom/chart hidden/restore/Enter/Escape/table,
loan-list và4detailtab shown/hidden singleh1, explicit2form guards/escape-focus đạt.
Preset six_months và date ArrowUp cập nhật URL cảhai theme/hosts. Consoleerror0;
post-candidate queries error/HTTP500 exit0/entries0, trước final extra date navigation
Production (console0 sau đó). Source exact CI reverified5SUCCESS, candidates Ready/
43routeFunctions sin1 reverified. Đủ release gate; viewport reset.

OWNER hỏi thiếu bộ chọn theme. Source globals.css:52/837/1093 dùng media
prefers-color-scheme, layout.tsx:41 themeColor theo media; settings chưa có app preference.
Đề xuất C83 audit/design Sáng/Tối/Theo thiết bị, persistence/device-change/no-flash/a11y;
không tự triển khai runtime ngoài C82.

## Production release và hậu kiểm

Promote dpl_Gk37 exit0. tindung và default inspect cùng đúngC82 ID/Ready, public4/4
mỗi alias. OWNER sessions hiện hữu dùng được, không cần xuất/copy cookie. Native Dark
postcheck stable dashboard375/390/1440 KPI-order/0overflow/0clipped, chart shown26/hidden0/
1notice/axis—/restore26/Enter-Escape đạt; default390 cùng privacy/restore + custom drawer
Escape/focus đạt. Stable390 hai guard explicit reveal/form/Escape/focus, loans và4detail
tab singleh1/0overflow đạt. Browsererror0, post-alias error/HTTP500 queries exit0/0entries.
Batch CUA timeout60s làm REPL reset, đã kiểm state/đóng drawer rỗng và rerun nhỏ; toàn bộ
lượt mất output không dùng làm PASS. Không data submit. Preview resume đang full E2E.

## Preview release và gate chốt local

Root resume exit0: lint/typecheck/unit113/build/full54PASS9opt-inSKIP8,0m. Stable alias
tindung-preview chuyển đúng dpl_5nqK, inspect/project/43routesin1/public4/4 đạt. Native
Auth Dark375/390/1440 dashboard KPI-before-task/0overflow/0clipped, shown26/hidden0/
notice1/axis—/restore26;390two guards/full form/Escape/focus, loans/detail4tab singleh1
đạt. Browsererror0 và post-alias error/HTTP500 exit0/0entries. Các session stable hiện
hữu dùng được, không export credential. Viewport reset. C79 rollback giữ Ready, final
release không cần kích hoạt. DB55322 đúnglabel C20-test hậu kiểm0/0/0. Restore đúng7PNG
C75 tự ghi; không broad restore. CI policy/actionlint/JSON/script-syntax/diff PASS.
Closing docs push và Required CI đúng SHA vẫn là gate còn lại, không dùng source CI thay.
