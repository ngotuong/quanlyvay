# C34 — Rollout C33 lên Vercel Preview

Trạng thái: `IN_PROGRESS`

Người dùng phê duyệt trực tiếp trong hội thoại ngày 2026-09-14.

## Mục tiêu

Đưa source C33 đã nghiệm thu local lên Vercel Preview theo `docs/VERCEL_PREVIEW_RUNBOOK.md`, xác minh
trực tiếp bộ lọc ngày và tương tác biểu đồ trên immutable candidate trước khi chuyển stable alias.

## Phạm vi dự kiến

- Chạy lại đầy đủ pre-deploy gate bắt buộc từ repository root.
- Tạo candidate bằng `pnpm deploy:preview`, kiểm tra đúng project, target Preview, trạng thái Ready,
  Functions `sin1` và smoke URL bất biến.
- Authenticated smoke ở mobile/desktop cho `Từ`/`Đến` cùng hàng, tap/click/keyboard trên biểu đồ,
  tooltip không bị cắt và không tràn ngang.
- Chỉ chuyển `tindung-preview.vercel.app` sau khi candidate đạt; smoke alias và kiểm tra runtime log,
  rollback nếu hậu kiểm thất bại.

## Ngoài phạm vi

- Production rollout, migration, thay dữ liệu tài chính, remote secret, Google resources hoặc Git push.
