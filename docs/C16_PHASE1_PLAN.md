# C16 — Giai đoạn 1: bảo vệ dữ liệu, nguồn và đối chiếu thực tế

## 1. Phê duyệt và trạng thái

Người dùng phê duyệt phạm vi Giai đoạn 1 ngày `2026-08-12`. Các bước chạy tuần tự và dừng tại cổng
duyệt của từng bước; thao tác remote vẫn cần xác nhận riêng theo `AGENTS.md`.

| ID | Bước | Trạng thái |
|---|---|---|
| K01 | Khôi phục nhịp backup và chứng minh RPO/RTO | `COMPLETED` — backup mới local + Drive, GCM/SHA/RPO và restore cô lập đạt |
| K02 | Đồng bộ mã nguồn an toàn lên GitHub | `COMPLETED` — fast-forward tới `29cfd33`, remote hash và fresh-clone gate đạt |
| K03 | Đối chiếu dữ liệu thật và đóng C16 | `COMPLETED` — Sheet/Supabase/calculation/Dashboard khớp, OWNER xác nhận sổ thật, full gate đạt |

Không thay đổi chính sách mật khẩu: tối thiểu 6 ký tự ASCII chữ hoặc số, không bắt buộc phối hợp
thành phần. Regression `123456` và `abcdef` phải tiếp tục đạt.

## 2. K01 — Backup, RPO và restore

Phần local đã chuẩn bị:

- `scripts/backup-health.mjs create` tạo manifest chuẩn, tính kích thước/SHA-256 và từ chối file nằm
  ngoài thư mục backup.
- `scripts/backup-health.mjs verify` fail-closed khi sai project, backup quá 24 giờ, file thiếu,
  kích thước hoặc checksum sai.
- `scripts/backup-health.mjs retention` chỉ lập dry-run union 7 bản ngày, 4 bản tuần và 12 bản tháng;
  không tự xóa hoặc di chuyển file.
- Unit test bao phủ manifest hợp lệ, RPO quá hạn, path traversal, retention và ID trùng; `pnpm test`
  chạy các test này trong gate chuẩn.

Acceptance còn lại, chỉ thực hiện sau xác nhận remote riêng:

1. Xác minh đúng Supabase project và khả năng backup/PITR hiện có bằng thao tác chỉ đọc.
2. Tạo logical backup Production theo stream AES-256-GCM, không lưu plaintext và không ghi vào Git.
3. Lưu hai bản ở vị trí đã được OWNER phê duyệt, tạo manifest từ row count thực tế, xác minh
   checksum và GCM tag.
4. Restore vào database cô lập; so migration, row count và invariant; chạy calculation, RLS/Auth và
   Google export smoke.
5. Ghi tuổi backup, RPO, thời gian restore thực tế/RTO và bằng chứng; không restore lên Production.

K01 chỉ hoàn tất khi backup không quá 24 giờ và restore rehearsal đạt RTO mục tiêu không quá 4 giờ.

Preflight sau phê duyệt K01 remote ngày `2026-08-12`:

- 20/20 ciphertext thuộc bốn backup local cũ còn khớp SHA-256 trong manifest.
- Bản mới nhất ngày `2026-08-05` trên DriveFS đủ 5/5 ciphertext, từng SHA-256 khớp và manifest giống
  hệt local; nhưng đã quá RPO 24 giờ.
- Supabase CLI không còn access token. Item database password và backup encryption key chỉ còn
  metadata trong hai Keychain cũ đã đổi tên nhưng payload đọc được là rỗng; login Keychain hiện tại
  cũng không có hai item.
- Không thử đăng nhập, reset database password hoặc tạo khóa mã hóa mới vì đây là cổng xác nhận riêng.
  Không có file mới được ghi vào thư mục backup/Drive và Production không thay đổi.

Kết quả hoàn tất K01 ngày `2026-08-13`:

- Đăng nhập đúng tài khoản Supabase, xoay database password theo xác nhận và lưu password/khóa backup
  mới trong macOS Keychain; không ghi secret vào repository hay manifest.
- Backup đạt là `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260812T165654Z`, một logical stream gồm `auth`,
  `private`, `public`, `supabase_migrations` và đầy đủ ACL/GRANT, mã hóa AES-256-GCM trực tiếp thành
  ciphertext 861.546 byte. Bản local và DriveFS cùng SHA-256
  `c7cf1b051d686548cc968570e1a6234ec844d677c9be052c97edbb057dcfb22e`; GCM tag và RPO dưới 24 giờ đạt.
- Manifest ghi migration `20260812100000`, 21/21 migration và row count: 2 profile/2 Auth user,
  15 đối tác, 22 khoản, 209 giao dịch, 7 lifecycle event, 6 correction, 0 settlement reversal,
  208 kỳ lãi và 316 audit log.
- Restore vào container PostgreSQL cô lập đạt sau khi bật dependency `extensions.citext`: row count
  khớp toàn bộ, 22/22 calculation thành công, invariant số tiền/gốc/reversal/settlement sạch,
  authenticated RLS thấy đúng 22 khoản, `anon` không có quyền SELECT và 11 projection Google export
  đọc được. RTO đo từ lúc tạo container đến khi smoke xong là 278 giây (4,63 phút), dưới mục tiêu 4 giờ;
  container đã dừng và tự xóa, Production không bị restore hay mutate.
- Bản thử trước đó `...20260812T165336Z` thiếu ACL do `--no-privileges`, bị rehearsal từ chối và
  không được xem là recovery point đạt. Hai bản vẫn được giữ nguyên ở local + Drive; retention chỉ
  dry-run, đánh dấu bản thử là candidate nhưng không xóa.
- Gate cuối đạt lint, typecheck, 39/39 test, build và `git diff --check`. Auth/E2E/pgTAP local không
  chạy lại vì K01 không đổi app/schema; Auth/RLS/calculation/export đã smoke trực tiếp trên restore.

## 3. K02 — GitHub source recovery

1. Xác minh local `HEAD`, `origin/main` và deployment source; dừng nếu remote diverged.
2. Quét secret, dump, file lớn và metadata nhạy cảm; chạy full local gate.
3. Xin xác nhận riêng cho `git push` fast-forward; không force-push.
4. Hậu kiểm `origin/main = HEAD` và fresh clone có thể frozen install, test và build.

K02 không được bắt đầu trước khi K01 hoàn tất hoặc người dùng đổi thứ tự rõ ràng.

Kết quả preflight K02 ngày `2026-08-13`:

- Fetch xác nhận `origin/main` là ancestor, local ahead 16 commit trước commit K02 và không diverged;
  chỉ được phép fast-forward, tuyệt đối không force-push.
- Quét 195 file ứng viên không thấy dump/backup/credential file, không có file trên 5 MiB và secret
  scan không có phát hiện rủi ro cao. Bốn chuỗi được allowlist đều là fixture test, tên secret trong
  tài liệu hoặc tham chiếu `env(...)`, không phải credential thật.
- Stable Preview được ghi nhận từ cùng local `HEAD` qua lịch sử rollout. `vercel inspect` xác nhận
  đúng project, target và trạng thái Ready nhưng output CLI không có Git provenance, nên đây chỉ là
  đối chiếu bổ sung chứ không thay thế hậu kiểm GitHub/fresh clone.
- Gate đạt `git diff --check`, lint, typecheck, 39/39 unit, build, Auth 6/6, E2E 10/10, DB lint và
  pgTAP 364/364. Regression mật khẩu sáu chữ số tiếp tục đạt.
- Sau xác nhận riêng, `git push origin main` fast-forward thành công từ `15d1058` lên `29cfd33`;
  không force-push, tag hoặc PR. Local `HEAD`, `origin/main` và advertised hash cùng là
  `29cfd33f23e9f8a735387de310b4c7c0cc4b8d63`.
- Fresh clone đúng remote commit đạt `pnpm install --frozen-lockfile`, lint, typecheck, 39/39 unit
  tests và production build. Workspace tạm đã dọn khỏi repository. K02 hoàn tất; K03 chuyển
  `AWAITING_APPROVAL` và không được bắt đầu nếu chưa có phê duyệt mới.

## 4. K03 — Đối chiếu dữ liệu thật và đóng C16

1. OWNER cung cấp/chọn từng khoản cần đối chiếu; kiểm tra chiều vay, đối tác, gốc, ngày, kỳ lãi,
   lãi suất và số dư lịch sử.
2. So calculation authoritative, giao dịch, kỳ lãi, Dashboard, audit và Google Sheet một khoản tại
   một thời điểm.
3. Mọi sai lệch phải dừng; correction/reversal Production cần xác nhận riêng và không xóa vật lý.
4. Sửa tài liệu drift, chạy full gate, ghi rủi ro còn lại và chỉ sau đó chuyển C16 `COMPLETED`.

Tiến độ K03 ngày `2026-08-13`:

- Supabase Production chỉ đọc đạt 22/22 calculation và 0 invariant issue; 15 đối tác, 22 khoản,
  209 giao dịch, 7 lifecycle, 6 correction, 0 settlement reversal, 0 onboarding, 208 kỳ và 316 audit.
- Tổng calculation khớp Dashboard: cho vay 3,78 tỷ (3,73 tỷ hoạt động + 50 triệu nợ xấu), đi vay
  950 triệu. Chưa gọi correction/reversal hoặc mutation.
- Sau khi OWNER đăng nhập, Sheet xác nhận stale từ bản xuất 04/08: chỉ có 4 khoản, 11 giao dịch,
  87 kỳ và 39 audit so với Supabase 22/209/208/316. Trigger Apps Script thất bại mỗi giờ với
  `Export API trả về HTTP 404` vì `SYNC_API_URL` còn dùng alias cũ
  `https://quan-ly-vay-ca-nhan.vercel.app`; alias chuẩn `https://tindung.vercel.app` hoạt động.
- Sau xác nhận riêng, đổi duy nhất `SYNC_API_URL` sang alias chuẩn và chạy
  `runGoogleSheetFullSync`; hoàn tất trong 18,297 giây. Workbook khớp Supabase theo số dòng và
  SHA-256 tập ID của cả 11 dataset: 15 đối tác, 24 khoản, 215 giao dịch, 7 lifecycle, 6 correction,
  0 settlement reversal/onboarding, 213 kỳ, 0 chi phí, 9 thông báo và 326 audit.
- Hai khoản ACTIVE 400 triệu mới (một cho vay, một đi vay) phát sinh trong khoảng K03 không phải
  mutation của agent. Snapshot mới đạt 24/24 calculation, 0 internal issue và 0 Dashboard mismatch;
  tổng cho vay 4,18 tỷ, tổng đi vay 1,35 tỷ.
- OWNER xác nhận 24 khoản và hai khoản 400 triệu mới đúng là giao dịch phát sinh ngày `2026-08-13`;
  danh mục và tổng số phản ánh đúng sổ thực tế. Không cần correction/reversal.
- Full gate cuối đạt `git diff --check`, lint, typecheck, 39/39 unit, build, Auth 6/6, E2E 10/10,
  DB lint không lỗi và pgTAP 364/364. K03 và C16 hoàn tất; K04 thuộc C17 chờ phê duyệt riêng.

## 5. Gate

Gate local áp dụng theo phạm vi:

```text
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

Backup/restore có gate riêng trong `docs/BACKUP_RESTORE.md`. Không dùng build thành công hoặc trạng
thái deployment `Ready` thay cho restore, authenticated smoke hay đối chiếu dữ liệu thật.
