# C32 — Rollout C30 lên Vercel Production

Ngày phê duyệt: 2026-09-14. Hoàn tất: 2026-09-14. Trạng thái: `COMPLETED`.

## Kết quả rollout

- Rollback target C29 được xác minh trước promote:
  `dpl_3kKvGQd5Ym6GjjJRdZm6d2YMwQFx`, target Production, `Ready`, Functions `sin1`.
- Candidate `dpl_3zLcZo3vQgGiAAjgzpgNTz3p8bzX`, immutable
  `https://quan-ly-vay-ca-nhan-l9vb87op2-ngotuong2105.vercel.app`, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, `Ready`; 44/44 output Function ở `sin1`.
- `https://tindung.vercel.app` đã promote đúng candidate; rollback không phải kích hoạt.
- Gate đạt: `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6 và
  E2E 21/21 trên database local cô lập có đủ 30 migration.
- Public smoke immutable/stable đạt: login và manifest trả 200; Google Sync export và notification
  runner không secret trả 401. Authenticated smoke cả hai URL đạt cho `/notifications`, `/loans`,
  copy nhiều dòng, nền đọc/chưa đọc, modal bộ lọc căn giữa, date input không chồng lấn, không còn
  nút `Đóng` thừa và mobile không tràn ngang; browser console sạch.
- Runtime log candidate và hậu kiểm stable có 0 error, 0 fatal. Hai tài khoản `EDITOR` kỹ thuật đã
  deactivate/ban; hai notification giả phi tài chính đã xóa, không tạo khoản vay/giao dịch.
- Không chạy migration lần hai, không đổi remote secret, Google resources hoặc Git remote và không
  Git push.

## Phạm vi và acceptance criteria

1. Chạy `git diff --check`, lint, typecheck, unit/script tests, build, Auth và E2E trước candidate.
2. Xác minh stable Production hiện tại thuộc đúng project, `Ready`, ở `sin1` và lưu làm rollback.
3. Tạo Production candidate từ repository root bằng `vercel deploy --prod --skip-domain`; xác minh
   đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, `Ready` và Functions `sin1`.
4. Public và authenticated smoke immutable URL cho `/notifications`, `/loans`, copy nhiều dòng,
   trạng thái đọc/chưa đọc, bộ lọc nâng cao/mobile, chống tràn ngang, console và runtime log.
5. Chỉ promote `https://tindung.vercel.app` sau khi candidate đạt; smoke/log lại stable và rollback
   về deployment C29 nếu hậu kiểm thất bại.
6. Tài khoản kỹ thuật phải bị deactivate/ban, notification giả phải xóa; không tạo khoản vay hoặc
   giao dịch tài chính và không lưu credential trong repository/evidence.
7. Ghi deployment ID, immutable URL, rollback target, target/region và từng kết quả kiểm chứng vào
   tài liệu này cùng `PROJECT_CONTEXT.md`.

Migration C30 đã active trên Supabase dùng chung từ C31 nên không chạy migration lần hai.

## Ngoài phạm vi

- Không thay schema/dữ liệu nghiệp vụ/remote secret, không thao tác Apps Script/Google resources.
- Không Git push hoặc sửa Git remote.
