# C115 — Rollout C114 và hậu kiểm

Trạng thái: `IN_PROGRESS` ngày 24/10/2026. OWNER đã phê duyệt checkpoint C115 trong hội thoại
hiện tại; rollout đầu đã đạt nhưng Required CI tài liệu phát hiện advisory Zod mới cần hotfix và
redeploy trước khi đóng checkpoint.

## 1. Supabase migration-first

- Project đích: `hmfxnstrqfqpvsgfmjmd`.
- Backup mã hóa trước migration: `qlv-prod-20261022T233437Z`; manifest có 6 tệp, checksum và
  SQL-shape đạt, retention dry-run không xóa backup.
- Migration duy nhất còn thiếu trước rollout là
  `20261022100000_c114_security_hardening.sql`; dry-run xác nhận đúng phạm vi rồi `db push`
  áp thành công.
- Remote migration history đã có `20261022100000`; schema lint mức warning sạch.
- `profiles.password_reset_generation` là `bigint NOT NULL DEFAULT 0`; không có profile mang
  generation không hợp lệ sau migration.
- Inventory endpoint đã sanitize: 1 subscription dùng `fcm.googleapis.com`, 4 subscription dùng
  `web.push.apple.com`; cả hai hostname nằm trong provider policy mặc định. Không ghi endpoint,
  token hoặc dữ liệu tài khoản vào báo cáo.

## 2. Preview C115

### Candidate và rollback

| Vai trò | Deployment | URL | Target / trạng thái / region |
| --- | --- | --- | --- |
| Candidate và stable Preview C115 | `dpl_BRfVm4hf5jfk5FJe2mXPxmrt3hC4` | `https://quan-ly-vay-ca-nhan-5ydpf15dp-ngotuong2105.vercel.app` / `https://tindung-preview.vercel.app` | Preview / Ready / Functions `sin1` |
| Rollback Preview C115 trước hotfix | `dpl_8pxn5Ze87nbvdNbaF5CQeQ1oan9b` | `https://quan-ly-vay-ca-nhan-97arw9mvp-ngotuong2105.vercel.app` | Preview / Ready / Functions `sin1` |
| Rollback Preview C112 | `dpl_2a8avNFZHZxcDsZvheXP84dLu8Ri` | `https://quan-ly-vay-ca-nhan-74fc7gb9r-ngotuong2105.vercel.app` | Preview / Ready / Functions `sin1` |

Candidate thuộc đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`. Vercel CLI không trả mảng
region ở deployment-level; kiểm tra function inventory của root pipeline xác nhận toàn bộ Server
Functions ở `sin1`.

### Gate và smoke

- Root create/resume trên candidate cuối đều đạt `git diff --check`, lint, typecheck, unit
  `138 PASS`, build `19 route` và full E2E `94 PASS / 18 SKIP / 0 FAIL`; hai lượt lần lượt chạy
  27,1 và 27,2 phút.
- Upload metadata guard đạt 248 tệp, 5.473.036 byte. Guard được sửa để hiểu chính xác tệp `.git`
  dạng managed-worktree và vẫn fail-closed với secret, dump, symlink hoặc ignore drift.
- Immutable candidate: `/login` và `/sw.js` HTTP 200; CSP có nonce khác nhau giữa hai request,
  `script-src` không có `'unsafe-inline'`; console không warning/error.
- Authenticated immutable smoke đạt trên Dashboard, Khoản vay, Đối tác, Thông báo, Cài đặt và
  Đổi mật khẩu; không route nào quay về login.
- Root resume chỉ chuyển alias sau candidate smoke; hậu kiểm stable alias xác nhận đúng deployment,
  project, target Preview và trạng thái Ready.
- Stable alias public smoke: `/login` và `/sw.js` HTTP 200; nonce hiện diện/độc nhất,
  `script-src` không có `'unsafe-inline'`.
- Stable alias authenticated smoke đạt trên sáu route như candidate; browser console sạch.
- Cửa sổ candidate và post-alias đều có Vercel `level:error = 0`, HTTP 500 = 0.

### Nghiệm thu iPhone thật

- OWNER xác nhận ngày 23/10/2026 trên iPhone thật: đã bật và đăng ký Web Push, thiết bị nhận được
  notification, chạm notification mở đúng webapp. Nút thử Preview không ghi dữ liệu Supabase.
- Bằng chứng này chứng nhận permission/subscription, hiển thị notification và deep-link trên thiết
  bị thật; delivery provider vận hành tiếp tục được hậu kiểm cùng Production runtime sau rollout.

## 3. Production C115

### Preflight và provenance

- Release source: `9f9f526fed34a39ecfbe4a3b54cd811af4f976d2`, đã fast-forward tới
  `origin/main`; worktree sạch và HEAD bằng `origin/main` trước deploy.
- `git diff --check`, lint, typecheck, unit `138 PASS` và build `19 route` đạt. Local Playwright
  artifact kết thúc `passed`, không có failed test; Required CI chạy độc lập ghi
  `93 PASS / 19 SKIP / 0 FAIL` trong 33,4 phút.
- Upload metadata guard đạt 248 tệp / 5.473.498 byte.
- Required CI `39963662481` trên đúng release source đạt đủ 5 job: workflow policy,
  quality/build, dependency/secret scan, Supabase Auth pgTAP/E2E và Required CI gate.

### Candidate, smoke và rollback

| Vai trò | Deployment | URL | Target / trạng thái / region |
| --- | --- | --- | --- |
| Production C115 | `dpl_GndhsLryK5D15xkut2aHPdeFKGWX` | `https://quan-ly-vay-ca-nhan-j07u4c057-ngotuong2105.vercel.app` | Production / Ready / Functions `sin1` |
| Rollback Production C112 | `dpl_75xKhFuJ4wgspCmGdN4txdtNwyVF` | `https://quan-ly-vay-ca-nhan-967no3d6v-ngotuong2105.vercel.app` | Production / Ready / Functions `sin1` |

- Candidate được tạo từ repository root bằng `vercel deploy --prod --skip-domain`; build dùng
  Next.js 16.4.1 và sinh đủ 19 route. Trong lúc smoke, cả hai alias vẫn trỏ C112.
- Public candidate đạt HTTP 200 cho `/`, `/login`, manifest và `/sw.js`; hai API bảo vệ trả 401.
  CSP có một script nonce mỗi response, nonce khác nhau giữa hai request và `script-src` không có
  `'unsafe-inline'`.
- Authenticated candidate đạt Dashboard, Khoản vay, Đối tác, Thông báo, Cài đặt và Đổi mật khẩu;
  không route nào quay về login, browser console không warning/error. Runtime ghi sáu route HTTP
  200, `dashboard.bundle` 1505,3 ms với `outcome: ok`; level-error và HTTP 500 bằng 0.
- Candidate và rollback C112 được re-inspect ngay trước promote: cùng đúng project, target
  Production, `Ready`, Functions `sin1`. Rollback C112 chưa kích hoạt.

### Promote và hậu kiểm

- `vercel promote` thành công. `tindung.vercel.app` và
  `quan-ly-vay-ca-nhan-ngotuong2105.vercel.app` cùng trỏ Production C115, target Production,
  `Ready`, Functions `sin1`.
- Public smoke trên từng alias đạt 200 cho `/`, login, manifest, service worker và 401 cho hai API
  bảo vệ. CSP trên từng alias có nonce khác nhau theo request, không có `script-src 'unsafe-inline'`.
- Auth smoke sáu route đạt trên cả hai alias, không Auth loop; browser console của từng alias sạch.
  Runtime hậu kiểm ghi HTTP 200, `dashboard.bundle` 1652,6 ms với `outcome: ok`; cửa sổ mới có
  level-error 0 và HTTP 500 bằng 0. Không cần rollback.
- C112 tiếp tục là rollback Production đã xác minh; C115 không thay đổi dữ liệu tài chính trong
  smoke và không tạo tài khoản/secret mới.

### Lịch sử remediation CI trước release source

Lượt Required CI đầu của source commit `d8a4154` dừng ở Gitleaks do hai mật khẩu fixture tổng hợp
trong E2E bị nhận nhầm là generic API key; workflow policy và quality/build đạt. Bản khắc phục chỉ
allow đúng hai fingerprint lịch sử và đánh dấu inline fixture, không bỏ rule hoặc ignore theo file;
phải chạy lại full-history scan và Required CI trên SHA kế tiếp.

Lượt CI kế tiếp xác nhận full-history secret scan sạch nhưng dependency audit phát hiện ba advisory
Next.js mới công bố cho dải `16.0.0–16.4.0` (hai critical, một high). C115 nâng bản vá tối thiểu
`next` và `eslint-config-next` từ `16.3.8` lên `16.4.1`, đồng thời port nguyên patch lint C76 và
minimum-release-age exclusions sang đúng version. `pnpm install --frozen-lockfile` bằng pnpm 11.9.0
đạt; `pnpm audit --audit-level high` còn 0 vulnerability. Lint, typecheck, unit `138 PASS`, build
`19 route` và full E2E `94 PASS / 18 SKIP / 0 FAIL` trong 27,3 phút dưới Next.js 16.4.1 đều đạt.
Source hotfix `aa7be6c8b4e1ef62645b2f27bb0241dcada4feec` đã fast-forward lên `origin/main`.
Required CI `39906882151` của đúng SHA đạt đủ 5 job: quality/build, workflow policy,
dependency/secret scan, Supabase Auth pgTAP/E2E và Required CI gate.

Required CI `40063036588` của commit tài liệu `eea79641dab1956531bbd8601bc9797f711aee38`
phát hiện advisory high `GHSA-mrhx-c7xc-m3w5` với Zod `<4.6.6`; secret scan, workflow policy và
quality/build đạt. C115 nâng dependency trực tiếp từ Zod 4.4.3 lên 4.6.7. Local audit còn 0
vulnerability; lint, typecheck, unit `138 PASS`, build `19 route` và full E2E
`94 PASS / 18 SKIP / 0 FAIL` trong 28,0 phút đạt. Production hiện hành vẫn là deployment trên;
hotfix chưa được deploy và checkpoint chưa hoàn tất cho đến khi SHA mới có Required CI xanh,
candidate thay thế qua smoke và hai alias được hậu kiểm.

Required CI hotfix `40083393933` trên source
`e42cd6ced2a8fe62a1c079ecdba522bf0992eb61` đạt workflow policy, quality/build và dependency/
secret scan; pgTAP và Auth integration cũng đạt. Job E2E bị hủy ở giới hạn 45 phút sau khi ca cuối
`C99 navigation timing ... fresh delayed read` chờ 15 giây mà không thấy content sample `loans`
ít nhất 2 giây. Log xác nhận target đã có lúc dùng partial-prefetch shell được làm nóng trước khi
header delay được bật; đây là race của harness, không phải bằng chứng test đạt. Bản khắc phục cài
interception chặn `next-router-prefetch` từ trước login, giống tiền lệ C63/C87; giữ nguyên route
`/loans`, delay/assertion 2 giây, timeout, retries 0, skip và budget CI 45 phút. Targeted chạy lặp
đạt `3 PASS / 0 FAIL` trong 2,8 phút; Required CI đầy đủ trên source kế tiếp vẫn bắt buộc trước deploy.

Required CI kế tiếp `40086919496` trên source
`cb82104a4b94e5ee55c833e1ce0afb0d71127f61` không còn assertion failure: E2E đi qua ca 107 rồi
bị GitHub hủy thuần ở giới hạn 45 phút khi đang chạy ca 108/112. Để giữ nguyên budget 45 phút và
không bỏ test, retry hoặc nới assertion, job integration dùng matrix hai shard độc lập; shard 1 giữ
database lint/pgTAP/Auth và chạy 57 E2E, shard 2 chạy 55 E2E còn lại gồm C99. `fail-fast: false`
bắt buộc cả hai shard có kết luận; CI policy khóa cấu hình này. Actionlint/policy đạt và Playwright
`--list` xác nhận `57 + 55 = 112` test, không thiếu ca nào.

Required CI hai shard `40091133558` trên source
`2f8ae6b533f8d752b805d2fcbaf3828c8b1e2d35` đạt dependency/secret scan, workflow policy và
quality/build. Shard 1 đạt database lint, pgTAP, Auth và 50 E2E trước khi thất bại duy nhất ở C107:
harness đã `await click()` trước khi kiểm tra `.navigation-feedback-message`, nên trên runner tải
cao Playwright có thể hoàn tất navigation promise sau khi feedback đã teardown đúng thiết kế.
Bản sửa khởi động click, quan sát feedback/progress/`aria-busy` khi promise điều hướng còn chạy rồi
mới await promise; giữ nguyên delay 1,1 giây, toàn bộ assertions, timeout, retries 0 và skip.
Targeted C107 lặp đạt `10 PASS / 0 FAIL` trong 2,5 phút. Không có code Production nào thay đổi;
Required CI trên source mới vẫn bắt buộc trước redeploy.

Required CI `40093387898` trên source
`f5ad811a897bb0b1589e611a132f22254887ce40` có shard 2 đạt đủ 55 E2E; shard 1 đạt database lint,
pgTAP, Auth và 50 E2E nhưng C107 thất bại ở assertion thứ hai sau `await navigation`. Assertion đầu,
progress và `aria-busy` đều đạt, nên feedback đã xuất hiện đúng lúc; phần còn lại race với teardown
hợp lệ sau completion. Harness nay giữ trực tiếp RSC transport 1,1 giây, xác nhận feedback ở đầu
và cuối cửa sổ pending, rồi mới nhả request và kiểm teardown. Targeted mới đạt
`10 PASS / 0 FAIL` trong 2,8 phút; code Production, timeout, retries và skip không đổi.

Revision harness quyết định đã push tại `fda2481b763a5e3f87285ff8b1995e5804dd3103`; local lint,
typecheck, unit 139, build 19 route, audit, policy, upload guard và targeted C107 đều đạt. Required
CI `40100211560` không chạy bước checkout nào: cả năm job bị GitHub từ chối khởi động với annotation
account payment thất bại hoặc spending limit cần tăng. Đây là blocker tài khoản ngoài source; C115
không bỏ qua Required CI và không tạo Production candidate cho đến khi OWNER xử lý Billing & plans.

## 4. Kết luận

C115 đã đạt các cổng migration, provider policy, Preview, iPhone Web Push và rollout Production
ban đầu. Còn Required CI hai shard và redeploy Zod 4.6.7 trước khi chuyển lại `COMPLETED`. C100 tiếp
tục `IN_PROGRESS` độc lập; không tự mở checkpoint mới.
