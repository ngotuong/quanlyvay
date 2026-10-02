# C76 — Đồng bộ và rollout C74–C75

Trạng thái: IN_PROGRESS. OWNER phê duyệt ngày 2026-10-02.

## Preflight

- Startup đọc AGENTS.md, PROJECT_CONTEXT.md, mục34 roadmap, status main/origin; bảo toàn toàn bộ
  local C74–C75, không có thay đổi khác được phát hiện.
- Review source: presentation/dashboard task visibility, metadata privacy, notifications hierarchy
  và empty copy; không đổi schema, RPC, Auth, tiền, secrets hoặc dữ liệu remote.
- `git diff --check`, CI policy/actionlint, lint, typecheck, unit/script80/80, build19 routes PASS.
- `pnpm audit --audit-level high`: không có lỗ hổng đã biết.
- Gitleaks pinned full history137 commits PASS; từng thư mục audit-c74/remediation-c75 PASS.
  Lệnh dir đầu dùng hai positional paths nên thực tế quét rộng repository, tìm29 phát hiện;
  chạy lại có report redacted tìm53 do build/test đang thay đổi cache. Tất cả37 file của report
  thứ hai được xác minh ignored và untracked (cache/build/test/credential local). Không đưa các
  file này hoặc report chứa giá trị vào Git; không coi chúng là leak mới của source C74–C75.
- Full E2E PASS48/48 bài chạy,5 audit opt-in skip, tổng53 bài, exit0. Disposable project
  QuanLyVayCaNhan-C20-test/API55321/DB55322; teardown profiles/loans/transactions0/0/0.
  C75 recapture six matrix25 synthetic tasks, clipped0/overflow0; ảnh mobile đã xem.
  Kong test đã restart riêng trước chạy; không thao tác local project chính hoặc project anh em.

## Rollback đã kiểm tra trước triển khai

| Môi trường | Deployment tốt hiện tại | Immutable URL |
|---|---|---|
| Preview | dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb | https://quan-ly-vay-ca-nhan-c6pft4h1k-ngotuong2105.vercel.app |
| Production | dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx | https://quan-ly-vay-ca-nhan-7g0uxlwrm-ngotuong2105.vercel.app |

Inspect alias xác nhận Ready/target tương ứng. Remote project inspect đúng
prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F, ngotuong2105, root apps/web. Cần kiểm lại trước promote.

## Giới hạn

Hai candidate9001479 đã Ready nhưng bị giữ lại để sửa card dòng tiền; chưa chuyển alias chính,
chưa hoàn tất checkpoint. Cảnh báo Chrome C73 vẫn OPEN;
VoiceOver/TalkBack/mobile vật lý chưa được kiểm chứng. Remote smoke chỉ đọc, không mark-read,
đổi giờ/quyền push hoặc ghi tài chính để tạo fixture. Các trạng thái không có sẵn sẽ NOT_TESTED.

## Blocker upload preflight và remediation

`vercel deploy --dry --format=json` (không upload) liệt kê341 file/29.206.057bytes, gồm
backup ciphertext/manifest/log trong .backups. .vercelignore hiện hữu không loại trừ thư mục
này; không được dựa vào .gitignore để khẳng định deployment payload an toàn. Đã bổ sung
/.backups/ và /.cache/ trong phạm vi sửa release blocker C76. Chưa tạo deployment từ source
C76; cần dry-run sạch và Required CI SHA sửa trước khi phát hành. Không đọc dump/secret, xóa
backup hoặc sửa dữ liệu. Mac đang khóa: browser smoke chờ OWNER mở khóa, CLI tiếp tục.

Dry-run sau sửa: 206 entries/197 regular files/4516731bytes;
không backup/cache/test artifact/log/credential/secret trong regular file payload. File duy nhất
không tracked là next-env.d.ts generated chuẩn Next.js. Empty directory entries size0/mode16877
không chứa nội dung. Bổ sung cả test-results/playwright-report/coverage/env/key/log và local-only
thư mục để tránh lần chạy tiếp theo đưa artifact vào payload. Diff-check/policy PASS; app source
không đổi so với b58b0e8 đã đạt full local gate. Cần Required CI commit config sửa mới.

## Inventory deployment cũ đang làm rollback

Vercel GET /v6/deployments/{id}/files (chỉ inventory, không tải nội dung) xác minh
Production dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx có77 backup leaf paths:63 .qlvbak,11 .json
manifest và3 .log;60 test artifacts,1 .env.example. Các file cần đối chiếu nằm trong source
package; chưa có bằng chứng plaintext secret hoặc public HTTP exposure. Đây là rủi ro giữ
artifact cũ, không kết luận dữ liệu tài chính đã lộ. Không xóa/ghi đè deployment đang làm
rollback trong C76; cleanup hoặc mở rộng incident review cần checkpoint được phê duyệt riêng.
Config sửa mới phải qua CI và candidate upload inventory sạch trước promote.

Preview rollback cũng có77 backup files/60 test artifacts, toàn bộ backup trong src và không
trong out inventory. Ba HEAD probe mỗi môi trường (ciphertext/log/source-log) đều404; không
đọc response body. Đây không phải chứng minh mọi URL không thể lộ; rủi ro retention source
package vẫn mở, cần đánh giá riêng khi có rollback sạch thay thế.

Required CI36993707917/9001479 attempt1: policy/security PASS, Quality build FAIL35 lỗi
next/font/google queries have exactly one entry trong Turbopack font loader. Layout/font,
next.config/package/lock không đổi từ4c84d67; local build và quality củab58b0e8 đạt. Không
gắn lỗi này với .vercelignore hay kết luận nguyên nhân khi chưa có bằng chứng. Integration
đang chạy; GH không cho rerun completed job khi workflow vẫn chạy. Chờ run kết thúc rồi
rerun failed trên cùng SHA trước thay source hoặc tạo candidate.

Attempt1 integration: pgTAP527/527 và Auth6/6 PASS; E2E chưa chạy vì readiness
HTTP502 sau93 attempts. Run đã kết thúc FAIL, rerun cùng SHA attempt2. Quality/build,
policy và security của attempt2 PASS; integration đang chạy. Không thay font/bundler,
nới timeout hoặc bỏ gate; lỗi font lần đầu là build failure đã tái kiểm, chưa có root cause.

## CI source phát hành đã đạt

SHA9001479fa5de25fd996f3022a4e36a7f6644e9cf đã push/main=origin/main.
Required CI36993707917 attempt2 SUCCESS cả5 jobs; pgTAP527/527, Auth6/6, E2E47PASS6SKIP
(5 audit opt-in và RPC lock probe CI skip theo contract). Quality/build font lần2 đạt không
đổi source; không kết luận root cause đã được đóng. SourceCI JSON đối chiếu đúng SHA/status/
conclusion/job count trước pipeline.196 tracked regular payload files SHA-1 khớp commit;
next-env.d.ts generated ngoài Git; local context/evidence đổi được Vercel ignore.

Root `E2E_DATABASE_PREPARED=true pnpm deploy:preview` bắt đầu sau CI đạt, vẫn chạy đầy đủ
diff/lint/typecheck/unit/build/E2E. Flag prepared dùng baseline do teardown trước đã reset và
hậu kiểm0/0/0, Authhealth200; không bỏ gate hoặc dùng DB remote. Chờ candidate/public smoke.

C76 bổ sung 2026-10-02: Required CI36993707917 attempt2 của9001479 đạt cả5 job
(pgTAP527, Auth6, E2E47PASS/6SKIP). Preview candidate dpl_CpaHTRzr19EYFFrA6upUM5WLrNHr
đã Ready sau root pipeline full gate48PASS/5SKIP. Khi review ảnh desktop recapture, phát hiện
CSS cũ globals.css min-height:100% kéo card dòng tiền theo danh sách25 việc. Candidate9001479
chưa qua Auth smoke và không được promote; đang sửa min-height riêng grid và bổ sung regression
đo chiều cao card trước/sau expand/collapse. Hai alias chính giữ deployment C73. Mac khóa,
Auth smoke vẫn chờ OWNER mở khóa; không phát hành khi thiếu gate.

## Candidate9001479 được giữ lại, không promote

Preview dpl_CpaHTRzr19EYFFrA6upUM5WLrNHr /
https://quan-ly-vay-ca-nhan-420jgyqx3-ngotuong2105.vercel.app và Production
dpl_C91gArAJyXHRLQDDSLrGGuqa2qxU /
https://quan-ly-vay-ca-nhan-aoct86q0k-ngotuong2105.vercel.app đã Ready. Inventory
cả hai241 leaf files,0 forbidden artifact/secret paths (env.example an toàn được loại khỏi
forbidden). Preview root full gate48PASS/5SKIP và public smoke đạt. Chưa authenticated smoke.
Production root --skip-domain vẫn tạo alias hostname mặc định của project theo CLI;
inspect tindung.vercel.app xác nhận vẫn dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx.
Không coi hostname mặc định là stable alias chính đã rollout. Không xóa candidate/rollback.

Ảnh synthetic trước sửa: before-chart-stretch-1440-dark.png. C75 align-items:start chưa đủ
vì globals.css1160 min-height:100% ép chiều cao card theo grid row. C76 sửa selector scoped
min-height:0, regression đo trước/sau expand và collapse tại1440 cả sáng/tối; giữ nguyên
mobile, tokens/brand, dữ liệu và chart authoritative. Đây là sửa lỗi của C75, không làm G2
redesign desktop compact. Lint/typecheck/unit/build đạt; full E2E đang chạy.

C76 chart correction gate lần1: policy/lint/typecheck/unit80/build19 PASS; full E2E
47PASS/5SKIP/1FAIL5,8m. Lỗi C67 mobile-more sheet Tab cuối→đầu không focus close
(c67-accessibility.spec.ts68); CSS sửa chỉ cash-flow-card. Không đổi/skipping assertion,
đang rerun full suite cùng source để xác định khả năng tái hiện; chưa kết luận root cause.
C75 regression3/3 đạt:6 matrix25tasks overflow0/clipped0; chart desktop429,234375px
giữ nguyên trước/expanded/collapsed sáng/tối, mobile479,46875px giữ nguyên. Ảnh desktop
sau sửa đã xem, chart không còn stretch. Test teardown baseline profiles/loans/transactions0.

C76 chart correction gate lần2 cùng source: full E2E48PASS/5SKIP5,5m, exit0;
C67 focus wrap đạt không thay assertion/timeout. C75 six matrix25tasks/chart desktop
429,234375px delta0 trước/sau mở/thu; mobile479,46875px delta0; overflow0/clipped0.
DB test hậu kiểm profiles/loans/transactions0/0/0. Policy/actionlint, lint/typecheck,
unit80, build19 routes, diff-check, C76 secret scan PASS; dry-run197 regular files
4517294bytes/0 forbidden. Chuẩn bị commit/push bản sửa, cần Required CI SHA mới trước
candidate mới. C76 vẫn IN_PROGRESS, Mac khóa khiến Auth smoke chưa thực hiện.
