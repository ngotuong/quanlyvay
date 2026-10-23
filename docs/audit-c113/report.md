# C113 — Audit toàn diện, remediation local và đề xuất cải tiến

Ngày audit: 22/10/2026

Phạm vi: repository local tại `HEAD`, không truy cập hay thay đổi dữ liệu/secret/tài khoản remote,
không migration remote, deploy, đổi alias, `clasp push`, commit, push hoặc mở PR.

## 1. Kết luận điều hành

Không phát hiện P0 hoặc P1. Ba lỗi có đủ căn cứ đã được sửa và xác minh:

1. P2: Google Sync có thể coi snapshot thiếu bảng là hợp lệ, xóa nội dung tab tương ứng rồi vẫn
   tiến cursor. Bản sửa chuyển sang fail-closed: full payload phải có đủ 13 bảng, đúng mảng row,
   `sourceVersion` và `generatedAt` hợp lệ trước khi có thao tác ghi/xóa Sheet.
2. P3: ba biểu đồ dùng chiều cao tối thiểu cho cả giá trị `0`, khiến số 0 được vẽ thành cột có
   giá trị. Bản sửa dùng một helper BigInt chung và bỏ `min-height`/shadow riêng cho zero.
3. P3: full E2E C75 luôn ghi lại evidence đã source-control, làm một lượt gate bình thường thay đổi
   15 artifact lịch sử. Việc capture giờ chỉ chạy khi đặt rõ `C75_EVIDENCE=true`.

Sau sửa, toàn bộ gate local áp dụng đều đạt: lint, typecheck, 126 unit tests, build 19 route,
6 auth integration tests, 543 pgTAP tests trong 25 file và full E2E `92 PASS / 18 SKIP / 0 FAIL`.
Dependency audit không có vulnerability đã biết ở ngưỡng high; policy CI/actionlint đạt. Không có
thay đổi schema, phép tính tài chính, RLS, auth model, dữ liệu hoặc dependency.

Đánh giá tổng thể: codebase có độ bảo vệ tốt cho một ứng dụng tài chính cá nhân đang vận hành.
Các bất biến quan trọng được thể hiện nhất quán trong SQL, Server Action/RPC và test. Ba hướng
hardening còn lại có căn cứ nhưng cần quyết định kiến trúc/tương thích của OWNER nên chưa triển khai:
kiểm soát egress Web Push theo DNS/IP/provider, phục hồi giao dịch đổi mật khẩu qua hai dịch vụ và
CSP không dùng `unsafe-inline` cho script.

## 2. Phạm vi và inventory

### Thành phần đã rà soát

| Thành phần | Vai trò | Nội dung audit chính |
| --- | --- | --- |
| `apps/web` | Next.js 16.3.8, React 19.2.4, PWA | Auth/session, Server Actions, API routes, query/RPC adapters, Push worker, privacy, trạng thái loading/error/empty, responsive/light-dark |
| `supabase` | PostgreSQL authoritative | 38 migration, RLS/grant, RPC nghiệp vụ, idempotency, append/reversal, audit redaction, 25 file pgTAP |
| `apps/google-sync` | Apps Script đối chiếu một chiều | API contract, batch write, cursor, LockService, snapshot/restore, quota và fail-safe |
| `packages/domain-contract` | Contract nghiệp vụ dùng chung | 11 fixture biên về chu kỳ, rate change, partial principal, settlement, bad debt và rounding |
| `.github`, `scripts`, tài liệu | CI, release guard và vận hành | CI policy, upload/secret guard, backup verification, checkpoint/runbook và trạng thái tài liệu |

Inventory tĩnh: 157 file TypeScript/TSX, 70 file JavaScript/MJS, 64 file SQL, 19 route Next.js,
38 migration và 25 file database test. Quét TODO/FIXME không tìm thấy công việc sản phẩm đang bị
bỏ quên; ngoại lệ duy nhất có tính kỹ thuật là một `eslint-disable` có chủ đích trong E2E.

### Luồng dữ liệu chính

```text
Browser/PWA
  -> Next.js Server Actions / authenticated API routes
  -> Supabase Auth + RLS/RPC
  -> PostgreSQL (nguồn dữ liệu chuẩn và máy tính tài chính authoritative)

Vercel Cron + CRON_SECRET
  -> notification RPC queue/lease
  -> Web Push provider

Google Apps Script + shared secret
  -> /api/google-sync/export (cursor, no-store)
  -> Google Sheets/Drive snapshot một chiều; không có write-back vào Supabase
```

### Bề mặt tấn công và kiểm soát đã xác minh

- Auth boundary kiểm tra user, profile active, role và `must_change_password`; admin client chỉ tồn
  tại server và biến môi trường bắt buộc fail-closed.
- Mutation nghiệp vụ đi qua schema validation và RPC; phép tính lãi, quyết toán và rebuild period
  nằm trong PostgreSQL. RLS/grant và helper `private` được pgTAP bao phủ.
- Tiền VND giữ integer/text exact và BigInt ở presentation; không dùng floating-point để quyết toán.
- Giao dịch tài chính dùng append/reversal, idempotency key và audit log; không xóa vật lý lịch sử.
- Google export dùng secret, `no-store`, cursor và projection đã sanitize; Apps Script có lock,
  batch write, formula-escape và snapshot retention.
- Push cron yêu cầu bearer secret, queue có lease/idempotency, concurrency/budget/timeout hữu hạn,
  xóa subscription 404/410 và không ghi endpoint/key/provider payload vào log lỗi.
- Header hiện có CSP, frame denial, nosniff, referrer/permissions/COOP; service worker không cache
  trang tài chính đã xác thực.

## 3. Phát hiện và remediation

| ID | Mức | Loại | Căn cứ / nguyên nhân gốc | Xử lý và bằng chứng | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| C113-01 | P2 | Lỗi xác nhận | `validatePayload_` trước đây chỉ kiểm tra `tables` là object; `applyPayloadToSpreadsheet_` mặc định bảng thiếu thành `[]`, có thể clear tab rồi tiến cursor | Validate đủ 13 dataset, row object, version và timestamp trước khi ghi. Test chứng minh payload thiếu bị từ chối trước `clearContent` và dữ liệu cũ còn nguyên; Google Sync 20/20 | Đã sửa, đã xác minh |
| C113-02 | P3 | Lỗi xác nhận | `Math.max(2, ratio)` và CSS `min-height` vẽ `0` thành cột 2–4 px trên Dashboard, cash-flow và loan interest chart | Thêm `barPercentage` dùng BigInt, trả `0%` cho zero; gắn `data-zero` và tắt min-height/shadow. Unit boundary, chart privacy và full E2E đạt | Đã sửa, đã xác minh |
| C113-03 | P3 | Lỗi test/tooling | `c75-remediation.spec.ts` luôn chụp và ghi `docs/remediation-c75`, khiến `pnpm test:e2e` thay 15 artifact lịch sử theo font/rendering của máy chạy | Capture/evidence chỉ bật bằng `C75_EVIDENCE=true`; full E2E mặc định vẫn chạy assertion nhưng để artifact C75 và worktree ngoài phạm vi nguyên vẹn | Đã sửa, đã xác minh |
| C113-04 | P3 | Tài liệu | README/handoff còn mô tả C38/C112, trái nguồn trạng thái hiện hành | Đồng bộ sang C113 completed, giữ C100 in progress và trỏ về `PROJECT_CONTEXT.md` | Đã sửa, đã xác minh bằng review/diff-check |
| C113-05 | P2 | Nguy cơ có bằng chứng | Push endpoint chặn literal localhost/private IPv4 và `::1`, nhưng không resolve DNS trước send, không chặn đầy đủ private/link-local IPv6 và không allowlist provider. Endpoint được user đã auth đăng ký rồi cron server gửi ra ngoài | Chưa sửa vì allowlist có thể loại browser/provider hợp lệ; DNS resolution/rebinding policy ảnh hưởng kiến trúc và tương thích | Chờ OWNER duyệt hardening |
| C113-06 | P2 | Nguy cơ độ tin cậy | `changePasswordAction` cập nhật Supabase Auth trước rồi mới cập nhật `profiles.must_change_password`; hai hệ thống không có transaction chung. Nếu bước hai lỗi, mật khẩu đã đổi nhưng user vẫn bị buộc đổi lại | UI trả thông báo đúng và có thể retry; chưa đổi flow vì cần thiết kế saga/recovery và semantics idempotency | Chờ OWNER duyệt phương án |
| C113-07 | P3 | Hardening | CSP còn `script-src 'unsafe-inline'`; đây là giảm hiệu lực chống XSS dù các kiểm soát input/output vẫn hiện diện | Chưa thay vì nonce/hash phải tương thích Next.js streaming/hydration và cần regression trên PWA | Chờ checkpoint riêng |
| C113-08 | P3 | UX quan sát | Đoạn giới thiệu login có một dòng cuối chỉ một từ ở desktop; không overflow, clipping hoặc cản thao tác | Không sửa vì chỉ là thẩm mỹ và UI hiện tại đã được duyệt; đề xuất chỉnh copy/measure ở checkpoint UI sau | Đề xuất, không phải lỗi chức năng |
| C113-09 | — | Chưa xác nhận | Một số lần chụp toàn trang bằng Chromium cho ảnh trống phần intro; cùng lần chạy DOM vẫn có text, `checkVisibility=true`, rect/color hợp lệ và ảnh element/repeat khác hiển thị đúng | Không sửa. Kết luận hiện tại là artifact compositor/screenshot; E2E startup/visual đạt. Chỉ mở lại nếu tái hiện được trên thiết bị thật | Không xác nhận là lỗi app |

### File chính đã thay đổi

- `apps/google-sync/src/Core.js`, `apps/google-sync/test/google-sync.test.mjs`: contract full snapshot
  fail-closed và regression tests.
- `apps/web/src/lib/business/percentage.mjs`: helper phần trăm bar dùng integer arithmetic.
- `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/components/business/cash-flow-bars.tsx`,
  `apps/web/src/app/loans/[id]/page.tsx`: dùng helper và đánh dấu zero.
- `apps/web/src/styles/dashboard.css`, `apps/web/src/styles/workflows.css`: zero không còn pixel giả.
- `apps/web/test/unit/c84-presentation.test.mjs`, `apps/web/test/unit/chart-privacy.test.mjs`: boundary,
  source/CSS regression và VM dependency của chart thực.
- `apps/web/test/e2e/c75-remediation.spec.ts`: không ghi evidence lịch sử trong full regression mặc
  định; capture có chủ đích vẫn khả dụng qua biến môi trường.

### Review UI/UX

Audit: Next.js 16/React 19/Tailwind 4; internal UI primitives; style flat fintech light/dark; giữ
style dự án hiện hữu.

Đã probe `/login` ở 375/768/1024/1440 px và sweep 1440→375 bước 20 px trong light/dark. Không có
layout break, overflow hoặc clipping. Cảnh báo focus ring của probe được giữ vì đây là tín hiệu
accessibility chủ đích, không phải lỗi. Không thay palette/manifest/design system trong C113.

## 4. Verification thực tế

| Gate | Kết quả |
| --- | --- |
| `git diff --check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS, 3 workspace package |
| `pnpm test` | PASS, web 61 + Google Sync 20 + domain 11 + root 34 = 126 |
| `pnpm build` | PASS, 19 route |
| `pnpm test:auth` | PASS, 6/6 |
| `supabase test db` | PASS, 543 test / 25 file |
| `supabase db lint --schema public,private --level warning --fail-on error` | PASS, không có schema error |
| `pnpm test:e2e` | PASS, 92 passed / 18 skipped / 0 failed, 27,7 phút |
| `pnpm audit --audit-level high` | PASS, không có vulnerability đã biết |
| `pnpm ci:validate` | PASS, CI policy và actionlint |

`supabase db lint --level warning` trên toàn database có cảnh báo/error tĩnh trong schema
`extensions` của pgTAP (API catalog cũ/dynamic SQL), nhưng exit code 0; lượt lint giới hạn vào schema
sản phẩm `public,private` sạch. Các test E2E bị skip là nhánh có điều kiện đã có trong suite, không
phải failure mới. Full E2E đã truy cập thật các route Auth/Server Component được thay đổi gián tiếp.

## 5. Đề xuất kỹ thuật cần phê duyệt

| Thứ tự | Đề xuất | Lợi ích | Ưu tiên / độ phức tạp | Tác động và rủi ro |
| --- | --- | --- | --- | --- |
| 1 | Egress policy cho Web Push: allowlist provider đã quan sát hoặc resolver kiểm tra toàn bộ A/AAAA trước kết nối, chặn private/reserved range và revalidate redirect | Giảm SSRF/DNS-rebinding từ endpoint đã đăng ký | Cao / Trung bình–cao | Có thể làm hỏng subscription hợp lệ hoặc phụ thuộc DNS; cần inventory provider, threat model và test Production-like |
| 2 | Saga đổi mật khẩu có recovery: lưu operation state/idempotency server-side hoặc job đối soát flag sau Auth update | Loại trạng thái “mật khẩu đã đổi nhưng profile chưa hoàn tất” | Cao / Trung bình | Có thể cần migration và quy tắc retry/rollback; không được lưu mật khẩu |
| 3 | CSP nonce/hash tương thích Next.js | Giảm khả năng thực thi inline script khi có XSS | Trung bình / Trung bình | Rủi ro hydration/PWA/streaming; cần rollout theo Report-Only trước |
| 4 | Telemetry có giới hạn cho sync validation và Push queue | Phát hiện payload drift, tab thiếu, lease/state update fail trước khi người dùng báo | Trung bình / Thấp–trung bình | Chỉ log code/count/fingerprint; tuyệt đối không log endpoint, key, payload tài chính |

## 6. Đề xuất tính năng mới (chưa triển khai)

| Tính năng | Vấn đề hiện tại / giải pháp | Lợi ích | Ưu tiên / độ phức tạp | Tác động dữ liệu và rủi ro |
| --- | --- | --- | --- | --- |
| Trung tâm sức khỏe đối soát | Việc kiểm Google Sync đang dựa vào thao tác owner; hiển thị read-only lần sync cuối, cursor, đủ 13 tab, row-count/hash và snapshot gần nhất | Biết sớm bản đối chiếu thiếu/stale mà không đọc ngược Sheet | Cao / Trung bình | Thêm metadata/endpoint, không đổi nguồn dữ liệu; tránh hiển thị dữ liệu tài chính nhạy cảm |
| Kiểm tra bất thường dữ liệu | Chạy các invariant sẵn có theo lịch và hiển thị cảnh báo: kỳ chồng ngày, orphan, tổng reversal, notification lease treo | Phát hiện lệch dữ liệu trước khi ảnh hưởng báo cáo | Cao / Trung bình | Chỉ read-only trước; phải chống false positive và không tự sửa dữ liệu |
| Dự báo dòng tiền theo kịch bản | Cho xem “nếu thu/trả đúng lịch” theo 30/60/90 ngày bằng RPC read-only, phân biệt rõ dữ liệu giả định | Hỗ trợ chuẩn bị thanh khoản | Trung bình / Cao | Phải authoritative ở PostgreSQL, không ghi giao dịch; rủi ro người dùng nhầm forecast với số đã phát sinh |
| Nhật ký vận hành notification/sync | Dashboard owner tổng hợp lần chạy, số claim/send/fail, thời lượng, retry và nguyên nhân đã sanitize | Giảm thời gian chẩn đoán và theo dõi quota | Trung bình / Trung bình | Cần retention và privacy budget; không lưu provider payload/secret |

Nên triển khai trước “Trung tâm sức khỏe đối soát” cùng telemetry tối thiểu vì giá trị vận hành cao,
không thay đổi nghiệp vụ và có thể bắt đầu read-only. Mỗi đề xuất phải mở checkpoint/acceptance riêng;
C113 không cấp quyền triển khai.

## 7. Giới hạn và đánh giá cuối

- Không kiểm dữ liệu thật, log Production hiện thời, service account, DNS provider hoặc Push provider
  ngoài môi trường local; không thực hiện penetration test hay load test quy mô Production.
- Không kiểm thiết bị vật lý. C100 vẫn thiếu 5 cold launch + 5 vòng chuyển mục trên iPhone thật.
- Không thay đổi schema/RPC tài chính và không chạy migration/deploy remote, nên các rủi ro cần thay
  kiến trúc được giữ ở mức phương án.
- Mức tin cậy sau sửa: cao đối với hành vi local và regression được suite bao phủ; trung bình đối
  với egress/DNS, vận hành Production dài hạn và cảm nhận thiết bị thật do chưa nằm trong phạm vi.

Không còn lỗi nghiêm trọng đã xác nhận nhưng chưa xử lý. Các quyết định cần OWNER phê duyệt là thứ
tự mở checkpoint hardening Web Push, recovery đổi mật khẩu và CSP; C100 tiếp tục độc lập theo số đo
iPhone còn thiếu.
