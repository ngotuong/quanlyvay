# Vercel Preview release runbook

## Mục tiêu

Stable alias `https://tindung-preview.vercel.app` chỉ được chuyển sang một candidate đã qua đầy đủ
gate local, đúng project/target, smoke trên URL bất biến và hậu kiểm sau khi gán alias.

## Lệnh duy nhất

Sau khi có xác nhận riêng cho thao tác remote, chạy tại repository root:

```bash
pnpm deploy:preview
```

Không gọi `vercel deploy` hoặc `vercel alias set` trực tiếp cho luồng Preview thông thường.

Lần chạy đầu tạo và smoke candidate nhưng **không chuyển alias**. Script trả immutable URL và lệnh
tiếp tục. Trên immutable URL đó, đăng nhập và mở mọi route Auth/Server Component đã đổi; đồng thời
kiểm tra browser console và Vercel runtime logs. Khi bằng chứng này đạt, chạy đúng lệnh tiếp tục mà
script đã in, có dạng:

```bash
pnpm deploy:preview -- --candidate https://deployment-bat-bien.vercel.app --verified-authenticated-smoke
```

Flag `--verified-authenticated-smoke` là xác nhận vận hành rằng authenticated smoke và runtime log
đã đạt; không dùng flag nếu chỉ mới thấy deployment `Ready`.

Script bắt buộc:

1. Khóa đúng project ID và Root Directory `apps/web`.
2. Chạy `git diff --check`, lint, typecheck, unit tests, build và E2E.
3. Tạo candidate với `--target=preview` nhưng chưa đổi stable alias.
4. Xác nhận candidate `target=preview`, `Ready`, Functions `sin1` và smoke URL bất biến.
5. Dừng ở trạng thái `awaiting_authenticated_smoke` nếu chưa có xác nhận smoke đăng nhập/runtime.
6. Chỉ sau xác nhận đó mới gán `tindung-preview.vercel.app`.
7. Smoke lại stable alias; nếu thất bại thì tự gán alias về deployment trước đó.

Nếu candidate đã được tạo nhưng script dừng trước bước gán alias, có thể tiếp tục an toàn mà không
tạo deployment thừa:

```bash
pnpm deploy:preview -- --candidate https://deployment-bat-bien.vercel.app --verified-authenticated-smoke
```

`Ready` hoặc build thành công riêng lẻ không được xem là bằng chứng ứng dụng hoạt động. Route đã sửa
phải có E2E hoặc authenticated browser smoke tương ứng; sau rollout phải kiểm tra runtime error log.
