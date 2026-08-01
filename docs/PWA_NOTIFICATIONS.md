# PWA và thông báo C8

## Phạm vi

- Manifest và service worker giúp cài ứng dụng ở chế độ `standalone`.
- Ứng dụng không cache dữ liệu tài chính để hoạt động ngoại tuyến. Service worker chỉ xử lý Push và mở deep link khi người dùng chạm thông báo.
- Notification center tại `/notifications` hoạt động độc lập với quyền Push của trình duyệt.
- Mỗi tài khoản đang hoạt động nhận một notification riêng; trạng thái đã đọc được lưu riêng theo user.

## Quy tắc nhắc lịch

- `INTEREST_DUE`: tạo đúng ngày đóng lãi của kỳ 15/30 ngày hoặc ngày cuối kỳ bị rút ngắn.
- `LOAN_OVERDUE`: tạo mỗi ngày khi khoản vay có trạng thái tính toán `OVERDUE`.
- Khoản `BAD_DEBT` đang dừng lãi và khoản `SETTLED` không tạo nhắc đóng lãi.
- Khóa `type:loan:date:user` bảo đảm chạy lại cùng ngày không tạo bản ghi trùng.

`public.generate_due_notifications(date)` và hàng đợi giao nhận chỉ cấp quyền cho `service_role`. Người dùng chỉ đọc notification của chính mình và quản lý subscription của chính mình qua RPC đã kiểm tra Auth.

## Web Push và retry

`GET|POST /api/notifications/run` yêu cầu header `Authorization: Bearer <CRON_SECRET>`. `GET` dùng
cho Vercel Cron, còn `POST` giữ cho kiểm thử thủ công. Endpoint tạo lịch ngày hiện tại theo
`Asia/Ho_Chi_Minh`, claim tối đa 100 delivery rồi gửi bằng VAPID.

Mỗi cặp notification/subscription có duy nhất một delivery. Worker dùng lease 5 phút và tối đa 5 lần thử. Delivery `SENT` không được claim lại; payload dùng cùng idempotency key làm `tag` để service worker không hiển thị nhiều notification khi có retry sau sự cố mạng.

Subscription trả về HTTP 404/410 sẽ bị xóa. Secret và khóa riêng không được lưu trong Git.

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

- pgTAP kiểm tra đúng ngày đến hạn, nhắc quá hạn hằng ngày, mọi active user, idempotency, subscription upsert, đánh dấu đã đọc và delivery không được claim lại sau khi `SENT`.
- Playwright kiểm tra manifest, service worker, notification center và không tràn ngang trên mobile.
