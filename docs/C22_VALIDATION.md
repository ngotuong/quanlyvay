# C22 — Làm sạch dữ liệu QA C21 trên Preview

Ngày kiểm chứng: 2026-09-09. Trạng thái: `COMPLETED`.

## Nguyên nhân

- Có 6 khoản `C21 TEST ONLY`, mỗi khoản gốc `9.007.199.254.740.993 ₫` được tạo để kiểm thử bigint.
- Một khoản còn `ACTIVE`, năm khoản `BAD_DEBT`; payment thử trước đó đã đảo nhưng disbursement và
  dư gốc vẫn được giữ đúng quy tắc không xóa lịch sử.
- Dashboard vì vậy cộng khoản ACTIVE vào “Cho vay đang hoạt động” và năm khoản còn lại vào nợ xấu.

## Nghiệp vụ khắc phục

- Dùng tài khoản EDITOR kỹ thuật tạm trên Preview.
- Gọi `settle_loan` ngày 2026-09-09 cho cả 6 khoản, mỗi khoản có idempotency key riêng và ghi chú C22.
- Kết quả: 6/6 `SETTLED`, `principalOutstandingVnd = 0`; settlement, principal payment và audit được
  giữ đầy đủ. Không xóa hay sửa trực tiếp bản ghi tài chính.

## Đối chiếu

| Chỉ số | Trước | Sau |
|---|---:|---:|
| Cho vay đang hoạt động | 9.007.203.104.740.993 ₫ | 3.850.000.000 ₫ |
| Nợ xấu phải thu | 45.035.996.783.704.965 ₫ | 510.000.000 ₫ |
| Tổng vốn chưa thu hồi | 54.043.199.888.445.958 ₫ | 4.360.000.000 ₫ |

- Authenticated browser trên `https://tindung-preview.vercel.app/dashboard` xác nhận card “Cho vay
  đang hoạt động” hiển thị `3.850.000.000 ₫`.
- Tài khoản kỹ thuật tạm đã deactivate/ban; đăng nhập lại bị từ chối HTTP 400.
- Không deploy, không migration, không thay secret và không ảnh hưởng Production.
