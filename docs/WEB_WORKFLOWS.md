# Web Workflows v1

## Phạm vi C6

- Trang danh sách khoản vay tại `/`, chi tiết tại `/loans/[id]` và tạo mới tại `/loans/new`.
- Quản lý đối tác tại `/counterparties`; OWNER chỉ xóa được đối tác chưa có lịch sử khoản vay.
- Ghi nhận tiền lãi, tiền gốc, chi phí, thay đổi lãi suất, nợ xấu, bật lại tính lãi và tất toán.
- Chi phí không gắn khoản vay được nhập, xem và đảo tại `/expenses`.
- Giao dịch tài chính chỉ được sửa sai bằng thao tác đảo; giao dịch gốc vẫn còn trong timeline.
- OWNER xem 100 audit log gần nhất tại `/audit`; EDITOR và VIEWER không truy cập được.
- OWNER quản lý tài khoản thứ hai và mật khẩu tạm tại `/settings`.
- VIEWER xem được toàn bộ nghiệp vụ nhưng không thấy các biểu mẫu thay đổi dữ liệu.

## Ranh giới dữ liệu

Mọi input từ web được validate bằng Zod trong Server Actions. Các thao tác tiền và lifecycle gọi RPC
PostgreSQL; frontend không tự tính dư nợ hoặc lãi. Migration C6 bổ sung các RPC:

- `create_counterparty`, `update_counterparty`, `delete_counterparty`
- `create_loan_v2`: tạo khoản vay và giao dịch giải ngân trong cùng transaction, nhận lãi suất của
  cả chu kỳ, tự sinh nhãn khi người dùng để trống và có idempotency key
- `update_loan_details`: sửa nhãn tùy chọn, đối tác và ghi chú; nhãn trống được tự sinh lại
- `correct_loan_terms`: luồng chuyên biệt để sửa dữ liệu khởi tạo nhập sai. RPC khóa khoản vay, cập
  nhật điều khoản có audit, đảo giải ngân cũ, thêm giải ngân thay thế và rebuild lãi trong cùng
  transaction; lý do và idempotency key là bắt buộc
- `get_loan_term_summary`: trả lãi suất cả kỳ và tiền lãi của một kỳ đầu đủ ngày từ PostgreSQL
- `record_expense`: tạo transaction và category chi phí nguyên tử; khóa idempotency kiểm tra cả
  khoản vay, ngày, số tiền, nhóm chi phí và ghi chú

Các RPC tài chính C4 tiếp tục xử lý thanh toán, lifecycle, reversal và settlement.

## Trải nghiệm giao diện

- Mobile dùng header và bottom navigation co giãn đủ năm mục thường hoặc bảy mục OWNER; desktop từ
  1024px dùng sidebar.
- Form có label hiển thị, thông báo lỗi gần trường, loading state và touch target tối thiểu 44px.
- Trạng thái không chỉ biểu diễn bằng màu mà luôn có nhãn chữ.
- Giao dịch đảo (kể cả chi phí chung), xóa đối tác và tất toán đều yêu cầu xác nhận.
- Sửa dữ liệu ban đầu nằm trong vùng mở rộng riêng, hiển thị cảnh báo, bắt buộc lý do và checkbox
  xác nhận. Khoản đã tất toán không hiển thị thao tác này.
- `loading.tsx` cung cấp skeleton khi route đang tải; reduced-motion được tôn trọng.

## Kiểm thử

```bash
supabase db reset
supabase test db
pnpm test:e2e
```

Playwright dùng Google Chrome local tại cổng `3100`, tạo OWNER giả, chạy luồng nghiệp vụ và reset
database khi kết thúc. Không chạy bộ test này trên database có dữ liệu thật.
