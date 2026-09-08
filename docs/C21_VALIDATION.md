# C21 — Bằng chứng hiệu năng và Preview candidate

Ngày kiểm chứng: 2026-09-08. Trạng thái: `COMPLETED`.

## 1. Tối ưu danh sách khoản vay

- Migration `20260908090000_c21_fast_loan_pagination.sql` suy ra status và dư nợ gốc theo tập hợp,
  sau đó chỉ gọi engine tính lãi authoritative cho 25 khoản thuộc trang đang xem.
- Không thêm cache hay bảng tổng hợp; dữ liệu sau mutation được đọc trực tiếp nên không có rủi ro
  stale/invalidation. Engine tiền/lãi vẫn nằm hoàn toàn trong PostgreSQL.
- Fixture cô lập: 1.000 khoản vay dài hạn, 1.000 giao dịch giải ngân và 12.000 giao dịch trả lãi.
- C20 trước tối ưu (lượt tham chiếu cùng ngày): 12.357,842 ms; 10.393.114 bytes; 1.000 cards.
- C21 sau warm-up, 7 lượt: `99,718–104,726 ms`, median `102,456 ms`, worst `104,726 ms`;
  payload cố định `24.060 bytes`, 25 cards, tổng 1.000. Đạt các ngưỡng 2.000/3.000 ms và 50 KB.
- Query plan của helper set-wise: 1.000 facts trong `2,225 ms`; top-N sort dùng 28 KB.
- pgTAP C21 đối chiếu helper với `public.calculate_loan` cho bigint, principal payment, rate change,
  ACTIVE/OVERDUE/BAD_DEBT/resume/SETTLED, filter và sort.

## 2. Gate đã đạt

- `git diff --check`: đạt.
- lint, typecheck: đạt.
- unit/script: 70/70; web unit 23/23.
- build production: đạt.
- Auth integration: 6/6.
- Playwright production build local: 21/21; bao gồm đo điều hướng list → detail và xác nhận phản
  hồi chờ có `aria-live` khi request cố ý chậm 500 ms.
- Supabase DB lint: sạch.
- pgTAP: 431/431 trên `QuanLyVayCaNhan-C20-test`; 28 migration local.
- Hậu kiểm cuối: CLI profile toàn cục lỗi `Unsupported Config Type`; đã áp bốn migration còn thiếu
  vào container local và chạy trực tiếp toàn bộ pgTAP, không có assertion `not ok`.

## 3. Preview candidate

- Project: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F` / `quan-ly-vay-ca-nhan`.
- Deployment: `dpl_C75aW28nYqMhM8x4owLtJFtAUEyw`.
- Immutable URL:
  `https://quan-ly-vay-ca-nhan-8kd5p2f6z-ngotuong2105.vercel.app`.
- Target/status/region: Preview / Ready / Functions `sin1`.
- Public smoke: `/login` 200, manifest 200, hai API bảo vệ trả 401 đúng contract.
- Public/authenticated smoke đạt trên immutable URL và `https://tindung-preview.vercel.app`.
- Console không có lỗi ngoài mất mạng được chủ động tạo; Vercel error log bằng 0. Alias đã chuyển.

## 4. QA giao dịch và mobile

- Tài khoản EDITOR tạm được tạo qua endpoint chỉ có ở candidate tạm; endpoint đã xóa trước stable build.
- Đã tạo dữ liệu `C21 TEST ONLY`, ghi rồi đảo principal payment và ghi nợ xấu; không xóa lịch sử.
  Tài khoản đã deactivate/ban và đăng nhập lại bị từ chối.
- iPhone Safari-like 390×844 và Android Chrome-like 412×915 đạt 11 route, touch target tối thiểu
  44px, zoom 200%, dark/light, portrait/landscape, offline/online, manifest, service worker và login/logout.
  Stable list→detail lần lượt 871 ms và 837 ms.
- Giới hạn: đây là Chromium mô phỏng viewport/user-agent/touch, không phải WebKit/phần cứng thật.

## 5. Tương thích rollout

- Preview Supabase chưa nhận migration C20/C21 vì remote migration ngoài phạm vi. Chỉ khi RPC trả
  `PGRST202`, web dùng RPC authoritative cũ cho khoản vay và RLS rows cho chi phí; lỗi khác fail closed.
- Fallback giữ bigint VND, reversal, filter/sort DB và phân trang 25.
