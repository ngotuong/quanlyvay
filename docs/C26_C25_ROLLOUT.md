# C26 — Rollout C25

Ngày phê duyệt: 2026-09-11. Hoàn tất: 2026-09-12. Trạng thái: `COMPLETED`.

## Phạm vi và acceptance criteria

1. Chạy lại `git diff --check`, lint, typecheck, unit tests, build và E2E.
2. Tạo Preview candidate bằng `pnpm deploy:preview`; xác minh project, target, `Ready`, `sin1`.
3. Authenticated smoke ba thay đổi C25 trên immutable URL: `ACTIVE` mặc định, `status=ALL`,
   ngày tất toán và KPI icon + số tiền với nhãn truy cập đầy đủ.
4. Chuyển stable Preview theo runbook, smoke lại và kiểm tra runtime error log.
5. Tạo Production candidate bằng `--prod --skip-domain`, smoke immutable URL, promote sau cùng,
   smoke stable domain và rollback nếu hậu kiểm thất bại.
6. Tài khoản smoke bị deactivate/ban; không lưu credential tạm trong Git.

Không migration, không thay dữ liệu nghiệp vụ, Google resources, remote secret hay Git remote.

## Kết quả rollout

- Preview: `dpl_8RwYQmGmqUD67wJeDMDzqveh1gz7`, immutable
  `https://quan-ly-vay-ca-nhan-o98f4jlj4-ngotuong2105.vercel.app`, stable
  `https://tindung-preview.vercel.app`.
- Production: `dpl_66uiiExUfXXNnS3KCajLhNmgkqyw`, immutable
  `https://quan-ly-vay-ca-nhan-nxf62gt51-ngotuong2105.vercel.app`, stable
  `https://tindung.vercel.app`; rollback target `dpl_GPWF8qZJPFdRbtBpp9awZAZtuGtC` không phải dùng.
- Preview `Ready`/target preview; Production `Ready`/target production; 43/43 Function ứng dụng
  của Production ở `sin1`. Public và authenticated smoke trên cả immutable URL lẫn stable domain
  đều đạt; console và runtime error log sạch.
- Smoke xác nhận 4 KPI chỉ hiện icon + số tiền nhưng giữ nhãn truy cập đầy đủ, danh sách khoản vay
  mặc định `ACTIVE`, `status=ALL` hoạt động, và 11 thẻ `SETTLED` có `Ngày tất toán` hợp lệ.
- Gate rollout chạy lại đạt lint, typecheck, 73/73 unit/script tests, build và E2E 21/21.
- Tài khoản smoke đều đã deactivate/ban. Token CLI Supabase tạm
  `cli_ngotuong@Mac-mini.local_1789127470` đã được thu hồi sau xác nhận của người dùng; credential
  cục bộ đã bị xóa và không có secret nào được lưu trong Git.
