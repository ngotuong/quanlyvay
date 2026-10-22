# C107 — Phản hồi loading khi mở app và chuyển mục

Ngày hoàn tất local: 19/10/2026 (Asia/Ho_Chi_Minh).

## Kết quả

- Màn mở app dùng một lớp loading có thương hiệu ngay từ first paint, phủ toàn viewport, theo đúng Light/Dark và không hiển thị dữ liệu tài chính.
- Khi webapp trở lại foreground sau ít nhất 1 giây, lớp “Đang khôi phục phiên làm việc…” xuất hiện đủ lâu để người dùng nhận biết, kể cả với `prefers-reduced-motion`.
- Chuyển Tổng quan/Khoản vay/Đối tác/Thông báo giữ feedback đến khi route mới hết skeleton và đã qua hai frame vẽ; lớp chặn ngăn thao tác vào nội dung cũ trong lúc chờ.
- Back/Forward đã xử lý cả thứ tự trình duyệt phát `popstate` sau khi Next.js khôi phục route. Feedback có giới hạn an toàn 15 giây và không thể treo vô hạn.
- Hủy điều hướng do nháp chưa lưu dừng feedback ngay; registry nháp và marker DOM bảo toàn form trong route cache của Next.js.
- Card “Việc cần xử lý” giữ nguyên vị trí cuộn khi mở rồi thu gọn, tránh hồi quy được full E2E phát hiện trong quá trình kiểm C107.

## Bằng chứng đo local

Fixture dùng database local cô lập, bản production build và độ trễ Auth/RSC nhân tạo 1.100–1.200ms.

| Trạng thái | Kết quả |
| --- | --- |
| First paint 390px Light/Dark | hiện sau 68–81ms; biến mất sau 1.430–1.751ms |
| First paint 1440px Light/Dark | hiện sau 74–75ms; biến mất sau 1.431–1.443ms |
| Warm resume + reduced motion | feedback 834ms |
| Chuyển 4 mục | feedback 1.518–1.885ms dưới độ trễ RSC 1.100ms |
| Responsive | không overflow tại 390px và 1440px |

Số đo máy đọc được nằm tại [browser-evidence.json](browser-evidence.json); thư mục này cũng chứa ảnh Light/Dark cho mobile/desktop, warm resume và route feedback. Evon sweep 375–1920px không phát hiện broken layout, overlap hoặc overflow trong phần C107.

## Gate cuối

- `git diff --check`: đạt.
- `pnpm lint`: đạt.
- `pnpm typecheck`: đạt.
- `pnpm test`: 123 pass, 0 fail.
- `pnpm build`: 19 route, đạt.
- `pnpm test:e2e`: 90 pass, 18 skip theo điều kiện, 0 fail trong 25,9 phút; retries 0.
- Targeted C75 scroll matrix: 1 pass; targeted C84 history/theme: 1 pass.

## Ranh giới

C107 chỉ thay đổi feedback trình bày và lifecycle điều hướng ở source local. Không đổi schema, RPC, financial engine, dữ liệu, tài khoản, secret, Google, backup hoặc deployment. Việc nghiệm thu trên iPhone standalone/desktop và phát hành Preview/Production thuộc C108, chỉ bắt đầu sau khi OWNER phê duyệt checkpoint đó.
