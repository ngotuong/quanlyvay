# Implementation Plan

Đây là roadmap trạng thái hiện hành. Chi tiết checkpoint đã hoàn tất được lưu trong Git history;
không dùng lịch sử đó làm yêu cầu đang chờ.

## 1. Quy tắc

- Chỉ checkpoint được người dùng phê duyệt rõ mới chuyển sang `IN_PROGRESS`.
- Trạng thái hợp lệ: `NOT_STARTED`, `AWAITING_APPROVAL`, `APPROVED`, `IN_PROGRESS`,
  `BLOCKED`, `COMPLETED`.
- Cập nhật trạng thái đồng thời tại đây và `PROJECT_CONTEXT.md`.
- Hoàn tất checkpoint thì dừng; không tự chuyển sang checkpoint kế tiếp.
- Phạm vi remote, dữ liệu và secret tuân theo cổng phê duyệt trong `AGENTS.md`.

## 2. Roadmap

| ID | Kết quả | Trạng thái |
|---|---|---|
| C0–C19 | Nền tảng, nghiệp vụ, Auth, PWA, đồng bộ, Production và hardening | `COMPLETED` |
| C20–C29 | Remediation, dữ liệu/hiệu năng, UI/UX, nhận diện và rollout | `COMPLETED` |
| C30–C37 | Notification, bộ lọc/biểu đồ, tài khoản/cài đặt và rollout | `COMPLETED` |
| C39–C44 | UX khoản vay, hợp nhất nhắc hạn, nhắc lãi vận hành và rollout | `COMPLETED` |
| C45 | Dọn repository, tài liệu hiện hành và đồng bộ GitHub | `COMPLETED` |
| C46 | Vá dependency và ổn định Supabase Auth E2E/CI | `COMPLETED` |
| C47 | Giảm gốc và tái lập chu kỳ lãi không chồng ngày | `COMPLETED` |
| C48 | Rollout C47 lên Production và đồng bộ GitHub | `COMPLETED` |
| C49 | Bố cục nút khoản vay và cuộn modal giảm gốc trên mobile | `COMPLETED` |
| C50 | Rollout C49 lên Production | `COMPLETED` |
| C51 | Remediation tính toàn vẹn nghiệp vụ, Auth, Push và bằng chứng vận hành | `COMPLETED` |
| C52 | Production readiness: backup/PITR, CI trên GitHub Free và notification runner | `COMPLETED` |
| C53 | Rollout remediation C51 lên Production và đồng bộ GitHub | `COMPLETED` |
| C54 | Khắc phục timeout dashboard Production và hoàn tất rollout C53 | `COMPLETED` |
| C55 | Rollout Google Apps Script/Sheets cho schema đối chiếu C47 | `COMPLETED` |
| C56 | Đồng bộ source C55 lên GitHub và xác nhận Required CI gate | `COMPLETED` |
| C57 | Nâng action Supabase CI khỏi Node.js 20 deprecated | `COMPLETED` |
| C58 | Hậu kiểm Production readiness sau remediation C51–C57 | `COMPLETED` |
| C59 | HTTP hardening, backup RPO bền vững và ổn định Auth E2E | `COMPLETED` |
| C60 | Hậu kiểm chu kỳ backup tự động đầu tiên | `IN_PROGRESS` |

## 3. Checkpoint đã hoàn tất: C47

Mục tiêu: cung cấp một nghiệp vụ nguyên tử để ghi khoản gốc thực trả, tự chốt lãi đến ngày trước
ngày hiệu lực và mở chu kỳ lãi mới trên dư gốc còn lại mà không tạo dòng tiền giải ngân giả.

Acceptance criteria:

1. Bản xem trước authoritative hiển thị gốc trước điều chỉnh, lãi chốt đến D-1, gốc thực trả, dư
   gốc mới, ngày bắt đầu/kết thúc kỳ mới và lãi dự kiến của kỳ mới.
2. RPC ghi nguyên tử giao dịch gốc thực tế, lãi phải trả/thu đến D-1 và mốc tái lập chu kỳ; retry
   cùng idempotency key không tạo dữ liệu trùng và dữ liệu thay đổi sau preview bị từ chối.
3. Ngày D chỉ tính lãi trên dư gốc mới. Không có ngày bị tính hai lần hoặc bỏ trống; tiền lãi đã
   thanh toán không sinh lãi và không tự chuyển thành tiền gốc.
4. Lịch nhắc, dashboard và danh sách khoản vay dùng mốc chu kỳ mới; biểu đồ dòng tiền chỉ phản ánh
   số gốc và lãi thực tế, không có khoản giải ngân tổng hợp.
5. UI có một thao tác rõ nghĩa, touch target tối thiểu 44 px, nhãn và lỗi truy cập được, bản xem
   trước bắt buộc xác nhận trước khi ghi và hoạt động ở viewport mobile 375/390 px.
6. Có migration, pgTAP cho ngày cắt kỳ/idempotency/stale preview/quyền và unit/E2E phù hợp; toàn bộ
   gate áp dụng đạt trước khi hoàn tất checkpoint.

## 4. Checkpoint hoàn tất gần nhất: C48

Mục tiêu: rollout migration và web C47 lên Production, hậu kiểm public/authenticated runtime và
đồng bộ đầy đủ source cùng bằng chứng triển khai lên GitHub.

Acceptance criteria:

1. Có logical backup Production trước migration; migration `20260922090000` áp đúng project
   `hmfxnstrqfqpvsgfmjmd` và remote migration history khớp local.
2. Deployment Production thuộc đúng Vercel project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, ở trạng
   thái Ready, Functions `sin1` và alias `tindung.vercel.app` trỏ đúng deployment mới.
3. Public smoke, authenticated smoke trên route khoản vay đã đổi, mobile 390 px, browser console
   và runtime error log đều đạt; không tạo giao dịch tài chính thật.
4. Ghi deployment/migration/smoke vào `PROJECT_CONTEXT.md`, commit và push `main` lên GitHub; CI
   Required gate đạt.
5. Nếu hậu kiểm web thất bại, rollback alias về deployment Production tốt trước đó; nếu migration
   thất bại thì dừng và không deploy web phụ thuộc schema.

## 5. Checkpoint hoàn tất gần nhất: C49

Mục tiêu: làm rõ nhóm thao tác khoản vay và bảo đảm người dùng có thể đọc, cuộn, xác nhận phương
án giảm gốc trên điện thoại.

Acceptance criteria:

1. "Giao dịch" và "Tất toán" cùng hàng, kích thước đồng đều; nút "Giảm gốc" ở hàng dưới, rộng
   theo nhóm. Dialog vẫn ghi rõ nghiệp vụ đầy đủ "Giảm gốc và mở kỳ mới" trước xác nhận.
2. Dialog dài cuộn dọc được bằng thao tác vuốt trên mobile; phần cuối và nút xác nhận luôn tiếp cận
   được ở 375/390 px, kể cả sau khi preview xuất hiện. Không gây cuộn ngang, không che bởi safe area
   hoặc bàn phím; nút đóng và keyboard navigation vẫn hoạt động.
3. Có kiểm thử hồi quy cho thứ tự/nội dung nút và khả năng cuộn tới nút xác nhận; đạt lint,
   typecheck, unit test, build và E2E áp dụng. Không đổi tính lãi, RPC, dữ liệu hay schema.
4. Chỉ sửa và kiểm chứng local; Preview/Production và GitHub push cần phê duyệt riêng.

## 6. Checkpoint hoàn tất: C50

Mục tiêu: đưa thay đổi UI C49 lên Production an toàn, có khả năng rollback và không tác động dữ
liệu tài chính.

Acceptance criteria:

1. `git diff --check`, lint, typecheck, unit test, build và E2E đạt trước deployment.
2. Candidate thuộc project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, trạng thái
   Ready và toàn bộ Functions ở `sin1`.
3. Public smoke và authenticated smoke route khoản vay ở 375/390 px xác nhận đúng bố cục ba nút,
   dialog preview cuộn tới nút xác nhận, không ghi giao dịch và không có browser/runtime error.
4. Chỉ promote sau khi candidate đạt; hậu kiểm `tindung.vercel.app` trỏ đúng deployment. Nếu hậu
   kiểm thất bại, rollback alias về deployment Production tốt trước đó.
5. Ghi bằng chứng triển khai vào `PROJECT_CONTEXT.md`; không migration, đổi secret hoặc push GitHub.

## 7. Contract không được phá vỡ

```text
LoanDirection: LENDING | BORROWING
LoanStatus: ACTIVE | OVERDUE | BAD_DEBT | SETTLED
UserRole: OWNER | EDITOR | VIEWER
TransactionType: DISBURSEMENT | INTEREST_PAYMENT | PRINCIPAL_PAYMENT | EXPENSE | REVERSAL
```

- Supabase là nguồn dữ liệu chuẩn; Google Sheets không ghi ngược.
- Giao dịch tài chính chỉ đảo/correction, không xóa vật lý.
- Tiền VND là số nguyên; lãi suất decimal; quyết toán authoritative ở PostgreSQL.
- Ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`; audit timestamp UTC.
- Notification và sync idempotent; secret không vào Git/log.

## 8. Gate chuẩn

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:auth
pnpm test:e2e
supabase db lint --level warning
supabase test db
git diff --check
```

## 9. Checkpoint hoàn tất: C51

Mục tiêu: đóng các phát hiện P1/P2 từ audit ngày 2026-09-25 trong phạm vi local, không deploy,
migrate remote, push GitHub hoặc thay đổi dữ liệu Production.

Acceptance criteria:

1. Giảm gốc cùng ngày với payment, stale preview và thứ tự reversal được bảo vệ; không có trạng
   thái `SETTLED` với dư gốc/lãi khác 0; workflow hoàn tác hiển thị đúng lịch sử.
2. `must_change_password` không thể bị xóa bằng RPC trực tiếp của authenticated; luồng đổi mật
   khẩu hợp lệ qua Server Action vẫn hoạt động.
3. Push endpoint được validate theo chính sách, nghĩa vụ đã thanh toán không còn delivery đang
   chờ, và worker trả trạng thái lỗi vận hành chính xác khi gửi thất bại.
4. Combobox đối tác cuộn lựa chọn active vào vùng nhìn thấy; dashboard fallback không đổi nghĩa
   khoảng so sánh.
5. Có regression test cho các trường hợp trên; lint, typecheck, unit, build, Auth, DB lint,
   pgTAP và E2E áp dụng đạt trên môi trường cô lập.
6. Ghi rõ bằng chứng backup/RPO, branch protection và Apps Script rollout còn thiếu; không coi
   các mục remote là đã hoàn tất nếu chưa có bằng chứng.

Kết quả C51: lint, typecheck, unit test, build, Auth 6/6, Playwright E2E 22/22, database lint và
toàn bộ pgTAP local đạt. Chưa deploy, migrate remote, push GitHub hoặc thay đổi dữ liệu Production.

## 10. Checkpoint hoàn tất: C52

Mục tiêu: kiểm chứng khả năng vận hành Production bằng bằng chứng backup/PITR, CI phù hợp GitHub
Free cho private repository, notification runner và public runtime; không migrate/deploy/push hoặc
thay đổi dữ liệu nghiệp vụ.

Acceptance criteria:

1. Backup gần nhất được xác minh đúng project, checksum/GCM, migration version, RPO 24 giờ và
   retention dry-run; nếu thiếu backup mới hoặc PITR/restore rehearsal thì phải ghi rõ là chưa đạt.
2. CI local policy/actionlint và một run GitHub gần nhất được kiểm tra. Vì OWNER chọn tiếp tục dùng
   GitHub Free với private repository, HTTP 403 của branch protection được chấp nhận là giới hạn
   nền tảng; kiểm soát bù là chỉ phát hành revision sau khi `Required CI gate` của chính SHA đó đạt.
3. Supabase Cron notification runner phải active đúng lịch, có các lần chạy gần nhất thành công;
   Production endpoint phải yêu cầu secret và public smoke không tạo notification/dữ liệu.
4. Vercel Production phải `READY`, đúng project/alias/region; `/login`, manifest và endpoint
   runner được smoke công khai; không chạy authenticated mutation.
5. Cập nhật `PROJECT_CONTEXT.md` với deployment, thời điểm, kết quả từng gate và blocker; ghi rõ
   branch protection không được enforce trên GitHub Free, và không tuyên bố `COMPLETED` khi còn
   thiếu bằng chứng RPO/PITR.

Bằng chứng ngày 2026-09-25:

- `pnpm ci:validate` đạt; GitHub run `35704013587` trên SHA `71a7509` đạt toàn bộ job và Required
  CI gate. OWNER xác nhận tiếp tục dùng GitHub Free/private; API branch protection trả HTTP 403,
  nên C52 dùng kiểm soát bù bằng bằng chứng CI theo SHA thay cho enforcement của GitHub.
- Supabase project `hmfxnstrqfqpvsgfmjmd` ở trạng thái `ACTIVE_HEALTHY`; migration remote mới nhất
  `20260922090000`. `qlv-notification-runner-hourly` active, `0 * * * *`; 10 run gần nhất đều
  `succeeded` đến 09:00 UTC.
- Vercel inspect xác nhận `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC` `READY`, target Production, Functions
  `sin1`, alias `tindung.vercel.app`; `/login` và manifest 200, runner không có secret 401. Runtime
  log ghi POST runner `200` lúc `2026-09-25T09:00:00.494Z` và GET không secret `401` lúc
  `2026-09-25T09:10:44.053Z`.
- Backup full `qlv-prod-20260922T074535Z` tạo `2026-09-22T07:45:35Z`, checksum hợp lệ nhưng tuổi
  73,45 giờ, vượt RPO 24 giờ; migration version `20260917100000`, trước C47/C51. Retention chỉ
  dry-run, chưa xóa file.
- Sau khi OWNER xác nhận, khóa AES-256-GCM mới được lưu trong macOS Keychain và backup Production
  `qlv-prod-20260925T093801Z` được stream trực tiếp qua mã hóa, không tạo plaintext. Sáu file backup
  auth/private/public/supabase_migrations đạt checksum, GCM và SQL shape; manifest khớp project,
  migration `20260922090000` và RPO 24 giờ. Retention dry-run giữ bản mới, không có candidate.
- Restore rehearsal trên Supabase PostgreSQL `17.6.1.155` cô lập đạt: số dòng 13 bảng trọng yếu
  khớp Production; 59 khóa ngoại không orphan; chín nhóm invariant tài chính/audit đều 0 lỗi;
  `calculate_loan` đạt 40/40; RLS smoke đạt. Database tạm và log tạm đã hủy sau kiểm tra; tổng thời
  gian dưới RTO 4 giờ.

Trạng thái: `COMPLETED`. Không deploy, migrate remote, push GitHub, `clasp push` hoặc thay đổi dữ
liệu nghiệp vụ; checkpoint kế tiếp không được tự động thực hiện.

## 11. Checkpoint hoàn tất: C53

Mục tiêu: rollout remediation C51 lên Supabase/Vercel Production và đồng bộ source/bằng chứng lên
GitHub theo kiểm soát bù của GitHub Free.

Acceptance criteria:

1. Backup Production trước migration đạt checksum, GCM, SQL shape và RPO 24 giờ.
2. Toàn bộ gate local đạt; migration `20260925100000_c51_integrity_remediation.sql` áp đúng project
   và remote migration history khớp local.
3. Candidate Production đúng Vercel project, `READY`, Functions `sin1`; public và authenticated
   smoke cho giảm gốc, đổi mật khẩu, notification runner và UI liên quan đạt mà không tạo giao dịch
   tài chính thật.
4. Runtime error log sạch; alias Production chỉ chuyển sau khi candidate đạt, có rollback target.
5. Commit/push fast-forward lên `main`; đối chiếu đúng SHA và chờ GitHub `Required CI gate` xanh.
6. Cập nhật context với backup, migration, deployment, smoke, runtime log, commit và CI run ID.

Chỉ chạy gate áp dụng cho checkpoint. Không tuyên bố hoàn tất khi gate bắt buộc chưa đạt.

Kết quả đến khi dừng ngày 2026-09-25:

- Backup trước migration `qlv-prod-20260925T093801Z` vẫn trong RPO 24 giờ và đạt checksum, GCM,
  SQL shape; full gate local đạt, gồm 514 pgTAP, Auth 6/6 và Playwright 22/22.
- Migration `20260925100000_c51_integrity_remediation.sql` đã áp đúng project
  `hmfxnstrqfqpvsgfmjmd`; remote history, quyền RPC và function mới đã được đối chiếu.
- Candidate `dpl_CBcpZCoGkZ8CwwcsB6heNt7pxE2C` đúng project, target Production, `READY`, Functions
  `sin1`. Public smoke và authenticated smoke cho đổi mật khẩu bắt buộc, dashboard responsive,
  combobox bàn phím và preview giảm gốc chỉ đọc đều đạt; tài khoản smoke đã bị thu hồi phiên,
  inactive/banned trở lại và không có giao dịch tài chính.
- Runtime log ghi `dashboard.read_failed { code: '57014' }`. Probe qua đúng role authenticated lặp
  ba lần đều bị PostgreSQL hủy do statement timeout sau 8.147–8.391 ms; `EXPLAIN ANALYZE` bằng
  quyền quản trị cho cùng bundle mất khoảng 8.074 ms và đọc 882.665 shared buffers. Vì acceptance
  criterion 4 chưa đạt, alias `tindung.vercel.app` vẫn ở rollback target
  `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC`; chưa commit hoặc push.

Blocker trên đã được C54 khắc phục. Source đã push fast-forward tại commit
`91a16565599a14dc739c5af6880c999e9b8febf6`; GitHub Actions run `36221129972` đạt toàn bộ job và
`Required CI gate`. Trạng thái: `COMPLETED`.

## 12. Checkpoint hoàn tất: C54

Mục tiêu: khắc phục nguyên nhân dashboard Production vượt statement timeout mà không tăng timeout
để che chi phí truy vấn, sau đó tạo candidate mới và hoàn tất các gate rollout còn lại của C53.

Acceptance criteria:

1. Có benchmark tái hiện bằng role authenticated và bằng chứng xác định điểm nóng trong
   `get_management_dashboard_bundle_v3`; thay đổi giữ nguyên số liệu authoritative cho dashboard,
   kỳ so sánh và mức tập trung đối tác.
2. Có migration tối ưu cùng pgTAP/regression cho tính đúng đắn; lời gọi bundle trên dữ liệu tương
   đương Production đạt dưới statement timeout với biên an toàn rõ ràng. Không tăng timeout role,
   không bỏ RLS và không cache số liệu tài chính sai hạn.
3. Tạo backup Production mới gồm migration C51 trước khi áp migration C54; checksum, GCM, SQL
   shape và RPO 24 giờ đạt. Full gate local và remote migration history đều đạt.
4. Candidate Production mới đúng project, `READY`, Functions `sin1`; authenticated smoke phải xác
   nhận nội dung dashboard thực sự tải, cùng các smoke C51 đã nêu, không tạo giao dịch tài chính.
5. Browser console và runtime error log sạch trong cửa sổ smoke mới. Chỉ sau đó mới chuyển alias;
   hậu kiểm alias, notification runner và rollback target đều đạt.
6. Commit/push fast-forward `main`, đối chiếu đúng SHA và chờ GitHub `Required CI gate` xanh; cập
   nhật đầy đủ bằng chứng vào context rồi đánh dấu C53 và C54 hoàn tất.

Kết quả rollout trước cổng GitHub CI:

- Migration C54 thay hai snapshot dashboard so sánh đầy đủ bằng projection authoritative đúng phần
  giao diện dùng. Production benchmark giảm từ khoảng 8,074 ms xuống 5,093 ms; ba lần gọi bằng
  authenticated role đều đạt trong 5,168–5,555 ms và không tăng statement timeout hoặc bỏ RLS.
- pgTAP so khớp profit/accrual/exposure với implementation cũ; regression 40 khoản đạt budget 6
  giây. Full gate đạt: unit 74/74, pgTAP 527/527, Auth 6/6, Playwright 22/22.
- Backup mã hóa `qlv-prod-20260925T170915Z` gồm migration C51 đạt checksum, GCM, SQL shape và RPO.
  Migration C54 đã áp Production và remote migration history khớp.
- Candidate `dpl_2EoTbJAzcGYvdieQWiWUphwMnbT6` đúng project/target/region, `READY`; public và
  authenticated smoke đạt, log sạch, không ghi giao dịch. Alias Production đã chuyển và hậu kiểm
  dashboard authenticated đạt; rollback không cần kích hoạt.

Commit `91a16565599a14dc739c5af6880c999e9b8febf6` đã push fast-forward lên `main`; local/remote
khớp SHA. GitHub Actions run `36221129972` đạt toàn bộ job và `Required CI gate`. Hậu kiểm sau
push xác nhận alias Production vẫn trỏ đúng candidate C54. Trạng thái: `COMPLETED`.

## 13. Checkpoint hoàn tất gần nhất: C55

Mục tiêu: rollout phần Google Apps Script/Sheets của C47 lên Apps Script project hiện hữu và xác
minh đồng bộ một chiều phục vụ đối chiếu, không ghi ngược vào Supabase.

Acceptance criteria:

1. Xác minh phiên `clasp`, project đích và cấu hình không chứa secret trong Git; source/dist Apps
   Script khớp trước khi đẩy.
2. Chạy các gate local áp dụng cho workspace Google Sync và xác nhận thay đổi chỉ mở rộng schema
   đối chiếu C47, không thay đổi nguồn dữ liệu chuẩn hoặc công thức quyết toán authoritative.
3. Chạy `clasp push` vào đúng Apps Script project hiện hữu; không tạo project, Sheet, thư mục Drive
   hoặc trigger mới nếu không có phê duyệt riêng.
4. Chạy smoke đồng bộ một chiều vào Google Sheet hiện hữu, xác nhận hai bảng đối chiếu C47 có đúng
   cột/dữ liệu và retry không tạo bản ghi trùng; không ghi ngược hoặc mutate Supabase.
5. Ghi Apps Script version/project, Sheet smoke, log và rollback procedure vào context; không đưa
   secret hoặc dữ liệu tài chính thật vào Git/log.

Kết quả:

- Source/dist đã khớp và được push vào đúng Apps Script project hiện hữu; immutable version 6 được
  tạo, HEAD deployment giữ nguyên. Không tạo project, Sheet, thư mục Drive hoặc trigger mới.
- Workbook hiện hữu đã full sync thành 13 tab dữ liệu. Hai tab C47 có đúng cột và số dòng nguồn;
  header có filter/frozen row và chiều rộng tối thiểu dễ đọc. Lần incremental kế tiếp giữ nguyên
  source version và số dòng, không tạo bản ghi trùng.
- Gate đạt: `git diff --check`, lint, typecheck, unit test, build; riêng Google Sync đạt 18/18 test
  và source/dist exact. Không chạy E2E/Auth/database vì không đổi các bề mặt đó.
- Không ghi ngược Supabase, không đổi dữ liệu authoritative và không đưa secret hoặc dữ liệu tài
  chính vào Git/log. Rollback dùng source trước C55 hoặc immutable version 3 để build và push lại;
  chưa cần kích hoạt.

Trạng thái: `COMPLETED` ngày 2026-09-26.

## 14. Checkpoint hoàn tất gần nhất: C56

Mục tiêu: đồng bộ thay đổi source/tài liệu C55 lên GitHub và xác nhận kiểm soát bù Required CI gate
trên đúng revision vì repository private dùng GitHub Free.

Acceptance criteria:

1. Xác minh local commit C55, `git diff --check`, secret scan áp dụng và trạng thái Apps
   Script/workbook; commit không chứa `dist`, `.clasp.json`, secret hoặc dữ liệu tài chính.
2. Chỉ push fast-forward branch `main` khi `origin/main` chưa thay đổi; đối chiếu local/remote đúng
   cùng SHA sau push.
3. Chờ GitHub Actions của đúng SHA hoàn tất và `Required CI gate` xanh; nếu lỗi hạ tầng có bằng
   chứng rõ thì chỉ rerun job thất bại, không bỏ qua gate.
4. Hậu kiểm Apps Script HEAD/version và workbook vẫn hoạt động; không deploy Vercel, chạy migration,
   thay secret, tạo tài nguyên Google hoặc sửa dữ liệu.
5. Cập nhật context với commit, CI run và kết quả hậu kiểm, sau đó đánh dấu C56 hoàn tất.

Kết quả:

- Commit C55 `fdd7254d97a58231bf918f110c23aa53257c2ded` đã push fast-forward lên `main` và
  local/remote khớp SHA.
- Gate local đạt: `git diff --check`, CI policy/actionlint, Gitleaks toàn bộ lịch sử và audit
  dependency mức high. Commit không chứa build artifact, `.clasp.json`, secret hoặc dữ liệu
  tài chính.
- GitHub Actions run `36226393389` của đúng SHA đạt tất cả job và `Required CI gate`.
- Hậu kiểm chỉ đọc xác nhận Apps Script version 6, HEAD deployment và workbook có các
  tab đối chiếu C47. Không deploy Vercel, migration, thay secret, tạo tài nguyên Google hoặc
  sửa dữ liệu.

Trạng thái: `COMPLETED` ngày 2026-09-26.

## 15. Checkpoint hoàn tất gần nhất: C57

Mục tiêu: loại bỏ cảnh báo GitHub Actions về Node.js 20 deprecated từ action thiết lập
Supabase, trong khi giữ nguyên kiểm soát pin full SHA và Required CI gate trên GitHub Free/private.

Acceptance criteria:

1. Xác minh revision chính thức của `supabase/setup-cli` hỗ trợ runtime Node.js hiện hành;
   ghi nguồn và full commit SHA, không dùng floating tag.
2. Cập nhật workflow và allowlist/policy liên quan mà không nới quyền, thay secret hoặc đổi
   phiên bản Supabase CLI đã pin ngoài phạm vi cần thiết.
3. `git diff --check`, `pnpm ci:validate` và các gate local bị tác động đều đạt; secret
   scan không phát hiện credential.
4. Push fast-forward revision đã duyệt lên `main`, chờ GitHub Actions của đúng SHA đạt
   tất cả job và `Required CI gate`, đồng thời cảnh báo Node.js 20 không còn.
5. Không deploy Vercel/Apps Script, chạy migration, thay secret, tạo tài nguyên remote hoặc
   sửa dữ liệu.

Kết quả:

- Xác minh release chính thức v3.0.1 và commit upstream được ký hợp lệ. Workflow đã pin
  `supabase/setup-cli@45a513f8c64c0bc8e0e3dfe572b5c95be85f6359`; policy local chặn quay lại
  revision cũ.
- Supabase CLI vẫn pin 2.109.0; không nới permission, thay secret hay đổi toolchain khác.
- Gate local đạt: `git diff --check`, `pnpm ci:validate`, `pnpm test`, dependency audit và
  Gitleaks trên diff.
- Commit `a24bcafdfa90c975ff465ed78422094f587d42ad` đã push fast-forward. GitHub Actions run
  `36228136823` đạt toàn bộ job và `Required CI gate`; integration log không cò cảnh báo
  Node.js 20, API annotations rỗng.
- Không deploy Vercel/Apps Script, migration, thay secret, tạo tài nguyên remote hoặc sửa dữ liệu.

Trạng thái: `COMPLETED` ngày 2026-09-26.

## 16. Checkpoint hoàn tất: C58

Mục tiêu: audit lại Production readiness sau chuỗi remediation C51–C57, dùng bằng chứng
hiện hành để chốt trạng thái phát hiện cũ và rủi ro còn lại.

Acceptance criteria:

1. Đối chiếu từng nhóm phát hiện audit về nghiệp vụ/tài chính, database, bảo mật,
   UI/UX/accessibility, hiệu năng, thông báo, kiểm thử, CI/CD và vận hành; ghi rõ
   `RESOLVED`, `ACCEPTED_RISK` hoặc `OPEN` cùng bằng chứng.
2. Kiểm tra chỉ đọc trạng thái GitHub CI/SHA, Vercel Production, Supabase/migration,
   notification runner, backup/RPO và Google Sync/Apps Script; không kích hoạt ghi dữ liệu.
3. Chạy các gate local chỉ khi cần để xác minh source hiện hành; `git diff --check`,
   secret/dependency scan và trạng thái local/remote phải được ghi nhận.
4. Kết luận mức sẵn sàng Production, liệt kê rủi ro còn lại theo mức độ nghiêm trọng
   và đề xuất checkpoint tiếp theo chỉ khi còn bằng chứng cần remediation.
5. Không deploy, migration, thay secret, tạo tài nguyên remote, push code runtime hoặc sửa
   dữ liệu trong checkpoint này.

Kết quả:

- Không còn phát hiện `CRITICAL` hoặc `HIGH`; nghiệp vụ/tài chính, database, Auth/RLS, Push,
  UI/UX/accessibility, notification và rollout hiện hành ở trạng thái `RESOLVED`.
- Vercel Production, Supabase/migration, notification runner, Apps Script/version, GitHub CI/SHA
  và backup/RPO được kiểm tra chỉ đọc. Backup hiện tại đạt RPO nhưng chưa có automation daily.
- Hai rủi ro `MEDIUM` còn mở: thiếu HTTP security headers và RPO phụ thuộc backup thủ công. Auth
  local sau reset E2E còn flaky mức `LOW`.
- Branch protection GitHub Free/private và biên hiệu năng dashboard là `ACCEPTED_RISK` với kiểm
  soát bù hiện có. Chi tiết và bằng chứng nằm trong `docs/PRODUCTION_READINESS.md`.
- Gate C58 đạt: `git diff --check`, CI policy/actionlint, dependency audit mức high và Gitleaks
  toàn bộ Git history. Không deploy, migration, đổi secret, tạo tài nguyên remote, push hoặc ghi
  dữ liệu.

Trạng thái: `COMPLETED` ngày 2026-09-26.

## 17. Checkpoint hoàn tất: C59

Mục tiêu: đóng hai rủi ro Production readiness mức `MEDIUM` và giảm lỗi CI giả đã được C58 chứng
minh, không yêu cầu nâng cấp gói GitHub trả phí.

Acceptance criteria:

1. Production trả CSP có `frame-ancestors`, chính sách chống MIME sniffing, referrer và permissions
   phù hợp; login, Supabase Auth/session, Server Actions, PWA/Push và các route chính không bị phá.
2. Có daily logical backup mã hóa fail-closed dùng secret store hiện hữu, tự kiểm checksum, GCM và
   SQL shape; cảnh báo trước khi vượt RPO 24 giờ, retention chỉ xóa sau gate và có runbook rollback.
3. Giải pháp backup không commit secret/dump và không yêu cầu nâng gói GitHub; môi trường chạy cùng
   nơi lưu bản mã hóa phải được OWNER phê duyệt trước khi bật lịch remote/local.
4. E2E không reset database dư thừa hoặc có readiness deadline/backoff đủ cho Auth; regression tái
   hiện điều kiện 502 và Required CI đạt mà không cần bỏ qua job.
5. Full gate phù hợp đạt; rollout Vercel, bật lịch backup, thay secret hoặc push chỉ thực hiện trong
   phạm vi C59 sau khi checkpoint được duyệt và có rollback rõ ràng.

Kết quả:

- Production trả đầy đủ CSP/frame policy, nosniff, referrer, permissions và COOP. Candidate
  `dpl_QQ4ymp6KrfYHngugdMdv4zu5bRrJ` `READY`, Functions `sin1`; public/authenticated smoke,
  mobile/PWA, browser console và runtime log đều đạt. Alias chính đã promote, rollback không cần.
- Backup mã hóa `qlv-prod-20260926T115433Z` gồm sáu ciphertext đạt checksum, GCM, SQL shape và
  RPO. LaunchAgent trên máy vận hành chạy mỗi giờ, tạo bản mới từ tuổi 20 giờ, thông báo khi lỗi;
  lần kickstart trả `not-due` và mã 0. Retention luôn dry-run, không tự xóa.
- CI chỉ reset database một lần trước E2E; readiness Auth dùng deadline 180 giây và backoff có giới
  hạn. Regression 502 đạt. Full local gate gồm unit 79/79, pgTAP 527/527, Auth 6/6 và E2E 23/23.
- Commit `66e2e8d88d6bb92d2b8b4fdc8c0ccc7e7c8ff7a5` đã push fast-forward. GitHub Actions run
  `36241173845` đạt ngay attempt 1 tất cả job và `Required CI gate`; secret/dependency scan sạch.

Run triển khai `36241173845` đạt attempt 1. Run tài liệu `36241927827` sau đó tái hiện Auth health
502 lâu hơn deadline 60 giây; remediation bổ sung bỏ reset đầu Auth integration đã được workflow
chuẩn bị và tăng readiness deadline lên 180 giây. Commit `0c7dca7e891290f76d8014c09c0640cb952423f1`
đã push fast-forward; run `36242767835` đạt attempt 1 toàn bộ job và `Required CI gate`.

Trạng thái: `COMPLETED` ngày 2026-09-26.

## 18. Checkpoint đang thực hiện: C60

Mục tiêu: hậu kiểm chu kỳ backup đầu tiên được LaunchAgent tự tạo sau khi đủ ngưỡng, không thay đổi
schema, dữ liệu nghiệp vụ hoặc cấu hình Production.

Acceptance criteria:

1. Sau khi backup C59 đủ 20 giờ, LaunchAgent tự tạo một backup mới mà không cần chạy tay; log ghi
   lần chạy, exit code 0 và không còn thư mục `.partial`.
2. Manifest mới khớp project/migration hiện hành; cả sáu ciphertext đạt checksum, GCM, SQL shape
   và tuổi dưới RPO 24 giờ.
3. Retention dry-run 7 daily/4 weekly/12 monthly trả danh sách keep/candidate hợp lệ và không xóa
   bất kỳ backup nào trong checkpoint.
4. Xác minh LaunchAgent vẫn loaded, lịch 3.600 giây, Keychain/secret không vào Git/log; nếu lần tự
   động thất bại thì ghi bằng chứng cảnh báo và khắc phục nguyên nhân trước khi hoàn tất.
5. Chỉ chạy gate tài liệu/script bị tác động; cập nhật context/roadmap và dừng ở checkpoint tiếp
   theo. Không deploy, migration, push runtime hoặc sửa dữ liệu tài chính.

Trạng thái: `IN_PROGRESS`. OWNER phê duyệt trong hội thoại hiện tại. Lần tự động đầu tiên sau ngưỡng
20 giờ thất bại fail-closed khi Supabase CLI ghi dump vào pipe đồng bộ (`FileSystem.writeAll (14)`),
exit 1, không để lại `.partial` và đã phát cảnh báo. Pipeline streaming đã loại trừ nghẽn buffer
nhưng chu kỳ kế tiếp xác nhận `/dev/stdout` không tương thích với launchd. Remediation hiện dùng
FIFO quyền `0600` trong `.partial`, mã hóa đọc đồng thời, giữ kiểm tra exit code riêng và luôn dọn
FIFO; chờ chính LaunchAgent chạy lại để xác minh, không tạo backup thủ công.
