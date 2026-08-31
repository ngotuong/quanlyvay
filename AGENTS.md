# Quy tắc làm việc cho Agents

Tệp này áp dụng cho toàn bộ repository `QuanLyVayCaNhan`. Đây là tài liệu quy tắc ổn định; trạng thái hiện tại của dự án nằm trong `PROJECT_CONTEXT.md`.

## 1. Quy trình bắt đầu phiên làm việc

Trước khi phân tích hoặc thay đổi dự án, agent phải:

1. Đọc toàn bộ `AGENTS.md`.
2. Đọc toàn bộ `PROJECT_CONTEXT.md`.
3. Đọc checkpoint liên quan trong `docs/IMPLEMENTATION_PLAN.md`.
4. Chạy `git status --short --branch`.
5. Xác nhận checkpoint hiện tại đã được người dùng phê duyệt trong hội thoại hiện tại.

Không suy ra checkpoint hiện tại từ README, lịch sử trò chuyện cũ hoặc commit message nếu khác với `PROJECT_CONTEXT.md`.

## 2. Thứ tự nguồn sự thật

Khi có mâu thuẫn, áp dụng theo thứ tự:

1. Chỉ dẫn trực tiếp mới nhất của người dùng.
2. `AGENTS.md`.
3. `PROJECT_CONTEXT.md` đối với trạng thái hiện tại.
4. `docs/IMPLEMENTATION_PLAN.md` đối với phạm vi và acceptance criteria.
5. Tài liệu kỹ thuật chuyên biệt và code hiện tại.

Nếu mâu thuẫn ảnh hưởng dữ liệu, tài khoản hoặc kiến trúc, dừng và hỏi người dùng.

## 3. Checkpoint và cổng phê duyệt

Trạng thái hợp lệ: `NOT_STARTED`, `AWAITING_APPROVAL`, `APPROVED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`.

- Chỉ thực hiện checkpoint có trạng thái `APPROVED` hoặc được người dùng phê duyệt rõ trong hội thoại hiện tại.
- Khi bắt đầu, đổi checkpoint thành `IN_PROGRESS` trong roadmap và context.
- Chỉ đổi thành `COMPLETED` sau khi đạt acceptance criteria và test gate.
- Sau khi hoàn tất, đặt checkpoint kế tiếp thành `AWAITING_APPROVAL` rồi dừng.
- Không tự chuyển sang checkpoint kế tiếp, kể cả khi đó là bước local an toàn.
- Nếu phạm vi phát sinh ngoài checkpoint, ghi nhận đề xuất; không âm thầm triển khai.
- Cập nhật `PROJECT_CONTEXT.md` và bảng roadmap trong cùng thay đổi khi chuyển trạng thái.

## 4. Phê duyệt checkpoint và thao tác bên ngoài

Khi người dùng đã phê duyệt rõ một checkpoint, agent chủ động thực hiện đầy đủ các bước local và
remote được nêu trong phạm vi/acceptance criteria của checkpoint đó mà không xin lại từng thao tác.
Chỉ dừng giữa checkpoint khi:

- người dùng phải tự đăng nhập, giải CAPTCHA hoặc thực hiện bước mà công cụ không được phép làm;
- chính sách an toàn của công cụ bắt buộc xác nhận tại thời điểm thao tác;
- xuất hiện sai lệch dữ liệu, thay đổi kiến trúc hoặc thao tác phá hủy ngoài phạm vi đã duyệt;
- cần mở rộng sang checkpoint khác.

Nếu checkpoint chưa được duyệt hoặc thao tác không nằm rõ trong phạm vi đã duyệt, các thao tác sau
vẫn cần người dùng xác nhận riêng:

- Đăng nhập hoặc đăng xuất Google, Supabase, Vercel, `clasp` hay dịch vụ khác.
- Tạo, liên kết, đổi tên hoặc xóa project/tài nguyên remote.
- Chạy migration trên database remote hoặc thay đổi remote secrets.
- Chạy `clasp create`, `clasp push`, `clasp deploy` hoặc tạo trigger.
- Tạo/sửa Google Sheet, thư mục Drive hoặc Apps Script project.
- Deploy Preview/Production, promote, rollback, gán domain hoặc alias.
- Tạo Git remote, `git push`, mở PR hoặc thay đổi repository bên ngoài.

Các lệnh chỉ đọc như kiểm tra phiên bản CLI không được xem là phê duyệt thao tác tài khoản. Khi
checkpoint hoàn tất, cập nhật trạng thái, báo kết quả và dừng để người dùng duyệt checkpoint tiếp
theo; không tự chuyển checkpoint.

### 4.1. Quy trình bắt buộc cho Vercel Preview

- Mọi Preview của project này phải chạy từ repository root bằng `pnpm deploy:preview`; không chạy
  `vercel deploy` trực tiếp từ `apps/web` và không gán `tindung-preview.vercel.app` bằng tay trong
  luồng thông thường.
- Trước khi tạo candidate phải đạt `git diff --check`, lint, typecheck, unit tests, build và E2E.
- Candidate phải dùng `--target=preview`, đúng project ID `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`,
  `Ready`, Functions `sin1` và đạt smoke trên URL deployment bất biến.
- Chỉ chuyển stable alias sau khi candidate đạt toàn bộ gate. Sau khi chuyển phải smoke lại alias và
  kiểm tra runtime error log; nếu hậu kiểm thất bại phải trả alias về deployment tốt trước đó.
- Trạng thái Vercel `Ready` hoặc build thành công không thay thế E2E/runtime smoke. Route có Auth hoặc
  Server Component đã đổi phải được truy cập thật trong E2E hoặc authenticated browser smoke.
- Ghi deployment ID, immutable URL, alias, target, region và kết quả từng smoke vào
  `PROJECT_CONTEXT.md`. Chi tiết vận hành nằm trong `docs/VERCEL_PREVIEW_RUNBOOK.md`.

## 5. Ranh giới repository và an toàn

- Chỉ đọc/ghi trong `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`, trừ khi người dùng chỉ định rõ tài nguyên khác.
- Không sửa các dự án anh em trong `/Users/ngotuong/AppsScript`.
- Không chạy lệnh xóa, reset hoặc ghi đè diện rộng khi chưa xác minh đích.
- Bảo toàn thay đổi sẵn có của người dùng; không hoàn nguyên thay đổi không thuộc checkpoint.
- Không commit token, mật khẩu, cookie, service-role key, `.clasp.json`, `.env.local` hoặc dữ liệu tài chính thật.
- Chỉ tạo `.env.example` với tên biến và giá trị giả an toàn.

## 6. Bất biến kiến trúc và dữ liệu

- Supabase PostgreSQL là nguồn dữ liệu chuẩn.
- Google Sheets chỉ nhận đồng bộ một chiều để đối chiếu; không ghi ngược vào Supabase.
- Next.js chỉ mutate dữ liệu qua Server Actions/RPC được validate.
- Nghiệp vụ tính lãi authoritative nằm trong Supabase; frontend không tự quyết toán tiền.
- Mọi thay đổi schema phải qua migration; không chỉnh production trực tiếp.
- Giao dịch tài chính không xóa vật lý; sửa sai bằng giao dịch đảo và audit log.
- Tiền VND lưu bằng số nguyên; lãi suất dùng decimal; không dùng floating-point JavaScript để quyết toán.
- Ngày nghiệp vụ dùng `date` theo `Asia/Ho_Chi_Minh`; thời điểm audit lưu UTC.
- Web Push và đồng bộ phải có idempotency key.
- Secret chỉ tồn tại trong kho secret của môi trường tương ứng.

## 7. Kiểm thử và hoàn tất công việc

Chỉ chạy các gate đã tồn tại và áp dụng cho checkpoint:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
supabase test db
```

Trước khi báo hoàn tất:

1. Chạy test gate phù hợp và ghi kết quả vào `PROJECT_CONTEXT.md`.
2. Kiểm tra `git diff --check` và `git status --short`.
3. Cập nhật checkpoint, last completed, next checkpoint, blocker và recent changes.
4. Có thể tạo một local commit `Cxx: mô tả` khi checkpoint đã hoàn tất.
5. Báo bằng tiếng Việt: phạm vi đã làm, file chính đã đổi, kiểm thử, rủi ro và checkpoint chờ duyệt.

Không tuyên bố hoàn tất nếu test bắt buộc chưa chạy hoặc chưa đạt.
