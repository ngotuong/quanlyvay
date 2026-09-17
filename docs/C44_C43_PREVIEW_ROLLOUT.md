# C44 — Rollout C43 lên Supabase dùng chung và Vercel Preview

Trạng thái: `AWAITING_APPROVAL`.

## Mục tiêu

Đưa quy tắc nhắc lãi theo ngày thu/đóng thực tế từ C43 lên Supabase dùng chung, sau đó kiểm chứng
trên stable Preview trước khi xem xét Production. Supabase này cũng phục vụ Production, nên áp
migration remote là thay đổi nghiệp vụ notification dùng chung, dù web Production chưa đổi source.

## Phạm vi và acceptance criteria

1. Chụp baseline read-only cho migration, hai khoản 700/400, notification, Push delivery, scheduler
   và alias Preview; xác minh rollback target. Không công khai dữ liệu tài chính cá nhân.
2. Chạy lại toàn bộ local gate và DB lint/pgTAP trên database test cô lập.
3. Áp migration C43 qua quy trình migration, không sửa database bằng SQL ad hoc; hậu kiểm version,
   quyền `service_role`, số khoản/giao dịch, notification thread và idempotency.
4. Từ repository root dùng `pnpm deploy:preview`; candidate đúng project, target Preview,
   `READY`, Functions `sin1`, public/authenticated smoke đạt, rồi mới chuyển stable alias.
5. Hậu kiểm stable: cả khoản chưa thu đến ngày vận hành được làm mới trong chu kỳ scheduler kế tiếp,
   mỗi khoản một card, đúng số ngày quá hạn và Push revision; phân biệt rõ việc chưa có subscription,
   không đến giờ gửi, delivery lỗi hoặc đã gửi. Không gọi worker thủ công ngoài giờ đã chọn.
6. Nếu hậu kiểm alias thất bại, trả alias về deployment tốt trước đó; báo rõ migration database
   dùng chung không thể rollback bằng alias web.

## Ngoài phạm vi

Không deploy Production web, không đổi scheduler/giờ gửi/secret, không tạo giao dịch tài chính,
không thao tác Google resources hoặc Git push. C38 vẫn tạm dừng.
