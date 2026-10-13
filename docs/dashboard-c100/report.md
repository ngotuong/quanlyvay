# C100 — Tối ưu lời gọi đọc Tổng quan

Trạng thái: `IN_PROGRESS` ngày 13/10/2026. OWNER đã phê duyệt C100. Source, migration và
kiểm thử local đã sẵn sàng; chưa push source, chưa áp migration remote và chưa rollout.

## Nguyên nhân và thay đổi

`get_management_dashboard_bundle_v3` tính mỗi khoản vay nhiều lần: dashboard hiện tại cần
mốc cuối kỳ, trước kỳ và kỳ lãi sắp tới; phần so sánh lại tính thêm cuối kỳ và trước kỳ trước.
Đây là phần chiếm gần toàn bộ thời gian đọc Tổng quan. Không có bằng chứng cho thấy cần thêm
index, nên C100 không thêm index và không tăng timeout.

Migration `20261013090000_c100_dashboard_bundle_single_pass.sql` thêm RPC v4 nhưng giữ nguyên v3.
V4 gọi `calculate_loan_json` một lần cho mỗi khoản vay ở ngày xa nhất cần dùng, rồi chiết xuất
các cutoff từ chính các period/segment authoritative. Phép làm tròn vẫn theo từng kỳ trong
PostgreSQL; số tiền vẫn là bigint/numeric. Trạng thái, principal, payment allocation, reversal,
interest stop/resume, restructure, overdue và settlement giữ cùng semantics với v3.

Ứng dụng gọi v4 qua read path hiện có. Retry vẫn chỉ một lần cho gateway failure và danh sách
RPC read-only được mở rộng đúng một tên. Không có cache giữa request/người dùng, storage mới,
thay đổi financial write, RLS, role hoặc secret.

## Đo trước và local sau

Production C99 trên cùng phiên Auth, cùng account/dataset và cùng khoảng báo cáo: 11 warm
`dashboard.bundle` từ Vercel log đã khử định danh có median 5319,2 ms, p95 mẫu 5489,3 ms,
min 5261,2 ms và max 5565,4 ms. Mười lượt client Khoản vay → Tổng quan có median 5811 ms,
p95 mẫu 6089,7 ms, min 5654 ms và max 6181 ms. Log chỉ có operation/duration/outcome;
không lưu token, request body, tên hoặc hàng tài chính.

Fixture tổng hợp 40 khoản vay trên C20-test, cùng ngày/role/arguments, hai lượt warm-up rồi
10 mẫu xen kẽ:

| RPC | Median | p95 mẫu | 10 mẫu, ms |
|---|---:|---:|---|
| v3 | 889,2 | 942,1 | 891,8; 936,2; 888,3; 883,6; 946,9; 887,9; 864,0; 890,0; 906,0; 868,6 |
| v4 | 209,2 | 225,1 | 225,5; 209,0; 224,6; 207,8; 208,5; 210,9; 206,8; 209,4; 220,3; 208,0 |

Đây là SQL/RPC local trên fixture giả, không thay thế kết quả remote sau migration. JSON v3/v4
khớp hoàn toàn trên fixture 40 khoản và fixture riêng gồm trả gốc/lãi, reversal, dừng/tiếp tục
lãi, legacy onboarding, tái cơ cấu, tất toán và quá hạn. Trường hợp comparison period nằm sau
current period cũng khớp.

## Kiểm thử local

- `git diff --check`, lint, typecheck, unit 123 và build 19 route: PASS.
- Reset database sạch áp đủ 37 migration, gồm C100: PASS.
- pgTAP 542 test / 25 file: PASS. V4 có budget local 1500 ms trên fixture 40 khoản.
- Full E2E: 87 PASS / 18 SKIP / 0 FAIL, 21,0 phút, retries 0; assertions, test timeout,
  skips và CI job budget 45 phút giữ nguyên.
- Teardown: đúng `QuanLyVayCaNhan-C20-test`, DB 55322; profiles/loans/transactions/
  counterparties/notifications/auth.users đều 0. Các artifact C75 được phục hồi đúng bản gốc.

## Rollback

V3 không bị sửa hoặc xóa. Rollback an toàn đầu tiên là đổi read path về
`get_management_dashboard_bundle_v3` và phát hành lại app; migration v4 có thể nằm yên mà không
ảnh hưởng runtime. Chỉ drop v4 và ba helper bằng migration mới sau khi xác nhận không còn caller.
Không rollback bằng cách sửa trực tiếp Production hoặc xóa lịch sử migration.

## Việc còn lại

Required CI đúng source SHA phải thành công trước rollout. Sau đó áp migration remote, tạo Preview
từ root, kiểm immutable Auth/runtime và ít nhất 10 warm RPC; chỉ chuyển alias nếu median ≤1500 ms
và p95 mẫu ≤2500 ms. Production candidate/promote và cả hai alias phải qua cùng gate. Cần OWNER
đo lại trên iPhone cùng mạng; nếu remote không đạt mục tiêu thì rollback app về v3 và không tuyên bố
C100 đã sửa xong.
