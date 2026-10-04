# C82 — Phát hành UI compact C81

Trạng thái: IN_PROGRESS. OWNER phê duyệt03/10/2026.

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
Đo375/390/768/1024/1440 light/dark, tách lỗi Hỏng/Lệch hệ/Gu. Không thay runtime/brand,
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
