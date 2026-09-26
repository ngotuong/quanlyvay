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
| C53 | Rollout remediation C51 lên Production và đồng bộ GitHub | `IN_PROGRESS` |
| C54 | Khắc phục timeout dashboard Production và hoàn tất rollout C53 | `IN_PROGRESS` |

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

## 11. Checkpoint đang hoàn tất: C53

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

Blocker trên đã được C54 khắc phục. C53 tiếp tục ở `IN_PROGRESS` cho đến khi source được push và
Required CI gate của đúng SHA đạt.

## 12. Checkpoint đang thực hiện: C54

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

Trạng thái: `IN_PROGRESS`, còn commit/push và Required CI gate đúng SHA.
