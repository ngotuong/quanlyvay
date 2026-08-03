# Google Sync local

## Phạm vi và ranh giới dữ liệu

Supabase là nguồn dữ liệu chuẩn. Google Sheets là bản đối chiếu chỉ đọc theo hướng
`Supabase → Next.js export API → Apps Script → Google Sheets`; không có API hoặc hàm nào ghi
ngược dữ liệu Sheet vào Supabase.

Apps Script không giữ Supabase service-role key. Endpoint `GET /api/google-sync/export` chạy ở
Next.js server và yêu cầu header `x-sync-secret`. Secret đồng bộ phải khác mọi key Supabase và
chỉ được lưu trong biến môi trường Vercel cùng Script Properties.

## Cấu trúc mã

```text
apps/google-sync/
  src/Config.js       contract các tab, cột và kiểu dữ liệu
  src/Core.js         chuẩn hóa payload, cursor và retention
  src/Code.js         sync, định dạng Sheet, snapshot và restore
  test/               mock local cho Apps Script/Sheets/Drive
  scripts/build.mjs   tạo gói dist dành cho clasp ở C11
```

Chạy local:

```bash
pnpm --filter @quan-ly-vay-ca-nhan/google-sync typecheck
pnpm --filter @quan-ly-vay-ca-nhan/google-sync test
pnpm --filter @quan-ly-vay-ca-nhan/google-sync build
```

Thư mục `dist/` là build artifact và không commit. `.clasp.json` chỉ được tạo khi liên kết
project Google ở C11 và cũng không commit.

## Contract Sheet

Workbook gồm tab `Tổng quan` và tám tab dữ liệu:

1. `Đối tác`
2. `Khoản vay`
3. `Giao dịch`
4. `Sự kiện`
5. `Kỳ lãi`
6. `Chi phí`
7. `Thông báo`
8. `Lịch sử`

Mỗi lần nguồn thay đổi, dữ liệu trong các tab đối chiếu được thay thế toàn bộ. Không nhập dữ
liệu thủ công vào những tab này vì lần sync tiếp theo sẽ ghi đè. Header được cố định, có filter;
VND là số nguyên có định dạng phân tách hàng nghìn, ngày dùng múi giờ `Asia/Ho_Chi_Minh`.
Giá trị VND vượt giới hạn số nguyên an toàn của JavaScript được ghi dưới dạng text để không mất
độ chính xác. Mọi giá trị text bắt đầu bằng `=`, `+`, `-` hoặc `@` được thêm dấu nháy đơn trước
khi ghi để không bị Google Sheets diễn giải thành công thức.

Export API đọc từng bảng theo các trang 1.000 dòng cho tới khi hết dữ liệu. Giới hạn `max_rows`
của PostgREST vì vậy không thể làm snapshot bị cắt ngầm; nếu bất kỳ trang nào lỗi, endpoint không
trả snapshot một phần.

Endpoint trả `sourceVersion`. Apps Script lưu giá trị này vào `SYNC_CURSOR`; khi nguồn không đổi,
endpoint trả `unchanged: true` và workbook không bị ghi lại. Đây là checkpoint incremental ở cấp
snapshot, không phải đồng bộ hai chiều hay cập nhật từng dòng.

## Script Properties ở C11

Các property sau chỉ cấu hình sau khi người dùng xác nhận tài khoản và tài nguyên Google:

| Property | Ý nghĩa |
|---|---|
| `SYNC_API_URL` | URL deployment Vercel, không kèm dấu `/` cuối |
| `SYNC_API_SECRET` | Secret riêng khớp với `SYNC_SECRET` trên Vercel |
| `VERCEL_PROTECTION_BYPASS_SECRET` | Tùy chọn: automation bypass secret khi Apps Script gọi Preview đang bật Vercel Authentication; Production công khai không cần property này |
| `BACKUP_FOLDER_ID` | ID thư mục Drive chứa snapshot tuần |
| `SYNC_CURSOR` | Cursor do script tự quản lý |
| `LAST_SYNC_AT` | Thời điểm sync thành công gần nhất, do script tự quản lý |
| `LAST_SNAPSHOT_WEEK` | Tuần đã snapshot gần nhất, do script tự quản lý |

Không đưa giá trị thật của các property vào Git. Khi có cấu hình,
`VERCEL_PROTECTION_BYPASS_SECRET` chỉ gửi qua header `x-vercel-protection-bypass`; truyền chuỗi
rỗng vào `configureGoogleSync` sẽ xóa property cũ, phù hợp với Production không bật Vercel
Authentication. Entry point quản trị này chỉ trả trạng thái boolean và URL, không trả lại secret.
`getGoogleSyncStatus` chỉ trả cursor, thời điểm sync và tên trigger để hậu kiểm.
Manifest giới hạn API executable ở `MYSELF`; chỉ tài khoản chủ sở hữu Apps Script mới có thể gọi
các entry point quản trị từ CLI.

## Snapshot và phục hồi

`runWeeklySnapshot` tạo tối đa một bản sao workbook mỗi tuần trong thư mục Drive được cấu hình.
Các file có prefix `QLV_Snapshot_` được sắp theo ngày tạo; chỉ giữ 12 bản mới nhất, bản cũ hơn
được chuyển vào thùng rác Drive.

`restoreSnapshotById(snapshotSpreadsheetId)` sao chép các giá trị từ snapshot vào workbook đối
chiếu đang mở. Phục hồi này không gọi endpoint mutate và tuyệt đối không phục hồi ngược vào
Supabase. Hàm xóa `SYNC_CURSOR` sau khi sao chép để lần sync kế tiếp bắt buộc tải lại snapshot nguồn
đầy đủ, đưa workbook về trạng thái Supabase chuẩn hiện tại thay vì bỏ qua vì cursor cũ.

## Cấu hình trigger

Ở C11, sau từng xác nhận riêng, mới thực hiện `clasp login`, tạo/link Apps Script, Sheet, thư mục
Drive, `clasp push` và trigger. Installer luôn tạo:

- snapshot tuần gọi `runWeeklySnapshot`.

Trigger đồng bộ định kỳ gọi `runGoogleSheetSync` chỉ được tạo khi cả `SYNC_API_URL` và
`SYNC_API_SECRET` đã tồn tại. Hai property này phụ thuộc Vercel Preview nên được cấu hình ở C12;
chạy lại installer sau cấu hình sẽ kích hoạt trigger đồng bộ theo giờ. Trước thời điểm đó installer
xóa trigger đồng bộ được quản lý để tránh phát sinh lỗi định kỳ vì thiếu cấu hình.

C9 không truy cập tài khoản Google, không tạo tài nguyên remote và không chạy `clasp`.
