# PWA và thông báo C8

Audit của Web Push chỉ lưu fingerprint/ngữ cảnh đã sanitize; không lưu raw `endpoint`, `p256dh` hoặc
`auth_secret`. Sau khi rotate VAPID, subscription cũ phải bị vô hiệu hóa và từng thiết bị đăng ký lại.

## Phạm vi

- Manifest và service worker giúp cài ứng dụng ở chế độ `standalone`.
- Ứng dụng không cache dữ liệu tài chính để hoạt động ngoại tuyến. Service worker chỉ xử lý Push và mở deep link khi người dùng chạm thông báo.
- Notification center tại `/notifications` hoạt động độc lập với quyền Push của trình duyệt.
- Mỗi tài khoản đang hoạt động nhận một notification riêng; trạng thái đã đọc được lưu riêng theo user.

## Quy tắc nhắc lịch

- `INTEREST_DUE`: tạo đúng ngày đóng lãi của kỳ 15/30 ngày hoặc ngày cuối kỳ bị rút ngắn.
- Tiêu đề nhắc lãi theo hướng khoản: cho vay dùng `Đến ngày thu lãi`, đi vay dùng `Đến ngày đóng
  lãi`. Nội dung dùng đối tác, gốc ban đầu, ngày giải ngân và số lãi authoritative còn phải thu/trả;
  không dùng tên khoản vay tự sinh. Nội dung được tách thành ba dòng: đối tác và gốc ban đầu; ngày
  giải ngân; số lãi phải thu/trả.
- `LOAN_OVERDUE`: tạo mỗi ngày khi khoản vay có trạng thái tính toán `OVERDUE`. Nội dung có thêm dòng
  thứ tư ghi chính xác số ngày quá hạn so với ngày đáo hạn.
- Khoản `BAD_DEBT` đang dừng lãi và khoản `SETTLED` không tạo nhắc đóng lãi.
- Khóa `type:loan:date:user` bảo đảm chạy lại cùng ngày không tạo bản ghi trùng.
- Mỗi tài khoản chọn một giờ nguyên từ `00:00` đến `23:00` theo `Asia/Ho_Chi_Minh`; mặc định là
  `07:00`. RPC `update_notification_delivery_hour` chỉ sửa preference của chính tài khoản đang hoạt
  động. Worker chỉ claim delivery của người dùng có giờ khớp lượt chạy hiện tại.

`public.generate_due_notifications(date)` và hàng đợi giao nhận chỉ cấp quyền cho `service_role`. Người dùng chỉ đọc notification của chính mình và quản lý subscription của chính mình qua RPC đã kiểm tra Auth.

## Web Push và retry

`GET|POST /api/notifications/run` yêu cầu header `Authorization: Bearer <CRON_SECRET>`. `GET` dùng
cho Vercel Cron, còn `POST` giữ cho kiểm thử thủ công. Endpoint tạo lịch ngày hiện tại theo
`Asia/Ho_Chi_Minh`, sau đó drain tối đa 200 batch, mỗi batch 5 delivery gửi song song, timeout mỗi gửi 5 giây.
Ngân sách nhận batch là 40 giây (gồm tạo lịch), dưới maxDuration 60 giây. Nếu vẫn còn queue, endpoint trả `500` với
`queueRemaining=true` để hệ thống giám sát chạy lại thay vì báo thành công thiếu.

Mỗi cặp notification/subscription có duy nhất một delivery. Worker dùng lease 5 phút và tối đa 5 lần thử. Delivery `SENT` không được claim lại; payload dùng cùng idempotency key làm `tag` để service worker không hiển thị nhiều notification khi có retry sau sự cố mạng.

Nhiều khoản cùng đến lịch trong một ngày vẫn có notification, delivery và `tag` riêng; worker gửi
đủ từng item. Hệ điều hành có thể tự nhóm nhiều notification trên màn hình khóa nhưng không làm mất
item trong Notification Center của ứng dụng.

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

Migration `20260913165000_c30_notification_copy.sql` làm mới nội dung các `INTEREST_DUE` và
`LOAN_OVERDUE` chưa đọc hiện hữu theo copy nhiều dòng. Notification hệ điều hành đã giao trước đó
không thể sửa ngược; hệ điều hành cũng có thể tự ngắt dòng hoặc rút gọn nội dung tùy kích thước màn
hình, nhưng Notification Center trong ứng dụng luôn giữ nguyên cấu trúc dòng.

Ở local và Vercel Preview, trang `/notifications` có nút `Gửi thông báo thử`. Nút này gọi trực tiếp
service worker trên thiết bị để hiển thị payload mẫu, không tạo bản ghi Supabase, không tăng badge và
không gửi sang thiết bị khác. Nút bị ẩn trong Production và sẽ được bỏ sau khi người dùng duyệt copy.

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

## Scheduler theo giờ

`apps/web/vercel.json` vẫn đăng ký cron dự phòng mỗi ngày lúc `00:00 UTC` (khoảng 07:00 Việt Nam).
Vercel Hobby chỉ cho mỗi cron chạy một lần/ngày và có thể lệch trong giờ, nên cron này không đủ để
thực thi preference riêng theo giờ. Production phải bật Supabase Cron gọi endpoint mỗi giờ; khóa
gọi được lưu trong Vault, không ghi vào migration hoặc repository.

Sau khi migration đã áp và trước khi deploy web phụ thuộc preference, vận hành remote theo thứ tự:

1. Bật module `pg_cron` và `pg_net` trong Supabase Dashboard.
2. Tạo hai Vault secret: `qlv_notification_runner_url` là URL Production kết thúc bằng
   `/api/notifications/run`; `qlv_notification_runner_secret` là cùng `CRON_SECRET` đang dùng ở
   Vercel.
3. Tạo một job tên `qlv-notification-runner-hourly`, lịch `0 * * * *`, chạy một `net.http_post` với
   header `Authorization: Bearer <secret từ Vault>`.
4. Gọi thử endpoint ở giờ đã chọn, xác nhận response có `deliveryHour`, `claimed = sent + failed +
   stateUpdateFailed`, `queueRemaining=false`, rồi xem `cron.job_run_details` và Vercel runtime log.

SQL mẫu vận hành (không thay placeholder bằng secret trong file):

```sql
select cron.schedule(
  'qlv-notification-runner-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'qlv_notification_runner_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'qlv_notification_runner_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Job/Vault là thay đổi remote và luôn cần xác nhận riêng. Idempotency, unique delivery và lease bảo vệ
trường hợp cron dự phòng Vercel trùng với Supabase Cron lúc 07:00.

## Kiểm thử

- pgTAP kiểm tra đúng ngày đến hạn, nhắc quá hạn hằng ngày, mọi active user, preference giờ, idempotency,
  subscription upsert, không phát lịch sử cho subscription mới, đánh dấu đã đọc và delivery không
  được claim lại sau khi `SENT`.
- Playwright kiểm tra manifest, service worker, notification center, đồng bộ app badge và không tràn
  ngang trên mobile.
