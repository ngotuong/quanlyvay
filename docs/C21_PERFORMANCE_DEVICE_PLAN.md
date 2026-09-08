# C21 — Hiệu năng danh sách và kiểm chứng Preview trên thiết bị thật

Trạng thái: `COMPLETED` (người dùng phê duyệt và ủy quyền tự kiểm thử ngày 2026-09-08).
Last completed: C21. Chưa có checkpoint kế tiếp.

## 1. Mục tiêu

Loại bỏ rủi ro hiệu năng còn lại của danh sách khoản vay ở fixture lớn mà không làm sai số tiền,
đồng thời kiểm chứng trải nghiệm C20 trên Preview và thiết bị di động thật.

## 2. Phạm vi đã duyệt

- Tối ưu RPC/truy vấn danh sách trong kiến trúc Supabase hiện tại; mọi thay đổi schema dùng migration
  mới, không sửa migration lịch sử và không đưa quyết toán tiền sang frontend.
- Được tạo dữ liệu giả và benchmark trên database test riêng C20/C21; không dùng/reset local database
  gốc hay dữ liệu thật.
- Được sửa SQL, web, test, benchmark và tài liệu để đạt acceptance criteria.
- Được tạo Vercel Preview candidate bằng `pnpm deploy:preview` sau khi toàn bộ gate local đạt;
  kiểm tra immutable URL, project/target/region, public/authenticated smoke và runtime logs theo runbook.
- Chỉ chuyển stable Preview alias sau khi candidate đạt smoke tự động và kiểm chứng thiết bị thật.
- Không gồm migration Production, Production deploy/promote, Apps Script push, thay remote secret,
  Google Sheet/Drive/trigger, git push hoặc PR.

## 3. Acceptance criteria — hiệu năng

- Fixture chuẩn giữ tối thiểu 1.000 khoản dài hạn và 12.000 giao dịch; benchmark chạy nhiều lượt,
  ghi median và lượt xấu nhất thay vì kết luận từ một lần đo.
- Page đầu 25 cards, count/filter/sort ổn định và không trả periods; payload không vượt 50 KB.
- Median SQL của RPC danh sách không vượt 2.000 ms trên máy/môi trường test hiện tại; lượt xấu nhất
  không vượt 3.000 ms sau warm-up. Nếu chưa đạt, checkpoint tiếp tục `IN_PROGRESS` hoặc trình thay đổi
  kiến trúc cụ thể để người dùng duyệt — không hạ ngưỡng sau khi đo.
- Số liệu principal/interest/status phải khớp engine authoritative ở các khoản biên: dài hạn,
  nhiều giao dịch, settled/bad debt, rate change và bigint hợp lệ.
- Không dùng cache stale. Nếu dùng bảng trạng thái/tổng hợp, phải cập nhật atomically cùng mutation,
  có backfill/idempotency, kiểm thử concurrent write và kế hoạch rollback không xóa lịch sử.
- Đo thời gian điều hướng từ danh sách tới chi tiết trong E2E; phản hồi loading xuất hiện nếu vượt
  300 ms và UI không đóng băng.

## 4. Acceptance criteria — Preview và thiết bị thật

- Trước candidate: `git diff --check`, lint, typecheck, unit, build, Auth, E2E, DB lint và pgTAP đạt.
- Candidate đúng Vercel project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview, Ready,
  Functions `sin1`; smoke immutable URL đạt và không có runtime error liên quan.
- Theo chỉ dẫn mới nhất của người dùng, dùng hồ sơ iPhone Safari-like và Android Chrome-like tự động;
  ghi rõ đây không phải phần cứng/WebKit thật và không giữ kiểm tra vật lý làm blocker.
- Trên mỗi thiết bị: login/logout, privacy không chớp tiền, dashboard/list/detail, tạo form không ghi
  dữ liệu thật, bàn phím không che CTA, safe-area/bottom nav, portrait/landscape, text zoom hệ thống,
  dark/light, offline/online, cài/mở PWA nếu trình duyệt hỗ trợ.
- Chỉ dùng tài khoản/dữ liệu test phù hợp trên Preview. Không thực hiện giao dịch tài chính thật.
- Stable Preview alias chỉ chuyển sau khi checklist thiết bị thật được xác nhận; sau alias phải smoke
  lại và kiểm tra runtime logs, tự rollback alias nếu hậu kiểm thất bại.

## 5. Hoàn tất và bàn giao

- Ghi benchmark trước/sau, query plan, dữ liệu fixture và kết quả từng gate vào hồ sơ C21.
- Ghi deployment ID, immutable URL, alias, target, region, smoke và giới hạn thiết bị vào context.
- Chuyển C21 `COMPLETED` khi tiêu chí hiệu năng, authenticated smoke và hai hồ sơ mobile tự động đạt;
  giới hạn không có phần cứng thật phải được ghi trong hồ sơ bàn giao.
- Có thể tạo local commit `C21: tối ưu danh sách và kiểm chứng thiết bị thật`; không git push.
