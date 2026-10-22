# Bàn giao cho cuộc trò chuyện mới

Cập nhật ngày 22/10/2026 sau khi hoàn tất C112 và dọn workspace.

## Trạng thái cần nhớ

- Checkpoint đang mở: C100 `IN_PROGRESS` — tối ưu lời gọi đọc Tổng quan.
- Checkpoint hoàn tất gần nhất: C112 `COMPLETED`.
- C101–C112 đều đã hoàn tất; không có rollout hoặc alias nào đang chờ.
- Chưa mở checkpoint kế tiếp.

Cuộc trò chuyện mới phải đọc `AGENTS.md`, `PROJECT_CONTEXT.md` và phần C100 trong
`docs/IMPLEMENTATION_PLAN.md`, rồi chạy `git status --short --branch`. Theo cổng phê duyệt của
repository, chỉ tiếp tục thay đổi C100 khi OWNER nói rõ “tiếp tục C100” trong cuộc trò chuyện mới.

## C100 còn thiếu gì

RPC v4 và hai migration C100 đã phát hành, giữ v3 làm rollback. Automated gate, Required CI,
Preview/Production, Auth smoke và runtime hậu kiểm đều đạt. Backend hiện khoảng 1,5 giây; OWNER
ước lượng quay lại Tổng quan khoảng 2–3 giây sau khi bỏ prefetch suy đoán.

Acceptance còn thiếu là bằng chứng trên iPhone 16 Pro Max/iOS 26, cùng mạng:

1. Ít nhất 5 số đo cold launch riêng biệt.
2. Ít nhất 5 số đo vòng Khoản vay → Đối tác → Thông báo → Tổng quan.
3. Ghi từng số đo, không thay bằng một khoảng ước lượng chung.

Sau khi có dữ liệu, cập nhật `docs/dashboard-c100/report.md`, `PROJECT_CONTEXT.md` và roadmap;
chạy gate tài liệu rồi mới chốt C100. Phạm vi chi tiết:
`docs/dashboard-rpc-performance-proposal.md`.

## Môi trường đang phục vụ

- Stable Preview C112: `dpl_2a8avNFZHZxcDsZvheXP84dLu8Ri` → `tindung-preview.vercel.app`.
- Production C112: `dpl_75xKhFuJ4wgspCmGdN4txdtNwyVF` → `tindung.vercel.app` và
  `quan-ly-vay-ca-nhan-ngotuong2105.vercel.app`.
- Preview rollback C110: `dpl_148HdyQj5mLLoxocf5f3hyhjfDut`, chưa kích hoạt.
- Production rollback C106: `dpl_92pT2tjxRvCTEwyEePzJqMpGa8TG`, chưa kích hoạt.

OWNER đã kiểm cả hai Production alias. Bốn route chính đều Auth HTTP 200; runtime không có
`57014`, level-error hoặc HTTP 500. Chi tiết: `docs/release-c112/report.md`.

## Workspace sau dọn dẹp

- Repository chuẩn: `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`, branch `main`.
- Chỉ còn worktree chuẩn; cache build/test đã xóa.
- Dependency, root `.vercel`, backup, report checkpoint và bằng chứng source-controlled được giữ.
- Thay đổi C101–C112 đã được gom vào commit local; chưa push GitHub. Kiểm SHA bằng
  `git log -1 --oneline`.

Không chạy migration, deploy, đổi alias, push Git hoặc sửa dữ liệu chỉ vì đọc tài liệu bàn giao.
