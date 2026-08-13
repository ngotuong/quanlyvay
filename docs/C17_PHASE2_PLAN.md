# C17 — Giai đoạn 2: CI fail-closed và provenance triển khai

## 1. Trạng thái

| ID | Bước | Trạng thái |
|---|---|---|
| K04 | CI fail-closed | `IN_PROGRESS` — workflow đã push, chờ push bản sửa timeout CI |
| K05 | Xác minh provenance Vercel candidate | `NOT_STARTED` — chỉ bắt đầu sau K04 |

Chính sách mật khẩu tối thiểu 6 ký tự ASCII chữ hoặc số tiếp tục giữ nguyên. Mọi push workflow,
thay đổi branch protection, deploy Preview hoặc chuyển alias cần xác nhận remote riêng.

## 2. K04 — CI fail-closed

1. Tạo workflow cho pull request và push gồm frozen install, lint, typecheck, unit và build.
2. Thêm job Supabase reset/lint/pgTAP/Auth, Playwright E2E, dependency audit và secret scan.
3. Pin Node/pnpm/Supabase/Playwright phù hợp lockfile; không dùng Production secret hoặc dữ liệu thật.
4. Dùng concurrency cancel cho revision cũ; mọi job bắt buộc fail-closed.
5. Chứng minh commit sạch chạy xanh và một lỗi fixture cố ý bị chặn trước khi xin push workflow.

Acceptance local: workflow lint/dry-run được, toàn bộ full gate hiện hành đạt và không có secret trong
artifact/log. Sau xác nhận remote: workflow chạy xanh trên GitHub và required checks chặn main khi
gate lỗi. Push workflow và bật branch protection là hai cổng xác nhận riêng.

Bằng chứng local ngày 13/08/2026: policy và actionlint đạt; fixture cố ý không an toàn bị chặn;
Gitleaks quét 60 commit không phát hiện secret; dependency audit sạch; lint/typecheck/41 tests/build,
DB lint, pgTAP 364/364, Auth 6/6 và E2E 10/10 đạt. Runbook ở `docs/CI.md`.

Run GitHub đầu `31683908290` xanh policy/quality/security và DB/Auth, nhưng required gate đỏ do ca
E2E đầu vượt timeout 30 giây trên runner lạnh; 9 ca còn lại đạt. Bản local tăng riêng timeout CI lên
60 giây, không retry và chạy `CI=true` đạt 10/10; chờ xác nhận push để có run GitHub xanh.

## 3. K05 — Provenance Vercel candidate

1. Nâng `pnpm deploy:preview` để đọc project/org trực tiếp từ `vercel inspect` và fail-closed nếu sai.
2. Chỉ chấp nhận immutable candidate đúng project, target Preview, Ready và Functions `sin1`; không
   nhận stable alias làm candidate.
3. Xác minh rollback target thuộc cùng project trước khi chuyển alias.
4. Thêm fixture candidate sai project/alias phải bị chặn trước `alias set`; candidate đúng phải qua.
5. Cập nhật runbook và chạy full Preview gate trước mọi deploy.

Mọi tạo candidate/chuyển alias/rollback vẫn cần xác nhận riêng. K05 không được bắt đầu nếu K04 chưa
hoàn tất hoặc người dùng chưa phê duyệt rõ.
