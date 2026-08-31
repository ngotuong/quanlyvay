# C18 — Redact secret trong audit và export

## 1. Trạng thái

| ID | Bước | Trạng thái |
|---|---|---|
| K06 | Redact secret trong audit và export | `COMPLETED` |

Chính sách mật khẩu tối thiểu 6 ký tự ASCII chữ hoặc số tiếp tục giữ nguyên. Pha tương thích đã
áp Production; stable Preview và Production authenticated smoke đã đạt. Full sync phát hiện export
500; remediation retry/log an toàn đã rollout Preview/Production và full sync đã đạt. Migration pha
3 thu hồi quyền raw đã đạt local gate, chờ rollout Production.

## 2. Phạm vi K06

1. Audit schema và luồng ghi/đọc hiện tại để xác định mọi đường có thể lộ Web Push `p256dh`,
   `auth_secret` và endpoint định danh subscription.
2. Thêm migration để audit mới chỉ lưu giá trị đã redact/fingerprint, vẫn giữ ID, actor, action,
   timestamp và ngữ cảnh cần cho đối chiếu.
3. Tạo projection/RPC sanitized làm nguồn duy nhất cho giao diện audit và Google Sync export; thu
   hồi quyền `authenticated` đọc raw audit trực tiếp.
4. Giữ raw lịch sử append-only nhưng không còn lộ qua UI/API/Sheet. Scrub raw lịch sử, xóa snapshot
   Drive cũ hoặc rotate subscription là quyết định riêng vì ảnh hưởng tính bất biến và có thể buộc
   thiết bị đăng ký Push lại.
5. Cập nhật contract export, tài liệu và regression cho RLS, UI, phân trang cùng Apps Script schema.

Rollout bắt buộc theo ba pha để không làm trang Audit Production gián đoạn:

1. Áp migration tương thích: tạo sanitizer/RPC và sanitize audit mới, tạm giữ policy raw OWNER cho
   web phiên bản cũ.
2. Deploy Preview rồi Production để UI/export chỉ dùng RPC sanitized; xác minh browser/API/Sheet.
3. Thêm và áp migration cuối thu hồi `authenticated` khỏi raw audit. Scrub/rotate vẫn là quyết định
   độc lập, không gộp vào migration thu hồi quyền.

Trạng thái hiện tại: pha 1 đã áp Production với migration
`20260820203000_c18_audit_secret_redaction.sql`. History 22/22, DB lint, schema/ACL và RPC sanitized
đều đạt; RPC không trả Push secret và giữ endpoint fingerprint. Gate local trước rollout đạt lint,
typecheck, 49/49 tests, build, Auth 6/6, E2E 10/10 và pgTAP 379/379. Candidate Preview
`dpl_3HGC8SM1iNSaYCGofANpgQzeh6B9` đúng project/Preview/Ready/`sin1` và public smoke đạt; đang chờ
OWNER đăng nhập immutable URL để authenticated smoke trước cổng chuyển stable alias. OWNER đã xác
nhận trang Audit tải được và runtime log sạch; phát hiện UI giới hạn cứng 100 dòng, chưa phân trang.
Sau phê duyệt, UI đã dùng 25 dòng/trang, exact count, URL cùng Trước/Sau. Runbook đạt
lint/typecheck/50 tests/build/E2E 10/10 và tạo candidate mới
`dpl_FisSwpJQykXLJdmzE8ZcxfVrroB3` tại
`https://quan-ly-vay-ca-nhan-qqijghcp6-ngotuong2105.vercel.app`, đúng project/Preview/Ready/`sin1`
cùng public smoke. OWNER xác nhận kiểm tra candidate; runbook chạy lại full web gate, chuyển
`https://tindung-preview.vercel.app` sang candidate này và hậu kiểm alias/smoke/runtime log đạt, không
rollback. Production `dpl_6rKeCAjkMP17cjfuHnMU13CdLeyr` đã Ready tại `sin1`, canonical/public smoke
và runtime log đạt. Sau khi OWNER đăng nhập, browser xác nhận Audit trang 1/2 đều đúng 25 dòng,
Trước/Sau và URL hoạt động, không có tên Push secret, console/runtime log sạch. Candidate cũ không
được promote. Pha 2 còn xác minh API/full sync Sheet; Apps Script source không đổi nên không cần
`clasp push`. Lần full sync được duyệt đã dừng hai lần trước khi ghi Sheet do export 500. RPC cùng 11
dataset remote đều đọc được và payload nhỏ; local thêm retry một lần theo page cùng log dataset/code
an toàn. Candidate `dpl_8VUZ82qr151T33a3vtzKakBEDqf7` đã qua authenticated smoke và trở thành stable
Preview. Production `dpl_HGUNgAyiB9t6kKBd3ALqAxWoxYbm` Ready/`sin1`, canonical smoke đạt; full sync
hoàn tất trong 27 giây, export trả 200 và Sheet có 482 audit không chứa ba tên secret. Pha 3 thêm
migration `20260823184500_c18_revoke_raw_audit_access.sql`; DB lint và pgTAP 384/384 đạt local.
Ngày 31/08/2026, OWNER đã reset database credential bị lộ bởi output chẩn đoán; credential mới được
xác minh và lưu trong Keychain. Migration pha 3 đã áp Production, history khớp 23/23 và dry-run không
còn migration chờ. Hậu kiểm trực tiếp xác nhận `authenticated` không có quyền SELECT raw audit hay
USAGE sequence, policy tương thích bằng 0, `service_role` vẫn có quyền cần thiết, RPC sanitized trả
486 dòng, REST RPC trả 200 và DB lint không có schema error.

## 3. Acceptance và gate

- `p256dh` và `auth_secret` không xuất hiện trong audit mới, UI, API export hoặc Sheet; endpoint nếu
  cần đối chiếu chỉ hiện fingerprint an toàn.
- Audit sanitized vẫn đủ actor/action/record ID/timestamp và ngữ cảnh nghiệp vụ.
- `authenticated` không thể đọc raw secret; service role chỉ dùng ở đường vận hành cần thiết.
- Database lint, pgTAP, Auth/E2E, export tests, lint, typecheck, unit và build đều đạt.
- Một lần duyệt checkpoint bao trọn migration remote, deploy Preview/Production và full sync thuộc
  acceptance. Scrub lịch sử hoặc rotate Push vẫn là quyết định độc lập vì phá append-only hoặc buộc
  thiết bị đăng ký Push lại.
