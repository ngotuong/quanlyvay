# Backup và restore database

## Mục tiêu vận hành

Supabase PostgreSQL là nguồn dữ liệu chuẩn. Google Sheet và snapshot Drive chỉ dùng đối chiếu, không
thể phục hồi ngược database.

- RPO mục tiêu: tối đa 24 giờ khi chỉ có daily/logical backup; cập nhật lại nếu Production bật PITR.
- RTO mục tiêu: 4 giờ từ lúc xác nhận sự cố đến khi restore, chạy smoke và mở lại quyền ghi.
- Người chịu trách nhiệm: OWNER hệ thống phê duyệt; người vận hành được OWNER chỉ định thực hiện.
- Tần suất tối thiểu: logical backup trước mọi migration Production và hằng ngày khi đã có dữ liệu thật.
- Retention đề xuất: 7 bản ngày, 4 bản tuần và 12 bản tháng; vị trí lưu phải mã hóa và nằm ngoài Git.

## Tạo backup

Mọi thao tác Production cần xác nhận riêng. Trước khi dump:

1. Xác minh đúng project/ref và thời điểm chốt theo `Asia/Ho_Chi_Minh` bằng lệnh chỉ đọc.
2. Tạo logical dump bằng `supabase db dump` hoặc `pg_dump` với schema, data và ACL/GRANT đầy đủ.
   Không dùng `--no-privileges` cho recovery dump vì bản restore sẽ không chứng minh được RLS/Auth.
3. Không đưa password, connection string hoặc dump vào repository.
4. Tính SHA-256 và lập manifest gồm tên file, UTC timestamp, project ref, migration version, kích
   thước, checksum, công cụ/phiên bản và người thực hiện.
5. Lưu dump + manifest tại vị trí mã hóa đã được OWNER phê duyệt; áp retention sau khi xác minh bản
   mới có thể đọc được.

Manifest chuẩn dùng `format=QLV_BACKUP_MANIFEST_V1`, gồm `backupId`, `createdAt` UTC, `projectRef`,
`migrationVersion`, danh sách `files` với đường dẫn tương đối, kích thước và SHA-256; có thể thêm
`rowCounts` để làm bằng chứng restore. Tạo manifest sau khi đã sinh và xác minh GCM tag của mọi
ciphertext; file manifest phải nằm cùng thư mục và công cụ sẽ từ chối đọc file bên ngoài thư mục đó:

```text
node scripts/backup-health.mjs create \
  --output /duong-dan-da-duyet/backup.manifest.json \
  --backup-id qlv-prod-YYYYMMDDTHHMMSSZ \
  --created-at YYYY-MM-DDTHH:MM:SS.000Z \
  --project-ref hmfxnstrqfqpvsgfmjmd \
  --migration-version YYYYMMDDHHMMSS \
  --file /duong-dan-da-duyet/app-schema.sql.qlvbak \
  --file /duong-dan-da-duyet/app-data.sql.qlvbak \
  --row-count loans=0 --row-count transactions=0
```

`createdAt` phải là thời điểm UTC bắt đầu dump, không phải thời điểm chạy lại công cụ trên file cũ.
Thay các row count bằng số chỉ-đọc thực tế ở thời điểm dump; không dùng ví dụ `0` làm bằng chứng
Production. Sau khi tạo, kiểm tra file, checksum, đúng project và RPO 24 giờ bằng lệnh chỉ đọc:

```text
node scripts/backup-health.mjs verify \
  --manifest /duong-dan-da-duyet/backup.manifest.json \
  --project-ref hmfxnstrqfqpvsgfmjmd \
  --max-age-hours 24
```

Lập danh sách retention theo 7 bản ngày, 4 bản tuần và 12 bản tháng bằng dry-run. Công cụ chỉ in
`keep` và `candidates`, tuyệt đối không tự xóa file:

```text
node scripts/backup-health.mjs retention \
  --directory /duong-dan-da-duyet \
  --daily 7 --weekly 4 --monthly 12
```

Chỉ xử lý các `candidates` sau khi bản mới nhất đã qua checksum, GCM tag và restore rehearsal, đồng
thời phải xác minh từng đường dẫn đích trước mọi thao tác xóa hoặc chuyển vào thùng rác.

Tiện ích `scripts/backup-crypto.mjs` dùng AES-256-GCM và định dạng `QLVBAK01`. Khóa 32 byte phải
được truyền qua `QLV_BACKUP_KEY_BASE64`, lấy từ secret store/Keychain và tuyệt đối không ghi vào
manifest hoặc Drive. Dùng `-` làm input/output để mã hóa/giải mã theo stream, tránh lưu SQL thô:

```text
supabase db dump ... --file /dev/stdout | node scripts/backup-crypto.mjs encrypt - backup.sql.qlvbak
node scripts/backup-crypto.mjs decrypt backup.sql.qlvbak /dev/null
node scripts/backup-crypto.mjs decrypt backup.sql.qlvbak - | psql ...
```

Lệnh giải mã vào `/dev/null` là gate xác minh GCM tag bắt buộc trước khi stream SQL sang `psql`.
Tiếp theo phải kiểm tra hình dạng SQL đã giải mã trước khi tạo manifest. Gate này chặn cả trường hợp
Supabase CLI trả exit code thành công nhưng nối payload lỗi telemetry JSON vào cuối dump:

```text
node scripts/backup-crypto.mjs decrypt app-schema.sql.qlvbak - | node scripts/backup-sql-gate.mjs schema
node scripts/backup-crypto.mjs decrypt app-data.sql.qlvbak - | node scripts/backup-sql-gate.mjs data
```

Nên đặt `SUPABASE_TELEMETRY_DISABLED=1` khi dump, nhưng biến này không thay thế SQL gate và restore
rehearsal. Không công nhận backup chỉ dựa trên checksum/GCM vì chúng vẫn xác nhận một ciphertext có
nội dung SQL bị CLI làm bẩn.

Nếu schema Auth chứa trigger `auth_user_profile_provisioning` gọi `private.provision_auth_profile`,
database trắng chưa thể tạo trigger này trước app schema. Khi restore, tạo Auth objects trước nhưng
hoãn đúng trigger phụ thuộc đó, restore app schema, tạo lại trigger, rồi mới nạp `auth-data` và
`app-data`. Không bỏ qua lỗi schema nào khác. Data có liên kết reversal vòng phải nạp trong phiên tạm
đặt `session_replication_role = replica`, rồi trả về `origin` trước khi kiểm tra invariant và mở
quyền ghi.

Với image Supabase PostgreSQL cô lập, xác minh và bật `citext` trong schema `extensions` trước khi
restore Auth (`create extension if not exists citext with schema extensions`). Dùng role quản trị
đúng chủ sở hữu như `supabase_admin` trong container; không nới quyền hoặc drop schema trên Production.
Một dump duy nhất bao gồm đồng thời `auth`, `private`, `public` và `supabase_migrations` cho phép
`pg_dump` tự sắp xếp dependency schema/function/trigger và giữ một snapshot nhất quán.

## Restore rehearsal

Không restore thử vào Production. Dùng database local/temporary riêng và:

1. Xác minh checksum trước khi đọc dump.
2. Xác minh GCM tag toàn bộ ciphertext, rồi restore schema/data vào database rỗng bằng công cụ
   tương thích phiên bản PostgreSQL.
3. So khớp migration history và số dòng tối thiểu của `profiles`, `counterparties`, `loans`,
   `transactions`, `loan_lifecycle_events`, `loan_term_corrections`,
   `loan_settlement_reversals`, `interest_periods` và `audit_logs` với manifest.
4. Kiểm tra không có transaction 0 VND, không có gốc âm, mỗi reversal trỏ đúng bản gốc và mỗi
   settlement reversal trỏ đúng event `SETTLEMENT` cùng khoản vay.
5. Chạy calculation smoke cho từng khoản, đăng nhập/RLS smoke và export Google Sync schema hiện hành.
6. Ghi thời gian restore thực tế, kết quả, sai lệch và hủy database temporary sau khi OWNER xác nhận.

## Quy trình sự cố

Khi cần phục hồi thật: khóa mutation, chụp bằng chứng, xác định recovery point, xin xác nhận riêng,
restore vào môi trường kiểm chứng trước, chạy checklist trên, rồi mới promote/đổi kết nối. Không ghi
đè Production hoặc xóa dữ liệu tài chính để “sửa nhanh”.
