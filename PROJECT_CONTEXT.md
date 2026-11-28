---
project: QuanLyVayCaNhan
roadmap_version: 1.0.395
last_updated: 2026-11-28
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C123
current_status: IN_PROGRESS
last_completed_checkpoint: C122
next_checkpoint: C123
---

# Project Context

Tệp này chỉ giữ trạng thái hiện hành. Quy tắc làm việc nằm trong [AGENTS.md](AGENTS.md), phạm vi
và lịch sử checkpoint nằm trong [roadmap](docs/IMPLEMENTATION_PLAN.md), còn bằng chứng chi tiết nằm
trong các thư mục `docs/*-cXX` và `docs/release-cXX`.

## 1. Trạng thái hiện hành

- C122 `COMPLETED` ngày 28/11/2026: OWNER phê duyệt trực tiếp ngày 24/11/2026 toàn bộ phạm vi đề xuất.
  OWNER báo iPhone Home Screen không hiện banner/Notification Center
  hoặc badge lúc 12:00; mở app khoảng 14:30 mới thấy một thông báo và badge cập nhật. Kiểm tra
  read-only xác nhận scheduler hoạt động, thông báo đã có từ đầu ngày và Apple chấp nhận Push
  đúng giờ; chưa có receipt phía thiết bị nên chưa xác định lỗi ở giao nhận hay xử lý nền.
  SW Production khớp local, có gọi Badging API nhưng payload chưa có fallback declarative.
  Đề xuất bổ sung fallback iOS, tương thích payload/SW cũ, receipt tối thiểu có bảo vệ và nghiệm thu
  iPhone đóng app/khóa màn hình. Phạm vi đầy đủ và test gate: [đề xuất C122](docs/push-c122/proposal.md).
  Implementation C122 đã được phát hành trên stable Preview và Production; ngày 28/11 đã đối chiếu
  lại deployment, runtime và nghiệm thu iPhone thật theo phạm vi đã duyệt.
  Local đạt lint/typecheck/build, 145 unit, pgTAP 617/29 tệp, db lint sạch và targeted browser 2/2.
  Full E2E source cuối đạt `107 PASS / 18 SKIP / 0 FAIL` trên 125 ca trong 27,5 phút, retries 0.
  Prod audit sạch, full audit giữ 1 moderate dev tooling.
  Backup `qlv-prod-20261124T100208Z` đạt 6 tệp/GCM/SQL-shape/checksum; C121 rollback đã re-inspect.
  Đối chiếu tiếp ngày 28/11 xác nhận source/origin cùng `ca88440`, Required CI `45569166930` đạt và
  root Preview gate chạy lại đạt `107 PASS / 18 SKIP / 0 FAIL`. Backup mới
  `qlv-prod-20261128T091217Z` đạt 6 tệp/GCM/SQL-shape/checksum, migration snapshot
  `20261124100000`; remote history/schema/grants C122 hiện hữu và db lint sạch, không áp lại.
  Stable Preview hiện là `dpl_4L4iJP2y8EvdsP5cS57vDYknk4iS` tại
  `quan-ly-vay-ca-nhan-47uhkp66o-ngotuong2105.vercel.app`; Production hiện là
  `dpl_5YNAdxrxHVuNkgHMuxF8deBFKmxW` tại
  `quan-ly-vay-ca-nhan-ebkiz2f72-ngotuong2105.vercel.app`. Cả hai Ready/đúng target/Functions `sin1`;
  public/CSP/connectivity/SW/receipt smoke và runtime error/fatal/HTTP500 đạt. SW bốn origin khớp
  source local theo SHA-256. Context trước đó đã chậm hơn remote; không deploy/promote trùng.
  Browser điều khiển không khả dụng nên OWNER đã tự chạy probe đúng chuỗi trên iPhone ngày 28/11;
  app báo provider accepted, thiết bị đã chạy xử lý nền và nhánh declarative đã giao hiển thị/badge
  cho hệ điều hành. OWNER xác nhận trực tiếp thấy banner/Notification Center, badge trên icon khi app
  đóng/màn hình khóa và chạm thông báo mở đúng app/trang Thông báo. C122 đạt acceptance thiết bị;
  không suy rộng thành cam kết Push luôn đúng giờ hoặc receipt luôn chứng minh người dùng đã thấy.
  Chi tiết và giới hạn: [bằng chứng C122](docs/push-c122/report.md).
- C123 `IN_PROGRESS` ngày 28/11/2026: OWNER đã phê duyệt trực tiếp. Migration ACL/idempotency đã
  áp local; permission catalog sạch và test hai database session đạt cho tạo khoản vay, sửa điều
  khoản, onboarding, chi phí và đảo chi phí. Gate đạt lint/typecheck/build, 145 unit,
  Auth 6/6, pgTAP 651/30 tệp, db lint sạch và full E2E `107 PASS / 18 SKIP / 0 FAIL`.
  Backup `qlv-prod-20261128T123003Z` đạt 6 tệp/GCM/SQL-shape/checksum; remote trước rollout khớp
  đến migration `20261124100000` và đúng permission matrix. Chưa áp C123 remote; đang chuẩn bị
  source/CI/Preview/Production. [Báo cáo](docs/integrity-c123/report.md).
- C121 `COMPLETED` ngày 20/11/2026: OWNER đã phê duyệt trực tiếp vá Next.js và phát hành C120 qua Preview rồi
  Production, gồm push/CI, full gate, authenticated/runtime smoke và rollback. Không migration hoặc
  đổi dữ liệu nghiệp vụ. Next.js/eslint-config-next 16.4.6 đã cài, port nguyên patch C76 và pin
  tương ứng. Lint/typecheck/unit/build/CI policy/audit high đạt; prod audit 0 advisory, full audit
  còn 1 moderate minimatch trong dev tooling, 0 high/critical. Full local E2E đạt
  `105 PASS / 18 SKIP / 0 FAIL` trên 123 test, 27,6 phút, retries 0. Rollback C119 đã re-inspect
  Ready/đúng target/Functions sin1. Source `7cc61c8350c74155465c156f4b1f4d8cfec9485b` đã push
  fast-forward lên origin/main; Required CI `44685677028` đạt đủ 6 job, đúng SHA. Root Preview
  create gate đạt `105 PASS / 18 SKIP / 0 FAIL` (27,6 phút), upload guard 249 tệp.
  Candidate Preview `dpl_FKFHCRhT4czN6pfi9Bpb2NqFu7MV` tại
  `quan-ly-vay-ca-nhan-3lozqou67-ngotuong2105.vercel.app` đúng project/Preview/Ready/Functions sin1;
  public/CSP và connectivity 204/marker/no-store/no-cookie đạt; runtime pre-Auth error/fatal/HTTP500
  bằng 0. OWNER đã đăng nhập candidate trong IAB; Auth Tổng quan/Khoản vay/Đối tác đạt, không có
  network notice hay loading còn treo, console error/warning và runtime error/fatal/HTTP500 bằng 0.
  Root resume đạt `105 PASS / 18 SKIP / 0 FAIL` (27,8 phút), đã chuyển stable Preview sang C121;
  hậu kiểm public/CSP/connectivity và runtime error/fatal/HTTP500 bằng 0. Stable origin chưa có
  phiên đăng nhập: kiểm tra browser dừng ở login hợp lệ, console sạch; Auth đã đạt trên immutable.
  Production `dpl_DHfobW9VBsc4BacejizJ1MkDkE8z` tại
  `quan-ly-vay-ca-nhan-1fl65m53k-ngotuong2105.vercel.app` tạo bằng --prod --skip-domain, đúng
  project/Production/Ready/Functions sin1. OWNER đã đăng nhập đúng origin; Auth smoke Tổng quan,
  Khoản vay và Đối tác đạt, không notice/loading treo, console và runtime sạch trước promote.
  Đã promote; hai alias Production cùng trỏ C121, public/CSP/connectivity đạt, runtime
  error/fatal/HTTP500 bằng 0 sau promote. Chrome thật trên Mac tải lại Tổng quan thành công,
  không còn network notice và console 0 message; navigator.onLine hiện true. Không mô phỏng lại
  false-offline trên máy người dùng; ca false-offline được chứng minh trong E2E. Alias mặc định
  chưa có session nên browser login hợp lệ, không coi là Auth smoke tại alias này.
  Rollback C119 giữ nguyên, không kích hoạt. Không thay đổi cấu hình mạng, tài khoản hoặc dữ liệu
  nghiệp vụ. Không còn blocker; chưa có checkpoint kế tiếp chờ duyệt, C100 giữ chờ số đo.
  [Báo cáo](docs/release-c121/report.md).
- C120 `COMPLETED` local ngày 20/11/2026 theo yêu cầu trực tiếp của OWNER: NetworkStatus xác minh
  GET `/api/connectivity` cùng origin, 204 + marker, no-store/omit credentials/error-on-redirect.
  Endpoint không gọi Auth/database, không trả dữ liệu. Browser báo offline sai nhưng probe đạt sẽ
  không hiện cảnh báo; lỗi/timeout 5 giây thì hiện lời nhắc trung tính và tự thử lại sau 15 giây,
  kể cả thiếu online event. Dọn timer/abort khi ẩn hoặc unmount, bỏ kết quả request cũ; phiên online
  bình thường không polling. Không đổi dữ liệu nghiệp vụ hoặc mạng máy người dùng.
  Gate đạt lint/typecheck/unit/build và targeted E2E `10 PASS / 0 FAIL / 0 SKIP` trong 2,1 phút:
  8 ca C120, C20 phục hồi lỗi/offline, C99 service-worker offline/cache privacy. Ảnh synthetic được
  xem, không còn boot overlay hoặc cảnh báo sai. Diff-check sạch. Không chạy lại pgTAP vì không đổi DB.
  Lượt đầu có 9 PASS/1 FAIL: C20 thiếu fixture chi phí khi chạy riêng; đã thêm fixture giả tại đúng
  test, giữ assertion và chạy lại đạt. Không đổi timeout/retry/skip. Hai lượt E2E khởi động bị build
  guard Next.js chặn một lần trước khi chạy lại; build cuối đạt nhưng vẫn có security advisory.
  `pnpm audit --prod` xác nhận 7 moderate từ Next.js 16.4.1, 0 high/critical, patched >=16.4.5;
  không tự nâng dependency ngoài phạm vi C120. Phần nâng bản vá và phát hành đã hoàn tất trong C121;
  C100 giữ chờ số đo.
- C119 `COMPLETED` ngày 13/11/2026: OWNER yêu cầu bổ sung mở chu kỳ mới khi tính lại lãi và áp dụng cho khoản
  đã chỉ định sau kiểm thử/phát hành. Phạm vi gồm migration, Server Action/form, lịch thu/nhắc,
  kiểm thử local/CI, backup, Preview/Production và đối chiếu trước/sau thao tác thật. Không lưu
  định danh hoặc số liệu khoản vay vận hành trong source control. C100 giữ nguyên phần chờ số đo.
  Source `effa212d64f010e23e4b3bbc576b63ae5aa5bbe5` đã push `origin/main`; Required CI
  `43257277803` đạt đủ 6 job. pgTAP 589/28 tệp; root Preview gate đạt full E2E
  `97 PASS / 18 SKIP / 0 FAIL` trên 115 test trong 27,3 phút. Backup
  `qlv-prod-20261112T130014Z` đạt 6 tệp mã hóa/checksum/GCM/SQL-shape. Migration C119 đã áp đúng
  remote project, history khớp `20261112130000`, db lint sạch. Preview candidate
  `dpl_7R496718rvagozh2HVr4VJxSbtWc` tại `quan-ly-vay-ca-nhan-66me5s2gb-ngotuong2105.vercel.app`
  đúng project/target Preview/Ready/Functions `sin1`; public/CSP smoke đạt, error/fatal/HTTP500 bằng 0.
  OWNER đã đăng nhập candidate; Auth smoke Dashboard/Thiết lập/Lịch sử đạt, console và runtime
  error/fatal/HTTP500 bằng 0. Root resume đạt full E2E `97 PASS / 18 SKIP / 0 FAIL` trong 27,4 phút;
  stable Preview đã chuyển sang C119, hậu kiểm public/Auth Dashboard/Thiết lập/console/runtime đạt.
  Production `dpl_9max1ga7TvFsS36kSd9sTrWtx6TW` tại
  `quan-ly-vay-ca-nhan-6tqp7bep4-ngotuong2105.vercel.app` đã Ready/target Production/Functions sin1,
  public/CSP/Auth/runtime đạt trước promote. Đã promote và hậu kiểm cả hai alias Production:
  cùng deployment, public/Auth/console/CSP đạt, runtime error/fatal/HTTP500 bằng 0.
  Khoản được chỉ định đã gắn mốc mới vào sự kiện đổi lãi hiện hữu qua form được validate;
  không nhân đôi sự kiện, không tạo dòng tiền. Offset nhắc đã đặt 0 theo yêu cầu riêng của OWNER.
  Đối chiếu lịch sử, lịch miễn lãi, ngày nhắc, dư gốc và tổng đã thu trước/sau đạt; không có sai lệch.
  Rollback C118 giữ nguyên. Không có blocker hoặc checkpoint tiếp theo đang chờ duyệt; C100 vẫn
  chờ số đo thiết bị. [Báo cáo](docs/release-c119/report.md).
- C117 `COMPLETED` local ngày 05/11/2026: Dashboard dùng toàn bộ tháng dương lịch hiện tại cho lịch
  nhắc lãi, độc lập kỳ báo cáo; Đối tác hiển thị dư gốc cho vay/đi vay và lãi đã thu/đã trả từ một
  RPC tổng hợp authoritative. Lưới 2 cột mobile/4 cột desktop, chế độ riêng tư và accessibility đều
  được kiểm tra. Migration chỉ áp local; Production chưa thay đổi. Gate đạt diff-check, lint,
  typecheck, unit, build 19 route, db lint, pgTAP `574 PASS / 27 file`, full E2E
  `96 PASS / 18 SKIP / 0 FAIL` trên 114 test và visual probe sáng/tối/sweep không có overflow hay
  số bị cắt. Khoản chi 6 triệu đồng hàng tháng tiếp tục ghi bằng luồng Chi phí chung hiện hữu.
- C118 `COMPLETED` ngày 12/11/2026 theo phê duyệt trực tiếp của OWNER. Backup mã hóa
  `qlv-prod-20261112T010655Z` đạt đủ 6 tệp/checksum/GCM/SQL-shape; migration C117 đã áp đúng project
  `hmfxnstrqfqpvsgfmjmd`, remote history khớp và db lint sạch. Source `0cb155a` đã fast-forward lên
  `origin/main`; source bằng chứng `0476ae5` đạt Required CI `43140849695`. Stable Preview hiện là
  `dpl_J28Soq2TRk2wFpDNBu3YrCkZQaRL`, immutable URL
  `quan-ly-vay-ca-nhan-7mtj0t1n7-ngotuong2105.vercel.app`, target Preview, Ready, Functions `sin1`.
  Hai lượt root gate đều đạt full E2E `96 PASS / 18 SKIP / 0 FAIL`; immutable và stable alias đều
  đạt public/Auth smoke Dashboard/Đối tác, privacy, console sạch, runtime level-error/fatal/HTTP 500
  bằng 0. OWNER đã nghiệm thu Preview; Production `dpl_9stGwkm8nA4bhiKcDXZySmrukhtr` được tạo
  bằng `--prod --skip-domain`, đạt public/Auth/CSP/runtime smoke rồi promote. Hai alias Production
  cùng trỏ deployment mới, target Production, Ready, Functions `sin1`; Dashboard/Đối tác đăng nhập
  đạt, console sạch và runtime level-error/fatal/HTTP 500 bằng 0. Rollback C115 giữ nguyên, chưa kích hoạt.
  Báo cáo hiện hành: [release C118](docs/release-c118/report.md).
- C113 `COMPLETED` ngày 22/10/2026: audit toàn diện local không phát hiện P0/P1; đã sửa P2 Google
  Sync có thể clear tab khi full snapshot thiếu bảng, P3 biểu đồ vẽ giá trị 0 thành cột dương và
  P3 full E2E C75 tự ghi đè evidence lịch sử.
  Gate đạt lint, typecheck, unit 126, build 19 route, auth 6, pgTAP 543/25 file và full E2E
  `92 PASS / 18 SKIP / 0 FAIL`. Không migration/deploy/commit/push. Báo cáo:
  [audit C113](docs/audit-c113/report.md).
- C114 `COMPLETED` ngày 22/10/2026: Web Push chỉ egress HTTPS/443 tới provider policy qua DNS
  A/AAAA fail-closed và HTTPS Agent ghim IP public; đổi mật khẩu dùng generation + Auth marker để
  recovery partial failure đúng user; CSP Production dùng nonce theo request và bỏ
  `script-src 'unsafe-inline'`. Migration chỉ chạy local. Gate đạt unit 138, build 19 route, Auth 6,
  pgTAP 552/26 file và full E2E `94 PASS / 18 SKIP / 0 FAIL`. Báo cáo:
  [security C114](docs/security-c114/report.md).
- C115 `COMPLETED` ngày 24/10/2026: migration/provider policy, stable Preview, iPhone Web Push và
  rollout Production ban đầu đều đạt. Advisory Zod sau rollout đã được vá lên 4.6.7; harness C99/
  C107 được làm deterministic và CI chia hai shard vẫn bao phủ đủ 112 test, không tăng timeout,
  retry hay skip. Sau khi repository chuyển sang public, full-history Gitleaks với allowlist hẹp
  vẫn sạch; Required CI `40100298387` attempt 2 trên đúng source
  `031197fc78e54ebbe15ab302b643b32187856fa6` đạt đủ sáu job, E2E tổng
  `93 PASS / 19 SKIP / 0 FAIL`. Candidate thay thế `dpl_4L1ayzFPjaaAJjUtXms3gB3v1HEx` đã qua
  public/Auth/CSP/service-worker/runtime smoke, được promote và hậu kiểm trên cả hai alias; không
  có level-error hay HTTP 500. Báo cáo: [release C115](docs/release-c115/report.md).
- C116 `COMPLETED` ngày 25/10/2026: tên hiển thị project Supabase hiện hữu đã đổi từ
  `quan-ly-vay-ca-nhan` thành `Tín Dụng` qua Management API chính thức. Project ref
  `hmfxnstrqfqpvsgfmjmd`, organization, region `ap-southeast-1`, database host, API URL và trạng
  thái `ACTIVE_HEALTHY` giữ nguyên; không đổi secret, Auth, schema, migration hoặc dữ liệu. Public
  smoke Preview/Production đạt; Auth smoke Dashboard/Cài đặt đọc profile và dữ liệu thành công,
  runtime không có level-error hay HTTP 500.
- C100 `IN_PROGRESS`: OWNER đã phê duyệt tối ưu lời gọi đọc Tổng quan. RPC v4 đã phát hành và đạt
  gate tự động; phần còn lại là nghiệm thu định lượng trên iPhone thật. C113 không thay đổi phạm vi
  hay acceptance còn thiếu của C100.
- C112 `COMPLETED` ngày 22/10/2026: giao diện C111 cùng nền loading C107 đã được phát hành. OWNER
  đã kiểm cả hai Production alias; Dashboard, Khoản vay, Đối tác và Thông báo đều Auth HTTP 200.
- C101–C122 đều `COMPLETED`; C100 đang `IN_PROGRESS`. Chi tiết acceptance, test
  và deployment được giữ trong roadmap và báo cáo phát hành tương ứng.
- C100 chỉ còn chuỗi số đo thiết bị theo acceptance đã duyệt. C120–C122 đã hoàn tất theo phê duyệt
  trực tiếp của OWNER. C123 đã được OWNER phê duyệt trực tiếp ngày 28/11/2026.

## 2. C100 — Công việc còn lại

Phạm vi: [đề xuất C100](docs/dashboard-rpc-performance-proposal.md) và
[báo cáo hiện hành](docs/dashboard-c100/report.md).

- `get_management_dashboard_bundle_v4` tính một lần cho mỗi khoản vay; v3 vẫn được giữ làm rollback.
- Migration `20261013090000_c100_dashboard_bundle_single_pass.sql` và correction
  `20261013192500` đã áp; remote database lint sạch, parity nghiệp vụ đạt.
- Gate đã đạt: lint, typecheck, unit 123, build 19 route, pgTAP 542/25 file và full E2E
  `87 PASS / 18 SKIP / 0 FAIL`, retries 0. Required CI `38397792297` đạt đủ 5 job.
- Production trước tối ưu: RPC warm median 5319,2 ms; client Khoản vay → Tổng quan median 5811 ms.
- Sau tối ưu: RPC Production warm median 1415,9 ms; client median 3095 ms. Sau khi bỏ prefetch
  suy đoán ở C110, runtime ghi `dashboard.bundle` 1470,8–1566,3 ms và không còn burst request chi
  tiết khoản vay. OWNER ước lượng quay lại Tổng quan khoảng 2–3 giây.
- Acceptance còn thiếu: trên cùng iPhone 16 Pro Max/iOS 26 và cùng mạng, ghi riêng ít nhất 5 lượt
  cold launch và 5 lượt chuyển mục/quay lại Tổng quan. Không dùng cảm nhận chung thay chuỗi số đo.
- Sau khi OWNER cung cấp số đo: cập nhật report/context/roadmap, chạy gate tài liệu, tạo commit chốt
  và chỉ push/đóng C100 khi có phê duyệt phù hợp trong phiên mới.

## 3. Bản đang phục vụ và rollback

| Vai trò | Deployment | Immutable URL / alias | Trạng thái |
| --- | --- | --- | --- |
| Production C121 | `dpl_DHfobW9VBsc4BacejizJ1MkDkE8z` | `quan-ly-vay-ca-nhan-1fl65m53k-ngotuong2105.vercel.app` / `tindung.vercel.app` / alias mặc định | Production, Ready, Functions `sin1`, public/Auth/console/runtime đạt |
| Stable Preview C121 | `dpl_FKFHCRhT4czN6pfi9Bpb2NqFu7MV` | `quan-ly-vay-ca-nhan-3lozqou67-ngotuong2105.vercel.app` / `tindung-preview.vercel.app` | Preview, Ready, Functions `sin1`, immutable Auth và stable public/runtime đạt |
| Preview rollback C119 | `dpl_7R496718rvagozh2HVr4VJxSbtWc` | `quan-ly-vay-ca-nhan-66me5s2gb-ngotuong2105.vercel.app` | Preview, Ready, Functions `sin1` |
| Preview rollback C118 | `dpl_J28Soq2TRk2wFpDNBu3YrCkZQaRL` | `quan-ly-vay-ca-nhan-7mtj0t1n7-ngotuong2105.vercel.app` | Preview, Ready, Functions `sin1` |
| Production rollback C119 | `dpl_9max1ga7TvFsS36kSd9sTrWtx6TW` | `quan-ly-vay-ca-nhan-6tqp7bep4-ngotuong2105.vercel.app` | Production, Ready, Functions `sin1`, chưa kích hoạt |
| Preview rollback C115 | `dpl_BRfVm4hf5jfk5FJe2mXPxmrt3hC4` | `quan-ly-vay-ca-nhan-5ydpf15dp-ngotuong2105.vercel.app` | Preview, Ready, Functions `sin1` |
| Preview rollback C115 trước hotfix | `dpl_8pxn5Ze87nbvdNbaF5CQeQ1oan9b` | `quan-ly-vay-ca-nhan-97arw9mvp-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Production rollback C118 | `dpl_9stGwkm8nA4bhiKcDXZySmrukhtr` | `quan-ly-vay-ca-nhan-leq38ew90-ngotuong2105.vercel.app` | Production, Ready, Functions `sin1`, chưa kích hoạt |
| Production rollback C115 | `dpl_4L1ayzFPjaaAJjUtXms3gB3v1HEx` | `quan-ly-vay-ca-nhan-hfp6yuep3-ngotuong2105.vercel.app` | Production, Ready, Functions `sin1`, chưa kích hoạt |
| Production rollback C115 trước Zod 4.6.7 | `dpl_GndhsLryK5D15xkut2aHPdeFKGWX` | `quan-ly-vay-ca-nhan-j07u4c057-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Production rollback C112 | `dpl_75xKhFuJ4wgspCmGdN4txdtNwyVF` | `quan-ly-vay-ca-nhan-967no3d6v-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Preview rollback C112 | `dpl_2a8avNFZHZxcDsZvheXP84dLu8Ri` | `quan-ly-vay-ca-nhan-74fc7gb9r-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Preview rollback C110 | `dpl_148HdyQj5mLLoxocf5f3hyhjfDut` | `quan-ly-vay-ca-nhan-6m940n7ty-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |
| Production rollback C106 | `dpl_92pT2tjxRvCTEwyEePzJqMpGa8TG` | `quan-ly-vay-ca-nhan-kt9gxcuu7-ngotuong2105.vercel.app` | Ready, chưa kích hoạt |

C121 source `7cc61c8` đạt Required CI `44685677028` đủ sáu job và hai root Preview full gate
105 PASS/18 SKIP/0 FAIL; public/Auth/CSP/connectivity đạt trên immutable trước promote và hậu kiểm
Production. Runtime level-error/fatal/HTTP500 bằng 0, Chrome Mac tải lại không còn cảnh báo sai.
Chi tiết và giới hạn Auth từng origin: [release C121](docs/release-c121/report.md).

## 4. Source và workspace

- Repository chuẩn: `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`, branch `main`.
- Source ứng dụng C121: `7cc61c8350c74155465c156f4b1f4d8cfec9485b` trên origin/main, Required CI
  `44685677028` đạt. Thay đổi chốt phát hành chỉ cập nhật hồ sơ, không đổi runtime đã kiểm thử.
- Source ứng dụng C119: `effa212d64f010e23e4b3bbc576b63ae5aa5bbe5` trên `origin/main`, Required CI
  `43257277803` đủ sáu job đạt. Hồ sơ hoàn tất chỉ cập nhật tài liệu, không đổi runtime đã phát hành.
- Source ứng dụng C118 là `0cb155a0d9d2950f973a734bae59e0c6f2418ce9`; commit bằng chứng stable
  Preview `0476ae53a1f54a393df2aa07796fff0775fc6cc4` đã đạt Required CI `43140849695` đủ sáu job.
- Source C113–C115, hotfix Next.js 16.4.1/Zod 4.6.7 và harness CI deterministic đã fast-forward
  tới `origin/main` tại `031197fc78e54ebbe15ab302b643b32187856fa6`; Required CI
  `40100298387` attempt 2 của đúng SHA đạt đủ sáu job. Repository đã chuyển `PUBLIC` để Required CI
  tiếp tục chạy sau khi hết quota private Actions; kiểm tra trước đổi visibility xác nhận 0 fork,
  0 star, 0 watcher, không artifact/secret/variable cấp repository và full-history Gitleaks sạch.
- Dependency và local Supabase test stack được giữ để review/chạy lại gate; không suy quyền thao tác
  remote từ trạng thái local này.
- Không xóa báo cáo checkpoint, migration, test, ảnh bằng chứng đã được source-control quản lý,
  secret hoặc dữ liệu tài chính.

## 5. Bất biến cần giữ

- Supabase PostgreSQL authoritative; Google Sheets chỉ đồng bộ một chiều.
- Mutation qua Server Action/RPC đã validate; financial calculation authoritative ở PostgreSQL.
- VND dùng integer, lãi suất decimal; ngày nghiệp vụ theo Asia/Ho_Chi_Minh, audit theo UTC.
- Giao dịch tài chính dùng append/reversal, không xóa vật lý. Không cache số dư giữa request/user.
- Preview chỉ chạy từ repository root bằng `pnpm deploy:preview` theo
  [runbook](docs/VERCEL_PREVIEW_RUNBOOK.md).
- Project Vercel: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; Supabase project dùng chung:
  `hmfxnstrqfqpvsgfmjmd`. Không tạo dữ liệu QA trên account vận hành.

## 6. Điểm vào phiên mới

1. Đọc `AGENTS.md`, tệp này, phần C122 trong roadmap và [đề xuất C122](docs/push-c122/proposal.md).
2. Chạy `git status --short --branch` và `git log -1 --oneline`.
3. Chỉ tiếp tục C100 khi OWNER cung cấp chuỗi số đo thiết bị theo acceptance đã duyệt.
4. C116 đã hoàn tất; Supabase hiện có tên hiển thị `Tín Dụng`, ref/API URL và dữ liệu giữ nguyên.
5. C119 đã hoàn tất cả stable Preview/Production và thao tác khoản vay được chỉ định, gồm offset
   nhắc 0 theo yêu cầu riêng. Không lặp lại thao tác hoặc tiếp tục rollout từ bằng chứng lịch sử.
6. C121/C122 đã hoàn tất. Không lặp lại deploy/promote, migration hoặc probe thiết bị. Giữ rollback
   C119. C123 đã được phê duyệt và đang triển khai; C100 chỉ tiếp tục khi có chuỗi số đo thiết bị.

Tài liệu kỹ thuật chính: [Domain](docs/DOMAIN_SPEC.md), [Financial Engine](docs/FINANCIAL_ENGINE.md),
[Dashboard](docs/DASHBOARD.md), [CI](docs/CI.md), [Preview](docs/VERCEL_PREVIEW_RUNBOOK.md),
[Backup](docs/BACKUP_RESTORE.md) và [Google Sync](docs/GOOGLE_SYNC.md).
