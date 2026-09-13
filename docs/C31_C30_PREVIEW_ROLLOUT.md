# C31 — Rollout C30 lên Vercel Preview

Ngày phê duyệt: 2026-09-13. Hoàn tất: 2026-09-13. Trạng thái: `COMPLETED`.

## Kết quả rollout

- Supabase dùng chung đã có 30 migration; phiên bản mới nhất `20260913165000`. Hàm
  `generate_due_notifications(date)` chứa copy C30, chỉ `service_role` có quyền chạy; notification
  chưa đọc kiểm tra bằng aggregate đã dùng định dạng nhiều dòng. Không thay giao dịch, khoản vay hay
  số liệu tài chính.
- Candidate `dpl_8cuYqL5y4ALYYpGskEbq5X8yPwwo`, immutable
  `https://quan-ly-vay-ca-nhan-ggwaigsrx-ngotuong2105.vercel.app`, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview, trạng thái `Ready`; 44/44 output Function ở
  `sin1`.
- Stable alias `https://tindung-preview.vercel.app` đã trỏ đúng candidate. Rollback target C28
  `dpl_5M1XWMy69HrkAPVdPCmZtk9EzqF1` đã được xác minh nhưng không cần kích hoạt.
- Gate đạt: `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6, E2E
  21/21, DB lint sạch và pgTAP 444/444.
- Public smoke đạt. Authenticated smoke trên immutable và stable đạt cho `/notifications`, `/loans`,
  copy ba dòng, nền đọc/chưa đọc, modal mobile căn giữa, date input không chồng lấn, không còn nút
  `Đóng` thừa và chống tràn ngang; browser console sạch. Runtime log candidate/hậu kiểm có 0 error,
  0 fatal.
- Hai tài khoản kỹ thuật `EDITOR` đã deactivate/ban; hai notification giả phi tài chính đã xóa.
  Không tạo khoản vay/giao dịch, không deploy Production, Git push, đổi remote secret hoặc Google
  resources.

## Phạm vi và acceptance criteria

1. Chạy lại `git diff --check`, lint, typecheck, unit tests, build, Auth, E2E, DB lint và pgTAP.
2. Kiểm tra migration remote, áp duy nhất migration C30 còn thiếu lên Supabase dùng chung sau khi
   xác minh lịch sử 29 migration; migration không sửa giao dịch hay số liệu tài chính.
3. Tạo candidate từ repository root bằng `pnpm deploy:preview`; xác minh đúng project
   `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview, trạng thái Ready và Functions `sin1`.
4. Public và authenticated smoke immutable URL cho `/notifications`, `/loans`, bộ lọc nâng cao,
   copy nhiều dòng, trạng thái đọc/chưa đọc, modal mobile và chống tràn ngang; kiểm tra console/log.
5. Chỉ chuyển `https://tindung-preview.vercel.app` sau khi candidate đạt; smoke lại stable alias và
   rollback về deployment Preview tốt trước đó nếu hậu kiểm thất bại.
6. Ghi migration, deployment ID/URL, rollback target, target/region và kết quả smoke vào context.

Supabase Preview và Production dùng chung project, nên migration C30 làm thay đổi copy notification
chưa đọc và generator dùng chung ngay khi áp; không thay engine tài chính, giao dịch hoặc số dư.

## Ngoài phạm vi

- Không deploy/promote Vercel Production, không Git push.
- Không thay remote secret, Apps Script/Google resources hoặc tạo giao dịch tài chính.
