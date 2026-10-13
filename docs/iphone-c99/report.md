# C99 — Khởi động và điều hướng iPhone

Trạng thái: COMPLETED ngày13/10/2026. OWNER đã phê duyệt C99. Preview/Production và cả ba alias đã cập nhật nguồn `6d6f1e182a9c99bffaa3c316818a1c3e4a8c84d7`; Required CI [38337230362](https://github.com/ngotuong/quanlyvay/actions/runs/38337230362) SUCCESS cả5jobs. Root Preview create/resume đều87PASS18SKIP0FAIL20.7m; promote Production exit0. Auth candidate7routes+4detailtabs, hậu kiểm baalias3mainroutes/public4/4/console0/runtimeerror0/HTTP5000 đạt. [Release proof](release-proof.json), [candidate proof](candidate-proof.json). Commit chốt tài liệu cần Required CI đúngSHA cả5job đạt trước báo hoàn tất; SHA/run ghi trong hội thoại tránh tự tham chiếu.

OWNER trên iPhone16ProMax/iOS26, biểu tượng tindung.vercel.app: logo/loading1–2s, Tổng quan4–5s, chuyển mục2–3s so với reported baseline5–7s. Đây là ước lượng của OWNER, không phải năm mẫu stopwatch hoặc chứng nhận native toàn diện. [Sau rollout](owner-iphone-after.json), [baseline](owner-iphone-baseline.json). Tổng quan còn chậm; phạm vi tối ưuRPC được chuẩn bị tại [C100 chờ duyệt](../dashboard-rpc-performance-proposal.md), chưa triển khai.

## Thay đổi và lý do

Loading trong HTML không thể vẽ trước khi trình duyệt nhận response. Thêm 48 ảnh khởi động tĩnh theo 12 kích thước màn hình, hai hướng và hai theme, dùng logo B hiện có. Metadata server và head sau thay đổi preference chọn ảnh tương ứng. PNG không chứa tên, tiền hoặc tài khoản. iOS quyết định thời điểm hiển thị/cập nhật ảnh; kiểm Chromium chỉ xác nhận metadata, không chứng minh launch native. Cơ chế ảnh tĩnh theo [Apple Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

Giữ verified Auth, active-profile/password gates và no-store. Root khởi chạy profile/cookie/unread count song song; count vẫn RLS và không render trước profile hợp lệ. React cache chia sẻ Supabase client trong cùng request, không lưu client giữa người dùng. Không đổi schema/RPC/engine hoặc timeout DB.

Bốn mục chính dùng Link auto partial prefetch. Next16.3.8 đã cài chọn FetchStrategy.PPR và để phần trong loading boundary chưa render; không dùng full prefetch hoặc cache số dư trong SW. Secondary desktop giữ cấu hình hiện có. Freshness sau mutation cần full E2E và authenticated smoke. Hành vi dynamic partial prefetch theo [Next guide](https://nextjs.org/docs/app/guides/prefetching), đồng thời đã đối chiếu source16.3.8 cài local; không suy trực tiếp từ docs bản mới hơn.

SW luôn lấy document từ mạng. Khi network thất bại, trả màn public offline503/no-store với nút Thử lại; cache duy nhất `/offline.html`. Không cache HTML Auth/tài chính, RSC, API hoặc writes. Không xóa storage/đăng xuất/reload tự động/ghi lại giao dịch. Màn offline tĩnh theo theme thiết bị, dùng system font nếu Inter không có sẵn offline.

## Đo trước/sau

Baseline nguồn8a54ff8b04a657aa11ebb934f0e2ada3e01ec9e1. Năm lượt mỗi hành trình trên production build local, Chromium390×844, dữ liệu giả C20-test API55321/DB55322, cùng flow/auth/network. `elapsedMs` v1 gồm Playwright driver/polling, vì vậy không suy latency thật từ mức giảm đó. N=5 nhỏ; p95 nearest-rank là mẫu lớn nhất, không là bảo đảm population. Không đo được hydration riêng, server Auth/SQL riêng hoặc native startup từ iPhone.

| Hành trình | Median trước→sau, ms | p95 mẫu trước→sau, ms |
|---|---:|---:|
| Cold authenticated document | 438→417 | 448→449 |
| Warm document | 398→399 | 430→414 |
| Khoản vay | 853→392 | 873→869 |
| Đối tác | 872→381 | 882→880 |
| Tổng quan | 390→396 | 877→880 |
| Tab lịch sử | 149→151 | 150→165 |

Feedback main-nav tất cả mẫu dưới100ms: trước max47.4ms, sau max47.3ms. Cold FCP median56→56ms; chưa chứng minh cold launch nhanh hơn. HTML decoded median104149→130702bytes (+26553) do startup descriptors được serialize; đây không là compressed transfer size. Không tải đồng thời48PNG: browser/iOS chọn media phù hợp. Tổng48assets1003638bytes, từng PNG signature/dimension đã kiểm.

[Raw trước](before-benchmark.json), [raw sau](after-benchmark.json), [median/p95](timing-summary-v1.json). Supplemental browser-clock measurement đã đạt40mẫu mỗi phase. Marker dùng phần nội dung thực sự hiển thị ở mobile; click/popstate→loading hết→hai rAF, không phải đo pixel paint/hydration. Kết quả chính:

| Hành trình | Median browser-clock trước→sau, ms |
|---|---:|
| Cold document ready | 377.3→394.4 |
| Warm document ready | 361.4→361.6 |
| Khoản vay | 363.7→362.5 |
| Đối tác | 365.1→364.3 |
| Tổng quan | 361.3→363.0 |
| Tab lịch sử | 97.1→97.2 |
| Back | 35.7→36.4 |
| Forward | 42.9→41.6 |

Các mục chính chưa cải thiện đáng kể. Mức giảm walltime ở v1 chủ yếu do polling, không dùng để tuyên bố speedup. Cold sample median tăng17ms với n5 nhỏ; chưa xác định tác động thực tế trên iPhone. [Raw trước v2](before-benchmark-v2.json), [raw sau v2](after-benchmark-v2.json), [summary và p95 v2](timing-summary-v2.json). Production baseline CUA chỉ ghi walltime với transport/polling, không Performance API; không trộn với local hoặc gọi là iPhone: [raw sanitized](production-before-ui.json).

## Kiểm thử và giới hạn

Lint/typecheck/unit121/build/policy/audit/scoped-secret đạt. Targeted C87/C97/C99:9PASS1SKIP0FAIL7.2m,retries0. Bao gồm Auth2s/10s/font delay/theme/reduced-motion, route skeleton, drawer data2s/10s/error/retry/abort/pending/draft/focus, metadata48/head48/body0 và offline503/retry/cache-only-public. Full E2E86PASS18SKIP0FAIL20.8m/retries0, Auth6PASS0FAIL, pgTAP527/24files đạt. Conditional prepared-CI fixture branch: targeted2PASS0FAIL1.3m. Source Required CI và rollout đã đạt. Không giảm assertion/testtimeout/retry/skip hoặc45mjob budget.

Evon probe:6 widths và55-width sweep mỗi theme, không geometry/console failure trên app-server. Giữ focus-visible để hỗ trợ bàn phím; rule style báo focus ring có disposition, không xóa focus. Sáu screenshot chỉ màn offline public; không lưu ảnh/danh tính/số tiền thật. [Probe reconciliation](probe-reconciliation.json), [assets](startup-assets.json), [preservation](preservation.json), [validation](validation.json), [raw failures/history](verification-history.md).

OWNER đã kiểm mở lại standalone và chuyển mục trên iPhone thật (ước lượng). First install/expired-session/offline native/OS-cache/rotation/AT vẫn NOT_TESTED; chưa chứng minh PNG media selection hoặc feedback liên tục từng pixel. Không dùng kết quả mobile viewport làm chứng nhận Safari. C91 DB57014 là rủi ro lịch sử, chưa có trace chứng minh đang xảy ra; không tự tuning DB ngoài phạm vi.

## Chẩn đoán trên candidate và bản đã phát hành

NavigationTiming chỉ giữ tối đa10 bản ghi trong memory/hidden DOM: loại trang cố định, document/RSC/content duration, TTFB/body time và bytes. Không URL/query/loanID/name/body/token/cookie, không storage hoặc network mới. Content là loading hết và hai rAF, không là chứng nhận pixel paint/healthy data; cần đối chiếu smoke và runtime errors. RSC rows có thể bao gồm prefetch, không tự suy mỗi row là thời gian chạm tab.

ReadTiming quan sát đúng một lời gọi hiện có, trả nguyên result/error và giữ retry của caller. Server log chỉ operation cố định/duration/outcome trong Vercel logging hiện có, không serialize result hoặc error message. Auth vẫngetUser→activeprofile/password/role gates; SQL/RPC/validation/action nguyên. Unit bảo vệ privacy/error passthrough; sampler delayed-read E2E3PASS1.8m; lint/typecheck/unit123/build19 đạt. Fullupdated E2E87PASS18SKIP0FAIL20.5m; sau đó timing ref đãclear khi ready để không tái dùng click cũ cho refresh, targeted3PASS1.9m. SourceCIcorrected SUCCESS5jobs; candidate/Auth/alias/promote/hậu kiểm đã đạt.

[Paired controlled before](controlled-before.json), [after](controlled-after.json), [summary](controlled-summary.json):5lượt2s/5lượt10s mỗi phase; loading khoảng31ms, fresh read tất cả, dataready khoảng2.35s/10.39s, không speedup. [Local read trace](server-read-diagnostic.json) chỉ headers duration trong fixture, không SQL/remote. [Prefetch](prefetch-diagnostic.json)16readable/75body unavailable, không suy unknown bodies.

## Kết quả đọc dữ liệu thực tế và giới hạn

[Remote summary](remote-timing-summary.json):45 driver samples,5cycles×3routes×3phases; before C98 và after C99 Preview cùng440×956. Median Tổng quan5721→5803ms, Loans810→1008ms, Counterparties598→491ms. Số này gồm transport/polling, không chứng minh tăng tốc nguyên nhân. Bounded DOM10rows có prefetch/eviction/row cũ; không ghép mọi snapshot thành thời gian chính xác của lần chạm.

Read thành công: dashboard.bundle median5329.05ms Production/5390.3ms Preview (8mẫu mỗi môi trường), Auth48.4/65ms, profile46.65/74.8ms; Loans496.6/526.45ms, CP48.75/50.5ms. [Production](production-read-timings.json), [Preview](preview-read-timings.json). RPC read gồm network/server/retries hiện có, không SQL-only hoặc trace ghép từng request. Chưa EXPLAIN chứng minh vòng lặp/index là nguyên nhân. Runtime/log hậu kiểm không có error hoặcHTTP500 trong khoảng kiểm.

Nguồn ban đầu44b769a/CI38263260459 FAIL hai controlled transport C63/C87 do warmed partial prefetch. Harness chặn prefetch trước login và interception, targeted2PASS2.6m; giữ assertions/timeouts/retries0/skips/job45m. FinalsourceCI E2E86PASS19SKIP0FAIL29.2m/105scheduled, Auth6/0, pgTAP527/24files, unit123; chi tiết [source CI](source-ci-corrected.json) và [tests](source-ci-corrected-tests.json). Không gọi lượt FAIL là PASS.

[Preservation](preservation.json):218runtime freeze/73financial protected/17C75exact, sáu bảng disposable C20-test55322 rỗng; main54322 không chạm. Không schema/RPC/index/timeout/dependency/account/secrets/Google/backup/remote ledger thay đổi. C100 AWAITING_APPROVAL; dừng sau C99, không profileSQL/migrate/tuning theo lịch sử.
