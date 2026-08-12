# Design system — Quản Lý Vay Cá Nhân

## 1. Định hướng

Giao diện dùng phong cách **contemporary fintech workspace**: cool-white, sắc nét, phẳng và ưu tiên
khả năng đọc số liệu. Không dùng sắc kem/vàng đồng kiểu ngân hàng truyền thống, gradient trang trí,
glassmorphism, emoji hệ thống hoặc hiệu ứng làm lu mờ dữ liệu.

## 2. Token nền tảng

- Canvas sáng `#f6f7fb`; surface chính trắng; dark canvas `#090d18`.
- Cobalt/indigo `#4f46e5` là màu thương hiệu và hành động chính; cyan chỉ dùng làm accent. Xanh lá,
  amber và đỏ dành cho trạng thái có nghĩa.
- Hướng khoản vay dùng semantic token riêng: cho vay xanh lá, đi vay đỏ; icon luôn đi cùng nhãn chữ
  để màu không là dấu hiệu phân biệt duy nhất.
- Radius: `8 / 12 / 16 px`; elevation thấp, card thường chỉ dùng border và `shadow-xs`.
- Motion: `150 ms` cho state nhỏ, `220 ms` cho component; sheet mở `260 ms`, đóng `180 ms`.
- Z-index: nội dung `0`, sticky header `20`, bottom navigation `30`, menu `40`, progress/skip `100`.

Token semantic được khai báo trong `apps/web/src/app/globals.css`; component không tự chọn màu trạng
thái khi đã có token tương ứng.

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
- Logo ứng dụng dùng biểu tượng banking hình học trên nền navy: mái ngân hàng, thẻ tín dụng và
  dòng tiền đi lên; không dùng chân dung, chữ, crypto, huy hiệu hoặc chi tiết nhỏ.
- Không dùng emoji hoặc raster icon cho navigation, action, trạng thái hay tiêu đề module.

## 6. Accessibility và responsive

- Breakpoint QA: `375 / 768 / 1024 / 1440 px` và mobile landscape.
- Không cuộn ngang toàn trang; bảng/biểu đồ rộng phải có vùng cuộn riêng và bảng dữ liệu thay thế.
- Tất cả thao tác có focus visible, nhãn accessible, keyboard path và touch target tối thiểu 44 px.
- Light/dark được kiểm tra độc lập; trạng thái không truyền đạt chỉ bằng màu.
- `prefers-reduced-motion` tắt gần như toàn bộ animation/transition không thiết yếu.
