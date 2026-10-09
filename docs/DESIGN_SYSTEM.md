# Design system — Quản Lý Vay Cá Nhân

## 1. Định hướng

Giao diện dùng phong cách **contemporary fintech workspace**: cool-white, sắc nét, phẳng và ưu tiên
khả năng đọc số liệu. Không dùng sắc kem/vàng đồng kiểu ngân hàng truyền thống, gradient trang trí,
glassmorphism, emoji hệ thống hoặc hiệu ứng làm lu mờ dữ liệu.

## 2. Token nền tảng

- Canvas sáng `#eaf0f8`; surface chính trắng; dark canvas `#0b1220`, dark surface `#172235`.
- C87 phương án B OWNER đã duyệt: sidebar navy `#152c4c`, chữ/sidebar hint sáng; một KPI đầu
  nền cobalt `#1d4ed8`. Các màu trạng thái cho vay/đi vay/cảnh báo vẫn có nghĩa.
- Cobalt blue `#1d4ed8` là màu thương hiệu và hành động chính, đồng bộ biểu tượng vô cực; cyan chỉ dùng làm accent. Xanh lá,
  amber và đỏ dành cho trạng thái có nghĩa.
- Chữ phụ sáng dùng `#52647c`, accent sáng dùng `#0369a1`; placeholder dùng token chữ phụ với opacity 1.
- Hướng khoản vay dùng semantic token riêng: cho vay xanh lá, đi vay đỏ; icon luôn đi cùng nhãn chữ
  để màu không là dấu hiệu phân biệt duy nhất.
- Radius: `8 / 12 / 16 px`; elevation dùng thang `shadow-xs / shadow-card / shadow-floating`.
- Motion: `150 ms` cho state nhỏ, `220 ms` cho component, `320 ms` cho chuyển cảnh lớn; sheet mở
  `260 ms`, đóng `180 ms`, ưu tiên transform/opacity và luôn tôn trọng reduced-motion.
- Z-index semantic: nội dung `0`, sticky header `20`, bottom navigation `30`, popover `40`, dialog
  `60`, toast `80`, progress/skip `100`.

C93: palette gốc, semantic roles và component aliases nằm ở `apps/web/src/styles/tokens.css`;
`apps/web/src/app/globals.css` là entrypoint import có thứ tự. Primitive dùng chung nằm ở
`apps/web/src/components/ui/` và `styles/ui-primitives.css`. Foundation/workflows/notifications/
dashboard/presentation-overrides tách theo các đoạn liên tiếp của cascade cũ; không thêm cascade layer.
Playground vẫn tách riêng. Thứ tự import giữ override B/C90 sau các rule nền.

## 3. Typography

- Font giao diện và heading: **Inter**, trung tính, hiện đại và có glyph tiếng Việt đầy đủ.
- Font mono: Geist Mono, chỉ dùng cho nội dung kỹ thuật khi cần.
- Body mobile tối thiểu `16 px`, line-height `1.6`.
- Helper/metadata cần đọc `14 px`, nội dung chính `16 px`; navigation mobile tối thiểu `12 px`.
- KPI `18 px` mobile và `24 px` desktop, weight `600`; nhãn `14 px`. `VndText` chỉ tách glyph
  đơn vị của chuỗi đã format, giữ nguyên mọi ký tự, không parse/round/settle tiền. Giá trị dài
  dùng thêm chiều ngang; khi che tiền không render `vnd-number` hay flag độ dài.
- Số tiền dùng `font-variant-numeric: tabular-nums`, giữ đầy đủ ký tự; KPI và value khoản vay
  dành thêm chiều ngang khi số quá dài để giữ nguyên dòng. Label/tên được wrap thay vì cắt nghĩa.
- Riêng dòng đối tác/chi phí, số tiền giữ một dòng; tên, danh mục và ghi chú dùng `min-width: 0` và
  `overflow-wrap: anywhere` để nhận đủ dữ liệu hợp lệ, kể cả chuỗi dài không có khoảng trắng.

## 4. Component primitive

- Input/select/textarea: rộng tối đa theo container, `min-width: 0`, cao tối thiểu `48 px`, font
  `16 px`, border mạnh hơn nền và focus ring 4 px.
- Button/link phụ: chữ `14 px`, weight `500–600`, cao tối thiểu `44 px`; control form vẫn theo
  chiều cao input. Nút xem toàn bộ công việc nằm trong header, chữ ngắn “Xem tất cả”/“Thu gọn”,
  accessible name giữ ngữ cảnh và count. Hover không nhấc control lên; focus-visible được giữ.
- Card: surface/viền phân vùng rõ, radius vừa, không shadow trong nội dung. Một KPI nhấn cobalt
  là ngoại lệ có chủ ý theo B; không tô lại các trạng thái có nghĩa.
- Modal/sheet: backdrop blur chỉ biểu thị nền bị vô hiệu hóa; đóng nhanh hơn mở.
- `BottomSheet`: dùng native `<dialog>`, đóng bằng nút, Escape, backdrop hoặc kéo tay nắm xuống trên
  mobile; mọi thao tác quan trọng vẫn có nút hiển thị, không phụ thuộc cử chỉ.
- Toast: tự đóng sau khoảng 4 giây, không lấy focus; thành công dùng `aria-live="polite"`, lỗi dùng
  thông báo assertive và nội dung inline vẫn được giữ để người dùng có thể đọc lại.
- Tabs: segmented surface có active state bằng nền, chữ và elevation; liên kết vẫn giữ deep-link.
- Mọi disclosure `<details>` dùng dấu `+` khi đóng và `−` khi mở, nằm giữa theo trục dọc của nhãn;
  không dùng chevron hoặc marker tam giác mặc định.
- Ngoại lệ: menu “Thao tác khác” của đối tác dùng Lucide `MoreHorizontal` trong vùng chạm 44 px.
  Menu giữ xác nhận xóa, đóng bằng Escape/click ngoài và trả focus về nút mở khi nhấn Escape.
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
- Cài đặt có ba native radio: Sáng, Tối, Theo thiết bị, cho mọi vai trò. Cookie `qlv_theme` chỉ có
  ba lựa chọn, riêng từng hostname; SSR quyết định `data-theme` và meta `theme-color`. CSS/native
  controls theo cùng lựa chọn ngay từ lần vẽ đầu, không dùng script khởi tạo inline hoặc reload.
  Dialog/date dùng token `--native-color-scheme`; không dùng literal inherit vì CSS Production
  optimizer thực tế biến nó thành normal.
  Metadata khôi phục từ lịch sử SPA được đồng bộ lại theo preference hiện hành; observer được
  cleanup và chỉ ghi khi giá trị khác. Chỉ “Theo thiết bị” theo dõi thay đổi OS. Nếu không lưu được cookie, trả về Theo thiết bị và báo lỗi.
- Đối tác/chi phí dùng card ở mobile, khung danh sách chia dòng ở desktop từ 1024 px; form mở chiếm
  toàn bộ chiều rộng. Phân trang chuẩn hóa theo tổng bản ghi sau lọc, giữ bộ lọc trên URL. Chi phí nhiều trang có
  nav gần đầu với label riêng, giữ footer/pageSize25/count/canonical/BackForward.
- `prefers-reduced-motion` tắt gần như toàn bộ animation/transition không thiết yếu.

## Primitive và quyền riêng tư

- Primary/danger có `--on-primary`/`--on-danger` theo theme; không mặc định chữ trắng trên nền sáng ở dark mode.
- `PrivacyAmount` che tiền; `PrivacyRegion` che nguyên khối text tự do; `PrivacyForm` yêu cầu chủ động hiện tiền trước khi ghi nghiệp vụ.
- Privacy dùng cookie đọc ở SSR. Khi chưa có lựa chọn cookie (kể cả nâng cấp từ localStorage cũ), mặc định che; không chớp tiền trước hydration.
- `BusinessForm` giữ giá trị khi lỗi, liên kết lỗi với input, focus lỗi đầu và cảnh báo rời trang chưa lưu. Bản nháp chỉ trong bộ nhớ.
- Khi đang lưu, đóng form/rời route bị chặn với thông báo chờ; khi lỗi giữ bản nháp để thử lại.
  Quản lý tài khoản đóng form sau xác nhận thành công, trả focus và giữ thông báo thành công ngoài
  form. Form mật khẩu lồng nhau có xác nhận bỏ bản nháp; không lưu mật khẩu vào storage.
- Phân bổ chi phí thu gọn mặc định. Khi che tiền, không render tỷ trọng/thanh phân bổ hoặc chi tiết
  accessibility suy ra số liệu. Khi hiện, tỷ trọng được tính bằng số nguyên và làm tròn 0,01 điểm
  phần trăm để trình bày; không thay đổi số tiền authoritative hay ép tổng tỷ trọng thành 100%.
- Tài khoản cá nhân nằm trong menu “Thêm” mobile cho mọi vai trò; menu đóng bằng Escape, click ngoài hoặc chọn route.

## Primitives và luồng nhanh

- `Button`, `Input`, `VndInput`, `Badge`, `Card`, `BottomSheet`, `Toast` và `Tabs` là primitives
  chuẩn. Trang Dashboard, khoản vay, đối tác, chi phí và cài đặt dùng trực tiếp các primitive này.
- Thẻ khoản vay đang hoạt động có hành động nhanh “Ghi giao dịch”; liên kết vẫn là URL deep-link,
  mở đúng workspace và bottom sheet, không bỏ qua quyền ghi hay validation Server Action.
- Menu “Thêm” mobile dùng bottom sheet native-feel; bottom navigation vẫn giới hạn năm điểm chạm và
  giữ nhãn chữ cùng icon.

## C87 — Trạng thái tải

- Startup có logo, tên ứng dụng và thanh indeterminate trên canvas đúng theme; không hiện dữ
  liệu trước khi Auth/profile resolve, không giả % hoặc delay.
- Route loading có skeleton phân vùng và nhãn nhìn thấy; SPA có thông báo không nhận focus,
  không chặn click và bám transition/cancel thật. Reduced-motion giữ dấu tĩnh.
- TTFB/first-feedback phải đo riêng; không tuyên bố UI có thể vẽ trước HTML hoặc mọi cold
  PWA/network đã được kiểm. Local Auth-delay không thay chứng nhận thiết bị/mạng thật.

## C93 — Refactor giữ hình, không áp thiết kế A sớm

`EmptyState` chỉ giữ wrapper section/div/class và truyền props/children; từng consumer giữ thông điệp
chưa có dữ liệu/search không có kết quả/chưa đọc rỗng/lỗi, role và hành động của nó.
`ResponsiveTable` chỉ trích div.table-scroll cho hai bảng Dashboard; không đổi thành thẻ, thêm sticky,
role/focus hoặc nhân đôi dữ liệu. Badge/Card/Button/Input giữ hợp đồng hiện hành và có alias màu
component trong tokens.css. Không tạo component preview/style variant mới không có consumer.

Tài liệu typography là hướng đích: expense percentage11.2px/managed-user status11.52px vẫn là backlog
C94 trong C93. Nhóm Quick Amount50triệu thuộc C95; hình drawer/taskdesktop A thuộc C94/C96.
Manifest/theme metadata và accent tùy chỉnh Playground dùng literal vì hoạt động trước stylesheet
hoặc là input thiết kế; logo/SVG là tài sản màu cố định. Không đổi những ngoại lệ này khi refactor.
Bằng chứng và giới hạn nghiệm thu ở docs/refactor-c93/.
