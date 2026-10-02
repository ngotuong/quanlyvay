# C76 — Đồng bộ và rollout C74–C75

Trạng thái: IN_PROGRESS. OWNER phê duyệt ngày 2026-10-02.

## Preflight

- Startup đọc AGENTS.md, PROJECT_CONTEXT.md, mục34 roadmap, status main/origin; bảo toàn toàn bộ
  local C74–C75, không có thay đổi khác được phát hiện.
- Review source: presentation/dashboard task visibility, metadata privacy, notifications hierarchy
  và empty copy; không đổi schema, RPC, Auth, tiền, secrets hoặc dữ liệu remote.
- `git diff --check`, CI policy/actionlint, lint, typecheck, unit/script80/80, build19 routes PASS.
- `pnpm audit --audit-level high`: không có lỗ hổng đã biết.
- Gitleaks pinned full history137 commits PASS; từng thư mục audit-c74/remediation-c75 PASS.
  Lệnh dir đầu dùng hai positional paths nên thực tế quét rộng repository, tìm29 phát hiện;
  chạy lại có report redacted tìm53 do build/test đang thay đổi cache. Tất cả37 file của report
  thứ hai được xác minh ignored và untracked (cache/build/test/credential local). Không đưa các
  file này hoặc report chứa giá trị vào Git; không coi chúng là leak mới của source C74–C75.
- Full E2E PASS48/48 bài chạy,5 audit opt-in skip, tổng53 bài, exit0. Disposable project
  QuanLyVayCaNhan-C20-test/API55321/DB55322; teardown profiles/loans/transactions0/0/0.
  C75 recapture six matrix25 synthetic tasks, clipped0/overflow0; ảnh mobile đã xem.
  Kong test đã restart riêng trước chạy; không thao tác local project chính hoặc project anh em.

## Rollback đã kiểm tra trước triển khai

| Môi trường | Deployment tốt hiện tại | Immutable URL |
|---|---|---|
| Preview | dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb | https://quan-ly-vay-ca-nhan-c6pft4h1k-ngotuong2105.vercel.app |
| Production | dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx | https://quan-ly-vay-ca-nhan-7g0uxlwrm-ngotuong2105.vercel.app |

Inspect alias xác nhận Ready/target tương ứng. Remote project inspect đúng
prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F, ngotuong2105, root apps/web. Cần kiểm lại trước promote.

## Giới hạn

Chưa có candidate C76, chưa chuyển alias, chưa hoàn tất checkpoint. Cảnh báo Chrome C73 vẫn OPEN;
VoiceOver/TalkBack/mobile vật lý chưa được kiểm chứng. Remote smoke chỉ đọc, không mark-read,
đổi giờ/quyền push hoặc ghi tài chính để tạo fixture. Các trạng thái không có sẵn sẽ NOT_TESTED.

## Blocker upload preflight và remediation

`vercel deploy --dry --format=json` (không upload) liệt kê341 file/29.206.057bytes, gồm
backup ciphertext/manifest/log trong .backups. .vercelignore hiện hữu không loại trừ thư mục
này; không được dựa vào .gitignore để khẳng định deployment payload an toàn. Đã bổ sung
/.backups/ và /.cache/ trong phạm vi sửa release blocker C76. Chưa tạo deployment từ source
C76; cần dry-run sạch và Required CI SHA sửa trước khi phát hành. Không đọc dump/secret, xóa
backup hoặc sửa dữ liệu. Mac đang khóa: browser smoke chờ OWNER mở khóa, CLI tiếp tục.

Dry-run sau sửa: 206 entries/197 regular files/4516731bytes;
không backup/cache/test artifact/log/credential/secret trong regular file payload. File duy nhất
không tracked là next-env.d.ts generated chuẩn Next.js. Empty directory entries size0/mode16877
không chứa nội dung. Bổ sung cả test-results/playwright-report/coverage/env/key/log và local-only
thư mục để tránh lần chạy tiếp theo đưa artifact vào payload. Diff-check/policy PASS; app source
không đổi so với b58b0e8 đã đạt full local gate. Cần Required CI commit config sửa mới.
