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
- Ghi nguyên tử lifecycle `SETTLEMENT`, giao dịch gốc/lãi còn thiếu; bỏ qua thành phần đã bằng 0.
- Cho phép đánh dấu tất toán khi gốc và lãi đã được thanh toán trước đó mà không tạo transaction 0 VND.
- Retry cùng idempotency key không tạo dữ liệu trùng.
- Nếu đang có số dư lãi trả trước âm, phải xử lý khoản trả trước trước khi tất toán vì schema chưa
  có loại giao dịch hoàn tiền riêng.

### `reverse_settlement(...)`

- Khóa dòng khoản vay, tìm settlement còn hiệu lực và đúng batch qua idempotency prefix.
- Thêm `REVERSAL` cho từng component gốc/lãi của batch và một dòng append-only trong
  `loan_settlement_reversals`; không sửa hoặc xóa lịch sử cũ.
- Engine bỏ qua settlement đã có ledger reversal, rebuild lại trạng thái và cho phép retry cùng key.
- `reverse_transaction` vẫn đảo được payment độc lập cùng ngày nhưng từ chối component settlement.

## 3. Quy tắc tính

```text
raw_interest = principal × daily_rate_percent / 100 × calendar_days
period_interest = round_half_up(sum(raw_interest), 1 VND)
closing_interest = opening_interest + accrued_interest - interest_payments
```

- Kỳ chuẩn 15 hoặc 30 ngày. Khoản không đáo hạn tiếp tục mở kỳ mới đến khi tất toán; kỳ cuối chỉ rút ngắn tại tất toán.
- `interest_reminder_offset_days` dịch ngày nhắc/notification sớm hơn ngày cuối kỳ nhưng engine vẫn
  tính tới ngày cuối kỳ. Dashboard dự báo tiền lãi tại ngày kết thúc kỳ, không cắt lãi ở ngày nhắc.
- `legacy_loan_onboardings` lưu snapshot bất biến cho khoản cũ. RPC onboarding tạo tối đa một khoản
  trả gốc tổng hợp, một khoản trả lãi tổng hợp và một sự kiện nợ xấu; không được đảo riêng các thành phần.
- Lãi mở đầu vẫn tham gia số lãi đã thu trọn đời và phép tính số dư, nhưng bị loại khỏi biểu đồ dòng
  tiền tháng chốt vì đó là tổng lịch sử chứ không phải tiền vừa thu trong tháng.
- `get_management_dashboard(period_start, period_end)` lấy số dư tại cuối kỳ, tính dòng tiền/lãi
  trong kỳ, tách dư gốc `BAD_DEBT` khỏi dư nợ hoạt động nhưng vẫn giữ trong tổng vốn chưa thu hồi.
- Ngày đáo hạn là tùy chọn. Chỉ khoản có đáo hạn mới rút ngắn kỳ tại đáo hạn và có thể chuyển `OVERDUE`.
- Sau đáo hạn tạo một kỳ `OVERDUE` mở, giữ nguyên lãi suất và không có lãi phạt.
- Segment mới bắt đầu khi dư nợ, lãi suất hoặc trạng thái tính lãi thay đổi.
- Ngày không tính lãi không xuất hiện trong `segments` nhưng vẫn thuộc khoảng ngày của kỳ.
- Reversal loại giao dịch gốc khỏi mọi lần tính hiện hành, kể cả các kỳ lịch sử đã lưu trước đó.

## 4. Idempotency

- Mỗi RPC mutation yêu cầu key không rỗng.
- Retry cùng key và cùng input trả lại kết quả hiện có.
- Dùng lại key với input khác trả lỗi conflict.
- `settle_loan` tạo các key con `:event`, `:principal` và `:interest` trong cùng transaction.
- `reverse_settlement` tạo key con theo loại component và một key ledger riêng trong cùng transaction.

## 5. Kiểm thử chuẩn

`supabase/tests/database/030_financial_engine.test.sql` đối chiếu chính xác 10 fixture C2.
`040_financial_rpc.test.sql` kiểm tra mutation, idempotency, rebuild, settlement, reversal và quyền
VIEWER. Chạy bằng:

```bash
supabase db reset
supabase db lint --level warning
supabase test db
```
