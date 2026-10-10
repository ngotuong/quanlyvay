# C97 — Loading theo màn và motion

**C97 hoàn tất local ngày 10/10/2026**, theo phê duyệt của OWNER và mẫu A đã chọn ở C92.
**C98 chờ phê duyệt.** Source trước: `1b54be12d23c9b0ce6ace23dcb8b39ad71721026`.

Đã bổ sung skeleton riêng cho 9 màn: Dashboard, danh sách/chi tiết/tạo khoản vay, Đối tác,
Chi phí, Thông báo, Nhật ký và Cài đặt. Fallback gốc trung tính; mỗi màn dành vùng cho cấu trúc
thực tế. Skeleton có status/aria-busy, không chứa tiền, danh tính hay điều khiển giả. Ba dòng
placeholder không biểu thị số bản ghi. Các selector loading được tách khỏi nội dung đã tải để
tránh trùng trong DOM streaming. File chính: `route-loading.tsx`, các `loading.tsx` và
`styles/loading-motion.css`.

Drawer Dashboard dành sẵn vùng đọc số dư và giữ focus nút Hủy khi chuyển sang form. Motion
mở 220ms, đóng 150ms, snapback 320ms; kéo được damping, giữ ngưỡng dismiss 88px và giới hạn dịch
chuyển 180px. Pointercancel/mất capture chỉ trả về vị trí cũ. Native dialog, Escape/nút đóng,
dirty/pending/draft/history và focus vẫn giữ. Details giữ semantics bàn phím; press feedback
chỉ đổi paint ở Quick Amount và các hành động trong dialog. Reduced-motion tắt shimmer và chuyển động trang trí, vẫn
còn phản hồi tĩnh. Các thay đổi nằm ở `bottom-sheet.tsx`, `sheet-exit.ts`,
`dashboard-payments.tsx` và `dashboard-payment-drawer.tsx`.

Lint, typecheck, **121 unit test** và root build đạt. Targeted + Evon probe **6/6 đạt, 7,0 phút**;
E2E toàn dự án **84 đạt, 18 bỏ qua, 0 lỗi, 19.2 phút**, retries 0. Assertions, timeout, retry và
skip hiện hữu không đổi. Lượt full đầu có một lỗi C78 do selector KPI trùng skeleton/nội dung;
đã sửa selector runtime rồi chạy lại đầy đủ. pgTAP/Auth riêng không áp dụng vì schema, RPC và
Auth contract không đổi; các luồng tài chính/Auth vẫn được kiểm trong E2E đầy đủ.

Mỗi lượt targeted/full có 55 quan sát: 36 route, 4 cold Auth/font, 12 lượt đọc drawer 2s/10s và
các tình huống lỗi/retry/date/abort/gesture/pending. CLS từ fallback đã painted đến hai frame
sau content/font sẵn sàng cao nhất **0.032092**, dưới 0,1; bounding box drawer giữ nguyên.
Phép đo liên tục bổ sung **3/3 đạt (5.4 phút), 53 quan sát**, bắt đầu trước navigation/action
hoặc từ init script cold document đến hai frame sau nội dung/font sẵn sàng. CLS cao nhất toàn
cửa sổ route **0.021980**, Auth/drawer **0.032092**. Entry `hadRecentInput` và nguồn shift được lưu
riêng. Đây là phép đo trên Chrome production local và dữ liệu giả, không phải zero CLS toàn app
hoặc cam kết latency Production. Hai fixture trước/sau khác số khoản, nên ảnh dùng để so cấu
trúc; không chứng minh pixel equivalence toàn trang.

[Trang đối chiếu](comparison.html) có 28 ảnh và 4 video tốc độ thật/chậm 4×. Evon original chạy
7 khổ × Light/Dark; raw P1 về cuộn sau chuẩn bị/Tab exploration được giữ. Lượt kiểm thật tại
375×900 có scroll ban đầu và sau clear/focus bằng 0; form body cuộn là hành vi có chủ ý. Focus,
native picker và các warning mật độ có disposition theo C92. Video ghi 25fps; encoder đổi khổ
375 thành 374px, cao 812px. Giới hạn thiết bị vật lý/60fps/AT vẫn được ghi rõ.

Bảo toàn **1235 file tracked trước, 10 file cũ đổi trong phạm vi,
1225 file cũ nguyên hash**, 153 file source web được freeze, 73 file schema/actions/
validation/domain không đổi. 17 artifact C75 giữ exact hash; 15 file do test sinh đã trả
về baseline. C20-test đúng label/cổng 55322 và sáu bảng rỗng sau teardown; main DB 54322 không
được dùng. Diff, artifact và scoped gitleaks 8.30.1 redacted đạt, 0 findings.

Chưa push/deploy C92–C97; runtime Preview/Production vẫn C91. Điện thoại/softkeyboard thật,
AT, authenticated Safari/Firefox, native zoom/clipboard, OS theme live, PWA trước HTML và remote
save chưa kiểm. C91 `query_canceled` 57014 vẫn chưa rõ nguyên nhân. Dừng tại C98 theo AGENTS §3.

Bằng chứng chi tiết: [implementation](implementation.md), [budget](budget.json),
[baseline](baseline-evidence.json), [targeted](targeted-evidence.json), [full E2E](full-e2e-evidence.json),
[window liên tục](window-evidence.json), [probe](probe-summary.json),
[lịch sử](verification-history.md), [validation](validation.json), [source](runtime-source-manifest.json),
[ảnh](screenshot-manifest.json), [video](video-manifest.json), [preservation](preservation.json).
