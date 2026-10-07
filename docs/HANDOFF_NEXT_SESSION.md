# Bàn giao — C91 đang phát hành

Cập nhật07/10/2026. Đây là hướng dẫn tiếp nhận, không cấp quyền thực hiện mới.

C91 đã được OWNER phê duyệt checkpoint và bản vá dependency ngày07/10; hiệnIN_PROGRESS.
Lint/typecheck/unit117/build19/fullE2E64PASS18opt-inSKIP12.9m/policy/actionlint/secret/diff
đạt; DB55322 sixcounts0/274hashes/C75baseline bảo toàn. Chưa commit/push/deploy/CI.
Bản vá riêng `sharp: 0.35.4 → 0.35.5`, `source-map-js: 1.2.2` đã áp; frozeninstall/audit
PASS, fullE2E saupatch/RequiredCI/candidate/alias/closing đang thực hiện. Đọcreport/evidence C91.
Phần bàn giao C90 bên dưới là nền đã bảo toàn; trạng tháiC91 hiện hành nằm ởcontext/roadmap.

## Điểm bắt đầu

- Repository: `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`.
- Đọc toàn bộ `AGENTS.md`, `PROJECT_CONTEXT.md`, roadmap section49 (C91) và section50
  (kế hoạch C92–C98), rồi `git status --short --branch`.
- C90 COMPLETED local; C91 IN_PROGRESS sau phê duyệt07/10. OWNER muốn bắt đầu công việc tiếp trong
  cuộc trò chuyện mới. Chưa commit/push/deploy trong phiên dọn tài liệu; không tự phát hành
  hoặc coi đồng ý kế hoạch là phê duyệt tất cả mốc tương lai.
- Bước tiếp theo đề xuất: C91 phát hành bản C90. Sau đó C92 chốt thiết kế đích, lần lượt
  C93 refactor giữ hình, C94 readability/mobile, C95 Quick Amount, C96 inline drawer
  Dashboard, C97 loading/motion, C98 nghiệm thu/phát hành. Mỗi mốc có cổng riêng.

## Bảo toàn trước mọi thao tác

- Main HEAD/origin tracking lúc bàn giao `b98fe64d332ea31ffee2b2e3adebc5ec7756744a`.
- Local đã duyệt: globals.css/C63 readiness assertion +c90-remediation.spec.ts; C89 harness,
  docs/audit-c89 và docs/remediation-c90; context/roadmap/handoff/archive mới. Không git reset.
- C90 lint/typecheck/unit117/build19/targeted24PASS7.5m; xem `remediation-c90/validation.json`,
  `report.md`, `harness-triage.json`, `postgate.json`. Targeted không thay fullreleasegate.
- Production/Preview gần nhất là C88. C91 phải đọc runbook, kiểm nguồn/CI/remote fresh,
  rootpnpmdeploy:preview, OWNER login nếu thiếu phiên, Authsmoke/alias/log/rollback.
- C20-testAPI55321/DB55322 có guard, fixture/teardown riêng; DBchính54322 và dùngchung không
  QA/reset. C75generated đã restored; không xóa cachelog/trace/backups vì “dọn”.

## Quyết định OWNER cần giữ

KPI dư nợ/lãi ròng trước Việc cần xử lý. Giữ brandB/Inter/status, VND đủ chữ số, privacy và
lifecycle save/dirty/pending/focus. Evon ui-ux được yêu cầu, dùng skill theo phạm vi. Thiết kế
rộng phải có mẫu chọn trước; không xóa focus ring, không thêm animation/cắt tên theoGu chưaduyệt.
Không hứa nhanhgấp3/60fps mọithiếtbị/header≤25% mọiviewport/zeroCLS toànapp. Không yêu cầu
OWNER học VoiceOver; thiếu bằng chứng AT/mobile/SafariFirefox/remote phải ghi NOT_TESTED.
GitHubFree/private giữ; không nânggói/tạo tài nguyên/đổi Auth/schema/secret/finance/Google/backup.

## Prompt gợi ý cho cuộc trò chuyện mới

> Tiếp nhận repository /Users/ngotuong/AppsScript/QuanLyVayCaNhan. Đọc đầy đủ AGENTS.md,
> PROJECT_CONTEXT.md và docs/HANDOFF_NEXT_SESSION.md; đọc C91 cùng kế hoạch C92–C98
> trong docs/IMPLEMENTATION_PLAN.md rồi chạy git status --short --branch. Bảo toàn mọi
> thay đổi local C89/C90. Báo ngắn trạng thái và phạm vi C91 để tôi phê duyệt trước khi
> thực hiện; chưa push/deploy hoặc sửa giao diện trong bước tiếp nhận.

Muốn bắt đầu ngay C91 trong cuộc trò chuyện mới, có thể thêm: **“Tôi phê duyệt C91,
hãy thực hiện đầy đủ phạm vi và acceptance criteria của checkpoint.”**

## Tài liệu

- [Context hiện hành](../PROJECT_CONTEXT.md)
- [Roadmap](IMPLEMENTATION_PLAN.md)
- [Review C90](remediation-c90/review.html)
- [Report C90](remediation-c90/report.md)
- [Lịch sử nguyên văn trước thu gọn](history/project-context-through-c90.md)

Archive chỉ để truy vết; không bắt agent đọc1.145dòng lịch sử mỗi lần nếu không cần.
AGENTS yêu cầu đọc đầy đủ context hiện hành đã thu gọn146dòng, không archive.
