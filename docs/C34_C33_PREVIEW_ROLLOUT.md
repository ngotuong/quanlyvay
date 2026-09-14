# C34 — Rollout C33 lên Vercel Preview

Trạng thái: `COMPLETED`

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

## Kết quả rollout

- Source: đúng commit C33 `697bd25`; không gồm C35 hoặc migration C35.
- Candidate: `dpl_5CcFRo14rfrr1JoSJmd3Vizi5N8M` —
  `https://quan-ly-vay-ca-nhan-55rb62mxf-ngotuong2105.vercel.app`.
- Provenance: project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `preview`, trạng thái `READY`,
  44/44 Functions ở `sin1`.
- Rollback target đã xác minh trước promote: C31 `dpl_8cuYqL5y4ALYYpGskEbq5X8yPwwo`.
- Authenticated smoke immutable đạt desktop/mobile: hai trường ngày cùng hàng, mỗi trường rộng
  152,5px và cao 44px ở viewport 375px; trang không tràn ngang; cột dòng tiền nhận click/tap/phím
  Space và tooltip `431.050.000 ₫` nằm trọn trong viewport.
- Stable alias `https://tindung-preview.vercel.app` đã trỏ đúng candidate. Public smoke hậu kiểm đạt:
  `/login` 200, manifest 200, hai API bảo vệ 401; error/fatal runtime log đều 0.
- Tài khoản `c34_smoke_mu102krb` chỉ dùng để đọc/QA, không tạo dữ liệu tài chính; đã được xác minh
  `is_active=false`, `banned=true` và đăng nhập lại bị từ chối.
- Gate pre-deploy được script chạy hai lần và đều đạt: `git diff --check`, lint, typecheck, 74/74
  unit/script tests, build và E2E 21/21. Không cần rollback.
