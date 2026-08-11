# Kế hoạch triển khai UI/UX follow-up C16

Trạng thái: `COMPLETED`

Phê duyệt: người dùng phê duyệt triển khai toàn bộ kế hoạch ngày 10/08/2026. Mọi migration/deploy/
push remote vẫn giữ cổng xác nhận riêng theo `AGENTS.md`.

Nguồn: audit ảnh ngày 10/08/2026 tại `docs/audits/2026-08-10-frontend/AUDIT.md` và phản hồi trực
tiếp của người dùng về bốn KPI cùng card `Cần xử lý`.

## 1. Quyết định đã khóa

1. Dashboard tiếp tục giữ **đủ bốn KPI ở đầu trang**:
   - Cho vay đang hoạt động.
   - Dư nợ đi vay.
   - Lãi ròng thực thu.
   - Lãi ròng phát sinh.
2. Desktop hiển thị một hàng bốn KPI; mobile dùng lưới 2×2, không dùng carousel hoặc cuộn ngang.
3. Inter, Lucide, cool-white/cobalt, light/dark và token hiện tại được giữ nguyên; không thay font,
   thương hiệu hoặc phong cách tổng thể.
4. `Cần xử lý` phải là danh sách **có hành động còn tồn tại**, không phải danh sách lịch thuần túy.
5. Không thay quy tắc tính lãi, ledger append-only hoặc dữ liệu tài chính hiện hữu.

## 2. Chẩn đoán contract `Cần xử lý`

Logic hiện tại trong `get_management_dashboard` gộp:

- Mọi khoản có trạng thái `OVERDUE` — đây là quá hạn đáo hạn gốc.
- Mọi khoản `ACTIVE` có ngày nhắc lãi kế tiếp từ ngày chốt đến 30 ngày sau.

Nhánh `ACTIVE` chỉ kiểm tra ngày lịch; nó không yêu cầu số dư lãi dự kiến phải dương. Vì vậy khoản
đã đóng đủ hoặc ứng trước vẫn có thể xuất hiện, kể cả khi UI hiển thị `Lãi 0 ₫`. Ngoài ra UI dùng
chung nhãn `Đến hạn`, khiến hạn gốc, ngày nhắc lãi và ngày kết thúc kỳ lãi bị hiểu là một khái niệm.

Contract mới:

- `PRINCIPAL_OVERDUE`: khoản quá hạn đáo hạn gốc, luôn giữ trong card cho tới khi tất toán/hoàn tác
  làm trạng thái không còn quá hạn; nhãn rõ `Quá hạn gốc`.
- `INTEREST_DUE`: khoản đang hoạt động có ngày nhắc trong 30 ngày **và số dư lãi tại cuối kỳ tương
  ứng lớn hơn 0**.
- Đóng đủ hoặc ứng trước làm số dư lãi `<= 0`: không xuất hiện trong `INTEREST_DUE`.
- Đóng một phần: vẫn xuất hiện và chỉ hiển thị số tiền còn phải thu/trả.
- Đã đóng kỳ trước nhưng kỳ kế tiếp đang phát sinh số dư dương: được xuất hiện lại cho kỳ kế tiếp;
  đây là hành động mới, không phải nhắc lại kỳ đã đóng.
- `SETTLED` và `BAD_DEBT` không thuộc nhắc lãi thường xuyên; nợ xấu tiếp tục nằm ở vùng rủi ro riêng.
- Thứ tự: quá hạn gốc trước, sau đó ngày nhắc tăng dần, rồi số dư lãi giảm dần.

Payload mỗi item bổ sung `attentionType`, `reminderDate`, `periodEndDate` và số dư còn phải xử lý.
UI hiển thị đúng chiều `Cần thu lãi` hoặc `Cần trả lãi`, đồng thời phân biệt `Ngày nhắc` với `Kỳ chốt`.

## 3. Giai đoạn A — Sửa contract và card `Cần xử lý`

### Phạm vi

1. Tạo migration mới, không sửa migration đã rollout.
2. Sửa `get_management_dashboard`/bundle để trả danh sách actionable theo contract trên.
3. Chia card thành hai nhóm có tiêu đề khi cùng tồn tại:
   - `Quá hạn gốc`.
   - `Sắp thu/trả lãi`.
4. Bỏ vùng cuộn lồng. Hiện tối đa năm item theo ưu tiên và có liên kết `Xem tất cả khoản cần xử lý`
   khi vượt quá giới hạn.
5. Empty state đổi thành `Không có khoản quá hạn hoặc lãi cần thu/trả trong 30 ngày tới`.
6. Cập nhật type, tài liệu Dashboard và regression tests.

### Acceptance

- Khoản có số dư lãi 0 hoặc âm không xuất hiện trong nhắc lãi.
- Khoản đóng một phần xuất hiện với đúng số dư còn lại.
- Khoản ứng trước biến mất và chỉ xuất hiện lại khi một kỳ tương lai có số dư dương.
- Quá hạn gốc vẫn xuất hiện dù lãi đã đóng đủ, với nhãn không thể nhầm là hạn lãi.
- Offset ngày nhắc và ngày kết thúc kỳ được trả/hiển thị riêng.
- Count badge bằng đúng tổng item actionable.

## 4. Giai đoạn B — Dashboard giữ 4 KPI nhưng giảm nhiễu

### Phạm vi

1. Giữ bốn KPI là khối nội dung đầu tiên sau tiêu đề và bộ chọn kỳ compact.
2. Desktop 4 cột; tablet/mobile 2×2; số tiền dùng tabular figures và không xuống dòng giữa số/`₫`.
3. Giảm độ nổi của so sánh kỳ trước; chỉ màu hóa chiều tăng/giảm kèm icon và text, không dùng màu
   làm tín hiệu duy nhất.
4. Đặt `Cần xử lý` trước biểu đồ trong thứ tự đọc và trên mobile; desktop dùng tỷ lệ gần 40/60 nhưng
   không tạo vùng scroll riêng.
5. Biểu đồ và phân tích mở rộng giữ nguyên dữ liệu, giảm chrome/eyebrow và khoảng trống không có ích.
6. Skeleton có cùng kích thước nội dung cuối để tránh nhảy layout.

### Acceptance

- Người dùng thấy đủ bốn KPI mà không cần mở disclosure hoặc cuộn ngang.
- Item khẩn cấp đầu tiên nhìn thấy ngay sau KPI trên desktop và mobile.
- Không có nested scroll trong first fold; không CLS rõ khi đổi kỳ.
- Light/dark, keyboard, focus và reduced-motion đạt.

## 5. Giai đoạn C — Danh sách khoản vay gọn và quét nhanh

### Phạm vi

1. Thanh chính chỉ giữ tìm kiếm, hướng, trạng thái và nút lọc nâng cao.
2. Bỏ dãy shortcut trùng filter; chỉ hiển thị chip cho filter đang thực sự áp dụng và cho phép xóa.
3. Desktop row ưu tiên `Dư nợ`, `Hạn/lãi kế tiếp`; tổng lãi đã thu/trả chuyển vào chi tiết.
4. Tiền VND dùng `white-space: nowrap` và tabular figures; không tách `₫` sang dòng riêng.
5. Mobile card ưu tiên tên, đối tác, trạng thái, hành động kế tiếp; target tối thiểu 44 px.
6. Giữ nguyên URL filter, `returnTo`, sort và hành vi back.

### Acceptance

- Ở 1440 px nhìn thấy ít nhất năm dòng khoản vay sau header/filter trong một viewport chuẩn.
- Không lặp control hoặc số liệu; không wrap tiền tại 1024/1440 px.
- 375 px không tràn ngang; filter nâng cao dùng sheet/drawer và giữ trạng thái URL.

## 6. Giai đoạn D — Chi tiết, kỳ lãi và thiết lập

### Phạm vi

1. Overview dùng summary hero gồm dư nợ, lãi/hạn kế tiếp, trạng thái và CTA `Ghi giao dịch`.
2. Giữ bốn tab nghiệp vụ hiện tại nhưng thu về cụm compact, không kéo giãn mỗi tab hết chiều rộng.
3. Modal giao dịch thêm một dòng ngữ cảnh khoản vay/dư nợ/lãi còn lại, không thêm card.
4. Nếu có dưới ba kỳ lãi, thay chart 250 px bằng summary bar; từ ba kỳ trở lên mới hiện chart.
5. Tách settings thành ba nhóm rõ: `Thông tin khoản vay`, `Điều chỉnh`, `Kết thúc khoản vay`;
   nghiệp vụ rủi ro/destructive giữ confirmation và audit hiện có.
6. Giữ header khoản vay ổn định giữa các tab và skeleton đúng hình học để tăng liên tục thị giác.

### Acceptance

- Overview trả lời được trong một lượt nhìn: dư bao nhiêu, việc kế tiếp là gì, khi nào, bấm ở đâu.
- Dữ liệu ít không tạo chart trống lớn; ba số kỳ lãi không dính nhau.
- Người dùng không phải mở thử nhiều accordion để tìm đúng loại thao tác.
- Không thay đổi kết quả engine hoặc quyền ghi dữ liệu.

## 7. Giai đoạn E — Độ mượt, responsive và accessibility

1. Đo riêng server response, thời gian từ click tới nội dung mới và CLS; không dùng thời gian chờ
   browser automation làm kết luận duy nhất.
2. Giữ AppShell/nội dung cũ tới khi route mới sẵn sàng; pending feedback xuất hiện trong 100 ms.
3. QA 375/768/1024/1440 px và mobile landscape; không nested scroll hoặc nội dung bị bottom nav che.
4. Kiểm tra keyboard order, focus sau route/modal, contrast 4.5:1, zoom 200%, reduced motion và bảng
   thay thế cho chart.
5. Không thêm client component nếu Server Component/loading boundary hiện tại giải quyết được.

## 8. Test gate và rollout

Gate bắt buộc cho từng giai đoạn liên quan:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
supabase db lint --level warning
supabase test db
git diff --check
```

Regression database tối thiểu cho `Cần xử lý`: chưa đóng, đóng một phần, đóng đủ, ứng trước, kỳ kế
tiếp phát sinh lại, offset nhắc sớm, quá hạn gốc đã đóng lãi, `SETTLED`, `BAD_DEBT` và reversal.

Sau mỗi giai đoạn: chụp desktop/mobile, so sánh với audit baseline và ghi số đo. Migration Production,
Vercel deploy hoặc Apps Script push của vòng follow-up này vẫn cần người dùng xác nhận riêng; kế
hoạch này không tự mở quyền rollout từ bốn giai đoạn cũ.

## 9. Kết quả triển khai local

- Giai đoạn A–E đã hoàn tất ngày 10/08/2026; không thay engine, ledger hoặc quyền ghi dữ liệu.
- Migration 18 thêm contract actionable; 20 regression mới bao phủ đủ chưa đóng, một phần, đủ,
  ứng trước, kỳ kế tiếp, offset, quá hạn gốc, nợ xấu, tất toán và reversal.
- Dashboard giữ bốn KPI đầu; `Cần xử lý` đứng trước biểu đồ, tách hai nhóm và không cuộn lồng.
- Danh sách bỏ shortcut lặp, dùng chip filter đang áp dụng và filter nâng cao dạng dialog/bottom
  sheet; mỗi row ưu tiên dư nợ và hành động kế tiếp.
- Chi tiết có summary hero, modal có ngữ cảnh, summary bar cho dưới ba kỳ và ba nhóm thiết lập.
- Gate đạt: lint, typecheck, 32/32 unit/domain/Google Sync tests, build, Auth 6/6, E2E 8/8 tại năm
  viewport, DB lint và pgTAP 355/355; `git diff --check` sạch. E2E ghi riêng navigation response,
  click→content và CLS, đồng thời yêu cầu CLS dưới 0,1.
- Sau xác nhận riêng ngày 10/08/2026, đã áp migration 18 lên Supabase Production (history 18/18)
  và deploy Vercel Production `dpl_8qr1E6uXb3j9PFGgagheFGJ98PS7` Ready/`sin1`; canonical smoke
  đạt 200/200/200/401/401. Apps Script không có thay đổi và không được push.
