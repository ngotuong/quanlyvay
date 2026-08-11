# Kế hoạch cải tổ UI/UX trong C16

## 1. Mục tiêu

Đưa webapp từ giao diện quản trị thiên về chức năng thành một không gian tài chính hiện đại, gọn,
dễ quét và phản hồi tức thời, nhưng không thay đổi quy tắc tính lãi hoặc tính toàn vẹn ledger.

Nguyên tắc thiết kế đã khóa:

- Phong cách `modern financial workspace`: trung tính, chắc chắn, data-dense nhưng dễ đọc.
- Inter hỗ trợ đầy đủ tiếng Việt; Lucide SVG là icon hệ thống, còn chân dung minh họa tối giản là
  nhận diện thương hiệu và app icon.
- Một màu thương hiệu chính; xanh lá/vàng/đỏ chỉ biểu diễn trạng thái có ý nghĩa.
- Mobile-first tại 375 px; tablet 768 px; desktop 1024/1440 px.
- Tương tác có phản hồi trong 100 ms; chuyển động 150–250 ms và hỗ trợ reduced motion.
- Touch target tối thiểu 44 px; chữ phụ mobile tối thiểu 14 px.
- Server Components và Server Actions tiếp tục là mặc định; Supabase vẫn authoritative.

## 2. Baseline và tiêu chí chung

Baseline audit:

- Danh sách khoản vay gọi hai RPC cho từng khoản rồi mới lọc phía web.
- Mỗi lần đổi tab chi tiết tải lại toàn bộ workspace khoảng mười nguồn dữ liệu.
- App shell không được giữ cố định giữa các module; loading thay toàn màn hình.
- Bottom navigation OWNER có bảy mục.
- Filter, form và card xuất hiện quá dày; phản hồi thành công/lỗi chưa thống nhất.
- Biểu đồ CSS thiếu trục/tooltip cảm ứng và làm Dashboard dài.

Acceptance chung:

- Không còn truy vấn N+1 khi mở danh sách khoản vay.
- Chuyển module giữ nguyên khung ứng dụng; chỉ vùng nội dung tải lại.
- Mọi internal navigation có pressed/pending feedback nhất quán.
- Bottom navigation tối đa năm mục; chức năng phụ nằm trong `Thêm`.
- Quay lại danh sách giữ bộ lọc và hướng điều hướng.
- Không tràn ngang ở 375 px; keyboard/focus/reduced-motion đạt.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` và các gate C16 liên quan đạt.
- Không migration/deploy/push hoặc sửa dữ liệu Production nếu chưa có xác nhận riêng.

## 3. Giai đoạn 1 — Nền tảng mượt

Trạng thái: `COMPLETED` và đã rollout Production ngày 05/08/2026.

### Phạm vi

1. Tạo layout xác thực cố định chứa sidebar, mobile header và bottom navigation.
2. Dùng loading boundary theo vùng nội dung, không dựng lại fake sidebar.
3. Mở rộng pending feedback cho mọi liên kết nội bộ.
4. Rút bottom navigation còn bốn module chính và mục `Thêm`.
5. Thay N+1 danh sách bằng RPC summary một lần; lọc/sắp xếp tại database.
6. Tách tải dữ liệu chi tiết theo nhu cầu từng tab; không tải danh sách đối tác ngoài tab thông tin.
7. Hợp nhất hoặc tránh tính trùng các số liệu Dashboard.

### Acceptance

- Số round trip danh sách không tăng theo số khoản vay.
- Đổi tab không tải dữ liệu không dùng tới.
- Khung điều hướng không nhấp nháy khi chuyển module.
- Bấm liên kết có trạng thái phản hồi trong frame đầu tiên.

## 4. Giai đoạn 2 — Luồng Khoản vay

Trạng thái: `COMPLETED` và đã rollout Production ngày 05/08/2026; vòng tinh chỉnh sau kiểm tra thật
đã chuẩn hóa filter hai cột mobile, tab một hàng trượt ngang, motion modal/bottom sheet hai chiều,
chevron disclosure và tiêu đề khoản vay tự sinh không lặp thông tin.

### Phạm vi

- Thanh tìm kiếm và chip chính luôn nhìn thấy; bộ lọc nâng cao nằm trong disclosure/drawer.
- Desktop dùng bảng/list compact; mobile dùng row card gọn.
- Giữ `returnTo`, query filter và vị trí cuộn khi mở/đóng chi tiết.
- Overview chi tiết chỉ giữ KPI, kỳ tiếp theo và CTA `Ghi giao dịch`.
- Form giao dịch mở theo drawer/bottom sheet; các thao tác điều chỉnh/nguy hiểm được tách nhóm.
- Tab mobile nằm trên một hàng, cho trượt ngang và để lộ một phần tab kế tiếp làm dấu hiệu tương tác.
- Nhãn theo đúng chiều: `Nhắc thu lãi` hoặc `Nhắc trả lãi`.

### Acceptance

- Có thể tìm khoản, mở chi tiết, ghi lãi và quay lại mà không mất ngữ cảnh.
- Một màn hình chỉ có một CTA chính.
- Tất toán/đảo/sửa có xác nhận rõ và không lẫn với thao tác thường xuyên.

## 5. Giai đoạn 3 — Dashboard và biểu đồ

Trạng thái: `COMPLETED` và đã rollout Production ngày 06/08/2026. Dashboard dùng một bundle RPC
cho kỳ hiện tại, analytics và kỳ liền trước; first fold giữ bốn KPI, xu hướng dòng tiền và danh sách
cần xử lý. Phần vốn/rủi ro/cơ cấu được đưa vào phân tích mở rộng; biểu đồ có trục, cột focus/touch,
tooltip, nhãn số và bảng dữ liệu.

### Phạm vi

- First fold gồm bốn KPI, một xu hướng chính và danh sách cần xử lý.
- Bộ lọc thời gian compact; khoảng tùy chỉnh mở theo popover/sheet.
- Vốn, nợ xấu và phân tích tập trung nằm dưới phần phân tích mở rộng.
- Biểu đồ có trục, legend, tooltip cảm ứng và bảng dữ liệu accessible.
- Bổ sung so sánh kỳ trước khi contract dữ liệu đủ rõ.

### Acceptance

- Người dùng nắm được tình hình và việc cần làm trong first fold.
- Biểu đồ đọc được trên touch và không phụ thuộc hover hoặc màu đơn thuần.
- Dashboard không tạo calculation trùng lặp.

## 6. Giai đoạn 4 — Design system và module phụ

Trạng thái: `COMPLETED` và đã rollout Production ngày 06/08/2026. Sau phản hồi kiểm tra thật, design
system được tinh chỉnh từ kem/navy/bronze sang cool-white/cobalt/cyan, bỏ gradient trang trí và giảm
elevation; logo dùng chân dung minh họa tối giản dựa trên nhận diện Ngô Tường Banking, còn navigation/module
dùng bộ Lucide hình học đồng nhất. Font Inter 16 px và primitive form 48 px giữ nguyên. Bộ lọc mobile đã được ràng buộc theo
container, không còn tràn ngang ở 375 px; quy ước đầy đủ được ghi tại `docs/DESIGN_SYSTEM.md`.
Responsive QA đạt 375/768/1024/1440 px và mobile landscape.

### Phạm vi

- Chuẩn hóa token màu, spacing 4/8, typography, radius, elevation, motion và z-index.
- Loại các class global bị khai báo trùng; tạo primitive dùng chung cho button/input/card/table.
- Toast accessible, inline error, focus lỗi đầu tiên và modal xác nhận thống nhất.
- Áp dụng cùng ngôn ngữ cho Đối tác, Chi phí, Thông báo, Nhật ký hệ thống và Cài đặt.
- Kiểm tra light/dark, bàn phím, contrast, Dynamic Type và reduced motion.

### Acceptance

- Không còn hardcode phong cách theo từng màn hình cho component dùng chung.
- Trạng thái hover/pressed/focus/loading/success/error/disabled đồng nhất.
- Visual QA đạt tại 375/768/1024/1440 px và mobile landscape.

## 7. Gate rollout

Sau khi cả bốn giai đoạn local đạt gate:

1. Đo lại số RPC, TTFB và thời gian chuyển trang/tab.
2. Chạy full gate C16 và `git diff --check`.
3. Ghi kết quả vào `PROJECT_CONTEXT.md` và roadmap.
4. Theo phê duyệt ngày 05/08/2026, sau khi từng giai đoạn đạt gate, áp migration Supabase Production
   (nếu có) rồi deploy Vercel Production để người dùng kiểm tra; không cần xin lại cho hai thao tác
   này trong phạm vi bốn giai đoạn. Mọi sửa dữ liệu tài chính, secret hoặc tài nguyên khác vẫn cần
   xác nhận riêng.
