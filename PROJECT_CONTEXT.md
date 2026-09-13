---
project: QuanLyVayCaNhan
roadmap_version: 1.0.156
last_updated: 2026-09-13 08:25:18 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: NONE
current_status: COMPLETED
last_completed_checkpoint: C28
next_checkpoint: NONE
---

# Project Context

Tệp này chỉ chứa trạng thái hiện hành để handoff. Nhật ký chi tiết, kế hoạch đã hoàn tất và các cổng
phê duyệt cũ nằm trong Git history, không phải chỉ dẫn cho phiên làm việc mới.

## 1. Trạng thái hiện tại

- C28 rollout C27 lên Vercel Preview đã `COMPLETED` ngày 2026-09-13 theo
  `docs/C28_C27_PREVIEW_ROLLOUT.md`. Phạm vi không gồm Production, migration, dữ liệu tài chính,
  thay đổi secret, Google resources hoặc Git push.
- C27A thay toàn bộ brand logo/app icon bằng mẫu `Ngô Tường Financial Workspace` được người dùng
  cung cấp và phê duyệt trực tiếp ngày 2026-09-12; đã `COMPLETED` local, chỉ thay tài sản/metadata
  giao diện và không đổi logic, API, dữ liệu, routing hay chức năng.
- C27: Chuẩn hóa Design System và Tối ưu UI/UX Frontend đã `COMPLETED` local ngày 2026-09-12
  theo `docs/C27_DESIGN_SYSTEM_UIUX_PLAN.md`; chưa rollout Preview/Production.
- C0–C26 đã `COMPLETED`; C26 rollout C25 lên Preview/Production hoàn tất ngày 2026-09-12.
- C23 sửa kỳ so sánh dashboard, cách ly dữ liệu QA C21 khỏi số liệu vận hành/Google Sync nhưng giữ
  audit append-only; rollout chỉ áp dụng Preview.
- C22 đã tất toán có audit 6 khoản `C21 TEST ONLY` trên Preview, không xóa vật lý; dashboard stable
  đã trở về số liệu thật và tài khoản kỹ thuật tạm đã bị vô hiệu hóa.
- C21 hoàn tất sau khi người dùng ủy quyền tự tạo tài khoản/giao dịch test và QA mobile tự động.
- C20: khắc phục audit, bỏ VietQR/tạo phiếu và nâng cấp UI/UX; phạm vi và acceptance criteria
  tại `docs/IMPLEMENTATION_PLAN.md` và `docs/C20_REMEDIATION_PLAN.md`.
- Người dùng đã phê duyệt triển khai C20 trong hội thoại ngày 2026-09-07.
- C20 đã nghiệm thu local với dữ liệu giả; remote rollout cần phạm vi/phê duyệt riêng.
- Worktree chuẩn ở branch `main`; dùng `git status --short --branch` để kiểm tra commit chưa push.
- Production: <https://tindung.vercel.app>.
- Stable Preview: <https://tindung-preview.vercel.app>.
- Chính sách mật khẩu vẫn là tối thiểu 6 ký tự ASCII chữ hoặc số; không tự thay đổi.
- Sau rotate VAPID C19, mỗi thiết bị muốn nhận Web Push phải bấm **Bật thông báo** lại.

## 2. Nguồn sự thật hiện hành

Ưu tiên theo `AGENTS.md`. Trong repository:

1. `PROJECT_CONTEXT.md`: trạng thái vận hành và checkpoint hiện tại.
2. `docs/IMPLEMENTATION_PLAN.md`: danh sách checkpoint và trạng thái tóm tắt.
3. Các contract/runbook còn hiệu lực:
   - `docs/DOMAIN_SPEC.md`, `docs/FINANCIAL_ENGINE.md`
   - `docs/AUTH.md`, `docs/WEB_WORKFLOWS.md`, `docs/DASHBOARD.md`
   - `docs/PWA_NOTIFICATIONS.md`, `docs/GOOGLE_SYNC.md`
   - `docs/BACKUP_RESTORE.md`, `docs/CI.md`, `docs/VERCEL_PREVIEW_RUNBOOK.md`
   - `docs/DESIGN_SYSTEM.md`, `docs/USER_GUIDE.md`
4. Migration, test và code hiện tại là bằng chứng triển khai.

Không dùng commit message, revision log, ảnh audit cũ hoặc nội dung đã xóa trong Git history để suy
ra yêu cầu đang chờ, quyền thao tác remote hay checkpoint mới.

## 3. Kiến trúc và bất biến

- Monorepo pnpm: Next.js PWA ở `apps/web`, Apps Script ở `apps/google-sync`, contract dùng chung ở
  `packages/domain-contract`, migration/test PostgreSQL ở `supabase`.
- Supabase PostgreSQL là nguồn dữ liệu chuẩn; Google Sheets chỉ đồng bộ một chiều để đối chiếu.
- Frontend chỉ mutate qua Server Actions/RPC đã validate; bộ máy tính lãi authoritative ở PostgreSQL.
- Giao dịch tài chính không xóa vật lý; sửa sai bằng reversal/correction và audit append-only.
- Tiền VND dùng số nguyên, lãi suất dùng decimal; ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`, audit UTC.
- Web Push và Google Sync phải idempotent; secret chỉ nằm trong kho secret của môi trường.
- Production dùng Supabase `hmfxnstrqfqpvsgfmjmd`, hiện có 29 migration và bộ pgTAP
  443 assertions.

## 4. Tài khoản và tài nguyên remote

- Google Apps Script, Sheets/Drive và Vercel: `vipmoschino@gmail.com`; giao diện có thể hiển thị
  `ngotuong077@gmail.com` cho cùng tài khoản.
- Supabase: `tuongnt2105@gmail.com`; CLI profile `quanlyvay`.
- GitHub private: `https://github.com/ngotuong/quanlyvay.git`, branch `main` theo dõi `origin/main`.
- Supabase Singapore: project ref `hmfxnstrqfqpvsgfmjmd`.
- Vercel project `quan-ly-vay-ca-nhan`, ID `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, Functions `sin1`.
- Google Sheet authoritative để đối chiếu:
  `1Q12dJCgCvDIjEQyRpeFVtbepGzTl6AsJ_KimAnEvjA8`.
- Apps Script `QuanLyVayCaNhanSync`:
  `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`.
- Drive backup folder: `1loMcJEzDvy5r38K2nz7nCqQHg9KFfz_P`.

Không lưu secret trong repository. Database password, API keys, VAPID và các secret vận hành nằm
trong macOS Keychain/Vercel/Supabase Vault tương ứng.

## 5. Baseline Production sau C19

- Supabase: migration 24/24, DB lint sạch, trigger sanitize audit active.
- Dữ liệu kiểm chứng: 16 đối tác, 31 khoản vay, 338 giao dịch, 526 kỳ lãi, 15 lifecycle,
  9 correction và 489 audit.
- Không còn raw `endpoint`, `p256dh`, `auth_secret` trong Push audit; subscription và delivery cũ
  đều bằng 0 sau rotate VAPID.
- Preview C19: `dpl_2q4dg4wWqW7YQoLaQv9m6Wvc329u`, immutable
  `https://quan-ly-vay-ca-nhan-7syj4kwwp-ngotuong2105.vercel.app`, Ready/`sin1`.
- Production C19: `dpl_4o6JerspEoJUbgu3qXr27twuZZSd`, immutable
  `https://quan-ly-vay-ca-nhan-kdq1gu7kh-ngotuong2105.vercel.app`, Ready/`sin1`.
- Public/authenticated smoke và runtime log của hai deployment đều đạt.
- Google Sheet full sync có 489 audit và không chứa ba Push secret.
- Snapshot sạch `QLV_Snapshot_2026-08-31-C19-clean`, ID
  `1Hebj6010rovOPIWKr2a8JieSnajYg7a8PzqiOL0Ec2g`.
- Backup sạch `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260831T160647Z-c19-clean` đạt SHA-256,
  AES-256-GCM, SQL gate và restore rehearsal cô lập. Thư mục Drive chỉ còn snapshot sạch cùng ba
  tệp backup sạch.

## 6. Gate và thay đổi gần nhất

- C28 hoàn tất rollout C27 lên stable Preview. Candidate `dpl_5M1XWMy69HrkAPVdPCmZtk9EzqF1`,
  immutable `https://quan-ly-vay-ca-nhan-b2fdfk4z9-ngotuong2105.vercel.app`, target Preview,
  `Ready`, đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; 44/44 Lambda ở `sin1`.
  `https://tindung-preview.vercel.app` đã trỏ đúng candidate; rollback target C26
  `dpl_8RwYQmGmqUD67wJeDMDzqveh1gz7` không phải kích hoạt.
- Gate rollout C28 đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build và
  E2E 21/21. Public smoke trên immutable/stable đạt; authenticated smoke trên cả hai URL đạt cho
  Dashboard, khoản vay, đối tác, chi phí, thông báo, tài khoản, Quick Action/BottomSheet, menu mobile,
  brand/PWA icons và chống tràn ngang; browser console sạch. Runtime log hậu kiểm có 0 error và
  0 fatal. Bốn tài khoản `C28 Preview Smoke` phục vụ các lần chẩn đoán/smoke đều đã bị vô hiệu hóa
  và ban; không tạo giao dịch hoặc dữ liệu tài chính. Không migration, đổi remote secret, deploy
  Production, thao tác Google hay Git push.
- C27 hoàn tất local: thêm UI primitives dùng chung (Button, Input/Select/Textarea, VndInput,
  Badge, Card, Tabs, Toast và BottomSheet), chuyển palette sang trust-blue/cobalt, chuẩn hóa elevation,
  motion và z-index; Dashboard cùng các trang khoản vay/đối tác/chi phí/cài đặt đã dùng primitives.
  Danh sách khoản vay có Quick Action ghi giao dịch, chi tiết khoản vay tự mở sheet qua deep link;
  menu mobile và bộ lọc nâng cao dùng BottomSheet có Escape/chạm ngoài/vuốt đóng. Toast phản hồi
  Server Action tự ẩn và vẫn có live-region. `globals.css` giảm từ khoảng 99,8 KB xuống 74,6 KB,
  CSS primitives/playground được tách riêng. Không đổi logic nghiệp vụ, API, routing, dữ liệu,
  migration hoặc Privacy SSR.
- Gate C27 ngày 2026-09-12 đạt: `git diff --check`, lint, typecheck, 74/74 unit/script tests,
  production build, Auth 6/6 và E2E 21/21. E2E bao phủ 375/768/1024/1440, light/dark,
  Quick Action, Toast tự ẩn, BottomSheet đóng bằng nút/Escape/chạm ngoài/vuốt và không tràn ngang.
  DB lint/pgTAP không chạy lại vì C27 không có thay đổi database; E2E/Auth đã reset đủ 29 migration
  trên local. Không deploy, Git push, đổi secret hoặc tài nguyên remote.
- C27A hoàn tất local: sidebar, đăng nhập và đổi mật khẩu dùng biểu tượng vô cực mới với kích thước
  hiển thị cố định; favicon 16/32 dùng bản không chữ; Apple Touch Icon 180 và PWA 192/512/maskable
  dùng bộ nhận diện mới. Metadata, manifest, Web Push icon/badge và service worker đã chuyển reference;
  asset cũ chỉ được xóa sau khi quét source không còn reference. Gate đạt `git diff --check`, lint,
  typecheck, toàn bộ unit/script tests, build và E2E 21/21. Không deploy, migration, thay dữ liệu,
  remote secret, Google resources hay Git remote.
- C26 đã rollout C25 lên Preview và Production. Preview candidate
  `dpl_8RwYQmGmqUD67wJeDMDzqveh1gz7`, immutable
  `https://quan-ly-vay-ca-nhan-o98f4jlj4-ngotuong2105.vercel.app`; stable
  `https://tindung-preview.vercel.app` đã trỏ đúng candidate. Production candidate
  `dpl_66uiiExUfXXNnS3KCajLhNmgkqyw`, immutable
  `https://quan-ly-vay-ca-nhan-nxf62gt51-ngotuong2105.vercel.app`; stable
  `https://tindung.vercel.app` đã promote thành công. Rollback Production là
  `dpl_GPWF8qZJPFdRbtBpp9awZAZtuGtC` và không phải kích hoạt.
- Hai candidate đều `Ready`, đúng target và toàn bộ Function ứng dụng ở `sin1`; public cùng
  authenticated smoke trên immutable/stable đều đạt. Hậu kiểm xác nhận 4 KPI dùng nội dung rút gọn,
  `/loans` mặc định `ACTIVE`, `status=ALL` hoạt động và 11 thẻ `SETTLED` có ngày tất toán;
  console/runtime error log sạch. Gate rollout chạy lại đạt lint, typecheck, 73/73 unit/script,
  build và E2E 21/21. Không migration, không giao dịch tài chính, không đổi Google/secret/Git remote.
- C25 hoàn tất local: thẻ `SETTLED` hiển thị `Ngày tất toán`; `/loans` mặc định
  `ACTIVE` và `status=ALL` thật sự bỏ lọc; KPI chỉ hiện icon hướng cùng số chênh lệch,
  trong khi screen reader/tooltip vẫn có nhãn đầy đủ. Gate đạt: `git diff --check`, lint,
  typecheck, 73/73 unit/script tests, build và E2E 21/21 trên 5 viewport/light-dark.
- C24 hoàn tất rollout C20–C23 lên Production. Candidate
  `dpl_GPWF8qZJPFdRbtBpp9awZAZtuGtC`, immutable
  `https://quan-ly-vay-ca-nhan-l6dmwcbvz-ngotuong2105.vercel.app`, target `production`, `Ready`;
  toàn bộ Functions có `sin1`. Rollback target là C19 `dpl_4o6JerspEoJUbgu3qXr27twuZZSd`.
- `https://tindung.vercel.app` đã trỏ đúng C24. Public smoke (`/login` 200, manifest 200,
  export không secret 401), authenticated smoke trên immutable/stable, console và runtime error log đều đạt.
  Số liệu 01–11/09: cho vay hoạt động `3.850.000.000 ₫`, lãi ròng `7.030.000 ₫`,
  tiền vào `107.800.000 ₫`, tiền ra `100.770.000 ₫`; QA không xuất hiện trong list/Sync.
- Gate C24 ngày 2026-09-11 đạt: `git diff --check`, lint, typecheck, 73/73 unit/script tests,
  build, Auth 6/6, E2E 21/21, remote DB lint sạch và pgTAP 443/443.
- Production và Preview dùng cùng Supabase `hmfxnstrqfqpvsgfmjmd`; remote đã có đủ 29/29
  migration trước C24 nên không chạy migration lần hai và không phát sinh DB mutation/backup.
  C24 không Git push, không thay Google resources hay remote secret.
- C23 local đã triển khai: KPI dòng tiền/lãi dùng cùng kỳ lịch, KPI số dư dùng mốc trước đầu kỳ;
  card hiển thị rõ ngày so sánh. Migration thêm phân loại `is_test_data`, cách ly QA khỏi dashboard,
  danh sách khoản vay/đối tác và Google Sync nhưng giữ nguyên bản ghi/audit; đồng thời sửa list facts
  để chỉ tính reversal đã có hiệu lực tại ngày chốt.
- Gate C23 ngày 2026-09-10 đạt: `git diff --check`, lint, typecheck, 73/73 unit/script tests, build,
  Auth 6/6, E2E 21/21, DB lint sạch và pgTAP 443/443 trên database reset sạch với 29 migration.
- Preview candidate C23 `dpl_7FLxGSQi3xCxRKRbKobAas9YLFve`, immutable
  `https://quan-ly-vay-ca-nhan-o87p3rtgr-ngotuong2105.vercel.app`, Preview/Ready/Functions `sin1`.
  Preview Supabase đã áp đủ 29 migration và DB lint sạch. Immutable URL cùng stable alias
  `https://tindung-preview.vercel.app` đều đạt authenticated smoke; alias trỏ đúng candidate,
  dashboard/cash-flow/danh sách/Google Sync đúng kỳ vọng, console sạch và error log bằng 0.
- Hậu kiểm stable C23 xác nhận cho vay hoạt động `3.850.000.000 ₫`, nợ xấu
  `510.000.000 ₫`, tổng vốn chưa thu hồi `4.360.000.000 ₫`, dư nợ đi vay
  `1.100.000.000 ₫`; lãi ròng 01–10/09 là `7.030.000 ₫` so với 01–10/08 là
  `3.035.000 ₫`. Dòng tiền tháng 9 là vào `107.800.000 ₫`, ra `100.770.000 ₫`,
  ròng `7.030.000 ₫`; 6 khoản QA không còn xuất hiện trong list/Google Sync.
- Audit authenticated Preview ngày 2026-09-10 xác nhận `Lãi ròng thực thu` 01–10/09 là
  `7.030.000` VND nhưng đang so với 22–31/08 là `51.450.000` VND, gây nhãn giảm `44.420.000`;
  cùng kỳ 01–10/08 chỉ là `3.035.000` VND. Sáu khoản QA còn làm tiền vào/ra tháng 9 phình lên
  khoảng `54.043` nghìn tỷ dù dòng tiền ròng vẫn đúng; C23 xử lý hai nguyên nhân này.
- C22: xác nhận 6 khoản QA × `9.007.199.254.740.993 ₫` (1 ACTIVE, 5 BAD_DEBT), tất toán bằng
  `settle_loan` với idempotency key riêng; cả 6 `SETTLED`, dư gốc 0. Dashboard 2026-09-01–09-09:
  active lending từ `9.007.203.104.740.993` về `3.850.000.000`, bad debt từ
  `45.035.996.783.704.965` về `510.000.000`, total exposure về `4.360.000.000` VND.
- Browser authenticated trên stable Preview xác nhận card “Cho vay đang hoạt động” là
  `3.850.000.000 ₫`; tài khoản cleanup đã deactivate/ban và đăng nhập lại bị từ chối HTTP 400.
- C22 không đổi code ứng dụng, không deploy, không migrate và không xóa audit/financial history.
- C21 local đã đạt: list RPC chỉ tính lãi cho page đã chọn; benchmark 1.000 khoản + 13.000 giao dịch
  có median 102,456 ms, worst 104,726 ms, payload 24.060 bytes/25 cards. DB lint sạch, pgTAP
  431/431 (28 migration local), lint/typecheck, 70 unit/script, build, Auth 6/6 và E2E 21/21 đạt.
- C21 thêm phản hồi điều hướng khoản vay sau ngưỡng 300 ms, có `aria-live`, safe-area và
  reduced-motion; test chậm 500 ms xác nhận trạng thái chờ xuất hiện.
- Stable Preview C21 `dpl_C75aW28nYqMhM8x4owLtJFtAUEyw`, immutable
  `https://quan-ly-vay-ca-nhan-8kd5p2f6z-ngotuong2105.vercel.app`, Preview/Ready/Functions `sin1`.
  Public/authenticated smoke trên immutable URL và stable alias đạt; console sạch, error log bằng 0.
- QA remote dùng tài khoản EDITOR tạm và dữ liệu `C21 TEST ONLY`; payment đã đảo, audit history được
  giữ, tài khoản đã deactivate/ban và đăng nhập lại bị từ chối. Hai profile mobile đạt 11 route,
  touch target 44px, zoom 200%, dark/light, landscape, offline và PWA; stable list→detail 871/837 ms.
- Supabase dùng chung cho Preview/Production có 29 migration sau C23; tính tiền authoritative
  trong DB và VND dùng bigint.
- Bằng chứng chi tiết: `docs/C21_VALIDATION.md`.
- C20 đã hoàn tất local: gỡ VietQR/phiếu; thêm privacy SSR, account mobile, form recovery,
  preview tất toán có xác nhận, phân trang/aggregate, snapshot export nhất quán và Push worker hữu hạn.
- Test riêng: `QuanLyVayCaNhan-C20-test`, config `.cache/c20-test`, API `127.0.0.1:55321`.
  Không reset instance local gốc và không thay đổi remote.
- Gate cuối đạt ngày 2026-09-08: lint, typecheck, unit/script 66 tests, build; Auth 6/6;
  E2E production build local 20/20; DB lint sạch và pgTAP 414/414 (27 migration local);
  `git diff --check` sạch.
- Đã thêm revision acknowledgement và fallback GET-only nếu UI không commit sau action thành
  công; không gửi lại giao dịch. Full E2E sau fallback đạt 20/20.
- QA ảnh từng phát hiện tiền lớn bị cắt trong dashboard card dù trang không tràn; đã sửa
  wrap/min-width, xem lại ảnh desktop/mobile và regression chống cắt đã đạt.
- Hồ sơ đóng phát hiện, benchmark, giới hạn thiết bị và rollout đề xuất: `docs/C20_VALIDATION.md`.
- Benchmark fake: 1.000 khoản từ 2025-01-01, 12.000 giao dịch trả lãi; SQL list cũ 15.003 ms /
  10.393.114 bytes, list phân trang 7.240 ms / 24.060 bytes (25 cards, tổng 1.000).

- 2026-09-07: tạo kế hoạch C20, đồng bộ context/roadmap; chỉ thay đổi tài liệu.
- Audit 2026-09-06 tại local HEAD `6054610`: lint, typecheck, 54/54 unit/script tests và build
  đạt; login Production được xem ở desktop/mobile. Chưa kiểm chứng runtime sau đăng nhập.
- Phiên tạo kế hoạch C20: `git diff --check` đạt; chưa chạy gate triển khai C20.
- Báo cáo `docs/AUDIT_2026-09-06.md` là bằng chứng đầu vào; đề xuất sửa VietQR trong báo cáo
  được thay bằng yêu cầu mới của người dùng: gỡ toàn bộ VietQR và phiếu văn bản.

C19 đạt toàn bộ gate ngày `2026-09-01`:

- `git diff --check`
- lint, typecheck, 54/54 unit/script tests và production build
- Auth 6/6, Playwright E2E 10/10
- Supabase DB lint và pgTAP 385/385
- Production migration list 24/24 và truy vấn hậu kiểm dữ liệu/secret

Commit C19: `eed24e4` — `C19: scrub lịch sử và rotate Web Push`. Các commit local sau `origin/main`
chưa được push; trạng thái chính xác luôn lấy từ `git status --short --branch`.

## 7. Blocker và việc chờ

- C28 không còn blocker; rollout Preview và hậu kiểm đã hoàn tất. Chưa có checkpoint kế tiếp.
- Không có blocker và chưa có checkpoint kế tiếp. C27/C27A mới hoàn tất local; bộ icon và UI/UX
  mới chưa được rollout Preview/Production.
- C26 không còn blocker. Token CLI Supabase tạm
  `cli_ngotuong@Mac-mini.local_1789127470` đã được thu hồi sau xác nhận của người dùng và credential
  cục bộ đã xóa; tài khoản smoke đã deactivate/ban. Chưa có checkpoint tiếp theo.
- Không còn blocker cho C25.
- Không còn blocker cho C24; chưa có checkpoint tiếp theo chờ phê duyệt.
- Không còn blocker cho C23.
- Không còn blocker cho C22.
- Không còn blocker cho C21. Không có kiểm chứng phần cứng thật; theo ủy quyền mới của người dùng,
  checkpoint dùng Chromium mobile profiles và ghi rõ không thay thế Safari WebKit/phần cứng thật.
- Supabase CLI profile toàn cục hiện lỗi `Unsupported Config Type`; DB lint đã sạch trước lỗi này và
  pgTAP cuối được chạy trực tiếp trong container local sau khi áp đủ migration, không có `not ok`.
- C21 không cho phép Production rollout, Apps Script push hoặc git push.
- Việc đăng ký lại Web Push là thao tác theo từng thiết bị, không chặn chức năng khác.

## 8. Lệnh kiểm tra chuẩn

```bash
git status --short --branch
git diff --check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:auth
pnpm test:e2e
supabase db lint --level warning
supabase test db
```

Các lệnh Supabase/Vercel/Google/GitHub remote vẫn tuân theo cổng phê duyệt trong `AGENTS.md`.
