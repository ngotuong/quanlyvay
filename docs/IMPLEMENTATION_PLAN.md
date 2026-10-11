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
| C60 | Hậu kiểm chu kỳ backup tự động đầu tiên | `COMPLETED` |
| C61 | Đồng bộ remediation backup C60 lên GitHub và xác nhận CI | `COMPLETED` |
| C62 | Audit sâu UI/UX và thiết kế lại trải nghiệm thao tác | `COMPLETED` |
| C63 | Sửa vòng đời drawer, thông báo và trạng thái tải | `COMPLETED` |
| C64 | Thiết kế lại shell, dashboard, danh sách và chi tiết | `COMPLETED` |
| C65 | Đồng bộ backlog local và rollout UI/UX C62–C64 | `COMPLETED` |
| C66 | Hậu kiểm UI/UX trên thiết bị thật và công nghệ hỗ trợ | `COMPLETED` |
| C67 | Sửa privacy accessibility, reflow zoom và modal navigation | `COMPLETED` |
| C68 | Đồng bộ và rollout remediation accessibility C67 | `COMPLETED` |
| C69 | Rollout remediation accessibility lên Production | `COMPLETED` |
| C70 | Hậu kiểm accessibility Production trên screen reader/mobile | `COMPLETED` |
| C71 | Audit sâu UI/UX và hiệu quả thao tác mobile–desktop | `COMPLETED` |
| C72 | Remediation bản nháp, thông báo và bố cục mobile | `COMPLETED` |
| C73 | Đồng bộ và rollout remediation C70–C72 | `COMPLETED` |
| C74 | Audit hành trình và backlog UI/UX sau rollout | `COMPLETED` |
| C75 | Remediation ngữ cảnh công việc và thông báo | `COMPLETED` |
| C76 | Đồng bộ và rollout remediation C74–C75 | `COMPLETED` |
| C77 | Audit privacy biểu đồ, focus và artifact triển khai còn mở | `COMPLETED` |
| C78 | Sửa privacy biểu đồ, initial focus và upload guard local | `COMPLETED` |
| C79 | Đồng bộ, rollout C78 và dọn đúng hai deployment C73 cũ | `COMPLETED` |
| C80 | Audit UX Production C79 và phương án desktop compact | `COMPLETED` |
| C81 | Compact dashboard/danh sách desktop và sửa UX F1–F4, local | `COMPLETED` |
| C82 | Đồng bộ C80/C81, CI và rollout UI compact lên Preview/Production | `COMPLETED` |
| C83 | Audit module còn lại và lựa chọn Sáng/Tối/Theo thiết bị với Evon ui-ux | `COMPLETED` |
| C84 | Sửa F1–F7, lifecycle cài đặt và bộ chọn giao diện theo phương án C83 | `COMPLETED` |
| C85 | Đồng bộ C83/C84, CI và rollout UI/theme lên Preview/Production | `COMPLETED` |
| C86 | Audit hiệu quả thao tác sau phát hành C85 với Evon ui-ux | `COMPLETED` |
| C87 | Remediation phân vùng, chữ, control phụ, startup và pagination theo C86 | `COMPLETED` |
| C88 | Đồng bộ C86/C87 B, Required CI và rollout Preview/Production | `COMPLETED` |
| C89 | Nghiệm thu trải nghiệm B sau C88 và chốt backlog UX | `COMPLETED` |
| C90 | Sửa cách đọc VND và hàng tab chi tiết khoản vay theo C89 | `COMPLETED` |
| C91 | Đồng bộ và phát hành bản sửa C90 lên Preview/Production | `COMPLETED` |
| C92 | Chốt thiết kế đích UI/UX và cách đo nghiệm thu | `COMPLETED` |
| C93 | Chuẩn hóa tokens/CSS và UI primitives, giữ hình đã duyệt | `COMPLETED` |
| C94 | Khả năng đọc, bảng mobile và tên dài theo thiết kế đích | `COMPLETED` |
| C95 | Quick Amount cho nhập VND chính xác, thuận tiện | `COMPLETED` |
| C96 | Drawer thu/trả lãi ngay Dashboard với lifecycle đầy đủ | `COMPLETED` |
| C97 | Loading đúng từng màn và motion có chọn lọc | `COMPLETED` |
| C98 | Nghiệm thu tổng hợp và phát hành chuỗi UI/UX | `IN_PROGRESS` |

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

## 18. Checkpoint hoàn tất: C60

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

Kết quả:

- LaunchAgent tự tạo `qlv-prod-20260927T120432Z` ở chu kỳ 26, exit 0; manifest đúng project và
  migration hiện hành. Sáu ciphertext đạt checksum, GCM và SQL-shape; RPO phục hồi với tuổi hậu
  kiểm 0,83 giờ. Không còn `.partial`, FIFO hoặc SQL thuần.
- Retention 7/4/12 chạy dry-run, giữ bốn bản và trả một candidate; không xóa file. LaunchAgent vẫn
  loaded với interval 3.600 giây, threshold 20 giờ; quyền backup/manifest/ciphertext là `0700/0600`.
  Keychain không vào Git/log và scan log không thấy connection string, token hoặc key.
- Ba lớp lỗi môi trường đều fail-closed và phát cảnh báo: thu dump đồng bộ, dùng thiết bị/FIFO làm
  `--file`, và parser chỉ nhận JSON. Implementation cuối stream stdout mặc định trực tiếp sang
  AES-256-GCM với backpressure, kiểm exit code riêng và nhận cả JSON/bảng migration. Regression
  scripts đạt 22/22; riêng backup/schedule đạt 10/10.
- Backup C59 vượt RPO khoảng 10 phút trong khi remediation, sau đó bản tự động mới phục hồi RPO.
  Không chạy backup thủ công, deploy, migration, push runtime hoặc sửa dữ liệu tài chính.

Trạng thái: `COMPLETED` ngày 2026-09-27.

## 19. Checkpoint đã hoàn tất: C61

Mục tiêu: đồng bộ source và bằng chứng C60 lên GitHub, rồi xác nhận kiểm soát bù Required CI trên
đúng revision cho repository private dùng GitHub Free.

Acceptance criteria:

1. Đối chiếu toàn bộ commit local C60, `git diff --check`, test script, secret/dependency scan; không
   chứa backup, ciphertext, SQL thuần, credential hoặc dữ liệu tài chính.
2. Chỉ push fast-forward `main` khi `origin/main` vẫn ở revision C59 đã xác minh; local/remote phải
   khớp cùng SHA sau push.
3. GitHub Actions của đúng SHA đạt toàn bộ job và `Required CI gate`; không bỏ qua job thất bại.
4. Hậu kiểm LaunchAgent vẫn loaded, lần chạy sau backup mới trả `not-due`, exit 0 và RPO còn đạt.
5. Không deploy Vercel/Apps Script, chạy migration, thay secret, xóa backup hoặc sửa dữ liệu.

Kết quả: `COMPLETED` qua C65 ngày 2026-09-30. Chuỗi C60 được push fast-forward nguyên vẹn;
full-history secret scan, dependency audit và GitHub `Required CI gate` của đúng revision đều đạt.
Hậu kiểm LaunchAgent/backup đã hoàn tất trong C60; không deploy Production, migration, thay secret,
xóa backup hoặc sửa dữ liệu nghiệp vụ.


## 20. Checkpoint đã hoàn tất: C62

Mục tiêu: đánh giá sâu chất lượng trải nghiệm thực tế, thẩm mỹ và hiệu quả thao tác của webapp;
chuyển phản hồi OWNER ngày 2026-09-29 thành backlog remediation có bằng chứng và tiêu chí đo được.
Đề xuất ưu tiên C62 trước C61 theo yêu cầu mới; C61 vẫn chờ duyệt, không tự push các commit C60.
Đây là checkpoint audit và thiết kế đề xuất, chưa phải checkpoint triển khai UI.

Phạm vi:

- Lập inventory toàn bộ route, màn hình theo quyền và component tương tác; bao gồm đăng nhập/đổi
  mật khẩu, dashboard, danh sách/chi tiết khoản vay, đối tác, giao dịch, tất toán, giảm gốc, đảo/sửa
  giao dịch, chi phí, lịch nhắc/thông báo, báo cáo và quản trị hiện có. Ghi rõ màn hình không áp dụng.
- Theo dõi hành trình từ mở URL/PWA, kiểm tra phiên đăng nhập, đăng nhập, điều hướng menu/tab trong
  app, quay lại bằng browser, đổi bộ lọc và quay lại tab trình duyệt. Kiểm loading/skeleton/progress,
  màn trắng, nháy login, giữ vị trí cuộn/bộ lọc, dữ liệu cũ, timeout, mất mạng và phục hồi kết nối.
- Audit toàn bộ form/drawer/modal: mở → nhập → validate → gửi → thành công/thất bại → đóng/mở lại;
  ghi nhận số click/tap/cuộn/nhập lặp, trạng thái pending, chặn gửi trùng, lỗi field, dữ liệu chưa lưu,
  bàn phím mobile, focus, toast và dữ liệu danh sách sau lưu. Tái hiện ưu tiên lỗi lưu xong drawer
  không đóng; phân biệt hành vi đã tái hiện, nguy cơ từ code và phản hồi chưa tái hiện.
- Đánh giá hệ thống thị giác: hierarchy, mật độ, typography tiếng Việt, cách đọc tiền/ngày, màu
  semantic, khoảng cách, căn chỉnh, icon, bảng/card, CTA chính/phụ, tính nhất quán giữa màn hình,
  trạng thái empty/error/disabled và chuyển động. Đối chiếu docs/DESIGN_SYSTEM.md với giao diện thật.
- Mobile 375/390 px, tablet 768 px, desktop 1024/1440 px; thêm mobile landscape, zoom 200%,
  reduced-motion, bàn phím, focus trap/restore, nhãn/lỗi/live region, contrast và vùng chạm.
  Audit WCAG 2.2 AA các tiêu chí áp dụng, không suy ra toàn bộ compliance từ một công cụ tự động.
- Đo hiệu năng cảm nhận: thời gian phản hồi click, xuất hiện loading, hoàn tất điều hướng/lưu,
  giật layout, render/scroll và network waterfall trên luồng trọng yếu; ghi cấu hình mạng/CPU,
  số lần đo và môi trường, tách thời gian backend khỏi khả năng phản hồi giao diện.

Acceptance criteria:

1. Có báo cáo docs/UI_UX_AUDIT_C62.md ghi revision local, diff chưa đồng bộ GitHub, môi trường,
   ma trận màn hình × viewport × trạng thái với PASS/FAIL/BLOCKED/NOT_TESTED; không dùng CI xanh
   hoặc audit C58 làm bằng chứng thay cho kiểm tra trải nghiệm hiện tại.
2. Mỗi phát hiện có ID, mức CRITICAL/HIGH/MEDIUM/LOW, loại functional/usability/visual/accessibility/
   performance, bước tái hiện, expected/actual, file:dòng, tác động, nguyên nhân đã xác minh hoặc
   giả thuyết, hướng sửa và regression/acceptance criteria. Bằng chứng ảnh/video/trace dùng dữ liệu
   tổng hợp hoặc che thông tin cá nhân; ghi rõ nguồn local/browser/Production và độ chắc chắn.
3. Ba nhóm OWNER phản ánh phải được kiểm tra rõ: trải nghiệm tải lúc mở/đăng nhập/chuyển tab;
   vòng đời drawer sau lưu; thao tác thừa và bố cục. Lập baseline số thao tác ít nhất cho tạo khoản
   vay, ghi thanh toán, tất toán, giảm gốc, sửa đối tác và tìm khoản đến hạn; đề xuất luồng ít thao
   tác hơn nhưng giữ xác nhận cần thiết cho nghiệp vụ tài chính.
4. Có đặc tả trạng thái mục tiêu: phản hồi pending nhìn thấy khi đang chờ; không báo thành công
   hoặc tự đóng trước server xác nhận; lưu thành công đóng drawer của tác vụ đã hoàn tất, cập nhật
   danh sách/toast và trả focus hợp lý; lưu lỗi giữ drawer và nội dung nhập, đưa focus tới lỗi;
   đóng khi còn dữ liệu chưa lưu/pending có hành vi nhất quán. Luồng nhập liên tiếp là ngoại lệ
   cần nêu rõ. Không thêm delay giả hoặc splash bắt buộc cho mọi chuyển tab.
5. Có đề xuất design system và wireframe/mockup dùng dữ liệu tổng hợp cho tối thiểu app shell,
   dashboard, danh sách/chi tiết khoản vay, drawer giao dịch và loading/auth; thể hiện cả mobile
   và desktop, giải thích hierarchy/spacing/CTA và trạng thái tương tác. Đây là phương án để duyệt,
   không tự thay theme hoặc viết lại giao diện.
6. Xếp backlog theo tác động/tần suất/rủi ro/chi phí; đề xuất checkpoint remediation tiếp theo có
   phạm vi, thứ tự và acceptance criteria kiểm chứng được. Nêu rõ các thiếu hụt E2E hiện tại.
7. Kiểm browser và luồng ghi bằng fixture tổng hợp trên local/test DB cô lập đã xác minh đích;
   không reset database chưa xác minh, không mutate Production/Preview dùng chung. Remote chỉ đọc
   với phiên sẵn có; nếu thiếu phiên thì ghi blocker, không tự đổi tài khoản/secret. Không deploy,
   push, migration remote hoặc sửa code sản phẩm trong audit. Có thể tạo tài liệu, mockup và
   harness kiểm tra local phục vụ bằng chứng. Chạy gate hiện hữu liên quan; ghi test thực chạy,
   kết quả và phần chưa kiểm chứng, kiểm git diff --check/status trước khi kết thúc.

Trạng thái: `COMPLETED` ngày 2026-09-30. OWNER đã phê duyệt trong hội thoại hiện tại.
Báo cáo `docs/UI_UX_AUDIT_C62.md` gồm 12 phát hiện, matrix PASS/FAIL/NOT_TESTED, 45 lượt layout,
30 ảnh synthetic, mockup tương tác và backlog. Audit riêng 1/1, full E2E 23/23 (audit opt-in skip),
lint/typecheck/build qua E2E và diff check đạt. Giới hạn thiết bị thật/cold auth/screen reader/zoom
thật được ghi rõ, không chứng nhận toàn UI đạt. Chỉ thêm tài liệu/mockup/harness, không code sản phẩm,
remote mutation, commit/push/deploy. C63 chờ duyệt; C61 vẫn chờ riêng.


## 21. Checkpoint đề xuất: C63

**C63 — Sửa vòng đời drawer, thông báo và trạng thái tải.** Trạng thái: `COMPLETED`.
OWNER đã phê duyệt trong hội thoại ngày 2026-09-30.
Nguồn: audit C62, UX01–05/UX09. Ưu tiên làm thao tác đúng và rõ trước khi thay bố cục diện rộng.

Phạm vi được đề xuất:

- Payment, tất toán, giảm gốc: nối kết quả server với lifecycle drawer; success đóng/reset đúng
  tác vụ, cập nhật nội dung và focus; lỗi giữ input. Chuẩn hóa dirty/pending cho nút đóng, Escape,
  backdrop và drag; không dùng nút disabled làm đại diện duy nhất cho pending.
- Sửa trạng thái preview giảm gốc rỗng/0/invalid; giữ stale-preview, validation, idempotency và
  tính toán authoritative hiện có. Không thay công thức lãi, schema, RPC hoặc chính sách tài chính.
- Toast/live region dựa trên lần thao tác, hai lần thành công cùng message vẫn phản hồi; không
  thông báo hai lần hoặc đặt phản hồi thiết yếu sau dialog đang inert.
- Progress chỉ chạy khi điều hướng được thực hiện, kết thúc theo kết quả; cancel không treo,
  request lâu vẫn báo chờ. Kiểm click/menu/query/back/forward.
- Tái hiện cold auth 2s/10s, mở deep-link, hết phiên và quay lại tab. Nếu xác nhận khoảng trống
  feedback, bổ sung fallback auth/shell tối thiểu không chứa dữ liệu riêng tư; không splash giả hay
  làm lại toàn app mỗi lần chuyển tab. Nếu cần đổi kiến trúc Auth thì ghi đề xuất riêng và dừng phần đó.
- Bổ sung regression E2E có ý nghĩa, cập nhật context/roadmap cùng bằng chứng. Có thể local commit.
  Không deploy, push, migration remote, thay secret hoặc ghi dữ liệu Production/Preview.

Acceptance criteria:

1. Ở 375/390/1440 px, payment/tất toán/giảm gốc thành công đóng đúng một lần sau server commit;
   dữ liệu mới nhìn thấy, toast đọc được và focus về trigger hoặc vị trí thay thế hợp lý. Mở lại
   không giữ thông báo/preview thành công cũ; luồng nhập liên tiếp nếu có phải là lựa chọn rõ ràng.
2. Validation, network failure và stale preview không tự close/reset; input còn nguyên, focus tới
   lỗi hợp lý. Double-click không ghi trùng. Draft hỏi giữ/bỏ một lần; form rỗng đóng được; pending
   hiển thị rõ, không có nút đóng vô hiệu mà không phản hồi.
3. Hai thao tác hợp lệ liên tiếp cùng message đều báo kết quả một lần. Rỗng/0/vượt gốc/đổi ngày/
   nhập nhanh không để spinner vô hạn hoặc dùng preview cũ; giữ xác nhận tài chính.
4. Hủy navigation không còn progress sau frame tiếp theo; delay 10s vẫn có feedback trước khi
   kết thúc. Kiểm back/forward/query-only/same-route, không progress giả hay mất bộ lọc bất ngờ.
5. Có bằng chứng cold auth, hết phiên và resume; nếu cần fallback thì thấy trạng thái chờ khi
   response bị giữ 2s/10s, không flash login sai và không lộ dữ liệu trước Auth. Không thêm delay.
6. Keyboard focus, Escape, reduced-motion, viewport bàn phím thấp đạt E2E; đối chiếu dark/light.
   Ghi rõ phần screen reader/thiết bị thật còn cần kiểm, không tự tuyên bố WCAG toàn app.
7. `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`
   đạt. Chỉ fixture trong test DB cô lập đã xác minh; giữ nguyên code nghiệp vụ authoritative.

Sau C63 mới đề xuất checkpoint triển khai visual UX06–08/10–11: shell/dashboard/list/detail,
filter compact, list-first đối tác, typography/vùng chạm và trạng thái empty theo mockup C62.
Checkpoint visual chưa được phê duyệt; C61 đồng bộ GitHub vẫn chờ riêng.

Kết quả: hoàn tất local ngày 2026-09-30. Báo cáo và giới hạn bằng chứng tại
`docs/UI_UX_REMEDIATION_C63.md`. Gate đạt: diff check, lint, typecheck, 80 unit/script test,
production build và Playwright 32/32 bài chạy (1 audit harness skip đúng chủ đích). Không thay
schema/RPC/công thức tài chính, không deploy hoặc push.

## 22. Checkpoint đề xuất: C64

**C64 — Thiết kế lại shell, dashboard, danh sách và chi tiết.** Trạng thái: `COMPLETED`.
OWNER đã phê duyệt trong hội thoại ngày 2026-09-30.
Nguồn: audit C62 UX06–08/10–11 và mockup `docs/audit-c62/proposal.html`.

Phạm vi đề xuất:

- Chuẩn hóa shell desktop/mobile, hierarchy, typography, spacing, surface và vùng chạm theo design
  system cobalt sáng hiện hữu; giữ dark mode và privacy mode.
- Làm dashboard ưu tiên việc cần xử lý, CTA đúng ngữ cảnh và empty state gọn; giảm card/border và
  nội dung lặp nhưng không đổi số liệu authoritative.
- Làm danh sách khoản vay có filter compact, trạng thái bộ lọc rõ và không mất query/back-forward;
  chi tiết khoản vay ưu tiên số dư, hành động và lịch sử theo hierarchy mới.
- Chuyển đối tác sang list-first có search; form thêm chỉ mở theo CTA. Edit thành công thu gọn và
  giữ đúng page/search; lỗi giữ draft.
- Nâng hit area hành động thường dùng lên tối thiểu 44 px theo contract nội bộ, giữ keyboard/focus,
  reduced-motion, light/dark và responsive 320–1440 px.
- Chỉnh UX10: retry preview chỉ hiện khi lỗi/stale; không thay xác nhận tài chính, RPC, schema hoặc
  công thức. Bổ sung E2E/visual evidence local. Không deploy, push hay ghi dữ liệu remote.

Acceptance criteria:

1. Dashboard ở 375/390/768/1024/1440 px cho thấy việc đến hạn và CTA chính trước báo cáo; dataset
   rỗng/ít/nhiều không tạo khối chart vô nghĩa, không đổi giá trị tài chính.
2. Danh sách khoản vay dùng filter compact, query deep-link/back-forward ổn định; không tràn ngang,
   không che nội dung khi bàn phím mở và thao tác chính không vượt quá baseline C62.
3. Chi tiết khoản vay có hierarchy rõ cho trạng thái, dư gốc/lãi, action và lịch sử; drawer C63 vẫn
   đạt toàn bộ lifecycle, idempotency, focus và stale guard.
4. Đối tác list-first có tìm kiếm; thêm/sửa/cancel/error giữ đúng draft và page/search; thao tác sửa
   một đối tác đã tìm không quá 3 quyết định click/tap ngoài nhập liệu.
5. Control thường dùng đạt hit area nội bộ >=44 px; keyboard, focus visible, Escape, reduced-motion,
   privacy mode, light/dark và 200% text không mất chức năng.
6. Retry tất toán/giảm gốc chỉ xuất hiện khi lỗi hoặc stale; happy path tự tải preview và giữ bước
   xác nhận tiền rõ ràng.
7. Có ảnh/evidence đối chiếu mockup ở mobile/desktop và ghi rõ giới hạn thiết bị thật/screen reader;
   không tự tuyên bố WCAG toàn app.
8. `git diff --check`, lint, typecheck, unit, build và full E2E đạt trên DB test cô lập. Cập nhật
   context/roadmap cùng thay đổi; dừng chờ checkpoint rollout riêng nếu cần Production/GitHub.

Kết quả: hoàn tất local ngày 2026-09-30. Dashboard ưu tiên việc cần xử lý và không dựng chart rỗng;
filter khoản vay compact; card/detail có hierarchy rõ; đối tác list-first có search và form theo CTA;
retry preview chỉ hiện khi lỗi/stale. Báo cáo và ảnh tại `docs/UI_UX_REMEDIATION_C64.md` và
`docs/audit-c64/`. Gate đạt: diff check, lint, typecheck, 80/80 unit/script test, production build,
Playwright 35 bài chạy PASS và 1 audit harness skip đúng chủ đích. Không đổi nghiệp vụ tài chính,
schema/RPC, không deploy hoặc push.

## 23. Checkpoint đã hoàn tất: C65

**C65 — Đồng bộ backlog local và rollout UI/UX C62–C64.** Trạng thái: `COMPLETED`.
OWNER đã phê duyệt trong hội thoại ngày 2026-09-30.

Phạm vi đề xuất:

- Rà soát sáu commit C60 đang ahead `origin/main` cùng diff local C62–C64, secret/data scan và tạo
  commit UI/UX có thể review; push toàn chuỗi fast-forward lên GitHub sau khi local gate vẫn đạt.
  C65 hoàn tất luôn mục tiêu đồng bộ của C61, không tạo push song song hoặc bỏ sót lịch sử C60.
- Xác nhận Required CI gate của đúng SHA trước rollout.
- Tạo Vercel Preview theo `pnpm deploy:preview`, smoke public/authenticated mobile–desktop và chỉ
  chuyển stable alias sau khi candidate đạt toàn bộ gate bắt buộc trong `AGENTS.md`.
- Hậu kiểm alias, runtime logs, UI chính và rollback target. Không migration, đổi secret, Apps
  Script/Sheets hoặc sửa dữ liệu tài chính.

Acceptance criteria:

1. Sáu commit C60 hiện hữu được giữ nguyên; commit mới chỉ chứa C62–C64. Toàn chuỗi không chứa
   secret, dump, dữ liệu tài chính thật hoặc artifact test tạm; GitHub fast-forward và Required CI
   đúng SHA đạt.
2. Preview candidate đúng project/target/region, immutable URL Ready và đạt public/authenticated
   smoke ở dashboard, khoản vay, chi tiết, đối tác cùng các drawer tài chính.
3. Stable alias chỉ đổi sau gate; hậu kiểm alias, console/runtime log và rollback target đạt. Nếu
   hậu kiểm lỗi, alias được trả về deployment tốt trước đó.
4. Context/roadmap ghi commit, run CI, deployment ID/URL/alias/region và kết quả smoke; không thay
   schema, secret, Apps Script/Sheets hoặc dữ liệu nghiệp vụ.

Kết quả: hoàn tất ngày 2026-09-30.

- Commit `9a1497b54a62b42ca93e79a518a7dcfc178fc155` giữ nguyên sáu commit C60 và chứa C62–C64;
  full-history gitleaks cùng `pnpm audit --audit-level high` sạch sau khi pin hai dải
  `brace-expansion` đã vá. GitHub run `36697102128` attempt 2 đạt toàn bộ job và `Required CI gate`
  trên đúng SHA; attempt 1 đã dừng fail-closed do Supabase Auth local trả HTTP 502 trước E2E.
- Gate rollout đạt: `pnpm ci:validate`, diff check, lint, typecheck, 80/80 unit/script, build 19
  route, Playwright 35 PASS + 1 audit skip có chủ đích, DB lint sạch, pgTAP 527/527 và Auth 6/6.
- Candidate `dpl_FrsRPc3CqyKpkdkutFGCZ16Foq5u`, immutable URL
  <https://quan-ly-vay-ca-nhan-nbkpg4jcj-ngotuong2105.vercel.app>, project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `preview`, `Ready`, Functions `sin1`. Public và
  authenticated smoke đạt trên candidate và <https://tindung-preview.vercel.app> ở 1440×960 và
  390×844: dashboard, danh sách/chi tiết khoản vay, đối tác và bốn drawer đối tác/giao dịch/tất
  toán/giảm gốc đều hoạt động. Không xác nhận thao tác tài chính; tài khoản kỹ thuật được
  deactive/ban sau smoke.
- App console sạch; 9 CSP message được tách riêng là Vercel Toolbar chèn vào Preview. Runtime error
  và HTTP 500 log của deployment đều rỗng. Alias trỏ đúng candidate; rollback target đã xác minh
  `dpl_AjvS8ir8eeq8t4V4YmKc12ymedWu`, không kích hoạt rollback. Không đổi schema/migration,
  secret, Apps Script/Sheets, dữ liệu nghiệp vụ hoặc Production alias.

## 24. Checkpoint đã hoàn tất: C66

**C66 — Hậu kiểm UI/UX trên thiết bị thật và công nghệ hỗ trợ.** Trạng thái: `COMPLETED`.
OWNER phê duyệt trong hội thoại ngày 2026-10-01.

Mục tiêu: khép các giới hạn bằng chứng còn lại sau C62–C65 bằng kiểm tra trực tiếp trên thiết bị,
trình duyệt và công nghệ hỗ trợ thật; chuyển mọi sai lệch tái hiện được thành backlog có mức độ,
phạm vi và acceptance criteria rõ ràng.

Phạm vi đề xuất:

- Kiểm VoiceOver trên Safari/iPhone và TalkBack trên Chrome/Android cho đăng nhập, shell, dashboard,
  danh sách/chi tiết khoản vay, đối tác và các drawer tài chính; đối chiếu thứ tự đọc, tên/role,
  trạng thái, focus, thông báo lỗi và thao tác bằng bàn phím/switch.
- Kiểm bàn phím mềm, safe-area, xoay màn hình, zoom trình duyệt 200–400%, cỡ chữ hệ thống và các
  viewport mobile/desktop thực; đo che khuất CTA, tràn ngang, mất focus và thao tác thừa.
- Kiểm cold auth, chuyển tab, mạng chậm/mất mạng/khôi phục, submit đang chờ và thông báo; không xác
  nhận thao tác tài chính hoặc sửa dữ liệu thật.
- Lưu evidence đã khử dữ liệu nhạy cảm, phân loại phát hiện và đề xuất checkpoint remediation riêng;
  không sửa code, migration, secret, deploy hoặc push runtime trong checkpoint audit này.

Acceptance criteria:

1. Có ma trận thiết bị/trình duyệt/công nghệ hỗ trợ và trạng thái PASS/FAIL/NOT_TESTED cho các hành
   trình ưu tiên; giới hạn thiếu thiết bị/tài khoản được ghi rõ, không suy diễn.
2. Mỗi lỗi có bước tái hiện, route/viewport, bằng chứng, tác động, mức độ và hướng sửa; dữ liệu/tài
   khoản kỹ thuật được dọn sau kiểm tra và không có giao dịch tài chính mới.
3. Các luồng focus, screen reader, bàn phím mềm, zoom và mạng chậm được kiểm trên môi trường phù hợp;
   console/runtime log được đối chiếu khi có lỗi.
4. Context/roadmap được cập nhật cùng thay đổi, `git diff --check` đạt và checkpoint remediation kế
   tiếp chỉ đặt `AWAITING_APPROVAL` sau khi audit hoàn tất.

Kết quả: hoàn tất ngày 2026-10-01. Báo cáo `docs/UI_UX_AUDIT_C66.md` ghi 2 HIGH, 2 MEDIUM và
1 LOW. Chrome thật tái hiện privacy mode lộ số tiền qua accessible name, bottom navigation chồng
chữ ở zoom 400% và focus thoát sheet **Thêm**; accessibility tree cũng xác nhận heading dashboard
nhảy cấp. Safari login có semantic/focus đúng và reflow đạt ở 200%. Full E2E cô lập đạt 35 PASS +
1 audit skip. VoiceOver/TalkBack, bàn phím mềm và safe-area trên điện thoại thật giữ `NOT_TESTED`
do không có thiết bị/simulator phù hợp. Không sửa code, dữ liệu, deploy hoặc push.

## 25. Checkpoint đã hoàn tất: C67

**C67 — Sửa privacy accessibility, reflow zoom và modal navigation.** Trạng thái: `COMPLETED`.
OWNER phê duyệt trong hội thoại ngày 2026-10-01.

Mục tiêu: khắc phục năm phát hiện C66 mà không thay đổi nghiệp vụ tài chính, schema/RPC, quyền hoặc
dữ liệu Production.

Phạm vi đề xuất:

- Loại số tiền thật khỏi accessible name/title khi privacy mode bật và rà các bề mặt tiền tương tự.
- Sửa bottom navigation để reflow đến zoom trình duyệt thật 400% mà không chồng chữ hoặc che CTA.
- Giữ focus trong sheet **Thêm**, khôi phục focus về trigger và công bố trạng thái/quan hệ dialog.
- Sửa outline heading dashboard và bổ sung regression semantic cho ba trạng thái banner.
- Chỉ triển khai local và test trong checkpoint này; rollout/deploy/push cần checkpoint riêng.

Acceptance criteria:

1. Privacy accessibility snapshot/tooltip không chứa giá trị tiền thật khi đang ẩn; khi hiện vẫn
   đọc đúng số tiền và ngữ cảnh trên dashboard, khoản vay, chi tiết và thông báo.
2. Chrome/Safari ở zoom 200/250/300/400% không chồng chữ, tràn ngang hai chiều hoặc che CTA/nav;
   focus indicator luôn nhìn thấy và điều hướng chính dùng được bằng bàn phím.
3. Sheet **Thêm** giữ Tab/Shift+Tab trong dialog; Escape/backdrop/nút đóng hoạt động, focus trả về
   trigger và `aria-expanded`/`aria-controls` đồng bộ đúng.
4. Dashboard có outline heading liên tục cho ba trạng thái banner; tên/role/state không phụ thuộc
   icon hoặc CSS.
5. Regression mới chứng minh lỗi baseline và bản sửa; diff check, lint, typecheck, unit, build và
   full E2E đạt. Thiết bị/công nghệ hỗ trợ chưa có vẫn ghi `NOT_TESTED`, không suy diễn PASS.

Kết quả: hoàn tất local ngày 2026-10-01. Privacy accessible name/tooltip, reflow bottom nav,
focus/semantic sheet **Thêm** và heading dashboard đã được sửa. Chrome thật đạt ở zoom 400%; Safari
thật đạt ở mức zoom tối đa trình duyệt hỗ trợ và được trả về kích cỡ thực. Regression C67 4/4,
full E2E 39 PASS + 1 audit skip, lint, typecheck, 80/80 unit/script và build 19 route đều đạt.
Tài khoản/DB test synthetic đã dọn; không đổi schema/RPC/nghiệp vụ, remote data, deploy hoặc push.
Bằng chứng và giới hạn tại `docs/UI_UX_REMEDIATION_C67.md`.

## 26. Checkpoint đã hoàn tất: C68

**C68 — Đồng bộ và rollout remediation accessibility C67.** Trạng thái: `COMPLETED`.

Mục tiêu: đưa commit tài liệu C66 và source C67 đã qua gate lên GitHub/Vercel, xác minh runtime thật
và giữ đường rollback rõ ràng.

Phạm vi đề xuất:

- Rà diff/secret/data, tạo local commit C67 và push fast-forward chuỗi C66–C67 lên GitHub.
- Xác nhận Required CI gate của đúng SHA trước rollout.
- Tạo Vercel Preview bằng `pnpm deploy:preview`, smoke immutable URL ở Chrome/Safari cho privacy
  accessible name, heading, bottom nav zoom 200–400% hoặc mức tối đa trình duyệt và sheet **Thêm**.
- Chỉ chuyển stable alias sau toàn bộ gate; hậu kiểm alias, runtime log và rollback target. Nếu
  OWNER muốn đưa thẳng Production trong C68, phải nêu rõ trước khi thực hiện phần Production.
- Không migration, đổi secret, Apps Script/Sheets hoặc xác nhận giao dịch tài chính.

Acceptance criteria:

1. GitHub nhận đúng chuỗi C66–C67, không secret/dump/dữ liệu tài chính thật; Required CI của đúng
   SHA đạt toàn bộ job.
2. Candidate đúng Vercel project/target/region, `Ready`; public/authenticated smoke đạt và không có
   runtime error mới.
3. Privacy mode không lộ tiền qua accessibility tree/tooltip; bottom nav không chồng ở Chrome 400%
   và mức zoom tối đa Safari; modal focus/state và heading outline khớp C67.
4. Stable Preview alias chỉ đổi sau gate và smoke lại đạt; rollback target được xác minh. Production
   không đổi nếu chưa được OWNER phê duyệt rõ trong C68.
5. Context/roadmap ghi commit, CI run, deployment/alias/region/smoke; `git diff --check` và status
   cuối được đối chiếu.

Blocker preflight 2026-10-01: chính sách CI và gitleaks toàn lịch sử đạt, nhưng dependency audit
fail-closed vì `next@16.3.5` dính `GHSA-vcvr-r3jv-pc5j` mức critical; bản vá tối thiểu là `16.3.6`.
Không push/deploy khi gate còn đỏ. OWNER đã duyệt phạm vi remediation trong hội thoại hiện tại:
chỉ nâng `next` và `eslint-config-next` trong dòng patch 16.3, cập nhật lockfile, xác minh audit/
lint/typecheck/unit/build/E2E rồi tiếp tục đúng rollout C68; không đổi schema, nghiệp vụ, secret,
dữ liệu hoặc Production. `16.3.6` audit sạch nhưng không qua full E2E ổn định; dùng `16.3.8`, stable
patch mới nhất ngày 2026-09-30 có thêm security backport, và vẫn giữ gate fail-closed.
Kết quả remediation local: `16.3.8` audit sạch; CI policy, lint, typecheck, 80/80 unit/script, build
19 route, stress focus trap 10/10 và full E2E 39 PASS + 1 audit skip đạt. Focus trap dùng keyboard
capture phase để loại flake đã tái hiện 1/5 ở bubble phase. Chưa push/deploy hoặc đổi alias.

Kết quả: hoàn tất ngày 2026-10-01.

- Các commit `27125e9`, `993bfb6`, `f448a6b` và
  `d2bd90d1872ca31aedf592019662904794b251f5` đã push fast-forward. GitHub Actions run
  `36818958055` đạt toàn bộ job và `Required CI gate` trên đúng SHA cuối; dependency audit sạch,
  lint, typecheck, 80/80 unit/script, build 19 route, stress focus 20/20, drawer tài chính 9/9 và
  full E2E 39 PASS + 1 audit skip đều đạt.
- Candidate `dpl_6JfpS3eqM89Jtjr2b8JVzvZHLaZw`, immutable URL
  <https://quan-ly-vay-ca-nhan-rj9pn2zao-ngotuong2105.vercel.app>, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `preview`, `Ready`, Functions `sin1`. Public và
  authenticated smoke đạt trên candidate; Chrome thật đạt zoom 400%, Safari thật đạt mức zoom tối
  đa. Privacy accessible name/tooltip không lộ tiền, heading H1→H2, bottom nav không chồng và
  modal giữ focus/đóng Escape/trả focus/đồng bộ `aria-expanded`.
- Alias <https://tindung-preview.vercel.app> chỉ chuyển sau khi full gate đạt và authenticated
  smoke lại thành công. Runtime error và HTTP 500 đều 0; rollback target
  `dpl_FrsRPc3CqyKpkdkutFGCZ16Foq5u` không cần kích hoạt. Tài khoản kỹ thuật đã inactive/banned;
  không secret/cache/dump vào Git, không đổi schema, dữ liệu tài chính hoặc Production.

## 27. Checkpoint đã hoàn tất: C69

**C69 — Rollout remediation accessibility lên Production.** Trạng thái: `COMPLETED`.
OWNER phê duyệt trong hội thoại ngày 2026-10-01.

Mục tiêu: phát hành đúng revision C68 đã đạt Required CI và Preview runtime lên Vercel Production,
giữ dữ liệu/nghiệp vụ không đổi và có đường rollback đã kiểm chứng.

Phạm vi đề xuất:

- Xác minh source sạch, Required CI của đúng SHA và toàn bộ preflight Production theo runbook.
- Tạo candidate Production thuộc đúng project bằng quy trình deploy hiện hành; không migration,
  đổi secret, Apps Script/Sheets hoặc ghi giao dịch tài chính.
- Smoke public/authenticated trên immutable URL cho login, dashboard, privacy accessibility,
  heading, bottom navigation zoom/reflow và sheet **Thêm** ở desktop/mobile Chrome/Safari.
- Chỉ chuyển `tindung.vercel.app` sau khi candidate đạt; smoke lại alias, kiểm runtime log và giữ
  deployment Production hiện tại làm rollback target.

Acceptance criteria:

1. Candidate dùng đúng source SHA có Required CI xanh, đúng project/target/region, trạng thái
   `Ready`, Functions `sin1`; secret/dump/dữ liệu thật không vào Git hoặc log.
2. Public và authenticated smoke đạt trên immutable URL; privacy mode không lộ tiền, heading,
   modal focus/state và bottom nav zoom/reflow khớp bằng chứng C68; không xác nhận giao dịch.
3. Production alias chỉ đổi sau toàn bộ gate; hậu kiểm alias và runtime error/HTTP 500 đạt. Nếu
   hậu kiểm lỗi, alias được trả về deployment tốt trước đó.
4. Không đổi schema/RPC, công thức tài chính, Supabase data/secret, Apps Script hoặc Google Sheets;
   tài khoản smoke được thu hồi.
5. Context/roadmap ghi deployment ID/URL, commit/CI, smoke, log và rollback; diff check, status và
   Required CI của commit tài liệu cuối được xác nhận trước khi kết thúc.

Kết quả: hoàn tất ngày 2026-10-01.

- Source SHA `039be56a2fba3e2acc60adb4c4f10b85c14b0fbe` có GitHub Actions run
  `36827783372` đạt toàn bộ job và `Required CI gate`. Preflight local đạt dependency audit,
  CI policy/actionlint, lint, typecheck, 80/80 unit/script, build 19 route, full E2E 39 PASS +
  1 audit skip và Gitleaks toàn bộ 133 commit.
- Candidate `dpl_HZHgS3m93v2MoYNQSPVHi9vGwZ1T`, immutable URL
  <https://quan-ly-vay-ca-nhan-6ghj4fitw-ngotuong2105.vercel.app>, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `production`, `Ready`, Functions `sin1`. Public smoke
  `/login`/manifest 200, hai API không secret 401; authenticated Chrome smoke đạt privacy,
  H1→H2, modal focus/state và reflow 500/390/320 px. Safari tải đúng trang login trên candidate.
- Alias <https://tindung.vercel.app> chỉ promote sau gate; inspect trỏ đúng candidate. Public,
  authenticated Chrome và Safari login smoke lại đạt; runtime error/HTTP 500 đều 0. Một lần focus
  timing của harness timeout trên candidate, retry cùng bản dựng/tài khoản đạt; không có app
  console/runtime error tương ứng.
- Rollback target `dpl_QQ4ymp6KrfYHngugdMdv4zu5bRrJ` đã xác minh và không cần kích hoạt. Tài khoản
  smoke đã inactive/banned; không đổi schema/RPC, công thức tài chính, Supabase data/secret,
  Apps Script/Sheets hoặc ghi giao dịch tài chính.

## 28. Checkpoint C70 — Phạm vi điều chỉnh đã được duyệt

**C70 — Hậu kiểm accessibility Production trên screen reader/mobile.** Trạng thái:
`COMPLETED` theo phạm vi điều chỉnh OWNER đã đồng ý ngày 01/10/2026.

Mục tiêu: khép các giới hạn `NOT_TESTED` còn lại từ C66 trên chính Production sau C69 và chuyển
mọi sai lệch tái hiện được thành backlog remediation riêng.

Phạm vi đề xuất:

- Kiểm VoiceOver với Safari/macOS và, nếu có môi trường phù hợp, TalkBack trên Android thật hoặc
  emulator cho login, shell, dashboard, danh sách/chi tiết khoản vay và sheet **Thêm**.
- Kiểm cỡ chữ hệ thống, bàn phím mềm, safe-area, xoay màn hình và focus indicator ở viewport
  mobile; không xác nhận giao dịch hoặc sửa dữ liệu thật.
- Ghi ma trận PASS/FAIL/NOT_TESTED, bước tái hiện, mức độ, tác động và đề xuất sửa; checkpoint này
  chỉ audit, không sửa code, deploy, migration, secret hay dữ liệu.

Acceptance criteria:

1. Mỗi môi trường/assistive technology có trạng thái và bằng chứng rõ; thiếu thiết bị giữ
   `NOT_TESTED`, không suy diễn PASS.
2. Login, navigation, privacy mode, heading, modal focus/announcement và reflow được kiểm bằng
   thao tác thực trên Production; console/runtime log được đối chiếu khi có lỗi.
3. Không tạo giao dịch tài chính; mọi tài khoản kỹ thuật được inactive/banned sau kiểm tra và không
   có secret/dữ liệu nhạy cảm trong evidence hoặc Git.
4. Phát hiện mới có severity, route/viewport, nguyên nhân, tác động và remediation scope; context/
   roadmap cập nhật cùng thay đổi, diff check và test gate tài liệu phù hợp đạt.


### Điều chỉnh được OWNER chấp thuận ngày 01/10/2026

OWNER đồng ý chốt C70 với giới hạn được ghi rõ và chuyển sang đề xuất C71 audit UI/UX thông thường.
Acceptance criteria 1–4 được áp dụng với các bổ sung sau:

- Phần thao tác đã thực hiện trên Production có bằng chứng theo từng môi trường được tổng hợp;
  không bắt buộc đầu ra VoiceOver hoặc thiết bị mobile không thể kiểm qua công cụ hiện có để
  đóng C70. Các phép kiểm này tiếp tục ghi NOT_TESTED, không ghi PASS hoặc coi rủi ro đã khép.
- Không yêu cầu OWNER học/vận hành VoiceOver hoặc cung cấp lời đọc. Hai quan sát chưa chứng minh
  tác động screen reader giữ trạng thái cần xác minh, không kết luận thành lỗi đã tái hiện.
- Đóng audit theo phạm vi điều chỉnh chỉ xác nhận báo cáo và các phép kiểm khả dụng đã hoàn tất;
  không phải tuyên bố mọi acceptance criterion của phạm vi screen reader ban đầu đã đạt.

Kết quả: `docs/UI_UX_AUDIT_C70.md` ghi Safari login semantic/focus và Chrome Production smoke
chỉ xem đạt; privacy attributes, dashboard heading, sheet focus/state, reflow và bốn tab loan
được kiểm. Console/pageerror = 0. Tài khoản kỹ thuật inactive/banned đã hậu kiểm. VoiceOver đã bật
nhưng công cụ bind timeout -10005/không thu được câu đọc; mobile thật thiếu môi trường. Các mục
này giữ NOT_TESTED. Gate tài liệu là `git diff --check`; không có thay đổi runtime/harness.


## 29. Checkpoint đã hoàn tất: C71

**C71 — Audit sâu UI/UX và hiệu quả thao tác mobile–desktop.** Trạng thái: `COMPLETED`.

Mục tiêu: phát hiện vấn đề bố cục, thao tác thừa, phản hồi và độ mượt bằng thực nghiệm trên bản
hiện tại; lập checkpoint remediation dựa trên bằng chứng. Không yêu cầu OWNER vận hành screen reader.

Phạm vi đề xuất:

- Audit login/cold start, shell/navigation, dashboard, khoản vay list/detail/bốn tab, đối tác,
  chi phí, thông báo và cài đặt. So với C62–C69 để phân biệt lỗi còn tồn tại, lỗi đã sửa và regression.
- Kiểm bố cục/hierarchy, typography, spacing, target, cuộn, zoom và focus bàn phím ở 375/390/768/
  1024/1440 px, landscape giả lập, light/dark và reduced-motion. Ghi rõ viewport giả lập, không
  coi là kiểm bàn phím mềm/safe-area/Dynamic Type trên thiết bị thật.
- Kiểm loading khi mở app/login/chuyển route/tab, phản hồi pending/success/error/retry/offline,
  back navigation, bảo toàn filter/scroll/draft và số thao tác cần thiết cho hành trình phổ biến.
- Tái hiện lưu thành công → drawer đóng/reset/toast/focus; lỗi → giữ draft; đóng draft, submit
  trùng, stale preview và thao tác liên tiếp chỉ trong database local cô lập với dữ liệu synthetic.
  Xác minh guard môi trường trước khi chạy harness/reset; không reset hoặc ghi vào Supabase dùng chung.
- Production chỉ quan sát/điều hướng không ghi nghiệp vụ; nếu cần tài khoản kỹ thuật thì chỉ VIEWER,
  không dùng tài khoản OWNER và phải inactive/banned sau audit. Không đổi runtime/schema/RPC,
  migration, secret, tài khoản vận hành, deploy hoặc push.
- Cho phép tài liệu, ảnh/mockup synthetic và harness audit local để tạo bằng chứng; không triển
  khai đề xuất giao diện trong checkpoint audit. Screen reader/thiết bị thiếu tiếp tục NOT_TESTED.

Acceptance criteria:

1. Có ma trận màn hình × viewport × trạng thái PASS/FAIL/NOT_TESTED, phương pháp, revision/môi
   trường và bằng chứng tái hiện. Kiểm cả source/thay đổi local và ghi rõ khác biệt với Production.
2. Mỗi phát hiện có severity, file/vị trí, route/viewport, bước tái hiện, expected/actual, nguyên
   nhân có bằng chứng (hoặc chưa xác định), tác động và hướng sửa. Không gán lỗi từ cảm nhận hoặc
   kết quả lịch sử; ảnh/code/mockup không thay thế phép kiểm hành vi.
3. Loading/cold start/chuyển tab và drawer sau lưu có phép kiểm mới trên bản hiện tại. Ghi số
   thao tác và thời gian quan sát được, điều kiện network/delay mô phỏng; không suy diễn chỉ số
   Production từ benchmark local. Phân biệt thiếu phản hồi, quá nhiều bước và sai trạng thái.
4. Đánh giá chất lượng thị giác qua ảnh synthetic mobile/desktop cùng checklist cụ thể (hierarchy,
   spacing, contrast, consistency, target/scroll/focus); đưa phương án cải thiện có thể review.
5. Không có giao dịch tài chính/QA data trên Production hoặc database dùng chung; tài khoản kỹ
   thuật inactive/banned sau kiểm; artifact/Git không chứa secret hoặc dữ liệu tài chính thật.
6. Đề xuất checkpoint remediation ưu tiên lỗi có tác động cao, có phạm vi và acceptance criteria
   đo được, phân biệt việc sửa local và rollout cần phê duyệt. Chưa tự sửa code sản phẩm.
7. Cập nhật context/roadmap cùng thay đổi; `git diff --check` đạt. Nếu thêm/sửa harness thì chạy
   lint/typecheck và E2E audit liên quan bằng gate hiện có; ghi kết quả/giới hạn, không bắt buộc
   full database suite cho thay đổi chỉ tài liệu. Chỉ đánh dấu COMPLETED sau khi gate áp dụng đạt.

OWNER phê duyệt C71 trong hội thoại ngày 01/10/2026. Sau khi hoàn tất audit, đặt checkpoint
remediation kế tiếp AWAITING_APPROVAL và dừng theo AGENTS.md mục 3.


Kết quả C71 ngày 01/10/2026: `docs/UI_UX_AUDIT_C71.md`, ma trận/ảnh/mockup tại `docs/audit-c71/`.
110 mẫu local +20 login public/local; 1 HIGH,4 MEDIUM,1 LOW. Lint/typecheck PASS, 16 regression
PASS, audit2PASS và targeted friction cuối1PASS. Timeout lượt đầu là harness full-page Back chờ
load khi native confirm bị dismiss; sửa harness rồi mới tái hiện lỗi Back SPA. Synthetic DB đã
teardown/hậu kiểm0 profile/loan/transaction; secret scan/diff check đạt. Không sửa runtime, deploy,
push hay dữ liệu dùng chung. Không coi PASS audit harness là PASS sản phẩm; lỗi vẫn mở ở C72.

## 30. Checkpoint C72 — Đã được phê duyệt

**C72 — Remediation bản nháp, thông báo và bố cục mobile.** Trạng thái: `COMPLETED` local ngày 01/10/2026.

Mục tiêu: sửa sáu phát hiện C71, ưu tiên không mất công nhập và phản hồi rõ, cải thiện giao diện
mobile dựa trên bằng chứng. Bản review `docs/audit-c71/proposal.html` chỉ là hướng bố cục; không
thay đổi tính lãi, ledger hoặc kiến trúc nguồn dữ liệu.

Phạm vi đề xuất:

- C71-01: thống nhất dirty guard cho link, history Back/Forward, drawer và full-page leave. Chỉ
  discard khi xác nhận; không lưu draft tài chính vào persistent browser storage.
- C71-02/05: pending/success/error/retry và chặn thao tác lặp ở mark-all/read-one notification;
  xử lý RPC error ở Server Action và active filter theo URL, không đổi nghiệp vụ/RPC nhắc hạn.
- C71-03: hit area ≥44×44 cho counterparties disclosure, filter pills, quick payment và custom
  period control cùng các variant visible tương ứng. Giữ nhãn/icon/focus và không tràn ngang.
- C71-04: chi phí list-first với CTA mở sheet; success đóng/reset/toast/focus, failure giữ draft,
  dirty dismissal và duplicate-submit guard. Giữ tổng hợp, privacy, permissions và giao dịch đảo.
- C71-06: dashboard mobile có tác vụ cụ thể/CTA sớm hơn KPI; giữ các KPI, filter và so sánh kỳ,
  desktop hierarchy, dark theme, reduced-motion. Không tự thay palette/brand/biểu đồ khác phạm vi.
- Chỉ code và tests local với DB synthetic riêng; tài liệu/bằng chứng mới. Có thể local commit
  sau gates; **không push/deploy/alias/migration/secret hoặc write remote trong C72**. Sau khi
  sửa local đạt sẽ đề xuất checkpoint đồng bộ/Preview/Production riêng rồi dừng chờ duyệt.
- VoiceOver/TalkBack/mobile thật vẫn ghi giới hạn; không yêu cầu OWNER tự thao tác công nghệ hỗ trợ.

Acceptance criteria:

1. Với loan-new, expense sheet và một editor đã sửa: Back/Forward/link/đóng khi dirty hỏi đúng một
   lần; chọn ở lại giữ URL, field, focus và scroll; chọn bỏ đi đúng route, không history loop,
   progress treo hay duplicate confirm. Full-page beforeunload còn hoạt động. E2E synthetic tái
   hiện lỗi C71-01 trước sửa và chứng minh hành vi sau sửa; không chỉ test mock implementation.
2. Notification delay POST 1200ms: sau ≤200ms có pending nhìn thấy, control disabled/busy; nhiều
   attempt chỉ gửi một operation. Success cập nhật list/badge, error giữ state/có message/retry;
   không báo thành công khi RPC thất bại. “Tất cả/Chưa đọc” có đúng một active theo URL và
   aria-current; Back/Forward/reload giữ nhất quán. Inject failure chỉ local, không sửa RPC remote.
3. Controls nêu ở C71-03 và regression inventory visible ≥44×44 ở 375/390/768/1024/1440, light/
   dark, text200%; đo bounding boxes, keyboard focus visible, không page overflow. Không đếm
   control trong details đóng hoặc sr-only làm bằng chứng PASS/FAIL hit area.
4. Với2 expense fixtures, 390×844: lịch sử bắt đầu trước y=500, CTA luôn dễ tìm, form không nằm
   trước list khi sheet đóng. Luồng tạo mặc định ≤4 thao tác ở mức select/edit-field/submit theo
   định nghĩa C71; lưu xong sheet đóng/reset/toast/focus, lỗi giữ draft, retry không trùng và
   duplicate submit chỉ1 row. VIEWER không được mutate, privacy vẫn bảo vệ tiền và free text.
5. Dashboard390×844 với13 công việc synthetic: công việc đầu và CTA đầy đủ trước y=650, giữ bộ
   lọc/KPI/so sánh, tất cả công việc còn truy cập được. Desktop1440 không giảm khả năng đối chiếu.
   Có ảnh trước/sau light/dark và checklist hierarchy/spacing/contrast/target/scroll/focus; không
   tuyên bố mobile thật/screen reader PASS từ ảnh hay viewport giả lập.
6. Cold auth2s/10s, route10s, tab1800ms và financial drawer payment/settlement/restructure vẫn
   qua regression C63/C64/C67. Không thêm splash trì hoãn login hoặc overlay che thông tin đã tải.
   Không thay quyết toán VND authoritative, RPC/schema; preserve idempotency và stale-preview guard.
7. `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`
   đạt; E2E chỉ database thử nghiệm được guard trước reset/mutation. Ghi kết quả, cleanup và
   secret/artifact scan. `supabase test db` chỉ thêm nếu thực tế thay contract/schema ngoài scope
   thì dừng đề xuất mở rộng trước, không âm thầm thực hiện. Không tuyên bố CI/deployment mới.
8. Cập nhật context/roadmap cùng thay đổi, ghi file/rủi ro/bằng chứng; hoàn tất local C72 rồi đặt
   checkpoint rollout tiếp theo AWAITING_APPROVAL và dừng theo AGENTS. Không tự rollout.

OWNER phê duyệt C72 trong hội thoại ngày 01/10/2026.


Kết quả C72: sáu phát hiện C71 đã sửa local; báo cáo `docs/UI_UX_REMEDIATION_C72.md`,
ảnh/geometry `docs/remediation-c72/`. Diff-check/lint/typecheck, unit80/80, build và full
E2E45 PASS/3 audit opt-in SKIP đạt. Test DB cleanup0, secret scan sạch; không commit/push/deploy.
Safari/Firefox/screen reader/mobile vật lý chưa kiểm; không xem ảnh là chứng nhận AT.

## 31. Checkpoint C73 — Đã được phê duyệt

**C73 — Đồng bộ và rollout remediation C70–C72.** Trạng thái: `COMPLETED`.

Mục tiêu: đưa source local đã kiểm lên GitHub, stable Preview và Production để OWNER sử dụng
bản UI/UX mới. Không migration, đổi secret/tài khoản/kiến trúc hay ghi dữ liệu tài chính remote.

Phạm vi:

- Đọc startup/context, kiểm diff C70–C72 và artifact/secret/dependency; giữ thay đổi ngoài scope.
  Tạo commit checkpoint, push fast-forward repository hiện hữu, không force/reset.
- Xác minh `Required CI gate` đúng SHA; GitHub Free/private dùng kiểm soát bù hiện hữu,
  không yêu cầu nâng gói hoặc thay branch protection.
- Preview bắt buộc từ root qua `pnpm deploy:preview`, theo `docs/VERCEL_PREVIEW_RUNBOOK.md`:
  preflight đủ gate, immutable candidate Ready/target preview/project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`/Functions sin1; smoke trước chuyển stable alias.
- Sau Preview đạt, tạo candidate Production bằng luồng runbook hiện hữu; Ready/sin1,
  smoke URL bất biến trước promote `tindung.vercel.app`, không bỏ qua authenticated route.
- Smoke chỉ đọc trên phiên hiện hữu: dashboard/loan detail/counterparties/expenses/notifications,
  loading/nav, theme/viewport3753901440, active filter và mở/đóng sheet sạch. Không bấm lưu,
  mark-read hoặc ghi giao dịch trên remote để kiểm; các mutation đã kiểm trong DB synthetic.
- Kiểm stable alias/runtime error sau mỗi rollout; lỗi thì trả alias về deployment tốt đã ghi
  trước thay đổi. Dừng nếu dữ liệu/kiến trúc sai lệch hoặc cần login/CAPTCHA người dùng.

Acceptance criteria:

1. Local source/bằng chứng đúng phạm vi, không secret/dump; diff-check/lint/typecheck/unit/build/
   E2E đạt trước candidate. Có commit SHA và Required CI xanh đúng SHA, không dùng run cũ.
2. Preview và Production ghi deployment ID, immutable URL, target/project/region, alias và
   rollback target; từng public/authenticated smoke, console/runtime log có kết quả rõ.
   Ready/build không thay bằng chứng route thật; stable alias được hậu kiểm sau promote.
3. UI C72 được xác nhận xuất hiện trên hai môi trường; không ghi tài chính/đổi schema/secret,
   không tuyên bố screen reader hoặc mobile vật lý PASS từ viewport giả lập.
4. Context/roadmap cùng cập nhật và source/tài liệu được đồng bộ; nếu tài liệu tạo SHA mới,
   xác minh Required CI của SHA cuối. Đánh dấu COMPLETED chỉ sau toàn bộ gate và hậu kiểm;
   checkpoint tiếp theo đặt AWAITING_APPROVAL rồi dừng. OWNER phê duyệt C73 trong hội thoại ngày 02/10/2026.

Kết quả 02/10/2026: source `a5cd7b142ae2a8b24247537477ab6437c742be5c` và Required CI
`36961824893` SUCCESS. Fixture CI prepared được reset có guard để tránh user synthetic trùng;
không đổi runtime/remote DB. Local/root resume lint/typecheck/80unit/build/E2E45 PASS3 SKIP đạt.
Preview `dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb`, immutable
<https://quan-ly-vay-ca-nhan-c6pft4h1k-ngotuong2105.vercel.app>, Ready/preview/sin1/đúng project;
root script promote stable alias và hậu kiểm đạt. Rollback `dpl_6JfpS3eqM89Jtjr2b8JVzvZHLaZw`
không kích hoạt. Candidate sớm `dpl_A5ViQwiJSrfATNwSyWq7VEvCc2Hh` trước CI xanh không phát hành.
Production `dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx`, immutable
<https://quan-ly-vay-ca-nhan-7g0uxlwrm-ngotuong2105.vercel.app>, Ready/production/sin1/đúng project;
root --skip-domain candidate trước promote; stable domain inspect/public/Auth hậu kiểm đạt.
Rollback `dpl_HZHgS3m93v2MoYNQSPVHi9vGwZ1T` không kích hoạt.
Public login/manifest200, API không secret401; streaming Auth redirect200 có NEXT_REDIRECT/login
và browser về/login. Auth candidate hai môi trường kiểm đủ route/3753901440/lightdark/sheet/
focus/filter. Alias hậu kiểm dashboard/expense sheet/unread filter; skeleton dashboard Production
xuất hiện rồi render xong. Không có lỗi app console/runtime/HTTP500; CSP Toolbar Preview và lỗi
extension được phân loại riêng. Không ghi tài chính, mark-read, đổi schema/secret/account.
Chi tiết deployment/gate/giới hạn ở context; Required CI của commit tài liệu cuối được xác minh
trước báo hoàn tất, exact SHA/run báo trong hội thoại. C74 chờ duyệt, chưa triển khai.

OWNER cho phép tiếp tục dù Chrome badge Nguy hiểm sau login immutable hostname, nguyên nhân
OPEN tại `docs/C73_RELEASE_BLOCKER.md`. Không bypass hay coi đã giải quyết; stable aliases
không hiện badge ở lượt kiểm. Screen reader/mobile vật lý không được chứng nhận PASS.

## 32. Checkpoint C74 — Đã được phê duyệt

**C74 — Audit hành trình và backlog UI/UX sau rollout.** Trạng thái: `COMPLETED` ngày02/10/2026.
OWNER phê duyệt trong hội thoại ngày02/10/2026.

Mục tiêu: đánh giá bản đã phát hành bằng hành trình thực tế, xác định thao tác thừa và điểm
khó dùng còn lại, đưa đề xuất remediation cụ thể để OWNER duyệt. Chưa sửa sản phẩm.

Phạm vi:

- Kiểm chỉ đọc Production/Preview trên phiên hiện hữu: tìm khoản vay → detail/tab → quay lại,
  dashboard → việc đến hạn, đối tác/search, chi phí list/sheet, thông báo/filter.
- Đếm bước và ghi trạng thái loading, navigation, keyboard/focus, mobile375/390 và desktop1440,
  light/dark; kiểm Chrome/Safari khi công cụ/phiên cho phép. Mutation/draft/error chỉ ở fixture
  local synthetic, không lưu/mark-read/ghi dữ liệu remote hoặc tạo account QA dùng chung.
- Rà bố cục, hierarchy, nhãn, mục tiêu bấm, nội dung khi privacy bật và cảm giác phản hồi.
  Điều tra cảnh báo Chrome chỉ đọc nếu còn tái hiện, không đổi credential/security setting.
- Báo cáo chứng cứ redacted/synthetic, severity, file/vị trí, nguyên nhân/tác động và hướng sửa;
  mockup khi giúp OWNER quyết định, không đổi runtime/schema/dependency/deploy/push.

Acceptance criteria:

1. Có ma trận hành trình, số bước/thao tác thừa và kết quả từng route/viewport/theme đã kiểm;
   NOT_TESTED rõ cho thiết bị vật lý/AT hoặc browser không truy cập được.
2. Không đưa dữ liệu tài chính thật, cookie/credential vào Git; chứng cứ phải synthetic/redacted.
3. Phân biệt lỗi tái hiện với ý kiến thẩm mỹ, rủi ro source và giới hạn kiểm; không mở lại lỗi đã
   sửa nếu không có chứng cứ mới. Mỗi phát hiện có vị trí/tác động/severity/hướng sửa.
4. Chốt một checkpoint remediation tiếp theo có phạm vi ưu tiên và acceptance đo được; đề xuất
   để OWNER duyệt, không tự sửa. Không yêu cầu OWNER học VoiceOver để đóng audit khả dụng.
5. Gate tài liệu diff-check; harness nếu đổi chạy lint/typecheck và test audit liên quan trong DB
   cô lập. Context/roadmap cập nhật cùng thay đổi, báo kết quả và dừng chờ phê duyệt remediation.

Kết quả C74: `docs/audit-c74/report.md`, `matrix.md`, `evidence.json`, ảnh synthetic và
`review.html`;54 lượt, bốn phát hiện F1–F4, hai đề xuất Gu. Lint/typecheck/diff-check PASS,
controlled audit2/2 PASS49,9s, DB test teardown0 profiles/loans/transactions. Lịch sử lỗi
harness/Auth502 và giới hạn remote/browser/AT đã ghi rõ; không sửa runtime/deploy/push.
Mockup HTML chưa render-verify do browser URL policy chặn file://; không workaround.

## 33. Checkpoint C75 — Đã được phê duyệt

**C75 — Remediation ngữ cảnh công việc và thông báo.** Trạng thái: `COMPLETED` local ngày02/10/2026.
OWNER phê duyệt C75 trong hội thoại ngày02/10/2026.

Mục tiêu: sửa F1–F4 có chứng cứ C74 và áp dụng hierarchy notifications G1. Giữ brand hiện hữu,
không redesign toàn app. Báo cáo và mockup tham khảo `docs/audit-c74/report.md`, `review.html`.

Phạm vi:

- Dashboard task: tên/nhãn/hướng và ngày nhắc/kỳ chốt phân biệt được; tên custom không bị mất
  phần thiết yếu. Không suy đoán nhãn bằng parse chuỗi tùy tiện. Có thể bổ sung dữ liệu đọc
  cấu trúc từ nguồn hiện hữu nếu cần, không đổi ledger hoặc logic authoritative.
- “Xem toàn bộ … việc cần xử lý” mở rộng tại dashboard cùng tập dữ liệu, thu gọn về5; giữ
  ngữ cảnh/focus/scroll, không dẫn đến danh sách khoản vay chung.
- Privacy metadata có khoảng cách/separator ở call site; không đổi masking toàn cục tùy tiện.
- Empty notifications theo Tất cả/Chưa đọc; CTA về Tất cả khi đã đọc hết.
- Đưa list/empty trước cấu hình push; cấu hình disclosure có trạng thái, keyboard và giờ nhận
  còn truy cập được. Không tự xin quyền hoặc thay đổi setting.
- Thay đổi local runtime và regression phù hợp; giữ ngoài phạm vi desktop row mode G2,
  cảnh báo Chrome, migration/financial RPC mutation, credentials/secrets và tài nguyên remote.
  Không push/deploy; rollout phải được duyệt qua checkpoint riêng.

Acceptance criteria:

1. Fixture ít nhất13 việc, tên chung tiền tố/nhãn khác cuối;375/390/1440 light/dark đọc và
   phân biệt được tên/nhãn/hướng/ngày/tiền, không tràn ngang. Nếu text bị rút gọn phải có cách
   mở đầy đủ bằng keyboard/touch, không chỉ title tooltip.
2. Một click/activation mở đúng13 việc cùng nguồn; thu gọn5, label/count đúng, focus/scroll
   không mất ngữ cảnh; không điều hướng loans chung, không thay số tiền/lịch authoritative.
3. Privacy on/off ở tên generated/custom và metadata liên quan: separator đúng; masking
   text/title/aria không hồi quy, ledger/date không đổi.
4. Empty Chưa đọc khác Tất cả, CTA Tất cả đúng; badge/read/count giữ đúng. Không mark-read
   hoặc gọi runner ngoài hành động người dùng.
5. Notifications375/390 item đầu/empty trước cấu hình; disclosure keyboard dùng được và
   push state/delivery hour vẫn truy cập được. Không tự xin quyền/change setting.
6. Hồi quy back/query, save đóng/focus, draft/error, loading tiếp tục đạt; chạy diff-check,
   lint, typecheck, unit, build, E2E liên quan. Không bắt OWNER học VoiceOver để đóng local.
7. Review synthetic sau sửa; context/roadmap cập nhật cùng thay đổi, checkpoint kế tiếp
   AWAITING_APPROVAL rồi dừng. Chưa phát hành Production trong C75.

Kết quả C75: F1–F4/G1 sửa local, giữ brand/component hiện hữu, tên custom wrap không parse,
expand/collapse tập task server; privacy metadata, empty filter, notification list-first đạt.
Lint/typecheck/diff-check/unit80/build19 route PASS; regression C63/C67/C7219 PASS,
business-flow11 PASS, final C75 3 PASS56,8s. Evidence6 matrix/ảnh/report/review tại
`docs/remediation-c75/`; teardown profiles/loans/transactions0. Lịch sử harness và giới hạn
browser/AT ghi trong report. C74 chưa commit bảo toàn; chưa push/deploy/schema/remote mutation.

## 34. Checkpoint C76 — Đã hoàn tất

**C76 — Đồng bộ và rollout remediation C74–C75.** Trạng thái: `COMPLETED`.

Người dùng phê duyệt ngày 2026-10-02, bổ sung KPI dư nợ/lãi ròng ở trên task.
Hoàn tất rollout và hậu kiểm 03/10/2026; đã đăng nhập hai candidate trực tiếp.
Source d3fc370/Required CI37032143402 SUCCESS, root full gate48PASS5SKIP, hai stable aliases
đã trỏ candidate mới. Bằng chứng và các run lịch sử tại docs/release-c76/.

Mục tiêu: đưa source/bằng chứng C74–C75 đã đạt gate lên GitHub và phát hành qua Preview,
Production có authenticated smoke thực. Không mở rộng redesign hoặc thay đổi database.

Phạm vi:

- Kiểm toàn bộ local diff C74–C75 và bảo toàn thay đổi khác; credential/financial artifact scan,
  dependency/policy gate, lint/typecheck/unit/build/full E2E phù hợp. Sửa blocker trong phạm vi
  release nếu cần; sai lệch dữ liệu/kiến trúc ngoài phạm vi phải dừng.
- Commit source/tài liệu synthetic, push fast-forward remote hiện hữu. Xác nhận Required CI của
  đúng SHA xanh; không nâng GitHub plan, không phát hành từ run cũ hoặc candidate trước CI đạt.
- Preview theo AGENTS4.1 và `docs/VERCEL_PREVIEW_RUNBOOK.md`: root pnpm deploy:preview,
  đúng project/target/sin1; candidate public và authenticated read-only smoke trên immutable URL
  trước stable alias. Hậu kiểm alias/log và rollback nếu thất bại.
- Production root pipeline --target=production giữ alias cũ khi smoke candidate; chỉ promote khi
  full gate/Auth smoke đạt, hậu kiểm alias/log, rollback target đúng project. Không tự bypass
  cảnh báo browser; nếu cần OWNER đăng nhập thì chỉ handoff bước đăng nhập.
- Smoke C75 dashboard đủ tên/expand/collapse/privacy/context, notification list/disclosure/empty
  có sẵn, loans back/tab/loading;375/390/1440 light/dark trên browser khả dụng. Không save,
  mark-read hoặc ghi tài chính remote để tạo empty state; trạng thái thiếu dữ liệu NOT_TESTED,
  có regression local bổ trợ. Không tạo QA account dùng chung/secrets/migration/Apps Script/Sheets.

Acceptance criteria:

1. Gate local và secret/artifact scan đạt; commit không có credential/dump/dữ liệu tài chính thật.
   Origin/main khớp source SHA, Required CI đúng SHA đạt mọi job/gate; không dùng run khác.
2. Preview/Production candidates Ready, đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`,
   target tương ứng, Functions sin1. Ghi ID/immutable URL/alias/SHA/rollback/từng smoke.
3. Candidate đạt public và authenticated runtime smoke trước alias; alias hậu kiểm đạt,
   không app console exception/runtime error/HTTP500 chưa giải thích. Toolbar/extension phải
   phân biệt nguồn. Nếu hậu kiểm fail trả alias về deployment tốt đã xác minh.
4. C75 behavior đọc-only đạt trên candidate/alias có dữ liệu thực hiện hữu, không lưu tài chính
   hoặc mark-read. Thử quyền push/time chỉ local; không xin permission/change setting remote.
   Cảnh báo Chrome C73 và AT/mobile vật lý không được tự kết luận đã đóng nếu thiếu bằng chứng.
5. Context/roadmap cập nhật cùng thay đổi, Required CI exact final documentation SHA nếu push
   tài liệu cuối, báo rủi ro/giới hạn và checkpoint kế tiếp AWAITING_APPROVAL rồi dừng.

Kết quả C76 03/10/2026: local lint/typecheck/unit90/build19/policy PASS; root Preview resume
E2E48PASS5SKIP6,5m/exit0, DB test55322 hậu kiểm0/0/0. Required CI source
37032143402 SUCCESS5jobs; CI pgTAP527/Auth6/E2E47PASS6SKIP. Candidate đúng project/target/
43 Functions sin1, inventory245 regular files/0 forbidden. Preview dpl_BBavYTasgvQ51wyTQbWunqysM6Fq
và Production dpl_AurpzZ3pUxe7Xp7dWnxuWa2fjXxw đã Auth read-only smoke thực trước promote.
KPI trước task375/390/1440 light/dark, full task/name/context/privacy metadata/chart/list/disclosure/
unread empty/loans/detail/history/loading/đóng drawer đạt. Alias Preview/Production hậu kiểm đạt,
public8/8, runtime error0/HTTP5000; CSP Toolbar và exception Chrome extension đã phân biệt nguồn.
Không save/mark-read/permission/time/DB/schema/secrets/Google mutation remote.
Cảnh báo Chrome C73, AT/mobile vật lý, intermittent focus và artifacts rollback vẫn OPEN.
Trục chart hiện thang tiền dù privacy bật: ghi nhận P2 ngoài phạm vi sửa C75, đưa vào C77 audit;
không kết luận privacy toàn app đạt. Không xóa rollback hoặc tự đổi browser security.
Commit chốt tài liệu phải đạt Required CI đúng SHA trước khi báo hoàn tất; không dùng CI source
thay cho CI tài liệu. Dừng tại C77 AWAITING_APPROVAL.

C76 dependency follow-up: CI37085353144/40e09d5 phát hiện HIGH braces dev lint; scoped
Next plugin16.3.8 tinyglobby0.2.15 alias + compatibility patch đã loại dependency này, không
bỏ rule/audit allowlist. Pinned frozen install11.9/lint/typecheck/unit94/build19/policy/full audit
PASS,4 regression glob/internal-link PASS. Production graph125 snapshots/runtime source không
đổi, không redeploy. Required CI 37086389279 của 437fea7f5a879372ffcba0a5d199a7eb8a61e01c SUCCESS cả5 job.
Root local E2E48/5 trước patch; full integration CI kiểm lại patch. Chi tiết docs/release-c76/.

## 35. Checkpoint C77 — Đã hoàn tất

**C77 — Audit privacy biểu đồ, focus và artifact triển khai còn mở.** Trạng thái: `COMPLETED`.

OWNER phê duyệt ngày03/10/2026 trong hội thoại.

Mục tiêu: làm rõ ba rủi ro còn mở bằng bằng chứng tối thiểu để đề xuất remediation cụ thể.

Phạm vi được đề xuất (chưa triển khai):

- Audit privacy của trục/tooltip/accessible labels biểu đồ dashboard và chi tiết khoản vay;
  tái hiện bằng fixture synthetic tại375/390/1440 light/dark. Không đưa số/tên/UUID thật vào artifact.
- Tái hiện C67 Tab/Shift+Tab/Escape/focus return trên menu/drawer bằng local isolated E2E và
  browser hiện hữu; đối chiếu focus diagnostics, không nới assertion/timeout để che lỗi.
- Chỉ đọc metadata/inventory source/out và quyền truy cập deployment C73 đang làm rollback;
  xác định giữ/xóa thế nào sau khi có rollback sạch. Không tải nội dung backup/log/secret, không
  xóa deployment, đổi quyền hay thực hiện cleanup trong audit.
- Viết báo cáo severity/file/vị trí/nguyên nhân/tác động/hướng khắc phục; cập nhật context/roadmap
  cùng thay đổi. Không sửa runtime, DB, credentials, remote settings; không deploy/push.

Acceptance criteria:

1. Mỗi rủi ro có nguồn chứng cứ cụ thể, phân biệt tái hiện được, suy luận source và NOT_TESTED;
   privacy fixture không lộ tiền trong hình/DOM accessible khi bật ẩn là mục tiêu remediation,
   không tuyên bố đạt chỉ vì một route mask đúng.
2. Focus có bước tái hiện/trace hoặc ghi rõ chưa xác định root cause; không dùng một lần PASS
   để đóng intermittent issue. Fixture/test DB riêng55322 được hậu kiểm không còn dữ liệu.
3. Artifact review phân biệt source package với public HTTP exposure, không tải nội dung nhạy cảm;
   đề xuất cleanup/rollback sạch có danh sách đích và phê duyệt riêng trước thao tác phá hủy.
4. Có checkpoint remediation kế tiếp phạm vi và acceptance criteria rõ, AWAITING_APPROVAL rồi
   dừng. Gate phù hợp chỉ gồm diff-check/credential scan và kiểm thử local phục vụ bằng chứng.

Kết quả C77 03/10:12 route/width/theme synthetic samples, dashboard scale lộ6/6;
loan3-period chart hidden6/6. Focus64 menu cycles: eager15/32 lỗi (12 last-focus,3 Tab target
đã bị đổi), settled32/32 và drawer10/10 đạt. Initial focus rAF ghi đè focus đã di chuyển;
không kết luận trap sai từ Tab thực xuất phát ởclose. Report/evidence docs/audit-c77/.
Hai C73 deployments mỗi source329 files gồm77 backup/58 artifacts; build output metadata44
lambda entries/0 forbidden path (static/bundle contents NOT_TESTED); public=false logs/source,
/_src/_logs307 vềVercel,6 artifactHEAD404, không tải nội dung/khẳng định khônglộtoànbộ.
Local audit2 tasks completed2,0m giữ15 lỗi, lint/typecheck/diff/secret scan PASS; DB riêng55322
0/0/0. Không runtime/remote mutation/commit/push/deploy. C78 AWAITING_APPROVAL.

## 36. Checkpoint C78 — Đã hoàn tất

**C78 — Sửa privacy biểu đồ, initial focus và upload guard local.** Trạng thái: `COMPLETED`.

OWNER phê duyệt03/10 trong hội thoại.

Mục tiêu: khắc phục F1/F2 của C77 và ngăn tái upload artifact nhạy cảm; không rollout remote.

Phạm vi:

- Che scale/tooltip/accessible labels chứa tiền khi privacy bật trên dashboard và biểu đồ kỳ lãi;
  reuse PrivacyAmount/PrivacyRegion, giữ layout/thứ tự KPI trên task, brand và số authoritative.
- AppNav initial focus chỉ thực hiện một lần phù hợp lifecycle, không ghi đè thao tác đã di chuyển
  focus; guard/cancel callback khi đóng/reopen/navigation. Không viết lại trap chung nếu không có
  evidence mới. Giữ Tab/Shift+Tab/Escape/return focus/aria-state và dirty/pending drawers.
- Thêm guard kiểm metadata payload local trước remote upload trong root Preview pipeline, phát
  hiện backup/test-results/cache/credential/dump không được phép. Giữ .vercelignore exclusion;
  kiểm bằng fixture giả an toàn, không đưa ciphertext/credential thật vào test. Không chạy deploy.
- Bổ sung regression privacy/focus/upload guard, ảnh before/after synthetic và report/context/
  roadmap. Có thể local commit khi hoàn tất, không push/deploy/migration/đổi dữ liệu remote.
- Chỉ đề xuất checkpoint rollout/cleanup riêng sau C78. Đích cleanup hiện có là C73 Preview
  dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb và Production dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx;
  chưa cấp quyền xóa/promote/đổi default alias hoặc quyền nền tảng trong C78.

Acceptance criteria:

1.375/390/1440 light/dark: privacy bật không có tiền thật trong text hiển thị/accessible name/
  title/tooltip/chart scale; toggle lại phục hồi số đúng và chart tương tác. Kiểm nonzero/zero/empty,
  kỳ lãi0/1/2/3/12; không tuyên bố privacy là bảo vệ payload/DevTools hoặc thay RLS.
2. Cùng eager sequence C77 ít nhất32 lượt normal/reduced motion không bị focus ghi đè và không
  thêm chờ để che lỗi; thêm keyboard open/close-before-frame/reopen/navigation cùng Tab/Shift+Tab/
  Escape/return-focus. Có failure metadata nếu lỗi; regression C67 và financial/draft drawer đạt.
3. Upload guard fail-closed trên fixture forbidden metadata và pass trên payload hợp lệ; chỉ liệt
  kê metadata, không đọc file secret/dump, không remote deploy. Không suy ra remote source sạch
  từ dry-run; inventory/Auth/log/alias là acceptance của checkpoint rollout riêng.
4. Lint/typecheck/unit/build/full E2E/diff-check/credential scan đạt; test DB riêng55322 hậu kiểm
  profiles/loans/transactions0. Không schema/RPC/tính lãi/financial data/Google/remote settings đổi.
5. Report/context/roadmap cùng thay đổi; checkpoint kế tiếp AWAITING_APPROVAL rồi dừng. Không tự
  xóa C73 trước khi OWNER duyệt checkpoint vận hành với rollback C76 sạch và default alias rõ.

Kết quả C78 03/10:36 browser privacy cases375/390/1440 light/dark (dashboard/zero và loan1/2/3/12),
SSR chart0/1/2/3/12 +cash empty/zero/mixed,32 eager cycles và keyboard/quick close/reopen/navigation
đạt. Lint/typecheck/unit105/build/final full E2E51PASS7audit-opt-inSKIP6,5m, C78 riêng3PASS1,7m,
diff/secret scan PASS; DB55322 hậu kiểm0/0/0. Guard fixture3/3, metadata prediction191files;
không suy ra remote payload sạch. Report/ảnh tại docs/remediation-c78/, không đổi KPI/task order
hoặc financial source. Lỗi harness ban đầu đã sửa và full gate chạy lại; không commit/push/deploy/
remote cleanup. F1/F2 local đóng, F3 source C73 cònOPEN. C79 AWAITING_APPROVAL rồi dừng.

## 37. Checkpoint C79 — Hoàn tất

**C79 — Đồng bộ, rollout C78 và dọn đúng hai deployment C73 cũ.** Trạng thái: `COMPLETED`.

OWNER phê duyệt03/10 trong hội thoại.

Mục tiêu: đưa bản sửa đã kiểm local lên webapp và xử lý source artifact lịch sử, giữ rollback C76.
Phê duyệt C79 bao gồm push remote hiện hữu, tạo/smoke/promote Preview và Production,
chuyển default project alias khỏi C73 và xóa đúng hai deployment C73 liệt kê dưới đây sau gate.
Không bắt đầu trước OWNER phê duyệt; không nâng gói GitHub/Vercel.

Phạm vi:

- Review/bảo toàn toàn bộ local C77–C78; credential/artifact/dependency/CI policy và quality gate
  thích hợp. Commit/push fast-forward main hiện hữu; Required CI đúng source SHA xanh trước rollout.
- Root `pnpm deploy:preview` theo AGENTS4.1/runbook; upload guard local đạt, rồi inventory metadata
  source/build output candidate thật không có backup/cache/dump/credential/test-results artifacts.
  Không tải nội dung secret/dump cũ. Nếu metadata không đủ phải ghi NOT_TESTED/blocker, không suy
  từ dry-run rằng upload sạch. Candidate đúng project/target/Ready/sin1; immutable URL trước alias.
- Production root pipeline `--target=production`, giữ alias đang phục vụ trong lúc smoke. Candidate
  public + authenticated read-only smoke privacy/tooltip/focus/KPI375/390/1440 light/dark có dữ liệu
  hiện hữu; không ghi tài chính, tạo QA account hoặc mark-read để ép trạng thái. Handoff login cho
  OWNER khi công cụ cần; không tự bypass cảnh báo Chrome hoặc đổi mật khẩu/auto-lock.
- Chỉ chuyển `tindung-preview.vercel.app`/`tindung.vercel.app` sau smoke; hậu kiểm alias/Auth/log.
  Default alias `quan-ly-vay-ca-nhan-ngotuong2105.vercel.app` phải trỏ candidate Production sạch
  đã đạt smoke trước cleanup. Nếu không xác minh/gán an toàn được thì dừng phần cleanup.
- Cleanup chỉ hai đích C73: Preview `dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb`, Production
  `dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx`. Trước xóa kiểm lại project/org/target/aliases, bảo đảm không
  còn alias phục vụ/rollback/phụ thuộc và giữ deployment C76 tốt. Không dùng bulk deletion,
  retention tự động, không xóa deployment khác hoặc backup local. Không khôi phục source C73 bẩn
  để rollback; rollback dùng C76. Sau xóa kiểm ID/URL/alias/source metadata và ghi giới hạn cache
  của nền tảng; không tuyên bố đã thu hồi mọi bản sao ngoài khả năng kiểm chứng.
- Không schema/migration/remote secrets/data/Google/account setting thay đổi. Nếu thấy bằng chứng
  exposure mới đòi hỏi rotation/incident scope, ghi blocker và xin checkpoint riêng trước mở rộng.

Acceptance criteria:

1. Source GitHub khớp local SHA và Required CI mọi job/gate đạt đúng SHA; không phát hành từ run cũ.
   Upload guard/credential scan đạt; inventory candidate thật chứng minh exclusion theo metadata,
   ghi rõ phần không kiểm contents. Không credential/dump hoặc dữ liệu thật vào Git/log/ảnh.
2. Hai candidates Ready, project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target tương ứng,
   Functions sin1; ghi SHA/ID/immutable URL/alias/rollback/từng smoke. Auth route được truy cập thật.
3. Privacy scale/tooltip/accessible money và eager focus regression đạt local; candidate và alias
   read-only smoke đạt với dữ liệu hiện hữu, KPI trên task. State thiếu dữ liệu remote ghi NOT_TESTED
   với bằng chứng local bổ trợ, không mutate remote để tạo fixture. Browser/runtime errors/HTTP500
   không giải thích được phải chặn promote; hậu kiểm fail trả alias về C76 tốt đã xác minh.
4. Trước cleanup, cả stable/default alias trỏ bản sạch; hai C73 ID đúng, không được dùng làm rollback.
   Sau cleanup không còn hai đích trong inventory/không URL cũ phục vụ app, các alias và rollback C76
   vẫn hợp lệ. Nếu cleanup fail/thiếu quyền/bị policy chặn, giữ C79 IN_PROGRESS với blocker; không
   tuyên bố F3 đóng hoặc tự đổi platform protection. Chrome badge/AT vật lý chỉ đóng khi kiểm thật.
5. Context/roadmap/report đồng bộ; nếu push tài liệu cuối phải xác nhận Required CI đúng final SHA.
   Đặt checkpoint kế tiếp AWAITING_APPROVAL rồi dừng. Không thực hiện trước phê duyệt C79.

C79 ghi nhận blocker packaging khi triển khai source fdc309f: candidate Production
`dpl_FQzWmo7sohL4Bv9XHJWdyw8WpTBQ` ERROR do import E2E tới scripts đã exclude;
chưa promote/alias, C76 còn phục vụ. Điều chỉnh đóng gói để test/Playwright config cùng được
exclude, giữ typecheck/tests local và guard secret/dump. Source8c8a884 đã push,
Required CI37097003400 SUCCESS mọi5 job; root Preview gate51PASS7SKIP và lint/typecheck/unit105/
build đạt. Candidates Preview dpl_CZj4ehKjxCmzc4VazPcMfr87eLbs và Production
 dpl_8x3Fy2rW6detxLGbsmrGSEqjhkyG đều Ready/project đúng/43 route Functions sin1/public4/4;
actual src/out metadata mỗi150source+44lambda0forbidden,150/150 UIDSHA1match.
OWNER đã login cảhai; IAB actual Auth light375/390/1440 mỗi candidate, privacy axis/tooltip/
accessible money/KPI PASS; eager focus Preview3/Production4 cycles, loan1-period summary Preview
và3-period chart cảhai, settings/routes/console PASS; post-light error/5000.
Kết quả03/10: candidates Auth light/dark375/390/1440 và stable aliases dark375/390/1440,
default390dark PASS privacy axis/tooltip/accessible money/KPI/focus/loan-interest/console.
Runtime error/HTTP5000 sau Auth/alias/cleanup; public4/4 từng alias. Root Preview resume full
gate51PASS7SKIP6.9m/unit105/lint/typecheck/build exit0 và alias đúng candidate; Production promote
exit0; default alias cùng Production mới. DB test0/0/0, restore chỉ4syntheticPNG harness outputs.
CLI remove --safe từng đúng ID C73 exit0/removed1; fresh project/target/aliases0/rollback trước xóa
đạt. Sau xóa hai ID absent inventory/inspect notfound, source metadata API404, immutable URLs404
DEPLOYMENT_NOT_FOUND. C76 rollback vẫn Ready/public4/4, không xóa khác/backup local. F3 đóng cho
hai deployment; không tuyên bố purge mọi provider cache/external copy. Không remote financial
writes/schema/RPC/secret/account/Google change. JSON/policy/actionlint/Gitleaks/diff-check PASS.
Closing docs push phải kiểm Required CI đúng final SHA trước completion message; exact SHA/run
được báo trong hội thoại, không dùng source run thay thế. Report/evidence docs/release-c79/.

## 38. Checkpoint C80 — Hoàn tất

**C80 — Audit UX Production C79 và phương án desktop compact.** Trạng thái: `COMPLETED` local03/10/2026.

Mục tiêu: đánh giá trải nghiệm thực sau rollout và chọn cải tiến bố cục desktop còn mở bằng
bằng chứng, giữ card dư nợ/lãi ròng phía trên Việc cần xử lý theo yêu cầu OWNER.

Phạm vi đề xuất:

- Read-only Production hiện hữu: dashboard/range/tasks, loans/list/detail/bốn tab, đối tác,
  chi phí, thông báo và settings; đo thao tác thừa, hierarchy, loading, overflow, focus, privacy.
- Local synthetic kiểm các trạng thái empty/error/pending/draft/save-close có thể không tạo được
  trên dữ liệu thật. Không ghi tài chính hoặc mark-read/đổi preference/permission/tài khoản remote.
- Review desktop compact G2 còn mở và tính nhất quán mobile–desktop; dựng2phương án HTML/mockup
  local với dữ liệu giả để OWNER so sánh. Không sửa runtime sản phẩm, deploy/push/cleanup/migration.
- Không yêu cầu OWNER học VoiceOver; chỉ ghi PASS với công nghệ hỗ trợ/thiết bị có bằng chứng thật,
  còn lại NOT_TESTED. Warning Chrome chỉ truy vết nếu khả dụng, không bypass/đổi security settings.

Acceptance criteria:

1. Mỗi phát hiện có mức độ/file-vị trí/trigger/bằng chứng/nguyên nhân/tác động/hướng sửa; tách lỗi
   tái hiện với nhận xét thiết kế và giới hạn. Không mở lại lỗi C78 đã đóng nếu không có regression.
2. Ma trận375/390/1440 light/dark và các hành trình cốt lõi được ghi phương pháp/kết quả; state
   remote thiếu dùng local synthetic và ghi rõ nguồn, không coi giả lập là thiết bị vật lý.
3. Hai phương án desktop compact được render/kiểm và giữ KPI trên task, mobile tương thích,
   privacy/keyboard/reading order; chưa thay sản phẩm. Không đưa dữ liệu thật/credential vào Git.
4. Context/roadmap/report cùng thay đổi, diff/secret scan và gate harness hiện hữu phù hợp đạt;
   đề xuất remediation C81 có scope/AC cụ thể rồi đặt AWAITING_APPROVAL và dừng.

OWNER phê duyệt C80 trong hội thoại03/10/2026; bắt đầu từ Git sạch5ad7b77. Chưa sửa runtime.

Kết quả: `docs/audit-c80/report.md`, production/local/mockup/probe JSON, proposal và hai
phương án dashboard+loans A/B. Skill Evon ui-ux nhánh V và probe dùng cho bản local.33mẫu
Production light chỉ đọc,78mẫu local375/390/1440 light/dark,56mẫu mockup7khổ×2theme×4route;
4sweep light55mẫu mỗi route,8probe runs cuối0P.2MEDIUM (copy lịch nhắc, drawer privacy),
2LOW (heading mobile, placeholder chart), G1/G2 đề xuất Gu; không mở lại lỗi C78 đã đóng.
21regression PASS; capture đầu lỗi cookie harness, sửa local setup rồi audit1/1 PASS1.8m.
Lint/typecheck, JS/JSON, CI policy/actionlint, diff/secret scan đạt; DB55322 teardown0/0/0.
Manual visual sửa KPI tiền vượt vùng nội dung ở1020px; thêm kiểm0clippedKpiAmounts.
Production dark C80/physical AT/mobile/Safari/Firefox/Chrome warning chưa chứng nhận.
Không sửa runtime/schema/remote/account/secret, commit/push/deploy. C81 AWAITING_APPROVAL.

## 39. Checkpoint C81 — Hoàn tất

**C81 — Compact dashboard/danh sách desktop và sửa UX F1–F4, local.** Trạng thái:
`COMPLETED` local03/10/2026. OWNER đã phê duyệt trong hội thoại, chọn A; chưa phát hành.

Mục tiêu: giảm cuộn và thao tác thừa mà vẫn đọc đủ dữ kiện khoản vay, giữ KPI dư nợ/lãi ròng
trên Việc cần xử lý. Bằng chứng và hai phương án tại `docs/audit-c80/report.md`, `proposal.html`.
Đề xuất mặc định **A**: dashboard task + dòng tiền cạnh nhau trên desktop, danh sách khoản vay
thành hàng compact desktop; mobile giữ card. OWNER có thể chọn B trước khi bắt đầu.

Phạm vi:

- Dashboard: gọn heading/controls/KPI và lịch nhắc thường theo A; giữ báo cáo, so sánh kỳ,
  preset/custom range/query, task identity/expand/thu gọn, analysis và chart/table hiện hữu.
  Cảnh báo overdue thật vẫn rõ và có CTA; không bỏ cảnh báo để đạt mật độ.
- Loans list G2: bố cục hàng trên desktop, card đọc đủ trên mobile, dùng component/link hiện
  hữu. Giữ tên, hướng/trạng thái, gốc ban đầu/dư gốc/lãi phải/lãi đã ghi, ngày/rate, quick
  action, filter/sort/pagination/returnTo. Không đổi dataset hoặc cách quyết toán.
- F1: copy lịch nhắc đúng D–D+30 inclusive theo period-end hiện hữu, không gọi là giao dịch
  đã ghi; clean/overdue/upcoming đúng ngữ cảnh. Không đổi RPC hoặc cửa sổ nghiệp vụ.
- F2: một pattern guard cho Thêm chi phí/Thêm đối tác khi privacy hidden, giải thích và lối
  hiển thị trước modal. Không tự tắt privacy. Giữ dirty/pending/error/success/save-close/focus.
- F3: tên khoản là h1 trên detail; nhãn module mobile không thêm h1 thứ hai, không mất tên.
- F4: một notice chart hidden thay26placeholder; không render geometry/button/tooltip nhạy
  cảm, shown phục hồi chart và accessible table. Không đổi PrivacyRegion toàn cục tùy tiện.
- Chỉ code và synthetic test/local evidence/tài liệu. Không schema/migration/financial RPC,
  dữ liệu remote, quyền tài khoản, secret, Google, push, deploy/promote hoặc cleanup. Không
  redesign settings/notifications, xử lý warning Chrome hoặc chứng nhận AT/thiết bị vật lý.

Acceptance criteria:

1. Dùng cùng fixture/reference C80 để so trước/sau:1440px task start giảm từ527 về≤460px;
   390px từ811 về≤700px. KPI luôn hoàn toàn trên task ở375/390/768/1024/1280/1440 light/dark;
   giữ số tiền và ngữ cảnh/so sánh kỳ chính xác, không cắt tên hoặc bỏ dữ kiện để đạt số đo.
2. Loans1440: khoản mẫu tên thông thường hàng compact≤160px so với card281px hiện tại;
   tên200ký tự được phép tăng chiều cao. Nếu OWNER chọn B: ít nhất3card/hàng ở1440 với cùng
   fixture, không áp height160px của hàng A hoặc cắt dữ kiện để đạt mật độ. Hai hướng và trạng thái ACTIVE/OVERDUE/BAD_DEBT/
   SETTLED,0/tiền≥1tỷ, empty/search-no-result, filter/sort/page/returnTo/quick action được
   kiểm bằng fixture;375/390 không tràn trang hoặc mất lối hành động. Không ép card mobile
   thành bảng ngang; chức năng/data source giữ nguyên.
3. Copy default/custom/clean/overdue/upcoming có regression đúng D–D+30, phân biệt reminder
   và period-end; không dùng phép tính frontend để thay số tiền authoritative.
4. Privacy hidden: trigger tạo hai form không dẫn vào drawer chỉ có hướng dẫn bất khả dụng;
   thông báo lý do/lối hiển thị truy cập được bằng phím, không tự bật số tiền. Khi shown,
   validation/pending/dirty/error/retry/duplicate-submit/repeated-save-close/focus vẫn đạt.
5. Detail4tab có một h1 ngữ nghĩa cho record ở mobile/desktop, light/dark, shown/hidden;
   module label/reading order không mất. Chart hidden có một notice,0sensitive bar controls/
   tooltips/axis values/accessible money; restore và chart/table keyboard hoạt động.
6. Gate hiện hữu phù hợp đạt: diff-check, lint, typecheck, unit, build, full E2E trong DB test
   cô lập (harness opt-in audit không bắt buộc capture trong full CI). Regression C63/C72/
   C75/C78 không giảm assertion/skip để xanh; DB teardown0/0/0 và secret scan đạt. Dùng
   Evon probe trên bản local sửa cùng visual review, phân biệt giả lập và thiết bị thật.
7. Context/roadmap/report cùng cập nhật, bằng chứng/ảnh synthetic review được, runtime chưa
   phát hành. Sau C81 local COMPLETED, chỉ đề xuất checkpoint rollout tiếp theo
   AWAITING_APPROVAL rồi dừng; không tự push/deploy.

Kết quả C81: reference task1440 456,53px/390 697,42px, KPI trước task12mẫu/0clipped/
0overflow; ordinary row1440 154,16px, mobile money-nowrap và đầy đủ metadata/status/direction.
F1–F4 đạt,78mẫu functional; C75 focus-scroll regression sửa trong attention-items, không giảm
assertion. Lint/typecheck/unit108/build/full E2E cuối54PASS9SKIP8,3m exit0, DB55322 0/0/0,
JSON/JS/diff/Gitleaks PASS.9SKIP chỉ capture opt-in, C81 probe đã chạy riêng/ở full capture.
4probe cuối0P/28fixed/110sweep và manual review; Gu ngoài scope/thiết bị thật vẫn ghi giới hạn.
6ảnh C75 harness sinh khác đã restore HEAD; C80 local bảo toàn. Report và HTML/ảnh synthetic
ở docs/remediation-c81/. Không commit/push/deploy hoặc schema/RPC/remote/account/secret change.
C82 AWAITING_APPROVAL, dừng theo AGENTS mục3.

## 40. Checkpoint C82 — Hoàn tất

**C82 — Đồng bộ C80/C81, xác nhận CI và phát hành UI compact lên Preview/Production.**
Trạng thái: `COMPLETED` ngày04/10/2026. OWNER đã phê duyệt trong hội thoại03/10/2026.
Required CI37179819051 của closing SHA1492fe0b0fdb7dc73a2dc50978978d933671fd19 SUCCESS cả5jobs.
Source/candidate/alias/public/Auth/log và local gates đạt; chi tiết docs/release-c82/.
Commit final status chỉ tài liệu phải có Required CI đúng SHA trước completion message.
Phần dưới là trình tự lịch sử, không cấp thao tác mới.
Gate attempt1 phát hiện fixture hook C72/C81 120s ngắn hơn reset+Auth readiness180s;
điều chỉnh riêng hook chuẩn bị fixture300s, giữ assertion và phạm vi runtime C81.
04/10: C75 fullPage capture làm scroll383→640 trước click; chuyển capture sau functional
checks, không đổi assertion/retries/runtime. Targeted C72+C75 9/9 PASS2,4m, lint/typecheck
PASS, DB55322 0/0/0; full54PASS9SKIP8,3m exit0. Capture fix62cdb98 đã push;
Required CI37169996632 attempt1 FAILED tại C81 Auth health502 sau reset (50PASS/1FAIL/
9SKIP/3NOT_RUN14,7m). Deterministic C20-test xác nhận stale gateway: direct200/Kong502,
restart Kong200. Thêm guarded gateway refresh+health sau reset, validate trước reset;
unit113 gồm5guard PASS, lint/typecheck/actual reset PASS. Gateway source8ecdeb4 đã push,
CI37171480847 SUCCESS cả5jobs đúng SHA, unit113/pgTAP527/Auth6/E2E53PASS10SKIP12,7m;
full local54PASS9SKIP7,8m exit0, DB0/0/0. Preview root preflight và Production skip-domain
candidate Ready; root Preview full54/9 exit0 cũng Ready. Hai candidate public4/4/project/
sin1/src151UID khớp/0forbidden đạt. OWNER xác nhận login cảhai; Auth Light84mẫu
375/390/1440 hai hosts đạt KPI/order/0overflow/0clipped, default/custom/chart privacy/
restore/keyboard, loans/detail4tab singleh1 shown-hidden, guards hai form/escape-focus.
Preset/custom date keyboard URL đạt; consoleerror0, runtimeerror/HTTP5000 sau Light.
OWNER bật Dark, tab responsive6 xác nhận dark;84mẫu Dark tương ứng Light đạt trênhai
hosts375/390/1440, tổng168mẫu Auth. Consoleerror0/post-candidate runtimeerror/HTTP5000.
Source exact CI5jobs reverified; viewport reset. Production promote exit0, tindung/default
inspect đúngC82/public4/4. StableAuth dark375/390/1440 dashboard, default390 drawer,
stable390 guards/loans/detail4tab singleh1 đạt; browsererror/runtimeerror/HTTP5000.
Batch CUA timeout đã discard/rerun từng phần đạt. Preview resume exit0 full54/9 8,0m,
unit113/lint/type/build, DB0/0/0; restore7PNG C75. Stable Preview inspect đúngC82/public4/4/
Auth dark375/390/1440 dashboard và390guards/loans/detail4tab đạt, error/HTTP5000.
Không cần rollback final. Closing proof docs push/exact-SHA CI đã đạt. App thiếu Sáng/Tối/Theo thiết bị; ghi checkpoint C83 audit/
design preference/persistence/no-flash/a11y, không đổi runtime C82.
Production --skip-domain tự chuyển default alias; đã rollback riêng default vềC79,
inspect/public4/4 xác nhận. Trước release stable Preview/tindung/default cònC79; nay C82 theo hậu kiểm ở trên.
Không thay runtime, assertion/retries hoặc workflow/CLI version. C82 đạt acceptance criteria.

Mục tiêu: đưa bản sửa đã kiểm local lên webapp thật, giữ card dư nợ/lãi ròng trên Việc cần xử lý.
Phạm vi khi OWNER phê duyệt:

- Review diff C80/C81 và tài liệu, giữ mọi thay đổi không thuộc scope; tạo commit và push GitHub,
  xác nhận Required CI của đúng source SHA. Dùng quy trình phù hợp tài khoản GitHub hiện hữu,
  không yêu cầu nâng cấp hoặc thay repository settings.
- Chạy lại gate trước release; tạo Preview từ root bằng `pnpm deploy:preview`, dùng upload
  metadata guard C78. Chỉ chuyển stable alias sau immutable candidate Auth/public smoke đạt.
- Tạo Production candidate từ root theo contract hiện hữu; kiểm project/target/Ready/sin1,
  public và authenticated smoke thật rồi promote. Hậu kiểm Production/default alias và runtime
  error log; giữ C79 làm rollback, rollback nếu hậu kiểm thất bại.
- Smoke chỉ đọc/mở/đóng: dashboard default/custom, KPI/task order, loans/detail4tab, chart
  hidden/restore/keyboard, guard hai form, preset/custom drawer/focus ở375/390/1440 light/dark.
  Không submit tài chính hoặc tạo đối tác/chi phí thật. OWNER tự login nếu hostname thiếu phiên;
  không lấy credential/cookie ra file/log. Mẫu Production thiếu state giữ NOT_TESTED, bổ trợ
  bằng fixture local, không tạo data để đạt matrix.
- Cập nhật release report/context/roadmap với SHA, CI run, deployment ID, immutable URL,
  alias/target/region, từng smoke/log và rollback reference. Commit/push closing docs và kiểm
  Required CI đúng closing SHA trước hoàn tất.
- Không schema/migration/RPC/remote secret/account/Google, cleanup deployment/backup hoặc
  mở rộng incident/Chrome warning/physical AT. Không redesign màn mới ngoài C81.

Acceptance criteria:

1. Diff-check/lint/typecheck/unit/build/full E2E và DB teardown0/0/0/secret scan đạt trước candidate;
   C63/C72/C75/C78/C81 vẫn giữ assertion. Source và closing Required CI đều SUCCESS đúng SHA.
2. Candidate/aliases đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target tương ứng, Ready,
   Functions sin1; upload guard không có filename cấm, không đọc/download secret/dump bodies.
3. Immutable Preview và Production có public smoke/Auth route thật đạt; KPI trước task,
   không tràn/cắt tiền, single detail h1, D–D+30 copy, privacy notice/restore và explicit guard
   hoạt động. Không thay nguồn số tiền hoặc ghi dữ liệu tài chính thật để kiểm.
4. Chỉ gán stable Preview/promote Production sau candidate gate; hậu kiểm stable Preview,
   `tindung.vercel.app` và default alias có Auth/public smoke/log đạt, không HTTP500/pageerror
   mới. Nếu fail, rollback alias về C79 và giữ checkpoint chưa hoàn tất với bằng chứng.
5. Bằng chứng tách local/remote, giả lập/thiết bị thật, dữ kiện chỉ aggregate/synthetic không lộ
   tài chính thật/secret. Context/roadmap đồng bộ; checkpoint tiếp theo AWAITING_APPROVAL rồi dừng.

## 41. Checkpoint C83 — Hoàn tất

**C83 — Audit sâu đối tác, chi phí, thông báo, cài đặt và lựa chọn giao diện với Evon ui-ux.**
Trạng thái: `COMPLETED` local ngày04/10/2026. OWNER phê duyệt trong hội thoại.

Mục tiêu: xác định thao tác thừa/lỗi/bố cục và lập phương án sửa rõ ràng cho những module
còn lại; bổ sung thiết kế lựa chọn Sáng/Tối/Theo thiết bị theo câu hỏi OWNER.

Phạm vi khi được phê duyệt:

- Production chỉ đọc/mở/đóng; local dùng dữ liệu synthetic và database C20-test cô lập.
- Audit tìm/lọc/phân trang, loading/empty/error, draft/dirty/pending/save-close/focus,
  keyboard/privacy, thông báo và control dùng chung; không request push permission thật.
- Ma trận375/390/768/1024/1440 light/dark. Dùng Evon ui-ux cùng brand/component hiện hữu,
  đo và soi hình thật; không đưa dữ liệu/ảnh tài chính thật hoặc cookie vào Git.
- Audit và thiết kế bộ chọn Sáng/Tối/Theo thiết bị: lối truy cập trên mobile/desktop,
  lưu lựa chọn theo thiết bị/browser, ưu tiên manual so với system, cập nhật khi device đổi,
  no-flash lúc mở app/chuyển route và trạng thái selected/focus/accessible name.
  Đây là phương án để OWNER duyệt, chưa triển khai preference runtime hoặc đổi Auth/schema.
- Báo cáo từng finding với severity, Hỏng/Lệch hệ/Gu, trigger, file/vị trí, nguyên nhân,
  tác động, bằng chứng và hướng sửa. Phân biệt local/remote và NOT_TESTED rõ ràng.
- Chuẩn bị2–3wireframe synthetic cho phạm vi cần thay đổi; đề xuất C84 remediation với
  scope/acceptance criteria cụ thể rồi dừng. Không tự sửa finding.
- Không runtime/schema/RPC/remote finance/secret/account/Google, push/deploy hoặc cleanup.

Acceptance criteria:

1. Có ma trận route/state/viewport/theme đủ hoặc ghi rõ lý do NOT_TESTED; không coi
   fixture local là chứng nhận Production, screen reader hoặc thiết bị vật lý.
2. Findings có bằng chứng tái hiện và file/vị trí chính xác, severity/impact/root cause/fix;
   ưu tiên theo ảnh hưởng công việc. Lỗi đã sửa không bị mở lại chỉ vì bằng chứng lịch sử.
3. Có bảng trước/sau và2–3phương án review được; giữ brand/KPI trước task. Bộ chọn theme
   có specification persistence/system/manual/no-flash và keyboard/selected states rõ.
4. Gate hiện hữu áp dụng đạt: lint/typecheck/diff-check, regression liên quan khi chạy fixture,
   JSON/JS/secret scan; database test teardown profiles/loans/transactions0/0/0.
   Không giảm assertion/skip để xanh; không tạo dữ liệu QA trên Supabase dùng chung.
5. Context/roadmap/report cùng cập nhật. Chỉ đề xuất C84 AWAITING_APPROVAL sau audit
   hoàn tất, không tự triển khai remediation, commit/push hoặc deploy.

Bằng chứng hoàn tất C83:

- Báo cáo/spec/prototype/evidence `docs/audit-c83/`; audit130state +20unbroken samples,
  Production20Light readonly+page99error, app40Evonfixed+220sweep,9Pđã đối chiếu7findingcontrast/
  2falsepositive.7findingconfirmed,1Lệch hệ,3Gu; runtime không sửa.
- Hai phương án A/B80render+20stress0overflow/0clipped, final50fixed+55sweep0P,
  comparison18HTTPlinksPASS và CUA mở deliverable. A khuyên dùng; không tự chọn runtime trước duyệt.
- Audit1PASS4,8m/supplement1PASS2,3m/regressionC63/C67/C72/C75 22PASS4,1m;
  lint/typecheck/build E2E/diff/JS/JSON đạt, DBC20-test0/0/0SQL.6C75generatedPNG restore HEAD.
  Gitleaks raw1public RPC idempotency fixture reviewedfalsepositive/0secret thật, không nới rule.
- Không commit/push/deploy/remote save/mark-read/account/push permission; DarkProduction,
  physicalAT/mobile/authenticatedSafariFirefox C83NOT_TESTED. C84AWAITING_APPROVAL và dừng.

## 42. Checkpoint C84 — Hoàn tất

**C84 — Remediation F1–F7, lifecycle cài đặt và lựa chọn Sáng/Tối/Theo thiết bị, local.**
Trạng thái: `COMPLETED` local ngày04/10/2026. OWNER phê duyệt ngày 04/10/2026 trong hội thoại; chọn phương án A. Báo cáo và lựa chọn tại
`docs/audit-c83/report.md`, `proposal.html`, `theme-spec.md`.

Closing C84: lint/typecheck/unit116/build/full E2E61PASS12opt-inSKIP10,7m exit0;
critical theme/history/native2PASS2,0m.90samples0overflow/clipped/amount/target nhỏ,
normal5,397/large6,702/focus5,169:1 min trong mẫu; cookie/SSR/no-JS/manual/system/history/
meta/native/draft/local-account policy đạt. Evon8probe40fixed+220sweep qua3vòng hình cuốiraw4P
đã loại có lý do; native/cached-head functional fix được kiểm riêng bằng source cuối.40ảnh/
42HTTP200/CUA5khổ/JS/JSON/diff đạt; SQL C20-test55322 six counts0,14C75PNG restored exactHEAD.
Secret raw2reviewfixture id/password,0OWNER/Production/external credential, không đổi rule/ignore.
Không commit/push/deploy/remote mutation; C83 bảo toàn. Report/validation/limits docs/remediation-c84/.
C85 AWAITING_APPROVAL; phần phạm vi dưới là lịch sử đã duyệt, không cấp thao tác C84 mới.

Mục tiêu: người dùng không hiểu sai save/empty, không mất draft không báo, đọc được tiền/
free text trên mọi khổ, chọn theme độc lập với thiết bị và giảm các hàng thao tác lặp.

Phạm vi đã duyệt và thực hiện:

- Sửa F1 pagination out-of-range ở đối tác/chi phí/thông báo và shared helper có liên quan;
  giữ query/unread, canonical page, tránh redirect loop; không đổi schema/RPC hoặc tập dữ liệu.
- Sửa F2 pending editor đối tác và F3 dirty/error/pending/success/focus của user-management.
  Reuse lifecycle hiện hữu, giữ Auth/quyền/password policy/Server Actions; kiểm bằng tài khoản
  giả trong C20-test, không submit tài khoản hoặc credential remote.
- Sửa F4 semantic contrast Light/Dark trên placeholder/muted/eyebrow/unread tint và tổng chi phí;
  giữ sắc brand. Do token chung có thể ảnh hưởng màn khác, kiểm hồi quy login/dashboard/loans/
  detail/drawer/loading/notification/settings, không đổi nhận diện hoặc bỏ focus-visible.
- Sửa F5 privacy phân bổ chi phí; F6 precision tỷ lệ chỉ cho trình bày, không tính lại/đổi VND;
  F7 min-content/wrapping tên120/notes500/category80, không truncate dữ kiện hoặc che overflow.
- Triển khai G1 + L1 theo đặc tả theme: ba lựa chọn Sáng/Tối/Theo thiết bị, cookie browser riêng,
  manual ưu tiên hơn OS, system phản ứng device change, SSR/CSS no-flash, utility dark và native
  color-scheme/meta cùng effective theme. Mặc định phương án **A khuyên dùng** khi duyệt C84;
  OWNER có thể chọn B trước triển khai. Không thêm thư viện/CSP exception chỉ để đổi theme.
- G2: đối tác/chi phí dùng hàng gọn desktop/card mobile theo A; CTA tạo giữ một chỗ, thao tác phụ
  ít lặp nhưng luôn keyboard/accessibility/confirm. Phân bổ chi phí có thể thu gọn; tiền/ngày/
  ghi chú/quyền/đảo giao dịch và audit semantics giữ nguyên. Summary/menu targets tối thiểu44px.
- Thông báo giữ title/body/ngày/trạng thái đọc, pending/error/retry/mark-read semantics và push
  disclosure hiện hữu. G3 rút ngắn nội dung, lọc mới hoặc đổi chính sách nhắc chưa thuộc scope.
- Tài liệu/harness/ảnh đều synthetic. Không remote finance/account/push permission, Google,
  migration/secret, cleanup, commit/push/deploy trong C84; phát hành là checkpoint riêng.

Acceptance criteria:

1. Regression tái hiện F1–F7 trước, đạt sau: valid/out-of-range/filter/page boundary25/26,
   empty thật phân biệt page rỗng; URL/back/forward không loop; totals authoritative không đổi.
2. Pending editor không hứa bỏ thao tác đã gửi; dirty cancel giữ input/focus/scroll, error giữ
   draft/retry, success reset/close/announce/focus đúng. User-management được kiểm bằng fixtures
   riêng, không lưu password nhạy cảm vào browser storage; không giảm quyền/validation.
3. 375/390/768/1024/1440×Light/Dark, dữ liệu thường và hợp lệ120/500/80 không khoảng trắng:
   horizontal overflow0, text đủ/amount nguyên dòng, thao tác44px. Text normal≥4,5:1, large≥3:1;
   contrast trên nền normal/tint/hover/selected và focus được đo; semantic roles giữ brand.
4. Privacy chi phí không còn %/bar width/tooltip/accessible value dẫn xuất; một notice, restore
   đầy đủ, trước hydration/reload đúng. Percentage precision documented, integer-scaled ratio,
   zero/1÷3/nhóm nhỏ/tiền lớn; không floating-point quyết toán tiền.
5. Theme3radio có legend/name/checked/focus/keyboard; chỉ một preference nguồn. Cookie hợp lệ/
   sai/thiếu/bị chặn và OS trái manual/systemchange đều đạt; cold SSR/no-JS/hydration/reload/
   route/loading/error/drawer không flash sai theme và không hydration/CSP error. Không đổi draft
   hoặc Auth khi chọn theme. Mobile Thêm→Cài đặt và desktop Cài đặt truy cập được.
6. Evon probe fixed/sweep và soi ảnh trước/sau synthetic: mọi P xử lý hoặc loại có lý do;
   dashboard KPI dư nợ/lãi ròng vẫn trước Việc cần xử lý. Không chứng nhận physical AT từ emulator.
7. Gate hiện hữu: pnpm lint/typecheck/test/build/test:e2e, diff-check/JS/JSON/secret scan; database
   C20-test teardown profiles/loans/transactions0/0/0. Không nới assertion/skip/retries để xanh.
8. Context/roadmap/report cùng cập nhật; sau đủ gate đặt checkpoint phát hành tiếp theo
   AWAITING_APPROVAL rồi dừng, không tự deploy/push.

## 43. Checkpoint C85 — Đã hoàn tất

**C85 — Đồng bộ C83/C84, xác nhận CI và phát hành UI/theme lên Preview/Production.**
Trạng thái: `COMPLETED`. OWNER phê duyệt ngày04/10/2026. Source198248b/Required CI37199726182
SUCCESS5jobs. Preview/Production candidates và stablePreview/tindung/default hậu kiểm đạt
trong state/môi trường khả dụng; closing proof b568cae/CI37213927772 SUCCESS5jobs đúng SHA.
Final status9813a6b/Required CI37217274995 SUCCESS5jobs đúng SHA đã xác minh trước completion message.
Tại thời điểm chốt C85, C86 chỉ là đề xuất; trạng thái hiện hành theo section44/context.
Final root Preview resume exit0/lint/typecheck/unit116/build/E2E61PASS12SKIP10,0m, SQLsix0/
14C75PNGrestore/runtime18unchanged. Candidate matrix120mẫu và25mẫu bổ sung,3mode/manual/
reload/cachedhistory/meta/4detailtabs/page99/filter/390drawer/focus/closecancel-accept đạt.
Hai nativeconfirm từng chặninput cần OWNER đóngtab; Preview rollbackC82 rồi root resume lại
sau phục hồi, final interactive/public/Auth/log đạt. Production promote exit0, defaultalias
đúng candidate. Mỗi alias Ready/public4/4/consoleerror0/runtimeerror0/HTTP5000, dashboard nămkhổ
KPI trước Việc cần xử lý. Restore system/Privacy banđầu/viewport/draftclosed. Exactinput redact,
Closing proof b568cae/CI37213927772 attempt1 E2E59PASS13SKIP1FAIL17,8m, expense read error
rồi inline-reversal locator timeout tạiC84test200; code/status thiếu nên nguyên nhân chưa xác lập.
Rerun failed jobs attempt2 SUCCESS cùngSHA; không đổi assertions/retries/skips/runtime,
giữ cả raw FAIL và nguyên nhân read chưa xác lập.
Productiondirtynav nativeblock/OSchange/expense distribution thiếuremote giữNOT_TESTED/local
bổ trợ, không quy lỗi sản phẩm. Không submit account/finance/mark-read/pushpermission/schema/
RPC/secret/Google/cleanup. C82rollback giữ nguyên. Bằng chứng docs/release-c85/.

Mục tiêu: đưa các bản sửa đã kiểm local lên webapp thật, xác minh ba chế độ giao diện ở từng
hostname và giữ mọi bất biến tài chính, quyền, privacy, focus và thứ tự KPI trước công việc.

Phạm vi khi OWNER phê duyệt:

- Review diff C83/C84 và tài liệu, bảo toàn thay đổi không thuộc scope; commit/push lên remote
  GitHub hiện hữu, kiểm Required CI đúng source SHA. Giữ quy trình GitHub Free/private,
  không nâng gói hoặc đổi repository settings. Không dùng CI của SHA cũ thay cho source mới.
- Preflight diff-check/lint/typecheck/unit/build/full E2E, guarded C20-test teardown0/0/0 và
  secret/upload metadata scan. C84 opt-in Evon đã có bằng chứng; regression theme/lifecycle/
  privacy/history/native/unbroken vẫn bắt buộc, không giảm assertion/skip/retries.
- Tạo Preview từ repository root bằng `pnpm deploy:preview` theo AGENTS4.1/runbook; immutable
  candidate target preview, đúng project/Ready/Functions sin1. Chỉ chuyển stable alias sau
  candidate public/Auth/runtime smoke đạt; hậu kiểm alias, rollback về C82 nếu hậu kiểm fail.
- Tạo Production candidate từ root theo contract hiện hữu, kiểm immutable URL trước promote.
  Theo dõi cả default alias nếu deploy tự chuyển; nếu bị chuyển trước gate, trả riêng alias
  đó về C82 rồi kiểm. Promote/hậu kiểm `tindung.vercel.app` và default alias sau candidate đạt.
- Smoke nghiệp vụ remote chỉ đọc/mở/đóng: dashboard default/custom và KPI-before-task;
  counterparties/expenses/notifications/settings, loans/detail/drawer; page ngoài giới hạn
  được canonical, empty phù hợp, text/amount/wrapping/44px/contrast ở375/390/768/1024/1440.
  Kiểm ba lựa chọn theme, manual trái OS/system-change, SSR/reload/SPA Back-Forward/loading/
  date/meta/keyboard và draft guard bằng nhập nháp rồi bỏ; cho phép đổi preference cookie và
  ẩn/hiện để kiểm, không submit/mutate tài khoản/tài chính hoặc mark-read remote.
- OWNER tự login nếu hostname chưa có phiên. Dữ liệu thật thiếu state giữ NOT_TESTED, bổ trợ
  fixture local; không tạo dữ liệu thật để lấp matrix, không lưu tên/tiền/ID/ảnh/cookie thật
  vào artifact Git hoặc log. Không request push permission, thay giờ nhận hay policy nhắc.
  Nếu browser có phiên không hỗ trợ giả lập hoặc đổi OS theme, ghi remote system-change
  NOT_TESTED và dẫn bằng chứng local C84 tương ứng; không đổi cài đặt macOS ngoài repository.
- Báo cáo release/context/roadmap ghi exact SHA/CI run, deployment ID/immutable URL/alias/
  target/region, từng public/Auth/log gate và rollback reference; commit/push closing docs và
  xác nhận Required CI đúng closing SHA trước completion message.
- Không schema/migration/RPC/remote secret/account/Google, tạo project mới, cleanup deployment/
  backup, mở rộng physical AT/Chrome warning hoặc redesign khác C84. Lỗi release packaging
  hoặc regression trong scope được sửa rồi kiểm lại; ngoài scope ghi đề xuất trước khi mở rộng.

Acceptance criteria:

1. Source và closing docs đã push, Required CI SUCCESS đúng từng SHA; tất cả preflight áp dụng
   đạt, teardown test0/0/0, không secret/dump/ảnh thật vào Git/upload/log.
2. Candidates đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target tương ứng, Ready,
   Functions sin1, upload guard0forbidden regular filenames; không tải secret/dump bodies.
3. Immutable Preview/Production public và authenticated route smoke thực đạt trước chuyển alias;
   theme3mode/manual/system/meta/native/history/draft/focus/privacy/pagination/text đạt trong
   phạm vi dữ liệu/môi trường có sẵn, giới hạn OS theme được ghi rõ theo phạm vi trên;
   KPI trước Việc cần xử lý và số tiền authoritative không đổi.
4. Stable Preview, `tindung.vercel.app` và default alias trỏ đúng candidate, hậu kiểm public/
   Auth/runtime log không có HTTP500/pageerror mới. Nếu fail, rollback về C82 và giữ chưa hoàn tất.
5. Evidence phân biệt local/remote, giả lập/thiết bị thật và state NOT_TESTED; context/roadmap
   đồng bộ, checkpoint kế tiếp AWAITING_APPROVAL rồi dừng.


## 44. Checkpoint C86 — Đã hoàn tất

**C86 — Đánh giá hiệu quả thao tác sau phát hành C85.**
Trạng thái: `COMPLETED`. OWNER phê duyệt ngày05/10/2026 trong hội thoại.
Final opt-in2/2PASS2,8m/36journeys, app4Evon28fixed+110sweep và supplement;5Gu MEDIUM.
A/B20rendered samples0overflow/clipped/KPI-order/1h1/fontload,4Evon28fixed+110sweep0P;
2appP hidden tooltip falsepositive có proof opacity/contrast, không đổi probe/rule/ignore.
Lint/typecheck/buildE2E/JSON/JS/19HTTP/diff/Gitleaks PASS, DB55322 verifiedsixcounts0.
Remote6route groups390 và12valid dashboard/loans width/theme samples; dirty editor/expense
missingstates/cold trướcHTML/physical AT giữ NOT_TESTED. System/privacy banđầu restored,
consoleerror0/draft0/viewportreset. Không runtime/schema/dataremote/commit/push/deploy.
Report và proposal docs/audit-c86/; C87 AWAITING_APPROVAL, chưa thực hiện.
Bổ sung trực tiếp của OWNER: soi phân vùng nền trắng, typography nhỏ, control phụ chiếm
không gian và màn mở webapp trắng/loading; ghi bằng chứng và đề xuất visual, không sửa runtime.

Kết hợp skill Evon ui-ux theo yêu cầu OWNER khi audit; không mở redesign trong audit.

Mục tiêu: xác định thao tác thừa còn lại bằng hành trình cụ thể, sau khi các lỗi C83/C84 đã sửa.

Phạm vi khi OWNER phê duyệt:

- Audit không submit dữ liệu remote; cho phép nhập nháp rồi bỏ và đổi theme/ẩn-hiện để kiểm,
  khôi phục preference banđầu sau kiểm. Sáu hành trình: tìm khoản vay và mở giao dịch rồi hủy; công việc dashboard đến
  detail và quay lại; tìm/sửa đối tác bằng nháp rồi bỏ; xem/lọc thông báo không mark-read;
  xem chi phí/phân bổ/phân trang; đổi giao diện và quay lại nội dung đang xem.
- Kiểm375/390/1440 Sáng/Tối, bàn phím và Back/Forward trên Production khi có phiên; state
  thiếu dùng fixture C20-test local. Đếm click/navigation/scroll trong từng hành trình,
  ghi step thừa và điểm phải nhớ thông tin; không coi thời gian runner là tốc độ người dùng.
- Đối chiếu phản hồi OWNER đã có; findings gồm mức độ, vị trí, nguyên nhân, ảnh/số đo giả hoặc
  metadata ẩn danh, tác động và cách sửa. Không đưa tên/tiền/ID/ảnh/cookie thật vào artifact.
- Chỉ đề xuất remediation có scope/acceptance cụ thể khi có finding; không sửa runtime/schema/
  dữ liệu, submit tài chính/tài khoản remote, mark-read, push permission, deploy/cleanup hoặc
  tạo tài nguyên. Không bắt OWNER học VoiceOver, không tuyên bố thiết bị thật/AT chưa kiểm.

Acceptance criteria:

1. Có matrix36tổ hợp6hành trình×3khổ×2theme, ghi PASS/FAIL/NOT_TESTED và phân biệt local/remote.
2. Mỗi kết luận thao tác thừa có chuỗi bước/số lần click/navigation/scroll quan sát được;
   lỗi C83/C84 đã đóng chỉ mở lại khi có bằng chứng mới trên bản C85.
3. Findings và đề xuất phân biệt lỗi/Gu/giới hạn; không tự triển khai redesign hoặc mutation.
4. Gate tài liệu/script hiện có phù hợp đạt, context/roadmap cùng cập nhật. Đề xuất checkpoint
   tiếp theo AWAITING_APPROVAL rồi dừng; không tự phát hành hoặc thêm automation.


## 45. Checkpoint C87 — Hoàn tất local

**C87 — Làm rõ phân vùng, typography, control phụ, startup và lối phân trang Chi phí.**
Trạng thái: `COMPLETED` local. OWNER phê duyệt rõ C87 phương án B ngày05/10/2026 trong hội thoại.

OWNER chọn hướng A hoặc B trong `docs/audit-c86/proposal.html`; B khuyên dùng theo phản hồi
cần bớt đơn điệu. Đây là lựa chọn vai màu có chủ ý, không tự neutral hóa brand theo Gu skill.

Phạm vi khi phê duyệt:

- Remediation local G1–G5; dùng Evon ui-ux và bộ component/token sẵn, không cài thư viện/font mới.
  Chốt hướng đã duyệt rồi áp hệ phân vùng/nhịp lên dashboard, loans/detail, counterparties,
  expenses, notifications/settings và các overlay liên quan. Giữ logo/Inter/blue, màu trạng thái
  có nghĩa; nếu B giữ sidebar navy và một KPI xanh như mockup. Prototype số giả không thành data.
- Body chính16px/nhãn14px/nav≥12px, KPI18–24px phù hợp bề rộng và số tiền đầy đủ; nhịp/weight
 400/500/600 rõ. Không cắt hoặc đổi giá trị authoritative để đạt geometry; unit vẫn đọc được.
- Control phụ chữ14px/weight500–600, theo nội dung; toggle toàn bộ công việc vào header, không
  full-width một hàng riêng. Giữ mobile target44px, keyboard/focus-return/privacy/dirty/pending/
  error/retry và scroll stability. KPI luôn trước Việc cần xử lý trong DOM/reading order.
- Startup branded neutral fallback và skeleton rõ vùng, dùng theme hiện hành; không giả phần
  trăm, delay nhân tạo, chuyển Auth sang client hoặc lộ dữ liệu khi chưa resolve profile.
  Đo riêng cold/TTFB/first-feedback và giới hạn trướcHTML; không hứa không trắng dưới mọi mạng.
  Không thay security/session/RPC để đạt hình. SPA spinner/progress bám transition thực.
- Thêm lối phân trang gần đầu danh sách Chi phí khi nhiều trang; giữ count/canonical/query/
  pageSize25 và footer. Label nav rõ, không gỡ bài kiểm query/BackForward khi thêm control.
  Không mở rộng thêm quick-theme toàn app, redesign chart logic hoặc thay notification policy.
- Fixture/reset/mutation chỉ đúng disposable C20-test guard; remote nếu có phiên chỉ đọc,
  mở/đóng/nháp không submit và preference rồi restore. Không bắt OWNER học VoiceOver.
- Report/review/ảnh fake và context/roadmap; không commit/push/deploy, schema/RPC/migration,
  finance/account/mark-read/push permission remote, secret/Google/resource/backup cleanup.
  Release và exact-SHA CI/rollout là checkpoint riêng sau khi OWNER duyệt review local.

Acceptance criteria:

1. Hướng A/B đã được OWNER chọn, có trước/sau render thật cùng fixture/theme/width. Kiểm
   375/390/768/1024/1440 Light/Dark các route/state liên quan; không overflow/clippedVND/name
   mất nghĩa, chỉ1visibleh1, KPI-order đúng. Màu/card/header được phân vùng theo hướng đã duyệt;
   chữ thường≥4,5:1/chữ lớn≥3:1 trong mẫu, focus-visible và privacy không hồi quy.
2. Chữ và control đạt contract trên; toggle không còn full-width hàng riêng, danh sách việc
   expanded/collapsed giữ tập authoritative/focus/scroll. VND lớn/0/âm và tên dài được kiểm
   với giới hạn hợp lệ; không rút gọn quyết toán/giấu ghi chú để làm đẹp.
3. Auth local2/10s có branded fallback nhìn thấy≤1500ms trong delayed-resolved-profile test;
   không dữ liệu riêng tư trước resolve. SPA1800ms có feedback đến complete/error/cancel,
   reload/manual/system/BackForward/no-flash/reduced-motion đạt. Ghi cold network/TTFB/PWA
   khả dụng, thiếu capability giữ NOT_TESTED, không dùng ảnh để kết luận mọi cold-start đã sửa.
4. Fixture26expenses: Trang sau/Trang trước có lối vào gần đầu (ở375/390 không cần xuống cuối
   toàn25rows), count/canonical/page2/BackForward đúng; footer dùng được, không tăng mutation
   hoặc đổi pageSize25. Đo thao tác/scroll trước/sau, phân biệt runner và người dùng thật.
5. diff-check/lint/typecheck/unit/build/full E2E hiện hữu đạt, gồm hồi quy tài chính/privacy/
   draft/focus/theme/canonical; không giảm assertion/retries/skips để chốt. Evon probe và mắt
   xem Light/Dark/khổ cố định+sweep; mọiP đối chiếu rõ theo skill, tối đa3vòng hình. DBguard/
   teardown verified0, secret/artifact scan PASS; không ảnh/ID/amount/credential thật vào Git.
6. Docs context/roadmap cập nhật cùng thay đổi, review local mở được; checkpoint release kế
   tiếp AWAITING_APPROVAL rồi dừng. Không tự deploy/push hoặc bắt đầu checkpoint tiếp.

C87 final evidence: lint/typecheck/unit117/build19/full E2E64PASS14opt-inSKIP15,1m exit0;
88mẫu/18before matched fixture, Evon vòng3 raw6P đã đối chiếu/0actionableP, DB C20-test55322
sixcounts0,17C75files restore exact baseline/C86 bảo toàn. Report/review/validation/probe
reconciliation: docs/remediation-c87/. Không commit/push/deploy/remote mutation; các giới hạn
trướcHTML/PWA/physical AT/mobile/Safari/Firefox giữ NOT_TESTED. C88 chờ duyệt rồi dừng.

## 46. Checkpoint C88 — Hoàn tất

**C88 — Đồng bộ và phát hành giao diện C87 B lên Preview/Production.**
Trạng thái: `COMPLETED`. OWNER phê duyệt ngày05/10/2026; rollout/source/closing proof gates đã đạt.

Phạm vi khi phê duyệt:

- Bảo toàn source/artifacts C86 và C87, kiểm diff/secret/upload guard rồi commit/push
  fast-forward. Xác minh Required CI của đúng source SHA, tất cả job thành công trước rollout.
- Thực hiện gate hiện hữu phù hợp và root `pnpm deploy:preview` theo AGENTS.md mục4.1;
  immutable candidate phải đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview,
  Ready và route Functions sin1. Không gọi deploy từ apps/web hoặc tự gán stable alias.
- Public/Auth smoke candidate trên browser thực: dashboard, khoản vay/detail, đối tác,
  chi phí, thông báo và Cài đặt, Light/Dark ở375/390/768/1024/1440 khi state khả dụng.
  Kiểm bố cục B/chữ/KPI trước công việc/privacy/theme/history/loading và drawer mở/đóng
  không submit. Thiếu state remote thì ghi NOT_TESTED và dùng local regression bổ trợ,
  không tạo dữ liệu QA trên Supabase dùng chung. OWNER tự login hostname chưa có phiên.
- Chỉ chuyển stable Preview khi gate candidate đạt, smoke lại alias/runtime logs;
  giữ deployment tốt C85 để rollback nếu hậu kiểm không đạt.
- Tạo candidate Production cùng source qua luồng root, giữ alias vận hành đến khi public/
  Auth/provenance/log gate đạt. Promote rồi kiểm tindung.vercel.app và default project alias;
  rollback về C85 nếu hậu kiểm lỗi. Không coi Ready/build là thay authenticated smoke.
- Kiểm inventory metadata được trả về: không có cache/backup/secret/dump/test artifacts bị
  upload, source UID đối chiếu snapshot; không tải nội dung secret/dump. Ghi ID/URL/alias/
  target/region/SHA/gate/giới hạn và lịch sử failures thực vào docs release/context.
- Chốt tài liệu bằng commit/push và xác minh Required CI của đúng closing SHA trước báo
  hoàn tất. Không lấy CI source thay CI closing. Đặt checkpoint kế tiếp chờ duyệt rồi dừng.
- Không schema/migration/RPC/credential/session/account/finance/mark-read/push permission/
  Google/backup mutation hoặc cleanup deployment. Preference browser để smoke được restore;
  không đưa ảnh/tên/ID/amount/cookie thật vào Git. Không mở lại kiểm AT/mobile vật lý chưa khả dụng.

Acceptance criteria:

1. Source GitHub khớp SHA local; Required CI source và closing đúng SHA đều SUCCESS mọi job.
   Không giảm assertion/retries/skips hoặc bỏ gate để phát hành.
2. Preview dùng root pipeline; candidate và aliases đúng ID/project/target/region, public
   smoke đạt; authenticated routes thực và Light/Dark/reflow/keyboard khả dụng đạt.
3. Production candidate/aliases đạt public/Auth/provenance và không có app runtime error
   hoặc HTTP500 liên quan trong cửa sổ smoke; có rollback C85 đã xác minh trước promote.
4. Bố cục B, typography, toggle header, KPI-order, privacy, theme và phân trang không hồi quy;
   remote state/thiết bị chưa kiểm được ghi rõ, không dùng số liệu local thay chứng nhận remote.
5. Upload/secret guard đạt; không ghi dữ liệu dùng chung hoặc cleanup. Context/roadmap/report
   phản ánh từng source/candidate/alias/closing proof và đặt checkpoint kế tiếp AWAITING_APPROVAL.

C88 tiến độ05/10: source b2abc255f470cd551595cbfa9978b08242e00847 push fast-forward;
CI37295262054 attempt1 SUCCESS mọi5job, pgTAP527/Auth6/E2E62PASS16SKIP18,4m. Local/root
E2E63PASS15SKIP10,8/10,6m, không giảm assertion/retries/skips; DB C20-test55322 sixcounts0,
C75/runtime C87 bảo toàn. Preview dpl_DWAs22T33Lt69qo9kdnYbXEs6dov và Production
dpl_3QFNFMS7hvU7pdocnSsUVLrs27wo Ready/đúngproject/43routeFunctions sin1/157UIDmatch/
0forbidden/public4/4/preauth runtimeerror0/HTTP5000. Native public login10samples0overflow.
OWNER đã login; Auth140mẫu/7route/5khổ/LightDark0overflow/Inter/KPI-order, final interactions
Preview17/Production18 đạt, console0/runtimeerror0/HTTP5000/public4/4. Theme system/privacyẩn
restored. Native harness failures và early-query rerun giữ rõ; DNS public Production retry PASS.
Root Preview resume exit0/E2E63PASS15SKIP10,7m, DB55322 sáu counts0/C75 restored/runtime12khớp.
Stable Preview đãtrỏ C88; Auth18samples/7route LightDark/drawer/filter/public4/4/log0 hậu kiểm đạt.
Production promote exit0; tindung/default trỏ dpl_3QFNFMS7hvU7pdocnSsUVLrs27wo. Baalias
54Authsamples/7route LightDark/12checks/public4/4/runtime0 hậu kiểmPASS; exactproject/team/
157UIDmatch/0forbidden, C75/runtime12 bảo toàn; khôngrollback/cleanup. System/privacy từnghost
restore đúng ban đầu;11tabtạm đóng/viewportreset. Closing proof385b7c1
CI37311126932 attempt2 SUCCESS5jobs đúngSHA, pgTAP527/Auth6/E2E62PASS16SKIP
18.2m; JSON/diff/policy/actionlint/Gitleaks docs+history161commits PASS0secret. C88
COMPLETED/C89 AWAITING_APPROVAL. Exact final status CI xác minh trước completion message,
kết quả run/SHA báo trong hội thoại; sourceCI không thay closingCI. Report docs/release-c88/.


Closing CI lần đầu run37311126932/385b7c1 attempt1 FAIL: E2E61PASS16SKIP1FAIL15,7m, C87 branded startup/SPA test line76; delayed RSC interceptor line85 báo `route.continue: Route is already handled!`, rồi ready() kết thúc theo test. Chưa tái hiện hoặc xác định chắc chắn causal race; không tuyên bố sửa sản phẩm hay hết flake. Chạy nguyên ca local3lần PASS3/0 trong4,4m với retries0, teardown sáu counts0; rerun chỉ2job đã fail trên nguyênSHA, attempt2 SUCCESS mọi5job. Không đổi runtime/harness/assertion/timeout/retries/skips; ECR pull rate-limit tự retry đã qua, không phải nguyên nhân E2E. Rủi ro interception còn có thể lặp; nếu tái diễn cần remediation harness có evidence thay vì tiếp tục retry.

## 47. Checkpoint C89 — Hoàn tất audit

**C89 — Nghiệm thu trải nghiệm giao diện B sau phát hành C88 và chốt backlog UX.**
Trạng thái: `COMPLETED` ngày06/10/2026. OWNER phê duyệt trong hội thoại; chỉ audit, không thuộc release C88.

Phạm vi đề xuất:

- Dùng Evon ui-ux nhánh review để đối chiếu giao diện B thực tế với yêu cầu nền phân vùng,
  chữ dễ đọc, control phụ gọn và loading. Giữ hướng B đã duyệt; chưa redesign hoặc sửa sản phẩm.
- Audit các hành trình Tổng quan → việc đến hạn → khoản vay/chi tiết; tìm/lọc/Back; mở/đóng
  drawer; danh sách Chi phí/đối tác; thông báo và ba chế độ giao diện. Đo bước thao tác, cuộn,
  focus, đọc số tiền đầy đủ và trạng thái pending/error/retry trong phạm vi khả dụng.
- Remote Production/Preview chỉ đọc, không input/submit/mark-read/permission hoặc QA data.
  Các ca lưu thành công/validation lỗi/draft và phân trang26chi phí kiểm bằng fixture local
  disposable C20-test có guard; giữ rõ khác biệt với dữ liệu/thiết bị vận hành.
- Light/Dark tại375/390/768/1024/1440 cho route/state liên quan; kiểm contrast/typography/
  hierarchy/target/focus/privacy. Thiếu capability/state giữ NOT_TESTED; không yêu cầu OWNER
  học VoiceOver, không mở rộng thiết bị/OS/network hoặc cleanup tài nguyên.
- Report có bằng chứng file/vị trí, nguyên nhân, tác động, hướng khắc phục; tách lỗi chức năng
  theo HIGH/MEDIUM/LOW khỏi đề xuất Gu/thẩm mỹ. Chỉ đề xuất remediation có phạm vi/AC cụ thể
  nếu còn phát hiện đáng sửa; không tạo chuỗi redesign khi thiếu bằng chứng hoặc phản hồi mới.
- Chỉ tài liệu/ảnh synthetic và harness audit cần thiết; không đổi runtime/schema/RPC/Auth,
  dữ liệu/secrets/accounts/Google/backups, không commit/push/deploy. Không đưa dữ liệu thật vào Git.

Acceptance criteria:

1. Có ma trận hành trình/breakpoint/theme và đối chiếu những yêu cầu OWNER đã nêu; số bước/cuộn/
   focus và trạng thái tải có phép đo, không lấy ảnh đơn lẻ làm chứng nhận mọi cold-start.
2. Mọi phát hiện có evidence và mức độ; phân biệt rõ app failure, harness/browser limitation,
   Gu và NOT_TESTED. Không kết luận remote save/AT/physical mobile bằng kết quả local.
3. Hồi quy phù hợp hiện hữu về privacy/theme/drawer/draft/query đạt; nếu thêm/sửa harness thì
   lint/typecheck và gate targeted áp dụng đạt. DB đúng C20-test55322 teardown0; diff/secret/
   artifact checks PASS, không giảm assertions/retries/skips.
4. Context/roadmap/report cập nhật cùng thay đổi; đề xuất checkpoint remediation kế tiếp với
   phạm vi/AC rõ nếu cần, đặt AWAITING_APPROVAL và dừng. Không tự sửa hoặc phát hành.

Kết quả: Evon nhánh review,70local samples/60journeys,140native Production/Preview samples
đúng width/theme/0overflow/h1=1/body16/KPIbeforetask; privacy ẩn gốc giữ nguyên.3Settings
samples font-loading có recapture loaded đạt, không xóa bằng chứng ban đầu. Native query
aria-current lấy sớm giữ HARNESS_INCOMPLETE; settled filter/Back/Forward đạt. System từnghost
restore/viewport reset/tab tạm đóng; console0 trên hai tab ma trận. Không input/submit/mark-read.
Audit1PASS7.6m, regression22PASS5.5m, proposal1PASS1.9m mỗi lượt (lượt2 thêm glyph proof),
lint/typecheck/build qua E2E PASS.14Evon probes/98fixed/385Light sweep,12rawP reconciled:
6false-positive tooltip/closed details,4tab→F2,2notification hover→Gu. F1 VND split được
Range/ảnh xác minh ngoài danh sáchP; overflow0 không đủ chứng nhận đọc tiền. F1 MEDIUM,
F2 LOW/Lệch hệ;4Gu chưa chọn sửa. C20-test55322 guard+6counts0,118runtime/17C75hashes
bảo toàn;15generated C75 restored exact baseline. Artifact/secret/diff và native review đạt;
chi tiết report/review/JSON/probe reports ở docs/audit-c89/. Không commit/push/deploy.
Chưa chứng nhận AT/mobile vật lý/SafariFirefox/OS/mạng trướcHTML/remote save hoặc maximum
BigInt; không suy localPASS thành remote. C90 chờ duyệt, không tự thực hiện.

## 48. Checkpoint C90 — Hoàn tất

**C90 — Sửa F1–F2 presentation tiền VND và hàng tab chi tiết khoản vay.**
Trạng thái: `COMPLETED`. OWNER phê duyệt rõ C90 trong hội thoại ngày06/10/2026.

Phạm vi:

- F1 C89: sửa overflow-wrap và selector grid lan xuống span VndText của overview-primary/
  supporting. Số và₫ cùng dòng, chữ số đầy đủ; tiền dài dùng chiều ngang/cỡ chữ thích ứng,
  không ellipsis/làm tròn/đổi đơn vị hoặc tự quyết toán. Ưu tiên fix selector/wrapper tại
  globals.css; nếu cần wrapper trình bày VndText phải kiểm mọi nơi dùng, không đổi formatter.
- F2 C89: hàng loan-tabs dùng đủ ngang và basis theo label, không ép hai dòng ở375/390;
  giữ active/keyboard/query/Back và target44px+. Không mở rộng redesign header/brand.
- Giữ phương án B/Inter/body16/control14, KPI dư nợ/lãi ròng trước Việc cần xử lý,
  status/PrivacyAmount/accessible identity, lifecycle drawer/draft/success/idempotency.
- Chỉ source presentation, regression phù hợp và tài liệu/ảnh synthetic. G1–G4 chưa chọn,
  không tự thay bảng, font toàn app, tên200 ký tự, native picker/focus ring hoặc hover khác.
- Không thay nghiệp vụ authoritative/RPC/schema/Auth/session/secrets/accounts/Google/
  thông báo/backup; không dữ liệu vận hành/QA remote, commit/push/deploy/cleanup tài nguyên.
  Fixture/reset/teardown chỉ C20-test55322 với guard hiện hữu. Phát hành cần checkpoint riêng.

Acceptance criteria:

1. Trước/sau có cùng fixture/theme/width và Range rects của số/₫; không chỉ kiểm overflow.
   Giá trị0, tiền thường,17chữ số và số hợp lệ tối đa9223372036854775807 giữ nguyên text;
   số âm tại nơi có thể xuất hiện phải được kiểm presentation synthetic, không tạo giao dịch
   âm trái validation. Có thể dùng fixture component trình bày để tránh tràn SQL aggregation.
2. Chi tiết375/390/768/1024/1440 × Light/Dark: số không ngắt giữa chữ số,₫ cùng dòng,
   không clipping/page overflow, hero tối thiểu18px; nhãn/giá trị khác dễ đọc theo B. Các nơi
   dùng VndText (dashboard/loan card/chi phí/detail) không hồi quy; privacy không còn số thật
   trong DOM/accessibility khi ẩn. Không dùng font siêu nhỏ hoặc cắt số để vượt gate.
3. Loan tab một dòng/target44px+ tại5khổ/2theme; khi thiếu ngang dùng scroller nội bộ
   có keyboard/focus, giữ label/active/current và URL/Back. Không đổi điều kiện truy vấn dữ liệu.
4. Hồi quy local hiện hữu drawer success/error/dirty/dismiss/focus, theme/history/query/
   notifications/privacy đạt. Lint/typecheck/test/build và E2E targeted phù hợp đạt; không
   giảm assertions/retries/skips. Không bắt OWNER thao tác VoiceOver để nghiệm thu local.
5. Có review/rendered before-after và kết quả Evon được reconcile, mọi rawP có disposition;
   giới hạn AT/device/remote giữ NOT_TESTED, không coi ảnh synthetic là Auth smoke Production.
6. Guard đúngC20-test55322/sáu counts0, artifact/secret/diff PASS, bảo toàn thay đổi có sẵn
   và C75 generated baseline. Cập nhật context/roadmap cùng thay đổi, chỉ COMPLETED khi gate
   đạt; đặt checkpoint tiếp theo AWAITING_APPROVAL nếu cần rồi dừng, không tự phát hành.

Kết quả C90 ngày06/10: runtime chỉ globals.css; F1 nowrap/scopewrapper/adaptivewide và F2
fullwidth/basisauto/tab14px/target48px.40actual/50stress/10privacy-keyboard-Back journeys
sau sửa0fail, text90rows khớp trước/sau; before60fail giữ. Max/signed chỉ trình bày thực,
không ledger.28PNG review; Evon2/14fixed/55sweep rawP0/36warnings ngoàiP reconciled,
không G1–G4/focus/picker removal. Lint/typecheck/unit117/build19 và targeted24PASS/0FAIL/
0SKIP/retries0/7.5m đạt. Final2 retained23PASS/1FAIL8.0m: C63 box lấy trước async
settlement-preview, sai hit target; bổ sung readiness assertion, không đổi runtime/assertions/
timeout/retries. Final3 sạch; prior setup/JSX harness failures giữ riêng. Guard55322 sixcounts0,
117runtime/C89harness/92artifacts/17C75 bảo toàn,15generated restored. Artifact/secret/diff/
native-review đạt theo docs/remediation-c90/validation.json; AT/device/remote/OS/PWA trước
HTML giữNOT_TESTED. C90COMPLETED, C91AWAITING_APPROVAL; không commit/push/deploy.

## 49. Checkpoint C91 — Đã hoàn tất

**C91 — Đồng bộ và phát hành bản sửa C90 lên Preview/Production.**
Trạng thái: `COMPLETED`, OWNER đã login cả hai. OWNER phê duyệt C91 và bản vá riêng source-map-js1.2.2/
sharp0.35.5 ngày07/10/2026. Các gate đã kiểm đầy đủ; lịch sử auditFAIL được giữ.

Phạm vi khi phê duyệt:

- Bảo toàn local audit/harness/docs C89 và source/regression/docs C90. Kiểm scope/diff/
  secret/upload guard, commit/push fast-forward; xác minh Required CI đúng source SHA,
  mọi job thành công. Dùng GitHub hiện hữu, không thay gói/branch protection/account.
- Chạy gate hiện hữu áp dụng: diff/lint/typecheck/unit/build/fullE2E; pgTAP/Auth theo CI.
  Không giảm assertions/retries/skips; giữ failure evidence và readiness fix C63.
- Preview chỉ root `pnpm deploy:preview` theo AGENTS§4.1/runbook; immutable candidate đúng
  project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview/Ready/Functions sin1.
  Public+authenticated smoke trước stable alias; kiểm lại alias/runtime logs sau chuyển.
- Native Auth smoke dashboard/loan list/detail/expenses/notifications/settings/counterparties,
  Light/Dark tại375/390/768/1024/1440 khi state khả dụng. F1/F2 glyph/₫/tab/keyboard/Back,
  brand B/font/KPI-order/privacy/theme/query/loading/drawer mở–đóng không submit.
  Không đưa max/negative vào ledger dùng chung; state thiếu ghi NOT_TESTED và local bổ trợ.
  OWNER tự login hostname thiếu phiên, không xin lại phê duyệt checkpoint cho mỗi smoke.
- Candidate Production cùng source theo luồng root; public/Auth/provenance/log gate trước
  promote. Hậu kiểm tindung.vercel.app/default alias; giữ và xác minh rollback tốt C88
  cho Preview/Production trước chuyển, thực hiện rollback nếu hậu kiểm thất bại.
- Inventory upload metadata/provenance: không cache/backup/dump/secret/test artifacts;
  không tải nội dung secret/dump. Preference browser restore, ảnh/tên/amount/IDs/cookie
  thật chỉ cache ignored nếu cần, không Git. Ghi SHA/ID/URL/alias/target/region/log/smoke.
- Chốt docs bằng commit/push, Required CI đúng closing SHA phải SUCCESS trước báo hoàn tất.
  Đặt checkpoint kế tiếp AWAITING_APPROVAL và dừng. Không tự triển khai G1–G4.
- Không schema/migration/RPC/credential/session/account/finance/mark-read/push permission/
  Google/backup mutation, resource cleanup hay dữ liệu QA remote. Fixture/reset/teardown
  chỉ C20-test55322 với guard và sixcounts0; C75/C89 source/artifacts bảo toàn.

Acceptance criteria:

1. Local/GitHub đúng source và closing SHA, Required CI của mỗiSHA SUCCESS mọi job;
   gate local đạt, giữ log lỗi/rerun và không thay gate để phát hành.
2. Preview root pipeline candidate đúngproject/target/sin1/Ready, public/Auth/glyph/tab/
   keyboard/privacy/B smoke đạt trước chuyển; stable alias+runtime hậu kiểm đạt.
3. Production candidate+aliases public/Auth/provenance/log đạt, không app runtimeerror/
   HTTP500 liên quan trong smoke; rollback C88 đã xác minh và có thể áp dụng nếu cần.
4. Remote state/device thiếu được ghi rõ, không coi local ảnh/zerooverflow là chứng nhận
   remote glyph/AT/save. Không mutate nghiệp vụ/dữ liệu thật để nghiệm thu UI.
5. Context/roadmap/report cùng cập nhật, upload/secret/diff/DB0 và preservation đạt,
   C91 chỉCOMPLETED khi exact closing CI/smoke đạt; checkpoint kế tiếp chờ duyệt rồi dừng.

Kết quả C91 ngày 08/10/2026: runtime source ed72b86 có Required CI37644195261 thành công
cả 5 job. Closing proof `839d34b348e7dd435688365435cc0336bfcb4eb0` có [Required CI](https://github.com/ngotuong/quanlyvay/actions/runs/37803762628) thành công cả 5 job:
pgTAP527/Auth6/E2E63 đạt/19 bỏ qua. Local gates đạt;
C87 race tái hiện và đã sửa vòng đời interception, targeted3/3 và fullE2E64/18/11,5 phút đạt.
Không đổi assertion/timeout/retry/skip; test excluded khỏi deployment, runtime giữ nguyên.
Preview dpl_CcJW5X4RDoUjCnPyi34t8uWapJCV và Production dpl_Bnfe3DmqhkZ2vdKKkgZZJrNosEHu
đã phát hành đúng project/team/target/sin1/Ready. Native140/32 và alias54/12/public4/4 đạt.
Rollback C88 đã xác minh, không cần kích hoạt; preferences, C75, baseline và DB0 bảo toàn.
Lượt CI chốt đầu FAIL và lỗi database query_canceled57014 ngày tiếp tục được giữ trong report.
Dashboard đã hồi phục, khoảng runtime hậu kiểm mới sạch; chưa khẳng định sửa nguyên nhân DB.
Final status exactCI phải đạt trước thông báo hoàn tất. C92 AWAITING_APPROVAL, chưa triển khai.
Bằng chứng: docs/release-c91/.

## 50. Chuỗi cải thiện UI/UX sau C91 — Kế hoạch đã thống nhất

Ngày06/10/2026 OWNER đồng ý đánh giá và trình tự cải thiện, yêu cầu dọn tài liệu để bắt đầu
trong cuộc trò chuyện mới. Đây là sự thống nhất kế hoạch; chưa thực hiện hoặc tự đánh dấu
APPROVED toàn bộ checkpoint. C91 giữ đúng phạm vi phát hành C90, không tái sử dụng sốC91
cho Design System. Chuỗi dưới là kế hoạch tương lai, chỉ thực hiện khi checkpoint tương ứng
được duyệt rõ. Sau C91 hoàn tất đặt C92 AWAITING_APPROVAL; các mốc sau theo AGENTS§3.

Điều kiện chung:

- Chốt hình đích bằng render có dữ liệu giả, không dùng giảm số dòng CSS/thêm animation làm
  thước đo đẹp. Giữ B/brand/status và KPI trước công việc trừ thay đổi OWNER chọn rõ.
- Không đổi nghiệp vụ authoritative/schema/RPC/Auth/accounts/secrets/Google/backup hoặc
  dữ liệu dùng chung. Chỉ fixture C20-test có guard; không ghi max/signed trái validation vào SQL.
- Mỗi mốc local có report/before-after/hồi quy phù hợp, source/artifact preservation,
  secret/diff và DB teardown; không giảm assertions/retries/skips. Update context/roadmap
  cùng thay đổi. Gate hiện hữu; không phát hành các mốc local này trước checkpoint riêng.
- WCAG2.2AA là mục tiêu; không gọi riêng contrast PASS là toàn bộ WCAG PASS. Phạm vi routes/
  states/browsers/devices được ghi rõ. AT/mobile thật/remote states thiếu là NOT_TESTED.
- Khi tool/skill không có, ghi giới hạn; không yêu cầu OWNER học VoiceOver hoặc dùng local
  matrix để hứa60fps mọithiết bị/zeroCLS toànapp/nhanhgấp3 không có baseline.

### C92 — Thiết kế đích và baseline trải nghiệm

Trạng thái: `COMPLETED`. OWNER duyệt C92 và chọn A ngày09/10/2026, yêu cầu Quick Amount50tr/100tr/150tr/….
Đã khóa docs/design-c92/selected-design.md:4nút +50tr/+100tr/+150tr/+200tr; A nguyên bản, không D/E.
Baseline32samples/16journeys (50triệu Tiền gốc8phím số), test1PASS1.6m; prototype110samples0fail/
keyboard2PASS/labelchips4PASS; contrast10cases/diff/secret/preservation1063file/teardown0 đạt.
Mẫu bền: docs/design-c92/reference/; brief/report/proof cùng thư mục. Không runtime/deploy.

Phạm vi: dùng Evon ui-ux, audit stack/primitives/token trước; brief tác vụ Dashboard/detail/
drawer/bảng,2–3 hướng thiết kế trước/sau mobile/desktop Light/Dark. G1–G4 và Quick Amount/
inline Dashboard drawer được xem trong ngữ cảnh, không tự chọn tất cả. Loading đã có shimmer,
quick task đã mộtclick→detail auto-open; cải tiến cần nói chính xác khác biệt mong muốn.
Không sửa runtime, thêm hành vi sản phẩm hoặc deploy.

Acceptance criteria:

1. Có baseline theo cùng fixture/theme/viewport, đếm click/nhập/scroll và lỗi đọc dữ liệu,
   phân biệt bằng chứng thực với đề xuất/Gu. Có mẫu render đúng brand/status/KPI-order.
2. OWNER chọn thiết kế đích; ghi tokens/typography/density/empty/loading/focus và phạm vi
   thay đổi được chọn. Cần review mẫu, không chỉ duyệt khẩu hiệu “hiện đại/Fintech”.
3. Mục tiêu đo có tác vụ/state/viewport-height/thiết bị rõ: hit target44px+, body/input16,
   helper thường14/ngoại lệ≥12; đủ VND; reflow/zoom. Mốc sau bám mẫu đã chọn, chưa triển khai.

### C93 — Refactor tokens/CSS/primitives giữ hình

Trạng thái: `COMPLETED`. OWNER phê duyệt C93 ngày09/10/2026; C92 đã hoàn tất.
C93 giữ hình runtime hiện tại; thiết kế A là đích C94–C97, không đổi hình dưới tên refactor.

Phạm vi: palette gốc→semantic→component tokens, Light/Dark/System; hợp nhất rule trùng và
specificity/override, tách CSS đặc thù module có thứ tự rõ. Được giữ hex ở định nghĩa palette
và tài sản logo có ngoại lệ đã ghi; UI consumption dùng semantic tokens. Không đổi màu B,
đổi font hoặc thay layout bằng “refactor”. EmptyState/ResponsiveTable chỉ trích abstraction
có consumer thực, không tạo library lớn không dùng. Badge/Card/Button tái dùng nguyên trạng;
variant visual mới thuộc thiết kế C92/C94, không âm thầm áp toànapp.

Acceptance criteria:

1. Before/after rendered/computed styles và interactions trong matrix đã chọn giữ hình;
   không lộ tiền/privacy, không mất focus/keyboard/URL/draft/loading, không CSS import-order lỗi.
2. Có inventory tokens/overrides/consumer, rule trùng được gỡ với bằng chứng; semantic color
   consumption và ngoại lệ explicit. Báo số dòng/raw/gzip sau refactor, không ép<900/giảm50%.
3. Lint/typecheck/unit/build/fullE2E phù hợp PASS; các C63/C67/C72/C75/C78/C81/C84/C87/C90
   áp dụng vẫn đạt, không hạ assertions. Giá trị empty/search-empty/unread-empty/error giữ khác.

C93 hoàn tất local: lint/typecheck/unit117/build19/fullE2E64PASS18SKIP12.0m đạt;
computed160/160, pixel159full-page +1viewport khớp, raw stitched mismatch vẫn giữ.
13duplicate declarations có proof, inventory/source metrics và consumer thật ở
[report](refactor-c93/report.md). 17C75hashes/sixcounts0 bảo toàn. Không push/deploy;
C94 AWAITING_APPROVAL, dừng theo AGENTS§3.

### C94 — Đọc dữ liệu mobile, typography và tên dài

Trạng thái: `COMPLETED` local ngày10/10/2026. OWNER duyệt C94 ngày09/10; C93 hoàn tất và A đã chọn tại C92.

Phạm vi: G2 nhãn phụ≥12–14px theo vai trò; G4 hover khác selected vẫn có aria-current;
G1 bảng Dòng tiền/Đối tác dashboard giữ nhận diện dòng khi cuộn (chọn ghim cột hoặc cards
cho từng bảng); G3 tên200ký tự có disclosure toàn bộ khi cần, không cắt accessible identity.
OWNER chọn A tại C92: hai bảng Dashboard thành cards mobile, desktop giữ bảng; taskdesktop
full-width/cashflowbelow theo mẫu A. Không suy mọi bảng thành card, không đổi số/đơn vị hoặc loại số0/tên/dữ liệu khỏi sản phẩm.

Acceptance criteria:

1. Actual painted text đủ cỡ theo C92 tại routes/states thuộc phạm vi; không chỉ grepCSS.
   Hover/selected/focus rõ, tên đầy đủ đọc bằng keyboard/AT semantics/expand; privacy vẫn ẩn.
2. Tables cùng dữ liệu/nhãn/sort/count trước–sau; mobile cuộn không mất ghép tên→giá trị;
   cards nếu chọn giữ headers/units/grouping, không expose duplicate accessible content.
3. 375/390/768/1024/1440 ×LightDark +reflow320/text200%/viewportthấp được đo. Không clipping
   VND/page overflow ngoài scroller đã định nghĩa; không ép header≤25% mọi viewport/zoom.
   Gate hiện hữu phù hợp đạt, source before/after/matrix và chọn OWNER có bằng chứng.

C94 chốt: lint/typecheck/unit117/build19/full69PASS18SKIP13.7m đạt. C81 cap160px giữ;
badge14pxline1.4, targetedC81+C948PASS1SKIP2.8m. Matrix80+84/36bigint/36zoom trước badge
cuối có provenance rõ, Loan/metadata source cuối kiểm targeted/full. Data/AX/privacy/focus,
raw Evon và actual-state reconciliation ở [report](readability-c94/report.md).1157before/
1145unchanged/17C75exact/sixcounts0; diff/secret/artifactPASS. Không push/deploy;
C95 AWAITING_APPROVAL rồi dừng theo AGENTS§3.

### C95 — Quick Amount cho VndInput

Trạng thái: `COMPLETED` local ngày10/10/2026. OWNER duyệt C95 trong hội thoại; A/chip đã chốt C92.

Phạm vi: chip tùy context field; OWNER chọn tại C92 +50tr/+100tr/+150tr/+200tr, cộng dồn
50triệu theo chuỗi integer/BigInt, không ép nhóm này vào context lãi nhỏ; chọn vị trí trong webform thuận
bàn phím, không hứa chèn vào toolbar bàn phím native mọibrowser. Cộng chuỗi integer/BigInt
đúng giới hạn; gõ tay/cursor/default/clear/reset/error/pending và callback giữ chuẩn. Không
frontend tính lãi hoặc quyết toán, không autosubmit. Không áp mặc định chip vào mọi input.

Acceptance criteria:

1. Từ ô Tiền gốc trống đãfocus, khoản Minh An1.284.500.000VND, nhập50.000.000VND bằng1chipaction
   +50tr theo mẫu A;100/150/200triệu từ trống cũng1action. Baseline cùng fixture375/1280×900
   LightDark là8phím số, chọn loại/clear/focus tính riêng;10triệu vẫn gõ/paste. Ghi số lần và baseline,
   không suy nhanhgấp3 mọingười. Text hiển thị/normalized submit value trùng chính xác.
2. Kiểm giá trị0/ordinary/17digit/max/chạm trần; không Number gây mất số, vượt trần bị chặn
   có thông báo. Paste/edit/invalid/clear/formreset/onValueChange khớp; chip typebutton.
3. Keyboard/focus/dirty/pending protection/hit target44px+, viewport bàn phím giả và fixture
   submit/idempotency/error/reset regression đạt. Phone thật không có giữ NOT_TESTED.

Kết quả: chỉ principal bật chip,50/100/150/200triệu từ trống1action, trước50triệu8phím số
cùng Minh An1.2845b ở375/1280×900LightDark;16samples0autosubmit. BigInt/max/17digit/draft/
callback/keyboard/reset/pending đạt;12responsive states có320 và375×420,44px+. Fixture50triệu
submit/error/retry cùng key/replay1transaction và reset đạt. Lint/typecheck/unit121/rootbuild PASS;
full73PASS18SKIP0FAIL14.2m,retries0. Visual/draft2PASS2.8m, originalEvon7widths/theme0mục Hỏng,
giữ focus/native pickers.1183before/8scopechanged/1175unchanged,17C75exact/15generatedrestored,
130websrcfreeze,73financialprotectedfiles giữ; DBguard55322/sixcounts0. Diff/artifact/secret đạt.
Report: [C95](quick-amount-c95/report.md), lịch sử failure/harness giữ rõ cùng thư mục.
Phone thật/AT/softkeyboard/nativeclipboard và remote save NOT_TESTED. Không push/deploy/remote
hoặc sửa schema/RPC/engine; C96 AWAITING_APPROVAL rồi dừng theo AGENTS§3.

### C96 — Drawer thu/trả lãi ngay Dashboard

Trạng thái: `COMPLETED` local ngày10/10/2026. OWNER duyệt C96 trong hội thoại.

Phạm vi: tránh transition qua trangdetail cho interesttask bằng drawer ngay Dashboard;
layoutA đã chọn tại C92:480px bên phải desktop, bottom sheet mobile;
tái dùng lifecycle/payment primitives hiện có. Không tải/render form cho tất cả task vô
điều kiện. Nhận diện khoản/cho vay–đi vay/amount authoritative, permission/privacy guard,
request/cancel/stale/draft/history/focus, save→revalidate KPI/task từserver và idempotency.
Khoản gốcquáhạn/taskcustom xử lý theo semantics đã chọn, không coi mọi task là thu lãi.

Acceptance criteria:

1. 1click taskinterest mở đúng loan/direction/context trong drawer Dashboard; deep-link cũ
   và quyền VIEWER/privacy boundary vẫn đúng. Không số liệu nhạy cảm ở DOM/accessibility khiẩn.
2. Submit trên fixture local đúng1RPC/transaction, error giữdraft/pendingkhôngclose,
   success close/reset/toast/focus về trigger hoặc mục hợp lý khi task đãbiếnmất; KPI/task
   đọc lại authoritative, không optimistic settle money. Partial/overpayment/stale preview
   theo validation hiện hành; không copy snapshot balance làm quyết toán mới.
3. Draft/cancel/BackForward/mởlại/rapidclick/timeout/retry và budget datafetch/bundle đo so
   baseline; đủ fullE2E relevantfinancial/Authboundary. Không QAdata remote hoặc redesign ngoài mẫu.

Kết quả C96: mộtclick/0route cho interesttask, dynamic1selectedform; layoutA/headerfooter/body,
VIEWER/privacy/deep-link/gốcquáhạn giữ. Dirty/BackForward/abort/stale/date/timeout/retry/rapid/
pending/partial/advance/RPCidempotency/KPI/task/focus đạt trên fixture local. Lint/typecheck/
unit121/rootbuild19 PASS; full79PASS18SKIP0FAIL15.5m,retries0;targeted+probe7PASS3.5m.
BudgetmatchedinitialJS+8311bytes/openadditional11759vs57405,nominalbusinessreads2vs4; elapsed
localMEASURED_ONLY, không hứa tăng tốc. Rawprobe3/theme giữ với opacity0-tooltip/focus-scroll
reconciliation; native/focus warnings theo C92.1207before/10scopechanged/1197unchanged,140websrc/
73financialfreeze,17C75exact/15generatedrestored,C20-test55322/sixcounts0;diff/artifact/secret đạt.
[Report C96](dashboard-drawer-c96/report.md) và evidence cùng thư mục. Không remote/schema/
engine/push/deploy;phone/AT/remote NOT_TESTED. C97 AWAITING_APPROVAL rồi dừng theo AGENTS§3.

### C97 — Loading theo màn và motion có chọn lọc

Trạng thái: `COMPLETED` local ngày10/10/2026; OWNER đã phê duyệt, mẫu A/C92 đã chọn.

Phạm vi: cải thiện skeleton từng route/KPI/table/chart dựa trên shimmer đã tồn tại, streamed
Auth/SPA/cancel/error feedback; BottomSheet damping/snapback/backdrop chỉ theo mẫu được
chọn và không phá dirty/pending/focus. Press feedback chỉ control cần, không scale toànapp;
visual feedback không gọi haptic thật. Details animation giữ native semantics/keyboard/hidden.

Acceptance criteria:

1. Controlled-delay/cached/uncached/abort/slowerror và fontloading: feedback đúngtheme,
   không overlaykẹt/scrollfocusnhảy ngoàiý; loading→content cùng vùng đã đo và budget C92.
   Không hứa loading trướcHTML hoặc zeroCLS mọi mạng/PWA.
2. Drawer drag/snapback/dismiss giữ4prompts/draft/pending/focus/capturecancel; có nút/Escape
   tương đương. Reduced-motion tắt animation decoration/spring/shimmer nhưng vẫn có status.
3. Nếu cam kết60fps phải có device/browser/trace/window/budget frame cụ thể; không có
   thiết bị thì ghi NOT_TESTED và đo mô phỏng riêng. Không giảm assertions để vượt gate.

Kết quả C97:9route skeleton/rootneutral, drawerreserve/freshfocus, damping/raw88px/capturecancel,
enter220/exit150/snapback320/shimmer1.8s/reducedstatic/native details giữ. Lint/typecheck/unit121/
rootbuild19 PASS; targeted+probe6PASS7.0m/full84PASS18SKIP0FAIL19.2m,retries0.55observations,
CLS≤.1/geometrydrawer/overflow đạt trong window khai báo; không60fps/device/zeroCLS toànapp.
Full1 strictselectorC78 FAIL được sửa trong runtimeskeleton, gate hiện hữu không đổi. RawprobeP1/
focus/native/density/limitations/history ở `docs/loading-motion-c97/`; preservation/diff/artifact/
secret đạt,17C75exact/153runtimefreeze/73financialprotected/C20sixcounts0. Không push/deploy/remote/
schema/RPC/engine/dependency. C98 AWAITING_APPROVAL rồi dừng theo AGENTS§3.

Phép đo liên tục bổ sung3PASS0FAIL5.4m/53observations (36route/4cold/12drawer+readerror); window từ navigation/actionstart hoặc coldinit đến2RAFcontent/fontready, rawhadRecentInput/sourceRects giữ. MaxrouteCLS0.021980/Authdrawer0.032092≤.1; primaryregion/windowevidence riêng, khôngzeroCLS toànapp.

### C98 — Nghiệm thu tổng hợp và phát hành

Trạng thái: `IN_PROGRESS` ngày11/10/2026 ở CI commit trạng thái cuối. OWNER phê duyệt C98 ngày10/10/2026 trong hội thoại;
nghiệm thu A/C92–C97 và phát hành Preview/Production/alias theo C91/runbook.
Source211f8e4/CI38069136549 SUCCESS5job:pgTAP527/Auth6/E2E83PASS19SKIP0FAIL24.9m.
Localfull/rootPreviewcreate84/18/0/19.4m,rootresume84/18/0/20.2m;matrix100/72stress/4System/
10keyboard/36VND/36zoom;contrast1224nodes0fail. Nativecandidate72samples/alias60samples PASS;
Public4each/console0/runtime0errors500 trongwindow. Preview3BXy…/Production5aqr… và3alias exactID/
Ready45sin1;Productionpromote/rootPreviewresumeexit0. C91rollbackverified,khôngactivate. Prefs/
viewportrestored;C75exact/153runtime/73financial/C20-test55322sixcounts0. Khôngledger/accounts/
schema/secretsmutation. Closingproof4b22848/CI38144466141 SUCCESS5job:pgTAP527/24files/Auth6/0/E2E83PASS19SKIP0FAIL27.4m.
CI cuối7e130d9/run38146959473 hai lần CANCELLED vì job35m; lần2 ở teardown sau102/102,
không có E2E summary/PASS. C98IN_PROGRESS,chưa có mốc kếtiếp địnhnghĩa/duyệt. Đề xuất35→45m
chỉ deadlinejob ở docs/release-c98/ci-budget-proposal.md và .patch, OWNER đãduyệt vàđãápdụng ngày11/10/2026;
giữ testtimeouts/assertions/retries0/skips/reset/teardown/5jobs/gate. FinalstatuscũngkiểmCI exactSHA
trước báochốt; SHA/run cuối tronghội thoại tránhcommitselfreference. Report docs/release-c98/.

Phạm vi: full lint/typecheck/unit/build/E2E; visual+functional matrix5khổ×2theme, System/
zoom320/200%/viewportlow/name200/boundaryVND/emptyerrorloading/keyboard/privacy và contrast
AA. Ghi rawfailures/NOT_TESTED. Release theo C91/runbook với Required CI source/closing đúng
SHA, immutablecandidate/publicAuth smoke, Functions sin1, alias hậukiểm/runtime và rollback.
Không coi Ready hoặc 10 screenshot là chứng nhận toàn bộ UX/AT/Production.

Acceptance criteria:

1. Mọi gate bắt buộc PASS, không giảm assertion/retry/skip; ma trận khai báo có kết quả,
   selecteddesign khớp; text4.5:1/large3:1 theo AA và focus/nontext applicable. Không gắn
   nhãn AAA toànapp chỉ do vài màu7:1; không bảng/gesture inaccessible để đạt tiêu chí hình.
2. Measured layoutshift/interaction budgets trong điều kiện C92/C97 đạt; đầy đủ số/units/
   semantic/privacy; headless không thay AT/device/remote chứng nhận. Secret/uploadguard PASS.
3. ExactSHA CI SUCCESS trước release; candidate/aliases/runtime hậukiểm đạt và rollback
   xác minh; context/roadmap/report cậpnhật IDs/URLs/region/source/closing và kếtiếp chờduyệt.
   Không mutate financialdata/account/schema/secrets/Google/backup để smoke UX.
