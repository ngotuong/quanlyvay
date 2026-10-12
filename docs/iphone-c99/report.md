# C99 — Khởi động và điều hướng iPhone

Trạng thái: IN_PROGRESS. OWNER phê duyệt C99 ngày 12/10/2026 và xác nhận mở từ biểu tượng Màn hình chính. Chưa phát hành C99 hoặc xác nhận trên iPhone thật.

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

Lint/typecheck/unit121/build/policy/audit/scoped-secret đạt. Targeted C87/C97/C99:9PASS1SKIP0FAIL7.2m,retries0. Bao gồm Auth2s/10s/font delay/theme/reduced-motion, route skeleton, drawer data2s/10s/error/retry/abort/pending/draft/focus, metadata48/head48/body0 và offline503/retry/cache-only-public. Full E2E86PASS18SKIP0FAIL20.8m/retries0, Auth6PASS0FAIL, pgTAP527/24files đạt. Conditional prepared-CI fixture branch: targeted2PASS0FAIL1.3m. Source Required CI và rollout đang chờ. Không giảm assertion/testtimeout/retry/skip hoặc45mjob budget.

Evon probe:6 widths và55-width sweep mỗi theme, không geometry/console failure trên app-server. Giữ focus-visible để hỗ trợ bàn phím; rule style báo focus ring có disposition, không xóa focus. Sáu screenshot chỉ màn offline public; không lưu ảnh/danh tính/số tiền thật. [Probe reconciliation](probe-reconciliation.json), [assets](startup-assets.json), [preservation](preservation.json), [validation](validation.json), [raw failures/history](verification-history.md).

iPhone thật/standalone lần đầu và mở lại/expired-session/offline native/OS-cache/AT chưa kiểm. C99 không hoàn tất trước khi nghiệm thu và các gate bắt buộc đạt. Không dùng kết quả mobile viewport làm chứng nhận Safari. C91 DB57014 là rủi ro lịch sử, chưa có trace chứng minh đang xảy ra; không tự tuning DB ngoài phạm vi.
