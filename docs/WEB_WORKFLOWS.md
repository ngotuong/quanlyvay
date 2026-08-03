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
- `create_loan`: tạo khoản vay và giao dịch giải ngân trong cùng transaction, có idempotency key
- `update_loan_details`: chỉ sửa tên, đối tác và ghi chú; không sửa hồi tố điều khoản tài chính
- `record_expense`: tạo transaction và category chi phí nguyên tử; khóa idempotency kiểm tra cả
  khoản vay, ngày, số tiền, nhóm chi phí và ghi chú

Các RPC tài chính C4 tiếp tục xử lý thanh toán, lifecycle, reversal và settlement.

## Trải nghiệm giao diện

- Mobile dùng header và bottom navigation co giãn đủ năm mục thường hoặc bảy mục OWNER; desktop từ
  1024px dùng sidebar.
- Form có label hiển thị, thông báo lỗi gần trường, loading state và touch target tối thiểu 44px.
- Trạng thái không chỉ biểu diễn bằng màu mà luôn có nhãn chữ.
- Giao dịch đảo (kể cả chi phí chung), xóa đối tác và tất toán đều yêu cầu xác nhận.
- `loading.tsx` cung cấp skeleton khi route đang tải; reduced-motion được tôn trọng.

## Kiểm thử

```bash
supabase db reset
supabase test db
pnpm test:e2e
```

Playwright dùng Google Chrome local tại cổng `3100`, tạo OWNER giả, chạy luồng nghiệp vụ và reset
database khi kết thúc. Không chạy bộ test này trên database có dữ liệu thật.
