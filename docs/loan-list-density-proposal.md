# Đề xuất — Làm gọn danh sách Khoản vay trên mobile

Trạng thái: `COMPLETED` local trong C101 ngày 16/10/2026; OWNER chỉ dẫn triển khai trước khi chốt
C100. Thay đổi chỉ thuộc presentation/interaction của route Khoản vay; không đổi query, dữ liệu
hoặc nghiệp vụ. Chưa deploy Preview/Production; phát hành được tách sang C102 chờ duyệt.

## Audit hiện trạng

- Stack: Next.js + Tailwind v4, Lucide; dự án có sẵn `Input`, `Select`, `Badge`, `Card` và token
  trong CSS. Giữ Inter, màu cobalt/semantic hiện tại, Light/Dark và privacy mode.
- Route và component chính: `apps/web/src/app/loans/page.tsx`,
  `components/business/loan-filters.tsx`, `components/business/loan-card-link.tsx`.
- CSS liên quan nằm trong `styles/workflows.css`, `styles/dashboard.css`,
  `styles/presentation-overrides.css`, `styles/ui-primitives.css` và skeleton tương ứng trong
  `styles/loading-motion.css`.
- Ảnh được xem là ảnh hiện trạng kèm chỉ dẫn bố cục của OWNER, không phải dữ liệu mẫu để sao chép.

## Bố cục chốt theo yêu cầu OWNER

### 1. Card khoản vay gọn hơn

- Đưa badge hướng vay và trạng thái vào cụm đầu card, sát tên đối tác. Trên màn đủ rộng, tên và
  hai badge cùng một hàng; ở 375 px hoặc tên dài, badge được xuống ngay dòng kế trong cùng cụm,
  không trôi xuống dưới dòng “Gốc ban đầu”.
- Giữ icon hướng vay, tên, gốc ban đầu, ba mốc nghiệp vụ, ba số tiền và hành động “Ghi giao dịch”.
  Không bỏ dữ liệu hoặc đổi ý nghĩa.
- Giảm khoảng trắng dọc: metadata nghiệp vụ chuyển thành lưới ba cột gọn; khối số tiền giảm
  padding nhưng vẫn cho số VND dài xuống hàng theo quy tắc hiện có; nút ghi giao dịch giữ vùng bấm
  tối thiểu 44 px.
- Card điển hình ở mobile phải thấp hơn baseline ít nhất 20%, không dùng chiều cao cố định và không
  cắt tên dài, ngày, lãi suất hoặc số tiền.

### 2. Bỏ hàng chip bộ lọc đang áp dụng

- Xóa toàn bộ vùng `active-filter-pills` như “Đang hoạt động ×”. Đây là thông tin lặp với select
  nhanh; lọc nâng cao đã có trạng thái “Nâng cao · đang dùng”.
- Giữ số kết quả và nút “Xóa lọc” để xóa toàn bộ điều kiện trong một lần.
- Trạng thái rỗng do lọc vẫn giữ lối “Xóa bộ lọc”.

### 3. Nút × trong ô tìm kiếm

- Thêm nút × ở cuối ô, chỉ xuất hiện khi có từ khóa. Bấm sẽ xóa riêng từ khóa, cập nhật kết quả
  ngay và trả focus về ô để người dùng gõ lại.
- Giữ `type="search"`, tắt nút cancel mặc định của trình duyệt để Safari/Chrome không vẽ hai nút
  khác kiểu; chừa khoảng phải để chữ không chạy dưới nút.
- Nút có `aria-label="Xóa từ khóa tìm kiếm"`, icon xám và vùng bấm tối thiểu 32 px nằm trong
  control 44 px.

### 4. Bỏ tiền tố khỏi hai bộ lọc nhanh

- Direction hiển thị `Tất cả`, `Cho vay`, `Đi vay`; status hiển thị `Tất cả`, `Đang hoạt động`,
  `Nợ xấu`, `Quá hạn`, `Đã tất toán`.
- Nhãn `Hướng` và `Trạng thái` vẫn tồn tại dưới dạng `sr-only`/accessible name, nên thay đổi chỉ
  bỏ chữ lặp trên giao diện.
- Hai select giữ vị trí song song ở mobile và cùng chiều cao 44 px.

## Không thuộc phạm vi

- Không sửa nội dung hoặc bố cục bottom sheet “Bộ lọc nâng cao”.
- Không đổi filter URL, debounce, mặc định `ACTIVE`, phân trang, query Supabase, card desktop,
  privacy, quyền ghi hoặc luồng ghi giao dịch.
- Không gộp với checkpoint loading visibility; hai thay đổi có acceptance và rollout riêng.

## Acceptance khi triển khai

1. Mobile 375/390/430 px, Light/Dark và privacy hiện/ẩn: không tràn ngang; tên dài 200 ký tự,
   VND dài, bốn trạng thái và hai hướng vay không che nhau.
2. Card điển hình giảm ít nhất 20% chiều cao so với baseline cùng dữ liệu; desktop từ 1024 px giữ
   layout dạng dòng hiện tại.
3. Badge nằm trong cụm đầu card trước “Gốc ban đầu” ở DOM và hình; tên ngắn cùng hàng, tên dài
   xuống hàng có kiểm soát.
4. Không còn `active-filter-pills`; lọc nhanh, nâng cao, phân trang, Back/Forward và “Xóa lọc”
   giữ đúng URL/state.
5. Nút × chỉ hiện khi có query, xóa riêng query, giữ các filter khác và trả focus về `loanSearch`.
6. Select không còn tiền tố nhìn thấy nhưng accessible name vẫn là `Hướng` và `Trạng thái`.
7. Skeleton Khoản vay khớp mật độ card mới. Lint, typecheck, unit, build và E2E liên quan đạt;
   test không phụ thuộc dữ liệu tài chính thật.

## Kết quả triển khai local

- Card mobile cùng fixture giảm từ baseline `393,90625 px` xuống ngưỡng kiểm chứng
  `≤315 px` (giảm ít nhất 20%); không tràn ngang hoặc
  cắt số VND ở 375/390/430 px. Badge cùng đỉnh với tên; tên dài vẫn có disclosure “Xem đầy đủ”.
- Ba tóm tắt tiền dùng một hàng gọn ở mobile; số rộng/siêu rộng vẫn dùng quy tắc span an toàn.
  Nút “Ghi giao dịch” giữ vùng bấm 44 px và card desktop không đổi cấu trúc dạng dòng.
- Active filter pills đã bị loại bỏ. Nút × trong search xóa riêng query, giữ status/direction và
  trả focus. Hai select hiển thị nhãn ngắn, accessible name `Hướng`/`Trạng thái` giữ nguyên.
- `git diff --check`, lint, typecheck, unit 123 và build 19 route đạt. Full E2E đạt
  `87 PASS / 18 SKIP / 0 FAIL` trong 20,5 phút, retries 0; các skip là audit/capture theo cờ mặc định.
- Không chạy migration, không ghi dữ liệu remote, không thay account/secret và chưa deploy.
