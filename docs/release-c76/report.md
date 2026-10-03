# C76 — Đồng bộ và rollout C74–C75

Trạng thái: COMPLETED ngày 2026-10-03. OWNER phê duyệt ngày 2026-10-02, bổ sung yêu cầu
đặt các card dư nợ/lãi ròng trên “Việc cần xử lý” cả mobile và desktop.

## Kết quả và source phát hành

Source `d3fc37003ddcc551f4d9c285f1a49deb95179698` đã push fast-forward lên main;
Required CI run `37032143402` SUCCESS cả5 job trước khi tạo candidate.

- Bỏ CSS mobile đảo thứ tự nhóm KPI/task, giữ DOM và thứ tự đọc phù hợp thứ tự hiển thị.
- C75 task list hiển thị đầy đủ định danh, hướng thu/trả, kỳ chốt/ngày nhắc; mặc định5 việc,
  mở toàn bộ/thu gọn. Biểu đồ desktop không kéo cao theo danh sách dài.
- Notification list nằm trước cấu hình thiết bị; disclosure gọn và unread empty CTA đúng filter.
- `.vercelignore` loại backup/cache/test output/log/env/key khỏi payload; bounded read retry
  chỉ8 RPC STABLE, tối đa2 lần100ms khi502/503/504 không SQL code/abort. Không retry mutation/Auth.
- Không thay schema, cách tính tiền/lãi authoritative, remote financial data, secrets hoặc Google.

## Gate

| Gate | Kết quả |
|---|---|
| Diff-check, CI policy/actionlint, dependency audit, pinned Gitleaks | PASS |
| Lint/typecheck | PASS |
| Unit/script | 90 PASS |
| Build | PASS, 19 routes |
| Root Preview resume full E2E | 48 PASS, 5 opt-in SKIP, 6,5 phút, exit0 |
| Disposable DB55322 sau root gate | profiles/loans/transactions: 0/0/0 |
| CI source37032143402 | SUCCESS5jobs; pgTAP527/Auth6/E2E47PASS6SKIP |

Local root gate không bỏ kiểm focus/navigation/chart/privacy/loading. Sáu ảnh dashboard được
recapture từ fixture synthetic25 tasks tại375/390/1440 light/dark và đã xem; không có ảnh,
tên/UUID/số tiền thật từ remote trong Git. Ảnh full-page mobile chụp tại trạng thái focus/scroll
của test, có sticky header/nav giữa ảnh; native browser smoke bổ trợ vị trí thực trên viewport.
CI bỏ một bài real-RPC timeout chỉ local và5 audit opt-in; không nhầm số CI với local.

Commit chốt tài liệu/ảnh phải được kiểm Required CI đúng SHA sau push trước completion message.
Kết quả exact final commit được đối chiếu trên GitHub checks, không dùng source CI thay thế.
Không ghi SHA của một commit vào chính nội dung commit đó.

## Deployment và alias

Project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, org `ngotuong2105`, root `apps/web`.

| Môi trường | Deployment/immutable URL | Alias | Target/region |
|---|---|---|---|
| Preview | `dpl_BBavYTasgvQ51wyTQbWunqysM6Fq` / https://quan-ly-vay-ca-nhan-cadt65ibt-ngotuong2105.vercel.app | https://tindung-preview.vercel.app | preview, Ready, 43 Functions sin1 |
| Production | `dpl_AurpzZ3pUxe7Xp7dWnxuWa2fjXxw` / https://quan-ly-vay-ca-nhan-f1v8nx2ba-ngotuong2105.vercel.app | https://tindung.vercel.app | production, Ready, 43 Functions sin1 |

Payload201 regular files/4.527.113bytes/0 forbidden; remote inventory mỗi candidate245 regular
leaves/0 forbidden. Hai entry thư mục rỗng `src/.backups`, `src/apps/web/test-results` không
chứa file và không được tính là nội dung upload. Chỉ đọc metadata/tree, không tải secret/dump.

Preview promote qua repository-root:

```text
pnpm deploy:preview -- --candidate https://quan-ly-vay-ca-nhan-cadt65ibt-ngotuong2105.vercel.app --verified-authenticated-smoke
```

Chỉ truyền verified flag sau Auth smoke candidate và runtime log đạt. Pipeline chạy lại full
gate, chuyển alias và hậu kiểm public/inspect thành công. Production dùng `vercel promote`
existing candidate sau full gate/Auth/provenance; inspect domain chính trỏ đúng ID mới.
CLI lúc tạo Production candidate với skip-domain đã tự gán default project hostname, nhưng
`tindung.vercel.app` được giữ ở C73 cho đến promote này; không tuyên bố mọi alias đều bất biến.

Rollback target trước promote: Preview `dpl_6NT5NEUN86VPVZXhvZTqwNFyqgFb` /
https://quan-ly-vay-ca-nhan-c6pft4h1k-ngotuong2105.vercel.app;
Production `dpl_Bqox7V6oqX63ufyhgY1sYTFmENhx` /
https://quan-ly-vay-ca-nhan-7g0uxlwrm-ngotuong2105.vercel.app.
Đã kiểm Ready/cùng project/target phù hợp; không cần rollback, không xóa deployment cũ.

## Authenticated smoke và hậu kiểm

OWNER tự đăng nhập hai candidate; native Chrome profile hiện hữu kiểm qua CUA. Không lấy
cookie/token, không lưu screenshot hoặc accessibility snapshot tài chính thật vào repository.

| Phạm vi | Candidate Preview/Production | Alias hậu kiểm |
|---|---|---|
| Dashboard375/390/1440 light/dark, KPI trước task | PASS | Preview375 dark; Production375/390 dark và1440 light PASS |
| Task mở17/thu5, tên đầy đủ wrap, thu/trả/context | PASS | Task toggle Production PASS |
| KPI/task metadata privacy mask và khôi phục | PASS | Production PASS; không kết luận toàn app privacy đạt |
| Chart empty/kỳ trước có dữ liệu, desktop không stretch | PASS | Dashboard empty Production PASS |
| Notification list trước disclosure, mở/đóng | PASS | Preview route và Production unread route PASS |
| Unread empty hiện hữu, CTA đúng nghĩa | PASS | Production PASS |
| Loans/list/detail/history/back/loading | PASS | Production list/detail/history/loading PASS |
| Counterparties/expenses, drawer nút đóng/focus return | PASS dưới privacy guard | Không lặp toàn bộ drawer sau alias |
| Public login/manifest/export/runner | 8/8 PASS | 8/8 PASS |
| Runtime error/HTTP500 sau traffic | 0/0 mỗi candidate | 0/0 mỗi alias, cửa sổ30m |

Đã thấy fallback “Đang mở nội dung…” khi đổi kỳ/tab/route. Deterministic2s/10s loading,
financial commit→drawer close/reset, offline/error/draft/duplicate-submit chỉ regression local;
không save remote hoặc tạo fixture để ép trạng thái. Native Escape qua DevTools device emulation
không được gửi đáng tin cậy tới trang; không ghi PASS keyboard từ thao tác này. Nút đóng và focus
return được xác minh, keyboard coverage dựa trên E2E hiện hữu.

Console có hai nguồn đã giải thích: Preview CSP chặn
`https://vercel.live/_next-live/feedback/feedback.js`; TypeError M_ID truy nguồn trực tiếp qua
DevTools link tới `chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js`.
Không app exception chưa giải thích; không sửa CSP, disable extension hoặc bypass browser security.

Sau QA đã khôi phục privacy của stable Production về trạng thái lúc bắt đầu (hiển thị),
media scheme theo thiết bị và đóng DevTools trên tab QA. Không thay auto-lock/system settings.

## Rủi ro còn mở và giới hạn

- P2 privacy chart scale: `apps/web/src/app/dashboard/page.tsx:171` dùng static span
  `privacy-amount` cho trục số, CSS chỉ transition opacity. Khi privacy bật, KPI/task/chart bars
  bị mask nhưng thang trục vẫn hiện. Native đã tái hiện; không ghi giá trị thật vào evidence.
  Hướng sửa đề xuất: masking component cho scale và rà soát biểu đồ chi tiết/tooltip/accessible
  labels với fixture synthetic. Không âm thầm mở rộng C75 thành privacy audit toàn app.
- Intermittent C67 Tab-wrap chưa xác định root cause. Targeted8+20 lần PASS và các full suite
  PASS không đóng issue; giữ assertion, failure-only diagnostic metadata, không nới timeout.
- Source package rollback C73 có77 backup files (63 ciphertext/11 manifest/3 log) và60 test
  artifacts, không thuộc out inventory. Ba HEAD probe404 không chứng minh mọi URL không lộ;
  chưa có kết luận plaintext/public exposure. Không tải/xóa nội dung, cần audit/cleanup riêng.
- C73 Chrome badge trên immutable hosts vẫn OPEN, không có interstitial trong lượt smoke này;
  không kết luận nguyên nhân là mật khẩu số. Stable aliases không hiện badge ở lượt hậu kiểm.
- Safari/Firefox/mobile vật lý/VoiceOver/TalkBack chưa kiểm mới; không chứng nhận accessibility.
  Push permission/giờ nhận/mark-read/save remote không thực hiện.

## Dấu vết gate trước bản cuối

Các source32fb641/1374946 và candidate9001479 đã superseded, không promote. Những lần đầu root
gate fail gateway502/focus dẫn tới diagnostic/retry whitelist STABLE và kiểm chart geometry;
không retry tài chính, không bỏ assertion. Source d3fc370 có CI riêng đạt trước tạo candidate mới.
Chi tiết từng run/failure/source/inventory vẫn trong `evidence.json` và Git history.

C77 `AWAITING_APPROVAL`: audit chỉ đọc privacy biểu đồ, focus và artifact triển khai cũ, có
severity/file/nguyên nhân/tác động/remediation scope rõ. Scope/acceptance tại mục35 roadmap.
Dừng sau C76; chưa thực hiện C77.
