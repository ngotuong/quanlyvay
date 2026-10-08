---
project: QuanLyVayCaNhan
roadmap_version: 1.0.310
last_updated: 2026-10-08
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C92
current_status: AWAITING_APPROVAL
last_completed_checkpoint: C91
next_checkpoint: C92
---

# Project Context

Tài liệu này chứa trạng thái hiện hành. Quy tắc ổn định nằm ở [AGENTS.md](AGENTS.md),
phạm vi/acceptance criteria ở [roadmap](docs/IMPLEMENTATION_PLAN.md).
Hướng dẫn chuyển cuộc trò chuyện: [HANDOFF_NEXT_SESSION.md](docs/HANDOFF_NEXT_SESSION.md).
Lịch sử dài đã chuyển nguyên văn sang [bản lưu đến C90](docs/history/project-context-through-c90.md);
không dùng lịch sử để suy quyền thực hiện mới.

## 1. Trạng thái và công việc kế tiếp

- C91 `COMPLETED` ngày 08/10/2026. Bản sửa VND/tab C90 đã phát hành trên Preview,
  Production và alias mặc định; không thay nghiệp vụ, dữ liệu thật hoặc schema/RPC.
- Runtime source: `ed72b8615e19f2a3e6667014c86da4ac920ed1ba`.
  Required CI [37644195261](https://github.com/ngotuong/quanlyvay/actions/runs/37644195261)
  thành công cả 5 job. Commit chốt `839d34b348e7dd435688365435cc0336bfcb4eb0` có [Required CI](https://github.com/ngotuong/quanlyvay/actions/runs/37803762628) thành công cả 5 job:
  pgTAP 527/24 files, Auth 6/0, E2E 63 đạt/19 bỏ qua.
  Commit trạng thái cuối chỉ sửa tài liệu; phải kiểm CI đúng SHA trước báo hoàn tất.
  SHA/run cuối được ghi trong hội thoại để tránh vòng commit tự tham chiếu.
- Preview: `dpl_CcJW5X4RDoUjCnPyi34t8uWapJCV`, target Preview, Ready, 43 Functions
  tại `sin1`; [immutable URL](https://quan-ly-vay-ca-nhan-1ypbqdcn7-ngotuong2105.vercel.app),
  [stable alias](https://tindung-preview.vercel.app). Pipeline tạo và resume chạy từ root
  bằng `pnpm deploy:preview`; gate trước chuyển và hậu kiểm đạt.
- Production: `dpl_Bnfe3DmqhkZ2vdKKkgZZJrNosEHu`, target Production, Ready,
  43 Functions tại `sin1`; [immutable URL](https://quan-ly-vay-ca-nhan-j2j77wuy3-ngotuong2105.vercel.app).
  Candidate dùng skip-domain; promote exit 0. [Production](https://tindung.vercel.app) và
  [alias mặc định](https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app) trỏ đúng deployment.
- Lint/typecheck/unit 117/build 19/policy/actionlint/audit/secret/native compatibility đạt.
  E2E sau dependency patch: 64 đạt/18 bỏ qua/12,9 phút; root Preview create 64/18/11,8 phút,
  resume 64/18/12,1 phút. OWNER duyệt riêng source-map-js 1.2.2/sharp 0.35.5; libvips 1.3.4 theo Sharp;
  audit ban đầu 2 HIGH được giữ, sau bản vá không còn known vulnerabilities.
- CI chốt đầu 37659616241/705b6da thất bại do race C87 delayed RSC interception.
  Synthetic transport tái hiện cùng lỗi. Test C87 đã sửa để đợi callback trước khi gỡ
  bộ chặn: targeted 3/3 đạt/4,3 phút và full E2E 64 đạt/18 bỏ qua/11,5 phút, retries 0.
  Giữ toàn bộ assertion/timeout/retry/skip; test bị loại khỏi payload Vercel, runtime không đổi.
- Native trước chuyển: 140 mẫu/32 kiểm tra cuối đạt. Sau chuyển: 54 mẫu Auth trên ba alias,
  12 kiểm tra interaction, public 4/4 mỗi alias, glyph/tab/B/Inter/KPI/keyboard/privacy đạt;
  runtime/console của lượt rollout sạch. Preferences/viewport được trả về ban đầu.
  Inventory 157 UID khớp, forbidden leaves 0. Giữ 274 effective baseline hashes (273 file
  nguyên bản và ngoại lệ whitespace proposal.css), 17 file C75 đúng hash; sáu bảng C20-test
  cổng 55322 rỗng. C88 rollback đã xác minh; không kích hoạt hoặc cleanup.
- Hậu kiểm tiếp tục ngày 08/10 từng thấy Dashboard `query_canceled` 57014. Tải mới hồi phục;
  khoảng log sau hồi phục không có error/HTTP 500. Nguyên nhân database chưa xác định,
  giữ rủi ro tái diễn trong [continuation-health](docs/release-c91/continuation-health.json).
  Không chỉnh schema/RPC/timeout. Giới hạn thiết bị, AT và remote state giữ rõ trong report.
- C92 `AWAITING_APPROVAL`: chốt thiết kế đích trước sửa G1–G4. C93–C98 `NOT_STARTED`.
  C91 không còn blocker. Không bắt đầu checkpoint tiếp theo khi chưa OWNER duyệt.
  Bằng chứng: [report C91](docs/release-c91/report.md) và các JSON cùng thư mục.

## 2. Thay đổi local cần bảo toàn

- Branch `main`, runtime source `ed72b8615e19f2a3e6667014c86da4ac920ed1ba`;
  closing proof gốc 705b6da FAIL được giữ; harness C87 đã đạt CI tại 839d34b348e7dd435688365435cc0336bfcb4eb0.
  Initialhandoff b98fe64d332ea31ffee2b2e3adebc5ec7756744a giữ trong report.
- Đã commit toàn bộ source/docs/harness C89/C90, handoff và historyarchive; không xóa artifacts.
- C90 runtime chỉ `apps/web/src/app/globals.css` F1/F2 VND/tab. C63 readiness assertion
  settlement-preview trước grabber, không sửa runtime drawer hoặc nghiệp vụ.
- Bản vá đã duyệt chỉ pnpm-workspace.yaml/lock cho sharp0.35.5/source-map-js1.2.2 và libvips.
- C91 source/closingproof đã push; finalstatus chỉ tài liệu. Candidate source/UID giữ nguyên.
- Các file C75 do test sinh đã trả exact baseline. Không broad reset/cleanup cache/backup;
  cache còn trace/log thất bại để truy vết và có synthetic session cần tiếp tục ignore.

## 3. C90 — Bằng chứng local trước phát hành C91

- F1: number/₫ cùng dòng, đủ chữ số, scope wrapper không lan grid xuống VndText. Long amount
  dùng ngang đầy đủ, hero≥18px; supporting long-money dùng hàng đầy ngang. F2: tab một dòng,
  chữ14px, hit target48px. Giữ B/Inter/body16/KPI trước Việc cần xử lý.
- 40 route samples/50presentation stress tại375/390/768/1024/1440 ×Light/Dark:0fail/overflow;
  text90rows khớp trước/sau. Max9223372036854775807 và số âm chỉ presentation DOM với
  VndText/formatter thực, không đưa max/signed vào ledger. Fixture17digit local C20-test.
- 10keyboard/Back/privacy journeys đạt; Evon2probe/14fixed/55Lightsweep rawP0.36warninggroups
  ngoàiP có disposition; giữ focus/native picker, không tự sửa Gu G1–G4 trong C90.
- Lint/typecheck/unit117/build19 PASS. Targeted C63/C67/C72/C75/C84/C87/C90 final3:
  **24/24 PASS7.5m**, retries0/skip0 ở mốc C90. Gate full E2E/pgTAP/Auth/Required CI
  phát hành sau đó đã đạt trong C91 (section1); không lấy targeted thay gate đầy đủ.
- Final2 retained23PASS/1FAIL8.0m: grabber box lấy trước async settlement-preview, sheet
  đổi chiều cao trước mouseDown. Thêm readiness assertion vào C63; giữ prompts4/draft/focus/
  timeout/retries. Final3 sạch; trace/log lỗi ở ignored `.cache/c90/`, không gọi lượt lỗi PASS.
- GuardDocker đúng `QuanLyVayCaNhan-C20-test`, DB55322, sixcounts0 sau teardown.117runtime
  files khác/C89harness/92C89artifacts/17C75hashes bảo toàn;15C75generated restored exact.
- Artifact/native-review/secret/diff PASS: [validation](docs/remediation-c90/validation.json),
  [report](docs/remediation-c90/report.md), [postgate](docs/remediation-c90/postgate.json).
- Bàn giao ngày06/10: chỉ sửa tài liệu; gate liên kết/status/diff/secret và hash source/test/
  evidence được kiểm riêng. Không chạy lại test sản phẩm/DB hoặc thao tác tài nguyên remote.

## 4. C88 — Bản rollback đã xác minh trong C91

- Source `b2abc255f470cd551595cbfa9978b08242e00847`, Required CI37295262054 SUCCESS5jobs;
  closing proof `385b7c1fc998adf7b922a0485a8a0e30c6582198`, CI37311126932 attempt2 SUCCESS.
  CI pgTAP527/Auth6/E2E62PASS16SKIP. Chi tiết [release C88](docs/release-c88/report.md).
- Preview `dpl_DWAs22T33Lt69qo9kdnYbXEs6dov`, immutable URL
  https://quan-ly-vay-ca-nhan-fhyaozonj-ngotuong2105.vercel.app,
  stable alias tại C88 https://tindung-preview.vercel.app (hiện phục vụ C91).
- Production `dpl_3QFNFMS7hvU7pdocnSsUVLrs27wo`, immutable URL
  https://quan-ly-vay-ca-nhan-p352oynyb-ngotuong2105.vercel.app,
  aliases tại C88 https://tindung.vercel.app và https://quan-ly-vay-ca-nhan-ngotuong2105.vercel.app
  (hiện phục vụ C91).
- Candidates/aliases đúngproject/target/Ready,43route Functions sin1; public/Auth/log hậu kiểm
  đạt ở C88. C91 đã inspect và xác minh C88 rollback trước promote; không dùng lịch sử
  Ready làm chứng cứ hiện tại. Không cleanup deployment.
- C88 closing attempt1 từng FAIL tại C87 delayed RSC interception `Route already handled`;
  attempt2 đúngSHA PASS, không sửa assertion/rule. Rủi ro tái diễn chưa khẳng định hết;
  nếu lặp cần evidence/remediation thay vì retry vô hạn.

## 5. Quyết định thiết kế và backlog

- OWNER không hài lòng nền đơn điệu/chữ nhỏ/nút phụ lớn, muốn phân vùng rõ và loading.
  C87 phương án B đã duyệt: canvas xanh xám/sidebar navy/KPI cobalt, Inter, status có nghĩa.
  KPI dư nợ/lãi ròng phải ở trên Việc cần xử lý cả DOM/reading order và màn hình.
- App đã có skeleton shimmer, branded startup, SPA progress và một-click công việc→detail
  auto-open payment. C96 là mở drawer ngay Dashboard, không mô tả luồng cũ cần nhiều click.
- G1: bảng dashboard mobile cần giữ nhận diện dòng; G2: metadata11.2–11.52px; G3: tên200 ký
  tự dài; G4: notification hover và selected chung fill. C89 ghi Gu, không lỗi quyết toán.
  C92 xác nhận thiết kế đích trước khi sửa; không coi đồng ý roadmap là chọn mọi Gu/style.
- Token primitives được phép chứa giá trị màu gốc; component dùng semantic token. Không
  mục tiêu giảm50% CSS bằng mọi giá, không đánh đồng di chuyển file với tăng hiệu năng.
- Quick Amount dùng chuỗi integer/BigInt, không Number để xử lý tiền lớn; không frontend
  quyết toán. Tiêu chí thao tác phải nêu trạng thái ban đầu, giá trị, focus/reset/pending.
- Không ép header≤25% mọi viewport, không hứa nhanhgấp3/60fps mọidevice/zeroCLS toànapp.
  Chọn mẫu thiết kế và budget đo cụ thể; WCAG2.2AA +tiêu chí bổ sung được chọn rõ.
- NOT_TESTED: VoiceOver/TalkBack, mobile vật lý/bàn phím mềm, SafariFirefox authenticated,
  OS-theme change/mạngPWA trướcHTML/remote save. Không yêu cầu OWNER học VoiceOver;
  không suy local hoặc screenshot PASS thành chứng nhận thiết bị/Production.

## 6. Kiến trúc, tài khoản và vận hành

- Monorepo pnpm: Next PWA `apps/web`, Apps Script `apps/google-sync`, domain-contract,
  migrations/testsSupabase. PostgreSQL authoritative; Sheet chỉ nhận đồng bộ một chiều.
- Server Actions/RPC validate mọi mutation; VND integer, rate decimal; dateAsia/Ho_Chi_Minh,
  auditUTC. Financial transactions append/reversal, không xóa vật lý. Push/sync idempotent.
- Supabase dùng chung `hmfxnstrqfqpvsgfmjmd`, Singapore. Preview/Production cùng DB;
  không tạo QAdata trên account vận hành. Một OWNER hoạt động theo hậu kiểm trước.
  Profile có audit/finance constraint không được xóa/tắt trigger để cleanup.
- GitHub private https://github.com/ngotuong/quanlyvay.git, `main` theo `origin/main`.
  OWNER dùng GitHub Free và không nâng gói; compensating control: chỉ phát hành đúngSHA có
  Required CI SUCCESS, không sửa branch protection/account.
- Vercel project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, Functions `sin1`.
  Preview chỉ repository-root `pnpm deploy:preview`, theo [runbook](docs/VERCEL_PREVIEW_RUNBOOK.md).
- Toolchain hiện hữu Node24.15.0/pnpm11.9.0/Next16.3.8/Supabase CLI2.109.0/Playwright1.62.1.
  Không upgrade vì CLI báo phiên bản mới trong gate. Nếu pnpm thiếu dùng wrapper đã có:
  `npm --cache "$PWD/.cache/c87/npm" exec --yes --package=pnpm@11.9.0 -- pnpm <gate>`.
- Fixture/reset/teardown chỉ local C20-test API55321/DB55322, guard `scripts/test-environment.cjs`;
  trước SQL/restore xác minh Dockerlabel+hostport. Không chạm DB local chính54322.
- Apps Script hiện hữu version6/HEAD theo C55/C56, workbook QuanLyVayCaNhanSync.
  IDs/runbook trong [Google Sync](docs/GOOGLE_SYNC.md) và lịch sử; không mở lại sync/push tự động.
- Backup C60 đã nghiệm thu LaunchAgent/Keychain/AES-GCM/retention dry-run. Chưa kiểm backup
  mới ở phiên bàn giao; không mở lại heartbeat/C60, chạy backup hoặc retention-delete từ lịch sử.
- Secret/env/cookie/owner data/backup/dump không Git/log/artifact. Không tài nguyên anh em,
  remote mutation hoặc cleanup ngoài checkpoint được duyệt.

## 7. Tài liệu nguồn và điểm vào phiên mới

- Kỹ thuật: [Design System](docs/DESIGN_SYSTEM.md), [Domain](docs/DOMAIN_SPEC.md),
  [Financial Engine](docs/FINANCIAL_ENGINE.md), [Auth](docs/AUTH.md),
  [Web Workflows](docs/WEB_WORKFLOWS.md), [Dashboard](docs/DASHBOARD.md),
  [Notifications](docs/PWA_NOTIFICATIONS.md), [Google Sync](docs/GOOGLE_SYNC.md),
  [Backup](docs/BACKUP_RESTORE.md), [CI](docs/CI.md), [Preview](docs/VERCEL_PREVIEW_RUNBOOK.md).
- Skill Evon: `/Users/ngotuong/.codex/skills/evondev-ui-ux/SKILL.md`; áp khi công việc UI cần,
  không thay AGENTS/OWNER decision hoặc gỡ focus ring để theo Gu.
- [Handoff](docs/HANDOFF_NEXT_SESSION.md) đã cập nhật C91 hoàn tất và C92 chờ duyệt.
  C91 đã được duyệt mở rộng dependency; không bắt đầu C92–C98 hoặc tạo cuộc trò chuyện tự động.
