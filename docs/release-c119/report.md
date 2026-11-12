# C119 — Mở chu kỳ lãi từ ngày hiệu lực

Trạng thái: `IN_PROGRESS`, OWNER phê duyệt trực tiếp triển khai và áp dụng khoản vay đã chỉ định.

## Nghiệp vụ

- Sự kiện mở chu kỳ được lưu bằng ledger append-only có audit/RLS, gắn với sự kiện đổi/bật lại lãi.
- Có thể gắn mốc kỳ vào sự kiện đổi lãi đã có cùng ngày nếu mức lãi khớp; không tạo dòng tiền hoặc
  sự kiện lãi trùng. Retry kiểm tra cùng khoản/ngày/loại/mức lãi và chỉ lưu một lần.
- Engine cắt kỳ trước tại D-1 và mở kỳ mới từ D. Helper mốc lịch dùng chung cho khoản vay,
  Dashboard và thông báo. Lịch tháng tính lại khi ngày dự kiến từ mốc cũ đi qua mốc mới.
- UI bổ sung checkbox trong form nghiệp vụ hiện có và dòng mốc mới trong lịch sử; giữ offset nhắc.
- Export bổ sung dataset `interestCycleResets`, giữ nguyên các dataset và workbook hiện hữu.

## Kiểm chứng đã thực hiện

- Lint, typecheck, unit và build 19 route đạt trước lượt full release gate.
- pgTAP bản đầu: 586 PASS/28 tệp. Sau bổ sung ca lịch tháng: 587 PASS/28 tệp.
- Targeted E2E C119: 1 PASS/1,2 phút; gắn mốc mới vào rate event có sẵn qua form, xác minh lịch sử,
  lịch kết thúc và không nhân đôi rate event.
- Full E2E thăm dò được chủ động ngắt sau 23 PASS khi bổ sung bản sửa lịch tháng; không coi lượt
  interrupted này là gate phát hành. Một lần targeted khởi động quá sớm trong teardown bị từ chối
  vì container đang starting; chạy lại sau teardown đạt. Không tăng timeout/retry/skip.
- Backup mới `qlv-prod-20261112T130014Z`: 6 tệp mã hóa; checksum/GCM/SQL-shape đạt; remote migration
  trước rollout `20261104090000`. Retention chỉ dry-run, không xóa backup.

## Còn lại

Chạy root release gate/full E2E trên bản chốt, CI đúng SHA; migration remote sau preflight; immutable
Preview/Auth/runtime, stable Preview, Production và hậu kiểm. Cuối cùng áp dụng cho đúng khoản vay
đã được OWNER chỉ định và đối chiếu lịch sử/số dư/ngày nhắc. Chưa ghi nghiệp vụ thật hoặc đổi alias.
