# C38 — Hậu kiểm chu kỳ nhắc lãi Production theo lịch thực tế

Trạng thái: `APPROVED` — tạm hoãn theo yêu cầu người dùng ngày 2026-09-15 để ưu tiên C39.

Phê duyệt: người dùng phê duyệt trực tiếp ngày 2026-09-14.

Cửa sổ quan sát: sau giờ gửi 07:00 (`Asia/Ho_Chi_Minh`) ngày 2026-09-15.

## Mục tiêu

Kiểm chứng read-only rằng chu kỳ scheduler kế tiếp sau C37 tạo/làm mới nhắc lãi lặp đúng hạn và ghi
nhận kết quả Push thực tế, không kích hoạt worker thủ công hoặc thay dữ liệu nghiệp vụ.

## Phạm vi dự kiến

1. Sau giờ nhận thông báo của chu kỳ kế tiếp, đọc lịch sử scheduler/worker và runtime log Production.
2. Đối chiếu notification `INTEREST_DUE`, ngày nhắc, idempotency/dedupe và nghĩa vụ lãi còn dư với
   dữ liệu authoritative; không sửa khoản vay, giao dịch hoặc notification.
3. Đối chiếu `push_deliveries`/subscription hiện có để phân biệt không tạo nhắc, không có thiết bị,
   delivery lỗi hoặc delivery thành công.
4. Ghi bằng chứng và rủi ro còn lại vào `PROJECT_CONTEXT.md`; không cần tài khoản QA mới nếu bằng
   chứng database/runtime đã đầy đủ.

## Ngoài phạm vi

- Không gọi notification runner thủ công, bật/tắt Push, tạo giao dịch tài chính hoặc thay giờ nhận.
- Không migration, deploy, đổi secret/scheduler, thao tác Google resources hoặc Git push.
