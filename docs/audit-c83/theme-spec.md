# C83 — Đặc tả lựa chọn giao diện cho C84

Đề xuất, chưa triển khai runtime. Nguồn: câu hỏi OWNER về thiếu bộ chọn Sáng/Tối/Theo thiết bị,
audit C83, hệ token hiện hữu trong `apps/web/src/app/globals.css`.

## Truy cập và lựa chọn

- A khuyên dùng: nhóm “Giao diện” đứng đầu `/settings`, xuất hiện với OWNER/EDITOR/VIEWER.
  Desktop đi từ Cài đặt; mobile dùng Thêm → Cài đặt. Không thêm nút trên mọi header.
- B thay thế: thêm nút có tên “Chọn giao diện” trên header, mở cùng nhóm lựa chọn;
  Cài đặt vẫn là nơi chính. Mọi control dùng chung một nguồn preference.
- Ba radio thật, `fieldset`/`legend` “Chế độ giao diện”: **Sáng**, **Tối**, **Theo thiết bị**.
  Ban đầu Theo thiết bị khi chưa có lựa chọn hợp lệ. Một lựa chọn luôn selected.
- Cả nhãn cao ít nhất44px trên mobile; Tab vào nhóm, mũi tên đổi lựa chọn, Space chọn;
  focus-visible rõ theo accessibility của app, selected có ô radio/chữ, không chỉ màu.
- Có dòng “Đang theo thiết bị · Sáng/Tối” hoặc “Đang dùng giao diện Sáng/Tối”. Đổi có hiệu lực
  ngay, không thêm nút Lưu, không reload hoặc mất draft/scroll/focus của nghiệp vụ.

## Persistence và nguồn hiệu lực

Đề xuất cookie cùng hostname `qlv_theme=light|dark|system`, Path=/, SameSite=Lax, Max-Age1năm,
Secure khi HTTPS. Đây là tùy chọn giao diện, không phải credential hoặc profile/database.
Chỉ nhận ba giá trị; thiếu/sai/truy cập storage bị chặn thì mặc định system và app vẫn mở được.

Server đọc cookie qua cơ chế cookies đã tồn tại, gắn thuộc tính theme vào html từ response đầu.
Không thêm library hoặc inline script buộc nới CSP của sản phẩm. Script static của prototype không phải hướng triển khai runtime. Token CSS và Tailwind `dark:` phải cùng dùng
một contract theme, tránh token theo manual nhưng utilities lại theo OS.

| Preference | Thiết bị Sáng | Thiết bị Tối | Khi thiết bị đổi |
| --- | --- | --- | --- |
| light | Sáng | Sáng | Giữ Sáng |
| dark | Tối | Tối | Giữ Tối |
| system | Sáng | Tối | Cập nhật ngay |

CSS system phản ứng `prefers-color-scheme` từ lần vẽ đầu; client `matchMedia` cập nhật mô tả
effective theme. Listener chỉ theo system và cleanup khi unmount. Manual không bị OS ghi đè.
Giữ preference qua route, reload, đóng/mở browser; hostname Preview/Production lưu riêng.
Tab khác đọc lại preference khi reload; đồng bộ trực tiếp nhiều tab chưa nằm trong phạm vi này.

## No-flash và control gốc

- Thuộc tính manual có trong HTML SSR trước first paint; system dùng CSS media trước hydration.
  Không render Light mặc định rồi đợi useEffect chuyển Dark.
- Loading mở app, trang đăng nhập, drawer, error/offline, navigation và nền ngoài content dùng
  cùng semantic tokens. Không làm thay đổi Auth, startup privacy hoặc các guard hiện hữu.
- `color-scheme` trên html và `theme-color` phải phản ánh effective theme, kể cả manual trái OS;
  native select/date/scrollbar/autofill không bị lệch sang theme khác.
- Toàn bộ utility dark hiện có phải tuân manual/system. Không chỉ sửa root background.
- Không có hydration warning/CSP violation; JS tắt vẫn có theme hợp lệ từ SSR/CSS.

## Kiểm thử dự kiến

Local synthetic ở375/390/768/1024/1440, Light/Dark/system, OS đối nghịch và đổi trong phiên.
Kiểm cookie hợp lệ/sai/bị chặn, cold SSR trước hydration, reload/route/back/forward, dirty form,
startup/login/loading/drawer/error, radio keyboard/name/checked/focus và target44px.
Không coi headless emulator là VoiceOver hoặc chứng nhận thiết bị vật lý. Không request push,
không đổi account/secret và không ghi preference vào Supabase.

Prototype C83 chỉ minh họa layout và đổi màu trong bản mẫu. Không lưu cookie này hoặc triển khai
persistence/no-flash của sản phẩm; C84 phải chứng minh bằng regression trước khi hoàn tất.
