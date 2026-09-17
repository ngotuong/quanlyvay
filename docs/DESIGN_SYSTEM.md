# Design system — Quản Lý Vay Cá Nhân

## 1. Định hướng

Giao diện dùng phong cách **contemporary fintech workspace**: cool-white, sắc nét, phẳng và ưu tiên
khả năng đọc số liệu. Không dùng sắc kem/vàng đồng kiểu ngân hàng truyền thống, gradient trang trí,
glassmorphism, emoji hệ thống hoặc hiệu ứng làm lu mờ dữ liệu.

## 2. Token nền tảng

- Canvas sáng `#f6f7fb`; surface chính trắng; dark canvas `#090d18`.
- Cobalt blue `#1d4ed8` là màu thương hiệu và hành động chính, đồng bộ biểu tượng vô cực; cyan chỉ dùng làm accent. Xanh lá,
  amber và đỏ dành cho trạng thái có nghĩa.
- Hướng khoản vay dùng semantic token riêng: cho vay xanh lá, đi vay đỏ; icon luôn đi cùng nhãn chữ
  để màu không là dấu hiệu phân biệt duy nhất.
- Radius: `8 / 12 / 16 px`; elevation dùng thang `shadow-xs / shadow-card / shadow-floating`.
- Motion: `150 ms` cho state nhỏ, `220 ms` cho component, `320 ms` cho chuyển cảnh lớn; sheet mở
  `260 ms`, đóng `180 ms`, ưu tiên transform/opacity và luôn tôn trọng reduced-motion.
- Z-index semantic: nội dung `0`, sticky header `20`, bottom navigation `30`, popover `40`, dialog
  `60`, toast `80`, progress/skip `100`.

Token semantic được khai báo trong `apps/web/src/app/globals.css`; primitive dùng chung nằm ở
`apps/web/src/components/ui/` và CSS tương ứng ở `apps/web/src/styles/ui-primitives.css`. CSS riêng
cho playground đã tách sang `apps/web/src/styles/playground.css` để stylesheet toàn cục dễ kiểm soát.

## 3. Typography

- Font giao diện và heading: **Inter**, trung tính, hiện đại và có glyph tiếng Việt đầy đủ.
- Font mono: Geist Mono, chỉ dùng cho nội dung kỹ thuật khi cần.
- Body mobile tối thiểu `16 px`, line-height `1.6`.
- Helper/metadata thông thường tối thiểu `13 px`; nội dung phụ cần đọc thường xuyên tối thiểu `14 px`.
- Số tiền dùng `font-variant-numeric: tabular-nums` và cho phép xuống dòng thay vì tràn khung.

## 4. Component primitive

- Input/select/textarea: rộng tối đa theo container, `min-width: 0`, cao tối thiểu `48 px`, font
  `16 px`, border mạnh hơn nền và focus ring 4 px.
- Button/link hành động: cao tối thiểu `46–48 px`; chỉ một CTA primary trên mỗi màn hình.
- Card: surface trắng phẳng, border semantic, radius vừa và `shadow-xs`; không dùng gradient để trang trí.
- Modal/sheet: backdrop blur chỉ biểu thị nền bị vô hiệu hóa; đóng nhanh hơn mở.
- `BottomSheet`: dùng native `<dialog>`, đóng bằng nút, Escape, backdrop hoặc kéo tay nắm xuống trên
  mobile; mọi thao tác quan trọng vẫn có nút hiển thị, không phụ thuộc cử chỉ.
- Toast: tự đóng sau khoảng 4 giây, không lấy focus; thành công dùng `aria-live="polite"`, lỗi dùng
  thông báo assertive và nội dung inline vẫn được giữ để người dùng có thể đọc lại.
- Tabs: segmented surface có active state bằng nền, chữ và elevation; liên kết vẫn giữ deep-link.
- Mọi disclosure `<details>` dùng dấu `+` khi đóng và `−` khi mở, nằm giữa theo trục dọc của nhãn;
  không dùng chevron hoặc marker tam giác mặc định.
- Filter mobile: giữ hai field trên một hàng khi phù hợp, mọi grid track dùng `minmax(0, 1fr)`; date,
  select và input không được có intrinsic width làm tràn card.

## 5. Icon

- Lucide SVG là icon hệ thống; stroke chuẩn `1.8`, cỡ nội dung `18–24 px` trong vùng chạm tối thiểu
  `44 px`. Navigation dùng nhóm glyph hình học: grid, arrow-left-right, contact, bell-dot, wallet,
  scroll và sliders.
- Khoản cho vay dùng `HandCoins`; khoản đi vay dùng `Landmark`. Mobile header hiển thị icon và tên
  route/module hiện tại; heading lặp ngay đầu nội dung bị ẩn ở mobile, còn tên sản phẩm và heading
  nội dung desktop được giữ trong sidebar/main content.
- Logo ứng dụng dùng biểu tượng vô cực cyan–cobalt của `Ngô Tường Financial Workspace`; favicon nhỏ
  chỉ dùng biểu tượng không chữ trên nền trắng bo góc.
- Không dùng emoji hoặc raster icon cho navigation, action, trạng thái hay tiêu đề module.

## 6. Accessibility và responsive

- Breakpoint QA: `375 / 768 / 1024 / 1440 px` và mobile landscape.
- Không cuộn ngang toàn trang; bảng/biểu đồ rộng phải có vùng cuộn riêng và bảng dữ liệu thay thế.
- Tất cả thao tác có focus visible, nhãn accessible, keyboard path và touch target tối thiểu 44 px.
- Light/dark được kiểm tra độc lập; trạng thái không truyền đạt chỉ bằng màu.
- `prefers-reduced-motion` tắt gần như toàn bộ animation/transition không thiết yếu.

## Primitive và quyền riêng tư

- Primary/danger có `--on-primary`/`--on-danger` theo theme; không mặc định chữ trắng trên nền sáng ở dark mode.
- `PrivacyAmount` che tiền; `PrivacyRegion` che nguyên khối text tự do; `PrivacyForm` yêu cầu chủ động hiện tiền trước khi ghi nghiệp vụ.
- Privacy dùng cookie đọc ở SSR. Khi chưa có lựa chọn cookie (kể cả nâng cấp từ localStorage cũ), mặc định che; không chớp tiền trước hydration.
- `BusinessForm` giữ giá trị khi lỗi, liên kết lỗi với input, focus lỗi đầu và cảnh báo rời trang chưa lưu. Bản nháp chỉ trong bộ nhớ.
- Tài khoản cá nhân nằm trong menu “Thêm” mobile cho mọi vai trò; menu đóng bằng Escape, click ngoài hoặc chọn route.

## Primitives và luồng nhanh

- `Button`, `Input`, `VndInput`, `Badge`, `Card`, `BottomSheet`, `Toast` và `Tabs` là primitives
  chuẩn. Trang Dashboard, khoản vay, đối tác, chi phí và cài đặt dùng trực tiếp các primitive này.
- Thẻ khoản vay đang hoạt động có hành động nhanh “Ghi giao dịch”; liên kết vẫn là URL deep-link,
  mở đúng workspace và bottom sheet, không bỏ qua quyền ghi hay validation Server Action.
- Menu “Thêm” mobile dùng bottom sheet native-feel; bottom navigation vẫn giới hạn năm điểm chạm và
  giữ nhãn chữ cùng icon.
