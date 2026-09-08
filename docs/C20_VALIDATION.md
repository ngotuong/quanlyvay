# C20 — Hồ sơ nghiệm thu local

Trạng thái: **COMPLETED LOCAL** ngày 2026-09-08. Chưa rollout remote.
Môi trường: dữ liệu giả trên `QuanLyVayCaNhan-C20-test`, API `127.0.0.1:55321`,
Next production build local tại `127.0.0.1:3101`. Không dùng dữ liệu/tài khoản thật.

## 1. Đối chiếu phạm vi

| Phát hiện | Thay đổi / bằng chứng regression | Trạng thái nghiệm thu |
|---|---|---|
| F01/F03 | Xóa `vietqr-modal.tsx` và CTA tạo/sao chép phiếu; giữ ghi nhận thanh toán | Đạt — loại bỏ chức năng theo yêu cầu |
| F02 | Privacy cookie SSR, che tiền và vùng text nhạy cảm; E2E 11 route, reload, accessibility và không JavaScript | Đạt |
| F04 | `/account` cho cả ba vai trò; quản trị vẫn OWNER; E2E mobile đổi mật khẩu/đăng xuất | Đạt |
| F05 | `--on-primary`, `--on-danger`; đo computed color light/dark, normal/hover/focus | Đạt |
| F06/F07 | RPC tổng/phân bổ chi phí toàn bộ scope; text money/rate; trên 1.000 bản ghi, reversal khác trang, bigint `9007199254740993` | Đạt |
| F08 | Field errors liên kết input, focus, giữ giá trị, pending; VND caret/paste; tạo nhanh đối tác; GET-only recovery khi RSC không commit | Đạt |
| F09 | Xóa đối tác giả có phản hồi; từ chối đối tác có khoản vay | Đạt |
| F10 | GET preview có Auth; RPC khóa khoản vay và so sánh xác nhận; stale trả `PT409` | Đạt |
| F11 | Phân trang 25, lọc unread, badge toàn scope; unread cũ ngoài 100 mục | Đạt |
| F12 | Lỗi DB khác not-found; retry tiếng Việt, no raw error, network banner, export fail-closed | Đạt |
| List RPC | Server pagination, sort ổn định, không trả periods trong cards; benchmark mục 3 | Đã đo local; còn chi phí tính toàn scope |
| Export đồng thời | Một SQL STABLE snapshot cho 11 dataset, hash cursor, service-role only; concurrent mutations và lỗi RPC | Đạt |
| Apps Script | Chung script lock sync/snapshot/restore; snapshot chỉ sau sync hoàn chỉnh; LAST_SYNC_AT không tiến khi lỗi | Mock tests đạt; không gọi Google thật |
| Push worker | Concurrency 5, timeout gửi 5 giây, budget 40 giây, batch hữu hạn, retry complete và queue flag | Unit tests đạt; không gửi Web Push thật |

## 2. Gate và QA

- Gate cuối: lint đạt; typecheck đạt; unit/script **66/66**; Auth **6/6**;
  E2E production build local **20/20**; DB lint sạch; pgTAP **414/414**; build đạt;
  `git diff --check` sạch.
- Trước fallback, E2E từng đạt 20/20 rồi 19/20 do RSC trả trạng thái mới nhưng DOM không commit.
  Sau revision acknowledgement/fallback GET-only, full E2E đạt 20/20; unit xác nhận fallback
  không reload khi render đã commit hoặc URL đã đổi, và không gửi lại mutation.
- Ma trận layout tự động: 13 route × light/dark × 375/768/1024/1440 = **104** cấu hình;
  chụp 52 ảnh tại 375/1440, thêm landscape/text zoom 200% và viewport cao 375 mô phỏng bàn phím.
  Kết quả/ảnh mỗi lượt nằm ở `apps/web/test-results/`; đây là output tái tạo, bị thay khi chạy lại.
- Đã xem lại ảnh login mobile, dashboard desktop, khoản vay mobile và viewport thấp. Viewport
  Chrome không chứng minh iOS, bàn phím hệ điều hành
  hoặc PWA cài thật đã đạt. Những thiết bị này chưa được kiểm tra.
- Audit trước sửa (`AUDIT_2026-09-06.md`) có mô tả và số đo, không có bộ ảnh giả trước sửa
  được lưu. Không gán ảnh sau sửa thành ảnh baseline.

## 3. Benchmark danh sách khoản vay

Script: `scripts/c20-loan-benchmark.sql`, dữ liệu giả trong transaction rollback:
1.000 khoản, giải ngân 2025-01-01, gốc 100 triệu, lãi ngày 0,1%, không đáo hạn,
12.000 giao dịch trả lãi; ngày tính 2026-09-07. Không đo trên Production.

| Chỉ số | RPC cũ | RPC phân trang |
|---|---:|---:|
| Thời gian SQL | 15.003,158 ms | 7.240,478 ms |
| JSON payload | 10.393.114 bytes | 24.060 bytes |
| Cards trả về | 1.000 | 25 |
| Tổng đếm | 1.000 | 1.000 |

Payload giảm 99,77%; thời gian lần đo giảm 51,7%. RPC vẫn tính các khoản trong scope lọc
để có số liệu authoritative, nên 7,24 giây ở fixture này vẫn là hạn chế quy mô, không phải
cam kết latency Production. Không thêm cache tiền hoặc thay công thức để làm đẹp benchmark.

## 4. Rollout đề xuất — chưa được thực thi/phê duyệt

1. Nghiệm thu local đầy đủ; kiểm chứng backup/restore trước thay đổi remote.
2. Áp ba migration C20 mới theo thứ tự timestamp; không sửa migration lịch sử.
3. Deploy Preview từ repository root bằng `pnpm deploy:preview`, theo runbook:
   full gate, immutable URL, target preview, đúng project, sin1, Auth/runtime smoke;
   chỉ chuyển alias sau khi đạt và hậu kiểm lại.
4. Production cần phê duyệt riêng và kiểm chứng dữ liệu/role/money/settlement/export sau rollout.
5. Build và cập nhật Apps Script trong cửa sổ rollout được duyệt; chạy full sync rồi mới
   snapshot; kiểm chứng LAST_SYNC_AT/cursor/hash và sheet đối chiếu. Không tạo trigger ngoài scope.

Ba migration: `20260907070000_c20_queries_and_settlement.sql`,
`20260907071000_c20_loan_pagination.sql`, `20260907072000_c20_consistent_export.sql`.
Export giữ schemaVersion 3 và tên dataset; cursor mới là hash snapshot, client cũ sẽ full sync
khi cursor thay đổi. Không suy ra tính tương thích chỉ từ build: cần smoke client khi rollout.

Rollback web/alias về deployment tốt trước đó theo runbook; ưu tiên giữ RPC additive trong DB.
Không drop lịch sử tài chính hoặc migration đang có dữ liệu để rollback UI. Nếu rollback Apps
Script, chỉ dùng snapshot hoàn chỉnh đã kiểm chứng; không snapshot workbook sync dở.
