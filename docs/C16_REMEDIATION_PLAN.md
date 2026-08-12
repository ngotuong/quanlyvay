# C16 — Kế hoạch remediation và kiểm thử dữ liệu thực tế

## 1. Trạng thái và nguyên tắc

- Trạng thái: `IN_PROGRESS` từ ngày `2026-08-03` sau khi người dùng phê duyệt C16.
- Thứ tự bắt buộc: hoàn tất remediation local → đạt full gate → backup/rollout có xác nhận riêng →
  kiểm thử dữ liệu thực tế.
- Không nhập thêm dữ liệu thật trước khi các lỗi mức P1/P2 của audit được sửa và kiểm thử local đạt.
- Không thay đổi chính sách mật khẩu tối thiểu 6 ký tự chữ/số theo quyết định mới nhất của người dùng.
- Không xóa vật lý giao dịch tài chính hoặc lịch sử; mọi sửa sai tiếp tục dùng bản ghi append-only,
  reversal và audit.
- Mọi migration Supabase remote, deploy Vercel, push Apps Script, sửa Google Sheet và thao tác backup
  remote vẫn cần xác nhận riêng theo `AGENTS.md`.

Tiến độ cập nhật ngày `2026-08-13`: R1–R5 và R7 đã rollout; K01 đã đóng khoảng trống R6 bằng backup
Production mới có ACL tại local + Drive, GCM/SHA/RPO đạt và restore rehearsal cô lập toàn trình với
RTO 278 giây. Công cụ manifest fail-closed và retention dry-run có regression trong gate chuẩn; không
restore lên Production và không xóa backup cũ. Giai đoạn 1 tiếp tục tại `docs/C16_PHASE1_PLAN.md` với
K02 đang `AWAITING_APPROVAL`, chưa push GitHub.

## 2. Phạm vi remediation đã khóa

### R1 — Khóa đường ghi dữ liệu ngoài RPC

Tạo migration mới để:

- Thu hồi `INSERT`, `UPDATE`, `DELETE` trực tiếp của role `authenticated` trên `profiles`,
  `counterparties`, `loans` và `push_subscriptions`; giữ quyền `SELECT` theo RLS hiện hành.
- Giữ mutation qua các RPC `security definer` đã kiểm tra active role và validation.
- Thu hồi quyền `authenticated` trên các RPC v1 nhận lãi `%/ngày` là `create_loan` và
  `record_lifecycle_event`; web chỉ dùng `create_loan_v2` và `record_lifecycle_event_v2` nhận `%/kỳ`.
- Bổ sung constraint database cho giới hạn kỳ hạn và lãi suất ban đầu tương ứng contract web, tránh
  caller ngoài giao diện tạo dữ liệu vượt giới hạn.

Acceptance:

- OWNER/EDITOR gọi RPC hợp lệ vẫn ghi được; VIEWER vẫn chỉ đọc.
- Direct DML vào các bảng nguồn bị từ chối kể cả với OWNER/EDITOR.
- Không thể sửa gốc, ngày, chiều vay, lãi suất hoặc trạng thái khoản vay ngoài workflow có audit.

### R2 — Tuần tự hóa mutation khoản vay

Redefine các RPC ghi `record_financial_transaction`, `record_lifecycle_event`,
`record_lifecycle_event_v2`, `reverse_transaction`, `settle_loan` và workflow hủy tất toán để khóa
hàng `loans` bằng `SELECT ... FOR UPDATE` theo cùng một thứ tự trước khi đọc số dư/trạng thái.
`correct_loan_terms` tiếp tục dùng khóa hàng hiện có.

Acceptance:

- Hai request trả gốc đồng thời với key khác nhau không thể làm tổng tiền gốc vượt gốc ban đầu.
- Hai lifecycle event đồng thời không tạo lịch trạng thái mâu thuẫn.
- Idempotency retry cùng key/cùng input vẫn trả kết quả cũ; khác input vẫn conflict.

### R3 — Tất toán khi gốc đã về 0

Sửa `settle_loan` để:

- Chấp nhận `principal_due = 0`.
- Chỉ tạo `PRINCIPAL_PAYMENT` khi gốc còn lại lớn hơn 0.
- Chỉ tạo `INTEREST_PAYMENT` khi lãi còn lại lớn hơn 0.
- Vẫn tạo lifecycle `SETTLEMENT` khi cả gốc và lãi đã được thanh toán trước đó, để khoản vay có thể
  đóng trạng thái hợp lệ.
- Tiếp tục từ chối số dư lãi trả trước âm cho đến khi có loại giao dịch hoàn tiền riêng.

Acceptance:

- Trả toàn bộ gốc bằng payment thường rồi tất toán phần lãi còn lại thành công.
- Trả đủ cả gốc và lãi trước rồi đánh dấu tất toán thành công mà không tạo transaction 0 VND.

### R4 — Hủy toàn bộ lần tất toán theo lịch sử append-only

Không mở quyền đảo riêng từng thành phần tất toán. Thay vào đó:

- Thêm bảng append-only `loan_settlement_reversals` tham chiếu lifecycle `SETTLEMENT`, có reason,
  idempotency key, actor, timestamp, RLS read-only và audit trigger.
- Thêm RPC `reverse_settlement` khóa khoản vay, xác định chính xác batch settlement bằng prefix
  idempotency, tạo `REVERSAL` cho các transaction principal/interest của batch, ghi một settlement
  reversal và rebuild khoản vay trong cùng transaction.
- Engine chỉ coi settlement chưa có dòng trong `loan_settlement_reversals` là settlement hiệu lực.
- Sửa `reverse_transaction` để chặn đúng transaction thuộc batch settlement thay vì chặn mọi giao
  dịch có cùng ngày với settlement.
- Web hiển thị lịch sử “Hủy tất toán” và một form nguy hiểm có reason, checkbox xác nhận và
  idempotency key; sau khi hủy, khoản vay mở lại theo trạng thái authoritative.

Acceptance:

- Không xóa lifecycle/transaction cũ; audit giữ đủ settlement, reversal và actor.
- Hủy settlement retry an toàn, không tạo bản ghi trùng.
- Một payment độc lập cùng ngày settlement vẫn có thể đảo bằng workflow thường.
- Thành phần do `settle_loan` tạo không thể bị đảo riêng.

### R5 — Mở rộng Google Sync và snapshot

- Nâng schema export và Apps Script cùng lúc.
- Thêm `loan_term_corrections` và `loan_settlement_reversals` vào payload, cursor nguồn và hai tab
  đối chiếu mới; tổng số tab dữ liệu dự kiến tăng từ 8 lên 10.
- Giữ money/rate/bigint ở dạng chuỗi chính xác, chống formula injection và sync một chiều.
- Cập nhật mock test cho full payload, unchanged cursor, restore và sheet topology mới.

Acceptance:

- Sheet đối chiếu nhìn thấy đầy đủ lý do sửa dữ liệu ban đầu và hủy tất toán.
- Snapshot/restore workbook không làm mất hai tab mới; không có đường ghi ngược Supabase.

### R6 — Backup có khả năng khôi phục database

Google Sheet tiếp tục là bản đối chiếu, không được gọi là bản phục hồi Supabase. Trước dữ liệu thật:

1. Xác minh gói Supabase và backup platform bằng thao tác chỉ đọc sau khi được cho phép truy cập tài
   khoản. Tài liệu Supabase hiện hành cho biết Pro/Team/Enterprise có daily backup; Free nên tự chạy
   logical dump định kỳ.
2. Dù gói nào, tạo một logical backup schema/data bằng `supabase db dump`/`pg_dump`, lưu ngoài Git ở
   vị trí mã hóa được người dùng phê duyệt, kèm checksum và retention.
3. Restore bản dump vào database local/temporary riêng và chạy smoke assertions về migration,
   profile, khoản vay, transaction, lifecycle, correction và audit.
4. Ghi RPO/RTO, người chịu trách nhiệm, tần suất và quy trình restore vào tài liệu vận hành.

Không tạo backup chứa dữ liệu thật, upload Drive hoặc bật PITR nếu chưa có xác nhận riêng. PITR là
add-on trả phí và không được xem là lựa chọn mặc định.

### R7 — Đồng bộ tài liệu

- Sửa các số migration 7/7 còn stale thành 8/8 hoặc số mới thực tế sau rollout.
- Sửa `WEB_WORKFLOWS.md` để `/dashboard` là trang mặc định và `/loans` là danh sách khoản vay.
- Cập nhật `DOMAIN_SPEC.md`, `FINANCIAL_ENGINE.md`, `GOOGLE_SYNC.md`, `USER_GUIDE.md` cho settlement
  reversal, direct-write boundary, 10 tab và backup/restore.

## 3. Kế hoạch kiểm thử

### Database regression

- Privilege tests: direct DML bị từ chối; RPC theo OWNER/EDITOR/VIEWER đúng quyền.
- Full-principal tests: gốc 0 vẫn settlement được; không tạo transaction 0 VND.
- Settlement reversal tests: append-only, audit, idempotency, reopen status, same-day unrelated
  payment và chặn đảo riêng component.
- Concurrency integration: hai session/HTTP client trả gốc và ghi lifecycle đồng thời; kết quả cuối
  giữ invariant.
- Regression toàn bộ fixture lãi, dashboard, notification, C15 correction và RLS hiện có.

### Web và Google Sync

- Server Action validation và UI hủy settlement.
- E2E OWNER/EDITOR/VIEWER, responsive và timeline sau settle → reverse settlement → settle lại.
- Unit/mock tests cho export schema mới, exact decimal, 10 tab, cursor và snapshot restore.

### Full gate local

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

## 4. Trình tự rollout có cổng xác nhận

1. Hoàn tất code/migration/docs và full gate local.
2. Trình người dùng diff migration, privilege matrix, số assertions và kế hoạch rollback.
3. Xin xác nhận riêng để tạo logical backup Production trước migration.
4. Xin xác nhận riêng để áp migration Supabase Production và hậu kiểm chỉ đọc.
5. Xin xác nhận riêng để deploy Vercel Production.
6. Xin xác nhận riêng để push Apps Script và cập nhật topology Google Sheet.
7. Chạy smoke không tạo dữ liệu; chỉ sau khi mọi lớp đạt mới bắt đầu dữ liệu thật.

Không gộp các cổng remote trên thành một quyền mặc định.

## 5. Kiểm thử dữ liệu thực tế C16

Với từng khoản vay hiện hữu:

1. Người dùng xác nhận hợp đồng/ghi chép nguồn: chiều vay, đối tác, gốc, ngày giải ngân, kỳ hạn,
   chu kỳ và lãi `%/kỳ`.
2. Nhập một khoản tại một thời điểm; đối chiếu transaction giải ngân và nhãn tự sinh.
3. So khớp từng kỳ lãi/segment, ngày đóng lãi, principal outstanding và interest balance.
4. So khớp Dashboard cash/accrual profit, dòng tiền và due/overdue.
5. So khớp Google Sheet sau sync và logical backup manifest.
6. Mọi sai lệch Production phải dừng, chụp bằng chứng và xin xác nhận riêng trước correction/reversal.

## 6. Điều kiện hoàn tất C16

- R1–R7 đạt acceptance và toàn bộ full gate local/remote áp dụng đều pass.
- Có ít nhất một logical backup khôi phục thử thành công.
- Các khoản dữ liệu thật trong phạm vi người dùng cung cấp đã được đối chiếu không còn sai lệch chưa
  giải thích.
- Không có giao dịch tài chính bị xóa vật lý hoặc sửa trực tiếp.
- `PROJECT_CONTEXT.md` ghi rõ test evidence, remote IDs, rủi ro còn lại và checkpoint kế tiếp.
