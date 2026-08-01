# Financial Engine Contract v1

Tài liệu này mô tả contract database authoritative được triển khai ở C4. Frontend không được
tự tính hoặc tự quyết toán tiền; mọi kết quả tiền phải lấy từ các hàm trong schema `public`.

## 1. Hàm đọc và tính lại

### `calculate_loan(p_loan_id, p_as_of_date)`

- Tính kết quả đến hết `p_as_of_date` theo ngày nghiệp vụ `Asia/Ho_Chi_Minh`.
- Không ghi dữ liệu.
- OWNER, EDITOR và VIEWER đang hoạt động đều được gọi.
- Trả JSON gồm trạng thái, dư nợ gốc, số dư lãi và các kỳ/segment.
- Tiền và lãi suất trong JSON được trả bằng chuỗi decimal để không mất chính xác ở JavaScript.

### `recalculate_loan(p_loan_id, p_as_of_date)`

- Tính lại toàn bộ lịch sử hiện hành và thay thế các dòng `interest_periods` của khoản vay.
- Tăng `calculation_version` sau mỗi lần rebuild thành công.
- Đồng bộ trạng thái suy ra `ACTIVE | OVERDUE | BAD_DEBT | SETTLED` vào `loans`.
- Chỉ OWNER hoặc EDITOR được gọi.

## 2. RPC ghi dữ liệu

Client không có quyền `INSERT` trực tiếp vào `transactions`, `loan_lifecycle_events` hoặc
`expenses`. Các mutation tài chính phải đi qua RPC để giữ transaction nguyên tử, phân quyền và
idempotency.

### `record_financial_transaction(...)`

- Nhận `INTEREST_PAYMENT` hoặc `PRINCIPAL_PAYMENT`.
- Tiền phải là số nguyên VND dương.
- Trả gốc không được làm dư nợ âm; trả gốc ngày D giảm dư nợ từ D+1.
- Tự rebuild lịch sử sau khi ghi.

### `record_lifecycle_event(...)`

- Nhận `RATE_CHANGE`, `BAD_DEBT_START` hoặc `INTEREST_RESUME`.
- Đổi lãi suất và resume có hiệu lực đầu ngày D.
- Nợ xấu ngày D vẫn tính lãi và dừng từ D+1.
- Resume chỉ hợp lệ sau một lần tạm dừng.
- Nếu resume không truyền lãi suất, database dùng mức có hiệu lực gần nhất; caller có thể truyền
  mức mới để thay thế.

### `reverse_transaction(...)`

- Chỉ thêm một dòng `REVERSAL`; không sửa hoặc xóa giao dịch gốc.
- Mỗi giao dịch chỉ được đảo một lần và phải có lý do.
- Tính lại lịch sử như thể giao dịch gốc chưa từng có hiệu lực.
- Không đảo riêng giao dịch giải ngân hoặc thành phần của một lần tất toán.

### `settle_loan(...)`

- Tính số gốc và lãi còn lại đến hết ngày tất toán.
- Ghi nguyên tử lifecycle `SETTLEMENT`, giao dịch gốc và giao dịch lãi còn thiếu.
- Retry cùng idempotency key không tạo dữ liệu trùng.
- Nếu đang có số dư lãi trả trước âm, phải xử lý khoản trả trước trước khi tất toán vì schema chưa
  có loại giao dịch hoàn tiền riêng.

## 3. Quy tắc tính

```text
raw_interest = principal × daily_rate_percent / 100 × calendar_days
period_interest = round_half_up(sum(raw_interest), 1 VND)
closing_interest = opening_interest + accrued_interest - interest_payments
```

- Kỳ chuẩn 15 hoặc 30 ngày; kỳ cuối được rút ngắn tại đáo hạn hoặc tất toán.
- Sau đáo hạn tạo một kỳ `OVERDUE` mở, giữ nguyên lãi suất và không có lãi phạt.
- Segment mới bắt đầu khi dư nợ, lãi suất hoặc trạng thái tính lãi thay đổi.
- Ngày không tính lãi không xuất hiện trong `segments` nhưng vẫn thuộc khoảng ngày của kỳ.
- Reversal loại giao dịch gốc khỏi mọi lần tính hiện hành, kể cả các kỳ lịch sử đã lưu trước đó.

## 4. Idempotency

- Mỗi RPC mutation yêu cầu key không rỗng.
- Retry cùng key và cùng input trả lại kết quả hiện có.
- Dùng lại key với input khác trả lỗi conflict.
- `settle_loan` tạo các key con `:event`, `:principal` và `:interest` trong cùng transaction.

## 5. Kiểm thử chuẩn

`supabase/tests/database/030_financial_engine.test.sql` đối chiếu chính xác 10 fixture C2.
`040_financial_rpc.test.sql` kiểm tra mutation, idempotency, rebuild, settlement, reversal và quyền
VIEWER. Chạy bằng:

```bash
supabase db reset
supabase db lint --level warning
supabase test db
```
