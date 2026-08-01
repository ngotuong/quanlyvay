# Domain Specification v1

Tài liệu này khóa quy tắc nghiệp vụ dùng chung cho migration, database functions, webapp, dashboard và Google Sheets. Nếu code khác tài liệu này, code phải được sửa hoặc tài liệu phải có revision được người dùng phê duyệt.

## 1. Kiểu dữ liệu chuẩn

```text
LoanDirection: LENDING | BORROWING
LoanStatus: ACTIVE | OVERDUE | BAD_DEBT | SETTLED
UserRole: OWNER | EDITOR | VIEWER
TransactionType: DISBURSEMENT | INTEREST_PAYMENT | PRINCIPAL_PAYMENT | EXPENSE | REVERSAL
LifecycleEventType: RATE_CHANGE | BAD_DEBT_START | INTEREST_RESUME | SETTLEMENT
InterestPeriodKind: SCHEDULED | SETTLEMENT | OVERDUE
```

- Tiền VND là số nguyên, không có phần thập phân.
- Tại API và fixture, tiền được truyền bằng chuỗi thập phân để tránh mất chính xác trong JavaScript.
- Lãi suất là chuỗi decimal biểu diễn `%/ngày`; ví dụ `0.1` nghĩa là 0,1% mỗi ngày.
- Ngày nghiệp vụ là `YYYY-MM-DD` theo `Asia/Ho_Chi_Minh`, không mang timezone offset.
- Audit timestamp lưu UTC và không được dùng thay cho ngày nghiệp vụ.

## 2. Khoản vay và lịch kỳ lãi

Một khoản vay có một đối tác, một chiều `LENDING` hoặc `BORROWING`, số gốc ban đầu, ngày giải ngân, số ngày vay, chu kỳ 15/30 ngày và lãi suất ban đầu.

```text
maturity_date = disbursement_date + term_days - 1
period_1.start = disbursement_date
period_n.end = min(period_n.start + cycle_days - 1, maturity_date)
period_(n+1).start = period_n.end + 1
```

- Ngày giải ngân được tính lãi.
- Mỗi ngày chỉ thuộc tối đa một kỳ; không lặp ngày ở ranh giới kỳ.
- Kỳ cuối ngắn hơn 15/30 ngày nếu gặp ngày đáo hạn.
- Thanh toán trễ không làm dịch chuyển lịch kỳ lãi.
- Sau ngày đáo hạn, nếu chưa tất toán/ngừng lãi, hệ thống tạo kỳ `OVERDUE` mở từ ngày kế tiếp đến ngày tính toán. Không có lãi phạt và không đổi lãi suất chỉ vì quá hạn.

## 3. Công thức và làm tròn

Mỗi kỳ được chia thành các segment khi dư nợ, lãi suất hoặc trạng thái tính lãi thay đổi:

```text
raw_segment_interest = principal × (daily_rate_percent / 100) × calendar_days
period_interest = round_half_up(sum(raw_segment_interest), 1 VND)
```

- Giữ độ chính xác decimal đầy đủ ở từng segment.
- Chỉ làm tròn một lần tại cuối kỳ, theo `HALF_UP` đến 1 VND.
- Không làm tròn từng ngày hoặc từng segment.
- Không tính lãi trên lãi thiếu; chỉ dư nợ gốc phát sinh lãi.

## 4. Thời điểm hiệu lực của sự kiện

| Sự kiện ngày D | Quy tắc |
|---|---|
| Giải ngân | Ngày D được tính trên số gốc giải ngân |
| Trả gốc một phần | Ngày D vẫn dùng dư nợ cũ; dư nợ mới từ D+1 |
| Đổi lãi suất | Lãi suất mới áp dụng từ đầu ngày D |
| Chuyển nợ xấu/ngừng lãi | Ngày D vẫn tính lãi; dừng từ D+1 |
| Bật lại tính lãi | Tính lại từ đầu ngày D bằng mức được chọn |
| Tất toán | Tính lãi hết ngày D, sau đó dư nợ về 0 |
| Trả lãi | Không thay đổi principal hoặc lịch phát sinh lãi |

Nếu nhiều sự kiện cùng ngày, kết quả của ngày đó dùng: trạng thái bật/tắt lãi của ngày, lãi suất có hiệu lực ngày đó và dư nợ đầu ngày. Trả gốc/tất toán làm thay đổi dư nợ sau khi đã tính lãi ngày đó.

## 5. Thanh toán lãi và số dư chuyển kỳ

```text
closing_interest_balance =
  opening_interest_balance
  + accrued_interest
  - interest_payments
```

- Số dư dương là lãi còn thiếu.
- Số dư âm là lãi trả trước và tự khấu trừ kỳ sau.
- Thanh toán ưu tiên lãi cũ nhất, sau đó kỳ hiện tại.
- Không chuyển tiền lãi thành tiền gốc nếu không có một giao dịch riêng được người dùng nhập.
- Ghi chú thanh toán không ảnh hưởng phép tính nhưng phải được giữ trong audit/timeline.

## 6. Trả gốc và tất toán

- Trả gốc một phần không được vượt dư nợ đầu ngày.
- Dư nợ gốc không bao giờ âm.
- Khoản vay bình thường hoặc nợ xấu đều có thể trả gốc một phần.
- Tất toán là thao tác nguyên tử gồm số gốc còn lại và số lãi cần thanh toán đến hết ngày tất toán.
- Sau tất toán, trạng thái là `SETTLED`; không cho thêm giao dịch mới ngoài reversal/correction có kiểm soát.

## 7. Nợ xấu, quá hạn và bật lại lãi

- `OVERDUE` là trạng thái suy ra khi ngày hiện tại lớn hơn ngày đáo hạn và khoản vay chưa tất toán/nợ xấu.
- `BAD_DEBT` do người dùng chuyển thủ công.
- Ngày chuyển nợ xấu vẫn tính lãi; các ngày sau không phát sinh lãi cho tới ngày resume.
- Lãi đã phát sinh trước khi dừng vẫn là số dư phải thu/phải trả.
- Resume yêu cầu ngày bắt đầu và lãi suất: mặc định mức gần nhất hoặc một mức mới.
- Sau resume, trạng thái trở về `ACTIVE` hoặc `OVERDUE` tùy ngày đáo hạn.

## 8. Giao dịch bất biến và reversal

- Không xóa hoặc sửa số tiền/ngày của giao dịch đã ghi nhận.
- Sửa sai bằng giao dịch `REVERSAL` trỏ tới đúng giao dịch gốc và có lý do bắt buộc.
- Một giao dịch chỉ được reversal một lần.
- Reversal được ghi nhận tại thời điểm thực hiện nhưng hiệu lực tính lại đặt tại ngày hiệu lực của giao dịch gốc.
- Hệ thống tính lại mọi kỳ từ ngày sớm nhất bị ảnh hưởng; audit log giữ cả bản gốc và reversal.
- Reversal của giao dịch gốc khiến kết quả tương đương trường hợp giao dịch gốc chưa từng có, nhưng lịch sử vẫn tồn tại.

## 9. Lợi nhuận và dashboard

- Lãi đã thu/đã trả dùng cơ sở tiền mặt từ giao dịch thực tế.
- Lãi phải thu/phải trả dùng cơ sở dồn tích từ kỳ lãi.
- Lợi nhuận tiền mặt = lãi thực thu từ `LENDING` − lãi thực trả cho `BORROWING` − chi phí thực trả.
- Lợi nhuận dồn tích = lãi đã phát sinh từ `LENDING` − lãi đã phát sinh cho `BORROWING` − chi phí.
- Principal không được tính là doanh thu, chi phí hay lợi nhuận.
- Chi phí có thể gắn một khoản vay hoặc để trống cho chi phí chung.

## 10. Validation bắt buộc

- `termDays` là số nguyên dương; `interestCycleDays` chỉ là 15 hoặc 30.
- Principal và transaction amount là chuỗi số nguyên không âm; các khoản nhập tiền phải lớn hơn 0.
- Daily rate là decimal không âm; không dùng số thực JavaScript để quyết toán.
- Event không được trước ngày giải ngân hoặc sau ngày tất toán, trừ reversal được ghi nhận sau đó.
- Rate/status history không được có hai event mâu thuẫn cùng loại trong cùng ngày.
- Idempotency key là bắt buộc cho mutation có thể retry, notification và sync.

## 11. Bộ fixture chuẩn

`packages/domain-contract/fixtures/interest-cases.json` là test oracle dùng lại ở C3–C4. Fixture bao phủ:

- Chu kỳ 15 ngày.
- Chu kỳ 30 ngày và kỳ cuối rút ngắn.
- Trả gốc giữa kỳ.
- Đổi lãi suất có ngày hiệu lực.
- Trả thiếu/thừa lãi và carry âm/dương.
- Tất toán trước hạn.
- Quá hạn không phạt.
- Dừng/bật lại lãi nợ xấu.
- Làm tròn `HALF_UP` một lần tại cuối kỳ.
- Reversal giao dịch gốc và tính lại lịch sử.

Fixture không phải production calculation engine. Supabase database functions ở C4 phải tạo kết quả giống fixture này.
