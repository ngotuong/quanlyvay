# C37 — Rollout C33/C35 lên Vercel Production

Trạng thái: `AWAITING_APPROVAL`

## Mục tiêu

Đưa source C33/C35 đã đạt stable Preview lên Vercel Production bằng candidate không gán domain,
authenticated smoke và rollback fail-closed.

## Phạm vi dự kiến

1. Chạy `git diff --check`, lint, typecheck, unit/script tests, build, Auth và E2E trước candidate.
2. Xác minh stable Production hiện tại thuộc đúng project, `Ready`, Functions ở `sin1` và lưu làm
   rollback target.
3. Tạo Production candidate từ repository root bằng `vercel deploy --prod --skip-domain`; xác minh
   đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, `Ready` và Functions `sin1`.
4. Public/authenticated smoke immutable cho Notification Center C35, Cài đặt hợp nhất, redirect
   `/account`, bộ lọc khoản vay C33/C35, biểu đồ dòng tiền, phân quyền, console và runtime log.
5. Chỉ promote `https://tindung.vercel.app` sau khi candidate đạt; smoke/log lại stable và rollback
   về deployment Production tốt trước đó nếu hậu kiểm thất bại.
6. Tài khoản kỹ thuật chỉ dùng cho smoke, không tạo dữ liệu tài chính, phải inactive/banned sau test;
   không lưu credential trong repository hoặc bằng chứng.
7. Ghi deployment ID, immutable URL, rollback target, target/region và kết quả từng gate/smoke vào
   tài liệu này cùng `PROJECT_CONTEXT.md`.

Migration C35 đã active trên Supabase dùng chung từ C36 nên không chạy migration lần hai.

## Ngoài phạm vi

- Không thay schema/dữ liệu nghiệp vụ/remote secret/scheduler hoặc Apps Script/Google resources.
- Không Git push, sửa Git remote, gán domain khác hoặc thay đổi kiến trúc xóa profile.
