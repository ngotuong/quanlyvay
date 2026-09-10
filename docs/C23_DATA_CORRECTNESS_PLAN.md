# C23 — Độ chính xác dashboard và cách ly dữ liệu QA

Ngày phê duyệt: 2026-09-10. Trạng thái: `COMPLETED`.

Local implementation, toàn bộ gate, migration Supabase Preview và rollout stable Preview đã đạt.
Candidate `dpl_7FLxGSQi3xCxRKRbKobAas9YLFve` (`Ready`, Preview, Functions `sin1`) đã qua
authenticated smoke trên immutable URL và `https://tindung-preview.vercel.app`; error log bằng 0.

Kết quả hậu kiểm ngày 10/09/2026: cho vay hoạt động `3.850.000.000 ₫`, nợ xấu
`510.000.000 ₫`, tổng vốn chưa thu hồi `4.360.000.000 ₫`, dư nợ đi vay
`1.100.000.000 ₫`; lãi ròng 01–10/09 là `7.030.000 ₫` so với 01–10/08 là
`3.035.000 ₫`. Dòng tiền tháng 9 là `107.800.000 ₫` vào, `100.770.000 ₫` ra,
ròng `7.030.000 ₫`; 6 khoản QA bị loại khỏi danh sách và Google Sync nhưng audit được giữ.

## Mục tiêu

- Kỳ so sánh của KPI phản ánh đúng ngữ nghĩa: chỉ số dòng tiền/lãi so cùng số ngày của tháng trước
  hoặc cùng kỳ năm trước; chỉ số số dư so với mốc ngay trước đầu kỳ.
- Dashboard hiển thị rõ khoảng đang báo cáo và khoảng dùng làm mốc so sánh, không chỉ ghi chung
  chung “kỳ trước”.
- Dữ liệu QA C21 vẫn tồn tại cùng audit append-only nhưng không tham gia số liệu vận hành, danh sách
  nghiệp vụ mặc định hoặc snapshot Google Sync.
- Không làm thay đổi dữ liệu Production; rollout chỉ áp dụng stable Preview theo runbook.

## Phạm vi triển khai

1. Bổ sung thuộc tính phân loại dữ liệu QA qua migration và đánh dấu sáu khoản/đối tác C21 bằng dấu
   vết idempotency/note đã biết; không xóa giao dịch, khoản vay hay audit.
2. Loại dữ liệu QA khỏi dashboard, danh sách khoản vay/đối tác và Google Sync; audit vẫn giữ nguyên.
3. Tách quy tắc so sánh theo preset lịch và hiển thị nhãn ngày so sánh dễ đọc, hỗ trợ screen reader.
4. Bổ sung test cho kỳ so sánh, KPI/dòng tiền, danh sách và snapshot khi có dữ liệu QA.
5. Chạy toàn bộ gate phù hợp, tạo Preview candidate, migrate Preview, smoke immutable URL, chuyển
   stable alias và hậu kiểm số liệu/runtime log theo `docs/VERCEL_PREVIEW_RUNBOOK.md`.

## Acceptance criteria

- Ngày 10/09/2026, dòng tiền/lãi của preset `Tháng này` so 01–10/09 với 01–10/08; preset `Năm nay`
  so 01/01–10/09/2026 với 01/01–10/09/2025. Hai KPI số dư lần lượt so với 31/08 và 31/12.
- Người dùng nhìn thấy chính xác khoảng ngày mốc ngay trên các KPI có so sánh.
- Sáu khoản QA không còn làm phình tiền vào/ra tháng 9; số kỳ vọng sau cách ly là tiền vào
  `107.800.000 ₫`, tiền ra `100.770.000 ₫`, ròng `7.030.000 ₫`.
- Sáu khoản/đối tác QA không xuất hiện trong danh sách vận hành hoặc Google Sync; audit vẫn truy vết
  được việc tạo và tất toán.
- Dư nợ thật giữ nguyên: cho vay hoạt động `3.850.000.000 ₫`, nợ xấu `510.000.000 ₫`, tổng vốn
  chưa thu hồi `4.360.000.000 ₫`, dư nợ đi vay `1.100.000.000 ₫` tại 10/09/2026.
- `git diff --check`, lint, typecheck, unit, build, Auth, E2E, DB lint và pgTAP đều đạt; Preview đạt
  public/authenticated smoke và không có runtime error mới.

## Ngoài phạm vi

- Không xóa vật lý lịch sử tài chính/audit.
- Không rollout Production, không Git push và không thay Apps Script/Google resources hay secrets.
