# Bàn giao — C99 đang thực hiện

C99 `IN_PROGRESS` ngày 12/10/2026. OWNER xác nhận mở bằng biểu tượng Màn hình chính trên iPhone và phê duyệt rõ C99 trong hội thoại. Không xin lại duyệt checkpoint này. Canonical repository: `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`; đọc AGENTS, PROJECT_CONTEXT, roadmap C99 và git status trước khi tiếp tục.

Phạm vi/acceptance: [đề xuất C99 đã duyệt](iphone-startup-performance-proposal.md). Sửa startup/điều hướng, đo trước/sau, local gates, Required CI đúng SHA, Preview root `pnpm deploy:preview`, Production candidate/promote/alias/rollback. Không schema/RPC/engine/DB timeout/index/dependency/account/secrets/Google/backup hoặc giao dịch thật. C98 đã hoàn tất; không tiếp tục lịch sử như công việc mới.

Baseline HEAD `8a54ff8b04a657aa11ebb934f0e2ada3e01ec9e1`. Runtime remote vẫn C98; chưa commit/push/deploy C99. Preview rollback `dpl_3BXyNm6T6Kp24CmNqz25YtPgVyD1`; Production rollback `dpl_5aqr2F3aWQJhTZizH1zMyXgEL7hF`. Kiểm lại identity/Ready/sin1/Auth trước rollout; không kích hoạt rollback khi chưa cần.

Đã triển khai local:
- 48 ảnh iOS tĩnh, 12 kích thước CSS × hai hướng × Sáng/Tối; dùng logo B hiện có. Metadata/theme head đồng bộ lựa chọn manual/system. Đây là ảnh do iOS dùng trước HTML; không hứa animation trước HTML hoặc thiết bị chưa kiểm.
- Auth/profile, cookies và unread count khởi chạy song song, vẫn chờ profile verified trước khi hiển thị. Supabase client dùng React cache trong một request; no-store và phân quyền giữ nguyên.
- Auto partial prefetch chỉ cho bốn mục chính; secondary desktop giữ false. Cần xác nhận freshness bằng E2E và browser smoke.
- SW luôn lấy document từ mạng; khi network fail trả static offline 503/no-store. Cache duy nhất `/offline.html`, không chứa Auth/HTML tài chính/RSC/API/mutation. Push/badge giữ nguyên.

Đã đạt lint/typecheck/unit121/build, ci:validate/upload guard. Typecheck/build đầu thất bại do startup media nullable; đã sửa, raw giữ. Targeted C87/C97/C99:9PASS/1SKIP/0FAIL7.2m,retries0. Full E2E86PASS18SKIP0FAIL20.8m; Auth6/0 vàpgTAP527/24files đạt. Các gate không được tuyên bố đạt sớm hoặc giảm timeout/assertion/skip/retry để qua.

Timing local 5 lượt trước/sau tại [iphone-c99](iphone-c99/): Chromium390×844, production build, synthetic C20-test API55321/DB55322; bao gồm polling nên không chứng minh iPhone/native hoặc causal speedup. Median Khoản vay853→392ms, Đối tác872→381ms; Tổng quan390→396ms, chi tiết149→151ms và cold FCP56→56ms. Cần đo bổ sung Back/Forward và kiểm thiết bị thật. Production baseline CUA năm lượt chỉ có walltime/transport, không có Performance API; không trộn với local.

Bảo toàn: `.cache/c99/start-hashes.json`1378 tracked và start-sha. Snapshot được lấy sau chỉnh context/roadmap C99, nên đối chiếu hai file đó với Git baseline riêng. Helper `.cache/c99/preserve.py` chỉ restore17 file generatedC75 đã xác minh GitSHA/hash, backup cache trước ghi; không broad reset. Sau targeted:73 financial protected unchanged, C75exact, six tables disposable0. MainDB54322 không dùng. Full E2E đãsinh15C75 vàhelperđãtrảexact17 sau teardown. Supplemental baseline v2 corrected PASS1/1.5m,40samples gồm cold/warm/main-nav/detail/Back/Forward. Lượt đầu thất bại vì marker desktop title bị ẩn ở mobile; raw log giữ. Exact5C99runtimefiles đã phục hồi theo backup/hash; afterv2PASS1/1.5m. Browser-clock main-nav363ms gầnnhưkhông đổi; v1pollingkhông dùng speedup. Prepared-CI C99targeted2PASS0FAIL1.3m với conditionalreset đúngguard, giữassertions/timeouts/retries/skips. Không còn source swap đang chạy.


CUA: Chrome user Production tab1743279404/browser1 ở Dashboard, money shown ban đầu; IAB authenticated Preview Notifications. Không lưu screenshot/DOM tài chính thật vào Git. Không đổi preferences/ledger. Khi tiếp tục computer use, `cua.rewriteDocumentation()` theo công cụ. Tool evaluate CUA chỉ đọc DOM, không có Performance API. Không dùng shell để lấy cookie hoặc điều khiển browser.

OWNER chưa cung cấp mẫu iPhone/iOS và loại tab chậm (câu hỏi async đã gửi). Kiểm actual standalone cần OWNER; thiếu phải ghi NOT_TESTED, C99 chưa hoàn tất. Không yêu cầu cài lại/xóa storage/đăng xuất mặc định. Không checkpoint tiếp theo được định nghĩa/duyệt.
