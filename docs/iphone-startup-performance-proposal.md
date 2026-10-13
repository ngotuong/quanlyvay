# Đề xuất xử lý màn trắng và tốc độ trên iPhone

Ngày: 12/10/2026. Trạng thái: OWNER đã phê duyệt rõ C99 ngày12/10/2026 và xác nhận mở standalone
từ Màn hình chính. C99 COMPLETED ngày13/10/2026 trong context/roadmap; C100 AWAITING_APPROVAL. Kết quả và giới hạn ở [report](iphone-c99/report.md).
Checkpoint đã duyệt: **C99 — Khởi động và điều hướng trên iPhone**.

## Vấn đề OWNER báo

Mở webapp trên iPhone vẫn thấy màn trắng, không thấy loading; mở ứng dụng và chuyển tab chậm.
OWNER xác nhận mở từ Màn hình chính trên iPhone16ProMax/iOS26; tất cả tab chậm5–7s. Đây là báo cáo của OWNER, chưa có năm lượt đo trên thiết bị.
Không coi kết quả C97/C98 trên Chromium/mobile viewport là kiểm thử iPhone thật.

## Kiểm tra ban đầu chỉ đọc

- `app/layout.tsx`: loading thương hiệu là Suspense fallback trong HTML trả từ máy chủ.
  Nó không thể hiển thị trước khi trình duyệt nhận và vẽ HTML/CSS. Auth middleware chạy trước
  bước render; root còn đọc cookies/theme/viewport trước hoặc ngoài fallback.
- Metadata có apple-touch-icon và standalone; chưa khai báo ảnh khởi động iOS.
- `public/sw.js`: chỉ xử lý push/badge/click; không có fetch handler hoặc precache màn khởi động.
  Biến tên CACHE_VERSION không đồng nghĩa đã có cache giao diện.
- `app-nav.tsx`: các mục chính/desktop dùng `prefetch={false}`. Mỗi lần điều hướng chưa có
  dữ liệu route trong bộ nhớ có thể phải chờ yêu cầu mới. Tab chi tiết khoản vay dùng Link khác;
  không quy tất cả các tab về cùng nguyên nhân.
- Auth/profile và dữ liệu nghiệp vụ vẫn đọc từ server; `getLoanWorkspace` có nhiều đọc song song
  theo tab; dashboard bundle gom nhiều phép đọc/tính trong một RPC. Chưa có trace chứng minh
  bước nào đang chậm trên iPhone. Không kết luận SQL, mạng, iOS hay prefetch là nguyên nhân duy nhất.
- C91 từng quan sát database `query_canceled` 57014; đây là rủi ro lịch sử, không là bằng chứng
  lỗi đang xảy ra hoặc quyền tự chỉnh timeout/schema/RPC.

Probe Production `https://tindung.vercel.app`, không cookie/đăng nhập, một mẫu mỗi route và UA:

| Route | Headers/first body iPhone UA | Headers/first body desktop UA |
| --- | --- | --- |
| /dashboard | 451 ms | 469 ms |
| /login | 380 ms | 1059 ms |
| /sw.js | 172 ms | 169 ms |
| /manifest.webmanifest | 498 ms | 413 ms |

HTML /dashboard và /login có marker loading; chunk đầu 3552 bytes chưa chứa marker.
Kết quả này xác nhận response có loading, không chứng minh loading đã được vẽ.
Probe từ máy Mac với UA iPhone không phải Safari/iPhone thật, không có dữ liệu dashboard đã
đăng nhập, không đo FCP, hydration, tốc độ chuyển tab hoặc thời gian mở PWA.
Next.js cũng mô tả khả năng trình duyệt đệm response streaming tại
[loading conventions](https://nextjs.org/docs/app/api-reference/file-conventions/loading).
Chưa chứng minh hiện tượng đó xảy ra trong trường hợp OWNER báo.

## Phạm vi đề nghị duyệt

1. Đo trước/sau cùng route, tài khoản, thiết bị, mạng: cold/warm launch, điều hướng chính,
   tab chi tiết, Back/Forward. Tách thời gian trước HTML, first paint, hydration, phản hồi thao tác,
   Auth và đọc dữ liệu. Ít nhất 5 lượt cho mỗi hành trình trọng tâm; ghi raw/median/p95 với giới hạn mẫu.
   Chỉ lưu timing/status/byte/count, không lưu cookie, token, dữ liệu tiền hoặc danh tính thật.
2. Sửa khởi động theo vị trí chờ đã đo: giữ loading thương hiệu hiện tại, đưa phần hiển thị
   độc lập ra trước các bước đọc có thể tách; bổ sung ảnh khởi động iOS tĩnh nếu mở standalone
   và thiết bị hỗ trợ. Phần trước HTML là ảnh tĩnh do iOS hiển thị, không hứa animation ở giai đoạn đó.
3. Tối ưu điều hướng theo trace: shell/skeleton phản hồi ngay, tải trước có giới hạn nếu bảo đảm
   freshness; loại đọc trùng trong cùng request và song song hóa phần độc lập khi có bằng chứng.
   Không dùng số dư lưu cũ để thay authoritative reads sau mutation.
4. Kiểm offline/lỗi/chờ lâu/abort, reduced-motion, theme, privacy, dirty draft, focus và phân quyền.
   Không cache HTML có dữ liệu tài chính hoặc response Auth trong service worker; không xóa
   storage, đăng xuất hoặc bắt cài lại PWA như một bước sửa lỗi mặc định.
5. Chạy lint/typecheck/unit/build/E2E và các kiểm tra streaming/điều hướng phù hợp; giữ assertion,
   timeout/retry/skip hiện hữu. Required CI đúng SHA, Preview root `pnpm deploy:preview`,
   authenticated smoke, Production candidate/promote/alias hậu kiểm và rollback theo C98/runbook.
   Kiểm iPhone thật cần OWNER hỗ trợ; nếu thiếu thì ghi NOT_TESTED, không tuyên bố đã sửa iPhone.

## Acceptance criteria và ranh giới

- Loading sau khi nhận HTML không bị giữ bởi việc tải dữ liệu nghiệp vụ; controlled delay Auth/
  data 2 giây và 10 giây có trạng thái tải/lỗi/hủy hợp lệ. Không kẹt overlay khi ready hoặc abort.
- Với app đã hydrate, thao tác điều hướng có feedback trong 100 ms ở các lượt đo kiểm soát;
  ghi riêng kết quả thiết bị thật và mô phỏng. Chuyển tab/cold launch phải có bảng thời gian trước/
  sau; không gọi chỉ thêm animation là cải thiện tốc độ. Nếu latency chưa giảm, báo rõ bottleneck.
- Mở lại standalone trên iPhone được hỗ trợ có ảnh khởi động/feedback liên tục trong phạm vi
  hệ điều hành cho phép; lần cài/mở đầu, phiên hết hạn và offline có kết quả riêng.
- Không mất nháp, lộ tiền/privacy hoặc dùng số dư stale sau ghi giao dịch; mọi gate bắt buộc đạt
  trước phát hành. Khi rollout không tạo/sửa giao dịch thật để kiểm thử.
- Không đổi nghiệp vụ tính lãi/quyết toán, schema/RPC, database timeout/index, tài khoản, secrets,
  dependencies, Google Sync hoặc backup. Nếu trace cần sửa database/kiến trúc ngoài phạm vi,
  chuẩn bị đề xuất riêng có bằng chứng để OWNER duyệt.

OWNER đã phê duyệt C99 theo tài liệu này, gồm triển khai local, kiểm thử và phát hành Preview/
Production trong phạm vi trên. Tiến độ hiện hành nằm trong PROJECT_CONTEXT.md và handoff.
