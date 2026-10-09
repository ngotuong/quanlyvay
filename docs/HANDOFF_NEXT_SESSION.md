# Bàn giao — C92 hoàn tất, C93 chờ phê duyệt

C91 đã phát hành; C92 `COMPLETED` ngày09/10/2026. OWNER chọn **A** và yêu cầu nhập nhanh
50tr/100tr/150tr/…; nhóm chốt **+50tr/+100tr/+150tr/+200tr**, cộng dồn/chặn vượt giới hạn
context; không autosubmit. Chỉ docs/static thay đổi, chưa runtime/deploy.
C93 `AWAITING_APPROVAL`; C94–C98 `NOT_STARTED`. Không tự bắt đầu checkpoint tiếp theo.

Đọc đầy đủ AGENTS.md/PROJECT_CONTEXT.md, roadmapC93(section50), rồi gitstatus và xác nhận
OWNER phê duyệt C93 trong hội thoại hiện tại. C93 refactor giữ hình runtime hiện tại;
A taskfullwidth/cashflowbelow thuộc C94, chip50triệu C95, drawerA C96; không đổi hình sớm.
Repository chuẩn: `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`.

Đặc tả docs/design-c92/selected-design.md; brief/report/evidence/baseline/prototype-qa/contrast
cùng thư mục. Mẫu bền docs/design-c92/reference/,9ảnhA screenshots/. Logs/helpers/lượt lỗi giữ
ignored.cache/c92, khôngcleanup. Serverreview127.0.0.1:3192 hiện phục vụ.cache/c92/wireframes;
khi tắt chạy `python3 -m http.server 3192 --bind 127.0.0.1 --directory docs/design-c92/reference`
từ root. URL mẫu A: /index.html?v=a&mau=mau&kho=mobile&theme=light&scene=drawer&kind=principal&tt=empty.

Baseline32samples/16journeys/test1PASS1.6m;50triệu Tiền gốc8phím số ở375/1280×900 LightDark.
Prototype110samples0fail/keyboard2PASS/labelchips4PASS; contrasttext≥4.746/control≥3.860;
EvonArawP0, BrawP1 giữ lịch sử, B không được chọn. Preservation1063files/DBsixcounts0/secret/diffPASS.
AT/mobile thật/SafariFirefox/remote states NOT_TESTED; mock không có phép cộng/API submit.
C95 thay tiêu chí10triệu/≤2chips bằng50triệu/1chip theo OWNER;10triệu vẫn gõ/paste.

Runtime source `ed72b8615e19f2a3e6667014c86da4ac920ed1ba`, CI37644195261 thành công cả5job.
Closing proof `839d34b348e7dd435688365435cc0336bfcb4eb0`, [CI](https://github.com/ngotuong/quanlyvay/actions/runs/37803762628) thành công cả5job. Commit trạng thái cuối chỉ tài liệu;
phải kiểm exactSHA CI trước thông báo hoàn tất, SHA/run cuối ghi trong hội thoại.
C87 harness race đã tái hiện và sửa, fullE2E64/18 và targeted3/3 đạt; không đổi runtime.

Bằng chứng C91 ở `docs/release-c91/`; giữ nguyên lỗi cũ, giới hạn remote/device và rủi ro
Dashboard query_canceled57014 đã hồi phục nhưng chưa xác định nguyên nhân database.
Giữ C88 rollback; không cleanup. Không dùng tài liệu lịch sử làm quyền thao tác mới.
C92 đã chốt A trước sửa G1–G4; giữ B/Inter/KPI trước task, VND integer/privacy/lifecycle.
Không thay dữ liệu thật, account, schema/RPC/secrets, Google hoặc backup ngoài scope được duyệt.
