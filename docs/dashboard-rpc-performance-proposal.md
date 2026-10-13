# C100 — Tối ưu lời gọi đọc Tổng quan

Trạng thái: `IN_PROGRESS` ngày13/10/2026. OWNER đã phê duyệt rõ C100 trong hội thoại;
phạm vi dưới đây được phép triển khai. C99 đã hoàn tất; loading visibility được chẩn đoán riêng và
chưa triển khai trong C100.

## Bằng chứng và vấn đề

C99 trên cùng tài khoản, database, trình duyệt Codex IAB và viewport440×956:5lượt mỗi route trước/sau.
Median walltime Tổng quan5721→5803ms; số này gồm driver/polling, không chứng minh speedup.
[Timing](iphone-c99/remote-timing-summary.json). Candidate Production document response TTFB180.1ms,
body5966.6ms/total6148.9ms ở một lượt; không là số đo iPhone thật.

Các read thành công trong100log events gần nhất: dashboard.bundle median5329.05ms (Production8mẫu),
5390.3ms (Preview8mẫu), trong khi Auth/profile khoảng48.4/46.65ms và65/74.8ms, Loans497/526ms,
Counterparties49/50.5ms. Đây là thời gian lời gọi RPC REST gồm network/server/retries hiện có,
không phải SQL-only hoặc trace ghép từng người/request. [Production](iphone-c99/production-read-timings.json),
[Preview](iphone-c99/preview-read-timings.json). Runtimeerror/HTTP5000 trong khoảng kiểm; không quy kết
C91 query_canceled lịch sử là lỗi hiện hành.

RPC thực tế `get_management_dashboard_bundle_v3`: gọi dashboard đầy đủ, flow comparison và balance
comparison. C54 flow comparison gọi calculate_loan_json theo từng khoản ở hai mốc ngày. Đây là hướng
điều tra từ code; chưa có EXPLAIN chứng minh vòng lặp hoặc một index cụ thể là nguyên nhân.

## Phạm vi đã được phê duyệt

1. Đo/profile read-only các phần RPC trên fixture tổng hợp và endpoint thực tế trong cùng điều kiện;
   chỉ lưu số đo/count/plan đã khử định danh, không row tài chính/token/body thật. Chọn thay đổi từ trace.
2. Tối ưu tính/đọc lặp trong một statement/request, hoặc index nếu plan chứng minh cần. PostgreSQL vẫn
   authoritative; không cache số dư cũ giữa requests/người dùng hoặc ở frontend/SW.
3. Mọi SQL/RPC/index thay đổi qua migration có rollback đã review. Ưu tiên version RPC mới giữ v3 để
   rollback app an toàn; nếu thay interface, ghi rõ phạm vi trước triển khai. Giữ RLS/active-profile/
   OWNER/EDITOR/VIEWER và search_path/grants; không tăng database timeout, retries hoặc CI45m budget.
4. So sánh JSON/VND chính xác trước/sau: thu/chi, reversal theo ngày, lãi đơn/lãi kép, kỳ dở dang,
   miễn/dừng lãi, legacy onboarding, restructure, overdue, settled, date Asia/Ho_Chi_Minh. Không physical
   delete/audit bypass hoặc dùng floating-point JS để quyết toán. Không tạo giao dịch/dữ liệu QA trên remote.
5. Các gate hiện hữu lint/typecheck/unit/build/pgTAP/Auth/E2E/RequiredCI exactSHA; rootPreview candidate/
   Auth smoke/stablepostcheck và Production candidate/promote/bothaliases/logs/rollback. Không accounts/
   secrets/Google/backup/dependency changes hoặc nâng Supabase plan theo suy đoán.

## Acceptance dự kiến để duyệt

- Cùng fixture/ngày/khoảng báo cáo/role và dataset: JSON tài chính trước/sau khớp chính xác; toàn bộ
  gate hiện hữu đạt, retries0/skips/assertions/testtimeouts giữ. Có case cutoff/reversal/miễn lãi riêng.
- Ít nhất10lượt warm RPC mỗi phase: mục tiêu median≤1500ms và p95mẫu≤2500ms trên dataset đối chứng
  đã định nghĩa; ít nhất5lượt client trước/sau và kiểm iPhone cùng mạng. Ghi cold riêng và không dùng
  driver/polling hoặc loading animation để chứng minh tăng tốc. Nếu chưa đạt, không tuyên bố đã sửa chậm.
- Migration rollout có provenance/version/rollback, không thay số dư/nghiệp vụ hoặc dữ liệu thật để test.
  Chỉ COMPLETED sau acceptance và exactclosingCI; checkpoint tiếp theo phải được duyệt riêng.

Kết quả local và baseline Production đang được ghi tại [báo cáo C100](dashboard-c100/report.md).
RPCv4 single-pass đã triển khai local qua migration, giữ v3 rollback; không thêm index hoặc tăng
timeout. Chưa push/CI, áp migration remote hoặc rollout.

OWNER sau C99 báo Tổng quan4–5s, logo/loading1–2s, chuyển mục2–3s trên iPhone16ProMax/iOS26. Đây là ước lượng; [kết quả](iphone-c99/owner-iphone-after.json). C100 cần đối chiếu cả backend và thiết bị thật, không lấy loading làm số đo tốc độ.
Loading không nhìn thấy sau đó được ghi ở [đề xuất checkpoint riêng](loading-visibility-proposal.md);
không trộn sửa UI vào C100.
