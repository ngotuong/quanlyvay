# Authentication and Roles v1

## Mô hình đăng nhập

- Người dùng nhập `username` và mật khẩu, không nhập email.
- Server chuẩn hóa username thành chữ thường và ánh xạ thành địa chỉ nội bộ
  `<username>@auth.local` để dùng Supabase Auth.
- Địa chỉ nội bộ không phải email liên hệ, không hiển thị trên giao diện và không đồng bộ sang
  Google Sheets.
- Session SSR nằm trong cookie do `@supabase/ssr` quản lý; server dùng `getUser()` hoặc
  `getClaims()` thay vì tin dữ liệu session chưa xác minh.
- Public signup bị tắt ở cấu hình Auth toàn cục; email/password provider vẫn bật để các tài khoản do Admin API cấp có thể đăng nhập.

## Provisioning và quản trị tài khoản

- Tài khoản đầu tiên được provision qua Admin API tự động trở thành `OWNER`.
- Mọi tài khoản sau OWNER chỉ có thể là `EDITOR` hoặc `VIEWER`; không giới hạn số lượng ở tầng ứng dụng.
- Profile được tạo bởi trigger cùng transaction với `auth.users`; username và user ID bất biến.
- Profile không xóa vật lý. Trigger quản trị từ chối `DELETE`, kể cả profile đã vô hiệu hóa và
  không có tham chiếu tài chính; OWNER có thể vô hiệu hóa từng tài khoản được quản lý.
- Chỉ có một OWNER hoạt động và OWNER không thể tự hạ quyền hoặc tự vô hiệu hóa.
- OWNER quản lý các tài khoản tại `/settings`: tạo tài khoản, đổi tên hiển thị/vai trò/trạng
  thái hoạt động và cấp lại mật khẩu tạm. Mật khẩu tạm luôn buộc đổi ở lần đăng nhập kế tiếp.
- Mật khẩu cần tối thiểu 6 ký tự và chỉ gồm chữ cái ASCII hoặc chữ số; không bắt buộc chữ hoa,
  chữ thường hay phối hợp cả chữ và số.
- Supabase Auth local/remote phải đặt minimum length bằng 6 và không cấu hình required-character
  groups; validation ứng dụng tiếp tục giới hạn tập ký tự chữ/số.

Không chạy bootstrap với username/mật khẩu thật nếu người dùng chưa xác nhận. Script chuẩn bị sẵn:

```bash
pnpm --filter @quan-ly-vay-ca-nhan/web auth:bootstrap-owner
```

Script yêu cầu các biến `BOOTSTRAP_USERNAME`, `BOOTSTRAP_DISPLAY_NAME`, `BOOTSTRAP_PASSWORD`,
`NEXT_PUBLIC_SUPABASE_URL` và `SUPABASE_SECRET_KEY`; không ghi mật khẩu vào repository.

## Quyền

Mọi vai trò mở **Cài đặt** tại `/settings` để xem tài khoản, đổi mật khẩu cá nhân và đăng xuất;
`/account` chuyển hướng giữ tương thích sang `/settings`. Chỉ OWNER thấy phần quản trị tài khoản
khác. Mobile mở “Thêm” → “Cài đặt”.

| Thao tác | OWNER | EDITOR | VIEWER |
|---|---:|---:|---:|
| Xem dữ liệu tài chính | Có | Có | Có |
| Ghi nghiệp vụ qua RPC | Có | Có | Không |
| Xem audit log | Có | Không | Không |
| Tạo/vô hiệu hóa tài khoản | Có | Không | Không |
| Đổi mật khẩu của chính mình | Có | Có | Có |

Tài khoản bị vô hiệu hóa có thể còn token Auth chưa hết hạn, nhưng RLS và RPC đều từ chối truy cập
dữ liệu ngay lập tức. Màn hình đăng nhập cũng đăng xuất tài khoản nếu profile không hoạt động.

## Secret và biến môi trường

- `NEXT_PUBLIC_SUPABASE_URL` và publishable key được dùng cho client/SSR.
- `SUPABASE_SECRET_KEY` chỉ được import từ module `server-only` để tạo hoặc đặt lại tài khoản.
- Không commit `.env.local`; chỉ commit `.env.example` với giá trị giả.

## Kiểm thử local

Test Auth API tạo các tài khoản giả và tự reset đầy đủ migration trên database local:

```bash
pnpm test:auth
```

Lần reset cuối xóa toàn bộ tài khoản test giả. Không chạy quy trình này trên database có dữ liệu thật.

Harness local dùng project `QuanLyVayCaNhan-C20-test` trong `.cache/c20-test`, API port `55321`.
`scripts/test-environment.cjs` kiểm tra target localhost và project trước reset; không reset instance
`QuanLyVayCaNhan` hiện hữu. CI dùng database ephemeral của workflow.
