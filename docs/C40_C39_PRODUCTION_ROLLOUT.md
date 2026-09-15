# C40 — Rollout C39 lên Vercel Production

Ngày phê duyệt: 2026-09-15. Hoàn tất: 2026-09-15. Trạng thái: `COMPLETED`.

## Kết quả rollout

- Rollback target C37 được xác minh trước promote:
  `dpl_E5yFNn2qmsquDW4wXDf2Pddz3Nt6`, immutable
  `https://quan-ly-vay-ca-nhan-j85cgaavq-ngotuong2105.vercel.app`, target Production, `READY`,
  Functions `sin1`.
- Candidate C40 `dpl_DePegwVo77qL5WFUiYp7vMtxKKK1`, immutable
  `https://quan-ly-vay-ca-nhan-5px8csi7w-ngotuong2105.vercel.app`, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, `READY`, Functions `sin1`.
- Stable `https://tindung.vercel.app` đã trỏ đúng candidate; rollback không phải kích hoạt.
- Gate đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests và build. Auth 6/6 cùng E2E
  21/21 đã đạt trên đúng source C39 trước khi mở rollout; C40 không đổi code ứng dụng.
- Public smoke immutable/stable đạt: login và manifest 200; Google Sync export và notification
  runner không secret 401.
- Authenticated smoke immutable/stable đạt cho Dashboard và trang khoản vay C39: nút danger
  **Tất toán** cạnh **Ghi giao dịch**, BottomSheet preview đúng và không ghi giao dịch; tab Thiết lập
  đã phân nhóm, không còn form tất toán; EDITOR không thấy quản trị người dùng. Desktop 1280 px và
  mobile 370 px không tràn ngang; browser console sạch.
- Runtime hậu kiểm có 0 HTTP 5xx và 0 fatal. Có một cảnh báo dependency Node `DEP0169 url.parse()`
  bị Vercel xếp mức error khi notification runner trả 200; không phải lỗi chức năng C39 và không đạt
  ngưỡng rollback.
- Tài khoản smoke C36 không tạo dữ liệu tài chính, đã đăng xuất, `inactive` và ban đến 2099. Hậu kiểm
  Supabase xác nhận 1 OWNER hoạt động, 31 tài khoản kỹ thuật đều không hoạt động. Chỉ giữ C36 làm tài
  khoản smoke tái sử dụng; 30 profile cũ chưa xóa vật lý vì bất biến audit hiện tại cấm xóa profile,
  trong đó ba tài khoản có tham chiếu tài chính `ON DELETE RESTRICT`. Không tắt trigger hoặc làm mất
  lịch sử để ép xóa.
- Không chạy migration, không đổi schema/dữ liệu nghiệp vụ, secret/scheduler, Google resources,
  Git remote và không Git push.

## Mục tiêu

Đưa đúng source C39 đã nghiệm thu local lên Vercel Production bằng candidate không gán domain,
smoke trên URL bất biến và rollback fail-closed.

## Phạm vi được duyệt

1. Xác minh gate local và Production hiện tại làm rollback target.
2. Tạo candidate bằng `vercel deploy --prod --skip-domain` tại repository root; bắt buộc đúng project
   `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, trạng thái `Ready` và Functions `sin1`.
3. Public smoke login/manifest và endpoint bảo vệ; authenticated smoke các màn hình C39 ở desktop,
   mobile, light/dark cùng browser console và runtime log.
4. Chỉ promote `https://tindung.vercel.app` sau khi candidate đạt; smoke/log lại stable và rollback
   về deployment tốt trước đó nếu hậu kiểm thất bại.
5. Tài khoản smoke nếu cần chỉ dùng kiểm tra giao diện/quyền, không tạo dữ liệu tài chính và phải
   inactive/banned sau kiểm tra.
6. Ghi deployment ID, immutable URL, rollback target, target/region và toàn bộ bằng chứng.

## Ngoài phạm vi

- Không chạy migration, đổi schema/dữ liệu nghiệp vụ, secret/scheduler hoặc Google resources.
- Không Git push, sửa Git remote, đổi domain khác hoặc tiếp tục C38.

## Acceptance criteria

- Candidate/stable đúng project, Production, `Ready`, Functions `sin1`.
- Public và authenticated smoke C39 đạt; console và runtime error log sạch.
- Stable alias trỏ đúng candidate hoặc đã rollback thành công nếu hậu kiểm lỗi.
- Tài khoản smoke được vô hiệu hóa; tài liệu/context đồng bộ và worktree sạch.
