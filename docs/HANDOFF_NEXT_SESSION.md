# Bàn giao — C96 hoàn tất, C97 chờ duyệt

C96 COMPLETED local ngày10/10/2026; OWNER đã duyệt trong hội thoại. C97 AWAITING_APPROVAL,
C98 NOT_STARTED. Dừng đúng checkpoint; không tự triển khai loading/motion hoặc phát hành.
Repository chuẩn: `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`.
Phiên mới đọc toàn bộ AGENTS.md/PROJECT_CONTEXT.md, roadmapC97(section50),gitstatus và
xác nhận OWNER phê duyệt C97 trong hội thoại trước khi thực hiện. C92 đã chọn A; không mở lại thiết kế.

C96: mộtclick interesttask OWNER/EDITOR mở drawer tại Dashboard,0route transition.
Desktop480px/inset16px, mobileinset12px/maxheightviewport−24px, bodycuộn/headerfooter giữ.
Dynamic drawer/form/context chỉ mộtselectedloan. APIpayment-context read-only/session/RLS,
2businessreads nominal loanidentity+calculate_loan (gatewayretry tối đa1lần, Auth/layout excluded).
Số dư ngày thanh toán authoritative; taskinterest là projection cuối kỳ. VIEWER/privacy/deep-link
`/loans/id?transaction=interest`/gốcquáhạn giữ semantics. Privacy chặn GET/form trước khi hiện tiền.

LoanPaymentForm trích từ LoanActions, dùng chung action/hook/BusinessForm;C95chips chỉ Tiền gốc.
Lãi có “Theo số còn lại” copy positive snapshotfresh qua React input, không autosubmit hoặc tính lãi.
Abort/alive/requestkey/deadline12s/retry/date bảo vệ replycũ; seed không ghi đè draft khi reload số dư.
Pending khóa close/Back/submitlặp; error giữ draft/key. Save dùng RPC/action unchanged và RSC
revalidation; successclose/reset/toast/focus về trigger hiện hành hoặc #schedule-title khi task mất.
Provider giữ một draftregistry (form opt-out); guardedpopstate không subscribe hashchange bypass.
Close hỏi một lần, rejectedBack không remount; Forward/reload mới form/key. Rapid selection replace
sameentry theo URLsnapshot. Success replaceentry vềDashboard để Forward không mở lại operation.
Nativeclose cleanup cần rAF sau DOMcommit; boundedobserver chỉ recover khi returnedtarget bịgỡ/focusbody,
không steal focus control khác. Không thay sharedBottomSheet motion/damping hoặc C97loading.

Bằng chứng `docs/dashboard-drawer-c96/report.md`, comparison.html, implementation/budget/performance,
targeted+full/probe/preservation/source+PNG manifests,8PNG. Sourcebefore82151b6,140websrcfinalfreeze.
MatchedMinhAn1.2845b375/1280×900LightDark:1click/1route trước→1click/0route; initial512865→521176
bytes (+8311), openadditional57405→11759decoded;25KiB budgets PASS. Latency846–869→442–860ms
localMEASURED_ONLY, không hứa nhanhgấp3 hoặc Production. After có fixture borrowing/overdue bổ sung;
JS resource metrics không bao gồm HTML/RSC/data, không tuyên bố Dashboard pixel equivalence toàntrang.

Lint/typecheck/unit121/rootbuild19 PASS; full79PASS18SKIP0FAIL15.5m,retries0;targeted+probe7PASS3.5m.
Targeted16/full18states320–1440×LightDark,375×420 và375×812,headerfooter/scroll/focus đạt.
Actualpartial1000VND/advanceprojected/error/transportretry/pending/1POST1row/replay/KPI/task/focusfallback
đạt. Không giảm assertions/timeout/retry/skip E2E hiện hữu. Lượt3PASS3FAIL→6PASS1FAIL→6PASS1FAIL→7PASS
và nguyên nhân ở verification-history; raw log/trace/session tiếp tục ignore `.cache/c96/`.
Evon raw3mục mỗi theme giữ:2tooltipVND opacity0 khôngpainted, preparedbodyscroll1px;
actual375×812initial0/clearfocus sauTabchecks188px. Focus/nativepicker/density warnings giữ theoC92/scope.
Full log có destination-stream-closed-early/negativeAuth-export cases, không gọi toànapp error0.

1207trackedbefore/10scopechanged/1197unchanged;140websrcfreeze,73schema/actions/validation/domainfiles
unchanged;17C75exact/15generatedrestored. Docker C20-test đúnglabel/DB55322,sixcounts0 sau teardown;
không mainDB54322. Diff/artifact/scoped pinnedgitleaks8.30.1 redacted0findings đạt, không secret/data thật.
Không remote mutation/push/deploy/schema/RPC/financialengine/dependency change. Phone/softkeyboard/AT/
SafariFirefox/nativezoom/nativeclipboard/OS-theme-live/remote save NOT_TESTED;375×420 là viewport giả lập.

C92/C93/C94/C95 localcommits752fd48/577d6f4/0aa52ac/82151b6; C96 chốt code/docs cùng trạng thái.
Chưa push/deploy C92–C96; runtime Preview/Production vẫn C91,aliases/CI trong context.
C91 query_canceled57014 đã hồi phục nhưng nguyên nhân chưa rõ; giữ C88rollback, không cleanup/tuning.
Không mở lại Google/backup/automation hoặc tạo cuộc trò chuyện mới từ lịch sử.
