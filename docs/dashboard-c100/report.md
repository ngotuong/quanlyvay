# C100 — Tối ưu lời gọi đọc Tổng quan

Trạng thái: `IN_PROGRESS` ngày 14/10/2026, đang chờ kết quả kiểm tra trên iPhone thật của OWNER.
Source cuối `beb83017eceac7a549b6d7cbf885655d82c8b64a`; Required CI
`38397792297` đạt đủ 5 job. Hai migration v4 và correction đã áp, remote database lint sạch.
Preview và Production đã phát hành; các gate tự động, Auth smoke và runtime hậu kiểm đều đạt.

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

Sau lần áp migration đầu, remote `db lint` phát hiện helper cutoff được khai báo `IMMUTABLE`
trong khi PL/pgSQL chỉ được PostgreSQL phân loại an toàn ở mức `STABLE`. Migration bổ sung
`20261013192500_c100_dashboard_helper_volatility.sql` hạ đúng volatility; không đổi phép tính,
input/output, quyền hoặc dữ liệu. Regression test khóa `provolatile = 's'` trước khi rollout.

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
- Reset database sạch ban đầu áp đủ 37 migration; sau correction áp đủ 38 migration: PASS.
- pgTAP 542 test / 25 file: PASS; test C100 sau correction 14/14 PASS và database lint sạch.
  V4 có budget local 1500 ms trên fixture 40 khoản.
- Full E2E: 87 PASS / 18 SKIP / 0 FAIL, 21,0 phút, retries 0; assertions, test timeout,
  skips và CI job budget 45 phút giữ nguyên.
- Teardown: đúng `QuanLyVayCaNhan-C20-test`, DB 55322; profiles/loans/transactions/
  counterparties/notifications/auth.users đều 0. Các artifact C75 được phục hồi đúng bản gốc.

## Required CI và migration remote

- Source ban đầu `174045436a1f56b83c00e06b022a471d9927b313`: Required CI
  `38393447554` SUCCESS cả 5 job.
- Source correction `beb83017eceac7a549b6d7cbf885655d82c8b64a`: Required CI
  `38397792297` SUCCESS cả 5 job. Đây là SHA đã dùng cho cả hai candidate.
- Remote ledger có `20261013090000` và `20261013192500`; `supabase db lint --linked
  --level warning` sạch sau correction. Không tạo hoặc sửa hàng tài chính để đo.

## Preview rollout

- Candidate `dpl_4Tu5ARCZ9MNGXy1FK5sknkBGjRYL`, target `preview`, trạng thái `Ready`,
  project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, Functions tại `sin1`.
- Immutable URL: `https://quan-ly-vay-ca-nhan-g4kxky48s-ngotuong2105.vercel.app`;
  stable alias: `https://tindung-preview.vercel.app`.
- Cả lượt tạo và resume chạy từ repository root bằng `pnpm deploy:preview`. Full E2E lần lượt
  87 PASS / 18 SKIP / 0 FAIL trong 20,4 và 20,6 phút, retries 0; lint, typecheck, unit 123,
  build 19 route và upload guard đạt trước khi chuyển alias.
- Immutable và stable alias đều qua Auth Dashboard smoke; console warning/error và runtime error
  bằng 0 trong khoảng hậu kiểm.
- 18 mẫu RPC ấm: median 1428,3 ms, p95 mẫu 1499,1 ms, min 1403,7 ms, max 1555,3 ms.
  Mười lượt client Khoản vay → Tổng quan: median 2209 ms, p95 mẫu 2496,1 ms,
  min 2113 ms, max 2646 ms.

## Production rollout

- Candidate `dpl_EGe6nwTAqkZGikDFPzAJT3r85HYf`, target `production`, trạng thái `Ready`,
  cùng project và Functions tại `sin1`; immutable URL
  `https://quan-ly-vay-ca-nhan-fexn8r7ef-ngotuong2105.vercel.app`.
- Candidate được tạo từ repository root với `--target=production --skip-domain`, rồi promote
  thành công. `https://tindung.vercel.app` và alias mặc định
  `https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app` cùng trỏ đúng deployment trên.
- Immutable Auth smoke đạt. 13 mẫu RPC ấm: median 1415,9 ms, p95 mẫu 1491,5 ms,
  min 1406,4 ms, max 1536,1 ms. Mười lượt client Khoản vay → Tổng quan: median 3095 ms,
  p95 mẫu 3146,9 ms, min 3087 ms, max 3182 ms; baseline tương ứng 5811/6089,7 ms.
- Sau promote, public `/`, `/login`, `/manifest.webmanifest` trên cả hai alias trả 200.
  Auth smoke `dashboard → loans → counterparties → dashboard` trên stable Production đạt;
  privacy vẫn ẩn, console warning/error và runtime error bằng 0 trong khoảng hậu kiểm.
- Bản Production C99 `dpl_14VquPhpxUa5yeA8Cb9z7ejcWG4Z` được giữ làm rollback, chưa kích hoạt.

Chi tiết không chứa dữ liệu tài chính thật nằm trong [release proof](release-proof.json).

## Rollback

V3 không bị sửa hoặc xóa. Rollback an toàn đầu tiên là đổi read path về
`get_management_dashboard_bundle_v3` và phát hành lại app; migration v4 có thể nằm yên mà không
ảnh hưởng runtime. Chỉ drop v4 và ba helper bằng migration mới sau khi xác nhận không còn caller.
Không rollback bằng cách sửa trực tiếp Production hoặc xóa lịch sử migration.

## Việc còn lại

Các ngưỡng remote và rollout đã đạt. C100 còn chờ OWNER đo lại trên cùng iPhone 16 Pro Max,
iOS 26 và cùng mạng, tách cold launch khỏi ít nhất 5 lượt chuyển mục. Sau khi bằng chứng thiết bị
được ghi, cập nhật checkpoint, chạy `git diff --check`, commit tài liệu chốt, push và đợi Required CI
đúng SHA đạt cả 5 job. Loading có nhìn thấy hay không thuộc checkpoint kế tiếp, không dùng làm số đo
tăng tốc C100.

Ngày 16/10/2026, OWNER phản hồi tốc độ vẫn chưa thật sự mượt và tiếp tục tự kiểm. Đây là đánh giá
thiết bị hợp lệ để giữ C100 `IN_PROGRESS`, nhưng chưa có chuỗi ít nhất 5 số đo cold/warm tách biệt
nên chưa thay thế tiêu chí nghiệm thu định lượng. Theo chỉ dẫn mới nhất, C101 UI Khoản vay được làm
trước; C101 không thay RPC, migration hoặc kết quả đo của C100.

Ngày 20/10/2026 trên stable Preview C110, OWNER xác nhận mở app rồi đi Khoản vay → Đối tác →
Thông báo khá tốt, nhưng quay lại Tổng quan chậm hơn lặp lại. Log server cùng phiên ghi
`dashboard.bundle` khoảng 1.469–1.600ms; một lượt `profile.read` tăng tới 1.130,7ms và trang Khoản
vay phát sinh cụm request prefetch chi tiết. Bản khắc phục trong read-path hiện hữu tắt prefetch
suy đoán của link chi tiết/quick action nhưng giữ main-route shell prefetch và dữ liệu Tổng quan
luôn đọc mới. Đây là biện pháp loại contention, không được tính là đã đạt acceptance C100 cho đến
khi OWNER kiểm ít nhất 5 vòng trên iPhone và số đo được ghi lại.

Trên candidate khắc phục C110 ngày 21/10/2026, OWNER thực hiện lại vòng điều hướng đã được yêu cầu
và phản hồi thời gian quay về Tổng quan khoảng 2–3 giây. Hai request Dashboard được runtime ghi đủ
có `dashboard.bundle` 1.566,3ms và 1.470,8ms, `profile.read` 47,4ms và 39,5ms; không còn burst
prefetch các trang chi tiết khoản vay. Đây là bằng chứng cải thiện contention và phù hợp với mức
nền backend khoảng1,5 giây. Vì OWNER trả một khoảng ước lượng chung thay vì năm số đo riêng, C100
vẫn `IN_PROGRESS` và chưa được tuyên bố đạt acceptance định lượng.
