# Bàn giao — C91 hoàn tất, C92 chờ duyệt

C91 đã phát hành bản sửa VND/tab C90 trên Preview, Production và alias mặc định.
C92 `AWAITING_APPROVAL`; C93–C98 `NOT_STARTED`. Không tự bắt đầu checkpoint kế tiếp.
Repository chuẩn: `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`.

Phiên mới đọc đầy đủ AGENTS.md, PROJECT_CONTEXT.md, roadmap C92 (section50), rồi kiểm
`git status --short --branch` và xác nhận phê duyệt của OWNER trong hội thoại hiện tại.

Runtime source `ed72b8615e19f2a3e6667014c86da4ac920ed1ba`, CI37644195261 thành công cả5job.
Closing proof `839d34b348e7dd435688365435cc0336bfcb4eb0`, [CI](https://github.com/ngotuong/quanlyvay/actions/runs/37803762628) thành công cả5job. Commit trạng thái cuối chỉ tài liệu;
phải kiểm exactSHA CI trước thông báo hoàn tất, SHA/run cuối ghi trong hội thoại.
C87 harness race đã tái hiện và sửa, fullE2E64/18 và targeted3/3 đạt; không đổi runtime.

Bằng chứng C91 ở `docs/release-c91/`; giữ nguyên lỗi cũ, giới hạn remote/device và rủi ro
Dashboard query_canceled57014 đã hồi phục nhưng chưa xác định nguyên nhân database.
Giữ C88 rollback; không cleanup. Không dùng tài liệu lịch sử làm quyền thao tác mới.
C92 chỉ chốt thiết kế trước sửa G1–G4; giữ B/Inter/KPI trước task, VND integer/privacy/lifecycle.
Không thay dữ liệu thật, account, schema/RPC/secrets, Google hoặc backup ngoài scope được duyệt.
