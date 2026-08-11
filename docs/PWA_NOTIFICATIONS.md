# PWA và thông báo C8

## Phạm vi

- Manifest và service worker giúp cài ứng dụng ở chế độ `standalone`.
- Ứng dụng không cache dữ liệu tài chính để hoạt động ngoại tuyến. Service worker chỉ xử lý Push và mở deep link khi người dùng chạm thông báo.
- Notification center tại `/notifications` hoạt động độc lập với quyền Push của trình duyệt.
- Mỗi tài khoản đang hoạt động nhận một notification riêng; trạng thái đã đọc được lưu riêng theo user.

## Quy tắc nhắc lịch

- `INTEREST_DUE`: tạo đúng ngày đóng lãi của kỳ 15/30 ngày hoặc ngày cuối kỳ bị rút ngắn.
- Tiêu đề nhắc lãi theo hướng khoản: cho vay dùng `Đến ngày thu lãi`, đi vay dùng `Đến ngày đóng
  lãi`. Nội dung dùng đối tác, gốc ban đầu, ngày giải ngân và số lãi authoritative còn phải thu/trả;
  không dùng tên khoản vay tự sinh.
- `LOAN_OVERDUE`: tạo mỗi ngày khi khoản vay có trạng thái tính toán `OVERDUE`.
- Khoản `BAD_DEBT` đang dừng lãi và khoản `SETTLED` không tạo nhắc đóng lãi.
- Khóa `type:loan:date:user` bảo đảm chạy lại cùng ngày không tạo bản ghi trùng.

`public.generate_due_notifications(date)` và hàng đợi giao nhận chỉ cấp quyền cho `service_role`. Người dùng chỉ đọc notification của chính mình và quản lý subscription của chính mình qua RPC đã kiểm tra Auth.

## Web Push và retry

`GET|POST /api/notifications/run` yêu cầu header `Authorization: Bearer <CRON_SECRET>`. `GET` dùng
cho Vercel Cron, còn `POST` giữ cho kiểm thử thủ công. Endpoint tạo lịch ngày hiện tại theo
`Asia/Ho_Chi_Minh`, claim tối đa 100 delivery rồi gửi bằng VAPID.

Mỗi cặp notification/subscription có duy nhất một delivery. Worker dùng lease 5 phút và tối đa 5 lần thử. Delivery `SENT` không được claim lại; payload dùng cùng idempotency key làm `tag` để service worker không hiển thị nhiều notification khi có retry sau sự cố mạng.

Subscription chỉ nhận các notification chưa đọc được tạo từ thời điểm subscription tồn tại; bật
Push trên thiết bị mới không phát lại toàn bộ lịch sử. Nút bật/tắt trên giao diện lấy trạng thái từ
subscription thật của trình duyệt hiện tại, không suy ra từ subscription của tài khoản trên thiết bị
khác.

Subscription trả về HTTP 404/410 sẽ bị xóa. Secret và khóa riêng không được lưu trong Git.

## Badge trên biểu tượng ứng dụng

Badge trong navigation là trạng thái giao diện của webapp. Badge ngoài biểu tượng PWA là khả năng
riêng của hệ điều hành/trình duyệt và chỉ được đồng bộ khi nền tảng có Badging API. Khi app đang mở,
layout đặt badge bằng tổng notification chưa đọc; khi nhận Push trong nền, payload mang cùng
`unread_count` để service worker cập nhật badge. Đánh dấu đã đọc rồi mở lại/điều hướng trong app sẽ
đồng bộ số mới hoặc xóa badge khi về 0.

Trên iOS/iPadOS, chức năng này chỉ áp dụng cho webapp đã thêm vào Home Screen và được người dùng cấp
quyền thông báo; Badge cũng có thể bị tắt riêng trong Settings. Một số nền tảng chỉ hiện dấu chấm
thay vì con số, hoặc không hỗ trợ API. Vì vậy notification center trong app vẫn là nguồn trạng thái
đọc/chưa đọc chuẩn, không suy ra từ hình thức badge của launcher.

Migration `20260811160000_c16_notification_copy_and_badges.sql` làm mới nội dung các
`INTEREST_DUE` chưa đọc hiện hữu. Notification hệ điều hành đã giao trước đó không thể sửa ngược.

## Cấu hình local

Sinh cặp VAPID:

```bash
pnpm --filter @quan-ly-vay-ca-nhan/web push:keys
```

Sao chép giá trị vào `apps/web/.env.local` theo `apps/web/.env.example`:

```text
NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY=...
WEB_PUSH_PRIVATE_KEY=...
WEB_PUSH_SUBJECT=mailto:dia-chi-quan-tri@example.com
CRON_SECRET=...
```

Sau khi chạy web local, người dùng mở `/notifications` và chủ động bấm **Bật thông báo**. Trình duyệt chỉ hiển thị hộp xin quyền tại thời điểm đó. Việc cấu hình cron remote và remote secret thuộc C10/C12, không thực hiện ở C8.

## Lịch Vercel Hobby

`apps/web/vercel.json` đăng ký một cron mỗi ngày lúc `00:00 UTC`. Trên Hobby, Vercel có thể gọi
trong khoảng `00:00–00:59 UTC`, tương ứng khoảng `07:00–07:59` tại Việt Nam. Lịch không chạy
nhiều hơn một lần/ngày để tuân thủ giới hạn Hobby; idempotency trong database bảo vệ trường hợp
Vercel gửi trùng.

## Kiểm thử

- pgTAP kiểm tra đúng ngày đến hạn, nhắc quá hạn hằng ngày, mọi active user, idempotency,
  subscription upsert, không phát lịch sử cho subscription mới, đánh dấu đã đọc và delivery không
  được claim lại sau khi `SENT`.
- Playwright kiểm tra manifest, service worker, notification center, đồng bộ app badge và không tràn
  ngang trên mobile.
