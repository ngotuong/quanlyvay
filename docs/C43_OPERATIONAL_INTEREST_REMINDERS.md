# C43 — Nhắc lãi theo ngày thu/đóng thực tế

Phê duyệt: người dùng yêu cầu lập checkpoint và điều chỉnh trực tiếp ngày 2026-09-17. Trạng thái:
`COMPLETED` local ngày 2026-09-17.

## Vấn đề đã xác minh

- Hai khoản Dũng Hùng 700 triệu và 400 triệu cùng có ngày thu lãi vận hành 16/09/2026.
- Ngày 17/09, khoản 700 triệu được nhắc lại nhưng không có dòng quá hạn; khoản 400 triệu không được
  nhắc lại. Hàm hiện tại chỉ tính quá hạn từ ngày chốt kỳ hợp đồng lần lượt 17/09 và 18/09.
- Card/Push C41 giữ một luồng hiện hành theo nghĩa vụ; thiếu ở bước chọn nghĩa vụ, không phải do
  thiết bị bỏ lỡ Push.

## Phạm vi và nghiệm thu

1. Tại mỗi ngày chạy, xác định nghĩa vụ lãi có ngày thu/đóng vận hành gần nhất bằng ngày chốt kỳ
   trừ `interest_reminder_offset_days`, không sớm hơn ngày đầu kỳ. Giữ `obligation_date` là ngày
   chốt kỳ để card và Push tiếp tục ổn định theo một nghĩa vụ.
2. Từ ngày vận hành cho tới khi lãi đã trả đủ, cập nhật card hằng ngày; ngày sau ngày vận hành thêm
   `Quá hạn : N ngày`, kể cả khi chưa tới ngày chốt kỳ hợp đồng.
3. Số lãi vẫn lấy từ engine authoritative của Supabase theo ngày chốt kỳ và bù trừ thanh toán hợp
   lệ; không đổi công thức lãi, giao dịch tài chính hoặc ngày chốt kỳ.
4. Kiểm thử offset 1 và 2 ngày cùng ngày thu thực tế, retry cùng ngày, kỳ kế tiếp, thanh toán đủ,
   BAD_DEBT/SETTLED và idempotency Push theo revision.
5. Đạt `git diff --check`, lint, typecheck, unit/script tests, build, Auth/E2E, DB lint và pgTAP.

## Ngoài phạm vi

Không áp migration lên Supabase dùng chung, không gọi worker thủ công, không deploy Preview/
Production, không đổi scheduler/secret, không tạo giao dịch thật, không Git push. C38 vẫn tạm dừng.

## Kết quả

- Migration `20260917100000_c43_operational_interest_reminders.sql` thay đúng hàm sinh notification.
  Ngày vận hành quyết định khi nào nhắc và số ngày quá hạn; ngày chốt kỳ tiếp tục quyết định số lãi
  authoritative và `thread_key`.
- Regression pgTAP tái hiện đúng hai khoản 700/400 với ngày thu 16/09, kỳ chốt 17/09 và 18/09:
  ngày 17/09 cả hai card lên revision 2 cùng `Quá hạn : 1 ngày`; retry cùng ngày không tạo trùng;
  ngày 18/09 là 2 ngày quá hạn; thanh toán đủ khoản 400 thì chỉ khoản 700 còn được nhắc. Bài test
  mới đạt 22/22 assertion.
- Gate cuối đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6,
  E2E 21/21, DB lint sạch, pgTAP 21 file/477 assertions; database test reset sạch qua đủ 33
  migration. Một lần pgTAP chạy song song E2E bị đụng dữ liệu tạm của E2E; sau khi E2E xong,
  chạy lại trên database đã reset đạt 477/477.
- Không thay đổi dữ liệu tài chính, không chạy migration remote, không deploy Preview/Production.
