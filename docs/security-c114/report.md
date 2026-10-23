# Báo cáo C114 — Hardening Web Push, đổi mật khẩu và CSP

Ngày hoàn tất local: 22/10/2026

Phạm vi: ba hạng mục kỹ thuật được OWNER phê duyệt sau C113

Trạng thái: `COMPLETED` local; chưa rollout remote

## Kết quả

C114 đóng cả ba khoảng trống đã xác nhận mà không thay quy tắc nghiệp vụ hoặc phép tính tài chính:

1. Web Push chỉ gửi tới provider đã cho phép qua HTTPS/443. Tất cả A/AAAA phải là địa chỉ public;
   request dùng HTTPS Agent ghim đúng IP đã kiểm để loại DNS rebinding/TOCTOU.
2. Đổi mật khẩu dùng generation monotonic trong profile và marker cùng generation ở Auth
   `app_metadata`. Nếu Auth thành công nhưng profile update lỗi, request/session sau tự hoàn tất an
   toàn và idempotent; marker cũ không hợp lệ cho lần reset mới.
3. Response HTML dùng CSP nonce ngẫu nhiên theo request. `script-src` Production không còn
   `'unsafe-inline'`; service worker có policy tĩnh riêng và `style-src 'unsafe-inline'` được giữ có
   chủ đích vì phạm vi C114 chỉ yêu cầu loại inline script.

Không có migration remote, dữ liệu/secret/account remote, deploy, alias, `clasp`, commit hoặc push.

## 1. Web Push egress

### Contract và threat model

- URL phải là HTTPS, port mặc định/443, không có username/password và hostname không phải IP literal.
- Built-in provider policy: `fcm.googleapis.com`, `push.services.mozilla.com`,
  `updates.push.services.mozilla.com`, `*.push.apple.com`. Apple công bố network allowlist
  `https://*.push.apple.com`; Google công bố FCM send endpoint qua HTTPS. Provider riêng chỉ được
  thêm rõ bằng `WEB_PUSH_ALLOWED_HOSTS` và vẫn chịu toàn bộ DNS/IP gate.
- Resolver lấy toàn bộ A/AAAA với `verbatim`. Zero answer, answer malformed hoặc tập kết quả trộn
  public với non-public đều fail-closed.
- IPv4 loopback/private/shared/link-local/documentation/benchmark/multicast/reserved và IPv6 ngoài
  global unicast hoặc special-purpose bị chặn. IPv4-mapped/private IPv6 cũng bị chặn.
- Sau validation, request không resolve lại tự do: HTTPS Agent dùng lookup ghim một IP public vừa
  kiểm, trong khi TLS SNI/certificate vẫn xác minh hostname provider. Agent bị destroy sau mỗi gửi.
- `web-push` dùng một `https.request`; response ngoài 2xx là lỗi và không có redirect-follow. Vì
  vậy 3xx không tạo egress mới. Cả DNS lẫn socket gửi chịu timeout 5 giây của delivery; queue
  lease/retry/idempotency và error redaction cũ được giữ.

File chính: `apps/web/src/lib/notifications/push-endpoint.mjs`, notification runner và Server Action
đăng ký subscription. Test unit phủ URL/host policy, custom policy, IPv4/IPv6 special ranges, DNS
private/mixed, DNS timeout và lookup pin đúng địa chỉ.

## 2. Recovery đổi mật khẩu

Migration `20261022100000_c114_security_hardening.sql` thêm
`profiles.password_reset_generation bigint not null default 0`, constraint không âm và cập nhật
`mark_password_reset_required` để tăng generation trước khi OWNER cài mật khẩu tạm.

Luồng hoàn tất dùng Admin API được kiểm soát trong Server Action để password và marker protected
được ghi cùng một Auth operation. Sau đó app cấp lại session cho đúng user bằng mật khẩu mới và
clear profile theo điều kiện `user_id + generation + must_change_password=true`. Password chỉ tồn
tại trong request đang xử lý; không vào profile, metadata, log hoặc audit.

Nếu profile write lỗi, `getAuthenticatedProfile` và login đọc marker protected rồi chỉ reconcile
khi user ID và generation khớp tuyệt đối. Lần OWNER reset tiếp theo tăng generation trước nên marker
cũ không thể clear. Update conditional và đọc lại profile làm retry idempotent. Client
`authenticated` vẫn không có quyền tự clear profile hoặc tăng generation.

Test unit phủ marker/malformed/cross-user/stale generation; pgTAP phủ default, increment/retry,
permission và constraint; E2E phủ first-login, session mới, cửa sổ Auth-success/profile-failure,
stale proof, client update denial và mật khẩu cũ bị vô hiệu.

### Compatibility và rollback

- Migration additive; code cũ bỏ qua column mới. Thứ tự rollout an toàn là migration trước, web
  sau. Rollback web về C112/C113 vẫn chạy khi column còn tồn tại.
- Không drop column khi web C114 còn phục vụ. Nếu buộc rollback database, trước hết rollback web,
  khôi phục function `mark_password_reset_required` phiên bản trước, rồi mới drop constraint/column;
  thao tác này bỏ bằng chứng generation và cần checkpoint phá hủy riêng.
- Nếu Auth update thành công nhưng session refresh lỗi, UI yêu cầu đăng nhập lại bằng mật khẩu mới;
  marker vẫn đủ để request đăng nhập kế tiếp reconcile profile.

## 3. CSP nonce

`proxy.ts` tạo nonce 144-bit bằng `randomBytes(18)` cho từng request, đặt CSP và `x-nonce` trên
request nội bộ để Next.js gắn nonce vào framework/streaming scripts, sau đó đặt cùng CSP trên
response. Production `script-src` là `'self' 'nonce-…' 'strict-dynamic'`; Development chỉ thêm
`'unsafe-eval'` cho tooling. Header CSP tĩnh cũ trong `next.config.ts` đã được bỏ để tránh policy kép.

`/sw.js` và manifest/static image được loại khỏi proxy nonce. Service worker nhận policy tĩnh riêng
`script-src 'self'`; các security header khác vẫn áp dụng toàn app. E2E production build xác minh
hai response có nonce khác nhau, inline script đều mang nonce, không có console CSP violation,
theme SSR hoạt động và service worker active.

Theo hướng dẫn CSP chính thức của Next.js, nonce buộc route HTML dynamic; các route ứng dụng hiện
đã dynamic do Auth/cookies và build vẫn cho 19 route. Manifest tiếp tục là route static.

## Gate cuối

- `git diff --check`: PASS.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: `138 PASS / 0 FAIL` (20 Google Sync, 11 domain, 73 web, 34 scripts).
- `pnpm build`: PASS, 19 route; HTML app dynamic, manifest static.
- `pnpm test:auth`: `6 PASS / 0 FAIL`.
- `supabase db lint --level warning`: sạch.
- `supabase test db`: `552 PASS / 26 file`.
- `pnpm test:e2e`: `94 PASS / 18 SKIP / 0 FAIL`, 27,7 phút, 112 case được discovery.
- Targeted C114 trước full gate: CSP/PWA và password recovery đều PASS.

## Residual risk và phần chưa kiểm

- Chưa inventory hostname của subscription Production và chưa gửi Web Push thật tới Apple/Google/
  Mozilla trong C114; provider drift sẽ fail-closed. C115 phải kiểm hostname count đã sanitize trước
  rollout, không in endpoint/token.
- CSP đã kiểm trên Chrome production build local; Safari/iPhone thật và header qua Vercel edge chưa
  kiểm. C115 phải smoke Preview immutable và thiết bị thật trước khi chuyển alias.
- Recovery đã kiểm trên Supabase local. Không cố tình tạo lỗi nửa chừng trên tài khoản vận hành;
  Production rollout dùng migration-first và quan sát log đã redact.
- `style-src 'unsafe-inline'` còn lại có chủ đích và không nằm trong acceptance loại inline script.

## Rollout đề xuất (chưa được phê duyệt)

C115 áp migration remote trước, kiểm schema/lint và provider hostname inventory đã sanitize; tạo
Preview bằng `pnpm deploy:preview`; kiểm immutable URL, CSP header/nonce, Auth routes, service worker,
Safari/iPhone Web Push và runtime log; chỉ sau OWNER nghiệm thu mới chuyển stable Preview rồi phát
hành Production theo runbook. Mọi thất bại hậu kiểm phải rollback alias về C112; column additive có
thể giữ lại an toàn trong lúc rollback web.

Tham chiếu: [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy),
[Apple Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers),
[Firebase network configuration](https://firebase.google.com/docs/cloud-messaging/network-configuration),
[web-push library](https://github.com/web-push-libs/web-push).
